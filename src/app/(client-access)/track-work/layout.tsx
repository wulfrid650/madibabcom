import React from 'react';

const TrackWorkLayout = ({ children }: { children: React.ReactNode }) => {
    return (
        <div>
            <header>
                <h1>Track Your Work</h1>
                <p>Monitor the progress of your projects.</p>
            </header>
            <main>{children}</main>
            <footer>
                <p>&copy; {new Date().getFullYear()} MBC Digitization</p>
            </footer>
        </div>
    );
};

export default TrackWorkLayout;