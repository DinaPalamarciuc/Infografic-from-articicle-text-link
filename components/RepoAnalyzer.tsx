/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { fetchRepoFileTree } from '../services/githubService';
import { generateInfographic, improvePrompt } from '../services/geminiService';
import { RepoFileTree, ViewMode, RepoHistoryItem, ImageMetadata } from '../types';
import { AlertCircle, Loader2, Layers, Box, Download, Sparkles, Command, Palette, Globe, Clock, Maximize, KeyRound, Wand2, Check, X, ShieldAlert, RectangleHorizontal, RectangleVertical, Square } from 'lucide-react';
import { LoadingState } from './LoadingState';
import ImageViewer from './ImageViewer';
import MetadataEditor from './MetadataEditor';

interface RepoAnalyzerProps {
  onNavigate: (mode: ViewMode, data?: any) => void;
  history: RepoHistoryItem[];
  onAddToHistory: (item: RepoHistoryItem) => void;
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

const RepoAnalyzer: React.FC<RepoAnalyzerProps> = ({ onNavigate, history, onAddToHistory }) => {
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

      // 1. Google GenAI Billing/Permission Errors
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

      // 2. GitHub Rate Limiting
      if (errorMessage.toLowerCase().includes("rate limit")) {
          setError("GitHub API Rate Limit Exceeded. We cannot fetch this repo right now. Please try again in ~60 minutes.");
          return;
      }

      // 3. GitHub Repo Not Found / Private
      if (errorMessage.includes("Failed to fetch repository")) {
          setError("Could not access repository. Please check:\n• Is the repository Public?\n• Is the 'owner/repo' spelling correct?\n• Does it have a 'main' or 'master' branch?");
          return;
      }
      
      // 4. Empty Repos
      if (errorMessage.includes("No relevant code files")) {
          setError("Repository appears empty or contains no supported code files (JS, TS, Python, etc.) to analyze.");
          return;
      }

      // 5. Generic Fallback
      setError(errorMessage || 'An unexpected error occurred during analysis. Please try again.');
  }

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfographicData(null);
    setInfographic3DData(null);
    setCurrentFileTree(null);

    const repoDetails = parseRepoInput(repoInput);
    if (!repoDetails) {
      setError('Invalid format. Use "owner/repo" (e.g., facebook/react) or a full GitHub URL.');
      return;
    }

    setLoading(true);
    setCurrentRepoName(repoDetails.repo);
    
    // Reset metadata for new repo
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
          Codebase <span className="text-violet-500 dark:text-violet-400">Intelligence</span>.
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-xl md:text-2xl font-light tracking-wide">
          Turn any repository into a fully analyzed, interactive architectural blueprint.
        </p>

         {/* Informational Guide */}
         <div className="bg-violet-50 dark:bg-violet-900/10 border border-violet-200 dark:border-violet-500/20 rounded-xl p-4 text-left max-w-2xl mx-auto flex items-start gap-3 shadow-sm">
             <Box className="w-5 h-5 text-violet-500 dark:text-violet-400 shrink-0 mt-0.5" />
             <div className="space-y-1">
                 <h3 className="text-sm font-bold text-violet-700 dark:text-violet-300 font-mono">How to use GitFlow</h3>
                 <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                     Enter a <strong>Public GitHub Repository</strong> (e.g., <code>facebook/react</code>). Our AI analyzes the file structure to visualize the logical data flow. Use the <strong>"3D Model"</strong> view for a holographic tabletop perspective.
                 </p>
             </div>
         </div>
      </div>

