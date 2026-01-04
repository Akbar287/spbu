'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
    ArrowLeft, Save, X, Layers, FileText, CheckCircle2,
    Loader2, Building2, AlertCircle
} from 'lucide-react';
import { divisiValidationSchema, DivisiFormData } from '@/validation/divisi.validation';
import { DIAMOND_ABI, DIAMOND_ADDRESS } from '@/contracts/config';
import { useReadContract, useWriteContract } from 'wagmi';

// Interfaces
interface BlockchainSpbu {
    spbuId: bigint;
    namaSpbu: string;
    deleted: boolean;
}

export default function DivisiCreate() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Fetch SPBU data for dropdown
    const { data: spbuResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllSpbu',
        args: [BigInt(0), BigInt(100)],
    });

    const spbuList = useMemo(() => {
        if (!spbuResponse) return [];
        const [rawSpbu] = spbuResponse as [BlockchainSpbu[], bigint];
        return rawSpbu
            .filter(spbu => !spbu.deleted)
            .map(spbu => ({
                id: Number(spbu.spbuId),
                name: spbu.namaSpbu
            }));
    }, [spbuResponse]);

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        reset,
    } = useForm<DivisiFormData>({
        resolver: yupResolver(divisiValidationSchema),
        mode: 'onChange',
        defaultValues: {
            spbuId: 0,
            namaDivisi: '',
            keterangan: '',
        },
    });

    const { writeContractAsync } = useWriteContract();

    const onSubmit = async (data: DivisiFormData) => {
        setIsSubmitting(true);
        try {
            await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'createDivisi',
                args: [
                    BigInt(data.spbuId),
                    data.namaDivisi,
                    data.keterangan,
                ],
            });

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate('/konfigurasi/divisi');
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

    const getInputClass = (fieldName: keyof DivisiFormData) => {
        if (errors[fieldName]) return `${inputBaseClass} ${inputErrorClass}`;
        if (touchedFields[fieldName] && !errors[fieldName]) return `${inputBaseClass} ${inputSuccessClass}`;
        return `${inputBaseClass} ${inputNormalClass}`;
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background like HeroSection */}
            <div className="absolute inset-0 bg-blue-50 dark:bg-slate-900" />

            {/* Animated Background Gradients - Adjusted colors for Divisi/Blue theme */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-blue-400/20 to-indigo-400/20 dark:from-blue-600/30 dark:to-indigo-600/30 blur-3xl"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-cyan-400/15 to-sky-400/15 dark:from-cyan-500/20 dark:to-sky-500/20 blur-3xl"
                    animate={{
                        x: [0, -80, 0],
                        y: [0, -60, 0],
                        scale: [1.2, 1, 1.2],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/konfigurasi/divisi')}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm mt-32"
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
                            className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/30"
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Layers className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Tambah Divisi Baru
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Tambahkan divisi baru untuk mengelola operasional SPBU
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

                    {/* Form Content */}
                    <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 p-6 md:p-8 space-y-6">
                        {/* SPBU Selection */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Building2 className="w-4 h-4 text-blue-500" />
                                Pilih SPBU
                            </label>
                            <select
                                {...register('spbuId')}
                                className={`${getInputClass('spbuId')} text-slate-700 dark:text-slate-200 cursor-pointer`}
                            >
                                <option value={0}>-- Pilih SPBU --</option>
                                {spbuList.map((spbu) => (
                                    <option key={spbu.id} value={spbu.id}>
                                        {spbu.name}
                                    </option>
                                ))}
                            </select>
                            {errors.spbuId && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.spbuId.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Nama Divisi */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Layers className="w-4 h-4 text-blue-500" />
                                Nama Divisi
                            </label>
                            <input
                                type="text"
                                {...register('namaDivisi')}
                                placeholder="Contoh: Operasional, Keuangan, SDM"
                                className={`${getInputClass('namaDivisi')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                            />
                            {errors.namaDivisi && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.namaDivisi.message}
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
                                <FileText className="w-4 h-4 text-blue-500" />
                                Keterangan
                            </label>
                            <textarea
                                {...register('keterangan')}
                                rows={4}
                                placeholder="Deskripsi tugas dan tanggung jawab divisi..."
                                className={`${getInputClass('keterangan')} text-slate-700 dark:text-slate-200 placeholder-slate-400 resize-none`}
                            />
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
                                type="submit"
                                disabled={isSubmitting || submitSuccess}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-2xl transition-all shadow-lg ${submitSuccess
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30'
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/30'
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
                                        Simpan Divisi
                                    </>
                                )}
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={() => reset()}
                                disabled={isSubmitting}
                                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                                whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                                whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                            >
                                <X className="w-5 h-5 inline-block mr-2" />
                                Reset
                            </motion.button>
                        </motion.div>
                    </form>
                </motion.div>

                {/* Form Tips */}
                <motion.div
                    className="mt-6 p-4 bg-blue-50/80 dark:bg-blue-900/20 backdrop-blur-sm rounded-2xl border border-blue-200/50 dark:border-blue-500/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 mb-2">
                        💡 Informasi
                    </h3>
                    <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                        <li>• Pilih SPBU tempat divisi ini akan ditempatkan</li>
                        <li>• Nama Divisi sebaiknya singkat dan jelas</li>
                        <li>• Keterangan dapat berisi deskripsi tugas utama divisi tersebut</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
