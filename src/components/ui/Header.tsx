'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CircleUserRound } from 'lucide-react';
import { ModeToggle } from './ModeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { usePublicSettings } from '@/contexts/PublicSettingsContext';

const Header = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { settings } = usePublicSettings();
    const { user } = useAuth();
    const brandShortName = settings.company_short_name || 'MBC';
    const brandFullName = settings.company_name || 'Madiba Building Construction';

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const accountHref = user ? ({
        admin: '/doublemb/dashboard',
        secretaire: '/secretaire/dashboard',
        chef_chantier: '/chef-chantier/dashboard',
        formateur: '/formateur/dashboard',
        apprenant: '/apprenant/dashboard',
        client: '/client',
    }[user.role] || '/dashboard') : '/connexion';

    const accountLabel = user ? 'Mon compte' : 'Connexion';

    return (
        <header className="bg-white dark:bg-madiba-black border-b border-gray-100 dark:border-gray-800 text-madiba-black dark:text-gray-100 absolute top-0 w-full z-50 transition-colors duration-300">
            <div className="container mx-auto px-6 md:px-12 py-6 flex justify-between items-center">
                <Link href="/" className="flex items-center gap-2">
                    {/* Visual match: Bold font for MBC */}
                    <div className="flex flex-col leading-none">
                        <span className="text-2xl md:text-3xl font-extrabold tracking-tighter font-sans text-madiba-black dark:text-white">
                            {brandShortName}
                        </span>
                        <span className="text-[8px] md:text-[10px] font-medium tracking-[0.2em] text-madiba-red uppercase text-nowrap">
                            {brandFullName}
                        </span>
                    </div>
                </Link>

                {/* Desktop Nav - Matching spacing and font weight from design */}
                <nav className="hidden md:flex items-center gap-8">
                    <ul className="flex space-x-8 lg:space-x-12 text-base font-medium text-gray-800 dark:text-gray-200 items-center">
                        {/* Design shows simple text links */}
                        <li>
                            <Link href="/about" className="block hover:text-madiba-red transition-colors whitespace-nowrap">
                                À propos
                            </Link>
                        </li>
                        <li>
                            <Link href="/services" className="block hover:text-madiba-red transition-colors whitespace-nowrap">
                                Services
                            </Link>
                        </li>
                        <li>
                            <Link href="/portfolio" className="block hover:text-madiba-red transition-colors whitespace-nowrap">
                                Portfolio
                            </Link>
                        </li>
                        <li>
                            <Link href="/contact" className="block hover:text-madiba-red transition-colors whitespace-nowrap">
                                Contact
                            </Link>
                        </li>
                        <li>
                            <Link
                                href="/training"
                                className="block bg-madiba-red hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap"
                            >
                                Formations
                            </Link>
                        </li>
                    </ul>

                    <div className="flex items-center gap-3">
                        <Link
                            href={accountHref}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:border-madiba-red hover:text-madiba-red dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-madiba-red dark:hover:text-madiba-red"
                            title={accountLabel}
                            aria-label={accountLabel}
                        >
                            <CircleUserRound className="h-5 w-5" />
                        </Link>

                        {/* Dark Mode Toggle */}
                        <ModeToggle />
                    </div>
                </nav>

                {/* Mobile Menu Button - Dark color for light theme */}
                <div className="flex items-center gap-4 md:hidden">
                    <Link
                        href={accountHref}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:border-madiba-red hover:text-madiba-red dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-madiba-red dark:hover:text-madiba-red"
                        title={accountLabel}
                        aria-label={accountLabel}
                    >
                        <CircleUserRound className="h-5 w-5" />
                    </Link>
                    <ModeToggle />
                    <button
                        onClick={toggleMobileMenu}
                        className="text-madiba-black dark:text-white focus:outline-none"
                    >
                        {isMobileMenuOpen ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-madiba-black border-t border-gray-100 dark:border-gray-800 absolute w-full left-0 shadow-lg animate-in slide-in-from-top-2 duration-200">
                    <nav className="flex flex-col px-6 py-4 gap-4">
                        <Link
                            href="/about"
                            className="text-lg font-medium text-gray-800 dark:text-gray-200 hover:text-madiba-red py-2 border-b border-gray-100 dark:border-gray-800"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            À propos
                        </Link>
                        <Link
                            href="/services"
                            className="text-lg font-medium text-gray-800 dark:text-gray-200 hover:text-madiba-red py-2 border-b border-gray-100 dark:border-gray-800"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Services
                        </Link>
                        <Link
                            href="/portfolio"
                            className="text-lg font-medium text-gray-800 dark:text-gray-200 hover:text-madiba-red py-2 border-b border-gray-100 dark:border-gray-800"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Portfolio
                        </Link>
                        <Link
                            href="/contact"
                            className="text-lg font-medium text-gray-800 dark:text-gray-200 hover:text-madiba-red py-2 border-b border-gray-100 dark:border-gray-800"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Contact
                        </Link>
                        <Link
                            href="/training"
                            className="text-lg font-medium text-madiba-red font-semibold py-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            Formations
                        </Link>
                        <Link
                            href={accountHref}
                            className="text-lg font-medium text-gray-800 dark:text-gray-200 hover:text-madiba-red py-2 border-t border-gray-100 dark:border-gray-800"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            {accountLabel}
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
};

export default Header;
