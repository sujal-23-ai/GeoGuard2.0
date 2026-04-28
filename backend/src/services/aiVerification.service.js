// Simulated AI incident verification service
// Replace keyword logic with a real model call in production
const { GoogleGenerativeAI } = require('@google/generative-ai');

const RISK_WEIGHTS = {
  fire: 0.92, crime: 0.85, medical: 0.82, accident: 0.78,
  hazard: 0.70, weather: 0.60, infrastructure: 0.50,
  traffic: 0.40, noise: 0.22, other: 0.30,
};

const AI_TAGS = {
  fire:           ['fire', 'smoke', 'flames', 'burning', 'evacuation'],
  crime:          ['theft', 'assault', 'suspicious', 'police', 'weapon'],
  medical:        ['injury', 'ambulance', 'hospital', 'unconscious', 'bleeding'],
  accident:       ['collision', 'crash', 'vehicle', 'emergency', 'wreck'],
  hazard:         ['danger', 'obstacle', 'unstable', 'falling', 'leak'],
  weather:        ['storm', 'flood', 'ice', 'wind', 'lightning', 'rain'],
  infrastructure: ['power', 'outage', 'road', 'construction', 'utility'],
  traffic:        ['congestion', 'jam', 'blocked', 'detour', 'accident'],
  noise:          ['loud', 'disturbance', 'party', 'noise', 'alarm'],
  other:          ['alert', 'notice', 'warning', 'unknown'],
};

const SENSITIVE_KEYWORDS = [
  'blood', 'body', 'dead', 'death', 'violent', 'graphic',
  'gore', 'explicit', 'weapon', 'gun', 'knife',
];

const verifyIncident = async ({ category, description = '', severity, mediaUrls = [], timestamp, location }) => {
  const base = RISK_WEIGHTS[category] || 0.50;
  let confidence = base;

  // Description quality boost
  const words = description.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  if (words.length > 5)  confidence = Math.min(1, confidence + 0.04);
  if (words.length > 12) confidence = Math.min(1, confidence + 0.04);

  // Media evidence boost
  confidence = Math.min(1, confidence + mediaUrls.length * 0.08);

  // Time factor (night incidents slightly higher confidence)
  const hour = timestamp ? new Date(timestamp).getHours() : new Date().getHours();
  if (hour >= 22 || hour <= 5) confidence = Math.min(1, confidence + 0.03);

  // Severity alignment penalty
  const expectedSev = base * 5;
  if (Math.abs(expectedSev - severity) > 2) confidence = Math.max(0.1, confidence - 0.08);

  // AI tags from category + description
  const baseTags = AI_TAGS[category] || [];
  const descTags = words.filter(w => baseTags.some(t => t.includes(w) || w.includes(t))).slice(0, 2);
  const aiTags = [...new Set([...baseTags.slice(0, 2), ...descTags])].slice(0, 5);

  // Sensitive content detection
  const isSensitive = SENSITIVE_KEYWORDS.some(k => description.toLowerCase().includes(k))
    || severity >= 5;

  // Risk score
  const riskScore = confidence * 0.55 + (severity / 5) * 0.45;
  const riskLevel = riskScore >= 0.70 ? 'high' : riskScore >= 0.40 ? 'medium' : 'low';

  return {
    confidence_score: Math.round(confidence * 100) / 100,
    ai_tags: aiTags,
    risk_level: riskLevel,
    risk_score: Math.round(riskScore * 100) / 100,
    is_sensitive: isSensitive,
    verified_at: new Date(),
  };
};

// "Is it safe to go to X?" — AI decision assistant
const assessSafety = async ({ question, lat, lng, recentIncidents = [] }) => {
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });
      
      const prompt = `
You are an AI Safety Assistant for a real-time incident mapping application.
The user asks: "${question}"
Location: Latitude ${lat}, Longitude ${lng}
Recent incidents nearby (within 3km last 24h):
${JSON.stringify(recentIncidents, null, 2)}

Analyze the risk based on the incidents and the user's question. 
Respond ONLY with a JSON object with the following strictly formatted keys:
- "risk_level": string, exactly one of "low", "medium", or "high"
- "risk_score": integer from 0 to 100
- "message": a brief explanation string (include an emoji at the start like ⚠️, 🟡, or ✅)
- "main_concern": string denoting the primary incident category (e.g., "traffic", "fire", "crime"), or null if mostly safe
- "incident_count": integer, the total number of nearby incidents
- "recommendation": short string advising the user what to do
`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      const parsed = JSON.parse(text);
      
      return {
        risk_level: parsed.risk_level || 'low',
        risk_score: parsed.risk_score || 0,
        message: parsed.message || 'Analysis complete.',
        main_concern: parsed.main_concern || null,
        incident_count: parsed.incident_count || recentIncidents.length,
        recommendation: parsed.recommendation || 'Stay alert',
        generated_at: new Date()
      };
    } catch (err) {
      console.error("Gemini API Error, falling back to basic logic:", err);
    }
  }

  // Fallback logic
  const severe = recentIncidents.filter(i => i.severity >= 4).length;
  const moderate = recentIncidents.filter(i => i.severity === 3).length;
  const total = recentIncidents.length;

  let riskScore = Math.min(1, (severe * 0.15 + moderate * 0.05 + total * 0.02));
  const riskLevel = riskScore >= 0.6 ? 'high' : riskScore >= 0.3 ? 'medium' : 'low';

  const topCategories = recentIncidents
    .reduce((acc, i) => { acc[i.category] = (acc[i.category] || 0) + 1; return acc; }, {});
  const mainRisk = Object.entries(topCategories).sort((a, b) => b[1] - a[1])[0]?.[0];

  const messages = {
    high: `⚠️ High risk area — ${severe} severe incidents nearby. Recommend alternative route.`,
    medium: `🟡 Moderate risk — ${total} incidents in the area. Exercise caution.`,
    low: `✅ Area looks clear — only ${total} minor reports nearby. Safe to proceed.`,
  };

  return {
    risk_level: riskLevel,
    risk_score: Math.round(riskScore * 100),
    message: messages[riskLevel],
    main_concern: mainRisk || null,
    incident_count: total,
    recommendation: riskLevel === 'high'
      ? 'Take an alternative route or delay your trip'
      : riskLevel === 'medium'
      ? 'Proceed with caution and stay alert'
      : 'Safe to proceed normally',
    generated_at: new Date(),
  };
};

module.exports = { verifyIncident, assessSafety };
