
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
    <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-500">
      <div className="bg-[#090e1a] border border-white/5 rounded-[1.5rem] p-4 sm:p-6 w-full max-w-xs shadow-2xl animate-in zoom-in-95 duration-300 relative overflow-hidden max-h-[95vh] overflow-y-auto">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-indigo-600/10 blur-[100px] -z-10 rounded-full"></div>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/5 rounded-2xl flex items-center justify-center text-indigo-400 shadow-xl border border-white/5">
            <CalendarIcon className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          
          <div className="space-y-1">
            <h1 className="text-base sm:text-lg font-black text-white uppercase tracking-tighter">Status da Licença</h1>
            <p className="text-indigo-500 font-black text-[9px] uppercase tracking-[0.4em]">Placar Elite Pro</p>
          </div>

          <div className="w-full bg-white/[0.03] border border-white/5 rounded-[1.2rem] p-4 flex flex-col items-center gap-1">
             <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em]">Sua ativação expira em</span>
             <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-mono font-black text-white leading-none">{daysRemaining}</span>
                <span className="text-base font-black text-indigo-500 uppercase tracking-tighter">Dias</span>
             </div>
             <p className="text-[8px] font-bold text-white/10 uppercase tracking-widest mt-1 italic">
                Data Final: {new Date(expiryDate).toLocaleDateString('pt-BR')}
             </p>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <button 
              onClick={onConfirm}
              className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95"
            >
              Continuar para Arena
            </button>
            <a 
              href="https://wa.me/5531984211900" 
              target="_blank"
              className="w-full py-2 text-indigo-400 font-black uppercase text-[9px] tracking-widest hover:text-white transition-colors"
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
