const axios = require('axios');
const { cacheGet, cacheSet } = require('../config/redis');

const DEMO_ARTICLES = [
  {
    title: 'City Increases Police Patrols in Downtown After Weekend Incidents',
    description: 'Local authorities announced increased patrols following multiple reports of theft and vandalism in the central district over the past 72 hours.',
    url: '#',
    source: 'City Safety Report',
    publishedAt: new Date(Date.now() - 1.5 * 3600000).toISOString(),
    image: null,
    category: 'crime',
  },
  {
    title: 'Flash Flood Warning Issued for Low-Lying Areas This Week',
    description: 'Meteorologists issued a flash flood watch through Thursday evening. Residents near river banks and drainage channels should remain alert and avoid flooded roads.',
    url: '#',
    source: 'Weather Bureau',
    publishedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
    image: null,
    category: 'weather',
  },
  {
    title: 'Multi-Vehicle Accident on Highway 7 Causes Major Delays',
    description: 'Emergency services responded to a five-car pile-up on Highway 7 northbound near Exit 14. Two lanes remain closed; expect delays of 45+ minutes.',
    url: '#',
    source: 'Traffic Alert Network',
    publishedAt: new Date(Date.now() - 4.5 * 3600000).toISOString(),
    image: null,
    category: 'accident',
  },
  {
    title: 'Power Outage Affecting 3,000 Homes in East District',
    description: 'Utility crews are working to restore power following transformer damage from last night\'s storm. Estimated restoration time is 6 hours.',
    url: '#',
    source: 'Utility Network News',
    publishedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
    image: null,
    category: 'infrastructure',
  },
  {
    title: 'New Street Lighting Installed in High-Incident Zones',
    description: 'The city completed installation of 120 new LED street lights in areas flagged as high-incident zones, reducing nighttime crime by an estimated 18%.',
    url: '#',
    source: 'City Council Update',
    publishedAt: new Date(Date.now() - 10 * 3600000).toISOString(),
    image: null,
    category: 'community',
  },
  {
    title: 'Community Safety Forum Draws Record 400-Person Attendance',
    description: 'Residents gathered to discuss crime prevention strategies and neighborhood watch coordination with local law enforcement officials.',
    url: '#',
    source: 'Community Press',
    publishedAt: new Date(Date.now() - 14 * 3600000).toISOString(),
    image: null,
    category: 'community',
  },
];

const assignCategory = (title, description) => {
  const text = (title + ' ' + description).toLowerCase();
  if (text.match(/police|crime|theft|robbery|murder|assault|vandalism|shooting|arrest/)) return 'crime';
  if (text.match(/weather|storm|flood|rain|hurricane|tornado|snow|wind|alert/)) return 'weather';
  if (text.match(/accident|crash|collision|pile-up|traffic|road|highway/)) return 'accident';
  if (text.match(/infrastructure|power|water|outage|utility|construction|repair/)) return 'infrastructure';
  if (text.match(/community|forum|council|public|meeting|event|neighborhood/)) return 'community';
  return 'general';
};

const getNews = async (req, res) => {
  let resolvedCity = 'local area';
  try {
    let { city, lat, lng } = req.query;
    
    // Resolve location
    if (city) resolvedCity = String(city).slice(0, 80).replace(/[<>"']/g, '');
    
    if (lat && lng && (!city || city === 'your area' || city === 'local area')) {
      try {
        const geoUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
        const { data: geoData } = await axios.get(geoUrl, {
          headers: { 'User-Agent': 'Geoguard/1.0' },
          timeout: 4000
        });
        resolvedCity = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || geoData.address?.state_district || resolvedCity;
      } catch (geocodeErr) {
        console.error('Geocoding error:', geocodeErr.message);
      }
    }

    const cacheKey = `news:${resolvedCity.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json({ articles: cached, source: 'cache', resolvedCity });

    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey) return res.json({ articles: DEMO_ARTICLES, source: 'demo', resolvedCity });

    const query = `${resolvedCity} (safety OR crime OR accident OR emergency OR hazard)`;
    const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=10&sortby=publishedAt&apikey=${apiKey}`;
    const { data } = await axios.get(url, { timeout: 8000 });

    const articles = (data.articles || []).map((a) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      source: a.source?.name || 'News',
      publishedAt: a.publishedAt,
      image: a.image || null,
      category: assignCategory(a.title, a.description || ''),
    }));

    // Only fallback to demo if it's 'local area' literally and we got 0 articles,
    // otherwise if we searched a specific resolved city and got 0, return 0.
    const isFallback = articles.length === 0 && (resolvedCity === 'local area' || resolvedCity === 'your area');
    const result = isFallback ? DEMO_ARTICLES : articles;
    const source = isFallback ? 'demo' : 'gnews';
    
    if (articles.length) await cacheSet(cacheKey, result, 900);
    res.json({ articles: result, source, resolvedCity });
  } catch (err) {
    console.error('News fetch error:', err.message);
    res.json({ articles: DEMO_ARTICLES, source: 'demo', resolvedCity });
  }
};

module.exports = { getNews };
