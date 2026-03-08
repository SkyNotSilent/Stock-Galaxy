# Chrome DevTools MCP & Design System Integration Guide

## 1. Introduction to Chrome DevTools MCP

Google's **Chrome DevTools MCP** (Model Context Protocol) is an official tool that allows AI agents (like Claude, Gemini, Cursor) to control and inspect a live Chrome browser.

### Key Capabilities:
- **Control**: Launch Chrome, navigate pages, click, type, and scroll.
- **Inspect**: Access the full DOM tree, computed styles, and accessibility tree.
- **Debug**: Analyze network requests, console logs, and performance traces.
- **Audit**: Run Lighthouse audits automatically.

### Why It's a Game Changer for Design QA:
Unlike traditional automated tests (Cypress/Playwright) which are rigid, an AI agent with MCP can:
1. **Understand Visual Context**: "Does this button look like the Primary Button in the design system?"
2. **Perform Flexible Interaction**: "Try to break the layout by resizing the window."
3. **Validate Against Tokens**: Compare live CSS values against your Design Token source of truth.

---

## 2. Setting Up the Workflow

### Prerequisites
1. **Node.js** (v18+)
2. **Chrome Browser**
3. **MCP-Compatible Agent** (Claude Desktop, Cursor, Trae, etc.)

### Installation (for your Agent)
Add this to your MCP configuration file:

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

---

## 3. Automated Design QA Strategy

To achieve "Pixel Perfect" automated review, we combine **MCP** with your **Design System Tokens**.

### Step 1: Export Design Tokens
Ensure your design tokens (colors, typography, spacing) are available as a JSON file.
*Example: `design-tokens.json`*

### Step 2: The AI Agent Workflow
The AI Agent performs the following loop:
1. **Load Page**: Navigate to `http://localhost:5555`.
2. **Identify Elements**: "Find the 'Connect Wallet' button."
3. **Extract Styles**: Use `computedStyle` to get font-size, background-color, padding.
4. **Compare vs Tokens**:
   - *Expected*: `primary-500` -> `#3b82f6`
   - *Actual*: `rgb(59, 130, 246)`
   - *Result*: ✅ PASS
5. **Report**: Generate a markdown report of discrepancies.

---

## 4. Example: Interactive Testing Script

We have created a demonstration script in `scripts/design-qa-check.js` that mimics this behavior using Puppeteer (the engine behind Chrome MCP).

**Run the demo:**
```bash
npm install puppeteer
node scripts/design-qa-check.js
```

This script will:
1. Launch a headless browser.
2. Navigate to your app.
3. Check if the "Stock Galaxy" title matches the Design System typography tokens.
4. Verify the color contrast of the theme toggle button.
