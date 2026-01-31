// Simple health check to verify Vercel serverless functions work
module.exports = (req, res) => {
    res.status(200).json({
        status: "ok",
        time: new Date().toISOString(),
        env: process.env.NODE_ENV || "unknown"
    });
};
