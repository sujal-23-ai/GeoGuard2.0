"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
// @ts-ignore — react-globe.gl has minimal type definitions
import Globe from "react-globe.gl";

// ─── Types ────────────────────────────────────────────────────────────────────

type GeoFeature = {
    type: string;
    properties: Record<string, string | number | null | undefined>;
    geometry: object;
};

type AccidentLevel = "High" | "Medium" | "Low";

type AccidentInfo = {
    displayName: string;
    accidents: number;
    trend: string;
    level: AccidentLevel;
    color: string;
};

type TooltipState = {
    x: number;
    y: number;
    data: AccidentInfo;
    country: string;
} | null;

type ArcDatum = {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    color: string | string[];
};

type MarketPoint = {
    country: string;
    city: string;
    code: string;
    lat: number;
    lng: number;
    color: string;
};

// ─── Market Data ──────────────────────────────────────────────────────────────

const ACCIDENT_DATA: Record<string, AccidentInfo> = {
    "United States of America": {
        displayName: "United States",
        accidents: 245000,
        trend: "+5.2%",
        level: "High",
        color: "#d94b4b",
    },
    "United Kingdom": {
        displayName: "United Kingdom",
        accidents: 85000,
        trend: "-1.8%",
        level: "Medium",
        color: "#f4c542",
    },
    Japan: {
        displayName: "Japan",
        accidents: 42000,
        trend: "-3.4%",
        level: "Low",
        color: "#10a66a",
    },
    Germany: {
        displayName: "Germany",
        accidents: 78000,
        trend: "+1.1%",
        level: "Medium",
        color: "#f4c542",
    },
    China: {
        displayName: "China",
        accidents: 310000,
        trend: "+2.5%",
        level: "High",
        color: "#d94b4b",
    },
    India: {
        displayName: "India",
        accidents: 420000,
        trend: "+8.7%",
        level: "High",
        color: "#d94b4b",
    },
    Australia: {
        displayName: "Australia",
        accidents: 35000,
        trend: "-2.1%",
        level: "Low",
        color: "#10a66a",
    },
    Canada: {
        displayName: "Canada",
        accidents: 48000,
        trend: "+0.5%",
        level: "Low",
        color: "#10a66a",
    },
    France: {
        displayName: "France",
        accidents: 62000,
        trend: "-0.9%",
        level: "Medium",
        color: "#f4c542",
    },
    Brazil: {
        displayName: "Brazil",
        accidents: 195000,
        trend: "+4.3%",
        level: "High",
        color: "#d94b4b",
    },
    "South Korea": {
        displayName: "South Korea",
        accidents: 51000,
        trend: "-1.2%",
        level: "Medium",
        color: "#f4c542",
    },
    "Saudi Arabia": {
        displayName: "Saudi Arabia",
        accidents: 45000,
        trend: "+3.8%",
        level: "Medium",
        color: "#f4c542",
    },
    "South Africa": {
        displayName: "South Africa",
        accidents: 89000,
        trend: "+2.1%",
        level: "High",
        color: "#d94b4b",
    },
    Netherlands: {
        displayName: "Netherlands",
        accidents: 21000,
        trend: "-4.5%",
        level: "Low",
        color: "#10a66a",
    },
    Switzerland: {
        displayName: "Switzerland",
        accidents: 12000,
        trend: "-5.2%",
        level: "Low",
        color: "#10a66a",
    },
    Mexico: {
        displayName: "Mexico",
        accidents: 145000,
        trend: "+6.1%",
        level: "High",
        color: "#d94b4b",
    },
    Singapore: {
        displayName: "Singapore",
        accidents: 8500,
        trend: "-2.8%",
        level: "Low",
        color: "#10a66a",
    },
};

// ─── Financial Capital Arcs ───────────────────────────────────────────────────

