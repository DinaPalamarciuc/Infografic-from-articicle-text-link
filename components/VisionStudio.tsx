
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { processVisionTask, editImageWithGemini } from '../services/geminiService';
import ImageViewer from './ImageViewer';
import { 
  ImageIcon, 
  Upload, 
  Wand2, 
  MessageSquare, 
  FileText, 
  Loader2, 
  ArrowRight, 
  Clipboard, 
  Trash2, 
  ShieldAlert, 
  Sparkles, 
  HelpCircle, 
  Info, 
  X, 
  Type, 
  Maximize2,
  Cpu,
  Zap,
  MousePointer2,
  Palette,
  RefreshCcw,
  Download,
  Eye,
  History,
  Bird
} from 'lucide-react';
import { GeminiModel } from '../types';

interface VisionStudioProps {
  hasApiKey: boolean;
  onShowKeyModal: () => void;
  model: GeminiModel;
}

const VisionStudio: React.FC<VisionStudioProps> = ({ hasApiKey, onShowKeyModal, model }) => {
  const [image, setImage] = useState<{ data: string; mimeType: string } | null>(null);
  const [remixedImage, setRemixedImage] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [task, setTask] = useState<'prompt' | 'chat' | 'ocr'>('prompt');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [remixing, setRemixing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [fullScreenImage, setFullScreenImage] = useState<{src: string, alt: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Draft on Mount
  useEffect(() => {
    const draft = localStorage.getItem('l2i_vision_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.query !== undefined) setQuery(parsed.query);
        if (parsed.task !== undefined) setTask(parsed.task);
      } catch (e) { console.error("Failed to load vision draft", e); }
    }
  }, []);

  // Save Draft on Change
  useEffect(() => {
    const draft = { query, task };
    localStorage.setItem('l2i_vision_draft', JSON.stringify(draft));
  }, [query, task]);

  // Extract suggestions from AI response
  useEffect(() => {
    if (result) {
      const found = result.match(/\[SUGGESTION: (.*?)\]/g);
      if (found) {
        setSuggestions(found.map(s => s.replace(/\[SUGGESTION: |\]/g, '')));
      } else {
        setSuggestions([]);
      }
    }
  }, [result]);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError("Please upload a valid image (PNG, JPEG, WEBP).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage({ data: (reader.result as string).split(',')[1], mimeType: file.type });
        setResult(null);
        setRemixedImage(null);
        setShowOriginal(false);
        setSuggestions([]);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!image) return;
    if (!hasApiKey) {
      onShowKeyModal();
      return;
    }
    setLoading(true);
    setResult(null);
    setRemixedImage(null);
    setShowOriginal(false);
    setError(null);
    try {
      const response = await processVisionTask(image.data, image.mimeType, task, query, model);
      setResult(response);
    } catch (err: any) {
      setError(err.message || "Failed to process image.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemix = async (remixPrompt: string) => {
    if (!image) return;
    if (!hasApiKey) {
      onShowKeyModal();
      return;
    }
    setRemixing(true);
    setError(null);
    try {
      const editedBase64 = await editImageWithGemini(image.data, image.mimeType, remixPrompt);
      if (editedBase64) {
        setRemixedImage(editedBase64);
        setShowOriginal(false);
      } else {
        throw new Error("Gemini could not generate a remix for this image.");
      }
    } catch (err: any) {
      setError(err.message || "Remix failed.");
    } finally {
      setRemixing(false);
    }
  };

  const taskDescriptions = {
    prompt: "Extract the exact AI prompt from an image and modify it to create new variations.",
    chat: "Deep visual analysis: describe scenes, identify objects, or explain complex visuals.",
    ocr: "Extract handwritten notes, text from photos, or source code from screenshots."
  };

  const currentDisplayImage = (remixedImage && !showOriginal) ? remixedImage : (image?.data || null);

  return (
    <div className="max-w-7xl mx-auto space-y-12 mb-20 px-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {fullScreenImage && (
          <ImageViewer 
            src={fullScreenImage.src} 
            alt={fullScreenImage.alt} 
            onClose={() => setFullScreenImage(null)} 
          />
      )}

      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em] mb-2 animate-pulse">
            Multimodal Remix Engine v3.1
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Vision <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-400">Remix Studio</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-light leading-relaxed">
          Reverse-engineer any image into a text prompt, then <strong className="text-amber-500 font-bold underline underline-offset-4">Modify & Regenerate</strong> a brand new AI visual.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-5 flex flex-col space-y-8">
          <div 
            className={`flex-1 glass-panel border-2 border-dashed rounded-[40px] p-10 flex flex-col items-center justify-center text-center cursor-default transition-all min-h-[400px] relative overflow-hidden group shadow-xl ${image ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-300 dark:border-white/10 cursor-pointer hover:bg-white/10 dark:hover:bg-slate-900/40'}`}
            onClick={() => !image && fileInputRef.current?.click()}
          >
            <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="image/*" />
            
            {image ? (
              <div className="relative w-full h-full flex flex-col items-center justify-center gap-6">
                <div className="absolute inset-0 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                
                <div className="relative z-10 group/img">
                    <img 
                      src={`data:${image.mimeType};base64,${currentDisplayImage}`} 
                      className={`max-h-[320px] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/10 transition-all group-hover/img:scale-[1.02] ${remixing ? 'opacity-50 blur-sm' : 'opacity-100 blur-0'}`} 
                      alt="Source" 
                    />
                    
                    {!remixing && (
                        <div 
                            onClick={() => setFullScreenImage({ src: `data:${image.mimeType};base64,${currentDisplayImage}`, alt: showOriginal ? "Original Image" : "Remixed Image" })}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-2xl cursor-pointer backdrop-blur-sm"
                        >
                            <div className="bg-white/10 border border-white/20 px-6 py-3 rounded-full flex items-center gap-2 text-white font-bold text-sm">
                                <Maximize2 className="w-4 h-4" /> PREVIEW FULLSCREEN
                            </div>
                        </div>
                    )}
                </div>

                {remixing && (
                  <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                    <p className="text-white font-mono text-[10px] uppercase tracking-widest bg-black/60 px-4 py-2 rounded-full">Regenerating Remix...</p>
                  </div>
                )}

                {remixedImage && !remixing && (
                    <div className="relative z-20 flex p-1 bg-slate-900/80 backdrop-blur-md rounded-full border border-white/10 shadow-2xl animate-in slide-in-from-bottom-2">
                        <button 
                            onClick={() => setShowOriginal(true)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${showOriginal ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-300'}`}
                        >
                            <History className="w-3 h-3 inline mr-1.5" /> Source
                        </button>
                        <button 
                            onClick={() => setShowOriginal(false)}
                            className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${!showOriginal ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-300'}`}
                        >
                            <Zap className="w-3 h-3 inline mr-1.5" /> Remix
                        </button>
                    </div>
                )}

                {!remixing && (
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[10px] font-bold text-slate-500 dark:text-slate-400 hover:text-amber-500 transition-colors uppercase tracking-widest flex items-center gap-2"
                    >
                        <RefreshCcw className="w-3 h-3" /> Change source image
                    </button>
                )}
              </div>
            ) : (
              <div className="space-y-6 relative z-10 pointer-events-none">
                <div className="w-24 h-24 bg-amber-500/10 dark:bg-amber-500/20 rounded-[32px] flex items-center justify-center mx-auto border border-amber-500/30 group-hover:scale-110 transition-transform shadow-neon-amber">
                  <Upload className="w-10 h-10 text-amber-500" />
                </div>
                <div>
                    <h3 className="text-slate-900 dark:text-white font-bold text-2xl font-sans">Drop image to Remix</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 max-w-[200px] mx-auto leading-relaxed">Reverse-engineer prompts from any photo or screenshot</p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6 bg-white/40 dark:bg-slate-900/40 p-6 rounded-[32px] border border-slate-200 dark:border-white/10 shadow-lg backdrop-blur-md">
            <div className="grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setTask('prompt')}
                  className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-3 ${task === 'prompt' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-400'}`}
                >
                  <Wand2 className={`w-6 h-6 ${task === 'prompt' ? 'text-white' : 'text-amber-500'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Remix Prompt</span>
                </button>
                <button 
                  onClick={() => setTask('chat')}
                  className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-3 ${task === 'chat' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-400'}`}
                >
                  <MessageSquare className={`w-6 h-6 ${task === 'chat' ? 'text-white' : 'text-amber-500'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Analyze</span>
                </button>
                <button 
                  onClick={() => setTask('ocr')}
                  className={`p-5 rounded-2xl border transition-all flex flex-col items-center gap-3 ${task === 'ocr' ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5 text-slate-400'}`}
                >
                  <Type className={`w-6 h-6 ${task === 'ocr' ? 'text-white' : 'text-amber-500'}`} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Extract</span>
                </button>
            </div>
            
            <div className="px-4 py-3 bg-white/50 dark:bg-slate-950/50 rounded-xl text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5 flex gap-3">
                <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed"><strong>{task === 'prompt' ? 'REMIX MODE' : task.toUpperCase()}:</strong> {taskDescriptions[task]}</p>
            </div>

            <div className="relative">
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={task === 'chat' ? "E.g. Identify this object, describe the style..." : "Add custom modification instructions (e.g. make it neon)..."}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl pl-12 pr-12 py-5 text-sm focus:ring-2 ring-amber-500 shadow-inner text-slate-900 dark:text-white outline-none"
                />
                <MousePointer2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-500" />
            </div>

            <button 
              disabled={!image || loading}
              onClick={handleProcess}
              className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 group transition-all active:scale-[0.98]"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>{task === 'prompt' ? 'REVERSE ENGINEER PROMPT' : 'START ANALYSIS'} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col min-h-[600px]">
          {result ? (
            <div className="flex-1 glass-panel p-8 rounded-[40px] flex flex-col bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-white/5 pb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                        <Cpu className="w-5 h-5 text-amber-500" />
                    </div>
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-white">{task === 'prompt' ? 'Extracted_Prompt' : 'Analysis_Result'}</h3>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setFullScreenImage({ src: `data:${image?.mimeType};base64,${currentDisplayImage}`, alt: "Remix Target Preview" })} 
                    className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-500"
                    title="View current image preview"
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                  {remixedImage && (
                    <a 
                      href={`data:image/png;base64,${remixedImage}`} 
                      download="remixed-image.png"
                      className="p-3 bg-amber-500 text-white rounded-xl shadow-lg hover:bg-amber-600 transition-colors"
                      title="Download regenerated remix"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  )}
                  <button onClick={() => { navigator.clipboard.writeText(result.split('[SUGGESTION')[0]); }} className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-500" title="Copy text"><Clipboard className="w-5 h-5" /></button>
                  <button onClick={() => {setResult(null); setRemixedImage(null); setShowOriginal(false);}} className="p-3 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors" title="Clear analysis"><Trash2 className="w-5 h-5" /></button>
                </div>
              </div>
              
              <div className="flex-1 bg-slate-50 dark:bg-black/40 rounded-3xl p-8 font-mono text-sm leading-relaxed overflow-y-auto mb-8 border border-slate-200 dark:border-white/5 scrollbar-thin scrollbar-thumb-amber-500/20">
                {result.split('[SUGGESTION')[0]}
              </div>

              {suggestions.length > 0 && (
                <div className="space-y-4 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase tracking-[0.2em]">
                        <Palette className="w-4 h-4" /> REGENERATE WITH REMIX OPTIONS
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => handleRemix(s)}
                                disabled={remixing}
                                className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all shadow-sm group disabled:opacity-50"
                            >
                                <RefreshCcw className={`w-3.5 h-3.5 ${remixing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                                {s}
                            </button>
                        ))}
                    </div>
                    <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                         <p className="text-[10px] text-amber-600/70 dark:text-amber-500/60 uppercase font-mono text-center leading-relaxed">
                            Select a variation above to <strong className="text-amber-500 font-bold underline underline-offset-4">regenerate a new image</strong> based on the extracted prompt + style tweak.
                         </p>
                    </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 glass-panel border-2 border-dashed border-slate-300 dark:border-white/10 rounded-[40px] flex flex-col p-8 md:p-12 bg-white/40 dark:bg-slate-900/40 relative overflow-hidden">
              <div className="relative z-10 h-full flex flex-col">
                <div className="text-center space-y-3 mb-12">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto border border-slate-200 dark:border-white/10">
                        <HelpCircle className="w-8 h-8 text-slate-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-sans">Vision Remix Studio</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Reverse-engineer prompts, extract deep analysis, and apply real-time AI modifications to recreate visuals.</p>
                </div>

                <div className="grid gap-6 flex-1">
                    <div className="flex items-center gap-6 group">
                        <div className="w-24 h-24 bg-indigo-500/10 rounded-2xl overflow-hidden border border-indigo-500/20 shrink-0 flex items-center justify-center relative shadow-inner">
                            <Sparkles className="w-10 h-10 text-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <ArrowRight className="w-6 h-6 text-slate-300 shrink-0" />
                        <div className="flex-1 p-5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm">
                            <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-1 uppercase tracking-wider">PROMPT REVERSE-ENGINEERING</h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">"Upload any AI art or photo to extract its underlying text prompt. Modify and regenerate to iterate."</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 group">
                        <div className="w-24 h-24 bg-emerald-500/10 rounded-2xl overflow-hidden border border-emerald-500/20 shrink-0 flex items-center justify-center relative shadow-inner">
                            <Bird className="w-10 h-10 text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <ArrowRight className="w-6 h-6 text-slate-300 shrink-0" />
                        <div className="flex-1 p-5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm">
                            <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-1 uppercase tracking-wider">VISUAL STYLE ANALYSIS</h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">"Deeply analyze lighting, composition, and subjects to recreate identical aesthetics."</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 group">
                        <div className="w-24 h-24 bg-blue-500/10 rounded-2xl overflow-hidden border border-blue-500/20 shrink-0 flex items-center justify-center relative shadow-inner">
                            <FileText className="w-10 h-10 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <ArrowRight className="w-6 h-6 text-slate-300 shrink-0" />
                        <div className="flex-1 p-5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm">
                            <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-1 uppercase tracking-wider">DOCUMENT OCR</h3>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono leading-relaxed">image > prompt Extract text from any image, screenshot, or handwritten note...</p>
                        </div>
                    </div>
                </div>
              </div>

              <div className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #f59e0b 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="p-5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-3xl flex items-center gap-4 text-sm border border-red-500/20 animate-in slide-in-from-top-4">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <div className="flex-1 font-medium leading-relaxed">{error}</div>
            <button onClick={() => setError(null)} className="p-2 hover:bg-black/5 rounded-full"><X className="w-5 h-5" /></button>
        </div>
      )}
    </div>
  );
};

export default VisionStudio;
