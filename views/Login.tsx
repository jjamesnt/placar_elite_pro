
import React, { useState } from 'react';
import { ShieldIcon, LoaderIcon, UserPlusIcon, LogOutIcon, ZapIcon, TrophyIcon, UsersIcon, CalendarIcon } from '../components/icons';
import { supabase } from '../lib/supabase';
import { Plan, Coupon } from '../types';

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
  const [couponCode, setCouponCode] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);

  React.useEffect(() => {
    if (isSignUp && plans.length === 0) {
      fetchPlans();
    }
  }, [isSignUp]);

  const fetchPlans = async () => {
    setLoadingPlans(true);
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('price', { ascending: true });
      if (error) throw error;
      if (data) {
        setPlans(data);
        if (data.length > 0) setSelectedPlanId(data[0].id);
      }
    } catch (err) {
      console.error("Erro ao carregar planos:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const handleCouponBlur = async () => {
    if (!couponCode.trim()) {
      setActiveCoupon(null);
      return;
    }
    setValidatingCoupon(true);
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      setActiveCoupon(data || null);
    } catch (err) {
      console.error("Erro validar cupom:", err);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const calculateFinalPrice = (price: number) => {
    if (activeCoupon?.discount_pct) {
      return price * (1 - activeCoupon.discount_pct / 100);
    }
    return price;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        const selectedPlan = plans.find(p => p.id === selectedPlanId);
        if (!selectedPlan) throw new Error("Selecione um plano.");

        let bonusDays = activeCoupon?.days_bonus || 0;

        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password
        });

        if (signUpError) throw signUpError;
        if (!authData.user) throw new Error("Erro ao criar usuário.");

        // Criar licença inicial baseada no plano escolhido
        const totalDays = (selectedPlan.months_duration * 30) + bonusDays;
        const expiresAt = new Date(Date.now() + (totalDays * 24 * 60 * 60 * 1000)).toISOString();

        await supabase.from('user_licenses').insert({
          user_id: authData.user.id,
          email: email.trim().toLowerCase(),
          expires_at: expiresAt,
          is_active: true,
          arenas_limit: selectedPlan.arenas_limit,
          athletes_limit: selectedPlan.athletes_limit,
          applied_coupon: couponCode.trim().toUpperCase() || null
        });

        if (activeCoupon) {
          await supabase.from('coupons').update({ used_count: (activeCoupon.used_count || 0) + 1 }).eq('id', activeCoupon.id);
        }

        setSuccess(`Solicitação enviada! Plano ${selectedPlan.name} ativado.`);
        setIsSignUp(false);
        setCouponCode('');
        setActiveCoupon(null);
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
        msg = 'Este e-mail já possui acesso. Tente fazer login acima.';
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

      <div className={`w-full max-w-sm bg-[#090e1a]/80 backdrop-blur-3xl border rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl transition-all duration-500 ${isSignUp ? 'border-emerald-500/30 shadow-emerald-500/20' : 'border-indigo-500/20 shadow-indigo-500/10'}`}>

        <div className="flex flex-col items-center mb-8">
          <img
            src="/logo.png"
            alt="Placar Elite Pro"
            className="h-20 sm:h-24 w-auto object-contain mb-2 animate-in fade-in zoom-in duration-700"
          />
          <p className={`text-[10px] font-black uppercase tracking-[0.5em] ${isSignUp ? 'text-emerald-500' : 'text-indigo-400/50'}`}>
            {isSignUp ? 'SOLICITAR ACESSO À ARENA' : 'PROFESSIONAL SCOREBOARD'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Seu E-mail</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              className={`w-full bg-white/[0.03] border rounded-xl sm:rounded-2xl py-3 px-5 text-sm text-white focus:outline-none transition-all placeholder:text-white/5 ${isSignUp ? 'focus:border-emerald-500 border-white/10' : 'focus:border-indigo-500 border-white/10'}`}
              placeholder="exemplo@gmail.com" required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30 ml-1">Sua Senha</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              className={`w-full bg-white/[0.03] border rounded-xl sm:rounded-2xl py-3 px-5 text-sm text-white focus:outline-none transition-all placeholder:text-white/5 ${isSignUp ? 'focus:border-emerald-500 border-white/10' : 'focus:border-indigo-500 border-white/10'}`}
              placeholder="••••••••" required
            />
          </div>

          {isSignUp && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Escolha seu Plano</label>
                  {loadingPlans && <LoaderIcon className="w-3 h-3 animate-spin text-indigo-500" />}
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                  {plans.length > 0 ? (
                    plans.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPlanId(p.id)}
                        className={`w-full p-3 rounded-xl border transition-all text-left relative overflow-hidden flex items-center justify-between ${selectedPlanId === p.id ? 'bg-indigo-500/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-white/[0.02] border-white/5 hover:border-white/20'}`}
                      >
                        <div className="flex flex-col">
                          <p className="text-[9px] font-black uppercase text-indigo-400 mb-0.5">{p.name}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 text-white/40">
                              <CalendarIcon className="w-2.5 h-2.5" />
                              <span className="text-[8px] font-bold uppercase">{p.months_duration} {p.months_duration === 1 ? 'Mês' : 'Meses'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-white/40">
                              <UsersIcon className="w-2.5 h-2.5" />
                              <span className="text-[8px] font-bold uppercase">{p.athletes_limit} Atletas</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex flex-col items-end">
                            <span className="text-sm font-black text-white">R${calculateFinalPrice(p.price).toFixed(0)}</span>
                            {activeCoupon && <span className="text-[8px] line-through text-white/20">R${p.price.toFixed(0)}</span>}
                          </div>
                        </div>

                        {selectedPlanId === p.id && (
                          <div className="absolute top-0 right-0 p-1">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                          </div>
                        )}
                      </button>
                    ))
                  ) : !loadingPlans ? (
                    <div className="w-full py-6 text-center bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
                      <p className="text-[10px] font-black text-white/20 uppercase mb-3">Ops! Nenhum plano disponível.</p>
                      <button
                        type="button"
                        onClick={fetchPlans}
                        className="text-[9px] font-black text-indigo-400 uppercase border border-indigo-500/20 px-4 py-2 rounded-xl hover:bg-indigo-500/10 transition-all"
                      >
                        Tentar Novamente
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2 ml-1">
                  <ZapIcon className={`w-3 h-3 ${activeCoupon ? 'text-emerald-500' : 'text-white/20'}`} />
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/30">Cupom (Opcional)</label>
                  {validatingCoupon && <LoaderIcon className="w-3 h-3 animate-spin text-indigo-500" />}
                </div>
                <input
                  type="text" value={couponCode}
                  onChange={e => setCouponCode(e.target.value)}
                  onBlur={handleCouponBlur}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl sm:rounded-2xl py-3 px-5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all placeholder:text-white/5 uppercase"
                  placeholder="TEM CUPOM?"
                />
                {activeCoupon && (
                  <p className="text-[8px] font-black text-emerald-500 uppercase ml-1">
                    ✓ {activeCoupon.discount_pct}% OFF + {activeCoupon.days_bonus} DIAS BÔNUS
                  </p>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-center animate-in fade-in slide-in-from-top-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-red-500 leading-relaxed">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center animate-in fade-in slide-in-from-top-2">
              <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500 leading-relaxed">{success}</p>
            </div>
          )}

          <div className="space-y-3 pt-2">
            <button
              type="submit" disabled={loading}
              className={`w-full py-4 rounded-xl sm:rounded-2xl font-black uppercase text-[11px] sm:text-[12px] tracking-widest shadow-2xl active:scale-[0.96] transition-all disabled:opacity-50 text-white flex items-center justify-center gap-3 ${isSignUp ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40'}`}
            >
              {loading ? <LoaderIcon className="w-5 h-5 animate-spin" /> : (isSignUp ? 'Enviar Solicitação' : 'Entrar na Arena')}
            </button>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setSuccess(''); }}
                className={`w-full text-[10px] font-black uppercase tracking-[0.2em] py-2 transition-all rounded-xl border ${isSignUp ? 'text-white/40 border-transparent hover:text-white' : 'text-emerald-500/60 border-emerald-500/5 hover:border-emerald-500/20 hover:text-emerald-400'}`}
              >
                {isSignUp ? 'Já possui conta? Fazer Login' : 'Novo por aqui? Criar Conta'}
              </button>

              <a
                href="https://wa.me/5531984211900"
                target="_blank"
                className="w-full flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase tracking-widest text-indigo-400/60 hover:text-indigo-400 transition-all"
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
