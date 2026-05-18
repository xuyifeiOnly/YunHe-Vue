import { Exclude } from 'class-transformer'
import { PaginationDto } from '@/common'
import { PartialType } from '@nestjs/mapped-types'
import { IsNotEmpty, IsOptional } from 'class-validator'

export class CreateGoodsCategoryDto {
  @IsOptional()
  parentId: string

  @IsNotEmpty({ message: '参数 $property  不能为空' })
  name: string

  @IsOptional()
  image: string

  @IsOptional()
  sort: number

  @IsOptional()
  status: string

  @IsOptional()
  description: string
}

export class UpdateGoodsCategoryDto extends PartialType(CreateGoodsCategoryDto) {
  @IsNotEmpty({ message: '参数 $property  不能为空' })
  id: string

  @Exclude()
  createBy: string
}

export class QueryGoodsCategoryDto extends PaginationDto {
  @IsOptional()
  name: string

  @IsOptional()
  status: string
}