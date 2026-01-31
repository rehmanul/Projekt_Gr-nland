/**
 * Vercel serverless entry: forwards all requests to the Express app.
 * The build outputs the server to dist/index.cjs and exports createApp().
 */
const path = require("path");

// In Vercel serverless, __dirname points to the function directory.
// With includeFiles: "dist/index.cjs", the file is bundled alongside the function.
// Try multiple resolutions for different environments
let createApp;
try {
  // Try relative to __dirname first (works when includeFiles bundles correctly)
  const serverPath = path.join(__dirname, "dist", "index.cjs");
  createApp = require(serverPath).createApp;
} catch (e1) {
  try {
    // Fallback: relative to project root
    const serverPath = path.join(process.cwd(), "dist", "index.cjs");
    createApp = require(serverPath).createApp;
  } catch (e2) {
    // Final fallback: one level up from api/
    const serverPath = path.join(__dirname, "..", "dist", "index.cjs");
    createApp = require(serverPath).createApp;
  }
}

let appPromise = null;

module.exports = async function handler(req, res) {
  try {
    if (!appPromise) {
      appPromise = createApp();
    }
    const app = await appPromise;
    app(req, res);
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({ error: error.message, stack: error.stack });
  }
};

