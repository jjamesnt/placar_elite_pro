
import React, { useState, useEffect } from 'react';
import { ClipboardListIcon, UsersIcon, TrophyIcon, CogIcon, ShieldIcon, MaximizeIcon, MinimizeIcon } from './icons';

export type View = 'placar' | 'atletas' | 'ranking' | 'config';

interface NavButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  subLabel?: string;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon, isActive, onClick, subLabel }) => {
  const activeClasses = 'text-indigo-400';
  const inactiveClasses = 'text-gray-500 hover:text-white';
  
  const renderSubLabel = () => {
    if (!subLabel) return null;
    
    const parts = subLabel.split(' ');
    if (parts.length === 2) {
      const [date, time] = parts;
      return (
        <div className="absolute -left-[42px] top-[2px] flex flex-col items-end leading-[0.7rem] pointer-events-none select-none">
          <span className="text-[7px] sm:text-[8px] text-gray-400 font-mono">{date}</span>
          <span className="text-[7px] sm:text-[8px] text-gray-500 font-mono">{time}</span>
        </div>
      );
    }
    
    return (
      <span className="absolute -top-1 -right-12 whitespace-nowrap bg-gray-800 text-[8px] text-gray-400 px-1 rounded border border-gray-700 font-mono hidden sm:block">
        {subLabel}
      </span>
    );
  };

  return (
    <button
      onClick={onClick}
      className={`relative flex-1 flex flex-col items-center justify-center p-2 transition-colors duration-200 ease-in-out transform active:scale-95 ${isActive ? activeClasses : inactiveClasses}`}
    >
      <div className="relative">
        {renderSubLabel()}
        {icon}
      </div>
      <span className="text-xs font-medium mt-1">{label}</span>
    </button>
  );
};


interface NavigationProps {
  currentView: View;
  onNavigate: (view: View) => void;
  lastUpdate: string;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate, lastUpdate }) => {
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
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.webkitEnterFullscreen) {
          await element.webkitEnterFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        } else {
          alert("O modo tela cheia não é suportado por este navegador ou dispositivo. No iPhone, adicione o app à 'Tela de Início' para usar em tela cheia.");
        }
      } else {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (err) {
      console.error("Erro ao alternar tela cheia:", err);
    }
  };

  return (
    <header className="relative w-full bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 z-50">
      <div className="absolute top-1/2 left-4 -translate-y-1/2 flex items-center gap-2 text-gray-400 hidden lg:flex pointer-events-none">
        <ShieldIcon />
        <h1 className="font-bold text-sm">Placar Elite Pro</h1>
      </div>
      <nav className="max-w-2xl mx-auto flex justify-around items-center px-1 sm:px-4">
        <NavButton 
          label="Placar"
          icon={<ClipboardListIcon />}
          isActive={currentView === 'placar'}
          onClick={() => onNavigate('placar')}
          subLabel={lastUpdate}
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
          className="flex-1 flex flex-col items-center justify-center p-2 text-gray-500 hover:text-white transition-colors duration-200 transform active:scale-95"
          aria-label={isFullscreen ? "Sair da Tela Cheia" : "Entrar em Tela Cheia"}
        >
          {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
          <span className="text-xs font-medium mt-1">{isFullscreen ? "Sair" : "Focar"}</span>
        </button>
      </nav>
    </header>
  );
};

export default Navigation;
