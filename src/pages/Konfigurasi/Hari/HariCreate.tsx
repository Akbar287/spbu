'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    Calendar, ArrowLeft, Save, FileText,
    AlertCircle, CheckCircle2, Loader2, Sparkles, ToggleLeft, ToggleRight
} from 'lucide-react';
import { DIAMOND_ABI, DIAMOND_ADDRESS } from '@/contracts/config';
import { simulateContract, writeContract } from '@wagmi/core';
import { config } from '@/config/wagmi';

// Form Data Interface
interface HariFormData {
    namaHari: string;
    hariKerja: boolean;
    deskripsi: string;
}

// Validation Schema
const hariValidationSchema = yup.object({
    namaHari: yup.string()
        .required('Nama hari wajib diisi')
        .min(2, 'Nama hari minimal 2 karakter')
        .max(50, 'Nama hari maksimal 50 karakter'),
    hariKerja: yup.boolean().required().default(true),
    deskripsi: yup.string()
        .max(200, 'Deskripsi maksimal 200 karakter')
        .default(''),
}).required();

export default function HariCreate() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [isHariKerja, setIsHariKerja] = useState(true);

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        setValue,
    } = useForm<HariFormData>({
        resolver: yupResolver(hariValidationSchema),
        mode: 'onChange',
        defaultValues: {
            namaHari: '',
            hariKerja: true,
            deskripsi: '',
        },
    });

    const onSubmit = async (data: HariFormData) => {
        setIsSubmitting(true);
        try {
            const { request } = await simulateContract(config, {
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'createHari',
                args: [
                    data.namaHari,
                    data.hariKerja,
                    data.deskripsi || '',
                ],
            });

            await writeContract(config, request);
            setSubmitSuccess(true);
            setTimeout(() => {
                navigate('/konfigurasi/hari');
            }, 1500);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleHariKerja = () => {
        const newValue = !isHariKerja;
        setIsHariKerja(newValue);
        setValue('hariKerja', newValue);
    };

    const inputBaseClass = "w-full px-4 py-3 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border transition-all duration-200 outline-none";
    const inputNormalClass = "border-slate-200 dark:border-slate-700 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20";
    const inputErrorClass = "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";
    const inputSuccessClass = "border-emerald-400 dark:border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

    const getInputClass = (fieldName: keyof HariFormData) => {
        if (errors[fieldName]) return `${inputBaseClass} ${inputErrorClass}`;
        if (touchedFields[fieldName] && !errors[fieldName]) return `${inputBaseClass} ${inputSuccessClass}`;
        return `${inputBaseClass} ${inputNormalClass}`;
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-teal-100/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-teal-400/20 to-cyan-400/20 dark:from-teal-600/30 dark:to-cyan-600/30 blur-3xl"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-emerald-400/15 to-green-400/15 dark:from-emerald-500/20 dark:to-green-500/20 blur-3xl"
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
                    onClick={() => navigate('/konfigurasi/hari')}
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
                            className="p-4 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl shadow-lg shadow-teal-500/30"
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Calendar className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Tambah Hari Baru
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Buat konfigurasi hari baru untuk sistem absensi
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
                        <Sparkles className="w-5 h-5 text-teal-400/50" />
                    </motion.div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 p-6 md:p-8 space-y-6">
                        {/* Nama Hari Field */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.25 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Calendar className="w-4 h-4 text-teal-500" />
                                Nama Hari
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    {...register('namaHari')}
                                    placeholder="Contoh: Senin, Selasa, Minggu"
                                    className={`${getInputClass('namaHari')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                                />
                            </div>
                            {errors.namaHari && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.namaHari.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Hari Kerja Toggle */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Status Hari
                            </label>
                            <div
                                onClick={handleToggleHariKerja}
                                className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${isHariKerja
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                                    }`}
                            >
                                {isHariKerja ? (
                                    <ToggleRight className="w-8 h-8 text-emerald-500" />
                                ) : (
                                    <ToggleLeft className="w-8 h-8 text-orange-500" />
                                )}
                                <div>
                                    <p className={`font-semibold ${isHariKerja ? 'text-emerald-700 dark:text-emerald-400' : 'text-orange-700 dark:text-orange-400'}`}>
                                        {isHariKerja ? 'Hari Kerja' : 'Hari Libur'}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-500">
                                        {isHariKerja ? 'Karyawan wajib hadir pada hari ini' : 'Karyawan tidak wajib hadir'}
                                    </p>
                                </div>
                            </div>
                            <input type="hidden" {...register('hariKerja')} />
                        </motion.div>

                        {/* Deskripsi Field */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <FileText className="w-4 h-4 text-slate-500" />
                                Deskripsi (Opsional)
                            </label>
                            <div className="relative">
                                <textarea
                                    {...register('deskripsi')}
                                    rows={3}
                                    placeholder="Masukkan deskripsi atau catatan tambahan..."
                                    className={`${getInputClass('deskripsi')} text-slate-700 dark:text-slate-200 placeholder-slate-400 resize-none`}
                                />
                            </div>
                            {errors.deskripsi && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.deskripsi.message}
                                </motion.p>
                            )}
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
                                onClick={() => navigate('/konfigurasi/hari')}
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
                                    : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-teal-500/30'
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
                                        Simpan Hari
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
