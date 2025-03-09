import React, { useState } from "react";
import axios from "axios";
import "./App.css"; // Import the CSS file

function App() {
  const [city, setCity] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const API_KEY = "ba491a187a72397f5ee8e5f3253ff2e8"; // Replace with your OpenWeatherMap API Key

  const getWeather = async () => {
    try {
      const response = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );
      setWeather(response.data);

      const forecastResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
      );

      // Extract daily data and convert to weekday names
      const filteredForecast = forecastResponse.data.list.filter((_, index) => index % 8 === 0);
      setForecast(
        filteredForecast.map((day) => ({
          day: new Date(day.dt_txt).toLocaleDateString("en-US", { weekday: "short" }), // Mon, Tue, etc.
          temp: day.main.temp,
          description: day.weather[0].description,
        }))
      );
    } catch (error) {
      console.error("Error fetching weather data", error);
      setWeather(null);
      setForecast([]);
    }
  };

  const getWeatherByLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        try {
          const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
          );
          setWeather(response.data);

          const forecastResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
          );

          const filteredForecast = forecastResponse.data.list.filter((_, index) => index % 8 === 0);
          setForecast(
            filteredForecast.map((day) => ({
              day: new Date(day.dt_txt).toLocaleDateString("en-US", { weekday: "short" }), // Mon, Tue, etc.
              temp: day.main.temp,
              description: day.weather[0].description,
            }))
          );
        } catch (error) {
          console.error("Error fetching weather data", error);
          setWeather(null);
          setForecast([]);
        }
      });
    } else {
      alert("Geolocation is not supported by your browser.");
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
        <button onClick={getWeather}>Get Weather</button>
        <button onClick={getWeatherByLocation}>Use My Location</button>
      </div>

      {weather && (
        <div className="weather-info">
          <h3>{weather.name}</h3>
          <p>Temperature: {weather.main.temp}°C</p>
          <p>Weather: {weather.weather[0].description}</p>
        </div>
      )}

      {forecast.length > 0 && (
        <div className="forecast">
          <h3>5-Day Forecast</h3>
          <div className="forecast-container">
            {forecast.map((day, index) => (
              <div key={index} className="forecast-card">
                <p className="day">{day.day}</p>
                <p className="temp">{day.temp}°C</p>
                <p className="desc">{day.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
