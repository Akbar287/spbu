'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
    ArrowLeft, Save, X, Users, CheckCircle2,
    Loader2, AlertCircle, Hash, User, Mail, Phone,
    MapPin, Calendar, Wallet, UserCheck
} from 'lucide-react';
import { DIAMOND_ABI, DIAMOND_ADDRESS } from '@/contracts/config';
import { useReadContract, useWriteContract } from 'wagmi';

// Interfaces
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
    tanggalLahir: string;
    email: string;
    noHp: string;
    noWa: string;
}

// Regex patterns
const PHONE_REGEX = /^(\+62|62|0)8[1-9][0-9]{6,10}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const WALLET_REGEX = /^0x[a-fA-F0-9]{40}$/;
const NIK_REGEX = /^[0-9]{16}$/;

// Validation Schema
const memberValidationSchema = yup.object({
    walletAddress: yup.string()
        .required('Wallet address wajib diisi')
        .matches(WALLET_REGEX, 'Format wallet address tidak valid (0x...)'),
    statusMemberId: yup.number()
        .required('Status member wajib dipilih')
        .min(1, 'Status member wajib dipilih'),
    nik: yup.string()
        .required('NIK wajib diisi')
        .matches(NIK_REGEX, 'NIK harus 16 digit angka'),
    nama: yup.string()
        .required('Nama lengkap wajib diisi')
        .min(2, 'Nama minimal 2 karakter')
        .max(100, 'Nama maksimal 100 karakter'),
    gender: yup.number()
        .required('Jenis kelamin wajib dipilih')
        .oneOf([0, 1], 'Pilih jenis kelamin'),
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
        .required('Nomor HP wajib diisi')
        .matches(PHONE_REGEX, 'Format nomor HP tidak valid (08xx atau +628xx)'),
    noWa: yup.string()
        .required('Nomor WhatsApp wajib diisi')
        .matches(PHONE_REGEX, 'Format nomor WhatsApp tidak valid (08xx atau +628xx)'),
}).required();

