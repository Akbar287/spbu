'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    Newspaper, ArrowLeft, Save, X, FileText, Tag, Bookmark,
    AlertCircle, CheckCircle2, Loader2, Sparkles, Check, ToggleLeft, ToggleRight
} from 'lucide-react';
import { DIAMOND_ABI, DIAMOND_ADDRESS } from '@/contracts/config';
import { useReadContract, useWriteContract } from 'wagmi';

// Blockchain interfaces
interface BlockchainKategori {
    kategoriId: bigint;
    kategori: string;
    deskripsi: string;
    deleted: boolean;
}

interface BlockchainTag {
    tagId: bigint;
    nama: string;
    deskripsi: string;
    deleted: boolean;
}

// Form validation schema
const artikelValidationSchema = yup.object({
    title: yup.string().required('Judul artikel wajib diisi').min(5, 'Minimal 5 karakter'),
    content: yup.string().required('Konten wajib diisi').min(20, 'Minimal 20 karakter'),
}).required();

interface ArtikelFormData {
    title: string;
    content: string;
}

export default function PostCreate() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [selectedKategoriIds, setSelectedKategoriIds] = useState<number[]>([]);
    const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
    const [isActive, setIsActive] = useState(true);

    // Fetch Kategori data
    const { data: kategoriResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllKategori',
        args: [BigInt(0), BigInt(100)],
    });

    // Fetch Tag data
    const { data: tagResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllTag',
        args: [BigInt(0), BigInt(100)],
    });

    const kategoriList = useMemo(() => {
        if (!kategoriResponse) return [];
        const rawKategori = kategoriResponse as BlockchainKategori[];
        return rawKategori
            .filter(k => !k.deleted)
            .map(k => ({
                id: Number(k.kategoriId),
                name: k.kategori
            }));
    }, [kategoriResponse]);

    const tagList = useMemo(() => {
        if (!tagResponse) return [];
        const rawTag = tagResponse as BlockchainTag[];
        return rawTag
            .filter(t => !t.deleted)
            .map(t => ({
                id: Number(t.tagId),
                name: t.nama
            }));
    }, [tagResponse]);

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        reset,
    } = useForm<ArtikelFormData>({
        resolver: yupResolver(artikelValidationSchema),
        mode: 'onChange',
        defaultValues: {
            title: '',
            content: '',
        },
    });

    const { writeContractAsync } = useWriteContract();

    const toggleKategori = (kategoriId: number) => {
        setSelectedKategoriIds(prev =>
            prev.includes(kategoriId)
                ? prev.filter(id => id !== kategoriId)
                : [...prev, kategoriId]
        );
    };

    const toggleTag = (tagId: number) => {
        setSelectedTagIds(prev =>
            prev.includes(tagId)
                ? prev.filter(id => id !== tagId)
                : [...prev, tagId]
        );
    };

    const selectAllKategoris = () => {
        setSelectedKategoriIds(kategoriList.map(k => k.id));
    };

    const clearAllKategoris = () => {
        setSelectedKategoriIds([]);
    };

    const selectAllTags = () => {
        setSelectedTagIds(tagList.map(t => t.id));
    };

    const clearAllTags = () => {
        setSelectedTagIds([]);
    };

    const onSubmit = async (data: ArtikelFormData) => {
        setIsSubmitting(true);
        try {
            await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'createArtikel',
                args: [
                    data.title,
                    data.content,
                    selectedKategoriIds.map(id => BigInt(id)),
                    selectedTagIds.map(id => BigInt(id)),
                    isActive,
                ],
            });

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate('/artikel/post');
            }, 1500);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputBaseClass = "w-full px-4 py-3 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border transition-all duration-200 outline-none";
    const inputNormalClass = "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20";
    const inputErrorClass = "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";
    const inputSuccessClass = "border-emerald-400 dark:border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

    const getInputClass = (fieldName: keyof ArtikelFormData) => {
        if (errors[fieldName]) return `${inputBaseClass} ${inputErrorClass}`;
        if (touchedFields[fieldName] && !errors[fieldName]) return `${inputBaseClass} ${inputSuccessClass}`;
        return `${inputBaseClass} ${inputNormalClass}`;
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-50 dark:bg-slate-900" />

            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 dark:from-blue-600/30 dark:to-indigo-600/30 blur-3xl" animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-cyan-400/15 to-teal-400/15 dark:from-cyan-500/20 dark:to-teal-500/20 blur-3xl" animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-indigo-400/15 to-blue-400/15 dark:from-indigo-500/20 dark:to-blue-500/20 blur-3xl" animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                <motion.button onClick={() => navigate('/artikel/post')} className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm mt-32" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: -5 }} whileTap={{ scale: 0.95 }}>
                    <ArrowLeft className="w-4 h-4" /> Kembali
                </motion.button>

                <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="flex items-center gap-4">
                        <motion.div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30" whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }} transition={{ duration: 0.5 }}>
                            <Newspaper className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Tambah Artikel Baru</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Buat artikel baru dengan kategori dan tag</p>
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

                    <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 p-6 md:p-8 space-y-6">
                        {/* Judul Artikel */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Newspaper className="w-4 h-4 text-blue-500" /> Judul Artikel
                            </label>
                            <input type="text" {...register('title')} placeholder="Masukkan judul artikel..." className={`${getInputClass('title')} text-slate-700 dark:text-slate-200 placeholder-slate-400`} />
                            {errors.title && (<motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}><AlertCircle className="w-4 h-4" />{errors.title.message}</motion.p>)}
                        </motion.div>

                        {/* Konten */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <FileText className="w-4 h-4 text-blue-500" /> Konten
                            </label>
                            <textarea {...register('content')} rows={8} placeholder="Tulis konten artikel di sini..." className={`${getInputClass('content')} text-slate-700 dark:text-slate-200 placeholder-slate-400 resize-none`} />
                            {errors.content && (<motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}><AlertCircle className="w-4 h-4" />{errors.content.message}</motion.p>)}
                        </motion.div>

                        {/* Status Aktif */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Status Artikel
                            </label>
                            <motion.button
                                type="button"
                                onClick={() => setIsActive(!isActive)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all ${isActive
                                    ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400'
                                    }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
                                <span className="font-medium">{isActive ? 'Aktif (Dipublikasikan)' : 'Non-aktif (Draft)'}</span>
                            </motion.button>
                        </motion.div>

                        {/* Pilih Kategori (Multi-select) */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}>
                            <div className="flex items-center justify-between mb-3">
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                    <Tag className="w-4 h-4 text-teal-500" /> Pilih Kategori
                                </label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={selectAllKategoris} className="text-xs px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors">Pilih Semua</button>
                                    <button type="button" onClick={clearAllKategoris} className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Hapus Semua</button>
                                </div>
                            </div>
                            {kategoriList.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400 italic">Belum ada kategori. <span className="text-teal-600 dark:text-teal-400 cursor-pointer hover:underline" onClick={() => navigate('/artikel/kategori/create')}>Buat kategori baru</span></p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {kategoriList.map((kategori) => (
                                        <motion.button
                                            key={kategori.id}
                                            type="button"
                                            onClick={() => toggleKategori(kategori.id)}
                                            className={`relative px-4 py-3 rounded-xl border-2 transition-all ${selectedKategoriIds.includes(kategori.id)
                                                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 border-teal-500 text-white shadow-lg shadow-teal-500/30'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-300 dark:hover:border-teal-600'
                                                }`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <span className="font-medium">{kategori.name}</span>
                                            {selectedKategoriIds.includes(kategori.id) && (
                                                <motion.div className="absolute top-1 right-1" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                    <Check className="w-4 h-4" />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                            {selectedKategoriIds.length > 0 && (
                                <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{selectedKategoriIds.length} kategori dipilih</p>
                            )}
                        </motion.div>

                        {/* Pilih Tag (Multi-select) */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
                            <div className="flex items-center justify-between mb-3">
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                    <Bookmark className="w-4 h-4 text-purple-500" /> Pilih Tag
                                </label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={selectAllTags} className="text-xs px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors">Pilih Semua</button>
                                    <button type="button" onClick={clearAllTags} className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Hapus Semua</button>
                                </div>
                            </div>
                            {tagList.length === 0 ? (
                                <p className="text-sm text-slate-500 dark:text-slate-400 italic">Belum ada tag. <span className="text-purple-600 dark:text-purple-400 cursor-pointer hover:underline" onClick={() => navigate('/artikel/tag/create')}>Buat tag baru</span></p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {tagList.map((tag) => (
                                        <motion.button
                                            key={tag.id}
                                            type="button"
                                            onClick={() => toggleTag(tag.id)}
                                            className={`relative px-4 py-3 rounded-xl border-2 transition-all ${selectedTagIds.includes(tag.id)
                                                ? 'bg-gradient-to-r from-purple-500 to-violet-500 border-purple-500 text-white shadow-lg shadow-purple-500/30'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-purple-300 dark:hover:border-purple-600'
                                                }`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <span className="font-medium">{tag.name}</span>
                                            {selectedTagIds.includes(tag.id) && (
                                                <motion.div className="absolute top-1 right-1" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                                                    <Check className="w-4 h-4" />
                                                </motion.div>
                                            )}
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                            {selectedTagIds.length > 0 && (
                                <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{selectedTagIds.length} tag dipilih</p>
                            )}
                        </motion.div>

                        {/* Form Actions */}
                        <motion.div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
                            <motion.button type="submit" disabled={isSubmitting || submitSuccess} className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-2xl transition-all shadow-lg ${submitSuccess ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/30'} disabled:opacity-70 disabled:cursor-not-allowed`} whileHover={{ scale: isSubmitting || submitSuccess ? 1 : 1.02, y: isSubmitting || submitSuccess ? 0 : -2 }} whileTap={{ scale: isSubmitting || submitSuccess ? 1 : 0.98 }}>
                                {isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin" />Menyimpan...</>) : submitSuccess ? (<><CheckCircle2 className="w-5 h-5" />Berhasil Disimpan!</>) : (<><Save className="w-5 h-5" />Simpan Artikel</>)}
                            </motion.button>
                            <motion.button type="button" onClick={() => { reset(); setSelectedKategoriIds([]); setSelectedTagIds([]); setIsActive(true); }} disabled={isSubmitting} className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50" whileHover={{ scale: isSubmitting ? 1 : 1.02 }} whileTap={{ scale: isSubmitting ? 1 : 0.98 }}>
                                <X className="w-5 h-5 inline-block mr-2" /> Reset
                            </motion.button>
                        </motion.div>
                    </form>
                </motion.div>

                <motion.div className="mt-6 p-4 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm rounded-2xl border border-blue-200/50 dark:border-blue-500/30" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                    <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">💡 Tips Pengisian</h3>
                    <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                        <li>• Judul artikel harus jelas dan menarik</li>
                        <li>• Konten mendukung teks biasa, Anda bisa menambahkan formatting nanti</li>
                        <li>• Pilih kategori dan tag yang relevan untuk memudahkan pencarian</li>
                        <li>• Artikel non-aktif akan disimpan sebagai draft</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
