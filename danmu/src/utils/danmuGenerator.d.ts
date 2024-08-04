// src/utils/danmuGenerator.d.ts
declare module './danmuGenerator' {
    export function danmuGenerator(filePath: string, width?: number, height?: number, fontface?: string, fontsize?: number, alpha?: number, duration?: number): Promise<any>;
    export function manualMatch(episodeID: string, filePath: string): Promise<any>;
  }