'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Container, ArrowLeft, Save,
    AlertCircle, CheckCircle2, Loader2, Sparkles, ToggleLeft, Umbrella, Fuel
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Interfaces
interface BlockchainDispenser {
    dispenserId: bigint;
    payungId: bigint;
    namaDispenser: string;
    aktif: boolean;
    deleted: boolean;
}

interface BlockchainPayung {
    payungId: bigint;
    namaPayung: string;
    aktif: boolean;
    deleted: boolean;
}

// Form data interface
interface DispenserFormData {
    namaDispenser: string;
    payungId: string;
    aktif: boolean;
}

// Validation Schema
const dispenserValidationSchema = yup.object({
    namaDispenser: yup.string()
        .required('Nama dispenser wajib diisi')
        .min(2, 'Nama dispenser minimal 2 karakter')
        .max(100, 'Nama dispenser maksimal 100 karakter'),
    payungId: yup.string()
        .required('Payung wajib dipilih'),
    aktif: yup.boolean()
        .required(),
}).required();

export default function DispenserEdit() {
    const navigate = useNavigate();
    const { dispenserId } = useParams<{ dispenserId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [formLoaded, setFormLoaded] = useState(false);

    // Fetch Dispenser Data
    const { data: blockchainDispenser, isLoading: isLoadingDispenser, error: errorDispenser } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getDispenserById',
        args: dispenserId ? [BigInt(dispenserId)] : undefined,
        query: {
            enabled: !!dispenserId,
        },
    });

    // Fetch Payung List for Dropdown
    const { data: payungResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllPayung',
        args: [BigInt(0), BigInt(100)],
    });

    // Process Payung List
    const payungList = useMemo(() => {
        if (!payungResponse) return [];
        const rawPayung = payungResponse as BlockchainPayung[];
        return rawPayung
            .filter(p => !p.deleted && p.aktif)
            .map(p => ({
                id: Number(p.payungId),
                name: p.namaPayung,
            }));
    }, [payungResponse]);

    // Process Dispenser Data
    const dispenserData = useMemo(() => {
        if (!blockchainDispenser) return null;
        const d = blockchainDispenser as BlockchainDispenser;
        if (d.deleted || Number(d.dispenserId) === 0) return null;
        return d;
    }, [blockchainDispenser]);

    const notFound = !isLoadingDispenser && !errorDispenser && !dispenserData;

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        setValue,
        watch,
    } = useForm<DispenserFormData>({
        resolver: yupResolver(dispenserValidationSchema),
        mode: 'onChange',
    });

    const aktif = watch('aktif');
    const { writeContractAsync } = useWriteContract();

    // Populate Form when data loads
    useEffect(() => {
        if (dispenserData && !formLoaded) {
            setValue('namaDispenser', dispenserData.namaDispenser);
            setValue('payungId', dispenserData.payungId.toString());
            setValue('aktif', dispenserData.aktif);
            setFormLoaded(true);
        }
    }, [dispenserData, formLoaded, setValue]);

    const onSubmit = async (data: DispenserFormData) => {
        if (!dispenserId) return;

        setIsSubmitting(true);
        try {
            await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'updateDispenser',
                args: [
                    BigInt(dispenserId),
                    data.namaDispenser,
                    BigInt(data.payungId),
                    data.aktif,
                ],
            });

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate('/master/dispenser');
            }, 1500);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputBaseClass = "w-full px-4 py-3 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border transition-all duration-200 outline-none";
    const inputNormalClass = "border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";
    const inputErrorClass = "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";
    const inputSuccessClass = "border-indigo-400 dark:border-indigo-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

    const getInputClass = (fieldName: keyof DispenserFormData) => {
        if (errors[fieldName]) return `${inputBaseClass} ${inputErrorClass}`;
        if (touchedFields[fieldName] && !errors[fieldName]) return `${inputBaseClass} ${inputSuccessClass}`;
        return `${inputBaseClass} ${inputNormalClass}`;
    };

    // Loading State
    if (isLoadingDispenser) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat data Dispenser...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Not Found State
    if (notFound) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4 text-center p-8"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Dispenser Tidak Ditemukan</h2>
                        <p className="text-slate-600 dark:text-slate-400">Data Dispenser dengan ID {dispenserId} tidak ditemukan.</p>
                        <motion.button
                            onClick={() => navigate('/master/dispenser')}
                            className="mt-4 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-2xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Kembali ke Daftar
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-indigo-50 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-indigo-400/20 to-purple-400/20 dark:from-indigo-600/30 dark:to-purple-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-blue-400/15 to-cyan-400/15 dark:from-blue-500/20 dark:to-cyan-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/master/dispenser')}
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
                            className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30"
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Fuel className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Edit Dispenser
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Perbarui data Dispenser #{dispenserId}
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
                        <Sparkles className="w-5 h-5 text-indigo-400/50" />
                    </motion.div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 p-6 md:p-8 space-y-6">

                        {/* Payung List (Dropdown) */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Umbrella className="w-4 h-4 text-indigo-500" />
                                Pilih Payung
                            </label>
                            <div className="relative">
                                <select
                                    {...register('payungId')}
                                    className={`${getInputClass('payungId')} appearance-none text-slate-700 dark:text-slate-200 cursor-pointer`}
                                >
                                    <option value="">-- Pilih Payung --</option>
                                    {payungList.map((payung) => (
                                        <option key={payung.id} value={payung.id}>
                                            {payung.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                    <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                    </svg>
                                </div>
                            </div>
                            {errors.payungId && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.payungId.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Nama Dispenser */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Container className="w-4 h-4 text-indigo-500" />
                                Nama Dispenser
                            </label>
                            <input
                                type="text"
                                {...register('namaDispenser')}
                                placeholder="Contoh: Dispenser A1"
                                className={`${getInputClass('namaDispenser')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                            />
                            {errors.namaDispenser && (
                                <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.namaDispenser.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Status Aktif Toggle */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <ToggleLeft className="w-4 h-4 text-purple-500" />
                                Status Dispenser
                            </label>
                            <div className="flex items-center gap-4">
                                <motion.button
                                    type="button"
                                    onClick={() => setValue('aktif', true)}
                                    className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all ${aktif
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-300'
                                        }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    ✓ Aktif
                                </motion.button>
                                <motion.button
                                    type="button"
                                    onClick={() => setValue('aktif', false)}
                                    className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all ${!aktif
                                        ? 'bg-gradient-to-r from-red-500 to-orange-500 border-red-500 text-white shadow-lg shadow-red-500/30'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-red-300'
                                        }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    ✗ Tidak Aktif
                                </motion.button>
                            </div>
                        </motion.div>

                        {/* Form Actions */}
                        <motion.div
                            className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                        >
                            <motion.button
                                type="submit"
                                disabled={isSubmitting || submitSuccess}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-2xl transition-all shadow-lg ${submitSuccess
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-indigo-500/30'
                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-indigo-500/30'
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
                                        Berhasil Diupdate!
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
