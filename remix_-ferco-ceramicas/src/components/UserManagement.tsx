/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, Key, RefreshCw, X, UserCheck, ShieldAlert, Mail, UserPlus, Trash2 } from 'lucide-react';
import { User, UserRole } from '../types';

interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  onTriggerNotification: (title: string, desc: string, type: 'info' | 'success' | 'warning') => void;
}

export default function UserManagement({
  users,
  setUsers,
  onTriggerNotification
}: UserManagementProps) {
  // Modal toggle state for new user creation
  const [isNewUserModalOpen, setIsNewUserModalOpen] = useState(false);
  
  // New User Form fields
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Supervisor');
  const [newUserPassword, setNewUserPassword] = useState('');

  // Delete User
  const handleDeleteUser = (userId: string, userName: string) => {
    if (confirm(`¿Estás seguro que deseas eliminar al usuario ${userName}? Esta acción no se puede deshacer.`)) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      onTriggerNotification(
        'Usuario Eliminado',
        `El usuario ${userName} ha sido removido del sistema.`,
        'success'
      );
    }
  };

  // Change user role
  const handleChangeRole = (userId: string, targetRole: UserRole) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, role: targetRole };
      }
      return u;
    }));

    const subject = users.find(u => u.id === userId);
    if (subject) {
      onTriggerNotification(
        'Privilegios Actualizados',
        `Se cambió el cargo de ${subject.name} a "${targetRole}".`,
        'info'
      );
    }
  };

  // Secure simulation of password resets
  const handleResetPassword = (user: User) => {
    onTriggerNotification(
      '🔑 Contraseña Reseteada',
      `Se envió un correo de restablecimiento temporal a: ${user.email}`,
      'success'
    );
    alert(`Contraseña temporal autogenerada para ${user.name}. El enlace seguro de acceso se ha enviado a ${user.email}`);
  };

  // Form submission handler for new users
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      alert('Favor rellenar el nombre y correo correspondientes.');
      return;
    }

    // Avatar color pool
    const colorPool = ['bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-teal-500', 'bg-purple-500'];
    const randomColor = colorPool[Math.floor(Math.random() * colorPool.length)];

    const newUser: User = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      name: newUserName.trim(),
      email: newUserEmail.trim().toLowerCase(),
      role: newUserRole,
      avatarColor: randomColor,
      ...(newUserPassword.trim() ? { password: newUserPassword.trim() } : {})
    };

    setUsers(prev => [...prev, newUser]);
    setIsNewUserModalOpen(false);
    
    // Clear fields
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('Supervisor');
    setNewUserPassword('');

    onTriggerNotification(
      'Usuario Registrado',
      `Se dio de alta exitosamente la cuenta de ${newUser.name} como ${newUser.role}`,
      'success'
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-950 p-6 text-zinc-100 flex flex-col gap-6 select-none">
      
      {/* Title Header block */}
      <div className="flex flex-col gap-4 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Gestión de Usuarios</h2>
          <p className="text-xs text-zinc-400 mt-1 font-semibold text-amber-500/90 tracking-wide uppercase">
            Bodega 200 NNEO — Sistema de Auditorías 5S
          </p>
        </div>
        <button 
          onClick={() => setIsNewUserModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black w-full md:w-auto px-5 py-3 rounded-lg text-sm font-extrabold shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 transition-all cursor-pointer border border-amber-400"
        >
          <Plus className="w-5 h-5" />
          Añadir Nuevo Usuario
        </button>
      </div>

      {/* User table Card holding interactive details */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 shadow-md">
        <h3 className="text-zinc-200 font-bold text-sm tracking-wide mb-4 uppercase">
          Usuarios registrados ({users.length})
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-semibold text-[11px] uppercase">
                <th className="py-2.5 px-4">NOMBRE</th>
                <th className="py-2.5 px-4">CORREO</th>
                <th className="py-2.5 px-4 text-center">ROL</th>
                <th className="py-2.5 px-6 text-center">CAMBIAR ROL</th>
                <th className="py-2.5 px-4 text-center">CONTRASEÑA</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const init = user.name.split(' ').map(n => n[0]).join('');
                
                return (
                  <tr key={user.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-colors duration-150">
                    {/* User profile with initials avatar */}
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${user.avatarColor} text-zinc-100 font-extrabold flex items-center justify-center text-[10.5px] border border-amber-500/20 shadow-inner shrink-0`}>
                        {init}
                      </div>
                      <span className="text-zinc-100 font-semibold text-sm">{user.name}</span>
                    </td>

                    {/* Email address */}
                    <td className="py-3 px-4 text-zinc-400 font-mono text-xs">{user.email}</td>

                    {/* Badge display role */}
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'Administrador'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                          : 'bg-amber-500/10 text-amber-500 border border-amber-500/25'
                      }`}>
                        {user.role}
                      </span>
                    </td>

                    {/* Change role select option dropdown */}
                    <td className="py-3 px-6 text-center">
                      <select
                        value={user.role}
                        onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)}
                        className="bg-zinc-950 text-xs text-zinc-200 border border-zinc-800 rounded px-2.5 py-1.5 focus:border-amber-500 outline-none font-medium cursor-pointer"
                      >
                        <option value="Supervisor" className="bg-zinc-900">Supervisor</option>
                        <option value="Administrador" className="bg-zinc-900">Administrador</option>
                      </select>
                    </td>

                    {/* Actions: delete & reset password */}
                    <td className="py-3 px-4 flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleResetPassword(user)}
                        className="inline-flex items-center gap-1 bg-zinc-950 hover:bg-zinc-800/80 text-amber-500 border border-zinc-800 rounded px-2.5 py-1.5 text-[10px] font-semibold transition-all cursor-pointer hover:border-amber-500/30 font-mono italic"
                        title="Resetear contraseña temporal"
                      >
                        <Key className="w-3 h-3" /> Reset
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="inline-flex items-center justify-center bg-zinc-950 hover:bg-rose-500/20 text-rose-500 border border-zinc-800 hover:border-rose-500/50 rounded px-2.5 py-1.5 transition-all cursor-pointer"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Creation User Dialog Modal popup */}
      {isNewUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-amber-500/30 rounded-xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in-50 zoom-in-95 duration-200">
            
            {/* Modal Exit top right */}
            <button 
              onClick={() => setIsNewUserModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-5">
              <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-500" />
                Registrar Nuevo Operador 5S
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                De de alta la cuenta de un supervisor o auditor para dar seguimiento a los almacenes.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser} className="space-y-4">
              
              {/* Name field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider uppercase block">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Luis Campos"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full bg-zinc-900 text-xs text-zinc-200 border border-zinc-800 rounded-lg p-3 outline-none focus:border-amber-500 font-medium"
                />
              </div>

              {/* Email field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  placeholder="Ej. l.campos@ferco.com.gt"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full bg-zinc-900 text-xs text-zinc-200 border border-zinc-800 rounded-lg p-3 outline-none focus:border-amber-500 font-medium font-mono"
                />
              </div>

              {/* Role selector field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Cargo / Rol Operativo
                </label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                  className="w-full bg-zinc-900 text-xs text-zinc-200 border border-zinc-800 rounded-lg p-3 outline-none focus:border-amber-500 font-semibold cursor-pointer"
                >
                  <option value="Supervisor">Supervisor (Control y Resolución)</option>
                  <option value="Administrador">Administrador (Auditor y Reportes)</option>
                </select>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Accesos (Contraseña) <span className="text-zinc-600 font-normal normal-case ml-1">- Opcional</span>
                </label>
                <input
                  type="password"
                  placeholder="Por defecto: CCalidad29NNeo"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full bg-zinc-900 text-xs text-zinc-200 border border-zinc-800 rounded-lg p-3 outline-none focus:border-amber-500 font-medium font-mono"
                />
              </div>

              {/* Footer controls */}
              <div className="flex gap-2 justify-end pt-3 border-t border-zinc-900/60 mt-2">
                <button
                  type="button"
                  onClick={() => setIsNewUserModalOpen(false)}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-xs font-bold px-4 py-2.5 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black font-extrabold text-xs px-5 py-2.5 rounded-lg border border-amber-400 transition-all cursor-pointer shadow-md shadow-amber-500/5"
                >
                  Crear Usuario
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
