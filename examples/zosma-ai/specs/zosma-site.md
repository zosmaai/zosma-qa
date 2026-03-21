# zosma.ai — Playwright Test Plan

## Application Overview

Zosma AI (`https://www.zosma.ai`) is a B2B AI business intelligence platform. The site
is a Next.js marketing site with four primary public pages plus a book-a-demo flow.

**Navigation structure:**
- `/` — Homepage (hero, how it works, WhatsApp feature, FAQ, CTA)
- `/about` — Company story, founding team, values
- `/openzosma` — Open-source AI workforce platform product page
- `/contact` — Contact form (Full Name, Business Email, Phone, Organisation, Message)
- `/book-meeting` — Calendly-style demo booking
- `/privacy-policy`, `/terms` — Legal pages

**Seed test:** `tests/seed.spec.ts`

---

## Test Scenarios

---

### 1. Home Page

**Seed:** `tests/seed.spec.ts`

#### 1.1 Page loads with correct title

**Steps:**
1. Navigate to `/`

**Expected:**
- Page title matches `/Zosma/i`
- Zosma logo is visible

#### 1.2 Navigation bar is complete

**Steps:**
1. Navigate to `/`
2. Inspect the `<nav>` element

**Expected:**
- Links present: openzosma, About, Contact, Book a Demo
- Logo links to `/`

#### 1.3 Hero section is visible

**Steps:**
1. Navigate to `/`

**Expected:**
- Heading "Every Answer Your Business Needs. Already in Your Data." is visible
- "Start Free Trial" CTA button is visible

#### 1.4 "How It Works" section has three steps

**Steps:**
1. Navigate to `/`
2. Scroll to "How It Works"

**Expected:**
- Heading visible
- Step 01: "Connect Your Data"
- Step 02: "Ask Any Question"
- Step 03: "Get Actionable Insights"

#### 1.5 FAQ accordion is present

**Steps:**
1. Navigate to `/`
2. Scroll to FAQ section

**Expected:**
- "Frequently Asked Questions" heading visible
- At least one FAQ item visible: "Is my data secure with Zosma ABI?"

#### 1.6 Footer is complete

**Steps:**
1. Navigate to `/`
2. Scroll to footer

**Expected:**
- "© 2026 Zosma AI" copyright notice
- LinkedIn and GitHub social links

---

### 2. About Page

**Seed:** `tests/seed.spec.ts`

#### 2.1 Page loads correctly

**Steps:**
1. Navigate to `/about`

**Expected:**
- Page title contains "About"
- Main heading visible

#### 2.2 "Our Story" section is present

**Steps:**
1. Navigate to `/about`
2. Scroll to "Our Story"

**Expected:**
- Heading "Our Story" visible
- Body text starts with "Zosma AI started…"

#### 2.3 Founding team cards are present

**Steps:**
1. Navigate to `/about`
2. Scroll to the team section

**Expected:**
- "Arjun Nayak" — "Founder & CEO" — LinkedIn link
- "Yudhajit Nag" — "Technical & Strategic Advisor"

#### 2.4 "Our Values" section lists all four values

**Steps:**
1. Navigate to `/about`
2. Scroll to "Our Values"

**Expected:** Customer First, Innovation, Transparency, Excellence

---

### 3. OpenZosma Page

**Seed:** `tests/seed.spec.ts`

#### 3.1 Hero content is correct

**Steps:**
1. Navigate to `/openzosma`

**Expected:**
- Title contains "openzosma"
- Heading "Your Team's AI Twins. Always On."
- "Open Source · Apache 2.0" badge

#### 3.2 GitHub links point to the correct repo

**Steps:**
1. Locate all "Star on GitHub" links

**Expected:**
- `href` attribute matches `github.com/zosmaai/openzosma`

#### 3.3 "Up and Running" section shows three steps

**Steps:**
1. Scroll to "Up and Running in Three Steps"

**Expected:** Create Your Twins, Build Your Hierarchy, Work From Anywhere

#### 3.4 Technology stack is listed

**Expected visible text:** TypeScript, Node.js, PostgreSQL, Next.js

#### 3.5 Terminal snippet shows quick-start commands

**Expected visible text:**
- `git clone … openzosma`
- `pnpm install`

---

### 4. Contact Form

**Seed:** `tests/seed.spec.ts`

> **Note:** The form submit is mocked at the network layer.
> No real contact record is created during test execution.

#### 4.1 Page and form render correctly

**Steps:**
1. Navigate to `/contact`

**Expected:**
- Title contains "Contact"
- Heading "Let's unlock the future, together"
- All five fields visible: Full Name, Business Email, Phone Number, Organisation, Message
- Submit button visible and enabled

#### 4.2 Full form fill and submit (mocked)

**Steps:**
1. Navigate to `/contact`
2. Intercept all POST requests matching `contact|form|submit|api` and return `{ success: true }`
3. Fill Full Name: "QA Test User"
4. Fill Business Email: "qa-test@zosma-qa.dev"
5. Fill Phone Number: "9876543210"
6. Fill Organisation: "zosma-qa Open Source Project"
7. Fill Message: automated test notice
8. Click Submit

**Expected:**
- No error is thrown
- UI shows success: one of — success message visible, form cleared, or redirect away from `/contact`

---

## Fixtures and Conventions

- All tests use the default `page` fixture from `@playwright/test`
- `baseURL` is set to `https://www.zosma.ai` in `playwright.config.ts`
- No auth is required — the site is fully public
- Network mocking is scoped to individual tests that need it

## Running the Tests

```bash
# From the examples/zosma-ai directory
pnpm test

# Or from the repo root
pnpm test:examples

# Headed mode for debugging
npx playwright test --headed --config examples/zosma-ai/playwright.config.ts
```
