'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
    Wallet, ArrowLeft, Save, Loader2,
    Building, CreditCard, User, Banknote, Hash, AlertCircle
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { waitForTransactionReceipt } from 'viem/actions';
import { useConfig } from 'wagmi';
import { pembayaranSchema, PembayaranValues } from '@/validation/pembayaran.validation';

// Interface
interface BlockchainPembayaran {
    pembayaranId: bigint;
    rencanaPembelianId: bigint;
    walletMember: string;
    noCekBg: string;
    noRekening: string;
    namaRekening: string;
    namaBank: string;
    totalBayar: bigint;
    konfirmasiAdmin: boolean;
    konfirmasiDirektur: boolean;
    deleted: boolean;
}

export default function PembayaranBayarEdit() {
    const navigate = useNavigate();
    const { rencanaId, pembayaranId } = useParams<{ rencanaId: string, pembayaranId: string }>();
    const planId = rencanaId ? parseInt(rencanaId, 10) : 0;
    const payId = pembayaranId ? parseInt(pembayaranId, 10) : 0;
    const isValid = planId > 0 && payId > 0;
    const config = useConfig();

    // React Hook Form
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting }
    } = useForm<PembayaranValues>({
        resolver: yupResolver(pembayaranSchema),
        defaultValues: {
            namaBank: '',
            noRekening: '',
            namaRekening: '',
            noCekBg: '',
            totalBayar: undefined
        }
    });

    // Fetch Payment Data
    const { data: pembayaranData, isLoading } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getPembayaranById',
        args: [BigInt(payId)],
        query: { enabled: isValid }
    });

    const pembayaran = pembayaranData as BlockchainPembayaran | undefined;

    useEffect(() => {
        if (pembayaran) {
            reset({
                namaBank: pembayaran.namaBank,
                noRekening: pembayaran.noRekening,
                namaRekening: pembayaran.namaRekening,
                noCekBg: pembayaran.noCekBg,
                totalBayar: Number(pembayaran.totalBayar) / 100 // Scale back
            });
        }
    }, [pembayaran, reset]);

    // Handle Submit
    const { writeContractAsync } = useWriteContract();

    const onSubmit = async (data: PembayaranValues) => {
        const nominal = Number(data.totalBayar);

        try {
            const hash = await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'updatePembayaran',
                args: [
                    BigInt(payId),
                    data.noCekBg || '',
                    data.noRekening,
                    data.namaRekening,
                    data.namaBank,
                    BigInt(nominal * 100) // Scale x100
                ]
            });

            await waitForTransactionReceipt(config.getClient(), { hash });
            navigate('/procurement/pembayaran/' + rencanaId + '/bayar');
        } catch (error) {
            console.error('Update failed:', error);
            alert('Gagal mengupdate pembayaran');
        }
    };

    if (isLoading) return (
        <div className="flex justify-center items-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        </div>
    );

    if (!isValid || !pembayaran || pembayaran.deleted || Number(pembayaran.pembayaranId) === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Data Tidak Ditemukan</h2>
                <button
                    onClick={() => navigate('/procurement/pembayaran/' + rencanaId + '/bayar')}
                    className="mt-4 text-emerald-600 hover:underline"
                >
                    Kembali
                </button>
            </div>
        );
    }

    if (pembayaran.konfirmasiAdmin) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Akses Ditolak</h2>
                <p className="text-slate-500 mt-2">Data yang sudah dikonfirmasi admin tidak dapat diubah.</p>
                <button
                    onClick={() => navigate('/procurement/pembayaran/' + rencanaId + '/bayar')}
                    className="mt-4 text-emerald-600 hover:underline"
                >
                    Kembali
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-50 dark:bg-slate-900">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-bl from-emerald-100/50 to-transparent dark:from-emerald-900/20 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-teal-100/50 to-transparent dark:from-teal-900/20 blur-3xl" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                <motion.button
                    onClick={() => navigate('/procurement/pembayaran/' + rencanaId + '/bayar')}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </motion.button>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700"
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white">
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            <Edit3 className="w-6 h-6" />
                            Edit Pembayaran #{payId}
                        </h1>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-6">
                        {/* Bank Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Building className="w-4 h-4 text-emerald-500" />
                                    Nama Bank
                                </label>
                                <input
                                    type="text"
                                    {...register('namaBank')}
                                    className={`w-full px-4 py-2.5 rounded-xl border ${errors.namaBank ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all`}
                                />
                                {errors.namaBank && <p className="text-xs text-red-500">{errors.namaBank.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-emerald-500" />
                                    No. Rekening
                                </label>
                                <input
                                    type="text"
                                    {...register('noRekening')}
                                    className={`w-full px-4 py-2.5 rounded-xl border ${errors.noRekening ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all`}
                                />
                                {errors.noRekening && <p className="text-xs text-red-500">{errors.noRekening.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                <User className="w-4 h-4 text-emerald-500" />
                                Nama Pemilik Rekening
                            </label>
                            <input
                                type="text"
                                {...register('namaRekening')}
                                className={`w-full px-4 py-2.5 rounded-xl border ${errors.namaRekening ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all`}
                            />
                            {errors.namaRekening && <p className="text-xs text-red-500">{errors.namaRekening.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Hash className="w-4 h-4 text-emerald-500" />
                                    No. Cek/BG/Ref
                                </label>
                                <input
                                    type="text"
                                    {...register('noCekBg')}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                    <Banknote className="w-4 h-4 text-emerald-500" />
                                    Nominal Bayar
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                                    <input
                                        type="number"
                                        min="1"
                                        {...register('totalBayar')}
                                        className={`w-full pl-12 pr-4 py-2.5 rounded-xl border ${errors.totalBayar ? 'border-red-500' : 'border-slate-300 dark:border-slate-600'} bg-white dark:bg-slate-700 focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono`}
                                    />
                                </div>
                                {errors.totalBayar && <p className="text-xs text-red-500">{errors.totalBayar.message}</p>}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Menyimpan...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Update Pembayaran
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}

function Edit3({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>
    )
}
