'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const Dashboard = () => {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && user) {
            // Redirection selon le rôle
            const role = user.role || user.roles?.[0]?.slug;

            switch (role) {
                case 'admin':
                case 'secretaire':
                    router.replace('/doublemb/dashboard');
                    break;
                case 'formateur':
                    router.replace('/formateur/dashboard');
                    break;
                case 'chef_chantier':
                    router.replace('/chef-chantier/dashboard');
                    break;
                case 'apprenant':
                    router.replace('/apprenant/dashboard');
                    break;
                case 'client':
                    router.replace('/client');
                    break;
                default:
                    // Fallback basic dashboard if no specific role
                    break;
            }
        } else if (!isLoading && !user) {
            router.replace('/connexion');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-madiba-red" />
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
            <p>Redirection en cours...</p>
        </div>
    );
};

export default Dashboard;
