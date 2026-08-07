import type { DataSource } from 'typeorm'
import type { AppConfig } from '../config/config'
import { AiConversationEntity, AiMessageEntity, DictDataEntity, DictTypeEntity, JobEntity, JobLogEntity, LogininforEntity, MenuEntity, OperLogEntity, PromptEntity, RoleEntity, UserEntity } from '../common'
import { logError } from '../utils'
import { RedisService } from '../shared/redis.service'
import { CaptchaService } from '../shared/captcha.service'
import { AuthService } from '../modules/auth/auth.service'
import { UserService } from '../modules/system/user/user.service'
import { MenuService } from '../modules/system/menu/menu.service'
import { RoleService } from '../modules/system/role/role.service'
import { DictService } from '../modules/system/dict/dict.service'
import { UploadService } from '../modules/common/upload/upload.service'
import { ExcelService } from '../modules/common/excel/excel.service'
import { EmailService } from '../modules/common/email/email.service'
import { CacheService } from '../modules/monitor/cache/cache.service'
import { HealthService } from '../modules/monitor/health/health.service'
import { JobService } from '../modules/monitor/job/job.service'
import { LogService } from '../modules/monitor/log/log.service'
import { OnlineService } from '../modules/monitor/online/online.service'
import { ServerService } from '../modules/monitor/server/server.service'
import { AiService } from '../modules/ai/ai.service'
import { PromptService } from '../modules/resource/prompt/prompt.service'
export function createServices(config: AppConfig, dataSource: DataSource, uploadRoot: string) {
  const redisService = new RedisService(config)
  const captchaService = new CaptchaService(redisService)
  const userService = new UserService(redisService, dataSource.getRepository(UserEntity), dataSource.getRepository(RoleEntity))
  const menuService = new MenuService(redisService, dataSource.getRepository(MenuEntity))
  const roleService = new RoleService(redisService, dataSource.getRepository(RoleEntity), dataSource.getRepository(MenuEntity))
  const dictService = new DictService(redisService, dataSource.getRepository(DictTypeEntity), dataSource.getRepository(DictDataEntity))
  const uploadService = new UploadService(uploadRoot)
  const excelService = new ExcelService()
  const emailService = new EmailService(config)
  const cacheService = new CacheService(redisService)
  const healthService = new HealthService(redisService, dataSource.getRepository(JobEntity))
  const jobService = new JobService(config, excelService, dataSource.getRepository(JobEntity), dataSource.getRepository(JobLogEntity))
  const logService = new LogService(excelService, dataSource.getRepository(LogininforEntity), dataSource.getRepository(OperLogEntity))
  const onlineService = new OnlineService(redisService)
  const serverService = new ServerService()
  const aiService = new AiService(config, dataSource.getRepository(AiMessageEntity), dataSource.getRepository(AiConversationEntity))
  const promptService = new PromptService(dataSource.getRepository(PromptEntity))
  const authService = new AuthService(config, userService, menuService, redisService, captchaService)
  authService.setLogService(logService)
  // Elysia 没有 Nest DiscoveryService，这里用显式服务注册表提供等价的定时任务调用目标发现能力。
  jobService.registerService({
    JobService: { service: jobService, methods: ['testDingShi'] },
    AiService: { service: aiService, methods: [] },
    PromptService: { service: promptService, methods: [] },
    UserService: { service: userService, methods: [] },
    DictService: { service: dictService, methods: [] },
  })
  void jobService.initJobs().catch((error) => logError('任务初始化失败', error))
  return {
    config,
    dataSource,
    redisService,
    captchaService,
    userService,
    menuService,
    roleService,
    dictService,
    uploadService,
    excelService,
    emailService,
    cacheService,
    healthService,
    jobService,
    logService,
    onlineService,
    serverService,
    aiService,
    promptService,
    authService,
  }
}
