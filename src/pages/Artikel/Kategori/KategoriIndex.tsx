'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Tag, Hash, FileText, Calendar,
    Plus, Edit3, Trash2, Eye, ChevronLeft, ChevronRight,
    Sparkles, ArrowLeft, Grid3X3, List, Loader2, AlertCircle
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Kategori Interface from blockchain
interface BlockchainKategori {
    kategoriId: bigint;
    kategori: string;
    deskripsi: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Converted Kategori for display
interface Kategori {
    kategoriId: number;
    kategori: string;
    deskripsi: string;
    createdAt: Date;
    updatedAt: Date;
}

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
} as const;

const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 100, damping: 15 } },
} as const;

const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
} as const;

export default function KategoriIndex() {
    const navigate = useNavigate();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteTarget, setDeleteTarget] = useState<Kategori | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch Kategori data from blockchain
    const { data: kategoriResponse, isLoading, error, refetch } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllKategori',
        args: [BigInt((currentPage - 1) * pageSize), BigInt(pageSize)],
    });

    // Fetch total count
    const { data: totalCountData } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getCountKategori',
    });

    // Write contract hook
    const { writeContract, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    React.useEffect(() => {
        if (isWriteSuccess) {
            setDeleteTarget(null);
            setIsDeleting(false);
            refetch();
        }
    }, [isWriteSuccess, refetch]);

    // Convert blockchain data to display format
    const kategoriList = useMemo(() => {
        if (!kategoriResponse) return [];
        const result = kategoriResponse as BlockchainKategori[];
        return result.filter(k => !k.deleted).map(k => ({
            kategoriId: Number(k.kategoriId),
            kategori: k.kategori,
            deskripsi: k.deskripsi,
            createdAt: new Date(Number(k.createdAt) * 1000),
            updatedAt: new Date(Number(k.updatedAt) * 1000),
        }));
    }, [kategoriResponse]);

    const totalItems = totalCountData ? Number(totalCountData) : 0;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteKategori',
                args: [BigInt(deleteTarget.kategoriId)],
            });
        } catch (error) {
            console.error('Error deleting:', error);
            setIsDeleting(false);
        }
    };

    const formatDate = (date: Date) => date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-teal-50 dark:bg-slate-900" />
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-teal-400/20 to-cyan-400/20 dark:from-teal-600/30 dark:to-cyan-600/30 blur-3xl" animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-emerald-400/15 to-green-400/15 dark:from-emerald-500/20 dark:to-green-500/20 blur-3xl" animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.button onClick={() => navigate('/')} className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm mt-20" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: -5 }} whileTap={{ scale: 0.95 }}>
                    <ArrowLeft className="w-4 h-4" /> Kembali
                </motion.button>

                <motion.div className="mb-8" variants={headerVariants} initial="hidden" animate="visible">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <motion.h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
                                <motion.div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg shadow-teal-500/30" whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }} transition={{ duration: 0.5 }}>
                                    <Tag className="w-7 h-7 text-white" />
                                </motion.div>
                                Daftar Kategori
                            </motion.h1>
                            <motion.p className="text-slate-500 dark:text-slate-400 mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>Kelola kategori artikel</motion.p>
                        </div>

                        <motion.div className="flex items-center gap-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">Per halaman:</span>
                                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }} className="px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none cursor-pointer">
                                    {[5, 10, 20, 50, 100].map(size => (<option key={size} value={size}>{size}</option>))}
                                </select>
                            </div>
                            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
                                <motion.button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Grid3X3 className="w-5 h-5" /></motion.button>
                                <motion.button onClick={() => setViewMode('list')} className={`p-2.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><List className="w-5 h-5" /></motion.button>
                            </div>
                            <motion.button onClick={() => navigate('/artikel/kategori/create')} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold rounded-2xl shadow-lg shadow-teal-500/30 transition-all" whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}>
                                <Plus className="w-5 h-5" /> Tambah Kategori
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>

                <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" variants={containerVariants} initial="hidden" animate="visible">
                    {[
                        { label: 'Total Kategori', value: isLoading ? '...' : totalItems, icon: Tag, color: 'from-teal-500 to-cyan-600' },
                        { label: 'Halaman', value: `${currentPage}/${totalPages || 1}`, icon: Calendar, color: 'from-blue-500 to-indigo-600' },
                        { label: 'Per Halaman', value: pageSize, icon: Hash, color: 'from-emerald-500 to-green-600' },
                        { label: 'Ditampilkan', value: isLoading ? '...' : kategoriList.length, icon: Sparkles, color: 'from-amber-500 to-orange-600' },
                    ].map((stat) => (
                        <motion.div key={stat.label} variants={cardVariants} whileHover={{ scale: 1.03, y: -5 }} className="relative overflow-hidden p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm cursor-pointer group">
                            <motion.div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                            <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${stat.color} mb-3`}><stat.icon className="w-5 h-5 text-white" /></div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                        </motion.div>
                    ))}
                </motion.div>

                {isLoading && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16"><Loader2 className="w-12 h-12 text-teal-500 animate-spin mb-4" /><p className="text-slate-500 dark:text-slate-400">Memuat data Kategori dari blockchain...</p></motion.div>)}

                {error && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16 px-4"><div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full mb-4"><AlertCircle className="w-10 h-10 text-red-500" /></div><h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Gagal Memuat Data</h3><p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-4 max-w-md">{error.message}</p><motion.button onClick={() => refetch()} className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Coba Lagi</motion.button></motion.div>)}

                {!isLoading && !error && kategoriList.length === 0 && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-16"><div className="p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4"><Tag className="w-10 h-10 text-slate-400" /></div><h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-2">Belum Ada Kategori</h3><p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Tambahkan kategori pertama Anda</p><motion.button onClick={() => navigate('/artikel/kategori/create')} className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-xl" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}><Plus className="w-4 h-4" /> Tambah Kategori</motion.button></motion.div>)}

                {!isLoading && !error && kategoriList.length > 0 && (
                    <motion.div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "flex flex-col gap-4"} variants={containerVariants} initial="hidden" animate="visible" key={`${currentPage}-${pageSize}`}>
                        {kategoriList.map((item, index) => (
                            <motion.div key={item.kategoriId} variants={cardVariants} whileHover={{ y: -8, scale: 1.02 }} className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500">
                                <div className="absolute inset-0 bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl" />
                                <motion.div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(45deg, rgba(20,184,166,0.3), rgba(6,182,212,0.3), rgba(16,185,129,0.3), rgba(20,184,166,0.3))', backgroundSize: '300% 300%' }} animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} />
                                <div className="absolute inset-[1px] rounded-3xl bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl" />

                                <div className="relative z-10">
                                    <div className="relative h-28 overflow-hidden rounded-t-3xl">
                                        <motion.div className="absolute inset-0" style={{ background: `linear-gradient(135deg, hsl(${170 + index * 10}, 70%, 45%) 0%, hsl(${180 + index * 10}, 65%, 50%) 50%, hsl(${190 + index * 10}, 75%, 40%) 100%)` }} />
                                        <div className="absolute inset-0 opacity-30"><svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg"><defs><pattern id={`grid-${item.kategoriId}`} width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1.5" fill="white" fillOpacity="0.4" /></pattern></defs><rect width="100%" height="100%" fill={`url(#grid-${item.kategoriId})`} /></svg></div>
                                        <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent" initial={{ x: '-100%' }} animate={{ x: '200%' }} transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }} />

                                        <motion.div className="absolute top-4 right-4 px-4 py-2 bg-white/20 backdrop-blur-md rounded-2xl border border-white/40 shadow-lg" whileHover={{ scale: 1.1 }}>
                                            <span className="text-sm font-bold text-white flex items-center gap-1.5 drop-shadow-lg"><Hash className="w-3.5 h-3.5" />{item.kategoriId}</span>
                                        </motion.div>

                                        <motion.div className="absolute bottom-4 left-4 p-3 bg-white/20 backdrop-blur-md rounded-2xl border border-white/40 shadow-lg" whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}>
                                            <Tag className="w-6 h-6 text-white drop-shadow-lg" />
                                        </motion.div>

                                        <motion.div className="absolute bottom-4 left-20 right-4"><h3 className="text-xl font-bold text-white drop-shadow-lg truncate">{item.kategori}</h3></motion.div>
                                    </div>

                                    <div className="p-5 relative">
                                        <div className="relative space-y-4">
                                            <motion.div className="flex items-start gap-3">
                                                <div className="p-2.5 bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/50 dark:to-cyan-900/50 rounded-xl shadow-sm"><FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" /></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-slate-400 dark:text-teal-300/70 uppercase tracking-wide">Deskripsi</p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-200 line-clamp-2 mt-0.5">{item.deskripsi || '-'}</p>
                                                </div>
                                            </motion.div>

                                            <motion.div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2 flex-1 p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-xl">
                                                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    <div>
                                                        <p className="text-[10px] font-medium text-blue-400 dark:text-blue-300/70 uppercase">Dibuat</p>
                                                        <p className="text-sm font-semibold text-blue-700 dark:text-blue-200">{formatDate(item.createdAt)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-1 p-3 bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-xl">
                                                    <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                                    <div>
                                                        <p className="text-[10px] font-medium text-emerald-400 dark:text-emerald-300/70 uppercase">Diperbarui</p>
                                                        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-200">{formatDate(item.updatedAt)}</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        </div>

                                        <motion.div className="mt-5 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2">
                                            <motion.button onClick={() => navigate(`/artikel/kategori/${item.kategoriId}`)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 dark:from-teal-500/40 dark:to-cyan-500/40 text-teal-600 dark:text-teal-200 font-medium rounded-xl hover:from-teal-500/20 hover:to-cyan-500/20 transition-all border border-teal-200/50 dark:border-teal-400/50 cursor-pointer" whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}><Eye className="w-4 h-4" /> Detail</motion.button>
                                            <motion.button className="p-2.5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-600/40 dark:to-indigo-600/40 text-blue-600 dark:text-indigo-200 rounded-xl border border-blue-200/50 dark:border-indigo-400/50 cursor-pointer" onClick={() => navigate(`/artikel/kategori/${item.kategoriId}/edit`)} whileHover={{ scale: 1.15, rotate: 10 }} whileTap={{ scale: 0.9 }}><Edit3 className="w-4 h-4" /></motion.button>
                                            <motion.button className="p-2.5 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-600/40 dark:to-pink-600/40 text-red-600 dark:text-pink-200 rounded-xl border border-red-200/50 dark:border-pink-400/50 cursor-pointer" onClick={() => setDeleteTarget(item)} whileHover={{ scale: 1.15, rotate: -10 }} whileTap={{ scale: 0.9 }}><Trash2 className="w-4 h-4" /></motion.button>
                                        </motion.div>
                                    </div>
                                </div>

                                <motion.div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500" initial={{ scaleX: 0, opacity: 0 }} whileHover={{ scaleX: 1, opacity: 1 }} transition={{ duration: 0.4, ease: 'easeOut' }} style={{ transformOrigin: 'left' }} />
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {totalPages > 1 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Menampilkan {startIndex + 1} - {Math.min(endIndex, totalItems)} dari {totalItems} Kategori</p>
                        <div className="flex items-center gap-2">
                            <motion.button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-500 transition-all" whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }} whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}><ChevronLeft className="w-5 h-5" /></motion.button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).filter(page => { if (totalPages <= 5) return true; if (page === 1 || page === totalPages) return true; if (Math.abs(page - currentPage) <= 1) return true; return false; }).map((page, i, arr) => (
                                    <React.Fragment key={page}>
                                        {i > 0 && arr[i - 1] !== page - 1 && (<span className="px-1 text-slate-400">...</span>)}
                                        <motion.button onClick={() => setCurrentPage(page)} className={`min-w-[40px] h-10 rounded-xl font-medium transition-all ${currentPage === page ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30' : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-600 dark:hover:text-teal-400'}`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{page}</motion.button>
                                    </React.Fragment>
                                ))}
                            </div>
                            <motion.button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-600 dark:hover:text-teal-400 hover:border-teal-300 dark:hover:border-teal-500 transition-all" whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }} whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}><ChevronRight className="w-5 h-5" /></motion.button>
                        </div>
                    </motion.div>
                )}
            </div>

            <AnimatePresence>
                {deleteTarget && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !isDeleting && setDeleteTarget(null)}>
                        <motion.div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 text-center">
                                <motion.div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}><Trash2 className="w-8 h-8 text-red-500" /></motion.div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Hapus Kategori?</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">Apakah Anda yakin ingin menghapus <strong className="text-slate-800 dark:text-white">{deleteTarget.kategori}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
                                <div className="flex gap-3">
                                    <motion.button onClick={() => setDeleteTarget(null)} disabled={isDeleting} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50" whileHover={{ scale: isDeleting ? 1 : 1.02 }} whileTap={{ scale: isDeleting ? 1 : 0.98 }}>Batal</motion.button>
                                    <motion.button onClick={handleDelete} disabled={isDeleting} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg shadow-red-500/30 disabled:opacity-70" whileHover={{ scale: isDeleting ? 1 : 1.02 }} whileTap={{ scale: isDeleting ? 1 : 0.98 }}>{isDeleting ? (<><Loader2 className="w-4 h-4 animate-spin" />Menghapus...</>) : (<><Trash2 className="w-4 h-4" />Hapus</>)}</motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
