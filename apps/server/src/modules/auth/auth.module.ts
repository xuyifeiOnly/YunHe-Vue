import { Module } from '@nestjs/common'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { LogModule } from '../monitor/log/log.module'
import { UserModule } from '../system/user/user.module'
import { MenuModule } from '../system/menu/menu.module'
import { PassportModule } from '@nestjs/passport'
import { JwtStrategy } from './strategies/jwt.strategy'

@Module({
  // imports 表示当前 AuthModule 依赖的其他模块，这些模块的代码会在当前模块之前执行
  // 这里我们依赖 Passport PassportModule、UserModule、LogModule、MenuModule
  imports: [PassportModule, UserModule, LogModule, MenuModule],
  // controllers 表示当前 AuthModule 提供的控制器，这些控制器会在当前模块中执行
  controllers: [AuthController],
  // providers 表示当前 AuthModule 提供的服务，这些服务会在当前模块中执行
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
