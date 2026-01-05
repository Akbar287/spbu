'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import {
    Users, Hash, Mail, Phone, Calendar,
    Plus, Edit3, Trash2, Eye, ChevronLeft, ChevronRight,
    ArrowLeft, Grid3X3, List, Loader2, CheckCircle, XCircle, MapPin, Wallet
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';

// Blockchain Interfaces
interface BlockchainKtp {
    ktpId: bigint;
    statusMemberId: bigint;
    nik: string;
    nama: string;
    gender: number;
    tempatLahir: string;
    tanggalLahir: bigint;
    verified: boolean;
    walletAddress: string;
    email: string;
    noHp: string;
    noWa: string;
    bergabungSejak: bigint;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainStatusMember {
    statusMemberId: bigint;
    namaStatus: string;
    keterangan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Display Interface
interface Member {
    ktpId: number;
    statusMemberId: number;
    statusName: string;
    nik: string;
    nama: string;
    gender: 'Pria' | 'Wanita';
    tempatLahir: string;
    tanggalLahir: Date;
    verified: boolean;
    walletAddress: string;
    email: string;
    noHp: string;
    noWa: string;
    bergabungSejak: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
} as const;

const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: 'spring', stiffness: 100, damping: 15 }
    }
} as const;

const headerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: 'easeOut' }
    }
} as const;

// Format date
const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    }).format(date);
};

