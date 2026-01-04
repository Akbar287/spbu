'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
    Fuel, ArrowLeft, Save, X, Building2, Hash, Calendar,
    MapPin, Ruler, AlertCircle, CheckCircle2, Loader2, Sparkles
} from 'lucide-react';
import { spbuValidationSchema, SpbuFormData } from '@/validation/spbu.validation';
import { DIAMOND_ABI, DIAMOND_ADDRESS } from '@/contracts/config';
import { simulateContract, writeContract } from '@wagmi/core'
import { config } from '@/config/wagmi';

export default function SpbuCreate() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        reset,
    } = useForm<SpbuFormData>({
        resolver: yupResolver(spbuValidationSchema),
        mode: 'onChange',
        defaultValues: {
            namaSpbu: '',
            nomorSpbu: '',
            alamat: '',
            luasLahan: undefined,
            satuanLuas: 'm²',
        },
    });

    const onSubmit = async (data: SpbuFormData) => {
        setIsSubmitting(true);
        try {
            const dateValue = data.tanggalPendirian instanceof Date
                ? data.tanggalPendirian
                : new Date(data.tanggalPendirian as unknown as string);
            const timestamp = BigInt(Math.floor(dateValue.getTime() / 1000));

            const { request } = await simulateContract(config, {
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'createSpbu',
                args: [
                    data.namaSpbu,
                    data.nomorSpbu,
                    timestamp,
                    data.alamat,
                    BigInt(data.luasLahan),
                    data.satuanLuas,
                ],
            });

            await writeContract(config, request);
            setSubmitSuccess(true);
            setTimeout(() => {
                navigate('/konfigurasi/spbu');
            }, 1500);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputBaseClass = "w-full px-4 py-3 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border transition-all duration-200 outline-none";
    const inputNormalClass = "border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20";
    const inputErrorClass = "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";
    const inputSuccessClass = "border-emerald-400 dark:border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

    const getInputClass = (fieldName: keyof SpbuFormData) => {
        if (errors[fieldName]) return `${inputBaseClass} ${inputErrorClass}`;
        if (touchedFields[fieldName] && !errors[fieldName]) return `${inputBaseClass} ${inputSuccessClass}`;
        return `${inputBaseClass} ${inputNormalClass}`;
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background like HeroSection */}
            <div className="absolute inset-0 bg-purple-100/80 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-violet-400/20 to-indigo-400/20 dark:from-violet-600/30 dark:to-indigo-600/30 blur-3xl"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-cyan-400/15 to-emerald-400/15 dark:from-cyan-500/20 dark:to-emerald-500/20 blur-3xl"
                    animate={{
                        x: [0, -80, 0],
                        y: [0, -60, 0],
                        scale: [1.2, 1, 1.2],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-pink-400/15 to-rose-400/15 dark:from-pink-500/20 dark:to-rose-500/20 blur-3xl"
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/konfigurasi/spbu')}
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
                            className="p-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg shadow-violet-500/30"
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Fuel className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Tambah SPBU Baru
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Isi data SPBU dengan lengkap dan benar
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
                    {/* Glassmorphism Background - subtle */}
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    {/* Animated Sparkles */}
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute pointer-events-none"
                            style={{
                                top: `${15 + (i * 18)}%`,
                                left: `${10 + (i * 20)}%`,
                            }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                                opacity: [0, 1, 1, 0],
                                scale: [0, 1, 1, 0],
                                rotate: [0, 180],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: i * 0.8,
                                ease: 'easeInOut',
                            }}
                        >
                            <Sparkles className="w-4 h-4 text-violet-400/60 dark:text-violet-300/40" />
                        </motion.div>
                    ))}

                    {/* Additional random sparkles */}
                    <motion.div
                        className="absolute top-[25%] right-[15%] pointer-events-none"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0, 0.8, 0.8, 0],
                            scale: [0, 1.2, 1.2, 0],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Infinity,
                            delay: 1.5,
                            ease: 'easeInOut',
                        }}
                    >
                        <Sparkles className="w-5 h-5 text-pink-400/50 dark:text-pink-300/30" />
                    </motion.div>
                    <motion.div
                        className="absolute bottom-[30%] right-[25%] pointer-events-none"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{
                            opacity: [0, 0.7, 0.7, 0],
                            scale: [0, 1, 1, 0],
                        }}
                        transition={{
                            duration: 3.5,
                            repeat: Infinity,
                            delay: 2.5,
                            ease: 'easeInOut',
                        }}
                    >
                        <Sparkles className="w-3 h-3 text-cyan-400/50 dark:text-cyan-300/30" />
                    </motion.div>

                    {/* Form Content */}
                    <form onSubmit={handleSubmit(onSubmit)} className="relative z-10 p-6 md:p-8 space-y-6">
                        {/* Nama SPBU */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Building2 className="w-4 h-4 text-violet-500" />
                                Nama SPBU
                            </label>
                            <input
                                type="text"
                                {...register('namaSpbu')}
                                placeholder="Contoh: SPBU Pertamina 44.501.18"
                                className={`${getInputClass('namaSpbu')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                            />
                            {errors.namaSpbu && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.namaSpbu.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Nomor SPBU */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Hash className="w-4 h-4 text-violet-500" />
                                Nomor SPBU
                            </label>
                            <input
                                type="text"
                                {...register('nomorSpbu')}
                                placeholder="Contoh: 44.501.18"
                                className={`${getInputClass('nomorSpbu')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                            />
                            {errors.nomorSpbu && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.nomorSpbu.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Tanggal Pendirian */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Calendar className="w-4 h-4 text-violet-500" />
                                Tanggal Pendirian
                            </label>
                            <input
                                type="date"
                                {...register('tanggalPendirian')}
                                className={`${getInputClass('tanggalPendirian')} text-slate-700 dark:text-slate-200`}
                            />
                            {errors.tanggalPendirian && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.tanggalPendirian.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Alamat */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.45 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <MapPin className="w-4 h-4 text-violet-500" />
                                Alamat
                            </label>
                            <textarea
                                {...register('alamat')}
                                rows={3}
                                placeholder="Masukkan alamat lengkap SPBU..."
                                className={`${getInputClass('alamat')} text-slate-700 dark:text-slate-200 placeholder-slate-400 resize-none`}
                            />
                            {errors.alamat && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.alamat.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Luas Lahan & Satuan */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Ruler className="w-4 h-4 text-violet-500" />
                                    Luas Lahan
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    {...register('luasLahan')}
                                    placeholder="Contoh: 2500"
                                    className={`${getInputClass('luasLahan')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                                />
                                {errors.luasLahan && (
                                    <motion.p
                                        className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.luasLahan.message}
                                    </motion.p>
                                )}
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Satuan
                                </label>
                                <select
                                    {...register('satuanLuas')}
                                    className={`${getInputClass('satuanLuas')} text-slate-700 dark:text-slate-200 cursor-pointer`}
                                >
                                    <option value="m²">Meter Persegi (m²)</option>
                                    <option value="ha">Hektar (ha)</option>
                                    <option value="are">Are</option>
                                </select>
                                {errors.satuanLuas && (
                                    <motion.p
                                        className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.satuanLuas.message}
                                    </motion.p>
                                )}
                            </div>
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
                                    : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-violet-500/30'
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
                                        Simpan SPBU
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
                    className="mt-6 p-4 bg-violet-50/80 dark:bg-violet-900/20 backdrop-blur-sm rounded-2xl border border-violet-200/50 dark:border-violet-500/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                >
                    <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-300 mb-2">
                        💡 Tips Pengisian
                    </h3>
                    <ul className="text-sm text-violet-600 dark:text-violet-400 space-y-1">
                        <li>• Pastikan nomor SPBU sesuai dengan format resmi Pertamina</li>
                        <li>• Alamat harus lengkap termasuk kelurahan, kecamatan, dan kota</li>
                        <li>• Luas lahan diisi sesuai sertifikat</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
