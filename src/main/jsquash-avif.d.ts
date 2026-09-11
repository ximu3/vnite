// Node-specific type corrections used by the main process:
// - init accepts a precompiled WebAssembly module.
// - decode accepts a Node Buffer and returns the default 8-bit ImageData output.
//
// Only the signatures currently used by the application are declared here.
declare module '@jsquash/avif/decode.js' {
  export function init(module: WebAssembly.Module): Promise<void>

  export default function decode(
    input: Buffer<ArrayBufferLike>,
    options?: { bitDepth?: 8 }
  ): Promise<ImageData | null>
}
