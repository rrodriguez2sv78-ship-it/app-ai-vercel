/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Camera, 
  MapPin, 
  User as UserIcon, 
  Clock, 
  FileText, 
  AlertTriangle,
  Sparkles,
  RefreshCw,
  FolderPlus
} from 'lucide-react';
import { User, Audit, AuditItem, SStepConfig, ActionPlan } from '../types';
import { generateId } from '../data/defaultData';

const RACK_AREAS = [
  "Rack 1",
  "Rack 2",
  "Rack 3",
  "Rack 4",
  "Rack 5",
  "Rack 6",
  "Piezas Especiales",
  "Grifería"
];

const GRANEL_AREAS = [
  "Pasillo 1",
  "Pasillo 2",
  "Pasillo 3",
  "Pasillo 4",
  "Pasillo 5",
  "Pasillo 6",
  "Loza y Muebles"
];

const isRackArea = (area: string): boolean => {
  return RACK_AREAS.some(ra => ra.toLowerCase() === area.toLowerCase());
};

const isGranelArea = (area: string): boolean => {
  return GRANEL_AREAS.some(ga => ga.toLowerCase() === area.toLowerCase());
};

const getChecklistForArea = (area: string, sStepsConfig: SStepConfig[]): AuditItem[] => {
  if (isRackArea(area)) {
    const rackCriteria = [
      { text: "Producto estibado a granel", sType: "1ª S" as const },
      { text: "Tarimas bien colocadas en ubicaciones de rack", sType: "2ª S" as const },
      { text: "No tarimas dañadas en ubicaciones de rack", sType: "1ª S" as const },
      { text: "No Mas de 2 codigos en una ubicación de Rack", sType: "1ª S" as const },
      { text: "Productos con su respectiva cincha de seguridad", sType: "2ª S" as const },
      { text: "Producto identificado con su respectivo codigo", sType: "2ª S" as const },
      { text: "No producto dañado en posiciones de rack", sType: "1ª S" as const },
      { text: "No fleje o strech film colgando de posiciones de rack", sType: "3ª S" as const },
      { text: "No tarimas con demasiado producto en niveles altos de rack", sType: "4ª S" as const },
      { text: "No producto lleno de polvo ni sucio", sType: "3ª S" as const },
      { text: "No herramientas de trabajo en posiciones de rack", sType: "3ª S" as const }
    ];

    return rackCriteria.map((c, index) => ({
      id: `item-rack-${index}-${Math.random().toString(36).substring(2, 7)}`,
      criterionText: c.text,
      sType: c.sType,
      complies: null,
      comment: '',
      photo: undefined
    }));
  }

  if (isGranelArea(area)) {
    const granelCriteria = [
      { text: "No tarimas de lado", sType: "2ª S" as const },
      { text: "No tarimas quebradas o dañadas", sType: "1ª S" as const },
      { text: "Tarimas con su respectiva identificacion", sType: "2ª S" as const },
      { text: "No estibas de lado", sType: "2ª S" as const },
      { text: "No parciales ni coronas en posiciones de granel", sType: "1ª S" as const },
      { text: "Tarimas ubicadas en su respectiva area", sType: "2ª S" as const },
      { text: "No estibas con mayor capacidad", sType: "4ª S" as const },
      { text: "No producto dañado en tarimas (4 caras)", sType: "1ª S" as const }
    ];

    return granelCriteria.map((c, index) => ({
      id: `item-granel-${index}-${Math.random().toString(36).substring(2, 7)}`,
      criterionText: c.text,
      sType: c.sType,
      complies: null,
      comment: '',
      photo: undefined
    }));
  }

  const list: AuditItem[] = [];
  sStepsConfig.forEach(step => {
    step.criteria.forEach((criterion, index) => {
      list.push({
        id: `item-${step.id}-${index}-${Math.random().toString(36).substring(2, 7)}`,
        criterionText: criterion,
        sType: step.sType,
        complies: null,
        comment: '',
        photo: undefined
      });
    });
  });
  return list;
};

interface AuditFormProps {
  sStepsConfig: SStepConfig[];
  users: User[];
  currentUser: User;
  areas: string[];
  onAuditCreated: (newAudit: Audit) => void;
  onTriggerNotification: (title: string, desc: string, type: 'info' | 'success' | 'warning') => void;
}

