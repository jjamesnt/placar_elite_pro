
import React from 'react';
import { ShieldIcon, ZapIcon, ClipboardListIcon, TrophyIcon, UsersIcon, HistoryIcon } from './icons';

interface WelcomeModalProps {
  onConfirm: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="bg-[#090e1a] border border-indigo-500/30 rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 w-full max-w-xl shadow-[0_0_50px_rgba(79,70,229,0.2)] animate-in zoom-in-95 duration-300 relative overflow-hidden">
        
        {/* Glow Effect */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full"></div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-cyan-600/10 blur-[100px] rounded-full"></div>

        <div className="flex flex-col items-center text-center space-y-6 sm:space-y-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center text-indigo-500 shadow-2xl border border-indigo-500/20 animate-pulse">
            <ShieldIcon className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-black text-white uppercase tracking-tighter leading-none">Bem-vindo à Elite</h1>
            <p className="text-indigo-400 font-black text-[10px] sm:text-xs uppercase tracking-[0.4em]">Sua Arena está Pronta</p>
          </div>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-left">
            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <ClipboardListIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Placar 2.0</h3>
                <p className="text-[8px] text-white/40 font-bold uppercase mt-1">Gestão de posse e feedback sensorial.</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <TrophyIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Ranking Letal</h3>
                <p className="text-[8px] text-white/40 font-bold uppercase mt-1">Análise de performance automatizada.</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <UsersIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Atletas Ilimitados</h3>
                <p className="text-[8px] text-white/40 font-bold uppercase mt-1">Cadastre e gerencie sua base de jogadores.</p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                <HistoryIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Auditoria de Partidas</h3>
                <p className="text-[8px] text-white/40 font-bold uppercase mt-1">Histórico completo e exportação de PDF.</p>
              </div>
            </div>
          </div>

          <div className="w-full space-y-4">
            <button 
              onClick={onConfirm}
              className="w-full py-5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-[0_10px_30px_rgba(79,70,229,0.3)] active:scale-95 transition-all"
            >
              Entrar na Minha Arena
            </button>
            <div className="flex flex-col gap-1 items-center">
                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Precisa de Suporte?</span>
                <a href="https://wa.me/5531984211900" target="_blank" className="text-indigo-400/60 hover:text-indigo-400 font-black text-[10px] transition-colors underline decoration-indigo-500/20 underline-offset-4">Falar com Desenvolvedor</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
