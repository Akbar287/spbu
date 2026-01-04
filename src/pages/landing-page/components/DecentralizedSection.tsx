import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Globe, Server, Zap, Users, Link2, Activity, Sparkles, Shield, Database } from 'lucide-react';

// Define node positions on the globe (latitude, longitude)
interface GlobeNode {
    id: number;
    name: string;
    lat: number;
    lng: number;
    size?: number;
}

// Key locations around the world for SPBU nodes
const globeNodes: GlobeNode[] = [
    { id: 0, name: 'Jakarta', lat: -6.2, lng: 106.8, size: 1.3 },
    { id: 1, name: 'Surabaya', lat: -7.25, lng: 112.75, size: 1.1 },
    { id: 2, name: 'Medan', lat: 3.59, lng: 98.67, size: 1 },
    { id: 3, name: 'Bandung', lat: -6.91, lng: 107.6, size: 0.9 },
    { id: 4, name: 'Makassar', lat: -5.14, lng: 119.42, size: 1 },
    { id: 5, name: 'Singapore', lat: 1.35, lng: 103.82, size: 0.9 },
    { id: 6, name: 'Kuala Lumpur', lat: 3.14, lng: 101.69, size: 0.8 },
    { id: 7, name: 'Bangkok', lat: 13.75, lng: 100.5, size: 0.8 },
    { id: 8, name: 'Sydney', lat: -33.87, lng: 151.21, size: 0.8 },
    { id: 9, name: 'Tokyo', lat: 35.68, lng: 139.69, size: 0.9 },
    { id: 10, name: 'Dubai', lat: 25.2, lng: 55.27, size: 0.7 },
    { id: 11, name: 'Mumbai', lat: 19.08, lng: 72.88, size: 0.8 },
    { id: 12, name: 'Bali', lat: -8.34, lng: 115.09, size: 0.9 },
    { id: 13, name: 'Palembang', lat: -2.99, lng: 104.75, size: 0.8 },
    { id: 14, name: 'Hong Kong', lat: 22.32, lng: 114.17, size: 0.8 },
];

// Connections between nodes
const connections: [number, number][] = [
    [0, 1], [0, 3], [0, 5], [0, 12], [0, 13],
    [1, 4], [1, 12],
    [2, 6], [2, 7], [2, 13],
    [3, 13],
    [4, 8], [4, 12],
    [5, 6], [5, 7], [5, 14],
    [6, 7], [6, 11],
    [7, 9], [7, 14],
    [8, 9],
    [9, 14],
    [10, 11],
];

// Simplified continent outlines (lat, lng points)
const continents = {
    asia: [
        // Main Asia landmass (simplified)
        [70, 40], [80, 50], [90, 55], [100, 60], [110, 65], [120, 65], [130, 60], [140, 55], [145, 50], [150, 45],
        [145, 40], [140, 35], [135, 30], [130, 25], [125, 20], [120, 15], [115, 10], [110, 5], [105, 0],
        [100, -5], [95, -8], [100, 5], [95, 10], [90, 15], [85, 20], [80, 25], [75, 20], [70, 25],
        [65, 30], [55, 35], [50, 40], [55, 45], [60, 50], [65, 50], [70, 45], [70, 40],
    ],
    indonesia: [
        // Sumatra
        [95, 5], [98, 3], [100, 0], [104, -2], [106, -6], [105, -5], [102, -3], [98, 0], [95, 3], [95, 5],
    ],
    java: [
        [105, -6], [107, -6.5], [110, -7], [112, -7.5], [114, -8], [112, -8], [109, -8], [106, -7], [105, -6],
    ],
    kalimantan: [
        [109, 1], [112, 2], [115, 3], [117, 2], [118, 0], [117, -2], [115, -3], [113, -3], [110, -2], [109, 0], [109, 1],
    ],
    sulawesi: [
        [119, 1], [120, 0], [121, -1], [122, -3], [121, -5], [120, -5], [119, -3], [120, -1], [119, 1],
    ],
    papua: [
        [130, -2], [135, -3], [138, -4], [140, -5], [141, -6], [140, -8], [137, -8], [134, -7], [131, -5], [130, -3], [130, -2],
    ],
    australia: [
        [115, -20], [120, -18], [130, -15], [135, -12], [140, -12], [145, -15], [150, -20], [153, -25], [150, -30],
        [147, -35], [145, -38], [140, -38], [135, -35], [130, -32], [125, -30], [120, -32], [115, -33], [114, -28],
        [115, -25], [115, -20],
    ],
    africa: [
        [0, 35], [10, 35], [20, 32], [30, 30], [35, 25], [40, 15], [45, 10], [50, 10], [45, 0], [40, -5],
        [35, -15], [30, -25], [25, -33], [20, -34], [15, -30], [12, -25], [10, -15], [5, -5], [0, 5],
        [-5, 10], [-15, 15], [-17, 20], [-15, 25], [-10, 30], [-5, 33], [0, 35],
    ],
    europe: [
        [-10, 35], [0, 38], [5, 43], [3, 47], [7, 50], [10, 55], [20, 55], [30, 60], [40, 65], [50, 65],
        [60, 60], [55, 55], [50, 50], [45, 45], [40, 42], [35, 40], [30, 40], [25, 38], [20, 35], [10, 35],
        [0, 35], [-10, 35],
    ],
    northAmerica: [
        [-170, 65], [-165, 60], [-160, 55], [-145, 60], [-130, 55], [-125, 50], [-125, 45], [-120, 40],
        [-115, 35], [-110, 30], [-105, 25], [-100, 22], [-95, 18], [-90, 20], [-85, 22], [-80, 25],
        [-75, 30], [-70, 40], [-65, 45], [-60, 50], [-70, 55], [-80, 60], [-90, 65], [-100, 70],
        [-120, 70], [-140, 70], [-160, 68], [-170, 65],
    ],
    southAmerica: [
        [-80, 10], [-75, 5], [-70, 0], [-75, -5], [-80, -5], [-75, -15], [-70, -20], [-65, -25],
        [-60, -30], [-55, -35], [-60, -45], [-65, -53], [-70, -50], [-75, -45], [-75, -35], [-70, -30],
        [-75, -25], [-80, -20], [-81, -15], [-80, -5], [-77, 0], [-80, 8], [-80, 10],
    ],
};

