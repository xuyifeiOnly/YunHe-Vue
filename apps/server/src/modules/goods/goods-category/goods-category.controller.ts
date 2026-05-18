import { GoodsCategoryService } from './goods-category.service'
import { OperLog, BusinessType, RequirePermissions, RepeatSubmit } from '@/common'
import { CreateGoodsCategoryDto, QueryGoodsCategoryDto, UpdateGoodsCategoryDto } from './goods-category.dto'
import { Controller, Get, Post, Put, Delete, Body, ParseArrayPipe, Query } from '@nestjs/common'

@Controller('goods/category')
export class GoodsCategoryController {
  constructor(private readonly goodsCategoryService: GoodsCategoryService) {}

  @Post('create')
  // @RequirePermissions(['goods:category:create'])
  @OperLog({ title: '商品分类管理', businessType: BusinessType.INSERT })
  @RepeatSubmit()
  create(@Body() createDto: CreateGoodsCategoryDto) {
    return this.goodsCategoryService.create(createDto)
  }

  @Put('update')
  // @RequirePermissions(['goods:category:update'])
  @OperLog({ title: '商品分类管理', businessType: BusinessType.UPDATE })
  @RepeatSubmit()
  update(@Body() updateDto: UpdateGoodsCategoryDto) {
    return this.goodsCategoryService.update(updateDto)
  }

  @Delete('delete')
  // @RequirePermissions(['goods:category:delete'])
  @OperLog({ title: '商品分类管理', businessType: BusinessType.DELETE })
  delete(@Query('ids', new ParseArrayPipe()) ids: string[]) {
    return this.goodsCategoryService.delete(ids)
  }

  @Get('list')
  // @RequirePermissions(['goods:category:query'])
  list(@Query() queryParams: QueryGoodsCategoryDto) {
    return this.goodsCategoryService.findList(queryParams)
  }

  @Get('detail')
  // @RequirePermissions(['goods:category:query'])
  detail(@Query('id') id: string) {
    return this.goodsCategoryService.findOneById(id)
  }

  @Get('parent')
  // @RequirePermissions(['goods:category:query'])
  parent() {
    return this.goodsCategoryService.findParentList()
  }
}