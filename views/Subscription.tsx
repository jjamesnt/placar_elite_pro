
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plan, Coupon, UserLicense } from '../types';
import { ZapIcon, CheckIcon, TrophyIcon, ShieldIcon, LoaderIcon } from '../components/icons';

interface SubscriptionProps {
    userLicense: UserLicense | null;
    onBack?: () => void;
    onRefreshLicense: () => void;
}

const Subscription: React.FC<SubscriptionProps> = ({ userLicense, onBack, onRefreshLicense }) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [couponCode, setCouponCode] = useState('');
    const [coupon, setCoupon] = useState<Coupon | null>(null);
    const [couponError, setCouponError] = useState('');
    const [couponLoading, setCouponLoading] = useState(false);

    useEffect(() => {
        fetchPlans();
        if (userLicense?.applied_coupon && !userLicense.applied_coupon.startsWith('PLANO:')) {
            setCouponCode(userLicense.applied_coupon);
            handleAutoApply(userLicense.applied_coupon);
        }
    }, [userLicense]);

    const handleAutoApply = async (code: string) => {
        setCouponLoading(true);
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', code.trim().toUpperCase())
                .eq('is_active', true)
                .maybeSingle();

            if (error) throw error;
            if (data) setCoupon(data);
        } catch (err) {
            console.error("Erro auto-cupom:", err);
        } finally {
            setCouponLoading(false);
        }
    };

    const fetchPlans = async () => {
        try {
            const { data, error } = await supabase
                .from('plans')
                .select('*')
                .order('price', { ascending: true });
            if (error) throw error;
            if (data) setPlans(data);
        } catch (err) {
            console.error("Erro ao carregar planos:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setCouponLoading(true);
        setCouponError('');
        setCoupon(null);
        try {
            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', couponCode.trim().toUpperCase())
                .eq('is_active', true)
                .maybeSingle();

            if (error) throw error;
            if (!data) {
                setCouponError('CUPOM INVÁLIDO OU EXPIRADO');
            } else {
                setCoupon(data);
            }
        } catch (err: any) {
            setCouponError(err.message);
        } finally {
            setCouponLoading(false);
        }
    };

    const calculatePrice = (originalPrice: number) => {
        if (coupon && coupon.discount_pct) {
            return originalPrice * (1 - coupon.discount_pct / 100);
        }
        return originalPrice;
    };

    const handleSubscribe = (plan: Plan) => {
        const finalPrice = calculatePrice(plan.price);
        const message = `Olá! Gostaria de assinar o plano *${plan.name}* Elite Pro.%0A%0A` +
            `📅 Duração: ${plan.months_duration} meses%0A` +
            `💰 Valor: R$ ${finalPrice.toFixed(2)}` +
            (coupon ? `%0A🎫 Cupom aplicado: *${coupon.code}*` : '') +
            `%0A%0AEmail da conta: ${userLicense?.email}`;

        window.open(`https://wa.me/5531984211900?text=${message}`, '_blank');
    };

    if (loading) return (
        <div className="h-full w-full flex flex-col items-center justify-center p-20 gap-4">
            <LoaderIcon className="w-12 h-12 animate-spin text-indigo-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">Carregando Planos...</p>
        </div>
    );

    return (
        <div className="w-full max-w-5xl mx-auto p-4 space-y-12 animate-in fade-in pb-32">
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter">Escolha seu Plano</h1>
                <p className="text-[10px] md:text-sm font-black text-white/40 uppercase tracking-[0.3em]">Potencialize sua Arena com o Elite Pro</p>
            </div>

            {/* Coupon Section */}
            <div className="max-w-md mx-auto bg-white/5 border border-white/10 rounded-[2rem] p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <ZapIcon className="w-4 h-4 text-amber-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-white/60">Tem um cupom?</h3>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={couponCode}
                        onChange={e => setCouponCode(e.target.value)}
                        placeholder="CÓDIGO"
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-amber-500 outline-none transition-all uppercase"
                    />
                    <button
                        onClick={handleApplyCoupon}
                        disabled={couponLoading || !couponCode}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-black px-6 rounded-xl transition-all disabled:opacity-50"
                    >
                        {couponLoading ? '...' : 'OK'}
                    </button>
                </div>
                {coupon && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl animate-in zoom-in-95">
                        <p className="text-[10px] font-black text-emerald-500 uppercase">
                            ✅ CUPOM ATIVO: {coupon.discount_pct ? `${coupon.discount_pct}% OFF` : ''}
                            {coupon.discount_pct && coupon.days_bonus ? ' + ' : ''}
                            {coupon.days_bonus ? `${coupon.days_bonus} DIAS BÔNUS` : ''}
                        </p>
                    </div>
                )}
                {couponError && <p className="text-[9px] font-black text-rose-500 uppercase text-center">{couponError}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map(p => (
                    <div key={p.id} className={`relative bg-[#090e1a]/80 border ${p.is_popular ? 'border-indigo-500 shadow-2xl shadow-indigo-900/20' : 'border-white/5'} p-8 rounded-[3rem] group hover:border-indigo-500/40 transition-all overflow-hidden`}>
                        {p.is_popular && (
                            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[8px] font-black uppercase px-6 py-2 rounded-bl-3xl">Mais Popular</div>
                        )}

                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase mb-1">{p.name}</h3>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-white">R$ {calculatePrice(p.price).toFixed(2).replace('.', ',')}</span>
                                    <span className="text-[10px] font-black text-white/20 uppercase">/ {p.months_duration} MESES</span>
                                </div>
                                {coupon && coupon.discount_pct && (
                                    <p className="text-[10px] font-black text-emerald-500 uppercase line-through opacity-50">De R$ {p.price.toFixed(2)}</p>
                                )}
                            </div>

                            <div className="space-y-4 pt-6 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center"><ShieldIcon className="w-3 h-3 text-white/40" /></div>
                                    <span className="text-xs font-bold text-white/60">{p.arenas_limit} {p.arenas_limit === 1 ? 'Arena' : 'Arenas'} Simultânea</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center"><TrophyIcon className="w-3 h-3 text-white/40" /></div>
                                    <span className="text-xs font-bold text-white/60">{p.athletes_limit} Atletas por Arena</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center"><CheckIcon className="w-3 h-3 text-emerald-500" /></div>
                                    <span className="text-xs font-bold text-white/60">Ranking Global & Histórico</span>
                                </div>
                            </div>

                            <button
                                onClick={() => handleSubscribe(p)}
                                className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 shadow-xl ${p.is_popular ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40' : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'}`}
                            >
                                Assinar Agora
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {onBack && (
                <div className="text-center pt-8">
                    <button onClick={onBack} className="text-white/20 hover:text-white text-[10px] font-black uppercase tracking-[0.4em] transition-all">Voltar para Início</button>
                </div>
            )}
        </div>
    );
};

export default Subscription;
