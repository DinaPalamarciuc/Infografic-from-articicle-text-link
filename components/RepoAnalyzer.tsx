
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { fetchRepoFileTree } from '../services/githubService';
import { generateInfographic, improvePrompt, extractImageMetadata } from '../services/geminiService';
import { downloadWithMetadata } from '../services/imageService';
import { RepoFileTree, ViewMode, RepoHistoryItem, ImageMetadata, GeminiModel } from '../types';
import { 
  ShieldAlert, 
  Loader2, 
  Layers, 
  Box, 
  Download, 
  Sparkles, 
  Command, 
  Palette, 
  Globe, 
  Clock, 
  Maximize, 
  KeyRound, 
  Wand2, 
  Check, 
  X, 
  RectangleHorizontal, 
  RectangleVertical, 
  Square, 
  HelpCircle, 
  Code,
  ArrowRight,
  GitBranch,
  Cpu,
  Zap,
  MousePointer2,
  Eye,
  History
} from 'lucide-react';
import { LoadingState } from './LoadingState';
import ImageViewer from './ImageViewer';
import MetadataEditor from './MetadataEditor';

interface RepoAnalyzerProps {
  onNavigate: (mode: ViewMode, data?: any) => void;
  history: RepoHistoryItem[];
  onAddToHistory: (item: RepoHistoryItem) => void;
  hasApiKey: boolean;
  onShowKeyModal: () => void;
  model: GeminiModel;
}

const FLOW_STYLES = [
    "Modern Data Flow",
    "Hand-Drawn Blueprint",
    "Corporate Minimal",
    "Neon Cyberpunk",
    "Custom"
];

