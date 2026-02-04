
import React, { useState, useEffect } from 'react';
import { UserPlusIcon, Trash2Icon, LoaderIcon, ZapIcon, LockIcon, CalendarIcon, HistoryIcon, XCircleIcon } from '../components/icons';
import { supabase } from '../lib/supabase';

interface AuthorizedUser {
  id: string;
  email: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

const AccessControl: React.FC = () => {
  const [conciergeEmail, setConciergeEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  
  const [authorized, setAuthorized] = useState<AuthorizedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [lastCreated, setLastCreated] = useState<{e: string, p: string} | null>(null);

  const fetchAuthorized = async () => {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('authorized_emails')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setAuthorized(data);
    } catch (err: any) {
      console.error("Erro ao carregar autorizados:", err);
      showMessage('Erro ao carregar dados do banco.', 'error');
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchAuthorized();
  }, []);

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 6000);
  };

  const handleToggleStatus = async (user: AuthorizedUser) => {
    const newStatus = !user.is_active;
    const { data, error } = await supabase
      .from('authorized_emails')
      .update({ is_active: newStatus })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      showMessage('Falha ao atualizar status.', 'error');
    } else {
      setAuthorized(prev => prev.map(u => u.id === user.id ? data : u));
      showMessage(newStatus ? 'Acesso Ativado!' : 'Acesso Desativado!', 'success');
    }
  };

  const handleExtendAccess = async (id: string, months: number) => {
    const user = authorized.find(u => u.id === id);
    if (!user) return;

    const currentExpiry = new Date(user.expires_at).getTime() > Date.now() 
      ? new Date(user.expires_at) 
      : new Date();
    
    const newExpiry = new Date(currentExpiry.setMonth(currentExpiry.getMonth() + months)).toISOString();

    const { data, error } = await supabase
      .from('authorized_emails')
      .update({ expires_at: newExpiry, is_active: true })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setAuthorized(prev => prev.map(u => u.id === id ? data : u));
      showMessage(`Licença renovada!`, 'success');
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm("Deseja EXCLUIR permanentemente esta licença?")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('authorized_emails')
        .delete()
        .eq('id', id);

      if (error) {
        showMessage('ERRO: Execute o GRANT DELETE no SQL do Supabase.', 'error');
      } else {
        setAuthorized(prev => prev.filter(u => u.id !== id));
        showMessage('Registro removido com sucesso!', 'success');
      }
    } catch (err: any) {
      showMessage('Erro técnico ao excluir.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConcierge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!conciergeEmail.trim() || !tempPassword.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_create_user_secure', {
        input_email: conciergeEmail.trim().toLowerCase(),
        input_password: tempPassword.trim(),
        days_valid: 365 
      });

      if (error) {
        if (error.message.includes('candidate')) {
          throw new Error('CONFLITO DE FUNÇÃO: Rode o novo script SQL unificador no painel do Supabase.');
        }
        throw error;
      }

      if (data?.success) {
        setLastCreated({ e: conciergeEmail, p: tempPassword });
        showMessage('Acesso Premium Liberado!', 'success');
        setConciergeEmail('');
        setTempPassword('');
        fetchAuthorized();
      } else {
        throw new Error(data?.error || 'Ocorreu um erro ao criar o usuário.');
      }
    } catch (err: any) {
      console.error("Erro Concierge:", err);
      showMessage(err.message.toUpperCase(), 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyAccess = () => {
    if (!lastCreated) return;
    const text = `🚀 *Acesso Liberado - Placar Elite Pro*\n\n✅ *Sua conta já está pronta!*\n\n📧 *E-mail:* ${lastCreated.e}\n🔑 *Senha:* ${lastCreated.p}\n\n👉 *Como entrar?*\nBasta preencher os dados acima e clicar em *ENTRAR NA ARENA*.\n\n⚠️ *Atenção:* Não clique em "Primeiro Acesso", sua conta já foi criada por nós. Ao entrar pela primeira vez, o sistema pedirá para você criar sua senha definitiva.`;
    navigator.clipboard.writeText(text);
    showMessage('TEXTO COPIADO!', 'success');
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-8 animate-in fade-in duration-500 pb-32">
      <div className="text-center space-y-2 mb-8">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-white">Controle de Licenças</h1>
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Gestão Administrativa de Clientes</p>
      </div>

      {message.text && (
        <div className={`p-5 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest fixed top-20 left-1/2 -translate-x-1/2 w-[90%] max-w-md shadow-2xl z-[100] border animate-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-red-600 border-red-400 text-white'}`}>
          {message.text}
        </div>
      )}

      <section className="bg-gradient-to-br from-indigo-600/10 to-violet-600/5 border border-white/5 rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-4 opacity-5"><ZapIcon className="w-24 h-24" /></div>
        <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-6">Novo Acesso Direto (Concierge)</h2>
        
        <form onSubmit={handleCreateConcierge} className="space-y-3">
          <input 
            type="email" value={conciergeEmail} onChange={e => setConciergeEmail(e.target.value)}
            placeholder="E-mail do Cliente"
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-indigo-500 transition-all outline-none"
            required
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" value={tempPassword} onChange={e => setTempPassword(e.target.value)}
              placeholder="Senha Provisória"
              className="flex-1 bg-black/40 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm focus:border-indigo-500 outline-none"
              required
            />
            <button 
              type="submit" disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase text-[10px] tracking-widest px-8 py-4 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Processando...' : 'Liberar Agora'}
            </button>
          </div>
        </form>

        {lastCreated && (
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between animate-in zoom-in-95">
            <div className="flex flex-col truncate pr-4">
               <span className="text-[10px] font-bold text-emerald-400 truncate">{lastCreated.e}</span>
               <span className="text-[8px] font-black text-white/20 uppercase">Instrução de Login Pronta</span>
            </div>
            <button onClick={copyAccess} className="bg-emerald-500 text-white text-[9px] font-black px-4 py-2 rounded-xl active:scale-95 transition-transform shadow-lg shadow-emerald-900/20">Copiar WhatsApp</button>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">Base de Clientes</h2>
          <span className="text-[9px] font-black text-white/40">{authorized.length} REGISTROS</span>
        </div>

        <div className="space-y-2">
          {fetching ? (
            <div className="py-20 flex justify-center"><LoaderIcon className="w-8 h-8 text-white/5 animate-spin" /></div>
          ) : authorized.map(u => {
            const isExpired = new Date(u.expires_at).getTime() < Date.now();
            return (
              <div key={u.id} className={`bg-[#090e1a] border border-white/5 p-4 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${!u.is_active ? 'opacity-40 grayscale' : ''}`}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white/90 truncate max-w-[180px]">{u.email}</span>
                    <span className={`text-[7px] font-black px-2 py-0.5 rounded-full ${!u.is_active ? 'bg-red-500/20 text-red-500' : isExpired ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                      {!u.is_active ? 'SUSPENSO' : isExpired ? 'EXPIRADO' : 'ATIVO'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/20">
                    <CalendarIcon className="w-3 h-3" />
                    <span className="text-[8px] font-bold uppercase">Expira: {new Date(u.expires_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleToggleStatus(u)}
                    className={`px-3 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${u.is_active ? 'border-red-500/10 text-red-500/60 hover:bg-red-500/10' : 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10'}`}
                  >
                    {u.is_active ? 'Desativar' : 'Ativar'}
                  </button>

                  <div className="h-4 w-px bg-white/5 mx-1" />

                  <button onClick={() => handleExtendAccess(u.id, 1)} className="text-[8px] font-black uppercase bg-white/5 hover:bg-white/10 text-white/40 px-3 py-2 rounded-xl transition-all border border-white/5">+1 Mês</button>
                  
                  <button 
                    onClick={() => handleRemove(u.id)}
                    className="p-2.5 text-red-500/40 hover:text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-xl transition-all ml-1"
                  >
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default AccessControl;
