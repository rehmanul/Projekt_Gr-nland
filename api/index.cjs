let appPromise = null;

module.exports = async function handler(req, res) {
  try {
    if (!appPromise) {
      // dist/index.cjs exports createApp (from server/index.ts)
      const appModule = require("../dist/index.cjs");
      const createApp = appModule.createApp || appModule.default?.createApp;
      if (typeof createApp !== "function") {
        throw new Error("createApp export not found");
      }
      appPromise = createApp();
    }
    const app = await appPromise;
    return app(req, res);
  } catch (error) {
    console.error("Vercel handler error:", error);
    return res.status(500).json({
      error: error?.message || "Unknown serverless init error",
      stack: error?.stack,
      type: "SERVERLESS_INIT_ERROR",
    });
  }
};
