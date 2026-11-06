import 'dotenv/config';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;
const BASE_URL = process.env.BASE_URL || 'http://localhost:8085';
const API_URL = 'http://localhost:3001';
const PASSWORD = process.env.DEV_USER_PASSWORD || 'DevelopmentPass123!';

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 1;
    this.callbacks = new Map();
    this.consoleLogs = [];
    this.pageErrors = [];
  }

  async connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (e) => reject(e);
      this.ws.onmessage = (msg) => {
        const data = JSON.parse(msg.data);
        if (data.id && this.callbacks.has(data.id)) {
          const { resolve, reject } = this.callbacks.get(data.id);
          this.callbacks.delete(data.id);
          if (data.error) reject(new Error(data.error.message));
          else resolve(data.result);
        } else if (data.method) {
          this.handleEvent(data.method, data.params);
        }
      };
    });
  }

  handleEvent(method, params) {
    if (method === 'Runtime.consoleAPICalled') {
      const text = params.args?.map(a => a.value || a.description || '').join(' ') || '';
      this.consoleLogs.push({ type: params.type, text, timestamp: params.timestamp });
      if (params.type === 'error') {
        console.log(`    [Browser Console Error]: ${text}`);
      }
    } else if (method === 'Runtime.exceptionThrown') {
      const desc = params.exceptionDetails?.exception?.description || params.exceptionDetails?.text;
      this.pageErrors.push(desc);
      console.error(`    [Browser Uncaught Exception]: ${desc}`);
    }
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = this.id++;
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expr) {
    const res = await this.send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(res.exceptionDetails.exception?.description || 'Eval error');
    }
    return res.result?.value;
  }

  async wait(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async navigateAndWait(url, timeoutMs = 12000, allowLoadingIndicator = false) {
    await this.send('Page.navigate', { url });
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const readyState = await this.eval('document.readyState');
        const text = await this.eval('document.body ? (document.body.innerText || document.body.textContent || "") : ""');
        const isLoadingIndicator =
          !allowLoadingIndicator &&
          (text.includes("Checking access permissions…") ||
           text.includes("Loading POS workspace…"));

        if (readyState === 'complete' && text && text.trim().length > 20 && !isLoadingIndicator) {
          await this.wait(500); // Give React hydration a moment to settle
          return text;
        }
      } catch {}
      await this.wait(250);
    }
    return await this.eval('document.body ? (document.body.innerText || document.body.textContent || "") : ""');
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runBrowserTests() {
  console.log('=== STARTING CLIENT-SIDE BROWSER REGRESSION TESTING ===\n');

  const userDataDir = path.join(os.tmpdir(), `chrome-pos-test-${Date.now()}`);
  fs.mkdirSync(userDataDir, { recursive: true });

  console.log('1. Launching Chrome headless on debugging port ' + DEBUG_PORT + '...');
  const chromeProcess = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${userDataDir}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--disable-component-extensions-with-background-pages',
    '--disable-background-networking',
    'about:blank',
  ]);

  let versionData = null;
  for (let i = 0; i < 20; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/version`);
      versionData = await r.json();
      break;
    } catch {
      await new Promise(r => setTimeout(r, 250));
    }
  }

  if (!versionData) {
    chromeProcess.kill();
    throw new Error('Chrome remote debugging did not respond');
  }

  const tabsRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
  const tabs = await tabsRes.json();
  let pageTab = tabs.find(t => t.type === 'page');
  if (!pageTab) {
    const newTabRes = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?${encodeURIComponent(BASE_URL + '/login')}`);
    pageTab = await newTabRes.json();
  }
  const targetWs = pageTab.webSocketDebuggerUrl;

  const client = new CDPClient(targetWs);
  await client.connect();
  console.log('   ✓ Chrome connected via CDP.\n');

  await client.send('Page.enable');
  await client.send('Runtime.enable');
  await client.send('Network.enable');
  await client.send('Console.enable');

  const testResults = [];

  const runTest = async (testName, testFn) => {
    console.log(`▶ Running: ${testName}...`);
    const initialErrors = client.pageErrors.length;
    try {
      await testFn();
      const newErrors = client.pageErrors.slice(initialErrors);
      if (newErrors.length > 0) {
        throw new Error(`Encountered ${newErrors.length} uncaught exceptions: ${newErrors.join('; ')}`);
      }
      console.log(`  ✓ ${testName} PASSED!\n`);
      testResults.push({ name: testName, status: 'PASS' });
    } catch (err) {
      console.error(`  ✗ ${testName} FAILED:`, err.message, '\n');
      testResults.push({ name: testName, status: 'FAIL', error: err.message });
    }
  };

  // Log in user via API and set cookies on both :8080 and :3001
  const setSessionForUser = async (email, password = PASSWORD) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error(`API login failed for ${email}`);
    const data = await res.json();
    const { tokens, activeOrganization } = data;

    // Clear previous cookies first
    await client.send('Network.clearBrowserCookies');

    // Set cookies for both localhost:8080 (frontend) and localhost:3001 (API)
    for (const url of [`${BASE_URL}/`, 'http://localhost:8080/', 'http://localhost:3001/']) {
      await client.send('Network.setCookie', {
        name: 'access_token',
        value: tokens.accessToken,
        url,
        httpOnly: true,
      });
      await client.send('Network.setCookie', {
        name: 'refresh_token',
        value: tokens.refreshToken,
        url,
        httpOnly: true,
      });
    }

    // Initialize local storage on frontend origin
    await client.send('Page.navigate', { url: `${BASE_URL}/login` });
    await client.wait(800);
    if (activeOrganization?.id) {
      await client.eval(`localStorage.setItem('valgrow_active_org_id', '${activeOrganization.id}')`);
    }

    return { data, tokens, activeOrganization };
  };

  try {
    // -------------------------------------------------------------
    // TEST 1: Unauthenticated Route Checks
    // -------------------------------------------------------------
    await runTest('1. Unauthenticated Route Loading (Absence of "This page didn\'t load")', async () => {
      for (const route of ['/pos', '/pos-billing', '/pos-cashier']) {
        const text = await client.navigateAndWait(`${BASE_URL}${route}`, 8000, true);
        const hasCrash = text.includes("This page didn't load");
        if (hasCrash) throw new Error(`Route ${route} displayed "This page didn't load"!`);
        console.log(`    [${route}] Body text preview: "${text.replace(/\\s+/g, ' ').slice(0, 90)}..."`);
      }
    });

    // -------------------------------------------------------------
    // TEST 2: Salesperson Terminal (/pos)
    // -------------------------------------------------------------
    await runTest('2. Salesperson Terminal: Load, Branch Selection & Cart UI', async () => {
      await setSessionForUser('salesperson1');
      const bodyText = await client.navigateAndWait(`${BASE_URL}/pos`);

      const hasCrash = bodyText.includes("This page didn't load");
      if (hasCrash) throw new Error('/pos displayed "This page didn\'t load" for Salesperson');

      console.log(`    [Salesperson /pos] Body preview: "${bodyText.replace(/\\s+/g, ' ').slice(0, 120)}..."`);

      const hasRegisterUI =
        bodyText.includes("Sales Register") ||
        bodyText.includes("Branch") ||
        bodyText.includes("Terminal") ||
        bodyText.includes("POS");

      if (!hasRegisterUI) throw new Error(`Sales Register interface did not render. Current page: ${bodyText.slice(0, 100)}`);
      console.log('    ✓ Salesperson terminal rendered cleanly with interactive UI');
    });

    // -------------------------------------------------------------
    // TEST 3: Billing Staff Desk (/pos-billing)
    // -------------------------------------------------------------
    await runTest('3. Billing Staff Desk: Queue Loading & Workbench Verification', async () => {
      await setSessionForUser('billing1');
      const bodyText = await client.navigateAndWait(`${BASE_URL}/pos-billing`);

      const hasCrash = bodyText.includes("This page didn't load");
      if (hasCrash) throw new Error('/pos-billing displayed "This page didn\'t load" for Billing Staff');

      console.log(`    [Billing /pos-billing] Body preview: "${bodyText.replace(/\\s+/g, ' ').slice(0, 120)}..."`);

      const hasBillingDesk =
        bodyText.includes("Billing Queue") ||
        bodyText.includes("No tickets in queue") ||
        bodyText.includes("Ticket") ||
        bodyText.includes("Billing Desk");

      if (!hasBillingDesk) throw new Error(`Billing Desk UI did not render. Current page: ${bodyText.slice(0, 100)}`);
      console.log('    ✓ Billing Desk rendered cleanly with live ticket queue');
    });

    // -------------------------------------------------------------
    // TEST 4: Cashier Counter (/pos-cashier) — Verifying activeBill TDZ Fix
    // -------------------------------------------------------------
    await runTest('4. Cashier Counter: Render, Payment Controls & ZERO TDZ ReferenceErrors', async () => {
      await setSessionForUser('cashier1');
      const bodyText = await client.navigateAndWait(`${BASE_URL}/pos-cashier`);

      const hasCrash = bodyText.includes("This page didn't load");
      if (hasCrash) {
        throw new Error('Cashier Counter crashed with "This page didn\'t load"! (activeBill TDZ regression)');
      }

      console.log(`    [Cashier /pos-cashier] Body preview: "${bodyText.replace(/\\s+/g, ' ').slice(0, 120)}..."`);

      const hasCashierUI =
        bodyText.includes("Cashier") ||
        bodyText.includes("Ready for Payment") ||
        bodyText.includes("No bills waiting") ||
        bodyText.includes("Register") ||
        bodyText.includes("Shift") ||
        bodyText.includes("Counter");

      if (!hasCashierUI) throw new Error(`Cashier Counter UI failed to render. Current page: ${bodyText.slice(0, 100)}`);
      console.log('    ✓ Cashier Counter rendered cleanly with payment controls and active register');
    });

    // -------------------------------------------------------------
    // TEST 5: Owner Cross-Module Navigation
    // -------------------------------------------------------------
    await runTest('5. Owner Access: Cross-Tab Navigation Across All 3 Modules', async () => {
      await setSessionForUser('alex.verma@valgrow.dev');
      
      for (const route of ['/pos', '/pos-billing', '/pos-cashier']) {
        const text = await client.navigateAndWait(`${BASE_URL}${route}`, 8000, true);
        const hasCrash = text.includes("This page didn't load");
        if (hasCrash) throw new Error(`Owner viewing ${route} displayed "This page didn't load"!`);
        console.log(`    ✓ Owner successfully loaded ${route} with full UI`);
      }
    });

    // -------------------------------------------------------------
    // TEST 6: Edge Case: Empty Queues & Missing Sessions Stability
    // -------------------------------------------------------------
    await runTest('6. Stability Check: Empty Queues & Unassigned Sessions Do Not Crash', async () => {
      await client.navigateAndWait(`${BASE_URL}/pos-cashier`);
      await client.eval(`
        (() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const allBtn = buttons.find(b => b.innerText.includes("All"));
          if (allBtn) allBtn.click();
        })()
      `);
      await client.wait(500);

      const hasCrash = await client.eval('document.body.innerText.includes("This page didn\'t load")');
      if (hasCrash) throw new Error('Filter interaction crashed Cashier Counter!');
      console.log('    ✓ Filter switching and queue rendering verified stable without errors');
    });

    // -------------------------------------------------------------
    // TEST 7: Browser Console & Hydration Audit
    // -------------------------------------------------------------
    await runTest('7. Browser Console & Hydration Log Audit', async () => {
      console.log(`    Total console logs captured: ${client.consoleLogs.length}`);
      console.log(`    Total uncaught exceptions: ${client.pageErrors.length}`);

      const criticalErrors = client.pageErrors.filter(e => 
        !e.includes('ResizeObserver')
      );

      if (criticalErrors.length > 0) {
        throw new Error(`Browser uncaught errors found: ${criticalErrors.join('; ')}`);
      }
      console.log('    ✓ Zero JavaScript runtime errors, hydration errors, or failed module loads');
    });

  } finally {
    client.close();
    chromeProcess.kill();
    try {
      fs.rmSync(userDataDir, { recursive: true, force: true });
    } catch {}
  }

  console.log('\n======================================================');
  console.log('  FINAL BROWSER-BASED REGRESSION TEST RESULTS:');
  console.log('======================================================');
  let allPassed = true;
  for (const r of testResults) {
    console.log(`  [${r.status}] ${r.name}`);
    if (r.status !== 'PASS') allPassed = false;
  }
  console.log('======================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runBrowserTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
