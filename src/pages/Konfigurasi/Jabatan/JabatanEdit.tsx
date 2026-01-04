'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Briefcase, ArrowLeft, Save, Building2, Hash, FileText,
    AlertCircle, CheckCircle2, Loader2, Sparkles, BarChart2
} from 'lucide-react';
import { jabatanValidationSchema, JabatanFormData } from '@/validation/jabatan.validation';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Interfaces
interface BlockchainJabatan {
    jabatanId: bigint;
    levelId: bigint;
    namaJabatan: string;
    keterangan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainLevel {
    levelId: bigint;
    namaLevel: string;
    deleted: boolean;
}

export default function JabatanEdit() {
    const navigate = useNavigate();
    const { jabatanId } = useParams<{ jabatanId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [formLoaded, setFormLoaded] = useState(false);

    // Fetch Jabatan Data
    const { data: blockchainJabatan, isLoading: isLoadingJabatan, error: errorJabatan } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getJabatanById',
        args: jabatanId ? [BigInt(jabatanId)] : undefined,
        query: {
            enabled: !!jabatanId,
        },
    });

    // Fetch Level Data for Dropdown
    const { data: levelResponse, isLoading: isLoadingLevel } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllLevel',
        args: [BigInt(0), BigInt(100)],
    });

    // Write Contract Hook
    const { writeContractAsync } = useWriteContract();

    // Process Level List
    const levelList = useMemo(() => {
        if (!levelResponse) return [];
        const [rawLevel] = levelResponse as [BlockchainLevel[], bigint];
        return rawLevel
            .filter(lvl => !lvl.deleted)
            .map(lvl => ({
                id: Number(lvl.levelId),
                name: lvl.namaLevel
            }));
    }, [levelResponse]);

    // Process Jabatan Data
    const jabatanData = useMemo(() => {
        if (!blockchainJabatan) return null;
        const jabatan = blockchainJabatan as BlockchainJabatan;
        if (jabatan.deleted || Number(jabatan.jabatanId) === 0) return null;
        return jabatan;
    }, [blockchainJabatan]);

    const notFound = !isLoadingJabatan && !errorJabatan && !jabatanData;

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        setValue,
    } = useForm<JabatanFormData>({
        resolver: yupResolver(jabatanValidationSchema),
        mode: 'onChange',
    });

    // Populate Form
    React.useEffect(() => {
        if (jabatanData && !formLoaded) {
            setValue('levelId', Number(jabatanData.levelId));
            setValue('namaJabatan', jabatanData.namaJabatan);
            setValue('keterangan', jabatanData.keterangan || '');
            setFormLoaded(true);
        }
    }, [jabatanData, formLoaded, setValue]);

    const onSubmit = async (data: JabatanFormData) => {
        if (!jabatanId) return;
        setIsSubmitting(true);
        try {
            await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'updateJabatan',
                args: [
                    BigInt(jabatanId),
                    BigInt(data.levelId),
                    data.namaJabatan,
                    data.keterangan || '',
                ],
            });

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate('/konfigurasi/jabatan');
            }, 1000);
        } catch (error) {
            console.error('Error updating jabatan:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputBaseClass = "w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border transition-all duration-200 outline-none";
    const inputNormalClass = "border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";
    const inputErrorClass = "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";
    const inputSuccessClass = "border-emerald-400 dark:border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

    const getInputClass = (fieldName: keyof JabatanFormData) => {
        if (errors[fieldName]) return `${inputBaseClass} ${inputErrorClass}`;
        if (touchedFields[fieldName] && !errors[fieldName]) return `${inputBaseClass} ${inputSuccessClass}`;
        return `${inputBaseClass} ${inputNormalClass}`;
    };

    // Loading State
    if (isLoadingJabatan || (isLoadingLevel && !levelList.length)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-amber-50 dark:bg-slate-900">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 text-amber-500 animate-spin" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat data...</p>
                </div>
            </div>
        );
    }

    // Not Found State
    if (notFound) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-amber-50 dark:bg-slate-900 p-4">
                <div className="text-center max-w-md">
                    <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-12 h-12 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Data Jabatan Tidak Ditemukan</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">
                        Jabatan dengan ID tersebut tidak ditemukan atau mungkin sudah dihapus.
                    </p>
                    <motion.button
                        onClick={() => navigate('/konfigurasi/jabatan')}
                        className="px-6 py-3 bg-amber-600 text-white font-semibold rounded-2xl shadow-lg shadow-amber-500/30"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Kembali ke Daftar
                    </motion.button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-amber-50 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20 dark:from-amber-600/30 dark:to-orange-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-red-400/15 to-rose-400/15 dark:from-red-500/20 dark:to-rose-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/konfigurasi/jabatan')}
                    className="mb-8 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm mt-32"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </motion.button>

                {/* Header */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <div className="flex items-center gap-4">
                        <motion.div
                            className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/30"
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Briefcase className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Edit Jabatan
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Perbarui data jabatan dan strukturnya
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Form Card */}
                <motion.div
                    className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {/* Glassmorphism Background */}
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    {/* Animated Sparkles */}
                    <motion.div
                        className="absolute top-[10%] right-[10%] pointer-events-none"
                        animate={{ opacity: [0, 0.5, 0], scale: [0, 1, 0] }}
                        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                    >
                        <Sparkles className="w-5 h-5 text-amber-400/50" />
                    </motion.div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 p-6 md:p-8 space-y-6">
                        {/* ID Field (Read-only) */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Hash className="w-4 h-4 text-amber-500" />
                                Jabatan ID
                            </label>
                            <div className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed">
                                {jabatanId}
                            </div>
                        </motion.div>

                        {/* Level Selection */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <BarChart2 className="w-4 h-4 text-amber-500" />
                                Pilih Level
                            </label>
                            <div className="relative">
                                <BarChart2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <select
                                    {...register('levelId')}
                                    className={`${getInputClass('levelId')} appearance-none text-slate-700 dark:text-slate-200 cursor-pointer`}
                                >
                                    <option value={0}>-- Pilih Level --</option>
                                    {levelList.map((lvl) => (
                                        <option key={lvl.id} value={lvl.id}>
                                            {lvl.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {errors.levelId && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.levelId.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Nama Jabatan */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Briefcase className="w-4 h-4 text-amber-500" />
                                Nama Jabatan
                            </label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    {...register('namaJabatan')}
                                    placeholder="Contoh: Kepala Divisi IT"
                                    className={`${getInputClass('namaJabatan')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                                />
                            </div>
                            {errors.namaJabatan && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.namaJabatan.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Keterangan */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <FileText className="w-4 h-4 text-amber-500" />
                                Keterangan
                            </label>
                            <div className="relative">
                                <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                                <textarea
                                    {...register('keterangan')}
                                    rows={4}
                                    placeholder="Deskripsi jabatan..."
                                    className={`${getInputClass('keterangan')} text-slate-700 dark:text-slate-200 placeholder-slate-400 resize-none`}
                                />
                            </div>
                            {errors.keterangan && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.keterangan.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Form Actions */}
                        <motion.div
                            className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55 }}
                        >
                            <motion.button
                                type="button"
                                onClick={() => navigate('/konfigurasi/jabatan')}
                                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                Batal
                            </motion.button>
                            <motion.button
                                type="submit"
                                disabled={isSubmitting || submitSuccess}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-2xl transition-all shadow-lg ${submitSuccess
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30'
                                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-amber-500/30'
                                    } disabled:opacity-70 disabled:cursor-not-allowed`}
                                whileHover={{ scale: isSubmitting || submitSuccess ? 1 : 1.02, y: isSubmitting || submitSuccess ? 0 : -2 }}
                                whileTap={{ scale: isSubmitting || submitSuccess ? 1 : 0.98 }}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : submitSuccess ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Berhasil Disimpan!
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Simpan Perubahan
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
