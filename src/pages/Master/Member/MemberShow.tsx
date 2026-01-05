'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useReadContract, useWriteContract, useAccount } from 'wagmi';
import {
    Users, ArrowLeft, Edit3, Trash2, Hash, FileText,
    AlertCircle, Loader2, Sparkles, CheckCircle2, Clock,
    CheckCircle, XCircle, User, Mail, Phone, MapPin,
    Wallet, Calendar, Briefcase, Building2, Plus
} from 'lucide-react';
import { DIAMOND_ADDRESS, DIAMOND_ABI } from '@/contracts/config';
import { Shield } from 'lucide-react';

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
    deleted: boolean;
}

interface BlockchainJabatan {
    jabatanId: bigint;
    levelId: bigint;
    namaJabatan: string;
    keterangan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

interface BlockchainAreaMember {
    areaMemberId: bigint;
    ktpId: bigint;
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    kelurahan: string;
    alamat: string;
    rw: string;
    rt: string;
    no: string;
    kodePos: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
}

// Display Interface
interface MemberData {
    ktpId: number;
    statusMemberId: number;
    statusName: string;
    nik: string;
    nama: string;
    gender: string;
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

interface JabatanData {
    jabatanId: number;
    namaJabatan: string;
    keterangan: string;
}

interface AreaMemberData {
    areaMemberId: number;
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    kelurahan: string;
    alamat: string;
    rw: string;
    rt: string;
    no: string;
    kodePos: string;
}

// Truncate wallet address
const truncateAddress = (address: string): string => {
    if (!address) return '-';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Format date
const formatDate = (date: Date): string => {
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
};

const formatDateTime = (date: Date): string => {
    return date.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};
// Blockchain Jabatan interface for role modal (includes roleHash from blockchain)
interface BlockchainJabatanRole {
    jabatanId: bigint;
    levelId: bigint;
    namaJabatan: string;
    keterangan: string;
    createdAt: bigint;
    updatedAt: bigint;
    deleted: boolean;
    roleHash: string; // Now from blockchain
}

// Role Management Modal Component
interface RoleManagementModalProps {
    walletAddress: string;
    memberName: string;
    onClose: () => void;
}

// Color palette for jabatan
const getJabatanColor = (index: number): string => {
    const colors = ['red', 'blue', 'purple', 'green', 'orange', 'cyan', 'pink', 'indigo', 'teal', 'amber'];
    return colors[index % colors.length];
};

// Color map for role items
const colorMap: Record<string, { bg: string; activeBg: string }> = {
    red: { bg: 'bg-red-100 dark:bg-red-900/30', activeBg: 'bg-red-500' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/30', activeBg: 'bg-blue-500' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', activeBg: 'bg-purple-500' },
    green: { bg: 'bg-green-100 dark:bg-green-900/30', activeBg: 'bg-green-500' },
    orange: { bg: 'bg-orange-100 dark:bg-orange-900/30', activeBg: 'bg-orange-500' },
    cyan: { bg: 'bg-cyan-100 dark:bg-cyan-900/30', activeBg: 'bg-cyan-500' },
    pink: { bg: 'bg-pink-100 dark:bg-pink-900/30', activeBg: 'bg-pink-500' },
    indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', activeBg: 'bg-indigo-500' },
    teal: { bg: 'bg-teal-100 dark:bg-teal-900/30', activeBg: 'bg-teal-500' },
    amber: { bg: 'bg-amber-100 dark:bg-amber-900/30', activeBg: 'bg-amber-500' },
};

// Individual Role Toggle Item Component (allows proper hook usage)
interface RoleToggleItemProps {
    jabatan: {
        jabatanId: number;
        namaJabatan: string;
        roleHash: `0x${string}`;
        color: string;
    };
    walletAddress: string;
    onToggle: (jabatanId: number, roleHash: string, hasRole: boolean) => void;
    isUpdating: boolean;
    isPending: boolean;
    refreshKey: number; // Force re-render when this changes
}

function RoleToggleItem({ jabatan, walletAddress, onToggle, isUpdating, isPending, refreshKey }: RoleToggleItemProps) {
    // useReadContract is now called at the top level of this component
    const { data: hasRoleData, refetch } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'hasRole',
        args: [jabatan.roleHash, walletAddress as `0x${string}`],
    });

    // Refetch when refreshKey changes
    useEffect(() => {
        if (refreshKey > 0) {
            refetch();
        }
    }, [refreshKey, refetch]);

    const hasRole = hasRoleData as boolean ?? false;
    const colors = colorMap[jabatan.color] || colorMap.blue;

