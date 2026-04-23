
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LoaderIcon, ShieldIcon } from '../components/icons';

const ResetPassword: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('AS SENHAS NÃO CONFEREM');
      return;
    }
    if (newPassword.length < 6) {
      setError('A SENHA DEVE TER PELO MENOS 6 CARACTERES');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });
      
      if (updateError) throw updateError;
      
      setSuccess('SENHA ATUALIZADA COM SUCESSO!');
      setTimeout(() => onComplete(), 2000);
    } catch (err: any) {
      console.error("Erro ao resetar senha:", err);
      setError(err.message.toUpperCase());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 bg-[#030712] relative overflow-hidden">
      <div className="absolute w-[600px] h-[600px] rounded-full blur-[140px] opacity-10 bg-indigo-500 -bottom-20 -left-20"></div>

      <div className="w-full max-w-sm bg-[#090e1a]/80 backdrop-blur-3xl border border-indigo-500/20 rounded-[2.5rem] p-8 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6 text-indigo-500">
            <ShieldIcon className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-white text-center leading-none">Nova Senha</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.5em] mt-3 text-indigo-400/50 text-center">Crie uma senha segura para sua conta</p>
        </div>

        <form onSubmit={handleReset} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Nova Senha</label>
            <input 
              type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 px-5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-white/5"
              placeholder="••••••••" required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Confirmar Senha</label>
            <input 
              type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
              className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 px-5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all placeholder:text-white/5"
              placeholder="••••••••" required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
               <p className="text-[9px] font-black uppercase tracking-widest text-red-500 leading-relaxed">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
               <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 leading-relaxed">{success}</p>
            </div>
          )}

          <button 
            type="submit" disabled={loading}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black uppercase text-[12px] tracking-widest shadow-2xl shadow-indigo-900/40 active:scale-[0.96] transition-all disabled:opacity-50 text-white flex items-center justify-center gap-3"
          >
            {loading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : 'Atualizar Senha'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
