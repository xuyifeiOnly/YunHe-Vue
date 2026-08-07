export type QueryParams = Record<string, string | undefined>

export function idsFrom(input: { ids?: string | string[]; id?: string; jobIds?: string | string[]; logIds?: string | string[] } = {}) {
  const value = input.ids ?? input.jobIds ?? input.logIds ?? input.id ?? ''
  if (Array.isArray(value)) return value
  return String(value).split(',').filter(Boolean)
}

export function parseRedisInfo(info: string) {
  const result: Record<string, string> = {}
  for (const line of info.split('\n')) {
    const item = line.trim()
    if (!item || item.startsWith('#')) continue
    const index = item.indexOf(':')
    if (index > -1) result[item.slice(0, index)] = item.slice(index + 1)
  }
  return result
}

export function parseCommandStats(info: string) {
  return Object.entries(parseRedisInfo(info)).map(([name, value]) => {
    const stat = Object.fromEntries(value.split(',').map((part) => {
      const [key, val] = part.split('=')
      return [key, Number(val) || val]
    }))
    return { name: name.replace('cmdstat_', ''), value: stat }
  })
}