const CITY_ARCS: ArcDatum[] = [
    // NYSE → LSE
    { startLat: 40.71, startLng: -74.01, endLat: 51.51, endLng: -0.13, color: ["#0f8f72", "#ff6b5a"] },
    // LSE → Tokyo
    { startLat: 51.51, startLng: -0.13, endLat: 35.68, endLng: 139.69, color: ["#0f8f72", "#f4c542"] },
    // Tokyo → Hong Kong
    { startLat: 35.68, startLng: 139.69, endLat: 22.32, endLng: 114.17, color: ["#f4c542", "#ff6b5a"] },
    // Hong Kong → Mumbai
    { startLat: 22.32, startLng: 114.17, endLat: 19.08, endLng: 72.88, color: ["#ff6b5a", "#10a66a"] },
    // NYSE → Toronto
    { startLat: 40.71, startLng: -74.01, endLat: 43.65, endLng: -79.38, color: ["#0f8f72", "#2f80ed"] },
    // Sydney → Tokyo
    { startLat: -33.87, startLng: 151.21, endLat: 35.68, endLng: 139.69, color: ["#10a66a", "#f4c542"] },
    // Paris → Frankfurt
    { startLat: 48.85, startLng: 2.35, endLat: 50.11, endLng: 8.68, color: ["#f4c542", "#0f8f72"] },
    // NYSE → São Paulo
    { startLat: 40.71, startLng: -74.01, endLat: -23.55, endLng: -46.63, color: ["#ff6b5a", "#d94b4b"] },
    // Singapore → Mumbai
    { startLat: 1.35, startLng: 103.82, endLat: 19.08, endLng: 72.88, color: ["#2f80ed", "#10a66a"] },
    // LSE → Frankfurt
    { startLat: 51.51, startLng: -0.13, endLat: 50.11, endLng: 8.68, color: ["#ff6b5a", "#f4c542"] },
    // NYSE → London
    { startLat: 40.71, startLng: -74.01, endLat: 51.51, endLng: -0.18, color: ["#0f8f72", "#10a66a"] },
    // Dubai → Mumbai
    { startLat: 25.20, startLng: 55.27, endLat: 19.08, endLng: 72.88, color: ["#f4c542", "#10a66a"] },
];

