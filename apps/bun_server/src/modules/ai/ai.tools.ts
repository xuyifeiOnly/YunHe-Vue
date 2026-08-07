export interface AiToolContext {
  content: string
}

export interface AiTool {
  name: string
  enabled(context: AiToolContext): boolean
  invoke(context: AiToolContext): Promise<string> | string
}

const weatherTool: AiTool = {
  name: 'weather',
  enabled: ({ content }) => /天气|气温|温度/.test(content),
  invoke: ({ content }) => {
    const match = content.match(/([\u4e00-\u9fa5A-Za-z]+)(?:天气|气温|温度)/)
    const city = match?.[1]?.replace(/今天|明天|现在|当前/g, '') || '本地'
    return `工具结果：${city}天气是晴朗的，温度是25摄氏度。`
  },
}

export const aiTools: AiTool[] = [weatherTool]

export async function runEnabledAiTools(context: AiToolContext) {
  const results: string[] = []
  for (const tool of aiTools) {
    if (!tool.enabled(context)) continue
    results.push(await tool.invoke(context))
  }
  return results
}
