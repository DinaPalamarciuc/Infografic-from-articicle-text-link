
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { ViewMode } from '../types';
import { 
  GitBranch, 
  FileText, 
  ImageIcon, 
  Sparkles, 
  ArrowRight, 
  GraduationCap, 
  Code2, 
  ShoppingBag, 
  ShieldCheck, 
  Globe, 
  Layers, 
  Zap, 
  Lightbulb 
} from 'lucide-react';
import FAQSection from './FAQSection';

interface HomeProps {
  onNavigate: (mode: ViewMode) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-24 mb-20">
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 text-sm font-mono text-slate-600 dark:text-white mb-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-default shadow-sm">
            <Sparkles className="w-4 h-4 text-fuchsia-500 dark:text-fuchsia-400" />
            <span>Visual Intelligence Ecosystem v3.5</span>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white font-sans leading-tight drop-shadow-sm dark:drop-shadow-lg">
          Link<span className="text-violet-500">2</span>Infographic
        </h1>
        
        <p className="text-slate-600 dark:text-slate-300 text-2xl font-light max-w-2xl mx-auto leading-relaxed">
          The ultimate engine for transforming raw links and curiosity into <strong className="text-violet-500">High-Fidelity Visuals</strong>.
        </p>

        {/* Bento Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pt-12 w-full mx-auto">
            
            {/* GitFlow Card */}
            <button 
                onClick={() => onNavigate(ViewMode.REPO_ANALYZER)}
                className="relative group overflow-hidden rounded-[32px] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-8 text-left hover:border-violet-500/50 transition-all hover:shadow-2xl hover:shadow-violet-500/10"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                     <Code2 className="w-24 h-24 text-violet-500" />
                </div>
                <div className="relative z-10 space-y-4">
                    <div className="w-12 h-12 bg-violet-100 dark:bg-violet-500/20 rounded-2xl flex items-center justify-center text-violet-600 dark:text-violet-300 shadow-lg">
                        <GitBranch className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">GitFlow</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">Map repository structures into architectural blueprints.</p>
                    </div>
                    <div className="flex items-center gap-2 text-violet-500 font-bold text-xs group-hover:translate-x-1 transition-transform">
                        Build Architectures <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                </div>
            </button>

            {/* SiteSketch Card */}
            <button 
                onClick={() => onNavigate(ViewMode.ARTICLE_INFOGRAPHIC)}
                className="relative group overflow-hidden rounded-[32px] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-8 text-left hover:border-emerald-500/50 transition-all hover:shadow-2xl hover:shadow-emerald-500/10"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                     <FileText className="w-24 h-24 text-emerald-500" />
                </div>
                <div className="relative z-10 space-y-4">
                     <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-300 shadow-lg">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">SiteSketch</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">Synthesize articles and product specs into visual summaries.</p>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs group-hover:translate-x-1 transition-transform">
                        Sketch Web <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                </div>
            </button>

            {/* EduVision Card */}
            <button 
                onClick={() => onNavigate(ViewMode.ACADEMIC_STUDIO)}
                className="relative group overflow-hidden rounded-[32px] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-8 text-left hover:border-indigo-500/50 transition-all hover:shadow-2xl hover:shadow-indigo-500/10"
            >
                <div className="absolute -top-1 -right-1 z-20">
                    <div className="bg-indigo-500 text-white text-[9px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest shadow-lg">New</div>
                </div>
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                     <GraduationCap className="w-24 h-24 text-indigo-500" />
                </div>
                <div className="relative z-10 space-y-4">
                     <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-300 shadow-lg">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">EduVision</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">Visualize complex scientific concepts & human anatomy.</p>
                        <div className="mt-2 flex items-center gap-2">
                             <Globe className="w-3 h-3 text-indigo-400" />
                             <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase tracking-wider">Multi-Language</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-indigo-500 font-bold text-xs group-hover:translate-x-1 transition-transform">
                        Explore Concepts <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                </div>
            </button>

            {/* Vision Remix Card */}
            <button 
                onClick={() => onNavigate(ViewMode.VISION_STUDIO)}
                className="relative group overflow-hidden rounded-[32px] border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60 p-8 text-left hover:border-amber-500/50 transition-all hover:shadow-2xl hover:shadow-amber-500/10"
            >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110">
                     <ImageIcon className="w-24 h-24 text-amber-500" />
                </div>
                <div className="relative z-10 space-y-4">
                     <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center text-amber-600 dark:text-amber-300 shadow-lg">
                        <ImageIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Vision Remix</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">Reverse-engineer prompts from images, then adjust and regenerate.</p>
                    </div>
                    <div className="flex items-center gap-2 text-amber-500 font-bold text-xs group-hover:translate-x-1 transition-transform">
                        Analyze & Remix <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                </div>
            </button>
        </div>
      </div>

