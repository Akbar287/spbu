'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Container, Hash,
    Plus, Edit3, Trash2, Eye, ChevronLeft, ChevronRight,
    ArrowLeft, Grid3X3, List, Loader2, Scale, Search, X,
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { formatNumber } from '@/lib/utils';

// Blockchain Interfaces
interface BlockchainKonversi {
    konversiId: bigint;
    dombakId: bigint;
    satuanUkurTinggiId: bigint;
    satuanUkurVolumeId: bigint;
    tinggi: bigint;
    volume: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainDombak {
    dombakId: bigint;
    spbuId: bigint;
    namaDombak: string;
    aktif: boolean;
    deleted: boolean;
}

interface BlockchainSatuanUkurTinggi {
    satuanUkurTinggiId: bigint;
    namaSatuan: string;
    singkatan: string;
    deleted: boolean;
}

interface BlockchainSatuanUkurVolume {
    satuanUkurVolumeId: bigint;
    namaSatuan: string;
    singkatan: string;
    deleted: boolean;
}

// Display Interface
interface Konversi {
    konversiId: number;
    dombakId: number;
    dombakName: string;
    satuanUkurTinggiId: number;
    satuanUkurVolumeId: number;
    singkatanSatuanUkurTinggi: string;
    singkatanSatuanUkurVolume: string;
    tinggi: number;
    volume: number;
    createdAt: Date;
    updatedAt: Date;
}

// Animation Variants (Reused)
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
} as const;

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } }
} as const;

const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
} as const;

