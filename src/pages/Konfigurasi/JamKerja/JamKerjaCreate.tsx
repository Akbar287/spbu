'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    ArrowLeft, Save, X, Clock, CheckCircle2,
    Loader2, Building2, AlertCircle, Timer, Coffee, ArrowUpDown, Calendar, Check
} from 'lucide-react';
import { DIAMOND_ABI, DIAMOND_ADDRESS } from '@/contracts/config';
import { useReadContract, useWriteContract } from 'wagmi';

// Interfaces
interface BlockchainSpbu {
    spbuId: bigint;
    namaSpbu: string;
    deleted: boolean;
}

interface BlockchainHari {
    hariId: bigint;
    namaHari: string;
    hariKerja: boolean;
    deleted: boolean;
}

// Form data interface
interface JamKerjaFormData {
    spbuId: number;
    namaJamKerja: string;
    jamDatang: string;
    jamPulang: string;
    jamMulaiIstirahat: string;
    jamSelesaiIstirahat: string;
    urutan: number;
}

// Validation Schema
const jamKerjaValidationSchema = yup.object({
    spbuId: yup.number()
        .required('SPBU wajib dipilih')
        .min(1, 'SPBU wajib dipilih'),
    namaJamKerja: yup.string()
        .required('Nama jam kerja wajib diisi')
        .min(2, 'Nama jam kerja minimal 2 karakter')
        .max(50, 'Nama jam kerja maksimal 50 karakter'),
    jamDatang: yup.string()
        .required('Jam datang wajib diisi')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam tidak valid (HH:MM)'),
    jamPulang: yup.string()
        .required('Jam pulang wajib diisi')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam tidak valid (HH:MM)'),
    jamMulaiIstirahat: yup.string()
        .required('Jam mulai istirahat wajib diisi')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam tidak valid (HH:MM)'),
    jamSelesaiIstirahat: yup.string()
        .required('Jam selesai istirahat wajib diisi')
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format jam tidak valid (HH:MM)'),
    urutan: yup.number()
        .required('Urutan wajib diisi')
        .min(1, 'Urutan minimal 1'),
}).required();

// Helper: Convert HH:MM to minutes from midnight
const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
};

