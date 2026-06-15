/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Save, Plus, Trash2, X, AlertCircle, RefreshCw, HelpCircle } from 'lucide-react';
import { SStepConfig } from '../types';
import ThemeSettings from './ThemeSettings';

interface ConfigFormProps {
  sStepsConfig: SStepConfig[];
  setSStepsConfig: React.Dispatch<React.SetStateAction<SStepConfig[]>>;
  onTriggerNotification: (title: string, desc: string, type: 'info' | 'success' | 'warning') => void;
}

export default function ConfigForm({
  sStepsConfig,
  setSStepsConfig,
  onTriggerNotification
}: ConfigFormProps) {
  // Local state to host modified steps to avoid real-time form lag
  const [localSteps, setLocalSteps] = useState<SStepConfig[]>([...sStepsConfig]);

  // Handle entire S Step classification edit
  const handleSLabelChange = (stepId: string, textVal: string) => {
    setLocalSteps(prev => prev.map(s => {
      if (s.id === stepId) {
        return { ...s, title: textVal };
      }
      return s;
    }));
  };

  // Modify individual criteria text row
  const handleQueryChange = (stepId: string, queryIdx: number, textVal: string) => {
    setLocalSteps(prev => prev.map(s => {
      if (s.id === stepId) {
        const updatedCriteria = [...s.criteria];
        updatedCriteria[queryIdx] = textVal;
        return { ...s, criteria: updatedCriteria };
      }
      return s;
    }));
  };

  // Delete individual criteria row
  const handleDeleteQuery = (stepId: string, queryIdx: number) => {
    setLocalSteps(prev => prev.map(s => {
      if (s.id === stepId) {
        const updatedCriteria = s.criteria.filter((_, idx) => idx !== queryIdx);
        return { ...s, criteria: updatedCriteria };
      }
      return s;
    }));
    onTriggerNotification('Criterio Removido', 'Se eliminó la pregunta de la configuración.', 'warning');
  };

  // Append new empty criterion row
  const handleInsertQuery = (stepId: string) => {
    setLocalSteps(prev => prev.map(s => {
      if (s.id === stepId) {
        return { ...s, criteria: [...s.criteria, ''] }; // empty placeholder for input
      }
      return s;
    }));
  };

  // Append new entire S Step
  const handleCreateStepClass = () => {
    // Determine suffix
    const currentCount = localSteps.length + 1;
    const newStep: SStepConfig = {
      id: 's-custom-' + Math.random().toString(36).substring(2, 9),
      sType: `${currentCount}ª S` as any,
      title: 'Nuevo Parámetro de Verificación',
      criteria: ['Criterio o estándar inicial']
    };

    setLocalSteps(prev => [...prev, newStep]);
    onTriggerNotification('Nueva S Añadida', 'Se insertó una nueva categoría al final.', 'success');
  };

  // Delete entire S Step
  const handleDeleteStepClass = (stepId: string, sLabel: string) => {
    if (window.confirm(`¿Está seguro de eliminar toda la sección "${sLabel}" de la configuración? Esto eliminará todos sus criterios.`)) {
      setLocalSteps(prev => prev.filter(s => s.id !== stepId));
      onTriggerNotification('Sección Eliminada', `Se removió la categoría ${sLabel} por completo.`, 'warning');
    }
  };

  // Save changes back to key application global criteria
  const handleCommitSettings = () => {
    // Validate empty lines
    const sanitized = localSteps.map(step => ({
      ...step,
      criteria: step.criteria.map(line => line.trim()).filter(line => line.length > 0)
    })).filter(step => step.title.trim().length > 0);

    setSStepsConfig(sanitized);
    onTriggerNotification(
      'Configuración Salvada',
      'El constructor de formularios actualizó las preguntas globales en tiempo real.',
      'success'
    );
    alert('La plantilla de la Auditoría 5S ha sido actualizada y guardada con éxito.');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-950 p-6 text-zinc-100 flex flex-col gap-6 select-none">
      
      {/* Header block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Configuración de Plantilla</h2>
          <p className="text-xs text-zinc-400 mt-1 font-semibold text-amber-500/90 tracking-wide uppercase">
            Bodega 200 NNEO — Sistema de Auditorías 5S
          </p>
        </div>
      </div>

      {/* Builder Card containing active S categories */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 shadow-md flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-3">
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-zinc-200">
              Constructor de Formulario 5S
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">Defina las rúbricas y criterios que los auditores evaluarán en campo.</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateStepClass}
              className="bg-zinc-950 hover:bg-zinc-800 text-zinc-300 font-bold text-xs px-3.5 py-2.5 rounded-lg border border-zinc-800 transition-colors cursor-pointer"
            >
              + Nueva S
            </button>
            <button
              onClick={handleCommitSettings}
              className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black font-extrabold text-xs px-4 py-2.5 rounded-lg border border-amber-400 transition-all cursor-pointer shadow-md shadow-amber-500/5 flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              Guardar Configuración
            </button>
          </div>
        </div>

        {/* Categories checklist editor */}
        <div className="space-y-6 mt-2">
          {localSteps.map((step) => (
            <div key={step.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4 shadow-inner relative group">
              
              {/* Card S Category Header block matching Screenshot 5 */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-zinc-900 pb-3 justify-between">
                <div className="flex items-center gap-2.5 flex-1">
                  <span className="bg-zinc-900 text-amber-500 px-3 py-1.5 rounded-md font-extrabold text-xs uppercase border border-zinc-800 font-mono">
                    {step.sType}
                  </span>
                  
                  {/* Category description text input */}
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) => handleSLabelChange(step.id, e.target.value)}
                    className="bg-transparent text-sm font-bold text-zinc-100 outline-none border-b border-transparent focus:border-amber-500/50 py-1 flex-1 pb-1 transition-all"
                    placeholder="Ej. Separar y eliminar innecesarios"
                  />
                </div>

                <button
                  onClick={() => handleDeleteStepClass(step.id, step.sType)}
                  className="bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-500/10 p-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0"
                  title="Eliminar este escalón 5S completo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Questions rows inside */}
              <div className="space-y-2.5 pl-2 sm:pl-6">
                {step.criteria.map((criterion, queryIdx) => (
                  <div key={queryIdx} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-zinc-600 w-6 text-right shrink-0">{queryIdx + 1}.</span>
                    
                    {/* Editable prompt */}
                    <input
                      type="text"
                      value={criterion}
                      onChange={(e) => handleQueryChange(step.id, queryIdx, e.target.value)}
                      className="bg-zinc-900 text-xs text-zinc-200 border border-zinc-950 rounded-lg p-2.5 outline-none focus:border-amber-500/50 flex-1 font-medium"
                      placeholder="Ej. Tarimas alineadas al pasillo..."
                    />

                    {/* Delete item button */}
                    <button
                      onClick={() => handleDeleteQuery(step.id, queryIdx)}
                      className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 text-zinc-500 hover:text-zinc-100 w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0"
                      title="Eliminar criterio"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add question inside this category box */}
              <div className="pt-2 pl-2 sm:pl-6 text-left">
                <button
                  type="button"
                  onClick={() => handleInsertQuery(step.id)}
                  className="bg-zinc-90 w-full sm:w-auto hover:bg-zinc-900 text-amber-500 text-[11px] font-bold px-3.5 py-1.5 rounded-lg border border-zinc-900 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Criterio / Pregunta
                </button>
              </div>

            </div>
          ))}
        </div>

        {/* Action Commit button */}
        <div className="border-t border-zinc-800/80 pt-4 flex justify-end">
          <button
            onClick={handleCommitSettings}
            className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black font-extrabold text-sm px-6 py-3 rounded-lg border border-amber-400 cursor-pointer shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 transition-all text-center w-full sm:w-auto shrink-0 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            Guardar Plantilla de Formulario
          </button>
        </div>
      </div>

      <ThemeSettings />

    </div>
  );
}
