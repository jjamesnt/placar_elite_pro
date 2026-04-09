import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  LoaderIcon, Trash2Icon, CalendarIcon, RefreshCwIcon,
  ShieldIcon, UsersIcon, ZapIcon, PlusIcon, MinusIcon,
  CogIcon, XCircleIcon, CheckIcon, FileTextIcon, TrophyIcon, EditIcon, CrownIcon
} from '../components/icons';
import { UserLicense, Coupon, Plan } from '../types';

type AdminTab = 'geral' | 'usuarios' | 'cupons' | 'planos';

interface AdminProps {
  showAlert?: (title: string, message: string, type?: any, icon?: any) => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void, type?: any, icon?: any) => void;
}

const Admin: React.FC<AdminProps> = ({ showAlert, showConfirm }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('usuarios');
  const [licenses, setLicenses] = useState<UserLicense[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, totalCoupons: 0 });
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [selectingLicense, setSelectingLicense] = useState<UserLicense | null>(null);
  
  const [newCoupon, setNewCoupon] = useState({ code: '', days_bonus: 30, discount_pct: 0 });
  const [newPlan, setNewPlan] = useState({ name: '', price: 0, months_duration: 1, arenas_limit: 1, athletes_limit: 15, club_members_limit: 1 });

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // Fetch Licenses
      const { data: licenseData, error: lError } = await supabase
        .from('user_licenses')
        .select('*')
        .order('created_at', { ascending: false });
      if (lError) throw lError;
      setLicenses(licenseData || []);

      // Fetch Coupons
      const { data: couponData, error: cError } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (cError) throw cError;
      setCoupons(couponData || []);

      // Fetch Plans
      const { data: planData, error: pError } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });
      if (pError) throw pError;
      setPlans(planData || []);

      // Basic Stats
      setStats({
        totalUsers: licenseData?.length || 0,
        activeUsers: licenseData?.filter(l => l.is_active).length || 0,
        totalCoupons: couponData?.length || 0
      });

    } catch (err: any) {
      console.error("Erro Admin Fetch:", err);
      setErrorMsg(err.message || 'Erro ao carregar dados administrativos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const subscription = supabase
      .channel('admin_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_licenses' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'coupons' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'plans' }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Handlers
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
      if (showAlert) showAlert("Erro de Status", "Não foi possível alterar a atividade: " + err.message, 'danger', 'alert');
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
      if (showAlert) showAlert("Erro no Tempo", "Falha ao ajustar validade: " + err.message, 'danger', 'alert');
    } finally {
      setActionLoading(null);
    }
  };

  const handleChangePlan = async (license: UserLicense, plan: Plan) => {
    setActionLoading(license.id + '_plan');
    const newExpiry = new Date(Date.now() + (plan.months_duration * 30 * 24 * 60 * 60 * 1000)).toISOString();
    const isRealCoupon = license.applied_coupon && !license.applied_coupon.startsWith('PLANO:');

    try {
      const { data, error } = await supabase
        .from('user_licenses')
        .update({
          expires_at: newExpiry,
          is_active: true,
          athletes_limit: plan.athletes_limit,
          club_members_limit: plan.club_members_limit,
          arenas_limit: plan.arenas_limit,
          applied_coupon: isRealCoupon ? license.applied_coupon : `PLANO: ${plan.name}`
        })
        .eq('id', license.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setLicenses(prev => prev.map(l => l.id === license.id ? data : l));
        setSelectingLicense(null);
      }
    } catch (err: any) {
      if (showAlert) showAlert("Erro de Plano", "Falha ao migrar plano: " + err.message, 'danger', 'alert');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateLimit = async (license: UserLicense, field: 'arenas_limit' | 'athletes_limit' | 'club_members_limit', delta: number) => {
    const newVal = Math.max(1, (license[field] || 0) + delta);
    setActionLoading(`${license.id}_limit_${field}`);
    try {
      const { data, error } = await supabase
        .from('user_licenses')
        .update({ [field]: newVal })
        .eq('id', license.id)
        .select()
        .single();
      if (error) throw error;
      if (data) setLicenses(prev => prev.map(l => l.id === license.id ? data : l));
    } catch (err: any) {
      if (showAlert) showAlert("Erro de Limite", "Falha ao atualizar parâmetros: " + err.message, 'danger', 'alert');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleClubMode = (license: UserLicense) => {
    const executeToggle = async () => {
        setActionLoading(license.id + '_toggle_club');
        try {
          const { data, error } = await supabase
            .from('user_licenses')
            .update({ is_club: !license.is_club })
            .eq('id', license.id)
            .select()
            .single();
          if (error) throw error;
          if (data) setLicenses(prev => prev.map(l => l.id === license.id ? data : l));
        } catch (err: any) {
          if (showAlert) showAlert("Erro Modo Clube", "Falha ao processar alteração: " + err.message, 'danger', 'alert');
        } finally {
          setActionLoading(null);
        }
    };

    if (showConfirm) {
      showConfirm(
        license.is_club ? 'Desativar Modo Clube' : 'Ativar Modo Clube',
        license.is_club 
            ? `Remover status de clube de ${license.email}?`
            : `Conceder status de clube para ${license.email}?`,
        executeToggle,
        'warning',
        'crown'
      );
    }
  };

  const handleDeleteLicense = async (license: UserLicense) => {
    if (license.email === 'jjamesnt@gmail.com') return;
    const executeDelete = async () => {
        setActionLoading(license.id + '_del');
        try {
          const { error } = await supabase.from('user_licenses').delete().eq('id', license.id);
          if (error) throw error;
          setLicenses(prev => prev.filter(l => l.id !== license.id));
        } catch (err: any) {
          if (showAlert) showAlert("Erro ao Excluir", "Não foi possível remover a licença.", 'danger', 'alert');
        } finally {
          setActionLoading(null);
        }
    };
    if (showConfirm) {
        showConfirm('Excluir Licença', `Confirmar exclusão de ${license.email}?`, executeDelete, 'danger', 'trash');
    }
  };

  const handleUpdateCoupon = async (license: UserLicense, couponCode: string | null) => {
    setActionLoading(license.id + '_coupon_update');
    try {
      const { data, error } = await supabase
        .from('user_licenses')
        .update({ applied_coupon: couponCode })
        .eq('id', license.id)
        .select()
        .single();
      if (error) throw error;
      if (data) setLicenses(prev => prev.map(l => l.id === license.id ? data : l));
    } catch (err: any) {
      if (showAlert) showAlert("Erro no Cupom", "Falha ao atrelar cupom.", 'danger', 'alert');
    } finally {
      setActionLoading(null);
    }
  };

  // Coupons
  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return;
    setActionLoading('create_coupon');
    try {
      const { data, error } = await supabase
        .from('coupons')
        .insert([{
          code: newCoupon.code.toUpperCase(),
          days_bonus: newCoupon.days_bonus,
          discount_pct: newCoupon.discount_pct
        }])
        .select()
        .single();
      if (error) throw error;
      if (data) {
        setCoupons(prev => [data, ...prev]);
        setNewCoupon({ code: '', days_bonus: 30, discount_pct: 0 });
      }
    } catch (err: any) {
      if (showAlert) showAlert("Erro ao Criar", "Falha ao gerar cupom: " + err.message, 'danger', 'alert');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleCoupon = async (coupon: Coupon) => {
    setActionLoading(coupon.id + '_toggle');
    try {
      const { data, error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id)
        .select()
        .single();
      if (error) throw error;
      if (data) setCoupons(prev => prev.map(c => c.id === coupon.id ? data : c));
    } catch (err: any) {
      if (showAlert) showAlert("Falha de Cupom", "Erro ao mudar status.", 'danger', 'alert');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    const executeDelete = async () => {
        setActionLoading(id + '_del');
        try {
          const { error } = await supabase.from('coupons').delete().eq('id', id);
          if (error) throw error;
          setCoupons(prev => prev.filter(c => c.id !== id));
        } catch (err: any) {
          if (showAlert) showAlert("Erro ao Excluir", "Falha ao apagar.", 'danger', 'alert');
        } finally {
          setActionLoading(null);
        }
    };
    if (showConfirm) showConfirm('Remover Cupom', 'Tem certeza?', executeDelete, 'danger', 'trash');
  };

  // Plans
  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setNewPlan({
      name: plan.name,
      price: plan.price,
      months_duration: plan.months_duration,
      arenas_limit: plan.arenas_limit,
      athletes_limit: plan.athletes_limit,
      club_members_limit: plan.club_members_limit || 1
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(editingPlan ? 'update_plan' : 'create_plan');
    try {
      if (editingPlan) {
        const { data, error } = await supabase
          .from('plans')
          .update(newPlan)
          .eq('id', editingPlan.id)
          .select()
          .single();
        if (error) throw error;
        if (data) {
          setPlans(prev => prev.map(p => p.id === editingPlan.id ? data : p));
          setEditingPlan(null);
          setNewPlan({ name: '', price: 0, months_duration: 1, arenas_limit: 1, athletes_limit: 15, club_members_limit: 1 });
        }
      } else {
        const { data, error } = await supabase.from('plans').insert([newPlan]).select().single();
        if (error) throw error;
        if (data) {
          setPlans(prev => [...prev, data]);
          setNewPlan({ name: '', price: 0, months_duration: 1, arenas_limit: 1, athletes_limit: 15, club_members_limit: 1 });
        }
      }
    } catch (err: any) {
      if (showAlert) showAlert("Falha no Plano", "Erro ao salvar: " + err.message, 'danger', 'alert');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePlan = async (id: string) => {
    const executeDelete = async () => {
        setActionLoading(id + '_del_plan');
        try {
          const { error } = await supabase.from('plans').delete().eq('id', id);
          if (error) throw error;
          setPlans(prev => prev.filter(p => p.id !== id));
        } catch (err: any) {
          if (showAlert) showAlert("Erro ao Remover", "Falha ao excluir.", 'danger', 'alert');
        } finally {
          setActionLoading(null);
        }
    };
    if (showConfirm) showConfirm('Excluir Plano', 'Confirmar remoção?', executeDelete, 'danger', 'trash');
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
        
        {/* Navigation Tabs */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
          {(['usuarios', 'cupons', 'planos', 'geral'] as AdminTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-500 text-white' : 'text-white/30 hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button 
          onClick={fetchData}
          className="flex items-center gap-3 px-6 py-4 bg-gray-700 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
        >
          <RefreshCwIcon className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {errorMsg && (
        <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
           <h2 className="text-red-500 font-black uppercase text-xs mb-2">Erro</h2>
           <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest">{errorMsg}</p>
        </div>
      )}

      {/* TABS CONTENT */}
      {activeTab === 'usuarios' && (
        <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4">
          {licenses.length === 0 && (
             <div className="py-20 text-center flex flex-col items-center gap-6 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem]">
                <ShieldIcon className="w-12 h-12 text-white/5" />
                <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Nenhuma licença encontrada.</p>
             </div>
          )}
          {licenses.map(l => {
            const isExpired = new Date(l.expires_at).getTime() < Date.now();
            const isProcessing = actionLoading?.startsWith(l.id);
            return (
              <div key={l.id} className={`bg-[#090e1a]/80 border border-white/5 p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 transition-all ${!l.is_active ? 'opacity-40 grayscale blur-[1px]' : 'hover:border-white/10'}`}>
                <div className="flex-1 space-y-3 min-w-[200px]">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <span className="text-white font-bold text-base sm:text-lg truncate max-w-full sm:max-w-[250px]">{l.email}</span>
                    <div className={`w-fit px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest ${!l.is_active ? 'bg-red-500/20 text-red-500' : isExpired ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                      {!l.is_active ? 'SUSPENSO' : isExpired ? 'EXPIRADO' : 'ATIVO'}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-white/20">
                    <div className="flex items-center gap-2">
                      <CalendarIcon className="w-2.5 h-2.5" />
                      <span className="text-[8px] sm:text-[9px] font-black uppercase">{new Date(l.expires_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    {l.applied_coupon && (
                      <div className="flex items-center gap-2 text-amber-500">
                        <ZapIcon className="w-2.5 h-2.5" />
                        <span className="text-[8px] sm:text-[9px] font-black uppercase">{l.applied_coupon}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <div className="space-y-2 text-center">
                    <p className="text-[8px] font-black uppercase text-white/20">Arenas</p>
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
                      <button onClick={() => handleUpdateLimit(l, 'arenas_limit', -1)} disabled={isProcessing} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 flex items-center justify-center"><MinusIcon className="w-2 h-2" /></button>
                      <span className="text-xs font-black text-white w-4">{l.arenas_limit || 1}</span>
                      <button onClick={() => handleUpdateLimit(l, 'arenas_limit', 1)} disabled={isProcessing} className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center"><PlusIcon className="w-2 h-2" /></button>
                    </div>
                  </div>
                  <div className="space-y-2 text-center">
                    <p className="text-[8px] font-black uppercase text-white/20">Atletas</p>
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
                      <button onClick={() => handleUpdateLimit(l, 'athletes_limit', -5)} disabled={isProcessing} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 flex items-center justify-center"><MinusIcon className="w-2 h-2" /></button>
                      <span className="text-xs font-black text-white w-6">{l.athletes_limit || 15}</span>
                      <button onClick={() => handleUpdateLimit(l, 'athletes_limit', 5)} disabled={isProcessing} className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center"><PlusIcon className="w-2 h-2" /></button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                   <button onClick={() => handleToggleClubMode(l)} disabled={isProcessing} className={`px-4 py-2 rounded-xl text-[8px] font-black tracking-widest transition-all ${l.is_club ? 'bg-amber-500 text-black shadow-lg shadow-amber-900/20' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}>
                    {l.is_club ? 'CLUBE ATIVO' : 'MODO CLUBE'}
                  </button>
                  {l.is_club && (
                    <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl">
                       <button onClick={() => handleUpdateLimit(l, 'club_members_limit', -1)} disabled={isProcessing} className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 flex items-center justify-center"><MinusIcon className="w-2 h-2" /></button>
                       <span className="text-xs font-black text-white w-4">{l.club_members_limit || 1}</span>
                       <button onClick={() => handleUpdateLimit(l, 'club_members_limit', 1)} disabled={isProcessing} className="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center"><PlusIcon className="w-2 h-2" /></button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex flex-col gap-1">
                    <button onClick={() => setSelectingLicense(l)} className="px-3 py-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-[8px] font-black uppercase border border-indigo-500/20">Plano</button>
                    <div className="flex gap-1">
                      <button onClick={() => handleAdjustTime(l, 30)} className="px-2 py-1 bg-white/5 text-emerald-400 rounded-lg text-[7px] font-black border border-white/5">+30</button>
                      <button onClick={() => handleAdjustTime(l, -30)} className="px-2 py-1 bg-white/5 text-red-400 rounded-lg text-[7px] font-black border border-white/5">-30</button>
                    </div>
                  </div>
                  <button onClick={() => handleToggleStatus(l)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${l.is_active ? 'bg-red-500' : 'bg-emerald-500'} text-white`}>
                    {l.is_active ? <XCircleIcon className="w-5 h-5" /> : <CheckIcon className="w-5 h-5" />}
                  </button>
                  <button onClick={() => handleDeleteLicense(l)} className="w-10 h-10 bg-white/5 text-red-500/40 hover:text-red-500 rounded-xl flex items-center justify-center">
                    <Trash2Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'cupons' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
           {/* Create Coupon Form */}
           <div className="bg-amber-500/5 border border-amber-500/20 rounded-[2.5rem] p-8 space-y-4">
             <div className="flex items-center gap-4">
               <ZapIcon className="w-6 h-6 text-amber-500" />
               <h2 className="text-xl font-black text-white uppercase tracking-tighter">Gerar Novo Cupom</h2>
             </div>
             <form onSubmit={handleCreateCoupon} className="flex flex-wrap gap-4">
                <input type="text" placeholder="CÓDIGO" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold placeholder:text-white/10 outline-none focus:border-amber-500/50" />
                <input type="number" placeholder="DIAS" value={newCoupon.days_bonus} onChange={e => setNewCoupon({...newCoupon, days_bonus: parseInt(e.target.value)})} className="w-24 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none" title="Dias de Bônus" />
                <input type="number" placeholder="DESC %" value={newCoupon.discount_pct} onChange={e => setNewCoupon({...newCoupon, discount_pct: parseInt(e.target.value)})} className="w-24 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-bold outline-none" title="Desconto %" />
                <button type="submit" disabled={!newCoupon.code || !!actionLoading} className="px-8 bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-amber-400 transition-all active:scale-95 disabled:opacity-50">Criar</button>
             </form>
           </div>

           <div className="grid gap-4">
             {coupons.map(c => (
                <div key={c.id} className={`bg-[#090e1a]/80 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between transition-all ${!c.is_active ? 'opacity-30' : 'hover:border-white/10'}`}>
                  <div className="flex items-center gap-6">
                    <div className="text-amber-500 font-black text-xl tracking-tight bg-amber-500/10 px-6 py-3 rounded-2xl border border-amber-500/10 uppercase">{c.code}</div>
                    <div>
                       <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">+ {c.days_bonus} DIAS {c.discount_pct ? `| ${c.discount_pct}% DESC` : ''}</p>
                       <p className="text-[8px] font-bold text-white/10 uppercase">Usado {c.used_count || 0} vezes</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggleCoupon(c)} className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${c.is_active ? 'bg-white/5 text-white/40' : 'bg-emerald-600 text-white'}`}>{c.is_active ? 'Pausar' : 'Ativar'}</button>
                    <button onClick={() => handleDeleteCoupon(c.id)} className="w-10 h-10 bg-white/5 text-red-500/40 hover:text-red-500 rounded-lg flex items-center justify-center transition-all"><Trash2Icon className="w-5 h-5" /></button>
                  </div>
                </div>
             ))}
           </div>
        </div>
      )}

      {activeTab === 'planos' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-violet-500/5 border border-violet-500/20 rounded-[2.5rem] p-8 space-y-6">
             <div className="flex items-center gap-4">
                <TrophyIcon className="w-6 h-6 text-violet-500" />
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">{editingPlan ? 'Editar Plano' : 'Novo Plano'}</h2>
             </div>
             <form onSubmit={handleCreatePlan} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <input type="text" placeholder="Nome" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} className="sm:col-span-2 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500/50" />
                <input type="number" placeholder="Preço" value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: parseFloat(e.target.value)})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                <input type="number" placeholder="Meses" value={newPlan.months_duration} onChange={e => setNewPlan({...newPlan, months_duration: parseInt(e.target.value)})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                <input type="number" placeholder="Arenas" value={newPlan.arenas_limit} onChange={e => setNewPlan({...newPlan, arenas_limit: parseInt(e.target.value)})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                <input type="number" placeholder="Atletas" value={newPlan.athletes_limit} onChange={e => setNewPlan({...newPlan, athletes_limit: parseInt(e.target.value)})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                <input type="number" placeholder="Membros Clube" value={newPlan.club_members_limit} onChange={e => setNewPlan({...newPlan, club_members_limit: parseInt(e.target.value)})} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white outline-none" />
                <div className="flex gap-2 lg:col-span-3">
                  <button type="submit" className="flex-1 bg-violet-600 text-white font-black uppercase text-[10px] tracking-widest py-4 rounded-xl hover:bg-violet-500 transition-all">{editingPlan ? 'Salvar Plano' : 'Criar Plano'}</button>
                  {editingPlan && <button type="button" onClick={() => { setEditingPlan(null); setNewPlan({ name: '', price: 0, months_duration: 1, arenas_limit: 1, athletes_limit: 15, club_members_limit: 1 }); }} className="px-6 bg-white/5 text-white/40 uppercase text-[10px] font-black rounded-xl">Cancelar</button>}
                </div>
             </form>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {plans.map(p => (
               <div key={p.id} className="bg-[#090e1a]/80 border border-white/5 p-6 rounded-3xl space-y-4 hover:border-violet-500/30 transition-all">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-black uppercase text-sm tracking-tight">{p.name}</h4>
                      <p className="text-[10px] font-bold text-violet-400">R$ {p.price.toFixed(2)} / {p.months_duration} Mês</p>
                    </div>
                    <div className="flex gap-1">
                       <button onClick={() => handleEditPlan(p)} className="p-1.5 text-white/20 hover:text-white transition-all"><EditIcon className="w-4 h-4" /></button>
                       <button onClick={() => handleDeletePlan(p.id)} className="p-1.5 text-white/20 hover:text-red-500 transition-all"><Trash2Icon className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2 border-t border-white/5 text-[9px] font-black uppercase tracking-widest text-white/30">
                     <div className="flex justify-between"><span>Arenas</span><span className="text-white">{p.arenas_limit}</span></div>
                     <div className="flex justify-between"><span>Atletas/Arena</span><span className="text-white">{p.athletes_limit}</span></div>
                     <div className="flex justify-between"><span>Membros Clube</span><span className="text-white">{p.club_members_limit}</span></div>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'geral' && (
        <div className="py-20 text-center space-y-8 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem] animate-in zoom-in-95">
           <ShieldIcon className="w-16 h-16 text-white/5 mx-auto" />
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto px-8">
              <div className="space-y-1">
                 <p className="text-3xl font-black text-white">{stats.totalUsers}</p>
                 <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">Base Total</p>
              </div>
              <div className="space-y-1">
                 <p className="text-3xl font-black text-emerald-500">{stats.activeUsers}</p>
                 <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">Contas Ativas</p>
              </div>
              <div className="space-y-1">
                 <p className="text-3xl font-black text-amber-500">{stats.totalCoupons}</p>
                 <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">Promoções</p>
              </div>
           </div>
        </div>
      )}

      {/* PLAN MODAL */}
      {selectingLicense && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] flex items-center justify-center p-6 overflow-y-auto" onClick={() => setSelectingLicense(null)}>
          <div className="bg-[#090e1a] border border-indigo-500/30 rounded-[3rem] p-8 w-full max-w-2xl shadow-2xl space-y-8" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Alterar Plano</h2>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">USUÁRIO: {selectingLicense.email}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plans.map(p => (
                <button
                  key={p.id}
                  onClick={() => handleChangePlan(selectingLicense, p)}
                  disabled={!!actionLoading}
                  className="bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 p-6 rounded-[2rem] text-left transition-all active:scale-95 group"
                >
                  <h4 className="text-white font-black uppercase tracking-tight text-lg mb-1">{p.name}</h4>
                  <p className="text-[10px] font-extrabold text-indigo-400/60 uppercase mb-4">R$ {p.price.toFixed(2)} / {p.months_duration} MESES</p>
                  <div className="space-y-1 text-[8px] font-black uppercase tracking-widest text-white/40 border-t border-white/10 pt-4">
                    <p>Arenas: {p.arenas_limit}</p>
                    <p>Atletas: {p.athletes_limit}</p>
                    <p>Clube: {p.club_members_limit}</p>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setSelectingLicense(null)} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-all">Fechar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
