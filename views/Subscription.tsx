
import React from 'react';
import { UserLicense } from '../types';
import { ShieldIcon, CalendarIcon, CrownIcon, HistoryIcon, ArrowLeftIcon, ZapIcon } from '../components/icons';

interface SubscriptionProps {
  userLicense: UserLicense | null;
  onBack: () => void;
  onRefreshLicense: () => void;
  showAlert?: (title: string, message: string, type?: any, icon?: any) => void;
}

const Subscription: React.FC<SubscriptionProps> = ({ userLicense, onBack, onRefreshLicense, showAlert }) => {
  if (!userLicense) return null;

  const isExpired = new Date(userLicense.expires_at).getTime() < Date.now();
  const isPRO = userLicense.is_club;

  return (
    <div className="w-full max-w-lg mx-auto p-4 space-y-6 pb-20">
      <div className="flex items-center gap-4 mb-2">
        <button 
          onClick={onBack}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">Sua Assinatura</h2>
          <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Gerencie seu plano Elite Pro</p>
        </div>
      </div>

      {/* Card Principal */}
      <div className={`relative overflow-hidden rounded-[2rem] p-8 border ${isPRO ? 'border-amber-500/30 bg-amber-500/5' : 'border-indigo-500/30 bg-indigo-500/5'}`}>
        <div className="absolute top-0 right-0 p-8 opacity-10">
          {isPRO ? <CrownIcon className="w-24 h-24 text-amber-500" /> : <ZapIcon className="w-24 h-24 text-indigo-500" />}
        </div>

        <div className="relative space-y-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isPRO ? 'bg-amber-500/20 text-amber-500' : 'bg-indigo-500/20 text-indigo-500'}`}>
              {isPRO ? <CrownIcon className="w-5 h-5" /> : <ZapIcon className="w-5 h-5" />}
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-white">
              {isPRO ? 'Plano Elite PRO (Clube)' : 'Plano Elite Standard'}
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter">
              {userLicense.is_active ? (isExpired ? 'Expirado' : 'Ativo') : 'Inativo'}
            </h1>
            <div className="flex items-center gap-2 text-white/40 font-bold uppercase text-[10px] tracking-widest">
              <CalendarIcon className="w-3 h-3" />
              <span>Expira em: {new Date(userLicense.expires_at).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div className="space-y-1">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block">Limite de Grupos</span>
              <span className="text-sm font-black text-white">{userLicense.arenas_limit || 1}</span>
            </div>
            <div className="space-y-1">
              <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block">Limite de Atletas</span>
              <span className="text-sm font-black text-white">{userLicense.athletes_limit || 50}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-1 gap-3">
        <button 
          onClick={onRefreshLicense}
          className="w-full py-5 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-3"
        >
          <HistoryIcon className="w-4 h-4" />
          Sincronizar Licença
        </button>

        <a 
          href="https://wa.me/5531984211900" 
          target="_blank" 
          className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl shadow-indigo-900/20 text-center"
        >
          Falar com Consultor
        </a>
      </div>

      <div className="p-6 bg-black/20 rounded-2xl border border-white/5">
        <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Sobre sua conta</h4>
        <div className="flex items-center gap-4 text-white/40">
          <ShieldIcon className="w-5 h-5 flex-shrink-0" />
          <p className="text-[10px] font-medium leading-relaxed">
            Seu acesso é vinculado ao e-mail <span className="text-white">{userLicense.email}</span>. 
            Em caso de troca de dispositivo ou reinstalação, basta fazer login para recuperar seus dados e assinatura.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
