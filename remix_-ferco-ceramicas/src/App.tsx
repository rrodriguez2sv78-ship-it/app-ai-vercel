/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import KanbanBoard from './components/KanbanBoard';
import Dashboard from './components/Dashboard';
import AuditForm from './components/AuditForm';
import UserManagement from './components/UserManagement';
import ConfigForm from './components/ConfigForm';
import NotificationCenter, { ToastNotification } from './components/NotificationCenter';
import ResolutionCenter from './components/ResolutionCenter';
import Login from './components/Login';
import AreaManagement from './components/AreaManagement';

import { Audit, User, SStepConfig, AppNotification } from './types';
import { INITIAL_USERS, INITIAL_AUDITS, INITIAL_S_CONFIG, AREAS } from './data/defaultData';
import { Bell, MapPin, User as UserIcon } from 'lucide-react';

const PREDEFINED_THEMES = {
  dark: { colors: { bg: '#0a0a0a', bgCard: '#18181b', text: '#f4f4f5', title: '#f59e0b' } },
  light: { colors: { bg: '#f3f4f6', bgCard: '#ffffff', text: '#111827', title: '#ea580c' } },
  corporate: { colors: { bg: '#0f172a', bgCard: '#1e293b', text: '#f1f5f9', title: '#38bdf8' } }
};