const ASPECT_RATIOS = [
    { label: "Wide (16:9)", value: "16:9", icon: RectangleHorizontal },
    { label: "Square (1:1)", value: "1:1", icon: Square },
    { label: "Tall (9:16)", value: "9:16", icon: RectangleVertical },
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

const RepoAnalyzer: React.FC<RepoAnalyzerProps> = ({ onNavigate, history, onAddToHistory, hasApiKey, onShowKeyModal, model }) => {
  const [repoInput, setRepoInput] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(FLOW_STYLES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].value);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0].value);
  const [customStyle, setCustomStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<string>('');
  
  const [infographicData, setInfographicData] = useState<string | null>(null);
  const [infographic3DData, setInfographic3DData] = useState<string | null>(null);
  const [generating3D, setGenerating3D] = useState(false);
  const [currentFileTree, setCurrentFileTree] = useState<RepoFileTree[] | null>(null);
  const [currentRepoName, setCurrentRepoName] = useState<string>('');
  const [show3DMode, setShow3DMode] = useState(false);
  
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
    const draft = localStorage.getItem('l2i_repo_draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.repoInput !== undefined) setRepoInput(parsed.repoInput);
        if (parsed.selectedStyle !== undefined) setSelectedStyle(parsed.selectedStyle);
        if (parsed.selectedLanguage !== undefined) setSelectedLanguage(parsed.selectedLanguage);
        if (parsed.selectedRatio !== undefined) setSelectedRatio(parsed.selectedRatio);
        if (parsed.customStyle !== undefined) setCustomStyle(parsed.customStyle);
      } catch (e) { console.error("Failed to load repo draft", e); }
    }
  }, []);

  // Save Draft on Change
  useEffect(() => {
    const draft = {
      repoInput,
      selectedStyle,
      selectedLanguage,
      selectedRatio,
      customStyle
    };
    localStorage.setItem('l2i_repo_draft', JSON.stringify(draft));
  }, [repoInput, selectedStyle, selectedLanguage, selectedRatio, customStyle]);

  const parseRepoInput = (input: string): { owner: string, repo: string } | null => {
    const cleanInput = input.trim().replace(/\/$/, '');
    try {
      const url = new URL(cleanInput);
      if (url.hostname === 'github.com') {
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length >= 2) return { owner: parts[0], repo: parts[1] };
      }
    } catch (e) { }
    const parts = cleanInput.split('/');
    if (parts.length === 2 && parts[0] && parts[1]) return { owner: parts[0], repo: parts[1] };
    return null;
  };

  const addToHistory = (repoName: string, imageData: string, is3D: boolean, style: string) => {
     const newItem: RepoHistoryItem = {
         id: Date.now().toString(),
         repoName,
         imageData,
         is3D,
         style,
         date: new Date()
     };
     onAddToHistory(newItem);
  };

  const handleApiError = (err: any) => {
      const errorMessage = typeof err === 'string' ? err : (err.message || JSON.stringify(err));
      console.error("Analysis Error:", err);

      if (errorMessage.includes("Requested entity was not found") || 
          errorMessage.includes("403") || 
          errorMessage.includes("PERMISSION_DENIED") ||
          errorMessage.includes("permission")) {
          
          setError("Access Denied: The current API key lacks permissions or billing. You MUST select a key from a paid Google Cloud Project.");
          onShowKeyModal();
          return;
      }

      if (errorMessage.toLowerCase().includes("rate limit")) {
          setError("GitHub API Rate Limit Exceeded. Please try again in ~60 minutes.");
          return;
      }

      setError(errorMessage || 'An unexpected error occurred. Please try again.');
  }

  const handleAnalyze = async (e?: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    setError(null);

    if (!hasApiKey) {
        onShowKeyModal();
        return;
    }

    setInfographicData(null);
    setInfographic3DData(null);
    setCurrentFileTree(null);
    setShow3DMode(false);

    const inputToUse = overrideInput || repoInput;
    const repoDetails = parseRepoInput(inputToUse);

    if (!repoDetails) {
      setError('Invalid format. Use "owner/repo" or a full GitHub URL.');
      return;
    }

    if (overrideInput) setRepoInput(overrideInput);

    setLoading(true);
    setCurrentRepoName(repoDetails.repo);
    
    try {
      setLoadingStage('CONNECTING TO GITHUB');
      const fileTree = await fetchRepoFileTree(repoDetails.owner, repoDetails.repo);

      if (fileTree.length === 0) throw new Error('No relevant code files found.');
      setCurrentFileTree(fileTree);

      setLoadingStage('ARCHITECTURAL SYNTHESIS');
      
      const styleToUse = selectedStyle === 'Custom' ? customStyle : selectedStyle;

      const infographicBase64 = await generateInfographic(repoDetails.repo, fileTree, styleToUse, false, selectedLanguage, selectedRatio, model);
      
      if (infographicBase64) {
        setInfographicData(infographicBase64);
        addToHistory(repoDetails.repo, infographicBase64, false, styleToUse);
        
        setLoadingStage('OPTIMIZING SEO METADATA');
        const aiMeta = await extractImageMetadata(infographicBase64, 'image/png', `GitHub Repository: ${repoDetails.owner}/${repoDetails.repo}`, 'gemini-3-flash-preview');

        setMetadata({
            title: aiMeta.title || `${repoDetails.repo} - Architectural Blueprint`,
            author: repoDetails.owner,
            description: aiMeta.description || `Visual mapping of ${repoDetails.owner}/${repoDetails.repo} structure.`,
            keywords: aiMeta.keywords || `github, architecture, ${repoDetails.repo}`,
            copyright: `© ${new Date().getFullYear()} ${repoDetails.owner}`,
            date: new Date().toISOString().slice(0, 16)
        });
      } else {
          throw new Error("Failed to generate blueprint.");
      }

    } catch (err: any) {
      handleApiError(err);
    } finally {
      setLoading(false);
      setLoadingStage('');
    }
  };

  const handleGenerate3D = async () => {
    if (!currentFileTree || !currentRepoName) return;
    if (!hasApiKey) {
        onShowKeyModal();
        return;
    }

    setGenerating3D(true);
    try {
      const styleToUse = selectedStyle === 'Custom' ? customStyle : selectedStyle;
      const data = await generateInfographic(currentRepoName, currentFileTree, styleToUse, true, selectedLanguage, selectedRatio, model);
      if (data) {
          setInfographic3DData(data);
          setShow3DMode(true);
          addToHistory(currentRepoName, data, true, styleToUse);
          
          const aiMeta = await extractImageMetadata(data, 'image/png', `3D Holographic Model of ${currentRepoName} repo`, 'gemini-3-flash-preview');
          setMetadata(prev => ({
              ...prev,
              title: aiMeta.title || `${currentRepoName} - 3D Model`,
              description: aiMeta.description || prev.description,
              keywords: aiMeta.keywords || prev.keywords
          }));
      }
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setGenerating3D(false);
    }
  };

  const handleDownload = () => {
      const data = show3DMode ? infographic3DData : infographicData;
      if (!data) return;
      const safeTitle = (metadata.title || currentRepoName).replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${safeTitle}.png`;
      downloadWithMetadata(data, metadata, filename);
  };

  const currentImg = show3DMode ? infographic3DData : infographicData;

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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 rounded-full text-[10px] font-bold text-violet-500 uppercase tracking-[0.2em] mb-2 animate-pulse">
            Architectural Engine v3.1
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          GitFlow <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-indigo-400">Intelligence</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg font-light leading-relaxed">
          Map repository hierarchies and logic flows into high-fidelity <strong className="text-violet-500">Architectural Blueprints</strong>.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-10 items-stretch">
        {/* Left: Input Panel */}
        <div className="lg:col-span-4 flex flex-col space-y-8">
            <div className="glass-panel p-8 rounded-[40px] bg-white/60 dark:bg-slate-900/60 shadow-xl border border-slate-200 dark:border-white/10 space-y-8">
                {/* Repo Input */}
                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Remote Repository</label>
                    <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3 shadow-inner focus-within:ring-2 ring-violet-500 transition-all">
                        <Command className="w-5 h-5 text-slate-400 mr-3" />
                        <input
                            type="text"
                            value={repoInput}
                            onChange={(e) => setRepoInput(e.target.value)}
                            placeholder="owner/repo (e.g. facebook/react)"
                            className="w-full bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-0 font-mono text-sm outline-none"
                        />
                    </div>
                </div>

                {/* Quick Samples */}
                <div className="space-y-3">
                    <div className="flex items-center gap-1.5 ml-1">
                         <Sparkles className="w-3 h-3 text-violet-500" />
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Benchmarking Hub</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                         <button onClick={() => handleAnalyze(undefined, "facebook/react")} className="text-[10px] px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-violet-500/10 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-white/5 transition-all font-bold">facebook/react</button>
                         <button onClick={() => handleAnalyze(undefined, "vercel/next.js")} className="text-[10px] px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-violet-500/10 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-white/5 transition-all font-bold">vercel/next.js</button>
                    </div>
                </div>

                {/* Style Picker */}
                <div className="space-y-3">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Visualization Engine</label>
                     <div className="grid grid-cols-2 gap-3">
                         {FLOW_STYLES.map(style => (
                             <button
                                key={style}
                                onClick={() => setSelectedStyle(style)}
                                className={`text-[10px] px-3 py-3 rounded-xl font-bold transition-all text-left uppercase tracking-tighter border ${
                                    selectedStyle === style 
                                    ? 'bg-violet-500 border-violet-500 text-white shadow-lg' 
                                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-white/5 text-slate-500 hover:border-violet-500/30'
                                }`}
                             >
                                 {style}
                             </button>
                         ))}
                     </div>
                </div>

                {/* Format Picker */}
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Aspect Ratio</label>
                    <div className="flex gap-3">
                        {ASPECT_RATIOS.map(ratio => (
                            <button
                                key={ratio.value}
                                onClick={() => setSelectedRatio(ratio.value)}
                                className={`flex-1 p-3 rounded-xl transition-all flex justify-center border ${
                                    selectedRatio === ratio.value
                                    ? 'bg-white dark:bg-slate-800 text-violet-500 border-violet-500/30 shadow-lg ring-1 ring-violet-500/10'
                                    : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-white/5 text-slate-400'
                                }`}
                                title={ratio.label}
                            >
                                <ratio.icon className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                 </div>

                 <button
                    disabled={loading || !repoInput.trim()}
                    onClick={() => handleAnalyze()}
                    className="w-full py-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[24px] font-bold flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.98] group"
                >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <>GENERATE BLUEPRINT <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>}
                </button>
                
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-500/20 rounded-2xl text-[11px] text-red-600 dark:text-red-400 font-mono leading-relaxed animate-in slide-in-from-top-2">
                        <ShieldAlert className="w-4 h-4 mb-2" />
                        {error}
                    </div>
                )}
            </div>
        </div>

        {/* Right: Output Pane */}
        <div className="lg:col-span-8 min-h-[600px] flex flex-col">
            {loading ? (
                 <div className="flex-1 flex flex-col items-center justify-center glass-panel rounded-[40px] bg-white/40 dark:bg-slate-900/40 border-2 border-dashed border-violet-500/20">
                     <LoadingState message={loadingStage} type="repo" />
                </div>
            ) : currentImg ? (
                 <div className="flex-1 glass-panel p-8 rounded-[40px] flex flex-col bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95">
                      <div className="flex items-center justify-between mb-8 border-b border-slate-100 dark:border-white/5 pb-6">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                                 <Cpu className="w-5 h-5 text-violet-500" />
                             </div>
                             <div>
                                 <h3 className="text-sm font-bold uppercase tracking-widest text-slate-800 dark:text-white">{currentRepoName}_Export</h3>
                                 <p className="text-[10px] text-slate-500 font-mono">STYLE: {selectedStyle} • RATIO: {selectedRatio}</p>
                             </div>
                         </div>
                         <div className="flex items-center gap-2">
                             {infographicData && !infographic3DData && !generating3D && (
                                <button 
                                  onClick={handleGenerate3D}
                                  className="px-4 py-2 bg-fuchsia-500 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-lg"
                                >
                                  <Box className="w-4 h-4" /> Render 3D
                                </button>
                             )}
                             {infographic3DData && (
                                 <div className="flex p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-white/5 mr-2">
                                     <button onClick={() => setShow3DMode(false)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${!show3DMode ? 'bg-white dark:bg-slate-800 text-violet-500 shadow-md' : 'text-slate-400'}`}>2D</button>
                                     <button onClick={() => setShow3DMode(true)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${show3DMode ? 'bg-white dark:bg-slate-800 text-violet-500 shadow-md' : 'text-slate-400'}`}>3D</button>
                                 </div>
                             )}
                             <button 
                                onClick={() => setFullScreenImage({ src: `data:image/png;base64,${currentImg}`, alt: "Blueprint Result" })} 
                                className="p-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-500"
                            >
                                <Eye className="w-5 h-5" />
                            </button>
                             <button 
                                onClick={handleDownload}
                                className="p-3 bg-violet-500 text-white rounded-xl shadow-lg hover:bg-violet-600 transition-colors"
                             >
                                 <Download className="w-5 h-5" />
                             </button>
                         </div>
                    </div>

                    <div className="relative group cursor-zoom-in rounded-3xl overflow-hidden border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/40 min-h-[400px] mb-8 shadow-inner">
                         {generating3D && (
                             <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center flex-col gap-4">
                                 <Loader2 className="w-10 h-10 text-fuchsia-500 animate-spin" />
                                 <p className="text-white font-mono text-sm animate-pulse tracking-widest">Generating 3D Holographic Matrix...</p>
                             </div>
                         )}
                         <img 
                            src={`data:image/png;base64,${currentImg}`} 
                            alt="Architectural Blueprint" 
                            className="w-full h-auto object-contain transition-transform group-hover:scale-[1.02]"
                            onClick={() => setFullScreenImage({src: `data:image/png;base64,${currentImg}`, alt: "Architectural Result"})}
                        />
                    </div>
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
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-sans">GitFlow Guide</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">Map repository architectural blueprints and logic flows.</p>
                        </div>

                        <div className="grid gap-6 flex-1">
                            <div className="flex items-center gap-6 group">
                                <div className="w-24 h-24 bg-indigo-500/10 rounded-2xl overflow-hidden border border-indigo-500/20 shrink-0 flex items-center justify-center relative shadow-inner">
                                    <Layers className="w-10 h-10 text-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <ArrowRight className="w-6 h-6 text-slate-300 shrink-0" />
                                <div className="flex-1 p-5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-1 uppercase tracking-wider tracking-widest">2D_LOGIC_FLOW</h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed italic">"Identify Input -> Process -> Output pathways across the codebase structure."</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 group">
                                <div className="w-24 h-24 bg-fuchsia-500/10 rounded-2xl overflow-hidden border border-fuchsia-500/20 shrink-0 flex items-center justify-center relative shadow-inner">
                                    <Box className="w-10 h-10 text-fuchsia-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <ArrowRight className="w-6 h-6 text-slate-300 shrink-0" />
                                <div className="flex-1 p-5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-1 uppercase tracking-wider tracking-widest">3D_MODELING</h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">"Visualize repository complexity as a spatial topographic hologram."</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-6 group">
                                <div className="w-24 h-24 bg-blue-500/10 rounded-2xl overflow-hidden border border-blue-500/20 shrink-0 flex items-center justify-center relative shadow-inner">
                                    <Code className="w-10 h-10 text-blue-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                                </div>
                                <ArrowRight className="w-6 h-6 text-slate-300 shrink-0" />
                                <div className="flex-1 p-5 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-white/5 rounded-3xl shadow-sm">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-xs mb-1 uppercase tracking-wider tracking-widest">ARCH_SCANNER</h3>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">url > technical mapping of public GitHub repositories and frameworks...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #8b5cf6 2px, transparent 2px)', backgroundSize: '32px 32px' }}></div>
                </div>
            )}
        </div>
      </div>

      {history.length > 0 && (
          <div className="pt-12 border-t border-slate-200 dark:border-white/10 animate-in fade-in">
              <div className="flex items-center gap-2 mb-8 text-slate-400">
                  <History className="w-4 h-4" />
                  <h2 className="text-sm font-bold uppercase tracking-widest">Blueprint Archive</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {history.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => {
                            if (item.is3D) { setInfographic3DData(item.imageData); setInfographicData(null); setShow3DMode(true); }
                            else { setInfographicData(item.imageData); setInfographic3DData(null); setShow3DMode(false); }
                            setCurrentRepoName(item.repoName);
                        }}
                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 hover:border-violet-500/50 rounded-[32px] overflow-hidden text-left transition-all hover:shadow-xl hover:bg-slate-50 dark:hover:bg-slate-800 p-2"
                      >
                          <div className="aspect-[3/4] relative overflow-hidden rounded-[24px] bg-slate-100 dark:bg-black/40">
                              <img src={`data:image/png;base64,${item.imageData}`} alt={item.repoName} className="w-full h-full object-cover opacity-90 transition-opacity group-hover:scale-110 duration-700" />
                              {item.is3D && (
                                  <div className="absolute top-3 right-3 bg-violet-500 text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-lg">3D</div>
                              )}
                          </div>
                          <div className="p-4">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate uppercase tracking-tighter">{item.repoName}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-mono">{item.style}</p>
                          </div>
                      </button>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default RepoAnalyzer;
