'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    ArrowLeft, Save, X, Container, CheckCircle2,
    Loader2, AlertCircle, ToggleLeft, Check, Umbrella, Fuel
} from 'lucide-react';
import { DIAMOND_ABI, DIAMOND_ADDRESS } from '@/contracts/config';
import { useReadContract, useWriteContract } from 'wagmi';

// Interfaces
interface BlockchainSpbu {
    spbuId: bigint;
    namaSpbu: string;
    deleted: boolean;
}

interface BlockchainDombak {
    dombakId: bigint;
    spbuId: bigint;
    namaDombak: string;
    aktif: boolean;
    deleted: boolean;
}

// Form data interface
interface PayungFormData {
    namaPayung: string;
    aktif: boolean;
}

// Validation Schema
const payungValidationSchema = yup.object({
    namaPayung: yup.string()
        .required('Nama payung wajib diisi')
        .min(2, 'Nama payung minimal 2 karakter')
        .max(100, 'Nama payung maksimal 100 karakter'),
    aktif: yup.boolean()
        .required(),
}).required();

export default function PayungCreate() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [selectedDombakIds, setSelectedDombakIds] = useState<number[]>([]);

    // Fetch SPBU data mapping
    const { data: spbuResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllSpbu',
        args: [BigInt(0), BigInt(100)],
    });

    // Fetch Dombak data for multi-select
    const { data: dombakResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllDombak',
        args: [BigInt(0), BigInt(100)],
    });

    const spbuMap = useMemo(() => {
        if (!spbuResponse) return new Map<number, string>();
        const [rawSpbu] = spbuResponse as [BlockchainSpbu[], bigint];
        const map = new Map<number, string>();
        rawSpbu.forEach(s => {
            if (!s.deleted) map.set(Number(s.spbuId), s.namaSpbu);
        });
        return map;
    }, [spbuResponse]);

    const dombakList = useMemo(() => {
        if (!dombakResponse) return [];
        const [rawDombak] = dombakResponse as [BlockchainDombak[], bigint];
        return rawDombak
            .filter(d => !d.deleted)
            .map(d => ({
                id: Number(d.dombakId),
                name: d.namaDombak,
                spbuName: spbuMap.get(Number(d.spbuId)) || 'Unknown SPBU',
                isActive: d.aktif
            }));
    }, [dombakResponse, spbuMap]);

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        reset,
        watch,
        setValue,
    } = useForm<PayungFormData>({
        resolver: yupResolver(payungValidationSchema),
        mode: 'onChange',
        defaultValues: {
            namaPayung: '',
            aktif: true,
        },
    });

    const aktif = watch('aktif');
    const { writeContractAsync } = useWriteContract();

    const toggleDombak = (dombakId: number) => {
        setSelectedDombakIds(prev =>
            prev.includes(dombakId)
                ? prev.filter(id => id !== dombakId)
                : [...prev, dombakId]
        );
    };

    const selectAllDombak = () => {
        setSelectedDombakIds(dombakList.map(d => d.id));
    };

    const clearAllDombak = () => {
        setSelectedDombakIds([]);
    };

    const onSubmit = async (data: PayungFormData) => {
        setIsSubmitting(true);
        try {
            await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'createPayung',
                args: [
                    data.namaPayung,
                    selectedDombakIds.map(id => BigInt(id)),
                    data.aktif,
                ],
            });

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate('/master/payung');
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

    const getInputClass = (fieldName: keyof PayungFormData) => {
        if (errors[fieldName]) return `${inputBaseClass} ${inputErrorClass}`;
        if (touchedFields[fieldName] && !errors[fieldName]) return `${inputBaseClass} ${inputSuccessClass}`;
        return `${inputBaseClass} ${inputNormalClass}`;
    };

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
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/master/payung')}
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
                            <Umbrella className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Tambah Payung Baru
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Tambahkan payung baru dan kaitkan dengan dombak yang sesuai
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

                        {/* Nama Payung */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Umbrella className="w-4 h-4 text-indigo-500" />
                                Nama Payung
                            </label>
                            <input
                                type="text"
                                {...register('namaPayung')}
                                placeholder="Contoh: Payung A, Island 1"
                                className={`${getInputClass('namaPayung')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                            />
                            {errors.namaPayung && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.namaPayung.message}
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
                                Status Payung
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

                        {/* Pilih Dombak (Multi-select) */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.55 }}
                            className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                    <Container className="w-4 h-4 text-indigo-500" />
                                    Pilih Dombak
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllDombak}
                                        className="text-xs px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                    >
                                        Pilih Semua
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearAllDombak}
                                        className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        Hapus Semua
                                    </button>
                                </div>
                            </div>

                            {/* Dombak Grid */}
                            {dombakList.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                                    Belum ada data dombak tersedia.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {dombakList.map((dombak) => (
                                        <motion.button
                                            key={dombak.id}
                                            type="button"
                                            onClick={() => toggleDombak(dombak.id)}
                                            className={`relative px-4 py-3 rounded-xl border-2 text-left transition-all overflow-hidden ${selectedDombakIds.includes(dombak.id)
                                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 border-indigo-500 text-white shadow-md'
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-indigo-600'
                                                }`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <span className="font-semibold block">{dombak.name}</span>
                                                    <div className={`text-xs mt-1 flex items-center gap-1 ${selectedDombakIds.includes(dombak.id) ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'
                                                        }`}>
                                                        <Fuel className="w-3 h-3" />
                                                        {dombak.spbuName}
                                                    </div>
                                                </div>
                                                {selectedDombakIds.includes(dombak.id) && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="bg-white/20 p-1 rounded-full"
                                                    >
                                                        <Check className="w-3 h-3" />
                                                    </motion.div>
                                                )}
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            )}

                            {selectedDombakIds.length === 0 && (
                                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Silakan pilih dombak yang terhubung dengan payung ini
                                </p>
                            )}
                            {selectedDombakIds.length > 0 && (
                                <p className="mt-3 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                                    {selectedDombakIds.length} dombak dipilih
                                </p>
                            )}
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
                                        Berhasil Disimpan!
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Simpan Payung
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
            </div>
        </div>
    );
}
