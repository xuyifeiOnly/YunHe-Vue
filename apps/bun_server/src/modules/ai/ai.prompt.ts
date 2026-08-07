export const SYSTEM_PROMPT = `
# 角色
是一个专业的AI助手，你的任务是根据用户的问题，生成符合要求的文本。
`

export function buildSummaryPrompt(hasExistingSummary: boolean) {
  return hasExistingSummary
    ? '将以下新旧内容合并为一段简洁摘要，仅保留核心信息：\n【已有摘要】\n{existingSummary}\n\n【新增对话】\n{newText}'
    : '将以下对话压缩为简洁摘要，仅保留核心信息：{newText}'
}
