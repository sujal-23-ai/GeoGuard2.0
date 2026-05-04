import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAppStore = create(
  persist(
    (set) => ({
      // Theme
      theme: "dark",
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),

      // View
      view: "landing", // 'landing', 'app', 'share'
      setView: (view) => set({ view }),

      // Auth
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      updateUser: (updates) =>
        set((s) => ({ user: { ...s.user, ...updates } })),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),

      // Map state
      viewport: { lng: -74.006, lat: 40.7128, zoom: 12 },
      setViewport: (viewport) => set({ viewport }),
      selectedIncident: null,
      setSelectedIncident: (incident) => set({ selectedIncident: incident }),
      showHeatmap: false,
      toggleHeatmap: () => set((s) => ({ showHeatmap: !s.showHeatmap })),
      showSatellite: false,
      toggleSatellite: () => set((s) => ({ showSatellite: !s.showSatellite })),
      showSafeZones: false,
      toggleSafeZones: () => set((s) => ({ showSafeZones: !s.showSafeZones })),

      // Filters
      filters: { category: null, severity: null, radius: 10, since: null },
      setFilters: (filters) =>
        set((s) => ({ filters: { ...s.filters, ...filters } })),
      clearFilters: () =>
        set({
          filters: { category: null, severity: null, radius: 10, since: null },
        }),

      // Live mode
      liveMode: false,
      toggleLiveMode: () => set((s) => ({ liveMode: !s.liveMode })),

      // AI assistant panel
      aiAssistantOpen: false,
      setAiAssistantOpen: (open) => set({ aiAssistantOpen: open }),

      // UI panels
      reportPanelOpen: false,
      setReportPanelOpen: (open) => set({ reportPanelOpen: open }),
      analyticsPanelOpen: false,
      setAnalyticsPanelOpen: (open) => set({ analyticsPanelOpen: open }),
      routingPanelOpen: false,
      setRoutingPanelOpen: (open) => set({ routingPanelOpen: open }),
      adminPanelOpen: false,
      setAdminPanelOpen: (open) => set({ adminPanelOpen: open }),
      settingsPanelOpen: false,
      setSettingsPanelOpen: (open) => set({ settingsPanelOpen: open }),
      leaderboardOpen: false,
      setLeaderboardOpen: (open) => set({ leaderboardOpen: open }),
      sosActive: false,
      setSosActive: (active) => set({ sosActive: active }),

      // News panel
      newsPanelOpen: false,
      setNewsPanelOpen: (open) => set({ newsPanelOpen: open }),

      // Location sharing
      shareActive: false,
      shareToken: null,
      shareExpiry: null,
      setShareSession: (token, expiry) =>
        set({ shareActive: true, shareToken: token, shareExpiry: expiry }),
      stopShare: () =>
        set({ shareActive: false, shareToken: null, shareExpiry: null }),

      // Menu state (used by LandingPage to open specific tab)
      menuOpen: false,
      setMenuOpen: (open) => set({ menuOpen: open }),
      menuInitialTab: "menu",
      setMenuInitialTab: (tab) => set({ menuInitialTab: tab }),

      // User location
      userLocation: null,
      setUserLocation: (location) => set({ userLocation: location }),

      // Report map pick state
      pickingLocation: false,
      setPickingLocation: (picking) => set({ pickingLocation: picking }),
      reportLocation: null,
      setReportLocation: (loc) => set({ reportLocation: loc }),

      // Map focus control
      mapFocus: null,
      setMapFocus: (focus) => set({ mapFocus: focus }),

      // Incidents (real-time)
      liveIncidents: [],
      recentlyCreated: [], // incidents created by THIS user — survive refetches
      addLiveIncident: (incident) =>
        set((s) => {
          const newId = incident.id || incident._id;
          const isDupe = (i) => {
            const iid = i.id || i._id;
            return iid && newId && iid === newId;
          };
          return {
            liveIncidents: [
              incident,
              ...s.liveIncidents.filter((i) => !isDupe(i)),
            ].slice(0, 200),
            recentlyCreated: [
              { ...incident, _createdAt: Date.now() },
              ...s.recentlyCreated.filter((i) => !isDupe(i)),
            ],
          };
        }),
      updateLiveIncident: (update) =>
        set((s) => {
          const matchId = (i) =>
            i &&
            ((i.id && i.id === update.id) || (i._id && i._id === update.id));

          if (update.deleted || update.isActive === false) {
            return {
              liveIncidents: s.liveIncidents.filter((i) => !matchId(i)),
              recentlyCreated: s.recentlyCreated.filter((i) => !matchId(i)),
              selectedIncident: matchId(s.selectedIncident)
                ? null
                : s.selectedIncident,
            };
          }

          return {
            liveIncidents: s.liveIncidents.map((i) =>
              matchId(i) ? { ...i, ...update } : i,
            ),
            // Keep selectedIncident in sync so the detail panel updates instantly
            selectedIncident: matchId(s.selectedIncident)
              ? { ...s.selectedIncident, ...update }
              : s.selectedIncident,
          };
        }),
      setLiveIncidents: (incidents) =>
        set((s) => {
          // Keep recently-created incidents alive for 5 minutes so they
          // aren't wiped by a nearby-refetch that uses a different radius.
          const GRACE_MS = 5 * 60 * 1000;
          const now = Date.now();
          const alive = s.recentlyCreated.filter(
            (r) => now - r._createdAt < GRACE_MS,
          );
          const fetchedIds = new Set(incidents.map((i) => i.id || i._id));
          const extras = alive.filter(
            (r) => !fetchedIds.has(r.id) && !fetchedIds.has(r._id),
          );
          return {
            liveIncidents: [...incidents, ...extras].slice(0, 200),
            recentlyCreated: alive,
          };
        }),

      // Notifications
      notifications: [],
      addNotification: (n) =>
        set((s) => ({
          notifications: [{ id: Date.now(), ...n }, ...s.notifications].slice(
            0,
            10,
          ),
        })),
      dismissNotification: (id) =>
        set((s) => ({
          notifications: s.notifications.filter((n) => n.id !== id),
        })),

      // Socket
      socketConnected: false,
      setSocketConnected: (connected) => set({ socketConnected: connected }),
      connectedUsers: 0,
      setConnectedUsers: (count) => set({ connectedUsers: count }),

      // Routing
      routeOrigin: null,
      routeDestination: null,
      routeType: "safe",
      setRoute: (origin, destination) =>
        set({ routeOrigin: origin, routeDestination: destination }),
      setRouteType: (type) => set({ routeType: type }),
      clearRoute: () => set({ routeOrigin: null, routeDestination: null }),

      // Navigation journey
      navigation: null, // { route, distance, duration, riskLevel, transportMode }
      setNavigation: (nav) => set({ navigation: nav }),
      clearNavigation: () => set({ navigation: null, journeyActive: false }),
      journeyActive: false,
      setJourneyActive: (active) => set({ journeyActive: active }),
      journeyCompleted: false,
      setJourneyCompleted: (done) => set({ journeyCompleted: done }),

      // Profile panel
      profilePanelOpen: false,
      setProfilePanelOpen: (open) => set({ profilePanelOpen: open }),

      // Emergency contacts (persisted with user)
      emergencyContacts: [],
      setEmergencyContacts: (contacts) => set({ emergencyContacts: contacts }),
      addEmergencyContact: (contact) =>
        set((s) => ({ emergencyContacts: [...s.emergencyContacts, contact] })),
      removeEmergencyContact: (idx) =>
        set((s) => ({
          emergencyContacts: s.emergencyContacts.filter((_, i) => i !== idx),
        })),
    }),
    {
      name: "geoguard-store",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        viewport: state.viewport,
        filters: state.filters,
        theme: state.theme,
        emergencyContacts: state.emergencyContacts,
      }),
    },
  ),
);

export default useAppStore;







































































    


















































































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
