import React from 'react';
import { motion } from 'framer-motion';
import { Fuel, Truck, Route, ClipboardList, Sparkles, Zap, ArrowRight } from 'lucide-react';

interface Feature {
    icon: React.ElementType;
    title: string;
    description: string;
    gradient: string;
    iconBg: string;
    delay: number;
}

const features: Feature[] = [
    {
        icon: Fuel,
        title: "Pencatatan Penjualan Minyak",
        description: "Setiap transaksi penjualan BBM tercatat secara real-time di blockchain. Data tidak bisa dimanipulasi dan dapat diaudit kapan saja.",
        gradient: "from-amber-500 to-orange-600",
        iconBg: "from-amber-400 to-orange-500",
        delay: 0,
    },
    {
        icon: Truck,
        title: "Pemesanan Minyak ke Pertamina",
        description: "Smart contract otomatis memproses pemesanan ke Pertamina. Transparansi penuh dari order hingga delivery tanpa intervensi manual.",
        gradient: "from-blue-500 to-cyan-600",
        iconBg: "from-blue-400 to-cyan-500",
        delay: 0.15,
    },
    {
        icon: Route,
        title: "Track Supply Chain",
        description: "Lacak perjalanan BBM dari depot hingga SPBU. Setiap tahap tercatat dengan timestamp dan verifikasi yang tidak dapat diubah.",
        gradient: "from-emerald-500 to-teal-600",
        iconBg: "from-emerald-400 to-teal-500",
        delay: 0.3,
    },
    {
        icon: ClipboardList,
        title: "Pencatatan Dombak per Shift",
        description: "Data dombak (daftar omzet dan bahan bakar) setiap shift tersimpan aman di blockchain. Rekonsiliasi jadi mudah dan akurat.",
        gradient: "from-violet-500 to-purple-600",
        iconBg: "from-violet-400 to-purple-500",
        delay: 0.45,
    },
];

