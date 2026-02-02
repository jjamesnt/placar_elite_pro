
import React, { useState, useEffect } from 'react';
import { SoundScheme } from '../App';
import { Player, Match } from '../types';
import { FileDownIcon, UploadCloudIcon, Share2Icon } from '../components/icons';

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
  players, setPlayers, deletedPlayers, setDeletedPlayers, matches, setMatches
}) => {
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleExportBackup = async () => {
    const backupData = {
      players,
      deletedPlayers,
      matches,
      settings: {
        winScore,
        attackTime,
        soundEnabled,
        vibrationEnabled,
        soundScheme,
      },
      exportDate: new Date().toISOString(),
      appName: "Placar Elite Pro"
    };

    const jsonString = JSON.stringify(backupData, null, 2);
    const fileName = `elite_pro_backup_${new Date().toISOString().slice(0, 10)}.json`;
    
    try {
      // Tenta usar a API de Compartilhamento Nativa (Mobile/Drive/Etc)
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], fileName, { type: 'application/json' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Backup Placar Elite Pro',
          text: 'Arquivo de segurança dos dados da Arena.',
        });
      } else {
        // Fallback para download simples se não puder compartilhar
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setToastMessage('Backup baixado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      setToastMessage('Erro ao exportar backup.');
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("Arquivo inválido.");
        
        const data = JSON.parse(text);

        // Validação básica de estrutura
        if (!data.players || !data.settings) {
          throw new Error("Este arquivo não parece ser um backup válido do Placar Elite Pro.");
        }

        const confirmed = window.confirm(
          "ATENÇÃO!\n\nImportar este arquivo substituirá TODOS os atletas e partidas atuais por estes do backup.\n\nDeseja prosseguir?"
        );

        if (confirmed) {
          localStorage.setItem('elite_players', JSON.stringify(data.players));
          localStorage.setItem('elite_deleted_players', JSON.stringify(data.deletedPlayers || []));
          localStorage.setItem('elite_matches', JSON.stringify(data.matches || []));
          localStorage.setItem('elite_winScore', String(data.settings.winScore));
          localStorage.setItem('elite_attackTime', String(data.settings.attackTime));
          localStorage.setItem('elite_soundEnabled', String(data.settings.soundEnabled));
          localStorage.setItem('elite_vibrationEnabled', String(data.settings.vibrationEnabled));
          localStorage.setItem('elite_soundScheme', data.settings.soundScheme);
          
          alert("Backup restaurado! O aplicativo será reiniciado.");
          window.location.reload();
        }
      } catch (error) {
        alert(`Falha na importação: ${error instanceof Error ? error.message : 'Arquivo corrompido'}`);
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="w-full p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-center text-gray-100 mb-3">Painel de Controle</h1>
      
      <div className="w-full max-w-2xl space-y-3">
        {/* Parametros do Jogo */}
        <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/30">
          <h2 className="text-lg font-semibold text-indigo-400 mb-4">Parâmetros do Jogo</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-base text-gray-300">Pontuação para Vitória</label>
              <NumberAdjuster value={winScore} onAdjust={setWinScore} min={1}/>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-base text-gray-300">Tempo de Posse (Ataque)</label>
              <NumberAdjuster value={attackTime} onAdjust={setAttackTime} min={5}/>
            </div>
          </div>
        </div>

        {/* Sons e Alertas */}
        <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/30">
          <h2 className="text-lg font-semibold text-cyan-400 mb-4">Feedback Sensorial</h2>
          <div className="space-y-4">
              <div className="flex items-center justify-between">
                  <label className="text-base text-gray-300">Efeitos Sonoros</label>
                  <Toggle id="soundToggle" checked={soundEnabled} onChange={setSoundEnabled} />
              </div>
               <div className="flex flex-col gap-2">
                  <label className="text-base text-gray-300">Esquema Sonoro</label>
                  <div className="flex bg-gray-700 rounded-xl p-1">
                      {(['moderno', 'classico', 'intenso'] as SoundScheme[]).map(scheme => (
                          <button key={scheme} onClick={() => setSoundScheme(scheme)} className={`flex-1 capitalize text-xs font-black py-2.5 rounded-lg transition-all ${soundScheme === scheme ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                              {scheme}
                          </button>
                      ))}
                  </div>
              </div>
              <div className="flex items-center justify-between">
                  <label className="text-base text-gray-300">Vibração (Haptic)</label>
                  <Toggle id="vibrationToggle" checked={vibrationEnabled} onChange={setVibrationEnabled} />
              </div>
          </div>
        </div>
        
        {/* Backup Local e Compartilhamento */}
        <div className="bg-gray-800/50 rounded-2xl p-4 border border-green-500/20">
          <h2 className="text-lg font-semibold text-green-400 mb-2">Segurança de Dados</h2>
          <p className="text-xs text-gray-400 mb-4 italic">Exporte seus dados para salvar no Google Drive ou enviar para outro dispositivo.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleExportBackup} 
              className="flex items-center justify-center gap-3 p-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl transition-all active:scale-95 text-xs uppercase shadow-xl"
            >
              <Share2Icon className="w-5 h-5" />
              Exportar / Compartilhar
            </button>
            
            <label className="flex items-center justify-center gap-3 p-4 bg-gray-700 hover:bg-gray-600 text-white font-black rounded-xl cursor-pointer transition-all active:scale-95 text-xs uppercase shadow-xl">
              <UploadCloudIcon className="w-5 h-5" />
              Restaurar Backup
              <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
            </label>
          </div>
        </div>

        {/* Rodapé Informativo */}
        <div className="bg-gray-900/50 rounded-2xl p-6 text-center border border-indigo-500/10">
           <div className="flex items-center justify-center gap-2 mb-2 text-indigo-400">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             <h2 className="text-xs font-black uppercase tracking-[0.3em]">Sistema Operacional Ativo</h2>
           </div>
           <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest mb-4">Versão 1.0 Stable Build</p>
           <div className="h-px w-12 bg-gray-700 mx-auto mb-4"></div>
           <p className="text-gray-400 text-xs font-medium italic">Desenvolvimento Expert por</p>
           <p className="text-white font-black text-sm tracking-tighter uppercase mb-2">James Rizo</p>
           <a href="https://wa.me/5531984211900" target="_blank" rel="noopener noreferrer" className="inline-block text-indigo-400 font-black text-lg hover:text-indigo-300 transition-colors">
             (31) 98421-1900
           </a>
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
