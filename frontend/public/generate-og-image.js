/**
 * Generate og-image.png at 1200x630 from og-image-source.html
 * Run from frontend/public/:
 *   node generate-og-image.js
 */
const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });

  const filePath = path.join(__dirname, 'og-image-source.html');
  await page.goto(`file://${filePath}`);
  await new Promise(r => setTimeout(r, 300)); // let fonts/gradients settle

  await page.screenshot({
    path: path.join(__dirname, 'og-image.png'),
    clip: { x: 0, y: 0, width: 1200, height: 630 },
  });

  await browser.close();
  console.log('✅ og-image.png saved (1200×630 @2x)');
})();
