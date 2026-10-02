import { MathfieldElement } from "mathlive";

if (typeof window !== 'undefined') {
  MathfieldElement.fontsDirectory = '/fonts';
  
  if ((window as any).mathVirtualKeyboard) {
    (window as any).mathVirtualKeyboard.fontsDirectory = '/fonts';
  }
}
