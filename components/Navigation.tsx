
import React from 'react';
import { ClipboardListIcon, UsersIcon, TrophyIcon, CogIcon, ShieldIcon } from './icons';

export type View = 'placar' | 'atletas' | 'ranking' | 'config';

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
      className={`flex-1 flex flex-col items-center justify-center p-2 transition-colors duration-200 ease-in-out transform active:scale-95 ${isActive ? activeClasses : inactiveClasses}`}
    >
      {icon}
      <span className="text-xs font-medium mt-1">{label}</span>
    </button>
  );
};


interface NavigationProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate }) => {
  return (
    <header className="relative w-full bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
      <div className="absolute top-1/2 left-4 -translate-y-1/2 flex items-center gap-2 text-gray-400 hidden sm:flex">
        <ShieldIcon />
        <h1 className="font-bold text-sm">Placar Elite Pro</h1>
      </div>
      <nav className="max-w-md mx-auto flex justify-around items-center">
        <NavButton 
          label="Placar"
          icon={<ClipboardListIcon />}
          isActive={currentView === 'placar'}
          onClick={() => onNavigate('placar')}
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
      </nav>
    </header>
  );
};

export default Navigation;