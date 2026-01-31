/**
 * Vercel serverless entry: forwards all requests to the Express app.
 * The build script outputs api/server.cjs (fully bundled, no externals).
 */
const { createApp } = require("./server.cjs");

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
    res.status(500).json({ error: error.message });
  }
};

