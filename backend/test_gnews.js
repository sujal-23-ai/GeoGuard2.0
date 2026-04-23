require('dotenv').config();
const axios = require('axios');
async function test() {
  try {
    const q = "New York OR safety OR crime OR accident OR emergency OR hazard";
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(q)}&lang=en&max=10&sortby=publishedAt&apikey=${process.env.GNEWS_API_KEY}`;
    const { data } = await axios.get(url);
    console.log("Response:", data);
  } catch(e) {
    console.error("Error:", e.response?.data || e.message);
  }
}
test();
