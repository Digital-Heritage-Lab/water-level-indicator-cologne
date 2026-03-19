import express from "express";
import serverless from "serverless-http";
import cors from "cors";
import fetch from "node-fetch";
import { parseStringPromise } from "xml2js";

const api = express();

// Disable x-powered-by header for security
api.disable("x-powered-by");

// CORS middleware
api.use(cors({ origin: "*" }));

// The actual API logic from server.js
api.get(["/data", "/api/data", "/.netlify/functions/api/data"], async (req, res) => {
  try {
    const response = await fetch(
      "https://www.stadt-koeln.de/interne-dienste/hochwasser/pegel_ws.php"
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const xmlData = await response.text();
    const result = await parseStringPromise(xmlData);

    res.json(result);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error fetching API data:`, error.message);
    res.status(503).json({ error: "Data is currently unavailable. Please try again later." });
  }
});

// Since the path from Netlify redirects /api/* to /.netlify/functions/api/:splat
// The router will receive requests mapped to the root of the serverless function.
// So /api/data will map to /data.

export const handler = serverless(api);
