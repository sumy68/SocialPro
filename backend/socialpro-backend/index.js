import express from "express";
import cors from "cors";

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Health Check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "socialpro-backend",
    time: new Date().toISOString(),
  });
});

// ✅ Example route
app.get("/api/trpc/example.hi", (req, res) => {
  res.json({ message: "Hello from SocialPro backend ✅" });
});

// ✅ Platforms routes (mock data)
app.get("/api/trpc/platforms.getToken", (req, res) => {
  res.json({ token: null, connected: false });
});

app.get("/api/trpc/platforms.oauth.tiktok.init", (req, res) => {
  res.json({
    ok: true,
    demo: false,
    provider: "tiktok",
    authUrl: null,
  });
});

// ✅ Root route
app.get("/", (req, res) => {
  res.send("🚀 SocialPro Backend läuft stabil!");
});

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    path: req.originalUrl,
  });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err);
  res.status(500).json({
    error: "Internal Server Error",
    message: err.message,
  });
});

// ✅ Start server
const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`✅ Backend läuft auf Port ${port}`);
});
