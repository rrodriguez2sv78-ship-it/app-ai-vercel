/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { KeyRound, Mail, ShieldAlert, ArrowRight, User as UserIcon, Wrench } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  users: User[];
  onLoginSuccess: (user: User, roleType: 'admin' | 'auxiliar') => void;
  onTriggerNotification: (title: string, desc: string, type: 'info' | 'success' | 'warning') => void;
}

export default function Login({
  users,
  onLoginSuccess,
  onTriggerNotification
}: LoginProps) {
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // The 4 assigned full-access users specified by user
  const handleCorporateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const email = emailInput.trim().toLowerCase();
    const password = passwordInput;
    
    if (!email) {
      setErrorMsg('Por favor, ingrese su correo electrónico o nombre.');
      return;
    }

    if (!password) {
      setErrorMsg('Por favor, ingrese su contraseña.');
      return;
    }

    // Identify user in state, or match by name
    const foundUser = users.find(u => {
      const emailMatch = u.email.toLowerCase() === email;
      const nameMatch = u.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === email.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return emailMatch || nameMatch;
    });

    if (!foundUser) {
      setErrorMsg('Usuario no autorizado o no registrado en el sistema.');
      onTriggerNotification(
        'Acceso Restringido',
        'El usuario ingresado no pertenece al sistema.',
        'warning'
      );
      return;
    }

    const expectedPassword = foundUser.password || 'CCalidad29NNeo';

    if (password !== expectedPassword && password !== 'CCalidad29NNeo') {
      setErrorMsg('Contraseña incorrecta. Intente de nuevo.');
      onTriggerNotification(
        'Contraseña Incorrecta',
        'La contraseña ingresada no es válida.',
        'warning'
      );
      return;
    }

    // Success login
    onLoginSuccess(foundUser, 'admin');
    onTriggerNotification(
      'Sesión Iniciada',
      `Bienvenido, ${foundUser.name}. Acceso administrativo concedido.`,
      'success'
    );
  };

  const handleAuxiliarLogin = () => {
    // Auxiliary virtual user session
    const auxUser: User = {
      id: 'usr-aux',
      name: 'Auxiliar de Operaciones',
      email: 'auxiliar@ferco.com.gt',
      role: 'Auxiliar',
      avatarColor: 'bg-zinc-600'
    };

    onLoginSuccess(auxUser, 'auxiliar');
    onTriggerNotification(
      'Acceso Auxiliar',
      'Ingreso correcto. Módulo exclusivo para solventar incidencias habilitado.',
      'info'
    );
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 text-zinc-100 p-4 select-none relative overflow-hidden font-sans">
      {/* Background gradients and visual nodes */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden flex flex-col gap-6">
        
        {/* Top Header Identity */}
        <div className="flex items-center gap-3 border-b border-zinc-800/60 pb-5">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-black text-xl shadow-md border border-amber-400">
            5S
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-wide text-zinc-100">Bodega 200 NNEO</h1>
            <p className="text-[11px] text-zinc-400 font-semibold tracking-wide uppercase">
              Operaciones Salvador — Sistema 5'S
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Iniciar sesión</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Ingresa con tu correo corporativo asignado. Only authorized users.
          </p>
        </div>

        {/* Corporate Form */}
        <form onSubmit={handleCorporateLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              CORREO ELECTRÓNICO O NOMBRE
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="diego.bautista@ferco.com.gt"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-200 outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
              CONTRASEÑA
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <KeyRound className="w-4 h-4" />
              </span>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-xs text-zinc-200 outline-none focus:border-amber-500 transition-colors"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-2.5 flex items-start gap-2 text-rose-400 text-xs font-semibold leading-relaxed">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-extrabold text-xs py-3 rounded-lg uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow"
          >
            <span>Ingresar</span>
            <ArrowRight className="w-4 h-4 text-zinc-950" />
          </button>
        </form>

        <p className="text-[11px] text-zinc-500 text-center font-medium">
          ¿Nuevo usuario? Contacta al administrador del sistema.
        </p>

        {/* Separator */}
        <div className="relative flex items-center justify-center my-1.5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <span className="relative bg-zinc-900 px-3 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            O ACCESO OPERATIVO
          </span>
        </div>

        {/* Auxiliary Access (Separate Gate) */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleAuxiliarLogin}
            className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 rounded-xl py-3 px-4 transition-all flex items-center justify-center gap-2.5 cursor-pointer shadow-inner text-left"
          >
            <Wrench className="w-4 h-4 text-amber-500" />
            <div className="flex-1">
              <span className="text-zinc-200 font-bold text-xs block">👷 Acceso Auxiliar</span>
              <span className="text-zinc-500 text-[9px] font-semibold mt-0.5 block">
                Para la resolución y cierre de incidencias en sitio
              </span>
            </div>
          </button>
        </div>

        {/* Hint for demonstration */}
        <div className="mt-2 bg-zinc-950/40 border border-zinc-800/40 rounded-xl p-3 text-[10px] text-zinc-500 leading-normal text-center">
          <strong className="text-zinc-400 block uppercase font-bold mb-1 font-mono text-[9px] tracking-wider">Acceso de sistema (Contraseña: <span className="text-amber-400">CCalidad29NNeo</span>)</strong>
          <span>Utilice su correo corporativo configurado para ingresar.</span>
        </div>

      </div>
    </div>
  );
}
