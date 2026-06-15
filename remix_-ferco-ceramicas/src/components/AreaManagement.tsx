import React, { useState } from 'react';
import { Map, Plus, Trash2, Edit2, Check, X } from 'lucide-react';

interface AreaManagementProps {
  areas: string[];
  setAreas: React.Dispatch<React.SetStateAction<string[]>>;
  onTriggerNotification: (title: string, desc: string, type: 'info' | 'success' | 'warning') => void;
}

export default function AreaManagement({ areas, setAreas, onTriggerNotification }: AreaManagementProps) {
  const [newAreaContent, setNewAreaContent] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const handleAddArea = () => {
    if (!newAreaContent.trim()) return;
    if (areas.includes(newAreaContent.trim())) {
      onTriggerNotification('Error', 'El área ya existe.', 'warning');
      return;
    }
    setAreas([...areas, newAreaContent.trim()]);
    setNewAreaContent('');
    onTriggerNotification('Área Agregada', `El área ${newAreaContent.trim()} ha sido agregada.`, 'success');
  };

  const handleDeleteArea = (index: number) => {
    const areaToDelete = areas[index];
    if (window.confirm(`¿Está seguro de eliminar el área ${areaToDelete}?`)) {
      setAreas(areas.filter((_, i) => i !== index));
      onTriggerNotification('Área Eliminada', `El área ${areaToDelete} ha sido eliminada.`, 'success');
    }
  };

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditingContent(areas[index]);
  };

  const handleSaveEdit = (index: number) => {
    if (!editingContent.trim()) return;
    if (areas.some((a, i) => i !== index && a === editingContent.trim())) {
      onTriggerNotification('Error', 'El área ya existe.', 'warning');
      return;
    }
    const updatedAreas = [...areas];
    updatedAreas[index] = editingContent.trim();
    setAreas(updatedAreas);
    setEditingIndex(null);
    onTriggerNotification('Área Actualizada', 'El nombre del área se modificó correctamente.', 'success');
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setEditingContent('');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-neutral-950 p-6 text-zinc-100 flex flex-col gap-6 select-none">
      <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
        <header className="border-b border-zinc-800 pb-4">
          <h2 className="text-xl font-bold flex items-center gap-2 text-zinc-100">
            <Map className="w-5 h-5 text-amber-500" />
            Zonas y Áreas de Auditoría
          </h2>
          <p className="text-xs text-zinc-400 mt-1 font-semibold text-amber-500/90 tracking-wide uppercase">
            Sistema de Auditorías 5S
          </p>
        </header>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md flex flex-col gap-6">
          <h3 className="text-sm font-bold border-b border-zinc-800 pb-2 mb-2 text-zinc-200">
            Agregar Nueva Área
          </h3>
          <div className="flex gap-3">
            <input 
              type="text"
              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all font-medium placeholder-zinc-600"
              placeholder="Ej. Pasillo 4, Rack 10"
              value={newAreaContent}
              onChange={(e) => setNewAreaContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddArea()}
            />
            <button 
              onClick={handleAddArea}
              disabled={!newAreaContent.trim()}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-black px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Agregar
            </button>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-md flex flex-col gap-4">
          <h3 className="text-sm font-bold border-b border-zinc-800 pb-2 text-zinc-200">
            Listado de Áreas
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-2">
            {areas.map((area, idx) => (
              <div key={idx} className="bg-zinc-950 border border-zinc-800/80 rounded-lg p-3 flex group">
                {editingIndex === idx ? (
                  <div className="flex-1 flex flex-col gap-2">
                    <input 
                      type="text"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(idx)}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2 mt-1">
                      <button onClick={handleCancelEdit} className="p-1 hover:bg-zinc-800 rounded text-zinc-400">
                        <X className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleSaveEdit(idx)} className="p-1 hover:bg-amber-500/20 rounded text-amber-500 transition-colors">
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 flex items-center text-sm font-medium text-zinc-300">
                      <Map className="w-3.5 h-3.5 mr-2 text-amber-500/50" />
                      {area}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleStartEdit(idx)}
                        className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-amber-500 rounded transition-colors cursor-pointer"
                        title="Editar nombre"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDeleteArea(idx)}
                        className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-rose-500 rounded transition-colors cursor-pointer"
                        title="Eliminar área"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          {areas.length === 0 && (
            <p className="text-zinc-500 text-xs text-center py-4 italic">No hay áreas registradas.</p>
          )}
        </div>
      </div>
    </div>
  );
}
