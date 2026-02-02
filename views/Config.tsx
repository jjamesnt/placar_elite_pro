
import React from 'react';
import { SoundScheme } from '../App';

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


const Config: React.FC<ConfigProps> = ({ winScore, setWinScore, attackTime, setAttackTime, soundEnabled, setSoundEnabled, vibrationEnabled, setVibrationEnabled, soundScheme, setSoundScheme }) => {
  return (
    <div className="w-full p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold text-center text-gray-100 mb-3">Configurações Master</h1>
      
      <div className="w-full max-w-2xl space-y-3">
        <div className="bg-gray-800/50 rounded-2xl p-3">
          <h2 className="text-lg font-semibold text-indigo-400 mb-3">Parâmetros do Jogo</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="winScore" className="text-base text-gray-300">Meta de Vitória</label>
              <NumberAdjuster value={winScore} onAdjust={setWinScore} min={1}/>
            </div>
            <div className="flex items-center justify-between">
              <label htmlFor="attackTime" className="text-base text-gray-300">Tempo de Ataque</label>
              <NumberAdjuster value={attackTime} onAdjust={setAttackTime} min={5}/>
            </div>
          </div>
        </div>

         <div className="bg-gray-800/50 rounded-2xl p-3">
          <h2 className="text-lg font-semibold text-cyan-400 mb-3">Sons e Alertas</h2>
          <div className="space-y-3">
              <div className="flex items-center justify-between">
                  <label htmlFor="soundToggle" className="text-base text-gray-300">Efeitos Sonoros</label>
                  <Toggle id="soundToggle" checked={soundEnabled} onChange={setSoundEnabled} />
              </div>
               <div className="flex flex-col">
                  <label className="text-base text-gray-300 mb-2">Esquema de Sons</label>
                  <div className="flex items-center justify-between bg-gray-700 rounded-lg p-1">
                      {(['moderno', 'classico', 'intenso'] as SoundScheme[]).map(scheme => (
                          <button key={scheme} onClick={() => setSoundScheme(scheme)} className={`flex-1 capitalize text-sm font-semibold py-2 rounded-md transition-colors ${soundScheme === scheme ? 'bg-indigo-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>
                              {scheme}
                          </button>
                      ))}
                  </div>
              </div>
              <div className="flex items-center justify-between">
                  <label htmlFor="vibrationToggle" className="text-base text-gray-300">Vibração</label>
                  <Toggle id="vibrationToggle" checked={vibrationEnabled} onChange={setVibrationEnabled} />
              </div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-2xl p-5 text-center border border-indigo-500/10">
           <h2 className="text-lg font-black text-indigo-400 mb-2 uppercase tracking-widest">Suporte Técnico</h2>
           <p className="text-gray-300 text-xs font-bold uppercase mb-1">Versão 1.0 Stable</p>
           <p className="text-gray-400 mt-1 text-sm font-mono tracking-tighter">Desenvolvido por James Rizo</p>
           <p className="text-indigo-400 font-black mt-2 text-base">(31) 98421-1900</p>
        </div>
      </div>
    </div>
  );
};

export default Config;