export default function KonversiIndex() {
    const navigate = useNavigate();
    const { dombakId } = useParams(); // Get dombakId from URL
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteTarget, setDeleteTarget] = useState<Konversi | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Filter States
    const [filterTinggi, setFilterTinggi] = useState<string>('');
    const [filterVolume, setFilterVolume] = useState<string>('');

    // Fetch Dombak for Name Resolution (and validation)
    const { data: dombakResponse, isLoading: isLoadingDombaks } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllDombak',
        args: [BigInt(0), BigInt(100)], // Fetch enough dombaks for selection
    });

    // Calculate args for getAllKonversi
    const queryArgs = useMemo(() => {
        const offset = BigInt((currentPage - 1) * pageSize);
        const limit = BigInt(pageSize);
        const currentDombakId = dombakId ? BigInt(dombakId) : BigInt(0);
        // Assuming input is normal float, convert to scaled x100 (e.g. 12.5 -> 1250)
        // If input is empty, send 0
        const tinggiVal = filterTinggi ? BigInt(Math.round(parseFloat(filterTinggi) * 100)) : BigInt(0);
        const volumeVal = filterVolume ? BigInt(Math.round(parseFloat(filterVolume) * 100)) : BigInt(0);

        return [offset, limit, currentDombakId, tinggiVal, volumeVal] as const;
    }, [currentPage, pageSize, dombakId, filterTinggi, filterVolume]);

    // Fetch Konversi Data with Filters
    const { data: konversiResponse, isLoading: isLoadingKonversi, refetch: refetchKonversi } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllKonversi',
        args: queryArgs,
    });

    // Fetch Satuan Ukur Tinggi for singkatan resolution
    const { data: satuanTinggiResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllSatuanUkurTinggi',
        args: [BigInt(0), BigInt(100)],
    });

    // Fetch Satuan Ukur Volume for singkatan resolution
    const { data: satuanVolumeResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllSatuanUkurVolume',
        args: [BigInt(0), BigInt(100)],
    });

    // Write contract for delete
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    React.useEffect(() => {
        if (isWriteSuccess) {
            setDeleteTarget(null);
            setIsDeleting(false);
            refetchKonversi();
        }
    }, [isWriteSuccess, refetchKonversi, currentPage, dombakId, filterTinggi, filterVolume]);

    // Process Data
    const { konversiList, currentDombakName } = useMemo(() => {
        let dombakMap = new Map<number, string>();
        let currentName = 'Dombak Tidak Dikenal';

        // Build satuan ukur tinggi map
        let satuanTinggiMap = new Map<number, string>();
        if (satuanTinggiResponse) {
            const rawTinggi = Array.isArray(satuanTinggiResponse) ? satuanTinggiResponse as BlockchainSatuanUkurTinggi[] : [];
            rawTinggi.forEach(s => {
                if (!s.deleted) satuanTinggiMap.set(Number(s.satuanUkurTinggiId), s.singkatan);
            });
        }

        // Build satuan ukur volume map
        let satuanVolumeMap = new Map<number, string>();
        if (satuanVolumeResponse) {
            const rawVolume = Array.isArray(satuanVolumeResponse) ? satuanVolumeResponse as BlockchainSatuanUkurVolume[] : [];
            rawVolume.forEach(s => {
                if (!s.deleted) satuanVolumeMap.set(Number(s.satuanUkurVolumeId), s.singkatan);
            });
        }

        if (dombakResponse) {
            // Handle potential tuple return [data, count] or just data
            const raw = Array.isArray(dombakResponse) ? dombakResponse : [];
            // Check if first item is array (tuple case)
            const list = (raw.length > 0 && Array.isArray(raw[0])) ? raw[0] : (raw as BlockchainDombak[]);

            list.forEach(d => {
                if (!d.deleted) dombakMap.set(Number(d.dombakId), d.namaDombak);
            });

            if (dombakId && dombakMap.has(Number(dombakId))) {
                currentName = dombakMap.get(Number(dombakId)) || '';
            }
        }

        let konversis: Konversi[] = [];
        if (konversiResponse) {
            const rawK = Array.isArray(konversiResponse) ? konversiResponse as BlockchainKonversi[] : [];
            konversis = rawK
                .filter(k => !k.deleted) // Should be handled by contract but double check
                .map(k => ({
                    konversiId: Number(k.konversiId),
                    dombakId: Number(k.dombakId),
                    dombakName: dombakMap.get(Number(k.dombakId)) || `Dombak #${k.dombakId}`,
                    satuanUkurTinggiId: Number(k.satuanUkurTinggiId),
                    satuanUkurVolumeId: Number(k.satuanUkurVolumeId),
                    singkatanSatuanUkurTinggi: satuanTinggiMap.get(Number(k.satuanUkurTinggiId)) || '',
                    singkatanSatuanUkurVolume: satuanVolumeMap.get(Number(k.satuanUkurVolumeId)) || '',
                    tinggi: Number(k.tinggi) / 100,
                    volume: Number(k.volume) / 100,
                    createdAt: new Date(Number(k.createdAt) * 1000),
                    updatedAt: new Date(Number(k.updatedAt) * 1000),
                }));
        }

        return { konversiList: konversis, currentDombakName: currentName };
    }, [dombakResponse, konversiResponse, dombakId, satuanTinggiResponse, satuanVolumeResponse]);

    // Since Contract handles pagination mostly, we trust the returned list length for display.
    // However, total count isn't returned by the new function signature. 
    // We might need to handle "Next Page" availability mostly by checking if received length == pageSize.
    // For now we keep simplified pagination logic locally or assume infinite scroll style?
    // The prompt asked for pagination. With the current contract function, we don't get 'totalItems'.
    // So distinct Page Numbers (1, 2, 3... Total) are hard to generate accurately without a count function.
    // We will Implement "Previous" and "Next" buttons based on result count.

    const hasNextPage = konversiList.length === pageSize;

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteKonversi',
                args: [BigInt(deleteTarget.konversiId)],
                gas: BigInt(10000000), // High gas limit for large array operations
            });
        } catch (error) {
            console.error('Error deleting:', error);
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-50 dark:bg-slate-900" />

            {/* Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-orange-400/20 to-red-400/20 dark:from-orange-600/30 dark:to-red-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/master/dombak/' + dombakId)}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </motion.button>

                {/* Header */}
                <motion.div className="mb-8" variants={headerVariants} initial="hidden" animate="visible">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <motion.h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-3">
                                <motion.div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg shadow-orange-500/30">
                                    <Scale className="w-7 h-7 text-white" />
                                </motion.div>
                                Daftar Konversi
                            </motion.h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                                {currentDombakName ? `Untuk Dombak: ${currentDombakName}` : 'Memuat informasi dombak...'}
                            </p>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
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

                            <motion.button
                                onClick={() => navigate(`/master/dombak/${dombakId}/konversi/create`)}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-2xl shadow-lg shadow-orange-500/30 transition-all"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Plus className="w-5 h-5" />
                                Tambah Konversi
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Filters */}
                <motion.div
                    className="mb-8 p-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="flex flex-col md:flex-row gap-4 items-end">
                        {/* Search Tinggi */}
                        <div className="w-full md:w-1/2">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                                Cari Tinggi (cm)
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="number"
                                    placeholder="Contoh: 120"
                                    value={filterTinggi}
                                    onChange={(e) => {
                                        setFilterTinggi(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Search Volume */}
                        <div className="w-full md:w-1/2">
                            <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                                Cari Volume (L)
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="number"
                                    placeholder="Contoh: 1500"
                                    value={filterVolume}
                                    onChange={(e) => {
                                        setFilterVolume(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Reset Filter */}
                        <div className="w-full md:w-auto pb-0.5">
                            <button
                                onClick={() => {
                                    setFilterTinggi('');
                                    setFilterVolume('');
                                    setCurrentPage(1);
                                }}
                                className="p-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-xl transition-colors tooltip"
                                title="Reset Filters"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Content Grid */}
                {isLoadingKonversi || isLoadingDombaks ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
                        <p className="text-slate-400 font-medium animate-pulse">Memuat data konversi...</p>
                    </div>
                ) : konversiList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-full mb-4">
                            <Scale className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Data Tidak Ditemukan</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">Coba sesuaikan filter pencarian atau tambah data baru.</p>
                    </div>
                ) : (
                    <motion.div
                        className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {konversiList.map((item, index) => (
                            <motion.div
                                key={item.konversiId}
                                variants={cardVariants}
                                className="group relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all"
                            >
                                {/* Header Color */}
                                <div className="h-2 bg-gradient-to-r from-orange-400 to-red-500" />

                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-xs font-semibold text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                                <Hash className="w-3 h-3" /> {item.konversiId}
                                            </span>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-2 flex items-center gap-2">
                                                <Container className="w-4 h-4 text-slate-400" />
                                                {item.dombakName}
                                            </h3>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <p className="text-xs text-slate-500 mb-1">Tinggi</p>
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                                                {formatNumber(item.tinggi)} <span className="text-sm font-normal text-slate-400">{item.singkatanSatuanUkurTinggi}</span>
                                            </p>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <p className="text-xs text-slate-500 mb-1">Volume</p>
                                            <p className="text-lg font-bold text-slate-700 dark:text-slate-200">
                                                {formatNumber(item.volume)} <span className="text-sm font-normal text-slate-400">{item.singkatanSatuanUkurVolume}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <motion.button
                                            onClick={() => navigate(`/master/dombak/${item.dombakId}/konversi/${item.konversiId}`)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-500/10 to-yellow-500/10 dark:from-orange-500/40 dark:to-yellow-500/40 text-orange-600 dark:text-orange-200 font-medium rounded-xl hover:from-orange-500/20 hover:to-yellow-500/20 dark:hover:from-orange-500/60 dark:hover:to-yellow-500/60 transition-all border border-orange-200/50 dark:border-orange-400/50 dark:shadow-lg dark:shadow-orange-500/20 cursor-pointer"
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                        >
                                            <Eye className="w-4 h-4" />
                                            Detail
                                        </motion.button>
                                        <motion.button
                                            className="p-2.5 bg-gradient-to-br from-orange-50 to-emerald-50 dark:from-orange-600/40 dark:to-emerald-600/40 text-orange-600 dark:text-emerald-200 rounded-xl border border-orange-200/50 dark:border-emerald-400/50 hover:shadow-lg hover:shadow-teal-500/20 dark:shadow-lg dark:shadow-emerald-500/30 transition-all cursor-pointer"
                                            onClick={() => navigate(`/master/dombak/${item.dombakId}/konversi/${item.konversiId}/edit`)}
                                            whileHover={{ scale: 1.15, rotate: 10 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            className="p-2.5 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-600/40 dark:to-pink-600/40 text-red-600 dark:text-pink-200 rounded-xl border border-red-200/50 dark:border-pink-400/50 hover:shadow-lg hover:shadow-red-500/20 dark:shadow-lg dark:shadow-pink-500/30 transition-all cursor-pointer"
                                            onClick={() => setDeleteTarget(item)}
                                            whileHover={{ scale: 1.15, rotate: -10 }}
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

                {/* Pagination with Page Numbers */}
                <div className="mt-8 flex justify-center items-center gap-2 bg-white/50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 backdrop-blur-sm flex-wrap">
                    {/* Prev Button */}
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 flex items-center gap-1 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-white dark:hover:bg-slate-700 transition-all font-medium text-sm"
                    >
                        <ChevronLeft className="w-4 h-4" /> Prev
                    </button>

                    {/* Page 1 */}
                    {currentPage > 2 && (
                        <>
                            <button
                                onClick={() => setCurrentPage(1)}
                                className="w-10 h-10 flex items-center justify-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all font-medium text-sm"
                            >
                                1
                            </button>
                            {currentPage > 3 && (
                                <span className="px-2 text-slate-400">...</span>
                            )}
                        </>
                    )}

                    {/* Page Numbers Around Current */}
                    {[currentPage - 1, currentPage, currentPage + 1]
                        .filter(p => p >= 1)
                        .map(pageNum => (
                            <button
                                key={pageNum}
                                onClick={() => setCurrentPage(pageNum)}
                                disabled={pageNum === currentPage && !hasNextPage && pageNum > currentPage}
                                className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium text-sm transition-all ${pageNum === currentPage
                                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                                    : 'text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                                    } ${pageNum > currentPage && !hasNextPage ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {pageNum}
                            </button>
                        ))}

                    {/* Ellipsis and future pages indicator */}
                    {hasNextPage && (
                        <span className="px-2 text-slate-400">...</span>
                    )}

                    {/* Next Button */}
                    <button
                        onClick={() => setCurrentPage(p => p + 1)}
                        disabled={!hasNextPage}
                        className="px-3 py-2 flex items-center gap-1 rounded-lg text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-white dark:hover:bg-slate-700 transition-all font-medium text-sm"
                    >
                        Next <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Delete Modal */}
                <AnimatePresence>
                    {deleteTarget && (
                        <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
                            <motion.div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}>
                                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                                    <Trash2 className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-bold text-center mb-2 dark:text-white">Hapus Konversi?</h3>
                                <p className="text-slate-500 text-center mb-6 text-sm">
                                    Anda yakin menghapus data konversi
                                    <br /><span className="font-bold text-slate-700 dark:text-slate-300">Tinggi {formatNumber(deleteTarget.tinggi)}cm - Vol {formatNumber(deleteTarget.volume)}L</span>?
                                </p>
                                <div className="flex gap-3">
                                    <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition-colors">Batal</button>
                                    <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30 flex justify-center items-center gap-2">
                                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hapus'}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}

// Reuse gradient helper if needed or just use constant colors
