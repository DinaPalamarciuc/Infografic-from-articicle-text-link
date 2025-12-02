/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { RepoFileTree, Citation } from '../types';

// Helper to ensure we always get the freshest key from the environment
// immediately before a call.
const getAiClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface InfographicResult {
    imageData: string | null;
    citations: Citation[];
}

export async function improvePrompt(rawInput: string): Promise<string> {
    const ai = getAiClient();
    const prompt = `You are an expert AI Prompt Engineer specializing in Midjourney, DALL-E 3, and Gemini Image Generation for technical and architectural infographics.
    
    User Raw Idea: "${rawInput}"
    
    Task: Rewrite this into a highly detailed, professional image generation prompt.
    Focus on:
    1. Visual Style (e.g., Isometric, Flat, Neon, Bauhaus).
    2. Lighting and Color Palette.
    3. Texture and Rendering details (e.g., Vector line art, 3D Octane render, Matte finish).
    4. Composition (e.g., Knolling, Flow chart, Blueprint).
    
    Constraint: Return ONLY the refined prompt text. Do not add conversational filler like "Here is the prompt".`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: prompt }] }
        });
        return response.text?.trim() || rawInput;
    } catch (error) {
        console.error("Prompt improvement failed:", error);
        return rawInput;
    }
}

