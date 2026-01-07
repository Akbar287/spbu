import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Server, Cloud, Lock, Users, ArrowRight, Globe, Blocks, Sparkles, Smartphone, Laptop, Monitor, Box, Shield, Zap } from 'lucide-react';

// Web 2.0 Animation - Central Server with devices
const Web2Animation: React.FC = () => {
    const devices = [
        { icon: Smartphone, angle: 0, size: 32, distance: 90, delay: 0 },
        { icon: Laptop, angle: 72, size: 36, distance: 95, delay: 0.2 },
        { icon: Monitor, angle: 144, size: 38, distance: 90, delay: 0.4 },
        { icon: Smartphone, angle: 216, size: 30, distance: 88, delay: 0.6 },
        { icon: Laptop, angle: 288, size: 34, distance: 92, delay: 0.8 },
    ];

    return (
        <div className="relative w-56 h-56 mx-auto">
            {/* Connection lines from devices to server */}
            <svg className="absolute inset-0 w-full h-full">
                <defs>
                    <linearGradient id="web2Line" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#f87171" stopOpacity="0.6" />
                    </linearGradient>
                </defs>
                {devices.map((device, i) => {
                    const rad = (device.angle * Math.PI) / 180;
                    const x = 112 + Math.cos(rad) * device.distance;
                    const y = 112 + Math.sin(rad) * device.distance;
                    return (
                        <motion.line
                            key={i}
                            x1="112"
                            y1="112"
                            x2={x}
                            y2={y}
                            stroke="url(#web2Line)"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                            animate={{
                                strokeDashoffset: [0, 8],
                                opacity: [0.4, 0.8, 0.4],
                            }}
                            transition={{
                                strokeDashoffset: { duration: 1, repeat: Infinity, ease: "linear" },
                                opacity: { duration: 2, repeat: Infinity, delay: device.delay },
                            }}
                        />
                    );
                })}
            </svg>

            {/* Central Server */}
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                {/* Server glow */}
                <motion.div
                    className="absolute inset-0 -m-4 bg-red-500/30 rounded-2xl blur-xl"
                    animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
                <div className="relative w-20 h-24 bg-gradient-to-b from-slate-700 to-slate-800 rounded-lg border-2 border-red-400/50 shadow-xl overflow-hidden">
                    {/* Server lights */}
                    <div className="absolute top-2 left-2 right-2 flex gap-1">
                        <motion.div
                            className="w-2 h-2 rounded-full bg-red-500"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        />
                        <motion.div
                            className="w-2 h-2 rounded-full bg-yellow-500"
                            animate={{ opacity: [1, 0.3, 1] }}
                            transition={{ duration: 0.7, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                            className="w-2 h-2 rounded-full bg-green-500"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        />
                    </div>
                    {/* Server racks */}
                    <div className="absolute top-8 left-2 right-2 space-y-1">
                        {[0, 1, 2, 3].map(i => (
                            <motion.div
                                key={i}
                                className="h-2 bg-slate-600 rounded"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                            />
                        ))}
                    </div>
                    {/* Data flow indicator */}
                    <motion.div
                        className="absolute bottom-2 left-2 right-2 h-1 bg-gradient-to-r from-red-500 via-yellow-500 to-red-500 rounded"
                        animate={{ backgroundPosition: ['0% 0%', '200% 0%'] }}
                        style={{ backgroundSize: '200% 100%' }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    />
                </div>
            </motion.div>

            {/* Orbiting devices */}
            {devices.map((device, i) => {
                const rad = (device.angle * Math.PI) / 180;
                const x = 112 + Math.cos(rad) * device.distance - device.size / 2;
                const y = 112 + Math.sin(rad) * device.distance - device.size / 2;
                const Icon = device.icon;

                return (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{ left: x, top: y, width: device.size, height: device.size }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: 1,
                            scale: [1, 1.1, 1],
                        }}
                        transition={{
                            opacity: { delay: device.delay, duration: 0.5 },
                            scale: { duration: 2, repeat: Infinity, delay: device.delay }
                        }}
                    >
                        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-lg shadow-lg flex items-center justify-center border border-red-300 dark:border-red-500/30">
                            <Icon className="w-1/2 h-1/2 text-slate-600 dark:text-slate-300" />
                        </div>
                        {/* Connection dot */}
                        <motion.div
                            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full"
                            animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.3, 0.8] }}
                            transition={{ duration: 1, repeat: Infinity, delay: device.delay }}
                        />
                    </motion.div>
                );
            })}

            {/* Single point of failure warning */}
            <motion.div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-red-100 dark:bg-red-500/20 rounded-full border border-red-300 dark:border-red-500/30"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <span className="text-[10px] text-red-600 dark:text-red-400 font-medium whitespace-nowrap flex items-center gap-1">
                    <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                    >⚠️</motion.span>
                    Single Point of Failure
                </span>
            </motion.div>
        </div>
    );
};

