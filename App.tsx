
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import RepoAnalyzer from './components/RepoAnalyzer';
import ArticleToInfographic from './components/ArticleToInfographic';
import VisionStudio from './components/VisionStudio';
import AcademicStudio from './components/AcademicStudio';
import Home from './components/Home';
import IntroAnimation from './components/IntroAnimation';
import ApiKeyModal from './components/ApiKeyModal';
import ModelPreferences from './components/ModelPreferences';
import { ViewMode, RepoHistoryItem, ArticleHistoryItem, AcademicHistoryItem, ModelConfig } from './types';
import { Github, GitBranch, FileText, Home as HomeIcon, Link2, BarChart3, Sun, Moon, Key, Sparkles, ImageIcon, ExternalLink, ShieldCheck, Mail, Globe, Layers, GraduationCap } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.HOME);
  const [showIntro, setShowIntro] = useState(false);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  
  const [repoHistory, setRepoHistory] = useState<RepoHistoryItem[]>([]);
  const [articleHistory, setArticleHistory] = useState<ArticleHistoryItem[]>([]);
  const [academicHistory, setAcademicHistory] = useState<AcademicHistoryItem[]>([]);

  // Default model configuration
  const [modelConfig, setModelConfig] = useState<ModelConfig>({
    strategy: 'gemini-3-pro-preview',
    drafting: 'gemini-3-flash-preview',
    code: 'gemini-3-pro-preview'
  });

  // Load persistence data on mount
  useEffect(() => {
    // Theme
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    // Model Config
    const savedConfig = localStorage.getItem('l2i_model_config');
    if (savedConfig) {
      try {
        setModelConfig(JSON.parse(savedConfig));
      } catch (e) {
        console.error("Failed to parse saved config", e);
      }
    }

    // History hydration
    const savedRepoHistory = localStorage.getItem('l2i_repo_history');
    if (savedRepoHistory) {
      try {
        const parsed = JSON.parse(savedRepoHistory);
        setRepoHistory(parsed.map((item: any) => ({ ...item, date: new Date(item.date) })));
      } catch (e) { console.error(e); }
    }

    const savedArticleHistory = localStorage.getItem('l2i_article_history');
    if (savedArticleHistory) {
      try {
        const parsed = JSON.parse(savedArticleHistory);
        setArticleHistory(parsed.map((item: any) => ({ ...item, date: new Date(item.date) })));
      } catch (e) { console.error(e); }
    }

    const savedAcademicHistory = localStorage.getItem('l2i_academic_history');
    if (savedAcademicHistory) {
      try {
        const parsed = JSON.parse(savedAcademicHistory);
        setAcademicHistory(parsed.map((item: any) => ({ ...item, date: new Date(item.date) })));
      } catch (e) { console.error(e); }
    }

    // API Key check
    const checkKey = async () => {
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const isSelected = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(isSelected);
      } else {
        const envKey = process.env.API_KEY;
        setHasApiKey(!!(envKey && envKey !== 'undefined'));
      }
      setCheckingKey(false);
    };
    checkKey();
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('l2i_model_config', JSON.stringify(modelConfig));
  }, [modelConfig]);

  useEffect(() => {
    localStorage.setItem('l2i_repo_history', JSON.stringify(repoHistory));
  }, [repoHistory]);

  useEffect(() => {
    localStorage.setItem('l2i_article_history', JSON.stringify(articleHistory));
  }, [articleHistory]);

  useEffect(() => {
    localStorage.setItem('l2i_academic_history', JSON.stringify(academicHistory));
  }, [academicHistory]);

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleKeyUpdate = () => {
      setHasApiKey(true);
      setShowKeyModal(false);
  };

  if (checkingKey) return <div className="min-h-screen bg-slate-950" />;

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {showKeyModal && (
        <ApiKeyModal 
            onKeySelected={handleKeyUpdate} 
            onCancel={() => setShowKeyModal(false)}
            canCancel={true}
        />
      )}

      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}

      <header className="relative mt-4 z-40 mx-auto w-[calc(100%-1rem)] max-w-[1400px]">
        <div className="glass-panel rounded-2xl px-6 py-4 flex justify-between items-center backdrop-blur-2xl dark:border-white/10 border-slate-200/50 shadow-2xl">
          <button onClick={() => setCurrentView(ViewMode.HOME)} className="flex items-center gap-4 group text-left">
            <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 border border-white/10 shadow-lg overflow-hidden">
               <Link2 className="w-5 h-5 text-violet-400 absolute top-2.5 left-2.5 transform -rotate-45" />
               <BarChart3 className="w-5 h-5 text-emerald-400 absolute bottom-2.5 right-2.5" />
            </div>
            <div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Link<span className="text-violet-500">2</span>Infographic
              </div>
            </div>
          </button>
          
          <div className="flex items-center gap-3">
             <button
                onClick={() => setShowKeyModal(true)}
                className={`p-2.5 rounded-xl border transition-all ${hasApiKey ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
                title={hasApiKey ? "API Key Selected" : "API Key Required"}
             >
                <Key className="w-5 h-5" />
             </button>
             <button onClick={toggleTheme} className="p-2.5 rounded-xl bg-slate-800 border border-white/10 text-slate-200">
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-8 py-8">
        {currentView !== ViewMode.HOME && (
          <>
            <ModelPreferences config={modelConfig} onChange={setModelConfig} />
            
            <div className="flex justify-center mb-10 relative z-30">
                <div className="glass-panel p-1.5 rounded-full flex shadow-2xl bg-slate-900/90 border-white/10 overflow-x-auto whitespace-nowrap">
                    <button onClick={() => setCurrentView(ViewMode.HOME)} className="px-4 py-2.5 rounded-full font-medium text-sm text-slate-300 hover:bg-white/5 transition-colors">
                        <HomeIcon className="w-4 h-4" />
                    </button>
                    <div className="w-px h-5 bg-white/10 my-auto mx-1"></div>
                    <button
                        onClick={() => setCurrentView(ViewMode.REPO_ANALYZER)}
                        className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all ${currentView === ViewMode.REPO_ANALYZER ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                        <GitBranch className="w-4 h-4 inline mr-2" /> GitFlow
                    </button>
                    <button
                        onClick={() => setCurrentView(ViewMode.ARTICLE_INFOGRAPHIC)}
                        className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all ${currentView === ViewMode.ARTICLE_INFOGRAPHIC ? 'bg-emerald-900/30 text-emerald-50 shadow-lg' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                        <FileText className="w-4 h-4 inline mr-2" /> SiteSketch
                    </button>
                    <button
                        onClick={() => setCurrentView(ViewMode.ACADEMIC_STUDIO)}
                        className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all ${currentView === ViewMode.ACADEMIC_STUDIO ? 'bg-indigo-900/30 text-indigo-50 shadow-lg' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                        <GraduationCap className="w-4 h-4 inline mr-2" /> EduVision
                    </button>
                    <button
                        onClick={() => setCurrentView(ViewMode.VISION_STUDIO)}
                        className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all ${currentView === ViewMode.VISION_STUDIO ? 'bg-amber-900/30 text-amber-50 shadow-lg' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                        <ImageIcon className="w-4 h-4 inline mr-2" /> Vision
                    </button>
                </div>
            </div>
          </>
        )}

        {currentView === ViewMode.HOME && <Home onNavigate={setCurrentView} />}
        {currentView === ViewMode.REPO_ANALYZER && (
            <RepoAnalyzer 
                onNavigate={setCurrentView} 
                history={repoHistory} 
                onAddToHistory={(item) => setRepoHistory([item, ...repoHistory])}
                hasApiKey={hasApiKey}
                onShowKeyModal={() => setShowKeyModal(true)}
                model={modelConfig.code}
            />
        )}
        {currentView === ViewMode.ARTICLE_INFOGRAPHIC && (
            <ArticleToInfographic 
                history={articleHistory} 
                onAddToHistory={(item) => setArticleHistory([item, ...articleHistory])}
                hasApiKey={hasApiKey}
                onShowKeyModal={() => setShowKeyModal(true)}
                model={modelConfig.drafting}
            />
        )}
        {currentView === ViewMode.ACADEMIC_STUDIO && (
            <AcademicStudio 
                history={academicHistory}
                onAddToHistory={(item) => setAcademicHistory([item, ...academicHistory])}
                hasApiKey={hasApiKey}
                onShowKeyModal={() => setShowKeyModal(true)}
                model={modelConfig.strategy}
            />
        )}
        {currentView === ViewMode.VISION_STUDIO && (
            <VisionStudio 
                hasApiKey={hasApiKey}
                onShowKeyModal={() => setShowKeyModal(true)}
                model={modelConfig.strategy}
            />
        )}
      </main>

      <footer className="relative mt-auto pt-16 pb-8 border-t border-white/5 bg-slate-950/80 backdrop-blur-xl overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-16">
                {/* Column 1: Brand */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center">
                            <Link2 className="w-5 h-5 text-violet-400" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">Link2Infographic</span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed font-light">
                        The ultimate visual intelligence suite for developers and content creators. Mapping data to narratives with next-gen AI.
                    </p>
                    <div className="flex items-center gap-4">
                        <a href="#" className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5">
                            <Github className="w-4 h-4" />
                        </a>
                        <a href="mailto:contact@link2infographic.com" className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all border border-white/5">
                            <Mail className="w-4 h-4" />
                        </a>
                    </div>
                </div>

                {/* Column 2: Navigation */}
                <div className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Platform</h4>
                    <ul className="space-y-3">
                        <li>
                            <button onClick={() => setCurrentView(ViewMode.REPO_ANALYZER)} className="text-sm text-slate-400 hover:text-violet-400 transition-colors flex items-center gap-2 group">
                                <GitBranch className="w-4 h-4 opacity-50 group-hover:opacity-100" /> GitFlow
                            </button>
                        </li>
                        <li>
                            <button onClick={() => setCurrentView(ViewMode.ARTICLE_INFOGRAPHIC)} className="text-sm text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                                <FileText className="w-4 h-4 opacity-50 group-hover:opacity-100" /> SiteSketch
                            </button>
                        </li>
                        <li>
                            <button onClick={() => setCurrentView(ViewMode.ACADEMIC_STUDIO)} className="text-sm text-slate-400 hover:text-indigo-400 transition-colors flex items-center gap-2 group">
                                <GraduationCap className="w-4 h-4 opacity-50 group-hover:opacity-100" /> EduVision
                            </button>
                        </li>
                    </ul>
                </div>

                {/* Column 3: Contact/Support */}
                <div className="space-y-6">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Connect</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Have feedback or need enterprise-grade architectural analysis? Reach out to our team.
                    </p>
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-mono text-slate-500">EMAIL: SUPPORT@LINK2INFOGRAPHIC.COM</span>
                        <span className="text-xs font-mono text-slate-500">REGION: US-WEST-1</span>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <p className="text-[11px] text-slate-500 font-mono tracking-tight">
                        &copy; 2025 LINK2INFOGRAPHIC. ALL RIGHTS RESERVED.
                    </p>
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/5 border border-emerald-500/10 rounded-full">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">System Operational</span>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 py-2 px-4 bg-white/5 rounded-2xl border border-white/10 group">
                        <span className="text-xs text-slate-500 font-medium">Platform by</span>
                        <a href="#" className="text-sm font-extrabold text-white group-hover:text-fuchsia-500 transition-colors flex items-center gap-2">
                            DinaMita <Sparkles className="w-4 h-4 text-fuchsia-500" />
                        </a>
                    </div>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