// Truncate wallet address
const truncateAddress = (address: string): string => {
    if (!address) return '-';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function MemberIndex() {
    const navigate = useNavigate();
    const { address } = useAccount();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch KTP data - need account for admin check
    const { data: ktpResponse, isLoading: isLoadingKtp, refetch: refetchKtp } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllKtp',
        args: [BigInt(0), BigInt(100)],
        account: address,
    });

    // Fetch Status Member data for name mapping
    const { data: statusMemberResponse, isLoading: isLoadingStatusMember } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllStatusMember',
        args: [BigInt(0), BigInt(100)],
    });

    // Write contract for delete
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success
    React.useEffect(() => {
        if (isWriteSuccess) {
            setDeleteTarget(null);
            setIsDeleting(false);
            refetchKtp();
        }
    }, [isWriteSuccess, refetchKtp]);

    // Process and combine data
    const { memberList, totalItems, stats } = useMemo(() => {
        if (!ktpResponse || !statusMemberResponse) return { memberList: [], totalItems: 0, stats: { verified: 0, unverified: 0, pria: 0, wanita: 0 } };

        const [rawKtp] = ktpResponse as [BlockchainKtp[], bigint];
        const [rawStatusMember] = statusMemberResponse as [BlockchainStatusMember[], bigint];

        // Create StatusMember Map
        const statusMemberMap = new Map<number, string>();
        rawStatusMember.forEach(status => {
            if (!status.deleted) {
                statusMemberMap.set(Number(status.statusMemberId), status.namaStatus);
            }
        });

        // Convert KTP to Member
        const converted: Member[] = rawKtp
            .filter(k => !k.deleted)
            .map(k => ({
                ktpId: Number(k.ktpId),
                statusMemberId: Number(k.statusMemberId),
                statusName: statusMemberMap.get(Number(k.statusMemberId)) || 'Unknown Status',
                nik: k.nik,
                nama: k.nama,
                gender: k.gender === 0 ? 'Pria' : 'Wanita',
                tempatLahir: k.tempatLahir,
                tanggalLahir: new Date(Number(k.tanggalLahir) * 1000),
                verified: k.verified,
                walletAddress: k.walletAddress,
                email: k.email,
                noHp: k.noHp,
                noWa: k.noWa,
                bergabungSejak: new Date(Number(k.bergabungSejak) * 1000),
                createdAt: new Date(Number(k.createdAt) * 1000),
                updatedAt: new Date(Number(k.updatedAt) * 1000),
            }));

        const verified = converted.filter(m => m.verified).length;
        const unverified = converted.filter(m => !m.verified).length;
        const pria = converted.filter(m => m.gender === 'Pria').length;
        const wanita = converted.filter(m => m.gender === 'Wanita').length;

        return { memberList: converted, totalItems: converted.length, stats: { verified, unverified, pria, wanita } };
    }, [ktpResponse, statusMemberResponse]);

    // Pagination logic
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedMembers = useMemo(() =>
        memberList.slice(startIndex, endIndex),
        [memberList, startIndex, endIndex]
    );

    const isLoading = isLoadingKtp || isLoadingStatusMember;

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteKtp',
                args: [deleteTarget.walletAddress as `0x${string}`],
            });
        } catch (error) {
            console.error('Error deleting:', error);
            setIsDeleting(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="absolute inset-0 bg-indigo-100/80 dark:bg-slate-900" />

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
                <motion.div
                    className="absolute top-1/3 right-1/4 w-96 h-96 rounded-full bg-gradient-to-br from-violet-400/15 to-pink-400/15 dark:from-violet-500/20 dark:to-pink-500/20 blur-3xl"
                    animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-20">
                {/* Back Button */}
                <motion.button
                    onClick={() => navigate('/')}
                    className="mb-6 flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-600 dark:text-slate-300 font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ x: -5 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Kembali
                </motion.button>

                {/* Header Section */}
                <motion.div
                    className="mb-8"
                    variants={headerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <motion.h1
                                className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent flex items-center gap-3"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <motion.div
                                    className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30"
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <Users className="w-7 h-7 text-white" />
                                </motion.div>
                                Daftar Member
                            </motion.h1>
                            <motion.p
                                className="text-slate-500 dark:text-slate-400 mt-2"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                Kelola data member dan identitas KTP
                            </motion.p>
                        </div>

                        {/* Action Buttons */}
                        <motion.div
                            className="flex items-center gap-3"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            {/* Page Size Select */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline">Per halaman:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value));
                                        setCurrentPage(1);
                                    }}
                                    className="px-3 py-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer"
                                >
                                    {[5, 10, 20, 50, 100].map(size => (
                                        <option key={size} value={size}>{size}</option>
                                    ))}
                                </select>
                            </div>

                            {/* View Toggle */}
                            <div className="flex items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
                                <motion.button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Grid3X3 className="w-5 h-5" />
                                </motion.button>
                                <motion.button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <List className="w-5 h-5" />
                                </motion.button>
                            </div>

                            {/* Add Button */}
                            <motion.button
                                onClick={() => navigate('/master/member/create')}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg shadow-indigo-500/30 transition-all"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Plus className="w-5 h-5" />
                                Tambah Member
                            </motion.button>
                        </motion.div>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {[
                        { label: 'Total Member', value: totalItems, icon: Users, color: 'from-indigo-500 to-purple-600' },
                        { label: 'Terverifikasi', value: stats.verified, icon: CheckCircle, color: 'from-green-500 to-emerald-600' },
                        { label: 'Belum Verifikasi', value: stats.unverified, icon: XCircle, color: 'from-red-500 to-orange-600' },
                        { label: 'Pria / Wanita', value: `${stats.pria} / ${stats.wanita}`, icon: Users, color: 'from-blue-500 to-cyan-600' },
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            variants={cardVariants}
                            className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 p-4 shadow-lg"
                            whileHover={{ scale: 1.02, y: -2 }}
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{stat.label}</p>
                                    <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{stat.value}</p>
                                </div>
                                <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl shadow-lg`}>
                                    <stat.icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Member Cards Grid */}
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                        <p className="text-slate-400 dark:text-slate-500 font-medium animate-pulse">
                            Memuat data member...
                        </p>
                    </div>
                ) : paginatedMembers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-full mb-4">
                            <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Belum Ada Data Member
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                            Silakan tambahkan member baru untuk memulai pengelolaan.
                        </p>
                    </div>
                ) : (
                    <motion.div
                        className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        key={`${currentPage}-${pageSize}`}
                    >
                        {paginatedMembers.map((member, index) => (
                            <motion.div
                                key={member.ktpId}
                                variants={cardVariants}
                                className="group relative"
                            >
                                {/* Card with Glassmorphism */}
                                <div className="relative overflow-hidden rounded-2xl bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300">
                                    {/* Card Header with Gradient */}
                                    <div className={`relative h-28 bg-gradient-to-br ${getCardGradient(index)} overflow-hidden`}>
                                        {/* Mesh Pattern */}
                                        <div className="absolute inset-0 opacity-20">
                                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4yIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')]" />
                                        </div>

                                        {/* ID Badge */}
                                        <motion.div
                                            className="absolute top-3 right-3 px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full border border-white/30"
                                            whileHover={{ scale: 1.1, rotate: 5 }}
                                        >
                                            <span className="text-sm font-bold text-white flex items-center gap-1.5 drop-shadow-lg">
                                                <Hash className="w-3.5 h-3.5" />
                                                {member.ktpId}
                                            </span>
                                        </motion.div>

                                        {/* Verified Badge */}
                                        <motion.div
                                            className={`absolute top-3 left-3 px-3 py-1.5 backdrop-blur-md rounded-full border ${member.verified
                                                ? 'bg-green-500/20 border-green-300/50'
                                                : 'bg-yellow-500/20 border-yellow-300/50'
                                                }`}
                                            whileHover={{ scale: 1.1 }}
                                        >
                                            <span className="text-sm font-bold text-white flex items-center gap-1.5 drop-shadow-lg">
                                                {member.verified ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                                {member.verified ? 'Verified' : 'Unverified'}
                                            </span>
                                        </motion.div>

                                        {/* Icon */}
                                        <motion.div
                                            className="absolute bottom-3 left-4 p-3 bg-white/20 backdrop-blur-md rounded-xl border border-white/40 shadow-lg"
                                            whileHover={{ rotate: [0, -15, 15, 0], scale: 1.15 }}
                                            transition={{ duration: 0.6 }}
                                        >
                                            <Users className="w-6 h-6 text-white drop-shadow-lg" />
                                        </motion.div>

                                        {/* Nama Member */}
                                        <motion.div
                                            className="absolute bottom-3 left-20 right-4"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 + 0.4 }}
                                        >
                                            <h3 className="text-lg font-bold text-white drop-shadow-lg truncate">
                                                {member.nama}
                                            </h3>
                                        </motion.div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-5 relative">
                                        <div className="relative space-y-3">
                                            {/* NIK */}
                                            <motion.div
                                                className="flex items-center gap-3"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 + 0.5 }}
                                            >
                                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                                    <Hash className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                <span className="text-sm text-slate-600 dark:text-slate-300 font-mono">
                                                    NIK: {member.nik || '-'}
                                                </span>
                                            </motion.div>

                                            {/* Wallet Address */}
                                            <motion.div
                                                className="flex items-center gap-3"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 + 0.55 }}
                                            >
                                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                                                    <Wallet className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                                                </div>
                                                <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">
                                                    {truncateAddress(member.walletAddress)}
                                                </span>
                                            </motion.div>

                                            {/* Email */}
                                            <motion.div
                                                className="flex items-center gap-3"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 + 0.6 }}
                                            >
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                    <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <span className="text-sm text-slate-500 dark:text-slate-400 truncate">
                                                    {member.email || '-'}
                                                </span>
                                            </motion.div>

                                            {/* Bergabung Sejak */}
                                            <motion.div
                                                className="flex items-center gap-3"
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: index * 0.1 + 0.65 }}
                                            >
                                                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                    <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                </div>
                                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                                    Bergabung: {formatDate(member.bergabungSejak)}
                                                </span>
                                            </motion.div>

                                            {/* Actions */}
                                            <motion.div
                                                className="mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.1 + 0.7 }}
                                            >
                                                <motion.button
                                                    onClick={() => navigate(`/master/member/${member.ktpId}`)}
                                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/40 dark:to-purple-500/40 text-indigo-600 dark:text-indigo-200 font-medium rounded-xl hover:from-indigo-500/20 hover:to-purple-500/20 dark:hover:from-indigo-500/60 dark:hover:to-purple-500/60 transition-all border border-indigo-200/50 dark:border-indigo-400/50 dark:shadow-lg dark:shadow-indigo-500/20 cursor-pointer"
                                                    whileHover={{ scale: 1.03 }}
                                                    whileTap={{ scale: 0.97 }}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Detail
                                                </motion.button>
                                                <motion.button
                                                    className="p-2.5 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-600/40 dark:to-indigo-600/40 text-purple-600 dark:text-indigo-200 rounded-xl border border-purple-200/50 dark:border-indigo-400/50 hover:shadow-lg hover:shadow-purple-500/20 dark:shadow-lg dark:shadow-indigo-500/30 transition-all cursor-pointer"
                                                    onClick={() => navigate(`/master/member/${member.ktpId}/edit`)}
                                                    whileHover={{ scale: 1.15, rotate: 10 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </motion.button>
                                                <motion.button
                                                    className="p-2.5 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-600/40 dark:to-pink-600/40 text-red-600 dark:text-pink-200 rounded-xl border border-red-200/50 dark:border-pink-400/50 hover:shadow-lg hover:shadow-red-500/20 dark:shadow-lg dark:shadow-pink-500/30 transition-all cursor-pointer"
                                                    onClick={() => setDeleteTarget(member)}
                                                    whileHover={{ scale: 1.15, rotate: -10 }}
                                                    whileTap={{ scale: 0.9 }}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </motion.button>
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Bottom Gradient Line */}
                                    <motion.div
                                        className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"
                                        initial={{ scaleX: 0, opacity: 0 }}
                                        whileHover={{ scaleX: 1, opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                        style={{ originX: 0 }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700"
                    >
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Menampilkan {startIndex + 1} - {Math.min(endIndex, totalItems)} dari {totalItems} Member
                        </p>
                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                                whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
                                whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </motion.button>

                            <div className="flex items-center gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1)
                                    .filter(page => {
                                        if (totalPages <= 5) return true;
                                        if (page === 1 || page === totalPages) return true;
                                        if (Math.abs(page - currentPage) <= 1) return true;
                                        return false;
                                    })
                                    .map((page, i, arr) => (
                                        <React.Fragment key={page}>
                                            {i > 0 && arr[i - 1] !== page - 1 && (
                                                <span className="px-1 text-slate-400">...</span>
                                            )}
                                            <motion.button
                                                onClick={() => setCurrentPage(page)}
                                                className={`min-w-[40px] h-10 rounded-xl font-medium transition-all ${currentPage === page
                                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30'
                                                    : 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                            >
                                                {page}
                                            </motion.button>
                                        </React.Fragment>
                                    ))}
                            </div>

                            <motion.button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                                whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
                                whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {deleteTarget && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => !isDeleting && setDeleteTarget(null)}
                    >
                        <motion.div
                            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 text-center">
                                <motion.div
                                    className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', delay: 0.1 }}
                                >
                                    <Trash2 className="w-8 h-8 text-red-500" />
                                </motion.div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    Hapus Member?
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Apakah Anda yakin ingin menghapus <strong className="text-slate-800 dark:text-white">{deleteTarget.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
                                </p>
                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={() => setDeleteTarget(null)}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
                                        whileHover={{ scale: isDeleting ? 1 : 1.02 }}
                                        whileTap={{ scale: isDeleting ? 1 : 0.98 }}
                                    >
                                        Batal
                                    </motion.button>
                                    <motion.button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-2xl shadow-lg shadow-red-500/30 disabled:opacity-70"
                                        whileHover={{ scale: isDeleting ? 1 : 1.02 }}
                                        whileTap={{ scale: isDeleting ? 1 : 0.98 }}
                                    >
                                        {isDeleting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Menghapus...
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="w-4 h-4" />
                                                Hapus
                                            </>
                                        )}
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Card gradient colors based on index
const getCardGradient = (index: number) => {
    const gradients = [
        'from-indigo-500 via-purple-500 to-pink-600',
        'from-blue-500 via-indigo-500 to-purple-600',
        'from-violet-500 via-purple-500 to-fuchsia-600',
        'from-purple-500 via-pink-500 to-rose-600',
        'from-fuchsia-500 via-purple-500 to-indigo-600',
    ];
    return gradients[index % gradients.length];
};
