export type UpscalerBackend = 'waifu2x' | 'realcugan' | 'realesrgan'

export interface GameImageUpscaleOptions {
  scale?: number
  model?: string
  denoiseLevel?: number
}

export interface Waifu2xUpscalerConfig {
  scale: number
  model: Waifu2xModel
  denoiseLevel: Waifu2xDenoiseLevel
}

export interface RealcuganUpscalerConfig {
  scale: number
  model: RealcuganModel
  denoiseLevel: RealcuganDenoiseLevel
}

export interface RealesrganUpscalerConfig {
  scale: number
  model: RealesrganModel
}

export interface LocalUpscalerConfig {
  waifu2x: Waifu2xUpscalerConfig
  realcugan: RealcuganUpscalerConfig
  realesrgan: RealesrganUpscalerConfig
}

export const UPSCALER_BACKEND_EXECUTABLES = {
  waifu2x: ['waifu2x-ncnn-vulkan.exe', 'waifu2x-ncnn-vulkan'],
  realcugan: ['realcugan-ncnn-vulkan.exe', 'realcugan-ncnn-vulkan'],
  realesrgan: ['realesrgan-ncnn-vulkan.exe', 'realesrgan-ncnn-vulkan']
} as const

const UPSCALER_MODEL_OPTIONS = {
  waifu2x: ['models-cunet', 'models-upconv_7_anime_style_art_rgb', 'models-upconv_7_photo'],
  realcugan: ['models-se', 'models-pro', 'models-nose'],
  realesrgan: ['realesr-animevideov3', 'realesrgan-x4plus', 'realesrgan-x4plus-anime']
} as const satisfies Record<UpscalerBackend, readonly string[]>

const UPSCALER_STATIC_SCALE_OPTIONS = {
  waifu2x: [2, 4],
  realesrgan: [2, 3, 4]
} as const satisfies Record<Exclude<UpscalerBackend, 'realcugan'>, readonly number[]>

const UPSCALER_STATIC_DENOISE_LEVEL_OPTIONS = {
  waifu2x: [-1, 0, 1, 2, 3]
} as const satisfies Record<'waifu2x', readonly number[]>

const REALCUGAN_DENOISE_LEVEL_OPTIONS = [-1, 0, 1, 2, 3] as const

export type Waifu2xModel = (typeof UPSCALER_MODEL_OPTIONS.waifu2x)[number]
export type RealcuganModel = (typeof UPSCALER_MODEL_OPTIONS.realcugan)[number]
export type RealesrganModel = (typeof UPSCALER_MODEL_OPTIONS.realesrgan)[number]

export type Waifu2xDenoiseLevel = (typeof UPSCALER_STATIC_DENOISE_LEVEL_OPTIONS.waifu2x)[number]
export type RealcuganDenoiseLevel = (typeof REALCUGAN_DENOISE_LEVEL_OPTIONS)[number]

export const DEFAULT_LOCAL_UPSCALER_CONFIG: LocalUpscalerConfig = {
  waifu2x: {
    scale: 2,
    model: 'models-cunet',
    denoiseLevel: 0
  },
  realcugan: {
    scale: 2,
    model: 'models-se',
    denoiseLevel: -1
  },
  realesrgan: {
    scale: 2,
    model: 'realesr-animevideov3'
  }
}

export function setUpscalerConfigOptions(
  config: LocalUpscalerConfig,
  backend: UpscalerBackend,
  value: GameImageUpscaleOptions
): LocalUpscalerConfig {
  switch (backend) {
    case 'waifu2x':
      return {
        ...config,
        waifu2x: {
          scale: value.scale ?? config.waifu2x.scale,
          model: isOptionInList(value.model, UPSCALER_MODEL_OPTIONS.waifu2x)
            ? value.model
            : config.waifu2x.model,
          denoiseLevel: isOptionInList(
            value.denoiseLevel,
            UPSCALER_STATIC_DENOISE_LEVEL_OPTIONS.waifu2x
          )
            ? value.denoiseLevel
            : config.waifu2x.denoiseLevel
        }
      }
    case 'realcugan':
      return {
        ...config,
        realcugan: {
          scale: value.scale ?? config.realcugan.scale,
          model: isOptionInList(value.model, UPSCALER_MODEL_OPTIONS.realcugan)
            ? value.model
            : config.realcugan.model,
          denoiseLevel: isOptionInList(value.denoiseLevel, REALCUGAN_DENOISE_LEVEL_OPTIONS)
            ? value.denoiseLevel
            : config.realcugan.denoiseLevel
        }
      }
    case 'realesrgan':
      return {
        ...config,
        realesrgan: {
          scale: value.scale ?? config.realesrgan.scale,
          model: isOptionInList(value.model, UPSCALER_MODEL_OPTIONS.realesrgan)
            ? value.model
            : config.realesrgan.model
        }
      }
  }
}

