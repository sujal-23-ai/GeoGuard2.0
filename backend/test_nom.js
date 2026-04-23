const axios = require('axios');
async function test() {
  const lat = 40.7128;
  const lng = -74.0060;
  const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`;
  try {
    const { data } = await axios.get(geoUrl, {
      headers: { 'User-Agent': 'Geoguard/1.0' },
      timeout: 4000
    });
    console.log("Success:", data.address);
  } catch(e) {
    console.log("Error:", e.message);
  }
}
test();
