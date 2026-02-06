
import React from 'react';
import { ShieldIcon, ClipboardListIcon, TrophyIcon, UsersIcon, HistoryIcon } from './icons';

interface WelcomeModalProps {
  onConfirm: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black/98 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="bg-[#090e1a] border border-white/10 rounded-[1.5rem] p-4 w-full max-w-[360px] sm:max-w-sm shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden max-h-[95vh] overflow-y-auto">
        
        <div className="flex flex-col items-center text-center space-y-3">
          <ShieldIcon className="w-7 h-7 text-white/30" />
          
          <div className="space-y-1">
            <h1 className="text-lg font-black text-white uppercase tracking-tighter leading-none">Bem-vindo à Elite</h1>
            <p className="text-white/40 font-black text-[9px] uppercase tracking-[0.3em]">Sua Arena está Pronta</p>
          </div>

          <div className="w-full grid grid-cols-2 gap-2 text-left pt-1">
            <div className="bg-white/[0.04] p-2.5 rounded-xl flex items-start gap-2">
              <ClipboardListIcon className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-[9px] font-black text-white uppercase tracking-widest">Placar 2.0</h3>
                <p className="text-[8px] text-white/40 font-bold uppercase mt-0.5 leading-tight">Gestão de posse e feedback sensorial.</p>
              </div>
            </div>

            <div className="bg-white/[0.04] p-2.5 rounded-xl flex items-start gap-2">
              <TrophyIcon className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-[9px] font-black text-white uppercase tracking-widest">Ranking Letal</h3>
                <p className="text-[8px] text-white/40 font-bold uppercase mt-0.5 leading-tight">Análise de performance automatizada.</p>
              </div>
            </div>
            
            <div className="bg-white/[0.04] p-2.5 rounded-xl flex items-start gap-2">
              <UsersIcon className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-[9px] font-black text-white uppercase tracking-widest">Atletas Ilimitados</h3>
                <p className="text-[8px] text-white/40 font-bold uppercase mt-0.5 leading-tight">Cadastre e gerencie sua base de jogadores.</p>
              </div>
            </div>

            <div className="bg-white/[0.04] p-2.5 rounded-xl flex items-start gap-2">
              <HistoryIcon className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-[9px] font-black text-white uppercase tracking-widest">Auditoria de Partidas</h3>
                <p className="text-[8px] text-white/40 font-bold uppercase mt-0.5 leading-tight">Histórico completo e exportação de PDF.</p>
              </div>
            </div>
          </div>

          <div className="w-full pt-3">
            <button 
              onClick={onConfirm}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] shadow-lg shadow-indigo-900/20 active:scale-95 transition-all"
            >
              Entrar na Minha Arena
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;
