
import React, { useState } from 'react';
import { LockIcon, LoaderIcon, ShieldIcon } from '../components/icons';
import { supabase } from '../lib/supabase';

const ChangePassword: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError('Senhas não conferem');
    if (password.length < 6) return setError('Mínimo 6 caracteres');

    setLoading(true);
    try {
      // 1. Atualiza a senha no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;

      // 2. Atualiza os metadados para desativar a flag de troca obrigatória
      const { error: metaError } = await supabase.auth.updateUser({
        data: { must_change_password: false }
      });
      if (metaError) throw metaError;

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-md bg-gray-900 border border-white/10 rounded-[3rem] p-10 shadow-2xl space-y-8 animate-in zoom-in-95">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6">
            <ShieldIcon className="w-8 h-8 text-indigo-500" />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter text-center">Primeiro Acesso</h1>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-2 text-center">Defina sua senha pessoal de segurança</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-white/20 ml-1">Nova Senha</label>
            <input 
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:border-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-white/20 ml-1">Confirmar Senha</label>
            <input 
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:border-indigo-500"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-[10px] font-black text-red-500 uppercase text-center">{error}</p>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all"
          >
            {loading ? <LoaderIcon className="w-5 h-5 mx-auto animate-spin" /> : 'Salvar e Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