      {/* Input Section */}
      <div className="max-w-xl mx-auto relative z-10">
        <form onSubmit={handleAnalyze} className="glass-panel rounded-2xl p-2 transition-all focus-within:ring-1 focus-within:ring-violet-500/50 focus-within:border-violet-500/50 bg-white/60 dark:bg-slate-900/60">
          <div className="flex items-center">
             <div className="pl-3 text-slate-400">
                <Command className="w-5 h-5" />
             </div>
             <input
                type="text"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
                placeholder="owner/repository"
                className="w-full bg-transparent border-none text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-0 text-xl px-4 py-3 font-mono"
              />
              <div className="pr-2">
                <button
                type="submit"
                disabled={loading || !repoInput.trim()}
                className="px-4 py-2 bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 dark:hover:text-white hover:text-white text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 border border-slate-700 dark:border-white/10 font-mono text-sm shadow-lg"
                >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "RUN_ANALYSIS"}
                </button>
             </div>
          </div>

          {/* Controls: Style, Ratio, and Language */}
          <div className="mt-2 pt-2 border-t border-slate-200 dark:border-white/10 px-3 pb-1 space-y-3">
             {/* Style & Ratio Row */}
             <div className="flex flex-col sm:flex-row gap-3">
                 {/* Style Selector */}
                 <div className="flex items-center gap-3 overflow-x-auto no-scrollbar flex-1">
                     <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-sm uppercase tracking-wider shrink-0 font-bold">
                         <Palette className="w-4 h-4" /> Style:
                     </div>
                     <div className="flex gap-2">
                         {FLOW_STYLES.map(style => (
                             <button
                                key={style}
                                type="button"
                                onClick={() => setSelectedStyle(style)}
                                className={`text-sm px-3 py-1.5 rounded-md font-mono transition-all whitespace-nowrap font-medium ${
                                    selectedStyle === style 
                                    ? 'bg-violet-100 dark:bg-violet-500/20 text-violet-700 dark:text-violet-200 border border-violet-200 dark:border-violet-500/30 shadow-sm' 
                                    : 'bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent hover:border-slate-300 dark:hover:border-white/10'
                                }`}
                             >
                                 {style}
                             </button>
                         ))}
                     </div>
                 </div>
                 
                 {/* Aspect Ratio Selector */}
                 <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-lg p-1 shrink-0 self-start sm:self-auto">
                    {ASPECT_RATIOS.map(ratio => (
                        <button
                            key={ratio.value}
                            type="button"
                            onClick={() => setSelectedRatio(ratio.value)}
                            className={`p-1.5 rounded-md transition-all ${
                                selectedRatio === ratio.value
                                ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                            title={ratio.label}
                        >
                            <ratio.icon className="w-4 h-4" />
                        </button>
                    ))}
                 </div>
             </div>
             
             {/* Language Selector & Custom Style Input */}
             <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-3 w-full">
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-lg px-2 py-1 shrink-0 min-w-0 max-w-full">
                        <Globe className="w-4 h-4 text-slate-400 shrink-0" />
                        <select
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="bg-transparent border-none text-sm text-slate-700 dark:text-slate-200 focus:ring-0 p-0 font-mono cursor-pointer min-w-0 flex-1 truncate font-medium"
                        >
                            {LANGUAGES.map((lang) => (
                            <option key={lang.value} value={lang.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200">
                                {lang.label}
                            </option>
                            ))}
                        </select>
                    </div>

                    {selectedStyle === 'Custom' && (
                        <div className="flex-1 min-w-[150px] relative">
                            <input 
                                type="text" 
                                value={customStyle}
                                onChange={(e) => setCustomStyle(e.target.value)}
                                placeholder="Describe your custom style..."
                                className="w-full bg-slate-100 dark:bg-slate-950/50 border border-slate-200 dark:border-white/10 rounded-lg pl-3 pr-9 py-2 text-sm text-slate-900 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-1 focus:ring-violet-500/50 focus:border-violet-500/50 font-mono transition-all"
                            />
                            <button
                                type="button"
                                onClick={handleImprovePrompt}
                                disabled={improvingPrompt || !customStyle.trim()}
                                className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-violet-500 dark:text-violet-400 hover:text-violet-700 dark:hover:text-white disabled:opacity-50 transition-colors"
                                title="Enhance prompt with AI"
                            >
                                {improvingPrompt ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />}
                            </button>
                        </div>
                    )}
                </div>

                {/* AI Suggestion Box */}
                {selectedStyle === 'Custom' && suggestedPrompt && (
                    <div className="w-full bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/20 rounded-lg p-3 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2">
                                <Sparkles className="w-4 h-4 text-violet-500 dark:text-violet-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-violet-600 dark:text-violet-300 font-bold uppercase mb-1">AI Enhanced Prompt</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">{suggestedPrompt}</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                                <button 
                                    type="button"
                                    onClick={acceptSuggestion}
                                    className="p-1 bg-violet-100 dark:bg-violet-500/20 hover:bg-violet-200 dark:hover:bg-violet-500/40 text-violet-700 dark:text-violet-200 rounded transition-colors"
                                    title="Use this prompt"
                                >
                                    <Check className="w-3 h-3" />
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setSuggestedPrompt(null)}
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700/50 text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded transition-colors"
                                    title="Dismiss"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
             </div>
          </div>
        </form>
      </div>

      {error && (
        <div className="max-w-2xl mx-auto p-4 glass-panel border-red-500/30 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-top-2 font-mono text-sm bg-red-50/50 dark:bg-transparent shadow-lg shadow-red-900/10">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1 whitespace-pre-line leading-relaxed">{error}</div>
          {error.includes("Access Denied") && (
              <button 
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded text-xs font-bold transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                 <KeyRound className="w-3 h-3" /> SWITCH KEY
              </button>
          )}
        </div>
      )}

      {loading && (
        <LoadingState message={loadingStage} type="repo" />
      )}

      {/* Results Section */}
      {(infographicData || infographic3DData) && !loading && (
        <div className="glass-panel rounded-3xl p-4 md:p-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-8 bg-white/60 dark:bg-slate-900/60">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 2D Infographic Card */}
              {infographicData && (
              <div className="glass-panel rounded-2xl p-1.5 border border-slate-200 dark:border-white/5 bg-white/30 dark:bg-slate-900/30">
                 <div className="px-4 py-3 flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-white/5 mb-1.5 gap-2 bg-slate-50/50 dark:bg-slate-950/30 rounded-t-2xl">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 font-mono uppercase tracking-wider">
                      <Layers className="w-4 h-4 text-violet-500 dark:text-violet-400" /> Flow_Diagram
                    </h3>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setFullScreenImage({src: `data:image/png;base64,${infographicData}`, alt: `${currentRepoName} 2D`})}
                        className="text-xs flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-mono p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                        title="Full Screen"
                      >
                        <Maximize className="w-4 h-4" />
                      </button>
                      <a href={`data:image/png;base64,${infographicData}`} download={`${currentRepoName}-infographic-2d.png`} className="text-xs flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors font-mono bg-white/50 dark:bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 font-semibold">
                        <Download className="w-3 h-3" /> Save PNG
                      </a>
                    </div>
                </div>
                <div className="rounded-2xl overflow-hidden bg-[#eef8fe] relative group border border-slate-200 dark:border-slate-200/10">
                    {selectedStyle === "Neon Cyberpunk" && <div className="absolute inset-0 bg-slate-950 pointer-events-none mix-blend-multiply" />}
                    <div className="absolute inset-0 bg-slate-900/10 dark:bg-slate-950/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <img src={`data:image/png;base64,${infographicData}`} alt="Repository Flow Diagram" className="w-full h-auto object-cover transition-opacity relative z-10" />
                </div>
              </div>
              )}

              {/* 3D Infographic Card */}
              <div className="glass-panel rounded-2xl p-1.5 flex flex-col border border-slate-200 dark:border-white/5 bg-white/30 dark:bg-slate-900/30">
                 <div className="px-4 py-3 flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-white/5 mb-1.5 shrink-0 gap-2 bg-slate-50/50 dark:bg-slate-950/30 rounded-t-2xl">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2 font-mono uppercase tracking-wider">
                      <Box className="w-4 h-4 text-fuchsia-500 dark:text-fuchsia-400" /> Holographic_Model
                    </h3>
                    {infographic3DData && (
                      <div className="flex items-center gap-2 animate-in fade-in">
                        <button 
                            onClick={() => setFullScreenImage({src: `data:image/png;base64,${infographic3DData}`, alt: `${currentRepoName} 3D`})}
                            className="text-xs flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors font-mono p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10"
                            title="Full Screen"
                        >
                            <Maximize className="w-4 h-4" />
                        </button>
                        <a href={`data:image/png;base64,${infographic3DData}`} download={`${currentRepoName}-infographic-3d.png`} className="text-xs flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors font-mono bg-white/50 dark:bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white dark:hover:bg-white/20 border border-slate-200 dark:border-white/10 font-semibold">
                          <Download className="w-3 h-3" /> Save PNG
                        </a>
                      </div>
                    )}
                </div>
                
                <div className="flex-1 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-950/30 relative flex items-center justify-center min-h-[300px] group border border-slate-200 dark:border-slate-800">
                  {infographic3DData ? (
                      <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                         <div className="absolute inset-0 bg-slate-900/10 dark:bg-slate-950/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10" />
                         <img src={`data:image/png;base64,${infographic3DData}`} alt="Repository 3D Flow Diagram" className="w-full h-full object-cover animate-in fade-in transition-opacity relative z-20" />
                      </div>
                  ) : generating3D ? (
                    <div className="flex flex-col items-center justify-center gap-4 p-6 text-center animate-in fade-in">
                         <Loader2 className="w-8 h-8 animate-spin text-fuchsia-500" />
                         <p className="text-fuchsia-500/70 dark:text-fuchsia-300/50 font-mono text-xs animate-pulse">RENDERING HOLOGRAPHIC MODEL...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
                        <p className="text-slate-500 dark:text-slate-400 font-mono text-xs">Render tabletop perspective?</p>
                        <button 
                          onClick={handleGenerate3D}
                          className="px-5 py-2 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-600 dark:text-fuchsia-400 border border-fuchsia-500/30 rounded-xl font-semibold transition-all flex items-center gap-2 font-mono text-sm hover:shadow-lg"
                        >
                          <Sparkles className="w-4 h-4" />
                          GENERATE_MODEL
                        </button>
                    </div>
                  )}
                </div>
              </div>
          </div>

          {/* Metadata Section */}
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
                  <h3 className="text-sm font-mono uppercase tracking-wider font-bold">Recent Blueprints</h3>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {history.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => loadFromHistory(item)}
                        className="group bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 hover:border-violet-500/50 rounded-xl overflow-hidden text-left transition-all hover:shadow-lg dark:hover:shadow-neon-violet hover:bg-slate-50 dark:hover:bg-slate-800"
                      >
                          <div className="aspect-video relative overflow-hidden bg-slate-100 dark:bg-slate-950">
                              <img src={`data:image/png;base64,${item.imageData}`} alt={item.repoName} className="w-full h-full object-cover opacity-90 dark:opacity-70 group-hover:opacity-100 transition-opacity" />
                              {item.is3D && (
                                  <div className="absolute top-2 right-2 bg-fuchsia-500/90 text-white text-[10px] font-bold px-1.5 py-0.5 rounded border border-white/10">3D</div>
                              )}
                          </div>
                          <div className="p-3">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate font-mono">{item.repoName}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-medium">{item.style}</p>
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