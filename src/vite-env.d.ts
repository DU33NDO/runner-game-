/// <reference types="vite/client" />

declare module '*.png?url' {
  const src: string;
  export default src;
}

declare module '*.webp?url' {
  const src: string;
  export default src;
}

declare module '*.plist?raw' {
  const content: string;
  export default content;
}
