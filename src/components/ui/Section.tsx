import React from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  theme?: 'black' | 'dark' | 'white';
}

const Section: React.FC<SectionProps> = ({ 
  children, 
  className = '', 
  theme = 'black' 
}) => {
  const themes = {
    black: "bg-madiba-black text-white border-t border-gray-800",
    dark: "bg-gray-900 text-white",
    white: "bg-white dark:bg-madiba-black text-madiba-black dark:text-white transition-colors duration-300",
  };

  return (
    <section className={`py-16 md:py-24 ${themes[theme]} ${className}`}>
      <div className="container mx-auto px-4">
        {children}
      </div>
    </section>
  );
};

export default Section;
