const ChatSession = require('../models/chatSession');
const { getRedis } = require('../config/redis');
const { chatWithGemini } = require('../services/gemini.service');

const getRecentMemory = async (userId) => {
  const redis = getRedis();
  const key = `chat:memory:${userId}`;
  if (redis) {
    try {
      const data = await redis.get(key);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Redis error reading memory:', e.message);
    }
  }

  // Fallback to MongoDB
  try {
    const session = await ChatSession.findOne({ user: userId });
    if (session && session.messages.length > 0) {
      const msgs = session.messages.slice(-10).map(m => ({ role: m.role, text: m.text }));
      if (redis) {
        await redis.setEx(key, 3600, JSON.stringify(msgs)); // 1 hour TTL
      }
      return msgs;
    }
  } catch (e) {
    console.error('Mongo error reading memory:', e.message);
  }
  return [];
};

const updateMemory = async (userId, newMessages) => {
  const redis = getRedis();
  const key = `chat:memory:${userId}`;
  
  // Update Mongo
  try {
    let session = await ChatSession.findOne({ user: userId });
    if (!session) {
      session = new ChatSession({ user: userId, messages: [] });
    }
    session.messages.push(...newMessages);
    await session.save();

    // Update Redis with last 10
    if (redis) {
      const recent = session.messages.slice(-10).map(m => ({ role: m.role, text: m.text }));
      await redis.setEx(key, 3600, JSON.stringify(recent));
    }
  } catch (e) {
    console.error('Error updating chat memory:', e.message);
  }
};

const handleMessage = async (req, res) => {
  try {
    const { message, context } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Load recent memory
    const history = await getRecentMemory(userId);

    // Prepare current query
    const userMsg = { role: 'user', text: message };
    const promptHistory = [...history, userMsg];

    // Call Gemini
    const aiResponseText = await chatWithGemini(promptHistory, context);

    // Prepare records for memory
    const userMessageDoc = { role: 'user', text: message, context };
    const aiMessageDoc = { role: 'model', text: aiResponseText };

    // Update memory
    await updateMemory(userId, [userMessageDoc, aiMessageDoc]);

    return res.json({ 
      success: true, 
      reply: aiResponseText 
    });

  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Error processing chat message' });
  }
};

const getHistory = async (req, res) => {
  try {
    const session = await ChatSession.findOne({ user: req.user.id }, { messages: { $slice: -50 } });
    if (!session) {
      return res.json({ messages: [] });
    }
    res.json({ messages: session.messages });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
};

module.exports = {
  handleMessage,
  getHistory
};
