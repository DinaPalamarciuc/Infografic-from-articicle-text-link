/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef } from 'react';
import { generateArticleInfographic, improvePrompt } from '../services/geminiService';
import { Citation, ArticleHistoryItem, ImageMetadata } from '../types';
import { Link, Loader2, Download, Sparkles, AlertCircle, Palette, Globe, ExternalLink, BookOpen, Clock, Maximize, AlignLeft, Wand2, Check, X, ShoppingBag, FileText as FileIcon, Upload, Image as ImageIcon, Trash2, RectangleHorizontal, RectangleVertical, Square, ScanEye, Box } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<string>('');
  
  const [improvingPrompt, setImprovingPrompt] = useState(false);
  const [suggestedPrompt, setSuggestedPrompt] = useState<string | null>(null);

  const [infographicData, setInfographicData] = useState<string | null>(null);
  const [citations, setCitations] = useState<Citation[]>([]);
  
  // Reference Image State
  const [referenceImage, setReferenceImage] = useState<{ data: string, mimeType: string } | null>(null);
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

  const [fullScreenImage, setFullScreenImage] = useState<{src: string, alt: string} | null>(null);

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

  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (!file.type.startsWith('image/')) {
              setError("Please upload a valid image file (JPG/PNG).");
              return;
          }
          // Max size check (e.g., 4MB)
          if (file.size > 4 * 1024 * 1024) {
              setError("Image is too large. Please use an image under 4MB.");
              return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
              const base64 = reader.result as string;
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
    setError(null);
    setInfographicData(null);
    setCitations([]);

    const content = inputMode === 'url' ? urlInput.trim() : textInput.trim();

    if (!content) {
      setError(inputMode === 'url' ? 'Please enter a valid URL.' : 'Please enter the text content.');
      return;
    }

    if (inputMode === 'url') {
        try {
            new URL(content);
        } catch {
            setError('Please enter a valid URL (including http:// or https://).');
            return;
        }
    }

    setLoading(true);
    setLoadingStage('ANALYZING SOURCE CONTENT');
    
    const title = inputMode === 'url' ? new URL(content).hostname : (content.slice(0, 30) + '...');
    
    setMetadata(prev => ({
        ...prev,
        title: `${title} Infographic`,
        description: `Infographic generated from ${inputMode === 'url' ? content : 'text content'}`,
        keywords: `infographic, ${contentType}, ${title}`,
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
          selectedRatio
      );

      if (result.imageData) {
        setInfographicData(result.imageData);
        setCitations(result.citations);
        
        onAddToHistory({
            id: Date.now().toString(),
            title: title,
            url: inputMode === 'url' ? content : 'Text Input',
            imageData: result.imageData,
            citations: result.citations,
            date: new Date()
        });
      } else {
        throw new Error('Failed to generate image.');
      }
    } catch (err: any) {
        console.error(err);
        const errorMessage = err.message || '';
        if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("403")) {
            setError("Access Denied: The API key is missing required permissions or billing. Please switch to a paid API Key.");
        } else if (errorMessage.includes("safety")) {
            setError("The content was flagged by safety filters. Please try different content.");
        } else {
            setError('An unexpected error occurred. Please check the URL/Text and try again.');
        }
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const loadFromHistory = (item: ArticleHistoryItem) => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setInfographicData(item.imageData);
      setCitations(item.citations);
      setUrlInput(item.url.startsWith('http') ? item.url : '');
      setTextInput(!item.url.startsWith('http') ? 'Loaded from history' : '');
      
      setMetadata(prev => ({
          ...prev,
          title: item.title,
          description: `History item: ${item.title}`,
          date: item.date.toISOString().slice(0, 16)
      }));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 mb-20">
      
      {fullScreenImage && (
          <ImageViewer 
            src={fullScreenImage.src} 
            alt={fullScreenImage.alt} 
            onClose={() => setFullScreenImage(null)} 
          />
      )}

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans leading-tight drop-shadow-sm dark:drop-shadow-lg">
          Web <span className="text-emerald-500 dark:text-emerald-400">Visualizer</span>.
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-xl md:text-2xl font-light tracking-wide">
          Convert articles, blogs, and product pages into beautiful infographics.
        </p>

        {/* Informational Guide */}
        <div className="bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-4 text-left max-w-2xl mx-auto flex items-start gap-3 shadow-sm">
             <BookOpen className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
             <div className="space-y-1">
                 <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 font-mono">How to use SiteSketch</h3>
                 <ul className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed list-disc list-inside space-y-1">
                     <li><strong>Article Mode:</strong> Summarizes key takeaways from long blog posts or news.</li>
                     <li><strong>Product Mode:</strong> Extracts specs, features, and pros/cons for e-commerce.</li>
                     <li><strong>Style Extractor:</strong> Upload a screenshot to mimic a brand's color palette.</li>
                 </ul>
             </div>
         </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-8 items-start relative z-10">
        {/* Input Column */}
        <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleGenerate} className="glass-panel rounded-3xl p-5 space-y-6 bg-white/60 dark:bg-slate-900/60">
                
                {/* Input Mode Toggle */}
                <div className="flex p-1 bg-slate-100 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-white/10">
                    <button
                        type="button"
                        onClick={() => setInputMode('url')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold font-mono transition-all ${inputMode === 'url' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        <Link className="w-4 h-4" /> URL Link
                    </button>
                    <button
                        type="button"
                        onClick={() => setInputMode('text')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold font-mono transition-all ${inputMode === 'text' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                    >
                        <AlignLeft className="w-4 h-4" /> Raw Text
                    </button>
                </div>

                {/* Content Type Toggle */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-500 dark:text-slate-400 font-mono ml-1 font-bold">Content Type</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setContentType('article')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${contentType === 'article' ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <FileIcon className="w-5 h-5" />
                            <span className="text-xs font-bold">Article / Blog</span>
                        </button>
                         <button
                            type="button"
                            onClick={() => setContentType('product')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${contentType === 'product' ? 'bg-blue-50 dark:bg-blue-500/20 border-blue-500/50 text-blue-700 dark:text-blue-300' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        >
                            <ShoppingBag className="w-5 h-5" />
                            <span className="text-xs font-bold">Product Page</span>
                        </button>
                    </div>
                </div>

                {/* Main Input */}
                <div className="space-y-2">
                    <label className="text-sm text-slate-500 dark:text-slate-400 font-mono ml-1 font-bold">Source Content</label>
                    {inputMode === 'url' ? (
                        <div className="relative group">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                                <Globe className="w-5 h-5" />
                            </div>
                            <input
                                type="url"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                placeholder="https://example.com/article"
                                className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3.5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-mono text-sm"
                            />
                        </div>
                    ) : (
                        <textarea
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Paste article text or product description here..."
                            rows={6}
                            className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl p-4 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all font-mono text-sm resize-none"
                        />
                    )}
                </div>

                {/* Reference Image Upload */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
                     <div className="flex items-center justify-between">
                        <label className="text-sm text-slate-500 dark:text-slate-400 font-mono ml-1 font-bold flex items-center gap-1.5">
                            <ScanEye className="w-4 h-4" /> Style Extractor (CSS Only)
                        </label>
                        {referenceImage && (
                            <button 
                                type="button" 
                                onClick={() => { setReferenceImage(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                                <Trash2 className="w-3 h-3" /> Remove
                            </button>
                        )}
                     </div>
                     
                     <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 relative overflow-hidden group ${referenceImage ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-slate-300 dark:border-white/10 text-slate-400'}`}
                     >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleReferenceUpload} 
                            accept="image/png, image/jpeg" 
                            className="hidden" 
                        />
                        
                        {referenceImage ? (
                            <div className="relative w-full h-32">
                                <img src={`data:${referenceImage.mimeType};base64,${referenceImage.data}`} alt="Reference" className="w-full h-full object-cover rounded-lg opacity-60 group-hover:opacity-40 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded shadow-lg">Image Loaded</span>
                                </div>
                            </div>
                        ) : (
                            <div className="py-4 space-y-2">
                                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Upload Reference Screenshot</p>
                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-[200px] mx-auto">
                                        AI will match colors & fonts. <span className="text-red-400">Logos and UI elements are ignored.</span>
                                    </p>
                                </div>
                            </div>
                        )}
                     </div>
                </div>

                {/* Design Controls */}
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-white/10">
                    <label className="text-sm text-slate-500 dark:text-slate-400 font-mono ml-1 font-bold flex items-center gap-2">
                        <Palette className="w-4 h-4" /> Design Configuration
                    </label>

                    {/* Language & Ratio Row */}
                    <div className="grid grid-cols-2 gap-3">
                         <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold ml-1">Language</span>
                            <div className="relative">
                                <select
                                    value={selectedLanguage}
                                    onChange={(e) => setSelectedLanguage(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-lg py-2 pl-3 pr-8 text-xs font-mono text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-emerald-500/50"
                                >
                                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold ml-1">Aspect Ratio</span>
                            <div className="relative">
                                <select
                                    value={selectedRatio}
                                    onChange={(e) => setSelectedRatio(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-lg py-2 pl-3 pr-8 text-xs font-mono text-slate-700 dark:text-slate-300 focus:ring-1 focus:ring-emerald-500/50"
                                >
                                    {ASPECT_RATIOS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {SKETCH_STYLES.map((style) => (
                            <button
                                key={style}
                                type="button"
                                onClick={() => setSelectedStyle(style)}
                                className={`px-2 py-2 rounded-lg text-xs font-mono text-center transition-all border ${
                                    selectedStyle === style
                                        ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 font-bold shadow-sm'
                                        : 'bg-slate-50 dark:bg-slate-800/30 border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-white/10'
                                }`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>

                    {selectedStyle === 'Custom' && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={customStyle}
                                    onChange={(e) => setCustomStyle(e.target.value)}
                                    placeholder="Describe custom style..."
                                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-xl pl-4 pr-32 py-3 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 font-mono text-sm transition-all"
                                />
                                <div className="absolute right-1.5 top-1.5 bottom-1.5">
                                    <button
                                        type="button"
                                        onClick={handleImprovePrompt}
                                        disabled={improvingPrompt || !customStyle.trim()}
                                        className="h-full px-3 bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {improvingPrompt ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <Wand2 className="w-3 h-3" />
                                        )}
                                        AI Enhance
                                    </button>
                                </div>
                            </div>
                            
                            {/* NEW: Informational Tip for Prompt Enhancement */}
                            <div className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 bg-violet-50 dark:bg-violet-900/10 p-3 rounded-xl border border-violet-100 dark:border-violet-500/10">
                                <Sparkles className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                                <span className="leading-relaxed"><strong className="text-violet-600 dark:text-violet-300">Pro Tip:</strong> Type a rough idea (e.g., "minimalist blue") and click <strong>AI Enhance</strong> to let Gemini rewrite it into a professional image generation prompt.</span>
                            </div>

                            {suggestedPrompt && (
                                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl p-3 flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Suggestion</p>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 italic">{suggestedPrompt}</p>
                                    </div>
                                    <div className="flex flex-col gap-1 shrink-0">
                                        <button 
                                            type="button"
                                            onClick={acceptSuggestion}
                                            className="p-1.5 bg-emerald-100 dark:bg-emerald-500/20 hover:bg-emerald-200 dark:hover:bg-emerald-500/40 text-emerald-700 dark:text-emerald-200 rounded transition-colors"
                                        >
                                            <Check className="w-3 h-3" />
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setSuggestedPrompt(null)}
                                            className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded transition-colors"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed group border border-transparent dark:border-white/10"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 text-emerald-400 dark:text-emerald-600 group-hover:rotate-12 transition-transform" /> GENERATE INFOGRAPHIC</>}
                </button>
            </form>

            {error && (
                <div className="p-4 glass-panel border-red-500/30 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-2 font-mono text-sm bg-red-50/50 dark:bg-transparent shadow-lg">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{error}</span>
                </div>
            )}
        </div>

        {/* Output Column */}
        <div className="lg:col-span-3 min-h-[500px] flex flex-col">
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center glass-panel rounded-3xl">
                     <LoadingState message={loadingStage} type="article" />
                </div>
            ) : infographicData ? (
                <div className="flex-1 glass-panel rounded-3xl p-6 bg-white/60 dark:bg-slate-900/60 animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                         <div className="flex items-center gap-2">
                             <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                                 <ImageIcon className="w-5 h-5" />
                             </div>
                             <div>
                                 <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans">Generated Infographic</h3>
                                 <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                     {new Date().toLocaleTimeString()} • {selectedRatio}
                                 </p>
                             </div>
                         </div>
                         <div className="flex items-center gap-2">
                             <button 
                                onClick={() => setFullScreenImage({src: `data:image/png;base64,${infographicData}`, alt: "Result"})}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors"
                                title="Fullscreen"
                             >
                                 <Maximize className="w-5 h-5" />
                             </button>
                             <a 
                                href={`data:image/png;base64,${infographicData}`} 
                                download="infographic.png"
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-bold text-sm transition-all flex items-center gap-2 shadow-lg hover:shadow-emerald-500/20"
                             >
                                 <Download className="w-4 h-4" /> Download
                             </a>
                         </div>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 group bg-slate-100 dark:bg-slate-950">
                        <img 
                            src={`data:image/png;base64,${infographicData}`} 
                            alt="Generated Infographic" 
                            className="w-full h-auto object-contain"
                        />
                    </div>

                    {citations.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-950/50 rounded-xl p-4 border border-slate-200 dark:border-white/5">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 font-mono mb-3 flex items-center gap-2">
                                <BookOpen className="w-4 h-4" /> Sources & Citations
                            </h4>
                            <div className="grid gap-2">
                                {citations.map((c, i) => (
                                    <a key={i} href={c.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors truncate">
                                        <ExternalLink className="w-3 h-3 shrink-0" />
                                        <span className="truncate">{c.title || c.uri}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Metadata Editor Integration */}
                    <MetadataEditor initialData={metadata} onChange={setMetadata} />
                </div>
            ) : (
                <div className="flex-1 glass-panel rounded-3xl flex flex-col items-center justify-center p-8 text-center border-dashed border-2 border-slate-300 dark:border-white/10 bg-white/40 dark:bg-slate-900/40">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <FileIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2 font-sans">Ready to Create</h3>
                    <p className="text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                        Enter a URL or paste text on the left to generate a professional infographic.
                    </p>
                </div>
            )}
        </div>
      </div>

      {/* History Grid */}
      {history.length > 0 && (
          <div className="pt-12 border-t border-slate-200 dark:border-white/10 animate-in fade-in">
              <div className="flex items-center gap-2 mb-6 text-slate-500 dark:text-slate-400">
                  <Clock className="w-4 h-4" />
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold">Recent Sketches</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {history.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => loadFromHistory(item)}
                        className="group bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:border-emerald-500/50 rounded-xl overflow-hidden text-left transition-all hover:shadow-lg dark:hover:shadow-neon-emerald hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                          <div className="aspect-[3/4] relative overflow-hidden bg-slate-100 dark:bg-slate-950">
                              <img src={`data:image/png;base64,${item.imageData}`} alt={item.title} className="w-full h-full object-cover opacity-90 dark:opacity-70 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="p-3">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate font-mono">{item.title}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium truncate">{new Date(item.date).toLocaleDateString()}</p>
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