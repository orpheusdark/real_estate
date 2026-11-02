import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';
const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || 'chrome',
  ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
  headless: true,
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await mkdir('../docs/screenshots', { recursive: true });
await page.goto('http://127.0.0.1:5173/');
await page.getByRole('heading', { name: /Good spaces/ }).waitFor();
await page.locator('.property-card').first().waitFor();
await page.evaluate(async () => {
  for (const im of document.images) {
    im.loading = 'eager';
  }
  await Promise.all(Array.from(document.images).map((im) => im.decode().catch(() => {})));
});
await page.screenshot({ path: '../docs/screenshots/home-desktop.png', fullPage: true });
console.log('Home loaded, cards:', await page.locator('.property-card').count());
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
  'Page should fit the viewport',
);
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: '../docs/screenshots/home-mobile.png', fullPage: true });
assert.equal(
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
  false,
  'Page should fit the viewport',
);
await page.getByRole('button', { name: 'Open menu' }).click();
await page.getByRole('link', { name: 'Sign in', exact: true }).click();
await page.getByRole('heading', { name: 'Welcome home.' }).waitFor();
await page.getByRole('link', { name: 'Create an account', exact: true }).click();
await page.getByLabel('Your name', { exact: true }).fill('Browser Tester');
const email = 'browser-' + Date.now() + '@example.com';
await page.getByLabel('Email address', { exact: true }).fill(email);
await page.getByLabel('Password', { exact: true }).fill('BrowserTest2026!');
await page.getByRole('button', { name: 'Create account', exact: true }).click();
await page.getByRole('heading', { name: 'Hello, Browser.' }).waitFor();
await page.screenshot({ path: '../docs/screenshots/dashboard-mobile.png', fullPage: true });
await page.getByRole('link', { name: 'List a property', exact: true }).last().click();
await page.getByLabel('Property title', { exact: true }).fill('Browser test garden apartment');
await page
  .getByLabel('Tell its story', { exact: true })
  .fill(
    'A spacious bright home with a garden balcony, parking and easy access to schools and shops.',
  );
await page.getByLabel('City', { exact: true }).fill('Bengaluru');
await page
  .getByLabel('Address / neighbourhood', { exact: true })
  .fill('Browser Test Road, Bengaluru');
await page.getByLabel(/^Price /).fill('8500000');
await page.getByLabel('Area (sq ft)', { exact: true }).fill('1500');
await page.getByLabel('Property photos', { exact: true }).setInputFiles({
  name: 'test.png',
  mimeType: 'image/png',
  buffer: await sharp({ create: { width: 100, height: 100, channels: 3, background: '#63836a' } })
    .png()
    .toBuffer(),
});
await page.getByRole('button', { name: 'Publish listing', exact: true }).click();
await page.waitForURL(/\/properties\/[a-f0-9-]{36}$/);
await page.getByRole('heading', { name: 'Browser test garden apartment', exact: true }).waitFor();
const createdId = page.url().split('/').pop();
console.log('Created property with uploaded image');
await page.screenshot({ path: '../docs/screenshots/property-mobile.png', fullPage: true });
await page.getByRole('button', { name: 'Open menu' }).click();
await page.getByRole('button', { name: 'Sign out', exact: true }).click();
await page.getByRole('heading', { name: 'See yourself here?' }).waitFor();
await page.getByLabel('Your name', { exact: true }).fill('Guest Browser');
await page.getByLabel('Email address', { exact: true }).fill('guest-browser@example.com');
await page.getByLabel('Phone number', { exact: true }).fill('9876543210');
const date = new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10);
await page.getByLabel('Date', { exact: true }).fill(date);
await page.locator('select[name=time]').selectOption('12:00');
await page.getByRole('button', { name: 'Request a viewing', exact: true }).click();
await page.getByRole('heading', { name: "You're one step closer." }).waitFor();
await page.getByRole('link', { name: 'Manage your viewing', exact: true }).click();
await page.getByRole('button', { name: 'Cancel this viewing', exact: true }).click();
await page.locator('.status.cancelled').waitFor();
console.log('Guest booked, opened private link, and cancelled');
const login = await page.request.post('http://127.0.0.1:5173/api/auth/login', {
  data: { email, password: 'BrowserTest2026!' },
});
assert.equal(login.status(), 200);
const session = await login.json();
const removed = await page.request.delete('http://127.0.0.1:5173/api/properties/' + createdId, {
  headers: { Authorization: 'Bearer ' + session.token, Origin: 'http://127.0.0.1:5173' },
});
assert.equal(removed.status(), 200);
console.log('Removed browser test listing');
console.log('Page errors:', JSON.stringify(errors));
await browser.close();
if (errors.length) process.exit(1);
