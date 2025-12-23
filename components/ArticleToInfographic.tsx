
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect } from 'react';
import { generateArticleInfographic, improvePrompt } from '../services/geminiService';
import { downloadWithMetadata } from '../services/imageService';
import { Citation, ArticleHistoryItem, ImageMetadata, GeminiModel } from '../types';
import { 
  Link, 
  Loader2, 
  Download, 
  Sparkles, 
  AlertCircle, 
  Palette, 
  Globe, 
  ExternalLink, 
  BookOpen, 
  Maximize, 
  AlignLeft, 
  Wand2, 
  Check, 
  X, 
  ShoppingBag, 
  FileText as FileIcon, 
  ImageIcon, 
  Trash2, 
  RectangleHorizontal, 
  RectangleVertical, 
  Square, 
  ScanEye, 
  Box, 
  KeyRound, 
  Clipboard, 
  XCircle, 
  ArrowRight,
  HelpCircle,
  Zap,
  MousePointer2,
  Cpu,
  Eye,
  FileImage,
  History
} from 'lucide-react';
import { LoadingState } from './LoadingState';
import ImageViewer from './ImageViewer';
import MetadataEditor from './MetadataEditor';

interface ArticleToInfographicProps {
    history: ArticleHistoryItem[];
    onAddToHistory: (item: ArticleHistoryItem) => void;
    hasApiKey: boolean;
    onShowKeyModal: () => void;
    model: GeminiModel;
}

const SKETCH_STYLES = [
    "Modern Editorial",
    "Fun & Playful",
    "Clean Minimalist",
    "Dark Mode Tech",
    "Human-like Hand-Drawn",
    "Natural & Organic",
    "E-commerce Showcase",
    "Tech Spec Grid",
    "Custom"
];

const ASPECT_RATIOS = [
    { label: "Tall (3:4)", value: "3:4", icon: RectangleVertical },
    { label: "Mobile (9:16)", value: "9:16", icon: RectangleVertical },
    { label: "Square (1:1)", value: "1:1", icon: Square },
    { label: "Wide (16:9)", value: "16:9", icon: RectangleHorizontal },
];

const LANGUAGES = [
  { label: "English (US)", value: "English" },
  { label: "Arabic (Egypt)", value: "Arabic" },
  { label: "German (Germany)", value: "German" },
  { label: "Spanish (Mexico)", value: "Spanish" },
  { label: "French (France)", value: "French" },
  { label: "Hindi (India)", value: "Hindi" },
  { label: "Indonesian (Indonesia)", value: "Indonesian" },
  { label: "Italian (Italy)", value: "Italian" },
  { label: "Japanese (Japan)", value: "Japanese" },
  { label: "Korean (South Korea)", value: "Korean" },
  { label: "Portuguese (Brazil)", value: "Portuguese" },
  { label: "Romanian (Romania)", value: "Romanian" },
  { label: "Russian (Russia)", value: "Russian" },
  { label: "Ukrainian (Ukraine)", value: "Ukrainian" },
  { label: "Vietnamese (Vietnam)", value: "Vietnamese" },
  { label: "Chinese (China)", value: "Chinese" },
];

