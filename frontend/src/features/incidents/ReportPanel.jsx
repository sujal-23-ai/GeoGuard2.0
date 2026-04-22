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

































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































































// Comment line 1
// Comment line 2
// Comment line 3
// Comment line 4
// Comment line 5
// Comment line 6
// Comment line 7
// Comment line 8
// Comment line 9
// Comment line 10
// Comment line 11
// Comment line 12
// Comment line 13
// Comment line 14
// Comment line 15
// Comment line 16
// Comment line 17
// Comment line 18
// Comment line 19
// Comment line 20
// Comment line 21
// Comment line 22
// Comment line 23
// Comment line 24
// Comment line 25
// Comment line 26
// Comment line 27
// Comment line 28
// Comment line 29
// Comment line 30
// Comment line 31
// Comment line 32
// Comment line 33
// Comment line 34
// Comment line 35
// Comment line 36
// Comment line 37
// Comment line 38
// Comment line 39
// Comment line 40
// Comment line 41
// Comment line 42
// Comment line 43
// Comment line 44
// Comment line 45
// Comment line 46
// Comment line 47
// Comment line 48
// Comment line 49
// Comment line 50
// Comment line 51
// Comment line 52
// Comment line 53
// Comment line 54
// Comment line 55
// Comment line 56
// Comment line 57
// Comment line 58
// Comment line 59
// Comment line 60
// Comment line 61
// Comment line 62
// Comment line 63
// Comment line 64
// Comment line 65
// Comment line 66
// Comment line 67
// Comment line 68
// Comment line 69
// Comment line 70
// Comment line 71
// Comment line 72
// Comment line 73
// Comment line 74
// Comment line 75
// Comment line 76
// Comment line 77
// Comment line 78
// Comment line 79
// Comment line 80
// Comment line 81
// Comment line 82
// Comment line 83
// Comment line 84
// Comment line 85
// Comment line 86
// Comment line 87
// Comment line 88
// Comment line 89
// Comment line 90
// Comment line 91
// Comment line 92
// Comment line 93
// Comment line 94
// Comment line 95
// Comment line 96
// Comment line 97
// Comment line 98
// Comment line 99
// Comment line 100
// Comment line 101
// Comment line 102
// Comment line 103
// Comment line 104
// Comment line 105
// Comment line 106
// Comment line 107
// Comment line 108
// Comment line 109
// Comment line 110
// Comment line 111
// Comment line 112
// Comment line 113
// Comment line 114
// Comment line 115
// Comment line 116
// Comment line 117
// Comment line 118
// Comment line 119
// Comment line 120
// Comment line 121
// Comment line 122
// Comment line 123
// Comment line 124
// Comment line 125
// Comment line 126
// Comment line 127
// Comment line 128
// Comment line 129
// Comment line 130
// Comment line 131
// Comment line 132
// Comment line 133
// Comment line 134
// Comment line 135
// Comment line 136
// Comment line 137
// Comment line 138
// Comment line 139
// Comment line 140
// Comment line 141
// Comment line 142
// Comment line 143
// Comment line 144
// Comment line 145
// Comment line 146
// Comment line 147
// Comment line 148
// Comment line 149
// Comment line 150
// Comment line 151
// Comment line 152
// Comment line 153
// Comment line 154
// Comment line 155
// Comment line 156
// Comment line 157
// Comment line 158
// Comment line 159
// Comment line 160
// Comment line 161
// Comment line 162
// Comment line 163
// Comment line 164
// Comment line 165
// Comment line 166
// Comment line 167
// Comment line 168
// Comment line 169
// Comment line 170
// Comment line 171
// Comment line 172
// Comment line 173
// Comment line 174
// Comment line 175
// Comment line 176
// Comment line 177
// Comment line 178
// Comment line 179
// Comment line 180
// Comment line 181
// Comment line 182
// Comment line 183
// Comment line 184
// Comment line 185
// Comment line 186
// Comment line 187
// Comment line 188
// Comment line 189
// Comment line 190
// Comment line 191
// Comment line 192
// Comment line 193
// Comment line 194
// Comment line 195
// Comment line 196
// Comment line 197
// Comment line 198
// Comment line 199
// Comment line 200
// Comment line 201
// Comment line 202
// Comment line 203
// Comment line 204
// Comment line 205
// Comment line 206
// Comment line 207
// Comment line 208
// Comment line 209
// Comment line 210
// Comment line 211
// Comment line 212
// Comment line 213
// Comment line 214
// Comment line 215
// Comment line 216
// Comment line 217
// Comment line 218
// Comment line 219
// Comment line 220
// Comment line 221
// Comment line 222
// Comment line 223
// Comment line 224
// Comment line 225
// Comment line 226
// Comment line 227
// Comment line 228
// Comment line 229
// Comment line 230
// Comment line 231
// Comment line 232
// Comment line 233
// Comment line 234
// Comment line 235
// Comment line 236
// Comment line 237
// Comment line 238
// Comment line 239
// Comment line 240
// Comment line 241
// Comment line 242
// Comment line 243
// Comment line 244
// Comment line 245
// Comment line 246
// Comment line 247
// Comment line 248
// Comment line 249
// Comment line 250
// Comment line 251
// Comment line 252
// Comment line 253
// Comment line 254
// Comment line 255
// Comment line 256
// Comment line 257
// Comment line 258
// Comment line 259
// Comment line 260
// Comment line 261
// Comment line 262
// Comment line 263
// Comment line 264
// Comment line 265
// Comment line 266
// Comment line 267
// Comment line 268
// Comment line 269
// Comment line 270
// Comment line 271
// Comment line 272
// Comment line 273
// Comment line 274
// Comment line 275
// Comment line 276
// Comment line 277
// Comment line 278
// Comment line 279
// Comment line 280
// Comment line 281
// Comment line 282
// Comment line 283
// Comment line 284
// Comment line 285
// Comment line 286
// Comment line 287
// Comment line 288
// Comment line 289
// Comment line 290
// Comment line 291
// Comment line 292
// Comment line 293
// Comment line 294
// Comment line 295
// Comment line 296
// Comment line 297
// Comment line 298
// Comment line 299
// Comment line 300
// Comment line 301
// Comment line 302
// Comment line 303
// Comment line 304
// Comment line 305
// Comment line 306
// Comment line 307
// Comment line 308
// Comment line 309
// Comment line 310
// Comment line 311
// Comment line 312
// Comment line 313
// Comment line 314
// Comment line 315
// Comment line 316
// Comment line 317
// Comment line 318
// Comment line 319
// Comment line 320
// Comment line 321
// Comment line 322
// Comment line 323
// Comment line 324
// Comment line 325
// Comment line 326
// Comment line 327
// Comment line 328
// Comment line 329
// Comment line 330
// Comment line 331
// Comment line 332
// Comment line 333
// Comment line 334
// Comment line 335
// Comment line 336
// Comment line 337
// Comment line 338
// Comment line 339
// Comment line 340
// Comment line 341
// Comment line 342
// Comment line 343
// Comment line 344
// Comment line 345
// Comment line 346
// Comment line 347
// Comment line 348
// Comment line 349
// Comment line 350
// Comment line 351
// Comment line 352
// Comment line 353
// Comment line 354
// Comment line 355
// Comment line 356
// Comment line 357
// Comment line 358
// Comment line 359
// Comment line 360
// Comment line 361
// Comment line 362
// Comment line 363
// Comment line 364
// Comment line 365
// Comment line 366
// Comment line 367
// Comment line 368
// Comment line 369
// Comment line 370
// Comment line 371
// Comment line 372
// Comment line 373
// Comment line 374
// Comment line 375
// Comment line 376
// Comment line 377
// Comment line 378
// Comment line 379
// Comment line 380
// Comment line 381
// Comment line 382
// Comment line 383
// Comment line 384
// Comment line 385
// Comment line 386
// Comment line 387
// Comment line 388
// Comment line 389
// Comment line 390
// Comment line 391
// Comment line 392
// Comment line 393
// Comment line 394
// Comment line 395
// Comment line 396
// Comment line 397
// Comment line 398
// Comment line 399
// Comment line 400
// Comment line 401
// Comment line 402
// Comment line 403
// Comment line 404
// Comment line 405
// Comment line 406
// Comment line 407
// Comment line 408
// Comment line 409
// Comment line 410
// Comment line 411
// Comment line 412
// Comment line 413
// Comment line 414
// Comment line 415
// Comment line 416
// Comment line 417
// Comment line 418
// Comment line 419
// Comment line 420
// Comment line 421
// Comment line 422
// Comment line 423
// Comment line 424
// Comment line 425
// Comment line 426
// Comment line 427
// Comment line 428
// Comment line 429
// Comment line 430
// Comment line 431
// Comment line 432
// Comment line 433
// Comment line 434
// Comment line 435
// Comment line 436
// Comment line 437
// Comment line 438
// Comment line 439
// Comment line 440
// Comment line 441
// Comment line 442
// Comment line 443
// Comment line 444
// Comment line 445
// Comment line 446
// Comment line 447
// Comment line 448
// Comment line 449
// Comment line 450
// Comment line 451
// Comment line 452
// Comment line 453
// Comment line 454
// Comment line 455
// Comment line 456
// Comment line 457
// Comment line 458
// Comment line 459
// Comment line 460
// Comment line 461
// Comment line 462
// Comment line 463
// Comment line 464
// Comment line 465
// Comment line 466
// Comment line 467
// Comment line 468
// Comment line 469
// Comment line 470
// Comment line 471
// Comment line 472
// Comment line 473
// Comment line 474
// Comment line 475
// Comment line 476
// Comment line 477
// Comment line 478
// Comment line 479
// Comment line 480
// Comment line 481
// Comment line 482
// Comment line 483
// Comment line 484
// Comment line 485
// Comment line 486
// Comment line 487
// Comment line 488
// Comment line 489
// Comment line 490
// Comment line 491
// Comment line 492
// Comment line 493
// Comment line 494
// Comment line 495
// Comment line 496
// Comment line 497
// Comment line 498
// Comment line 499
// Comment line 500
// Comment line 501
// Comment line 502
// Comment line 503
// Comment line 504
// Comment line 505
// Comment line 506
// Comment line 507
// Comment line 508
// Comment line 509
// Comment line 510
// Comment line 511
// Comment line 512
// Comment line 513
// Comment line 514
// Comment line 515
// Comment line 516
// Comment line 517
// Comment line 518
// Comment line 519
// Comment line 520
// Comment line 521
// Comment line 522
// Comment line 523
// Comment line 524
// Comment line 525
// Comment line 526
// Comment line 527
// Comment line 528
// Comment line 529
// Comment line 530
// Comment line 531
// Comment line 532
// Comment line 533
// Comment line 534
// Comment line 535
// Comment line 536
// Comment line 537
// Comment line 538
// Comment line 539
// Comment line 540
// Comment line 541
// Comment line 542
// Comment line 543
// Comment line 544
// Comment line 545
// Comment line 546
// Comment line 547
// Comment line 548
// Comment line 549
// Comment line 550
// Comment line 551
// Comment line 552
// Comment line 553
// Comment line 554
// Comment line 555
// Comment line 556
// Comment line 557
// Comment line 558
// Comment line 559
// Comment line 560
// Comment line 561
// Comment line 562
// Comment line 563
// Comment line 564
// Comment line 565
// Comment line 566
// Comment line 567
// Comment line 568
// Comment line 569
// Comment line 570
// Comment line 571
// Comment line 572
// Comment line 573
// Comment line 574
// Comment line 575
// Comment line 576
// Comment line 577
// Comment line 578
// Comment line 579
// Comment line 580
// Comment line 581
// Comment line 582
// Comment line 583
// Comment line 584
// Comment line 585
// Comment line 586
// Comment line 587
// Comment line 588
// Comment line 589
// Comment line 590
// Comment line 591
// Comment line 592
// Comment line 593
// Comment line 594
// Comment line 595
// Comment line 596
// Comment line 597
// Comment line 598
// Comment line 599
// Comment line 600
// Comment line 601
// Comment line 602
// Comment line 603
// Comment line 604
// Comment line 605
// Comment line 606
// Comment line 607
// Comment line 608
// Comment line 609
// Comment line 610
// Comment line 611
// Comment line 612
// Comment line 613
// Comment line 614
// Comment line 615
// Comment line 616
// Comment line 617
// Comment line 618
// Comment line 619
// Comment line 620
// Comment line 621
// Comment line 622
// Comment line 623
// Comment line 624
// Comment line 625
// Comment line 626
// Comment line 627
// Comment line 628
// Comment line 629
// Comment line 630
// Comment line 631
// Comment line 632
// Comment line 633
// Comment line 634
// Comment line 635
// Comment line 636
// Comment line 637
// Comment line 638
// Comment line 639
// Comment line 640
// Comment line 641
// Comment line 642
// Comment line 643
// Comment line 644
// Comment line 645
// Comment line 646
// Comment line 647
// Comment line 648
// Comment line 649
// Comment line 650
// Comment line 651
// Comment line 652
// Comment line 653
// Comment line 654
// Comment line 655
// Comment line 656
// Comment line 657
// Comment line 658
// Comment line 659
// Comment line 660
// Comment line 661
// Comment line 662
// Comment line 663
// Comment line 664
// Comment line 665
// Comment line 666
// Comment line 667
// Comment line 668
// Comment line 669
// Comment line 670
// Comment line 671
// Comment line 672
// Comment line 673
// Comment line 674
// Comment line 675
// Comment line 676
// Comment line 677
// Comment line 678
// Comment line 679
// Comment line 680
// Comment line 681
// Comment line 682
// Comment line 683
// Comment line 684
// Comment line 685
// Comment line 686
// Comment line 687
// Comment line 688
// Comment line 689
// Comment line 690
// Comment line 691
// Comment line 692
// Comment line 693
// Comment line 694
// Comment line 695
// Comment line 696
// Comment line 697
// Comment line 698
// Comment line 699
// Comment line 700
// Comment line 701
// Comment line 702
// Comment line 703
// Comment line 704
// Comment line 705
// Comment line 706
// Comment line 707
// Comment line 708
// Comment line 709
// Comment line 710
// Comment line 711
// Comment line 712
// Comment line 713
// Comment line 714
// Comment line 715
// Comment line 716
// Comment line 717
// Comment line 718
// Comment line 719
// Comment line 720
// Comment line 721
// Comment line 722
// Comment line 723
// Comment line 724
// Comment line 725
// Comment line 726
// Comment line 727
// Comment line 728
// Comment line 729
// Comment line 730
// Comment line 731
// Comment line 732
// Comment line 733
// Comment line 734
// Comment line 735
// Comment line 736
// Comment line 737
// Comment line 738
// Comment line 739
// Comment line 740
// Comment line 741
// Comment line 742
// Comment line 743
// Comment line 744
// Comment line 745
// Comment line 746
// Comment line 747
// Comment line 748
// Comment line 749
// Comment line 750
// Comment line 751
// Comment line 752
// Comment line 753
// Comment line 754
// Comment line 755
// Comment line 756
// Comment line 757
// Comment line 758
// Comment line 759
// Comment line 760
// Comment line 761
// Comment line 762
// Comment line 763
// Comment line 764
// Comment line 765
// Comment line 766
// Comment line 767
// Comment line 768
// Comment line 769
// Comment line 770
// Comment line 771
// Comment line 772
// Comment line 773
// Comment line 774
// Comment line 775
// Comment line 776
// Comment line 777
// Comment line 778
// Comment line 779
// Comment line 780
// Comment line 781
// Comment line 782
// Comment line 783
// Comment line 784
// Comment line 785
// Comment line 786
// Comment line 787
// Comment line 788
// Comment line 789
// Comment line 790
// Comment line 791
// Comment line 792
// Comment line 793
// Comment line 794
// Comment line 795
// Comment line 796
// Comment line 797
// Comment line 798
// Comment line 799
// Comment line 800
// Comment line 801
// Comment line 802
// Comment line 803
// Comment line 804
// Comment line 805
// Comment line 806
// Comment line 807
// Comment line 808
// Comment line 809
// Comment line 810
// Comment line 811
// Comment line 812
// Comment line 813
// Comment line 814
// Comment line 815
// Comment line 816
// Comment line 817
// Comment line 818
// Comment line 819
// Comment line 820
// Comment line 821
// Comment line 822
// Comment line 823
// Comment line 824
// Comment line 825
// Comment line 826
// Comment line 827
// Comment line 828
// Comment line 829
// Comment line 830
// Comment line 831
// Comment line 832
// Comment line 833
// Comment line 834
// Comment line 835
// Comment line 836
// Comment line 837
// Comment line 838
// Comment line 839
// Comment line 840
// Comment line 841
// Comment line 842
// Comment line 843
// Comment line 844
// Comment line 845
// Comment line 846
// Comment line 847
// Comment line 848
// Comment line 849
// Comment line 850
// Comment line 851
// Comment line 852
// Comment line 853
// Comment line 854
// Comment line 855
// Comment line 856
// Comment line 857
// Comment line 858
// Comment line 859
// Comment line 860
// Comment line 861
// Comment line 862
// Comment line 863
// Comment line 864
// Comment line 865
// Comment line 866
// Comment line 867
// Comment line 868
// Comment line 869
// Comment line 870
// Comment line 871
// Comment line 872
// Comment line 873
// Comment line 874
// Comment line 875
// Comment line 876
// Comment line 877
// Comment line 878
// Comment line 879
// Comment line 880
// Comment line 881
// Comment line 882
// Comment line 883
// Comment line 884
// Comment line 885
// Comment line 886
// Comment line 887
// Comment line 888
// Comment line 889
// Comment line 890
// Comment line 891
// Comment line 892
// Comment line 893
// Comment line 894
// Comment line 895
// Comment line 896
// Comment line 897
// Comment line 898
// Comment line 899
// Comment line 900
// Comment line 901
// Comment line 902
// Comment line 903
// Comment line 904
// Comment line 905
// Comment line 906
// Comment line 907
// Comment line 908
// Comment line 909
// Comment line 910
// Comment line 911
// Comment line 912
// Comment line 913
// Comment line 914
// Comment line 915
// Comment line 916
// Comment line 917
// Comment line 918
// Comment line 919
// Comment line 920
// Comment line 921
// Comment line 922
// Comment line 923
// Comment line 924
// Comment line 925
// Comment line 926
// Comment line 927
// Comment line 928
// Comment line 929
// Comment line 930
// Comment line 931
// Comment line 932
// Comment line 933
// Comment line 934
// Comment line 935
// Comment line 936
// Comment line 937
// Comment line 938
// Comment line 939
// Comment line 940
// Comment line 941
// Comment line 942
// Comment line 943
// Comment line 944
// Comment line 945
// Comment line 946
// Comment line 947
// Comment line 948
// Comment line 949
// Comment line 950
// Comment line 951
// Comment line 952
// Comment line 953
// Comment line 954
// Comment line 955
// Comment line 956
// Comment line 957
// Comment line 958
// Comment line 959
// Comment line 960
// Comment line 961
// Comment line 962
// Comment line 963
// Comment line 964
// Comment line 965
// Comment line 966
// Comment line 967
// Comment line 968
// Comment line 969
// Comment line 970
// Comment line 971
// Comment line 972
// Comment line 973
// Comment line 974
// Comment line 975
// Comment line 976
// Comment line 977
// Comment line 978
// Comment line 979
// Comment line 980
// Comment line 981
// Comment line 982
// Comment line 983
// Comment line 984
// Comment line 985
// Comment line 986
// Comment line 987
// Comment line 988
// Comment line 989
// Comment line 990
// Comment line 991
// Comment line 992
// Comment line 993
// Comment line 994
// Comment line 995
// Comment line 996
// Comment line 997
// Comment line 998
// Comment line 999
// Comment line 1000
