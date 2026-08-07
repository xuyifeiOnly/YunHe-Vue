export type QueryParams = Record<string, string | undefined>

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
    const stat = Object.fromEntries(
      value.split(',').map((part) => {
        const [key, val] = part.split('=')
        return [key, Number(val) || val]
      }),
    )
    return { name: name.replace('cmdstat_', ''), value: stat }
  })
}

// 兼容历史导入路径，统一从 core/validation 转出
export { idsFrom } from '../../core/validation'
