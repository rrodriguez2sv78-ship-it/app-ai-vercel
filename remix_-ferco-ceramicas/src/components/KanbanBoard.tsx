/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  MapPin, 
  User as UserIcon, 
  Clock, 
  CheckCircle, 
  AlertOctagon, 
  Search, 
  Filter, 
  FileDown, 
  Send,
  Eye,
  Trash2,
  CheckSquare,
  Square,
  Camera,
  X
} from 'lucide-react';
import { Audit, AuditStage, ActionPlan, User } from '../types';
import jsPDF from 'jspdf';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

interface KanbanBoardProps {
  audits: Audit[];
  setAudits: React.Dispatch<React.SetStateAction<Audit[]>>;
  users: User[];
  currentUser: User;
  onTriggerNotification: (title: string, desc: string, type: 'info' | 'success' | 'warning') => void;
  onNavigateToNewAudit: () => void;
}

export default function KanbanBoard({
  audits,
  setAudits,
  users,
  currentUser,
  onTriggerNotification,
  onNavigateToNewAudit
}: KanbanBoardProps) {
  // States
  const [selectedStage, setSelectedStage] = useState<string>('Todas');
  const [selectedArea, setSelectedArea] = useState<string>('Todas');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Modal tracking
  const [activeAudit, setActiveAudit] = useState<Audit | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Counters
  const counters = useMemo(() => {
    return {
      total: audits.length,
      pendiente: audits.filter(a => a.status === 'Pendiente').length,
      enCurso: audits.filter(a => a.status === 'En curso').length,
      cerrada: audits.filter(a => a.status === 'Cerrada').length,
      atrasada: audits.filter(a => a.status === 'Atrasada').length,
    };
  }, [audits]);

  // Unique Areas list for filtering
  const existingAuditAreas = useMemo(() => {
    const list = Array.from(new Set(audits.map(a => a.area)));
    return list.sort();
  }, [audits]);

  // Filtered audits
  const filteredAudits = useMemo(() => {
    return audits.filter(audit => {
      const matchStage = selectedStage === 'Todas' || audit.status === selectedStage;
      const matchArea = selectedArea === 'Todas' || audit.area === selectedArea;
      const matchSearch = searchQuery.trim() === '' || 
        audit.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audit.area.toLowerCase().includes(searchQuery.toLowerCase()) ||
        audit.assignedTo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (audit.observations && audit.observations.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchStage && matchArea && matchSearch;
    });
  }, [audits, selectedStage, selectedArea, searchQuery]);

  // Top 5 Areas del mes actual
  const topAreasDelMes = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyAudits = audits.filter(a => {
      const d = new Date(a.createdAt);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const areaMap: Record<string, { totalScore: number; count: number }> = {};
    monthlyAudits.forEach(a => {
      if (!areaMap[a.area]) areaMap[a.area] = { totalScore: 0, count: 0 };
      areaMap[a.area].totalScore += a.score;
      areaMap[a.area].count += 1;
    });

    const areaScores = Object.entries(areaMap).map(([area, data]) => {
      const score = Math.round(data.totalScore / data.count);
      return {
        area,
        displayName: score >= 90 ? `🏆 ${area}` : area,
        score
      };
    });

    // Sort by score descending
    areaScores.sort((a, b) => b.score - a.score);

    // Return top 5
    return areaScores.slice(0, 5);
  }, [audits]);

  // Separate into columns for Kanban
  const columnAudits = (stage: AuditStage) => {
    return filteredAudits.filter(a => a.status === stage);
  };

  // Move audit stages
  const handleMoveStage = (auditId: string, newStage: AuditStage) => {
    setAudits(prev => prev.map(a => {
      if (a.id === auditId) {
        const updated = { ...a, status: newStage };
        if (newStage === 'Cerrada') {
          updated.completedAt = new Date().toISOString();
        }
        return updated;
      }
      return a;
    }));
    
    const targetAudit = audits.find(a => a.id === auditId);
    if (targetAudit) {
      onTriggerNotification(
        'Cambio de Etapa',
        `La auditoría de ${targetAudit.area} (#${auditId}) cambió su estado a "${newStage}".`,
        newStage === 'Cerrada' ? 'success' : 'info'
      );
    }
  };

  // Toggle Action Plan state ('Pendiente' <-> 'Resuelto')
  const handleToggleActionPlan = (auditId: string, planId: string) => {
    setAudits(prev => prev.map(a => {
      if (a.id === auditId) {
        const updatedPlans = a.actionPlans.map(p => {
          if (p.id === planId) {
            const nextStatus = p.status === 'Pendiente' ? 'Resuelto' : 'Pendiente';
            return { ...p, status: nextStatus };
          }
          return p;
        });

        // Recalculate score if compliance resolved
        // Every failure item that becomes resolved returns its compliance back to fully successful.
        // Let's compute a new dynamic score!
        const totalItems = a.items.length;
        const totalCompliedOriginal = a.items.filter(item => item.complies === true).length;
        const currentlyResolvedPlans = updatedPlans.filter(p => p.status === 'Resuelto').length;
        
        // Base complied items + resolved additions
        const newScore = Math.min(
          100,
          Math.round(((totalCompliedOriginal + currentlyResolvedPlans) / totalItems) * 100)
        );

        // If score hits 100% and it was not Closed, let's suggest/bump it to Closed stage!
        let newStage = a.status;
        if (newScore === 100 && a.status !== 'Cerrada') {
          newStage = 'Cerrada';
          onTriggerNotification(
            'Auditoría Solucionada',
            `¡Todos los planes de acción para ${a.area} (#${a.id}) fueron resueltos! Auditoría cerrada automáticamente al 100%.`,
            'success'
          );
        }

        return {
          ...a,
          actionPlans: updatedPlans,
          score: newScore,
          status: newStage
        };
      }
      return a;
    }));

    // Update active audit view
    setTimeout(() => {
      setAudits(current => {
        const updated = current.find(a => a.id === auditId);
        if (updated) {
          setActiveAudit(updated);
        }
        return current;
      });
    }, 100);
  };

  // Delete dynamic audit
  const handleDeleteAudit = (id: string) => {
    if (window.confirm(`¿Está seguro de eliminar la auditoría #${id}?`)) {
      setAudits(prev => prev.filter(a => a.id !== id));
      setIsDetailModalOpen(false);
      setActiveAudit(null);
      onTriggerNotification('Auditoría Eliminada', `Se eliminó el registro #${id}.`, 'warning');
    }
  };

  // Push notification alert simulator button
  const handleSimulatePushNotification = (audit: Audit) => {
    onTriggerNotification(
      '⚠️ DESVIACIÓN DETECTADA (Notificación Push)',
      `Notificación enviada a ${audit.assignedTo.name}. Desviación persistente en ${audit.area}: planes de acción vencidos.`,
      'warning'
    );
    alert(`Mensaje de alerta push enviado exitosamente al dispositivo móvil de ${audit.assignedTo.name} (${audit.assignedTo.email})`);
  };

  // Clean formatted date helper
  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  };

  // jsPDF dynamic layout creator
  const handleDownloadPDF = (audit: Audit) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Dark Gold & Black style palette
    // Brand header
    doc.setFillColor(24, 24, 27); // Zinc 900
    doc.rect(0, 0, 210, 42, 'F');
    
    // Gold Banner Accent Top
    doc.setFillColor(217, 119, 6); // Amber 600
    doc.rect(0, 42, 210, 2, 'F');

    // Title Texts
    doc.setTextColor(251, 191, 36); // Amber 400
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Bodega 200 NNEO', 15, 18);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('Cedi Nejapa El Salvador - Operaciones y Control 5S', 15, 25);
    doc.text(`REPORTE DE PLANES DE ACCION Y RESULTADOS - AUDITORIA #${audit.id}`, 15, 31);
    
    // Meta information right-hand side
    doc.setTextColor(251, 191, 36);
    doc.setFontSize(10);
    doc.text(`CUMPLIMIENTO: ${audit.score}%`, 140, 18);
    doc.setTextColor(161, 161, 170);
    doc.text(`Fecha: ${formatDate(audit.createdAt)}`, 140, 25);
    doc.text(`Estado: ${audit.status.toUpperCase()}`, 140, 31);

    // Body content starts
    let y = 55;

    // Subtitle Container
    doc.setTextColor(24, 24, 27);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('1. Datos Administrativos de la Auditoría', 15, y);
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.3);
    doc.line(15, y + 2, 195, y + 2);
    
    y += 10;
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(82, 82, 91);
    
    doc.text(`Área Evaluada:`, 15, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(24, 24, 27);
    doc.text(audit.area, 50, y);
    
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(82, 82, 91);
    doc.text(`Supervisor Responsable:`, 110, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(24, 24, 27);
    doc.text(audit.assignedTo.name, 155, y);

    y += 7;
    
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(82, 82, 91);
    doc.text(`Auditor/Creador:`, 15, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(24, 24, 27);
    doc.text(audit.creator.name, 50, y);
    
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(82, 82, 91);
    doc.text(`Tiempo de Solución Estimado:`, 110, y);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(24, 24, 27);
    doc.text(audit.solutionTime, 155, y);

    y += 7;
    
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(82, 82, 91);
    doc.text(`Observaciones Generales:`, 15, y);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    doc.text(audit.observations || 'Sin observaciones descriptivas registradas.', 50, y, { maxWidth: 145 });

    y += 15;

    // Criteria Evidence & Checklist
    doc.setTextColor(24, 24, 27);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('2. Detalle de Criterios Evaluados (Checklist)', 15, y);
    doc.setDrawColor(217, 119, 6);
    doc.line(15, y + 2, 195, y + 2);
    
    y += 10;
    
    audit.items.forEach((item, index) => {
      // Dynamic item height estimation based on text length + possible photo
      const textH = Math.ceil(doc.getTextDimensions(item.criterionText, { maxWidth: 140 }).h);
      const rowH = item.photo ? textH + 34 : textH + 5;
      
      if (y + rowH > 280) {
        doc.addPage();
        y = 20;
      }
      
      const statusText = item.complies === true ? "CUMPLE" : item.complies === false ? "NO CUMPLE" : "NO APLICÓ";
      const statusColor = item.complies === true ? [16, 185, 129] : item.complies === false ? [239, 68, 68] : [161, 161, 170];
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(24, 24, 27);
      doc.text(`${index + 1}. [${item.sType}] ${item.criterionText}`, 15, y, { maxWidth: 140 });
      
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.text(statusText, 165, y);
      
      y += textH + 2;

      if (item.comment) {
         doc.setFont('Helvetica', 'normal');
         doc.setFontSize(8);
         doc.setTextColor(82, 82, 91);
         doc.text(`Obs: ${item.comment}`, 20, y, { maxWidth: 140 });
         y += Math.ceil(doc.getTextDimensions(`Obs: ${item.comment}`, { maxWidth: 140 }).h) + 2;
      }

      if (item.photo) {
         doc.setFont('Helvetica', 'italic');
         doc.setFontSize(8);
         doc.setTextColor(113, 113, 122);
         doc.text("Evidencia adjunta:", 20, y + 3);
         try {
           doc.addImage(item.photo, 'PNG', 45, y, 40, 30);
           y += 32;
         } catch (e) {
           doc.text("(Error al cargar evidencia fotográfica)", 45, y + 3);
           y += 5;
         }
      }
      
      y += 4;
    });

    y += 10;
    if (y > 260) { doc.addPage(); y = 20; }

    // Failure criteria & corresponding Plans
    doc.setTextColor(24, 24, 27);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('3. Hallazgos y Planes de Acción Correctiva', 15, y);
    doc.line(15, y + 2, 195, y + 2);

    y += 10;

    if (audit.actionPlans.length === 0) {
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(16, 185, 129); // Success Color
      doc.text('¡Excelente! No se generaron desviaciones ni requiere planes correctivos.', 18, y);
    } else {
      audit.actionPlans.forEach((plan, i) => {
        let cardH = 28;
        if (plan.evidencePhoto) {
          cardH = 50;
        }

        if (y + cardH > 280) {
          doc.addPage();
          y = 20;
          doc.setFillColor(24, 24, 27);
          doc.rect(0, 0, 210, 15, 'F');
          doc.setTextColor(251, 191, 36);
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.text(`PLANES DE ACCION CONTINUADOS - Bodega 200 - #${audit.id}`, 15, 10);
          y += 15;
        }

        // Action card structure
        doc.setFillColor(245, 245, 247);
        doc.rect(15, y, 180, cardH, 'F');
        doc.setDrawColor(228, 228, 231);
        doc.rect(15, y, 180, cardH, 'S');

        // Status checkbox indicator colored border
        if (plan.status === 'Resuelto') {
          doc.setFillColor(16, 185, 129); // Green
        } else {
          doc.setFillColor(239, 68, 68); // Red
        }
        doc.rect(15, y, 3, cardH, 'F');

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(24, 24, 27);
        doc.text(`${i + 1}. CRITERIO DESVIADO: ${plan.itemText}`, 22, y + 5);

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(113, 113, 122);
        doc.text(`Desviación hallada:`, 22, y + 11);
        doc.setTextColor(24, 24, 27);
        doc.text(plan.failureDetail, 22, y + 14, { maxWidth: 165 });

        // Metadata on right side of card
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(82, 82, 91);
        doc.text(`Responsable: ${plan.responsible}`, 130, y + 11);
        doc.text(`Límite: ${plan.deadline}`, 130, y + 16);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(plan.status === 'Resuelto' ? 16 : 239, plan.status === 'Resuelto' ? 185 : 68, plan.status === 'Resuelto' ? 129 : 68);
        doc.text(`Estado: ${plan.status.toUpperCase()}`, 130, y + 21);

        doc.setTextColor(113, 113, 122);
        doc.setFont('Helvetica', 'normal');
        doc.text(`ACCIÓN CORRECTIVA MANDATORIA:`, 22, y + 23);
        doc.setTextColor(217, 119, 6);
        doc.setFont('Helvetica', 'bold');
        doc.text(plan.correctiveAction, 22, y + 27, { maxWidth: 100 });

        if (plan.evidencePhoto) {
          try {
            doc.addImage(plan.evidencePhoto, 'PNG', 140, y + 24, 30, 22);
            doc.setFont('Helvetica', 'italic');
            doc.setFontSize(7);
            doc.setTextColor(113, 113, 122);
            doc.text("Evidencia Resolución", 140, y + 23);
          } catch(e) {}
        }

        y += cardH + 5;
      });
    }

    y += 10;
    if (y > 250) {
      doc.addPage();
      y = 30;
    }

    // 5S Signatures section
    doc.setTextColor(24, 24, 27);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Firmas y Control de Entrega', 15, y);
    doc.line(15, y + 2, 195, y + 2);

    y += 25;

    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text('____________________________', 25, y);
    doc.text(`Firma Auditor / Inspector:`, 25, y + 4);
    doc.setFont('Helvetica', 'bold');
    doc.text(audit.creator.name, 25, y + 8);

    doc.setFont('Helvetica', 'normal');
    doc.text('____________________________', 125, y);
    doc.text(`Firma de Recibido (Responsable Área):`, 125, y + 4);
    doc.setFont('Helvetica', 'bold');
    doc.text(audit.assignedTo.name, 125, y + 8);

    // Save
    doc.save(`Reporte-5S-Bodega 200 NNEO-${audit.area.replace(/\s+/g, '-')}-${audit.id}.pdf`);
    onTriggerNotification(
      'Reporte PDF Generado',
      `El reporte de auditoría para ${audit.area} ha sido descargado correctamente como PDF.`,
      'success'
    );
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-950 p-6 text-zinc-100 flex flex-col gap-6 select-none">
      
      {/* Top Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-800 pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Tablero de control 5´S</h2>
          <p className="text-xs text-zinc-400 mt-1 font-semibold text-amber-500/90 tracking-wide uppercase">
            Bodega 200 NNEO
          </p>
        </div>
        <button 
          onClick={onNavigateToNewAudit}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-black px-4 py-2 rounded-lg text-sm font-bold shadow-md shadow-amber-500/10 hover:shadow-amber-500/25 transition-all cursor-pointer border border-amber-400"
        >
          <Plus className="w-4 h-4" />
          Nueva Auditoría
        </button>
      </div>

      {/* Counters Bar corresponding to Screenshot 1 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">TOTAL</span>
          <span className="text-3xl font-black text-zinc-100 mt-1">{counters.total}</span>
          <span className="text-[10px] text-zinc-500 mt-1">Auditorías registradas</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">PENDIENTES</span>
          <span className="text-3xl font-black mt-1 text-purple-400">{counters.pendiente}</span>
          <span className="text-[10px] text-zinc-500 mt-1">Sin iniciar solución</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">EN CURSO</span>
          <span className="text-3xl font-black mt-1 text-amber-400">{counters.enCurso}</span>
          <span className="text-[10px] text-zinc-500 mt-1">En seguimiento</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500 font-sans">CERRADAS</span>
          <span className="text-3xl font-black mt-1 text-emerald-400">{counters.cerrada}</span>
          <span className="text-[10px] text-zinc-400 font-medium mt-1">Completadas</span>
        </div>
        <div className="bg-zinc-900 border border-zinc-900 p-4 rounded-xl shadow-sm flex flex-col justify-between col-span-2 md:col-span-1 ring-1 ring-rose-500/20">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">ATRASADAS</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-3xl font-black text-rose-400">{counters.atrasada}</span>
            <span className="text-xs text-rose-500 font-bold shrink-0">⚠️</span>
          </div>
          <span className="text-[10px] text-rose-400/90 font-semibold mt-1">Requieren atención</span>
        </div>
      </div>

      {/* Top 5 Chart */}
      {topAreasDelMes.length > 0 && (
        <div className="bg-zinc-900/40 p-4 border border-zinc-800 rounded-xl">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4 flex items-center justify-between">
            Top 5 Áreas del Mes (Desempeño)
            <span className="text-[10px] font-medium text-amber-500/80 bg-amber-500/10 px-2 py-0.5 rounded">Promedio Mensual</span>
          </h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topAreasDelMes}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#27272a" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="displayName" type="category" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} width={135} />
                <Tooltip 
                  cursor={{ fill: '#27272a' }}
                  contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px', color: '#f4f4f5', fontSize: '12px' }}
                  itemStyle={{ color: '#fbbf24', fontWeight: 'bold' }}
                  formatter={(value: number) => [`${value}%`, 'Cumplimiento']}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                  <LabelList dataKey="score" position="right" formatter={(value: number) => `${value}%`} fill="#a1a1aa" fontSize={11} fontWeight="bold" />
                  {topAreasDelMes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.score >= 90 ? '#22c55e' : '#fbbf24'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter and search bar matching Screenshot 1 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
        <div className="flex flex-wrap items-center gap-3">
          {/* Stage filter */}
          <div className="flex items-center gap-1 bg-zinc-900 px-2 rounded-lg border border-zinc-800">
            <Filter className="w-3.5 h-3.5 text-amber-500" />
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="bg-transparent text-xs text-zinc-100 outline-none border-none py-1.5 font-medium cursor-pointer"
            >
              <option value="Todas" className="bg-zinc-900">Todas las etapas</option>
              <option value="Pendiente" className="bg-zinc-900">Pendiente</option>
              <option value="En curso" className="bg-zinc-900">En curso</option>
              <option value="Cerrada" className="bg-zinc-900">Cerrada</option>
              <option value="Atrasada" className="bg-zinc-900">Atrasada</option>
            </select>
          </div>

          {/* Area filter */}
          <div className="flex items-center gap-1 bg-zinc-900 px-2 rounded-lg border border-zinc-800">
            <MapPin className="w-3.5 h-3.5 text-amber-500" />
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="bg-transparent text-xs text-zinc-100 outline-none border-none py-1.5 font-medium cursor-pointer"
            >
              <option value="Todas" className="bg-zinc-900">Todas las áreas</option>
              {existingAuditAreas.map(area => (
                <option key={area} value={area} className="bg-zinc-900">{area}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por código, área, responsable..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 text-xs text-zinc-100 pl-9 pr-4 py-2 rounded-lg border border-zinc-800 outline-none focus:border-amber-500 placeholder-zinc-500"
          />
        </div>
      </div>

      {/* Kanban Board Columns structure */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        
        {/* Column 1: Pendiente */}
        <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80 min-h-[400px]">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Pendiente</h3>
            </div>
            <span className="bg-purple-500/10 text-purple-400 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full">
              {columnAudits('Pendiente').length}
            </span>
          </div>
          <div className="space-y-3">
            {columnAudits('Pendiente').length === 0 ? (
              <div className="text-center py-12 text-zinc-600 text-xs font-medium">Sin auditorías</div>
            ) : (
              columnAudits('Pendiente').map(audit => (
                <AuditCard 
                  key={audit.id} 
                  audit={audit} 
                  onOpen={() => { setActiveAudit(audit); setIsDetailModalOpen(true); }}
                  onMove={(st) => handleMoveStage(audit.id, st)}
                  onDelete={(e) => handleDeleteAudit(audit.id)}
                  onDownload={(e) => handleDownloadPDF(audit)}
                  isAdmin={currentUser.role === 'Administrador'}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 2: En curso */}
        <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80 min-h-[400px]">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">En curso</h3>
            </div>
            <span className="bg-amber-500/10 text-amber-400 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full">
              {columnAudits('En curso').length}
            </span>
          </div>
          <div className="space-y-3">
            {columnAudits('En curso').length === 0 ? (
              <div className="text-center py-12 text-zinc-600 text-xs font-medium">Sin auditorías</div>
            ) : (
              columnAudits('En curso').map(audit => (
                <AuditCard 
                  key={audit.id} 
                  audit={audit} 
                  onOpen={() => { setActiveAudit(audit); setIsDetailModalOpen(true); }}
                  onMove={(st) => handleMoveStage(audit.id, st)}
                  onDelete={(e) => handleDeleteAudit(audit.id)}
                  onDownload={(e) => handleDownloadPDF(audit)}
                  isAdmin={currentUser.role === 'Administrador'}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 3: Cerrada */}
        <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80 min-h-[400px]">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Cerrada</h3>
            </div>
            <span className="bg-emerald-500/10 text-emerald-400 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full">
              {columnAudits('Cerrada').length}
            </span>
          </div>
          <div className="space-y-3">
            {columnAudits('Cerrada').length === 0 ? (
              <div className="text-center py-12 text-zinc-600 text-xs font-medium">Sin auditorías</div>
            ) : (
              columnAudits('Cerrada').map(audit => (
                <AuditCard 
                  key={audit.id} 
                  audit={audit} 
                  onOpen={() => { setActiveAudit(audit); setIsDetailModalOpen(true); }}
                  onMove={(st) => handleMoveStage(audit.id, st)}
                  onDelete={(e) => handleDeleteAudit(audit.id)}
                  onDownload={(e) => handleDownloadPDF(audit)}
                  isAdmin={currentUser.role === 'Administrador'}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 4: Atrasada */}
        <div className="bg-zinc-900/60 p-3 rounded-xl border border-zinc-800/80 min-h-[400px]">
          <div className="flex items-center justify-between mb-4 border-b border-zinc-800 pb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-300">Atrasada</h3>
            </div>
            <span className="bg-rose-500/10 text-rose-400 font-mono text-[11px] font-bold px-2 py-0.5 rounded-full">
              {columnAudits('Atrasada').length}
            </span>
          </div>
          <div className="space-y-3">
            {columnAudits('Atrasada').length === 0 ? (
              <div className="text-center py-12 text-zinc-600 text-xs font-medium">Sin auditorías</div>
            ) : (
              columnAudits('Atrasada').map(audit => (
                <AuditCard 
                  key={audit.id} 
                  audit={audit} 
                  onOpen={() => { setActiveAudit(audit); setIsDetailModalOpen(true); }}
                  onMove={(st) => handleMoveStage(audit.id, st)}
                  onDelete={(e) => handleDeleteAudit(audit.id)}
                  onDownload={(e) => handleDownloadPDF(audit)}
                  isAdmin={currentUser.role === 'Administrador'}
                />
              ))
            )}
          </div>
        </div>

      </div>

      {/* Detailed Modal displaying audit list criteria, plans, notifications, jspdf download */}
      {isDetailModalOpen && activeAudit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-950 border border-amber-500/30 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative shadow-black animate-in fade-in-50 zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/95 sticky top-0 rounded-t-xl z-10">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold bg-zinc-800 text-amber-400 px-2 py-0.5 rounded border border-zinc-700">
                    #{activeAudit.id}
                  </span>
                  <h3 className="text-md font-bold text-zinc-100 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-amber-500" />
                    {activeAudit.area}
                  </h3>
                  <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded ${
                    activeAudit.status === 'Cerrada' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    activeAudit.status === 'Atrasada' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse' : 
                    activeAudit.status === 'En curso' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                  }`}>
                    {activeAudit.status}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Creado por <strong>{activeAudit.creator.name}</strong> • Asignado a: <strong>{activeAudit.assignedTo.name}</strong> • Fecha: <strong>{formatDate(activeAudit.createdAt)}</strong>
                </p>
              </div>
              <button 
                onClick={() => { setIsDetailModalOpen(false); setActiveAudit(null); }}
                className="text-zinc-400 hover:text-zinc-100 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scroll content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {/* Score card bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800/80">
                <div className="text-center md:text-left flex flex-col justify-center">
                  <span className="text-xs text-zinc-400 uppercase tracking-wider font-semibold">Resultado de Cumplimiento 5S</span>
                  <div className="flex items-baseline gap-2 mt-1 justify-center md:justify-start">
                    <span className="text-4xl font-extrabold text-amber-400">{activeAudit.score}%</span>
                    <span className="text-xs text-zinc-500">promedio</span>
                  </div>
                </div>

                <div className="flex flex-col justify-center col-span-2">
                  <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5 font-semibold">
                    <span>Avance General del Almacén</span>
                    <span className="text-amber-400">{activeAudit.score}/100</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${activeAudit.score}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Admin Actions buttons (Simulated Notifications & pdf) */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleDownloadPDF(activeAudit)}
                  className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/20 text-amber-400 hover:text-amber-300 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <FileDown className="w-4 h-4" />
                  Descargar Reporte PDF
                </button>
                <button
                  onClick={() => handleSimulatePushNotification(activeAudit)}
                  className="flex items-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-amber-500/20 text-zinc-300 hover:text-white px-4 py-2.5 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                >
                  <Send className="w-4 h-4 text-amber-500" />
                  Enviar Alerta Push Responsable
                </button>

                {/* Move stage selector */}
                <div className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                  <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Cambiar etapa:</span>
                  <select
                    value={activeAudit.status}
                    onChange={(e) => handleMoveStage(activeAudit.id, e.target.value as AuditStage)}
                    className="bg-transparent text-xs text-amber-400 font-bold outline-none border-none py-0.5 cursor-pointer"
                  >
                    <option value="Pendiente" className="bg-zinc-900 text-zinc-200">Pendiente</option>
                    <option value="En curso" className="bg-zinc-900 text-zinc-200">En curso</option>
                    <option value="Cerrada" className="bg-zinc-900 text-zinc-200">Cerrada</option>
                    <option value="Atrasada" className="bg-zinc-900 text-zinc-200">Atrasada</option>
                  </select>
                </div>

                <div className="flex-1" />
                {currentUser.role === 'Administrador' && (
                  <button
                    onClick={() => handleDeleteAudit(activeAudit.id)}
                    className="flex items-center gap-2 bg-rose-950/20 hover:bg-rose-950/50 border border-rose-500/20 text-rose-400 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar Registro
                  </button>
                )}
              </div>

              {/* General Observations */}
              <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800/80 space-y-1">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Observaciones Iniciales</h4>
                <p className="text-xs text-zinc-200 leading-relaxed font-medium">
                  {activeAudit.observations || 'Sin observaciones descriptivas iniciales ingresadas.'}
                </p>
                <div className="grid grid-cols-2 gap-4 pt-3 mt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400">
                  <div>Tiempo límite estimado de resolución: <strong className="text-amber-500">{activeAudit.solutionTime}</strong></div>
                  <div>Finalizado el: <strong className="text-zinc-200">{activeAudit.completedAt ? formatDate(activeAudit.completedAt) : 'Pendiente resolución'}</strong></div>
                </div>
              </div>

              {/* Checklist details & photo attachments */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 mb-3 block">
                  📝 Detalle de Criterios Evaluados (Checklist 5S Empleado)
                </h4>
                
                <div className="space-y-3">
                  {activeAudit.items.map((item, idx) => (
                    <div key={item.id} className="bg-zinc-900 border border-zinc-800/70 p-3.5 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1 select-text">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-sans bg-zinc-800 text-amber-500 px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider">
                            {item.sType}
                          </span>
                          <span className="text-[11px] font-mono text-zinc-500">#{idx + 1}</span>
                        </div>
                        <p className="text-xs font-medium text-zinc-200">{item.criterionText}</p>
                        {item.comment && (
                          <div className="text-[11px] text-zinc-400 bg-zinc-950/50 p-2 rounded border border-zinc-800/30 font-mono">
                            <span className="text-amber-500 font-bold uppercase tracking-wider font-sans text-[9px] mr-1">Comentario:</span> {item.comment}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 shrink-0 justify-between md:justify-end">
                        {/* Photo attachment display if exists */}
                        {item.photo ? (
                          <div className="relative group/photo w-12 h-12 rounded border border-zinc-700 overflow-hidden bg-black flex items-center justify-center">
                            <img 
                              src={item.photo} 
                              alt="Evidencia" 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity">
                              <a href={item.photo} target="_blank" rel="noreferrer" className="text-[9px] font-bold text-amber-400">Ver</a>
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded border border-zinc-800/80 bg-zinc-950 flex flex-col items-center justify-center text-zinc-700" title="Sin fotografía adjunta">
                            <Camera className="w-4 h-4" />
                            <span className="text-[8px] font-bold">No foto</span>
                          </div>
                        )}

                        <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold ${
                          item.complies === true ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          item.complies === false ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                          'bg-zinc-800 text-zinc-500'
                        }`}>
                          {item.complies === true ? '✓ Sí' : item.complies === false ? '✗ No cumple' : 'No evaluado'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action plans tracking and real-time execution */}
              <div className="border-t border-zinc-800/80 pt-5">
                <div className="flex items-center justify-between mb-3.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">
                    🔧 Planes de Acción Correctiva y Seguimiento Operativo
                  </h4>
                  <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full font-bold">
                    {activeAudit.actionPlans.filter(p => p.status === 'Pendiente').length} Pendientes
                  </span>
                </div>

                {activeAudit.actionPlans.length === 0 ? (
                  <div className="bg-emerald-500/5 text-emerald-400 text-xs border border-emerald-500/15 p-4 rounded-xl flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>¡Cumplimiento impecable! No existen desviaciones ni se generaron planes de corrección.</span>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {activeAudit.actionPlans.map((plan) => (
                      <div 
                        key={plan.id}
                        className={`bg-zinc-900 border p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
                          plan.status === 'Resuelto' 
                            ? 'border-emerald-500/20 bg-emerald-500/[0.01]' 
                            : 'border-zinc-800 hover:border-amber-500/15'
                        }`}
                      >
                        <div className="space-y-2 flex-1 select-text">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[9px] font-sans bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-extrabold">
                              {plan.sTypeId}
                            </span>
                            <span className="text-xs font-semibold text-zinc-200">
                              {plan.itemText}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-zinc-950/65 p-3 rounded-lg border border-zinc-900 font-mono text-[11px] leading-relaxed">
                            <div className="space-y-0.5">
                              <span className="text-rose-400 font-bold uppercase tracking-wider font-sans text-[8.5px]">Falla Hallada:</span>
                              <p className="text-zinc-300 font-medium">{plan.failureDetail}</p>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-amber-500 font-bold uppercase tracking-wider font-sans text-[8.5px]">Acción Correctiva Requerida:</span>
                              <p className="text-amber-400/90 font-medium">{plan.correctiveAction}</p>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 text-[10px] text-zinc-400 font-medium pt-1">
                            <div>Responsable: <strong className="text-zinc-200">{plan.responsible}</strong></div>
                            <div>Límite: <strong className="text-amber-500">{plan.deadline}</strong></div>
                          </div>
                        </div>

                        {/* Interactive toggle block */}
                        <div className="flex items-center gap-3 justify-between md:justify-end shrink-0 border-t md:border-none pt-3 md:pt-0 border-zinc-800">
                          <button
                            onClick={() => handleToggleActionPlan(activeAudit.id, plan.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              plan.status === 'Resuelto'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/20'
                                : 'bg-amber-500 hover:bg-amber-600 text-black border border-amber-400 shadow-md shadow-amber-500/5'
                            }`}
                          >
                            {plan.status === 'Resuelto' ? (
                              <>
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                Resuelto (✓)
                              </>
                            ) : (
                              <>
                                <div className="w-4 h-4 border-2 border-black rounded shrink-0 flex items-center justify-center font-bold"></div>
                                Resolver Hallazgo
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Bottom control */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-950 flex justify-end rounded-b-xl sticky bottom-0 z-10">
              <button
                onClick={() => { setIsDetailModalOpen(false); setActiveAudit(null); }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
              >
                Cerrar Panel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

// Sizable standalone Audit card helper inside column
interface AuditCardProps {
  key?: string;
  audit: Audit;
  onOpen: () => void;
  onMove: (st: AuditStage) => void;
  onDelete: (e: React.MouseEvent) => void;
  onDownload: (e: React.MouseEvent) => void;
  isAdmin: boolean;
}

function AuditCard({ audit, onOpen, onMove, onDelete, onDownload, isAdmin }: AuditCardProps) {
  // Determine color status representation
  let strokeColor = 'border-l-4 border-l-purple-500';
  let scoreColor = 'text-purple-400';
  let progressColor = 'bg-purple-500';

  if (audit.status === 'Cerrada') {
    strokeColor = 'border-l-4 border-l-emerald-500';
    scoreColor = 'text-emerald-400';
    progressColor = 'bg-emerald-500';
  } else if (audit.status === 'En curso') {
    strokeColor = 'border-l-4 border-l-amber-500';
    scoreColor = 'text-amber-400';
    progressColor = 'bg-amber-500';
  } else if (audit.status === 'Atrasada') {
    strokeColor = 'border-l-4 border-l-rose-500';
    scoreColor = 'text-rose-400';
    progressColor = 'bg-rose-500';
  }

  // Count active deviation tasks
  const openPlans = audit.actionPlans.filter(p => p.status === 'Pendiente').length;

  return (
    <div 
      onClick={onOpen}
      className={`bg-zinc-900 rounded-lg p-3.5 border border-zinc-800/80 shadow-sm cursor-pointer hover:border-amber-500/25 transition-all group select-none relative ${strokeColor}`}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-mono text-zinc-500 group-hover:text-amber-400 transition-colors">
          #{audit.id}
        </span>
        <div className="flex items-center gap-1.5">
          {audit.status === 'Atrasada' && (
            <span className="text-[8px] uppercase font-serif tracking-tight bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
              ⚡ Tiempo vencido
            </span>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); onDownload(e); }}
            className="flex items-center gap-1.5 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 hover:text-amber-300 px-2.5 py-1.5 rounded-md transition-colors"
            title="Descargar PDF"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">PDF</span>
          </button>
          
          {isAdmin && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(e); }}
              className="text-zinc-500 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
              title="Eliminar Auditoría"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-1 mt-1 mb-2">
        <MapPin className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
        {audit.area}
      </h4>

      <div className="space-y-1 text-[10px] text-zinc-400 font-medium">
        <p>Creado por: <strong className="text-zinc-200">{audit.creator.name}</strong></p>
        <p>Asignado a: <strong className="text-zinc-200">{audit.assignedTo.name}</strong></p>
        {openPlans > 0 && (
          <div className="flex items-center gap-1 text-amber-400 font-semibold mt-1">
            <span>🔧 {openPlans} planes pendientes</span>
          </div>
        )}
      </div>

      {/* Progress display bar */}
      <div className="mt-3.5">
        <div className="flex items-center justify-between text-[9px] text-zinc-400 mb-1 font-semibold">
          <span>Resultado: <strong className={scoreColor}>{audit.score}%</strong></span>
          <span>{new Date(audit.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric' })}</span>
        </div>
        <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-300 ${progressColor}`}
            style={{ width: `${audit.score}%` }}
          />
        </div>
      </div>
      
      {/* Mini CTA visual hover feedback */}
      <div className="mt-3 items-center justify-end flex opacity-0 group-hover:opacity-100 transition-opacity gap-1 text-[10px] font-bold text-amber-400">
        <Eye className="w-3 h-3 text-amber-400" />
        <span>Ver Reporte & Planes</span>
      </div>
    </div>
  );
}