      {/* Dynamic Feature Highlights */}
      <div className="grid md:grid-cols-3 gap-12 pt-12 border-t border-slate-200 dark:border-white/10">
              <div className="space-y-6 group">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                      <Code2 className="w-7 h-7 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">For Developers</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        Instantly map dependency hierarchies. Generate production-ready architecture diagrams for READMEs and documentation without manual drawing.
                    </p>
                  </div>
              </div>
              <div className="space-y-6 group">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform shadow-indigo-500/5 shadow-2xl">
                      <GraduationCap className="w-7 h-7 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">For Students</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        Demystify abstract subjects. Visualize the human respiratory system, quantum mechanics, or molecular bonds in 10+ languages with professional annotations.
                    </p>
                  </div>
              </div>
              <div className="space-y-6 group">
                  <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                      <Zap className="w-7 h-7 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">For Marketing</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        Convert feature lists and technical specs into high-impact product infographics and social-ready visual highlights for your audience.
                    </p>
                  </div>
              </div>
      </div>

      {/* Global Capability Highlight */}
      <div className="glass-panel p-10 rounded-[48px] bg-indigo-600/5 dark:bg-indigo-500/5 border border-indigo-500/20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12 group">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-indigo-500/20 transition-colors"></div>
          <div className="relative z-10 max-w-xl space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                  Intelligence Unleashed
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Global Learning at <br/><span className="text-indigo-500">Your Fingertips</span>.
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                Our EduVision engine now supports multiple global languages, enabling students worldwide to receive deep conceptual explanations in their native tongue. From biology to physics, complexity is now universally visual.
              </p>
              <button 
                onClick={() => onNavigate(ViewMode.ACADEMIC_STUDIO)}
                className="px-8 py-4 bg-indigo-500 text-white rounded-2xl font-bold text-sm shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 transition-all flex items-center gap-3 active:scale-95"
              >
                  Start Learning Now <ArrowRight className="w-4 h-4" />
              </button>
          </div>
          <div className="relative z-10 grid grid-cols-2 gap-4">
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl shadow-sm space-y-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 font-bold text-sm">EN</div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">English</p>
              </div>
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl shadow-sm space-y-3 translate-y-6">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 font-bold text-sm">RO</div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Romanian</p>
              </div>
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl shadow-sm space-y-3">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 font-bold text-sm">ES</div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spanish</p>
              </div>
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl shadow-sm space-y-3 translate-y-6">
                  <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 font-bold text-sm">FR</div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">French</p>
              </div>
          </div>
      </div>

      {/* Testimonials Section */}
      <div className="space-y-12">
          <div className="text-center">
              <h2 className="text-3xl font-bold text-slate-600 dark:text-slate-400 font-sans">Visualizing for the Elite...</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-10 rounded-[40px] shadow-sm space-y-6 relative overflow-hidden group">
                  <p className="text-lg text-slate-700 dark:text-slate-200 font-medium leading-relaxed italic">
                    “The EduVision module is a game changer. I visualized the internal structure of the mitochondria in seconds. The Da Vinci style is breathtakingly detailed.”
                  </p>
                  <div className="flex items-center justify-between pt-6">
                      <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                          <div>
                              <p className="font-bold text-slate-900 dark:text-white">Alex Dumitrescu</p>
                              <p className="text-xs text-slate-500">Medical Student</p>
                          </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-500 text-xs font-bold">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verified</span>
                      </div>
                  </div>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 p-10 rounded-[40px] shadow-sm space-y-6 relative overflow-hidden group">
                  <p className="text-lg text-slate-700 dark:text-slate-200 font-medium leading-relaxed italic">
                    “As a software architect, Link2Infographic saves me hours of drawing diagrams. GitFlow understands the logic of my React apps perfectly.”
                  </p>
                  <div className="flex items-center justify-between pt-6">
                      <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
                           <div>
                               <p className="font-bold text-slate-900 dark:text-white">M. Patel</p>
                               <p className="text-xs text-slate-500">Lead Engineer</p>
                           </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-blue-500 text-xs font-bold">
                          <ShieldCheck className="w-4 h-4" />
                          <span>Verified</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <FAQSection />
    </div>
  );
};

export default Home;
