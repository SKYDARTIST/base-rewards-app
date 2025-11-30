import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    // Base Mini App: Full white background on mobile, centered card on desktop
    <div className="min-h-screen w-full md:bg-gray-100 md:flex md:items-center md:justify-center">
      <div className="w-full bg-white min-h-screen md:min-h-0 md:max-w-md md:rounded-2xl md:shadow-xl md:overflow-hidden md:border md:border-gray-100 flex flex-col">
        <div className="flex-grow">
          {children}
        </div>
        <div className="pb-6 pt-2 text-center">
           <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase opacity-60">
             Developed by cryptobulla
           </span>
        </div>
      </div>
    </div>
  );
};