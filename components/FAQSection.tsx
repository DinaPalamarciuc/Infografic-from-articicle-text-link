
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQS = [
  {
    question: "How do I visualize a GitHub repository?",
    answer: "Paste a public GitHub URL into GitFlow. Our AI analyzes the structure to generate a logical data flow diagram or 3D model."
  },
  {
    question: "Can I convert blog posts?",
    answer: "Yes. Use 'SiteSketch' to paste any article URL. The AI extracts key takeaways and statistics to generate a professional infographic."
  },
  {
    question: "Is it free to use?",
    answer: "Basic visualizations are free. High-fidelity 3D rendering and complex reasoning use Gemini Pro models, which may require a paid API key."
  },
  {
    question: "What AI models are used?",
    answer: "We leverage Gemini 2.5 Flash for rapid analysis and Gemini 3 Pro for high-fidelity image generation and vision tasks."
  },
  {
    question: "Is my data secure?",
    answer: "We analyze public URLs only. We do not store your code or article contents permanently; analysis happens in real-time."
  },
  {
    question: "Can I export my designs?",
    answer: "Yes, all infographics can be downloaded as high-quality PNGs with embedded metadata (XMP/IPTC) for SEO and archiving."
  }
];

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-5xl mx-auto py-16 animate-in fade-in slide-in-from-bottom-8 duration-700 border-t border-slate-200 dark:border-white/10 mt-20">
      <div className="flex flex-col items-center text-center gap-2 mb-12">
        <div className="flex items-center gap-2 px-3 py-1 bg-violet-500/10 rounded-full text-[10px] font-bold text-violet-500 uppercase tracking-widest mb-2">
            Resources & Support
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-sans">
          Quick Help & FAQ
        </h2>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        {FAQS.map((faq, index) => (
          <div 
            key={index}
            className={`glass-panel bg-white/40 dark:bg-slate-900/40 rounded-2xl overflow-hidden border transition-all duration-300 ${openIndex === index ? 'border-violet-500/40 shadow-lg shadow-violet-500/5 ring-1 ring-violet-500/10' : 'border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'}`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-5 text-left focus:outline-none group"
            >
              <span className={`font-bold text-sm md:text-base transition-colors ${openIndex === index ? 'text-violet-500' : 'text-slate-700 dark:text-slate-200'}`}>
                {faq.question}
              </span>
              <div className={`p-1 rounded-lg transition-all ${openIndex === index ? 'bg-violet-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200'}`}>
                  {openIndex === index ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
              </div>
            </button>
            
            <div 
              className={`
                px-5 text-slate-500 dark:text-slate-400 text-xs md:text-sm leading-relaxed
                transition-all duration-300 ease-in-out overflow-hidden
                ${openIndex === index ? 'max-h-40 opacity-100 pb-5' : 'max-h-0 opacity-0 pb-0'}
              `}
            >
              <div className="pt-3 border-t border-slate-100 dark:border-white/5 font-mono">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQSection;
