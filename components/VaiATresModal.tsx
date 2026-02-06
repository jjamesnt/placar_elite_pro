
import React from 'react';
import { ZapIcon } from './icons';

interface VaiATresModalProps {
  newWinScore: number;
  onClose: () => void;
}

const VaiATresModal: React.FC<VaiATresModalProps> = ({ newWinScore, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div 
        className="bg-[#030712] border border-amber-500/30 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 w-full max-w-xs sm:max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden max-h-[95vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute -top-1/4 -right-1/4 w-80 h-80 bg-amber-600/20 rounded-full blur-[100px] -z-10"></div>
        
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 border bg-amber-500/10 border-amber-500/20 text-amber-500">
            <ZapIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-amber-400">
            VAI A TRÊS!
          </h1>
          <p className="text-xs sm:text-sm font-bold text-white mt-3">
            A PARTIDA FOI ESTENDIDA.
          </p>
          <p className="text-[10px] sm:text-xs font-normal text-white/40 mt-1">
            A nova pontuação para a vitória é:
          </p>

          <div className="my-4 sm:my-6 w-full flex items-center justify-center">
            <p className="text-5xl sm:text-6xl font-mono font-black text-white">{newWinScore}</p>
          </div>
          
          <div className="w-full">
            <button 
              onClick={onClose}
              className="w-full py-3 sm:py-4 bg-amber-600 hover:opacity-90 text-white rounded-xl font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] shadow-xl shadow-amber-500/40"
            >
              Continuar Partida
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaiATresModal;