// Convert lat/lng to 3D sphere coordinates
const latLngToSphere = (lat: number, lng: number, radius: number) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return { x, y, z };
};

// Project 3D to 2D with perspective
const project3Dto2D = (x: number, y: number, z: number, rotationY: number, centerX: number, centerY: number, scale: number) => {
    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);
    const rotatedX = x * cosY - z * sinY;
    const rotatedZ = x * sinY + z * cosY;

    const perspective = 500;
    const projectedScale = perspective / (perspective + rotatedZ);

    return {
        x: centerX + rotatedX * scale * projectedScale,
        y: centerY - y * scale * projectedScale,
        z: rotatedZ,
        scale: projectedScale,
    };
};

const Globe3D: React.FC = () => {
    const [rotation, setRotation] = React.useState(2.5); // Start showing Asia/Indonesia
    const globeRadius = 140;
    const centerX = 170;
    const centerY = 170;
    const scale = 1;

    // Animate rotation
    React.useEffect(() => {
        const interval = setInterval(() => {
            setRotation(prev => (prev + 0.003) % (Math.PI * 2));
        }, 16);
        return () => clearInterval(interval);
    }, []);

    // Project continent points
    const projectContinent = (points: number[][], isFilled: boolean = true) => {
        const projectedPoints = points.map(([lng, lat]) => {
            const sphere = latLngToSphere(lat, lng, globeRadius);
            return project3Dto2D(sphere.x, sphere.y, sphere.z, rotation, centerX, centerY, scale);
        });

        // Check if most points are visible (front of globe)
        const visibleCount = projectedPoints.filter(p => p.z > -globeRadius * 0.3).length;
        const isVisible = visibleCount > points.length * 0.3;

        if (!isVisible) return null;

        const pathData = projectedPoints
            .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
            .join(' ') + (isFilled ? ' Z' : '');

        const avgZ = projectedPoints.reduce((sum, p) => sum + p.z, 0) / projectedPoints.length;
        const opacity = Math.max(0.2, Math.min(1, (avgZ + globeRadius) / (globeRadius * 2)));

        return { pathData, opacity, avgZ };
    };

    // Calculate projected positions for nodes
    const projectedNodes = useMemo(() => {
        return globeNodes.map(node => {
            const sphere = latLngToSphere(node.lat, node.lng, globeRadius);
            const projected = project3Dto2D(sphere.x, sphere.y, sphere.z, rotation, centerX, centerY, scale);
            return {
                ...node,
                ...projected,
                visible: projected.z > -10,
            };
        });
    }, [rotation]);

    // Project all continents
    const projectedContinents = useMemo(() => {
        const results: { name: string; pathData: string; opacity: number; avgZ: number }[] = [];

        Object.entries(continents).forEach(([name, points]) => {
            const projected = projectContinent(points);
            if (projected) {
                results.push({ name, ...projected });
            }
        });

        return results.sort((a, b) => a.avgZ - b.avgZ);
    }, [rotation]);

    return (
        <div className="relative w-full h-[340px] lg:h-[400px] flex items-center justify-center">
            {/* Glow effect */}
            <motion.div
                className="absolute w-64 h-64 lg:w-80 lg:h-80 rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.1) 40%, transparent 70%)',
                }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 4, repeat: Infinity }}
            />

            <svg
                viewBox="0 0 340 340"
                className="w-full h-full max-w-[340px]"
            >
                <defs>
                    {/* Ocean gradient */}
                    <radialGradient id="oceanGradient" cx="40%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="#1e40af" stopOpacity="0.6" />
                        <stop offset="50%" stopColor="#1e3a8a" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#0f172a" stopOpacity="0.4" />
                    </radialGradient>

                    {/* Ocean gradient light mode */}
                    <radialGradient id="oceanGradientLight" cx="40%" cy="40%" r="60%">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.7" />
                        <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#2563eb" stopOpacity="0.4" />
                    </radialGradient>

                    {/* Land gradient */}
                    <linearGradient id="landGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22c55e" stopOpacity="0.9" />
                        <stop offset="50%" stopColor="#16a34a" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#15803d" stopOpacity="0.7" />
                    </linearGradient>

                    {/* Connection gradient */}
                    <linearGradient id="connGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="50%" stopColor="#A855F7" />
                        <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>

                    {/* Glow filter */}
                    <filter id="glowFilter" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Strong glow */}
                    <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Globe base - Ocean */}
                <circle
                    cx={centerX}
                    cy={centerY}
                    r={globeRadius}
                    className="fill-blue-500/40 dark:fill-blue-900/60"
                />

                {/* Atmosphere glow */}
                <circle
                    cx={centerX}
                    cy={centerY}
                    r={globeRadius + 3}
                    fill="none"
                    stroke="url(#connGradient)"
                    strokeWidth="3"
                    opacity="0.3"
                    filter="url(#glowFilter)"
                />

                {/* Continents */}
                {projectedContinents.map(({ name, pathData, opacity }) => (
                    <motion.path
                        key={name}
                        d={pathData}
                        fill="url(#landGradient)"
                        stroke="#15803d"
                        strokeWidth="0.5"
                        opacity={opacity * 0.9}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: opacity * 0.9 }}
                        transition={{ duration: 0.3 }}
                    />
                ))}

                {/* Network connections */}
                {connections.map(([from, to], i) => {
                    const fromNode = projectedNodes[from];
                    const toNode = projectedNodes[to];

                    if (!fromNode.visible || !toNode.visible) return null;

                    const midOpacity = Math.min(fromNode.scale, toNode.scale) * 0.8;

                    return (
                        <g key={`conn-${i}`}>
                            <motion.line
                                x1={fromNode.x}
                                y1={fromNode.y}
                                x2={toNode.x}
                                y2={toNode.y}
                                stroke="url(#connGradient)"
                                strokeWidth="1.5"
                                opacity={midOpacity}
                                filter="url(#glowFilter)"
                                animate={{
                                    opacity: [midOpacity * 0.5, midOpacity, midOpacity * 0.5],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.15,
                                }}
                            />
                            {/* Data pulse */}
                            <motion.circle
                                r="2"
                                fill="#06B6D4"
                                filter="url(#strongGlow)"
                                animate={{
                                    cx: [fromNode.x, toNode.x],
                                    cy: [fromNode.y, toNode.y],
                                    opacity: [0, 1, 1, 0],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    delay: i * 0.2,
                                    ease: "linear"
                                }}
                            />
                        </g>
                    );
                })}

                {/* Nodes */}
                {projectedNodes
                    .filter(node => node.visible)
                    .sort((a, b) => a.z - b.z)
                    .map((node) => {
                        const nodeSize = (node.size || 1) * 5 * node.scale;
                        const opacity = Math.max(0.4, node.scale);

                        return (
                            <g key={node.id}>
                                {/* Pulse */}
                                <motion.circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={nodeSize}
                                    fill="none"
                                    stroke="#8B5CF6"
                                    strokeWidth="1"
                                    animate={{
                                        r: [nodeSize, nodeSize * 3],
                                        opacity: [opacity * 0.6, 0],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        delay: node.id * 0.15,
                                    }}
                                />
                                {/* Main node */}
                                <motion.circle
                                    cx={node.x}
                                    cy={node.y}
                                    r={nodeSize}
                                    fill="url(#connGradient)"
                                    filter="url(#strongGlow)"
                                    opacity={opacity}
                                    animate={{
                                        r: [nodeSize, nodeSize * 1.2, nodeSize],
                                    }}
                                    transition={{
                                        duration: 1.5,
                                        repeat: Infinity,
                                        delay: node.id * 0.1,
                                    }}
                                />
                                {/* Highlight */}
                                <circle
                                    cx={node.x - nodeSize * 0.25}
                                    cy={node.y - nodeSize * 0.25}
                                    r={nodeSize * 0.25}
                                    fill="white"
                                    opacity={opacity * 0.5}
                                />
                            </g>
                        );
                    })}
            </svg>

            {/* Node counter */}
            <motion.div
                className="absolute top-2 right-2 px-3 py-1.5 rounded-full bg-violet-100/90 dark:bg-violet-500/20 backdrop-blur-sm border border-violet-200 dark:border-violet-500/30"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <span className="text-xs font-medium text-violet-700 dark:text-violet-300 flex items-center gap-1">
                    <motion.span
                        className="w-2 h-2 bg-emerald-500 rounded-full"
                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    />
                    {globeNodes.length} Node Aktif
                </span>
            </motion.div>
        </div>
    );
};

