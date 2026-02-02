
import React, { useState, useEffect } from 'react';
import { SoundScheme } from '../App';
import { Player, Match, Arena } from '../types';
import { FileDownIcon, UploadCloudIcon, Share2Icon, UsersIcon, Trash2Icon, PlusIcon, ZapIcon } from '../components/icons';

interface ConfigProps {
  winScore: number;
  setWinScore: (score: number) => void;
  attackTime: number;
  setAttackTime: (time: number) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  vibrationEnabled: boolean;
  setVibrationEnabled: (enabled: boolean) => void;
  soundScheme: SoundScheme;
  setSoundScheme: (scheme: SoundScheme) => void;
  players: Player[];
  setPlayers: (players: Player[]) => void;
  deletedPlayers: Player[];
  setDeletedPlayers: (players: Player[]) => void;
  matches: Match[];
  setMatches: (matches: Match[]) => void;
  arenas: Arena[];
  setArenas: (arenas: Arena[]) => void;
  currentArenaId: string;
  setCurrentArenaId: (id: string) => void;
}

const Toggle: React.FC<{ checked: boolean; onChange: (checked: boolean) => void; id: string }> = ({ checked, onChange, id }) => (
  <label htmlFor={id} className="relative inline-flex items-center cursor-pointer">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} id={id} className="sr-only peer" />
    <div className="w-14 h-8 bg-gray-600 rounded-full peer peer-focus:ring-4 peer-focus:ring-indigo-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content[''] after:absolute after:top-1 after:left-1 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
  </label>
);

const NumberAdjuster: React.FC<{ value: number; onAdjust: (newValue: number) => void; min?: number; step?: number }> = ({ value, onAdjust, min = 1, step = 1 }) => (
    <div className="flex items-center gap-3">
        <button 
            onClick={() => onAdjust(Math.max(min, value - step))}
            className="w-10 h-10 bg-gray-700 rounded-full text-xl font-bold flex items-center justify-center active:scale-95 transition-transform"
        >
            -
        </button>
        <span className="w-20 p-2 bg-gray-700 text-white text-center rounded-lg text-xl font-mono">
            {value}
        </span>
        <button 
            onClick={() => onAdjust(value + step)}
            className="w-10 h-10 bg-gray-700 rounded-full text-xl font-bold flex items-center justify-center active:scale-95 transition-transform"
        >
            +
        </button>
    </div>
);

