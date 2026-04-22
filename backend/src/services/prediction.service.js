const clusterHotspots = (incidents) => {
  if (!incidents.length) return [];

  const clusters = [];
  const visited = new Set();

  for (let i = 0; i < incidents.length; i++) {
    if (visited.has(i)) continue;
    const inc = incidents[i];
    const [iLng, iLat] = inc.location.coordinates;

    const nearby = incidents.reduce((acc, other, j) => {
      if (i === j || visited.has(j)) return acc;
      const [oLng, oLat] = other.location.coordinates;
      const dist = Math.sqrt((iLng - oLng) ** 2 + (iLat - oLat) ** 2);
      if (dist < 0.018) { acc.push(j); }
      return acc;
    }, []);

    if (nearby.length >= 1) {
      [i, ...nearby].forEach(idx => visited.add(idx));
      const group = [inc, ...nearby.map(j => incidents[j])];
      const avgLng = group.reduce((s, x) => s + x.location.coordinates[0], 0) / group.length;
      const avgLat = group.reduce((s, x) => s + x.location.coordinates[1], 0) / group.length;
      const maxSev = Math.max(...group.map(x => x.severity));
      clusters.push({
        lat: avgLat,
        lng: avgLng,
        count: group.length,
        severity: maxSev,
        risk: Math.min(1, group.length / 8 + maxSev / 10),
        categories: [...new Set(group.map(x => x.category))],
      });
    }
  }

  return clusters.sort((a, b) => b.risk - a.risk);
};

const getPrediction = async ({ lat, lng, radiusKm = 5 }) => {
  // Lazy-require to avoid circular dependency
  const Incident = require('../models/incident');

  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const incidents = await Incident.find({
    isActive: true,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: radiusKm * 1000,
      },
    },
    createdAt: { $gte: since },
  }).select('severity category location createdAt').lean();

  // Hour-of-day pattern
  const hourBuckets = {};
  incidents.forEach(inc => {
    const h = new Date(inc.createdAt).getHours();
    hourBuckets[h] = (hourBuckets[h] || 0) + 1;
  });

  const currentHour = new Date().getHours();
  const peakHours = Object.entries(hourBuckets)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([h]) => parseInt(h));

  const isCurrentHourPeak = peakHours.includes(currentHour);
  const avgSeverity = incidents.length
    ? incidents.reduce((s, i) => s + i.severity, 0) / incidents.length
    : 2;

  const densityScore  = Math.min(0.5, incidents.length / 20 * 0.5);
  const severityScore = (avgSeverity / 5) * 0.3;
  const timeScore     = isCurrentHourPeak ? 0.2 : 0.05;
  const predictedRisk = densityScore + severityScore + timeScore;

  const hotspots = clusterHotspots(incidents);

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentCount = incidents.filter(i => new Date(i.createdAt) > weekAgo).length;
  const olderCount  = incidents.length - recentCount;
  const trend = recentCount > olderCount * 1.3 ? 'rising'
              : recentCount < olderCount * 0.7 ? 'falling'
              : 'stable';

  return {
    predicted_risk: Math.round(Math.min(1, predictedRisk) * 100) / 100,
    incident_count: incidents.length,
    avg_severity: Math.round(avgSeverity * 10) / 10,
    peak_hours: peakHours,
    risk_trend: trend,
    hotspots: hotspots.slice(0, 5),
    generated_at: new Date(),
  };
};

module.exports = { getPrediction, clusterHotspots };
