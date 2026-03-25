import React from 'react';
import Link from 'next/link';

export default function Hero() {
  return (
    <section className="bg-white dark:bg-madiba-black min-h-[90vh] text-madiba-black dark:text-white relative overflow-hidden flex items-center pt-20 transition-colors duration-300">
      
      <div className="container mx-auto px-6 md:px-12 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        
        {/* LEFT CONTENT */}
        <div className="max-w-2xl py-12 lg:py-0">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.15] tracking-tight text-madiba-black dark:text-white transition-colors">
            Construire avec <br />
            <span className="text-madiba-red italic">rigueur</span> et vision <br />
            durable
          </h1>

          <p className="text-gray-600 dark:text-gray-300 mt-6 mb-8 text-base md:text-lg font-normal leading-relaxed max-w-md transition-colors">
            MBC accompagne vos projets de construction, de la
            livraison à la conception avec transparence et expertise terrain.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/contact" className="bg-madiba-red hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-lg shadow-red-500/20">
                Demander un devis
            </Link>

            <Link href="/portfolio" className="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/10 text-madiba-black dark:text-white border border-gray-300 dark:border-gray-600 font-medium px-6 py-3 rounded-lg transition-colors">
                Voir nos projets
            </Link>
          </div>
        </div>

        {/* RIGHT VISUAL */}
        <div className="relative h-[550px] lg:h-[700px] w-full flex items-center justify-center lg:justify-end">
             
             {/* Large Organic Blob Background */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[130%] h-[130%] z-0 pointer-events-none">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-gray-100 dark:text-gray-800 fill-current transition-colors duration-300">
                  <path transform="translate(100 100)" d="M44.5,-48.6C56.9,-38.7,65.8,-23.4,66.3,-8.1C66.8,7.3,58.8,22.6,48.2,34.9C37.6,47.2,24.3,56.5,9.4,59.3C-5.5,62.1,-21.9,58.4,-36.8,49.2C-51.7,40,-65.1,25.3,-66.9,9.3C-68.7,-6.7,-58.9,-24,-46.8,-34.7C-34.7,-45.4,-20.3,-49.4,-4.3,-50.8C11.7,-52.1,27.7,-50.8,44.5,-48.6Z" />
                </svg>
             </div>

             {/* Red Accent Blob (Bottom Left of image) */}
             <div className="absolute bottom-[8%] left-[5%] w-36 h-36 lg:w-56 lg:h-56 bg-madiba-red rounded-full z-10 opacity-90"></div>
             
             {/* Dark accent blob for depth */}
             <div className="absolute top-[10%] right-[0%] w-28 h-28 bg-gray-300 dark:bg-gray-700 rounded-full z-0 transition-colors"></div>

             {/* Image */}
             <div className="relative z-20 w-auto h-full flex items-end justify-center">
                 <img 
                    src="/engineer.png" 
                    alt="Ingénieur BTP" 
                    className="h-[145%] w-auto object-contain drop-shadow-2xl"
                 />
             </div>
        </div>

        {/* Mobile version - simplified */}
        <div className="relative h-[350px] w-full flex lg:hidden items-center justify-center mt-8">
          <div className="relative w-[280px] h-[280px]">
            {/* Simple blob background for mobile */}
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 rounded-full transition-colors"></div>
            {/* Red accent */}
            <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-madiba-red rounded-full z-10"></div>
            {/* Image */}
            <img 
              src="/engineer.png" 
              alt="Ingénieur BTP" 
              className="absolute inset-0 w-full h-full object-contain z-20 drop-shadow-xl"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
