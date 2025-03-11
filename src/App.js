import React, { useState } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);

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

  // Save weather data to backend
  const saveWeather = async () => {
    if (!weather) return alert("No weather data to save!");

    const weatherData = {
      city: weather.name,
      temperature: weather.main.temp,
      humidity: weather.main.humidity,
      condition: weather.weather[0].main, // One-word condition
      wind_speed: weather.wind.speed,
    };

    try {
      await axios.post(`${BACKEND_URL}/saveWeather`, weatherData);
      alert("Weather data saved!");
    } catch (error) {
      console.error("Error saving weather data:", error);
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
      </div>

      {weather && (
        <div className="weather-info">
          <h3>{weather.name}</h3>
          <p>🌡️ Temperature: {weather.main.temp}°C</p>
          <p>💧 Humidity: {weather.main.humidity}%</p>
          <p>🌥️ Weather: {weather.weather[0].main}</p>
          <p>💨 Wind Speed: {weather.wind.speed} m/s</p>
          <button onClick={saveWeather}>Save Data</button>
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