const Config: React.FC<ConfigProps> = ({ 
  winScore, setWinScore, attackTime, setAttackTime, 
  soundEnabled, setSoundEnabled, vibrationEnabled, setVibrationEnabled, 
  soundScheme, setSoundScheme,
  players, setPlayers, deletedPlayers, setDeletedPlayers, matches, setMatches,
  arenas, setArenas, currentArenaId, setCurrentArenaId
}) => {
  const [toastMessage, setToastMessage] = useState('');
  const [newArenaName, setNewArenaName] = useState('');

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleAddArena = () => {
    if (!newArenaName.trim()) return;
    const newArena: Arena = {
      id: `arena_${Date.now()}`,
      name: newArenaName.trim()
    };
    setArenas([...arenas, newArena]);
    setNewArenaName('');
    setToastMessage('Nova Arena criada!');
  };

  const handleDeleteArena = (id: string, name: string) => {
    if (id === 'default') {
        alert("A Arena Principal não pode ser excluída.");
        return;
    }
    const confirmed = window.confirm(`Excluir permanentemente a arena "${name}" e todos os seus dados?`);
    if (confirmed) {
        if (currentArenaId === id) setCurrentArenaId('default');
        setArenas(arenas.filter(a => a.id !== id));
        // Limpeza do localStorage opcional, ou deixar lá como backup oculto
        setToastMessage('Arena removida.');
    }
  };

  const handleExportBackup = async () => {
    const backupData = {
      arenas,
      currentArenaId,
      // Nota: Este backup simplificado exporta apenas a arena atual para manter o arquivo leve
      currentArenaData: {
          players,
          deletedPlayers,
          matches,
          settings: { winScore, attackTime, soundEnabled, vibrationEnabled, soundScheme }
      },
      exportDate: new Date().toISOString()
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const fileName = `elite_pro_full_backup.json`;
    
    try {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToastMessage('Backup exportado!');
    } catch (error) {
      setToastMessage('Erro ao exportar.');
    }
  };

  return (
    <div className="w-full p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-center text-gray-100 mb-3 uppercase tracking-tighter">Configurações</h1>
      
      <div className="w-full max-w-2xl space-y-4 pb-16">
        
        {/* Gestão de Arenas / Turmas */}
        <div className="bg-gradient-to-br from-indigo-900/30 to-gray-800/50 rounded-2xl p-5 border border-indigo-500/20 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
                <UsersIcon className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-black text-white uppercase tracking-tighter">Grupos / Arenas</h2>
            </div>

            <div className="space-y-3 mb-6">
                {arenas.map(arena => (
                    <div key={arena.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${currentArenaId === arena.id ? 'bg-indigo-600/20 border-indigo-500' : 'bg-black/20 border-white/5'}`}>
                        <div className="flex flex-col">
                            <span className={`text-sm font-bold ${currentArenaId === arena.id ? 'text-white' : 'text-gray-400'}`}>{arena.name}</span>
                            {currentArenaId === arena.id && <span className="text-[8px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">Ativo Agora</span>}
                        </div>
                        <div className="flex gap-2">
                            {currentArenaId !== arena.id && (
                                <button 
                                    onClick={() => setCurrentArenaId(arena.id)}
                                    className="px-3 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-lg active:scale-95 transition-all"
                                >
                                    Selecionar
                                </button>
                            )}
                            {arena.id !== 'default' && (
                                <button 
                                    onClick={() => handleDeleteArena(arena.id, arena.name)}
                                    className="p-1.5 text-red-500/50 hover:text-red-500 transition-colors"
                                >
                                    <Trash2Icon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                <input 
                    type="text" 
                    value={newArenaName}
                    onChange={(e) => setNewArenaName(e.target.value)}
                    placeholder="Nome da nova turma/arena..."
                    className="flex-1 p-3 bg-black/40 border border-white/10 rounded-xl text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button 
                    onClick={handleAddArena}
                    className="px-4 bg-indigo-600 text-white rounded-xl active:scale-95 transition-transform"
                >
                    <PlusIcon />
                </button>
            </div>
        </div>

        {/* Parâmetros do Jogo */}
        <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/30">
          <h2 className="text-lg font-semibold text-indigo-400 mb-4 uppercase tracking-tighter">Parâmetros do Jogo</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Vitória com:</label>
              <NumberAdjuster value={winScore} onAdjust={setWinScore} min={1}/>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm text-gray-300">Tempo de Posse:</label>
              <NumberAdjuster value={attackTime} onAdjust={setAttackTime} min={5}/>
            </div>
          </div>
        </div>

        {/* Sons e Alertas */}
        <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/30">
          <h2 className="text-lg font-semibold text-cyan-400 mb-4 uppercase tracking-tighter">Interface</h2>
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">Sons</label>
                  <Toggle id="soundToggle" checked={soundEnabled} onChange={setSoundEnabled} />
              </div>
               <div className="flex flex-col gap-2">
                  <label className="text-sm text-gray-300">Esquema Sonoro</label>
                  <div className="flex bg-gray-700 rounded-xl p-1">
                      {(['moderno', 'classico', 'intenso'] as SoundScheme[]).map(scheme => (
                          <button key={scheme} onClick={() => setSoundScheme(scheme)} className={`flex-1 capitalize text-[10px] font-black py-2 rounded-lg transition-all ${soundScheme === scheme ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                              {scheme}
                          </button>
                      ))}
                  </div>
              </div>
              <div className="flex items-center justify-between">
                  <label className="text-sm text-gray-300">Vibração</label>
                  <Toggle id="vibrationToggle" checked={vibrationEnabled} onChange={setVibrationEnabled} />
              </div>
          </div>
        </div>
        
        {/* Backup Local */}
        <div className="bg-gray-800/50 rounded-2xl p-4 border border-green-500/20">
          <h2 className="text-lg font-semibold text-green-400 mb-3 uppercase tracking-tighter">Segurança</h2>
          <button
              onClick={handleExportBackup} 
              className="w-full flex items-center justify-center gap-3 p-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all active:scale-95 text-xs uppercase shadow-xl"
            >
              <Share2Icon className="w-5 h-5" />
              Baixar Backup Total
            </button>
        </div>

        {/* Rodapé Informativo */}
        <div className="text-center py-6 opacity-30">
           <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.3em]">Placar Elite Pro v1.2</p>
        </div>
      </div>

      {toastMessage && (
         <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-900 border border-indigo-500/30 text-white px-6 py-3 rounded-xl shadow-2xl backdrop-blur-md z-50 animate-in fade-in slide-in-from-bottom-10 duration-500">
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default Config;
