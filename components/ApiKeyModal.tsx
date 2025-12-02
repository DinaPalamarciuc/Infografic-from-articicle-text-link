/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { Shield, ExternalLink, CreditCard, Loader2, KeyRound, AlertTriangle, Check, X, Zap } from 'lucide-react';
import { verifyApiKey } from '../services/geminiService';

interface ApiKeyModalProps {
  onKeySelected: (key?: string) => void;
  onCancel?: () => void;
  canCancel?: boolean;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onKeySelected, onCancel, canCancel = false }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [manualKey, setManualKey] = useState('');
  const [mode, setMode] = useState<'select' | 'input'>('input');
  
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleConnect = async () => {
    setIsConnecting(true);
    setErrorMsg(null);
    try {
      if (window.aistudio && window.aistudio.openSelectKey) {
        await window.aistudio.openSelectKey();
        setTimeout(() => {
            onKeySelected();
        }, 500);
      } else {
         setIsConnecting(false);
         setErrorMsg("AI Studio bridge not found. Please enter key manually.");
      }
    } catch (e) {
      console.error("Failed to open key selector", e);
      setIsConnecting(false);
      setErrorMsg("Failed to connect. Please try again.");
    }
  };

  const handleVerify = async () => {
      if (!manualKey.trim()) {
          setErrorMsg("Please enter a key to test.");
          return;
      }
      
      setIsVerifying(true);
      setErrorMsg(null);
      setVerificationStatus('idle');

      const isValid = await verifyApiKey(manualKey.trim());
      
      setIsVerifying(false);
      if (isValid) {
          setVerificationStatus('success');
      } else {
          setVerificationStatus('error');
          setErrorMsg("Key validation failed. Please check the key and try again.");
      }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!manualKey.trim()) {
          setErrorMsg("Please enter a valid API Key.");
          return;
      }
      // Simple validation for Gemini Keys (usually start with AIza)
      if (manualKey.length < 30) {
          setErrorMsg("Key appears too short. Please check your input.");
          return;
      }
      
      // If not yet verified, verify briefly before saving
      if (verificationStatus !== 'success') {
          setIsVerifying(true);
          const isValid = await verifyApiKey(manualKey.trim());
          setIsVerifying(false);
          
          if (!isValid) {
              setVerificationStatus('error');
              setErrorMsg("Invalid API Key. Please check permissions.");
              return;
          }
      }
      
      localStorage.setItem('gemini_api_key', manualKey.trim());
      onKeySelected(manualKey.trim());
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4">
      <div className="w-full max-w-md relative overflow-hidden glass-panel rounded-3xl border border-red-500/30 shadow-[0_0_50px_rgba(220,38,38,0.2)] animate-in fade-in zoom-in-95 duration-300">
        
        {/* Decorative Background */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-red-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        {canCancel && (
            <button 
                onClick={onCancel}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-50"
            >
                <X className="w-5 h-5" />
            </button>
        )}

        <div className="p-8 relative z-10 flex flex-col items-center text-center space-y-6">
          
          <div className="w-16 h-16 bg-slate-900/50 rounded-2xl flex items-center justify-center border border-red-500/30 shadow-xl">
             <KeyRound className="w-8 h-8 text-red-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white font-sans">Paid Access Required</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Link2Infographic requires advanced Gemini models. Please provide a key associated with a <span className="text-slate-200 font-semibold">Google Cloud Billing Project</span>.
            </p>
          </div>

          {mode === 'input' ? (
              <form onSubmit={handleManualSubmit} className="w-full space-y-4">
                  <div className="relative">
                      <input 
                        type="password"
                        value={manualKey}
                        onChange={(e) => {
                            setManualKey(e.target.value);
                            setVerificationStatus('idle'); // Reset verification on edit
                        }}
                        placeholder="Paste your Gemini API Key here"
                        className={`w-full bg-slate-950/50 border rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-red-500/50 font-mono text-sm transition-all pr-10 ${verificationStatus === 'success' ? 'border-emerald-500/50 focus:border-emerald-500/50' : verificationStatus === 'error' ? 'border-red-500/80 focus:border-red-500' : 'border-slate-700 focus:border-red-500/50'}`}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          {isVerifying ? (
                              <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                          ) : verificationStatus === 'success' ? (
                              <Check className="w-4 h-4 text-emerald-500" />
                          ) : verificationStatus === 'error' ? (
                              <AlertTriangle className="w-4 h-4 text-red-500" />
                          ) : null}
                      </div>
                  </div>
                  
                  {errorMsg && (
                    <div className="w-full p-3 bg-red-950/50 border border-red-500/30 rounded-lg text-red-300 text-xs font-mono text-left animate-in slide-in-from-top-1 flex items-center gap-2">
                        <AlertTriangle className="w-3 h-3 shrink-0" /> {errorMsg}
                    </div>
                  )}

                  {verificationStatus === 'success' && (
                      <div className="w-full p-2 bg-emerald-950/30 border border-emerald-500/30 rounded-lg text-emerald-400 text-xs font-mono text-center animate-in slide-in-from-top-1">
                          Key Verified Successfully
                      </div>
                  )}

                  <div className="grid grid-cols-3 gap-3">
                      <button 
                        type="button"
                        onClick={handleVerify}
                        disabled={isVerifying || !manualKey}
                        className="col-span-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-xs"
                      >
                         {isVerifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                         Test
                      </button>

                      <button 
                        type="submit"
                        disabled={isVerifying}
                        className="col-span-2 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 group"
                      >
                        <Check className="w-4 h-4" /> Save API Key
                      </button>
                  </div>
                  
                  {window.aistudio && (
                      <button 
                        type="button" 
                        onClick={() => { setMode('select'); setErrorMsg(null); }}
                        className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4"
                      >
                          I'm a developer (Use AI Studio Bridge)
                      </button>
                  )}
              </form>
          ) : (
            <>
                 <button 
                    onClick={handleConnect}
                    disabled={isConnecting}
                    className="w-full py-4 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-red-900/80 hover:to-red-800/80 border border-white/10 hover:border-red-500/50 text-white rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2 group disabled:opacity-70"
                >
                    {isConnecting ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" /> Connecting...
                        </>
                    ) : (
                        <>
                            <CreditCard className="w-5 h-5 group-hover:text-red-200" /> Select via AI Studio
                        </>
                    )}
                </button>
                <button 
                    type="button" 
                    onClick={() => { setMode('input'); setErrorMsg(null); }}
                    className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-4"
                >
                    Enter Key Manually
                </button>
            </>
          )}

          <div className="pt-4 border-t border-white/5 w-full">
             <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors font-mono"
             >
                Get a Paid Key <ExternalLink className="w-3 h-3" />
             </a>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;