export default function AuditForm({
  sStepsConfig,
  users,
  currentUser,
  areas,
  onAuditCreated,
  onTriggerNotification
}: AuditFormProps) {
  // Constants for solution times
  const solutionTimes = ["24 horas", "48 horas", "72 horas", "96 horas", "Inmediato"];

  // Core administrative states
  const [selectedArea, setSelectedArea] = useState<string>(areas[0] || "Rack 1");
  const [solutionTime, setSolutionTime] = useState<string>("48 horas");
  const [assignedToId, setAssignedToId] = useState<string>(
    users.find(u => u.role === 'Supervisor')?.id || users[0].id
  );
  const [observations, setObservations] = useState<string>('');

  // S Checklist items state - initialized dynamically based on selected area
  const [checklist, setChecklist] = useState<AuditItem[]>(() => {
    return getChecklistForArea(areas[0] || "Rack 1", sStepsConfig);
  });

  React.useEffect(() => {
    setChecklist(getChecklistForArea(selectedArea, sStepsConfig));
  }, [selectedArea, sStepsConfig]);

  // Quick criteria add in-form state (as user requested "los criterios se han editables que se puedan quitar y agregar mas criterios")
  const [newCriterionText, setNewCriterionText] = useState<string>('');
  const [newCriterionS, setNewCriterionS] = useState<'1ª S' | '2ª S' | '3ª S' | '4ª S' | '5ª S'>('1ª S');

  // Triggering snapshot simulator ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [cameraActiveItem, setCameraActiveItem] = useState<string | null>(null);

  const [createdAuditCode, setCreatedAuditCode] = useState<string | null>(null);
  const [pendingAudit, setPendingAudit] = useState<Audit | null>(null);

  // Handle local criterion removal directly on this transient audit checklist
  const handleRemoveItem = (itemId: string) => {
    setChecklist(prev => prev.filter(item => item.id !== itemId));
    onTriggerNotification('Criterio Quitado', 'Se removió un criterio temporalmente de esta evaluación.', 'info');
  };

  // Handle local criterion insertion for this audit checklist
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCriterionText.trim()) return;

    const newItem: AuditItem = {
      id: 'item-new-' + Math.random().toString(36).substring(2, 9),
      criterionText: newCriterionText.trim(),
      sType: newCriterionS,
      complies: null,
      comment: '',
      photo: undefined
    };

    setChecklist(prev => [...prev, newItem]);
    setNewCriterionText('');
    onTriggerNotification('Criterio Agregado', `Se añadió la pregunta a la sección ${newCriterionS}.`, 'success');
  };

  // Toggle compliance button
  const handleSetCompliance = (itemId: string, status: boolean) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, complies: status };
      }
      return item;
    }));
  };

  // Handle commentary update
  const handleCommentChange = (itemId: string, commentVal: string) => {
    setChecklist(prev => prev.map(item => {
      if (item.id === itemId) {
        return { ...item, comment: commentVal };
      }
      return item;
    }));
  };

  // Handle photo file selection and convert to Base64 thumbnail safely
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      setChecklist(prev => prev.map(item => {
        if (item.id === itemId) {
          return { ...item, photo: base64Data };
        }
        return item;
      }));
    };
    reader.readAsDataURL(file);
  };

  // Simulate a high-fidelity photographic capture block
  const handleSimulateSnapshot = (itemId: string) => {
    // Elegant system visual template snapshots corresponding to industrial warehouse settings
    const simulatedPhotos = [
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=200&auto=format&fit=crop", // pallets rack
      "https://images.unsplash.com/photo-1598413944621-e737cc57eef1?q=80&w=200&auto=format&fit=crop", // tidy boxes
      "https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=200&auto=format&fit=crop", // forklift line
      "https://images.unsplash.com/photo-1513828742140-ccaa34f37588?q=80&w=200&auto=format&fit=crop"  // yellow tape lane
    ];
    const pickedPhoto = simulatedPhotos[Math.floor(Math.random() * simulatedPhotos.length)];

    setChecklist(prev => prev.map(itm => {
      if (itm.id === itemId) {
        return { ...itm, photo: pickedPhoto };
      }
      return itm;
    }));
    
    onTriggerNotification('Fotografía Capturada', 'Se adjuntó la evidencia fotográfica satisfactoriamente.', 'success');
  };

  const handleSaveAudit = () => {
    // Validate if any is unanswered
    const unanswered = checklist.filter(itm => itm.complies === null);
    if (unanswered.length > 0) {
      alert(`Por favor evalúe todos los criterios (${unanswered.length} pendientes). Cada criterio debe marcarse con "Sí" o "No".`);
      onTriggerNotification(
        'Evaluación Pendiente',
        'Existen criterios sin responder en la lista de auditoria.',
        'warning'
      );
      return;
    }

    // Validate that all "No" items have both photo and comment
    const incompleteNoItems = checklist.filter(itm =>
      itm.complies === false && (!itm.comment.trim() || !itm.photo)
    );
    if (incompleteNoItems.length > 0) {
      alert(`Para cada respuesta calificada como "No", es estrictamente obligatorio tomar o subir una foto de evidencia y detallar el comentario con la desviación observada.`);
      onTriggerNotification(
        'Evidencia Requerida',
        'Faltan comentarios o fotos obligatorias para respuestas calificadas como "No".',
        'warning'
      );
      return;
    }

    // Process checklist to calculate score and raise action plans
    const updatedChecklist = [...checklist];

    const compliesCount = updatedChecklist.filter(it => it.complies === true).length;
    const totalCount = updatedChecklist.length;
    const score = totalCount > 0 ? Math.round((compliesCount / totalCount) * 100) : 100;

    const assignedUser = users.find(u => u.id === assignedToId) || users[0];

    // Build corrective action plans for failing criteria
    const raisedActionPlans: ActionPlan[] = [];
    updatedChecklist.forEach(item => {
      if (item.complies === false) {
        // Build interactive failure descriptive plan
        let defaultCorrectiveAction = '';
        if (item.sType === '1ª S') {
          defaultCorrectiveAction = 'Retirar y segregar del rack los ítems innecesarios, reacomodar stock.';
        } else if (item.sType === '2ª S') {
          defaultCorrectiveAction = 'Retirar cintas residuales, rotular y demarcar la posición con pintura/etiquetas.';
        } else if (item.sType === '3ª S') {
          defaultCorrectiveAction = 'Limpiar viga con paño húmedo y erradicar astillas del pasillo inmediatamente.';
        } else if (item.sType === '4ª S') {
          defaultCorrectiveAction = 'Alinear canastas o estibas a la línea limitadora y auditar cabeceras.';
        } else {
          defaultCorrectiveAction = 'Conversar con el operador del sector solicitando apego estricto al uso de EPP.';
        }

        raisedActionPlans.push({
          id: 'plan-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
          itemText: item.criterionText,
          sTypeId: item.sType,
          failureDetail: item.comment || 'Se determinó desviación técnica en auditoría 5S presencial.',
          correctiveAction: defaultCorrectiveAction,
          responsible: assignedUser.name,
          deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 48 hours out
          status: 'Pendiente'
        });
      }
    });

    const resCode = 'RES-' + Math.floor(1000 + Math.random() * 9000);

    // Create the final audit object
    const newAudit: Audit = {
      id: 'AUD-' + generateId(),
      area: selectedArea,
      status: score === 100 ? 'Cerrada' : 'Atrasada', // If 100% can start Closed, else Atrasada due to action plan pending!
      createdAt: new Date().toISOString(),
      score,
      creator: currentUser,
      assignedTo: assignedUser,
      observations: observations.trim() || 'Auditoría presencial estándar del CEDI.',
      solutionTime,
      items: updatedChecklist,
      actionPlans: raisedActionPlans,
      resolutionCode: resCode
    };

    setCreatedAuditCode(resCode);
    setPendingAudit(newAudit);
    
    // Trigger push notification simulation
    if (raisedActionPlans.length > 0) {
      onTriggerNotification(
        '⚠️ Alerta de Desviación 5S',
        `Se detectó ${score}% compliance en ${selectedArea}. ${assignedUser.name} recibió ${raisedActionPlans.length} planes correctivos. Código de Resolución: ${resCode}`,
        'warning'
      );
    } else {
      onTriggerNotification(
        '🎉 Cumplimiento Excelente (100%)',
        `Zona ${selectedArea} ha sido calificada con 100% compliance por ${currentUser.name}. Código de Resolución: ${resCode}`,
        'success'
      );
    }
  };

  if (createdAuditCode && pendingAudit) {
    return (
      <div className="flex-1 overflow-y-auto bg-neutral-950 p-6 text-zinc-100 flex flex-col items-center justify-center select-none my-10">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-850 rounded-2xl p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
          {/* Decorative radial lighting */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl animate-pulse" />
          
          <div className="flex flex-col items-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <div>
              <h3 className="text-xl font-extrabold text-zinc-100 tracking-tight">¡Auditoría Registrada con Éxito!</h3>
              <p className="text-xs text-zinc-400 mt-1 uppercase font-semibold text-amber-500">
                Bodega 200 NNEO
              </p>
            </div>
          </div>

          {/* Large display box of Resolution Code */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 block">
              CÓDIGO DE RESOLUCIÓN MANDATORIO
            </span>
            <div className="text-2xl font-mono font-black text-amber-400 bg-zinc-900 border border-zinc-800 rounded py-2.5 tracking-widest select-text">
              {createdAuditCode}
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              Conserve este código. Será estrictamente necesario para registrar soluciones e incidencias registradas en la zona de <strong className="text-zinc-200">{pendingAudit.area}</strong>.
            </p>
          </div>

          {/* Audit Metrics summary inside Success card */}
          <div className="grid grid-cols-3 gap-2 text-center bg-zinc-950/60 p-3 rounded-lg border border-zinc-800 text-xs">
            <div>
              <span className="text-[9px] text-zinc-500 uppercase font-semibold font-mono">PUNTUALIDAD</span>
              <p className="font-bold text-zinc-300 mt-0.5">{pendingAudit.score}%</p>
            </div>
            <div>
              <span className="text-[9px] text-zinc-500 uppercase font-semibold font-mono">INCIDENCIAS</span>
              <p className="font-bold text-rose-400 mt-0.5">{pendingAudit.actionPlans.length}</p>
            </div>
            <div>
              <span className="text-[9px] text-zinc-500 uppercase font-semibold font-mono">KPI TIEMPO</span>
              <p className="font-bold text-zinc-300 mt-0.5">{pendingAudit.solutionTime}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(createdAuditCode);
                alert('¡Código de resolución copiado al portapapeles!');
              }}
              className="w-full bg-zinc-950 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 font-bold text-zinc-300 text-xs py-3 rounded-xl transition-all cursor-pointer"
            >
              Copiar Código de Resolución
            </button>
            <button
              onClick={() => {
                onAuditCreated(pendingAudit);
              }}
              className="w-full bg-amber-500 hover:bg-amber-600 font-black text-black text-xs py-3 rounded-xl transition-all shadow-md cursor-pointer uppercase tracking-wider"
            >
              Completar e Ir al Tablero Kanban
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-950 p-6 text-zinc-100 flex flex-col gap-6 select-none">
      
      {/* Title block */}
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Nueva Auditoría 5S</h2>
        <p className="text-xs text-zinc-400 mt-1 font-semibold text-amber-500/90 tracking-wide uppercase">
          Bodega 200 NNEO — Sistema de Auditorías 5S
        </p>
      </div>

      {/* Primary Card form containing meta filters */}
      <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 shadow-sm space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-widest text-amber-500 mb-2 flex items-center gap-1.5 border-b border-zinc-800 pb-2">
          <FolderPlus className="w-4 h-4 text-amber-500" />
          1. Parámetros del Área y Asignaciones
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Area Evaluada */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-500" />
              ÁREA A EVALUAR / AUDITAR
            </label>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="w-full bg-zinc-950 text-xs text-zinc-200 border border-zinc-800 rounded-lg p-3 outline-none focus:border-amber-500 font-medium cursor-pointer"
            >
              {areas.map(areaName => (
                <option key={areaName} value={areaName} className="bg-zinc-900 text-zinc-200">{areaName}</option>
              ))}
            </select>
          </div>

          {/* Tiempo Solucion */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              TIEMPO ESTIMADO DE SOLUCIÓN (KPI)
            </label>
            <select
              value={solutionTime}
              onChange={(e) => setSolutionTime(e.target.value)}
              className="w-full bg-zinc-950 text-xs text-zinc-200 border border-zinc-800 rounded-lg p-3 outline-none focus:border-amber-500 font-medium cursor-pointer"
            >
              {solutionTimes.map(timeStr => (
                <option key={timeStr} value={timeStr} className="bg-zinc-900 text-zinc-200">{timeStr}</option>
              ))}
            </select>
          </div>

          {/* Asignado A */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <UserIcon className="w-3.5 h-3.5 text-amber-500" />
              SUPERVISOR RESPONSABLE DE ÁREA
            </label>
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full bg-zinc-950 text-xs text-zinc-200 border border-zinc-800 rounded-lg p-3 outline-none focus:border-amber-500 font-medium cursor-pointer"
            >
              {users.map(u => (
                <option key={u.id} value={u.id} className="bg-zinc-900 text-zinc-200">
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Observaciones generales */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              OBSERVACIONES GENERALES INICIALES
            </label>
            <input
              type="text"
              placeholder="Escribe observaciones o contexto adicional de la inspección..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full bg-zinc-950 text-xs text-zinc-200 border border-zinc-800 rounded-lg p-3 outline-none focus:border-amber-500 font-medium"
            />
          </div>

        </div>
      </div>

      {/* Quick Add Criterion section in-place */}
      <form onSubmit={handleAddItem} className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row items-end gap-3 shadow-inner">
        <div className="flex-1 space-y-1 w-full">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            ➕ Agregar / Modificar Criterio Temporalmente Para Esta Auditoría
          </label>
          <input
            type="text"
            placeholder="Ej. Limpieza en la parte superior de luminarias..."
            value={newCriterionText}
            onChange={(e) => setNewCriterionText(e.target.value)}
            className="w-full bg-zinc-950 text-xs text-zinc-200 border border-zinc-800 rounded-lg p-2.5 outline-none focus:border-amber-500 font-medium"
          />
        </div>
        <div className="w-full sm:w-40 space-y-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Pertenencia S</label>
          <select
            value={newCriterionS}
            onChange={(e) => setNewCriterionS(e.target.value as any)}
            className="w-full bg-zinc-950 text-xs text-zinc-200 border border-zinc-800 rounded-lg p-2.5 outline-none focus:border-amber-500 font-medium"
          >
            <option value="1ª S">1ª S - Seiri</option>
            <option value="2ª S">2ª S - Seiton</option>
            <option value="3ª S">3ª S - Seiso</option>
            <option value="4ª S">4ª S - Seiketsu</option>
            <option value="5ª S">5ª S - Shitsuke</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-zinc-800 hover:bg-zinc-700 text-amber-400 text-xs font-bold px-4 py-3 rounded-lg border border-zinc-700 h-[38px] w-full sm:w-auto shrink-0 transition-all flex items-center justify-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Añadir Criterio
        </button>
      </form>

      {/* Main S checklists lists */}
      <div className="space-y-6">
        {['1ª S', '2ª S', '3ª S', '4ª S', '5ª S'].map((sType) => {
          const sItems = checklist.filter(item => item.sType === sType);
          if (sItems.length === 0) return null;
          
          const sTitle = sStepsConfig.find(st => st.sType === sType)?.title || 'Parámetro 5S';

          return (
            <div key={sType} className="bg-zinc-900 border border-zinc-800/60 rounded-xl overflow-hidden shadow-sm">
              {/* S Header in Compliance Black & Gold look */}
              <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500 font-mono">
                    {sType}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-100">{sTitle}</h3>
                </div>
                <span className="text-xs text-zinc-500 font-mono font-semibold">
                  {sItems.length} preguntas en sección
                </span>
              </div>

              {/* Items row list */}
              <div className="divide-y divide-zinc-800">
                {sItems.length === 0 ? (
                  <div className="p-6 text-center text-zinc-600 text-xs">No hay criterios en esta etapa.</div>
                ) : (
                  sItems.map((item, idx) => (
                    <div key={item.id} className="p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-zinc-900 hover:bg-zinc-900/40 transition-colors">
                      
                      {/* Name criterion */}
                      <div className="flex-1 space-y-1 relative pr-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono text-zinc-500">#{idx + 1}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-zinc-600 hover:text-rose-400 p-0.5 rounded transition-colors"
                            title="Quitar este criterio para esta auditoría"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-xs text-zinc-100 font-medium leading-relaxed">{item.criterionText}</p>
                      </div>

                      {/* Controls (Toggle, comment detail input and capture photo) */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 w-full lg:w-auto pb-2 lg:pb-0">
                        
                        {/* comment log */}
                        <div className="flex-1 sm:w-48 relative">
                          <input
                            type="text"
                            placeholder={item.complies === false ? "Detalle obligatorio *" : "Detalle o desviación..."}
                            value={item.comment}
                            onChange={(e) => handleCommentChange(item.id, e.target.value)}
                            className={`w-full bg-zinc-950 text-[11px] text-zinc-200 border rounded p-2 outline-none font-sans transition-all ${
                              item.complies === false && !item.comment.trim()
                                ? 'border-rose-500 placeholder-rose-500/70 focus:border-rose-400 font-semibold shadow-sm shadow-rose-500/10'
                                : 'border-zinc-800 focus:border-amber-500'
                            }`}
                          />
                          {item.complies === false && !item.comment.trim() && (
                            <span className="absolute -bottom-3.5 left-1 text-[8px] text-rose-500 font-bold uppercase tracking-wider">
                              Requiere Detalle *
                            </span>
                          )}
                        </div>

                        {/* file capture / simulator photo evidence */}
                        <div className="flex items-center gap-2 shrink-0 relative">
                          {item.photo ? (
                            <div className="relative group w-10 h-10 rounded border border-emerald-500 overflow-hidden bg-black flex items-center justify-center">
                              <img src={item.photo} alt="Evidencia" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              <button
                                type="button"
                                onClick={() => {
                                  setChecklist(prev => prev.map(it => it.id === item.id ? { ...it, photo: undefined } : it));
                                }}
                                className="absolute inset-0 bg-rose-950/80 text-[8px] font-bold text-rose-300 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                              >
                                Quitar
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1.5 items-center">
                              {/* Simulated camera capture button */}
                              <button
                                type="button"
                                onClick={() => handleSimulateSnapshot(item.id)}
                                className={`p-2 rounded bg-zinc-950 border transition-colors ${
                                  item.complies === false
                                    ? 'border-rose-500/60 text-rose-400 hover:text-rose-300 hover:bg-zinc-900 shadow-sm shadow-rose-500/10'
                                    : 'border-zinc-800 text-amber-500 hover:text-amber-400 hover:bg-zinc-900'
                                }`}
                                title="Hacer Captura Fotográfica (Obligatoria si elige No)"
                              >
                                <Camera className="w-4 h-4" />
                              </button>
                              
                              {/* Real local file picker hidden */}
                              <label className={`p-2 rounded bg-zinc-950 border cursor-pointer transition-colors text-xs font-semibold flex items-center ${
                                item.complies === false
                                  ? 'border-rose-500/60 text-rose-400 hover:text-rose-300 hover:bg-zinc-900'
                                  : 'border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                              }`}>
                                <Plus className="w-3.5 h-3.5" />
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => handlePhotoUpload(e, item.id)}
                                />
                              </label>

                              {item.complies === false && (
                                <span className="text-[9px] text-rose-500 font-bold uppercase tracking-wide animate-pulse">
                                  Foto *
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* ¿Cumple? checklist togglers */}
                        <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800/80">
                          <button
                            type="button"
                            onClick={() => handleSetCompliance(item.id, true)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              item.complies === true
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            ✓ Sí
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSetCompliance(item.id, false)}
                            className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                              item.complies === false
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                          >
                            ✗ No
                          </button>
                        </div>

                      </div>

                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Submit registration bar */}
      <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-zinc-400 font-medium">
          Al guardar esta auditoría, el sistema evaluará automáticamente las desviaciones ("No Cumple") y generará las órdenes mandatorias del plan de acción para el supervisor respectivo.
        </p>
        <button
          onClick={handleSaveAudit}
          className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black font-extrabold text-sm px-6 py-3 rounded-lg border border-amber-400 cursor-pointer shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 transition-all text-center w-full sm:w-auto shrink-0"
        >
          Guardar y Registrar Auditoría
        </button>
      </div>

    </div>
  );
}
