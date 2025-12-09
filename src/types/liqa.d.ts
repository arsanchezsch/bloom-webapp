// src/types/liqa.d.ts

interface LiqaImageCapture {
    blob(): Promise<Blob>;
  }
  
  interface HautaiLiqaElement extends HTMLElement {
    addEventListener(
      type: "captures",
      listener: (event: CustomEvent<LiqaImageCapture[]>) => void,
    ): void;
    removeEventListener(
      type: "captures",
      listener: (event: CustomEvent<LiqaImageCapture[]>) => void,
    ): void;
  }
  
  declare global {
    interface HTMLElementTagNameMap {
      "hautai-liqa": HautaiLiqaElement;
    }
  
    namespace JSX {
      interface IntrinsicElements {
        "hautai-liqa": React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLElement>,
          HTMLElement
        > & {
          license: string;
        };
      }
    }
  }
  
  export {};
  