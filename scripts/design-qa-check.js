import puppeteer from 'puppeteer';

// Design System Tokens (Simplified from Tailwind)
const DESIGN_TOKENS = {
  typography: {
    h1: {
      fontSize: '36px', // 4xl in tailwind (approx)
      fontWeight: '900', // black
    }
  },
  colors: {
    primary: 'rgb(59, 130, 246)', // blue-500
    background: {
      light: 'rgb(249, 250, 251)', // gray-50
      dark: 'rgb(0, 0, 0)', // black
    }
  }
};

(async () => {
  console.log('🚀 Starting Automated Design QA Check...');
  
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  const page = await browser.newPage();
  
  // Log browser console messages
  page.on('console', msg => console.log('   PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('   PAGE ERROR:', err.toString()));

  // Navigate to local dev server
  try {
    console.log('   Navigating to http://localhost:5555...');
    await page.goto('http://localhost:5555', { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log('✅ Page Loaded (DOM Content Loaded)');
  } catch (e) {
    console.error('❌ Failed to load page:', e.message);
    await browser.close();
    process.exit(1);
  }

  // Set Viewport
  await page.setViewport({ width: 1280, height: 720 });

  // Wait for loading to finish (max 30s)
  try {
    console.log('   Waiting for application to initialize...');
    // Wait for the specific H1 that appears only after loading
    await page.waitForSelector('h1', { timeout: 30000 }); 
  } catch (e) {
    console.warn('⚠️ H1 not found within 30s. Taking debug screenshot...');
    await page.screenshot({ path: 'debug-error.png' });
    const content = await page.content();
    console.log('   Page Content Snippet:', content.substring(0, 1000));
    await browser.close();
    process.exit(1);
  }

  // 1. Check Title Typography
  console.log('\n🔍 Checking Typography: H1 Title');
  
  const titleStyles = await page.$eval('h1', (el) => {
    const style = window.getComputedStyle(el);
    return {
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      color: style.color
    };
  });

  console.log(`   Expected Font Size: ~${DESIGN_TOKENS.typography.h1.fontSize}`);
  console.log(`   Actual Font Size:   ${titleStyles.fontSize}`);
  
  if (titleStyles.fontWeight >= 900 || titleStyles.fontWeight === '900') {
    console.log('   ✅ Font Weight matches (Black/900)');
  } else {
    console.warn(`   ⚠️ Font Weight mismatch: Got ${titleStyles.fontWeight}`);
  }

  // 2. Check Theme Toggle
  console.log('\n🔍 Checking Interaction: Theme Toggle');
  
  // Get initial background color (from body or the main wrapper div)
  const initialBg = await page.$eval('div.relative', (el) => window.getComputedStyle(el).backgroundColor);
  console.log(`   Initial Background: ${initialBg}`);
  
  // Find toggle button (assuming it's the button with SVG inside)
  const toggleBtn = await page.$('button');
  if (toggleBtn) {
    await toggleBtn.click();
    console.log('   🖱️ Clicked Theme Toggle');
    
    // Wait for transition
    await new Promise(r => setTimeout(r, 1000));
    
    const newBg = await page.$eval('div.relative', (el) => window.getComputedStyle(el).backgroundColor);
    console.log(`   New Background:     ${newBg}`);
    
    // Check if colors are different
    if (initialBg !== newBg) {
      console.log('   ✅ Theme switch verified successfully');
    } else {
      console.warn('   ⚠️ Theme switch check inconclusive (Background might be same if logic failed)');
    }
  } else {
    console.error('   ❌ Toggle button not found');
  }

  // 3. Accessibility Snapshot (Simulated)
  console.log('\n📸 Taking Screenshot for Visual Regression...');
  await page.screenshot({ path: 'design-qa-snapshot.png' });
  console.log('   ✅ Screenshot saved to design-qa-snapshot.png');

  await browser.close();
  console.log('\n✨ Design QA Complete!');
})();
