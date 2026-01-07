'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
    Wallet, ArrowLeft, Save, Loader2,
    Building, CreditCard, User, Banknote, Hash
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { waitForTransactionReceipt } from 'viem/actions';
import { useConfig } from 'wagmi';
import { pembayaranSchema, PembayaranValues } from '@/validation/pembayaran.validation';

interface BlockchainPembayaran {
    pembayaranId: bigint;
    totalBayar: bigint;
    konfirmasiAdmin: boolean;
    konfirmasiDirektur: boolean;
    deleted: boolean;
}

interface BlockchainRencanaPembelian {
    rencanaPembelianId: bigint;
    kodePembelian: string;
    grandTotal: bigint;
}

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

export default function PembayaranBayarCreate() {
    const navigate = useNavigate();
    const { rencanaId } = useParams<{ rencanaId: string }>();
    const rencanaPembelianId = rencanaId ? parseInt(rencanaId, 10) : 0;
    const isValidId = !isNaN(rencanaPembelianId) && rencanaPembelianId > 0;
    const config = useConfig();

    // React Hook Form
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch
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

    // Fetch Data for Validation
    const { data: rencanaData } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getRencanaPembelianById',
        args: [BigInt(rencanaPembelianId)],
        query: { enabled: isValidId }
    });

    // Fetch Rincian to get Gross Price (includes taxes) - same approach as other pages
    const { data: rincianResponse } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getRincianPembelianDetails',
        args: [BigInt(rencanaPembelianId)],
        query: { enabled: isValidId }
    });

    const { data: pembayaranData } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllPembayaran',
        args: [BigInt(0), BigInt(1000), BigInt(rencanaPembelianId)],
        query: { enabled: isValidId }
    });

    const rencanaPembelian = rencanaData as BlockchainRencanaPembelian | undefined;

    // Extract grossPrice from rincian data (same as other pages)
    const grossTotal = useMemo(() => {
        if (!rincianResponse) return 0;
        const rincianList = rincianResponse as Array<{ gross: bigint }>;
        if (!rincianList || rincianList.length === 0) return 0;
        // Get gross from first item (all items have same total tax info)
        return Number(rincianList[0].gross);
    }, [rincianResponse]);

    // Calculate Sisa Tagihan - Using grossTotal and only approved payments
    const sisaTagihan = useMemo(() => {
        if (!pembayaranData || !grossTotal) return grossTotal;

        // Sum only approved payments (konfirmasiAdmin AND konfirmasiDirektur)
        const totalSudahBayar = (pembayaranData as BlockchainPembayaran[]).reduce((acc, curr) => {
            if (!curr.deleted && curr.konfirmasiAdmin && curr.konfirmasiDirektur) {
                return acc + Number(curr.totalBayar);
            }
            return acc;
        }, 0);

        return Math.max(0, grossTotal - totalSudahBayar);
    }, [grossTotal, pembayaranData]);

    // Handle Submit
    const { writeContractAsync } = useWriteContract();

    const onSubmit = async (data: PembayaranValues) => {
        const nominal = Number(data.totalBayar);

        if (nominal > sisaTagihan) {
            if (!window.confirm(`Nominal pembayaran (${formatCurrency(nominal / 100)}) melebihi sisa tagihan (${formatCurrency(sisaTagihan / 100)}). Lanjutkan?`)) {
                return;
            }
        }

        try {
            const hash = await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'createPembayaran',
                args: [
                    BigInt(rencanaPembelianId),
                    data.noCekBg || '',
                    data.noRekening,
                    data.namaRekening,
                    data.namaBank,
                    BigInt(nominal * 100) // Scale x100 for precision
                ]
            });

            await waitForTransactionReceipt(config.getClient(), { hash });
            navigate('/procurement/pembayaran/' + rencanaId + '/bayar');
        } catch (error) {
            console.error('Submit failed:', error);
            alert('Gagal menyimpan pembayaran');
        }
    };

    if (!isValidId) return null;

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
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <h1 className="text-2xl font-bold flex items-center gap-3 mb-2">
                                <Wallet className="w-6 h-6" />
                                Tambah Pembayaran
                            </h1>
                            <p className="text-emerald-100">
                                {rencanaPembelian?.kodePembelian}
                            </p>
                        </div>

                        {/* Summary Info */}
                        <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
                            <p className="text-sm text-emerald-100 mb-1">Sisa Tagihan yang Harus Dibayar</p>
                            <p className="text-2xl font-bold">{formatCurrency(sisaTagihan / 100)}</p>
                        </div>
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
                                    placeholder="Contoh: Bank Mandiri"
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
                                    placeholder="Nomor rekening"
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
                                placeholder="Nama pemilik rekening"
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
                                    placeholder="Nomor referensi pembayaran"
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
                                        placeholder="0"
                                    />
                                </div>
                                {errors.totalBayar && <p className="text-xs text-red-500">{errors.totalBayar.message}</p>}
                                <p className="text-xs text-slate-500">
                                    Masukan nominal
                                </p>
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
                                        Simpan Pembayaran
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
