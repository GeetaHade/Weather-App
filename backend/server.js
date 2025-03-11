const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
const PORT = 5001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite Database
const db = new sqlite3.Database("./weather.db", (err) => {
  if (err) console.error("Error opening database:", err.message);
  else {
    db.run(
      `CREATE TABLE IF NOT EXISTS weather (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        city TEXT,
        temperature REAL,
        humidity INTEGER,
        condition TEXT,
        wind_speed REAL,
        date TEXT
      )`,
      (err) => {
        if (err) console.error("Error creating table:", err.message);
      }
    );
  }
});

// Route to Save Weather Data
app.post("/saveWeather", (req, res) => {
  const { city, temperature, humidity, condition, wind_speed } = req.body;
  const date = new Date().toISOString();

  db.run(
    `INSERT INTO weather (city, temperature, humidity, condition, wind_speed, date)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [city, temperature, humidity, condition, wind_speed, date],
    function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json({ message: "Weather data saved", id: this.lastID });
      }
    }
  );
});

// Route to Fetch Saved Weather Data
app.get("/getWeather", (req, res) => {
  db.all("SELECT * FROM weather ORDER BY date DESC", [], (err, rows) => {
    if (err) res.status(500).json({ error: err.message });
    else res.json(rows);
  });
});

// Start Server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
