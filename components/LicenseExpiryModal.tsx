
import React from 'react';
import { ShieldIcon, CalendarIcon } from './icons';

interface LicenseExpiryModalProps {
  expiryDate: string;
  onConfirm: () => void;
}

const LicenseExpiryModal: React.FC<LicenseExpiryModalProps> = ({ expiryDate, onConfirm }) => {
  const calculateDaysRemaining = () => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = calculateDaysRemaining();

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
      <div className="bg-[#090e1a] border border-white/5 rounded-[3rem] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-600/10 blur-[100px] -z-10 rounded-full"></div>

        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-indigo-400 shadow-xl border border-white/5">
            <CalendarIcon className="w-10 h-10" />
          </div>
          
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Status da Licença</h1>
            <p className="text-indigo-500 font-black text-[10px] uppercase tracking-[0.4em]">Placar Elite Pro</p>
          </div>

          <div className="w-full bg-white/[0.03] border border-white/5 rounded-[2rem] p-8 flex flex-col items-center gap-2">
             <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Sua ativação expira em</span>
             <div className="flex items-baseline gap-2">
                <span className="text-7xl font-mono font-black text-white leading-none">{daysRemaining}</span>
                <span className="text-xl font-black text-indigo-500 uppercase tracking-tighter">Dias</span>
             </div>
             <p className="text-[9px] font-bold text-white/10 uppercase tracking-widest mt-2 italic">
                Data Final: {new Date(expiryDate).toLocaleDateString('pt-BR')}
             </p>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <button 
              onClick={onConfirm}
              className="w-full py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-95"
            >
              Continuar para Arena
            </button>
            <a 
              href="https://wa.me/5531984211900" 
              target="_blank"
              className="w-full py-4 text-indigo-400 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors"
            >
              Renovar ou Suporte
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseExpiryModal;
