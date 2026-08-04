import { Global, Module } from '@nestjs/common'
import { RedisService } from './redis.service'
import { CaptchaService } from './captcha.service'

const services = [RedisService, CaptchaService]
// AppModule 引入 SharedModule
//  → SharedModule providers 注册 CaptchaService
//  → SharedModule exports 导出 CaptchaService
//  → @Global() 让它全局可用
//  → AuthService 构造函数直接注入 CaptchaService
@Global()
@Module({
  providers: services,
  exports: services,
})
export class SharedModule {}
