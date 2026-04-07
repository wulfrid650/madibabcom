'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  isOpen?: boolean;
  onToggle?: () => void;
}

const AccordionItem = ({ title, children, isOpen, onToggle }: AccordionItemProps) => {
  return (
    <div className="border-b border-gray-100 dark:border-gray-800 last:border-0 overflow-hidden transition-colors duration-200">
      <button
        className="w-full py-6 px-6 flex items-center justify-between text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all duration-300 focus:outline-none group"
        onClick={onToggle}
        aria-expanded={isOpen}
      >
        <span className={`text-base md:text-lg font-semibold transition-colors duration-300 ${isOpen ? 'text-madiba-red' : 'text-madiba-black dark:text-white'}`}>
          {title}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 group-hover:text-madiba-red transition-all duration-500 transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
        />
      </button>
      
      <div 
        className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-6 pb-6 text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">
          {children}
        </div>
      </div>
    </div>
  );
};

interface AccordionProps {
  items: Array<{ title: string; content: React.ReactNode }>;
  allowMultiple?: boolean;
}

const Accordion = ({ items, allowMultiple = false }: AccordionProps) => {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);

  const toggle = (index: number) => {
    if (allowMultiple) {
      setOpenIndexes(prev => 
        prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
      );
    } else {
      setOpenIndexes(prev => prev.includes(index) ? [] : [index]);
    }
  };

  return (
    <div className="bg-white dark:bg-madiba-black/20 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          title={item.title}
          isOpen={openIndexes.includes(index)}
          onToggle={() => toggle(index)}
        >
          {item.content}
        </AccordionItem>
      ))}
    </div>
  );
};

export default Accordion;