const REALCUGAN_MODEL_SPECS: Record<
  RealcuganModel,
  {
    scales: readonly number[]
    denoiseLevelsByScale: Partial<Record<number, readonly RealcuganDenoiseLevel[]>>
    defaultDenoiseLevelOptions: readonly RealcuganDenoiseLevel[]
  }
> = {
  'models-se': {
    scales: [2, 3, 4],
    denoiseLevelsByScale: {
      2: [-1, 0, 1, 2, 3],
      3: [-1, 0, 3],
      4: [-1, 0, 3]
    },
    defaultDenoiseLevelOptions: [-1, 0, 3]
  },
  'models-pro': {
    scales: [2, 3],
    denoiseLevelsByScale: {
      2: [-1, 0, 3],
      3: [-1, 0, 3]
    },
    defaultDenoiseLevelOptions: [-1, 0, 3]
  },
  'models-nose': {
    scales: [2],
    denoiseLevelsByScale: {
      2: [-1]
    },
    defaultDenoiseLevelOptions: [-1]
  }
}

const DEFAULT_REALCUGAN_MODEL: RealcuganModel = UPSCALER_MODEL_OPTIONS.realcugan[0]

const UPSCALER_BACKEND_BY_EXECUTABLE = new Map<string, UpscalerBackend>()
for (const [backend, executableNames] of Object.entries(UPSCALER_BACKEND_EXECUTABLES) as Array<
  [UpscalerBackend, readonly string[]]
>) {
  for (const executableName of executableNames) {
    UPSCALER_BACKEND_BY_EXECUTABLE.set(executableName, backend)
  }
}

export function getUpscalerBackendByPath(exePath?: string | null): UpscalerBackend | null {
  const basename = exePath?.split(/[\\/]/).pop()?.toLowerCase() ?? ''
  return basename ? (UPSCALER_BACKEND_BY_EXECUTABLE.get(basename) ?? null) : null
}

export function getUpscalerScaleOptions(
  backend: UpscalerBackend,
  model?: string | null
): readonly number[] {
  switch (backend) {
    case 'waifu2x':
      return UPSCALER_STATIC_SCALE_OPTIONS.waifu2x
    case 'realcugan':
      return (
        getRealcuganModelSpec(model)?.scales ??
        REALCUGAN_MODEL_SPECS[DEFAULT_REALCUGAN_MODEL].scales
      )
    case 'realesrgan':
      return UPSCALER_STATIC_SCALE_OPTIONS.realesrgan
    default:
      return assertNever(backend)
  }
}

export function getUpscalerDenoiseLevelOptions(
  backend: UpscalerBackend,
  model?: string | null,
  scale?: number | null
): readonly number[] {
  switch (backend) {
    case 'waifu2x':
      return UPSCALER_STATIC_DENOISE_LEVEL_OPTIONS.waifu2x
    case 'realcugan': {
      const modelSpec = getRealcuganModelSpec(model)
      if (!modelSpec) {
        return []
      }

      return scale !== undefined && scale !== null
        ? (modelSpec.denoiseLevelsByScale[scale] ?? [])
        : modelSpec.defaultDenoiseLevelOptions
    }
    case 'realesrgan':
      return []
    default:
      return assertNever(backend)
  }
}

export function getUpscalerModelOptions(backend: UpscalerBackend): readonly string[] {
  return UPSCALER_MODEL_OPTIONS[backend]
}

function getRealcuganModelSpec(
  model?: string | null
): (typeof REALCUGAN_MODEL_SPECS)[RealcuganModel] | null {
  return model && UPSCALER_MODEL_OPTIONS.realcugan.includes(model as RealcuganModel)
    ? REALCUGAN_MODEL_SPECS[model]
    : null
}

function assertNever(value: never): never {
  throw new Error(`Unsupported upscaler backend: ${String(value)}`)
}

function isOptionInList<T extends string | number>(
  value: string | number | undefined,
  options: readonly T[]
): value is T {
  return value !== undefined && options.some((option) => option === value)
}
