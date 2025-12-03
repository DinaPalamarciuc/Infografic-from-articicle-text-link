/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ViewMode } from '../types';
import { GitBranch, FileText, Link, BrainCircuit, Image, Sparkles, ArrowRight, CheckCircle2, Users, ShoppingBag, Code2 } from 'lucide-react';
import FAQSection from './FAQSection';

interface HomeProps {
  onNavigate: (mode: ViewMode) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-5xl mx-auto space-y-24 mb-20">
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-sm font-mono text-slate-600 dark:text-white mb-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-default shadow-sm">
            <Sparkles className="w-4 h-4 text-fuchsia-500 dark:text-fuchsia-400" />
            <span>Powered by DinaMita</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans leading-tight drop-shadow-sm dark:drop-shadow-lg">
          Link2Infographic
        </h1>
        
        <p className="text-slate-600 dark:text-slate-100 text-2xl font-light max-w-2xl mx-auto leading-relaxed">
          Transform URLs into professional visual assets instantly using Generative AI.
        </p>

        {/* Main Action Cards (Bento Grid) */}
        <div className="grid md:grid-cols-2 gap-6 pt-8 w-full max-w-4xl mx-auto">
            
            {/* GitFlow Card */}
            <button 
                onClick={() => onNavigate(ViewMode.REPO_ANALYZER)}
                className="relative group overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-8 text-left hover:border-violet-500/50 transition-all hover:shadow-2xl hover:shadow-violet-500/10"
            >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                     <Code2 className="w-32 h-32 text-violet-500" />
                </div>
                
                <div className="relative z-10 space-y-4">
                    <div className="w-12 h-12 bg-violet-100 dark:bg-violet-500/20 rounded-2xl flex items-center justify-center text-violet-600 dark:text-violet-300 group-hover:bg-violet-500 group-hover:text-white transition-colors shadow-lg">
                        <GitBranch className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-sans group-hover:text-violet-500 transition-colors">GitFlow Visualizer</h3>
                        <p className="text-slate-500 dark:text-slate-200 leading-relaxed text-sm">
                            Paste a GitHub repository link to generate architectural blueprints and data flow diagrams.
                        </p>
                    </div>
                    <div className="pt-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-300 font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Visualize Logic Flow
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-300 font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> 2D Diagrams & 3D Models
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-violet-500 font-bold text-sm mt-2 group-hover:translate-x-2 transition-transform">
                        Start Analysis <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </button>

            {/* SiteSketch Card */}
            <button 
                onClick={() => onNavigate(ViewMode.ARTICLE_INFOGRAPHIC)}
                className="relative group overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-8 text-left hover:border-emerald-500/50 transition-all hover:shadow-2xl hover:shadow-emerald-500/10"
            >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                     <FileText className="w-32 h-32 text-emerald-500" />
                </div>
                
                <div className="relative z-10 space-y-4">
                     <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-300 group-hover:bg-emerald-500 group-hover:text-white transition-colors shadow-lg">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 font-sans group-hover:text-emerald-500 transition-colors">SiteSketch Designer</h3>
                        <p className="text-slate-500 dark:text-slate-200 leading-relaxed text-sm">
                            Convert articles, blog posts, or product pages into sharable summary infographics.
                        </p>
                    </div>
                     <div className="pt-4 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-300 font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Summarize Key Points
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-300 font-mono">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Extract Product Specs
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm mt-2 group-hover:translate-x-2 transition-transform">
                        Create Infographic <ArrowRight className="w-4 h-4" />
                    </div>
                </div>
            </button>
        </div>
      </div>

      {/* Use Cases Section - Informational */}
      <div className="border-t border-slate-200 dark:border-white/10 pt-16">
          <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4 font-sans">Who is this for?</h2>
              <p className="text-slate-500 dark:text-slate-200">Discover how visual intelligence accelerates your workflow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-6 border border-slate-200 dark:border-white/5">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                      <Code2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Developers</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-300 leading-relaxed">
                      Instant onboarding. Visualize complex codebases you've never seen before. Generate architecture diagrams for documentation automatically.
                  </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-6 border border-slate-200 dark:border-white/5">
                  <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/30 rounded-full flex items-center justify-center mb-4">
                      <Users className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Content Marketers</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-300 leading-relaxed">
                      Repurpose content. Turn a 2000-word blog post into a digestible, viral infographic for LinkedIn or Twitter in seconds.
                  </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-6 border border-slate-200 dark:border-white/5">
                  <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4">
                      <ShoppingBag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">E-commerce</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-300 leading-relaxed">
                      Visualize value. Create comparison charts and feature highlight sheets from product pages to increase conversion rates.
                  </p>
              </div>
          </div>
      </div>

      <FAQSection />
    </div>
  );
};

export default Home;