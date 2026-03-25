import EditFormationClient from './edit-formation-client';

// Required for output: export
export async function generateStaticParams() {
    // In a real static build, you would fetch all IDs here.
    // For now, we return an empty array to satisfy the build,
    // assuming this might be an SPA with rewrites or IDs will be known.
    return [];
}

export default function EditFormationPage({ params }: { params: { id: string } }) {
    return <EditFormationClient id={params.id} />;
}
