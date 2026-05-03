import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, MapPin, ChevronRight, Check, Mic, MicOff, Image, Video, Trash2, RotateCcw } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { useCreateIncident } from '../../hooks/useIncidents';
import { INCIDENT_CATEGORIES } from '../../utils/constants';
import Button from '../../components/ui/Button';
import { getSeverityColor } from '../../utils/helpers';
import axios from 'axios';

const SEVERITY_DESCS = ['Minor nuisance', 'Low concern', 'Moderate risk', 'High danger', 'Critical emergency'];
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ── Voice reporter ─────────────────────────────────────── */
function VoiceButton({ onTranscript }) {
  const [listening, setListening] = useState(false);
  const recogRef = useRef(null);

  const toggle = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition not supported in this browser'); return; }

    if (listening) {
      recogRef.current?.stop();
      setListening(false);
      return;
    }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      onTranscript(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);

    recogRef.current = rec;
    rec.start();
    setListening(true);
  }, [listening, onTranscript]);

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.92 }}
      onClick={toggle}
      title={listening ? 'Stop recording' : 'Report by voice'}
      className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all border
        ${listening
          ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
          : 'bg-white/5 border-white/15 text-white/50 hover:text-white hover:bg-white/10'
        }`}
    >
      {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </motion.button>
  );
}

/* ── Media upload dropzone ──────────────────────────────── */
function MediaUploader({ mediaMeta, setMediaMeta, uploading, setUploading }) {
  const inputRef = useRef(null);

  const uploadFiles = async (files) => {
    if (!files.length) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach(f => fd.append('files', f));
      const { data } = await axios.post(`${API}/api/media/upload`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setMediaMeta(prev => [...prev, ...data.urls]);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    uploadFiles(e.dataTransfer.files);
  };

  const remove = (i) => setMediaMeta(prev => prev.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <label className="text-xs text-white/50 block">Media (photos / videos)</label>

      {/* Drop zone */}
      {mediaMeta.length < 5 && (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-white/15 rounded-xl p-4 text-center cursor-pointer
                     hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-white/50 text-xs">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Uploading...
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-white/40 text-xs">
              <Upload className="w-4 h-4" />
              Drop files or click — images & videos up to 25MB
            </div>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={(e) => uploadFiles(e.target.files)}
          />
        </div>
      )}

      {/* Preview grid */}
      {mediaMeta.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {mediaMeta.map((m, i) => (
            <div key={i} className="relative rounded-xl overflow-hidden aspect-square bg-white/5 group">
              {m.type === 'video' ? (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <Video className="w-6 h-6 text-white/40" />
                </div>
              ) : (
                <img
                  src={m.thumbnail || m.url}
                  alt="preview"
                  className={`w-full h-full object-cover ${m.isSensitive ? 'blur-md' : ''}`}
                />
              )}
              {m.isSensitive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] text-red-300 bg-red-500/20 px-1.5 py-0.5 rounded">SENSITIVE</span>
                </div>
              )}
              <button
                onClick={() => remove(i)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center
                           opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              {m.fallback && (
                <div className="absolute bottom-0 inset-x-0 bg-amber-500/20 text-amber-300 text-[8px] text-center py-0.5">
                  DEMO
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main panel ─────────────────────────────────────────── */
export default function ReportPanel() {
  const { reportPanelOpen, setReportPanelOpen, userLocation, isAuthenticated, pickingLocation, setPickingLocation, reportLocation, setReportLocation } = useAppStore();
  const createMutation = useCreateIncident();

  const [step,       setStep]       = useState(1);
  const [mediaMeta,  setMediaMeta]  = useState([]);
  const [uploading,  setUploading]  = useState(false);
  const [submitted,  setSubmitted]  = useState(false);
  const [undoTimer,  setUndoTimer]  = useState(null);
  const [undoVisible, setUndoVisible] = useState(false);
  const lastIncidentRef = useRef(null);

  const [form, setForm] = useState({
    category: '', title: '', description: '', severity: 3, address: '', city: '',
  });

  const close = () => {
    if (undoTimer) clearTimeout(undoTimer);
    setReportPanelOpen(false);
    setPickingLocation(false);
    setReportLocation(null);
    setStep(1);
    setForm({ category: '', title: '', description: '', severity: 3, address: '', city: '' });
    setMediaMeta([]);
    setSubmitted(false);
    setUndoVisible(false);
  };

  const reverseGeocode = async (lng, lat) => {
    const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'pk.demo') return;
    try {
      const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}&types=address,poi`);
      const data = await res.json();
      if (data.features?.length > 0) {
        const place = data.features[0];
        setForm(f => ({
          ...f,
          address: place.place_name.split(',')[0],
          city: place.context?.find(c => c.id.startsWith('place'))?.text || f.city
        }));
      }
    } catch (e) { console.error(e); }
  };

  // When panel opens, set initial location
  useEffect(() => {
    if (reportPanelOpen && userLocation && !reportLocation) {
      setReportLocation(userLocation);
      reverseGeocode(userLocation.lng, userLocation.lat);
    }
  }, [reportPanelOpen, userLocation, reportLocation, setReportLocation]);

  // When reportLocation changes, update address
  useEffect(() => {
    if (reportLocation && pickingLocation) {
      reverseGeocode(reportLocation.lng, reportLocation.lat);
    }
  }, [reportLocation]);

  const handleVoiceTranscript = (text) => {
    setForm(f => ({
      ...f,
      title: f.title || text.slice(0, 100),
      description: f.description ? `${f.description} ${text}` : text,
    }));
  };

  const handleSubmit = async () => {
    if (!form.category || !form.title) return;
    const loc = reportLocation || userLocation || { lng: -74.006, lat: 40.7128 };
    try {
      const incident = await createMutation.mutateAsync({
        ...form,
        lng: loc.lng,
        lat: loc.lat,
        mediaUrls: mediaMeta.map(m => m.url),
        mediaMeta,
      });
      lastIncidentRef.current = incident;
      setSubmitted(true);
      setUndoVisible(true);

      // Undo window: 8 seconds
      const t = setTimeout(() => {
        setUndoVisible(false);
        setTimeout(close, 1500);
      }, 8000);
      setUndoTimer(t);
    } catch (err) {
      console.error('Submit error:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to submit incident report. Please try again.';
      useAppStore.getState().addNotification({
        type: 'error',
        title: 'Report Blocked',
        message: msg,
      });
    }
  };

  const handleUndo = async () => {
    if (undoTimer) clearTimeout(undoTimer);
    // In a real app, call DELETE /api/incidents/:id
    setSubmitted(false);
    setUndoVisible(false);
    setStep(3);
  };

  return (
    <AnimatePresence>
      {reportPanelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={pickingLocation ? undefined : close}
            className={`fixed inset-0 z-40 transition-all ${
              pickingLocation
                ? 'bg-transparent pointer-events-none'
                : 'bg-black/60 backdrop-blur-sm'
            }`}
          />

          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: pickingLocation ? '70%' : 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto"
          >
            {pickingLocation && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur border border-white/20 px-4 py-2 rounded-full flex items-center gap-2 pointer-events-auto">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-white text-sm font-semibold">Tap map to place pin</span>
                <button onClick={() => setPickingLocation(false)} className="ml-2 bg-white/20 hover:bg-white/30 text-white text-xs px-2 py-1 rounded">
                  Done
                </button>
              </div>
            )}
            <div className={`bg-surface/98 backdrop-blur-2xl border border-white/15 rounded-t-3xl shadow-card overflow-hidden transition-opacity ${pickingLocation ? 'opacity-30 pointer-events-none' : ''}`}>
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-3 border-b border-white/8">
                <div>
                  <h2 className="text-white font-bold text-lg">Report Incident</h2>
                  <p className="text-white/40 text-xs mt-0.5">Step {step} of 3 — Help keep your community safe</p>
                </div>
                <div className="flex items-center gap-2">
                  <VoiceButton onTranscript={handleVoiceTranscript} />
                  <button onClick={close} className="text-white/40 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Progress */}
              <div className="flex gap-1.5 px-6 py-3">
                {[1, 2, 3].map((s) => (
                  <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? 'bg-primary' : 'bg-white/15'}`} />
                ))}
              </div>

              <div className="px-6 pb-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
                {submitted ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                    className="py-8 flex flex-col items-center gap-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center">
                      <Check className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-lg">Report Submitted!</p>
                      <p className="text-white/50 text-sm mt-1">+10 points earned. Thank you for keeping us safe.</p>
                    </div>
                    {undoVisible && (
                      <motion.button
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        onClick={handleUndo}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/8 border border-white/15 text-white/70 hover:text-white text-sm transition-all"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Undo (8s)
                      </motion.button>
                    )}
                  </motion.div>
                ) : (
                  <>
                    {/* Step 1: Category */}
                    {step === 1 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <h3 className="text-white/80 text-sm font-semibold">What type of incident?</h3>
                        <div className="grid grid-cols-5 gap-2">
                          {INCIDENT_CATEGORIES.map((cat) => (
                            <motion.button
                              key={cat.id}
                              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                              onClick={() => { setForm(f => ({ ...f, category: cat.id })); setStep(2); }}
                              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200
                                ${form.category === cat.id ? 'scale-105' : 'bg-white/4 border-white/10 hover:bg-white/8'}`}
                              style={form.category === cat.id ? { backgroundColor: `${cat.color}20`, borderColor: `${cat.color}60` } : {}}
                            >
                              <span className="text-xl">{cat.icon}</span>
                              <span className="text-[9px] text-white/70 font-medium leading-tight text-center">{cat.label}</span>
                            </motion.button>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Details */}
                    {step === 2 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <h3 className="text-white/80 text-sm font-semibold">Incident Details</h3>
                        <div>
                          <label className="text-xs text-white/50 mb-1.5 block">Title *</label>
                          <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                            placeholder="Brief description..." className="input-glass text-sm" maxLength={100} />
                        </div>
                        <div>
                          <label className="text-xs text-white/50 mb-1.5 block">Description</label>
                          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                            placeholder="More context..." rows={2} className="input-glass text-sm resize-none" />
                        </div>
                        <div>
                          <label className="text-xs text-white/50 mb-2 flex items-center gap-2">
                            Severity
                            <span className="font-semibold" style={{ color: getSeverityColor(form.severity) }}>
                              {form.severity} — {SEVERITY_DESCS[form.severity - 1]}
                            </span>
                          </label>
                          <input type="range" min={1} max={5} step={1} value={form.severity}
                            onChange={e => setForm(f => ({ ...f, severity: parseInt(e.target.value) }))}
                            className="w-full accent-primary" />
                          <div className="flex justify-between text-[9px] text-white/30 mt-1">
                            {['Minor', 'Low', 'Moderate', 'High', 'Critical'].map(l => <span key={l}>{l}</span>)}
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button variant="secondary" size="sm" onClick={() => setStep(1)}>Back</Button>
                          <Button size="sm" className="flex-1" onClick={() => setStep(3)} disabled={!form.title.trim()}>
                            Next <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Media + Location + Submit */}
                    {step === 3 && (
                      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                        <h3 className="text-white/80 text-sm font-semibold">Add Evidence & Submit</h3>

                        <MediaUploader
                          mediaMeta={mediaMeta} setMediaMeta={setMediaMeta}
                          uploading={uploading} setUploading={setUploading}
                        />

                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="text-xs text-white/50 mb-1.5 block">Address</label>
                            <input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                              placeholder="Street..." className="input-glass text-sm" />
                          </div>
                          <div className="w-28">
                            <label className="text-xs text-white/50 mb-1.5 block">City</label>
                            <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                              placeholder="City" className="input-glass text-sm" />
                          </div>
                        </div>

                        <div className="flex items-center justify-between bg-primary/10 border border-primary/25 rounded-xl p-3">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-xs text-white/70">
                              {reportLocation
                                ? `GPS: ${reportLocation.lat.toFixed(4)}, ${reportLocation.lng.toFixed(4)}`
                                : 'Default location'}
                            </span>
                          </div>
                          <button
                            onClick={() => setPickingLocation(true)}
                            className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded hover:bg-primary/30"
                          >
                            Pick on Map
                          </button>
                        </div>

                        {!isAuthenticated && (
                          <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 text-xs text-red-400">
                            You must be signed in to submit an incident report.
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button variant="secondary" size="sm" onClick={() => setStep(2)}>Back</Button>
                          <Button size="sm" className="flex-1" onClick={handleSubmit}
                            loading={createMutation.isPending || uploading}
                            disabled={!isAuthenticated || !form.title || !form.category || uploading}>
                            Submit Report
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