const ArticleToInfographic: React.FC<ArticleToInfographicProps> = ({ history, onAddToHistory, hasApiKey, onShowKeyModal, model }) => {
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url');
  const [contentType, setContentType] = useState<'article' | 'product'>('article');
  
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [activeInputFocus, setActiveInputFocus] = useState(false);
  
  const [selectedStyle, setSelectedStyle] = useState(SKETCH_STYLES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].value);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0].value);
  const [customStyle, setCustomStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<string>('');
  
  const [infographicData, setInfographicData] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  
  const [referenceImage, setReferenceImage] = useState<{ data: string, mimeType: string } | null>(null);

  const [metadata, setMetadata] = useState<ImageMetadata>({
      title: '',
      author: 'Link2Infographic',
      description: '',
      keywords: '',
      copyright: '',
      date: new Date().toISOString()
  });

  const [fullScreenImage, setFullScreenImage] = useState<{src: string, alt: string} | null>(null);

  // Load Draft on Mount
  useEffect(() => {
    const draft = localStorage.getItem('l2i_article_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.urlInput !== undefined) setUrlInput(parsed.urlInput);
        if (parsed.textInput !== undefined) setTextInput(parsed.textInput);
        if (parsed.inputMode !== undefined) setInputMode(parsed.inputMode);
        if (parsed.contentType !== undefined) setContentType(parsed.contentType);
        if (parsed.selectedStyle !== undefined) setSelectedStyle(parsed.selectedStyle);
        if (parsed.selectedLanguage !== undefined) setSelectedLanguage(parsed.selectedLanguage);
        if (parsed.selectedRatio !== undefined) setSelectedRatio(parsed.selectedRatio);
        if (parsed.customStyle !== undefined) setCustomStyle(parsed.customStyle);
      } catch (e) { console.error("Failed to load draft", e); }
    }
  }, []);

  // Save Draft on Change
  useEffect(() => {
    const draft = {
      urlInput,
      textInput,
      inputMode,
      contentType,
      selectedStyle,
      selectedLanguage,
      selectedRatio,
      customStyle
    };
    localStorage.setItem('l2i_article_draft', JSON.stringify(draft));
  }, [urlInput, textInput, inputMode, contentType, selectedStyle, selectedLanguage, selectedRatio, customStyle]);

  const handleError = (err: any) => {
    console.error(err);
    const errorMessage = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
    
    if (errorMessage.includes("Requested entity was not found") || 
        errorMessage.includes("403") || 
        errorMessage.includes("PERMISSION_DENIED") ||
        errorMessage.includes("permission")) {
        
        setError("Access Denied: Your API key requires a paid Google Cloud project with billing enabled to use Gemini 3.");
        onShowKeyModal();
    } else if (errorMessage.includes("safety")) {
        setError("The content was flagged by safety filters. Please try different content.");
    } else {
        setError('An unexpected error occurred. Please check the content and try again.');
    }
  };

  const handlePaste = async () => {
      try {
          const text = await navigator.clipboard.readText();
          if (inputMode === 'url') setUrlInput(text);
          else setTextInput(text);
      } catch (err) {
          console.error('Clipboard failed:', err);
      }
  };

  const clearInput = () => {
      if (inputMode === 'url') setUrlInput('');
      else setTextInput('');
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!hasApiKey) {
        onShowKeyModal();
        return;
    }

    setInfographicData(null);
    setCitations([]);

    const content = inputMode === 'url' ? urlInput.trim() : textInput.trim();

    if (!content) {
      setError(inputMode === 'url' ? 'Please enter a valid URL.' : 'Please enter the content text.');
      return;
    }

    setLoading(true);
    setLoadingStage('ANALYZING SOURCE CONTENT');
    
    const title = inputMode === 'url' ? new URL(content).hostname : (content.slice(0, 30) + '...');
    
    setMetadata(prev => ({
        ...prev,
        title: `${title} Infographic`,
        description: `Infographic generated from source`,
        keywords: `infographic, ${contentType}`,
        date: new Date().toISOString().slice(0, 16)
    }));

    try {
      const styleToUse = selectedStyle === 'Custom' ? customStyle : selectedStyle;
      
      const result = await generateArticleInfographic(
          content, 
          inputMode,
          contentType,
          styleToUse, 
          (stage) => setLoadingStage(stage),
          selectedLanguage,
          referenceImage,
          selectedRatio,
          model
      );

      if (result.imageData) {
        setInfographicData(result.imageData);
        setCitations(result.citations);
        
        onAddToHistory({
            id: Date.now().toString(),
            title: title,
            url: inputMode === 'url' ? content : 'Manual Text',
            imageData: result.imageData,
            citations: result.citations,
            date: new Date()
        });
      } else {
        throw new Error('Image generation failed.');
      }
    } catch (err: any) {
        handleError(err);
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleDownload = () => {
    if (!infographicData) return;
    const safeTitle = (metadata.title || 'infographic').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeTitle}_with_meta.png`;
    downloadWithMetadata(infographicData, metadata, filename);
  };

  const handleSimpleDownload = () => {
    if (!infographicData) return;
    const safeTitle = (metadata.title || 'infographic').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${infographicData}`;
    link.download = `${safeTitle}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLoadFromHistory = (item: ArticleHistoryItem) => {
    setInfographicData(item.imageData);
    setCitations(item.citations);
    setMetadata(prev => ({
      ...prev,
      title: item.title,
      date: new Date(item.date).toISOString().slice(0, 16)
    }));
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em] mb-2 animate-pulse">
            Semantic Visualizer v2.4
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          SiteSketch <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-400">Intelligence</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-lg font-light leading-relaxed">
          Transform URLs or long text into <strong className="text-emerald-500">Professional Infographics</strong> via AI.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-10 items-stretch">
        {/* Left: Input Panel */}
        <div className="lg:col-span-5 flex flex-col space-y-8">
            <div className="glass-panel p-8 rounded-[40px] bg-white/60 dark:bg-slate-900/60 shadow-xl border border-slate-200 dark:border-white/10 space-y-8">
                {/* Input Method */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-white/5">
                    <button
                        onClick={() => setInputMode('url')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${inputMode === 'url' ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        <Globe className="w-4 h-4" /> Scan Link
                    </button>
                    <button
                        onClick={() => setInputMode('text')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${inputMode === 'text' ? 'bg-white dark:bg-slate-800 text-emerald-500 shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        <AlignLeft className="w-4 h-4" /> Paste Text
                    </button>
                </div>

                {/* Infographic Type */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Infographic Type</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setContentType('article')}
                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${contentType === 'article' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-white/5 text-slate-500 hover:border-emerald-500/30'}`}
                        >
                            <FileIcon className="w-5 h-5" />
                            <span className="text-[11px] font-bold uppercase">Article / Blog</span>
                        </button>
                        <button
                            onClick={() => setContentType('product')}
                            className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${contentType === 'product' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-white/5 text-slate-500 hover:border-emerald-500/30'}`}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            <span className="text-[11px] font-bold uppercase">Product Page</span>
                        </button>
                    </div>
                </div>

                {/* Content Source */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Content Source</label>
                    <div className={`relative group transition-all duration-300 ${activeInputFocus ? 'scale-[1.01]' : ''}`}>
                        <div className={`absolute inset-0 bg-emerald-500/20 blur-xl rounded-2xl transition-opacity duration-300 ${activeInputFocus ? 'opacity-100' : 'opacity-0'}`}></div>
                        <div className="relative bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden flex flex-col shadow-inner">
                            {inputMode === 'url' ? (
                                <div className="flex items-center p-4">
                                    <Globe className={`w-5 h-5 mr-3 transition-colors ${activeInputFocus ? 'text-emerald-500' : 'text-slate-400'}`} />
                                    <input
                                        type="url"
                                        value={urlInput}
                                        onChange={(e) => setUrlInput(e.target.value)}
                                        onFocus={() => setActiveInputFocus(true)}
                                        onBlur={() => setActiveInputFocus(false)}
                                        placeholder="Enter website URL..."
                                        className="flex-1 bg-transparent border-none py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-0 outline-none"
                                    />
                                    <div className="flex items-center gap-1">
                                        {urlInput && <button onClick={clearInput} className="p-2 text-slate-400 hover:text-red-500"><XCircle className="w-4 h-4" /></button>}
                                        {!urlInput && <button onClick={handlePaste} className="p-2 text-slate-400 hover:text-emerald-500"><Clipboard className="w-4 h-4" /></button>}
                                    </div>
                                </div>
                            ) : (
                                <textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onFocus={() => setActiveInputFocus(true)}
                                    onBlur={() => setActiveInputFocus(false)}
                                    placeholder={contentType === 'article' ? "Paste article or blog content here..." : "Paste product description or technical specs..."}
                                    rows={6}
                                    className="w-full bg-transparent border-none p-5 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-0 outline-none resize-none"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Visual Style & Config */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Visual Theme</label>
                        <select
                            value={selectedStyle}
                            onChange={(e) => setSelectedStyle(e.target.value)}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-3 text-[11px] font-bold text-slate-700 dark:text-white outline-none focus:ring-1 ring-emerald-500"
                        >
                            {SKETCH_STYLES.map(style => <option key={style} value={style}>{style}</option>)}
                        </select>
                    </div>

                    {selectedStyle === 'Custom' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Custom Style Description</label>
                            <input
                                type="text"
                                value={customStyle}
                                onChange={(e) => setCustomStyle(e.target.value)}
                                placeholder="E.g. Vintage newspaper, 8-bit pixel art..."
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-4 text-xs text-slate-700 dark:text-white outline-none focus:ring-1 ring-emerald-500"
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Language</label>
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-3 text-[11px] font-bold text-slate-700 dark:text-white outline-none focus:ring-1 ring-emerald-500"
                            >
                                {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Format</label>
                            <select
                                value={selectedRatio}
                                onChange={(e) => setSelectedRatio(e.target.value)}
                                className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl py-3 px-3 text-[11px] font-bold text-slate-700 dark:text-white outline-none focus:ring-1 ring-emerald-500"
                            >
                                {ASPECT_RATIOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.98] group"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>GENERATE INFOGRAPHIC <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                </button>
            </div>
        </div>

        {/* Right: Output Pane */}
        <div className="lg:col-span-7 flex flex-col min-h-[600px]">
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center glass-panel rounded-[40px] bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-emerald-500/20">
                     <LoadingState message={loadingStage} type="article" />
                </div>
            ) : infographicData ? (
                <div className="flex-1 glass-panel p-8 rounded-[40px] flex flex-col bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95">
                    <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-white/5 pb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <Cpu className="w-5 h-5 text-emerald-500" />
                            </div>
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-white">Sketch_Export</h3>
                        </div>
                        <div className="flex items-center gap-2">
                             <button 
                                onClick={() => setFullScreenImage({ src: `data:image/png;base64,${infographicData}`, alt: "SiteSketch Result" })} 
                                className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-500"
                                title="View Fullscreen"
                            >
                                <Eye className="w-5 h-5" />
                            </button>
                             <button 
                                onClick={handleSimpleDownload}
                                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-xs font-bold border border-slate-200 dark:border-white/5 shadow-sm"
                                title="Download simple PNG"
                            >
                                <FileImage className="w-4 h-4" /> Download PNG
                            </button>
                             <button 
                                onClick={handleDownload}
                                className="p-3 bg-emerald-500 text-white rounded-xl shadow-lg hover:bg-emerald-600 transition-colors"
                                title="Download with Metadata"
                            >
                                <Download className="w-5 h-5" />
                            </button>
                            <button onClick={() => setInfographicData(null)} className="p-3 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors" title="Clear Result"><Trash2 className="w-5 h-5" /></button>
                        </div>
                    </div>

                    <div className="relative group cursor-zoom-in rounded-3xl overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/40 mb-8 shadow-inner">
                        <img 
                            src={`data:image/png;base64,${infographicData}`} 
                            alt="Generated Infographic" 
                            className="w-full h-auto object-contain transition-transform group-hover:scale-105 duration-1000" 
                            onClick={() => setFullScreenImage({ src: `data:image/png;base64,${infographicData}`, alt: "Result" })}
                        />
                    </div>

                    {citations.length > 0 && (
                        <div className="bg-emerald-500/5 rounded-3xl p-6 border border-emerald-500/10">
                            <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2"><BookOpen className="w-4 h-4" /> Grounding Sources</h4>
                            <div className="grid gap-3">
                                {citations.map((c, i) => (
                                    <a key={i} href={c.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 hover:text-emerald-500 transition-colors group">
                                        <ExternalLink className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                                        <span className="truncate underline underline-offset-4">{c.title || c.uri}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5">
                        <MetadataEditor initialData={metadata} onChange={setMetadata} />
                    </div>
                </div>
            ) : (
                <div className="flex-1 glass-panel border-2 border-dashed border-slate-300 dark:border-white/10 rounded-[40px] flex flex-col p-8 md:p-12 bg-white/40 dark:bg-slate-900/40 relative overflow-hidden">
                    <div className="relative z-10 h-full flex flex-col">
                        <div className="text-center space-y-3 mb-12">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto border border-slate-200 dark:border-white/10">
                                <HelpCircle className="w-8 h-8 text-slate-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-sans">SiteSketch Guide</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">The AI visualization engine for editorial and technical content.</p>
                        </div>

                        <div className="grid gap-6 flex-1">
                            <div className="flex items-center gap-6 group">
                                <div className="w-24 h-24 bg-emerald-500/10 rounded-2xl overflow-hidden border border-emerald-500/20 shrink-0 flex items-center justify-center relative shadow-inner">
                                    <Zap className="w-10 h-10 text-emerald-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <ArrowRight className="w-6 h-6 text-slate-300 shrink-0" />
                                <div className="flex-1 p-5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-1 uppercase tracking-wider tracking-widest">EDITORIAL MODE</h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">"Transform blog posts into social-ready infographics with key takeaways."</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 group">
                                <div className="w-24 h-24 bg-blue-500/10 rounded-2xl overflow-hidden border border-blue-500/20 shrink-0 flex items-center justify-center relative shadow-inner">
                                    <ShoppingBag className="w-10 h-10 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <ArrowRight className="w-6 h-6 text-slate-300 shrink-0" />
                                <div className="flex-1 p-5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-1 uppercase tracking-wider tracking-widest">PRODUCT SPECS</h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">"Convert product pages into visual tech sheets and comparison grids."</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 group">
                                <div className="w-24 h-24 bg-teal-500/10 rounded-2xl overflow-hidden border border-teal-500/20 shrink-0 flex items-center justify-center relative shadow-inner">
                                    <FileIcon className="w-10 h-10 text-teal-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <ArrowRight className="w-6 h-6 text-slate-300 shrink-0" />
                                <div className="flex-1 p-5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-1 uppercase tracking-wider tracking-widest">TECH DOCUMENTS</h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">url > visual mapping of technical documentation and developer guides...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #10b981 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>
                </div>
            )}
        </div>
      </div>

      {history.length > 0 && (
          <div className="pt-12 border-t border-slate-200 dark:border-white/10 animate-in fade-in">
              <div className="flex items-center gap-2 mb-8 text-slate-400">
                  <History className="w-4 h-4" />
                  <h2 className="text-sm font-bold uppercase tracking-widest">SiteSketch Archive</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {history.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => handleLoadFromHistory(item)}
                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:border-emerald-500/50 rounded-[32px] overflow-hidden text-left transition-all hover:shadow-xl hover:bg-slate-50 dark:hover:bg-slate-800 p-2"
                      >
                          <div className="aspect-[3/4] relative overflow-hidden rounded-[24px] bg-slate-100 dark:bg-black/40">
                              <img src={`data:image/png;base64,${item.imageData}`} alt={item.title} className="w-full h-full object-cover opacity-90 transition-opacity group-hover:scale-110 duration-700" />
                          </div>
                          <div className="p-4">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate uppercase tracking-tighter">{item.title}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono truncate">{item.url}</p>
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

export default ArticleToInfographic;
