import { defaultDbFile, newWithFileOnly } from 'ip2region-ts'

// 初始化 Searcher 实例
const searcher = newWithFileOnly(defaultDbFile)

/**
 * 获取客户端真实 IP，兼容反向代理环境
 */
export function getRequestIp(request: Request, server?: { requestIP?: (request: Request) => { address?: string } | null }): string {
  const xForwardedFor = request.headers.get('x-forwarded-for')
  const xRealIp = request.headers.get('x-real-ip')
  const ip = xForwardedFor?.split(',')[0]?.trim() || xRealIp?.trim() || server?.requestIP?.(request)?.address || ''
  return normalizeIp(ip)
}

export function normalizeIp(ip: string): string {
  return ip.replace('::ffff:', '').replace('::1', '127.0.0.1').trim() || 'unknown'
}

/**
 * 判断是否为内网 IP
 */
export function isInternalIp(ip: string): boolean {
  if (!ip || ip === 'unknown') return false
  const regex = /^(127\.|10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168\.)/
  return regex.test(ip.trim())
}

/**
 * 根据 IP 地址获取位置信息
 */
export async function getLocationByIP(ip: string): Promise<string> {
  try {
    if (!ip || ip === 'unknown') return '未知位置'
    if (isInternalIp(ip)) return '内网IP'
    const data = await searcher.search(ip)
    const region = data?.region || ''
    if (!region) return '未知位置'
    const [, , province, city] = region.split('|')
    const location = `${province || ''} ${city || ''}`.trim()
    return province !== '0' && city !== '0' ? location : '未知位置'
  } catch {
    return '未知位置'
  }
}
