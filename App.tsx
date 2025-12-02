/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import RepoAnalyzer from './components/RepoAnalyzer';
import ArticleToInfographic from './components/ArticleToInfographic';
import Home from './components/Home';
import IntroAnimation from './components/IntroAnimation';
import ApiKeyModal from './components/ApiKeyModal';
import { ViewMode, RepoHistoryItem, ArticleHistoryItem } from './types';
import { Github, GitBranch, FileText, Home as HomeIcon, CreditCard, Link2, BarChart3, Sun, Moon, Key } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.HOME);
  const [showIntro, setShowIntro] = useState(true);
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [checkingKey, setCheckingKey] = useState<boolean>(true);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  
  // Lifted History State for Persistence
  const [repoHistory, setRepoHistory] = useState<RepoHistoryItem[]>([]);
  const [articleHistory, setArticleHistory] = useState<ArticleHistoryItem[]>([]);

  useEffect(() => {
    // Check local storage for theme preference
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const checkKey = async () => {
      // Priority 1: Check Local Storage (User Manual Input)
      const storedKey = localStorage.getItem('gemini_api_key');
      if (storedKey && storedKey.length > 0) {
          setHasApiKey(true);
          setCheckingKey(false);
          return;
      }

      // Priority 2: Check if key is already in environment (Pre-Deployment)
      const envKey = process.env.API_KEY;
      if (envKey && typeof envKey === 'string' && envKey.length > 0 && envKey !== 'undefined') {
        setHasApiKey(true);
        setCheckingKey(false);
        return;
      }

      // Priority 3: Check via AI Studio bridge (Dev environment)
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const has = await window.aistudio.hasSelectedApiKey();
        if (has) {
            setHasApiKey(true);
        } else {
            setHasApiKey(false);
        }
      } else {
        setHasApiKey(false);
      }
      setCheckingKey(false);
    };
    checkKey();
  }, []);

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

  const handleIntroComplete = () => {
    setShowIntro(false);
    // sessionStorage.setItem('hasSeenIntro', 'true'); // Disabled for dev/demo purposes
  };

  const handleNavigate = (mode: ViewMode) => {
    setCurrentView(mode);
  };

  const handleAddRepoHistory = (item: RepoHistoryItem) => {
    setRepoHistory(prev => [item, ...prev]);
  };

  const handleAddArticleHistory = (item: ArticleHistoryItem) => {
    setArticleHistory(prev => [item, ...prev]);
  };
  
  const handleKeyUpdate = () => {
      setHasApiKey(true);
      setShowKeyModal(false);
  };

  if (checkingKey) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-950" />;
  }

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      {/* Enforce API Key Modal if no key, OR if explicitly requested */}
      {(!hasApiKey || showKeyModal) && (
        <ApiKeyModal 
            onKeySelected={handleKeyUpdate} 
            onCancel={() => setShowKeyModal(false)}
            canCancel={hasApiKey} // Can only cancel if we already have a key
        />
      )}

      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

      <header className="relative mt-4 z-50 mx-auto w-[calc(100%-1rem)] md:w-[calc(100%-2rem)] max-w-[1400px]">
        <div className="glass-panel rounded-2xl px-4 md:px-6 py-3 md:py-4 flex justify-between items-center backdrop-blur-2xl dark:border-white/10 border-slate-200/50 shadow-2xl">
          <button 
            onClick={() => setCurrentView(ViewMode.HOME)}
            className="flex items-center gap-3 md:gap-4 group transition-opacity hover:opacity-80"
          >
            {/* Custom Logo Composition */}
            <div className="relative flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-950 border border-slate-300 dark:border-white/10 shadow-lg group-hover:border-violet-500/50 transition-colors overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-emerald-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <Link2 className="w-5 h-5 text-violet-500 dark:text-violet-400 absolute top-2.5 left-2.5 transform -rotate-45" />
               <BarChart3 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 absolute bottom-2.5 right-2.5" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight font-sans flex items-center gap-2">
                Link<span className="text-violet-500 dark:text-violet-400">2</span>Infographic
              </h1>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 tracking-wider uppercase hidden sm:block">Visual Intelligence Platform</p>
            </div>
          </button>
          
          <div className="flex items-center gap-3">
             {/* API Key Settings */}
             <button
                onClick={() => setShowKeyModal(true)}
                className="p-2 md:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-lg"
                title="Manage API Key"
             >
                <Key className="w-5 h-5" />
             </button>

             {/* Theme Toggle */}
             <button
              onClick={toggleTheme}
              className="p-2 md:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-yellow-300 hover:bg-white dark:hover:bg-slate-800 transition-all hover:shadow-lg"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {hasApiKey && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono uppercase tracking-widest cursor-help hover:bg-emerald-500/20 transition-colors" title="API Key Active">
                    <CreditCard className="w-3 h-3" /> Paid Tier
                </div>
            )}
            <a 
              href="https://github.com" 
              target="_blank" 
              rel="noreferrer" 
              className="p-2 md:p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-violet-500/50 transition-all hover:shadow-lg hover:bg-white dark:hover:bg-slate-800"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {/* Navigation Tabs (Hidden on Home, visible on tools) */}
        {currentView !== ViewMode.HOME && (
            <div className="flex justify-center mb-8 md:mb-10 animate-in fade-in slide-in-from-top-4 relative z-40">
            <div className="glass-panel p-1 md:p-1.5 rounded-full flex relative shadow-2xl bg-white/90 dark:bg-slate-900/90 border-slate-200 dark:border-white/10">
                <button
                onClick={() => setCurrentView(ViewMode.HOME)}
                className="relative flex items-center gap-2 px-3 md:px-4 py-2 md:py-2.5 rounded-full font-medium text-sm transition-all duration-300 font-mono text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                title="Home"
                >
                <HomeIcon className="w-4 h-4" />
                </button>
                <div className="w-px h-5 bg-slate-200 dark:bg-white/10 my-auto mx-1"></div>
                <button
                onClick={() => setCurrentView(ViewMode.REPO_ANALYZER)}
                className={`relative flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm transition-all duration-300 font-mono ${
                    currentView === ViewMode.REPO_ANALYZER
                    ? 'text-white bg-slate-900 dark:bg-slate-800 shadow-lg border border-slate-700 dark:border-white/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                >
                <GitBranch className="w-4 h-4" />
                <span className="hidden sm:inline">GitFlow</span>
                </button>
                <button
                onClick={() => setCurrentView(ViewMode.ARTICLE_INFOGRAPHIC)}
                className={`relative flex items-center gap-2 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-medium text-sm transition-all duration-300 font-mono ${
                    currentView === ViewMode.ARTICLE_INFOGRAPHIC
                    ? 'text-emerald-50 bg-emerald-600 dark:bg-emerald-900/30 shadow-lg border border-emerald-500/30'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
                >
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">SiteSketch</span>
                </button>
            </div>
            </div>
        )}

        <div className="flex-1">
            {currentView === ViewMode.HOME && (
                <Home onNavigate={handleNavigate} />
            )}
            {currentView === ViewMode.REPO_ANALYZER && (
                <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 ease-out">
                    <RepoAnalyzer 
                        onNavigate={handleNavigate} 
                        history={repoHistory} 
                        onAddToHistory={handleAddRepoHistory}
                    />
                </div>
            )}
            {currentView === ViewMode.ARTICLE_INFOGRAPHIC && (
                <div className="animate-in fade-in-30 slide-in-from-bottom-4 duration-500 ease-out">
                    <ArticleToInfographic 
                        history={articleHistory} 
                        onAddToHistory={handleAddArticleHistory}
                    />
                </div>
            )}
        </div>
      </main>

      <footer className="py-8 mt-auto border-t border-slate-200 dark:border-white/5 bg-slate-100/50 dark:bg-slate-950/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto text-center px-4">
          <p className="text-base font-mono text-slate-500 dark:text-slate-500">
            <span className="text-slate-700 dark:text-slate-300 font-bold">Link</span><span className="text-violet-500 dark:text-violet-400">2</span><span className="text-emerald-500 dark:text-emerald-400">Infographic</span>$ Powered by DinaMita
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;