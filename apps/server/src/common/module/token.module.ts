import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { ConfigConstant } from '../constant/config.constant'
// AppModule 引入 TokenModule
//  → TokenModule 注册 JwtModule
//  → JwtModule 提供 JwtService
//  → global: true 让所有模块可用
//  → AuthService 构造函数自动拿到 jwtService
@Module({
  imports: [
    // 启动项目时，从配置中读取 JWT 密钥，然后把它注册给 JwtModule ，
    // 让全局的 JwtService 在生成和校验 token 时使用这个密钥。
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => {
        // JWT 密钥，从配置中获取，提供默认值保证容错性
        // 有效期是由 Redis 控制的，这里只负责生成 JWT，不负责验证，验证时会检查 Redis 中是否存在对应的 token
        const secret: string = configService.get<string>(ConfigConstant.JWT_SECRET, 'DEFAULTSECRET')
        return { secret }
      },
      // 设为全局模块，所有业务模块可直接使用 JwtService，无需重复导入
      global: true,
      // 指定注入 ConfigService 作为依赖
      inject: [ConfigService],
    }),
  ],
})
export class TokenModule {}
