/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    question: "How do I visualize a GitHub repository?",
    answer: "Simply paste a public GitHub URL (e.g., facebook/react) into the GitFlow tool. Our AI analyzes the file structure to understand the architecture and generates a logical data flow diagram or a 3D holographic model representing your codebase."
  },
  {
    question: "Can I convert a blog post into an infographic?",
    answer: "Yes! Use the 'SiteSketch' feature. Paste any article URL, and the AI will extract key takeaways, statistics, and headers to generate a professional, educational infographic suitable for social media sharing."
  },
  {
    question: "Is Link2Infographic free to use?",
    answer: "The platform uses advanced AI models. While we provide a free tier for basic visualizations, high-resolution 3D rendering and complex reasoning tasks use Google's Gemini Pro models, which may require a paid API key for extensive use."
  },
  {
    question: "What AI models power this platform?",
    answer: "We leverage Google's latest Gemini 2.5 Flash for rapid structural analysis and Gemini 3 Pro for high-fidelity image generation, ensuring state-of-the-art visual intelligence."
  },
  {
    question: "Is my data secure?",
    answer: "Yes. We analyze public repositories and public URLs. We do not store your code or the contents of the articles permanently. The analysis happens in real-time to generate the visual asset."
  }
];

const FAQSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-3xl mx-auto py-12 animate-in fade-in slide-in-from-bottom-8 duration-700 border-t border-slate-200 dark:border-white/10 mt-12">
      <div className="flex items-center justify-center gap-2 mb-10">
        <div className="p-3 bg-violet-100 dark:bg-violet-500/10 rounded-full">
            <HelpCircle className="w-6 h-6 text-violet-500 dark:text-violet-400" />
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white font-sans">
          Frequently Asked Questions
        </h2>
      </div>
      
      <div className="space-y-4">
        {FAQS.map((faq, index) => (
          <div 
            key={index}
            className={`glass-panel bg-white/50 dark:bg-slate-900/50 rounded-2xl overflow-hidden border transition-all duration-300 ${openIndex === index ? 'border-violet-500/50 shadow-lg shadow-violet-500/10' : 'border-slate-200 dark:border-white/5 hover:border-violet-500/30'}`}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full flex items-center justify-between p-4 md:p-6 text-left focus:outline-none"
            >
              <span className="font-semibold text-slate-800 dark:text-slate-200 font-sans pr-4 text-base md:text-lg">
                {faq.question}
              </span>
              <div className={`p-1 rounded-full transition-colors ${openIndex === index ? 'bg-violet-100 dark:bg-violet-500/20' : 'bg-transparent'}`}>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-violet-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                  )}
              </div>
            </button>
            
            <div 
              className={`
                px-4 md:px-6 text-slate-600 dark:text-slate-400 text-sm md:text-base leading-relaxed font-mono
                transition-all duration-300 ease-in-out overflow-hidden
                ${openIndex === index ? 'max-h-48 opacity-100 pb-6' : 'max-h-0 opacity-0 pb-0'}
              `}
            >
              <div className="pt-2 border-t border-slate-100 dark:border-white/5">
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