    return (
        <div
            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${hasRole
                ? `${colors.bg} border-slate-200 dark:border-slate-600`
                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                }`}
        >
            <div className="flex items-center gap-3">
                <Briefcase className={`w-5 h-5 ${hasRole ? 'text-green-500' : 'text-slate-400'}`} />
                <div>
                    <p className={`font-semibold ${hasRole ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                        {jabatan.namaJabatan}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {hasRole ? '✓ Assigned' : 'Not assigned'}
                    </p>
                </div>
            </div>

            <motion.button
                onClick={() => onToggle(jabatan.jabatanId, jabatan.roleHash, hasRole)}
                disabled={isUpdating || isPending}
                className={`relative w-14 h-8 rounded-full transition-all ${isUpdating ? 'opacity-50' : ''} ${hasRole
                    ? colors.activeBg
                    : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                {isUpdating ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-4 h-4 text-white animate-spin" />
                    </div>
                ) : (
                    <motion.div
                        className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-md"
                        animate={{ left: hasRole ? 'calc(100% - 28px)' : '4px' }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                )}
            </motion.button>
        </div>
    );
}

function RoleManagementModal({ walletAddress, memberName, onClose }: RoleManagementModalProps) {
    const [updatingRole, setUpdatingRole] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const { writeContract, isPending, isSuccess, reset } = useWriteContract();

    // Fetch all Jabatan from blockchain
    const { data: jabatanResponse, isLoading: isLoadingJabatan, refetch: refetchJabatan } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAllJabatan',
        args: [BigInt(0), BigInt(100)],
    });

    // Parse jabatan list - use roleHash directly from blockchain
    const jabatanList = useMemo(() => {
        if (!jabatanResponse) return [];
        const [rawJabatan] = jabatanResponse as [BlockchainJabatanRole[], bigint];
        const EMPTY_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';
        return rawJabatan
            .filter(j => !j.deleted && j.roleHash && j.roleHash !== EMPTY_HASH)
            .map((j, idx) => ({
                jabatanId: Number(j.jabatanId),
                namaJabatan: j.namaJabatan,
                keterangan: j.keterangan,
                roleHash: j.roleHash as `0x${string}`, // Use roleHash from blockchain
                color: getJabatanColor(idx),
            }));
    }, [jabatanResponse]);

    // Handle role success - trigger refetch
    useEffect(() => {
        if (isSuccess && updatingRole) {
            // Increment refreshKey to trigger refetch in RoleToggleItem components
            setRefreshKey(prev => prev + 1);
            refetchJabatan();
            setUpdatingRole(null);
            reset();
        }
    }, [isSuccess, updatingRole, reset, refetchJabatan]);

    const handleToggleRole = async (jabatanId: number, roleHash: string, currentlyHasRole: boolean) => {
        // Validate roleHash is not empty
        const EMPTY_HASH = '0x0000000000000000000000000000000000000000000000000000000000000000';
        if (!roleHash || roleHash === EMPTY_HASH) {
            alert('Role hash tidak valid. Jabatan ini belum memiliki roleHash. Jalankan migrasi terlebih dahulu.');
            return;
        }

        setUpdatingRole(jabatanId.toString());
        try {
            if (currentlyHasRole) {
                // Revoke role with jabatan tracking
                writeContract({
                    address: DIAMOND_ADDRESS as `0x${string}`,
                    abi: DIAMOND_ABI,
                    functionName: 'revokeRoleWithJabatan',
                    args: [roleHash as `0x${string}`, walletAddress as `0x${string}`, BigInt(jabatanId)],
                });
            } else {
                // Grant role with jabatan tracking
                writeContract({
                    address: DIAMOND_ADDRESS as `0x${string}`,
                    abi: DIAMOND_ABI,
                    functionName: 'grantRoleWithJabatan',
                    args: [roleHash as `0x${string}`, walletAddress as `0x${string}`, BigInt(jabatanId)],
                });
            }
        } catch (error) {
            console.error('Error updating role:', error);
            setUpdatingRole(null);
        }
    };

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[80vh]"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                            <Shield className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                Manage Roles
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {memberName}
                            </p>
                        </div>
                    </div>

                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Wallet: <code className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-xs">{truncateAddress(walletAddress)}</code>
                    </p>

                    {isLoadingJabatan ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {jabatanList.map((jabatan) => (
                                <RoleToggleItem
                                    key={jabatan.jabatanId}
                                    jabatan={jabatan}
                                    walletAddress={walletAddress}
                                    onToggle={handleToggleRole}
                                    isUpdating={updatingRole === jabatan.jabatanId.toString()}
                                    isPending={isPending}
                                    refreshKey={refreshKey}
                                />
                            ))}
                        </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                        <motion.button
                            onClick={onClose}
                            className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Tutup
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

// AreaMember Form Modal Component
interface AreaMemberFormData {
    areaMemberId?: number;
    provinsi: string;
    kabupaten: string;
    kecamatan: string;
    kelurahan: string;
    alamat: string;
    rw: string;
    rt: string;
    no: string;
    kodePos: string;
}

interface AreaMemberFormModalProps {
    walletAddress: string;
    mode: 'create' | 'edit';
    initialData?: AreaMemberFormData;
    onClose: () => void;
    onSuccess: () => void;
}

function AreaMemberFormModal({ walletAddress, mode, initialData, onClose, onSuccess }: AreaMemberFormModalProps) {
    const [formData, setFormData] = useState<AreaMemberFormData>({
        provinsi: initialData?.provinsi || '',
        kabupaten: initialData?.kabupaten || '',
        kecamatan: initialData?.kecamatan || '',
        kelurahan: initialData?.kelurahan || '',
        alamat: initialData?.alamat || '',
        rw: initialData?.rw || '',
        rt: initialData?.rt || '',
        no: initialData?.no || '',
        kodePos: initialData?.kodePos || '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { writeContract, isPending, isSuccess, reset, error } = useWriteContract();

    useEffect(() => {
        if (isSuccess) {
            setIsSubmitting(false);
            reset();
            onSuccess();
            onClose();
        }
    }, [isSuccess, reset, onSuccess, onClose]);

    useEffect(() => {
        if (error) {
            setIsSubmitting(false);
            console.error('Transaction error:', error);
        }
    }, [error]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (mode === 'create') {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'createAreaMember',
                args: [
                    walletAddress as `0x${string}`,
                    formData.provinsi,
                    formData.kabupaten,
                    formData.kecamatan,
                    formData.kelurahan,
                    formData.alamat,
                    formData.rw,
                    formData.rt,
                    formData.no,
                    formData.kodePos,
                ],
            });
        } else {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'updateAreaMember',
                args: [
                    walletAddress as `0x${string}`,
                    BigInt(initialData?.areaMemberId || 0),
                    formData.provinsi,
                    formData.kabupaten,
                    formData.kecamatan,
                    formData.kelurahan,
                    formData.alamat,
                    formData.rw,
                    formData.rt,
                    formData.no,
                    formData.kodePos,
                ],
            });
        }
    };

    const inputClass = "w-full px-4 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-slate-700 dark:text-slate-200";
    const labelClass = "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2";

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header with gradient */}
                <div className="relative p-6 bg-gradient-to-r from-green-500 to-emerald-600">
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
                    <div className="relative flex items-center gap-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <MapPin className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">
                                {mode === 'create' ? 'Tambah Alamat Baru' : 'Edit Alamat'}
                            </h3>
                            <p className="text-green-100 text-sm">
                                {mode === 'create' ? 'Masukkan informasi alamat member' : 'Perbarui informasi alamat'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Row 1: Provinsi, Kabupaten */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Provinsi</label>
                            <input
                                type="text"
                                value={formData.provinsi}
                                onChange={(e) => setFormData({ ...formData, provinsi: e.target.value })}
                                className={inputClass}
                                placeholder="Jawa Timur"
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Kabupaten/Kota</label>
                            <input
                                type="text"
                                value={formData.kabupaten}
                                onChange={(e) => setFormData({ ...formData, kabupaten: e.target.value })}
                                className={inputClass}
                                placeholder="Surabaya"
                                required
                            />
                        </div>
                    </div>

                    {/* Row 2: Kecamatan, Kelurahan */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Kecamatan</label>
                            <input
                                type="text"
                                value={formData.kecamatan}
                                onChange={(e) => setFormData({ ...formData, kecamatan: e.target.value })}
                                className={inputClass}
                                placeholder="Wonokromo"
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Kelurahan</label>
                            <input
                                type="text"
                                value={formData.kelurahan}
                                onChange={(e) => setFormData({ ...formData, kelurahan: e.target.value })}
                                className={inputClass}
                                placeholder="Ngagel"
                                required
                            />
                        </div>
                    </div>

                    {/* Row 3: Alamat */}
                    <div>
                        <label className={labelClass}>Alamat (Jalan)</label>
                        <input
                            type="text"
                            value={formData.alamat}
                            onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                            className={inputClass}
                            placeholder="Jl. Ngagel Jaya Selatan"
                            required
                        />
                    </div>

                    {/* Row 4: RT, RW, No, Kode Pos */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className={labelClass}>RT</label>
                            <input
                                type="text"
                                value={formData.rt}
                                onChange={(e) => setFormData({ ...formData, rt: e.target.value })}
                                className={inputClass}
                                placeholder="001"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>RW</label>
                            <input
                                type="text"
                                value={formData.rw}
                                onChange={(e) => setFormData({ ...formData, rw: e.target.value })}
                                className={inputClass}
                                placeholder="002"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>No</label>
                            <input
                                type="text"
                                value={formData.no}
                                onChange={(e) => setFormData({ ...formData, no: e.target.value })}
                                className={inputClass}
                                placeholder="123"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Kode Pos</label>
                            <input
                                type="text"
                                value={formData.kodePos}
                                onChange={(e) => setFormData({ ...formData, kodePos: e.target.value })}
                                className={inputClass}
                                placeholder="60283"
                            />
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-3 pt-4">
                        <motion.button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Batal
                        </motion.button>
                        <motion.button
                            type="submit"
                            disabled={isSubmitting || isPending}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {(isSubmitting || isPending) ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Menyimpan...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5" />
                                    {mode === 'create' ? 'Tambah Alamat' : 'Simpan Perubahan'}
                                </>
                            )}
                        </motion.button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}

// AreaMember Delete Modal
interface AreaMemberDeleteModalProps {
    walletAddress: string;
    areaMemberId: number;
    alamat: string;
    onClose: () => void;
    onSuccess: () => void;
}

function AreaMemberDeleteModal({ walletAddress, areaMemberId, alamat, onClose, onSuccess }: AreaMemberDeleteModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const { writeContract, isPending, isSuccess, reset, error } = useWriteContract();

    useEffect(() => {
        if (isSuccess) {
            setIsDeleting(false);
            reset();
            onSuccess();
            onClose();
        }
    }, [isSuccess, reset, onSuccess, onClose]);

    useEffect(() => {
        if (error) {
            setIsDeleting(false);
            console.error('Transaction error:', error);
        }
    }, [error]);

    const handleDelete = () => {
        setIsDeleting(true);
        writeContract({
            address: DIAMOND_ADDRESS as `0x${string}`,
            abi: DIAMOND_ABI,
            functionName: 'deleteAreaMember',
            args: [walletAddress as `0x${string}`, BigInt(areaMemberId)],
        });
    };

    return (
        <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
        >
            <motion.div
                className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 text-center">
                    <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                        <Trash2 className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                        Hapus Alamat?
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-2">
                        Apakah Anda yakin ingin menghapus alamat ini?
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 rounded-lg p-2 mb-6">
                        {alamat}
                    </p>
                    <div className="flex gap-3">
                        <motion.button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            Batal
                        </motion.button>
                        <motion.button
                            onClick={handleDelete}
                            disabled={isDeleting || isPending}
                            className="flex-1 px-4 py-3 bg-red-500 text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {(isDeleting || isPending) ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Menghapus...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-5 h-5" />
                                    Hapus
                                </>
                            )}
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function MemberShow() {
    const navigate = useNavigate();
    const { memberId } = useParams<{ memberId: string }>();
    const { address } = useAccount();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);

    // AreaMember Modal States
    const [showAreaModal, setShowAreaModal] = useState(false);
    const [areaModalMode, setAreaModalMode] = useState<'create' | 'edit'>('create');
    const [editingArea, setEditingArea] = useState<AreaMemberFormData | null>(null);
    const [showAreaDeleteModal, setShowAreaDeleteModal] = useState(false);
    const [deletingArea, setDeletingArea] = useState<{ id: number; alamat: string } | null>(null);

    // Fetch KTP Data by ID
    const { data: blockchainKtp, isLoading: isLoadingKtp, error: errorKtp, refetch: refetchKtp } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getKtpById',
        args: memberId ? [BigInt(memberId)] : undefined,
        query: {
            enabled: !!memberId,
        },
    });

    const ktpData = blockchainKtp as BlockchainKtp | undefined;
    const statusMemberId = ktpData?.statusMemberId;
    const walletAddress = ktpData?.walletAddress;

    // Fetch Status Member Data
    const { data: blockchainStatus, isLoading: isLoadingStatus } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getStatusMemberById',
        args: statusMemberId ? [statusMemberId] : undefined,
        query: {
            enabled: !!statusMemberId,
        },
    });

    // Fetch Jabatan Data
    const { data: jabatanResponse, isLoading: isLoadingJabatan } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getJabatanFromKtp',
        args: memberId ? [BigInt(0), BigInt(10), BigInt(memberId)] : undefined,
        query: {
            enabled: !!memberId,
        },
    });

    // Fetch AreaMember Data
    const { data: areaMemberResponse, isLoading: isLoadingAreaMember, refetch: refetchAreaMember } = useReadContract({
        address: DIAMOND_ADDRESS as `0x${string}`,
        abi: DIAMOND_ABI,
        functionName: 'getAreaMembersByKtp',
        args: walletAddress ? [walletAddress as `0x${string}`, BigInt(0), BigInt(10)] : undefined,
        account: address,
        query: {
            enabled: !!walletAddress && !!address,
        },
    });

    // Write Contract Hook
    const { writeContract, isPending: isWritePending, isSuccess: isWriteSuccess } = useWriteContract();

    // Handle delete success - only navigate if actually deleting
    useEffect(() => {
        if (isWriteSuccess && isDeleting) {
            setIsDeleting(false);
            navigate('/master/member');
        }
    }, [isWriteSuccess, isDeleting, navigate]);

    // Handle verify toggle
    const handleVerifyToggle = async () => {
        if (!walletAddress || !ktpData) return;

        setIsVerifying(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'verifyKtp',
                args: [walletAddress as `0x${string}`, !ktpData.verified],
            });
        } catch (error) {
            console.error('Error toggling verification:', error);
            setIsVerifying(false);
        }
    };

    // Handle verify success
    useEffect(() => {
        if (isWriteSuccess && isVerifying) {
            setIsVerifying(false);
            refetchKtp();
        }
    }, [isWriteSuccess, isVerifying, refetchKtp]);

    // Format Member Data
    const memberData = useMemo((): MemberData | null => {
        if (!blockchainKtp) return null;
        const ktp = blockchainKtp as BlockchainKtp;

        if (ktp.deleted || Number(ktp.ktpId) === 0) return null;

        let statusName = 'Loading...';
        if (blockchainStatus) {
            const status = blockchainStatus as BlockchainStatusMember;
            statusName = status.namaStatus;
        }

        return {
            ktpId: Number(ktp.ktpId),
            statusMemberId: Number(ktp.statusMemberId),
            statusName: statusName,
            nik: ktp.nik,
            nama: ktp.nama,
            gender: ktp.gender === 0 ? 'Pria' : 'Wanita',
            tempatLahir: ktp.tempatLahir,
            tanggalLahir: new Date(Number(ktp.tanggalLahir) * 1000),
            verified: ktp.verified,
            walletAddress: ktp.walletAddress,
            email: ktp.email,
            noHp: ktp.noHp,
            noWa: ktp.noWa,
            bergabungSejak: new Date(Number(ktp.bergabungSejak) * 1000),
            createdAt: new Date(Number(ktp.createdAt) * 1000),
            updatedAt: new Date(Number(ktp.updatedAt) * 1000),
        };
    }, [blockchainKtp, blockchainStatus]);

    // Format Jabatan Data
    const jabatanList = useMemo((): JabatanData[] => {
        if (!jabatanResponse) return [];
        const [rawJabatan] = jabatanResponse as [BlockchainJabatan[], bigint];
        return rawJabatan
            .filter(j => !j.deleted)
            .map(j => ({
                jabatanId: Number(j.jabatanId),
                namaJabatan: j.namaJabatan,
                keterangan: j.keterangan || '-',
            }));
    }, [jabatanResponse]);

    // Format AreaMember Data
    const areaMemberList = useMemo((): AreaMemberData[] => {
        if (!areaMemberResponse) return [];
        const [rawAreaMember] = areaMemberResponse as [BlockchainAreaMember[], bigint];
        return rawAreaMember
            .filter(a => !a.deleted)
            .map(a => ({
                areaMemberId: Number(a.areaMemberId),
                provinsi: a.provinsi,
                kabupaten: a.kabupaten,
                kecamatan: a.kecamatan,
                kelurahan: a.kelurahan,
                alamat: a.alamat,
                rw: a.rw,
                rt: a.rt,
                no: a.no,
                kodePos: a.kodePos,
            }));
    }, [areaMemberResponse]);

    const isLoading = isLoadingKtp || (!!statusMemberId && isLoadingStatus);
    const notFound = !isLoading && !errorKtp && !memberData;

    const handleDelete = async () => {
        if (!memberData) return;
        setIsDeleting(true);
        try {
            writeContract({
                address: DIAMOND_ADDRESS as `0x${string}`,
                abi: DIAMOND_ABI,
                functionName: 'deleteKtp',
                args: [memberData.walletAddress as `0x${string}`],
            });
        } catch (error) {
            console.error('Error deleting:', error);
            setIsDeleting(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                        <p className="text-slate-600 dark:text-slate-400 font-medium">Memuat detail Pegawai...</p>
                    </motion.div>
                </div>
            </div>
        );
    }

    // Not found state
    if (notFound || !memberData) {
        return (
            <div className="min-h-screen relative overflow-hidden">
                <div className="absolute inset-0 bg-indigo-100/80 dark:bg-slate-900" />
                <div className="relative z-10 flex items-center justify-center min-h-screen">
                    <motion.div
                        className="flex flex-col items-center gap-4 text-center p-8"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                    >
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                            <AlertCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Pegawai Tidak Ditemukan</h2>
                        <p className="text-slate-600 dark:text-slate-400">Data Pegawai dengan ID {memberId} tidak ditemukan.</p>
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

    const detailItems = [
        { label: 'ID Member', value: memberData.ktpId.toString(), icon: Hash, color: 'indigo' },
        { label: 'Nama Lengkap', value: memberData.nama, icon: User, color: 'purple' },
        { label: 'NIK', value: memberData.nik, icon: Hash, color: 'blue' },
        { label: 'Jenis Kelamin', value: memberData.gender, icon: User, color: 'pink' },
        { label: 'Tempat, Tanggal Lahir', value: `${memberData.tempatLahir}, ${formatDate(memberData.tanggalLahir)}`, icon: Calendar, color: 'orange' },
        { label: 'Status Member', value: memberData.statusName, icon: CheckCircle2, color: 'emerald' },
        { label: 'Wallet Address', value: memberData.walletAddress, icon: Wallet, color: 'cyan' },
        { label: 'Email', value: memberData.email, icon: Mail, color: 'red' },
        { label: 'No. HP', value: memberData.noHp, icon: Phone, color: 'green' },
        { label: 'No. WhatsApp', value: memberData.noWa, icon: Phone, color: 'teal' },
        { label: 'Bergabung Sejak', value: formatDate(memberData.bergabungSejak), icon: Calendar, color: 'violet' },
        { label: 'Dibuat', value: formatDateTime(memberData.createdAt), icon: Clock, color: 'slate' },
        { label: 'Diperbarui', value: formatDateTime(memberData.updatedAt), icon: Clock, color: 'gray' },
    ];

    const colorMap: Record<string, { bg: string; text: string; darkBg: string; darkText: string }> = {
        indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', darkBg: 'dark:bg-indigo-900/30', darkText: 'dark:text-indigo-400' },
        purple: { bg: 'bg-purple-100', text: 'text-purple-600', darkBg: 'dark:bg-purple-900/30', darkText: 'dark:text-purple-400' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-600', darkBg: 'dark:bg-blue-900/30', darkText: 'dark:text-blue-400' },
        pink: { bg: 'bg-pink-100', text: 'text-pink-600', darkBg: 'dark:bg-pink-900/30', darkText: 'dark:text-pink-400' },
        orange: { bg: 'bg-orange-100', text: 'text-orange-600', darkBg: 'dark:bg-orange-900/30', darkText: 'dark:text-orange-400' },
        emerald: { bg: 'bg-emerald-100', text: 'text-emerald-600', darkBg: 'dark:bg-emerald-900/30', darkText: 'dark:text-emerald-400' },
        cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600', darkBg: 'dark:bg-cyan-900/30', darkText: 'dark:text-cyan-400' },
        red: { bg: 'bg-red-100', text: 'text-red-600', darkBg: 'dark:bg-red-900/30', darkText: 'dark:text-red-400' },
        green: { bg: 'bg-green-100', text: 'text-green-600', darkBg: 'dark:bg-green-900/30', darkText: 'dark:text-green-400' },
        teal: { bg: 'bg-teal-100', text: 'text-teal-600', darkBg: 'dark:bg-teal-900/30', darkText: 'dark:text-teal-400' },
        violet: { bg: 'bg-violet-100', text: 'text-violet-600', darkBg: 'dark:bg-violet-900/30', darkText: 'dark:text-violet-400' },
        slate: { bg: 'bg-slate-100', text: 'text-slate-600', darkBg: 'dark:bg-slate-900/30', darkText: 'dark:text-slate-400' },
        gray: { bg: 'bg-gray-100', text: 'text-gray-600', darkBg: 'dark:bg-gray-900/30', darkText: 'dark:text-gray-400' },
    };

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Background */}
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
            </div>

            {/* Content Container */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
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
                    <div className="flex items-center justify-between flex-wrap gap-4">
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
                                    Detail Pegawai
                                </h1>
                                <p className="text-slate-500 dark:text-slate-400 mt-1">
                                    {memberData.nama}
                                </p>
                            </div>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                            <motion.button
                                onClick={() => navigate(`/master/member/${memberData.ktpId}/edit`)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-xl shadow-lg shadow-indigo-500/30"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Edit3 className="w-4 h-4" />
                                Edit
                            </motion.button>
                            <motion.button
                                onClick={() => setShowDeleteModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-pink-500 text-white font-medium rounded-xl shadow-lg shadow-red-500/30"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Trash2 className="w-4 h-4" />
                                Hapus
                            </motion.button>
                        </div>
                    </div>
                </motion.div>

                {/* Verification Badge with Toggle */}
                <motion.div
                    className={`mb-6 p-4 backdrop-blur-sm rounded-2xl border flex items-center justify-between ${memberData.verified
                        ? 'bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200/50 dark:border-emerald-500/30'
                        : 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-500/30'
                        }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                >
                    <div className="flex items-center gap-3">
                        {memberData.verified ? (
                            <>
                                <CheckCircle className="w-6 h-6 text-emerald-500" />
                                <div>
                                    <h3 className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Terverifikasi</h3>
                                    <p className="text-sm text-emerald-600 dark:text-emerald-400">Pegawai ini telah diverifikasi dan dapat mengakses aplikasi</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <XCircle className="w-6 h-6 text-amber-500" />
                                <div>
                                    <h3 className="text-sm font-semibold text-amber-700 dark:text-amber-300">Belum Terverifikasi</h3>
                                    <p className="text-sm text-amber-600 dark:text-amber-400">Pegawai ini belum dapat mengakses menu aplikasi</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Toggle Switch */}
                    <motion.button
                        onClick={handleVerifyToggle}
                        disabled={isVerifying || isWritePending}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${memberData.verified
                            ? 'bg-emerald-500'
                            : 'bg-slate-300 dark:bg-slate-600'
                            } ${(isVerifying || isWritePending) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        whileHover={{ scale: (isVerifying || isWritePending) ? 1 : 1.05 }}
                        whileTap={{ scale: (isVerifying || isWritePending) ? 1 : 0.95 }}
                        title={memberData.verified ? 'Klik untuk membatalkan verifikasi' : 'Klik untuk memverifikasi'}
                    >
                        <motion.span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ${(isVerifying || isWritePending) ? 'flex items-center justify-center' : ''
                                }`}
                            animate={{ x: memberData.verified ? 26 : 4 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        >
                            {(isVerifying || isWritePending) && (
                                <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                            )}
                        </motion.span>
                    </motion.button>
                </motion.div>

                {/* Detail Card */}
                <motion.div
                    className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />

                    {/* Animated Sparkles */}
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute pointer-events-none"
                            style={{ top: `${15 + (i * 18)}%`, left: `${10 + (i * 20)}%` }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: [0, 1, 1, 0], scale: [0, 1, 1, 0], rotate: [0, 180] }}
                            transition={{ duration: 3, repeat: Infinity, delay: i * 0.8, ease: 'easeInOut' }}
                        >
                            <Sparkles className="w-4 h-4 text-indigo-400/60 dark:text-indigo-300/40" />
                        </motion.div>
                    ))}

                    {/* Content */}
                    <div className="relative z-10 p-6 md:p-8 space-y-4">
                        {detailItems.map((item, index) => {
                            const colors = colorMap[item.color];
                            return (
                                <motion.div
                                    key={item.label}
                                    className="flex items-start gap-4 p-4 bg-white/50 dark:bg-slate-700/30 rounded-2xl border border-slate-100 dark:border-slate-700/50"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.3 + index * 0.03 }}
                                >
                                    <div className={`p-3 ${colors.bg} ${colors.darkBg} rounded-xl`}>
                                        <item.icon className={`w-5 h-5 ${colors.text} ${colors.darkText}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">
                                            {item.label}
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-slate-700 dark:text-slate-200 break-words">
                                            {item.value}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Jabatan Card - Member's Assigned Jabatan */}
                <motion.div
                    className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50 mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/40 backdrop-blur-md" />
                    <div className="relative z-10 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                                    <Briefcase className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Jabatan Member</h2>
                            </div>
                            <div className="flex gap-2">
                                <motion.button
                                    onClick={() => setShowRoleModal(true)}
                                    className="flex items-center gap-2 px-3 py-2 bg-yellow-500 text-white text-sm font-medium rounded-xl"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    <Shield className="w-4 h-4" />
                                    Manage Roles
                                </motion.button>
                            </div>
                        </div>
                        {isLoadingJabatan ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 text-yellow-500 animate-spin" />
                            </div>
                        ) : jabatanList.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                Belum ada jabatan di-assign ke member ini
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {jabatanList.map((jabatan) => (
                                    <div
                                        key={jabatan.jabatanId}
                                        className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Briefcase className="w-5 h-5 text-yellow-500" />
                                            <div>
                                                <p className="font-semibold text-slate-700 dark:text-slate-200">{jabatan.namaJabatan}</p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">{jabatan.keterangan}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* AreaMember Card - Enhanced */}
                <motion.div
                    className="relative overflow-hidden rounded-3xl border border-slate-200/50 dark:border-slate-700/50"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                >
                    {/* Gradient Background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 via-white/60 to-emerald-50/80 dark:from-green-900/20 dark:via-slate-800/40 dark:to-emerald-900/20 backdrop-blur-md" />

                    <div className="relative z-10 p-6">
                        {/* Header with Add Button */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-lg shadow-green-500/25">
                                    <MapPin className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Alamat</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{areaMemberList.length} alamat terdaftar</p>
                                </div>
                            </div>
                            <motion.button
                                onClick={() => {
                                    setAreaModalMode('create');
                                    setEditingArea(null);
                                    setShowAreaModal(true);
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-xl shadow-lg shadow-green-500/25"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Plus className="w-4 h-4" />
                                Tambah Alamat
                            </motion.button>
                        </div>

                        {/* Content */}
                        {isLoadingAreaMember ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                            </div>
                        ) : areaMemberList.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MapPin className="w-8 h-8 text-green-400" />
                                </div>
                                <p className="text-slate-500 dark:text-slate-400 font-medium">Belum ada alamat</p>
                                <p className="text-sm text-slate-400 dark:text-slate-500">Klik tombol "Tambah Alamat" untuk menambahkan</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {areaMemberList.map((area, index) => (
                                    <motion.div
                                        key={area.areaMemberId}
                                        className="group relative overflow-hidden p-5 bg-white/70 dark:bg-slate-700/50 rounded-2xl border border-green-100 dark:border-green-900/30 hover:border-green-300 dark:hover:border-green-700 transition-all"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                    >
                                        {/* Accent Line */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-400 to-emerald-500 rounded-l-full" />

                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 min-w-0 pl-3">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-xs font-semibold rounded-full">
                                                        Alamat {index + 1}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-slate-800 dark:text-white text-lg truncate">
                                                    {area.alamat} No. {area.no}
                                                </p>
                                                <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                                    RT {area.rt}/RW {area.rw}, {area.kelurahan}, {area.kecamatan}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                                    {area.kabupaten}, {area.provinsi} <span className="font-medium">{area.kodePos}</span>
                                                </p>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <motion.button
                                                    onClick={() => {
                                                        setAreaModalMode('edit');
                                                        setEditingArea({
                                                            areaMemberId: area.areaMemberId,
                                                            provinsi: area.provinsi,
                                                            kabupaten: area.kabupaten,
                                                            kecamatan: area.kecamatan,
                                                            kelurahan: area.kelurahan,
                                                            alamat: area.alamat,
                                                            rw: area.rw,
                                                            rt: area.rt,
                                                            no: area.no,
                                                            kodePos: area.kodePos,
                                                        });
                                                        setShowAreaModal(true);
                                                    }}
                                                    className="p-2.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-800/40 transition-colors"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    title="Edit Alamat"
                                                >
                                                    <Edit3 className="w-4 h-4" />
                                                </motion.button>
                                                <motion.button
                                                    onClick={() => {
                                                        setDeletingArea({
                                                            id: area.areaMemberId,
                                                            alamat: `${area.alamat} No. ${area.no}, ${area.kelurahan}`,
                                                        });
                                                        setShowAreaDeleteModal(true);
                                                    }}
                                                    className="p-2.5 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-800/40 transition-colors"
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    title="Hapus Alamat"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowDeleteModal(false)}
                    >
                        <motion.div
                            className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 text-center">
                                <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                                    <Trash2 className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
                                    Hapus Pegawai?
                                </h3>
                                <p className="text-slate-600 dark:text-slate-400 mb-6">
                                    Apakah Anda yakin ingin menghapus <strong>{memberData.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
                                </p>
                                <div className="flex gap-3">
                                    <motion.button
                                        onClick={() => setShowDeleteModal(false)}
                                        disabled={isDeleting}
                                        className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-2xl"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Batal
                                    </motion.button>
                                    <motion.button
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-2xl disabled:opacity-70"
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

            {/* Role Management Modal */}
            <AnimatePresence>
                {showRoleModal && memberData && (
                    <RoleManagementModal
                        walletAddress={memberData.walletAddress}
                        memberName={memberData.nama}
                        onClose={() => setShowRoleModal(false)}
                    />
                )}
            </AnimatePresence>

            {/* AreaMember Form Modal (Add/Edit) */}
            <AnimatePresence>
                {showAreaModal && walletAddress && (
                    <AreaMemberFormModal
                        walletAddress={walletAddress}
                        mode={areaModalMode}
                        initialData={editingArea || undefined}
                        onClose={() => {
                            setShowAreaModal(false);
                            setEditingArea(null);
                        }}
                        onSuccess={() => {
                            refetchAreaMember();
                        }}
                    />
                )}
            </AnimatePresence>

            {/* AreaMember Delete Modal */}
            <AnimatePresence>
                {showAreaDeleteModal && deletingArea && walletAddress && (
                    <AreaMemberDeleteModal
                        walletAddress={walletAddress}
                        areaMemberId={deletingArea.id}
                        alamat={deletingArea.alamat}
                        onClose={() => {
                            setShowAreaDeleteModal(false);
                            setDeletingArea(null);
                        }}
                        onSuccess={() => {
                            refetchAreaMember();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