export default function JamKerjaCreate() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [selectedHariIds, setSelectedHariIds] = useState<number[]>([]);

    // Fetch SPBU data for dropdown
    const { data: spbuResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllSpbu',
        args: [BigInt(0), BigInt(100)],
    });

    // Fetch Hari data for multi-select
    const { data: hariResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllHari',
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

    const hariList = useMemo(() => {
        if (!hariResponse) return [];
        const [rawHari] = hariResponse as [BlockchainHari[], bigint];
        return rawHari
            .filter(hari => !hari.deleted)
            .map(hari => ({
                id: Number(hari.hariId),
                name: hari.namaHari,
                isWorkDay: hari.hariKerja
            }));
    }, [hariResponse]);

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        reset,
    } = useForm<JamKerjaFormData>({
        resolver: yupResolver(jamKerjaValidationSchema),
        mode: 'onChange',
        defaultValues: {
            spbuId: 0,
            namaJamKerja: '',
            jamDatang: '08:00',
            jamPulang: '17:00',
            jamMulaiIstirahat: '12:00',
            jamSelesaiIstirahat: '13:00',
            urutan: 1,
        },
    });

    const { writeContractAsync } = useWriteContract();

    const toggleHari = (hariId: number) => {
        setSelectedHariIds(prev =>
            prev.includes(hariId)
                ? prev.filter(id => id !== hariId)
                : [...prev, hariId]
        );
    };

    const selectAllWorkDays = () => {
        const workDayIds = hariList.filter(h => h.isWorkDay).map(h => h.id);
        setSelectedHariIds(workDayIds);
    };

    const clearAllHari = () => {
        setSelectedHariIds([]);
    };

    const onSubmit = async (data: JamKerjaFormData) => {
        if (selectedHariIds.length === 0) {
            alert('Pilih minimal satu hari kerja!');
            return;
        }

        setIsSubmitting(true);
        try {
            await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'createJamKerja',
                args: [
                    BigInt(data.spbuId),
                    data.namaJamKerja,
                    BigInt(timeToMinutes(data.jamDatang)),
                    BigInt(timeToMinutes(data.jamPulang)),
                    BigInt(timeToMinutes(data.jamMulaiIstirahat)),
                    BigInt(timeToMinutes(data.jamSelesaiIstirahat)),
                    BigInt(data.urutan),
                    selectedHariIds.map(id => BigInt(id)), // hariIds array
                ],
            });

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate('/konfigurasi/jam-kerja');
            }, 1500);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputBaseClass = "w-full px-4 py-3 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border transition-all duration-200 outline-none";
    const inputNormalClass = "border-slate-200 dark:border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20";
    const inputErrorClass = "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";
    const inputSuccessClass = "border-emerald-400 dark:border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";

    const getInputClass = (fieldName: keyof JamKerjaFormData) => {
        if (errors[fieldName]) return `${inputBaseClass} ${inputErrorClass}`;
        if (touchedFields[fieldName] && !errors[fieldName]) return `${inputBaseClass} ${inputSuccessClass}`;
        return `${inputBaseClass} ${inputNormalClass}`;
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-orange-50 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-orange-400/20 to-amber-400/20 dark:from-orange-600/30 dark:to-amber-600/30 blur-3xl"
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-yellow-400/15 to-lime-400/15 dark:from-yellow-500/20 dark:to-lime-500/20 blur-3xl"
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
                    onClick={() => navigate('/konfigurasi/jam-kerja')}
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
                            className="p-4 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl shadow-lg shadow-orange-500/30"
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Clock className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Tambah Jam Kerja Baru
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Tambahkan jadwal jam kerja baru untuk SPBU
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
                                <Building2 className="w-4 h-4 text-orange-500" />
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

                        {/* Nama Jam Kerja */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Clock className="w-4 h-4 text-orange-500" />
                                Nama Jam Kerja
                            </label>
                            <input
                                type="text"
                                {...register('namaJamKerja')}
                                placeholder="Contoh: Shift Pagi, Shift Siang, Shift Malam"
                                className={`${getInputClass('namaJamKerja')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                            />
                            {errors.namaJamKerja && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.namaJamKerja.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Jam Datang & Pulang */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Timer className="w-4 h-4 text-emerald-500" />
                                    Jam Datang
                                </label>
                                <input
                                    type="time"
                                    {...register('jamDatang')}
                                    className={`${getInputClass('jamDatang')} text-slate-700 dark:text-slate-200`}
                                />
                                {errors.jamDatang && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.jamDatang.message}
                                    </motion.p>
                                )}
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Timer className="w-4 h-4 text-red-500" />
                                    Jam Pulang
                                </label>
                                <input
                                    type="time"
                                    {...register('jamPulang')}
                                    className={`${getInputClass('jamPulang')} text-slate-700 dark:text-slate-200`}
                                />
                                {errors.jamPulang && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.jamPulang.message}
                                    </motion.p>
                                )}
                            </div>
                        </motion.div>

                        {/* Jam Istirahat */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.45 }}
                        >
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Coffee className="w-4 h-4 text-blue-500" />
                                    Mulai Istirahat
                                </label>
                                <input
                                    type="time"
                                    {...register('jamMulaiIstirahat')}
                                    className={`${getInputClass('jamMulaiIstirahat')} text-slate-700 dark:text-slate-200`}
                                />
                                {errors.jamMulaiIstirahat && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.jamMulaiIstirahat.message}
                                    </motion.p>
                                )}
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Coffee className="w-4 h-4 text-purple-500" />
                                    Selesai Istirahat
                                </label>
                                <input
                                    type="time"
                                    {...register('jamSelesaiIstirahat')}
                                    className={`${getInputClass('jamSelesaiIstirahat')} text-slate-700 dark:text-slate-200`}
                                />
                                {errors.jamSelesaiIstirahat && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.jamSelesaiIstirahat.message}
                                    </motion.p>
                                )}
                            </div>
                        </motion.div>

                        {/* Urutan */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <ArrowUpDown className="w-4 h-4 text-amber-500" />
                                Urutan Shift
                            </label>
                            <input
                                type="number"
                                {...register('urutan')}
                                min={1}
                                placeholder="1"
                                className={`${getInputClass('urutan')} text-slate-700 dark:text-slate-200`}
                            />
                            {errors.urutan && (
                                <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.urutan.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Pilih Hari (Multi-select) */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.55 }}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                                    <Calendar className="w-4 h-4 text-teal-500" />
                                    Pilih Hari Kerja
                                </label>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={selectAllWorkDays}
                                        className="text-xs px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-lg hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-colors"
                                    >
                                        Semua Hari Kerja
                                    </button>
                                    <button
                                        type="button"
                                        onClick={clearAllHari}
                                        className="text-xs px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                    >
                                        Hapus Semua
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {hariList.map((hari) => (
                                    <motion.button
                                        key={hari.id}
                                        type="button"
                                        onClick={() => toggleHari(hari.id)}
                                        className={`relative px-4 py-3 rounded-xl border-2 transition-all ${selectedHariIds.includes(hari.id)
                                                ? 'bg-gradient-to-r from-orange-500 to-amber-500 border-orange-500 text-white shadow-lg shadow-orange-500/30'
                                                : hari.isWorkDay
                                                    ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-orange-300 dark:hover:border-orange-600'
                                                    : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:border-orange-300 dark:hover:border-orange-600'
                                            }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <span className="font-medium">{hari.name}</span>
                                        {selectedHariIds.includes(hari.id) && (
                                            <motion.div
                                                className="absolute top-1 right-1"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                            >
                                                <Check className="w-4 h-4" />
                                            </motion.div>
                                        )}
                                        {!hari.isWorkDay && !selectedHariIds.includes(hari.id) && (
                                            <span className="block text-xs text-slate-400 dark:text-slate-500 mt-0.5">Libur</span>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                            {selectedHariIds.length === 0 && (
                                <p className="mt-2 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    Pilih minimal satu hari
                                </p>
                            )}
                            {selectedHariIds.length > 0 && (
                                <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                                    {selectedHariIds.length} hari dipilih
                                </p>
                            )}
                        </motion.div>

                        {/* Form Actions */}
                        <motion.div
                            className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <motion.button
                                type="submit"
                                disabled={isSubmitting || submitSuccess || selectedHariIds.length === 0}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-2xl transition-all shadow-lg ${submitSuccess
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30'
                                    : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-orange-500/30'
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
                                        Simpan Jam Kerja
                                    </>
                                )}
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={() => {
                                    reset();
                                    setSelectedHariIds([]);
                                }}
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
                    className="mt-6 p-4 bg-orange-50/80 dark:bg-orange-900/20 backdrop-blur-sm rounded-2xl border border-orange-200/50 dark:border-orange-500/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.65 }}
                >
                    <h3 className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-2">
                        💡 Informasi
                    </h3>
                    <ul className="text-sm text-orange-600 dark:text-orange-400 space-y-1">
                        <li>• Pilih SPBU tempat jam kerja ini akan diterapkan</li>
                        <li>• Anda bisa memilih lebih dari satu hari untuk satu jadwal jam kerja</li>
                        <li>• Urutan shift menentukan prioritas tampilan (1 = paling atas)</li>
                        <li>• Waktu disimpan dalam format menit dari tengah malam</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
