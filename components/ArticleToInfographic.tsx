/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { generateArticleInfographic, improvePrompt } from '../services/geminiService';
import { Citation, ArticleHistoryItem, ImageMetadata } from '../types';
import { Link, Loader2, Download, Sparkles, AlertCircle, Palette, Globe, ExternalLink, BookOpen, Clock, Maximize, AlignLeft, Wand2, Check, X, ShoppingBag, FileText as FileIcon, Upload, Image as ImageIcon, Trash2, RectangleHorizontal, RectangleVertical, Square, ScanEye } from 'lucide-react';
import { LoadingState } from './LoadingState';
import ImageViewer from './ImageViewer';
import MetadataEditor from './MetadataEditor';

interface ArticleToInfographicProps {
    history: ArticleHistoryItem[];
    onAddToHistory: (item: ArticleHistoryItem) => void;
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

const ArticleToInfographic: React.FC<ArticleToInfographicProps> = ({ history, onAddToHistory }) => {
  const [inputMode, setInputMode] = useState<'url' | 'text'>('url');
  const [contentType, setContentType] = useState<'article' | 'product'>('article');
  
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  
  const [selectedStyle, setSelectedStyle] = useState(SKETCH_STYLES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].value);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0].value);
  const [customStyle, setCustomStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageData, setImageData] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState('');
  
  // Prompt Enhancer State
  const [improvingPrompt, setImprovingPrompt] = useState(false);
  const [suggestedPrompt, setSuggestedPrompt] = useState<string | null>(null);

  // Reference Image State
  const [referenceImage, setReferenceImage] = useState<{data: string, mimeType: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Metadata State
  const [metadata, setMetadata] = useState<ImageMetadata>({
      title: '',
      author: 'Link2Infographic',
      description: '',
      keywords: '',
      copyright: '',
      date: new Date().toISOString()
  });

  // Viewer State
  const [fullScreenImage, setFullScreenImage] = useState<{src: string, alt: string} | null>(null);

  const addToHistory = (source: string, image: string, cites: Citation[], mode: 'url' | 'text') => {
      let title = "Article Infographic";
      let displayUrl = source;

      if (mode === 'url') {
        try { 
            title = new URL(source).hostname; 
            displayUrl = source;
        } catch(e) { 
            title = source; 
        }
      } else {
         // Generate a short title from text
         title = source.slice(0, 30) + (source.length > 30 ? '...' : '');
         displayUrl = "raw-text://content"; // Marker for text content
      }
      
      const newItem: ArticleHistoryItem = {
          id: Date.now().toString(),
          title: title,
          url: displayUrl,
          imageData: image,
          citations: cites,
          date: new Date()
      };
      onAddToHistory(newItem);
  };

  const loadFromHistory = (item: ArticleHistoryItem) => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      if (item.url === "raw-text://content") {
          setInputMode('text');
          setTextInput(item.title); 
          setUrlInput('');
      } else {
          setInputMode('url');
          setUrlInput(item.url);
          setTextInput('');
      }
      
      setImageData(item.imageData);
      setCitations(item.citations);
      
      setMetadata(prev => ({
          ...prev,
          title: item.title,
          description: `History item: ${item.title}`,
          date: item.date.toISOString().slice(0, 16)
      }));
  };

  const handleImprovePrompt = async () => {
    if (!customStyle.trim()) return;
    setImprovingPrompt(true);
    setSuggestedPrompt(null);
    try {
        const better = await improvePrompt(customStyle);
        setSuggestedPrompt(better);
    } catch (e) {
        console.error(e);
    } finally {
        setImprovingPrompt(false);
    }
  };

  const acceptSuggestion = () => {
    if (suggestedPrompt) {
        setCustomStyle(suggestedPrompt);
        setSuggestedPrompt(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (PNG, JPG, WEBP).');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Extract strictly the base64 data part
        const base64Data = base64.split(',')[1]; 
        setReferenceImage({
            data: base64Data,
            mimeType: file.type
        });
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputMode === 'url' && !urlInput.trim()) {
        setError("Please provide a valid URL.");
        return;
    }
    if (inputMode === 'text' && !textInput.trim()) {
        setError("Please provide text content to analyze.");
        return;
    }
    
    setLoading(true);
    setError(null);
    setImageData(null);
    setCitations([]);
    setLoadingStage('INITIALIZING...');

    try {
      const styleToUse = selectedStyle === 'Custom' ? customStyle : selectedStyle;
      const content = inputMode === 'url' ? urlInput : textInput;

      // Set initial metadata based on input
      setMetadata(prev => ({
        ...prev,
        title: inputMode === 'url' ? getHostname(urlInput) : 'Text Analysis',
        description: `Infographic generated from ${inputMode === 'url' ? urlInput : 'text content'}`,
        keywords: `infographic, ${contentType}, ${inputMode === 'url' ? 'web' : 'text'}, analysis`,
        date: new Date().toISOString().slice(0, 16)
      }));

      const { imageData: resultImage, citations: resultCitations } = await generateArticleInfographic(
          content, 
          inputMode, 
          contentType,
          styleToUse, 
          (stage) => {
             setLoadingStage(stage);
          }, 
          selectedLanguage,
          referenceImage, // Pass the uploaded reference image
          selectedRatio // Pass dimension
      );
      
      if (resultImage) {
          setImageData(resultImage);
          setCitations(resultCitations);
          addToHistory(content, resultImage, resultCitations, inputMode);
      } else {
          throw new Error("Failed to generate infographic image.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const getHostname = (urlStr: string) => {
      if (urlStr === "raw-text://content") return "Text Input";
      try {
          return new URL(urlStr).hostname;
      } catch {
          return "Unknown Source";
      }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 mb-20">
      
      {fullScreenImage && (
          <ImageViewer 
            src={fullScreenImage.src} 
            alt={fullScreenImage.alt} 
            onClose={() => setFullScreenImage(null)} 
          />
      )}

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans drop-shadow-sm dark:drop-shadow-lg">
          Site<span className="text-emerald-500 dark:text-emerald-400">Sketch</span>.
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-xl md:text-2xl font-light tracking-wide">
          Turn any article, <span className="text-emerald-600 dark:text-emerald-300 font-medium">product page</span>, or text into a stunning, easy-to-digest infographic.
        </p>

        {/* Informational Guide */}
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 text-left max-w-2xl mx-auto flex items-start gap-3 shadow-sm">
            <FileIcon className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
                <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-mono">How to use SiteSketch</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                   <strong>Mode 1 (Article):</strong> Summarizes long blog posts into key points.<br/>
                   <strong>Mode 2 (Product):</strong> Creates a feature sheet with specs and selling points.<br/>
                   Upload a screenshot in "Style Extractor" to match color/css vibes (content is ignored).
                </p>
            </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="glass-panel rounded-3xl p-6 md:p-10 space-y-8 relative z-10 bg-white/60 dark:bg-slate-900/60">
         <form onSubmit={handleGenerate} className="space-y-8">
            <div className="space-y-4">
                {/* Top Row: Content Type Selector */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-200 dark:border-white/10 self-start">
                        <button 
                            type="button"
                            onClick={() => setContentType('article')} 
                            className={`px-4 py-2 text-sm font-mono rounded-md transition-all flex items-center gap-2 font-semibold ${contentType === 'article' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                        >
                            <FileIcon className="w-3.5 h-3.5" /> Article / Blog
                        </button>
                        <button 
                            type="button"
                            onClick={() => setContentType('product')} 
                            className={`px-4 py-2 text-sm font-mono rounded-md transition-all flex items-center gap-2 font-semibold ${contentType === 'product' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-200 dark:border-emerald-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                        >
                            <ShoppingBag className="w-3.5 h-3.5" /> Product Page
                        </button>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1 border border-slate-200 dark:border-white/10 self-start">
                        <button 
                            type="button"
                            onClick={() => setInputMode('url')} 
                            className={`px-4 py-2 text-sm font-mono rounded-md transition-all font-semibold ${inputMode === 'url' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                        >
                            URL
                        </button>
                        <button 
                            type="button"
                            onClick={() => setInputMode('text')} 
                            className={`px-4 py-2 text-sm font-mono rounded-md transition-all font-semibold ${inputMode === 'text' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'}`}
                        >
                            TEXT
                        </button>
                    </div>
                </div>

                {inputMode === 'url' ? (
                    <div className="relative animate-in fade-in slide-in-from-bottom-2">
                        <input
                            type="url"
                            value={urlInput}
                            onChange={(e) => setUrlInput(e.target.value)}
                            placeholder={contentType === 'product' ? "https://store.com/awesome-gadget" : "https://example.com/interesting-article"}
                            className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-5 text-xl text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500/70 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono transition-all shadow-inner"
                        />
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                            <Sparkles className="w-5 h-5 opacity-50" />
                        </div>
                    </div>
                ) : (
                     <div className="relative animate-in fade-in slide-in-from-bottom-2">
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder={contentType === 'product' ? "Paste product description, specs, and features here..." : "Paste your article text, summary, or notes here..."}
                            className="w-full h-40 bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-2xl px-6 py-5 text-base text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500/70 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono transition-all shadow-inner resize-none leading-relaxed"
                        />
                        <div className="absolute right-4 bottom-4 pointer-events-none text-slate-400 dark:text-slate-500">
                             <AlignLeft className="w-5 h-5 opacity-50" />
                        </div>
                    </div>
                )}
                
                {/* Information about source content */}
                <div className="flex gap-3 items-start px-2 py-1">
                    <div className="mt-0.5 text-emerald-500/60"><AlertCircle className="w-3.5 h-3.5" /></div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug font-medium">
                       <span className="text-emerald-600 dark:text-emerald-500/80 font-bold">Tip:</span> 
                       {contentType === 'product' 
                         ? " For products, try 'E-commerce Showcase' style. The AI will look for specs, features, and pricing info." 
                         : " Provide a full URL to an article or paste comprehensive text. The AI will analyze the structure to pull out key facts."}
                    </p>
                </div>
            </div>

            {/* Middle Section: Style, Language, and Reference Image */}
            <div className="space-y-6">
                
                {/* Style & Language Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Style Selector */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm text-emerald-600 dark:text-emerald-400 font-mono tracking-wider flex items-center gap-2 font-bold">
                                <Palette className="w-4 h-4" /> ARTISTIC_STYLE
                            </label>
                            
                            {/* Aspect Ratio Selector */}
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 rounded-lg p-1">
                                {ASPECT_RATIOS.map(ratio => (
                                    <button
                                        key={ratio.value}
                                        type="button"
                                        onClick={() => setSelectedRatio(ratio.value)}
                                        className={`p-1 rounded-md transition-all ${
                                            selectedRatio === ratio.value
                                            ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                        }`}
                                        title={ratio.label}
                                    >
                                        <ratio.icon className="w-3.5 h-3.5" />
                                    </button>
                                ))}
                             </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            {SKETCH_STYLES.map(style => (
                                <button
                                    key={style}
                                    type="button"
                                    onClick={() => setSelectedStyle(style)}
                                    className={`py-2 px-3 rounded-xl font-mono text-sm transition-all border whitespace-nowrap truncate font-medium ${
                                        selectedStyle === style 
                                        ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30' 
                                        : 'bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 border-transparent dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:text-slate-900 dark:hover:text-slate-200'
                                    }`}
                                >
                                    {style}
                                </button>
                            ))}
                        </div>
                        {selectedStyle === 'Custom' && (
                            <div className="space-y-2">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        value={customStyle}
                                        onChange={(e) => setCustomStyle(e.target.value)}
                                        placeholder="Describe custom style..."
                                        className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl pl-4 pr-32 py-2 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleImprovePrompt}
                                        disabled={improvingPrompt || !customStyle.trim()}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold font-mono transition-all hover:bg-emerald-200 dark:hover:bg-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-200 dark:border-emerald-500/20"
                                        title="Enhance prompt with AI"
                                    >
                                        {improvingPrompt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                                        <span>AI Enhance</span>
                                    </button>
                                </div>
                                
                                {/* AI Suggestion Box */}
                                {suggestedPrompt && (
                                    <div className="w-full bg-emerald-5 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-lg p-3 animate-in fade-in slide-in-from-top-1">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-2">
                                                <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" />
                                                <div>
                                                    <p className="text-xs text-emerald-600 dark:text-emerald-300 font-bold uppercase mb-1">AI Enhanced Prompt</p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">{suggestedPrompt}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 shrink-0">
                                                <button 
                                                    type="button"
                                                    onClick={acceptSuggestion}
                                                    className="p-1 bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/40 text-emerald-700 dark:text-emerald-200 rounded transition-colors"
                                                    title="Use this prompt"
                                                >
                                                    <Check className="w-3 h-3" />
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => setSuggestedPrompt(null)}
                                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors"
                                                    title="Dismiss"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* Information about style */}
                        <div className="flex gap-2 items-start px-1 pt-2">
                            <div className="mt-0.5 text-emerald-500/40"><AlertCircle className="w-3 h-3" /></div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug font-medium">
                            Select a preset style or use "Custom" to describe a specific artistic direction.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Language & Visual Reference */}
                    <div className="space-y-6">
                        {/* Language Selector */}
                        <div className="space-y-4">
                            <label className="text-sm text-emerald-600 dark:text-emerald-400 font-mono tracking-wider flex items-center gap-2 font-bold">
                                <Globe className="w-4 h-4" /> OUTPUT_LANGUAGE
                            </label>
                            <div className="relative w-full">
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-base text-slate-900 dark:text-slate-200 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono appearance-none cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors truncate pr-8 font-medium"
                                >
                                    {LANGUAGES.map((lang) => (
                                        <option key={lang.value} value={lang.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-300">
                                            {lang.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                         {/* Reference Image Uploader */}
                         <div className="space-y-4">
                            <label className="text-sm text-emerald-600 dark:text-emerald-400 font-mono tracking-wider flex items-center gap-2 font-bold">
                                <ScanEye className="w-4 h-4" /> STYLE_EXTRACTOR <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-1.5 rounded ml-auto">CSS ONLY</span>
                            </label>
                            
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative w-full h-32 rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-2 group ${referenceImage ? 'border-emerald-400 dark:border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                            >
                                {referenceImage ? (
                                    <>
                                        <img src={`data:${referenceImage.mimeType};base64,${referenceImage.data}`} className="absolute inset-0 w-full h-full object-cover opacity-50" alt="Reference" />
                                        <div className="relative z-10 bg-black/60 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono font-bold backdrop-blur-sm">
                                            <Check className="w-3 h-3" /> Image Loaded
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setReferenceImage(null); }}
                                            className="absolute top-2 right-2 p-1.5 bg-red-500/80 text-white rounded-md hover:bg-red-600 transition-colors z-20"
                                            title="Remove image"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg group-hover:scale-110 transition-transform">
                                            <Upload className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Upload screenshot</p>
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Extracts colors & branding only</p>
                                            <p className="text-[9px] text-slate-400/70 dark:text-slate-500/70 mt-1 uppercase tracking-wider">(No content analysis)</p>
                                        </div>
                                    </>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleFileChange} 
                                    className="hidden" 
                                    accept="image/png, image/jpeg, image/webp" 
                                />
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            <button
                type="submit"
                disabled={loading || (inputMode === 'url' && !urlInput.trim()) || (inputMode === 'text' && !textInput.trim())}
                className="w-full py-5 bg-emerald-100 dark:bg-emerald-500/10 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 font-mono text-lg tracking-wider hover:shadow-lg dark:hover:shadow-neon-emerald"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                {loading ? "PROCESSING..." : contentType === 'product' ? "GENERATE_PRODUCT_SHEET" : "GENERATE_INFOGRAPHIC"}
            </button>
         </form>
      </div>

      {error && (
        <div className="glass-panel border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 animate-in fade-in font-mono text-base bg-red-50/50 dark:bg-transparent">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <LoadingState message={loadingStage || 'READING_CONTENT'} type="article" />
      )}

      {/* Result Section */}
      {imageData && !loading && (
        <div className="glass-panel rounded-3xl p-4 md:p-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-8 bg-white/60 dark:bg-slate-900/60">
            <div className="glass-panel rounded-2xl p-1.5 border border-slate-200 dark:border-white/5 bg-white/30 dark:bg-slate-900/30">
                <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/5 mb-1.5 bg-slate-50/50 dark:bg-slate-950/30 rounded-t-2xl">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> Generated_Result
                    </h3>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setFullScreenImage({src: `data:image/png;base64,${imageData}`, alt: "Article Sketch"})}
                            className="text-xs flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-mono p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                            title="Full Screen"
                        >
                            <Maximize className="w-4 h-4" />
                        </button>
                        <a href={`data:image/png;base64,${imageData}`} download="site-sketch.png" className="text-xs flex items-center gap-2 text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200 transition-colors font-mono bg-emerald-100 dark:bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-500/20 font-bold hover:bg-emerald-200 dark:hover:bg-emerald-500/20">
                            <Download className="w-4 h-4" /> DOWNLOAD_PNG
                        </a>
                    </div>
                </div>
                <div className="rounded-2xl overflow-hidden bg-[#eef8fe] relative group border border-slate-200 dark:border-slate-800">
                    {selectedStyle === "Dark Mode Tech" && <div className="absolute inset-0 bg-slate-950 pointer-events-none mix-blend-multiply" />}
                    <div className="absolute inset-0 bg-slate-900/10 dark:bg-slate-950/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <img src={`data:image/png;base64,${imageData}`} alt="Generated Infographic" className="w-full h-auto object-contain max-h-[800px] mx-auto relative z-10" />
                </div>
            </div>

             {/* Featured Citations Section */}
            {citations.length > 0 && (
                <div className="px-6 py-8 border-t border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                            <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-wide font-mono">
                                Grounding Sources
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Verified citations from analysis</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {citations.map((cite, idx) => {
                            const hostname = getHostname(cite.uri);
                            
                            return (
                                <a 
                                    key={idx} 
                                    href={cite.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex flex-col justify-between p-4 bg-white dark:bg-slate-950/50 hover:bg-emerald-50 dark:hover:bg-emerald-500/5 border border-slate-200 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30 rounded-xl transition-all group relative overflow-hidden h-full shadow-sm hover:shadow-md"
                                    title={cite.title || cite.uri}
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                         <div className="flex-shrink-0 w-8 h-8 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors border border-slate-200 dark:border-white/5">
                                            <Globe className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-base font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-100 line-clamp-2 leading-snug transition-colors">
                                                {cite.title || "Web Source"}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-500 truncate font-mono mt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400/70 transition-colors">
                                                {hostname}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-white/5 group-hover:border-emerald-200 dark:group-hover:border-emerald-500/10 transition-colors">
                                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono uppercase tracking-wider group-hover:text-emerald-600 dark:group-hover:text-emerald-500/50">Verified Link</span>
                                        <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-600 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-all transform group-hover:translate-x-1" />
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </div>
            )}
            
            <MetadataEditor 
              initialData={metadata} 
              onChange={setMetadata} 
            />
        </div>
      )}
      
      {/* History Section */}
      {history.length > 0 && (
          <div className="pt-12 border-t border-slate-200 dark:border-white/10 animate-in fade-in">
              <div className="flex items-center gap-2 mb-6 text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4" />
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold">Recent Sketches</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {history.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => loadFromHistory(item)}
                        className="group bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-500/50 rounded-xl overflow-hidden text-left transition-all hover:shadow-lg dark:hover:shadow-neon-emerald hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                          <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-950">
                              <img src={`data:image/png;base64,${item.imageData}`} alt={item.title} className="w-full h-full object-cover opacity-90 dark:opacity-70 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="p-3">
                              <p className="text-sm font-bold text-slate-900 dark:text-white truncate font-mono">{item.title}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate font-medium">{getHostname(item.url)}</p>
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default ArticleToInfographic;
