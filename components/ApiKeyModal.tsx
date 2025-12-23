/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { Shield, ExternalLink, CreditCard, Loader2, KeyRound, Check, X, ShieldCheck, AlertCircle, Sparkles } from 'lucide-react';

interface ApiKeyModalProps {
  onKeySelected: () => void;
  onCancel?: () => void;
  canCancel?: boolean;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onKeySelected, onCancel, canCancel = false }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    try {
      if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
        onKeySelected();
      } else {
         setErrorMsg("The AI Studio selector is unavailable in this environment.");
      }
    } catch (e: any) {
      console.error("Failed to open key selector", e);
      setErrorMsg(e.message || "Failed to connect to AI Studio.");
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4">
      <div className="w-full max-w-md relative overflow-hidden glass-panel rounded-3xl border border-violet-500/30 shadow-[0_0_50px_rgba(139,92,246,0.1)] animate-in fade-in zoom-in-95 duration-300">
        
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl bg-violet-500/20 animate-pulse"></div>
        
        {canCancel && (
            <button onClick={onCancel} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-50">
                <X className="w-5 h-5" />
            </button>
        )}

        <div className="p-8 relative z-10 flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center border border-violet-500/30 bg-slate-900/50 shadow-xl">
             <KeyRound className="w-8 h-8 text-violet-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white font-sans flex items-center gap-2 justify-center">
              <Sparkles className="w-5 h-5 text-violet-400" /> Access Verification
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              This application utilizes high-performance <strong className="text-white">Gemini 3 Pro</strong> models. For security and billing, you must use an API key from a <strong className="text-violet-400">paid Google Cloud project</strong>.
            </p>
          </div>

          <div className="w-full space-y-4">
            <button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-70"
            >
                {isConnecting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                Select Paid API Key
            </button>

            {errorMsg && (
                <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-lg text-red-300 text-xs font-mono text-left flex items-start gap-2">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" /> 
                    <span>{errorMsg}</span>
                </div>
            )}

            <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 text-left space-y-2">
                <div className="flex items-center gap-2 text-violet-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Security First</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                    Your API key is <strong className="text-slate-300">never stored</strong> on our servers. It is strictly injected into your local browser session via the AI Studio bridge.
                </p>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 w-full">
             <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-mono underline underline-offset-4"
             >
                Learn about Billing Requirements <ExternalLink className="w-3 h-3" />
             </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;