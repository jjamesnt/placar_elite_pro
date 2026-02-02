
import React, { useState, useEffect } from 'react';
import { ClipboardListIcon, UsersIcon, TrophyIcon, CogIcon, ShieldIcon, MaximizeIcon, MinimizeIcon, HistoryIcon } from './icons';

export type View = 'placar' | 'atletas' | 'ranking' | 'historico' | 'config';

interface NavButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon, isActive, onClick }) => {
  const activeClasses = 'text-indigo-400';
  const inactiveClasses = 'text-gray-500 hover:text-white';
  
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 flex flex-col items-center justify-center p-2 transition-colors duration-200 ease-in-out transform active:scale-95 ${isActive ? activeClasses : inactiveClasses}`}
    >
      <div className="relative">
        {icon}
      </div>
      <span className="text-[10px] sm:text-xs font-medium mt-1 uppercase tracking-tighter">{label}</span>
    </button>
  );
};


interface NavigationProps {
  currentView: View;
  onNavigate: (view: View) => void;
  lastUpdate: string;
  arenaName?: string;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate, lastUpdate, arenaName }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as any;
      const isFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement || doc.webkitIsFullScreen);
      setIsFullscreen(isFull);
    };
    
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    events.forEach(event => document.addEventListener(event, handleFsChange));
    
    return () => {
      events.forEach(event => document.removeEventListener(event, handleFsChange));
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      const doc = document as any;
      const element = document.documentElement as any;
      const isCurrentlyFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement || doc.webkitIsFullScreen);

      if (!isCurrentlyFull) {
        if (element.requestFullscreen) await element.requestFullscreen();
        else if (element.webkitRequestFullscreen) await element.webkitRequestFullscreen();
      } else {
        if (doc.exitFullscreen) await doc.exitFullscreen();
      }
    } catch (err) {
      console.error("Erro ao alternar tela cheia:", err);
    }
  };

  return (
    <header className="relative w-full bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 z-50">
      <div className="flex items-center justify-between px-4 h-14 sm:h-16">
        {/* Seção do Título e Arena ajustada conforme screenshot */}
        <div className="flex flex-col min-w-[160px] sm:min-w-[200px]">
          <div className="flex items-center gap-1.5 text-white">
            <ShieldIcon />
            <h1 className="font-black text-[14px] sm:text-[16px] uppercase tracking-tighter leading-none">Placar Elite Pro</h1>
          </div>
          <div className="flex items-center gap-2 mt-0.5 ml-0.5">
            {arenaName && (
              <span className="text-[8px] sm:text-[10px] text-indigo-400 font-black tracking-wider uppercase whitespace-nowrap">
                {arenaName}
              </span>
            )}
            <div className="w-px h-2 bg-gray-700 mx-0.5"></div>
            <span className="text-[8px] sm:text-[10px] text-gray-500 font-mono tracking-tighter">
              {lastUpdate}
            </span>
          </div>
        </div>

        <nav className="flex-1 flex justify-end items-center gap-0.5 sm:gap-2 max-w-xl">
          <NavButton 
            label="Placar"
            icon={<ClipboardListIcon />}
            isActive={currentView === 'placar'}
            onClick={() => onNavigate('placar')}
          />
          <NavButton 
            label="Histórico"
            icon={<HistoryIcon />}
            isActive={currentView === 'historico'}
            onClick={() => onNavigate('historico')}
          />
          <NavButton 
            label="Atletas"
            icon={<UsersIcon />}
            isActive={currentView === 'atletas'}
            onClick={() => onNavigate('atletas')}
          />
          <NavButton 
            label="Ranking"
            icon={<TrophyIcon />}
            isActive={currentView === 'ranking'}
            onClick={() => onNavigate('ranking')}
          />
          <NavButton 
            label="Config."
            icon={<CogIcon />}
            isActive={currentView === 'config'}
            onClick={() => onNavigate('config')}
          />
          <button
            onClick={toggleFullscreen}
            className="flex flex-col items-center justify-center p-2 text-gray-500 hover:text-white transition-colors duration-200 transform active:scale-95"
          >
            {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
            <span className="text-[10px] sm:text-xs font-medium mt-1 uppercase tracking-tighter">
              {isFullscreen ? "Sair" : "Focar"}
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Navigation;
