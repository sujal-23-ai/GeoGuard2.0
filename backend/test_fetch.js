require('dotenv').config();
const axios = require('axios');
async function run() {
  try {
     const { data } = await axios.get("http://localhost:5000/api/news?city=your%20area&lat=40.712&lng=-74.00");
     console.log("Returned source:", data.source, "resolvedCity:", data.resolvedCity, "count:", data.articles.length);
  } catch(e) {
     console.log(e.message);
  }
}
run();
