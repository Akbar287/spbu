'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useReadContract } from 'wagmi';
import {
    Receipt, ArrowLeft, Save, Percent,
    AlertCircle, CheckCircle2, Loader2, Sparkles, ToggleLeft, ToggleRight
} from 'lucide-react';
import { DIAMOND_ABI, DIAMOND_ADDRESS } from '@/contracts/config';
import { simulateContract, writeContract } from '@wagmi/core';
import { config } from '@/config/wagmi';

// Blockchain interface
interface BlockchainPajakPembelianLib {
    pajakPembelianLibId: bigint;
    ppn: bigint;
    ppbkb: bigint;
    pph: bigint;
    aktif: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Validation Schema
const pajakValidationSchema = yup.object({
    ppn: yup.number()
        .required('PPN wajib diisi')
        .min(0, 'PPN tidak boleh negatif')
        .max(10000, 'PPN maksimal 100%'),
    ppbkb: yup.number()
        .required('PPBKB wajib diisi')
        .min(0, 'PPBKB tidak boleh negatif')
        .max(10000, 'PPBKB maksimal 100%'),
    pph: yup.number()
        .required('PPH wajib diisi')
        .min(0, 'PPH tidak boleh negatif')
        .max(10000, 'PPH maksimal 100%'),
    aktif: yup.boolean().required(),
});

type PajakFormData = yup.InferType<typeof pajakValidationSchema>;

export default function PajakEdit() {
    const navigate = useNavigate();
    const { pajakId } = useParams<{ pajakId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [isAktif, setIsAktif] = useState(true);

    // Fetch existing data
    const { data: blockchainPajak, isLoading: isLoadingData } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getPajakPembelianLibById',
        args: pajakId ? [BigInt(pajakId)] : undefined,
        query: {
            enabled: !!pajakId,
        },
    });

