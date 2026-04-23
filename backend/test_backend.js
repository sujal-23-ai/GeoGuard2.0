require('dotenv').config();
const axios = require('axios');
const { cacheGet, cacheSet } = require('./src/config/redis');

async function testBackend() {
  // simulate newsController.js logic
  const city = 'your area';
  const lat = 40.7128;
  const lng = -74.0060;
  let resolvedCity = String(city || 'local area').slice(0, 80).replace(/[<>"']/g, '');
    
  if (lat && lng && (!city || city === 'your area' || city === 'local area')) {
    try {
      const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
      const { data: geoData } = await axios.get(geoUrl, {
        headers: { 'User-Agent': 'Geoguard/1.0' },
        timeout: 4000
      });
      resolvedCity = geoData.address?.city || geoData.address?.town || geoData.address?.village || resolvedCity;
      console.log('Geocoded to:', resolvedCity);
    } catch (geocodeErr) {
      console.error('Geocoding error:', geocodeErr.message);
    }
  }
  
  const cacheKey = `news:${resolvedCity.toLowerCase().replace(/\s+/g, '_')}`;
  console.log('Cache key:', cacheKey);

  const query = `${resolvedCity} (safety OR crime OR accident OR emergency OR hazard)`;
  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=10&sortby=publishedAt&apikey=${process.env.GNEWS_API_KEY}`;
  
  console.log('GNews query:', url);
  try {
     const { data } = await axios.get(url, { timeout: 8000 });
     console.log('Result articles:', data.articles.length);
  } catch (e) {
     console.log('GNews error:', e.response?.data || e.message);
  }
}
testBackend();