const DecentralizedSection: React.FC = () => {
    const benefits = [
        {
            icon: Server,
            title: "No Single Point of Failure",
            description: "Jaringan tetap berjalan meski beberapa node offline.",
            color: "from-violet-500 to-purple-600",
            delay: 0,
        },
        {
            icon: Users,
            title: "Peer-to-Peer Network",
            description: "Setiap peserta adalah bagian dari jaringan.",
            color: "from-cyan-500 to-blue-600",
            delay: 0.1,
        },
        {
            icon: Link2,
            title: "Konsensus Terdistribusi",
            description: "Keputusan dibuat bersama oleh validator.",
            color: "from-emerald-500 to-green-600",
            delay: 0.2,
        },
        {
            icon: Zap,
            title: "Sinkronisasi Real-time",
            description: "Data terupdate secara real-time di semua node.",
            color: "from-amber-500 to-orange-600",
            delay: 0.3,
        },
        {
            icon: Activity,
            title: "Fault Tolerance",
            description: "Sistem beroperasi normal meski ada kegagalan.",
            color: "from-rose-500 to-pink-600",
            delay: 0.4,
        },
        {
            icon: Shield,
            title: "Keamanan Terjamin",
            description: "Enkripsi dan validasi di setiap transaksi.",
            color: "from-indigo-500 to-violet-600",
            delay: 0.5,
        },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2,
            },
        },
    };

    const cardVariants = {
        hidden: { opacity: 0, x: -30, scale: 0.95 },
        visible: {
            opacity: 1,
            x: 0,
            scale: 1,
            transition: {
                type: "spring" as const,
                stiffness: 100,
                damping: 15,
            },
        },
    };

    return (
        <section className="relative py-20 lg:py-28 overflow-hidden">
            {/* Background - matching HeroSection */}
            <div className="absolute inset-0 bg-purple-100/80 dark:bg-slate-900">
                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Rotating gradient orb */}
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
                    }}
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 180, 360] }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                />

                {/* Floating particles */}
                {[...Array(12)].map((_, i) => (
                    <motion.div
                        key={`particle-${i}`}
                        className="absolute w-2 h-2 rounded-full bg-violet-400/30 dark:bg-violet-400/20"
                        style={{
                            left: `${8 + i * 8}%`,
                            top: `${10 + (i % 5) * 20}%`,
                        }}
                        animate={{
                            y: [0, -35, 0],
                            x: [0, i % 2 === 0 ? 20 : -20, 0],
                            opacity: [0.2, 0.6, 0.2],
                            scale: [1, 1.4, 1],
                        }}
                        transition={{
                            duration: 4 + i * 0.4,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-12 lg:mb-16"
                >
                    <motion.span
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 text-sm font-medium mb-4"
                        initial={{ scale: 0.9 }}
                        whileInView={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                    >
                        <motion.span
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                            <Globe className="w-4 h-4" />
                        </motion.span>
                        Jaringan Terdistribusi
                    </motion.span>
                    <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                        Kekuatan{' '}
                        <motion.span
                            className="bg-gradient-to-r from-violet-600 to-cyan-600 dark:from-violet-400 dark:to-cyan-400 bg-clip-text text-transparent"
                            animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                            transition={{ duration: 5, repeat: Infinity }}
                        >
                            Desentralisasi
                        </motion.span>
                    </h2>
                    <p className="text-base lg:text-lg text-slate-600 dark:text-white/60 max-w-2xl mx-auto">
                        Jaringan blockchain terdesentralisasi memastikan keamanan dan transparansi maksimal.
                    </p>
                </motion.div>

                {/* Main Content - Cards Left, Globe Right on lg */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                    {/* Cards Grid */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4 order-2 lg:order-1"
                    >
                        {benefits.map((benefit, index) => (
                            <motion.div
                                key={index}
                                variants={cardVariants}
                                whileHover={{
                                    scale: 1.03,
                                    y: -5,
                                    transition: { type: "spring", stiffness: 300 }
                                }}
                                whileTap={{ scale: 0.98 }}
                                className="group relative p-5 rounded-2xl bg-gradient-to-br from-white to-slate-50 dark:from-white/5 dark:to-white/0 border border-slate-200 dark:border-white/10 hover:border-violet-300 dark:hover:border-violet-500/40 shadow-lg shadow-slate-200/50 dark:shadow-none transition-colors duration-300 overflow-hidden cursor-pointer"
                            >
                                {/* Hover gradient overlay */}
                                <motion.div
                                    className={`absolute inset-0 bg-gradient-to-br ${benefit.color} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-300`}
                                />

                                {/* Animated border */}
                                <motion.div
                                    className="absolute inset-0 rounded-2xl pointer-events-none"
                                    style={{
                                        background: `linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)`,
                                        backgroundSize: '200% 100%',
                                    }}
                                    initial={{ opacity: 0 }}
                                    animate={{
                                        backgroundPosition: ['200% 0', '-200% 0'],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        delay: benefit.delay * 2,
                                    }}
                                    whileHover={{ opacity: 1 }}
                                />

                                {/* Icon */}
                                <motion.div
                                    className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-3 shadow-lg`}
                                    whileHover={{
                                        rotate: [0, -10, 10, 0],
                                        scale: 1.1,
                                    }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <benefit.icon className="w-5 h-5 text-white" />
                                    <motion.div
                                        className="absolute inset-0 rounded-xl bg-white/20"
                                        animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: benefit.delay }}
                                    />
                                </motion.div>

                                {/* Content */}
                                <motion.h3
                                    className="text-base font-semibold text-slate-900 dark:text-white mb-1.5 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors"
                                    initial={{ x: 0 }}
                                    whileHover={{ x: 3 }}
                                >
                                    {benefit.title}
                                </motion.h3>
                                <p className="text-sm text-slate-600 dark:text-white/50 leading-relaxed">
                                    {benefit.description}
                                </p>

                                {/* Sparkle effect on hover */}
                                <motion.div
                                    className="absolute top-3 right-3 text-violet-400 opacity-0 group-hover:opacity-100"
                                    initial={{ scale: 0, rotate: 0 }}
                                    whileHover={{ scale: 1, rotate: 180 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Sparkles className="w-4 h-4" />
                                </motion.div>
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* 3D Globe */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, x: 50 }}
                        whileInView={{ opacity: 1, scale: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, type: "spring" }}
                        className="order-1 lg:order-2 flex justify-center lg:justify-end"
                    >
                        <div className="relative">
                            {/* Decorative rings */}
                            <motion.div
                                className="absolute inset-0 -m-8 rounded-full border border-violet-200 dark:border-violet-500/20"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            />
                            <motion.div
                                className="absolute inset-0 -m-16 rounded-full border border-dashed border-cyan-200 dark:border-cyan-500/20"
                                animate={{ rotate: -360 }}
                                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                            />

                            <Globe3D />

                            {/* Floating labels */}
                            <motion.div
                                className="absolute -left-4 top-1/4 px-2 py-1 rounded-lg bg-violet-100/90 dark:bg-violet-500/20 backdrop-blur-sm text-xs text-violet-700 dark:text-violet-300 font-medium"
                                animate={{ y: [0, -5, 0], opacity: [0.8, 1, 0.8] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                <Database className="w-3 h-3 inline mr-1" />
                                Blockchain
                            </motion.div>

                            <motion.div
                                className="absolute -right-4 bottom-1/4 px-2 py-1 rounded-lg bg-cyan-100/90 dark:bg-cyan-500/20 backdrop-blur-sm text-xs text-cyan-700 dark:text-cyan-300 font-medium"
                                animate={{ y: [0, 5, 0], opacity: [0.8, 1, 0.8] }}
                                transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                            >
                                <Zap className="w-3 h-3 inline mr-1" />
                                Real-time
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default DecentralizedSection;
