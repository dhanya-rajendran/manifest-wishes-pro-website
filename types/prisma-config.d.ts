declare module 'prisma/config' {
  export function defineConfig(config: any): any
  export function env(name: string): string | undefined
}