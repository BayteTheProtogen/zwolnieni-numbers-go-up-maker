const { chromium } = require('playwright');

(async () => {
  // Add a random delay (0 to 30 seconds) so parallel jobs don't hit Vercel at the same millisecond
  const startDelay = Math.floor(Math.random() * 30000);
  console.log(`Waiting ${startDelay/1000}s to avoid simultaneous hits...`);
  await new Promise(r => setTimeout(r, startDelay));

  const browser = await chromium.launch({ headless: true });
  
  // 2. Randomize User-Agent to ensure Vercel sees a "Unique Visitor"
  const chromeVersion = Math.floor(Math.random() * 10) + 115;
  const patchVersion = Math.floor(Math.random() * 1000);
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${chromeVersion}.0.0.${patchVersion} Safari/537.36`
  });

  const page = await context.newPage();
  const url = 'https://cyberprzewodnik.vercel.app';
  const maxClicks = parseInt(process.env.CLICK_COUNT) || 3;

  try {
    console.log(`Visiting: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Wait for Vercel Analytics to initialize
    await page.waitForTimeout(3000);

    for (let i = 0; i < maxClicks; i++) {
      // Look for the specific "Dalej" button from your screenshot
      const nextButton = page.locator('button:has-text("Dalej")');

      if (await nextButton.isVisible()) {
        // Human-like delay: wait 1.5 to 3.5 seconds
        const delay = Math.floor(Math.random() * 2000) + 1500;
        await page.waitForTimeout(delay);

        console.log(`Step ${i + 1}: Clicking 'Dalej'`);
        await nextButton.scrollIntoViewIfNeeded();
        await nextButton.click();

        // Wait for page transition
        await page.waitForTimeout(2000);
      } else {
        console.log("Button 'Dalej' no longer visible. Ending session.");
        break;
      }
    }
    console.log("Session finished successfully.");
  } catch (err) {
    console.error("Error during session:", err.message);
  } finally {
    await browser.close();
  }
})();
