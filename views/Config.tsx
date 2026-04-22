
import React, { useState, useMemo } from 'react';
import { SoundScheme } from '../types';
import { Arena, ArenaColor, MatchMode } from '../types';
import { Trash2Icon, PlusIcon, UsersIcon, EditIcon, UploadCloudIcon, ZapIcon, MonitorIcon, ClipboardListIcon } from '../components/icons';
import { supabase } from '../lib/supabase';
import { useMatchEngine } from '../hooks/useMatchEngine';

interface ConfigProps {
  arenas: Arena[];
  currentArenaId: string;
  setCurrentArenaId: (id: string) => void;
  onAddArena: (name: string, color: ArenaColor) => void;
  onUpdateArena: (id: string, name: string, color: ArenaColor) => void;
  onDeleteArena: (id: string) => void;
  onLogout: () => void;
  onSaveSettings: () => void;
  onGoToSubscription?: () => void;
  userLicense?: any;
  onRefreshLicense?: () => void;
  showAlert?: (title: string, message: string, type?: any, icon?: any) => void;
  showConfirm?: (title: string, message: string, onConfirm: () => void, type?: any, icon?: any) => void;
  tvLayoutMirrored: boolean;
  setTvLayoutMirrored: (m: boolean) => void;
  senderId: string;
}

const ARENA_COLORS: ArenaColor[] = ['indigo', 'blue', 'emerald', 'amber', 'rose', 'violet'];
const COLOR_MAP: Record<ArenaColor, string> = { indigo: 'bg-indigo-500', blue: 'bg-blue-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500', violet: 'bg-violet-500' };

