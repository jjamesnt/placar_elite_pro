
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
  
  // Lógica para separar data e hora se for o subLabel de atualização
  const renderSubLabel = () => {
    if (!subLabel) return null;
    
    const parts = subLabel.split(' ');
    if (parts.length === 2) {
      const [date, time] = parts;
      return (
        <div className="absolute -left-14 top-0 flex flex-col items-end leading-none pointer-events-none hidden sm:flex">
          <span className="text-[8px] text-gray-400 font-mono mb-0.5">{date}</span>
          <span className="text-[8px] text-gray-500 font-mono">{time}</span>
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
        {icon}
        {renderSubLabel()}
      </div>
      <span className="text-xs font-medium mt-1">{label}</span>
      {subLabel && (
        <span className="text-[7px] text-gray-500 font-mono sm:hidden mt-0.5">
          {subLabel.replace(' ', ' • ')}
        </span>
      )}
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
    
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);
    document.addEventListener('MSFullscreenChange', handleFsChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
      document.removeEventListener('MSFullscreenChange', handleFsChange);
    };
  }, []);

  const toggleFullscreen = () => {
    const doc = document as any;
    const element = document.documentElement as any;

    const isCurrentlyFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement || doc.webkitIsFullScreen);

    if (!isCurrentlyFull) {
      // Tenta todas as variações possíveis de requestFullscreen
      if (element.requestFullscreen) {
        element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      } else if (element.webkitEnterFullscreen) {
        // Específico para Safari mobile em alguns contextos
        element.webkitEnterFullscreen();
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
      }
    } else {
      if (doc.exitFullscreen) {
        doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  };

  return (
    <header className="relative w-full bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 z-50">
      <div className="absolute top-1/2 left-4 -translate-y-1/2 flex items-center gap-2 text-gray-400 hidden lg:flex">
        <ShieldIcon />
        <h1 className="font-bold text-sm">Placar Elite Pro</h1>
      </div>
      <nav className="max-w-2xl mx-auto flex justify-around items-center px-2">
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
          title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
        >
          {isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
          <span className="text-xs font-medium mt-1">{isFullscreen ? "Sair" : "Focar"}</span>
        </button>
      </nav>
    </header>
  );
};

export default Navigation;
