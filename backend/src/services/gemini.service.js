const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const SYSTEM_PROMPT = `
You are GeoGuard Assistant, an expert AI assistant for the GeoGuard platform.
GeoGuard is a real-time safety intelligence platform focusing on:
- Live incident reporting
- Map-based safety awareness
- Safe routing (avoiding danger zones)
- SOS alerts to nearby users and emergency contacts
- Admin tools for moderation
- Safety news

Guidelines:
1. Use only the relevant context provided.
2. Be concise, helpful, and practical. Keep responses short.
3. Ask a clarifying question only if needed.
4. If the user asks about safety, route, reporting, or SOS, respond with actionable guidance.
5. Never invent real-time incident data. If data is missing or you don't know, say so clearly.
6. Adapt your response based on the "Current Page Context" if provided.
7. If the user asks something unrelated to safety or GeoGuard, answer briefly but redirect them back to GeoGuard features.
`;

const chatWithGemini = async (messages, userContext = '') => {
  if (!genAI) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Format messages for Gemini
  // Gemini expects: { role: 'user' | 'model', parts: [{ text: '...' }] }
  const formattedHistory = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Start chat session
  const chat = model.startChat({
    history: formattedHistory.slice(0, -1), // all except the last one
    systemInstruction: {
      role: 'system',
      parts: [{ text: SYSTEM_PROMPT }]
    }
  });

  const latestMessage = formattedHistory[formattedHistory.length - 1];
  
  const prompt = userContext 
    ? `[Current Page Context: ${userContext}]\n\n${latestMessage.parts[0].text}`
    : latestMessage.parts[0].text;

  const result = await chat.sendMessage(prompt);
  return result.response.text();
};

module.exports = {
  chatWithGemini,
};
