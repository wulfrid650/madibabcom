'use client';

import React from 'react';
import { useParams } from 'next/navigation';

const TrackWorkClient = () => {
    const params = useParams();
    const projectId = params.projectId;

    // Fetch project data based on projectId (this could be from an API or context)
    // For demonstration, we'll use a placeholder project data
    const projectData = {
        id: projectId,
        name: 'Project Name',
        status: 'In Progress',
        updates: [
            { date: '2023-10-01', description: 'Initial meeting held.' },
            { date: '2023-10-05', description: 'Design phase completed.' },
            { date: '2023-10-10', description: 'Development started.' },
        ],
    };

    return (
        <div>
            <h1>Tracking Work for {projectData.name}</h1>
            <h2>Status: {projectData.status}</h2>
            <h3>Updates:</h3>
            <ul>
                {projectData.updates.map((update, index) => (
                    <li key={index}>
                        <strong>{update.date}:</strong> {update.description}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default TrackWorkClient;
