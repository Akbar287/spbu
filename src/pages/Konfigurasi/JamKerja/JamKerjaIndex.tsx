'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Clock, Hash, Fuel,
    Plus, Edit3, Trash2, Eye, ChevronLeft, ChevronRight,
    Sparkles, ArrowLeft, Grid3X3, List, Loader2, Timer, Coffee, ArrowUpDown
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Interfaces
interface BlockchainJamKerja {
    jamKerjaId: bigint;
    spbuId: bigint;
    namaJamKerja: string;
    jamDatang: bigint;
    jamPulang: bigint;
    jamMulaiIstirahat: bigint;
    jamSelesaiIstirahat: bigint;
    urutan: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainSpbu {
    spbuId: bigint;
    namaSpbu: string;
    deleted: boolean;
}

// Display Interface
interface JamKerja {
    jamKerjaId: number;
    spbuId: number;
    spbuName: string;
    namaJamKerja: string;
    jamDatang: string;
    jamPulang: string;
    jamMulaiIstirahat: string;
    jamSelesaiIstirahat: string;
    urutan: number;
    createdAt: Date;
    updatedAt: Date;
}

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
} as const;

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
} as const;

const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' }
    }
} as const;

// Helper: Convert timestamp (minutes from midnight) to HH:MM format
const formatTime = (timestamp: bigint): string => {
    const totalMinutes = Number(timestamp);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export default function JamKerjaIndex() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteTarget, setDeleteTarget] = useState<JamKerja | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch JamKerja data
    const { data: jamKerjaResponse, isLoading: isLoadingJamKerja, refetch: refetchJamKerja } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllJamKerja',
        args: [BigInt(0), BigInt(100)],
    });

    // Fetch SPBU data for name mapping
    const { data: spbuResponse, isLoading: isLoadingSpbu } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllSpbu',
        args: [BigInt(0), BigInt(100)],
    });

    // Write contract for delete
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    React.useEffect(() => {
        if (isWriteSuccess) {
            setDeleteTarget(null);
            setIsDeleting(false);
            refetchJamKerja();
        }
    }, [isWriteSuccess, refetchJamKerja]);

    // Process and combine data
    const { jamKerjaList, totalItems } = useMemo(() => {
        if (!jamKerjaResponse || !spbuResponse) return { jamKerjaList: [], totalItems: 0 };

        const [rawJamKerja] = jamKerjaResponse as [BlockchainJamKerja[], bigint];
        const [rawSpbu] = spbuResponse as [BlockchainSpbu[], bigint];

        // Create SPBU Map
        const spbuMap = new Map<number, string>();
        rawSpbu.forEach(spbu => {
            if (!spbu.deleted) {
                spbuMap.set(Number(spbu.spbuId), spbu.namaSpbu);
            }
        });

        // Convert JamKerja
        const converted: JamKerja[] = rawJamKerja
            .filter(jk => !jk.deleted)
            .map(jk => ({
                jamKerjaId: Number(jk.jamKerjaId),
                spbuId: Number(jk.spbuId),
                spbuName: spbuMap.get(Number(jk.spbuId)) || 'Unknown SPBU',
                namaJamKerja: jk.namaJamKerja,
                jamDatang: formatTime(jk.jamDatang),
                jamPulang: formatTime(jk.jamPulang),
                jamMulaiIstirahat: formatTime(jk.jamMulaiIstirahat),
                jamSelesaiIstirahat: formatTime(jk.jamSelesaiIstirahat),
                urutan: Number(jk.urutan),
                createdAt: new Date(Number(jk.createdAt) * 1000),
                updatedAt: new Date(Number(jk.updatedAt) * 1000),
            }))
            .sort((a, b) => a.urutan - b.urutan);

        return { jamKerjaList: converted, totalItems: converted.length };
    }, [jamKerjaResponse, spbuResponse]);

    // Pagination logic
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedJamKerja = useMemo(() =>
        jamKerjaList.slice(startIndex, endIndex),
        [jamKerjaList, startIndex, endIndex]
    );

    const isLoading = isLoadingJamKerja || isLoadingSpbu;

    // Calculate SPBU count
    const spbuCount = useMemo(() => {
        if (!spbuResponse) return 0;
        const [rawSpbu] = spbuResponse as [BlockchainSpbu[], bigint];
        return rawSpbu.filter(s => !s.deleted).length;
    }, [spbuResponse]);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteJamKerja',
                args: [BigInt(deleteTarget.jamKerjaId)],
            });
        } catch (error) {
            console.error('Error deleting:', error);
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-orange-100/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-orange-400/20 to-amber-400/20 dark:from-orange-600/30 dark:to-amber-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-yellow-400/15 to-lime-400/15 dark:from-yellow-500/20 dark:to-lime-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-red-400/15 to-pink-400/15 dark:from-red-500/20 dark:to-pink-500/20 blur-3xl"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/')}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </motion.button>

                {/* Header Section */}
                <motion.div
                    className="mb-8"
                    variants={headerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <motion.h1
                                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <motion.div
                                    className="p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg shadow-orange-500/30"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Clock className="w-7 h-7 text-white" />
                                </motion.div>
                                Daftar Jam Kerja
                            </motion.h1>
                            <motion.p
                                className="text-slate-500 dark:text-slate-400 mt-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Kelola jadwal jam kerja untuk setiap SPBU
                            </motion.p>
                        </div>

                        {/* Action Buttons */}
                        <motion.div
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            {/* Page Size Select */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">Per halaman:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none cursor-pointer"
                                >
                                    {[5, 10, 20, 50, 100].map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>

                            {/* View Toggle */}
                            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
                                <motion.button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Grid3X3 className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <List className="w-5 h-5" />
                                </motion.button>
                            </div>

                            {/* Add Button */}
                            <motion.button
                                onClick={() => navigate('/konfigurasi/jam-kerja/create')}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold rounded-2xl shadow-lg shadow-orange-500/30 transition-all"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Plus className="w-5 h-5" />
                                Tambah Jam Kerja
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {[
                        { label: 'Total Jam Kerja', value: totalItems, icon: Clock, color: 'from-orange-500 to-amber-600' },
                        { label: 'Total SPBU', value: spbuCount, icon: Fuel, color: 'from-emerald-500 to-teal-600' },
                        { label: 'Shift Pagi', value: jamKerjaList.filter(jk => jk.jamDatang < '12:00').length, icon: Timer, color: 'from-blue-500 to-cyan-600' },
                        { label: 'Shift Malam', value: jamKerjaList.filter(jk => jk.jamDatang >= '12:00').length, icon: Sparkles, color: 'from-purple-500 to-violet-600' },
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            variants={cardVariants}
                            className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 p-4 shadow-lg"
                            whileHover={{ scale: 1.02, y: -2 }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{stat.value}</p>
                                </div>
                                <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg`}>
                                    <stat.icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* JamKerja Cards Grid */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                        <p className="text-slate-400 dark:text-slate-500 font-medium animate-pulse">
                            Memuat data jam kerja...
                        </p>
                    </div>
                ) : paginatedJamKerja.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-full mb-4">
                            <Clock className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Belum Ada Data Jam Kerja
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                            Silakan tambahkan jam kerja baru untuk memulai pengelolaan.
                        </p>
                    </div>
                ) : (
                    <motion.div
                        className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        key={`${currentPage}-${pageSize}`}
                    >
                        {paginatedJamKerja.map((jamKerja, index) => (
                            <motion.div
                                key={jamKerja.jamKerjaId}
                                variants={cardVariants}
                                className="group relative"
                            >
                                {/* Card with Glassmorphism */}
                                <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
                                    {/* Animated gradient border on hover */}
                                    <motion.div
                                        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        style={{
                                            background: 'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(251,191,36,0.3), rgba(234,88,12,0.3))',
                                            padding: '1px',
                                        }}
                                    />

                                    {/* Card Header with Gradient */}
                                    <div className={`relative h-28 bg-gradient-to-br ${getCardGradient(index)} overflow-hidden`}>
                                        {/* Mesh Pattern */}
                                        <div className="absolute inset-0 opacity-20">
                                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4yIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]" />
                                        </div>

                                        {/* ID Badge */}
                                        <motion.div
                                            className="absolute top-3 right-3 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30"
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                        >
                                            <span className="text-sm font-bold text-white flex items-center gap-1.5 drop-shadow-lg">
                                                <Hash className="w-3.5 h-3.5" />
                                                {jamKerja.jamKerjaId}
                                            </span>
                                        </motion.div>

                                        {/* Urutan Badge */}
                                        <motion.div
                                            className="absolute top-3 left-3 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30"
                                            whileHover={{ scale: 1.1 }}
                                        >
                                            <span className="text-sm font-bold text-white flex items-center gap-1.5 drop-shadow-lg">
                                                <ArrowUpDown className="w-3.5 h-3.5" />
                                                Urutan: {jamKerja.urutan}
                                            </span>
                                        </motion.div>

                                        {/* Icon */}
                                        <motion.div
                                            className="absolute bottom-3 left-4 p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-lg"
                                            whileHover={{ rotate: [0, -15, 15, 0], scale: 1.15 }}
                                            transition={{ duration: 0.6 }}
                                        >
                                            <Clock className="w-6 h-6 text-white drop-shadow-lg" />
                                        </motion.div>

                                        {/* Nama Jam Kerja */}
                                        <motion.div
                                            className="absolute bottom-3 left-20 right-4"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 + 0.4 }}
                                        >
                                            <h3 className="text-lg font-bold text-white drop-shadow-lg truncate">
                                                {jamKerja.namaJamKerja}
                                            </h3>
                                        </motion.div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 relative">
                                        <div className="relative space-y-3">
                                            {/* SPBU */}
                                            <motion.div
                                                className="flex items-center gap-3"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 + 0.5 }}
                                            >
                                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                                    <Fuel className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                <span className="text-sm text-slate-600 dark:text-slate-300 truncate">
                                                    {jamKerja.spbuName}
                                                </span>
                                            </motion.div>

                                            {/* Jam Datang - Pulang */}
                                            <motion.div
                                                className="flex items-center gap-3"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 + 0.55 }}
                                            >
                                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                                    <Timer className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                                </div>
                                                <span className="text-sm text-slate-600 dark:text-slate-300">
                                                    <span className="font-semibold text-orange-600 dark:text-orange-400">{jamKerja.jamDatang}</span>
                                                    {' → '}
                                                    <span className="font-semibold text-amber-600 dark:text-amber-400">{jamKerja.jamPulang}</span>
                                                </span>
                                            </motion.div>

                                            {/* Istirahat */}
                                            <motion.div
                                                className="flex items-center gap-3"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 + 0.6 }}
                                            >
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                    <Coffee className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                                    Istirahat: {jamKerja.jamMulaiIstirahat} - {jamKerja.jamSelesaiIstirahat}
                                                </span>
                                            </motion.div>

                                            {/* Actions */}
                                            <motion.div
                                                className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 + 0.7 }}
                                            >
                                                <motion.button
                                                    onClick={() => navigate(`/konfigurasi/jam-kerja/${jamKerja.jamKerjaId}`)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500/10 to-amber-500/10 dark:from-orange-500/40 dark:to-amber-500/40 text-orange-600 dark:text-orange-200 font-medium rounded-xl hover:from-orange-500/20 hover:to-amber-500/20 dark:hover:from-orange-500/60 dark:hover:to-amber-500/60 transition-all border border-orange-200/50 dark:border-orange-400/50 dark:shadow-lg dark:shadow-orange-500/20 cursor-pointer"
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Detail
                                                </motion.button>
                                                <motion.button
                                                    className="p-2.5 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-600/40 dark:to-orange-600/40 text-amber-600 dark:text-orange-200 rounded-xl border border-amber-200/50 dark:border-orange-400/50 hover:shadow-lg hover:shadow-amber-500/20 dark:shadow-lg dark:shadow-orange-500/30 transition-all cursor-pointer"
                                                    onClick={() => navigate(`/konfigurasi/jam-kerja/${jamKerja.jamKerjaId}/edit`)}
                                                    whileHover={{ scale: 1.15, rotate: 10 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </motion.button>
                                                <motion.button
                                                    className="p-2.5 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-600/40 dark:to-pink-600/40 text-red-600 dark:text-pink-200 rounded-xl border border-red-200/50 dark:border-pink-400/50 hover:shadow-lg hover:shadow-red-500/20 dark:shadow-lg dark:shadow-pink-500/30 transition-all cursor-pointer"
                                                    onClick={() => setDeleteTarget(jamKerja)}
                                                    whileHover={{ scale: 1.15, rotate: -10 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </motion.button>
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Bottom Gradient Line */}
                                    <motion.div
                                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500"
                                        initial={{ scaleX: 0, opacity: 0 }}
                                        whileHover={{ scaleX: 1, opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        style={{ originX: 0 }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Pagination Controls */}
                {
                    totalPages > 1 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700"
                        >
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Menampilkan {startIndex + 1} - {Math.min(endIndex, totalItems)} dari {totalItems} Jam Kerja
                            </p>
                            <div className="flex items-center gap-2">
                                <motion.button
                                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 transition-all"
                                    whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                                    whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </motion.button>

                                <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                                        .filter(page => {
                                            if (totalPages <= 5) return true;
                                            if (page === 1 || page === totalPages) return true;
                                            if (Math.abs(page - currentPage) <= 1) return true;
                                            return false;
                                        })
                                        .map((page, i, arr) => (
                                            <React.Fragment key={page}>
                                                {i > 0 && arr[i - 1] !== page - 1 && (
                                                    <span className="px-1 text-slate-400">...</span>
                                                )}
                                                <motion.button
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`min-w-[40px] h-10 rounded-xl font-medium transition-all ${currentPage === page
                                                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                                                        : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400'}`}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    {page}
                                                </motion.button>
                                            </React.Fragment>
                                        ))}
                                </div>

                                <motion.button
                                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-50 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 transition-all"
                                    whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
                                    whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </motion.button>
                            </div>
                        </motion.div>
                    )
                }
            </div >

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {
                    deleteTarget && (
                        <motion.div
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => !isDeleting && setDeleteTarget(null)}
                        >
                            <motion.div
                                className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="p-6 text-center">
                                    <motion.div
                                        className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ type: 'spring', delay: 0.1 }}
                                    >
                                        <Trash2 className="w-8 h-8 text-red-500" />
                                    </motion.div>
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                        Hapus Jam Kerja?
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 mb-6">
                                        Apakah Anda yakin ingin menghapus <strong className="text-slate-800 dark:text-white">{deleteTarget.namaJamKerja}</strong>? Tindakan ini tidak dapat dibatalkan.
                                    </p>
                                    <div className="flex gap-3">
                                        <motion.button
                                            onClick={() => setDeleteTarget(null)}
                                            disabled={isDeleting}
                                            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                                            whileHover={{ scale: isDeleting ? 1 : 1.02 }}
                                            whileTap={{ scale: isDeleting ? 1 : 0.98 }}
                                        >
                                            Batal
                                        </motion.button>
                                        <motion.button
                                            onClick={handleDelete}
                                            disabled={isDeleting}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg shadow-red-500/30 disabled:opacity-70"
                                            whileHover={{ scale: isDeleting ? 1 : 1.02 }}
                                            whileTap={{ scale: isDeleting ? 1 : 0.98 }}
                                        >
                                            {isDeleting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Menghapus...
                                                </>
                                            ) : (
                                                <>
                                                    <Trash2 className="w-4 h-4" />
                                                    Hapus
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    );
}

// Card gradient colors based on index
const getCardGradient = (index: number) => {
    const gradients = [
        'from-orange-500 via-amber-500 to-yellow-500',
        'from-red-500 via-orange-500 to-amber-500',
        'from-emerald-500 via-teal-500 to-cyan-600',
        'from-blue-500 via-indigo-500 to-purple-600',
        'from-pink-500 via-rose-500 to-red-500',
    ];
    return gradients[index % gradients.length];
};
