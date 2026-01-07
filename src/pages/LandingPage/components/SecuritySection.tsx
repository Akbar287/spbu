import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Key, FileCheck, Eye, Fingerprint } from 'lucide-react';

const SecuritySection: React.FC = () => {
    const securityFeatures = [
        {
            icon: Lock,
            title: "Enkripsi Kriptografi",
            description: "Setiap transaksi diamankan dengan enkripsi tingkat militer menggunakan algoritma SHA-256.",
        },
        {
            icon: Key,
            title: "Private Key Ownership",
            description: "Hanya pemilik private key yang bisa mengakses dan menandatangani transaksi.",
        },
        {
            icon: FileCheck,
            title: "Smart Contract Audit",
            description: "Kontrak pintar diaudit secara menyeluruh untuk memastikan tidak ada celah keamanan.",
        },
        {
            icon: Eye,
            title: "Transparansi Publik",
            description: "Semua transaksi dapat diverifikasi oleh siapapun di blockchain explorer.",
        },
        {
            icon: Fingerprint,
            title: "Immutable Records",
            description: "Data yang sudah tercatat tidak bisa diubah atau dihapus oleh siapapun.",
        },
        {
            icon: Shield,
            title: "Consensus Mechanism",
            description: "Jaringan validator memastikan hanya transaksi valid yang masuk ke blockchain.",
        },
    ];

    return (
        <section className="relative py-24 overflow-hidden">
            {/* Background - matching HeroSection */}
            <div className="absolute inset-0 bg-purple-100/80 dark:bg-slate-900">
                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Animated shield pattern */}
                <div className="absolute inset-0 opacity-5 dark:opacity-5">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute"
                            style={{
                                left: `${(i % 3) * 40 + 10}%`,
                                top: `${Math.floor(i / 3) * 50 + 10}%`,
                            }}
                            animate={{
                                opacity: [0.3, 0.6, 0.3],
                                scale: [1, 1.1, 1],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                delay: i * 0.5,
                            }}
                        >
                            <Shield className="w-32 h-32 text-violet-500" />
                        </motion.div>
                    ))}
                </div>

                {/* Gradient orbs - matching HeroSection colors */}
                <motion.div
                    className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
                    }}
                    animate={{
                        scale: [1, 1.2, 1],
                        x: [0, 50, 0],
                    }}
                    transition={{ duration: 15, repeat: Infinity }}
                />
                <motion.div
                    className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 60%)',
                    }}
                    animate={{
                        scale: [1.2, 1, 1.2],
                        x: [0, -50, 0],
                    }}
                    transition={{ duration: 12, repeat: Infinity }}
                />

                {/* Floating particles */}
                {[...Array(10)].map((_, i) => (
                    <motion.div
                        key={`particle-${i}`}
                        className="absolute w-2 h-2 rounded-full bg-violet-400/30 dark:bg-violet-400/20"
                        style={{
                            left: `${5 + i * 10}%`,
                            top: `${15 + (i % 4) * 25}%`,
                        }}
                        animate={{
                            y: [0, -40, 0],
                            x: [0, i % 2 === 0 ? 25 : -25, 0],
                            opacity: [0.2, 0.6, 0.2],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 5 + i * 0.5,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 text-sm font-medium mb-4">
                        Keamanan Maksimal
                    </span>
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                        Dilindungi oleh{' '}
                        <span className="bg-gradient-to-r from-emerald-600 to-cyan-600 dark:from-emerald-400 dark:to-cyan-400 bg-clip-text text-transparent">
                            Teknologi Blockchain
                        </span>
                    </h2>
                    <p className="text-lg text-slate-600 dark:text-white/60 max-w-2xl mx-auto">
                        Keamanan data SPBU Anda adalah prioritas utama kami. Blockchain menyediakan lapisan keamanan yang tidak dapat ditembus.
                    </p>
                </motion.div>

                {/* Main Shield Visual */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="relative mb-16"
                >
                    <div className="flex justify-center">
                        <div className="relative">
                            {/* Outer glow */}
                            <motion.div
                                className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 blur-3xl opacity-30"
                                animate={{
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{ duration: 3, repeat: Infinity }}
                            />
                            {/* Shield icon */}
                            <div className="relative w-40 h-40 rounded-full bg-gradient-to-br from-emerald-100 to-cyan-100 dark:from-emerald-500/20 dark:to-cyan-500/20 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center">
                                <motion.div
                                    animate={{
                                        rotateY: [0, 360],
                                    }}
                                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                                >
                                    <Shield className="w-20 h-20 text-emerald-500 dark:text-emerald-400" />
                                </motion.div>
                            </div>
                            {/* Orbiting elements */}
                            {[0, 60, 120, 180, 240, 300].map((degree, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute w-3 h-3 bg-emerald-500 dark:bg-emerald-400 rounded-full"
                                    style={{
                                        top: '50%',
                                        left: '50%',
                                    }}
                                    animate={{
                                        x: [
                                            Math.cos((degree * Math.PI) / 180) * 100,
                                            Math.cos(((degree + 360) * Math.PI) / 180) * 100,
                                        ],
                                        y: [
                                            Math.sin((degree * Math.PI) / 180) * 100,
                                            Math.sin(((degree + 360) * Math.PI) / 180) * 100,
                                        ],
                                    }}
                                    transition={{
                                        duration: 10,
                                        repeat: Infinity,
                                        ease: "linear",
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Security Features Grid */}
                <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    {securityFeatures.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.03, y: -5 }}
                            className="group p-6 rounded-2xl bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30 shadow-lg shadow-slate-200/50 dark:shadow-none transition-all duration-300"
                        >
                            <div className="flex items-start gap-4">
                                <motion.div
                                    className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/20 transition-colors"
                                    whileHover={{ rotate: 10 }}
                                >
                                    <feature.icon className="w-6 h-6 text-emerald-500 dark:text-emerald-400" />
                                </motion.div>
                                <div>
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                                    <p className="text-sm text-slate-600 dark:text-white/50 leading-relaxed">{feature.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};

export default SecuritySection;
