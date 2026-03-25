import React from 'react';

// For static export, generate placeholder params
export function generateStaticParams() {
    return [
        { courseId: 'metrage' },
        { courseId: 'assistant-macon' },
        { courseId: 'electromenager' },
    ];
}

interface CourseDetailPageProps {
    params: Promise<{ courseId: string }>;
}

const CourseDetailPage = async ({ params }: CourseDetailPageProps) => {
    const { courseId } = await params;

    // Fetch course details based on courseId (this could be from an API or static data)
    const courseDetails = {
        title: "Sample Course Title",
        description: "This is a sample description for the course.",
        price: 100,
        format: "Online", // or "In-Person"
    };

    return (
        <div>
            <h1>{courseDetails.title}</h1>
            <p>{courseDetails.description}</p>
            <p>Price: ${courseDetails.price}</p>
            <p>Format: {courseDetails.format}</p>
            {/* Add additional course details and a button to enroll or checkout */}
        </div>
    );
};

export default CourseDetailPage;