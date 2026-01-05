'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    Users, ArrowLeft, Save, CheckCircle2, Loader2, Sparkles,
    AlertCircle, Hash, User, Mail, Phone, MapPin, Calendar, Wallet, UserCheck
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Interfaces
interface BlockchainKtp {
    ktpId: bigint;
    statusMemberId: bigint;
    nik: string;
    nama: string;
    gender: number; // Enum: 0 = LakiLaki, 1 = Perempuan
    tempatLahir: string;
    tanggalLahir: bigint;
    walletAddress: string;
    email: string;
    noHp: string;
    noWa: string;
    verified: boolean;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainStatusMember {
    statusMemberId: bigint;
    namaStatus: string;
    keterangan: string;
    deleted: boolean;
}

// Form data interface
interface MemberFormData {
    walletAddress: string;
    statusMemberId: number;
    nik: string;
    nama: string;
    gender: number;
    tempatLahir: string;
    tanggalLahir: string; // YYYY-MM-DD
    email: string;
    noHp: string;
    noWa: string;
}

// Regex patterns
const PHONE_REGEX = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const NIK_REGEX = /^[0-9]{16}$/;

// Validation Schema
const memberValidationSchema = yup.object({
    walletAddress: yup.string()
        .required('Wallet address wajib diisi'), // Read-only in edit, but required
    statusMemberId: yup.number()
        .required('Status Member wajib dipilih')
        .min(1, 'Status Member wajib dipilih'),
    nik: yup.string()
        .required('NIK wajib diisi')
        .matches(NIK_REGEX, 'NIK harus 16 digit angka'),
    nama: yup.string()
        .required('Nama wajib diisi')
        .min(2, 'Nama minimal 2 karakter')
        .max(100, 'Nama maksimal 100 karakter'),
    gender: yup.number()
        .required('Gender wajib dipilih')
        .oneOf([0, 1], 'Gender tidak valid'),
    tempatLahir: yup.string()
        .required('Tempat lahir wajib diisi')
        .min(2, 'Tempat lahir minimal 2 karakter')
        .max(100, 'Tempat lahir maksimal 100 karakter'),
    tanggalLahir: yup.string()
        .required('Tanggal lahir wajib diisi'),
    email: yup.string()
        .required('Email wajib diisi')
        .matches(EMAIL_REGEX, 'Format email tidak valid'),
    noHp: yup.string()
        .required('No HP wajib diisi')
        .matches(PHONE_REGEX, 'Format nomor HP tidak valid (08xx atau +628xx)'),
    noWa: yup.string()
        .required('No WA wajib diisi')
        .matches(PHONE_REGEX, 'Format nomor WhatsApp tidak valid (08xx atau +628xx)'),
}).required();

export default function MemberEdit() {
    const navigate = useNavigate();
    const { memberId } = useParams<{ memberId: string }>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [formLoaded, setFormLoaded] = useState(false);

    // Fetch KTP Data
    const { data: blockchainKtp, isLoading: isLoadingKtp, error: errorKtp } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getKtpById',
        args: memberId ? [BigInt(memberId)] : undefined,
        query: {
            enabled: !!memberId,
        },
    });

    // Fetch Status Member Data for Dropdown
    const { data: statusResponse, isLoading: isLoadingStatus } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllStatusMember',
        args: [BigInt(0), BigInt(100)],
    });

    // Write Contract Hook
    const { writeContractAsync } = useWriteContract();

    // Process Status List
    const statusList = useMemo(() => {
        if (!statusResponse) return [];
        const [rawStatus] = statusResponse as [BlockchainStatusMember[], bigint];
        return rawStatus
            .filter(status => !status.deleted)
            .map(status => ({
                id: Number(status.statusMemberId),
                name: status.namaStatus
            }));
    }, [statusResponse]);

    // Process Member Data
    const memberData = useMemo(() => {
        if (!blockchainKtp) return null;
        const k = blockchainKtp as BlockchainKtp;
        if (k.deleted || Number(k.ktpId) === 0) return null;
        return k;
    }, [blockchainKtp]);

    const notFound = !isLoadingKtp && !errorKtp && !memberData;

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        setValue,
        watch,
    } = useForm<MemberFormData>({
        resolver: yupResolver(memberValidationSchema) as any,
        mode: 'onChange',
    });

    const gender = watch('gender');

    // Populate Form when data loads
    useEffect(() => {
        if (memberData && !formLoaded) {
            setValue('walletAddress', memberData.walletAddress);
            setValue('statusMemberId', Number(memberData.statusMemberId));
            setValue('nik', memberData.nik);
            setValue('nama', memberData.nama);
            setValue('gender', Number(memberData.gender));
            setValue('tempatLahir', memberData.tempatLahir);

            // Convert timestamp to YYYY-MM-DD
            const date = new Date(Number(memberData.tanggalLahir) * 1000);
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            setValue('tanggalLahir', `${yyyy}-${mm}-${dd}`);

            setValue('email', memberData.email);
            setValue('noHp', memberData.noHp);
            setValue('noWa', memberData.noWa);

            setFormLoaded(true);
        }
    }, [memberData, formLoaded, setValue]);

    const onSubmit = async (data: MemberFormData) => {
        if (!memberData) return;

        setIsSubmitting(true);
        try {
            // Convert date string back to timestamp
            const date = new Date(data.tanggalLahir);
            const timestamp = Math.floor(date.getTime() / 1000);

            await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'updateKtp',
                args: [
                    memberData.walletAddress as `0x${string}`, // Target address (unchanged)
                    BigInt(data.statusMemberId),
                    data.nik,
                    data.nama,
                    data.gender,
                    data.tempatLahir,
                    BigInt(timestamp),
                    data.email,
                    data.noHp,
                    data.noWa
                ],
            });

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate(`/master/member/${memberId}`);
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
    const inputSuccessClass = "border-emerald-400 dark:border-emerald-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20";
    const inputDisabledClass = "bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700";

    const getInputClass = (fieldName: keyof MemberFormData, disabled = false) => {
        if (disabled) return `${inputBaseClass} ${inputDisabledClass}`;
        if (errors[fieldName]) return `${inputBaseClass} ${inputErrorClass}`;
        if (touchedFields[fieldName] && !errors[fieldName]) return `${inputBaseClass} ${inputSuccessClass}`;
        return `${inputBaseClass} ${inputNormalClass}`;
    };

    // Loading State
    if (isLoadingKtp || isLoadingStatus) {
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
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat data Member...</p>
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
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Member Tidak Ditemukan</h2>
                        <p className="text-slate-600 dark:text-slate-400">Data Member dengan ID {memberId} tidak ditemukan.</p>
                        <motion.button
                            onClick={() => navigate('/master/member')}
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
                    onClick={() => navigate(`/master/member/${memberId}`)}
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
                            <Users className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Edit Pegawai
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Perbarui data Pegawai: {memberData?.nama}
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

                        {/* 1. Wallet Address (Read Only) */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Wallet className="w-4 h-4 text-indigo-500" />
                                Wallet Address
                            </label>
                            <input
                                type="text"
                                {...register('walletAddress')}
                                disabled
                                className={`${getInputClass('walletAddress', true)} font-mono opacity-70`}
                            />
                            {/* No error display needed for read-only field */}
                        </motion.div>

                        {/* 2. Status Member */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <UserCheck className="w-4 h-4 text-indigo-500" />
                                Status Member
                            </label>
                            <select
                                {...register('statusMemberId')}
                                className={`${getInputClass('statusMemberId')} text-slate-700 dark:text-slate-200 cursor-pointer`}
                            >
                                <option value={0}>-- Pilih Status Member --</option>
                                {statusList.map((status) => (
                                    <option key={status.id} value={status.id}>
                                        {status.name}
                                    </option>
                                ))}
                            </select>
                            {errors.statusMemberId && (
                                <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.statusMemberId.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* 3. NIK & 4. Nama */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Hash className="w-4 h-4 text-blue-500" />
                                    NIK
                                </label>
                                <input
                                    type="text"
                                    {...register('nik')}
                                    maxLength={16}
                                    placeholder="16 digit NIK"
                                    className={`${getInputClass('nik')} text-slate-700 dark:text-slate-200 font-mono`}
                                />
                                {errors.nik && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.nik.message}
                                    </motion.p>
                                )}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.45 }}
                            >
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <User className="w-4 h-4 text-purple-500" />
                                    Nama Lengkap
                                </label>
                                <input
                                    type="text"
                                    {...register('nama')}
                                    placeholder="Nama Lengkap"
                                    className={`${getInputClass('nama')} text-slate-700 dark:text-slate-200`}
                                />
                                {errors.nama && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.nama.message}
                                    </motion.p>
                                )}
                            </motion.div>
                        </div>

                        {/* 5. Gender */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <User className="w-4 h-4 text-pink-500" />
                                Jenis Kelamin
                            </label>
                            <div className="flex items-center gap-4">
                                <motion.button
                                    type="button"
                                    onClick={() => setValue('gender', 0)}
                                    className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all ${gender === 0
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300'
                                        }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    👨 Pria
                                </motion.button>
                                <motion.button
                                    type="button"
                                    onClick={() => setValue('gender', 1)}
                                    className={`flex-1 px-4 py-3 rounded-xl border-2 font-medium transition-all ${gender === 1
                                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 border-pink-500 text-white shadow-lg shadow-pink-500/30'
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-pink-300'
                                        }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    👩 Wanita
                                </motion.button>
                            </div>
                            {errors.gender && (
                                <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.gender.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* 6. Tempat Lahir & 7. Tanggal Lahir */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.55 }}
                            >
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <MapPin className="w-4 h-4 text-green-500" />
                                    Tempat Lahir
                                </label>
                                <input
                                    type="text"
                                    {...register('tempatLahir')}
                                    placeholder="Kota Kelahiran"
                                    className={`${getInputClass('tempatLahir')} text-slate-700 dark:text-slate-200`}
                                />
                                {errors.tempatLahir && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.tempatLahir.message}
                                    </motion.p>
                                )}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 }}
                            >
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Calendar className="w-4 h-4 text-orange-500" />
                                    Tanggal Lahir
                                </label>
                                <input
                                    type="date"
                                    {...register('tanggalLahir')}
                                    className={`${getInputClass('tanggalLahir')} text-slate-700 dark:text-slate-200`}
                                />
                                {errors.tanggalLahir && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.tanggalLahir.message}
                                    </motion.p>
                                )}
                            </motion.div>
                        </div>

                        {/* 8. Email */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.65 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Mail className="w-4 h-4 text-red-500" />
                                Email
                            </label>
                            <input
                                type="email"
                                {...register('email')}
                                placeholder="contoh@email.com"
                                className={`${getInputClass('email')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                            />
                            {errors.email && (
                                <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.email.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* 9. No HP & 10. No WA */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Phone className="w-4 h-4 text-cyan-500" />
                                    Nomor HP
                                </label>
                                <input
                                    type="text"
                                    {...register('noHp')}
                                    placeholder="081234567890"
                                    className={`${getInputClass('noHp')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                                />
                                {errors.noHp && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.noHp.message}
                                    </motion.p>
                                )}
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.75 }}
                            >
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Phone className="w-4 h-4 text-green-600" />
                                    Nomor WhatsApp
                                </label>
                                <input
                                    type="text"
                                    {...register('noWa')}
                                    placeholder="081234567890"
                                    className={`${getInputClass('noWa')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                                />
                                {errors.noWa && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.noWa.message}
                                    </motion.p>
                                )}
                            </motion.div>
                        </div>

                        {/* Form Actions */}
                        <motion.div
                            className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                        >
                            <motion.button
                                type="submit"
                                disabled={isSubmitting || submitSuccess}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-2xl transition-all shadow-lg ${submitSuccess
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30'
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

                {/* Information Box */}
                <motion.div
                    className="mt-6 p-4 bg-indigo-50/80 dark:bg-indigo-900/20 backdrop-blur-sm rounded-2xl border border-indigo-200/50 dark:border-indigo-500/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.85 }}
                >
                    <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
                        💡 Informasi
                    </h3>
                    <ul className="text-sm text-indigo-600 dark:text-indigo-400 space-y-1">
                        <li>• Wallet address tidak dapat diubah karena merupakan identitas unik</li>
                        <li>• NIK harus 16 digit sesuai KTP</li>
                        <li>• Nomor HP/WA format Indonesia (08xx atau +628xx)</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