const MARKET_POINTS: MarketPoint[] = [
    { country: "United States of America", city: "New York", code: "NYSE", lat: 40.71, lng: -74.01, color: "#10a66a" },
    { country: "United Kingdom", city: "London", code: "LSE", lat: 51.51, lng: -0.13, color: "#d94b4b" },
    { country: "Japan", city: "Tokyo", code: "TYO", lat: 35.68, lng: 139.69, color: "#10a66a" },
    { country: "China", city: "Hong Kong", code: "HKG", lat: 22.32, lng: 114.17, color: "#d94b4b" },
    { country: "India", city: "Mumbai", code: "NSE", lat: 19.08, lng: 72.88, color: "#10a66a" },
    { country: "Germany", city: "Frankfurt", code: "DAX", lat: 50.11, lng: 8.68, color: "#10a66a" },
    { country: "France", city: "Paris", code: "CAC", lat: 48.85, lng: 2.35, color: "#d94b4b" },
    { country: "Canada", city: "Toronto", code: "TSX", lat: 43.65, lng: -79.38, color: "#10a66a" },
    { country: "Brazil", city: "Sao Paulo", code: "IBOV", lat: -23.55, lng: -46.63, color: "#10a66a" },
    { country: "Singapore", city: "Singapore", code: "STI", lat: 1.35, lng: 103.82, color: "#f4c542" },
    { country: "Australia", city: "Sydney", code: "ASX", lat: -33.87, lng: 151.21, color: "#f4c542" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCountryName(feature: GeoFeature): string {
    const p = feature.properties;
    return String(p?.ADMIN ?? p?.NAME ?? p?.name ?? "");
}

const STATE_DOT: Record<AccidentLevel, string> = {
    High: "#d94b4b",
    Medium: "#f4c542",
    Low: "#10a66a",
};

const GLOBE_TEXTURE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1024' height='512' viewBox='0 0 1024 512'%3E%3Cdefs%3E%3CradialGradient id='g' cx='42%25' cy='38%25' r='78%25'%3E%3Cstop offset='0%25' stop-color='%230d2450'/%3E%3Cstop offset='46%25' stop-color='%23081533'/%3E%3Cstop offset='100%25' stop-color='%23040a18'/%3E%3C/radialGradient%3E%3ClinearGradient id='s' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop offset='0%25' stop-color='%2306b6d4' stop-opacity='0.22'/%3E%3Cstop offset='58%25' stop-color='%233b82f6' stop-opacity='0.10'/%3E%3Cstop offset='100%25' stop-color='%232563eb' stop-opacity='0.16'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='1024' height='512' fill='url(%23g)'/%3E%3Crect width='1024' height='512' fill='url(%23s)'/%3E%3C/svg%3E";

// ─── Component ────────────────────────────────────────────────────────────────

export function InteractiveMarketGlobe() {
    const globeRef = useRef<any>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [countries, setCountries] = useState<GeoFeature[]>([]);
    const [hoveredFeature, setHoveredFeature] = useState<GeoFeature | null>(null);
    const [hoveredPoint, setHoveredPoint] = useState<MarketPoint | null>(null);
    const [selectedPoint, setSelectedPoint] = useState<MarketPoint>(MARKET_POINTS[0]);
    const [tooltip, setTooltip] = useState<TooltipState>(null);
    const [isHovering, setIsHovering] = useState(false);
    const [size, setSize] = useState({ width: 620, height: 620 });

    const ringMarkets = useMemo(() => {
        const points = [MARKET_POINTS[0], MARKET_POINTS[2], MARKET_POINTS[4], selectedPoint, hoveredPoint].filter(
            Boolean
        ) as MarketPoint[];

        return Array.from(new Map(points.map((point) => [point.country, point])).values());
    }, [hoveredPoint, selectedPoint]);

    // ── Fetch GeoJSON ─────────────────────────────────────────────────────────

    useEffect(() => {
        fetch(
            "https://raw.githubusercontent.com/vasturiano/react-globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson"
        )
            .then((r) => r.json())
            .then((data: { features: GeoFeature[] }) => {
                setCountries(data.features ?? []);
            })
            .catch(console.error);
    }, []);

    // ── Responsive container ──────────────────────────────────────────────────

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => {
            const { width, height } = el.getBoundingClientRect();
            if (width > 0 && height > 0) setSize({ width, height });
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // ── Initial camera + auto-rotate ─────────────────────────────────────────

    useEffect(() => {
        if (!countries.length) return;
        const t = setTimeout(() => {
            globeRef.current?.pointOfView?.({ altitude: 2.1 }, 1000);
        }, 300);
        return () => clearTimeout(t);
    }, [countries]);

    useEffect(() => {
        const controls = globeRef.current?.controls?.();
        if (!controls) return;
        controls.autoRotate = !isHovering;
        controls.autoRotateSpeed = isHovering ? 0.08 : 0.42;
        controls.enableZoom = false;
        controls.enablePan = false;
        controls.enableRotate = true;
    }, [isHovering]);

    // ── Polygon color accessor ────────────────────────────────────────────────

    const getPolygonColor = useCallback(
        (feat: object) => {
            const feature = feat as GeoFeature;
            const name = getCountryName(feature);
            const isHovered = feature === hoveredFeature;
            const info = ACCIDENT_DATA[name];

            if (isHovered && info) return info.color;
            if (isHovered) return "rgba(59,130,246,0.9)";
            if (info) return `${info.color}d9`;
            return "rgba(164,185,200,0.74)";
        },
        [hoveredFeature]
    );

    // ── Polygon altitude accessor ─────────────────────────────────────────────

    const getPolygonAltitude = useCallback(
        (feat: object) => {
            const feature = feat as GeoFeature;
            const name = getCountryName(feature);
            if (feature === hoveredFeature) return 0.12;
            return ACCIDENT_DATA[name] ? 0.035 : 0.008;
        },
        [hoveredFeature]
    );

    // ── Hover handlers ────────────────────────────────────────────────────────

    const handlePolygonHover = useCallback((feat: object | null) => {
        const feature = feat as GeoFeature | null;
        setHoveredFeature(feature);
        setIsHovering(!!feature);
        if (feature) setHoveredPoint(null);
        if (!feature) setTooltip(null);
    }, []);

    const focusMarketPoint = useCallback((point: MarketPoint) => {
        setSelectedPoint(point);
        globeRef.current?.pointOfView?.({ lat: point.lat, lng: point.lng, altitude: 1.52 }, 900);
    }, []);

    const handlePolygonClick = useCallback(
        (feat: object | null) => {
            const feature = feat as GeoFeature | null;
            if (!feature) return;

            const name = getCountryName(feature);
            const point = MARKET_POINTS.find((marketPoint) => marketPoint.country === name);
            if (point) focusMarketPoint(point);
        },
        [focusMarketPoint]
    );

    const handlePointHover = useCallback((pointObj: object | null) => {
        const point = pointObj as MarketPoint | null;
        setHoveredPoint(point);
        setIsHovering(!!point);
        if (point) setHoveredFeature(null);
        if (!point) setTooltip(null);
    }, []);

    const handlePointClick = useCallback(
        (pointObj: object | null) => {
            const point = pointObj as MarketPoint | null;
            if (!point) return;
            setHoveredPoint(point);
            focusMarketPoint(point);
        },
        [focusMarketPoint]
    );

    const handleMouseMove = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
            if (hoveredPoint) {
                const data = ACCIDENT_DATA[hoveredPoint.country];
                if (data) {
                    setTooltip({ x: e.clientX, y: e.clientY, data, country: hoveredPoint.country });
                }
                return;
            }

            if (!hoveredFeature) {
                setTooltip(null);
                return;
            }
            const name = getCountryName(hoveredFeature);
            const data = ACCIDENT_DATA[name];
            if (data) {
                setTooltip({ x: e.clientX, y: e.clientY, data, country: name });
            } else {
                setTooltip(null);
            }
        },
        [hoveredFeature, hoveredPoint]
    );

    const handleMouseLeave = useCallback(() => {
        setIsHovering(false);
        setHoveredFeature(null);
        setHoveredPoint(null);
        setTooltip(null);
    }, []);

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div
            ref={containerRef}
            className="relative h-full w-full flex items-center justify-center"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ cursor: hoveredFeature || hoveredPoint ? "pointer" : "grab" }}
        >
            {/* Glow ring behind globe */}
            <div
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full"
                style={{
                    background:
                        "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18) 0%, rgba(59,130,246,0.28) 22%, rgba(6,182,212,0.20) 42%, rgba(59,130,246,0.14) 58%, transparent 76%)",
                    boxShadow: "0 0 90px rgba(59,130,246,0.22)",
                }}
            />
            <div
                className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full"
                style={{
                    background:
                        "conic-gradient(from 130deg, rgba(59,130,246,0.26), rgba(6,182,212,0.22), rgba(59,130,246,0.24), rgba(6,182,212,0.16), rgba(59,130,246,0.26))",
                    filter: "blur(22px)",
                    opacity: 0.7,
                }}
            />
            
            <div className="absolute inset-0 flex items-center justify-center">

            <Globe
                ref={globeRef}
                width={size.width}
                height={size.height}
                backgroundColor="rgba(0,0,0,0)"
                globeImageUrl={GLOBE_TEXTURE}
                showGraticules
                atmosphereColor="rgba(59,130,246,0.64)"
                atmosphereAltitude={0.26}
                // Polygons
                polygonsData={countries}
                polygonCapColor={getPolygonColor}
                polygonSideColor={() => "rgba(255,255,255,0.08)"}
                polygonStrokeColor={() => "rgba(255,255,255,0.32)"}
                polygonAltitude={getPolygonAltitude}
                polygonsTransitionDuration={180}
                onPolygonHover={handlePolygonHover}
                onPolygonClick={handlePolygonClick}
                // Market centers
                pointsData={MARKET_POINTS}
                pointLat={(d: object) => (d as MarketPoint).lat}
                pointLng={(d: object) => (d as MarketPoint).lng}
                pointColor={(d: object) => ((d as MarketPoint).country === selectedPoint.country ? "#ff6b5a" : (d as MarketPoint).color)}
                pointRadius={(d: object) => ((d as MarketPoint).country === selectedPoint.country ? 0.78 : 0.52)}
                pointAltitude={(d: object) => ((d as MarketPoint).country === selectedPoint.country ? 0.17 : 0.09)}
                pointResolution={24}
                onPointHover={handlePointHover}
                onPointClick={handlePointClick}
                labelsData={MARKET_POINTS}
                labelLat={(d: object) => (d as MarketPoint).lat}
                labelLng={(d: object) => (d as MarketPoint).lng}
                labelText={(d: object) => (d as MarketPoint).code}
                labelColor={(d: object) => ((d as MarketPoint).country === selectedPoint.country ? "#ff6b5a" : "#096a55")}
                labelSize={(d: object) => ((d as MarketPoint).country === selectedPoint.country ? 0.92 : 0.66)}
                labelDotRadius={0.2}
                labelAltitude={0.21}
                labelResolution={2}
                // Active pulses
                ringsData={ringMarkets}
                ringLat={(d: object) => (d as MarketPoint).lat}
                ringLng={(d: object) => (d as MarketPoint).lng}
                ringColor={(d: object) => ["rgba(255,255,255,0.90)", `${(d as MarketPoint).color}dd`, "rgba(255,107,90,0.06)"]}
                ringAltitude={0.075}
                ringResolution={96}
                ringMaxRadius={4.8}
                ringPropagationSpeed={1.45}
                ringRepeatPeriod={1350}
                // Arcs
                arcsData={CITY_ARCS}
                arcColor={(d: object) => (d as ArcDatum).color}
                arcDashLength={0.46}
                arcDashGap={0.18}
                arcDashAnimateTime={1500}
                arcStroke={0.62}
                arcAltitude={0.24}
                arcAltitudeAutoScale={0.42}
            />

            {/* Floating tooltip */}
            <AnimatePresence>
                {tooltip && (
                    <motion.div
                        key="globe-tooltip"
                        initial={{ opacity: 0, scale: 0.88, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.88, y: 8 }}
                        transition={{ duration: 0.11, ease: "easeOut" }}
                        className="pointer-events-none fixed z-[200]"
                        style={{ left: tooltip.x + 20, top: tooltip.y - 10 }}
                    >
                        <div className="rounded-xl border border-[#dbe7df] bg-white/95 px-3.5 py-3 shadow-2xl backdrop-blur-md">
                            {/* Country label */}
                            <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[#66746f]">
                                {tooltip.data.displayName}
                            </p>

                            {/* Index name */}
                            <p className="mt-0.5 font-mono text-[13px] font-semibold text-[#17201d]">
                                {tooltip.data.accidents.toLocaleString()} Accidents (2025)
                            </p>

                            {/* Change + state badge */}
                            <div className="mt-2 flex items-center gap-2">
                                <span
                                    className="font-mono text-[13px] font-bold tabular-nums"
                                    style={{ color: tooltip.data.color }}
                                >
                                    {tooltip.data.trend}
                                </span>

                                <span
                                    className="flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider"
                                    style={{
                                        backgroundColor: `${tooltip.data.color}18`,
                                        color: tooltip.data.color,
                                    }}
                                >
                                    <span
                                        className="inline-block size-1.5 rounded-full"
                                        style={{ backgroundColor: STATE_DOT[tooltip.data.level] }}
                                    />
                                    {tooltip.data.level}
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            </div>
        </div>
    );
}