export default function App() {
  // --- Persistent & In-memory States ---
  // Seed state databases from localStorage or defaults
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('ferco_users_v2');
    const loaded: User[] = saved ? JSON.parse(saved) : INITIAL_USERS;
    // Strictly filter out Luis Campos and Gian Carlo Lam as requested by the user
    return loaded.filter(u => u.name !== 'Luis Campos' && u.name !== 'Gian Carlo Lam');
  });

  const [audits, setAudits] = useState<Audit[]>(() => {
    const saved = localStorage.getItem('ferco_audits_v2');
    const loaded: Audit[] = saved ? JSON.parse(saved) : INITIAL_AUDITS;
    // Map existing or hydrated audits if they don't have a resolutionCode
    return loaded.map((audit, i) => {
      if (!audit.resolutionCode) {
        return {
          ...audit,
          resolutionCode: `RES-100${i + 1}`
        };
      }
      return audit;
    });
  });

  const [sStepsConfig, setSStepsConfig] = useState<SStepConfig[]>(() => {
    const saved = localStorage.getItem('ferco_s_config_v2');
    if (saved) {
      try {
        const parsed: SStepConfig[] = JSON.parse(saved);
        const hasNewCriteria = parsed.some(p => p.criteria.includes('Producto estibado a granel'));
        if (hasNewCriteria) {
          return parsed;
        }
      } catch (e) {
        // Fallback
      }
    }
    return INITIAL_S_CONFIG;
  });

  const [areas, setAreas] = useState<string[]>(() => {
    const saved = localStorage.getItem('ferco_areas');
    return saved ? JSON.parse(saved) : AREAS;
  });

  // ... [notifications state unchanged]

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    return [
      {
        id: 'n-1',
        title: '⚠️ Desviación en Rack 5',
        description: 'Se detectó polvo y astillas en niveles inferiores en Rack 5. Se asignaron planes de acción a Mario Calderón.',
        timestamp: '9 min p.m.',
        read: false,
        type: 'warning'
      },
      {
        id: 'n-2',
        title: '✓ Éxito de cumplimiento (100%)',
        description: 'La inspección de Grifería arrojó 100% de cumplimiento. Se catalogó automáticamente como cerrada.',
        timestamp: '8:42 a.m.',
        read: true,
        type: 'success'
      },
      {
        id: 'n-3',
        title: 'ℹ Nueva Rúbrica Establecida',
        description: 'Diego Bautista actualizó los criterios de verificación de la 2ª S para el almacén.',
        timestamp: 'Ayer',
        read: true,
        type: 'info'
      }
    ];
  });

  // Current session user context
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('ferco_session_user_v2');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [sessionRole, setSessionRole] = useState<'admin' | 'auxiliar' | null>(() => {
    return localStorage.getItem('ferco_session_role_v2') as 'admin' | 'auxiliar' | null;
  });
  
  // Navigation View Router
  const [activeView, setActiveView] = useState<string>(() => {
    const savedRole = localStorage.getItem('ferco_session_role_v2');
    return savedRole === 'auxiliar' ? 'resolucion' : 'kanban';
  });

  const handleLoginSuccess = (user: User, roleType: 'admin' | 'auxiliar') => {
    setCurrentUser(user);
    setSessionRole(roleType);
    localStorage.setItem('ferco_session_user_v2', JSON.stringify(user));
    localStorage.setItem('ferco_session_role_v2', roleType);
    
    if (roleType === 'auxiliar') {
      setActiveView('resolucion');
    } else {
      setActiveView('kanban');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSessionRole(null);
    localStorage.removeItem('ferco_session_user_v2');
    localStorage.removeItem('ferco_session_role_v2');
  };

  // Push notification alert triggers drawer
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  // --- Synchronization & Side Effects ---
  useEffect(() => {
    localStorage.setItem('ferco_users_v2', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('ferco_audits_v2', JSON.stringify(audits));
  }, [audits]);

  useEffect(() => {
    localStorage.setItem('ferco_s_config_v2', JSON.stringify(sStepsConfig));
  }, [sStepsConfig]);

  useEffect(() => {
    localStorage.setItem('ferco_areas', JSON.stringify(areas));
  }, [areas]);

  // --- Theme injection on boot ---
  useEffect(() => {
    const savedTheme = localStorage.getItem('ferco_theme') || 'dark';
    const savedColors = localStorage.getItem('ferco_custom_colors');
    let customColors = { bg: '#0a0a0a', bgCard: '#18181b', text: '#f4f4f5', title: '#f59e0b' };
    if (savedColors) {
      try { customColors = JSON.parse(savedColors); } catch (e) {}
    }
    
    let colorsToApply = customColors;
    if (savedTheme !== 'custom' && PREDEFINED_THEMES[savedTheme as keyof typeof PREDEFINED_THEMES]) {
      colorsToApply = PREDEFINED_THEMES[savedTheme as keyof typeof PREDEFINED_THEMES].colors;
    }

    const setProp = (v: string, c: string) => document.documentElement.style.setProperty(v, c);
    
    setProp('--custom-neutral-950', colorsToApply.bg);
    setProp('--custom-zinc-950', colorsToApply.bg);
    setProp('--custom-zinc-900', colorsToApply.bgCard);
    setProp('--custom-zinc-100', colorsToApply.text);
    setProp('--custom-amber-400', colorsToApply.title);
    setProp('--custom-amber-500', colorsToApply.title);
    
    if (savedTheme === 'light') {
      setProp('--custom-zinc-800', '#e5e7eb');
      setProp('--custom-zinc-500', '#6b7280');
      setProp('--custom-zinc-400', '#374151');
    } else {
      setProp('--custom-zinc-800', '#27272a');
      setProp('--custom-zinc-500', '#71717a');
      setProp('--custom-zinc-400', '#a1a1aa');
    }
  }, []);

  // --- Alert Action Triggers ---
  const handleTriggerNotification = (title: string, desc: string, type: 'info' | 'success' | 'warning') => {
    const newNotify: AppNotification = {
      id: 'notify-' + Math.random().toString(36).substring(2, 9),
      title,
      description: desc,
      timestamp: new Date().toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type
    };

    setNotifications(prev => [newNotify, ...prev]);
    setActiveToast(newNotify);

    // Auto-dismiss floating toast notifications after 4 seconds
    setTimeout(() => {
      setActiveToast(current => current?.id === newNotify.id ? null : current);
    }, 4500);
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    setIsNotificationsOpen(false);
  };

  // Count active audits currently in overdue / action plan state ('Atrasada')
  const pendingAuditsCount = audits.filter(a => a.status === 'Atrasada' || a.status === 'Pendiente').length;

  // New audits appender
  const handleAuditCreated = (newAudit: Audit) => {
    setAudits(prev => [newAudit, ...prev]);
    setActiveView('kanban'); // slide back to kanban overview
  };

  if (!currentUser) {
    return (
      <Login 
        users={users}
        onLoginSuccess={handleLoginSuccess}
        onTriggerNotification={handleTriggerNotification}
      />
    );
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-zinc-100 font-sans overflow-hidden">
      
      {/* Dynamic Left Menu Navigation */}
      <Sidebar 
        currentUser={currentUser}
        activeView={activeView}
        setActiveView={setActiveView}
        pendingAuditsCount={pendingAuditsCount}
        isAuxiliarUser={sessionRole === 'auxiliar'}
        onLogout={handleLogout}
      />

      {/* Main Content Workspace viewport */}
      <div className="flex-1 flex flex-col min-w-0 bg-neutral-950 relative">
        
        {/* Absolute Top-Right Controls overlay (Uniform "Notificaciones" Button across all screens) */}
        <div className="absolute top-6 right-6 z-30">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all shadow-md shadow-black/30 cursor-pointer border border-zinc-800 text-right select-none"
            id="notifications-trigger-btn"
          >
            <span className="text-amber-500 font-bold text-xs">🔔</span>
            <span>Notificaciones</span>
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="bg-amber-500 text-black text-[10px] font-black px-1.5 py-0.5 rounded-full shadow shrink-0">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>
        </div>

        {/* Floating Notification Sidebar menu drawer */}
        <NotificationCenter 
          notifications={notifications}
          setNotifications={setNotifications}
          isOpen={isNotificationsOpen}
          onClose={() => setIsNotificationsOpen(false)}
          onClearAll={handleClearNotifications}
        />

        {/* Conditional rendering depending on ActiveView router */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activeView === 'kanban' && (
            <KanbanBoard 
              audits={audits}
              setAudits={setAudits}
              users={users}
              currentUser={currentUser!}
              onTriggerNotification={handleTriggerNotification}
              onNavigateToNewAudit={() => setActiveView('nova')}
            />
          )}

          {activeView === 'dashboard' && (
            <Dashboard 
              audits={audits}
              sSteps={sStepsConfig}
              areas={areas}
            />
          )}

          {activeView === 'nova' && (
            <AuditForm 
              sStepsConfig={sStepsConfig}
              users={users}
              currentUser={currentUser!}
              areas={areas}
              onAuditCreated={handleAuditCreated}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {activeView === 'usuarios' && (
            <UserManagement 
              users={users}
              setUsers={setUsers}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {activeView === 'areas' && (
            <AreaManagement 
              areas={areas}
              setAreas={setAreas}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {activeView === 'config' && (
            <ConfigForm 
              sStepsConfig={sStepsConfig}
              setSStepsConfig={setSStepsConfig}
              onTriggerNotification={handleTriggerNotification}
            />
          )}

          {activeView === 'resolucion' && (
            <ResolutionCenter 
              audits={audits}
              setAudits={setAudits}
              onTriggerNotification={handleTriggerNotification}
            />
          )}
        </main>

        {/* Floating Action Alerts Toast */}
        <ToastNotification 
          toast={activeToast}
          onClose={() => setActiveToast(null)}
        />

      </div>
    </div>
  );
}
