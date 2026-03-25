// This file defines TypeScript types and interfaces used in the application.

export interface Course {
    id: string;
    title: string;
    description: string;
    price: number;
    isOnline: boolean;
    duration: string; // e.g., "2 hours", "1 week"
}

export interface Project {
    id: string;
    name: string;
    description: string;
    status: 'ongoing' | 'completed' | 'pending';
    clientId: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user' | 'client';
}

export interface Payment {
    id: string;
    amount: number;
    courseId: string;
    userId: string;
    status: 'pending' | 'completed' | 'failed';
    createdAt: Date;
}

export interface PortfolioProject {
    id: number | string;
    title: string;
    slug: string;
    description: string;
    client_name?: string;
    completion_date?: string;
    category: string;
    location?: string;
    duration?: string;
    status?: string;
    cover_image?: string;
    images?: string[]; 
    is_published?: boolean;
    featured?: boolean;
}