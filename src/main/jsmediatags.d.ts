// Minimal type declarations for jsmediatags (no @types package needed).
declare module "jsmediatags" {
  export interface Picture {
    format: string; // e.g. "image/jpeg"
    data: number[]; // raw image bytes
    description?: string;
    type?: string;
  }
  export interface Tags {
    picture?: Picture;
    title?: string;
    artist?: string;
    album?: string;
    [key: string]: unknown;
  }
  export interface TagResult {
    type: string;
    tags: Tags;
  }
  export interface ReadCallbacks {
    onSuccess: (result: TagResult) => void;
    onError: (error: { type?: string; info?: string }) => void;
  }
  export function read(location: string, callbacks: ReadCallbacks): void;
  const jsmediatags: { read: typeof read };
  export default jsmediatags;
}
