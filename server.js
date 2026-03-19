import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

let data = {};

// Disable x-powered-by header for security
app.disable("x-powered-by");

const updateData = async () => {
  try {
    const response = await fetch(
      "https://www.stadt-koeln.de/interne-dienste/hochwasser/pegel_ws.php"
    );
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlData = await response.text();
    const result = await parseStringPromise(xmlData);
    
    data = result;
    console.log(`[${new Date().toISOString()}] Data successfully updated.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error updating data:`, error.message);
  }
};

// Update data every 5 minutes
setInterval(updateData, 5 * 60 * 1000);

// CORS middleware
app.use(cors({ origin: "*" }));

// Enable gzip compression for all responses
import compression from "compression";
app.use(compression());

// Serve static files (HTML/CSS)
app.use(express.static(path.join(__dirname, "temp"), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".html")) {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    }
  }
}));

// Serve images with 1-day browser caching
app.use("/img", express.static(path.join(__dirname, "img"), { maxAge: "1d" }));

// API endpoint
app.get("/api/data", (req, res) => {
  if (Object.keys(data).length === 0) {
    return res.status(503).json({ error: "Data is currently unavailable. Please try again later." });
  }
  res.json(data);
});

// Serve index.html fallback
app.get("*", (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.sendFile(path.join(__dirname, "temp", "index.html"));
});

const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}...`);
});

// Initial data fetch
updateData();

// Graceful shutdown
const shutdown = () => {
    console.log("Shutting down gracefully...");
    server.close(() => {
        console.log("Closed out remaining connections.");
        process.exit(0);
    });
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
