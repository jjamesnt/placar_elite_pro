
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
      className={`relative flex flex-col items-center justify-center px-4 py-2 transition-all duration-300 transform active:scale-95 ${isActive ? activeColorClass : inactiveClasses}`}
    >
      <div className={`relative transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
        {/* Cast to any to safely inject className prop during React.cloneElement */}
        {React.cloneElement(icon as React.ReactElement<any>, { className: 'w-5 h-5 lg:w-6 lg:h-6' })}
      </div>
      <span className="text-[10px] font-black mt-1 uppercase tracking-widest leading-none text-center">{label}</span>
      {isActive && (
        <div className={`absolute -bottom-1 w-8 h-1 rounded-full ${activeColorClass.replace('text', 'bg')} shadow-[0_0_8px_currentColor]`} />
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

  const handleLogoutWithConfirmation = () => {
    if (window.confirm("Deseja realmente sair? Toda a sua sessão atual está ativa e você perderá o acesso rápido se não tiver salvo os dados.")) {
      onLogout();
    }
  };

  return (
    <header className="relative w-full z-50 bg-gray-900/98 backdrop-blur-3xl border-b border-white/5 h-16 lg:h-20 flex items-center flex-shrink-0">
      {/* 1. Mobile Layout: keep strict structure */}
      <div className="flex lg:hidden w-full items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" />
          <div className="flex flex-col border-l border-white/10 pl-3">
            <span className={`text-[10px] font-black uppercase truncate max-w-[150px] ${arenaColorClass}`}>{currentArena.name}</span>
            <span className="text-[6px] text-gray-400 font-mono opacity-80 uppercase">Atualizado {lastUpdate}</span>
          </div>
        </div>
        <nav className="flex items-center gap-1">
          <NavButton label="Placar" icon={<ClipboardListIcon />} isActive={currentView === 'placar'} onClick={() => onNavigate('placar')} activeColorClass={arenaColorClass} />
          <NavButton label="Histórico" icon={<HistoryIcon />} isActive={currentView === 'historico'} onClick={() => onNavigate('historico')} activeColorClass={arenaColorClass} />
          <NavButton label="Atletas" icon={<UsersIcon />} isActive={currentView === 'atletas'} onClick={() => onNavigate('atletas')} activeColorClass={arenaColorClass} />
          <NavButton label="Ranking" icon={<TrophyIcon />} isActive={currentView === 'ranking'} onClick={() => onNavigate('ranking')} activeColorClass={arenaColorClass} />
          <NavButton label="Config" icon={<CogIcon />} isActive={currentView === 'config'} onClick={() => onNavigate('config')} activeColorClass={arenaColorClass} />
        </nav>
        <button onClick={handleLogoutWithConfirmation} className="p-2 text-red-500 flex flex-col items-center">
          <LogOutIcon className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Tablet/Desktop Layout: Standard Flexbox (Clean Slate) */}
      <div className="hidden lg:flex w-full h-full items-center justify-between px-6 max-w-[1600px] mx-auto">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <NavButton label="Placar" icon={<ClipboardListIcon />} isActive={currentView === 'placar'} onClick={() => onNavigate('placar')} activeColorClass={arenaColorClass} />
          <NavButton label="Histórico" icon={<HistoryIcon />} isActive={currentView === 'historico'} onClick={() => onNavigate('historico')} activeColorClass={arenaColorClass} />
          <NavButton label="Atletas" icon={<UsersIcon />} isActive={currentView === 'atletas'} onClick={() => onNavigate('atletas')} activeColorClass={arenaColorClass} />
        </div>

        {/* Central Branding: Simple Flex Item (No Absolute) */}
        <div className="flex items-center justify-center gap-4 px-8 border-x border-white/5 bg-white/5 py-2 rounded-xl">
          <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
          <div className="flex flex-col">
            <span className={`text-sm md:text-base lg:text-xl font-black uppercase tracking-widest whitespace-nowrap ${arenaColorClass}`}>
              {currentArena.name}
            </span>
            <span className="text-[9px] text-gray-400 font-mono opacity-80 uppercase tracking-widest leading-none">
              {lastUpdate}
            </span>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <NavButton label="Ranking" icon={<TrophyIcon />} isActive={currentView === 'ranking'} onClick={() => onNavigate('ranking')} activeColorClass={arenaColorClass} />
          <NavButton label="Config" icon={<CogIcon />} isActive={currentView === 'config'} onClick={() => onNavigate('config')} activeColorClass={arenaColorClass} />
          {isAdmin && (
            <NavButton label="ADM" icon={<UserCogIcon />} isActive={currentView === 'admin'} onClick={() => onNavigate('admin')} activeColorClass="text-rose-500" />
          )}
          <NavButton
            label="Focar"
            icon={isFullscreen ? <MinimizeIcon /> : <MaximizeIcon />}
            isActive={false}
            onClick={toggleFullscreen}
            activeColorClass="text-white"
          />

          {/* Logout Button: Standard */}
          <div className="border-l border-white/10 pl-4 ml-2">
            <button
              onClick={handleLogoutWithConfirmation}
              className="text-red-500 hover:text-red-400 transition-all active:scale-95 flex flex-col items-center group px-2"
            >
              <LogOutIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-50 group-hover:opacity-100 transition-opacity">Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* iOS Installation Tip Tip */}
      {
        showIosTip && (
          <div className="absolute top-full right-4 sm:right-16 bg-white text-black p-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-[9px] font-black uppercase tracking-tighter w-48 animate-in slide-in-from-top-2 z-[100] border-2 border-indigo-500 mt-2">
            <div className="flex flex-col gap-2">
              <p>No iPhone, toque em <span className="text-blue-600">Compartilhar</span> <svg className="w-4 h-4 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" /><polyline points="16 6 12 2 8 6" /><line x1="12" y1="2" x2="12" y2="15" /></svg></p>
              <p>E selecione <span className="text-blue-600">"Adicionar à Tela de Início"</span> para focar.</p>
            </div>
            <div className="absolute -top-2 right-6 w-4 h-4 bg-white rotate-45 border-l-2 border-t-2 border-indigo-500"></div>
          </div>
        )
      }
    </header>
  );
};

export default Navigation;
