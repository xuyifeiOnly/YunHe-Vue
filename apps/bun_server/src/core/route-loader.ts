import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { AppLike, RouteModule } from '../routes/meta'

export async function registerModuleRoutes(app: AppLike) {
  const routeFiles = scanRouteFiles(join(process.cwd(), 'src/modules'))

  for (const file of routeFiles) {
    const mod = (await import(pathToFileURL(file).href)) as RouteModule
    if (typeof mod.registerRoutes === 'function') await mod.registerRoutes(app)
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
