import PaymentLinkClient from './payment-link-client';

// Force dynamic rendering since we don't know IDs at build time
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
    return [];
}

interface PaymentLinkPageProps {
    params: {
        reference: string;
    };
}

export default function PaymentLinkPage() {
    return <PaymentLinkClient />;
}
