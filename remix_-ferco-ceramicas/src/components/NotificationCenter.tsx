/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Bell, CheckCircle, AlertTriangle, Info, X, CheckSquare } from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationCenterProps {
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  isOpen: boolean;
  onClose: () => void;
  onClearAll: () => void;
}

export default function NotificationCenter({
  notifications,
  setNotifications,
  isOpen,
  onClose,
  onClearAll
}: NotificationCenterProps) {
  if (!isOpen) return null;

  // Toggle single read status
  const handleToggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  return (
    <div className="absolute right-6 top-16 z-40 w-80 bg-zinc-950 border border-amber-500/30 rounded-xl shadow-2xl flex flex-col max-h-[450px] animate-in fade-in slide-in-from-top-3 duration-250 select-none shadow-black">
      
      {/* Title bar info */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/90 rounded-t-xl">
        <div className="flex items-center gap-1.5">
          <Bell className="w-4 h-4 text-amber-500 animate-swing" />
          <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-200">Alertas Operativas</h4>
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="bg-amber-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full">
              {notifications.filter(n => !n.read).length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {notifications.length > 0 && (
            <button 
              onClick={onClearAll}
              className="text-[9px] font-bold text-amber-500/80 hover:text-amber-500 transition-colors"
            >
              Limpiar todo
            </button>
          )}
          <button 
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-200 p-0.5 rounded hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Alertas list */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/85">
        {notifications.length === 0 ? (
          <div className="p-10 text-center text-zinc-600 text-xs font-semibold">
            Sin notificaciones pendientes
          </div>
        ) : (
          notifications.map((n) => {
            let Icon = Info;
            let iconClass = 'text-blue-400 bg-blue-500/10 border-blue-500/20';

            if (n.type === 'success') {
              Icon = CheckCircle;
              iconClass = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            } else if (n.type === 'warning') {
              Icon = AlertTriangle;
              iconClass = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
            }

            return (
              <div 
                key={n.id}
                onClick={() => handleToggleRead(n.id)}
                className={`p-3 flex items-start gap-3 hover:bg-zinc-900/40 transition-colors cursor-pointer relative ${
                  !n.read ? 'bg-zinc-900/[0.15] border-l-2 border-l-amber-500' : ''
                }`}
              >
                {/* Visual indicator */}
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${iconClass}`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-[11px] font-bold truncate ${!n.read ? 'text-zinc-100' : 'text-zinc-400'}`}>
                      {n.title}
                    </p>
                    <span className="text-[8px] text-zinc-500 shrink-0 font-mono italic">
                      {n.timestamp}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-tight mt-0.5 line-clamp-2">
                    {n.description}
                  </p>
                </div>

                {/* Unread circle badge indicator */}
                {!n.read && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 absolute right-1.5 top-1.5" />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer hint */}
      <div className="p-2 border-t border-zinc-900 bg-zinc-950/80 text-center">
        <span className="text-[9px] text-zinc-600 font-mono uppercase tracking-widest font-semibold">
          Canal Central de Notificaciones Push
        </span>
      </div>

    </div>
  );
}

// Floating Toast items inside viewport
interface ToastNotificationProps {
  toast: AppNotification | null;
  onClose: () => void;
}

export function ToastNotification({ toast, onClose }: ToastNotificationProps) {
  if (!toast) return null;

  let Icon = Info;
  let borderClass = 'border-amber-500/25 bg-zinc-950 text-amber-500';

  if (toast.type === 'success') {
    Icon = CheckCircle;
    borderClass = 'border-emerald-500/30 bg-zinc-950 text-emerald-400';
  } else if (toast.type === 'warning') {
    Icon = AlertTriangle;
    borderClass = 'border-rose-500/30 bg-zinc-950 text-rose-400';
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl border p-4 shadow-2xl flex items-start gap-3.5 animate-bounce-short shadow-black ${borderClass}`}>
      <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center shrink-0 border border-zinc-800">
        <Icon className="w-5 h-5" />
      </div>
      
      <div className="flex-1 select-none">
        <p className="text-xs font-extrabold uppercase tracking-wide text-zinc-100">
          {toast.title}
        </p>
        <p className="text-[11px] text-zinc-300 leading-snug mt-0.5">
          {toast.description}
        </p>
      </div>

      <button 
        onClick={onClose}
        className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors cursor-pointer"
      >
        <X className="w-4 h-4 shrink-0" />
      </button>
    </div>
  );
}
