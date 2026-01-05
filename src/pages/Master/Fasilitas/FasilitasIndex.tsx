'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Building, Plus, Eye, Edit3, Trash2, Hash, Fuel,
    AlertCircle, Loader2, ChevronLeft, ChevronRight, Sparkles, Package,
    ArrowLeft, Grid3X3, List
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Interfaces
interface BlockchainFasilitas {
    fasilitasId: bigint;
    spbuId: bigint;
    nama: string;
    keterangan: string;
    jumlah: bigint;
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
interface FasilitasDisplay {
    fasilitasId: number;
    spbuId: number;
    spbuName: string;
    nama: string;
    keterangan: string;
    jumlah: number;
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

export default function FasilitasIndex() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<FasilitasDisplay | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch Fasilitas Data
    const { data: fasilitasResponse, isLoading: isLoadingFasilitas, refetch } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllFasilitas',
        args: [BigInt(0), BigInt(1000)],
    });

    // Fetch SPBU Data for mapping
    const { data: spbuResponse, isLoading: isLoadingSpbu } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllSpbu',
        args: [BigInt(0), BigInt(100)],
    });

    // Write Contract Hook
    const { writeContract, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    useEffect(() => {
        if (isWriteSuccess) {
            setIsDeleting(false);
            setShowDeleteModal(false);
            setDeleteTarget(null);
            refetch();
        }
    }, [isWriteSuccess, refetch]);

    // Process SPBU Map
    const spbuMap = useMemo(() => {
        if (!spbuResponse) return new Map<number, string>();
        const [rawSpbu] = spbuResponse as [BlockchainSpbu[], bigint];
        const map = new Map<number, string>();
        rawSpbu.forEach((spbu) => {
            if (!spbu.deleted) {
                map.set(Number(spbu.spbuId), spbu.namaSpbu);
            }
        });
        return map;
    }, [spbuResponse]);

    // Process Fasilitas Data
    const fasilitasList = useMemo((): FasilitasDisplay[] => {
        if (!fasilitasResponse) return [];
        const [rawFasilitas] = fasilitasResponse as [BlockchainFasilitas[], bigint];

        return rawFasilitas
            .filter((f) => !f.deleted)
            .map((f) => ({
                fasilitasId: Number(f.fasilitasId),
                spbuId: Number(f.spbuId),
                spbuName: spbuMap.get(Number(f.spbuId)) || `SPBU #${f.spbuId}`,
                nama: f.nama,
                keterangan: f.keterangan || '-',
                jumlah: Number(f.jumlah),
                createdAt: new Date(Number(f.createdAt) * 1000),
                updatedAt: new Date(Number(f.updatedAt) * 1000),
            }));
    }, [fasilitasResponse, spbuMap]);

    // Stats
    const stats = useMemo(() => {
        const totalFasilitas = fasilitasList.length;
        const totalJumlah = fasilitasList.reduce((sum, f) => sum + f.jumlah, 0);
        return { totalFasilitas, totalJumlah };
    }, [fasilitasList]);

    // Pagination logic
    const totalPages = Math.ceil(fasilitasList.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedData = useMemo(() =>
        fasilitasList.slice(startIndex, endIndex),
        [fasilitasList, startIndex, endIndex]
    );

    const isLoading = isLoadingFasilitas || isLoadingSpbu;

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteFasilitas',
                args: [BigInt(deleteTarget.fasilitasId)],
            });
        } catch (error) {
            console.error('Error deleting:', error);
            setIsDeleting(false);
        }
    };

    const openDeleteModal = (fasilitas: FasilitasDisplay) => {
        setDeleteTarget(fasilitas);
        setShowDeleteModal(true);
    };

    // Loading Skeleton
    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-violet-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat data fasilitas...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-violet-100/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-violet-400/20 to-purple-400/20 dark:from-violet-600/30 dark:to-purple-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-fuchsia-400/15 to-pink-400/15 dark:from-fuchsia-500/20 dark:to-pink-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
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
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
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
                                    className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-violet-500/30"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Building className="w-7 h-7 text-white" />
                                </motion.div>
                                Kelola Fasilitas
                            </motion.h1>
                            <motion.p
                                className="text-slate-500 dark:text-slate-400 mt-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Total {stats.totalFasilitas} fasilitas • {stats.totalJumlah} unit
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
                                    className="px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none cursor-pointer"
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
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Grid3X3 className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <List className="w-5 h-5" />
                                </motion.button>
                            </div>

                            {/* Add Button */}
                            <motion.button
                                onClick={() => navigate('/master/fasilitas/create')}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg shadow-violet-500/30 transition-all"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Plus className="w-5 h-5" />
                                Tambah Fasilitas
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-violet-200/50 dark:border-violet-500/30 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                                <Building className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Fasilitas</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalFasilitas}</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-purple-200/50 dark:border-purple-500/30 p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Total Unit</p>
                                <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.totalJumlah}</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Fasilitas Grid */}
                {paginatedData.length === 0 ? (
                    <motion.div
                        className="flex flex-col items-center justify-center h-64 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-full mb-4">
                            <AlertCircle className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Tidak ada data
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400">
                            Belum ada fasilitas yang ditambahkan
                        </p>
                    </motion.div>
                ) : viewMode === 'grid' ? (
                    /* Grid View */
                    <motion.div
                        key={`grid-page-${currentPage}-size-${pageSize}`}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {paginatedData.map((fasilitas) => (
                            <motion.div
                                key={fasilitas.fasilitasId}
                                variants={cardVariants}
                                className="group relative"
                            >
                                <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
                                    {/* Card Header with Gradient */}
                                    <div className="relative h-24 bg-gradient-to-br from-violet-500 to-purple-600 p-4">
                                        <div className="flex items-start justify-between">
                                            <motion.div
                                                className="p-2 bg-white/20 backdrop-blur-md rounded-xl"
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                            >
                                                <Building className="w-6 h-6 text-white" />
                                            </motion.div>
                                            <motion.div
                                                className="px-3 py-1.5 bg-black/20 backdrop-blur-md rounded-full border border-white/30"
                                                whileHover={{ scale: 1.1 }}
                                            >
                                                <span className="text-sm font-bold text-white flex items-center gap-1.5 drop-shadow-lg">
                                                    <Hash className="w-3.5 h-3.5" />
                                                    {fasilitas.fasilitasId}
                                                </span>
                                            </motion.div>
                                        </div>
                                        {/* Sparkles */}
                                        <motion.div
                                            className="absolute top-3 right-16"
                                            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0] }}
                                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                        >
                                            <Sparkles className="w-4 h-4 text-white/60" />
                                        </motion.div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5">
                                        <h3 className="font-bold text-lg text-slate-700 dark:text-slate-200 mb-2 truncate">
                                            {fasilitas.nama}
                                        </h3>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                <Fuel className="w-4 h-4 text-violet-500" />
                                                <span className="truncate">{fasilitas.spbuName}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                <Package className="w-4 h-4 text-purple-500" />
                                                <span>{fasilitas.jumlah} unit</span>
                                            </div>
                                        </div>

                                        {/* Keterangan */}
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4">
                                            {fasilitas.keterangan}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2">
                                            <motion.button
                                                onClick={() => navigate(`/master/fasilitas/${fasilitas.fasilitasId}`)}
                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500/10 to-purple-500/10 dark:from-violet-500/40 dark:to-purple-500/40 text-violet-600 dark:text-violet-200 font-medium rounded-xl hover:from-violet-500/20 hover:to-purple-500/20 transition-all border border-violet-200/50 dark:border-violet-400/50"
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                <Eye className="w-4 h-4" />
                                                Lihat
                                            </motion.button>
                                            <motion.button
                                                onClick={() => navigate(`/master/fasilitas/${fasilitas.fasilitasId}/edit`)}
                                                className="p-2.5 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-600/40 dark:to-cyan-600/40 text-blue-600 dark:text-cyan-200 rounded-xl border border-blue-200/50 dark:border-cyan-400/50 hover:shadow-lg transition-all"
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <Edit3 className="w-4 h-4" />
                                            </motion.button>
                                            <motion.button
                                                onClick={() => openDeleteModal(fasilitas)}
                                                className="p-2.5 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-600/40 dark:to-pink-600/40 text-red-500 dark:text-pink-200 rounded-xl border border-red-200/50 dark:border-pink-400/50 hover:shadow-lg transition-all"
                                                whileHover={{ scale: 1.15 }}
                                                whileTap={{ scale: 0.9 }}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Bottom Gradient Line */}
                                    <motion.div
                                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500"
                                        initial={{ scaleX: 0, opacity: 0 }}
                                        whileHover={{ scaleX: 1, opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        style={{ originX: 0 }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                ) : (
                    /* List View */
                    <motion.div
                        key={`list-page-${currentPage}-size-${pageSize}`}
                        className="space-y-3"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {paginatedData.map((fasilitas) => (
                            <motion.div
                                key={fasilitas.fasilitasId}
                                variants={cardVariants}
                                className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-md hover:shadow-lg transition-all"
                            >
                                <div className="flex items-center p-4 gap-4">
                                    {/* Icon */}
                                    <div className="p-3 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                                        <Building className="w-6 h-6 text-white" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                                                #{fasilitas.fasilitasId}
                                            </span>
                                            <h3 className="font-bold text-slate-700 dark:text-slate-200 truncate">
                                                {fasilitas.nama}
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Fuel className="w-3.5 h-3.5" />
                                                {fasilitas.spbuName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Package className="w-3.5 h-3.5" />
                                                {fasilitas.jumlah} unit
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <motion.button
                                            onClick={() => navigate(`/master/fasilitas/${fasilitas.fasilitasId}`)}
                                            className="p-2.5 bg-violet-100 dark:bg-violet-900/50 text-violet-600 dark:text-violet-400 rounded-xl hover:shadow-lg transition-all"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Eye className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            onClick={() => navigate(`/master/fasilitas/${fasilitas.fasilitasId}/edit`)}
                                            className="p-2.5 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-xl hover:shadow-lg transition-all"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            onClick={() => openDeleteModal(fasilitas)}
                                            className="p-2.5 bg-red-100 dark:bg-red-900/50 text-red-500 dark:text-red-400 rounded-xl hover:shadow-lg transition-all"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <motion.div
                        className="flex items-center justify-center gap-2 mt-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        <motion.button
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-2 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{ scale: currentPage === 1 ? 1 : 1.1 }}
                            whileTap={{ scale: currentPage === 1 ? 1 : 0.9 }}
                        >
                            <ChevronLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </motion.button>
                        <div className="flex items-center gap-1">
                            {[...Array(totalPages)].map((_, i) => (
                                <motion.button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-10 h-10 rounded-xl font-medium transition-all ${currentPage === i + 1
                                        ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30'
                                        : 'bg-white/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                                        }`}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    {i + 1}
                                </motion.button>
                            ))}
                        </div>
                        <motion.button
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{ scale: currentPage === totalPages ? 1 : 1.1 }}
                            whileTap={{ scale: currentPage === totalPages ? 1 : 0.9 }}
                        >
                            <ChevronRight className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                        </motion.button>
                    </motion.div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && deleteTarget && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDeleteModal(false)}
                    >
                        <motion.div
                            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 text-center">
                                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                                    <Trash2 className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    Hapus Fasilitas?
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Apakah Anda yakin ingin menghapus <strong>{deleteTarget.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
                                </p>
                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={() => setShowDeleteModal(false)}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Batal
                                    </motion.button>
                                    <motion.button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-2xl disabled:opacity-70"
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
                )}
            </AnimatePresence>
        </div>
    );
}
