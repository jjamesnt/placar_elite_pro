
import React, { useState } from 'react';
import { SoundScheme } from '../App';
import { Arena, ArenaColor } from '../types';
import { Trash2Icon, PlusIcon, UsersIcon, EditIcon, UploadCloudIcon } from '../components/icons';

interface ConfigProps {
  winScore: number; setWinScore: (s: number) => void;
  attackTime: number; setAttackTime: (t: number) => void;
  soundEnabled: boolean; setSoundEnabled: (e: boolean) => void;
  vibrationEnabled: boolean; setVibrationEnabled: (e: boolean) => void;
  soundScheme: SoundScheme; setSoundScheme: (s: SoundScheme) => void;
  arenas: Arena[];
  currentArenaId: string;
  setCurrentArenaId: (id: string) => void;
  onAddArena: (name: string, color: ArenaColor) => void;
  onUpdateArena: (id: string, name: string, color: ArenaColor) => void;
  onDeleteArena: (id: string) => void;
  onLogout: () => void;
  onSaveSettings: () => void;
}

const ARENA_COLORS: ArenaColor[] = ['indigo', 'blue', 'emerald', 'amber', 'rose', 'violet'];
const COLOR_MAP: Record<ArenaColor, string> = { indigo: 'bg-indigo-500', blue: 'bg-blue-500', emerald: 'bg-emerald-500', amber: 'bg-amber-500', rose: 'bg-rose-500', violet: 'bg-violet-500' };

const Config: React.FC<ConfigProps> = ({ 
  winScore, setWinScore, attackTime, setAttackTime, soundEnabled, setSoundEnabled, 
  vibrationEnabled, setVibrationEnabled, soundScheme, setSoundScheme,
  arenas, currentArenaId, setCurrentArenaId, onAddArena, onUpdateArena, onDeleteArena, onLogout, onSaveSettings
}) => {
  const [newName, setNewName] = useState('');
  const [selColor, setSelColor] = useState<ArenaColor>('indigo');
  const [editingArena, setEditingArena] = useState<Arena | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  const handleAdd = () => { if(newName.trim()) { onAddArena(newName.trim(), selColor); setNewName(''); } };
  const handleUpdate = () => { if(editingArena && editingArena.name.trim()) { onUpdateArena(editingArena.id, editingArena.name.trim(), editingArena.color || 'indigo'); setEditingArena(null); } };

  const handleSaveGameSettings = () => {
    onSaveSettings();
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2500);
  };

  const handleLocalBackup = () => {
    alert("Função de Back-up Local: Os dados sincronizados com a nuvem já estão protegidos.");
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
        
        <div className="space-y-0.5">
          {arenas.map(a => (
            <div 
              key={a.id} 
              onClick={() => setCurrentArenaId(a.id)}
              className={`flex items-center justify-between p-3.5 rounded-xl transition-all cursor-pointer group ${currentArenaId === a.id ? 'bg-white/10' : 'hover:bg-white/5 opacity-40 hover:opacity-100'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-1 h-1 rounded-full ${COLOR_MAP[a.color || 'indigo']} ${currentArenaId === a.id ? 'scale-[2] shadow-[0_0_10px_rgba(255,255,255,0.3)]' : ''}`} />
                <span className={`text-xs font-bold tracking-tight ${currentArenaId === a.id ? 'text-white' : 'text-white/60'}`}>{a.name}</span>
              </div>
              
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
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
                      if(window.confirm(`ATENÇÃO: Excluir "${a.name}" e todas as partidas deste grupo?`)) {
                        onDeleteArena(a.id);
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

          <div className="mt-6 pt-4 border-t border-white/5">
            <div className="flex items-center gap-2 p-1 bg-white/[0.03] rounded-2xl focus-within:bg-white/[0.07] transition-all">
              <div className="flex gap-1.5 pl-3">
                {ARENA_COLORS.map(c => (
                  <button 
                    key={c} 
                    onClick={() => setSelColor(c)} 
                    className={`w-3 h-3 rounded-full transition-all ${COLOR_MAP[c]} ${selColor === c ? 'scale-125 ring-1 ring-white/50' : 'opacity-10 hover:opacity-100'}`} 
                  />
                ))}
              </div>
              <input 
                value={newName} onChange={e => setNewName(e.target.value)}
                placeholder="Novo grupo..."
                className="flex-1 bg-transparent px-3 py-2 text-[10px] font-bold focus:outline-none placeholder:text-white/10"
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <button 
                onClick={handleAdd} 
                disabled={!newName.trim()} 
                className={`p-2.5 rounded-xl transition-all ${newName.trim() ? 'bg-white text-black scale-90' : 'text-white/5'}`}
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white/[0.02] rounded-3xl p-6 border border-white/5 space-y-6">
        <div className="space-y-4">
          <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 text-center">Regras da Partida</h3>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Pontuação Alvo</span>
            <div className="flex items-center gap-4 bg-black/20 p-1 rounded-xl">
              <button onClick={() => setWinScore(Math.max(1, winScore-1))} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white">-</button>
              <span className="font-mono text-xs font-black w-4 text-center">{winScore}</span>
              <button onClick={() => setWinScore(winScore+1)} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white">+</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/20">Tempo Posse (Seg)</span>
            <div className="flex items-center gap-4 bg-black/20 p-1 rounded-xl">
              <button onClick={() => setAttackTime(Math.max(5, attackTime-1))} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white">-</button>
              <span className="font-mono text-xs font-black w-4 text-center">{attackTime}</span>
              <button onClick={() => setAttackTime(attackTime+1)} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white">+</button>
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
            className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-95 shadow-xl flex items-center justify-center ${saveStatus === 'saved' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20'}`}
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
          <div className="bg-[#090e1a] border border-white/10 rounded-[2.5rem] p-8 w-full max-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight text-center">Editar Arena</h2>
            
            <div className="space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-white/20 ml-1">Nome</label>
                <input
                  type="text"
                  value={editingArena.name}
                  onChange={(e) => setEditingArena({...editingArena, name: e.target.value})}
                  className="w-full p-4 bg-black/40 border border-white/10 text-white rounded-2xl text-lg focus:outline-none focus:border-indigo-500/50"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-white/20 ml-1 text-center block">Cor do Grupo</label>
                <div className="flex justify-center gap-2 bg-black/20 p-4 rounded-2xl">
                   {ARENA_COLORS.map(c => (
                    <button 
                      key={c} 
                      onClick={() => setEditingArena({...editingArena, color: c})} 
                      className={`w-7 h-7 rounded-full transition-all ${COLOR_MAP[c]} ${editingArena.color === c ? 'scale-125 ring-2 ring-white shadow-xl' : 'opacity-30 hover:opacity-100'}`} 
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button onClick={() => setEditingArena(null)} className="flex-1 p-4 bg-white/5 text-white/40 rounded-2xl font-black uppercase text-[10px]">Cancelar</button>
                <button onClick={handleUpdate} className="flex-1 p-4 bg-indigo-600 text-white rounded-2xl font-black uppercase text-[10px]">Salvar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Config;
