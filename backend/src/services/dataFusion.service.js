const axios = require('axios');

const withTimeout = (promise, ms = 4000) =>
  Promise.race([promise, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);

const getWeather = async (lat, lng) => {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return { available: false };
  try {
    const { data } = await withTimeout(
      axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
        params: { lat, lon: lng, appid: key, units: 'metric' },
      })
    );
    const cond = data.weather[0].main;
    const riskMap = { Thunderstorm: 0.35, Tornado: 0.45, Snow: 0.20, Rain: 0.12, Drizzle: 0.08, Fog: 0.10 };
    return {
      available: true,
      temp: Math.round(data.main.temp),
      description: data.weather[0].description,
      condition: cond,
      windSpeed: data.wind.speed,
      riskFactor: riskMap[cond] || 0,
    };
  } catch {
    return { available: false };
  }
};

const getTraffic = (lat, lng) => {
  // Simulated — replace with TomTom/HERE API in production
  const hour = new Date().getHours();
  const isPeak  = (hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 19);
  const isNight = hour >= 22 || hour <= 5;
  return {
    available: true,
    congestion: isPeak ? 'high' : isNight ? 'low' : 'medium',
    riskFactor: isPeak ? 0.20 : isNight ? 0.08 : 0.05,
    label: isPeak ? 'Peak traffic' : isNight ? 'Low traffic' : 'Normal traffic',
  };
};

const getZoneRisk = async ({ lat, lng, recentIncidentCount = 0, avgSeverity = 2 }) => {
  const [weather, traffic] = await Promise.all([
    getWeather(lat, lng),
    Promise.resolve(getTraffic(lat, lng)),
  ]);

  const incidentFactor = Math.min(0.45, (recentIncidentCount / 20) * 0.45);
  const severityFactor = (avgSeverity / 5) * 0.30;
  const weatherFactor  = weather.available ? weather.riskFactor : 0;
  const trafficFactor  = traffic.riskFactor;

  const zoneRisk = Math.min(100, Math.round(
    (incidentFactor + severityFactor + weatherFactor + trafficFactor) * 100
  ));

  const factors = [];
  if (weather.available && weatherFactor > 0) factors.push(weather.description);
  if (trafficFactor > 0.10) factors.push(traffic.label);
  if (recentIncidentCount > 5) factors.push(`${recentIncidentCount} recent incidents`);

  return {
    zone_risk: zoneRisk,
    factors,
    weather: weather.available
      ? { temp: weather.temp, condition: weather.condition, description: weather.description }
      : null,
    traffic: { congestion: traffic.congestion },
    generated_at: new Date(),
  };
};

module.exports = { getZoneRisk, getWeather, getTraffic };
