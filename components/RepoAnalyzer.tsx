/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { fetchRepoFileTree } from '../services/githubService';
import { generateInfographic, improvePrompt } from '../services/geminiService';
import { RepoFileTree, ViewMode, RepoHistoryItem, ImageMetadata } from '../types';
import { ShieldAlert, Loader2, Layers, Box, Download, Sparkles, Command, Palette, Globe, Clock, Maximize, KeyRound, Wand2, Check, X, RectangleHorizontal, RectangleVertical, Square, HelpCircle, Code } from 'lucide-react';
import { LoadingState } from './LoadingState';
import ImageViewer from './ImageViewer';
import MetadataEditor from './MetadataEditor';

interface RepoAnalyzerProps {
  onNavigate: (mode: ViewMode, data?: any) => void;
  history: RepoHistoryItem[];
  onAddToHistory: (item: RepoHistoryItem) => void;
  hasApiKey: boolean;
  onShowKeyModal: () => void;
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

const RepoAnalyzer: React.FC<RepoAnalyzerProps> = ({ onNavigate, history, onAddToHistory, hasApiKey, onShowKeyModal }) => {
  const [repoInput, setRepoInput] = useState('');
  const [selectedStyle, setSelectedStyle] = useState(FLOW_STYLES[0]);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].value);
  const [selectedRatio, setSelectedRatio] = useState(ASPECT_RATIOS[0].value);
  const [customStyle, setCustomStyle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingStage, setLoadingStage] = useState<string>('');
  
  // Prompt Enhancer State
  const [improvingPrompt, setImprovingPrompt] = useState(false);
  const [suggestedPrompt, setSuggestedPrompt] = useState<string | null>(null);

  // Infographic State
  const [infographicData, setInfographicData] = useState<string | null>(null);
  const [infographic3DData, setInfographic3DData] = useState<string | null>(null);
  const [generating3D, setGenerating3D] = useState(false);
  const [currentFileTree, setCurrentFileTree] = useState<RepoFileTree[] | null>(null);
  const [currentRepoName, setCurrentRepoName] = useState<string>('');
  
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

  const handleImprovePrompt = async () => {
      if (!hasApiKey) {
          onShowKeyModal();
          return;
      }
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

  const handleApiError = (err: any) => {
      const errorMessage = err.message || '';
      console.error("Analysis Error:", err);

      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("403")) {
          const confirmSwitch = window.confirm(
              "BILLING REQUIRED: The current API key does not have access to these models.\n\n" +
              "This feature requires a paid Google Cloud Project. Please switch to a valid paid API Key."
          );
          if (confirmSwitch) {
              window.location.reload();
          }
          setError("Access Denied: The API key is missing required permissions or billing.");
          return;
      }

      if (errorMessage.toLowerCase().includes("rate limit")) {
          setError("GitHub API Rate Limit Exceeded. We cannot fetch this repo right now. Please try again in ~60 minutes.");
          return;
      }

      if (errorMessage.includes("Failed to fetch repository")) {
          setError("Could not access repository. Please check:\n• Is the repository Public?\n• Is the 'owner/repo' spelling correct?\n• Does it have a 'main' or 'master' branch?");
          return;
      }
      
      if (errorMessage.includes("No relevant code files")) {
          setError("Repository appears empty or contains no supported code files (JS, TS, Python, etc.) to analyze.");
          return;
      }

      setError(errorMessage || 'An unexpected error occurred during analysis. Please try again.');
  }

  const handleAnalyze = async (e?: React.FormEvent, overrideInput?: string) => {
    if (e) e.preventDefault();
    setError(null);

    // Prompt for key if missing
    if (!hasApiKey) {
        onShowKeyModal();
        return;
    }

    setInfographicData(null);
    setInfographic3DData(null);
    setCurrentFileTree(null);

    const inputToUse = overrideInput || repoInput;
    const repoDetails = parseRepoInput(inputToUse);

    if (!repoDetails) {
      setError('Invalid format. Use "owner/repo" (e.g., facebook/react) or a full GitHub URL.');
      return;
    }

    // Update state to reflect what we are analyzing if triggered by button
    if (overrideInput) setRepoInput(overrideInput);

    setLoading(true);
    setCurrentRepoName(repoDetails.repo);
    
    setMetadata(prev => ({
        ...prev,
        title: `${repoDetails.repo} Architecture`,
        description: `Visual analysis of ${repoDetails.owner}/${repoDetails.repo}`,
        keywords: `github, ${repoDetails.repo}, architecture, diagram`,
        date: new Date().toISOString().slice(0, 16)
    }));

    try {
      setLoadingStage('CONNECTING TO GITHUB');
      const fileTree = await fetchRepoFileTree(repoDetails.owner, repoDetails.repo);

      if (fileTree.length === 0) throw new Error('No relevant code files found in this repository.');
      setCurrentFileTree(fileTree);

      setLoadingStage('ANALYZING STRUCTURE & GENERATING');
      
      const styleToUse = selectedStyle === 'Custom' ? customStyle : selectedStyle;

      const infographicBase64 = await generateInfographic(repoDetails.repo, fileTree, styleToUse, false, selectedLanguage, selectedRatio);
      
      if (infographicBase64) {
        setInfographicData(infographicBase64);
        addToHistory(repoDetails.repo, infographicBase64, false, styleToUse);
      } else {
          throw new Error("Failed to generate visual.");
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
      const data = await generateInfographic(currentRepoName, currentFileTree, styleToUse, true, selectedLanguage, selectedRatio);
      if (data) {
          setInfographic3DData(data);
          addToHistory(currentRepoName, data, true, styleToUse);
      }
    } catch (err: any) {
      handleApiError(err);
    } finally {
      setGenerating3D(false);
    }
  };

  const loadFromHistory = (item: RepoHistoryItem) => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setCurrentRepoName(item.repoName);
      setMetadata(prev => ({
          ...prev,
          title: item.repoName,
          description: `History item: ${item.repoName} (${item.style})`,
          date: item.date.toISOString().slice(0, 16)
      }));

      if (item.is3D) {
          setInfographic3DData(item.imageData);
          setInfographicData(null); 
      } else {
          setInfographicData(item.imageData);
          setInfographic3DData(null); 
      }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 mb-20 px-4">
      
      {fullScreenImage && (
          <ImageViewer 
            src={fullScreenImage.src} 
            alt={fullScreenImage.alt} 
            onClose={() => setFullScreenImage(null)} 
          />
      )}

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans leading-tight">
          Codebase <span className="text-violet-500 dark:text-violet-400">Intelligence</span>.
        </h2>
        <p className="text-slate-600 dark:text-slate-100 text-lg font-light tracking-wide">
          Enter a GitHub repository to visualize its logical data flow.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Input Column (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
            <form onSubmit={(e) => handleAnalyze(e)} className="glass-panel rounded-2xl p-4 space-y-6 bg-white/60 dark:bg-slate-900/60 sticky top-24">
                
                {/* Input Field */}
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider ml-1">Repository URL</label>
                    <div className="flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 shadow-sm focus-within:ring-2 ring-violet-500/50">
                        <Command className="w-5 h-5 text-slate-400 mr-2" />
                        <input
                            type="text"
                            value={repoInput}
                            onChange={(e) => setRepoInput(e.target.value)}
                            placeholder="owner/repo (e.g. facebook/react)"
                            className="w-full bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0 font-mono text-sm"
                        />
                    </div>
                </div>

                {/* Quick Try Buttons */}
                <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                         <Sparkles className="w-3 h-3 text-violet-500" />
                         <span className="text-[10px] font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider">Quick Start Examples</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                         <button type="button" onClick={() => handleAnalyze(undefined, "facebook/react")} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-slate-600 dark:text-slate-200 rounded border border-slate-200 dark:border-white/10 transition-colors font-mono">facebook/react</button>
                         <button type="button" onClick={() => handleAnalyze(undefined, "vercel/next.js")} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-slate-600 dark:text-slate-200 rounded border border-slate-200 dark:border-white/10 transition-colors font-mono">vercel/next.js</button>
                         <button type="button" onClick={() => handleAnalyze(undefined, "airbnb/javascript")} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-violet-100 dark:hover:bg-violet-900/30 text-slate-600 dark:text-slate-200 rounded border border-slate-200 dark:border-white/10 transition-colors font-mono">airbnb/javascript</button>
                    </div>
                </div>

                {/* Style Selector */}
                <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-white/10">
                     <label className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider ml-1 flex items-center gap-1"><Palette className="w-3 h-3"/> Visualization Style</label>
                     <div className="grid grid-cols-2 gap-2">
                         {FLOW_STYLES.map(style => (
                             <button
                                key={style}
                                type="button"
                                onClick={() => setSelectedStyle(style)}
                                className={`text-xs px-2 py-2 rounded-lg font-mono transition-all text-left truncate ${
                                    selectedStyle === style 
                                    ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-200 border border-violet-200 dark:border-violet-500/30 shadow-sm font-bold' 
                                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                             >
                                 {style}
                             </button>
                         ))}
                     </div>
                </div>

                 {/* Aspect Ratio */}
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-300 uppercase tracking-wider ml-1">Aspect Ratio</label>
                    <div className="flex gap-2">
                        {ASPECT_RATIOS.map(ratio => (
                            <button
                                key={ratio.value}
                                type="button"
                                onClick={() => setSelectedRatio(ratio.value)}
                                className={`flex-1 p-2 rounded-lg transition-all flex justify-center ${
                                    selectedRatio === ratio.value
                                    ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm ring-1 ring-violet-500/20'
                                    : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                                title={ratio.label}
                            >
                                <ratio.icon className="w-4 h-4" />
                            </button>
                        ))}
                    </div>
                 </div>

                 <button
                    type="submit"
                    disabled={loading || !repoInput.trim()}
                    className="w-full py-4 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Box className="w-5 h-5 group-hover:animate-bounce" /> GENERATE BLUEPRINT</>}
                </button>
                
                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg text-xs text-red-600 dark:text-red-400 font-mono leading-relaxed">
                        <ShieldAlert className="w-4 h-4 mb-1 inline mr-1" />
                        {error}
                    </div>
                )}
            </form>
        </div>

        {/* Output Column (8 cols) */}
        <div className="lg:col-span-8 min-h-[600px] flex flex-col">
            {loading ? (
                 <div className="flex-1 flex flex-col items-center justify-center glass-panel rounded-3xl">
                     <LoadingState message={loadingStage} type="repo" />
                </div>
            ) : (infographicData || infographic3DData) ? (
                 <div className="glass-panel rounded-3xl p-6 animate-in fade-in slide-in-from-bottom-8 duration-700 space-y-6 bg-white/60 dark:bg-slate-900/60">
                      {/* Results Header */}
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-violet-100 dark:bg-violet-500/20 rounded-lg text-violet-600 dark:text-violet-400">
                                 <Layers className="w-5 h-5" />
                             </div>
                             <div>
                                 <h3 className="text-lg font-bold text-slate-900 dark:text-white font-sans">Analysis Result: {currentRepoName}</h3>
                                 <p className="text-xs text-slate-500 dark:text-slate-300 font-mono">
                                     {new Date().toLocaleTimeString()} • {selectedStyle}
                                 </p>
                             </div>
                         </div>
                         <div className="flex items-center gap-2">
                             {/* 3D Toggle */}
                             {!infographic3DData && !generating3D && (
                                <button 
                                  onClick={handleGenerate3D}
                                  className="px-4 py-2 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/30 rounded-lg font-bold text-xs transition-all flex items-center gap-2"
                                >
                                  <Box className="w-4 h-4" /> 3D Model
                                </button>
                             )}
                             <a 
                                href={`data:image/png;base64,${infographic3DData || infographicData}`} 
                                download={`${currentRepoName}-infographic.png`}
                                className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-bold text-xs transition-all flex items-center gap-2 shadow-lg"
                             >
                                 <Download className="w-4 h-4" /> Download
                             </a>
                         </div>
                    </div>

                    {/* Main Image */}
                    <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 group bg-slate-100 dark:bg-slate-950 min-h-[400px]">
                         {generating3D && (
                             <div className="absolute inset-0 z-20 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center flex-col gap-4">
                                 <Loader2 className="w-10 h-10 text-fuchsia-500 animate-spin" />
                                 <p className="text-white font-mono text-sm animate-pulse">Rendering 3D Holographic Model...</p>
                             </div>
                         )}
                         <img 
                            src={`data:image/png;base64,${infographic3DData || infographicData}`} 
                            alt="Generated Infographic" 
                            className="w-full h-auto object-contain cursor-pointer"
                            onClick={() => setFullScreenImage({src: `data:image/png;base64,${infographic3DData || infographicData}`, alt: "Result"})}
                        />
                         <button 
                            onClick={() => setFullScreenImage({src: `data:image/png;base64,${infographic3DData || infographicData}`, alt: "Result"})}
                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            <Maximize className="w-5 h-5" />
                         </button>
                    </div>

                    <MetadataEditor initialData={metadata} onChange={setMetadata} />
                 </div>
            ) : (
                // EMPTY STATE GUIDE
                <div className="flex-1 glass-panel rounded-3xl p-8 border-dashed border-2 border-slate-300 dark:border-white/10 bg-white/40 dark:bg-slate-900/40 flex flex-col justify-center">
                    <div className="text-center max-w-lg mx-auto mb-10">
                        <div className="w-20 h-20 bg-violet-100 dark:bg-violet-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner transform rotate-3">
                            <Code className="w-10 h-10 text-violet-500 dark:text-violet-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 dark:text-white font-sans mb-3">Ready to Analyze</h3>
                        <p className="text-slate-500 dark:text-slate-200 text-sm leading-relaxed">
                            Link2Infographic will scan the file structure of any public repository to identify patterns, data flow, and architecture.
                        </p>
                    </div>

                    {/* How It Works Steps */}
                    <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto w-full">
                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/5 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Layers className="w-16 h-16 text-slate-900 dark:text-white" />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-mono">1</div>
                                2D Blueprint
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                                Best for understanding logic flow. The AI maps "Input -> Process -> Output" and labels data types (JSON, Auth, etc.).
                            </p>
                        </div>

                        <div className="p-5 rounded-2xl bg-white dark:bg-slate-950 border border-fuchsia-200 dark:border-fuchsia-500/20 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Box className="w-16 h-16 text-fuchsia-500" />
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-300 flex items-center justify-center text-xs font-mono">2</div>
                                3D Hologram
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                                Best for presentations. Renders the codebase as a complex "city" or physical model on a desk. Visual impact over strict accuracy.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>

      </div>

      {/* History Grid */}
      {history.length > 0 && (
          <div className="pt-12 border-t border-slate-200 dark:border-white/10 animate-in fade-in">
              <div className="flex items-center gap-2 mb-6 text-slate-500 dark:text-slate-300">
                  <Clock className="w-4 h-4" />
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold">Recent Blueprints</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {history.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => loadFromHistory(item)}
                        className="group bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:border-violet-500/50 rounded-xl overflow-hidden text-left transition-all hover:shadow-lg dark:hover:shadow-neon-violet hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                          <div className="aspect-[3/4] relative overflow-hidden bg-slate-100 dark:bg-slate-950">
                              <img src={`data:image/png;base64,${item.imageData}`} alt={item.repoName} className="w-full h-full object-cover opacity-90 dark:opacity-70 group-hover:opacity-100 transition-opacity" />
                              {item.is3D && (
                                  <div className="absolute top-2 right-2 bg-fuchsia-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10">3D</div>
                              )}
                          </div>
                          <div className="p-3">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate font-mono">{item.repoName}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-300 mt-1 font-medium truncate">{item.style}</p>
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