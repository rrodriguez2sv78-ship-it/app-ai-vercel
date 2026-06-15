/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Activity, 
  ScanSearch, 
  Layers, 
  UsersRound, 
  SlidersHorizontal, 
  ShieldAlert, 
  LogOut, 
  MapPinned,
  Hexagon,
  ScanLine
} from 'lucide-react';
import { User, AuditStage } from '../types';

interface SidebarProps {
  currentUser: User;
  activeView: string;
  setActiveView: (view: string) => void;
  pendingAuditsCount: number;
  isAuxiliarUser?: boolean;
  onLogout?: () => void;
}

export default function Sidebar({
  currentUser,
  activeView,
  setActiveView,
  pendingAuditsCount,
  isAuxiliarUser = false,
  onLogout
}: SidebarProps) {
  const allMenuItems = [
    {
      id: 'kanban',
      label: 'Todas las Auditorías',
      icon: Layers,
      badge: pendingAuditsCount > 0 ? pendingAuditsCount : undefined,
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Activity,
    },
    {
      id: 'nova',
      label: 'Nueva Auditoría',
      icon: ScanSearch,
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: UsersRound,
    },
    {
      id: 'areas',
      label: 'Zonas y Áreas',
      icon: MapPinned,
    },
    {
      id: 'config',
      label: 'Configuración',
      icon: SlidersHorizontal,
    },
    {
      id: 'resolucion',
      label: 'Resolver Incidencias',
      icon: ShieldAlert,
    },
  ];

  // If user is auxiliary, they ONLY get access to 'resolucion' (Solve Incidents)
  const menuItems = isAuxiliarUser 
    ? allMenuItems.filter(item => item.id === 'resolucion')
    : allMenuItems;

  return (
    <aside className="w-64 bg-zinc-950 text-zinc-100 flex flex-col border-r border-amber-500/15 select-none h-screen shrink-0 shadow-lg shadow-black/40">
      {/* Brand Header */}
      <div className="p-5 border-b border-zinc-800/60 flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 shrink-0 group">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md group-hover:scale-105 transition-transform duration-500" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <path id="arrow5s" 
                d="M 4 -40 
                   A 40 40 0 0 1 35 -19
                   L 39 -22
                   L 39 -4
                   L 21 -10
                   L 26 -13
                   A 32 32 0 0 0 3 -32
                   Z" 
              />
            </defs>
            
            <g transform="translate(50, 50)">
              <use href="#arrow5s" fill="#2CA344" transform="rotate(-72)" />
              <use href="#arrow5s" fill="#1E94D2" transform="rotate(0)" />
              <use href="#arrow5s" fill="#D4AA2B" transform="rotate(72)" />
              <use href="#arrow5s" fill="#E02931" transform="rotate(144)" />
              <use href="#arrow5s" fill="#A21685" transform="rotate(216)" />
              
              <text x="0" y="-12" fill="#a1a1aa" fontSize="13" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">改善</text>
              <text x="0" y="16" fill="#f4f4f5" fontSize="32" fontWeight="900" textAnchor="middle" fontFamily="sans-serif">5S</text>
              <text x="0" y="28" fill="#a1a1aa" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">★ KAIZEN ★</text>
            </g>
          </svg>
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-wide text-zinc-100 leading-none">Bodega 200</h1>
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Auditorías</span>
        </div>
      </div>

      {/* Logged in User profile */}
      <div className="p-5 border-b border-zinc-900/60 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-zinc-100 font-bold border border-amber-500/30 ${currentUser.avatarColor || 'bg-amber-600'}`}>
          {currentUser.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate text-zinc-100">{currentUser.name}</p>
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 mt-1">
            {currentUser.role}
          </span>
        </div>
      </div>

      {/* Main Menu Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all group duration-200 ${
                isActive
                  ? 'bg-amber-500 bg-opacity-10 text-amber-400 border-l-2 border-amber-400 font-semibold'
                  : 'text-zinc-400 hover:bg-zinc-90 w-full hover:text-zinc-100 hover:bg-zinc-900/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-amber-400' : 'text-zinc-500 group-hover:text-amber-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Logout Option */}
      {onLogout && (
        <div className="px-3 py-2 border-t border-zinc-900 bg-zinc-950/20">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/5 transition-all text-left"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}

      {/* Footer Branding context */}
      <div className="p-4 border-t border-zinc-900 bg-zinc-950/50 flex flex-col gap-1 items-center justify-center text-center">
        <span className="text-[11px] font-semibold text-amber-400 tracking-wide">Cedi Nejapa</span>
        <span className="text-[9px] text-zinc-500 font-mono">El Salvador • v1.4</span>
      </div>
    </aside>
  );
}
