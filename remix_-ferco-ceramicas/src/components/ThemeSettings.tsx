import React, { useState, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';

const PREDEFINED_THEMES = {
  dark: {
    name: 'Oscuro (Por Defecto)',
    colors: {
      bg: '#0a0a0a',
      bgCard: '#18181b',
      text: '#f4f4f5',
      title: '#f59e0b'
    }
  },
  light: {
    name: 'Claro (Alto Contraste)',
    colors: {
      bg: '#f3f4f6',
      bgCard: '#ffffff',
      text: '#111827',
      title: '#ea580c'
    }
  },
  corporate: {
    name: 'Corporativo Azul',
    colors: {
      bg: '#0f172a',
      bgCard: '#1e293b',
      text: '#f1f5f9',
      title: '#38bdf8'
    }
  }
};

export default function ThemeSettings() {
  const [activeTheme, setActiveTheme] = useState('dark');
  const [customColors, setCustomColors] = useState({
    bg: '#0a0a0a',
    bgCard: '#18181b',
    text: '#f4f4f5',
    title: '#f59e0b'
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('ferco_theme');
    const savedColors = localStorage.getItem('ferco_custom_colors');
    if (savedTheme) setActiveTheme(savedTheme);
    if (savedColors) {
      try {
        setCustomColors(JSON.parse(savedColors));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    let colorsToApply = customColors;
    
    if (activeTheme !== 'custom' && PREDEFINED_THEMES[activeTheme as keyof typeof PREDEFINED_THEMES]) {
      colorsToApply = PREDEFINED_THEMES[activeTheme as keyof typeof PREDEFINED_THEMES].colors;
    }

    const setProp = (v: string, c: string) => document.documentElement.style.setProperty(v, c);
    
    // Backgrounds (Neutral / Zinc 950)
    setProp('--custom-neutral-950', colorsToApply.bg);
    setProp('--custom-zinc-950', colorsToApply.bg); // sidebars, deep bg
    setProp('--custom-zinc-900', colorsToApply.bgCard); // cards
    
    // Texts (Zinc 100)
    setProp('--custom-zinc-100', colorsToApply.text);
    
    // Titles & Accents (Amber 400/500/600/700)
    setProp('--custom-amber-400', colorsToApply.title);
    setProp('--custom-amber-500', colorsToApply.title);
    
    // Border contrast auto-darken/lighten (simple approximations if needed, not heavily strict)
    if (activeTheme === 'light') {
      setProp('--custom-zinc-800', '#e5e7eb');
      setProp('--custom-zinc-500', '#6b7280');
      setProp('--custom-zinc-400', '#374151');
    } else {
      setProp('--custom-zinc-800', '#27272a');
      setProp('--custom-zinc-500', '#71717a');
      setProp('--custom-zinc-400', '#a1a1aa');
    }

  }, [activeTheme, customColors]);

  const handleApplyCustom = (colorKey: keyof typeof customColors, val: string) => {
    const next = { ...customColors, [colorKey]: val };
    setCustomColors(next);
    setActiveTheme('custom');
    localStorage.setItem('ferco_custom_colors', JSON.stringify(next));
    localStorage.setItem('ferco_theme', 'custom');
  };

  const handleSelectTheme = (k: string) => {
    setActiveTheme(k);
    localStorage.setItem('ferco_theme', k);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800/80 rounded-xl p-5 shadow-md flex flex-col gap-4 mt-6">
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <Palette className="w-5 h-5 text-amber-500" />
        <div>
          <h3 className="text-sm font-extrabold uppercase tracking-widest text-zinc-200">
            Apariencia y Temas
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">Personalice los colores de fondo, textos y títulos de la aplicación.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
        {Object.entries(PREDEFINED_THEMES).map(([k, v]) => (
          <div 
            key={k} 
            onClick={() => handleSelectTheme(k)}
            className={`border rounded-lg p-3 cursor-pointer transition-all ${activeTheme === k ? 'border-amber-500 bg-amber-500/5' : 'border-zinc-800 bg-zinc-950/50 hover:border-zinc-700'}`}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-zinc-300">{v.name}</span>
              {activeTheme === k && <Check className="w-3.5 h-3.5 text-amber-500" />}
            </div>
            <div className="flex gap-1.5 h-6">
              <div className="w-6 h-full rounded shadow-inner" style={{ background: v.colors.bg }} />
              <div className="w-6 h-full rounded shadow-inner" style={{ background: v.colors.bgCard }} />
              <div className="w-6 h-full rounded shadow-inner" style={{ background: v.colors.title }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-zinc-800/50">
        <h4 className="text-xs font-bold text-zinc-400 mb-3 uppercase tracking-wider">Colores Personalizados</h4>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer bg-zinc-950 px-3 py-2 border border-zinc-800 rounded-lg shrink-0">
             <input type="color" value={activeTheme === 'custom' ? customColors.bg : PREDEFINED_THEMES[activeTheme as keyof typeof PREDEFINED_THEMES]?.colors.bg || customColors.bg} onChange={e => handleApplyCustom('bg', e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
             <span className="text-xs font-semibold text-zinc-300">Fondo</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-zinc-950 px-3 py-2 border border-zinc-800 rounded-lg shrink-0">
             <input type="color" value={activeTheme === 'custom' ? customColors.bgCard : PREDEFINED_THEMES[activeTheme as keyof typeof PREDEFINED_THEMES]?.colors.bgCard || customColors.bgCard} onChange={e => handleApplyCustom('bgCard', e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
             <span className="text-xs font-semibold text-zinc-300">Tarjetas</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-zinc-950 px-3 py-2 border border-zinc-800 rounded-lg shrink-0">
             <input type="color" value={activeTheme === 'custom' ? customColors.text : PREDEFINED_THEMES[activeTheme as keyof typeof PREDEFINED_THEMES]?.colors.text || customColors.text} onChange={e => handleApplyCustom('text', e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
             <span className="text-xs font-semibold text-zinc-300">Textos</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer bg-zinc-950 px-3 py-2 border border-zinc-800 rounded-lg shrink-0">
             <input type="color" value={activeTheme === 'custom' ? customColors.title : PREDEFINED_THEMES[activeTheme as keyof typeof PREDEFINED_THEMES]?.colors.title || customColors.title} onChange={e => handleApplyCustom('title', e.target.value)} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
             <span className="text-xs font-semibold text-zinc-300">Títulos y Botones</span>
          </label>
        </div>
      </div>

    </div>
  );
}
