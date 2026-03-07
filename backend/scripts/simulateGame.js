import { firefox } from 'playwright';
(async () => {
    console.log("Launching Firefox...");
    const browser = await firefox.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://localhost:5173');
    console.log('Firefox is open. Press Ctrl+C to exit.');
    await new Promise(() => { }); // keeps Node alive
})();
//# sourceMappingURL=simulateGame.js.map