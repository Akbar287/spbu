import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronDown, Fuel, Database, Shield, Box } from 'lucide-react';

// Blockchain Block Component
const BlockchainBlock = ({ delay = 0, x = 0, targetY = -300, size = 40 }: { delay?: number; x?: number; targetY?: number; size?: number }) => (
    <motion.div
        className="absolute"
        initial={{ opacity: 0, y: 0, scale: 0 }}
        animate={{ opacity: [0, 1, 1, 0.8], y: [0, targetY], scale: [0, 1, 1, 0.6] }}
        transition={{ duration: 3, delay, ease: "easeOut" }}
        style={{ left: `calc(50% + ${x}px)` }}
    >
        <div className="relative" style={{ width: size, height: size }}>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg transform rotate-45" />
            <div className="absolute inset-1 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-md transform rotate-45 flex items-center justify-center">
                <Box className="w-4 h-4 text-white transform -rotate-45" />
            </div>
        </div>
    </motion.div>
);

// Scene 1: Employee with Phone - Ordering
const Scene1 = ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => { const timer = setTimeout(onComplete, 6000); return () => clearTimeout(timer); }, [onComplete]);

    return (
        <motion.div className="relative w-full h-full flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 1.5 }}>
            {/* Employee - Larger and More Detailed */}
            <motion.div className="relative" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
                <div className="relative flex items-end gap-4">
                    {/* Person Body */}
                    <div className="relative">
                        {/* Head with face details */}
                        <div className="relative w-28 h-28 bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-300 dark:to-amber-400 rounded-full mb-1 mx-auto">
                            {/* Hair */}
                            <div className="absolute -top-2 left-2 right-2 h-14 bg-gradient-to-b from-slate-800 to-slate-700 rounded-t-full" />
                            {/* Eyes */}
                            <div className="absolute top-12 left-5 w-4 h-5 bg-white rounded-full flex items-center justify-center">
                                <motion.div className="w-2 h-3 bg-slate-800 rounded-full" animate={{ x: [0, 2, 0] }} transition={{ duration: 2, repeat: Infinity }} />
                            </div>
                            <div className="absolute top-12 right-5 w-4 h-5 bg-white rounded-full flex items-center justify-center">
                                <motion.div className="w-2 h-3 bg-slate-800 rounded-full" animate={{ x: [0, 2, 0] }} transition={{ duration: 2, repeat: Infinity }} />
                            </div>
                            {/* Eyebrows */}
                            <div className="absolute top-10 left-4 w-5 h-1 bg-slate-700 rounded-full" />
                            <div className="absolute top-10 right-4 w-5 h-1 bg-slate-700 rounded-full" />
                            {/* Nose */}
                            <div className="absolute top-16 left-1/2 -translate-x-1/2 w-2 h-3 bg-amber-300 dark:bg-amber-400 rounded-full" />
                            {/* Mouth - smile */}
                            <div className="absolute top-20 left-1/2 -translate-x-1/2 w-6 h-2 border-b-2 border-slate-600 rounded-b-full" />
                            {/* Ears */}
                            <div className="absolute top-12 -left-2 w-4 h-6 bg-amber-200 dark:bg-amber-300 rounded-full" />
                            <div className="absolute top-12 -right-2 w-4 h-6 bg-amber-200 dark:bg-amber-300 rounded-full" />
                        </div>
                        {/* Neck */}
                        <div className="w-8 h-4 bg-amber-200 dark:bg-amber-300 mx-auto" />
                        {/* Body/Uniform */}
                        <div className="w-44 h-56 bg-gradient-to-br from-blue-500 to-blue-700 rounded-t-3xl relative mx-auto">
                            {/* Collar */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-4 bg-white rounded-b-lg" />
                            {/* Name tag */}
                            <div className="absolute top-8 left-4 w-12 h-4 bg-white rounded text-[6px] text-blue-600 flex items-center justify-center font-bold">PETUGAS</div>
                            {/* Left arm holding phone */}
                            <motion.div
                                className="absolute -right-16 top-8 origin-top-left"
                                animate={{ rotate: [-5, 0, -5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                {/* Upper arm */}
                                <div className="w-10 h-24 bg-gradient-to-b from-blue-500 to-blue-600 rounded-lg" />
                                {/* Lower arm */}
                                <div className="w-10 h-20 bg-amber-200 dark:bg-amber-300 rounded-lg -mt-2" />
                                {/* Hand holding phone */}
                                <div className="relative -mt-4">
                                    <div className="w-12 h-10 bg-amber-200 dark:bg-amber-300 rounded-lg" />
                                    {/* Fingers wrapped around phone */}
                                    <div className="absolute top-0 right-0 w-3 h-6 bg-amber-200 dark:bg-amber-300 rounded-r-lg" />
                                    <div className="absolute top-6 right-0 w-3 h-4 bg-amber-200 dark:bg-amber-300 rounded-r-lg" />
                                </div>
                            </motion.div>
                            {/* Right arm down */}
                            <div className="absolute -left-8 top-8 w-8 h-32 bg-gradient-to-b from-blue-500 to-blue-600 rounded-lg" />
                            <div className="absolute -left-8 top-36 w-8 h-16 bg-amber-200 dark:bg-amber-300 rounded-b-lg" />
                        </div>
                    </div>

                    {/* Large Phone */}
                    <motion.div
                        className="absolute -right-4 top-44 w-28 h-52 bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl border-4 border-slate-600 overflow-hidden shadow-2xl"
                        animate={{ rotateZ: [-3, 0, -3] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        {/* Phone screen */}
                        <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2">
                            {/* Status bar */}
                            <div className="flex justify-between items-center mb-2 px-1">
                                <div className="text-[8px] text-white/60">09:41</div>
                                <div className="flex gap-1">
                                    <div className="w-3 h-2 bg-white/60 rounded-sm" />
                                    <div className="w-2 h-2 bg-green-400 rounded-sm" />
                                </div>
                            </div>
                            {/* App content */}
                            <div className="bg-gradient-to-br from-violet-900/50 to-cyan-900/50 rounded-xl p-3 h-[85%] flex flex-col items-center justify-center gap-3">
                                {/* App icon */}
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                                    <Fuel className="w-7 h-7 text-white" />
                                </div>
                                {/* App title */}
                                <div className="text-white text-xs font-bold">Pesan BBM</div>
                                <div className="text-white/60 text-[8px] text-center">Premium 10.000 Liter</div>
                                {/* Order button - Large and visible */}
                                <motion.div
                                    className="w-20 h-10 bg-gradient-to-r from-violet-500 to-cyan-500 rounded-xl text-white text-sm font-bold flex items-center justify-center cursor-pointer shadow-lg shadow-violet-500/50"
                                    animate={{ scale: [1, 1.1, 1], boxShadow: ['0 0 20px rgba(139,92,246,0.5)', '0 0 40px rgba(139,92,246,0.8)', '0 0 20px rgba(139,92,246,0.5)'] }}
                                    transition={{ duration: 1, delay: 1.5, repeat: 3 }}
                                >
                                    PESAN
                                </motion.div>
                            </div>
                        </div>
                        {/* Home indicator */}
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/30 rounded-full" />
                    </motion.div>

                    {/* Finger tap animation */}
                    <motion.div
                        className="absolute right-8 top-72 z-10"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.5], y: [0, 0, 10, 10] }}
                        transition={{ duration: 0.8, delay: 2.5, repeat: 2, repeatDelay: 0.5 }}
                    >
                        <div className="w-8 h-8 bg-amber-300 rounded-full border-4 border-amber-400 shadow-lg" />
                        <motion.div
                            className="absolute inset-0 bg-cyan-400/50 rounded-full"
                            animate={{ scale: [1, 2, 2], opacity: [0.5, 0, 0] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                        />
                    </motion.div>
                </div>
            </motion.div>
            {/* Blockchain rising */}
            <BlockchainBlock delay={3.5} x={80} targetY={-250} size={50} />
            <BlockchainBlock delay={4} x={-60} targetY={-300} size={40} />
            {/* Label */}
            <motion.p
                className="absolute bottom-20 text-slate-600 dark:text-white/60 text-lg font-medium"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            >
                Pegawai memesan BBM via aplikasi...
            </motion.p>
        </motion.div>
    );
};

// 3D Cube Component with random rotation
const Cube3D = ({ size = 50, delay = 0, x = 0, y = 0, rotationSpeed = 8, rotateXDir = 1, rotateYDir = 1 }: {
    size?: number; delay?: number; x?: number; y?: number;
    rotationSpeed?: number; rotateXDir?: number; rotateYDir?: number
}) => (
    <motion.div
        className="absolute"
        style={{
            left: `calc(50% + ${x}px)`,
            top: `calc(40% + ${y}px)`,
            perspective: '500px',
            transformStyle: 'preserve-3d'
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay, type: "spring", stiffness: 100 }}
    >
        <motion.div
            style={{ width: size, height: size, transformStyle: 'preserve-3d' }}
            animate={{ rotateX: [0, 360 * rotateXDir], rotateY: [0, 360 * rotateYDir] }}
            transition={{ duration: rotationSpeed, repeat: Infinity, ease: "linear", delay: delay * 0.5 }}
        >
            {/* Front face */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-violet-600 border border-violet-400" style={{ transform: `translateZ(${size / 2}px)` }} />
            {/* Back face */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-violet-700 border border-violet-500" style={{ transform: `translateZ(-${size / 2}px) rotateY(180deg)` }} />
            {/* Left face */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-cyan-600 border border-cyan-400" style={{ transform: `translateX(-${size / 2}px) rotateY(-90deg)`, width: size, height: size }} />
            {/* Right face */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-cyan-500 border border-cyan-300" style={{ transform: `translateX(${size / 2}px) rotateY(90deg)`, width: size, height: size }} />
            {/* Top face */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-500 border border-purple-300" style={{ transform: `translateY(-${size / 2}px) rotateX(90deg)`, width: size, height: size }} />
            {/* Bottom face */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-600 border border-indigo-400" style={{ transform: `translateY(${size / 2}px) rotateX(-90deg)`, width: size, height: size }} />
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center" style={{ transform: `translateZ(${size / 2 + 1}px)` }}>
                <Box className="text-white" style={{ width: size * 0.4, height: size * 0.4 }} />
            </div>
        </motion.div>
    </motion.div>
);

// Chain Link Component
const ChainLink = ({ fromX, fromY, toX, toY, delay }: { fromX: number; fromY: number; toX: number; toY: number; delay: number }) => {
    const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
    const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
    const links = Math.floor(length / 15);

    return (
        <motion.div
            className="absolute pointer-events-none"
            style={{ left: `calc(50% + ${fromX}px)`, top: `calc(40% + ${fromY}px)` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay }}
        >
            <div style={{ transform: `rotate(${angle}deg)`, transformOrigin: 'left center' }}>
                {Array.from({ length: links }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-4 h-2 border-2 border-cyan-400 rounded-full"
                        style={{ left: i * 12 }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1, opacity: [0.5, 1, 0.5] }}
                        transition={{ delay: delay + i * 0.05, duration: 1, repeat: Infinity }}
                    />
                ))}
            </div>
        </motion.div>
    );
};

// Scene 2: Zoom out - 12 3D Blocks connecting with chains
const Scene2 = ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => { const timer = setTimeout(onComplete, 6000); return () => clearTimeout(timer); }, [onComplete]);

    // 12 cubes in a network pattern with random rotations
    const cubes = [
        // Top row - different speeds and directions
        { x: -150, y: -120, size: 40, delay: 0.2, speed: 6, xDir: 1, yDir: -1 },
        { x: -50, y: -140, size: 45, delay: 0.3, speed: 10, xDir: -1, yDir: 1 },
        { x: 50, y: -140, size: 45, delay: 0.4, speed: 8, xDir: 1, yDir: 1 },
        { x: 150, y: -120, size: 40, delay: 0.5, speed: 12, xDir: -1, yDir: -1 },
        // Middle row
        { x: -120, y: -20, size: 50, delay: 0.6, speed: 7, xDir: 1, yDir: -1 },
        { x: 0, y: -40, size: 55, delay: 0.1, speed: 5, xDir: -1, yDir: 1 }, // Central - faster
        { x: 120, y: -20, size: 50, delay: 0.7, speed: 9, xDir: 1, yDir: 1 },
        // Bottom row
        { x: -150, y: 80, size: 40, delay: 0.8, speed: 11, xDir: -1, yDir: -1 },
        { x: -50, y: 60, size: 45, delay: 0.9, speed: 6, xDir: 1, yDir: 1 },
        { x: 50, y: 60, size: 45, delay: 1.0, speed: 8, xDir: -1, yDir: 1 },
        { x: 150, y: 80, size: 40, delay: 1.1, speed: 10, xDir: 1, yDir: -1 },
        // Extra bottom center
        { x: 0, y: 140, size: 45, delay: 1.2, speed: 7, xDir: -1, yDir: -1 },
    ];

    // Chain connections between cubes
    const chains = [
        // Top row connections
        { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
        // Top to middle
        { from: 0, to: 4 }, { from: 1, to: 5 }, { from: 2, to: 5 }, { from: 3, to: 6 },
        // Middle connections
        { from: 4, to: 5 }, { from: 5, to: 6 },
        // Middle to bottom
        { from: 4, to: 7 }, { from: 5, to: 8 }, { from: 5, to: 9 }, { from: 6, to: 10 },
        // Bottom row connections
        { from: 7, to: 8 }, { from: 8, to: 9 }, { from: 9, to: 10 },
        // Bottom center
        { from: 8, to: 11 }, { from: 9, to: 11 },
    ];

    return (
        <motion.div className="relative w-full h-full" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
            {/* Glowing background */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
            >
                <div className="w-[500px] h-[400px] bg-gradient-to-br from-violet-500/20 to-cyan-500/20 rounded-full blur-3xl" />
            </motion.div>

            {/* Chain connections */}
            {chains.map((chain, i) => (
                <ChainLink
                    key={i}
                    fromX={cubes[chain.from].x}
                    fromY={cubes[chain.from].y}
                    toX={cubes[chain.to].x}
                    toY={cubes[chain.to].y}
                    delay={1.5 + i * 0.1}
                />
            ))}

            {/* 12 3D Cubes with random rotations */}
            {cubes.map((cube, i) => (
                <Cube3D key={i} x={cube.x} y={cube.y} size={cube.size} delay={cube.delay} rotationSpeed={cube.speed} rotateXDir={cube.xDir} rotateYDir={cube.yDir} />
            ))}

            {/* Phone at bottom */}
            <motion.div
                className="absolute bottom-32 left-1/2 -translate-x-1/2 w-24 h-40 bg-slate-900 rounded-3xl border-3 border-slate-600 shadow-2xl"
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <div className="w-full h-full p-2">
                    <div className="w-full h-full bg-gradient-to-br from-violet-900 to-slate-900 rounded-2xl flex items-center justify-center">
                        <motion.div animate={{ y: [-3, 3, -3], rotateY: [0, 180, 360] }} transition={{ duration: 2, repeat: Infinity }}>
                            <Box className="w-8 h-8 text-cyan-400" />
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Rising block from phone */}
            <motion.div
                className="absolute bottom-48 left-1/2 -translate-x-1/2"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: [0, 1, 1, 0], y: [50, -100] }}
                transition={{ delay: 0.5, duration: 2 }}
            >
                <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg flex items-center justify-center" style={{ transform: 'rotateX(20deg) rotateY(20deg)' }}>
                    <Box className="w-5 h-5 text-white" />
                </div>
            </motion.div>

            <motion.p className="absolute bottom-12 left-1/2 -translate-x-1/2 text-slate-600 dark:text-white/60 text-lg font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                Pesanan tercatat di jaringan blockchain...
            </motion.p>
        </motion.div>
    );
};

// Spinning Wheel Component
const SpinningWheel = ({ size = 20, className = "" }: { size?: number; className?: string }) => (
    <motion.div
        className={`bg-slate-900 rounded-full flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
    >
        {/* Wheel spokes */}
        <div className="absolute w-full h-0.5 bg-slate-600" />
        <div className="absolute w-0.5 h-full bg-slate-600" />
        <div className="absolute w-full h-0.5 bg-slate-600 rotate-45" />
        <div className="absolute w-0.5 h-full bg-slate-600 rotate-45" />
        {/* Hub */}
        <div className="w-2 h-2 bg-slate-500 rounded-full" />
    </motion.div>
);

// Scene 3: Tanker Delivery with animated truck
const Scene3 = ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => { const timer = setTimeout(onComplete, 6000); return () => clearTimeout(timer); }, [onComplete]);

    return (
        <motion.div className="relative w-full h-full flex items-end justify-center pb-40" initial={{ opacity: 0, scale: 1.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1 }}>
            {/* Road */}
            <div className="absolute bottom-36 left-0 right-0 h-20 bg-gradient-to-b from-slate-700 to-slate-800">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-yellow-400" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #facc15 0px, #facc15 30px, transparent 30px, transparent 60px)' }} />
            </div>

            {/* Gas Station - Larger and More Detailed */}
            <motion.div
                className="absolute right-16 bottom-36"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.8 }}
            >
                {/* Main building */}
                <div className="w-48 h-56 bg-gradient-to-b from-red-500 to-red-700 rounded-t-xl relative shadow-2xl">
                    {/* Roof */}
                    <div className="absolute -top-8 -left-8 -right-8 h-12 bg-gradient-to-b from-red-400 to-red-500 rounded-t-xl shadow-lg" />
                    {/* Sign */}
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                        <span className="text-red-600 font-bold text-lg">SPBU</span>
                    </div>
                    {/* Fuel dispensers */}
                    <div className="absolute bottom-0 left-4 w-14 h-32 bg-slate-600 rounded-t-lg">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-green-500 rounded text-[6px] text-white flex items-center justify-center font-bold">BBM</div>
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-6 h-3 bg-slate-400 rounded" />
                    </div>
                    <div className="absolute bottom-0 right-4 w-14 h-32 bg-slate-600 rounded-t-lg">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-4 bg-blue-500 rounded text-[6px] text-white flex items-center justify-center font-bold">SOLAR</div>
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-6 h-3 bg-slate-400 rounded" />
                    </div>
                    {/* Underground tank indicator */}
                    <motion.div
                        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-amber-700 rounded flex items-center justify-center"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 3.5 }}
                    >
                        <span className="text-[8px] text-amber-200">TANGKI BAWAH</span>
                    </motion.div>
                </div>
            </motion.div>

            {/* Tanker Truck - Animated with spinning wheels */}
            <motion.div
                className="absolute bottom-36"
                initial={{ x: -400 }}
                animate={{ x: [-400, 20, 20] }}
                transition={{ duration: 4, times: [0, 0.7, 1], ease: "easeOut" }}
            >
                <div className="relative">
                    {/* Truck Cab */}
                    <div className="relative w-28 h-24 bg-gradient-to-b from-blue-500 to-blue-700 rounded-t-xl rounded-r-none">
                        {/* Windshield */}
                        <div className="absolute top-2 left-2 right-4 h-12 bg-gradient-to-br from-sky-200 to-sky-300 rounded-t-lg">
                            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-slate-400 rounded-full" />
                        </div>
                        {/* Door */}
                        <div className="absolute bottom-2 left-2 w-16 h-10 bg-blue-600 rounded border border-blue-400">
                            <div className="absolute top-1 right-1 w-2 h-3 bg-sky-200 rounded-sm" />
                        </div>
                        {/* Side mirror */}
                        <div className="absolute top-6 -left-3 w-3 h-4 bg-slate-700 rounded" />
                        {/* Lights */}
                        <div className="absolute bottom-1 right-0 w-3 h-2 bg-amber-400 rounded-l" />
                    </div>

                    {/* Tank */}
                    <div className="absolute -right-44 top-0 w-44 h-20 bg-gradient-to-b from-slate-300 to-slate-400 rounded-full shadow-lg">
                        {/* Tank details */}
                        <div className="absolute top-1/2 -translate-y-1/2 left-4 right-4 h-0.5 bg-slate-500" />
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-3 bg-amber-500 rounded text-[6px] text-white flex items-center justify-center font-bold">PERTAMINA</div>
                        {/* End cap */}
                        <div className="absolute -right-2 top-2 bottom-2 w-4 bg-gradient-to-r from-slate-400 to-slate-500 rounded-r-full" />
                        <div className="absolute -left-2 top-2 bottom-2 w-4 bg-gradient-to-l from-slate-400 to-slate-500 rounded-l-full" />
                    </div>

                    {/* Wheels - Front */}
                    <SpinningWheel size={24} className="absolute -bottom-3 left-4" />
                    <SpinningWheel size={24} className="absolute -bottom-3 left-16" />

                    {/* Wheels - Back (under tank) */}
                    <SpinningWheel size={24} className="absolute -bottom-3 -right-16" />
                    <SpinningWheel size={24} className="absolute -bottom-3 -right-28" />
                    <SpinningWheel size={24} className="absolute -bottom-3 -right-40" />

                    {/* Exhaust smoke */}
                    <motion.div
                        className="absolute -left-6 top-8"
                        animate={{ y: [-5, -20], opacity: [0.8, 0], scale: [0.5, 1.5] }}
                        transition={{ duration: 1, repeat: Infinity }}
                    >
                        <div className="w-4 h-4 bg-slate-400/50 rounded-full" />
                    </motion.div>
                </div>
            </motion.div>

            {/* Fuel Unloading Animation */}
            <motion.div
                className="absolute right-32 bottom-36"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 4 }}
            >
                {/* Hose */}
                <motion.div
                    className="w-3 h-24 bg-gradient-to-b from-slate-600 to-slate-700 rounded-full origin-top"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: [0, 1] }}
                    transition={{ delay: 4.2, duration: 0.5 }}
                />
                {/* Fuel flow */}
                <motion.div
                    className="absolute top-4 left-0 w-3 overflow-hidden h-20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 4.5 }}
                >
                    {[0, 1, 2, 3, 4].map((i) => (
                        <motion.div
                            key={i}
                            className="w-2 h-3 bg-amber-500 rounded-full mx-auto mb-1"
                            animate={{ y: [0, 60], opacity: [1, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                        />
                    ))}
                </motion.div>
            </motion.div>

            <motion.p
                className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-600 dark:text-white/60 text-lg font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
            >
                Pengiriman BBM tiba di SPBU untuk pembongkaran...
            </motion.p>
        </motion.div>
    );
};

// Scene 4: Employee checks phone again, block rises - Same detailed person as Scene 1
const Scene4 = ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => { const timer = setTimeout(onComplete, 5000); return () => clearTimeout(timer); }, [onComplete]);

    return (
        <motion.div className="relative w-full h-full flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Employee - Detailed like Scene 1 */}
            <motion.div className="relative" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.8 }}>
                <div className="relative flex items-end gap-4">
                    <div className="relative">
                        {/* Head with face details */}
                        <div className="relative w-24 h-24 bg-gradient-to-br from-amber-200 to-amber-300 dark:from-amber-300 dark:to-amber-400 rounded-full mb-1 mx-auto">
                            {/* Hair */}
                            <div className="absolute -top-2 left-2 right-2 h-12 bg-gradient-to-b from-slate-800 to-slate-700 rounded-t-full" />
                            {/* Eyes looking at phone */}
                            <div className="absolute top-10 left-4 w-3 h-4 bg-white rounded-full flex items-center justify-center">
                                <motion.div className="w-1.5 h-2.5 bg-slate-800 rounded-full" animate={{ x: [0, 2, 2] }} transition={{ duration: 0.5 }} />
                            </div>
                            <div className="absolute top-10 right-4 w-3 h-4 bg-white rounded-full flex items-center justify-center">
                                <motion.div className="w-1.5 h-2.5 bg-slate-800 rounded-full" animate={{ x: [0, 2, 2] }} transition={{ duration: 0.5 }} />
                            </div>
                            {/* Eyebrows */}
                            <div className="absolute top-8 left-3 w-4 h-1 bg-slate-700 rounded-full" />
                            <div className="absolute top-8 right-3 w-4 h-1 bg-slate-700 rounded-full" />
                            {/* Nose */}
                            <div className="absolute top-14 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-300 rounded-full" />
                            {/* Mouth - smile */}
                            <div className="absolute top-17 left-1/2 -translate-x-1/2 w-5 h-1.5 border-b-2 border-slate-600 rounded-b-full" />
                            {/* Ears */}
                            <div className="absolute top-10 -left-2 w-3 h-5 bg-amber-200 rounded-full" />
                            <div className="absolute top-10 -right-2 w-3 h-5 bg-amber-200 rounded-full" />
                        </div>
                        {/* Neck */}
                        <div className="w-6 h-3 bg-amber-200 mx-auto" />
                        {/* Body/Uniform */}
                        <div className="w-36 h-44 bg-gradient-to-br from-blue-500 to-blue-700 rounded-t-3xl relative mx-auto">
                            {/* Collar */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-3 bg-white rounded-b-lg" />
                            {/* Name tag */}
                            <div className="absolute top-6 left-3 w-10 h-3 bg-white rounded text-[5px] text-blue-600 flex items-center justify-center font-bold">PETUGAS</div>
                            {/* Arm holding phone */}
                            <motion.div
                                className="absolute -right-14 top-6 origin-top-left"
                                animate={{ rotate: [-3, 0, -3] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <div className="w-8 h-20 bg-gradient-to-b from-blue-500 to-blue-600 rounded-lg" />
                                <div className="w-8 h-16 bg-amber-200 rounded-lg -mt-2" />
                                <div className="relative -mt-3">
                                    <div className="w-10 h-8 bg-amber-200 rounded-lg" />
                                </div>
                            </motion.div>
                            {/* Left arm down */}
                            <div className="absolute -left-6 top-6 w-6 h-28 bg-gradient-to-b from-blue-500 to-blue-600 rounded-lg" />
                            <div className="absolute -left-6 top-30 w-6 h-12 bg-amber-200 rounded-b-lg" />
                        </div>
                    </div>

                    {/* Large Phone with confirmation UI */}
                    <motion.div
                        className="absolute -right-2 top-36 w-24 h-44 bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border-3 border-slate-600 overflow-hidden shadow-2xl"
                        animate={{ rotateZ: [-2, 0, -2] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-2">
                            {/* Status bar */}
                            <div className="flex justify-between items-center mb-1 px-1">
                                <div className="text-[7px] text-white/60">09:45</div>
                                <div className="flex gap-1">
                                    <div className="w-2 h-1.5 bg-white/60 rounded-sm" />
                                    <div className="w-2 h-1.5 bg-green-400 rounded-sm" />
                                </div>
                            </div>
                            {/* Confirmation screen */}
                            <div className="bg-gradient-to-br from-emerald-900/50 to-cyan-900/50 rounded-xl p-2 h-[88%] flex flex-col items-center justify-center gap-2">
                                {/* Success icon */}
                                <motion.div
                                    className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center"
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                >
                                    <Database className="w-5 h-5 text-white" />
                                </motion.div>
                                <div className="text-white text-[10px] font-bold text-center">BBM Diterima!</div>
                                <div className="text-white/60 text-[7px] text-center">10.000 Liter Premium</div>
                                {/* Confirm button */}
                                <motion.div
                                    className="w-16 h-7 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg text-white text-[8px] font-bold flex items-center justify-center shadow-lg"
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 0.5, delay: 1.5, repeat: 3 }}
                                >
                                    KONFIRMASI
                                </motion.div>
                            </div>
                        </div>
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-0.5 bg-white/30 rounded-full" />
                    </motion.div>

                    {/* Finger tap */}
                    <motion.div
                        className="absolute right-6 top-60 z-10"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.5], y: [0, 0, 8, 8] }}
                        transition={{ duration: 0.6, delay: 2, repeat: 2, repeatDelay: 0.5 }}
                    >
                        <div className="w-6 h-6 bg-amber-300 rounded-full border-3 border-amber-400 shadow-lg" />
                    </motion.div>
                </div>
            </motion.div>
            {/* Blockchain rising */}
            <BlockchainBlock delay={2.5} x={70} targetY={-280} size={45} />
            <BlockchainBlock delay={3} x={-50} targetY={-320} size={35} />
            <motion.p className="absolute bottom-16 text-slate-600 dark:text-white/60 text-lg font-medium" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                Konfirmasi penerimaan BBM tercatat di blockchain...
            </motion.p>
        </motion.div>
    );
};

// Scene 5: Fueling Vehicle - Realistic car with spinning wheels
const Scene5 = ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => { const timer = setTimeout(onComplete, 6000); return () => clearTimeout(timer); }, [onComplete]);

    return (
        <motion.div className="relative w-full h-full flex items-end justify-center pb-40" initial={{ opacity: 0, scale: 1.3 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }}>
            {/* Road */}
            <div className="absolute bottom-32 left-0 right-0 h-16 bg-gradient-to-b from-slate-600 to-slate-700">
                <div className="absolute top-1/2 left-0 right-0 h-1" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #facc15 0px, #facc15 25px, transparent 25px, transparent 50px)' }} />
            </div>

            {/* Fuel pump / dispenser */}
            <motion.div
                className="absolute left-1/4 bottom-32"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="w-16 h-44 bg-gradient-to-b from-slate-600 to-slate-700 rounded-t-xl relative shadow-lg">
                    {/* Screen */}
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-6 bg-slate-900 rounded flex items-center justify-center">
                        <motion.div
                            className="text-[8px] text-green-400 font-mono"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                        >
                            50.5 L
                        </motion.div>
                    </div>
                    {/* Fuel type indicator */}
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 w-12 h-5 bg-green-500 rounded text-[7px] text-white flex items-center justify-center font-bold">
                        PREMIUM
                    </div>
                    {/* Nozzle holder */}
                    <div className="absolute top-20 right-1 w-4 h-8 bg-slate-500 rounded" />
                    {/* Hose going to car */}
                    <motion.div
                        className="absolute top-24 right-0 origin-top-right"
                        initial={{ rotate: 0 }}
                        animate={{ rotate: [0, 25, 25] }}
                        transition={{ duration: 1, delay: 2 }}
                    >
                        <svg width="80" height="60" viewBox="0 0 80 60">
                            <motion.path
                                d="M 0 0 Q 40 30 80 40"
                                fill="none"
                                stroke="#374151"
                                strokeWidth="6"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: [0, 1] }}
                                transition={{ duration: 1, delay: 2 }}
                            />
                        </svg>
                        {/* Nozzle */}
                        <motion.div
                            className="absolute right-0 top-8 w-4 h-8 bg-slate-800 rounded"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 3 }}
                        />
                    </motion.div>
                </div>
            </motion.div>

            {/* Employee at fuel pump */}
            <motion.div
                className="absolute left-1/3 bottom-32"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
            >
                <div className="relative">
                    {/* Head */}
                    <div className="relative w-14 h-14 bg-gradient-to-br from-amber-200 to-amber-300 rounded-full mx-auto">
                        <div className="absolute -top-1 left-1 right-1 h-7 bg-gradient-to-b from-slate-800 to-slate-700 rounded-t-full" />
                        <div className="absolute top-6 left-2 w-2 h-2.5 bg-white rounded-full"><div className="w-1 h-1.5 bg-slate-800 rounded-full ml-0.5 mt-0.5" /></div>
                        <div className="absolute top-6 right-2 w-2 h-2.5 bg-white rounded-full"><div className="w-1 h-1.5 bg-slate-800 rounded-full ml-0.5 mt-0.5" /></div>
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-4 h-1 border-b border-slate-500 rounded-b-full" />
                    </div>
                    <div className="w-4 h-2 bg-amber-200 mx-auto" />
                    {/* Body in orange uniform */}
                    <div className="w-22 h-28 bg-gradient-to-br from-orange-500 to-orange-700 rounded-t-2xl relative mx-auto">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-2 bg-white rounded-b" />
                        <div className="absolute top-4 left-2 w-6 h-2 bg-white rounded text-[4px] text-orange-600 flex items-center justify-center font-bold">SPBU</div>
                        {/* Arms extended to hold hose */}
                        <motion.div
                            className="absolute -right-10 top-4 w-5 h-16 bg-gradient-to-b from-orange-500 to-orange-600 rounded origin-top-left"
                            animate={{ rotate: [0, 10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                        />
                        <div className="absolute -right-10 top-18 w-5 h-8 bg-amber-200 rounded" />
                        <div className="absolute -left-4 top-4 w-4 h-14 bg-orange-600 rounded" />
                    </div>
                </div>
            </motion.div>

            {/* Realistic Car with spinning wheels */}
            <motion.div
                className="absolute right-1/4 bottom-32"
                initial={{ x: 300 }}
                animate={{ x: [300, 0, 0] }}
                transition={{ duration: 3, times: [0, 0.6, 1], ease: "easeOut" }}
            >
                <div className="relative">
                    {/* Car body - sedan style */}
                    <div className="relative w-52 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-lg shadow-lg">
                        {/* Roof/cabin */}
                        <div className="absolute -top-10 left-12 w-28 h-12 bg-gradient-to-r from-red-400 to-red-500 rounded-t-xl">
                            {/* Windows */}
                            <div className="absolute inset-1 top-1 left-1 right-1 h-8 bg-gradient-to-b from-sky-200 to-sky-300 rounded-t-lg flex">
                                <div className="flex-1 border-r border-red-400" />
                                <div className="flex-1 border-r border-red-400" />
                                <div className="flex-1" />
                            </div>
                        </div>
                        {/* Hood */}
                        <div className="absolute top-0 left-0 w-14 h-full bg-gradient-to-r from-red-600 to-red-500 rounded-l-lg" />
                        {/* Trunk */}
                        <div className="absolute top-0 right-0 w-10 h-full bg-gradient-to-r from-red-500 to-red-600 rounded-r-lg" />
                        {/* Headlights */}
                        <div className="absolute top-4 left-1 w-3 h-4 bg-yellow-200 rounded" />
                        <div className="absolute bottom-4 left-1 w-3 h-3 bg-amber-400 rounded" />
                        {/* Tail lights */}
                        <div className="absolute top-4 right-1 w-2 h-6 bg-red-300 rounded" />
                        {/* Door handles */}
                        <div className="absolute top-6 left-20 w-3 h-1 bg-red-700 rounded" />
                        <div className="absolute top-6 right-16 w-3 h-1 bg-red-700 rounded" />
                        {/* Side mirror */}
                        <div className="absolute -top-8 left-10 w-3 h-2 bg-red-600 rounded" />
                        {/* Fuel cap being accessed */}
                        <motion.div
                            className="absolute top-4 left-32 w-3 h-3 bg-slate-800 rounded-full border border-slate-600"
                            animate={{ opacity: [1, 0.5, 1] }}
                            transition={{ duration: 1, repeat: Infinity, delay: 3 }}
                        />
                    </div>

                    {/* Front wheel - spinning */}
                    <motion.div
                        className="absolute -bottom-4 left-6 w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center shadow-lg"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 0.3, repeat: 10, ease: "linear" }}
                    >
                        {/* Wheel rim */}
                        <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-slate-600 rounded-full" />
                        </div>
                        {/* Spokes */}
                        <div className="absolute w-full h-0.5 bg-slate-500" />
                        <div className="absolute w-0.5 h-full bg-slate-500" />
                        <div className="absolute w-full h-0.5 bg-slate-500 rotate-45" />
                        <div className="absolute w-0.5 h-full bg-slate-500 rotate-45" />
                    </motion.div>

                    {/* Rear wheel - spinning */}
                    <motion.div
                        className="absolute -bottom-4 right-6 w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center shadow-lg"
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 0.3, repeat: 10, ease: "linear" }}
                    >
                        <div className="w-6 h-6 bg-gradient-to-br from-slate-400 to-slate-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-slate-600 rounded-full" />
                        </div>
                        <div className="absolute w-full h-0.5 bg-slate-500" />
                        <div className="absolute w-0.5 h-full bg-slate-500" />
                        <div className="absolute w-full h-0.5 bg-slate-500 rotate-45" />
                        <div className="absolute w-0.5 h-full bg-slate-500 rotate-45" />
                    </motion.div>
                </div>
            </motion.div>

            {/* Fuel flow animation */}
            <motion.div
                className="absolute left-[38%] bottom-48"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.5 }}
            >
                {[0, 1, 2, 3].map((i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-amber-400 rounded-full"
                        style={{ left: i * 12 }}
                        animate={{ y: [0, 15], opacity: [1, 0] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                    />
                ))}
            </motion.div>

            <motion.p
                className="absolute bottom-12 left-1/2 -translate-x-1/2 text-slate-600 dark:text-white/60 text-lg font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                Pegawai melayani pengisian BBM ke kendaraan...
            </motion.p>
        </motion.div>
    );
};

// Scene 6: Cash Transaction & System Input - Realistic interaction
const Scene6 = ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => { const timer = setTimeout(onComplete, 6000); return () => clearTimeout(timer); }, [onComplete]);

    return (
        <motion.div className="relative w-full h-full flex items-center justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Transaction scene */}
            <motion.div className="flex items-end gap-24" initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.5 }}>

                {/* Customer - Detailed */}
                <motion.div
                    className="relative"
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="relative">
                        {/* Head */}
                        <div className="relative w-20 h-20 bg-gradient-to-br from-amber-200 to-amber-300 rounded-full mx-auto">
                            {/* Hair */}
                            <div className="absolute -top-1 left-2 right-2 h-10 bg-gradient-to-b from-slate-900 to-slate-800 rounded-t-full" />
                            {/* Eyes looking at employee */}
                            <div className="absolute top-8 left-3 w-3 h-4 bg-white rounded-full flex items-center justify-center">
                                <motion.div
                                    className="w-1.5 h-2.5 bg-slate-800 rounded-full"
                                    animate={{ x: [0, 1, 1] }}
                                    transition={{ duration: 0.5, delay: 0.5 }}
                                />
                            </div>
                            <div className="absolute top-8 right-3 w-3 h-4 bg-white rounded-full flex items-center justify-center">
                                <motion.div
                                    className="w-1.5 h-2.5 bg-slate-800 rounded-full"
                                    animate={{ x: [0, 1, 1] }}
                                    transition={{ duration: 0.5, delay: 0.5 }}
                                />
                            </div>
                            {/* Eyebrows */}
                            <div className="absolute top-6 left-2 w-4 h-1 bg-slate-700 rounded-full" />
                            <div className="absolute top-6 right-2 w-4 h-1 bg-slate-700 rounded-full" />
                            {/* Nose */}
                            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-300 rounded-full" />
                            {/* Mouth */}
                            <div className="absolute top-15 left-1/2 -translate-x-1/2 w-5 h-1.5 border-b-2 border-slate-500 rounded-b-full" />
                            {/* Ears */}
                            <div className="absolute top-8 -left-1 w-2 h-4 bg-amber-200 rounded-full" />
                            <div className="absolute top-8 -right-1 w-2 h-4 bg-amber-200 rounded-full" />
                        </div>
                        {/* Neck */}
                        <div className="w-5 h-3 bg-amber-200 mx-auto" />
                        {/* Body - Casual clothes */}
                        <div className="w-28 h-36 bg-gradient-to-br from-gray-500 to-gray-700 rounded-t-2xl relative mx-auto">
                            {/* T-shirt collar */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-3 bg-gray-400 rounded-b-lg" />
                            {/* Right arm extended with money */}
                            <motion.div
                                className="absolute -right-12 top-4 origin-top-left"
                                animate={{ rotate: [0, -15, -15, 0] }}
                                transition={{ duration: 2, delay: 1, times: [0, 0.3, 0.7, 1] }}
                            >
                                <div className="w-6 h-20 bg-gradient-to-b from-gray-500 to-gray-600 rounded-lg" />
                                <div className="w-6 h-12 bg-amber-200 rounded-lg -mt-1" />
                                {/* Hand with money */}
                                <div className="relative -mt-2">
                                    <div className="w-8 h-6 bg-amber-200 rounded-lg" />
                                    {/* Money bills */}
                                    <motion.div
                                        className="absolute -right-8 top-0"
                                        initial={{ x: 0, opacity: 1 }}
                                        animate={{ x: [0, 60, 60], opacity: [1, 1, 0] }}
                                        transition={{ duration: 1.5, delay: 1.5, times: [0, 0.6, 1] }}
                                    >
                                        {[0, 1, 2].map((i) => (
                                            <div
                                                key={i}
                                                className="w-10 h-5 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded absolute shadow-md"
                                                style={{ top: i * 2, left: i * 3, transform: `rotate(${i * 3}deg)` }}
                                            >
                                                <div className="absolute inset-0.5 border border-emerald-400 rounded" />
                                                <div className="text-[5px] text-emerald-200 text-center mt-1 font-bold">100.000</div>
                                            </div>
                                        ))}
                                    </motion.div>
                                </div>
                            </motion.div>
                            {/* Left arm down */}
                            <div className="absolute -left-5 top-4 w-5 h-20 bg-gradient-to-b from-gray-500 to-gray-600 rounded-lg" />
                            <div className="absolute -left-5 top-20 w-5 h-10 bg-amber-200 rounded-b-lg" />
                        </div>
                    </div>
                    <p className="text-center text-sm text-slate-500 dark:text-white/50 mt-2">Pelanggan</p>
                </motion.div>

                {/* Employee/Cashier - Detailed */}
                <motion.div
                    className="relative"
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="relative">
                        {/* Head */}
                        <div className="relative w-20 h-20 bg-gradient-to-br from-amber-200 to-amber-300 rounded-full mx-auto">
                            {/* Hair - shorter */}
                            <div className="absolute -top-1 left-3 right-3 h-8 bg-gradient-to-b from-slate-800 to-slate-700 rounded-t-full" />
                            {/* Eyes looking at customer */}
                            <div className="absolute top-8 left-3 w-3 h-4 bg-white rounded-full flex items-center justify-center">
                                <motion.div
                                    className="w-1.5 h-2.5 bg-slate-800 rounded-full"
                                    animate={{ x: [0, -1, -1] }}
                                    transition={{ duration: 0.5, delay: 0.5 }}
                                />
                            </div>
                            <div className="absolute top-8 right-3 w-3 h-4 bg-white rounded-full flex items-center justify-center">
                                <motion.div
                                    className="w-1.5 h-2.5 bg-slate-800 rounded-full"
                                    animate={{ x: [0, -1, -1] }}
                                    transition={{ duration: 0.5, delay: 0.5 }}
                                />
                            </div>
                            {/* Eyebrows */}
                            <div className="absolute top-6 left-2 w-4 h-1 bg-slate-700 rounded-full" />
                            <div className="absolute top-6 right-2 w-4 h-1 bg-slate-700 rounded-full" />
                            {/* Nose */}
                            <div className="absolute top-12 left-1/2 -translate-x-1/2 w-2 h-2 bg-amber-300 rounded-full" />
                            {/* Mouth - friendly smile */}
                            <motion.div
                                className="absolute top-15 left-1/2 -translate-x-1/2 w-6 h-2 border-b-2 border-slate-500 rounded-b-full"
                                animate={{ scaleX: [1, 1.2, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            {/* Ears */}
                            <div className="absolute top-8 -left-1 w-2 h-4 bg-amber-200 rounded-full" />
                            <div className="absolute top-8 -right-1 w-2 h-4 bg-amber-200 rounded-full" />
                        </div>
                        {/* Neck */}
                        <div className="w-5 h-3 bg-amber-200 mx-auto" />
                        {/* Body - SPBU uniform */}
                        <div className="w-28 h-36 bg-gradient-to-br from-orange-500 to-orange-700 rounded-t-2xl relative mx-auto">
                            {/* Collar */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-3 bg-white rounded-b-lg" />
                            {/* Name tag */}
                            <div className="absolute top-5 left-2 w-10 h-3 bg-white rounded text-[5px] text-orange-600 flex items-center justify-center font-bold">KASIR</div>
                            {/* Left arm receiving money then using phone */}
                            <motion.div
                                className="absolute -left-10 top-4 origin-top-right"
                                animate={{ rotate: [0, 10, 10, -30, -30] }}
                                transition={{ duration: 4, delay: 1, times: [0, 0.2, 0.5, 0.6, 1] }}
                            >
                                <div className="w-6 h-18 bg-gradient-to-b from-orange-500 to-orange-600 rounded-lg" />
                                <div className="w-6 h-10 bg-amber-200 rounded-lg -mt-1" />
                                {/* Hand */}
                                <div className="w-7 h-5 bg-amber-200 rounded-lg -mt-1" />
                            </motion.div>
                            {/* Right arm holding phone */}
                            <motion.div
                                className="absolute -right-12 top-4 origin-top-left"
                                initial={{ rotate: 0 }}
                                animate={{ rotate: [0, 0, -20, -20] }}
                                transition={{ duration: 4, delay: 2, times: [0, 0.3, 0.5, 1] }}
                            >
                                <div className="w-6 h-18 bg-gradient-to-b from-orange-500 to-orange-600 rounded-lg" />
                                <div className="w-6 h-10 bg-amber-200 rounded-lg -mt-1" />
                                <div className="w-7 h-5 bg-amber-200 rounded-lg -mt-1" />
                            </motion.div>
                        </div>
                    </div>

                    {/* Phone with transaction UI */}
                    <motion.div
                        className="absolute -right-6 top-28 w-20 h-36 bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl border-2 border-slate-600 overflow-hidden shadow-xl"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 3, duration: 0.5 }}
                    >
                        <div className="w-full h-full p-1.5">
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 h-full rounded-xl p-2 flex flex-col items-center justify-center gap-2">
                                <div className="text-[8px] text-white/60">Catat Penjualan</div>
                                <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                                    <Fuel className="w-5 h-5 text-white" />
                                </div>
                                <div className="text-[10px] text-white font-bold">Rp 300.000</div>
                                <motion.div
                                    className="w-14 h-6 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg text-[7px] text-white font-bold flex items-center justify-center"
                                    animate={{ scale: [1, 1.05, 1] }}
                                    transition={{ duration: 0.5, delay: 4, repeat: 2 }}
                                >
                                    SIMPAN
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    <p className="text-center text-sm text-slate-500 dark:text-white/50 mt-2">Petugas SPBU</p>
                </motion.div>
            </motion.div>

            {/* Block rising from phone */}
            <motion.div
                className="absolute right-1/4 top-1/4"
                initial={{ opacity: 0, y: 100, scale: 0 }}
                animate={{ opacity: [0, 1, 1, 0.8], y: [100, -100], scale: [0, 1, 1] }}
                transition={{ delay: 4.5, duration: 1.5 }}
            >
                <motion.div
                    style={{ perspective: '300px', transformStyle: 'preserve-3d' }}
                    animate={{ rotateX: [0, 360], rotateY: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                >
                    <div className="w-14 h-14 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                        <Box className="w-7 h-7 text-white" />
                    </div>
                </motion.div>
            </motion.div>

            <motion.p
                className="absolute bottom-16 text-slate-600 dark:text-white/60 text-lg font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                Transaksi pembayaran dicatat ke blockchain...
            </motion.p>
        </motion.div>
    );
};

// Scene 7: All blocks connect - Large 3D cubes like Scene 2
const Scene7 = ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => { const timer = setTimeout(onComplete, 7000); return () => clearTimeout(timer); }, [onComplete]);

    // 12 larger cubes with random rotations - like Scene 2 but bigger
    const cubes = [
        // Outer ring
        { x: -180, y: -100, size: 55, delay: 0.2, speed: 6, xDir: 1, yDir: -1 },
        { x: -60, y: -150, size: 60, delay: 0.3, speed: 8, xDir: -1, yDir: 1 },
        { x: 60, y: -150, size: 60, delay: 0.4, speed: 7, xDir: 1, yDir: 1 },
        { x: 180, y: -100, size: 55, delay: 0.5, speed: 9, xDir: -1, yDir: -1 },
        // Middle ring
        { x: -150, y: 0, size: 65, delay: 0.6, speed: 5, xDir: 1, yDir: -1 },
        { x: 150, y: 0, size: 65, delay: 0.7, speed: 10, xDir: -1, yDir: 1 },
        // Lower ring
        { x: -180, y: 100, size: 55, delay: 0.8, speed: 8, xDir: -1, yDir: -1 },
        { x: -60, y: 150, size: 60, delay: 0.9, speed: 6, xDir: 1, yDir: 1 },
        { x: 60, y: 150, size: 60, delay: 1.0, speed: 7, xDir: -1, yDir: 1 },
        { x: 180, y: 100, size: 55, delay: 1.1, speed: 9, xDir: 1, yDir: -1 },
        // Top and bottom center
        { x: 0, y: -80, size: 50, delay: 1.2, speed: 11, xDir: -1, yDir: -1 },
        { x: 0, y: 80, size: 50, delay: 1.3, speed: 5, xDir: 1, yDir: 1 },
    ];

    // Chain connections
    const chains = [
        { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 },
        { from: 0, to: 4 }, { from: 3, to: 5 },
        { from: 4, to: 6 }, { from: 5, to: 9 },
        { from: 6, to: 7 }, { from: 7, to: 8 }, { from: 8, to: 9 },
        { from: 1, to: 10 }, { from: 2, to: 10 },
        { from: 7, to: 11 }, { from: 8, to: 11 },
        { from: 10, to: 11 }, { from: 4, to: 5 },
    ];

    return (
        <motion.div
            className="relative w-full h-full flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
        >
            {/* Glowing background */}
            <motion.div
                className="absolute inset-0 flex items-center justify-center"
                animate={{ opacity: [0.3, 0.7, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
            >
                <div className="w-[600px] h-[500px] bg-gradient-to-br from-violet-500/30 to-cyan-500/30 rounded-full blur-3xl" />
            </motion.div>


            {/* Chain connections (render before cubes) */}
            {chains.map((chain, i) => (
                <motion.div
                    key={`chain-${i}`}
                    className="absolute pointer-events-none"
                    style={{ left: '50%', top: '50%' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2 + i * 0.05 }}
                >
                    <svg
                        width="400"
                        height="400"
                        style={{ position: 'absolute', left: '-200px', top: '-200px' }}
                    >
                        <motion.line
                            x1={200 + cubes[chain.from].x}
                            y1={200 + cubes[chain.from].y}
                            x2={200 + cubes[chain.to].x}
                            y2={200 + cubes[chain.to].y}
                            stroke="url(#scene7Grad)"
                            strokeWidth="3"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ delay: 2 + i * 0.05, duration: 0.5 }}
                        />
                        <defs>
                            <linearGradient id="scene7Grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#8B5CF6" />
                                <stop offset="50%" stopColor="#A855F7" />
                                <stop offset="100%" stopColor="#06B6D4" />
                            </linearGradient>
                        </defs>
                    </svg>
                </motion.div>
            ))}

            {/* 12 Large 3D Cubes with random rotations */}
            {cubes.map((cube, i) => (
                <motion.div
                    key={i}
                    className="absolute"
                    style={{
                        left: '50%',
                        top: '50%',
                        perspective: '600px',
                        transformStyle: 'preserve-3d'
                    }}
                    initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
                    animate={{ x: cube.x, y: cube.y, opacity: 1, scale: 1 }}
                    transition={{ delay: cube.delay, type: "spring", stiffness: 80 }}
                >
                    <motion.div
                        className="-translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                        style={{
                            width: cube.size,
                            height: cube.size,
                            transformStyle: 'preserve-3d'
                        }}
                        animate={{
                            rotateX: [0, 360 * cube.xDir],
                            rotateY: [0, 360 * cube.yDir]
                        }}
                        transition={{ duration: cube.speed, repeat: Infinity, ease: "linear" }}
                    >
                        {/* 3D Cube faces */}
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-violet-600 border-2 border-violet-400 rounded-lg" style={{ transform: `translateZ(${cube.size / 2}px)` }}>
                            <Box className="absolute inset-0 m-auto w-1/2 h-1/2 text-white" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-violet-700 border-2 border-violet-500 rounded-lg" style={{ transform: `translateZ(-${cube.size / 2}px) rotateY(180deg)` }} />
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-cyan-600 border-2 border-cyan-400 rounded-lg" style={{ transform: `translateX(-${cube.size / 2}px) rotateY(-90deg)` }} />
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-cyan-500 border-2 border-cyan-300 rounded-lg" style={{ transform: `translateX(${cube.size / 2}px) rotateY(90deg)` }} />
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-purple-500 border-2 border-purple-300 rounded-lg" style={{ transform: `translateY(-${cube.size / 2}px) rotateX(90deg)` }} />
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-600 border-2 border-indigo-400 rounded-lg" style={{ transform: `translateY(${cube.size / 2}px) rotateX(-90deg)` }} />
                    </motion.div>
                </motion.div>
            ))}

            {/* Pulse effects */}
            <motion.div
                className="absolute w-96 h-96 border-4 border-violet-500/40 rounded-full"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
            />
            <motion.div
                className="absolute w-[500px] h-[500px] border-2 border-cyan-500/30 rounded-full"
                animate={{ scale: [1.2, 1.8, 1.2], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            />

            {/* Emphasized message - Centered */}
            <motion.div
                className="absolute inset-0 flex flex-col items-center justify-center text-center z-20"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 3 }}
            >
                <motion.p
                    className="text-xl md:text-2xl font-bold bg-gradient-to-r from-violet-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent"
                    animate={{ opacity: [0.8, 1, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    Semua transaksi terhubung dalam jaringan blockchain
                </motion.p>
                <motion.p
                    className="text-slate-500 dark:text-white/50 text-sm mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 4 }}
                >
                    Transparan • Aman • Tidak dapat diubah
                </motion.p>
            </motion.div>
        </motion.div>
    );
};

// Main content (original hero content)
const MainHeroContent = () => {
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } } };
    const itemVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.1, 0.25, 1] as const } } };

    return (
        <motion.div className="relative z-10 text-center px-4 max-w-5xl mx-auto" variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants} className="mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100/80 dark:bg-white/10 backdrop-blur-sm border border-violet-200 dark:border-white/20 text-violet-700 dark:text-white/90 text-sm font-medium">
                    <span className="w-2 h-2 bg-emerald-500 dark:bg-emerald-400 rounded-full animate-pulse" />
                    Blockchain-Powered SPBU Management
                </span>
            </motion.div>
            <motion.h1 variants={itemVariants} className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 dark:from-white dark:via-purple-200 dark:to-cyan-200 bg-clip-text text-transparent">Revolusi Digital</span><br />
                <span className="bg-gradient-to-r from-cyan-600 via-violet-600 to-pink-600 dark:from-cyan-300 dark:via-violet-300 dark:to-pink-300 bg-clip-text text-transparent">Stasiun Pengisian BBM</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-slate-600 dark:text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
                Transformasi manajemen SPBU dengan teknologi blockchain. Transparan, aman, dan terdesentralisasi untuk era baru industri energi.
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                <Button size="lg" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-8 py-6 text-lg rounded-xl shadow-2xl shadow-violet-500/25 transition-all duration-300 hover:scale-105">Mulai Sekarang</Button>
                <Button size="lg" variant="outline" className="border-violet-300 dark:border-white/30 text-violet-700 dark:text-white hover:bg-violet-50 dark:hover:bg-white/10 px-8 py-6 text-lg rounded-xl backdrop-blur-sm transition-all duration-300 hover:scale-105">Pelajari Lebih Lanjut</Button>
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 1 } } }} initial="hidden" animate="visible" className="flex justify-center gap-8">
                {[{ icon: Fuel, label: "Penjualan", color: "from-amber-500 to-orange-500" }, { icon: Database, label: "Supply Chain", color: "from-cyan-500 to-blue-500" }, { icon: Shield, label: "Keamanan", color: "from-emerald-500 to-green-500" }].map((item, index) => (
                    <motion.div key={index} variants={{ hidden: { opacity: 0, scale: 0 }, visible: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 200, damping: 15 } } }} whileHover={{ scale: 1.1, y: -5 }} className="flex flex-col items-center gap-2">
                        <div className={`p-4 rounded-2xl bg-gradient-to-br ${item.color} shadow-lg`}><item.icon className="w-6 h-6 text-white" /></div>
                        <span className="text-slate-500 dark:text-white/60 text-sm">{item.label}</span>
                    </motion.div>
                ))}
            </motion.div>
        </motion.div>
    );
};

// Animated Background
const AnimatedBackground = () => (
    <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-purple-100/80 dark:bg-slate-900" />
        <motion.div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-violet-400/20 to-indigo-400/20 dark:from-violet-600/30 dark:to-indigo-600/30 blur-3xl" animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }} />
        <motion.div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-cyan-400/15 to-emerald-400/15 dark:from-cyan-500/20 dark:to-emerald-500/20 blur-3xl" animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
    </div>
);

// Main Hero Section
const HeroSection: React.FC = () => {
    const [currentScene, setCurrentScene] = useState(0);
    const [animationComplete, setAnimationComplete] = useState(false);

    const scenes = [Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7];

    const handleSceneComplete = () => {
        if (currentScene < scenes.length - 1) {
            setCurrentScene(prev => prev + 1);
        } else {
            setAnimationComplete(true);
        }
    };

    const CurrentSceneComponent = scenes[currentScene];

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <AnimatedBackground />

            <AnimatePresence mode="wait">
                {!animationComplete ? (
                    <motion.div key={currentScene} className="absolute inset-0 flex items-center justify-center">
                        <CurrentSceneComponent onComplete={handleSceneComplete} />
                        {/* Skip button */}
                        <motion.button
                            className="absolute bottom-8 right-8 px-4 py-2 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full text-slate-600 dark:text-white/60 text-sm hover:bg-white/30 transition-colors"
                            onClick={() => setAnimationComplete(true)}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 2 }}
                        >
                            Lewati Animasi →
                        </motion.button>
                        {/* Progress indicator */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
                            {scenes.map((_, i) => (
                                <motion.div key={i} className={`w-2 h-2 rounded-full ${i === currentScene ? 'bg-violet-500' : i < currentScene ? 'bg-violet-300' : 'bg-slate-300 dark:bg-slate-600'}`} animate={i === currentScene ? { scale: [1, 1.3, 1] } : {}} transition={{ duration: 1, repeat: Infinity }} />
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div key="main" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1 }}>
                        <MainHeroContent />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Scroll Indicator - only show after animation */}
            {animationComplete && (
                <motion.div className="absolute bottom-8 left-1/2 -translate-x-1/2" animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}>
                    <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-white/50">
                        <span className="text-sm">Scroll ke bawah</span>
                        <ChevronDown className="w-5 h-5" />
                    </div>
                </motion.div>
            )}
        </section>
    );
};

export default HeroSection;
