import React from 'react';
import { Trash2Icon, AlertTriangleIcon, InfoIcon, CheckIcon, XIcon, CrownIcon } from './icons';

export type ModalType = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: ModalType;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: 'trash' | 'alert' | 'info' | 'check' | 'crown';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  type = 'info',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  showCancel = true,
  onConfirm,
  onCancel,
  icon
}) => {
  if (!isOpen) return null;

  const themes = {
    danger: {
      border: 'border-rose-500/30',
      bgIcon: 'bg-rose-500/10 text-rose-500',
      btn: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/20',
      defaultIcon: <Trash2Icon className="w-8 h-8" />
    },
    warning: {
      border: 'border-amber-500/30',
      bgIcon: 'bg-amber-500/10 text-amber-500',
      btn: 'bg-amber-600 hover:bg-amber-500 text-black shadow-amber-900/20',
      defaultIcon: <AlertTriangleIcon className="w-8 h-8" />
    },
    info: {
      border: 'border-indigo-500/30',
      bgIcon: 'bg-indigo-500/10 text-indigo-400',
      btn: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20',
      defaultIcon: <InfoIcon className="w-8 h-8" />
    },
    success: {
      border: 'border-emerald-500/30',
      bgIcon: 'bg-emerald-500/10 text-emerald-500',
      btn: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20',
      defaultIcon: <CheckIcon className="w-8 h-8" />
    }
  };

  const theme = themes[type];

  const getIcon = () => {
    switch (icon) {
      case 'trash': return <Trash2Icon className="w-8 h-8" />;
      case 'alert': return <AlertTriangleIcon className="w-8 h-8" />;
      case 'info': return <InfoIcon className="w-8 h-8" />;
      case 'check': return <CheckIcon className="w-8 h-8" />;
      case 'crown': return <CrownIcon className="w-8 h-8" />;
      default: return theme.defaultIcon;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[999] flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={onCancel}>
      <div 
        className={`bg-[#030712] border ${theme.border} rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 text-center space-y-6 relative overflow-hidden`}
        onClick={e => e.stopPropagation()}
      >
        {/* Decorative glass flare */}
        <div className={`absolute -right-10 -top-10 w-32 h-32 opacity-10 blur-3xl rounded-full ${type === 'danger' ? 'bg-rose-500' : type === 'warning' ? 'bg-amber-500' : 'bg-indigo-500'}`} />

        <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center ${theme.bgIcon}`}>
          {getIcon()}
        </div>
        
        <div className="space-y-2">
          <h2 className="text-xl font-black text-white uppercase tracking-tighter">{title}</h2>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-relaxed">{message}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={onConfirm}
            className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 ${theme.btn}`}
          >
            {confirmLabel}
          </button>
          
          {showCancel && (
            <button 
              onClick={onCancel}
              className="w-full py-4 bg-white/5 text-white/40 rounded-xl font-black uppercase text-[10px] tracking-widest hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/5"
            >
              {cancelLabel}
            </button>
          )}
        </div>

        <button 
          onClick={onCancel}
          className="absolute top-6 right-6 p-2 text-white/10 hover:text-white transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ConfirmModal;