export default function MemberCreate() {
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Fetch Status Member data for dropdown
    const { data: statusMemberResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllStatusMember',
        args: [BigInt(0), BigInt(100)],
    });

    const statusMemberList = useMemo(() => {
        if (!statusMemberResponse) return [];
        const [rawStatusMember] = statusMemberResponse as [BlockchainStatusMember[], bigint];
        return rawStatusMember
            .filter(status => !status.deleted)
            .map(status => ({
                id: Number(status.statusMemberId),
                name: status.namaStatus,
                keterangan: status.keterangan
            }));
    }, [statusMemberResponse]);

    const {
        register,
        handleSubmit,
        formState: { errors, touchedFields },
        reset,
        watch,
        setValue,
    } = useForm<MemberFormData>({
        resolver: yupResolver(memberValidationSchema) as any,
        mode: 'onChange',
        defaultValues: {
            walletAddress: '',
            statusMemberId: 0,
            nik: '',
            nama: '',
            gender: 0,
            tempatLahir: '',
            tanggalLahir: '',
            email: '',
            noHp: '',
            noWa: '',
        },
    });

    const gender = watch('gender');

    const { writeContractAsync } = useWriteContract();

    const onSubmit = async (data: MemberFormData) => {
        setIsSubmitting(true);
        try {
            // Convert date string to Unix timestamp
            const tanggalLahirTimestamp = Math.floor(new Date(data.tanggalLahir).getTime() / 1000);

            await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'createKtp',
                args: [
                    data.walletAddress as `0x${string}`,
                    BigInt(data.statusMemberId),
                    data.nik,
                    data.nama,
                    data.gender, // 0 = Pria, 1 = Wanita
                    data.tempatLahir,
                    BigInt(tanggalLahirTimestamp),
                    data.email,
                    data.noHp,
                    data.noWa,
                ],
            });

            setSubmitSuccess(true);
            setTimeout(() => {
                navigate('/master/member');
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

    const getInputClass = (fieldName: keyof MemberFormData) => {
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
                    animate={{
                        x: [0, 100, 0],
                        y: [0, 50, 0],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-blue-400/15 to-cyan-400/15 dark:from-blue-500/20 dark:to-cyan-500/20 blur-3xl"
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
                    onClick={() => navigate('/master/member')}
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
                                Tambah Member Baru
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1">
                                Registrasi data identitas member baru
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
                        {/* Wallet Address */}
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
                                placeholder="0x..."
                                className={`${getInputClass('walletAddress')} text-slate-700 dark:text-slate-200 placeholder-slate-400 font-mono`}
                            />
                            {errors.walletAddress && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.walletAddress.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Status Member Selection */}
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
                                {statusMemberList.map((status) => (
                                    <option key={status.id} value={status.id}>
                                        {status.name}
                                    </option>
                                ))}
                            </select>
                            {errors.statusMemberId && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.statusMemberId.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* NIK & Nama */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div>
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
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <User className="w-4 h-4 text-purple-500" />
                                    Nama Lengkap
                                </label>
                                <input
                                    type="text"
                                    {...register('nama')}
                                    placeholder="Nama sesuai KTP"
                                    className={`${getInputClass('nama')} text-slate-700 dark:text-slate-200`}
                                />
                                {errors.nama && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.nama.message}
                                    </motion.p>
                                )}
                            </div>
                        </motion.div>

                        {/* Gender Selection */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.45 }}
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
                        </motion.div>

                        {/* Tempat & Tanggal Lahir */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <MapPin className="w-4 h-4 text-green-500" />
                                    Tempat Lahir
                                </label>
                                <input
                                    type="text"
                                    {...register('tempatLahir')}
                                    placeholder="Kota tempat lahir"
                                    className={`${getInputClass('tempatLahir')} text-slate-700 dark:text-slate-200`}
                                />
                                {errors.tempatLahir && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.tempatLahir.message}
                                    </motion.p>
                                )}
                            </div>
                            <div>
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
                            </div>
                        </motion.div>

                        {/* Email */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.55 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Mail className="w-4 h-4 text-red-500" />
                                Email
                            </label>
                            <input
                                type="email"
                                {...register('email')}
                                placeholder="email@domain.com"
                                className={`${getInputClass('email')} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                            />
                            {errors.email && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.email.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* No HP & No WA */}
                        <motion.div
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.6 }}
                        >
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Phone className="w-4 h-4 text-cyan-500" />
                                    Nomor HP
                                </label>
                                <input
                                    type="text"
                                    {...register('noHp')}
                                    placeholder="08xxxxxxxxxx"
                                    className={`${getInputClass('noHp')} text-slate-700 dark:text-slate-200`}
                                />
                                {errors.noHp && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.noHp.message}
                                    </motion.p>
                                )}
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    <Phone className="w-4 h-4 text-green-500" />
                                    Nomor WhatsApp
                                </label>
                                <input
                                    type="text"
                                    {...register('noWa')}
                                    placeholder="08xxxxxxxxxx"
                                    className={`${getInputClass('noWa')} text-slate-700 dark:text-slate-200`}
                                />
                                {errors.noWa && (
                                    <motion.p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                                        <AlertCircle className="w-4 h-4" />
                                        {errors.noWa.message}
                                    </motion.p>
                                )}
                            </div>
                        </motion.div>

                        {/* Form Actions */}
                        <motion.div
                            className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200/50 dark:border-slate-700/50"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.65 }}
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
                                        Simpan Member
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
                    className="mt-6 p-4 bg-indigo-50/80 dark:bg-indigo-900/20 backdrop-blur-sm rounded-2xl border border-indigo-200/50 dark:border-indigo-500/30"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                >
                    <h3 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 mb-2">
                        💡 Informasi
                    </h3>
                    <ul className="text-sm text-indigo-600 dark:text-indigo-400 space-y-1">
                        <li>• Wallet address harus format Ethereum (dimulai dengan 0x)</li>
                        <li>• NIK harus 16 digit sesuai KTP</li>
                        <li>• Nomor HP/WA format Indonesia (08xx atau +628xx)</li>
                        <li>• Member baru akan berstatus belum terverifikasi</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
}
