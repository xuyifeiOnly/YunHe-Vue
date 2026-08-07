import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { CommonConstant } from '../../common/constant/common.constant'

export enum BusinessType {
  OTHER = '0',
  INSERT = '1',
  UPDATE = '2',
  DELETE = '3',
  EXPORT = '4',
  IMPORT = '5',
}

@Entity({ name: 'sys_oper_log' })
export class OperLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ comment: '模块标题', default: null })
  title: string

  @Column({ comment: '操作人员', default: null })
  username: string

  @Column({ comment: '方法名称', default: null })
  method: string

  @Column({ comment: '请求方式', name: 'request_method', default: null })
  requestMethod: string

  @Column({ comment: '请求参数', default: null, type: 'text' })
  params: string

  @Column({ comment: '请求接口', default: null })
  url: string

  @Column({ comment: '请求IP', default: null })
  ip: string

  @Column({ comment: '请求地址', default: null })
  location: string

  @Column({ comment: '操作类型', type: 'char', default: BusinessType.OTHER })
  businessType: BusinessType

  @Column({
    comment: '操作状态',
    type: 'char',
    default: CommonConstant.STATUS_NORMAL,
  })
  status: string

  @Column({ comment: '请求时间', name: 'oper_time' })
  operTime: string

  @Column({ comment: '请求耗时', default: null })
  duration: number

  @Column({
    comment: '请求唯一标识',
    type: 'varchar',
    length: 64,
    default: null,
    name: 'request_id',
  })
  requestId: string
}
