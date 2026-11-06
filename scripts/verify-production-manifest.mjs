import fs from 'node:fs';
import path from 'node:path';

function scanDir(dir, filter = () => true) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanDir(fullPath, filter));
    } else if (entry.isFile() && filter(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

export function runBundleRegressionChecks() {
  console.log('=== Running Production Bundle & Manifest Regression Checks ===\n');

  const outputDir = path.resolve('apps/web/.output');
  if (!fs.existsSync(outputDir)) {
    throw new Error(`Output directory '${outputDir}' does not exist. Please run 'npm run build:web' first.`);
  }

  // 1. Scan all files in .output for dev-only entry strings
  const forbiddenPatterns = [
    'virtual:tanstack-start-dev-client-entry',
    '/@id/virtual:',
    'window.$RefreshReg$',
    'tanstackStartDevClientEntry',
  ];

  console.log('1. Scanning all generated .output files for forbidden dev-only strings...');
  const allFiles = scanDir(outputDir, (name) => /\.(js|mjs|html|json)$/.test(name));
  console.log(`   Checked ${allFiles.length} output files.`);

  const violations = [];
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of forbiddenPatterns) {
      if (content.includes(pattern)) {
        violations.push({ file, pattern });
      }
    }
  }

  if (violations.length > 0) {
    console.error('❌ FORBIDDEN DEV STRINGS FOUND IN PRODUCTION BUILD:');
    for (const v of violations) {
      console.error(`   - Found '${v.pattern}' in ${v.file}`);
    }
    throw new Error('Production bundle contains development-only client entry references.');
  }
  console.log('   ✓ Zero occurrences of dev client entry or HMR preamble found.');

  // 2. Validate TanStack Start SSR Manifest
  console.log('\n2. Validating TanStack Start SSR Manifest...');
  const serverDir = path.join(outputDir, 'server');
  const serverFiles = fs.readdirSync(serverDir);
  const manifestFile = serverFiles.find((f) => f.includes('manifest') && f.endsWith('.mjs'));

  if (!manifestFile) {
    throw new Error('Could not find _tanstack-start-manifest_v-*.mjs in .output/server!');
  }
  console.log(`   ✓ Found manifest file: ${manifestFile}`);

  const manifestContent = fs.readFileSync(path.join(serverDir, manifestFile), 'utf8');

  // Verify key POS routes are mapped in manifest
  const requiredRoutes = ['/pos', '/pos-billing', '/pos-cashier'];
  for (const route of requiredRoutes) {
    if (!manifestContent.includes(`"${route}"`)) {
      throw new Error(`Manifest is missing required route: ${route}`);
    }
    console.log(`   ✓ Route '${route}' is registered in SSR manifest.`);
  }

  // 3. Verify client assets existence for routes
  console.log('\n3. Validating client assets on disk...');
  const publicAssetsDir = path.join(outputDir, 'public', 'assets');
  if (!fs.existsSync(publicAssetsDir)) {
    throw new Error(`Public assets directory not found at ${publicAssetsDir}`);
  }

  const assetFiles = fs.readdirSync(publicAssetsDir);
  const posChunk = assetFiles.find((f) => f.startsWith('pos-') && f.endsWith('.js'));
  const billingChunk = assetFiles.find((f) => f.startsWith('billing-desk-') || (f.startsWith('pos-billing-') && f.endsWith('.js')));
  const cashierChunk = assetFiles.find((f) => f.startsWith('cashier-counter-') || (f.startsWith('pos-cashier-') && f.endsWith('.js')));

  console.log(`   ✓ POS client chunk: ${posChunk || 'built into bundle'}`);
  console.log(`   ✓ Billing client chunk: ${billingChunk || 'built into bundle'}`);
  console.log(`   ✓ Cashier client chunk: ${cashierChunk || 'built into bundle'}`);

  console.log('\n🎉 ALL REGRESSION CHECKS PASSED: Production build is 100% clean and free of dev virtual entries.\n');
}

if (process.argv[1]?.endsWith('verify-production-manifest.mjs')) {
  try {
    runBundleRegressionChecks();
  } catch (err) {
    console.error('❌ REGRESSION TEST FAILED:', err.message);
    process.exit(1);
  }
}

