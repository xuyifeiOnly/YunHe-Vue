import { CommonConstant } from '@/common/constant/common.constant'
import { Excel } from '@/common/decorator/excel.decorator'
import { BaseEntity } from '../base.entity'
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity('goods_category')
export class GoodsCategoryEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ name: 'parent_id', comment: '父级ID', default: CommonConstant.DEFAULT_PARENT_ID, type: 'varchar', length: 36 })
  parentId: string

  @Column({ name: 'name', comment: '分类名称', default: null, length: 100 })
  @Excel({ name: '分类名称' })
  name: string

  @Column({ name: 'image', comment: '分类图片', default: null, length: 500 })
  image: string

  @Column({ name: 'sort', comment: '排序', type: 'int', default: 1 })
  sort: number

  @Column({ length: 1, comment: '状态', default: CommonConstant.STATUS_NORMAL, type: 'char' })
  @Excel({ name: '状态', dictType: 'sys_normal_disable' })
  status: string

  @Column({ name: 'description', comment: '描述', default: null, type: 'varchar', length: 500 })
  description: string
}