// Web 3.0 Animation - 12 rotating cubes with chains (like Scene 7)
const Web3Animation: React.FC = () => {
    // 12 cubes with random rotations
    const cubes = useMemo(() => [
        { x: -70, y: -50, size: 28, speed: 6, xDir: 1, yDir: -1 },
        { x: 0, y: -70, size: 32, speed: 8, xDir: -1, yDir: 1 },
        { x: 70, y: -50, size: 28, speed: 7, xDir: 1, yDir: 1 },
        { x: -85, y: 0, size: 30, speed: 5, xDir: -1, yDir: -1 },
        { x: 85, y: 0, size: 30, speed: 9, xDir: 1, yDir: -1 },
        { x: -70, y: 50, size: 28, speed: 7, xDir: -1, yDir: 1 },
        { x: 0, y: 70, size: 32, speed: 6, xDir: 1, yDir: 1 },
        { x: 70, y: 50, size: 28, speed: 8, xDir: -1, yDir: -1 },
        { x: -40, y: -25, size: 24, speed: 10, xDir: 1, yDir: 1 },
        { x: 40, y: -25, size: 24, speed: 5, xDir: -1, yDir: 1 },
        { x: -40, y: 25, size: 24, speed: 7, xDir: 1, yDir: -1 },
        { x: 40, y: 25, size: 24, speed: 9, xDir: -1, yDir: -1 },
    ], []);

    // Chain connections
    const chains = [
        [0, 1], [1, 2], [0, 3], [2, 4], [3, 5], [4, 7],
        [5, 6], [6, 7], [0, 8], [1, 8], [1, 9], [2, 9],
        [3, 10], [5, 10], [4, 11], [7, 11], [8, 10], [9, 11],
        [8, 9], [10, 11], [6, 10], [6, 11],
    ];

    const centerX = 112;
    const centerY = 112;

    return (
        <div className="relative w-56 h-56 mx-auto">
            {/* Glow background */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
            >
                <div className="w-48 h-48 bg-gradient-to-br from-violet-500/30 to-cyan-500/30 rounded-full blur-2xl" />
            </motion.div>

            <svg className="absolute inset-0 w-full h-full">
                <defs>
                    <linearGradient id="web3Chain" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="50%" stopColor="#A855F7" />
                        <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                    <filter id="chainGlow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Chain connections */}
                {chains.map(([from, to], i) => (
                    <motion.line
                        key={i}
                        x1={centerX + cubes[from].x}
                        y1={centerY + cubes[from].y}
                        x2={centerX + cubes[to].x}
                        y2={centerY + cubes[to].y}
                        stroke="url(#web3Chain)"
                        strokeWidth="1.5"
                        filter="url(#chainGlow)"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{
                            pathLength: 1,
                            opacity: [0.3, 0.7, 0.3],
                        }}
                        transition={{
                            pathLength: { delay: i * 0.05, duration: 0.5 },
                            opacity: { duration: 2, repeat: Infinity, delay: i * 0.1 }
                        }}
                    />
                ))}

                {/* Data pulses */}
                {chains.slice(0, 8).map(([from, to], i) => (
                    <motion.circle
                        key={`pulse-${i}`}
                        r="2"
                        fill="#06B6D4"
                        filter="url(#chainGlow)"
                        animate={{
                            cx: [centerX + cubes[from].x, centerX + cubes[to].x],
                            cy: [centerY + cubes[from].y, centerY + cubes[to].y],
                            opacity: [0, 1, 1, 0],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: "linear"
                        }}
                    />
                ))}
            </svg>

            {/* 3D Cubes */}
            {cubes.map((cube, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    style={{
                        left: centerX + cube.x - cube.size / 2,
                        top: centerY + cube.y - cube.size / 2,
                        width: cube.size,
                        height: cube.size,
                        perspective: '200px',
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05, type: "spring" as const, stiffness: 100 }}
                >
                    <motion.div
                        className="w-full h-full"
                        style={{ transformStyle: 'preserve-3d' }}
                        animate={{
                            rotateX: [0, 360 * cube.xDir],
                            rotateY: [0, 360 * cube.yDir],
                        }}
                        transition={{
                            duration: cube.speed,
                            repeat: Infinity,
                            ease: "linear"
                        }}
                    >
                        {/* Cube faces */}
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-violet-500 to-violet-600 rounded border border-violet-400"
                            style={{ transform: `translateZ(${cube.size / 2}px)` }}
                        >
                            <Box className="absolute inset-0 m-auto w-1/2 h-1/2 text-white/80" />
                        </div>
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded border border-cyan-400"
                            style={{ transform: `translateZ(-${cube.size / 2}px) rotateY(180deg)` }}
                        />
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 rounded border border-purple-400"
                            style={{ transform: `translateX(-${cube.size / 2}px) rotateY(-90deg)` }}
                        />
                        <div
                            className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded border border-indigo-400"
                            style={{ transform: `translateX(${cube.size / 2}px) rotateY(90deg)` }}
                        />
                    </motion.div>
                </motion.div>
            ))}

            {/* Decentralized label */}
            <motion.div
                className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gradient-to-r from-violet-100 to-cyan-100 dark:from-violet-500/20 dark:to-cyan-500/20 rounded-full border border-violet-300 dark:border-violet-500/30"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <span className="text-[10px] bg-gradient-to-r from-violet-600 to-cyan-600 dark:from-violet-400 dark:to-cyan-400 bg-clip-text text-transparent font-bold whitespace-nowrap flex items-center gap-1">
                    <motion.span
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    >✨</motion.span>
                    Terdesentralisasi
                </span>
            </motion.div>
        </div>
    );
};

