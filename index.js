const express = require("express");
const app = express();
 
// Manual CORS - allow everything
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
 
app.post("/keywords/volume", async (req, res) => {
  try {
    const { keywords } = req.body;
    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: "keywords array required" });
    }
    const response = await fetch("https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": dfsAuth()
      },
      body: JSON.stringify([{
        location_name: "United States",
        language_name: "English",
        keywords
      }]),
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
 
app.post("/keywords/suggestions", async (req, res) => {
  try {
    const { keyword } = req.body;
    if (!keyword) return res.status(400).json({ error: "keyword required" });
    const response = await fetch("https://api.dataforseo.com/v3/dataforseo_labs/google/keyword_suggestions/live", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": dfsAuth()
      },
      body: JSON.stringify([{
        keyword,
        location_name: "United States",
        language_name: "English",
        limit: 10
      }]),
    });
    const data = await response.json();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`DropSpy proxy running on port ${PORT}`));
