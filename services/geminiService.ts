
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RepoFileTree, Citation, GeminiModel } from '../types';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined') {
    throw new Error("No API key selected. Please use the 'Set API Key' button.");
  }
  return new GoogleGenAI({ apiKey });
};

export interface InfographicResult {
    imageData: string | null;
    citations: Citation[];
}

export async function processVisionTask(
    base64Data: string, 
    mimeType: string, 
    task: 'prompt' | 'chat' | 'ocr', 
    userQuery?: string,
    model: GeminiModel = 'gemini-3-flash-preview'
): Promise<string> {
    const ai = getAiClient();
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: mimeType
        }
    };

    let prompt = "";
    if (task === 'prompt') {
        prompt = "Analyze this image and generate a highly detailed, professional text prompt that could be used by an AI image generator to recreate this exact scene. Focus on style, lighting, and composition. AT THE END OF YOUR RESPONSE, provide exactly 3 short improvement suggestions (how to make this image better or different) formatted strictly like this: [SUGGESTION: Add more cinematic lighting], [SUGGESTION: Change to vaporwave style], etc.";
    } else if (task === 'ocr') {
        prompt = "Extract all visible text from this image. Maintain the structure where possible. If there is no text, say 'No text detected'. AT THE END, provide 2 suggestions for improving the visual presentation of this text content.";
    } else {
        prompt = (userQuery || "Describe what you see in this image.") + " AT THE END, provide 3 short suggestions for how this image could be visually enhanced or modified for better impact, formatted strictly as [SUGGESTION: ...].";
    }

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: { parts: [imagePart, { text: prompt }] }
        });
        return response.text || "No response generated.";
    } catch (error: any) {
        console.error("Vision task failed:", error);
        throw error;
    }
}

export async function editImageWithGemini(base64Data: string, mimeType: string, prompt: string): Promise<string | null> {
  const ai = getAiClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ inlineData: { data: base64Data, mimeType } }, { text: prompt }] },
    config: { 
        responseModalities: [Modality.IMAGE],
        imageConfig: { aspectRatio: "1:1" }
    },
  });
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) return part.inlineData.data;
  }
  return null;
}

export async function improvePrompt(rawInput: string, model: GeminiModel = 'gemini-3-pro-preview'): Promise<string> {
    const ai = getAiClient();
    const prompt = `Refine this image generation prompt into a professional, highly detailed technical description for an infographic. User input: "${rawInput}". Return only the refined prompt.`;
    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt
        });
        return response.text?.trim() || rawInput;
    } catch (error) {
        return rawInput;
    }
}

export async function generateInfographic(
  repoName: string, 
  fileTree: RepoFileTree[], 
  style: string, 
  is3D: boolean = false,
  language: string = "English",
  aspectRatio: string = "16:9",
  model: GeminiModel = 'gemini-3-pro-preview'
): Promise<string | null> {
  const ai = getAiClient();
  const limitedTree = fileTree.slice(0, 150).map(f => f.path).join(', ');
  const styleGuidelines = is3D 
    ? "3D Miniature Diorama, Isometric, Tilt-shift effect, Cinematic lighting." 
    : `2D Vector Infographic, ${style} style, clean lines, professional layout.`;

  const prompt = `Create a detailed technical data flow diagram infographic for: "${repoName}".
  Style: ${styleGuidelines}.
  Language: ${language}.
  Aspect Ratio: ${aspectRatio}.
  File context: ${limitedTree}...
  Label "Input -> Processing -> Output" flows. All text must be in ${language}.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', // Always use the image model for the visual output
      contents: { parts: [{ text: prompt }] },
      config: {
        responseModalities: [Modality.IMAGE],
        imageConfig: { aspectRatio: aspectRatio }
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return part.inlineData.data;
    }
    return null;
  } catch (error) {
    console.error("Infographic generation failed:", error);
    throw error;
  }
}

export async function generateAcademicInfographic(
  topic: string,
  subject: string,
  style: string,
  onProgress: (stage: string) => void,
  language: string = "English",
  model: GeminiModel = 'gemini-3-pro-preview'
): Promise<string | null> {
    const ai = getAiClient();
    onProgress("ANALYZING SCIENTIFIC DATA...");
    
    // First, get the logical structure of the concept in the target language
    const analysisResponse = await ai.models.generateContent({
        model: model,
        contents: `Explain the fundamental concept of "${topic}" in the field of ${subject}. Break it down into 4 key visual components for an infographic. ALL CONTENT MUST BE IN ${language}. Use academic tone.`
    });
    
    const summary = analysisResponse.text || topic;
    
    onProgress("RENDERING ACADEMIC VISUAL...");
    
    const imagePrompt = `High-quality academic educational infographic. Topic: ${topic}. Subject: ${subject}. Style: ${style}. 
    ALL LABELS AND TEXT IN THE IMAGE MUST BE IN ${language}.
    Visualize: ${summary}. Include cross-sections, structural labels, and professional technical annotations in ${language}. Cinematic lighting, sharp details, textbook-level accuracy.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: [{ text: imagePrompt }] },
        config: {
            responseModalities: [Modality.IMAGE],
            imageConfig: { aspectRatio: "3:4" }
        }
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return part.inlineData.data;
    }
    return null;
}

export async function askNodeSpecificQuestion(nodeLabel: string, question: string, fileTree: RepoFileTree[], model: GeminiModel = 'gemini-3-pro-preview'): Promise<string> {
  const ai = getAiClient();
  const prompt = `Node: ${nodeLabel}. Context: ${fileTree.slice(0, 50).map(f => f.path).join(', ')}. Question: ${question}`;
  const response = await ai.models.generateContent({
    model: model,
    contents: prompt
  });
  return response.text || "No response.";
}

export async function generateArticleInfographic(
  content: string, 
  inputType: 'url' | 'text',
  contentType: 'article' | 'product',
  style: string, 
  onProgress?: (stage: string) => void,
  language: string = "English",
  referenceImage?: { data: string, mimeType: string } | null,
  aspectRatio: string = "3:4",
  model: GeminiModel = 'gemini-3-pro-preview'
): Promise<InfographicResult> {
    const ai = getAiClient();
    if (onProgress) onProgress("ANALYZING SOURCE...");
    const analysisResponse = await ai.models.generateContent({
        model: model,
        contents: `Analyze this ${contentType} for an infographic (${language}): ${content.substring(0, 5000)}`,
        config: inputType === 'url' ? { tools: [{ googleSearch: {} }] } : undefined
    });
    const summary = analysisResponse.text || "";
    const citations: Citation[] = [];
    const chunks = analysisResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
        chunks.forEach((c: any) => c.web && citations.push({ uri: c.web.uri, title: c.web.title }));
    }

    if (onProgress) onProgress("GENERATING VISUAL...");
    const imagePrompt = `Professional ${contentType} infographic in ${language}. Style: ${style}. Content: ${summary}`;
    const parts: any[] = [{ text: imagePrompt }];
    if (referenceImage) parts.push({ inlineData: referenceImage });

    const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts },
        config: {
            responseModalities: [Modality.IMAGE],
            imageConfig: { aspectRatio: aspectRatio }
        },
    });

    let imageData = null;
    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) imageData = part.inlineData.data;
    }
    return { imageData, citations };
}
