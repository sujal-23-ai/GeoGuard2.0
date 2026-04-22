const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Incident = require('../models/incident');

const connectedUsers = new Map();
// userId → { socketId, lat, lng }
const userLocations  = new Map();

const ALERT_CHECK_INTERVAL = 30_000; // check every 30s
const DANGER_RADIUS_M = 800;

// Geo distance in metres (Haversine approximation)
const distanceM = (lat1, lng1, lat2, lng2) => {
  const R = 6_371_000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const checkAlertZones = async (io) => {
  if (userLocations.size === 0) return;
  try {
    const highRisk = await Incident.find({
      isActive: true,
      severity: { $gte: 4 },
      createdAt: { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) },
    }).select('location severity category title').lean();

    for (const [userId, { socketId, lat, lng }] of userLocations) {
      for (const inc of highRisk) {
        const [iLng, iLat] = inc.location.coordinates;
        const d = distanceM(lat, lng, iLat, iLng);
        if (d <= DANGER_RADIUS_M) {
          io.to(socketId).emit('danger_zone_alert', {
            incidentId: inc._id,
            title: inc.title,
            category: inc.category,
            severity: inc.severity,
            distanceM: Math.round(d),
            message: `⚠️ High-risk incident ${Math.round(d)}m away: ${inc.title}`,
          });
          break; // one alert per cycle
        }
      }
    }
  } catch (err) {
    console.error('Alert zone check error:', err);
  }
};

const setupSockets = (io) => {
  // JWT auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = payload.sub;
      } catch { /* anonymous allowed */ }
    }
    next();
  });

  io.on('connection', (socket) => {
    if (socket.userId) {
      connectedUsers.set(socket.userId, socket.id);
      io.emit('user_count', connectedUsers.size);
    }

    // Join geographic area room
    socket.on('join_area', ({ lng, lat }) => {
      const room = `area:${Math.round(lng)}:${Math.round(lat)}`;
      if (socket.currentRoom) socket.leave(socket.currentRoom);
      socket.join(room);
      socket.currentRoom = room;
    });

    // Track user location for alert zones
    socket.on('update_location', async ({ lng, lat }) => {
      if (!socket.userId) return;
      try {
        await User.findByIdAndUpdate(socket.userId, {
          lastLocation: { type: 'Point', coordinates: [lng, lat] },
        });
        userLocations.set(socket.userId, { socketId: socket.id, lat, lng });
      } catch { /* silent */ }
    });

    // Live mode: client opts in to high-frequency updates
    socket.on('enable_live_mode', () => {
      socket.join('live_mode');
    });
    socket.on('disable_live_mode', () => {
      socket.leave('live_mode');
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        userLocations.delete(socket.userId);
        io.emit('user_count', connectedUsers.size);
      }
    });
  });

  // Run alert zone check periodically
  setInterval(() => checkAlertZones(io), ALERT_CHECK_INTERVAL);

  return io;
};

module.exports = { setupSockets, connectedUsers };
