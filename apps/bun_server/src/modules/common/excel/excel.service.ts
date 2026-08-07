import ExcelJS from 'exceljs'
import { formatTime } from '../../../utils'

export interface ExcelColumn {
  key: string
  header: string
  width?: number
  dict?: Record<string, string>
  formatter?: (value: unknown, row: Record<string, unknown>) => unknown
}

const STATUS_DICT = { '0': '失败', '1': '成功' }
const JOB_STATUS_DICT = { '0': '暂停', '1': '正常' }

const EXPORT_COLUMNS: Record<string, ExcelColumn[]> = {
  logininfor: [
    { key: 'username', header: '用户名' },
    { key: 'ip', header: '登录地址' },
    { key: 'location', header: '登录地点' },
    { key: 'browser', header: '浏览器' },
    { key: 'os', header: '操作系统' },
    { key: 'status', header: '登录状态', dict: STATUS_DICT },
    { key: 'message', header: '提示消息', width: 30 },
    {
      key: 'loginTime',
      header: '登录时间',
      width: 22,
      formatter: formatDateValue,
    },
  ],
  operlog: [
    { key: 'title', header: '系统模块' },
    {
      key: 'businessType',
      header: '业务类型',
      dict: {
        '0': '其它',
        '1': '新增',
        '2': '修改',
        '3': '删除',
        '4': '导出',
        '5': '导入',
      },
    },
    { key: 'requestMethod', header: '请求方式' },
    { key: 'method', header: '操作方法', width: 30 },
    { key: 'username', header: '操作人员' },
    { key: 'url', header: '请求地址', width: 30 },
    { key: 'ip', header: '操作地址' },
    { key: 'location', header: '操作地点' },
    { key: 'params', header: '请求参数', width: 40 },
    { key: 'status', header: '操作状态', dict: STATUS_DICT },
    { key: 'duration', header: '消耗时间' },
    {
      key: 'operTime',
      header: '操作时间',
      width: 22,
      formatter: formatDateValue,
    },
  ],
  joblog: [
    { key: 'jobName', header: '任务名称' },
    { key: 'jobGroup', header: '任务组名' },
    { key: 'invokeTarget', header: '调用目标', width: 35 },
    { key: 'jobMessage', header: '日志信息', width: 35 },
    { key: 'status', header: '执行状态', dict: STATUS_DICT },
    {
      key: 'createTime',
      header: '执行时间',
      width: 22,
      formatter: formatDateValue,
    },
  ],
  job: [
    { key: 'jobName', header: '任务名称' },
    { key: 'jobGroup', header: '任务组名' },
    { key: 'invokeTarget', header: '调用目标', width: 35 },
    { key: 'cronExpression', header: 'Cron 表达式' },
    {
      key: 'misfirePolicy',
      header: '错误策略',
      dict: { '1': '立即执行', '2': '执行一次', '3': '放弃执行' },
    },
    {
      key: 'concurrent',
      header: '并发执行',
      dict: { '0': '禁止', '1': '允许' },
    },
    { key: 'status', header: '任务状态', dict: JOB_STATUS_DICT },
    {
      key: 'createTime',
      header: '创建时间',
      width: 22,
      formatter: formatDateValue,
    },
  ],
}

