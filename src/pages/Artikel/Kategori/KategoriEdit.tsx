'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useReadContract } from 'wagmi';
import { simulateContract, writeContract } from '@wagmi/core';
import {
    Tag, ArrowLeft, Save, FileText,
    AlertCircle, CheckCircle2, Loader2, Sparkles, RefreshCw
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { config } from '@/config/wagmi';

// Blockchain Kategori interface
interface BlockchainKategori {
    kategoriId: bigint;
    kategori: string;
    deskripsi: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Form validation schema
const kategoriValidationSchema = yup.object({
    kategori: yup.string().required('Nama kategori wajib diisi').min(2, 'Minimal 2 karakter'),
    deskripsi: yup.string().required('Deskripsi wajib diisi').min(5, 'Minimal 5 karakter'),
}).required();

interface KategoriFormData {
    kategori: string;
    deskripsi: string;
}

export default function KategoriEdit() {
    const navigate = useNavigate();
    const { kategoriId } = useParams<{ kategoriId: string }>();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [submitSuccess, setSubmitSuccess] = React.useState(false);
    const [formLoaded, setFormLoaded] = React.useState(false);

    // Fetch Kategori data from blockchain by ID
    const { data: blockchainKategori, isLoading, error } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getKategoriById',
        args: kategoriId ? [BigInt(kategoriId)] : undefined,
        query: { enabled: !!kategoriId },
    });

    // Check if Kategori is valid and not deleted
    const kategoriData = useMemo(() => {
        if (!blockchainKategori) return null;
        const k = blockchainKategori as BlockchainKategori;
        if (k.deleted || Number(k.kategoriId) === 0) return null;
        return k;
    }, [blockchainKategori]);

    const notFound = !isLoading && !error && !kategoriData;

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        setValue,
    } = useForm<KategoriFormData>({
        resolver: yupResolver(kategoriValidationSchema),
        mode: 'onChange',
    });

    // Populate form when data is loaded
    React.useEffect(() => {
        if (kategoriData && !formLoaded) {
            setValue('kategori', kategoriData.kategori);
            setValue('deskripsi', kategoriData.deskripsi);
            setFormLoaded(true);
        }
    }, [kategoriData, formLoaded, setValue]);

    const onSubmit = async (data: KategoriFormData) => {
        if (!kategoriId) return;

        setIsSubmitting(true);
        try {
            const { request } = await simulateContract(config, {
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'updateKategori',
                args: [BigInt(kategoriId), data.kategori, data.deskripsi],
            });

            await writeContract(config, request).then(() => {
                setSubmitSuccess(true);
                setTimeout(() => {
                    navigate('/artikel/kategori');
                }, 1500);
            }).catch(() => { });
        } catch (error) {
            console.error('Error submitting form:', error);
            setIsSubmitting(false);
        }
    };

    const inputBaseClass = "w-full px-4 py-3 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border transition-all duration-200 outline-none";
    const inputNormalClass = "border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
    const inputErrorClass = "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";
    const inputSuccessClass = "border-emerald-400 dark:border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

    const getInputClass = (fieldName: keyof KategoriFormData) => {
        if (errors[fieldName]) return `${inputBaseClass} ${inputErrorClass}`;
        if (touchedFields[fieldName] && !errors[fieldName]) return `${inputBaseClass} ${inputSuccessClass}`;
        return `${inputBaseClass} ${inputNormalClass}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-teal-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div className="flex flex-col items-center gap-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat data Kategori...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (notFound) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-teal-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div className="flex flex-col items-center gap-4 text-center p-8" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full"><AlertCircle className="w-12 h-12 text-red-500" /></div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Kategori Tidak Ditemukan</h2>
                        <p className="text-slate-600 dark:text-slate-400">Data Kategori dengan ID {kategoriId} tidak ditemukan.</p>
                        <motion.button onClick={() => navigate('/artikel/kategori')} className="mt-4 px-6 py-3 bg-teal-600 text-white font-semibold rounded-2xl" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>Kembali ke Daftar</motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-teal-50 dark:bg-slate-900" />

            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-teal-400/20 to-cyan-400/20 dark:from-teal-600/30 dark:to-cyan-600/30 blur-3xl" animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }} transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-emerald-400/15 to-green-400/15 dark:from-emerald-500/20 dark:to-green-500/20 blur-3xl" animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }} transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }} />
                <motion.div className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-cyan-400/15 to-teal-400/15 dark:from-cyan-500/20 dark:to-teal-500/20 blur-3xl" animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
            </div>

            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                <motion.button onClick={() => navigate('/artikel/kategori')} className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm mt-32" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} whileHover={{ x: -5 }} whileTap={{ scale: 0.95 }}>
                    <ArrowLeft className="w-4 h-4" /> Kembali
                </motion.button>

                <motion.div className="mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="flex items-center gap-4">
                        <motion.div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/30" whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }} transition={{ duration: 0.5 }}>
                            <Tag className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">Edit Kategori</h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">Perbarui data Kategori #{kategoriId}</p>
                        </div>
                    </div>
                </motion.div>

                <motion.div className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    {[...Array(5)].map((_, i) => (
                        <motion.div key={i} className="absolute pointer-events-none" style={{ top: `${15 + (i * 18)}%`, left: `${10 + (i * 20)}%` }} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0], rotate: [0, 180] }} transition={{ duration: 3, repeat: Infinity, delay: i * 0.8, ease: 'easeInOut' }}>
                            <Sparkles className="w-4 h-4 text-amber-400/60 dark:text-amber-300/40" />
                        </motion.div>
                    ))}

                    <motion.div className="absolute top-[25%] right-[15%] pointer-events-none" initial={{ opacity: 0, scale: 0 }} animate={{ opacity: [0, 0.8, 0.8, 0], scale: [0, 1.2, 1.2, 0] }} transition={{ duration: 4, repeat: Infinity, delay: 1.5, ease: 'easeInOut' }}>
                        <Sparkles className="w-5 h-5 text-orange-400/50 dark:text-orange-300/30" />
                    </motion.div>

                    <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 p-6 md:p-8 space-y-6">
                        {/* Nama Kategori */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Tag className="w-4 h-4 text-amber-500" /> Nama Kategori
                            </label>
                            <input type="text" {...register('kategori')} placeholder="Contoh: Teknologi" className={`${getInputClass('kategori')} text-slate-700 dark:text-slate-200 placeholder-slate-400`} />
                            {errors.kategori && (<motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}><AlertCircle className="w-4 h-4" />{errors.kategori.message}</motion.p>)}
                        </motion.div>

                        {/* Deskripsi */}
                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <FileText className="w-4 h-4 text-amber-500" /> Deskripsi
                            </label>
                            <textarea {...register('deskripsi')} rows={4} placeholder="Masukkan deskripsi kategori..." className={`${getInputClass('deskripsi')} text-slate-700 dark:text-slate-200 placeholder-slate-400 resize-none`} />
                            {errors.deskripsi && (<motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}><AlertCircle className="w-4 h-4" />{errors.deskripsi.message}</motion.p>)}
                        </motion.div>

                        {/* Form Actions */}
                        <motion.div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                            <motion.button type="submit" disabled={isSubmitting || submitSuccess} className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-2xl transition-all shadow-lg ${submitSuccess ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/30'} disabled:opacity-70 disabled:cursor-not-allowed`} whileHover={{ scale: isSubmitting || submitSuccess ? 1 : 1.02, y: isSubmitting || submitSuccess ? 0 : -2 }} whileTap={{ scale: isSubmitting || submitSuccess ? 1 : 0.98 }}>
                                {isSubmitting ? (<><Loader2 className="w-5 h-5 animate-spin" />Menyimpan Perubahan...</>) : submitSuccess ? (<><CheckCircle2 className="w-5 h-5" />Berhasil Diperbarui!</>) : (<><Save className="w-5 h-5" />Simpan Perubahan</>)}
                            </motion.button>
                            <motion.button type="button" onClick={() => { if (kategoriData) { setValue('kategori', kategoriData.kategori); setValue('deskripsi', kategoriData.deskripsi); } }} disabled={isSubmitting} className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50" whileHover={{ scale: isSubmitting ? 1 : 1.02 }} whileTap={{ scale: isSubmitting ? 1 : 0.98 }}>
                                <RefreshCw className="w-5 h-5 inline-block mr-2" /> Reset
                            </motion.button>
                        </motion.div>
                    </form>
                </motion.div>

                <motion.div className="mt-6 p-4 bg-amber-50/80 dark:bg-amber-900/20 backdrop-blur-sm rounded-2xl border border-amber-200/50 dark:border-amber-500/30" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                    <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">✏️ Mode Edit</h3>
                    <ul className="text-sm text-amber-600 dark:text-amber-400 space-y-1">
                        <li>• Perubahan akan langsung memperbarui data Kategori</li>
                        <li>• Pastikan data yang dimasukkan sudah benar sebelum menyimpan</li>
                        <li>• Klik Reset untuk mengembalikan data ke nilai sebelumnya</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
