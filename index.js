const express = require("express");
const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Accept");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

app.use(express.json());

const DFS_LOGIN = process.env.DFS_LOGIN;
const DFS_PASSWORD = process.env.DFS_PASSWORD;

function dfsAuth() {
  return "Basic " + Buffer.from(`${DFS_LOGIN}:${DFS_PASSWORD}`).toString("base64");
}

app.get("/", (req, res) => {
  res.json({ status: "DropSpy Proxy running", cors: "enabled", login: DFS_LOGIN ? "set" : "missing" });
});

// Test endpoint - verify credentials work
app.get("/test", async (req, res) => {
  try {
    const response = await fetch("https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": dfsAuth() },
      body: JSON.stringify([{ location_name: "United States", language_name: "English", keywords: ["test"] }]),
    });
    const data = await response.json();
    res.json({ 
      proxy_status: "ok",
      dataforseo_status: data.status_code,
      dataforseo_message: data.status_message,
      has_results: !!(data.tasks?.[0]?.result?.[0]?.items?.length),
      raw_task_status: data.tasks?.[0]?.status_code,
      raw_task_message: data.tasks?.[0]?.status_message,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/keywords/volume", async (req, res) => {
  try {
    const { keywords } = req.body;
    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: "keywords array required" });
    }

    const response = await fetch("https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": dfsAuth() },
      body: JSON.stringify([{
        location_name: "United States",
        language_name: "English",
        keywords
      }]),
    });

    const data = await response.json();

    // Log for debugging
    console.log("Volume API status:", data.status_code, data.status_message);
    console.log("Task status:", data.tasks?.[0]?.status_code, data.tasks?.[0]?.status_message);
    console.log("Result count:", data.tasks?.[0]?.result_count);
    console.log("Items:", data.tasks?.[0]?.result?.[0]?.items?.length);

    res.json(data);
  } catch (e) {
    console.error("Volume error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

app.post("/keywords/suggestions", async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ error: "keyword required" });

    const response = await fetch("https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": dfsAuth() },
      body: JSON.stringify([{
        keyword,
        location_name: "United States",
        language_name: "English",
        limit: 10
      }]),
    });

    const data = await response.json();
    console.log("Suggestions API status:", data.status_code, data.tasks?.[0]?.status_code);
    res.json(data);
  } catch (e) {
    console.error("Suggestions error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`DropSpy proxy running on port ${PORT}`));
