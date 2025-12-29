declare module 'prisma/config' {
  export function defineConfig<T = unknown>(config: T): T
  export function env(name: string): string | undefined
}