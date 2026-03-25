import React from 'react';

interface CourseCardProps {
    title: string;
    description: string;
    imageUrl: string;
    price: number;
    onEnroll: () => void;
}

const CourseCard: React.FC<CourseCardProps> = ({ title, description, imageUrl, price, onEnroll }) => {
    return (
        <div className="course-card">
            <img src={imageUrl} alt={title} className="course-image" />
            <h3 className="course-title">{title}</h3>
            <p className="course-description">{description}</p>
            <p className="course-price">${price.toFixed(2)}</p>
            <button onClick={onEnroll} className="enroll-button">Enroll Now</button>
        </div>
    );
};

export default CourseCard;