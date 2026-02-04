
import React from 'react';
import { ShieldIcon, ZapIcon } from './icons';

interface WelcomeModalProps {
  onConfirm: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="bg-[#090e1a] border border-indigo-500/20 rounded-[3rem] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
        
        {/* Efeito de luz de fundo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-600/20 blur-[100px] -z-10 rounded-full"></div>

        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-500 shadow-xl border border-indigo-500/20 animate-bounce">
            <ZapIcon className="w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Oferta de Boas-Vindas!</h1>
            <p className="text-indigo-400 font-black text-sm uppercase tracking-widest">Acesso Elite Pro Liberado</p>
          </div>

          <p className="text-white/40 text-sm leading-relaxed font-bold uppercase tracking-tight">
            Parabéns! Você ganhou <span className="text-white">30 dias de acesso premium</span> como cortesia para testar todas as funcionalidades do Placar Elite Pro na sua arena.
          </p>

          <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
             <div className="flex flex-col gap-1">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Dúvidas ou Renovação?</span>
                <a 
                  href="https://wa.me/5531988124233" 
                  target="_blank" 
                  className="text-indigo-400 font-black text-lg hover:text-white transition-colors"
                >
                  (31) 98812-4233
                </a>
             </div>
          </div>

          <button 
            onClick={onConfirm}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-900/40 active:scale-95 transition-all"
          >
            Entrar na Minha Arena
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
