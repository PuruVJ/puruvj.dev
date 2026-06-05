/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Fontsource packages expose only CSS at their package root. TypeScript 6 flags
// these untyped side-effect imports (ts2882), so declare them as untyped modules.
declare module '@fontsource/*';
declare module '@fontsource-variable/*';
