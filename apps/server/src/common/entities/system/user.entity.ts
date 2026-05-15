import { BaseEntity } from '../base.entity'
import { PrimaryGeneratedColumn, Entity, Column, ManyToMany, JoinTable } from 'typeorm'
import { CommonConstant } from '@/common/constant/common.constant'
import { RoleEntity } from './role.entity'

@Entity('sys_user')
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true, length: 20, comment: '用户名', nullable: false, type: 'varchar' })
  username: string

  @Column({ length: 100, comment: '密码', nullable: false, type: 'varchar' })
  password: string

  @Column({ length: 20, comment: '手机号', nullable: true, type: 'varchar' })
  phone: string

  @Column({ length: 20, comment: '昵称', nullable: true, type: 'varchar' })
  nickname: string

  @Column({ length: 50, comment: '邮箱', nullable: true, type: 'varchar' })
  email: string

  @Column({ length: 1, comment: '状态', default: CommonConstant.STATUS_NORMAL, type: 'char' })
  status: string

  @Column({ type: 'char', length: '1', comment: '性别', default: '2' })
  gender: string

  @Column({ comment: '年龄', nullable: true, type: 'int' })
  age: number

  @Column({ length: 200, comment: '备注', type: 'varchar', nullable: true })
  remark: string

  @Column({ name: 'login_time', comment: '最后登录时间', default: null })
  loginTime: string

  // cascade: true 表示你 save(user) 时， user.roles 里如果放了“新建的 Role 实体对象”，TypeORM 允许级联保存（实际项目里通常会更谨慎使用，但这里只解释含义）。
  @ManyToMany(() => RoleEntity, (role) => role.users, { cascade: true })
  @JoinTable({ name: 'sys_user_role', joinColumn: { name: 'user_id', referencedColumnName: 'id' }, inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' } })
  roles: RoleEntity[]
}
