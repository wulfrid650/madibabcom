'use client';

import { Suspense } from 'react';
import PaymentLinkClient from './payment-link-client';

export const dynamic = 'force-dynamic';

export default function PaymentLinkPage() {
    return (
        <Suspense fallback={<div>Chargement...</div>}>
            <PaymentLinkClient />
        </Suspense>
    );
}
