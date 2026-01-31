/**
 * Vercel serverless entry: forwards all requests to the Express app.
 * The build outputs the server to dist/index.cjs and exports createApp().
 */
const path = require("path");

// Resolve dist/index.cjs from api/ (api is at project root)
const serverPath = path.resolve(__dirname, "..", "dist", "index.cjs");
const { createApp } = require(serverPath);

let appPromise = null;

module.exports = async function handler(req, res) {
  if (!appPromise) {
    appPromise = createApp();
  }
  const app = await appPromise;
  app(req, res);
};
