'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useWriteContract } from 'wagmi';
import {
    Upload, ArrowLeft, Save, FileText, Image, File,
    AlertCircle, CheckCircle2, Loader2, X, Package, Trash2
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { uploadToIPFS, getIPFSUrl } from '@/config/ipfs';

// Allowed file types
const ALLOWED_TYPES = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Form data interface
interface FileAsetFormData {
    namaDokumen: string;
}

// Validation Schema
const fileAsetValidationSchema = yup.object({
    namaDokumen: yup.string()
        .required('Nama dokumen wajib diisi')
        .min(2, 'Nama dokumen minimal 2 karakter')
        .max(100, 'Nama dokumen maksimal 100 karakter'),
}).required();

// Format file size
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file icon based on mime type
const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return Image;
    if (mimeType === 'application/pdf') return FileText;
    return File;
};

export default function FileAsetCreate() {
    const navigate = useNavigate();
    const { asetId } = useParams<{ asetId: string }>();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<'idle' | 'uploading' | 'saving' | 'success' | 'error'>('idle');
    const [ipfsCid, setIpfsCid] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FileAsetFormData>({
        resolver: yupResolver(fileAsetValidationSchema) as any,
        mode: 'onChange',
    });

    const { writeContractAsync } = useWriteContract();

    // Handle file selection
    const handleFileSelect = useCallback((file: File) => {
        setErrorMessage(null);

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            setErrorMessage('Tipe file tidak didukung. Gunakan PNG, JPG, JPEG, atau PDF.');
            return;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            setErrorMessage('Ukuran file maksimal 10MB.');
            return;
        }

        setSelectedFile(file);

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFilePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    }, []);

    // Handle drag events
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    // Handle drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    }, [handleFileSelect]);

    // Handle input change
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    }, [handleFileSelect]);

    // Remove selected file
    const removeFile = useCallback(() => {
        setSelectedFile(null);
        setFilePreview(null);
        setIpfsCid(null);
        setErrorMessage(null);
    }, []);

    // Submit form
    const onSubmit = async (data: FileAsetFormData) => {
        if (!selectedFile || !asetId) return;

        setUploadProgress('uploading');
        setErrorMessage(null);

        try {
            // 1. Upload to IPFS
            const cid = await uploadToIPFS(selectedFile);
            setIpfsCid(cid);

            setUploadProgress('saving');

            // 2. Save CID to blockchain
            await writeContractAsync({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'createFileAset',
                args: [
                    BigInt(asetId),
                    cid, // IPFS CID/Hash
                    selectedFile.name, // namaFile
                    data.namaDokumen, // namaDokumen
                    selectedFile.type, // mimeType
                    BigInt(selectedFile.size), // fileSize
                ],
            });

            setUploadProgress('success');
            setTimeout(() => {
                navigate(`/master/aset/${asetId}/file`);
            }, 1500);
        } catch (error: any) {
            console.error('Error uploading file:', error);
            setUploadProgress('error');
            setErrorMessage(error?.message || 'Gagal mengupload file. Pastikan IPFS daemon sudah berjalan.');
        }
    };

    const inputBaseClass = "w-full px-4 py-3 bg-white dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border transition-all duration-200 outline-none";
    const inputNormalClass = "border-slate-200 dark:border-slate-700 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20";
    const inputErrorClass = "border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20";

    const FileIcon = selectedFile ? getFileIcon(selectedFile.type) : File;

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-amber-50 dark:bg-slate-900" />

            {/* Animated Background Gradients */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <motion.div
                    className="absolute -top-1/2 -left-1/2 w-full h-full rounded-full bg-gradient-to-r from-amber-400/20 to-orange-400/20 dark:from-amber-600/30 dark:to-orange-600/30 blur-3xl"
                    animate={{ x: [0, 100, 0], y: [0, 50, 0], scale: [1, 1.2, 1] }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                />
                <motion.div
                    className="absolute -bottom-1/2 -right-1/2 w-full h-full rounded-full bg-gradient-to-l from-yellow-400/15 to-lime-400/15 dark:from-yellow-500/20 dark:to-lime-500/20 blur-3xl"
                    animate={{ x: [0, -80, 0], y: [0, -60, 0], scale: [1.2, 1, 1.2] }}
                    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate(`/master/aset/${asetId}/file`)}
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
                            className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg shadow-amber-500/30"
                            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Upload className="w-8 h-8 text-white" />
                        </motion.div>
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                Upload File Aset
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                                <Package className="w-4 h-4" />
                                Aset ID: {asetId}
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
                        {/* Dropzone */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <Upload className="w-4 h-4 text-amber-500" />
                                Pilih File
                            </label>

                            {!selectedFile ? (
                                <div
                                    className={`relative border-2 border-dashed rounded-2xl transition-all duration-300 ${dragActive
                                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                        : 'border-slate-300 dark:border-slate-600 hover:border-amber-400'
                                        }`}
                                    onDragEnter={handleDrag}
                                    onDragLeave={handleDrag}
                                    onDragOver={handleDrag}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpg,image/jpeg,application/pdf"
                                        onChange={handleInputChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="p-8 text-center">
                                        <motion.div
                                            className="mx-auto w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4"
                                            animate={dragActive ? { scale: 1.1 } : { scale: 1 }}
                                        >
                                            <Upload className="w-8 h-8 text-amber-500" />
                                        </motion.div>
                                        <p className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-1">
                                            {dragActive ? 'Lepaskan file di sini' : 'Drag & drop file di sini'}
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                            atau klik untuk memilih file
                                        </p>
                                        <div className="flex flex-wrap justify-center gap-2">
                                            {['PNG', 'JPG', 'JPEG', 'PDF'].map((type) => (
                                                <span
                                                    key={type}
                                                    className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium rounded"
                                                >
                                                    {type}
                                                </span>
                                            ))}
                                        </div>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                                            Maksimal 10MB
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <motion.div
                                    className="relative bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <div className="flex items-start gap-4">
                                        {/* Preview */}
                                        <div className="flex-shrink-0 w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-xl overflow-hidden flex items-center justify-center">
                                            {filePreview ? (
                                                <img
                                                    src={filePreview}
                                                    alt="Preview"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <FileIcon className="w-10 h-10 text-slate-400" />
                                            )}
                                        </div>

                                        {/* File Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-slate-700 dark:text-slate-200 truncate">
                                                {selectedFile.name}
                                            </p>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                                {formatFileSize(selectedFile.size)}
                                            </p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                                                {selectedFile.type}
                                            </p>
                                        </div>

                                        {/* Remove Button */}
                                        <motion.button
                                            type="button"
                                            onClick={removeFile}
                                            className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                            whileHover={{ scale: 1.1 }}
                                            whileTap={{ scale: 0.9 }}
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </motion.button>
                                    </div>

                                    {/* IPFS CID if uploaded */}
                                    {ipfsCid && (
                                        <motion.div
                                            className="mt-3 p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                        >
                                            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-mono truncate">
                                                CID: {ipfsCid}
                                            </p>
                                        </motion.div>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>

                        {/* Error Message */}
                        <AnimatePresence>
                            {errorMessage && (
                                <motion.div
                                    className="p-4 bg-red-100 dark:bg-red-900/30 rounded-xl border border-red-200 dark:border-red-800 flex items-start gap-3"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Nama Dokumen */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.35 }}
                        >
                            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                <FileText className="w-4 h-4 text-amber-500" />
                                Nama Dokumen
                            </label>
                            <input
                                type="text"
                                {...register('namaDokumen')}
                                placeholder="Contoh: Foto Aset Tampak Depan, Sertifikat Garansi"
                                className={`${inputBaseClass} ${errors.namaDokumen ? inputErrorClass : inputNormalClass} text-slate-700 dark:text-slate-200 placeholder-slate-400`}
                            />
                            {errors.namaDokumen && (
                                <motion.p
                                    className="mt-2 text-sm text-red-500 flex items-center gap-1"
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                >
                                    <AlertCircle className="w-4 h-4" />
                                    {errors.namaDokumen.message}
                                </motion.p>
                            )}
                        </motion.div>

                        {/* Info Box */}
                        <motion.div
                            className="p-4 bg-amber-50/80 dark:bg-amber-900/20 rounded-xl border border-amber-200/50 dark:border-amber-500/30"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            <p className="text-sm text-amber-700 dark:text-amber-300">
                                💡 File akan diupload ke IPFS. File anda aman karena dienkripsi dengan public key anda.
                            </p>
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
                                disabled={!selectedFile || uploadProgress !== 'idle'}
                                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 font-semibold rounded-2xl transition-all shadow-lg ${uploadProgress === 'success'
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30'
                                    : 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-amber-500/30'
                                    } disabled:opacity-70 disabled:cursor-not-allowed`}
                                whileHover={{ scale: uploadProgress === 'idle' && selectedFile ? 1.02 : 1, y: uploadProgress === 'idle' && selectedFile ? -2 : 0 }}
                                whileTap={{ scale: uploadProgress === 'idle' && selectedFile ? 0.98 : 1 }}
                            >
                                {uploadProgress === 'uploading' ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Mengupload ke IPFS...
                                    </>
                                ) : uploadProgress === 'saving' ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Menyimpan ke Blockchain...
                                    </>
                                ) : uploadProgress === 'success' ? (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" />
                                        Berhasil Diupload!
                                    </>
                                ) : uploadProgress === 'error' ? (
                                    <>
                                        <AlertCircle className="w-5 h-5" />
                                        Gagal, Coba Lagi
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Upload & Simpan
                                    </>
                                )}
                            </motion.button>
                            <motion.button
                                type="button"
                                onClick={() => navigate(`/master/aset/${asetId}/file`)}
                                disabled={uploadProgress === 'uploading' || uploadProgress === 'saving'}
                                className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <X className="w-5 h-5 inline-block mr-2" />
                                Batal
                            </motion.button>
                        </motion.div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
