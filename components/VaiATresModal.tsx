
import React from 'react';
import { ZapIcon } from './icons';

interface VaiATresModalProps {
  onClose: () => void;
  onUndo: () => void;
  isTV?: boolean;
}

const VaiATresModal: React.FC<VaiATresModalProps> = ({ onClose, onUndo, isTV = false }) => {
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[120] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div
        className={`bg-[#030712] border border-amber-500/30 rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-12 ${isTV ? 'w-[85vw] max-w-[1100px] py-16' : 'w-full max-w-xs sm:max-w-sm'} shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden max-h-[95vh] overflow-y-auto`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`absolute -top-1/4 -right-1/4 ${isTV ? 'w-[500px] h-[500px]' : 'w-80 h-80'} bg-amber-600/20 rounded-full blur-[100px] -z-10`}></div>

        <div className="flex flex-col items-center text-center">
          <div className={`${isTV ? 'w-24 h-24 mb-6' : 'w-12 h-12 sm:w-14 sm:h-14 mb-3 sm:mb-4'} rounded-3xl flex items-center justify-center border bg-amber-500/10 border-amber-500/20 text-amber-500`}>
            <ZapIcon className={`${isTV ? 'w-12 h-12' : 'w-6 h-6 sm:w-7 sm:h-7'}`} />
          </div>
          <h1 className={`${isTV ? 'text-7xl' : 'text-2xl sm:text-3xl'} font-black uppercase tracking-tighter text-amber-400`}>
            VAI A TRÊS!
          </h1>
          <p className={`${isTV ? 'text-3xl mt-6' : 'text-xs sm:text-sm mt-3'} font-bold text-white leading-relaxed`}>
            DISPUTA DE <span className="text-amber-400">3 PONTOS CORRIDOS</span>
          </p>
          <p className={`${isTV ? 'text-lg mt-4' : 'text-[10px] sm:text-xs mt-1'} font-normal text-white/40 px-4`}>
            O placar principal está travado. Quem fizer 3 pontos primeiro no mini-placar vence o desempate!
          </p>

          <div className={`${isTV ? 'my-12' : 'my-4 sm:my-6'} w-full flex items-center justify-center`}>
            <div className={`flex items-center ${isTV ? 'gap-12 p-10' : 'gap-4 p-4'} bg-white/5 rounded-[2.5rem] border border-white/10`}>
              <span className={`${isTV ? 'text-9xl' : 'text-4xl'} font-mono font-black text-white/20`}>0</span>
              <span className={`${isTV ? 'text-4xl' : 'text-xl'} font-black text-amber-500 italic`}>VS</span>
              <span className={`${isTV ? 'text-9xl' : 'text-4xl'} font-mono font-black text-white/20`}>0</span>
            </div>
          </div>

          <div className="w-full">
            {!isTV && (
              <>
                <button
                  onClick={onClose}
                  className="w-full py-3 sm:py-4 bg-amber-600 hover:opacity-90 text-white rounded-xl font-black uppercase text-[10px] sm:text-xs tracking-[0.2em] shadow-xl shadow-amber-500/40"
                >
                  Continuar Partida
                </button>
                <button
                  onClick={onUndo}
                  className="mt-3 w-full py-2 sm:py-3 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-xl font-black uppercase text-[10px] tracking-widest transition-colors border border-amber-500/20"
                >
                  Voltar (Desfazer Ponto)
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VaiATresModal;
