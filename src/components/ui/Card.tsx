import React from 'react';
import Link from 'next/link';

interface CardProps {
    title: string;
    description: string;
    imageUrl?: string;
    link?: string;
    className?: string;
}

const Card: React.FC<CardProps> = ({ title, description, imageUrl, link, className = '' }) => {
    // Determine base styles - default to white/light if not overridden, or transparent if we rely on className entirely.
    // However, to keep it simple, let's use a "clean" base that works well with the light theme shown in the maquette.
    
    // We remove hardcoded bg-gray-900 and text-white to allow className to control it, 
    // OR we default to a white card style.
    
    // Let's go with a default 'white card' style that can be overridden.
    const baseClasses = "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden hover:shadow-lg transition-all group h-full";
    
    const CardContent = () => (
        <div className={`${baseClasses} ${className}`}>
            {imageUrl && (
                <div className="relative aspect-video overflow-hidden">
                    <img 
                        src={imageUrl} 
                        alt={title} 
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                    />
                </div>
            )}
            <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-madiba-red transition-colors">
                    {title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    {description}
                </p>
                {link && (
                    <span className="inline-block mt-4 text-sm font-semibold text-madiba-red hover:text-red-400">
                        En savoir plus &rarr;
                    </span>
                )}
            </div>
        </div>
    );

    if (link) {
        return (
            <Link href={link} className="block h-full">
                {CardContent()}
            </Link>
        );
    }

    return CardContent();
};

export default Card;
