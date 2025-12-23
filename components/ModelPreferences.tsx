
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { BrainCircuit, ChevronDown } from 'lucide-react';
import { ModelConfig, GeminiModel } from '../types';

interface ModelPreferencesProps {
  config: ModelConfig;
  onChange: (newConfig: ModelConfig) => void;
}

const ModelPreferences: React.FC<ModelPreferencesProps> = ({ config, onChange }) => {
  const handleModelChange = (key: keyof ModelConfig, value: string) => {
    onChange({ ...config, [key]: value as GeminiModel });
  };

  const selectClasses = "w-full appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 ring-violet-500/50 transition-all cursor-pointer pr-10";
  const labelClasses = "block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-2 ml-1";

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="glass-panel rounded-3xl p-6 border border-violet-500/20 bg-white/40 dark:bg-slate-900/40 shadow-xl backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-violet-500/10 rounded-lg">
            <BrainCircuit className="w-5 h-5 text-violet-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Gemini Model Preferences</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Strategy Model */}
          <div className="relative group">
            <label className={labelClasses}>Default Strategy</label>
            <div className="relative">
              <select 
                value={config.strategy}
                onChange={(e) => handleModelChange('strategy', e.target.value)}
                className={selectClasses}
              >
                <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                <option value="gemini-3-pro-preview">Gemini 3 Pro (Expert)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-violet-500 transition-colors" />
            </div>
          </div>

          {/* Drafting Model */}
          <div className="relative group">
            <label className={labelClasses}>Default Drafting</label>
            <div className="relative">
              <select 
                value={config.drafting}
                onChange={(e) => handleModelChange('drafting', e.target.value)}
                className={selectClasses}
              >
                <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                <option value="gemini-3-pro-preview">Gemini 3 Pro (Expert)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-violet-500 transition-colors" />
            </div>
          </div>

          {/* Code Model */}
          <div className="relative group">
            <label className={labelClasses}>Default Code</label>
            <div className="relative">
              <select 
                value={config.code}
                onChange={(e) => handleModelChange('code', e.target.value)}
                className={selectClasses}
              >
                <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
                <option value="gemini-3-pro-preview">Gemini 3 Pro (Expert)</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-violet-500 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelPreferences;
