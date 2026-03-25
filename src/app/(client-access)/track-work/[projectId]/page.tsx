import TrackWorkClient from './TrackWorkClient';

// For static export, generate placeholder params
export function generateStaticParams() {
    return [
        { projectId: '1' },
        { projectId: '2' },
        { projectId: '3' },
    ];
}

export default function TrackWorkPage() {
    return <TrackWorkClient />;
}