
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { generateAcademicInfographic, extractImageMetadata } from '../services/geminiService';
import { downloadWithMetadata } from '../services/imageService';
import { AcademicHistoryItem, GeminiModel, ImageMetadata } from '../types';
import { 
  GraduationCap, 
  Dna, 
  Atom, 
  FlaskConical, 
  History as HistoryIcon, 
  Compass, 
  BrainCircuit, 
  ArrowRight, 
  Loader2, 
  Download, 
  Trash2, 
  Eye, 
  Maximize2, 
  Sparkles, 
  AlertCircle, 
  X, 
  Zap, 
  HelpCircle,
  Palette,
  Layout,
  Globe
} from 'lucide-react';
import { LoadingState } from './LoadingState';
import ImageViewer from './ImageViewer';
import MetadataEditor from './MetadataEditor';

interface AcademicStudioProps {
    history: AcademicHistoryItem[];
    onAddToHistory: (item: AcademicHistoryItem) => void;
    hasApiKey: boolean;
    onShowKeyModal: () => void;
    model: GeminiModel;
}

const ACADEMIC_SUBJECTS = [
  { id: 'biology', name: 'Human Body / Biology', icon: Dna, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { id: 'physics', name: 'Physics & Space', icon: Atom, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { id: 'chemistry', name: 'Chemistry & Molecules', icon: FlaskConical, color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { id: 'history', name: 'History & Civilizations', icon: HistoryIcon, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { id: 'geography', name: 'Geography & Planet', icon: Compass, color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
];

const ACADEMIC_STYLES = [
  "National Geographic Poster",
  "Medical Cross-section (3D)",
  "Da Vinci Sketch / Blueprint",
  "Minimalist Concept Map",
  "Futuristic Holographic HUD",
  "Vintage Encyclopedia"
];

const LANGUAGES = [
  { label: "English (US)", value: "English" },
  { label: "Romanian (Română)", value: "Romanian" },
  { label: "Spanish (Español)", value: "Spanish" },
  { label: "French (Français)", value: "French" },
  { label: "German (Deutsch)", value: "German" },
  { label: "Italian (Italiano)", value: "Italian" },
  { label: "Japanese (日本語)", value: "Japanese" },
  { label: "Korean (한국어)", value: "Korean" },
  { label: "Portuguese (Português)", value: "Portuguese" },
  { label: "Chinese (中文)", value: "Chinese" },
];

const AcademicStudio: React.FC<AcademicStudioProps> = ({ history, onAddToHistory, hasApiKey, onShowKeyModal, model }) => {
  const [selectedSubject, setSelectedSubject] = useState(ACADEMIC_SUBJECTS[0].id);
  const [topic, setTopic] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(ACADEMIC_STYLES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].value);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infographicData, setInfographicData] = useState<string | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<{src: string, alt: string} | null>(null);
  
  const [metadata, setMetadata] = useState<ImageMetadata>({
      title: '',
      author: 'EduVision Studio',
      description: '',
      keywords: '',
      copyright: '',
      date: new Date().toISOString()
  });

  // Draft persistence
  useEffect(() => {
    const draft = localStorage.getItem('l2i_academic_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.topic !== undefined) setTopic(parsed.topic);
        if (parsed.selectedSubject !== undefined) setSelectedSubject(parsed.selectedSubject);
        if (parsed.selectedStyle !== undefined) setSelectedStyle(parsed.selectedStyle);
        if (parsed.selectedLanguage !== undefined) setSelectedLanguage(parsed.selectedLanguage);
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('l2i_academic_draft', JSON.stringify({ topic, selectedSubject, selectedStyle, selectedLanguage }));
  }, [topic, selectedSubject, selectedStyle, selectedLanguage]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasApiKey) {
        onShowKeyModal();
        return;
    }

    if (!topic.trim()) {
      setError('Please enter a topic you wish to visualize.');
      return;
    }

    setLoading(true);
    setInfographicData(null);
    setLoadingStage('SYNTHESIZING ACADEMIC CONCEPT...');

    try {
      const subjectName = ACADEMIC_SUBJECTS.find(s => s.id === selectedSubject)?.name || 'General';
      
      const result = await generateAcademicInfographic(
        topic,
        subjectName,
        selectedStyle,
        (stage) => setLoadingStage(stage),
        selectedLanguage,
        model
      );

      if (result) {
        setInfographicData(result);
        onAddToHistory({
            id: Date.now().toString(),
            topic: topic,
            subject: subjectName,
            imageData: result,
            date: new Date()
        });
        
        setLoadingStage('OPTIMIZING EDUCATIONAL TAGS');
        const aiMeta = await extractImageMetadata(result, 'image/png', `Topic: ${topic}, Subject: ${subjectName}`, 'gemini-3-flash-preview');

        setMetadata({
            title: aiMeta.title || `${topic} - Academic Visualization`,
            author: 'EduVision Studio',
            description: aiMeta.description || `Educational study infographic for "${topic}" in ${subjectName}.`,
            keywords: aiMeta.keywords || `education, academic, ${selectedSubject}, ${topic.toLowerCase()}`,
            copyright: `© ${new Date().getFullYear()} EduVision AI`,
            date: new Date().toISOString().slice(0, 16)
        });
      } else {
        throw new Error('Image generation failed.');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleDownload = () => {
    if (!infographicData) return;
    const filename = `${topic.replace(/\s+/g, '_').toLowerCase()}_infographic.png`;
    downloadWithMetadata(infographicData, metadata, filename);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 mb-20 px-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {fullScreenImage && (
          <ImageViewer 
            src={fullScreenImage.src} 
            alt={fullScreenImage.alt} 
            onClose={() => setFullScreenImage(null)} 
          />
      )}

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-bold text-indigo-500 uppercase tracking-[0.2em] mb-2 animate-pulse">
            Visual Academy v1.1
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          EduVision <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-400">Intelligence</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg font-light leading-relaxed">
          Explain complex concepts through fascinating <strong className="text-indigo-500">Academic Infographics</strong>.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-10 items-stretch">
        {/* Left: Configuration */}
        <div className="lg:col-span-5 flex flex-col space-y-8">
            <div className="glass-panel p-8 rounded-[40px] bg-white/60 dark:bg-slate-900/60 shadow-xl border border-slate-200 dark:border-white/10 space-y-8">
                
                {/* Subject Selection */}
                <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Select Field</label>
                    <div className="grid grid-cols-1 gap-3">
                        {ACADEMIC_SUBJECTS.map(subject => (
                            <button
                                key={subject.id}
                                onClick={() => setSelectedSubject(subject.id)}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${selectedSubject === subject.id ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-white/5 text-slate-500 hover:border-indigo-500/30'}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedSubject === subject.id ? 'bg-white/20' : subject.bg}`}>
                                    <subject.icon className={`w-5 h-5 ${selectedSubject === subject.id ? 'text-white' : subject.color}`} />
                                </div>
                                <span className="text-sm font-bold uppercase tracking-tight">{subject.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Topic Input */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">What do you want to learn?</label>
                    <div className="relative group">
                         <div className="absolute inset-0 bg-indigo-500/10 blur-xl rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                         <div className="relative bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-inner">
                            <textarea
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                placeholder="Ex: How does the human heart work? Or: The laws of thermodynamics explained visually."
                                rows={4}
                                className="w-full bg-transparent border-none p-5 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-0 outline-none resize-none"
                            />
                         </div>
                    </div>
                </div>

                {/* Multi-config Row: Style & Language */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Style Picker */}
                  <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Visual Style</label>
                      <select
                          value={selectedStyle}
                          onChange={(e) => setSelectedStyle(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-4 px-4 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-1 ring-indigo-500"
                      >
                          {ACADEMIC_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
                      </select>
                  </div>

                  {/* Language Picker */}
                  <div className="space-y-3">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Output Language</label>
                      <div className="relative group">
                        <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 pointer-events-none" />
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-4 pl-11 pr-4 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-1 ring-indigo-500 appearance-none"
                        >
                            {LANGUAGES.map(lang => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
                        </select>
                      </div>
                  </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.98] group"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>GENERATE EXPLANATION <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                </button>
            </div>
        </div>

        {/* Right: Visualization Result */}
        <div className="lg:col-span-7 flex flex-col min-h-[600px]">
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center glass-panel rounded-[40px] bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-indigo-500/20">
                     <LoadingState message={loadingStage} type="article" />
                </div>
            ) : infographicData ? (
                <div className="flex-1 glass-panel p-8 rounded-[40px] flex flex-col bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95">
                    <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-white/5 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
                                <Layout className="w-5 h-5 text-indigo-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-white">Edu_Result</h3>
                                <p className="text-[10px] text-slate-500 font-mono">{topic.slice(0, 30)}... ({selectedLanguage})</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => setFullScreenImage({ src: `data:image/png;base64,${infographicData}`, alt: topic })} 
                                className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-500"
                            >
                                <Eye className="w-5 h-5" />
                            </button>
                             <button 
                                onClick={handleDownload}
                                className="p-3 bg-indigo-500 text-white rounded-xl shadow-lg hover:bg-indigo-600 transition-colors"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                            <button onClick={() => setInfographicData(null)} className="p-3 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>
                        </div>
                    </div>

                    <div className="relative group cursor-zoom-in rounded-3xl overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/40 mb-8 shadow-inner flex-1">
                        <img 
                            src={`data:image/png;base64,${infographicData}`} 
                            alt="Educational Infographic" 
                            className="w-full h-full object-contain transition-transform group-hover:scale-105 duration-1000" 
                            onClick={() => setFullScreenImage({ src: `data:image/png;base64,${infographicData}`, alt: topic })}
                        />
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
                        <MetadataEditor initialData={metadata} onChange={setMetadata} />
                    </div>
                </div>
            ) : (
                <div className="flex-1 glass-panel border-2 border-dashed border-slate-300 dark:border-white/10 rounded-[40px] flex flex-col p-12 bg-white/40 dark:bg-slate-900/40 relative overflow-hidden">
                    <div className="relative z-10 h-full flex flex-col justify-center items-center text-center space-y-8">
                        <div className="w-24 h-24 rounded-[32px] bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center animate-bounce">
                            <GraduationCap className="w-12 h-12 text-indigo-500" />
                        </div>
                        <div className="max-w-md space-y-4">
                            <h2 className="text-3xl font-bold text-slate-800 dark:text-white font-sans">EduVision Studio</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                                Transform curiosity into visual knowledge. Ideal for students who want to understand human anatomy, complex physical phenomena, or detailed historical timelines.
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3">
                             <div className="px-4 py-2 bg-indigo-500/5 border border-indigo-500/10 rounded-full text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Anatomy Diagrams</div>
                             <div className="px-4 py-2 bg-blue-500/5 border border-blue-500/10 rounded-full text-[10px] font-bold text-blue-500 uppercase tracking-widest">Physics Schemes</div>
                             <div className="px-4 py-2 bg-pink-500/5 border border-pink-500/10 rounded-full text-[10px] font-bold text-pink-500 uppercase tracking-widest">Chemical Chains</div>
                        </div>
                    </div>
                    <div className="absolute inset-0 -z-10 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #6366f1 2px, transparent 2px)', backgroundSize: '40px 40px' }}></div>
                </div>
            )}
        </div>
      </div>

      {history.length > 0 && (
          <div className="pt-12 border-t border-slate-200 dark:border-white/10 animate-in fade-in">
              <div className="flex items-center gap-2 mb-8 text-slate-400">
                  <GraduationCap className="w-4 h-4" />
                  <h2 className="text-sm font-bold uppercase tracking-widest">Edu Archive</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {history.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => {
                            setInfographicData(item.imageData);
                            setTopic(item.topic);
                            setSelectedSubject(ACADEMIC_SUBJECTS.find(s => s.name === item.subject)?.id || 'biology');
                        }}
                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:border-indigo-500/50 rounded-[32px] overflow-hidden text-left transition-all hover:shadow-xl hover:bg-slate-50 dark:hover:bg-slate-800 p-2"
                      >
                          <div className="aspect-[3/4] relative overflow-hidden rounded-[24px] bg-slate-100 dark:bg-black/40">
                              <img src={`data:image/png;base64,${item.imageData}`} alt={item.topic} className="w-full h-full object-cover opacity-90 transition-opacity group-hover:scale-110 duration-700" />
                          </div>
                          <div className="p-4">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate uppercase tracking-tighter">{item.topic}</p>
                              <p className="text-[10px] text-indigo-500 mt-1 font-mono uppercase tracking-widest">{item.subject}</p>
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      )}

      {error && (
        <div className="p-5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-3xl flex items-center gap-4 text-sm border border-red-500/20 animate-in slide-in-from-top-4">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <div className="flex-1 font-medium leading-relaxed">{error}</div>
            <button onClick={() => setError(null)} className="p-2 hover:bg-black/5 rounded-full"><X className="w-5 h-5" /></button>
        </div>
      )}
    </div>
  );
};

export default AcademicStudio;
