
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  LoaderIcon, Trash2Icon, CalendarIcon, RefreshCwIcon,
  ShieldIcon, UsersIcon, ZapIcon, PlusIcon, MinusIcon,
  CogIcon, XCircleIcon, CheckIcon, FileTextIcon, TrophyIcon, EditIcon
} from '../components/icons';
import { UserLicense, Coupon, Plan } from '../types';


type AdminTab = 'geral' | 'usuarios' | 'cupons' | 'planos';

const Admin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('usuarios');
  const [licenses, setLicenses] = useState<UserLicense[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [selectingLicense, setSelectingLicense] = useState<UserLicense | null>(null);

  // Stats
  const stats = {
    totalUsers: licenses.length,
    activeUsers: licenses.filter(l => l.is_active && new Date(l.expires_at).getTime() > Date.now()).length,
    expiredUsers: licenses.filter(l => new Date(l.expires_at).getTime() <= Date.now()).length,
    totalCoupons: coupons.length,
    totalPlans: plans.length
  };

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const { data: lData, error: lError } = await supabase
        .from('user_licenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (lError) throw lError;
      if (lData) setLicenses(lData);

      const { data: cData, error: cError } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (cError) throw cError;
      if (cData) setCoupons(cData);

      const { data: pData, error: pError } = await supabase
        .from('plans')
        .select('*')
        .order('created_at', { ascending: false });

      if (pError) throw pError;
      if (pData) setPlans(pData);

    } catch (err: any) {
      console.error("Erro Admin:", err);
      setErrorMsg(err.message || 'Erro ao carregar dados administrativos.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (licenses.length === 0) return;

    const headers = ['Email', 'Status', 'Vencimento', 'Arenas', 'Atletas'];
    const rows = licenses.map(l => {
      const isExpired = new Date(l.expires_at).getTime() < Date.now();
      const status = !l.is_active ? 'SUSPENSO' : isExpired ? 'EXPIRADO' : 'ATIVO';
      return [
        l.email,
        status,
        new Date(l.expires_at).toLocaleDateString('pt-BR'),
        l.arenas_limit || 1,
        l.athletes_limit || 15,
        l.applied_coupon || '-'
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_usuarios_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const handleChangePlan = async (license: UserLicense, plan: Plan) => {
    setActionLoading(license.id + '_plan');
    const newExpiry = new Date(Date.now() + (plan.months_duration * 30 * 24 * 60 * 60 * 1000)).toISOString();

    // Check if current coupon is a real coupon (not a PLANO: marker)
    const isRealCoupon = license.applied_coupon && !license.applied_coupon.startsWith('PLANO:');

    try {
      const { data, error } = await supabase
        .from('user_licenses')
        .update({
          expires_at: newExpiry,
          is_active: true,
          arenas_limit: plan.arenas_limit,
          athletes_limit: plan.athletes_limit,
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
      alert("Erro ao trocar plano: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateLimit = async (license: UserLicense, field: 'arenas_limit' | 'athletes_limit', delta: number) => {
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
      alert("Erro ao atualizar limite: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteLicense = async (license: UserLicense) => {
    if (license.email === 'jjamesnt@gmail.com') return alert("Master Admin não pode ser removido.");
    if (!window.confirm(`Excluir licença de ${license.email}?`)) return;

    setActionLoading(license.id + '_del');
    try {
      const { error } = await supabase.from('user_licenses').delete().eq('id', license.id);
      if (error) throw error;
      setLicenses(prev => prev.filter(l => l.id !== license.id));
    } catch (err: any) {
      alert("Erro ao excluir licença.");
    } finally {
      setActionLoading(null);
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
      alert("Erro ao atualizar cupom: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  // Coupon Handlers
  const [newCoupon, setNewCoupon] = useState({ code: '', days_bonus: 30, discount_pct: 0 });

  // Plan Handlers
  const [newPlan, setNewPlan] = useState({ name: '', price: 0, months_duration: 1, arenas_limit: 1, athletes_limit: 15 });

  const handleEditPlan = (plan: Plan) => {
    setEditingPlan(plan);
    setNewPlan({
      name: plan.name,
      price: plan.price,
      months_duration: plan.months_duration,
      arenas_limit: plan.arenas_limit,
      athletes_limit: plan.athletes_limit
    });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
      alert("Erro ao criar cupom: " + err.message);
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
      alert("Erro ao alterar cupom.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm("Excluir este cupom permanentemente?")) return;
    setActionLoading(id + '_del');
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
      setCoupons(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      alert("Erro ao excluir cupom.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.name.trim()) return;
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
          setNewPlan({ name: '', price: 0, months_duration: 1, arenas_limit: 1, athletes_limit: 15 });
        }
      } else {
        const { data, error } = await supabase
          .from('plans')
          .insert([newPlan])
          .select()
          .single();
        if (error) throw error;
        if (data) {
          setPlans(prev => [data, ...prev]);
          setNewPlan({ name: '', price: 0, months_duration: 1, arenas_limit: 1, athletes_limit: 15 });
        }
      }
    } catch (err: any) {
      alert("Erro ao salvar plano: " + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (!window.confirm("Excluir este plano definitivamente?")) return;
    setActionLoading(id + '_del_plan');
    try {
      const { error } = await supabase.from('plans').delete().eq('id', id);
      if (error) throw error;
      setPlans(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert("Erro ao excluir plano: " + (err?.message || "Erro desconhecido"));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && licenses.length === 0) return (
    <div className="h-full w-full flex flex-col items-center justify-center p-20 gap-4">
      <LoaderIcon className="w-12 h-12 animate-spin text-indigo-500" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 text-center">Iniciando Dashboard Inteligente...</p>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-4 space-y-8 animate-in fade-in pb-32">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter">Painel de Controle</h1>
          <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">Elite Pro Administration System</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x touch-pan-x">
          <button onClick={() => setActiveTab('geral')} className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'geral' ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>Geral</button>
          <button onClick={() => setActiveTab('usuarios')} className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'usuarios' ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>Usuários</button>
          <button onClick={() => setActiveTab('planos')} className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'planos' ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>Planos</button>
          <button onClick={() => setActiveTab('cupons')} className={`flex-shrink-0 snap-start px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'cupons' ? 'bg-white text-black shadow-lg' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}>Cupons</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Usuários', val: stats.totalUsers, color: 'indigo', icon: UsersIcon },
          { label: 'Ativos', val: stats.activeUsers, color: 'emerald', icon: ShieldIcon },
          { label: 'Expirados', val: stats.expiredUsers, color: 'rose', icon: XCircleIcon },
          { label: 'Planos', val: stats.totalPlans, color: 'violet', icon: TrophyIcon },
          { label: 'Cupons', val: stats.totalCoupons, color: 'amber', icon: ZapIcon },
        ].map((s, idx) => (
          <div key={idx} className="bg-[#090e1a]/80 border border-white/5 p-6 rounded-[2rem] space-y-2 relative overflow-hidden group">
            <s.icon className={`absolute -right-2 -bottom-2 w-16 h-16 opacity-5 transform group-hover:scale-110 transition-transform`} />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/20">{s.label}</p>
            <p className="text-4xl font-black text-white">{s.val}</p>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-3xl text-center">
          <h2 className="text-red-500 font-black uppercase text-xs mb-2">Falha na Sincronização</h2>
          <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest leading-relaxed">{errorMsg}</p>
        </div>
      )}

      {/* Tab Contents */}
      <div className="mt-8">
        {activeTab === 'usuarios' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-white/40 flex items-center gap-3">
                <UsersIcon className="w-4 h-4" /> Gestão de Licenças
              </h2>
              <button onClick={fetchData} className="p-2 text-white/20 hover:text-white transition-all"><RefreshCwIcon className="w-4 h-4" /></button>
            </div>

            <div className="grid gap-4">
              {licenses.map(l => {
                const isExpired = new Date(l.expires_at).getTime() < Date.now();
                const isProcessing = actionLoading?.startsWith(l.id);

                return (
                  <div key={l.id} className={`bg-[#090e1a]/80 border border-white/5 p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] flex flex-col lg:flex-row lg:items-center justify-between gap-6 sm:gap-8 transition-all ${!l.is_active ? 'opacity-40 grayscale blur-[1px]' : 'hover:border-white/10'}`}>
                    {/* User Info */}
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
                        <div className="flex items-center gap-2">
                          <ShieldIcon className="w-2.5 h-2.5" />
                          <span className="text-[8px] sm:text-[9px] font-black uppercase">ID: {l.id.slice(0, 8)}</span>
                        </div>
                        {l.applied_coupon && (
                          <div className="flex items-center gap-2 text-amber-500">
                            <ZapIcon className="w-2.5 h-2.5" />
                            <span className="text-[8px] sm:text-[9px] font-black uppercase">Cupom: {l.applied_coupon}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Limits Control */}
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="space-y-2">
                        <p className="text-[8px] font-black uppercase tracking-tighter text-white/20 text-center">Limite Arenas</p>
                        <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                          <button onClick={() => handleUpdateLimit(l, 'arenas_limit', -1)} disabled={isProcessing} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-all"><MinusIcon className="w-3 h-3" /></button>
                          <span className="text-sm font-black text-white w-4 text-center">{l.arenas_limit || 1}</span>
                          <button onClick={() => handleUpdateLimit(l, 'arenas_limit', 1)} disabled={isProcessing} className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all shadow-lg shadow-indigo-900/20"><PlusIcon className="w-3 h-3" /></button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[8px] font-black uppercase tracking-tighter text-white/20 text-center">Atletas / Arena</p>
                        <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-2xl border border-white/5">
                          <button onClick={() => handleUpdateLimit(l, 'athletes_limit', -5)} disabled={isProcessing} className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white flex items-center justify-center transition-all"><MinusIcon className="w-3 h-3" /></button>
                          <span className="text-sm font-black text-white w-6 text-center">{l.athletes_limit || 15}</span>
                          <button onClick={() => handleUpdateLimit(l, 'athletes_limit', 5)} disabled={isProcessing} className="w-8 h-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all shadow-lg shadow-indigo-900/20"><PlusIcon className="w-3 h-3" /></button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[8px] font-black uppercase tracking-tighter text-white/20 text-center">Cupom Atribuído</p>
                        <select
                          value={l.applied_coupon || ''}
                          onChange={(e) => handleUpdateCoupon(l, e.target.value || null)}
                          disabled={isProcessing}
                          className="bg-white/5 border border-white/5 rounded-2xl px-3 py-2 text-[9px] font-black uppercase text-white outline-none focus:border-indigo-500/50 transition-all w-32"
                        >
                          <option value="" className="bg-[#090e1a]">Nenhum</option>
                          {coupons.filter(c => c.is_active).map(c => (
                            <option key={c.id} value={c.code} className="bg-[#090e1a]">{c.code}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between sm:justify-start gap-2 pt-4 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      <div className="flex-1 flex flex-col gap-1 sm:w-32">
                        <button onClick={() => setSelectingLicense(l)} disabled={isProcessing} className="w-full px-4 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 rounded-xl text-[8px] font-black uppercase border border-indigo-500/20 transition-all">Trocar Plano</button>
                        <div className="flex gap-1">
                          <button onClick={() => handleAdjustTime(l, 30)} disabled={isProcessing} className="flex-1 px-3 py-2 bg-white/5 hover:bg-emerald-500/20 text-white/40 hover:text-emerald-400 rounded-xl text-[7px] font-black uppercase border border-white/5 transition-all">+30D</button>
                          <button onClick={() => handleAdjustTime(l, -30)} disabled={isProcessing} className="flex-1 px-3 py-2 bg-white/5 hover:bg-red-500/20 text-white/40 hover:text-red-400 rounded-xl text-[7px] font-black uppercase border border-white/5 transition-all">-30D</button>
                        </div>
                      </div>

                      <div className="hidden sm:block w-px h-12 bg-white/5 mx-1" />

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(l)}
                          disabled={isProcessing}
                          className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 ${l.is_active ? 'bg-red-500 text-white shadow-lg shadow-red-900/20' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'}`}
                          title={l.is_active ? 'Suspender' : 'Ativar'}
                        >
                          {l.is_active ? <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <CheckIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                        </button>

                        <button
                          onClick={() => handleDeleteLicense(l)}
                          disabled={isProcessing}
                          className="w-11 h-11 sm:w-12 sm:h-12 bg-white/5 text-red-500/40 hover:text-red-500 rounded-2xl flex items-center justify-center transition-all active:scale-90"
                        >
                          <Trash2Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'cupons' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* New Coupon Form */}
            <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500"><ZapIcon className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">Gerador de Cupons</h2>
                  <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest">Crie bônus imediatos para novos clientes</p>
                </div>
              </div>

              <form onSubmit={handleCreateCoupon} className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    placeholder="CÓDIGO (EX: ELITE30)"
                    value={newCoupon.code}
                    onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                    className="flex-[2] bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-bold placeholder:text-white/10 outline-none focus:border-amber-500/50 transition-all uppercase"
                  />
                  <div className="flex-1 flex items-center gap-4 bg-black/20 border border-white/5 rounded-2xl px-6 py-4">
                    <span className="text-[10px] font-black uppercase text-white/20 whitespace-nowrap">Bônus:</span>
                    <input
                      type="number"
                      value={newCoupon.days_bonus}
                      onChange={e => setNewCoupon({ ...newCoupon, days_bonus: parseInt(e.target.value) })}
                      className="bg-transparent text-white font-black text-sm outline-none w-full"
                    />
                    <span className="text-[10px] font-black uppercase text-white/40">Dias</span>
                  </div>
                  <div className="flex-1 flex items-center gap-4 bg-black/20 border border-white/5 rounded-2xl px-6 py-4">
                    <span className="text-[10px] font-black uppercase text-white/20 whitespace-nowrap">Desc:</span>
                    <input
                      type="number"
                      value={newCoupon.discount_pct}
                      onChange={e => setNewCoupon({ ...newCoupon, discount_pct: parseInt(e.target.value) })}
                      className="bg-transparent text-white font-black text-sm outline-none w-full"
                    />
                    <span className="text-[10px] font-black uppercase text-white/40">%</span>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!newCoupon.code || actionLoading === 'create_coupon'}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[10px] tracking-widest px-10 rounded-2xl transition-all active:scale-95 shadow-xl shadow-amber-900/20 disabled:opacity-50 h-14"
                >
                  Gerar Cupom
                </button>
              </form>
            </div>

            {/* Coupons List */}
            <div className="grid gap-4">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/20 ml-4 py-2">Cupons Ativos ({coupons.length})</h3>
              {coupons.map(c => (
                <div key={c.id} className={`bg-[#090e1a]/80 border border-white/5 p-6 rounded-[2rem] flex items-center justify-between gap-6 transition-all ${!c.is_active ? 'opacity-30' : 'hover:border-white/10'}`}>
                  <div className="flex items-center gap-6">
                    <div className="text-amber-500 font-black text-xl tracking-tight bg-amber-500/10 px-6 py-3 rounded-2xl border border-amber-500/10">{c.code}</div>
                    <div className="hidden sm:block">
                      <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">
                        + {c.days_bonus} DIAS {c.discount_pct ? `| ${c.discount_pct}% DESC` : ''}
                      </p>
                      <p className="text-[8px] font-bold uppercase text-white/10">USADO {c.used_count || 0} VEZES</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleCoupon(c)}
                      className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${c.is_active ? 'bg-white/5 text-white/40' : 'bg-emerald-600 text-white'}`}
                    >
                      {c.is_active ? 'Pausar' : 'Ativar'}
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(c.id)}
                      className="w-11 h-11 bg-white/5 text-red-500/40 hover:text-red-500 rounded-xl flex items-center justify-center transition-all"
                    >
                      <Trash2Icon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'planos' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            {/* New Plan Form */}
            <div className="bg-gradient-to-br from-violet-500/10 to-transparent border border-violet-500/20 rounded-[2.5rem] p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-violet-500/20 rounded-2xl flex items-center justify-center text-violet-500"><TrophyIcon className="w-6 h-6" /></div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">{editingPlan ? 'Editar Nível' : 'Níveis de Assinatura'}</h2>
                  <p className="text-[9px] font-black text-violet-500/60 uppercase tracking-widest">{editingPlan ? `Alterando: ${editingPlan.name}` : 'Configure os pacotes e limites do sistema'}</p>
                </div>
              </div>

              <form onSubmit={handleCreatePlan} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <input
                    type="text" placeholder="NOME DO PLANO (EX: PLANO ARENA PRO)"
                    value={newPlan.name} onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-4 text-white text-sm font-bold placeholder:text-white/10 outline-none focus:border-violet-500/50 transition-all"
                  />
                </div>
                <div className="md:col-span-1 flex gap-2">
                  {editingPlan && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPlan(null);
                        setNewPlan({ name: '', price: 0, months_duration: 1, arenas_limit: 1, athletes_limit: 15 });
                      }}
                      className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black uppercase text-[10px] tracking-widest px-4 rounded-2xl transition-all h-14"
                    >
                      Cancelar
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={!newPlan.name || !!actionLoading}
                    className={`flex-[2] bg-violet-600 hover:bg-violet-500 text-white font-black uppercase text-[10px] tracking-widest px-6 rounded-2xl transition-all active:scale-95 shadow-xl shadow-violet-900/20 disabled:opacity-50 h-14`}
                  >
                    {actionLoading ? 'Salvando...' : editingPlan ? 'Salvar Alterações' : 'Criar Nível'}
                  </button>
                </div>
                <div className="flex items-center gap-4 bg-black/20 border border-white/5 rounded-2xl px-6 py-4">
                  <span className="text-[10px] font-black uppercase text-white/20">Preço:</span>
                  <input type="number" value={newPlan.price} onChange={e => setNewPlan({ ...newPlan, price: parseFloat(e.target.value) })} className="bg-transparent text-white font-black text-sm outline-none w-full" />
                  <span className="text-[10px] font-black uppercase text-white/40">R$</span>
                </div>
                <div className="flex items-center gap-4 bg-black/20 border border-white/5 rounded-2xl px-6 py-4">
                  <span className="text-[10px] font-black uppercase text-white/20">Duração:</span>
                  <input type="number" value={newPlan.months_duration} onChange={e => setNewPlan({ ...newPlan, months_duration: parseInt(e.target.value) })} className="bg-transparent text-white font-black text-sm outline-none w-full" />
                  <span className="text-[10px] font-black uppercase text-white/40">Meses</span>
                </div>
                <div className="flex items-center gap-4 bg-black/20 border border-white/5 rounded-2xl px-6 py-4">
                  <span className="text-[10px] font-black uppercase text-white/20 text-xs">Arenas:</span>
                  <input type="number" value={newPlan.arenas_limit} onChange={e => setNewPlan({ ...newPlan, arenas_limit: parseInt(e.target.value) })} className="bg-transparent text-white font-black text-sm outline-none w-full" />
                </div>
                <div className="flex items-center gap-4 bg-black/20 border border-white/5 rounded-2xl px-6 py-4">
                  <span className="text-[10px] font-black uppercase text-white/20 text-xs text-nowrap">Atletas:</span>
                  <input type="number" value={newPlan.athletes_limit} onChange={e => setNewPlan({ ...newPlan, athletes_limit: parseInt(e.target.value) })} className="bg-transparent text-white font-black text-sm outline-none w-full" />
                </div>
              </form>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map(p => (
                <div key={p.id} className="bg-[#090e1a]/80 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden group hover:border-violet-500/30 transition-all">
                  <div className="absolute -right-4 -top-4 w-24 h-24 bg-violet-500/10 blur-2xl group-hover:bg-violet-500/20 transition-all" />
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h4 className="text-white font-black uppercase tracking-tight text-lg">{p.name}</h4>
                      <p className="text-[10px] font-extrabold text-violet-400/60 uppercase">R$ {p.price.toFixed(2)} / {p.months_duration} MESES</p>
                    </div>
                    <div className="flex gap-1 relative z-10">
                      <button onClick={() => handleEditPlan(p)} className="p-2 text-white/10 hover:text-white transition-all"><EditIcon className="w-5 h-5" /></button>
                      <button onClick={() => handleDeletePlan(p.id)} className="p-2 text-white/10 hover:text-red-500 transition-all"><Trash2Icon className="w-5 h-5" /></button>
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-white/5">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-white/20">Arenas</span>
                      <span className="text-white">{p.arenas_limit}</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-white/20">Atletas/Arena</span>
                      <span className="text-white">{p.athletes_limit}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'geral' && (
          <div className="py-20 text-center space-y-6 bg-white/[0.02] border border-dashed border-white/10 rounded-[3rem] animate-in zoom-in-95">
            <ShieldIcon className="w-16 h-16 text-white/5 mx-auto" />
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Status Total do Sistema</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mt-2">Relatório de Saúde da Infraestrutura</p>
            </div>

            <div className="flex flex-wrap justify-center gap-8 pt-6">
              <div className="text-center">
                <p className="text-3xl font-black text-white">{stats.totalUsers}</p>
                <p className="text-[8px] font-black uppercase text-white/20 tracking-widest">Base Total</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-emerald-500">{stats.activeUsers}</p>
                <p className="text-[8px] font-black uppercase text-white/20 tracking-widest">Contas Ativas</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black text-amber-500">{stats.totalCoupons}</p>
                <p className="text-[8px] font-black uppercase text-white/20 tracking-widest">Promoções</p>
              </div>
            </div>

            <div className="pt-10 flex justify-center">
              <button
                onClick={handleGenerateReport}
                className="flex items-center gap-3 px-8 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-900/30 transition-all active:scale-95 group"
              >
                <FileTextIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Gerar Relatório Completo (CSV)
              </button>
            </div>
          </div>
        )}
      </div>
      {selectingLicense && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] flex items-center justify-center p-6 overflow-y-auto" onClick={() => setSelectingLicense(null)}>
          <div className="bg-[#090e1a] border border-indigo-500/30 rounded-[3rem] p-8 w-full max-w-2xl shadow-2xl space-y-8 my-auto" onClick={e => e.stopPropagation()}>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Alterar Plano</h2>
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-relaxed">
                USUÁRIO: <span className="text-white">{selectingLicense.email}</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plans.map(p => {
                const userCoupon = selectingLicense.applied_coupon ? coupons.find(c => c.code === selectingLicense.applied_coupon && c.is_active) : null;
                const finalPrice = userCoupon?.discount_pct ? p.price * (1 - userCoupon.discount_pct / 100) : p.price;

                return (
                  <button
                    key={p.id}
                    onClick={() => handleChangePlan(selectingLicense, p)}
                    disabled={!!actionLoading}
                    className="bg-white/5 hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 p-6 rounded-[2rem] text-left transition-all group relative overflow-hidden active:scale-95"
                  >
                    <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/5 blur-xl group-hover:bg-indigo-500/20 transition-all" />
                    <h4 className="text-white font-black uppercase tracking-tight text-lg mb-1">{p.name}</h4>
                    <div className="flex flex-col mb-4">
                      <p className="text-[10px] font-extrabold text-indigo-400/60 uppercase">R$ {finalPrice.toFixed(2)} / {p.months_duration} MESES</p>
                      {userCoupon?.discount_pct && (
                        <p className="text-[7px] font-black text-emerald-500 uppercase">Com {userCoupon.discount_pct}% Desc ({userCoupon.code})</p>
                      )}
                    </div>

                    <div className="space-y-1.5 pt-4 border-t border-white/10 text-[8px] font-black uppercase tracking-widest text-white/40">
                      <p>Arenas: {p.arenas_limit}</p>
                      <p>Atletas: {p.athletes_limit}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <button onClick={() => setSelectingLicense(null)} className="w-full py-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white transition-all">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
