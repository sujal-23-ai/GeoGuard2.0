import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Newspaper, ExternalLink, Search, RefreshCw, Wifi } from 'lucide-react';
import { useNews } from '../../hooks/useNews';
import { timeAgo } from '../../utils/helpers';

const CATEGORY_COLORS = {
  crime:          { bg: 'bg-red-500/15',     text: 'text-red-400',     border: 'border-red-500/25'     },
  weather:        { bg: 'bg-blue-500/15',    text: 'text-blue-400',    border: 'border-blue-500/25'    },
  accident:       { bg: 'bg-orange-500/15',  text: 'text-orange-400',  border: 'border-orange-500/25'  },
  infrastructure: { bg: 'bg-yellow-500/15',  text: 'text-yellow-400',  border: 'border-yellow-500/25'  },
  community:      { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/25' },
  general:        { bg: 'bg-primary/15',     text: 'text-primary',     border: 'border-primary/25'     },
};

const TABS = ['All', 'Crime', 'Weather', 'Accident', 'Infrastructure'];

function NewsCard({ article }) {
  const cat = CATEGORY_COLORS[article.category] || CATEGORY_COLORS.general;
  const isDemo = article.url === '#';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="group bg-white/4 hover:bg-white/7 border border-white/8 hover:border-white/14
                 rounded-xl p-3.5 transition-all duration-200 cursor-pointer"
      onClick={() => !isDemo && window.open(article.url, '_blank', 'noopener')}
    >
      <div className="flex items-start gap-3">
        {article.image && (
          <img
            src={article.image}
            alt=""
            className="w-14 h-14 rounded-lg object-cover flex-shrink-0 bg-white/5"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-white text-xs font-semibold leading-snug line-clamp-2 group-hover:text-white/90">
              {article.title}
            </p>
            {!isDemo && (
              <ExternalLink className="w-3 h-3 text-white/30 group-hover:text-white/60 flex-shrink-0 mt-0.5 transition-colors" />
            )}
          </div>

          {article.description && (
            <p className="text-white/50 text-[11px] leading-relaxed mt-1 line-clamp-2">
              {article.description}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
              {article.category}
            </span>
            <span className="text-white/30 text-[10px]">{article.source}</span>
            <span className="text-white/25 text-[10px] ml-auto">
              {timeAgo(article.publishedAt)}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function NewsPanel({ open, onClose }) {
  const [cityInput, setCityInput] = useState('');
  const [activeCity, setActiveCity] = useState('your area');
  const [activeTab, setActiveTab] = useState('All');

  const { data, isLoading, isError, refetch, isFetching } = useNews(activeCity);
  const articles = data?.articles || [];
  const isDemo = data?.source === 'demo';

  const filtered = activeTab === 'All'
    ? articles
    : articles.filter((a) => a.category.toLowerCase() === activeTab.toLowerCase());

  const handleCitySearch = (e) => {
    e.preventDefault();
    if (cityInput.trim()) { setActiveCity(cityInput.trim()); setCityInput(''); }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 0.45 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />
          <motion.div
            initial={{ opacity: 0, x: 380 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 380 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-96 z-50 flex flex-col"
          >
            <div className="flex flex-col h-full bg-surface/98 backdrop-blur-2xl border-l border-white/10 shadow-card">
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/8 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center">
                    <Newspaper className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-sm">Safety News</h2>
                    <p className="text-white/40 text-xs capitalize">{data?.resolvedCity || activeCity}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isDemo && (
                    <span className="text-[9px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      DEMO
                    </span>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => refetch()}
                    disabled={isFetching}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                  </motion.button>
                  <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* City search */}
              <div className="px-5 pt-4 pb-3 flex-shrink-0">
                <form onSubmit={handleCitySearch} className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
                    <Search className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
                    <input
                      value={cityInput}
                      onChange={(e) => setCityInput(e.target.value)}
                      placeholder="Search city (e.g. New York)"
                      className="flex-1 bg-transparent text-xs text-white placeholder-white/30 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-3 py-2 bg-primary/20 border border-primary/40 rounded-xl text-primary text-xs font-semibold hover:bg-primary/30 transition-colors"
                  >
                    Go
                  </button>
                </form>
              </div>

              {/* Category tabs */}
              <div className="flex gap-1 px-5 pb-3 flex-shrink-0 overflow-x-auto scrollbar-none">
                {TABS.map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-shrink-0 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all ${
                      activeTab === tab
                        ? 'bg-primary/20 text-primary border border-primary/30'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Articles list */}
              <div className="flex-1 overflow-y-auto scrollbar-thin px-5 pb-6 space-y-2.5">
                {isLoading && (
                  <div className="flex items-center justify-center py-12 gap-3">
                    <Wifi className="w-5 h-5 text-primary animate-pulse" />
                    <span className="text-white/50 text-sm">Fetching safety news...</span>
                  </div>
                )}

                {isError && !isLoading && (
                  <div className="text-center py-8 text-white/40 text-sm">
                    Failed to load news. Try again.
                  </div>
                )}

                {!isLoading && filtered.length === 0 && (
                  <div className="text-center py-8 text-white/40 text-sm">
                    No {activeTab.toLowerCase() === 'all' ? '' : `${activeTab.toLowerCase()} `}news found.
                  </div>
                )}

                {!isLoading && filtered.map((article, i) => (
                  <NewsCard key={`${article.title}-${i}`} article={article} />
                ))}
              </div>

              {/* Footer */}
              {isDemo && (
                <div className="px-5 py-3 border-t border-white/8 flex-shrink-0">
                  <p className="text-[10px] text-white/30 text-center">
                    Add <span className="text-white/50 font-mono">GNEWS_API_KEY</span> to backend .env for live news
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
// This file implements the NewsPanel component for the GeoGuard app, displaying real-time news articles related to safety and community events. It categorizes articles by type (crime, weather, accident, etc.), provides filtering tabs, and allows users to view and open news links in new tabs.
