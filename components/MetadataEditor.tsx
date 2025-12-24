
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useEffect, useState, useRef } from 'react';
import { ImageMetadata } from '../types';
import { Tag, User, Copyright, Calendar, FileText, Code, CheckSquare, Info } from 'lucide-react';

interface MetadataEditorProps {
  initialData?: Partial<ImageMetadata>;
  onChange: (data: ImageMetadata) => void;
}

const MetadataEditor: React.FC<MetadataEditorProps> = ({ initialData, onChange }) => {
  const [formData, setFormData] = useState<ImageMetadata>({
    title: initialData?.title || '',
    author: initialData?.author || 'Link2Infographic User',
    description: initialData?.description || '',
    keywords: initialData?.keywords || 'infographic, ai-generated, visual-data',
    copyright: initialData?.copyright || `© ${new Date().getFullYear()} Link2Infographic`,
    date: initialData?.date || new Date().toISOString().slice(0, 16)
  });

  const [jsonInput, setJsonInput] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const lastUpdateRef = useRef<string>('');

  // Actualizare de la părinte (ex: când AI-ul propune meta-date noi)
  useEffect(() => {
    if (initialData) {
      const merged = {
        title: initialData.title ?? formData.title,
        author: initialData.author ?? formData.author,
        description: initialData.description ?? formData.description,
        keywords: initialData.keywords ?? formData.keywords,
        copyright: initialData.copyright ?? formData.copyright,
        date: initialData.date ?? formData.date,
      };
      
      const str = JSON.stringify(merged);
      if (str !== lastUpdateRef.current) {
        lastUpdateRef.current = str;
        setFormData(merged);
        setJsonInput(JSON.stringify(merged, null, 2));
      }
    }
  }, [initialData]);

  // Sincronizare imediată la fiecare apăsare de tastă
  const handleFieldChange = (field: keyof ImageMetadata, value: string) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    setJsonInput(JSON.stringify(next, null, 2));
    lastUpdateRef.current = JSON.stringify(next);
    onChange(next); // Notificăm părintele imediat
  };

  const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newVal = e.target.value;
    setJsonInput(newVal);
    try {
        const parsed = JSON.parse(newVal);
        const next = { ...formData, ...parsed };
        setFormData(next);
        setJsonError(null);
        lastUpdateRef.current = JSON.stringify(next);
        onChange(next);
    } catch (err) {
        setJsonError("JSON invalid");
    }
  };

  return (
    <div className="w-full mt-6 pt-6 border-t border-slate-200 dark:border-white/5 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-white/10">
           <Tag className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </div>
        <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono uppercase tracking-wider">Editor Meta-date Imagine</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-medium">Aceste date vor fi injectate direct în fișierul descărcat</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-5">
            <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300 font-sans border-b border-slate-200 dark:border-white/10 pb-2 mb-4">Câmpuri Standard</h4>
            
            <div className="space-y-1.5">
                <label className="text-sm text-slate-500 dark:text-slate-400 font-mono ml-1 font-medium">Titlu</label>
                <input 
                    type="text" 
                    value={formData.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-1 ring-emerald-500 transition-all font-mono"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-sm text-slate-500 dark:text-slate-400 font-mono ml-1 flex items-center gap-1 font-medium"><User className="w-3 h-3"/> Autor</label>
                <input 
                    type="text" 
                    value={formData.author}
                    onChange={(e) => handleFieldChange('author', e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-1 ring-emerald-500 transition-all font-mono"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-sm text-slate-500 dark:text-slate-400 font-mono ml-1 flex items-center gap-1 font-medium"><FileText className="w-3 h-3"/> Descriere</label>
                <textarea 
                    value={formData.description}
                    onChange={(e) => handleFieldChange('description', e.target.value)}
                    rows={3}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-1 ring-emerald-500 transition-all font-mono resize-none"
                />
            </div>

            <div className="space-y-1.5">
                <label className="text-sm text-slate-500 dark:text-slate-400 font-mono ml-1 flex items-center gap-1 font-medium"><Tag className="w-3 h-3"/> Cuvinte Cheie</label>
                <input 
                    type="text" 
                    value={formData.keywords}
                    onChange={(e) => handleFieldChange('keywords', e.target.value)}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-1 ring-emerald-500 transition-all font-mono"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm text-slate-500 dark:text-slate-400 font-mono ml-1 flex items-center gap-1 font-medium"><Copyright className="w-3 h-3"/> Copyright</label>
                    <input 
                        type="text" 
                        value={formData.copyright}
                        onChange={(e) => handleFieldChange('copyright', e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-1 ring-emerald-500 transition-all font-mono"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm text-slate-500 dark:text-slate-400 font-mono ml-1 flex items-center gap-1 font-medium"><Calendar className="w-3 h-3"/> Dată Creare</label>
                    <input 
                        type="datetime-local" 
                        value={formData.date}
                        onChange={(e) => handleFieldChange('date', e.target.value)}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-1 ring-emerald-500 transition-all font-mono"
                    />
                </div>
            </div>
        </div>

        <div className="space-y-5 h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-2 mb-4">
                 <h4 className="text-base font-semibold text-slate-700 dark:text-slate-300 font-sans">Avansat (JSON)</h4>
                 <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded border border-slate-200 dark:border-white/5">
                    <Code className="w-3 h-3" />
                    <span>Live Sync</span>
                 </div>
            </div>
            
            <div className="relative flex-1">
                <textarea 
                    value={jsonInput}
                    onChange={handleJsonChange}
                    className={`w-full h-full min-h-[300px] bg-slate-950 dark:bg-slate-950 border rounded-xl p-4 text-sm font-mono leading-relaxed resize-none focus:outline-none focus:ring-1 transition-all ${jsonError ? 'border-red-500/50 focus:ring-red-500/50 text-red-200' : 'border-slate-200 dark:border-white/10 focus:ring-emerald-500/50 text-emerald-100/80 dark:text-emerald-100/80'}`}
                />
                {jsonError && (
                    <div className="absolute bottom-4 right-4 bg-red-950/90 text-red-300 text-xs px-3 py-1.5 rounded-lg border border-red-500/30 flex items-center gap-2">
                        <Info className="w-3 h-3" /> {jsonError}
                    </div>
                )}
            </div>
            
            <div className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${!jsonError ? 'bg-emerald-500 border-emerald-500' : 'border-slate-400 dark:border-slate-600'}`}>
                    {!jsonError && <CheckSquare className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">Datele sunt sincronizate și gata pentru descărcare.</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MetadataEditor;
