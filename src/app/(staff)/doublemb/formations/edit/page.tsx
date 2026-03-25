'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import EditFormationClient from './edit-formation-client';

function EditPageContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');

    if (!id) {
        return (
            <div className="p-4 bg-red-50 text-red-600 rounded">
                Erreur: ID de formation manquant.
            </div>
        );
    }

    return <EditFormationClient id={id} />;
}

export default function EditFormationPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <EditPageContent />
        </Suspense>
    );
}
