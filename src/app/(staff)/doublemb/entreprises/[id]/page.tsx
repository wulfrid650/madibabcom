import CompanyDetailsClient from './company-details-client';

// Force dynamic rendering since we don't know IDs at build time
export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
    return [];
}

interface CompanyDetailsPageProps {
    params: {
        id: string;
    };
}

export default function CompanyDetailsPage() {
    // We don't use params here to avoid generateStaticParams validation error in export mode
    return <CompanyDetailsClient />;
}
