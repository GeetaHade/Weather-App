import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [savedWeather, setSavedWeather] = useState(null); // Added state for saved weather data
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const API_KEY = "ba491a187a72397f5ee8e5f3253ff2e8"; // Replace with your API Key
  const BACKEND_URL = "http://localhost:5001"; // Backend Server URL

  // Function to get weather for city or geolocation
  const getWeather = async (city, lat = null, lon = null) => {
    try {
      let weatherResponse;
      let forecastResponse;

      if (city) {
        // If city is provided, fetch weather based on city name
        weatherResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
        );
        forecastResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );
      } else if (lat && lon) {
        // If latitude and longitude are provided, fetch weather based on coordinates
        weatherResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        forecastResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
      }

      setWeather(weatherResponse.data);
      setForecast(forecastResponse.data);
    } catch (error) {
      console.error("Error fetching weather data", error);
      setWeather(null);
      setForecast(null);
    }
  };

  // Get the user's current location and fetch weather based on it
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          console.log(`Latitude: ${lat}, Longitude: ${lon}`);

          // Fetch weather for the current location
          getWeather("", lat, lon); // Call with empty city and lat/lon
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Unable to retrieve your location.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Validate date range
  const isDateRangeValid = () => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return start <= end;
  };

  // Fetch weather data for a date range
  const fetchWeatherDataForRange = async () => {
    if (!isDateRangeValid()) {
      alert("Start date must be before end date.");
      return;
    }

    const weatherDataForRange = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    let currentDate = start;

    // Loop over the date range and fetch weather data for each date
    while (currentDate <= end) {
      const formattedDate = currentDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD
      try {
        let weatherResponse;
        let forecastResponse;

        if (city) {
          weatherResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
          );
          forecastResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
          );
        }

        const forecastForDay = forecastResponse.data.list.find((entry) =>
          entry.dt_txt.startsWith(formattedDate)
        );

        if (forecastForDay) {
          const weatherData = {
            temperature: forecastForDay.main.temp,
            humidity: forecastForDay.main.humidity,
            condition: forecastForDay.weather[0].main,
            wind_speed: forecastForDay.wind.speed,
            date: formattedDate,
          };
          weatherDataForRange.push(weatherData);
        }

        // Move to the next date
        currentDate.setDate(currentDate.getDate() + 1);
      } catch (error) {
        console.error("Error fetching weather data for date:", currentDate, error);
      }
    }

    if (weatherDataForRange.length > 0) {
      // Save weather data to the backend
      try {
        await axios.post(`${BACKEND_URL}/saveWeatherRange`, {
          city: city,
          weatherData: weatherDataForRange,
        });
        alert("Weather data saved for the selected range!");
      } catch (error) {
        console.error("Error saving weather data:", error);
      }
    }
  };

  // Fetch saved weather data from the database for the entered city
  const fetchSavedWeatherData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/getWeatherByCity`, {
        params: { city: city },
      });
      if (response.data.length > 0) {
        setSavedWeather(response.data);
      } else {
        alert("No weather data found for the entered city in the database.");
        setSavedWeather(null);
      }
    } catch (error) {
      console.error("Error fetching saved weather data:", error);
    }
  };

  return (
    <div className="app">
      <h2>Weather App</h2>
      <div className="search-container">
        <input
          type="text"
          placeholder="Enter city name"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <button onClick={() => getWeather(city)}>Get Weather</button>
        <button onClick={getLocation}>Get Location</button> {/* Get Location Button */}
        <button onClick={fetchSavedWeatherData}>Fetch Saved Weather Data</button> {/* Fetch Saved Data Button */}
      </div>

      {/* Date Range Selection */}
      <div className="date-range-container">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <button onClick={fetchWeatherDataForRange}>Fetch Weather for Range</button>
      </div>

      {weather && (
        <div className="weather-info">
          <h3>{weather.name}</h3>
          <p>🌡️ Temperature: {weather.main.temp}°C</p>
          <p>💧 Humidity: {weather.main.humidity}%</p>
          <p>🌥️ Weather: {weather.weather[0].main}</p>
          <p>💨 Wind Speed: {weather.wind.speed} m/s</p>
        </div>
      )}

      {savedWeather && (
        <div className="saved-weather">
          <h3>Saved Weather Data</h3>
          <table className="weather-table">
            <thead>
              <tr>
                <th>City</th>
                <th>Date</th>
                <th>Temperature (°C)</th>
                <th>Humidity (%)</th>
                <th>Condition</th>
                <th>Wind Speed (m/s)</th>
              </tr>
            </thead>
            <tbody>
              {savedWeather.map((entry, index) => (
                <tr key={index}>
                  <td>{entry.city}</td>
                  <td>{new Date(entry.date).toLocaleDateString()}</td>
                  <td>{entry.temperature}°C</td>
                  <td>{entry.humidity}%</td>
                  <td>{entry.condition}</td>
                  <td>{entry.wind_speed} m/s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {forecast && (
        <div className="forecast">
          <h3>5-Day Forecast</h3>
          <div className="forecast-container">
            {forecast.list
              .filter((entry, index) => index % 8 === 0) // Get one entry per day
              .map((entry, index) => (
                <div key={index} className="forecast-card">
                  <p className="day">{new Date(entry.dt_txt).toLocaleDateString()}</p>
                  <p className="temp">🌡️ {entry.main.temp}°C</p>
                  <p className="desc">🌥️ {entry.weather[0].main}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
