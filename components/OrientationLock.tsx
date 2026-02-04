
import React from 'react';

const OrientationLock: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-[#030712]/98 z-[100] flex flex-col justify-center items-center text-center p-8 landscape:hidden print:hidden backdrop-blur-md">
      {/* Animated phone icon */}
      <div className="w-20 h-36 border-4 border-white/10 rounded-2xl p-2 flex items-center justify-center animate-rotate-device mb-8 shadow-2xl">
        <div className="w-full h-2/3 bg-white/5 rounded-lg border border-white/5"></div>
      </div>
      <h2 className="text-3xl font-black text-white mb-3 uppercase tracking-tighter">Gire seu dispositivo</h2>
      <p className="text-sm font-bold text-white/40 uppercase tracking-widest max-w-[250px] leading-relaxed">
        Para a melhor experiência profissional, utilize o <span className="text-indigo-400">Placar Elite Pro</span> no modo paisagem.
      </p>
    </div>
  );
};

export default OrientationLock;
