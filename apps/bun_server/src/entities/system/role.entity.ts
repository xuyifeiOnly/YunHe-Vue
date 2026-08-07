import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'
import { CommonConstant } from '../../common/constant/common.constant'
import { BaseEntity } from '../base.entity'
import { MenuEntity } from './menu.entity'
import { UserEntity } from './user.entity'

@Entity('sys_role')
export class RoleEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({
    name: 'role_code',
    unique: true,
    length: 20,
    comment: '角色编码',
    type: 'varchar',
  })
  roleCode: string

  @Column({
    name: 'role_name',
    length: 20,
    comment: '角色名称',
    type: 'varchar',
    nullable: false,
  })
  roleName: string

  @Column({ name: 'role_sort', comment: '角色排序', type: 'int', default: 1 })
  roleSort: number

  @Column({
    length: 1,
    comment: '状态',
    default: CommonConstant.STATUS_NORMAL,
    type: 'char',
  })
  status: string

  @Column({ length: 200, comment: '备注', type: 'varchar', nullable: true })
  remark: string

  @ManyToMany(() => UserEntity, (user) => user.roles)
  users: UserEntity[]

  @ManyToMany(() => MenuEntity, (menu) => menu.roles, { onDelete: 'CASCADE' })
  @JoinTable({
    name: 'sys_role_menu',
    joinColumns: [{ name: 'role_id', referencedColumnName: 'id' }],
    inverseJoinColumns: [{ name: 'menu_id', referencedColumnName: 'id' }],
  })
  menus: MenuEntity[]
}
