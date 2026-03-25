import React from 'react';
import Header from '@/components/ui/Header';
import Footer from '@/components/ui/Footer';
import { PublicSettingsProvider } from '@/contexts/PublicSettingsContext';

const Layout = ({ children }: { children: React.ReactNode }) => {
    return (
        <PublicSettingsProvider>
            <div className="flex flex-col min-h-screen">
                <Header />
                <main className="flex-grow">{children}</main>
                <Footer />
            </div>
        </PublicSettingsProvider>
    );
};

export default Layout;
