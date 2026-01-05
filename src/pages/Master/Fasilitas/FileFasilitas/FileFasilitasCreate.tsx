'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract } from 'wagmi';
import {
    FileImage, ArrowLeft, Upload, Building,
    AlertCircle, CheckCircle2, Loader2, Sparkles, FileText, Image, X
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { uploadToIPFS } from '@/config/ipfs';

// Blockchain Interfaces
interface BlockchainFasilitas {
    fasilitasId: bigint;
    spbuId: bigint;
    nama: string;
    keterangan: string;
    jumlah: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Allowed file types
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function FileFasilitasCreate() {
    const navigate = useNavigate();
    const { fasilitasId } = useParams<{ fasilitasId: string }>();
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [namaDokumen, setNamaDokumen] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<'idle' | 'ipfs' | 'blockchain' | 'success'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    // Fetch Fasilitas Data
    const { data: blockchainFasilitas, isLoading: isLoadingFasilitas } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getFasilitasById',
        args: fasilitasId ? [BigInt(fasilitasId)] : undefined,
        query: {
            enabled: !!fasilitasId,
        },
    });

    // Write Contract Hook
    const { writeContractAsync } = useWriteContract();

    // Process Fasilitas Data
    const fasilitasData = useMemo(() => {
        if (!blockchainFasilitas) return null;
        const f = blockchainFasilitas as BlockchainFasilitas;
        if (f.deleted || Number(f.fasilitasId) === 0) return null;
        return {
            fasilitasId: Number(f.fasilitasId),
            nama: f.nama,
        };
    }, [blockchainFasilitas]);

    const handleFileChange = useCallback((selectedFile: File) => {
        setError(null);

        // Validate file type
        if (!ALLOWED_TYPES.includes(selectedFile.type)) {
            setError('Format file tidak didukung. Gunakan PNG, JPG, JPEG, atau PDF.');
            return;
        }

        // Validate file size
        if (selectedFile.size > MAX_FILE_SIZE) {
            setError('Ukuran file maksimal 10MB.');
            return;
        }

        setFile(selectedFile);

        // Create preview for images
        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        } else {
            setPreview(null);
        }
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileChange(droppedFile);
        }
    }, [handleFileChange]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            handleFileChange(selectedFile);
        }
    }, [handleFileChange]);

    const clearFile = useCallback(() => {
        setFile(null);
        setPreview(null);
        setError(null);
    }, []);

    const handleUpload = async () => {
        if (!file || !fasilitasId || !namaDokumen.trim()) {
            setError('File dan nama dokumen wajib diisi.');
            return;
        }

        setIsUploading(true);
        setError(null);

        try {
            // Step 1: Upload to IPFS
            setUploadProgress('ipfs');
            const ipfsHash = await uploadToIPFS(file);

            // Step 2: Store to Blockchain
            setUploadProgress('blockchain');
            await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'createFileFasilitas',
                args: [
                    BigInt(fasilitasId),
                    ipfsHash,
                    file.name,
                    namaDokumen.trim(),
                    file.type,
                    BigInt(file.size),
                ],
            });

            setUploadProgress('success');
            setTimeout(() => {
                navigate(`/master/fasilitas/${fasilitasId}/file`);
            }, 1500);
        } catch (err) {
            console.error('Upload error:', err);
            setError('Gagal mengupload file. Silakan coba lagi.');
            setUploadProgress('idle');
        } finally {
            setIsUploading(false);
        }
    };

    // Loading State
    if (isLoadingFasilitas) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-violet-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat data fasilitas...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Not found state
    if (!fasilitasData) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-violet-50 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4 text-center p-8"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Fasilitas Tidak Ditemukan</h2>
                        <motion.button
                            onClick={() => navigate('/master/fasilitas')}
                            className="mt-4 px-6 py-3 bg-violet-600 text-white font-semibold rounded-2xl"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            Kembali ke Daftar Fasilitas
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        );
    }

    const isImage = file?.type.startsWith('image/');

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-violet-50 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-violet-400/20 to-purple-400/20 dark:from-violet-600/30 dark:to-purple-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-fuchsia-400/15 to-pink-400/15 dark:from-fuchsia-500/20 dark:to-pink-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate(`/master/fasilitas/${fasilitasId}/file`)}
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
                            <FileImage className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Upload File
                            </h1>
                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mt-1">
                                <Building className="w-4 h-4" />
                                <span>{fasilitasData.nama}</span>
                            </div>
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
                        <Sparkles className="w-5 h-5 text-violet-400/50" />
                    </motion.div>

                    {/* Form Content */}
                    <div className="relative z-10 p-6 md:p-8 space-y-6">
                        {/* Dropzone */}
                        <motion.div
                            className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${isDragging
                                    ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                                    : file
                                        ? 'border-violet-400 bg-violet-50/50 dark:bg-violet-900/10'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-violet-400'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            {file ? (
                                <div className="space-y-4">
                                    {preview ? (
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className="max-h-48 mx-auto rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="flex justify-center">
                                            <FileText className="w-16 h-16 text-violet-500" />
                                        </div>
                                    )}
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="text-slate-600 dark:text-slate-300 font-medium truncate max-w-xs">
                                            {file.name}
                                        </span>
                                        <motion.button
                                            onClick={clearFile}
                                            className="p-1 bg-red-100 dark:bg-red-900/30 rounded-full text-red-500"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <X className="w-4 h-4" />
                                        </motion.button>
                                    </div>
                                    <p className="text-sm text-slate-500">
                                        {(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1].toUpperCase()}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <Upload className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                                    <p className="text-slate-600 dark:text-slate-300 font-medium mb-2">
                                        Drag & drop file di sini
                                    </p>
                                    <p className="text-sm text-slate-500 mb-4">atau</p>
                                    <label className="cursor-pointer">
                                        <span className="px-4 py-2 bg-violet-500 text-white font-medium rounded-xl hover:bg-violet-600 transition-colors">
                                            Pilih File
                                        </span>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept={ALLOWED_TYPES.join(',')}
                                            onChange={handleInputChange}
                                        />
                                    </label>
                                    <p className="text-xs text-slate-400 mt-4">
                                        PNG, JPG, JPEG, atau PDF (maks. 10MB)
                                    </p>
                                </>
                            )}
                        </motion.div>

                        {/* Nama Dokumen */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <FileText className="w-4 h-4 text-violet-500" />
                                Nama Dokumen
                            </label>
                            <input
                                type="text"
                                value={namaDokumen}
                                onChange={(e) => setNamaDokumen(e.target.value)}
                                placeholder="Contoh: Foto Toilet Depan"
                                className="w-full px-4 py-3 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200 dark:border-slate-700 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none text-slate-700 dark:text-slate-200 placeholder-slate-400 transition-all"
                            />
                        </motion.div>

                        {/* Error Message */}
                        {error && (
                            <motion.div
                                className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        {/* Upload Progress */}
                        {uploadProgress !== 'idle' && (
                            <motion.div
                                className="p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className="flex items-center gap-3">
                                    {uploadProgress === 'success' ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                    ) : (
                                        <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                                    )}
                                    <span className="text-violet-700 dark:text-violet-300 font-medium">
                                        {uploadProgress === 'ipfs' && 'Mengupload ke IPFS...'}
                                        {uploadProgress === 'blockchain' && 'Menyimpan ke Blockchain...'}
                                        {uploadProgress === 'success' && 'Upload berhasil!'}
                                    </span>
                                </div>
                            </motion.div>
                        )}

                        {/* Submit Button */}
                        <motion.div
                            className="pt-4 border-t border-slate-200/50 dark:border-slate-700/50"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <motion.button
                                onClick={handleUpload}
                                disabled={!file || !namaDokumen.trim() || isUploading || uploadProgress === 'success'}
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg shadow-violet-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                whileHover={{ scale: (!file || !namaDokumen.trim() || isUploading) ? 1 : 1.02 }}
                                whileTap={{ scale: (!file || !namaDokumen.trim() || isUploading) ? 1 : 0.98 }}
                            >
                                {uploadProgress === 'success' ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Berhasil Diupload!
                                    </>
                                ) : isUploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Mengupload...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        Upload File
                                    </>
                                )}
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
