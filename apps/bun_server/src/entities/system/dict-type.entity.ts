import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'
import { CommonConstant } from '../../common/constant/common.constant'
import { BaseEntity } from '../base.entity'

@Entity({ name: 'sys_dict_type' })
export class DictTypeEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ comment: '字典名称', name: 'dict_name' })
  dictName: string

  @Column({ unique: true, name: 'dict_type', length: 20, nullable: false, type: 'varchar' })
  dictType: string

  @Column({ default: CommonConstant.STATUS_NORMAL, type: 'char', length: 1 })
  status: string

  @Column({ comment: '备注', nullable: true, type: 'varchar', length: 200 })
  remark: string
}
