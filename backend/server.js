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
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
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

// Route to Save Weather Data for a Date Range
app.post("/saveWeatherRange", (req, res) => {
  const { city, weatherData } = req.body;

  if (!weatherData || weatherData.length === 0) {
    return res.status(400).json({ error: "No weather data provided" });
  }

  const insertWeather = `
    INSERT INTO weather (city, temperature, humidity, condition, wind_speed, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  // Use a transaction to insert all weather data at once
  db.serialize(() => {
    const stmt = db.prepare(insertWeather);

    weatherData.forEach((entry) => {
      const { temperature, humidity, condition, wind_speed, date } = entry;
      stmt.run(city, temperature, humidity, condition, wind_speed, date); // Store the correct date
    });

    stmt.finalize((err) => {
      if (err) {
        console.error("Error saving data:", err.message);
        return res.status(500).json({ error: "Error saving weather data" });
      }
      res.json({ message: "Weather data saved for range successfully" });
    });
  });
});

// Route to Fetch Weather Data for a Date Range
app.get("/getWeatherRange", (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: "Please provide both startDate and endDate" });
  }

  const query = `
    SELECT * FROM weather
    WHERE date BETWEEN ? AND ?
    ORDER BY date DESC
  `;

  db.all(query, [startDate, endDate], (err, rows) => {
    if (err) {
      console.error("Error fetching weather data:", err.message);
      return res.status(500).json({ error: "Error fetching weather data" });
    }
    res.json(rows);
  });
});

// Route to Fetch Saved Weather Data for a City
app.get("/getWeatherByCity", (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: "Please provide a city" });
  }

  const query = `
    SELECT * FROM weather
    WHERE city = ?
    ORDER BY date DESC
  `;

  db.all(query, [city], (err, rows) => {
    if (err) {
      console.error("Error fetching weather data:", err.message);
      return res.status(500).json({ error: "Error fetching weather data" });
    }
    res.json(rows);
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
