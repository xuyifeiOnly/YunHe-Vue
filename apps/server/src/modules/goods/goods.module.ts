import { Module } from '@nestjs/common'
import { GoodsCategoryModule } from './goods-category/goods-category.module'


@Module({
  imports: [GoodsCategoryModule, ],
  exports: [GoodsCategoryModule, ],
})
export class GoodsModule {}
