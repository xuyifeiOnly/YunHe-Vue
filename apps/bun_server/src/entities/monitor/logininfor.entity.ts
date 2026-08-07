import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { CommonConstant } from '../../common/constant/common.constant'

@Entity('sys_login_log')
export class LogininforEntity {
  @PrimaryGeneratedColumn('uuid', { comment: '访问ID' })
  id: string

  @Column({ comment: '用户账号', length: 50, default: null })
  username: string

  @Column({ comment: '登录IP地址', length: 128, default: null })
  ip: string

  @Column({ comment: '登录地点', length: 255, default: null })
  location: string

  @Column({ comment: '浏览器类型', length: 50, default: null })
  browser: string

  @Column({ comment: '操作系统', length: 50, default: null })
  os: string

  @Column({
    comment: '登录状态',
    length: 1,
    type: 'char',
    default: CommonConstant.STATUS_NORMAL,
  })
  status: string

  @Column({ comment: '提示消息', length: 255, default: null })
  message: string

  @Column({ name: 'login_time', comment: '登录日期', default: null })
  loginTime: string

  @Column({
    comment: '请求唯一标识',
    type: 'varchar',
    length: 64,
    default: null,
    name: 'request_id',
  })
  requestId: string
}
