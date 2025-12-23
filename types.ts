
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { SimulationNodeDatum, SimulationLinkDatum } from 'd3';

export enum ViewMode {
  HOME = 'HOME',
  REPO_ANALYZER = 'REPO_ANALYZER',
  ARTICLE_INFOGRAPHIC = 'ARTICLE_INFOGRAPHIC',
  VISION_STUDIO = 'VISION_STUDIO',
  ACADEMIC_STUDIO = 'ACADEMIC_STUDIO'
}

export type GeminiModel = 'gemini-3-flash-preview' | 'gemini-3-pro-preview';

export interface ModelConfig {
  strategy: GeminiModel;
  drafting: GeminiModel;
  code: GeminiModel;
}

export interface D3Node extends SimulationNodeDatum {
  id: string;
  group: number;
  label: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface D3Link extends SimulationLinkDatum<D3Node> {
  source: string | D3Node;
  target: string | D3Node;
  value: number;
}

export interface DataFlowGraph {
  nodes: D3Node[];
  links: D3Link[];
}

export interface RepoFileTree {
  path: string;
  type: string;
}

export interface DevStudioState {
  repoName: string;
  fileTree: RepoFileTree[];
  graphData: DataFlowGraph;
}

export interface Citation {
    uri: string;
    title: string;
}

export interface ImageMetadata {
  title: string;
  author: string;
  description: string;
  keywords: string;
  copyright: string;
  date: string;
}

export interface RepoHistoryItem {
  id: string;
  repoName: string;
  imageData: string;
  is3D: boolean;
  style: string;
  date: Date;
}

export interface ArticleHistoryItem {
    id: string;
    title: string;
    url: string;
    imageData: string;
    citations: Citation[];
    date: Date;
}

export interface AcademicHistoryItem {
    id: string;
    topic: string;
    subject: string;
    imageData: string;
    date: Date;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
