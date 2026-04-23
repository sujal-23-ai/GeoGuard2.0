const axios = require('axios');
async function test() {
  const lat = 19.0760; // Delhi/Mumbai?
  const lng = 72.8777; // Mumbai
  const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
  try {
    const { data } = await axios.get(geoUrl, {
      headers: { 'User-Agent': 'Geoguard/1.0' }
    });
    console.log("Success:", data.address);
  } catch(e) {}
}
test();
