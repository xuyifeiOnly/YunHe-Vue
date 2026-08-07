import { describe, expect, test } from 'bun:test'
import { runEnabledAiTools } from './ai.tools'

describe('ai.tools', () => {
  test('天气相关内容触发天气工具', async () => {
    const results = await runEnabledAiTools({ content: '北京天气怎么样' })
    expect(results).toHaveLength(1)
    expect(results[0]).toContain('北京')
  })

  test('非工具内容不触发工具', async () => {
    const results = await runEnabledAiTools({ content: '你好' })
    expect(results).toEqual([])
  })
})
