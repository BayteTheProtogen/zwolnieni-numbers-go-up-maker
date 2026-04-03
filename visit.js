const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  
  // Create a realistic browser context
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  // HIDE BOT FLAGS: This is the secret sauce
  await context.addInitScript(() => {
    // 1. Delete the webdriver property
    delete Object.getPrototypeOf(navigator).webdriver;
    // 2. Mock chrome runtime
    window.chrome = { runtime: {} };
    // 3. Mock permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  });

  const page = await context.newPage();
  const url = 'https://cyberprzewodnik.vercel.app';

  try {
    console.log(`Navigating to ${url}...`);

    // --- FORCE WAIT FOR ANALYTICS ---
    // This creates a promise that only resolves when the /view packet is sent
    const vercelPacket = page.waitForResponse(response => 
      response.url().includes('/_vercel/insights/view'), 
      { timeout: 15000 } // Wait up to 15 seconds for it to fire
    );

    await page.goto(url, { waitUntil: 'networkidle' });

    // Simulate human activity to trigger the tracker
    await page.mouse.move(200, 200);
    await page.mouse.wheel(0, 500);
    
    console.log("Waiting for 'Dalej' button...");
    const nextButton = page.locator('button:has-text("Dalej")');
    await nextButton.waitFor({ state: 'visible' });
    await nextButton.click();

    // Now we wait for the promise to resolve
    console.log("Waiting for Vercel to send the packet...");
    const response = await vercelPacket;
    
    if (response) {
      console.log(`✅ SUCCESS! Vercel Packet Sent. Status: ${response.status()}`);
      const data = await response.request().postData();
      console.log(`Payload Sent: ${data}`);
    }

  } catch (err) {
    if (err.name === 'TimeoutError') {
      console.error("❌ FAILURE: The Vercel Analytics script NEVER fired.");
      console.log("This means the script is still detecting the bot environment.");
    } else {
      console.error("Script Error:", err.message);
    }
  } finally {
    await browser.close();
  }
})();
