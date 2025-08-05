export type UnArray<T> = T extends (infer U)[] ? U : T
