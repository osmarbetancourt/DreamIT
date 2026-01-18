declare module 'three/examples/jsm/lights/RectAreaLightUniformsLib' {
  export const RectAreaLightUniformsLib: {
    init: () => void;
    // other helpers may exist, keep as any for safety
    [key: string]: any;
  };
  export default RectAreaLightUniformsLib;
}

// Generic fallback for other three examples imports (optional)
declare module 'three/examples/jsm/*' {
  const whatever: any;
  export default whatever;
}
