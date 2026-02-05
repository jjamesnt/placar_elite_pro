
import React, { useState } from 'react';
import { ShieldIcon, LoaderIcon, UserPlusIcon, LogOutIcon, ZapIcon } from '../components/icons';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({ 
          email: email.trim().toLowerCase(), 
          password 
        });
        
        if (signUpError) throw signUpError;
        
        setSuccess('SOLICITAÇÃO ENVIADA! AGUARDE APROVAÇÃO DO ADM.');
        setIsSignUp(false); 
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ 
          email: email.trim().toLowerCase(), 
          password 
        });
        if (signInError) throw signInError;
        onLogin();
      }
    } catch (err: any) {
      console.error("Erro no login:", err);
      let msg = err.message || 'Erro desconhecido';
      
      if (msg.includes('rate limit')) {
        msg = 'Muitas tentativas! Aguarde alguns minutos ou use outra rede.';
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'E-mail ou senha incorretos.';
      } else if (msg.includes('User already registered')) {
        msg = 'Este e-mail já solicitou acesso.';
      } else if (msg.includes('Password should be at least 6 characters')) {
        msg = 'A senha deve ter pelo menos 6 caracteres.';
      }
      
      setError(msg.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 bg-[#030712] relative overflow-hidden">
      <div className={`absolute w-[600px] h-[600px] rounded-full blur-[140px] opacity-10 transition-all duration-1000 -z-10 ${isSignUp ? 'bg-emerald-500 -top-20 -right-20' : 'bg-indigo-500 -bottom-20 -left-20'}`}></div>

      <div className={`w-full max-w-[400px] bg-[#090e1a]/80 backdrop-blur-3xl border rounded-[3rem] p-10 shadow-2xl transition-all duration-500 ${isSignUp ? 'border-emerald-500/30 shadow-emerald-500/20' : 'border-indigo-500/20 shadow-indigo-500/10'}`}>
        
        <div className="flex flex-col items-center mb-10">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border shadow-2xl transition-all duration-500 ${isSignUp ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 scale-110 shadow-emerald-500/20' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500'}`}>
            {isSignUp ? <UserPlusIcon className="w-10 h-10" /> : <ShieldIcon className="w-10 h-10" />}
          </div>
          
          <h1 className="text-4xl font-black uppercase tracking-tighter text-white text-center leading-none">
            {isSignUp ? 'Nova Conta' : 'Placar Elite Pro'}
          </h1>
          <p className={`text-[10px] font-black uppercase tracking-[0.5em] mt-3 ${isSignUp ? 'text-emerald-500' : 'text-indigo-400/50'}`}>
            {isSignUp ? 'SOLICITAR ACESSO À ARENA' : 'PROFESSIONAL SCOREBOARD'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Seu E-mail</label>
            <input 
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className={`w-full bg-white/[0.03] border rounded-2xl py-4 px-6 text-sm text-white focus:outline-none transition-all placeholder:text-white/5 ${isSignUp ? 'focus:border-emerald-500 border-white/10' : 'focus:border-indigo-500 border-white/10'}`}
              placeholder="exemplo@gmail.com" required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Sua Senha</label>
            <input 
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className={`w-full bg-white/[0.03] border rounded-2xl py-4 px-6 text-sm text-white focus:outline-none transition-all placeholder:text-white/5 ${isSignUp ? 'focus:border-emerald-500 border-white/10' : 'focus:border-indigo-500 border-white/10'}`}
              placeholder="••••••••" required
            />
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-center animate-in fade-in slide-in-from-top-2">
               <p className="text-[9px] font-black uppercase tracking-widest text-red-500 leading-relaxed">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center animate-in fade-in slide-in-from-top-2">
               <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 leading-relaxed">{success}</p>
            </div>
          )}

          <div className="space-y-4 pt-4">
            <button 
              type="submit" disabled={loading}
              className={`w-full py-5 rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-2xl active:scale-[0.96] transition-all disabled:opacity-50 text-white flex items-center justify-center gap-3 ${isSignUp ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40'}`}
            >
              {loading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Enviar Solicitação' : 'Entrar na Arena')}
            </button>
            
            <div className="flex flex-col gap-2">
              <button 
                type="button" 
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }} 
                className={`w-full text-[10px] font-black uppercase tracking-[0.2em] py-3 transition-all rounded-xl border ${isSignUp ? 'text-white/40 border-transparent hover:text-white' : 'text-emerald-500/60 border-emerald-500/5 hover:border-emerald-500/20 hover:text-emerald-400'}`}
              >
                {isSignUp ? 'Já possui conta? Fazer Login' : 'Novo por aqui? Criar Conta'}
              </button>

              <a 
                href="https://wa.me/5531984211900"
                target="_blank"
                className="w-full flex items-center justify-center gap-2 py-3 text-[9px] font-black uppercase tracking-widest text-indigo-400/60 hover:text-indigo-400 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                Suporte WhatsApp
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
