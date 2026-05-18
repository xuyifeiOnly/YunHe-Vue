import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { GoodsCategoryEntity } from '@/common'
import { GoodsCategoryController } from './goods-category.controller'
import { GoodsCategoryService } from './goods-category.service'

@Module({
  imports: [TypeOrmModule.forFeature([GoodsCategoryEntity])],
  controllers: [GoodsCategoryController],
  providers: [GoodsCategoryService],
})
export class GoodsCategoryModule {}
