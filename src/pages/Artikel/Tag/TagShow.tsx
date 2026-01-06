'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Bookmark, ArrowLeft, Edit3, Trash2, Hash, FileText,
    Calendar, AlertCircle, Loader2, Sparkles, CheckCircle2
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Tag interface
interface BlockchainTag {
    tagId: bigint;
    nama: string;
    deskripsi: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Display Tag interface
interface TagData {
    tagId: number;
    nama: string;
    deskripsi: string;
    createdAt: Date;
    updatedAt: Date;
}

export default function TagShow() {
    const navigate = useNavigate();
    const { tagId } = useParams<{ tagId: string }>();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Write contract hook
    const { writeContract, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    React.useEffect(() => {
        if (isWriteSuccess) {
            setIsDeleting(false);
            navigate('/artikel/tag');
        }
    }, [isWriteSuccess, navigate]);

    // Fetch Tag data from blockchain by ID
    const { data: blockchainTag, isLoading, error, refetch } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getTagById',
        args: tagId ? [BigInt(tagId)] : undefined,
        query: { enabled: !!tagId },
    });

    // Convert blockchain data to display format
    const tagData = useMemo((): TagData | null => {
        if (!blockchainTag) return null;
        const t = blockchainTag as BlockchainTag;
        if (t.deleted || Number(t.tagId) === 0) return null;
        return {
            tagId: Number(t.tagId),
            nama: t.nama,
            deskripsi: t.deskripsi,
            createdAt: new Date(Number(t.createdAt) * 1000),
            updatedAt: new Date(Number(t.updatedAt) * 1000),
        };
    }, [blockchainTag]);

    const notFound = !isLoading && !error && !tagData;

    const formatDate = (date: Date) => date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const handleDelete = async () => {
        if (!tagId) return;
        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteTag',
                args: [BigInt(tagId)],
            });
        } catch (error) {
            console.error('Error deleting:', error);
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-purple-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat detail Tag...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-purple-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                    <motion.div className="flex flex-col items-center gap-4 max-w-md text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full"><AlertCircle className="w-10 h-10 text-red-500" /></div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Gagal Memuat Data</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">{error.message}</p>
                        <div className="flex gap-3">
                            <motion.button onClick={() => navigate('/artikel/tag')} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Kembali</motion.button>
                            <motion.button onClick={() => refetch()} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Coba Lagi</motion.button>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (notFound || !tagData) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-purple-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div className="flex flex-col items-center gap-4 text-center p-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full"><AlertCircle className="w-12 h-12 text-red-500" /></div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Tag Tidak Ditemukan</h2>
                        <p className="text-slate-600 dark:text-slate-400">Data Tag dengan ID {tagId} tidak ditemukan.</p>
                        <motion.button onClick={() => navigate('/artikel/tag')} className="mt-4 px-6 py-3 bg-purple-600 text-white font-semibold rounded-2xl" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Kembali ke Daftar</motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    const detailItems = [
        { label: 'ID Tag', value: tagData.tagId.toString(), icon: Hash, color: 'purple' },
        { label: 'Nama Tag', value: tagData.nama, icon: Bookmark, color: 'violet' },
        { label: 'Deskripsi', value: tagData.deskripsi || '-', icon: FileText, color: 'blue' },
        { label: 'Dibuat', value: formatDate(tagData.createdAt), icon: Calendar, color: 'emerald' },
        { label: 'Diperbarui', value: formatDate(tagData.updatedAt), icon: Calendar, color: 'amber' },
    ];

    const colorMap: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
        purple: { bg: 'bg-purple-100', text: 'text-purple-600', darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-400' },
        violet: { bg: 'bg-violet-100', text: 'text-violet-600', darkBg: 'dark:bg-violet-900/30', darkText: 'dark:text-violet-400' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-600', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400' },
        emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', darkBg: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-400' },
        amber: { bg: 'bg-amber-100', text: 'text-amber-600', darkBg: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-400' },
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-purple-50 dark:bg-slate-900" />

            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-purple-400/20 to-violet-400/20 dark:from-purple-600/30 dark:to-violet-600/30 blur-3xl" animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-pink-400/15 to-rose-400/15 dark:from-pink-500/20 dark:to-rose-500/20 blur-3xl" animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-violet-400/15 to-purple-400/15 dark:from-violet-500/20 dark:to-purple-500/20 blur-3xl" animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                <motion.button onClick={() => navigate('/artikel/tag')} className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm mt-32" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: -5 }} whileTap={{ scale: 0.95 }}>
                    <ArrowLeft className="w-4 h-4" /> Kembali
                </motion.button>

                <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <motion.div className="p-4 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg shadow-purple-500/30" whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }} transition={{ duration: 0.5 }}>
                                <Bookmark className="w-8 h-8 text-white" />
                            </motion.div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Detail Tag</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">{tagData.nama}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <motion.button onClick={() => navigate(`/artikel/tag/${tagData.tagId}/edit`)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Edit3 className="w-4 h-4" /> Edit
                            </motion.button>
                            <motion.button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-xl shadow-lg shadow-red-500/30" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Trash2 className="w-4 h-4" /> Hapus
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                <motion.div className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    {[...Array(5)].map((_, i) => (
                        <motion.div key={i} className="absolute pointer-events-none" style={{ top: `${15 + (i * 18)}%`, left: `${10 + (i * 20)}%` }} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0], rotate: [0, 180] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.8, ease: 'easeInOut' }}>
                            <Sparkles className="w-4 h-4 text-purple-400/60 dark:text-purple-300/40" />
                        </motion.div>
                    ))}

                    <div className="relative z-10 p-6 md:p-8 space-y-4">
                        {detailItems.map((item, index) => {
                            const colors = colorMap[item.color];
                            return (
                                <motion.div key={item.label} className="flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + index * 0.05 }}>
                                    <div className={`p-3 ${colors.bg} ${colors.darkBg} rounded-xl`}><item.icon className={`w-5 h-5 ${colors.text} ${colors.darkText}`} /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">{item.label}</p>
                                        <p className="mt-1 text-lg font-semibold text-slate-700 dark:text-slate-200 break-words">{item.value}</p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                <motion.div className="mt-6 p-4 bg-emerald-50/80 dark:bg-emerald-900/20 backdrop-blur-sm rounded-2xl border border-emerald-200/50 dark:border-emerald-500/30 flex items-center gap-3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                    <div>
                        <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Status Aktif</h3>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400">Tag ini tersedia untuk digunakan</p>
                    </div>
                </motion.div>
            </div>

            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)}>
                        <motion.div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 text-center">
                                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4"><Trash2 className="w-8 h-8 text-red-500" /></div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Hapus Tag?</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">Apakah Anda yakin ingin menghapus <strong>{tagData.nama}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
                                <div className="flex gap-3">
                                    <motion.button onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>Batal</motion.button>
                                    <motion.button onClick={handleDelete} disabled={isDeleting} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-2xl disabled:opacity-70" whileHover={{ scale: isDeleting ? 1 : 1.02 }} whileTap={{ scale: isDeleting ? 1 : 0.98 }}>
                                        {isDeleting ? (<><Loader2 className="w-4 h-4 animate-spin" />Menghapus...</>) : (<><Trash2 className="w-4 h-4" />Hapus</>)}
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