export class ExcelService {
  public async exportBuffer(
    records: Record<string, unknown>[],
    sheetName = 'Sheet1',
    columns?: ExcelColumn[],
  ) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', ySplit: 1 }],
    })
    const finalColumns: ExcelColumn[] = columns?.length
      ? columns
      : this.getColumns(records)
    worksheet.columns = finalColumns.map((column) => ({
      header: column.header,
      key: column.key,
      width: column.width ?? 20,
    }))
    worksheet.addRows(
      records.map((record) => this.mapRecord(record, finalColumns)),
    )
    worksheet.getRow(1).font = { bold: true }
    worksheet.eachRow((row) => {
      row.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    return Buffer.from(await workbook.xlsx.writeBuffer())
  }

  public async exportResponse(
    records: Record<string, unknown>[],
    filename: string,
    columnsOrType?: ExcelColumn[] | keyof typeof EXPORT_COLUMNS,
  ) {
    const columns = Array.isArray(columnsOrType)
      ? columnsOrType
      : columnsOrType
        ? EXPORT_COLUMNS[columnsOrType]
        : this.inferColumns(filename)
    const buffer = await this.exportBuffer(
      records,
      filename.replace(/\.xlsx$/i, '').slice(0, 31) || 'Sheet1',
      columns,
    )
    const encoded = encodeURIComponent(filename)
    return new Response(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`,
      },
    })
  }

  /** 从 Buffer 导入 Excel，返回解析后的 JSON 数据 */
  public async importBuffer(
    file: Buffer | ArrayBuffer,
    columns: ExcelColumn[],
  ): Promise<Record<string, unknown>[]> {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(file as ArrayBuffer)
    const worksheet = workbook.worksheets[0]
    if (!worksheet) throw new Error('文件缺少工作表')
    const headers: string[] = []
    worksheet.getRow(1).eachCell((cell, colNumber) => {
      headers[colNumber - 1] = String(cell.value ?? '').trim()
    })
    const keyByHeader = new Map<string, string>()
    for (const col of columns) keyByHeader.set(col.header, col.key)
    const reverseDictMap = new Map<string, Record<string, string>>()
    for (const col of columns)
      if (col.dict)
        reverseDictMap.set(
          col.key,
          Object.fromEntries(Object.entries(col.dict).map(([k, v]) => [v, k])),
        )
    const rows: Record<string, unknown>[] = []
    worksheet.eachRow((row, rowNum) => {
      if (rowNum === 1) return
      const record: Record<string, unknown> = {}
      row.eachCell((cell, colNumber) => {
        const header = headers[colNumber - 1]
        if (!header) return
        const key = keyByHeader.get(header)
        if (!key) return
        let value = cell.value
        if (value instanceof Date) value = formatTime(value)
        if (typeof value === 'object' && value !== null && 'text' in value)
          value = String((value as { text: string }).text)
        const reverseDict = reverseDictMap.get(key)
        if (reverseDict && typeof value === 'string')
          value = reverseDict[value] ?? value
        record[key] = value
      })
      rows.push(record)
    })
    return rows
  }

  /** 从 Response（上传文件）导入 Excel */
  public async importFromRequest(
    file: File,
    columns: ExcelColumn[],
  ): Promise<Record<string, unknown>[]> {
    const buffer = await file.arrayBuffer()
    return this.importBuffer(buffer, columns)
  }

  /** 生成导入模板 */
  public async importTemplateResponse(
    filename: string,
    columns: ExcelColumn[],
    sheetName = 'Sheet1',
  ) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet(sheetName, {
      views: [{ state: 'frozen', ySplit: 1 }],
    })
    worksheet.columns = columns.map((col) => ({
      header: col.header,
      key: col.key,
      width: col.width ?? 20,
    }))
    worksheet.getRow(1).font = { bold: true }
    worksheet.eachRow((row) => {
      row.alignment = { vertical: 'middle', horizontal: 'center' }
    })
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
    const encoded = encodeURIComponent(filename)
    return new Response(buffer, {
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encoded}"; filename*=UTF-8''${encoded}`,
      },
    })
  }

  private inferColumns(filename: string) {
    if (filename.includes('登录')) return EXPORT_COLUMNS.logininfor
    if (filename.includes('操作')) return EXPORT_COLUMNS.operlog
    if (filename.includes('任务调度日志')) return EXPORT_COLUMNS.joblog
    if (filename.includes('任务')) return EXPORT_COLUMNS.job
    return undefined
  }

  private mapRecord(record: Record<string, unknown>, columns: ExcelColumn[]) {
    const row: Record<string, unknown> = {}
    for (const column of columns) {
      const value = record[column.key]
      row[column.key] = column.formatter
        ? column.formatter(value, record)
        : column.dict
          ? (column.dict[String(value)] ?? value)
          : value
    }
    return row
  }

  private getColumns(records: Record<string, unknown>[]) {
    const keys = new Set<string>()
    for (const record of records)
      Object.keys(record).forEach((key) => keys.add(key))
    return [...keys].map((key) => ({ key, header: key }))
  }
}

function formatDateValue(value: unknown) {
  if (!value) return ''
  if (value instanceof Date) return formatTime(value)
  return String(value)
}