const Config: React.FC<ConfigProps> = ({
  arenas, currentArenaId, setCurrentArenaId, onAddArena, onUpdateArena, onDeleteArena, onLogout, onSaveSettings,
  userLicense, onRefreshLicense, onGoToSubscription,
  showAlert, showConfirm,
  tvLayoutMirrored, setTvLayoutMirrored,
  senderId
}) => {
  const {
    winScore, setWinScore, attackTime, setAttackTime, soundEnabled, setSoundEnabled,
    vibrationEnabled, setVibrationEnabled, soundScheme, setSoundScheme,
    capoteEnabled, setCapoteEnabled, vaiATresEnabled, setVaiATresEnabled,
    matchMode, setMatchMode, matchTime, setMatchTime
  } = useMatchEngine();

  const [newName, setNewName] = useState('');
  const [selColor, setSelColor] = useState<ArenaColor>('indigo');
  const [editingArena, setEditingArena] = useState<Arena | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponStatus, setCouponStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [pairingPin, setPairingPin] = useState('');
  const [isPairing, setIsPairing] = useState(false);
  const [showPairingModal, setShowPairingModal] = useState(false);

  const currentArena = useMemo(() => arenas.find(a => a.id === currentArenaId), [arenas, currentArenaId]);

  const handleAdd = () => { if (newName.trim()) { onAddArena(newName.trim(), selColor); setNewName(''); } };
  const handleUpdate = () => { if (editingArena && editingArena.name.trim()) { onUpdateArena(editingArena.id, editingArena.name.trim(), editingArena.color || 'indigo'); setEditingArena(null); } };

  const handleSaveGameSettings = () => {
    onSaveSettings();
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const toggleMode = (mode: MatchMode) => {
    setMatchMode(mode);
    if (mode === 'oficial') {
      setWinScore(25);
      setAttackTime(24);
      setMatchTime(20);
    } else {
      setWinScore(15);
    }
  };

  const handleLocalBackup = () => {
    if (showAlert) {
      showAlert(
        "Backup em Nuvem Ativo",
        "A função de Back-up Local foi simplificada: todos os seus dados já estão sincronizados e protegidos automaticamente em nossos servidores Elite.",
        'info',
        'info'
      );
    }
  };

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim() || !userLicense) return;
    setCouponLoading(true);
    try {
      // 1. Verificar se cupom existe e está ativo
      const { data: coupon, error: cError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (cError) throw cError;
      if (!coupon) throw new Error("Cupom inválido ou expirado.");

      // 2. Adicionar tempo à licença
      const currentExpiry = new Date(userLicense.expires_at).getTime() > Date.now()
        ? new Date(userLicense.expires_at)
        : new Date();
      const newExpiry = new Date(currentExpiry.getTime() + (coupon.days_bonus * 24 * 60 * 60 * 1000)).toISOString();

      const { error: updateError } = await supabase
        .from('user_licenses')
        .update({
          expires_at: newExpiry,
          is_active: true,
          applied_coupon: couponCode.trim().toUpperCase()
        })
        .eq('user_id', userLicense.user_id);

      if (updateError) throw updateError;

      // Incrementar uso
      await supabase.from('coupons').update({ used_count: (coupon.used_count || 0) + 1 }).eq('id', coupon.id);

      let msg = `CUPOM APLICADO! +${coupon.days_bonus} DIAS`;
      if (coupon.discount_pct > 0) msg += ` E ${coupon.discount_pct}% DE DESCONTO NA PRÓXIMA RENOVAÇÃO!`;

      setCouponStatus({ type: 'success', msg });
      setCouponCode('');
      if (onRefreshLicense) onRefreshLicense();
    } catch (err: any) {
      setCouponStatus({ type: 'error', msg: err.message || 'Erro ao validar cupom.' });
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePairTV = async () => {
    if (pairingPin.length !== 6) return;
    setIsPairing(true);
    try {
        const channel = supabase.channel(`pairing_${pairingPin}`);
        await channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.send({
                    type: 'broadcast',
                    event: 'PAIRING_SUCCESS',
                    payload: { masterId: senderId, arenaId: currentArenaId }
                });
                if (showAlert) showAlert("Sucesso!", "O monitor foi vinculado e já deve estar sintonizado.", 'success', 'check');
                setShowPairingModal(false);
                setPairingPin('');
            }
        });
    } catch (err) {
        if (showAlert) showAlert("Erro", "Não foi possível enviar o sinal de pareamento.", 'danger', 'alert');
    } finally {
        setIsPairing(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 space-y-8 pb-32">

      <section className="space-y-1">
        <div className="flex items-center justify-between px-1 mb-4">
          <div className="flex items-center gap-2">
            <UsersIcon className="w-3 h-3 text-white/20" />
            <h2 className="text-[9px] font-black uppercase tracking-[0.5em] text-white/20">Grupos / Arenas</h2>
          </div>
          <button
            onClick={onLogout}
            className="text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-colors py-2 px-3 border border-red-500/10 rounded-lg"
          >
            Sair do App
          </button>
        </div>

        <div className="space-y-4">
          {/* Campo de Inserção de Nova Arena - James: Movido para o topo para melhor visibilidade */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 shadow-xl">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-white/40 mb-3 ml-1">Adicionar Novo Grupo</h3>
            <div className="flex items-center gap-2 p-1 bg-black/20 rounded-xl focus-within:bg-black/40 transition-all border border-white/5">
              <div className="flex gap-1.5 pl-3">
                {ARENA_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelColor(c)}
                    className={`w-4 h-4 rounded-full transition-all ${COLOR_MAP[c]} ${selColor === c ? 'scale-125 ring-2 ring-white/50 shadow-lg' : 'opacity-20 hover:opacity-100'}`}
                  />
                ))}
              </div>
              <input
                value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Ex: Arena Pro, Grupo de Terça..."
                className="flex-1 bg-transparent px-3 py-3 text-xs font-bold focus:outline-none placeholder:text-white/10 text-white"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <button
                onClick={handleAdd}
                disabled={!newName.trim()}
                className={`p-3 rounded-xl transition-all ${newName.trim() ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-white/10'}`}
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="space-y-0.5">
            {arenas.map(a => (
              <div
                key={a.id}
                onClick={() => setCurrentArenaId(a.id)}
                className={`flex items-center justify-between p-3.5 md:p-5 rounded-xl transition-all cursor-pointer group ${currentArenaId === a.id ? 'bg-white/10 opacity-100' : 'opacity-60 hover:bg-white/5 hover:opacity-100 active:opacity-100'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-1 h-1 md:w-2 md:h-2 rounded-full ${COLOR_MAP[a.color || 'indigo']} ${currentArenaId === a.id ? 'scale-[2] shadow-[0_0_10px_rgba(255,255,255,0.3)]' : ''}`} />
                  <span className={`text-xs md:text-sm font-bold tracking-tight ${currentArenaId === a.id ? 'text-white' : 'text-white/60'}`}>{a.name}</span>
                </div>

                <div className={`flex items-center gap-1 transition-all ${currentArenaId === a.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingArena(a); }}
                    className="p-2 text-white/5 hover:text-indigo-400 transition-all active:scale-75"
                  >
                    <EditIcon className="w-3.5 h-3.5" />
                  </button>
                  {a.id !== 'default' && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (showConfirm) {
                          showConfirm(
                            "Excluir Grupo",
                            `ATENÇÃO: Deseja realmente excluir permanentemente o grupo "${a.name}" e todas as suas partidas? Esta ação não pode ser desfeita.`,
                            () => onDeleteArena(a.id),
                            'danger',
                            'trash'
                          );
                        }
                      }}
                      className="p-2 text-white/5 hover:text-red-500 transition-all active:scale-75"
                    >
                      <Trash2Icon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Link Simplificado para Monitoramento em TV */}
      <section className="bg-indigo-600/10 rounded-3xl p-6 border border-indigo-500/20 space-y-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
            <MonitorIcon className="w-4 h-4 text-indigo-400" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Monitor Externo (TV)</h3>
            </div>
            <button 
                onClick={() => setShowPairingModal(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-[8px] font-black uppercase tracking-widest px-4 py-2 rounded-lg transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
            >
                Vincular Nova TV
            </button>
        </div>
        
        <p className="text-[9px] font-bold text-white/40 uppercase leading-relaxed">
          UTILIZE O LINK REDUZIDO OU O PAREAMENTO POR PIN PARA CONECTAR SUA TV SEM PRECISAR DIGITAR IDs LONGOS.
        </p>

        <div className="flex gap-2">
          <div className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-mono text-indigo-300 truncate select-all">
            {`${window.location.origin}/tv`}
          </div>
          <button
            onClick={() => {
              const url = `${window.location.origin}/tv`;
              navigator.clipboard.writeText(url);
              if (showAlert) showAlert("Copiado!", "Endereço simplificado da TV copiado.", 'info', 'check');
            }}
            className="bg-white/5 hover:bg-white/10 text-white p-3 rounded-xl transition-all active:scale-90 border border-white/5"
            title="Copiar Link"
          >
            <ClipboardListIcon className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* NOVO: Ajuste Prático de Perspectiva (Inversão de Layout TV) */}
      <section className="bg-indigo-600/10 rounded-3xl p-6 border border-indigo-500/20 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MonitorIcon className="w-4 h-4 text-indigo-400" />
            <div className="flex flex-col">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Inverter Layout da TV</h3>
              <p className="text-[8px] font-bold text-white/30 uppercase mt-0.5">Corrige a visão do juiz debaixo da TV.</p>
            </div>
          </div>
          <button 
            onClick={() => setTvLayoutMirrored(!tvLayoutMirrored)} 
            className={`px-4 py-2 text-[8px] font-black uppercase rounded-lg transition-all ${tvLayoutMirrored ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-white/30'}`}
          >
            {tvLayoutMirrored ? 'ATIVADO' : 'OFF'}
          </button>
        </div>
      </section>

      {/* Resgate de Cupom */}
      <section className="bg-gradient-to-br from-amber-500/10 to-transparent rounded-3xl p-6 border border-amber-500/20 space-y-4">
        <div className="flex items-center gap-3">
          <ZapIcon className="w-4 h-4 text-amber-500" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Resgatar Cupom</h3>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={e => setCouponCode(e.target.value)}
            placeholder="Digite seu código..."
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-500 transition-all"
          />
          <button
            onClick={handleRedeemCoupon}
            disabled={couponLoading || !couponCode.trim()}
            className="bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[10px] tracking-widest px-6 rounded-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {couponLoading ? '...' : 'OK'}
          </button>
        </div>

        {onGoToSubscription && (
          <button
            onClick={onGoToSubscription}
            className="w-full mt-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 font-black uppercase text-[10px] py-4 rounded-xl border border-indigo-500/20 transition-all active:scale-95"
          >
            Ver Planos / Renovar Assinatura
          </button>
        )}

        {couponStatus && (
          <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in slide-in-from-top-2 ${couponStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
            {couponStatus.msg}
          </div>
        )}
      </section>

      <section className="bg-white/[0.02] rounded-3xl p-6 border border-white/5 space-y-6">
        <div className="space-y-4">
          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 text-center">Modo de Jogo</h3>
          
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5">
            <button 
              onClick={() => toggleMode('casual')}
              className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${matchMode === 'casual' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-white/20 hover:text-white/40'}`}
            >
              Casual / Arena
            </button>
            <button 
              onClick={() => toggleMode('oficial')}
              className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${matchMode === 'oficial' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-white/20 hover:text-white/40'}`}
            >
              Modo Oficial
            </button>
          </div>

          <div className="pt-4 space-y-4">
            <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 text-center">Configurações da Regra</h3>
            
            <div className="flex items-center justify-between">
              <span className="text-[9px] md:text-xs font-black uppercase tracking-widest text-white/20">Pontuação Alvo</span>
              <div className="flex items-center gap-4 bg-black/20 p-1 rounded-xl">
                <button onClick={() => setWinScore(Math.max(1, winScore - 1))} className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center text-white/40 hover:text-white">-</button>
                <span className="font-mono text-xs md:text-xl font-black w-4 md:w-8 text-center">{winScore}</span>
                <button onClick={() => setWinScore(winScore + 1)} className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center text-white/40 hover:text-white">+</button>
              </div>
            </div>

            {matchMode === 'oficial' && (
              <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                <span className="text-[9px] md:text-xs font-black uppercase tracking-widest text-white/20">Tempo Partida (Min)</span>
                <div className="flex items-center gap-4 bg-black/20 p-1 rounded-xl">
                  <button onClick={() => setMatchTime(Math.max(1, matchTime - 1))} className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center text-white/40 hover:text-white">-</button>
                  <span className="font-mono text-xs md:text-xl font-black w-4 md:w-8 text-center">{matchTime}</span>
                  <button onClick={() => setMatchTime(matchTime + 1)} className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center text-white/40 hover:text-white">+</button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-[9px] md:text-xs font-black uppercase tracking-widest text-white/20">Tempo Posse (Seg)</span>
              <div className="flex items-center gap-4 bg-black/20 p-1 rounded-xl">
                <button onClick={() => setAttackTime(Math.max(5, attackTime - 1))} className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center text-white/40 hover:text-white">-</button>
                <span className="font-mono text-xs md:text-xl font-black w-4 md:w-8 text-center">{attackTime}</span>
                <button onClick={() => setAttackTime(attackTime + 1)} className="w-8 h-8 md:w-12 md:h-12 flex items-center justify-center text-white/40 hover:text-white">+</button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex flex-col">
                <span className="text-[9px] md:text-xs font-black uppercase tracking-widest text-white/20">REGRA "CAPOTE"</span>
                <span className="text-[8px] md:text-[10px] font-bold text-white/30 uppercase mt-1 max-w-[150px] sm:max-w-none">Finaliza se placar for 50% vs 0.</span>
              </div>
              <button onClick={() => setCapoteEnabled(!capoteEnabled)} className={`px-4 py-2 text-[8px] md:text-xs font-black uppercase rounded-lg transition-all ${capoteEnabled ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/30'}`}>
                {capoteEnabled ? 'ATIVADO' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[9px] md:text-xs font-black uppercase tracking-widest text-white/20">REGRA "VAI A 3"</span>
                <span className="text-[8px] md:text-[10px] font-bold text-white/30 uppercase mt-1 max-w-[150px] sm:max-w-none">Resolve empates em pontos decisivos.</span>
              </div>
              <button onClick={() => setVaiATresEnabled(!vaiATresEnabled)} className={`px-4 py-2 text-[8px] md:text-xs font-black uppercase rounded-lg transition-all ${vaiATresEnabled ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/30'}`}>
                {vaiATresEnabled ? 'ATIVADO' : 'OFF'}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-6 border-t border-white/5">
          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 text-center">Som e Feedback Sensorial</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between bg-black/20 p-1 rounded-xl">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/20 pl-3">Som</span>
              <button onClick={() => setSoundEnabled(!soundEnabled)} className={`px-4 py-2 text-[8px] font-black uppercase rounded-lg transition-all ${soundEnabled ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/30'}`}>
                {soundEnabled ? 'ATIVADO' : 'OFF'}
              </button>
            </div>
            <div className="flex items-center justify-between bg-black/20 p-1 rounded-xl">
              <span className="text-[9px] font-black uppercase tracking-widest text-white/20 pl-3">Vibração</span>
              <button onClick={() => setVibrationEnabled(!vibrationEnabled)} className={`px-4 py-2 text-[8px] font-black uppercase rounded-lg transition-all ${vibrationEnabled ? 'bg-emerald-500 text-white' : 'bg-white/5 text-white/30'}`}>
                {vibrationEnabled ? 'ATIVADO' : 'OFF'}
              </button>
            </div>
          </div>
          <div className="flex bg-black/40 p-1 rounded-xl">
            {(['moderno', 'classico', 'intenso'] as SoundScheme[]).map(s => (
              <button
                key={s}
                onClick={() => setSoundScheme(s)}
                className={`flex-1 py-2 text-[8px] font-black uppercase rounded-lg transition-all ${soundScheme === s ? 'bg-white/10 text-white' : 'text-white/10 hover:text-white/30'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-white/5">
          <button
            onClick={handleSaveGameSettings}
            className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-[0.2em] transition-all active:scale-95 shadow-xl flex items-center justify-center ${saveStatus === 'saved' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'}`}
          >
            {saveStatus === 'saved' ? 'Configurações Salvas!' : 'Salvar Configurações da Arena'}
          </button>
        </div>

        <div className="pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={handleLocalBackup}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white/40 border border-white/5 rounded-2xl font-black uppercase text-[9px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            <UploadCloudIcon className="w-4 h-4" />
            Backup
          </button>
          <a
            href="https://wa.me/5531984211900"
            target="_blank"
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-emerald-900/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            Suporte
          </a>
        </div>

        <div className="pt-4 flex justify-center opacity-20">
          <span className="text-[8px] font-black uppercase tracking-[0.4em]">Placar Elite Pro v2.5</span>
        </div>
      </section>

      {editingArena && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-6" onClick={() => setEditingArena(null)}>
          <div className="bg-[#090e1a] border border-white/10 rounded-[1.5rem] p-5 sm:p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg sm:text-xl font-black text-white mb-6 uppercase tracking-tight text-center">Editar Arena</h2>

            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-white/20 ml-1">Nome</label>
                <input
                  type="text"
                  value={editingArena.name}
                  onChange={(e) => setEditingArena({ ...editingArena, name: e.target.value })}
                  className="w-full p-4 bg-black/40 border border-white/10 text-white rounded-2xl text-lg focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-white/20 ml-1 text-center block">Cor do Grupo</label>
                <div className="flex justify-center gap-2 bg-black/20 p-4 rounded-2xl">
                  {ARENA_COLORS.map(c => (
                    <button
                      key={c}
                      onClick={() => setEditingArena({ ...editingArena, color: c })}
                      className={`w-7 h-7 rounded-full transition-all ${COLOR_MAP[c]} ${editingArena.color === c ? 'scale-125 ring-2 ring-white shadow-xl' : 'opacity-30 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setEditingArena(null)} className="flex-1 p-3 sm:p-4 bg-white/5 text-white/40 rounded-xl font-black uppercase text-[10px]">Cancelar</button>
                <button onClick={handleUpdate} className="flex-1 p-3 sm:p-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px]">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPairingModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[120] flex items-center justify-center p-6" onClick={() => setShowPairingModal(false)}>
          <div className="bg-[#090e1a] border border-white/10 rounded-[2rem] p-8 w-full max-w-sm shadow-[0_0_50px_rgba(99,102,241,0.2)]" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-6">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center">
                    <MonitorIcon className="w-8 h-8 text-indigo-400" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Vincular Monitor</h2>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Digite o código de 6 dígitos que aparece na sua TV.</p>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  value={pairingPin}
                  onChange={(e) => setPairingPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="000 000"
                  className="w-full bg-black/40 border border-white/10 text-center text-5xl font-mono font-black text-indigo-400 py-6 rounded-3xl focus:outline-none focus:border-indigo-500 transition-all tracking-[0.2em]"
                />

                <div className="flex gap-3 w-full">
                    <button onClick={() => setShowPairingModal(false)} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white/40 rounded-2xl font-black uppercase text-[10px] transition-all">Cancelar</button>
                    <button 
                        onClick={handlePairTV} 
                        disabled={pairingPin.length !== 6 || isPairing}
                        className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] transition-all disabled:opacity-50"
                    >
                        {isPairing ? 'Conectando...' : 'Vincular'}
                    </button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Config;