const FeaturesSection: React.FC = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15,
                delayChildren: 0.2,
            },
        },
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 50, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                type: "spring" as const,
                stiffness: 100,
                damping: 15,
            },
        },
    };

    return (
        <section className="relative py-24 lg:py-32 overflow-hidden">
            {/* Animated Background - matching HeroSection */}
            <div className="absolute inset-0 bg-purple-100/80 dark:bg-slate-900">
                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)`,
                        backgroundSize: '50px 50px',
                    }}
                />

                {/* Large animated gradient orbs */}
                <motion.div
                    className="absolute top-1/4 left-0 w-[600px] h-[600px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
                    }}
                    animate={{
                        x: [0, 100, 0],
                        y: [0, -50, 0],
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-1/4 right-0 w-[500px] h-[500px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 60%)',
                    }}
                    animate={{
                        x: [0, -80, 0],
                        y: [0, 60, 0],
                        scale: [1.2, 1, 1.2],
                        opacity: [0.4, 0.2, 0.4],
                    }}
                    transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
                    style={{
                        background: 'radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
                    }}
                    animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, 180, 360],
                    }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                />

                {/* Floating particles */}
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 rounded-full bg-violet-400/30 dark:bg-violet-400/20"
                        style={{
                            left: `${10 + i * 12}%`,
                            top: `${20 + (i % 3) * 30}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            x: [0, i % 2 === 0 ? 20 : -20, 0],
                            opacity: [0.3, 0.7, 0.3],
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 4 + i * 0.5,
                            repeat: Infinity,
                            delay: i * 0.3,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4">
                {/* Section Header with continuous animations */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <motion.span
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-300 text-sm font-medium mb-4"
                        animate={{ scale: [1, 1.03, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <motion.span
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        >
                            <Sparkles className="w-4 h-4" />
                        </motion.span>
                        Fitur Unggulan
                    </motion.span>

                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                        Kelola SPBU dengan{' '}
                        <motion.span
                            className="bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 dark:from-violet-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto]"
                            animate={{ backgroundPosition: ['0%', '100%', '0%'] }}
                            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        >
                            Teknologi Terdepan
                        </motion.span>
                    </h2>

                    <motion.p
                        className="text-lg text-slate-600 dark:text-white/60 max-w-2xl mx-auto"
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        Empat pilar utama yang membuat manajemen SPBU Anda lebih efisien, transparan, dan aman.
                    </motion.p>
                </motion.div>

                {/* Features Grid with rich animations */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-100px" }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8"
                >
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            variants={cardVariants}
                            whileHover={{
                                scale: 1.02,
                                y: -8,
                                transition: { type: "spring" as const, stiffness: 300 }
                            }}
                            whileTap={{ scale: 0.98 }}
                            className="group relative p-8 rounded-3xl bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/10 shadow-xl shadow-slate-200/50 dark:shadow-none cursor-pointer overflow-hidden"
                        >
                            {/* Animated gradient border */}
                            <motion.div
                                className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                                style={{
                                    background: `linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.3), transparent)`,
                                    backgroundSize: '200% 100%',
                                }}
                                animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />

                            {/* Hover glow effect */}
                            <motion.div
                                className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 dark:group-hover:opacity-10 transition-opacity duration-300`}
                            />

                            {/* Continuous shimmer effect */}
                            <motion.div
                                className="absolute inset-0 rounded-3xl pointer-events-none"
                                style={{
                                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.1) 45%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 55%, transparent 60%)',
                                    backgroundSize: '200% 100%',
                                }}
                                initial={{ backgroundPosition: '-100% 0' }}
                                animate={{ backgroundPosition: ['200% 0', '-100% 0'] }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    repeatDelay: 2,
                                    delay: feature.delay * 2,
                                }}
                            />

                            <div className="relative z-10">
                                {/* Animated Icon Container */}
                                <motion.div
                                    className={`relative inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.iconBg} shadow-lg mb-6`}
                                    animate={{
                                        boxShadow: [
                                            '0 4px 15px rgba(139, 92, 246, 0.2)',
                                            '0 8px 25px rgba(139, 92, 246, 0.4)',
                                            '0 4px 15px rgba(139, 92, 246, 0.2)',
                                        ],
                                    }}
                                    transition={{ duration: 2, repeat: Infinity, delay: feature.delay }}
                                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                                >
                                    <feature.icon className="w-8 h-8 text-white" />

                                    {/* Icon pulse effect */}
                                    <motion.div
                                        className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${feature.iconBg}`}
                                        animate={{
                                            scale: [1, 1.5, 1.5],
                                            opacity: [0.6, 0, 0],
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: feature.delay + 0.5,
                                        }}
                                    />

                                    {/* Sparkle indicator */}
                                    <motion.div
                                        className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"
                                        animate={{
                                            scale: [1, 1.3, 1],
                                            opacity: [0.8, 1, 0.8],
                                        }}
                                        transition={{ duration: 1.5, repeat: Infinity, delay: feature.delay }}
                                    />
                                </motion.div>

                                {/* Title with subtle animation */}
                                <motion.h3
                                    className="text-xl font-semibold text-slate-900 dark:text-white mb-3 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors"
                                    initial={{ x: 0 }}
                                    whileHover={{ x: 5 }}
                                >
                                    {feature.title}
                                </motion.h3>

                                {/* Description */}
                                <p className="text-slate-600 dark:text-white/60 leading-relaxed">
                                    {feature.description}
                                </p>

                                {/* Animated learn more link */}
                                <motion.div
                                    className="mt-6 flex items-center gap-2 text-sm font-medium"
                                    initial={{ opacity: 0, x: -10 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: feature.delay + 0.3 }}
                                >
                                    <motion.span
                                        className={`bg-gradient-to-r ${feature.gradient} bg-clip-text text-transparent`}
                                        animate={{ opacity: [0.7, 1, 0.7] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        Pelajari fitur ini
                                    </motion.span>
                                    <motion.div
                                        animate={{ x: [0, 5, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        <ArrowRight className={`w-4 h-4 bg-gradient-to-r ${feature.gradient} bg-clip-text`} style={{ color: 'currentColor' }} />
                                    </motion.div>
                                </motion.div>

                                {/* Corner sparkle on hover */}
                                <motion.div
                                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100"
                                    initial={{ rotate: 0, scale: 0 }}
                                    whileHover={{ rotate: 180, scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <Sparkles className="w-5 h-5 text-violet-400" />
                                </motion.div>
                            </div>

                            {/* Animated corner accent */}
                            <motion.div
                                className={`absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl ${feature.gradient} opacity-5 rounded-tl-full`}
                                animate={{
                                    scale: [1, 1.2, 1],
                                    opacity: [0.05, 0.1, 0.05],
                                }}
                                transition={{ duration: 3, repeat: Infinity, delay: feature.delay }}
                            />
                        </motion.div>
                    ))}
                </motion.div>

                {/* Bottom animated elements */}
                <motion.div
                    className="mt-16 flex justify-center items-center gap-4"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                >
                    <motion.div
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100/50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20"
                        animate={{ scale: [1, 1.02, 1], y: [0, -2, 0] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        >
                            <Zap className="w-4 h-4 text-violet-500" />
                        </motion.div>
                        <span className="text-sm text-violet-600 dark:text-violet-300 font-medium">Powered by Blockchain</span>
                    </motion.div>
                </motion.div>

                {/* Bottom gradient line */}
                <motion.div
                    initial={{ opacity: 0, scaleX: 0 }}
                    whileInView={{ opacity: 1, scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="mt-12 h-px bg-gradient-to-r from-transparent via-violet-300 dark:via-violet-500/30 to-transparent"
                />
            </div>
        </section>
    );
};

export default FeaturesSection;
