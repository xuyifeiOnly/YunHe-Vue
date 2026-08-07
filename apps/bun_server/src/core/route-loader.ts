import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

export async function registerModuleRoutes(app: any) {
  const routeFiles = scanRouteFiles(join(process.cwd(), 'src/modules'))

  for (const file of routeFiles) {
    const mod = await import(pathToFileURL(file).href)
    const register = mod.registerRoutes as ((app: any) => void | Promise<void>) | undefined
    if (typeof register === 'function') await register(app)
  }
}

function scanRouteFiles(dir: string) {
  const files: string[] = []

  for (const item of readdirSync(dir)) {
    const fullPath = join(dir, item)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      files.push(...scanRouteFiles(fullPath))
      continue
    }

    if (item.endsWith('.route.ts')) files.push(fullPath)
  }

  return files.sort()
}
