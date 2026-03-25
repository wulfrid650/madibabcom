'use client';

import { useState, useEffect } from 'react';
import { api, SiteSettings, Service, Formation, PortfolioProject, Testimonial } from '@/lib/api';

interface HomepageData {
    company: {
        name: string;
        slogan: string;
        description?: string;
    };
    hero: {
        title: string;
        subtitle: string;
        image?: string;
        cta_text: string;
    };
    stats: {
        projects_completed: number;
        years_experience: number;
        happy_clients: number;
        trained_students: number;
    };
    services: Service[];
    formations: Formation[];
    portfolio: PortfolioProject[];
    testimonials: Testimonial[];
    contact: {
        phone?: string;
        email?: string;
        address?: string;
    };
    social: Record<string, string>;
}

interface UseHomepageDataResult {
    data: HomepageData | null;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook pour récupérer toutes les données de la page d'accueil
 * Gère le cache, le loading et les erreurs
 */
export function useHomepageData(): UseHomepageDataResult {
    const [data, setData] = useState<HomepageData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            const result = await api.getHomepageData();
            setData(result);
        } catch (err) {
            console.error('Erreur lors du chargement des données:', err);
            setError(err instanceof Error ? err.message : 'Erreur de chargement');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return { data, isLoading, error, refetch: fetchData };
}

/**
 * Hook pour récupérer les services
 */
export function useServices() {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                const result = await api.getServices();
                setServices(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur');
            } finally {
                setIsLoading(false);
            }
        };
        fetchServices();
    }, []);

    return { services, isLoading, error };
}

/**
 * Hook pour récupérer les formations
 */
export function useFormations() {
    const [formations, setFormations] = useState<Formation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchFormations = async () => {
            try {
                const result = await api.getFormations();
                setFormations(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFormations();
    }, []);

    return { formations, isLoading, error };
}

/**
 * Hook pour récupérer le portfolio
 */
export function usePortfolio() {
    const [projects, setProjects] = useState<PortfolioProject[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPortfolio = async () => {
            try {
                const result = await api.getPortfolio();
                setProjects(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur');
            } finally {
                setIsLoading(false);
            }
        };
        fetchPortfolio();
    }, []);

    return { projects, isLoading, error };
}

/**
 * Hook pour récupérer les témoignages
 */
export function useTestimonials() {
    const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTestimonials = async () => {
            try {
                const result = await api.getTestimonials();
                setTestimonials(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur');
            } finally {
                setIsLoading(false);
            }
        };
        fetchTestimonials();
    }, []);

    return { testimonials, isLoading, error };
}

/**
 * Hook pour récupérer les paramètres du site
 */
export function useSiteSettings() {
    const [settings, setSettings] = useState<SiteSettings | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const result = await api.getSettings();
                setSettings(result);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Erreur');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    return { settings, isLoading, error };
}
