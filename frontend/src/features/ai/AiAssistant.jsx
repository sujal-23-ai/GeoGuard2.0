import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Brain, Send, MapPin, Loader, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import Button from '../../components/ui/Button';
import useAppStore from '../../store/useAppStore';
import axios from 'axios';

const SUGGESTED = [
  'Is it safe to go downtown right now?',
  'Any incidents near me?',
  'Best route to avoid danger?',
  'What should I do in an emergency?',
];

export default function AiAssistant({ open, onClose }) {
  const { userLocation, token } = useAppStore();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false); // default muted
  const [micSupported, setMicSupported] = useState(true);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Preload voices
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.getVoices();
    }
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load history
  useEffect(() => {
    if (open && token) {
      loadHistory();
    }
  }, [open, token]);

  const loadHistory = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data } = await axios.get(`${apiUrl}/api/chat/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages.map((m, i) => ({
          id: Date.now() - i,
          type: m.role === 'user' ? 'user' : 'ai',
          text: m.text
        })));
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }
  };

  // Speech Recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setQuery(finalTranscript);
          ask(finalTranscript); // Auto send when the phrase is complete
          try { recognitionRef.current.stop(); } catch (e) {}
        } else if (interimTranscript) {
          setQuery(interimTranscript); // Show live transcription in the input box
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = (e) => {
        console.error('Speech recognition error:', e.error);
        setIsListening(false);
        if (e.error === 'network') {
          alert("Speech Recognition failed: Network error. If you are using Chromium/Brave on Linux, your browser does not have access to the Google Speech API. Please type your message instead, or use Google Chrome/Edge.");
        } else if (e.error === 'not-allowed') {
          alert("Microphone access was denied. Please allow microphone permissions in your browser settings.");
        } else if (e.error === 'no-speech') {
          // just silently stop listening
        }
      };
    } else {
      setMicSupported(false);
    }
  }, []);

  const toggleListen = () => {
    if (!micSupported || !recognitionRef.current) {
      alert("Microphone is not natively supported in this browser. Please type your message instead.");
      return;
    }
    if (isListening) {
      try { recognitionRef.current.stop(); } catch (e) {}
      setIsListening(false);
    } else {
      setQuery('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.error("Mic start failed", e);
        setIsListening(false);
      }
    }
  };

  const speak = (text) => {
    if (!isVoiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Find a girl assistant voice
    const voices = window.speechSynthesis.getVoices();
    const femaleVoice = voices.find(v => 
      v.name.includes('Female') || 
      v.name.includes('Samantha') || 
      v.name.includes('Zira') || 
      v.name.includes('Victoria') ||
      (v.name.includes('Google') && v.name.includes('English'))
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    // Adjust pitch to sound slightly softer/more natural if default
    utterance.pitch = 1.1;
    
    window.speechSynthesis.speak(utterance);
  };

  const ask = async (q = query) => {
    if (!q.trim()) return;
    
    const userMsg = { id: Date.now(), type: 'user', text: q };
    setMessages(prev => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      // Build context string from current window URL
      const currentUrl = window.location.pathname;
      const context = `User is on URL: ${currentUrl}. User location: ${userLocation ? JSON.stringify(userLocation) : 'unknown'}`;

      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const { data } = await axios.post(`${apiUrl}/api/chat/message`, 
        { message: q, context },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const aiMsg = { id: Date.now() + 1, type: 'ai', text: data.reply };
      setMessages(prev => [...prev, aiMsg]);
      speak(data.reply);
      
    } catch (e) {
      const errText = 'Sorry, the AI service is currently unavailable.';
      setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', text: errText }]);
      speak(errText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.5 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
          >
            <div className="w-full max-w-md bg-surface/98 backdrop-blur-2xl border border-white/12 rounded-3xl shadow-card overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/8 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Brain className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-sm">GeoGuard Assistant</h2>
                    <p className="text-white/40 text-xs">AI-powered safety copilot</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => setIsVoiceEnabled(!isVoiceEnabled)} className="text-white/40 hover:text-white transition-colors" title={isVoiceEnabled ? 'Mute AI voice' : 'Enable AI voice'}>
                    {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat History */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
                {messages.length === 0 && !loading && (
                  <div className="space-y-4 mt-2">
                    <div className="flex items-center gap-2 text-white/40 text-xs bg-white/5 p-3 rounded-xl">
                      <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>
                        {userLocation
                          ? `Location: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                          : 'Default location (enable GPS for accuracy)'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="micro-label">SUGGESTED QUESTIONS</p>
                      <div className="flex flex-col gap-2">
                        {SUGGESTED.map((s) => (
                          <button
                            key={s}
                            onClick={() => { ask(s); }}
                            className="text-sm px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-left flex items-center justify-between group"
                          >
                            {s}
                            <Send className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`text-sm px-4 py-3 max-w-[85%] border leading-relaxed ${
                      msg.type === 'user' 
                        ? 'bg-primary/20 text-white rounded-2xl rounded-tr-sm border-primary/20' 
                        : 'bg-white/5 text-white/90 rounded-2xl rounded-tl-sm border-white/10'
                    }`}>
                      {/* Using dangerouslySetInnerHTML to allow basic markdown if returned by Gemini (or just text rendering) */}
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 text-white/60 text-sm px-4 py-3 rounded-2xl rounded-tl-sm max-w-[85%] border border-white/10 flex items-center gap-2">
                      <Loader className="w-4 h-4 text-primary animate-spin" />
                      Thinking...
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Query input */}
              <div className="p-4 shrink-0 border-t border-white/10 bg-surface/98">
                <div className="flex gap-2">
                  <button 
                    onClick={toggleListen}
                    className={`w-10 h-10 flex shrink-0 items-center justify-center rounded-xl transition-colors ${
                      isListening ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white/40 hover:text-white/80 border border-white/10'
                    }`}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && ask()}
                    placeholder={isListening ? "Listening..." : "Ask about safety or routes..."}
                    className="input-glass text-sm flex-1"
                  />
                  <Button onClick={() => ask()} disabled={loading || !query.trim()} size="md" className="px-4">
                    {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
