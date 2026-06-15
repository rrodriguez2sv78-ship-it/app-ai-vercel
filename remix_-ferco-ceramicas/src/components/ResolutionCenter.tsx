/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { KeyRound, ShieldCheck, AlertTriangle, Check, CheckCircle2, ChevronRight, FileText, Calendar, User, Clock, ArrowRight, Image as ImageIcon, Camera } from 'lucide-react';
import { Audit, ActionPlan } from '../types';

interface ResolutionCenterProps {
  audits: Audit[];
  setAudits: React.Dispatch<React.SetStateAction<Audit[]>>;
  onTriggerNotification: (title: string, desc: string, type: 'info' | 'success' | 'warning') => void;
}

export default function ResolutionCenter({
  audits,
  setAudits,
  onTriggerNotification
}: ResolutionCenterProps) {
  const [inputCode, setInputCode] = useState<string>('');
  const [unlockedAudit, setUnlockedAudit] = useState<Audit | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Local state for formulating solutions to the action plans / incidents
  const [generalRecoveryComment, setGeneralRecoveryComment] = useState<string>('');
  const [resolvedPlans, setResolvedPlans] = useState<Record<string, { correctiveActionTaken: string; evidencePhoto?: string }>>({});

  // Search and unlock audit by its unique resolution code
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const code = inputCode.trim().toUpperCase();

    if (!code) {
      setErrorMsg('Debe ingresar un código.');
      return;
    }

    const foundAudit = audits.find(
      a => a.resolutionCode?.toUpperCase() === code || a.id.toUpperCase() === code
    );

    if (!foundAudit) {
      setErrorMsg('Código no reconocido. Intente nuevamente (Ej: RES-1002)');
      onTriggerNotification(
        'Acceso Rechazado',
        `El código '${code}' no está asociado a ninguna auditoría activa.`,
        'warning'
      );
      return;
    }

    // Initialize item status resolution states
    const initialResolutions: Record<string, { correctiveActionTaken: string; evidencePhoto?: string }> = {};
    foundAudit.actionPlans.forEach(plan => {
      initialResolutions[plan.id] = {
        correctiveActionTaken: plan.status === 'Resuelto' ? plan.correctiveAction : '',
        evidencePhoto: plan.evidencePhoto
      };
    });

    setResolvedPlans(initialResolutions);
    setGeneralRecoveryComment(foundAudit.resolutionComments || '');
    setUnlockedAudit(foundAudit);
    
    onTriggerNotification(
      'Auditoría Desbloqueada',
      `Acceso correcto a incidencias en ${foundAudit.area}.`,
      'success'
    );
  };

  // Switch to another code / Lock again
  const handleLock = () => {
    setUnlockedAudit(null);
    setInputCode('');
    setGeneralRecoveryComment('');
    setResolvedPlans({});
  };

  // Simulate photographic snapshot for the solved action plan evidence
  const handleSimulateSolutionPhoto = (planId: string) => {
    // Beautiful after photo templates for resolved states
    const afterPhotos = [
      "https://images.unsplash.com/photo-1590247813693-5541d1c609fd?q=80&w=200&auto=format&fit=crop", // clean floor rack
      "https://images.unsplash.com/photo-1553413735-3732abce4e46?q=80&w=200&auto=format&fit=crop", // tidy bins
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=200&auto=format&fit=crop", // safety checklist
      "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?q=80&w=200&auto=format&fit=crop"  // tidy space
    ];
    const pickedPhoto = afterPhotos[Math.floor(Math.random() * afterPhotos.length)];

    setResolvedPlans(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        evidencePhoto: pickedPhoto
      }
    }));

    onTriggerNotification(
      'Evidencia Solventada',
      'Fotografía de la corrección cargada con éxito.',
      'success'
    );
  };

  // Handle local text change for specific plan corrective action details
  const handlePlanDetailChange = (planId: string, text: string) => {
    setResolvedPlans(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        correctiveActionTaken: text
      }
    }));
  };

  const handleApplyResolution = () => {
    if (!unlockedAudit) return;

    // Check if there are active plans and they are all filled out
    if (unlockedAudit.actionPlans.length > 0) {
      const missingDetails = unlockedAudit.actionPlans.some(
        plan => !resolvedPlans[plan.id]?.correctiveActionTaken.trim()
      );
      if (missingDetails) {
        alert('Por favor complete la descripción de la solución tomada para cada una de las incidencias.');
        return;
      }
    }

    if (!generalRecoveryComment.trim()) {
      alert('Es necesario dejar un comentario de resolución global resumen.');
      return;
    }

    // Update all audits state with resolved parameters
    setAudits(prevAudits =>
      prevAudits.map(audit => {
        if (audit.id === unlockedAudit.id) {
          // Map resolved action plans
          const updatedActionPlans = audit.actionPlans.map(plan => ({
            ...plan,
            status: 'Resuelto' as const,
            correctiveAction: resolvedPlans[plan.id]?.correctiveActionTaken || plan.correctiveAction,
            evidencePhoto: resolvedPlans[plan.id]?.evidencePhoto || plan.evidencePhoto
          }));

          return {
            ...audit,
            status: 'Cerrada' as const,
            isResolved: true,
            resolvedAt: new Date().toISOString(),
            resolutionComments: generalRecoveryComment.trim(),
            actionPlans: updatedActionPlans,
            // Also ensure audit items complies status is corrected to true if currently false
            items: audit.items.map(it => it.complies === false ? { ...it, complies: true, comment: `Resuelto: ${resolvedPlans[it.id]?.correctiveActionTaken || 'Corregido satisfactoriamente.'}` } : it),
            score: 100 // Boost score to 100% post-resolution as requested
          };
        }
        return audit;
      })
    );

    onTriggerNotification(
      'Incidencias Solventadas',
      `La auditoría de ${unlockedAudit.area} ha sido catalogada como RESUELTA con puntaje ideal de 100%.`,
      'success'
    );

    // Show a congratulations alert and lock back to entry screen
    alert(`¡Resolución procesada con éxito!\nLa auditoría ${unlockedAudit.id} ahora figura como solventada en el Dashboard.`);
    setUnlockedAudit(null);
    setInputCode('');
    setGeneralRecoveryComment('');
    setResolvedPlans({});
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-950 p-6 text-zinc-100 flex flex-col gap-6 select-none">
      
      {/* Title block */}
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Solución de Incidencias</h2>
        <p className="text-xs text-zinc-400 mt-1 font-semibold text-amber-500/90 tracking-wide uppercase">
          Bodega 200 NNEO · Entrada Segura de Resoluciones
        </p>
      </div>

      {!unlockedAudit ? (
        // LOCK SCREEN: Prompt for audit resolution code
        <div className="max-w-md mx-auto w-full my-12 bg-zinc-900 border border-zinc-800/80 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle design element */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
          
          <div className="flex flex-col items-center text-center space-y-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <KeyRound className="w-8 h-8" />
            </div>
            
            <div>
              <h3 className="text-lg font-bold text-zinc-100">Desbloquear Resolución</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Ingrese el código de resolución mandatorio generado al finalizar la auditoría para documentar soluciones.
              </p>
            </div>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                CÓDIGO DE RESOLUCIÓN (O CÓDIGO AUDITORÍA)
              </label>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Ejemplo: RES-1002"
                className="w-full bg-zinc-950 border border-zinc-800/90 rounded-xl p-3.5 text-center text-zinc-100 font-mono font-bold text-lg tracking-widest placeholder-zinc-700 outline-none focus:border-amber-500 transition-all uppercase"
                maxLength={20}
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-500 font-semibold text-center uppercase tracking-wide">
                ⚠️ {errorMsg}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 font-extrabold text-black text-xs py-3.5 rounded-xl uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Acceder e Inspeccionar Desviaciones</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </button>
          </form>

          {/* Guide notes for reference */}
          <div className="mt-8 border-t border-zinc-800/80 pt-6">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-500/80 mb-2">
              Códigos de prueba rápidos (Auditorías Iniciales)
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-400 font-medium">
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                <span className="font-bold text-zinc-200">RES-1002</span>
                <p className="text-[9px] text-zinc-500">Rack 5 (80%)</p>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                <span className="font-bold text-zinc-200">RES-1003</span>
                <p className="text-[9px] text-zinc-500">Rack 3 (75%)</p>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                <span className="font-bold text-zinc-200">RES-1004</span>
                <p className="text-[9px] text-zinc-500">Rack 1 (70%)</p>
              </div>
              <div className="bg-zinc-950 p-2 rounded border border-zinc-800/80">
                <span className="font-bold text-zinc-200">RES-1005</span>
                <p className="text-[9px] text-zinc-500">Loza y Muebles (70%)</p>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 mt-3 text-center italic">
              * El sistema genera un código nuevo único al guardar cualquier auditoría nueva.
            </p>
          </div>
        </div>
      ) : (
        // UNLOCKED SCREEN: Active form to resolve incidents
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Metadata summary */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Audit Card */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 relative">
              <div className="absolute top-4 right-4 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded border border-amber-500/20 font-mono text-xs font-bold">
                {unlockedAudit.resolutionCode}
              </div>

              <h3 className="text-zinc-200 font-bold text-sm tracking-wide border-b border-zinc-800 pb-2 uppercase flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-500" />
                Resumen de Inspección
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-500 font-semibold uppercase">ID de Auditoría</span>
                  <span className="text-zinc-200 font-mono font-bold">{unlockedAudit.id}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-500 font-semibold uppercase">Área Evaluada</span>
                  <span className="text-amber-500 font-bold uppercase">{unlockedAudit.area}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-500 font-semibold uppercase">Score Obtenido</span>
                  <span className="text-rose-400 font-extrabold text-sm">{unlockedAudit.score}% Compliance</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-500 font-semibold uppercase">Auditor Creador</span>
                  <span className="text-zinc-300 font-medium">{unlockedAudit.creator.name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-500 font-semibold uppercase">Supervisor Asignado</span>
                  <span className="text-zinc-300 font-medium">{unlockedAudit.assignedTo.name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-zinc-800/50">
                  <span className="text-zinc-500 font-semibold uppercase">Fecha y Hora</span>
                  <span className="text-zinc-300 font-mono">{new Date(unlockedAudit.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs">
                <h4 className="font-bold text-zinc-400 uppercase tracking-wide text-[10px] mb-1">Observaciones Iniciales:</h4>
                <p className="text-zinc-300 italic font-medium">"{unlockedAudit.observations}"</p>
              </div>

              {unlockedAudit.isResolved ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  <div>
                    <span>Esta auditoría ya fue resuelta con anterioridad.</span>
                    <p className="text-[10px] text-zinc-400 font-mono font-medium mt-0.5">Solventada: {new Date(unlockedAudit.resolvedAt || '').toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 flex items-center gap-2 text-amber-400 text-xs font-bold">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>Pendiente de recopilación y cierre de desviaciones detectadas.</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleLock}
                className="w-full bg-zinc-950 border border-zinc-800 hover:border-zinc-700 font-bold py-2 px-3 rounded-lg text-[11px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer uppercase text-center"
              >
                Volver / Cambiar de Código
              </button>
            </div>

          </div>

          {/* Right Column: Resolver / Solutions list */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* List of Incidents / Action Plans */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-zinc-200 font-bold text-sm tracking-wide border-b border-zinc-800 pb-2 uppercase flex items-center gap-2">
                <AlertTriangle className="text-rose-500 w-4 h-4" />
                <span>Desviaciones e Incidencias Detectadas ({unlockedAudit.actionPlans.length})</span>
              </h3>

              {unlockedAudit.actionPlans.length === 0 ? (
                <div className="bg-zinc-950 rounded-xl p-8 text-center border border-zinc-800">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
                  <p className="text-zinc-200 font-bold text-sm">Esta auditoría obtuvo el 100% de cumplimiento inicial.</p>
                  <p className="text-xs text-zinc-500 mt-1">No posee desviaciones registradas por resolver.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {unlockedAudit.actionPlans.map((plan, planIdx) => {
                    const localPlanState = resolvedPlans[plan.id] || { correctiveActionTaken: '', evidencePhoto: '' };
                    
                    return (
                      <div 
                        key={plan.id} 
                        className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4 relative overflow-hidden"
                      >
                        {/* Number Indicator badge */}
                        <div className="absolute top-0 left-0 bg-rose-500/10 text-rose-400 border-r border-b border-zinc-800 px-2.5 py-1 text-[10px] font-mono font-bold">
                          INCIDENCIA #{planIdx + 1}
                        </div>

                        {/* Incident title */}
                        <div className="pt-2">
                          <span className="text-[9px] font-extrabold uppercase bg-rose-500/15 border border-rose-500/25 px-1.5 py-0.5 rounded text-rose-400 font-mono tracking-wider">
                            {plan.sTypeId}
                          </span>
                          <h4 className="text-xs font-bold text-zinc-100 mt-1.5">
                            Criterio: <strong className="text-zinc-300 font-medium">{plan.itemText}</strong>
                          </h4>
                        </div>

                        {/* Failure Detail */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                          <div>
                            <span className="text-[10px] font-semibold text-zinc-500 uppercase">Falla / Hallazgo reportado:</span>
                            <p className="text-zinc-300 text-xs font-semibold mt-1 leading-relaxed">
                              {plan.failureDetail}
                            </p>
                          </div>
                          <div className="flex justify-between items-center">
                            <div>
                              <span className="text-[10px] font-semibold text-zinc-500 uppercase">Asignado a:</span>
                              <p className="text-zinc-300 text-xs font-medium mt-1">{plan.responsible}</p>
                            </div>
                            <div>
                              <span className="text-[10px] font-semibold text-zinc-500 uppercase">Plaza Límite:</span>
                              <p className="text-zinc-400 font-mono text-[11px] font-bold mt-1">{plan.deadline}</p>
                            </div>
                          </div>
                        </div>

                        {/* Resolution Inputs */}
                        <div className="space-y-4 border-t border-zinc-900 pt-4">
                          <h5 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-amber-500" />
                            DOCUMENTACIÓN DE SOLUCIÓN TOMADA
                          </h5>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            
                            {/* Actions text area */}
                            <div className="md:col-span-2 space-y-1">
                              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                                ACCIONES CORRECTIVAS APLICADAS EN SITIO *
                              </label>
                              <textarea
                                value={localPlanState.correctiveActionTaken}
                                onChange={(e) => handlePlanDetailChange(plan.id, e.target.value)}
                                placeholder="Describa explícitamente qué acciones físicas o de orden se ejecutaron para corregir este hallazgo..."
                                rows={2.5}
                                disabled={unlockedAudit.isResolved}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 outline-none focus:border-amber-500 placeholder-zinc-650"
                              />
                            </div>

                            {/* Photo capture block */}
                            <div className="md:col-span-1 flex flex-col justify-between space-y-1">
                              <label className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block">
                                EVIDENCIA DE SOLUCIÓN (FOTO)
                              </label>
                              
                              {localPlanState.evidencePhoto ? (
                                <div className="h-[54px] rounded border border-emerald-500/60 overflow-hidden bg-black flex items-center justify-between px-3">
                                  <div className="flex items-center gap-2">
                                    <img 
                                      src={localPlanState.evidencePhoto} 
                                      alt="Solución" 
                                      className="w-10 h-10 object-cover rounded border border-zinc-800"
                                      referrerPolicy="no-referrer"
                                    />
                                    <span className="text-[10px] text-emerald-400 font-bold uppercase">Listo</span>
                                  </div>
                                  {!unlockedAudit.isResolved && (
                                    <button
                                      type="button"
                                      onClick={() => handleSimulateSolutionPhoto(plan.id)}
                                      className="text-[9px] underline text-zinc-500 hover:text-zinc-300 uppercase font-bold"
                                    >
                                      Cambiar
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleSimulateSolutionPhoto(plan.id)}
                                  disabled={unlockedAudit.isResolved}
                                  className="w-full h-[54px] rounded-lg border border-dashed border-zinc-800 hover:border-amber-500/50 bg-zinc-900/60 flex items-center justify-center gap-1.5 text-zinc-400 hover:text-amber-400 transition-colors text-xs font-semibold cursor-pointer disabled:opacity-50"
                                >
                                  <Camera className="w-4 h-4 shrink-0" />
                                  <span>Cargar Foto</span>
                                </button>
                              )}
                            </div>

                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Global resolution comments box */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm space-y-4">
              <h3 className="text-zinc-200 font-bold text-sm tracking-wide border-b border-zinc-800 pb-2 uppercase flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-500" />
                Resumen de Resolución Global
              </h3>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                  COMENTARIOS RESUMADOS PARA EL ACTA DE CIERRE *
                </label>
                <input
                  type="text"
                  value={generalRecoveryComment}
                  onChange={(e) => setGeneralRecoveryComment(e.target.value)}
                  placeholder="Ej: Se realizaron las limpiezas de racks, rotulaciones y re-acomodos solicitados con apoyo de los supervisores."
                  disabled={unlockedAudit.isResolved}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-200 outline-none focus:border-amber-500 font-sans"
                />
              </div>

              {!unlockedAudit.isResolved && (
                <div className="flex justify-end pt-2 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={handleApplyResolution}
                    className="bg-amber-500 hover:bg-amber-600 outline-none text-black font-extrabold text-sm px-6 py-3 rounded-lg shadow shadow-amber-500/10 cursor-pointer flex items-center gap-1.5 uppercase tracking-wide transition-all"
                  >
                    <ShieldCheck className="w-4 h-4 text-black" />
                    <span>Concluir Solución y Aplicar Cierre</span>
                  </button>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
