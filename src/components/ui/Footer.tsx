'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { COMPANY_INFO, getCopyrightText, getYearsOfExperience } from '@/lib/company-info';
import { usePublicSettings } from '@/contexts/PublicSettingsContext';

interface SocialLinks {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    youtube?: string;
    whatsapp?: string;
}

const Footer = () => {
    const { settings } = usePublicSettings();

    const socialLinks: SocialLinks = useMemo(() => ({
        facebook: settings.facebook_url || COMPANY_INFO.social.facebook,
        instagram: settings.instagram_url || COMPANY_INFO.social.instagram,
        linkedin: settings.linkedin_url || COMPANY_INFO.social.linkedin,
        twitter: settings.twitter_url || COMPANY_INFO.social.twitter,
        youtube: settings.youtube_url || COMPANY_INFO.social.youtube,
        whatsapp: settings.whatsapp_number || COMPANY_INFO.social.whatsapp,
    }), [settings]);

    const companyName = settings.company_short_name || settings.company_name || COMPANY_INFO.name;
    const companySlogan = settings.company_slogan || COMPANY_INFO.slogans.main;
    const companyAddress = settings.address || COMPANY_INFO.address;
    const companyPhone = settings.phone || COMPANY_INFO.phone;
    const companyEmail = settings.email || COMPANY_INFO.email;

    const yearFounded = Number(settings.company_year_founded || COMPANY_INFO.foundedYear || 0);
    const yearsOfExperience = yearFounded ? new Date().getFullYear() - yearFounded : getYearsOfExperience();

    const getWhatsAppLink = (value: string) => {
        return /^https?:\/\//i.test(value) ? value : `https://wa.me/${value.replace(/\D/g, '')}`;
    };

    return (
        <footer className="bg-gray-50 dark:bg-madiba-black border-t border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 transition-colors duration-300">
            <div className="container mx-auto px-6 md:px-12 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    {/* Company Info */}
                    <div>
                        <Link href="/" className="inline-block mb-4">
                            <span className="text-2xl font-extrabold text-madiba-black dark:text-white">{companyName}</span>
                        </Link>
                        <p className="text-sm mb-4">
                            {companySlogan} Plus de {yearsOfExperience} ans d&apos;excellence au service de vos projets.
                        </p>
                        <div className="flex gap-4">
                            {/* Facebook */}
                            {socialLinks.facebook && (
                                <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" title="Facebook" className="text-gray-400 hover:text-madiba-red transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
                                    </svg>
                                </a>
                            )}
                            {/* Twitter/X */}
                            {socialLinks.twitter && (
                                <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" title="X (Twitter)" className="text-gray-400 hover:text-madiba-red transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                                    </svg>
                                </a>
                            )}
                            {/* Instagram */}
                            {socialLinks.instagram && (
                                <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram" className="text-gray-400 hover:text-madiba-red transition-colors">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                    </a>
                )}
                {/* LinkedIn */}
                {socialLinks.linkedin && (
                    <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn" className="text-gray-400 hover:text-madiba-red transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                    </a>
                )}
                {/* YouTube */}
                {socialLinks.youtube && (
                    <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube" title="YouTube" className="text-gray-400 hover:text-madiba-red transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                    </a>
                )}
                {/* WhatsApp */}
                {socialLinks.whatsapp && (
                    <a href={getWhatsAppLink(socialLinks.whatsapp)} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" title="WhatsApp" className="text-gray-400 hover:text-green-500 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                    </a>
                )}
            </div>
        </div>

        {/* Quick Links */}
        <div>
            <h3 className="text-madiba-black dark:text-white font-semibold mb-4">Navigation</h3>
            <ul className="space-y-3 text-sm">
                <li>
                    <Link href="/" className="hover:text-madiba-red transition-colors">
                        Accueil
                    </Link>
                </li>
                <li>
                    <Link href="/about" className="hover:text-madiba-red transition-colors">
                        À propos
                    </Link>
                </li>
                <li>
                    <Link href="/services" className="hover:text-madiba-red transition-colors">
                        Services
                    </Link>
                </li>
                <li>
                    <Link href="/portfolio" className="hover:text-madiba-red transition-colors">
                        Portfolio
                    </Link>
                </li>
                <li>
                    <Link href="/training" className="hover:text-madiba-red transition-colors">
                        Formations
                    </Link>
                </li>
                <li>
                    <Link href="/contact" className="hover:text-madiba-red transition-colors">
                        Contact
                    </Link>
                </li>
                <li>
                    <Link href="/faq" className="hover:text-madiba-red transition-colors">
                        FAQ
                    </Link>
                </li>
            </ul>
        </div>

        {/* Nos Services */}
        <div>
            <h3 className="text-madiba-black dark:text-white font-semibold mb-4">Nos Services</h3>
            <ul className="space-y-3 text-sm">
                <li>
                    <Link href="/services#construction" className="hover:text-madiba-red transition-colors">
                        Construction résidentielle
                    </Link>
                </li>
                <li>
                    <Link href="/services#commercial" className="hover:text-madiba-red transition-colors">
                        Construction commerciale
                    </Link>
                </li>
                <li>
                    <Link href="/services#renovation" className="hover:text-madiba-red transition-colors">
                        Rénovation
                    </Link>
                </li>
                <li>
                    <Link href="/training" className="hover:text-madiba-red transition-colors">
                        Formation BTP
                    </Link>
                </li>
                <li>
                    <Link href="/activities" className="hover:text-madiba-red transition-colors">
                        Activités Secondaires
                    </Link>
                </li>
            </ul>
        </div>

        {/* Contact info list */}
        <div>
            <h3 className="text-madiba-black dark:text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-madiba-red flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{companyAddress}</span>
                </li>
                <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-madiba-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${String(companyPhone).replace(/\s/g, '')}`} className="hover:text-madiba-red transition-colors">
                        {companyPhone}
                    </a>
                </li>
                <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-madiba-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href={`mailto:${companyEmail}`} className="hover:text-madiba-red transition-colors">
                        {companyEmail}
                    </a>
                </li>
            </ul>
        </div>
    </div>

    {/* Bottom Bar */}
    <div className="pt-8 border-t border-gray-200 dark:border-gray-800">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">
                {getCopyrightText()}
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 text-sm">
                <button 
                    onClick={() => window.dispatchEvent(new Event('open_cookie_preferences'))}
                    className="hover:text-madiba-red transition-colors flex items-center gap-1.5"
                    aria-label="Gérer les cookies"
                    title="Gérer les cookies"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.5-12a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm4.5 4a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm-6 3a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                    <span>Cookies</span>
                </button>
                <Link href="/privacy-policy" className="hover:text-madiba-red transition-colors">
                    Politique de confidentialité
                </Link>
                <Link href="/mentions-legales" className="hover:text-madiba-red transition-colors">
                    Mentions légales
                </Link>
                <Link href="/cgu" className="hover:text-madiba-red transition-colors">
                    CGU
                </Link>
                <Link href="/cgv" className="hover:text-madiba-red transition-colors">
                    CGV
                </Link>
            </div>
        </div>
    </div>
</div>
</footer>
);
};

export default Footer;
