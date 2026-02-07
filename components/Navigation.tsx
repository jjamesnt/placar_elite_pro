
import React, { useState, useEffect } from 'react';
import { ClipboardListIcon, UsersIcon, TrophyIcon, CogIcon, ShieldIcon, MaximizeIcon, MinimizeIcon, HistoryIcon, LogOutIcon, UserCogIcon } from './icons';
import { Arena, ArenaColor } from '../types';

export type View = 'placar' | 'atletas' | 'ranking' | 'historico' | 'config' | 'admin';

const THEME_COLORS: Record<string, string> = {
  indigo: 'text-indigo-400',
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
  violet: 'text-violet-400'
};

interface NavButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  activeColorClass: string;
}

const NavButton: React.FC<NavButtonProps> = ({ label, icon, isActive, onClick, activeColorClass }) => {
  const inactiveClasses = 'text-gray-500 hover:text-white';
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center justify-center px-1.5 sm:px-4 py-1 transition-all duration-300 transform active:scale-95 ${isActive ? activeColorClass : inactiveClasses}`}
    >
      <div className={`relative transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
        {/* Cast to any to safely inject className prop during React.cloneElement */}
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-4 h-4 sm:w-5 h-5' })}
      </div>
      <span className="text-[5px] sm:text-[7px] font-black mt-0.5 uppercase tracking-widest leading-none">{label}</span>
      {isActive && (
        <div className={`absolute -bottom-1 w-6 sm:w-8 h-0.5 rounded-full ${activeColorClass.replace('text', 'bg')} shadow-[0_0_8px_currentColor]`} />
      )}
    </button>
  );
};

interface NavigationProps {
  currentView: View;
  onNavigate: (view: View) => void;
  lastUpdate: string;
  currentArena: Arena;
  onLogout: () => void;
  isAdmin?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onNavigate, lastUpdate, currentArena, onLogout, isAdmin }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
  const arenaColorClass = THEME_COLORS[currentArena.color || 'indigo'];

  useEffect(() => {
    const handleFsChange = () => {
      const doc = document as any;
      const isFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement || doc.webkitIsFullScreen);
      setIsFullscreen(isFull);
    };
    const events = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    events.forEach(event => document.addEventListener(event, handleFsChange));
    return () => events.forEach(event => document.removeEventListener(event, handleFsChange));
  }, []);

  const toggleFullscreen = async () => {
    // Detectar iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;

    // Se estiver no iPhone e não estiver instalado (PWA), mostra a dica de instalação
    if (isIOS && !isStandalone) {
      setShowIosTip(true);
      setTimeout(() => setShowIosTip(false), 6000);
      return;
    }

    try {
      const doc = document as any;
      const element = document.documentElement as any;
      const isCurrentlyFull = !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement || doc.webkitIsFullScreen);

      if (!isCurrentlyFull) {
        if (element.requestFullscreen) await element.requestFullscreen();
        else if (element.webkitRequestFullscreen) await element.webkitRequestFullscreen();
        else if (element.webkitEnterFullscreen) await element.webkitEnterFullscreen();
      } else {
        if (doc.exitFullscreen) await doc.exitFullscreen();
        else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
      }
    } catch (err) {
      console.error("Erro ao alternar tela cheia:", err);
    }
  };

  return (
    <header className="relative w-full z-50 bg-gray-900/98 backdrop-blur-3xl border-b border-white/5 px-2 sm:px-4 h-11 sm:h-12 flex items-center justify-between flex-shrink-0">
      <div className="flex flex-col min-w-[90px] justify-center">
        <div className="flex items-center gap-1 text-white">
          <ShieldIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-indigo-500" />
          <h1 className="font-black text-[9px] sm:text-[11px] uppercase tracking-tighter leading-none whitespace-nowrap">Placar Elite Pro</h1>
        </div>
        <div className="flex items-center gap-1 mt-0.5 ml-3.5 sm:ml-4">
          <span className={`text-[6px] sm:text-[7px] font-black tracking-[0.1em] uppercase truncate max-w-[70px] sm:max-w-[100px] ${arenaColorClass}`}>
            {currentArena.name}
          </span>
          <div className="w-px h-1.5 bg-gray-800"></div>
          <span className="text-[5px] sm:text-[6px] text-gray-600 font-mono tracking-tighter">{lastUpdate}</span>
        </div>
      </div>

      <nav className="flex items-center gap-0.5 sm:gap-1 flex-1 justify-center px-1">
        <NavButton label="Placar" icon={<ClipboardListIcon />} isActive={currentView === 'placar'} onClick={() => onNavigate('placar')} activeColorClass={arenaColorClass} />
        <NavButton label="Histórico" icon={<HistoryIcon />} isActive={currentView === 'historico'} onClick={() => onNavigate('historico')} activeColorClass={arenaColorClass} />
        <NavButton label="Atletas" icon={<UsersIcon />} isActive={currentView === 'atletas'} onClick={() => onNavigate('atletas')} activeColorClass={arenaColorClass} />
        <NavButton label="Ranking" icon={<TrophyIcon />} isActive={currentView === 'ranking'} onClick={() => onNavigate('ranking')} activeColorClass={arenaColorClass} />
        <NavButton label="Config" icon={<CogIcon />} isActive={currentView === 'config'} onClick={() => onNavigate('config')} activeColorClass={arenaColorClass} />
        {isAdmin && (
          <NavButton label="ADM" icon={<UserCogIcon />} isActive={currentView === 'admin'} onClick={() => onNavigate('admin')} activeColorClass="text-rose-500" />
        )}
      </nav>

      <div className="flex items-center gap-1 sm:gap-2 min-w-[70px] justify-end relative">
        {showIosTip && (
          <div className="absolute top-12 right-0 bg-white text-black p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-[9px] font-black uppercase tracking-tighter w-48 animate-in slide-in-from-top-2 z-[100] border-2 border-indigo-500">
            <div className="flex flex-col gap-2">
              <p>No iPhone, toque em <span className="text-blue-600">Compartilhar</span> <svg className="w-4 h-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg></p>
              <p>E selecione <span className="text-blue-600">"Adicionar à Tela de Início"</span> para focar.</p>
            </div>
            <div className="absolute -top-2 right-6 w-4 h-4 bg-white rotate-45 border-l-2 border-t-2 border-indigo-500"></div>
          </div>
        )}
        <button onClick={toggleFullscreen} className="p-1.5 text-gray-600 hover:text-white transition-all active:scale-95 flex flex-col items-center">
          {isFullscreen ? <MinimizeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <MaximizeIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          <span className="text-[4px] sm:text-[5px] font-black uppercase tracking-widest mt-0.5">Focar</span>
        </button>
        <button onClick={onLogout} className="p-1.5 text-red-500 hover:text-red-400 transition-all active:scale-95 flex flex-col items-center ml-0.5">
          <LogOutIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-[4px] sm:text-[5px] font-black uppercase tracking-widest mt-0.5">Sair</span>
        </button>
      </div>
    </header>
  );
};

export default Navigation;
