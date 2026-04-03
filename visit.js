const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
  });

  const page = await context.newPage();
  const url = 'https://cyberprzewodnik.vercel.app';

  // --- THE SNIFFER: This listens for the Vercel Analytics Packet ---
  page.on('request', request => {
    if (request.url().includes('/_vercel/insights/view')) {
      console.log('✅ ANALYTICS PACKET DETECTED!');
      console.log('Payload:', request.postData());
    }
  });

  page.on('response', response => {
    if (response.url().includes('/_vercel/insights/view')) {
      console.log(`📡 VERCEL RESPONSE: ${response.status()}`);
    }
  });
  // -------------------------------------------------------------

  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Vercel sometimes waits for a "scroll" or "interaction" to fire analytics
    console.log("Simulating human scroll...");
    await page.mouse.wheel(0, 500); 
    await page.waitForTimeout(2000);

    const nextButton = page.locator('button:has-text("Dalej")');
    if (await nextButton.isVisible()) {
      console.log("Clicking 'Dalej' to trigger next page analytics...");
      await nextButton.click();
      await page.waitForTimeout(5000); // Give it time to fire the next packet
    }

    console.log("Visit complete.");
  } catch (err) {
    console.error("Script Error:", err.message);
  } finally {
    await browser.close();
  }
})();
