'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import { readContract } from '@wagmi/core';
import {
    Newspaper, ArrowLeft, Edit3, Trash2, Hash, FileText,
    Calendar, AlertCircle, Loader2, Sparkles, CheckCircle2, XCircle,
    Tag, Bookmark, User
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { config } from '@/config/wagmi';

// Blockchain interfaces
interface BlockchainArtikel {
    artikelId: bigint;
    title: string;
    content: string;
    active: boolean;
    walletMember: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainKategori {
    kategoriId: bigint;
    kategori: string;
    deskripsi: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainTag {
    tagId: bigint;
    nama: string;
    deskripsi: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Display interfaces
interface ArtikelData {
    artikelId: number;
    title: string;
    content: string;
    active: boolean;
    walletMember: string;
    createdAt: Date;
    updatedAt: Date;
    kategoris: { id: number; nama: string }[];
    tags: { id: number; nama: string }[];
}

export default function PostShow() {
    const navigate = useNavigate();
    const { postId } = useParams<{ postId: string }>();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [artikelData, setArtikelData] = useState<ArtikelData | null>(null);
    const [isLoadingRelations, setIsLoadingRelations] = useState(false);

    // Write contract hook
    const { writeContract, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    useEffect(() => {
        if (isWriteSuccess) {
            setIsDeleting(false);
            navigate('/artikel/post');
        }
    }, [isWriteSuccess, navigate]);

    // Fetch Artikel data from blockchain by ID
    const { data: blockchainArtikel, isLoading, error, refetch } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getArtikelById',
        args: postId ? [BigInt(postId)] : undefined,
        query: { enabled: !!postId },
    });

    // Fetch relations
    useEffect(() => {
        const fetchRelations = async () => {
            if (!blockchainArtikel) return;
            const a = blockchainArtikel as BlockchainArtikel;
            if (a.deleted || Number(a.artikelId) === 0) {
                setArtikelData(null);
                return;
            }

            setIsLoadingRelations(true);

            // Fetch kategori IDs
            let kategoriIds: bigint[] = [];
            let tagIds: bigint[] = [];

            try {
                const kIds = await readContract(config, {
                    address: DIAMOND_ADDRESS as `0x${string}`,
                    abi: DIAMOND_ABI,
                    functionName: 'getKategoriesByArtikel',
                    args: [a.artikelId],
                });
                kategoriIds = kIds as bigint[];
            } catch (e) {
                console.error('Error fetching kategoris:', e);
            }

            try {
                const tIds = await readContract(config, {
                    address: DIAMOND_ADDRESS as `0x${string}`,
                    abi: DIAMOND_ABI,
                    functionName: 'getTagsByArtikel',
                    args: [a.artikelId],
                });
                tagIds = tIds as bigint[];
            } catch (e) {
                console.error('Error fetching tags:', e);
            }

            // Fetch kategori details
            const kategoris: { id: number; nama: string }[] = [];
            for (const kId of kategoriIds) {
                try {
                    const k = await readContract(config, {
                        address: DIAMOND_ADDRESS as `0x${string}`,
                        abi: DIAMOND_ABI,
                        functionName: 'getKategoriById',
                        args: [kId],
                    }) as BlockchainKategori;
                    if (!k.deleted) {
                        kategoris.push({ id: Number(k.kategoriId), nama: k.kategori });
                    }
                } catch (e) {
                    console.error('Error fetching kategori:', e);
                }
            }

            // Fetch tag details
            const tags: { id: number; nama: string }[] = [];
            for (const tId of tagIds) {
                try {
                    const t = await readContract(config, {
                        address: DIAMOND_ADDRESS as `0x${string}`,
                        abi: DIAMOND_ABI,
                        functionName: 'getTagById',
                        args: [tId],
                    }) as BlockchainTag;
                    if (!t.deleted) {
                        tags.push({ id: Number(t.tagId), nama: t.nama });
                    }
                } catch (e) {
                    console.error('Error fetching tag:', e);
                }
            }

            setArtikelData({
                artikelId: Number(a.artikelId),
                title: a.title,
                content: a.content,
                active: a.active,
                walletMember: a.walletMember,
                createdAt: new Date(Number(a.createdAt) * 1000),
                updatedAt: new Date(Number(a.updatedAt) * 1000),
                kategoris,
                tags,
            });
            setIsLoadingRelations(false);
        };

        fetchRelations();
    }, [blockchainArtikel]);

    const notFound = !isLoading && !isLoadingRelations && !error && !artikelData;
    const isPageLoading = isLoading || isLoadingRelations;

    const formatDate = (date: Date) => date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const truncateAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

    const handleDelete = async () => {
        if (!postId) return;
        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteArtikel',
                args: [BigInt(postId)],
            });
        } catch (error) {
            console.error('Error deleting:', error);
            setIsDeleting(false);
        }
    };

    if (isPageLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat detail Artikel...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
                    <motion.div className="flex flex-col items-center gap-4 max-w-md text-center" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full"><AlertCircle className="w-10 h-10 text-red-500" /></div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Gagal Memuat Data</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">{error.message}</p>
                        <div className="flex gap-3">
                            <motion.button onClick={() => navigate('/artikel/post')} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Kembali</motion.button>
                            <motion.button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Coba Lagi</motion.button>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (notFound || !artikelData) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-blue-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div className="flex flex-col items-center gap-4 text-center p-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full"><AlertCircle className="w-12 h-12 text-red-500" /></div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Artikel Tidak Ditemukan</h2>
                        <p className="text-slate-600 dark:text-slate-400">Data Artikel dengan ID {postId} tidak ditemukan.</p>
                        <motion.button onClick={() => navigate('/artikel/post')} className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-2xl" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Kembali ke Daftar</motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    const colorMap: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
        blue: { bg: 'bg-blue-100', text: 'text-blue-600', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400' },
        indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', darkBg: 'dark:bg-indigo-900/30', darkText: 'dark:text-indigo-400' },
        teal: { bg: 'bg-teal-100', text: 'text-teal-600', darkBg: 'dark:bg-teal-900/30', darkText: 'dark:text-teal-400' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600', darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-400' },
        emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', darkBg: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-400' },
        amber: { bg: 'bg-amber-100', text: 'text-amber-600', darkBg: 'dark:bg-amber-900/30', darkText: 'dark:text-amber-400' },
        slate: { bg: 'bg-slate-100', text: 'text-slate-600', darkBg: 'dark:bg-slate-700/30', darkText: 'dark:text-slate-400' },
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-50 dark:bg-slate-900" />

            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 dark:from-blue-600/30 dark:to-indigo-600/30 blur-3xl" animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-cyan-400/15 to-teal-400/15 dark:from-cyan-500/20 dark:to-teal-500/20 blur-3xl" animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-400/15 to-blue-400/15 dark:from-indigo-500/20 dark:to-blue-500/20 blur-3xl" animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                <motion.button onClick={() => navigate('/artikel/post')} className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm mt-32" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: -5 }} whileTap={{ scale: 0.95 }}>
                    <ArrowLeft className="w-4 h-4" /> Kembali
                </motion.button>

                <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <motion.div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30" whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }} transition={{ duration: 0.5 }}>
                                <Newspaper className="w-8 h-8 text-white" />
                            </motion.div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Detail Artikel</h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">#{artikelData.artikelId}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <motion.button onClick={() => navigate(`/artikel/post/${artikelData.artikelId}/edit`)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl shadow-lg shadow-blue-500/30" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
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
                            <Sparkles className="w-4 h-4 text-blue-400/60 dark:text-blue-300/40" />
                        </motion.div>
                    ))}

                    <div className="relative z-10 p-6 md:p-8 space-y-4">
                        {/* ID */}
                        <motion.div className="flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <div className={`p-3 ${colorMap.blue.bg} ${colorMap.blue.darkBg} rounded-xl`}><Hash className={`w-5 h-5 ${colorMap.blue.text} ${colorMap.blue.darkText}`} /></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">ID Artikel</p>
                                <p className="mt-1 text-lg font-semibold text-slate-700 dark:text-slate-200">{artikelData.artikelId}</p>
                            </div>
                        </motion.div>

                        {/* Judul */}
                        <motion.div className="flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                            <div className={`p-3 ${colorMap.indigo.bg} ${colorMap.indigo.darkBg} rounded-xl`}><Newspaper className={`w-5 h-5 ${colorMap.indigo.text} ${colorMap.indigo.darkText}`} /></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Judul</p>
                                <p className="mt-1 text-lg font-semibold text-slate-700 dark:text-slate-200">{artikelData.title}</p>
                            </div>
                        </motion.div>

                        {/* Konten */}
                        <motion.div className="flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                            <div className={`p-3 ${colorMap.slate.bg} ${colorMap.slate.darkBg} rounded-xl`}><FileText className={`w-5 h-5 ${colorMap.slate.text} ${colorMap.slate.darkText}`} /></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Konten</p>
                                <p className="mt-1 text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{artikelData.content}</p>
                            </div>
                        </motion.div>

                        {/* Kategori */}
                        <motion.div className="flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}>
                            <div className={`p-3 ${colorMap.teal.bg} ${colorMap.teal.darkBg} rounded-xl`}><Tag className={`w-5 h-5 ${colorMap.teal.text} ${colorMap.teal.darkText}`} /></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Kategori</p>
                                {artikelData.kategoris.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {artikelData.kategoris.map(k => (
                                            <span key={k.id} className="px-3 py-1.5 text-sm font-medium bg-teal-100 dark:bg-teal-800/50 text-teal-700 dark:text-teal-300 rounded-lg">{k.nama}</span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-1 text-slate-500 dark:text-slate-400 italic">Tidak ada kategori</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Tags */}
                        <motion.div className="flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                            <div className={`p-3 ${colorMap.purple.bg} ${colorMap.purple.darkBg} rounded-xl`}><Bookmark className={`w-5 h-5 ${colorMap.purple.text} ${colorMap.purple.darkText}`} /></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Tags</p>
                                {artikelData.tags.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {artikelData.tags.map(t => (
                                            <span key={t.id} className="px-3 py-1.5 text-sm font-medium bg-purple-100 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 rounded-lg">{t.nama}</span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="mt-1 text-slate-500 dark:text-slate-400 italic">Tidak ada tag</p>
                                )}
                            </div>
                        </motion.div>

                        {/* Author */}
                        <motion.div className="flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 }}>
                            <div className={`p-3 ${colorMap.slate.bg} ${colorMap.slate.darkBg} rounded-xl`}><User className={`w-5 h-5 ${colorMap.slate.text} ${colorMap.slate.darkText}`} /></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Penulis (Wallet)</p>
                                <p className="mt-1 text-lg font-semibold text-slate-700 dark:text-slate-200 font-mono">{truncateAddress(artikelData.walletMember)}</p>
                            </div>
                        </motion.div>

                        {/* Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.div className="flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 }}>
                                <div className={`p-3 ${colorMap.emerald.bg} ${colorMap.emerald.darkBg} rounded-xl`}><Calendar className={`w-5 h-5 ${colorMap.emerald.text} ${colorMap.emerald.darkText}`} /></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Dibuat</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{formatDate(artikelData.createdAt)}</p>
                                </div>
                            </motion.div>
                            <motion.div className="flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.65 }}>
                                <div className={`p-3 ${colorMap.amber.bg} ${colorMap.amber.darkBg} rounded-xl`}><Calendar className={`w-5 h-5 ${colorMap.amber.text} ${colorMap.amber.darkText}`} /></div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Diperbarui</p>
                                    <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{formatDate(artikelData.updatedAt)}</p>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Status Badge */}
                <motion.div className={`mt-6 p-4 backdrop-blur-sm rounded-2xl border flex items-center gap-3 ${artikelData.active
                    ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-500/30'
                    : 'bg-red-50/80 dark:bg-red-900/20 border-red-200/50 dark:border-red-500/30'
                    }`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                    {artikelData.active ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
                    <div>
                        <h3 className={`text-sm font-semibold ${artikelData.active ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>
                            {artikelData.active ? 'Status Aktif' : 'Status Non-aktif'}
                        </h3>
                        <p className={`text-sm ${artikelData.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {artikelData.active ? 'Artikel ini telah dipublikasikan' : 'Artikel ini masih dalam status draft'}
                        </p>
                    </div>
                </motion.div>
            </div>

            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDeleteModal(false)}>
                        <motion.div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden" initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
                            <div className="p-6 text-center">
                                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4"><Trash2 className="w-8 h-8 text-red-500" /></div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Hapus Artikel?</h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">Apakah Anda yakin ingin menghapus <strong>{artikelData.title}</strong>? Tindakan ini tidak dapat dibatalkan.</p>
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
