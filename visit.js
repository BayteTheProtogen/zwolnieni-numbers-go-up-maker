const { chromium } = require('playwright');
const https = require('https');

// Helper to fetch the industry-standard Stealth script at runtime
const getStealthScript = () => {
  return new Promise((resolve) => {
    https.get('https://raw.githubusercontent.com/requirebin/stealth/master/stealth.min.js', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
    });
  });
};

(async () => {
  // 1. STAGGERED START (Human Timing)
  // Random delay between 0 and 45 seconds to avoid simultaneous hits
  const startDelay = Math.floor(Math.random() * 45000);
  console.log(`Staggering start: Waiting ${startDelay / 1000}s...`);
  await new Promise(r => setTimeout(r, startDelay));

  // 2. RANDOMIZED IDENTITY (Windows 11)
  const randomPatch = Math.floor(Math.random() * 1000);
  const userAgent = `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.${randomPatch} Safari/537.36`;

  const stealthScript = await getStealthScript();
  const browser = await chromium.launch({ headless: true });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: userAgent,
    deviceScaleFactor: 1,
  });

  // 3. THE SECRET SAUCE (Deep Bot Flag Hiding & OS Spoofing)
  await context.addInitScript(stealthScript); // Inject global stealth library
  await context.addInitScript(() => {
    // Override platform to Windows
    Object.defineProperty(navigator, 'platform', { get: () => 'Win32' });
    // Delete the webdriver property
    delete Object.getPrototypeOf(navigator).webdriver;
    // Mock chrome runtime
    window.chrome = { runtime: {} };
    // Mock hardware concurrency
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    // Mock permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
    // Add Polish language support (since the app is in Polish)
    Object.defineProperty(navigator, 'languages', { get: () => ['pl-PL', 'pl', 'en-US', 'en'] });
  });

  const page = await context.newPage();
  const url = 'https://cyberprzewodnik.vercel.app';

  try {
    console.log(`Navigating to ${url} as Windows 11 User...`);

    // 4. NETWORK VERIFICATION (The Sniffer)
    const vercelPacket = page.waitForResponse(response => 
      response.url().includes('/_vercel/insights/view'), 
      { timeout: 25000 } 
    );

    await page.goto(url, { waitUntil: 'networkidle' });

    // 5. HUMAN INTERACTION SIMULATION
    console.log("Simulating human activity...");
    await page.mouse.move(Math.floor(Math.random() * 500), Math.floor(Math.random() * 500));
    await page.mouse.wheel(0, 500);
    await page.waitForTimeout(2000);
    
    console.log("Waiting for 'Dalej' button...");
    const nextButton = page.locator('button:has-text("Dalej")');
    await nextButton.waitFor({ state: 'visible' });

    // Random delay before clicking to look human (1.5 - 3.5s)
    await page.waitForTimeout(Math.floor(Math.random() * 2000) + 1500);
    
    await nextButton.scrollIntoViewIfNeeded();
    await nextButton.click();
    console.log("Button clicked.");

    // 6. VERIFICATION
    console.log("Verifying Vercel Analytics packet...");
    const response = await vercelPacket;
    
    if (response) {
      console.log(`✅ SUCCESS! Vercel Packet Sent. Status: ${response.status()}`);
      const data = await response.request().postData();
      console.log(`Payload Sent: ${data}`);
    }

    // Final wait to ensure the network request completes before closing
    await page.waitForTimeout(3000);

  } catch (err) {
    if (err.name === 'TimeoutError') {
      console.error("❌ FAILURE: The Vercel Analytics script NEVER fired.");
      console.log("Vercel's bot detection is likely blocking the GitHub IP range.");
    } else {
      console.error("Script Error:", err.message);
    }
  } finally {
    await browser.close();
    console.log("Browser closed. Run complete.");
  }
})();
