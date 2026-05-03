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
  let isFake = false;
  let aiTags = [];
  let riskLevel = 'low';
  let riskScore = 0;

  // Description quality boost
  const words = description.toLowerCase().split(/\W+/).filter(w => w.length > 3);
  if (words.length > 5)  confidence = Math.min(1, confidence + 0.04);
  if (words.length > 12) confidence = Math.min(1, confidence + 0.04);

  // Base tags logic
  const baseTags = AI_TAGS[category] || [];
  const descTags = words.filter(w => baseTags.some(t => t.includes(w) || w.includes(t))).slice(0, 2);
  aiTags = [...new Set([...baseTags.slice(0, 2), ...descTags])].slice(0, 5);

  // Gemini Vision Verification if image is provided
  if (process.env.GEMINI_API_KEY && mediaUrls.length > 0) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const response = await fetch(mediaUrls[0]);
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64Data = buffer.toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/jpeg';

        const prompt = `
You are an expert fraud detection AI for a community incident mapping app. 
The user reported a "${category}" incident with this description: "${description}".
Analyze the attached image. Does the image depict an actual scene relevant to the report, or is it a fake, a meme, a stock photo, or completely unrelated?

Respond strictly with JSON:
{
  "is_fake": boolean,
  "confidence_boost": float (between -0.5 and 0.5, positive if it strongly supports the report, negative if suspicious),
  "tags": [string, up to 5 descriptive tags of what is actually in the image]
}
        `;

        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          }
        ]);

        const text = result.response.text();
        const parsed = JSON.parse(text);

        isFake = parsed.is_fake === true;
        confidence = Math.max(0.1, Math.min(1, confidence + (parsed.confidence_boost || 0)));
        if (parsed.tags && parsed.tags.length > 0) {
          aiTags = [...new Set([...aiTags, ...parsed.tags])].slice(0, 6);
        }
      }
    } catch (err) {
      console.error('Vision AI Verification Error:', err);
      confidence = Math.min(1, confidence + 0.08); // Fallback
    }
  } else {
    // Basic media boost if no AI Vision available or no media
    confidence = Math.min(1, confidence + mediaUrls.length * 0.08);
  }

  // Time factor (night incidents slightly higher confidence)
  const hour = timestamp ? new Date(timestamp).getHours() : new Date().getHours();
  if (hour >= 22 || hour <= 5) confidence = Math.min(1, confidence + 0.03);

  // Severity alignment penalty
  const expectedSev = base * 5;
  if (Math.abs(expectedSev - severity) > 2) confidence = Math.max(0.1, confidence - 0.08);

  // Sensitive content detection
  const isSensitive = SENSITIVE_KEYWORDS.some(k => description.toLowerCase().includes(k)) || severity >= 5;

  // Risk score
  riskScore = confidence * 0.55 + (severity / 5) * 0.45;
  riskLevel = riskScore >= 0.70 ? 'high' : riskScore >= 0.40 ? 'medium' : 'low';

  return {
    confidence_score: Math.round(confidence * 100) / 100,
    ai_tags: aiTags,
    risk_level: riskLevel,
    risk_score: Math.round(riskScore * 100) / 100,
    is_sensitive: isSensitive,
    is_fake: isFake,
    verified_at: new Date(),
  };
};

// "Is it safe to go to X?" — AI decision assistant
const assessSafety = async ({ question, lat, lng, recentIncidents = [] }) => {
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
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

// Validates if the text submitted by the user is gibberish or spam
const validateIncidentText = async (category, title, description = '') => {
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
      });

      const prompt = `
You are an AI spam filter for an incident reporting app.
A user reported a "${category}" incident.
Title: "${title}"
Description: "${description}"

Determine if the text provided by the user is complete gibberish (e.g., keyboard mashing like "asdfghjkl"), completely nonsensical/random spam, or if it constitutes a real, meaningful attempt to describe an incident (even if brief or poorly spelled).

Respond strictly with JSON:
{
  "is_spam": boolean,
  "reason": "brief explanation"
}
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = JSON.parse(text);
      return parsed;
    } catch (err) {
      console.error('Text validation AI error:', err);
    }
  }

  // Basic heuristic fallback
  const combined = `${title} ${description}`;
  const hasSpamChars = /(.)\1{5,}/.test(combined);
  const isGibberish = combined.length > 8 && !/[aeiouy]/i.test(combined);

  if (hasSpamChars || isGibberish) {
    return { is_spam: true, reason: 'Text appears to be gibberish or spam.' };
  }
  return { is_spam: false, reason: 'Looks valid' };
};

module.exports = { verifyIncident, assessSafety, validateIncidentText };
