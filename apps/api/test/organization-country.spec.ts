import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import * as cookieParser from "cookie-parser";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import {
  COUNTRIES,
  DEFAULT_COUNTRY,
  findCountry,
  isValidCountry,
} from "../src/common/countries";

describe("Country List, Default Selection, Saving, and Organization Editing", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let userToken: string;
  let userCookie: any;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
    prisma = app.get(PrismaService);

    // Cleanup any existing test data
    await prisma.user.deleteMany({
      where: { email: "country.tester@valgrow-country.test" },
    });
    await prisma.organization.deleteMany({
      where: {
        slug: {
          in: [
            "country-initial-org",
            "country-test-default-org",
            "country-test-custom-org",
            "country-test-edit-org",
          ],
        },
      },
    });

    // Register test user
    const regRes = await request(app.getHttpServer())
      .post("/auth/register")
      .send({
        email: "country.tester@valgrow-country.test",
        password: "Password123!",
        firstName: "Country",
        lastName: "Tester",
        organizationName: "Country Initial Org",
        organizationSlug: "country-initial-org",
      })
      .expect(201);

    userToken = regRes.body.tokens.accessToken;
    userCookie = regRes.headers["set-cookie"];
    userId = regRes.body.user.id;
  }, 60000);

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: { email: "country.tester@valgrow-country.test" },
      });
      await prisma.organization.deleteMany({
        where: {
          slug: {
            in: [
              "country-initial-org",
              "country-test-default-org",
              "country-test-custom-org",
              "country-test-edit-org",
            ],
          },
        },
      });
      await prisma.$disconnect();
    }
    if (app) {
      await app.close();
    }
  }, 60000);

  // =========================================================================
  // 1. Dataset Verification: All 195 Countries, Alphabetical, Unique, India
  // =========================================================================
  describe("Country Dataset Verification", () => {
    it("should have exactly 195 commonly recognized sovereign countries", () => {
      expect(COUNTRIES).toHaveLength(195);
    });

    it("should default to India", () => {
      expect(DEFAULT_COUNTRY).toBe("India");
      const india = findCountry("India");
      expect(india).toBeDefined();
      expect(india?.code).toBe("IN");
      expect(india?.officialName).toBe("Republic of India");
    });

    it("should have all 195 countries sorted in alphabetical order", () => {
      for (let i = 1; i < COUNTRIES.length; i++) {
        const prev = COUNTRIES[i - 1].name;
        const curr = COUNTRIES[i].name;
        expect(
          prev.localeCompare(curr, "en", { sensitivity: "base" }),
        ).toBeLessThan(0);
      }
    });

    it("should contain unique ISO codes and unique names", () => {
      const codeSet = new Set(COUNTRIES.map((c) => c.code));
      const nameSet = new Set(COUNTRIES.map((c) => c.name));
      expect(codeSet.size).toBe(195);
      expect(nameSet.size).toBe(195);
    });

    it("should resolve countries by name, code, or aliases", () => {
      expect(findCountry("India")?.name).toBe("India");
      expect(findCountry("IN")?.name).toBe("India");
      expect(findCountry("Bharat")?.name).toBe("India");
      expect(findCountry("United States")?.code).toBe("US");
      expect(findCountry("US")?.name).toBe("United States");
      expect(findCountry("USA")?.name).toBe("United States");
      expect(findCountry("United Arab Emirates")?.code).toBe("AE");
      expect(findCountry("UAE")?.name).toBe("United Arab Emirates");
      expect(findCountry("United Kingdom")?.code).toBe("GB");
      expect(findCountry("UK")?.name).toBe("United Kingdom");
      expect(findCountry("Germany")?.code).toBe("DE");
      expect(findCountry("Japan")?.code).toBe("JP");
      expect(findCountry("Singapore")?.code).toBe("SG");
      expect(findCountry("Australia")?.code).toBe("AU");
      expect(findCountry("Zimbabwe")?.code).toBe("ZW");
      expect(isValidCountry("Nonexistent Country")).toBe(false);
    });
  });

  // =========================================================================
  // 2. Organization Creation with Default Country (India)
  // =========================================================================
  let defaultOrgId: string;
  describe("Default Organization Country Selection", () => {
    it("should create organization with default country India when country is omitted or default", async () => {
      const res = await request(app.getHttpServer())
        .post("/organizations")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Cookie", userCookie)
        .send({
          name: "Country Test Default Org",
          currency: "INR",
          // country omitted - should default to India
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe("Country Test Default Org");
      expect(res.body.country).toBe("India");
      expect(res.body.currency).toBe("INR");

      defaultOrgId = res.body.id;

      // Verify saved in organizationSettings
      const setting = await prisma.organizationSettings.findUnique({
        where: {
          organizationId_key: {
            organizationId: defaultOrgId,
            key: "country",
          },
        },
      });
      expect(setting).not.toBeNull();
      expect(setting?.value).toBe("India");
    });
  });

  // =========================================================================
  // 3. Organization Creation with Custom Country & Independent Currency
  // =========================================================================
  let customOrgId: string;
  describe("Organization Creation with Selected Country", () => {
    it("should save selected country to organization record and keep currency independent", async () => {
      const res = await request(app.getHttpServer())
        .post("/organizations")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Cookie", userCookie)
        .send({
          name: "Country Test Custom Org",
          country: "Germany",
          currency: "EUR", // Explicitly chosen EUR, independent of country
          createBranch: true,
          branch: {
            name: "Berlin Hub",
            city: "Berlin",
          },
        })
        .expect(201);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe("Country Test Custom Org");
      expect(res.body.country).toBe("Germany");
      expect(res.body.currency).toBe("EUR");

      customOrgId = res.body.id;

      // Verify saved directly in database
      const dbSetting = await prisma.organizationSettings.findUnique({
        where: {
          organizationId_key: {
            organizationId: customOrgId,
            key: "country",
          },
        },
      });
      expect(dbSetting).not.toBeNull();
      expect(dbSetting?.value).toBe("Germany");
    });

    it("should restore saved country when fetching organizations list and by ID", async () => {
      // 1. Fetch user organizations
      const listRes = await request(app.getHttpServer())
        .get("/organizations")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Cookie", userCookie)
        .expect(200);

      const foundCustom = listRes.body.find((o: any) => o.id === customOrgId);
      expect(foundCustom).toBeDefined();
      expect(foundCustom.country).toBe("Germany");
      expect(foundCustom.currency).toBe("EUR");

      // 2. Fetch specific organization by ID
      const singleRes = await request(app.getHttpServer())
        .get(`/organizations/${customOrgId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Cookie", userCookie)
        .expect(200);

      expect(singleRes.body.id).toBe(customOrgId);
      expect(singleRes.body.country).toBe("Germany");
      expect(singleRes.body.currency).toBe("EUR");
    });
  });

  // =========================================================================
  // 4. Organization Editing: Updating Country and Restoring Saved Value
  // =========================================================================
  describe("Editing Organization Country", () => {
    let editOrgId: string;

    it("should create an organization, update its country, and restore updated country", async () => {
      // 1. Create organization with country Japan
      const createRes = await request(app.getHttpServer())
        .post("/organizations")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Cookie", userCookie)
        .send({
          name: "Country Test Edit Org",
          country: "Japan",
          currency: "JPY",
        })
        .expect(201);

      editOrgId = createRes.body.id;
      expect(createRes.body.country).toBe("Japan");

      // 2. Update organization country to Australia via PATCH
      const patchRes = await request(app.getHttpServer())
        .patch(`/organizations/${editOrgId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Cookie", userCookie)
        .set("x-organization-id", editOrgId)
        .send({
          name: "Country Test Edit Org (Updated)",
          country: "Australia",
          currency: "JPY", // Currency remains unchanged
        })
        .expect(200);

      expect(patchRes.body.id).toBe(editOrgId);
      expect(patchRes.body.name).toBe("Country Test Edit Org (Updated)");
      expect(patchRes.body.country).toBe("Australia");
      expect(patchRes.body.currency).toBe("JPY");

      // 3. Verify in database directly
      const updatedSetting = await prisma.organizationSettings.findUnique({
        where: {
          organizationId_key: {
            organizationId: editOrgId,
            key: "country",
          },
        },
      });
      expect(updatedSetting?.value).toBe("Australia");

      // 4. Verify restoring updated country in getOrganizationById
      const restored = await request(app.getHttpServer())
        .get(`/organizations/${editOrgId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .set("Cookie", userCookie)
        .expect(200);

      expect(restored.body.country).toBe("Australia");
      expect(restored.body.currency).toBe("JPY");

      // 5. Verify /auth/me returns updated country in organizations list
      const meRes = await request(app.getHttpServer())
        .get("/auth/me")
        .set("Authorization", `Bearer ${userToken}`)
        .set("Cookie", userCookie)
        .set("x-organization-id", editOrgId)
        .expect(200);

      expect(meRes.body.activeOrganization).toBeDefined();
      expect(meRes.body.activeOrganization.country).toBe("Australia");
      const orgInMe = meRes.body.organizations.find(
        (o: any) => o.id === editOrgId,
      );
      expect(orgInMe).toBeDefined();
      expect(orgInMe.country).toBe("Australia");
    });
  });
});
