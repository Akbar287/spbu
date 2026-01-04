import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Blocks, CheckCircle2, Sparkles } from 'lucide-react';

const CTASection: React.FC = () => {
    const benefits = [
        "Transparansi data 100%",
        "Keamanan tingkat enterprise",
        "Audit trail lengkap",
        "Integrasi mudah",
    ];

    return (
        <section className="relative py-24 overflow-hidden">
            {/* Animated background - matching HeroSection */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-purple-100/80 dark:bg-slate-900" />

                {/* Grid pattern */}
                <div
                    className="absolute inset-0 opacity-[0.02] dark:opacity-[0.05]"
                    style={{
                        backgroundImage: `linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
                                          linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)`,
                        backgroundSize: '60px 60px',
                    }}
                />

                {/* Animated gradient orbs */}
                <motion.div
                    className="absolute top-0 left-0 w-full h-full"
                    style={{
                        background: 'radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
                    }}
                    animate={{
                        opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                />
                <motion.div
                    className="absolute top-0 left-0 w-full h-full"
                    style={{
                        background: 'radial-gradient(circle at 80% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
                    }}
                    animate={{
                        opacity: [0.8, 0.5, 0.8],
                    }}
                    transition={{ duration: 5, repeat: Infinity }}
                />

                {/* Floating particles */}
                {[...Array(10)].map((_, i) => (
                    <motion.div
                        key={`particle-${i}`}
                        className="absolute w-2 h-2 rounded-full bg-violet-400/30 dark:bg-violet-400/20"
                        style={{
                            left: `${10 + i * 9}%`,
                            top: `${15 + (i % 4) * 22}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            x: [0, i % 2 === 0 ? 15 : -15, 0],
                            opacity: [0.2, 0.5, 0.2],
                            scale: [1, 1.3, 1],
                        }}
                        transition={{
                            duration: 4 + i * 0.5,
                            repeat: Infinity,
                            delay: i * 0.35,
                            ease: "easeInOut",
                        }}
                    />
                ))}

                {/* Floating blockchain icons */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute"
                        style={{
                            left: `${15 + i * 15}%`,
                            top: `${20 + (i % 3) * 30}%`,
                        }}
                        animate={{
                            y: [-10, 10, -10],
                            rotate: [0, 10, -10, 0],
                            opacity: [0.1, 0.3, 0.1],
                        }}
                        transition={{
                            duration: 5 + i,
                            repeat: Infinity,
                            delay: i * 0.5,
                        }}
                    >
                        <Blocks className="w-12 h-12 text-violet-400/30 dark:text-violet-500/30" />
                    </motion.div>
                ))}
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-6"
                >
                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-100 to-cyan-100 dark:from-violet-500/20 dark:to-cyan-500/20 border border-violet-300 dark:border-violet-500/30 text-violet-700 dark:text-white text-sm font-medium">
                        <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400" />
                        Siap untuk Revolusi Digital?
                    </span>
                </motion.div>

                {/* Main Heading */}
                <motion.h2
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight"
                >
                    Bergabung dengan <br />
                    <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-cyan-600 dark:from-violet-400 dark:via-purple-400 dark:to-cyan-400 bg-clip-text text-transparent">
                        Masa Depan
                    </span>
                    <br />
                    Manajemen SPBU
                </motion.h2>

                {/* Description */}
                <motion.p
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-slate-600 dark:text-white/60 mb-10 max-w-2xl mx-auto"
                >
                    Jadilah bagian dari revolusi blockchain dalam industri energi.
                    Tingkatkan efisiensi, transparansi, dan kepercayaan pelanggan dengan teknologi terdepan.
                </motion.p>

                {/* Benefits */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap justify-center gap-4 mb-12"
                >
                    {benefits.map((benefit, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none"
                        >
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                            <span className="text-slate-700 dark:text-white/80 text-sm">{benefit}</span>
                        </motion.div>
                    ))}
                </motion.div>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                        <Button
                            size="lg"
                            className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-10 py-7 text-lg rounded-2xl shadow-2xl shadow-violet-500/30 group"
                        >
                            {/* Glow effect */}
                            <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-violet-400 to-cyan-400 opacity-0 group-hover:opacity-20 transition-opacity"
                                animate={{
                                    x: ['-100%', '100%'],
                                }}
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    repeatDelay: 1,
                                }}
                            />
                            <span className="relative flex items-center gap-2">
                                Implementasi Sekarang
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Button>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};

export default CTASection;
