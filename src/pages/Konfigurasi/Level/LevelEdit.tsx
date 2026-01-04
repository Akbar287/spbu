'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    BarChart2, ArrowLeft, Save, Layers, FileText,
    AlertCircle, CheckCircle2, Loader2, Sparkles
} from 'lucide-react';
import { levelValidationSchema, LevelFormData } from '@/validation/level.validation';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Interfaces
interface BlockchainLevel {
    levelId: bigint;
    divisiId: bigint;
    namaLevel: string;
    keterangan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainDivisi {
    divisiId: bigint;
    namaDivisi: string;
    deleted: boolean;
}

export default function LevelEdit() {
    const navigate = useNavigate();
    const { levelId } = useParams<{ levelId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [formLoaded, setFormLoaded] = useState(false);

    // Fetch Level Data
    const { data: blockchainLevel, isLoading: isLoadingLevel, error: errorLevel } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getLevelById',
        args: levelId ? [BigInt(levelId)] : undefined,
        query: {
            enabled: !!levelId,
        },
    });

    // Fetch Divisi Data for Dropdown
    const { data: divisiResponse, isLoading: isLoadingDivisi } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllDivisi',
        args: [BigInt(0), BigInt(100)],
    });

    // Write Contract Hook
    const { writeContractAsync } = useWriteContract();

    // Process Divisi List
    const divisiList = useMemo(() => {
        if (!divisiResponse) return [];
        const [rawDivisi] = divisiResponse as [BlockchainDivisi[], bigint];
        return rawDivisi
            .filter(div => !div.deleted)
            .map(div => ({
                id: Number(div.divisiId),
                name: div.namaDivisi
            }));
    }, [divisiResponse]);

    // Process Level Data
    const levelData = useMemo(() => {
        if (!blockchainLevel) return null;
        const level = blockchainLevel as BlockchainLevel;
        if (level.deleted || Number(level.levelId) === 0) return null;
        return level;
    }, [blockchainLevel]);

    const notFound = !isLoadingLevel && !errorLevel && !levelData;

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        setValue,
    } = useForm<LevelFormData>({
        resolver: yupResolver(levelValidationSchema),
        mode: 'onChange',
    });

    // Populate Form
    React.useEffect(() => {
        if (levelData && !formLoaded) {
            setValue('divisiId', Number(levelData.divisiId));
            setValue('namaLevel', levelData.namaLevel);
            setValue('keterangan', levelData.keterangan || '');
            setFormLoaded(true);
        }
    }, [levelData, formLoaded, setValue]);

    const onSubmit = async (data: LevelFormData) => {
        if (!levelId) return;

        setIsSubmitting(true);
        try {
            await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'updateLevel',
                args: [
                    BigInt(levelId),
                    BigInt(data.divisiId),
                    data.namaLevel,
                    data.keterangan,
                ],
            });

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate('/konfigurasi/level');
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

    const getInputClass = (fieldName: keyof LevelFormData) => {
        if (errors[fieldName]) return `${inputBaseClass} ${inputErrorClass}`;
        if (touchedFields[fieldName] && !errors[fieldName]) return `${inputBaseClass} ${inputSuccessClass}`;
        return `${inputBaseClass} ${inputNormalClass}`;
    };

    // Loading State
    if (isLoadingLevel || (isLoadingDivisi && !divisiList.length)) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-purple-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat data Level...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Not Found State
    if (notFound) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-purple-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4 text-center p-8"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Level Tidak Ditemukan</h2>
                        <p className="text-slate-600 dark:text-slate-400">Data Level dengan ID {levelId} tidak ditemukan.</p>
                        <motion.button
                            onClick={() => navigate('/konfigurasi/level')}
                            className="mt-4 px-6 py-3 bg-blue-600 text-white font-semibold rounded-2xl"
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
            <div className="absolute inset-0 bg-purple-50 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 dark:from-purple-600/30 dark:to-pink-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-indigo-400/15 to-violet-400/15 dark:from-indigo-500/20 dark:to-violet-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/konfigurasi/level')}
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
                            className="p-4 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/30"
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <BarChart2 className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Edit Level
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Perbarui data Level #{levelId} dan jenjang posisi
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
                        <Sparkles className="w-5 h-5 text-purple-400/50" />
                    </motion.div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 p-6 md:p-8 space-y-6">
                        {/* Divisi Selection */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Layers className="w-4 h-4 text-purple-500" />
                                Pilih Divisi
                            </label>
                            <select
                                {...register('divisiId')}
                                className={`${getInputClass('divisiId')} text-slate-700 dark:text-slate-200 cursor-pointer`}
                            >
                                <option value={0}>-- Pilih Divisi --</option>
                                {divisiList.map((div) => (
                                    <option key={div.id} value={div.id}>
                                        {div.name}
                                    </option>
                                ))}
                            </select>
                            {errors.divisiId && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.divisiId.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Nama Level */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <BarChart2 className="w-4 h-4 text-purple-500" />
                                Nama Level
                            </label>
                            <input
                                type="text"
                                {...register('namaLevel')}
                                placeholder="Contoh: Staff, Supervisor, Manager"
                                className={`${getInputClass('namaLevel')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                            />
                            {errors.namaLevel && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.namaLevel.message}
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
                                <FileText className="w-4 h-4 text-purple-500" />
                                Keterangan
                            </label>
                            <textarea
                                {...register('keterangan')}
                                rows={4}
                                placeholder="Deskripsi level atau jenjang posisi..."
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
                                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-purple-500/30'
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
