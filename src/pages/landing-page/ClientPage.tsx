'use client';

import React from 'react';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import Web3TransitionSection from './components/Web3TransitionSection';
import SecuritySection from './components/SecuritySection';
import DecentralizedSection from './components/DecentralizedSection';
import CTASection from './components/CTASection';

export default function ClientPage() {
    return (
        <main className="min-h-screen bg-gray-50 dark:bg-slate-900 overflow-x-hidden">
            {/* Hero Section - Full screen introduction with animated background */}
            <HeroSection />

            {/* Features Section - 4 key features */}
            <FeaturesSection />

            {/* Web 2.0 to Web 3.0 Transition */}
            <Web3TransitionSection />

            {/* Blockchain Security */}
            <SecuritySection />

            {/* Decentralized Network */}
            <DecentralizedSection />

            {/* Call to Action */}
            <CTASection />
        </main>
    );
}
