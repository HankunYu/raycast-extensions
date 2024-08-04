declare module './danmuGenerator' {
    export function danmuGenerator(path: string): Promise<any>;
    export function manualMatch(id: string, path: string): Promise<any>;
  }
  