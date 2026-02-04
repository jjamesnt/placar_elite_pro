
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UserLicense } from '../types';
import { LoaderIcon, Trash2Icon, CalendarIcon, RefreshCwIcon, ShieldIcon } from '../components/icons';

const Admin: React.FC = () => {
  const [licenses, setLicenses] = useState<UserLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchLicenses = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase
        .from('user_licenses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) setLicenses(data);
    } catch (err: any) {
      console.error("Erro Admin:", err);
      setErrorMsg(err.message || 'Erro ao carregar licenças.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
    
    // Inscrição em tempo real para ver novos usuários surgindo
    const subscription = supabase
      .channel('admin_licenses')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_licenses' }, () => {
        fetchLicenses();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const handleToggleStatus = async (license: UserLicense) => {
    setActionLoading(license.id + '_toggle');
    try {
      const { data, error } = await supabase
        .from('user_licenses')
        .update({ is_active: !license.is_active })
        .eq('id', license.id)
        .select()
        .single();

      if (error) throw error;
      if (data) setLicenses(prev => prev.map(l => l.id === license.id ? data : l));
    } catch (err: any) {
      alert("Erro ao alterar status: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdjustTime = async (license: UserLicense, days: number) => {
    setActionLoading(license.id + (days > 0 ? '_add' : '_sub'));
    const currentExpiry = new Date(license.expires_at).getTime() > Date.now() 
      ? new Date(license.expires_at) 
      : new Date();
    const newExpiry = new Date(currentExpiry.getTime() + (days * 24 * 60 * 60 * 1000)).toISOString();

    try {
      const { data, error } = await supabase
        .from('user_licenses')
        .update({ expires_at: newExpiry, is_active: true })
        .eq('id', license.id)
        .select()
        .single();

      if (error) throw error;
      if (data) setLicenses(prev => prev.map(l => l.id === license.id ? data : l));
    } catch (err: any) {
      alert("Erro ao ajustar tempo: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (license: UserLicense) => {
    if (license.email === 'jjamesnt@gmail.com') return alert("Master Admin não pode ser removido.");
    if (!window.confirm(`Excluir licença de ${license.email}?`)) return;
    
    setActionLoading(license.id + '_del');
    try {
      const { error } = await supabase.from('user_licenses').delete().eq('id', license.id);
      if (error) throw error;
      setLicenses(prev => prev.filter(l => l.id !== license.id));
    } catch (err: any) {
      alert("Erro ao excluir. Verifique as permissões RLS.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && licenses.length === 0) return (
    <div className="h-full w-full flex flex-col items-center justify-center p-20 gap-4">
      <LoaderIcon className="w-12 h-12 animate-spin text-indigo-500" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Sincronizando Banco...</p>
    </div>
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-8 animate-in fade-in pb-32">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Gestão de Licenças</h1>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Painel de Controle Administrativo</p>
        </div>
        <button 
          onClick={fetchLicenses}
          className="flex items-center gap-3 px-6 py-4 bg-indigo-500 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-900/20 active:scale-95 transition-all"
        >
          <RefreshCwIcon className="w-4 h-4" />
          Atualizar Lista
        </button>
      </div>

      {errorMsg && (
        <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
           <h2 className="text-red-500 font-black uppercase text-xs mb-2">Erro de Acesso</h2>
           <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {licenses.length === 0 && !loading && (
        <div className="py-20 text-center flex flex-col items-center gap-6 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem]">
           <ShieldIcon className="w-12 h-12 text-white/5" />
           <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Nenhuma licença encontrada.</p>
        </div>
      )}

      <div className="grid gap-4">
        {licenses.map(l => {
          const isExpired = new Date(l.expires_at).getTime() < Date.now();
          const isProcessing = actionLoading?.startsWith(l.id);

          return (
            <div key={l.id} className={`bg-[#090e1a]/80 border border-white/5 p-6 rounded-[2rem] flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all ${!l.is_active ? 'opacity-40 grayscale' : 'hover:border-white/10'}`}>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <span className="text-white font-bold text-base truncate max-w-[220px]">{l.email}</span>
                  <div className={`px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest ${!l.is_active ? 'bg-red-500/20 text-red-500' : isExpired ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                    {!l.is_active ? 'SUSPENSO' : isExpired ? 'EXPIRADO' : 'ATIVO'}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-white/20">
                  <CalendarIcon className="w-3 h-3" />
                  <span className="text-[9px] font-black uppercase">Vencimento: {new Date(l.expires_at).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => handleAdjustTime(l, -30)} disabled={isProcessing} className="bg-white/5 hover:bg-white/10 text-white/30 hover:text-white px-4 py-2.5 rounded-xl text-[9px] font-black transition-all">-30d</button>
                <button onClick={() => handleAdjustTime(l, 30)} disabled={isProcessing} className="bg-white/5 hover:bg-white/10 text-white/30 hover:text-white px-4 py-2.5 rounded-xl text-[9px] font-black transition-all">+30d</button>
                
                <div className="w-px h-6 bg-white/5 mx-2" />
                
                <button 
                  onClick={() => handleToggleStatus(l)}
                  disabled={isProcessing}
                  className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border ${l.is_active ? 'border-red-500/20 text-red-500 hover:bg-red-500/10' : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20'}`}
                >
                  {l.is_active ? 'Suspender' : 'Ativar'}
                </button>

                <button 
                  onClick={() => handleDelete(l)}
                  disabled={isProcessing}
                  className="p-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all active:scale-75 ml-1"
                >
                  <Trash2Icon className="w-5 h-5 opacity-40 hover:opacity-100" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Admin;