    // Process blockchain data
    const pajakData = useMemo(() => {
        if (!blockchainPajak) return null;
        const pajak = blockchainPajak as BlockchainPajakPembelianLib;
        if (pajak.deleted || Number(pajak.pajakPembelianLibId) === 0) return null;
        return {
            pajakPembelianLibId: Number(pajak.pajakPembelianLibId),
            ppn: Number(pajak.ppn),
            ppbkb: Number(pajak.ppbkb),
            pph: Number(pajak.pph),
            aktif: pajak.aktif,
        };
    }, [blockchainPajak]);

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        setValue,
        reset,
    } = useForm<PajakFormData>({
        resolver: yupResolver(pajakValidationSchema),
        mode: 'onChange',
        defaultValues: {
            ppn: 0,
            ppbkb: 0,
            pph: 0,
            aktif: true,
        },
    });

    // Pre-fill form when data is loaded
    useEffect(() => {
        if (pajakData) {
            reset({
                ppn: pajakData.ppn,
                ppbkb: pajakData.ppbkb,
                pph: pajakData.pph,
                aktif: pajakData.aktif,
            });
            setIsAktif(pajakData.aktif);
        }
    }, [pajakData, reset]);

    const onSubmit = async (data: PajakFormData) => {
        if (!pajakId) return;
        setIsSubmitting(true);
        try {
            const { request } = await simulateContract(config, {
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'updatePajakPembelianLib',
                args: [
                    BigInt(pajakId),
                    BigInt(data.ppn),
                    BigInt(data.ppbkb),
                    BigInt(data.pph),
                    data.aktif,
                ],
            });

            await writeContract(config, request);
            setSubmitSuccess(true);
            setTimeout(() => {
                navigate(`/konfigurasi/pajak/${pajakId}`);
            }, 1500);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleAktif = () => {
        const newValue = !isAktif;
        setIsAktif(newValue);
        setValue('aktif', newValue);
    };

    const inputBaseClass = "w-full px-4 py-3 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border transition-all duration-200 outline-none";
    const inputNormalClass = "border-slate-200 dark:border-slate-700 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20";
    const inputErrorClass = "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";
    const inputSuccessClass = "border-emerald-400 dark:border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

    const getInputClass = (fieldName: keyof PajakFormData) => {
        if (errors[fieldName]) return `${inputBaseClass} ${inputErrorClass}`;
        if (touchedFields[fieldName] && !errors[fieldName]) return `${inputBaseClass} ${inputSuccessClass}`;
        return `${inputBaseClass} ${inputNormalClass}`;
    };

    // Loading state
    if (isLoadingData) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-slate-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat data pajak...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Not found state
    if (!pajakData) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex flex-col items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-6 text-center px-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-12 h-12 text-slate-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Konfigurasi Pajak Tidak Ditemukan</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-md">
                            Konfigurasi pajak dengan ID <strong>#{pajakId}</strong> tidak ditemukan.
                        </p>
                        <motion.button
                            onClick={() => navigate('/konfigurasi/pajak')}
                            className="px-6 py-3 bg-slate-600 text-white font-semibold rounded-2xl shadow-lg"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Kembali ke Daftar Pajak
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-slate-100/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-slate-400/20 to-gray-400/20 dark:from-slate-600/30 dark:to-gray-600/30 blur-3xl"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-zinc-400/15 to-neutral-400/15 dark:from-zinc-500/20 dark:to-neutral-500/20 blur-3xl"
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
                    onClick={() => navigate(`/konfigurasi/pajak/${pajakId}`)}
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
                            className="p-4 bg-gradient-to-br from-slate-500 to-gray-600 rounded-2xl shadow-lg shadow-slate-500/30"
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Receipt className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Edit Konfigurasi Pajak #{pajakId}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Perbarui konfigurasi tarif pajak (PPN, PPBKB, PPH)
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
                        <Sparkles className="w-5 h-5 text-slate-400/50" />
                    </motion.div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 p-6 md:p-8 space-y-6">
                        {/* Info Banner */}
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                <strong>Info:</strong> Nilai persentase dikalikan 100. Contoh: 11% = 1100, 5.25% = 525, 0.25% = 25
                            </p>
                        </div>

                        {/* PPN Field */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Percent className="w-4 h-4 text-blue-500" />
                                PPN (×100)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    {...register('ppn')}
                                    placeholder="Contoh: 1100 (untuk 11%)"
                                    className={`${getInputClass('ppn')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                                />
                            </div>
                            {errors.ppn && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.ppn.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* PPBKB Field */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Percent className="w-4 h-4 text-purple-500" />
                                PPBKB (×100)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    {...register('ppbkb')}
                                    placeholder="Contoh: 525 (untuk 5.25%)"
                                    className={`${getInputClass('ppbkb')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                                />
                            </div>
                            {errors.ppbkb && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.ppbkb.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* PPH Field */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Percent className="w-4 h-4 text-amber-500" />
                                PPH (×100)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    {...register('pph')}
                                    placeholder="Contoh: 25 (untuk 0.25%)"
                                    className={`${getInputClass('pph')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                                />
                            </div>
                            {errors.pph && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.pph.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Aktif Toggle */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Status Konfigurasi
                            </label>
                            <div
                                onClick={handleToggleAktif}
                                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${isAktif
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                                    }`}
                            >
                                {isAktif ? (
                                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                                ) : (
                                    <ToggleLeft className="w-8 h-8 text-slate-400" />
                                )}
                                <div>
                                    <p className={`font-semibold ${isAktif ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {isAktif ? 'Aktif' : 'Nonaktif'}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-500">
                                        {isAktif ? 'Konfigurasi ini akan digunakan untuk perhitungan pajak' : 'Konfigurasi ini tidak akan digunakan'}
                                    </p>
                                </div>
                            </div>
                            <input type="hidden" {...register('aktif')} />
                        </motion.div>

                        {/* Form Actions */}
                        <motion.div
                            className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <motion.button
                                type="button"
                                onClick={() => navigate(`/konfigurasi/pajak/${pajakId}`)}
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
                                    : 'bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-700 hover:to-gray-700 text-white shadow-slate-500/30'
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