const Web3TransitionSection: React.FC = () => {
    const web2Issues = [
        { icon: Server, text: "Server Terpusat", desc: "Single point of failure", color: "from-red-500 to-rose-600" },
        { icon: Lock, text: "Data Bisa Diubah", desc: "Manipulasi oleh admin", color: "from-orange-500 to-red-600" },
        { icon: Users, text: "Bergantung Pihak Ketiga", desc: "Kepercayaan buta", color: "from-amber-500 to-orange-600" },
        { icon: Cloud, text: "Downtime Risiko", desc: "Server bisa mati", color: "from-rose-500 to-pink-600" },
    ];

    const web3Benefits = [
        { icon: Blocks, text: "Terdesentralisasi", desc: "Tidak ada pihak pengendali", color: "from-violet-500 to-purple-600" },
        { icon: Shield, text: "Immutable", desc: "Data tidak bisa diubah", color: "from-cyan-500 to-blue-600" },
        { icon: Globe, text: "Transparan", desc: "Dapat diaudit publik", color: "from-emerald-500 to-teal-600" },
        { icon: Zap, text: "24/7 Uptime", desc: "Jaringan selalu aktif", color: "from-indigo-500 to-violet-600" },
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.2 },
        },
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: "spring" as const, stiffness: 100, damping: 15 },
        },
    };

    return (
        <section className="relative py-24 lg:py-32 overflow-hidden">
            {/* Background matching HeroSection */}
            <div className="absolute inset-0">
                {/* Base gradient - exactly matching HeroSection */}
                <div className="absolute inset-0 bg-purple-100/80 dark:bg-slate-900" />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Animated orbs */}
                <motion.div
                    className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
                    }}
                    animate={{
                        scale: [1, 1.3, 1],
                        x: [0, 50, 0],
                        y: [0, -30, 0],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%)',
                    }}
                    animate={{
                        scale: [1.2, 1, 1.2],
                        x: [0, -40, 0],
                        y: [0, 40, 0],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Floating particles */}
                {[...Array(10)].map((_, i) => (
                    <motion.div
                        key={`particle-${i}`}
                        className="absolute w-2 h-2 rounded-full bg-violet-400/30 dark:bg-violet-400/20"
                        style={{
                            left: `${8 + i * 9}%`,
                            top: `${12 + (i % 5) * 20}%`,
                        }}
                        animate={{
                            y: [0, -35, 0],
                            x: [0, i % 2 === 0 ? 20 : -20, 0],
                            opacity: [0.2, 0.5, 0.2],
                            scale: [1, 1.4, 1],
                        }}
                        transition={{
                            duration: 4 + i * 0.5,
                            repeat: Infinity,
                            delay: i * 0.35,
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
                    className="text-center mb-16"
                >
                    <motion.span
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 text-sm font-medium mb-4"
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <motion.span
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        >
                            <Sparkles className="w-4 h-4" />
                        </motion.span>
                        Mengapa Migrasi?
                    </motion.span>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                        Dari{' '}
                        <motion.span
                            className="text-red-500 dark:text-red-400"
                            animate={{ opacity: [1, 0.7, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            Web 2.0
                        </motion.span>
                        {' '}ke{' '}
                        <motion.span
                            className="bg-gradient-to-r from-violet-600 to-cyan-600 dark:from-violet-400 dark:to-cyan-400 bg-clip-text text-transparent"
                            animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                            transition={{ duration: 5, repeat: Infinity }}
                        >
                            Web 3.0
                        </motion.span>
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-white/60 max-w-3xl mx-auto">
                        Di era digital saat ini, sistem tradisional sudah tidak cukup. Blockchain memberikan fondasi yang lebih kuat untuk bisnis SPBU yang transparan dan terpercaya.
                    </p>
                </motion.div>

                {/* Main Comparison Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">

                    {/* Web 2.0 Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="space-y-6"
                    >
                        <div className="text-center">
                            <motion.h3
                                className="text-2xl font-bold text-red-500 dark:text-red-400 mb-2"
                                animate={{ scale: [1, 1.02, 1] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                Web 2.0
                            </motion.h3>
                            <p className="text-slate-500 dark:text-white/50 text-sm">Sistem Tradisional</p>
                        </div>

                        {/* Web2 Animation */}
                        <Web2Animation />

                        {/* Web2 Cards */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="space-y-3"
                        >
                            {web2Issues.map((item, index) => (
                                <motion.div
                                    key={index}
                                    variants={cardVariants}
                                    whileHover={{
                                        scale: 1.02,
                                        x: 5,
                                        transition: { type: "spring" as const, stiffness: 300 }
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    className="group relative flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-500/10 dark:to-rose-500/10 border border-red-200 dark:border-red-500/20 cursor-pointer overflow-hidden"
                                >
                                    {/* Animated background */}
                                    <motion.div
                                        className="absolute inset-0 bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-500/20 dark:to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity"
                                    />

                                    {/* Icon */}
                                    <motion.div
                                        className={`relative p-3 rounded-lg bg-gradient-to-br ${item.color} shadow-lg`}
                                        whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <item.icon className="w-5 h-5 text-white" />
                                        <motion.div
                                            className="absolute inset-0 rounded-lg bg-white/20"
                                            animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
                                        />
                                    </motion.div>

                                    {/* Content */}
                                    <div className="relative flex-1">
                                        <motion.p
                                            className="font-medium text-slate-900 dark:text-white"
                                            initial={{ x: 0 }}
                                            whileHover={{ x: 3 }}
                                        >
                                            {item.text}
                                        </motion.p>
                                        <p className="text-sm text-slate-500 dark:text-white/50">{item.desc}</p>
                                    </div>

                                    {/* Warning indicator */}
                                    <motion.div
                                        className="relative w-2 h-2 bg-red-500 rounded-full"
                                        animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: index * 0.15 }}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Arrow / Transition */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col items-center justify-center py-8 lg:py-16"
                    >
                        <div className="relative">
                            {/* Multiple glow rings */}
                            <motion.div
                                className="absolute inset-0 -m-4 rounded-full bg-gradient-to-r from-violet-500/30 to-cyan-500/30 blur-xl"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            />
                            <motion.div
                                className="absolute inset-0 -m-8 rounded-full border-2 border-dashed border-violet-300 dark:border-violet-500/30"
                                animate={{ rotate: 360 }}
                                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            />
                            <motion.div
                                className="absolute inset-0 -m-12 rounded-full border border-cyan-300/50 dark:border-cyan-500/20"
                                animate={{ rotate: -360 }}
                                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                            />

                            {/* Main button */}
                            <motion.div
                                className="relative w-24 h-24 rounded-full bg-gradient-to-r from-violet-600 to-cyan-600 flex items-center justify-center shadow-xl cursor-pointer"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <motion.div
                                    animate={{ x: [0, 8, 0] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                >
                                    <ArrowRight className="w-10 h-10 text-white" />
                                </motion.div>
                            </motion.div>
                        </div>

                        <motion.p
                            className="mt-20 text-slate-500 dark:text-white/60 text-center text-sm max-w-[200px]"
                            animate={{ opacity: [0.6, 1, 0.6] }}
                            transition={{ duration: 3, repeat: Infinity }}
                        >
                            Transformasi digital yang inevitable
                        </motion.p>
                    </motion.div>

                    {/* Web 3.0 Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="space-y-6"
                    >
                        <div className="text-center">
                            <motion.h3
                                className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-cyan-600 dark:from-violet-400 dark:to-cyan-400 bg-clip-text text-transparent mb-2"
                                animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                                transition={{ duration: 3, repeat: Infinity }}
                            >
                                Web 3.0
                            </motion.h3>
                            <p className="text-slate-500 dark:text-white/50 text-sm">Blockchain Technology</p>
                        </div>

                        {/* Web3 Animation */}
                        <Web3Animation />

                        {/* Web3 Cards */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="space-y-3"
                        >
                            {web3Benefits.map((item, index) => (
                                <motion.div
                                    key={index}
                                    variants={cardVariants}
                                    whileHover={{
                                        scale: 1.02,
                                        x: -5,
                                        transition: { type: "spring" as const, stiffness: 300 }
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    className="group relative flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-violet-50 to-cyan-50 dark:from-violet-500/10 dark:to-cyan-500/10 border border-violet-200 dark:border-violet-500/20 cursor-pointer overflow-hidden"
                                >
                                    {/* Shimmer effect */}
                                    <motion.div
                                        className="absolute inset-0"
                                        style={{
                                            background: 'linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.1), transparent)',
                                            backgroundSize: '200% 100%',
                                        }}
                                        animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                                        transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
                                    />

                                    {/* Icon */}
                                    <motion.div
                                        className={`relative p-3 rounded-lg bg-gradient-to-br ${item.color} shadow-lg`}
                                        whileHover={{ rotate: [0, -10, 10, 0], scale: 1.15 }}
                                        transition={{ duration: 0.5 }}
                                    >
                                        <item.icon className="w-5 h-5 text-white" />
                                        <motion.div
                                            className="absolute inset-0 rounded-lg bg-white/30"
                                            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                                        />
                                    </motion.div>

                                    {/* Content */}
                                    <div className="relative flex-1">
                                        <motion.p
                                            className="font-medium text-slate-900 dark:text-white group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors"
                                            initial={{ x: 0 }}
                                            whileHover={{ x: 3 }}
                                        >
                                            {item.text}
                                        </motion.p>
                                        <p className="text-sm text-slate-500 dark:text-white/50">{item.desc}</p>
                                    </div>

                                    {/* Success indicator */}
                                    <motion.div
                                        className="relative w-2 h-2 bg-emerald-500 rounded-full"
                                        animate={{ scale: [1, 1.5, 1] }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
                                    >
                                        <motion.div
                                            className="absolute inset-0 bg-emerald-400 rounded-full"
                                            animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                                            transition={{ duration: 1.5, repeat: Infinity, delay: index * 0.2 }}
                                        />
                                    </motion.div>

                                    {/* Sparkle on hover */}
                                    <motion.div
                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100"
                                        initial={{ rotate: 0, scale: 0 }}
                                        whileHover={{ rotate: 180, scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <Sparkles className="w-4 h-4 text-violet-400" />
                                    </motion.div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>
                </div>

                {/* Bottom quote */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    className="mt-20 text-center"
                >
                    <motion.blockquote
                        className="text-xl md:text-2xl text-slate-700 dark:text-white/80 italic max-w-3xl mx-auto"
                        animate={{ opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 4, repeat: Infinity }}
                    >
                        "Masa depan bisnis SPBU adalah{' '}
                        <motion.span
                            className="text-violet-600 dark:text-violet-400 not-italic font-semibold"
                            animate={{ color: ['#7c3aed', '#8b5cf6', '#7c3aed'] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        >
                            transparansi
                        </motion.span>,{' '}
                        <motion.span
                            className="text-cyan-600 dark:text-cyan-400 not-italic font-semibold"
                            animate={{ color: ['#0891b2', '#06b6d4', '#0891b2'] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                        >
                            kepercayaan
                        </motion.span>, dan{' '}
                        <motion.span
                            className="text-emerald-600 dark:text-emerald-400 not-italic font-semibold"
                            animate={{ color: ['#059669', '#10b981', '#059669'] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                        >
                            desentralisasi
                        </motion.span>."
                    </motion.blockquote>
                </motion.div>
            </div>
        </section>
    );
};

export default Web3TransitionSection;
