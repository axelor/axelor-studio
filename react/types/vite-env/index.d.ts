// Vite import.meta.env types
interface ImportMetaEnv {
  readonly PROD: boolean;
  readonly DEV: boolean;
  readonly VITE_PROXY_CONTEXT: string;
  [key: string]: unknown;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// CSS module declarations
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// SVG imports (Vite returns resolved URL string by default)
declare module '*.svg' {
  const src: string;
  export default src;
}