export async function generateInfographic(
  repoName: string, 
  fileTree: RepoFileTree[], 
  style: string, 
  is3D: boolean = false,
  language: string = "English",
  aspectRatio: string = "16:9"
): Promise<string | null> {
  const ai = getAiClient();
  // Summarize architecture for the image prompt
  const limitedTree = fileTree.slice(0, 150).map(f => f.path).join(', ');
  
  let styleGuidelines = "";
  let dimensionPrompt = "";

  if (is3D) {
      // OVERRIDE standard styles for a specific "Tabletop Model" look
      styleGuidelines = `VISUAL STYLE: Photorealistic Miniature Diorama. The data flow should look like a complex, glowing 3D printed physical model sitting on a dark, reflective executive desk.`;
      dimensionPrompt = `PERSPECTIVE & RENDER: Isometric view with TILT-SHIFT depth of field (blurry foreground/background) to make it look like a small, tangible object on a table. Cinematic volumetric lighting. Highly detailed, 'octane render' style.`;
  } else {
      // Standard 2D styles or Custom
      switch (style) {
          case "Hand-Drawn Blueprint":
              styleGuidelines = `VISUAL STYLE: Technical architectural blueprint. Dark blue background with white/light blue hand-drawn lines. Looks like a sketch on drafting paper.`;
              break;
          case "Corporate Minimal":
              styleGuidelines = `VISUAL STYLE: Clean, corporate, minimalist. White background, lots of whitespace. Use a limited, professional color palette (greys, navy blues).`;
              break;
          case "Neon Cyberpunk":
              styleGuidelines = `VISUAL STYLE: Dark mode cyberpunk. Black background with glowing neon pink, cyan, and violet lines and nodes. High contrast, futuristic look.`;
              break;
          case "Modern Data Flow":
              styleGuidelines = `VISUAL STYLE: Replicate "Androidify Data Flow" aesthetic. Light blue (#eef8fe) solid background. Colorful, flat vector icons. Smooth, bright blue curved arrows.`;
              break;
          default:
              // Handle custom style string
              if (style && style !== "Custom") {
                  styleGuidelines = `VISUAL STYLE: ${style}.`;
              } else {
                  styleGuidelines = `VISUAL STYLE: Replicate "Androidify Data Flow" aesthetic. Light blue (#eef8fe) solid background. Colorful, flat vector icons. Smooth, bright blue curved arrows.`;
              }
              break;
      }
      dimensionPrompt = "Perspective: Clean 2D flat diagrammatic view straight-on. No 3D effects.";
  }

  const baseStylePrompt = `
  STRICT VISUAL STYLE GUIDELINES:
  ${styleGuidelines}
  - LAYOUT: Distinct Left-to-Right flow.
  - CENTRAL CONTAINER: Group core logic inside a clearly defined central area.
  - ICONS: Use relevant technical icons (databases, servers, code files, users).
  - TYPOGRAPHY: Highly readable technical font. Text MUST be in ${language}.
  - ASPECT RATIO: ${aspectRatio}
  `;

  const prompt = `Create a highly detailed technical logical data flow diagram infographic for GitHub repository : "${repoName}".
  
  ${baseStylePrompt}
  ${dimensionPrompt}
  
  Repository Context: ${limitedTree}...
  
  Diagram Content Requirements:
  1. Title exactly: "${repoName} Data Flow" (Translated to ${language} if not English)
  2. Visually map the likely data flow based on the provided file structure.
  3. Ensure the "Input -> Processing -> Output" structure is clear.
  4. Add short, clear text labels to connecting arrows indicating data type (e.g., "JSON", "Auth Token").
  5. IMPORTANT: All text labels and explanations in the image must be written in ${language}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
        imageConfig: {
            aspectRatio: aspectRatio,
        }
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini infographic generation failed:", error);
    throw error;
  }
}

export async function askRepoQuestion(question: string, infographicBase64: string, fileTree: RepoFileTree[]): Promise<string> {
  const ai = getAiClient();
  // Provide context about the file structure to supplement the image
  const limitedTree = fileTree.slice(0, 300).map(f => f.path).join('\n');
  
  const prompt = `You are a senior software architect reviewing a project.
  
  Attached is an architectural infographic of the project.
  Here is the actual file structure of the repository:
  ${limitedTree}
  
  User Question: "${question}"
  
  Using BOTH the visual infographic and the file structure as context, answer the user's question. 
  If they ask about optimization, suggest specific areas based on the likely bottlenecks visible in standard architectures like this.
  Keep answers concise, technical, and helpful.`;

  try {
    const response = await ai.models.generateContent({
       model: 'gemini-3-pro-preview',
       contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/png',
              data: infographicBase64
            }
          },
          { text: prompt }
        ]
      }
    });

    return response.text || "I couldn't generate an answer at this time.";
  } catch (error) {
    console.error("Gemini Q&A failed:", error);
    throw error;
  }
}

export async function askNodeSpecificQuestion(
  nodeLabel: string, 
  question: string, 
  fileTree: RepoFileTree[]
): Promise<string> {
  const ai = getAiClient();
  const limitedTree = fileTree.slice(0, 300).map(f => f.path).join('\n');
  
  const prompt = `You are a senior software architect analyzing a repository.
  
  The user is asking about a specific node in the dependency graph labeled: "${nodeLabel}".
  
  Repository File Structure Context (first 300 files):
  ${limitedTree}
  
  User Question: "${question}"
  
  Based on the node name "${nodeLabel}" and the file structure, explain what this component likely does, its responsibilities, and answer the specific question.
  Keep the response technical, concise, and helpful for a developer.`;

  try {
    const response = await ai.models.generateContent({
       model: 'gemini-3-pro-preview',
       contents: {
        parts: [
          { text: prompt }
        ]
      }
    });

    return response.text || "I couldn't generate an answer at this time.";
  } catch (error) {
    console.error("Gemini Node Q&A failed:", error);
    throw error;
  }
}

export async function generateArticleInfographic(
  content: string, 
  inputType: 'url' | 'text',
  contentType: 'article' | 'product',
  style: string, 
  onProgress?: (stage: string) => void,
  language: string = "English",
  referenceImage?: { data: string, mimeType: string } | null,
  aspectRatio: string = "3:4"
): Promise<InfographicResult> {
    const ai = getAiClient();
    // PHASE 1: Content Understanding & Structural Breakdown (The "Planner")
    if (onProgress) onProgress(contentType === 'product' ? "ANALYZING PRODUCT SPECS..." : "ANALYZING ARTICLE STRUCTURE...");
    
    let structuralSummary = "";
    let citations: Citation[] = [];

    // Define specific prompts based on content type
    const productSystemInstruction = `You are an E-commerce Visual Merchandising Expert. Your goal is to extract product specifications, key selling points, and features to create a high-converting product infographic.`;
    const articleSystemInstruction = `You are an expert Information Designer. Your goal is to extract the essential structure from content to create a clear, educational infographic.`;

    const productOutputReqs = `
            1. PRODUCT NAME: The specific name of the item.
            2. KEY FEATURES: The top 4-6 features (e.g. "Waterproof", "50h Battery", "Organic Cotton").
            3. TECHNICAL SPECS: Specific data (Dimensions, Weight, Material, Ingredients).
            4. VALUE PROPOSITION: One short sentence on why to buy it.
            5. VISUAL METAPHOR IDEA: Suggest a layout (e.g., "Exploded view of components", "Feature callouts around central photo", "Comparison table").`;
            
    const articleOutputReqs = `
            1. INFOGRAPHIC HEADLINE: The core topic in 5 words or less.
            2. KEY TAKEAWAYS: The 3 to 5 most important distinct points, steps, or facts.
            3. SUPPORTING DATA: Any specific numbers, percentages, or very short quotes.
            4. VISUAL METAPHOR IDEA: Suggest ONE simple visual concept (e.g., "a roadmap", "three pillars").`;

    const promptInstruction = contentType === 'product' ? productSystemInstruction : articleSystemInstruction;
    const outputReqs = contentType === 'product' ? productOutputReqs : articleOutputReqs;

    if (inputType === 'url') {
        try {
            const analysisPrompt = `${promptInstruction}

            Analyze the content at this URL: ${content}
            
            TARGET LANGUAGE: ${language}.
            
            Provide a structured breakdown specifically designed for visual representation in ${language}:
            ${outputReqs}
            
            Keep the output concise and focused purely on what should be ON the infographic. Ensure all content is in ${language}.`;

            // Switch to 'gemini-3-pro-image-preview' for research phase as requested when using tools.
            const analysisResponse = await ai.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: analysisPrompt,
                config: {
                    tools: [{ googleSearch: {} }],
                }
            });
            structuralSummary = analysisResponse.text || "";

            // Extract citations from grounding metadata with Titles
            const chunks = analysisResponse.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (chunks) {
                chunks.forEach((chunk: any) => {
                    if (chunk.web?.uri) {
                        citations.push({
                            uri: chunk.web.uri,
                            title: chunk.web.title || "" 
                        });
                    }
                });
                // Deduplicate citations based on URI
                const uniqueCitations = new Map();
                citations.forEach(c => uniqueCitations.set(c.uri, c));
                citations = Array.from(uniqueCitations.values());
            }

        } catch (e) {
            console.warn("Content analysis failed, falling back to direct prompt", e);
            structuralSummary = `Create an infographic about: ${content}. Translate text to ${language}.`;
        }
    } else {
        // Text Input Mode
        try {
            const analysisPrompt = `${promptInstruction}

            SOURCE TEXT:
            "${content.substring(0, 25000)}"
            
            TARGET LANGUAGE: ${language}.
            
            Provide a structured breakdown specifically designed for visual representation in ${language}:
            ${outputReqs}
            
            Keep the output concise. Ensure all content is in ${language}.`;

            const analysisResponse = await ai.models.generateContent({
                model: 'gemini-3-pro-preview', // High reasoning model for text analysis
                contents: analysisPrompt
            });
            structuralSummary = analysisResponse.text || "";
            // No citations for raw text input
        } catch (e) {
             console.error("Text analysis failed", e);
             structuralSummary = `Create an infographic based on the provided text. Translate text to ${language}.`;
        }
    }

    // PHASE 2: Visual Synthesis (The "Artist")
    if (onProgress) onProgress("DESIGNING & RENDERING INFOGRAPHIC...");

    let styleGuidelines = "";
    if (referenceImage) {
        styleGuidelines = `VISUAL STYLE:
        Match the aesthetic of the provided reference image provided in this prompt.
        - Analyze the color palette, typography style, spacing, and general "vibe" of the reference image.
        - Apply this visual identity to the generated infographic.
        - Ensure the infographic looks like it belongs on the same website/brand as the reference image.`;
    } else {
        // Fallback to presets if no reference image
        switch (style) {
            case "Fun & Playful":
                styleGuidelines = `STYLE: Fun, playful, vibrant 2D vector illustrations. Use bright colors, rounded shapes, and a friendly tone.`;
                break;
            case "Clean Minimalist":
                styleGuidelines = `STYLE: Ultra-minimalist. Lots of whitespace, thin lines, limited color palette (1-2 accent colors max). Very sophisticated and airy.`;
                break;
            case "Dark Mode Tech":
                styleGuidelines = `STYLE: Dark mode technical aesthetic. Dark slate/black background with bright, glowing accent colors (cyan, lime green) for data points.`;
                break;
            case "Modern Editorial":
                styleGuidelines = `STYLE: Modern, flat vector illustration style. Clean, professional, and editorial (like a high-end tech magazine). Cohesive, mature color palette.`;
                break;
            case "Human-like Hand-Drawn":
                 styleGuidelines = `STYLE: Authentic hand-drawn illustration. Imperfect, sketchy lines, marker or pencil textures, warm paper-like background. Looks like a talented human drew it in a notebook. Inviting and approachable.`;
                 break;
            case "Natural & Organic":
                 styleGuidelines = `STYLE: Natural, organic, and eco-friendly aesthetic. Earth tones (sage greens, terracottas, creams), soft textures, fluid curves instead of sharp angles. Botanical motifs if appropriate.`;
                 break;
            case "E-commerce Showcase":
                 styleGuidelines = `STYLE: High-end Product Photography/Render Hybrid. Central photorealistic representation of the product, surrounded by clean, floating 3D text and icon callouts pointing to specific features. Studio lighting, clean background (white or soft gradient).`;
                 break;
            case "Tech Spec Grid":
                 styleGuidelines = `STYLE: Technical Specification Sheet. Structured grid layout. Industrial design aesthetic. Monospaced fonts, ruler lines, precise alignment. High contrast black and white with one alert color (orange or yellow).`;
                 break;
            default:
                // Custom style logic
                 if (style && style !== "Custom") {
                    styleGuidelines = `STYLE: Custom User Style: "${style}".`;
                 } else {
                    styleGuidelines = `STYLE: Modern, flat vector illustration style. Clean, professional, and editorial (like a high-end tech magazine). Cohesive, mature color palette.`;
                 }
                break;
        }
    }

    const imagePrompt = `Create a professional, high-quality ${contentType === 'product' ? 'product feature' : 'educational'} infographic based strictly on this structured content plan:

    ${structuralSummary}

    VISUAL DESIGN RULES:
    - ${styleGuidelines}
    - LANGUAGE: The text within the infographic MUST be written in ${language}.
    - LAYOUT: MUST follow the "VISUAL METAPHOR IDEA" from the plan above if one was provided.
    - ASPECT RATIO: ${aspectRatio}.
    - TYPOGRAPHY: Clean, highly readable fonts. The Title/Headline must be prominent at the top.
    - CONTENT: Use the analyzed facts/specs in the image. Do not use placeholder text.
    - GOAL: The image must be ${contentType === 'product' ? 'convincing and showcase the product value' : 'informative and readable as a standalone graphic'}.
    `;

    const requestParts: any[] = [{ text: imagePrompt }];
    
    // Append reference image if available
    if (referenceImage) {
        requestParts.push({
            inlineData: {
                data: referenceImage.data,
                mimeType: referenceImage.mimeType
            }
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: {
                parts: requestParts,
            },
            config: {
                responseModalities: [Modality.IMAGE],
                imageConfig: {
                    aspectRatio: aspectRatio,
                }
            },
        });

        let imageData = null;
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
            for (const part of parts) {
                if (part.inlineData && part.inlineData.data) {
                    imageData = part.inlineData.data;
                    break;
                }
            }
        }
        return { imageData, citations };
    } catch (error) {
        console.error("Article infographic generation failed:", error);
        throw error;
    }
}

export async function editImageWithGemini(base64Data: string, mimeType: string, prompt: string): Promise<string | null> {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return part.inlineData.data;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Gemini image editing failed:", error);
    throw error;
  }
}