/**
 * 将 HEX 颜色字符串转换为 RGB 对象
 * @param hex HEX 颜色值，支持 `#` 前缀
 * @returns `{ r, g, b }` 各通道 0-255
 */
export function hexToRgb(hex: string) {
  hex = hex.replace('#', '')
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  return { r, g, b }
}

/**
 * 颜色加亮（混入白色）
 * @param hex HEX 颜色值
 * @param weight 混合权重 0-1，值越大越接近白色
 * @returns 加亮后的 HEX 颜色值
 */
export function tint(hex: string, weight: number) {
  const { r, g, b } = hexToRgb(hex)
  const red = Math.round(r + (255 - r) * weight)
  const green = Math.round(g + (255 - g) * weight)
  const blue = Math.round(b + (255 - b) * weight)
  return `#${((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)}`
}

/**
 * 颜色加深（混入黑色）
 * @param hex HEX 颜色值
 * @param weight 混合权重 0-1，值越大越接近黑色
 * @returns 加深后的 HEX 颜色值
 */
export function shade(hex: string, weight: number) {
  const { r, g, b } = hexToRgb(hex)
  const red = Math.round(r * (1 - weight))
  const green = Math.round(g * (1 - weight))
  const blue = Math.round(b * (1 - weight))
  return `#${((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)}`
}
