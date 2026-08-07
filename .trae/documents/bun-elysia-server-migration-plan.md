# Bun + Elysia 后端迁移计划

## Summary

目标是在 `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/bun_server/` 中，参考现有 NestJS 项目 `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/`，完成 Bun 运行时 + Elysia 路由框架的后端迁移，尽量保持接口路径、请求参数、响应格式、认证授权、数据库结构、Redis 缓存、定时任务、文件上传、Excel 导出、AI 流式对话、监控管理等功能与原项目一致。

本计划不在现有 Nest 项目上改造，而是在 `apps/bun_server` 中重建等价服务。原项目作为功能和行为参考源。

## Current State Analysis

### 现有 Nest 项目状态

关键文件：

- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/main.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/app.module.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/config/config.yaml`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/package.json`

现有服务包含：

1. 全局入口能力
   - 端口配置读取
   - 全局路由前缀，默认 `/api`
   - `/uploads/` 静态资源托管
   - Helmet 安全头
   - Winston 日志
   - 全局异常包装
   - 全局成功响应包装
   - 请求 ID
   - 操作日志
   - 响应缓存
   - 全局限流
   - JWT 鉴权
   - RBAC 角色和权限校验
   - 防重复提交
   - 演示环境保护

2. 业务模块
   - `auth`：验证码、登录、登出、用户信息、前端路由
   - `system/user`：用户管理
   - `system/role`：角色管理
   - `system/menu`：菜单和权限管理
   - `system/dict`：字典类型和字典数据
   - `common/upload`：普通上传、秒传、分片上传、合并、清理
   - `common/excel`：Excel 导出
   - `common/email`：邮件发送和模板
   - `monitor/server`：服务器信息
   - `monitor/health`：健康检查
   - `monitor/cache`：Redis 缓存监控
   - `monitor/online`：在线用户和强退
   - `monitor/log`：登录日志、操作日志、导出
   - `monitor/job`：BullMQ 定时任务、任务日志、导出
   - `ai`：AI 会话、消息、SSE 流式聊天
   - `resource/prompt`：提示词资源管理

3. 数据层
   - TypeORM + MySQL
   - 实体位于 `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/common/entities/`
   - 依赖多对多关系：用户-角色、角色-菜单
   - Redis 用于验证码、Token、在线用户、权限缓存、字典缓存、限流、响应缓存、BullMQ

### bun_server 当前状态

关键文件：

- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/bun_server/package.json`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/bun_server/index.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/bun_server/AGENTS.md`

当前 `bun_server` 只是 Bun 初始化项目：

- `index.ts` 仅输出 `Hello via Bun!`
- `package.json` 只有 Bun 类型依赖
- 尚无 Elysia、数据库、Redis、配置、路由、服务、测试结构

### 已确认的高风险点

以下不是完全无法实现，但需要重写机制，不能直接从 Nest 复制：

1. Nest 的 `APP_GUARD / APP_PIPE / APP_FILTER / APP_INTERCEPTOR` 不能在 Elysia 直接复用。
   - 需要重建 Elysia 插件和 hook 执行链。

2. Nest 装饰器元数据不能直接等价迁移。
   - `@Public()`、`@RequirePermissions()`、`@RequireRoles()`、`@RepeatSubmit()`、`@SkipThrottle()`、`@SkipTransform()`、`@ResponseCache()`、`@OperLog()` 需要改成 Elysia 路由元信息配置。

3. Nest DI 和 DiscoveryService 不存在等价机制。
   - `monitor/job` 的动态任务调用不能自动扫描所有 Provider。
   - 需要在 Bun 项目中维护服务实例容器和任务可调用方法注册表。

4. `@nestjs/bullmq` 不能复用。
   - BullMQ 本体可继续使用，但 Worker、QueueEvents、JobScheduler 生命周期要手写。

5. Express/Multer/StreamableFile 不能复用。
   - 文件上传、Excel 下载、AI SSE 都要改成 Bun/Elysia 响应模型。

6. TypeORM + Bun 需要验证。
   - 计划优先保留 TypeORM、实体装饰器、mysql2，以减少业务查询迁移成本。
   - 迁移后必须重点验证 Bun 下实体元数据、QueryBuilder、连接池、路径别名和生产构建。

7. LangChain + Bun 流式输出需要验证。
   - AI 模块保留 LangChain/OpenAI 兼容包，但 SSE 需要用 Web `ReadableStream` 重写。

## Proposed Changes

### 1. 初始化 bun_server 工程结构

修改/新增位置：

- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/bun_server/package.json`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/bun_server/tsconfig.json`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/bun_server/index.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/bun_server/src/`

计划：

1. 将 `package.json` 改为 Bun 后端项目脚本：
   - `dev`: `bun --hot index.ts`
   - `start`: `bun index.ts`
   - `test`: `bun test`
   - `typeorm`: 如 TypeORM CLI 在 Bun 下可用则用 `bunx typeorm` 或 `bun ./node_modules/typeorm/cli.js`
2. 安装/保留依赖：
   - `elysia`
   - `@elysiajs/static`
   - `@elysiajs/cors` 如前端跨域需要
   - `@sinclair/typebox` 或 Elysia 内置 schema 能力
   - `typeorm`
   - `mysql2`
   - `reflect-metadata`
   - `ioredis`
   - `bullmq`
   - `argon2`
   - `jose` 或兼容 JWT 库
   - `js-yaml`
   - `exceljs`
   - `nodemailer`
   - `svg-captcha`
   - `systeminformation`
   - `ua-parser-js`
   - `ip2region-ts`
   - `winston`
   - `winston-daily-rotate-file`
   - `@langchain/core`
   - `@langchain/openai`
   - `langchain`
3. 建立目录：
   - `src/config`
   - `src/common`
   - `src/core`
   - `src/database`
   - `src/entities`
   - `src/modules`
   - `src/shared`
   - `src/utils`
   - `src/routes`

### 2. 迁移配置系统

参考文件：

- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/config/config.yaml`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/utils/config.util.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/common/constant/config.constant.ts`

计划：

1. 将原 `config/config.yaml` 复制或等价迁移到 `apps/bun_server/config/config.yaml`。
2. 实现 Bun 项目配置加载器：
   - 读取 `config.yaml`
   - 合并 `config.local.yaml`
   - 合并 `config.{NODE_ENV}.yaml`
   - 合并 `config.{NODE_ENV}.local.yaml`
   - 保留环境变量覆盖逻辑
3. 保持配置结构不变：
   - `server.port`
   - `server.globalPrefix`
   - `server.isDemo`
   - `database.*`
   - `redis.*`
   - `jwt.*`
   - `email.*`
   - `openai.*`

### 3. 迁移数据库层

参考文件：

- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/common/module/database.module.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/ormconfig.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/common/entities/`

计划：

1. 保留 TypeORM + MySQL，以降低业务代码迁移成本。
2. 迁移所有实体到 `apps/bun_server/src/entities/`：
   - base/common entity
   - system entities
   - monitor entities
   - ai entities
   - resource entities
3. 建立 `DataSource` 初始化模块。
4. 建立 repository 获取方式，替代 Nest `@InjectRepository()`。
5. 保持表名、字段名、关联表名、枚举和默认值一致。
6. 初始化时按配置读取 `synchronize`，默认保持 false。
7. 验证 Bun 下 TypeORM decorator metadata 是否正常。

### 4. 迁移 Redis 和共享服务

参考文件：

- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/shared/redis.service.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/shared/captcha.service.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/common/constant/redis.constant.ts`

计划：

1. 使用 `ioredis` 保持与 BullMQ 和现有 Redis 命令兼容。
2. 实现 RedisService：
   - `get`
   - `set`
   - `setex`
   - `del`
   - `expire`
   - `keys`
   - `incr`
   - `dbsize`
   - `info`
   - `config`
3. 保持 Redis key 规则一致。
4. 迁移 CaptchaService：
   - `svg-captcha.createMathExpr`
   - base64 SVG
   - Redis 60 秒缓存
   - 校验后删除

### 5. 重建 Elysia 应用核心

参考文件：

- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/main.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/app.module.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/common/filter/all-exception.filter.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/common/interceptor/reponse-transform.interceptor.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/common/interceptor/operation-log.interceptor.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/common/interceptor/response-cache.interceptor.ts`

计划：

1. `index.ts` 初始化：
   - 加载配置
   - 初始化日志
   - 初始化数据库
   - 初始化 Redis
   - 初始化 BullMQ
   - 创建 Elysia app
   - 注册静态资源 `/uploads/`
   - 注册全局 `/api` 前缀
   - 注册所有模块路由
   - 启动监听
2. 实现核心 hook：
   - 请求 ID 生成
   - 安全响应头
   - 异常格式化
   - 成功响应包装
   - 响应包装跳过机制
   - 操作日志
   - 响应缓存
   - 限流
   - JWT 鉴权
   - 角色校验
   - 权限校验
   - 防重复提交
   - 演示环境保护
3. 设计统一路由注册元信息：

```ts
{
  public?: boolean
  permissions?: string[]
  roles?: string[]
  repeatSubmit?: boolean
  skipThrottle?: boolean
  skipTransform?: boolean
  responseCache?: { ttl: number }
  operLog?: { title: string; businessType: string }
}
```

4. 用路由元信息替代 Nest 装饰器。

### 6. 迁移认证授权模块

参考文件：

- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/auth/auth.controller.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/auth/auth.service.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/auth/auth.dto.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/auth/strategies/jwt.strategy.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/common/module/token.module.ts`

计划：

1. 保持接口：
   - `GET /api/captcha`
   - `POST /api/login`
   - `GET /api/getInfo`
   - `GET /api/getRoutes`
   - `POST /api/logout`
   - `GET /api/test`
2. 保持登录流程：
   - 校验验证码
   - 查询用户
   - argon2 校验密码
   - JWT 签发
   - Redis 存 token
   - 登录日志
   - 在线用户记录
3. 重写 JWT 校验 hook：
   - 解析 Bearer token
   - 验签
   - 校验 Redis token
   - 多设备登录控制
   - 续期 token、在线用户、角色缓存、权限缓存
   - 将用户上下文放入 Elysia context
4. 保持 RBAC：
   - 管理员角色跳过权限限制
   - 普通用户从 Redis/数据库读取角色和权限

### 7. 迁移系统管理模块

参考目录：

- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/system/user/`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/system/role/`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/system/menu/`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/system/dict/`

计划：

1. 迁移用户接口：
   - `POST /api/system/user/create`
   - `DELETE /api/system/user/delete`
   - `PUT /api/system/user/update`
   - `PUT /api/system/user/resetPassword`
   - `PUT /api/system/user/updatePassword`
   - `GET /api/system/user/list`
   - `GET /api/system/user/detail`
   - `GET /api/system/user/profile`
   - `PUT /api/system/user/profile/update`
2. 迁移角色接口：
   - `POST /api/system/role/create`
   - `DELETE /api/system/role/delete`
   - `PUT /api/system/role/update`
   - `GET /api/system/role/list`
   - `GET /api/system/role/list/all`
   - `GET /api/system/role/detail`
   - `PUT /api/system/role/changeStatus`
   - `POST /api/system/role/authPermission`
3. 迁移菜单接口：
   - `POST /api/system/menu/create`
   - `DELETE /api/system/menu/delete`
   - `PUT /api/system/menu/update`
   - `GET /api/system/menu/list`
   - `GET /api/system/menu/list/parent`
   - `GET /api/system/menu/detail`
   - `GET /api/system/menu/list/role`
4. 迁移字典接口：
   - `POST /api/system/dict/type/create`
   - `DELETE /api/system/dict/type/delete`
   - `PUT /api/system/dict/type/update`
   - `GET /api/system/dict/type/list`
   - `GET /api/system/dict/type/detail`
   - `POST /api/system/dict/data/create`
   - `DELETE /api/system/dict/data/delete`
   - `PUT /api/system/dict/data/update`
   - `GET /api/system/dict/data/list`
   - `GET /api/system/dict/data/detail`
   - `GET /api/system/dict/data/list/type`
   - `DELETE /api/system/dict/clearCahche`
5. 保持原权限码、操作日志标记、防重复提交规则。

### 8. 迁移公共模块

参考目录：

- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/common/upload/`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/common/excel/`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/common/email/`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/public/template/email/`

计划：

1. 上传模块：
   - 使用 Elysia/Bun multipart 解析替代 Multer
   - 保持普通上传、秒传、分片上传、合并、清理接口
   - 保持 SHA-256 文件命名
   - 保持 10MB 普通上传限制
   - 保持 `/uploads/` 静态访问
2. Excel 模块：
   - 保留 `exceljs`
   - 迁移实体字段 Excel 元信息，优先继续使用 `reflect-metadata`
   - 用 Web Response 返回二进制下载
   - 手动设置 `Content-Type` 和 `Content-Disposition`
3. 邮件模块：
   - 使用 `nodemailer`
   - 使用 Handlebars 或等价模板渲染
   - 复制邮件模板目录

### 9. 迁移监控模块

参考目录：

- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/monitor/server/`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/monitor/health/`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/monitor/cache/`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/monitor/online/`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/monitor/log/`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/monitor/job/`

计划：

1. 服务器监控：
   - `GET /api/monitor/server`
   - 保留 CPU、内存、磁盘、系统信息
   - 保留响应缓存
2. 健康检查：
   - `GET /api/monitor/health/live`
   - `GET /api/monitor/health/ready`
   - `GET /api/monitor/health`
   - `GET /api/monitor/health/network`
   - `GET /api/monitor/health/database`
   - `GET /api/monitor/health/memory`
   - `GET /api/monitor/health/rss`
   - `GET /api/monitor/health/storage`
   - 不使用 `@nestjs/terminus`，手写检查逻辑
3. 缓存监控：
   - 保持 Redis INFO、commandstats、dbsize、key 查询和删除
4. 在线用户：
   - 保持列表、数量、强制退出
   - 保持 Redis token/online key 兼容
5. 日志管理：
   - 登录日志 CRUD、清空、导出
   - 操作日志 CRUD、清空、导出
6. 定时任务：
   - 使用原生 BullMQ `Queue`、`Worker`、`QueueEvents`
   - 保持任务 CRUD、状态切换、立即执行、日志、导出
   - 用服务注册表替代 Nest DiscoveryService
   - `invokeTarget` 只允许调用注册表中明确暴露的方法

### 10. 迁移 AI 模块

参考目录：

- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/ai/`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/utils/openai.uti.ts`

计划：

1. 保持接口：
   - `POST /api/ai/chat/stream`
   - `GET /api/ai/conversation/list`
   - `DELETE /api/ai/conversation/delete`
   - `PUT /api/ai/conversation/updateTitle`
   - `GET /api/ai/message/list`
2. 保留 LangChain/OpenAI 兼容配置。
3. SSE 使用 Web `ReadableStream` 返回。
4. `chat/stream` 必须跳过统一 JSON 响应包装。
5. 保持会话创建、消息保存、token 统计、摘要生成、上下文组装。
6. 验证 Bun 下 LangChain streaming 行为。

### 11. 迁移资源模块

参考目录：

- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/modules/resource/prompt/`

计划：

1. 保持接口：
   - `POST /api/resource/prompt/create`
   - `PUT /api/resource/prompt/update`
   - `DELETE /api/resource/prompt/delete`
   - `GET /api/resource/prompt/list`
   - `GET /api/resource/prompt/detail`
2. 保持提示词 CRUD、分页、过滤、权限、操作日志、防重复提交。

### 12. DTO 校验与分页处理

参考文件：

- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/common/dto/pagination.dto.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/common/pipe/pagination.pipe.ts`
- 各模块 `*.dto.ts`

计划：

1. 将 DTO 校验迁移为 Elysia schema 或统一手写校验。
2. 保持分页参数转换：
   - `pageNum`
   - `pageSize`
   - `skip`
   - `take`
3. 保持原错误提示格式。
4. 对 body/query/params 进行边界校验。

### 13. 日志、异常、响应格式

参考文件：

- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/common/class/ajax-result.class.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/common/exception/business.exception.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/common/filter/all-exception.filter.ts`
- `/Users/xuyifei_coco/Documents/github_demo/YunHe-Vue/apps/server/src/common/interceptor/reponse-transform.interceptor.ts`

计划：

1. 保持成功响应：

```json
{
  "code": 200,
  "success": true,
  "message": "请求成功",
  "data": {},
  "requestId": "...",
  "timestamp": "..."
}
```

2. 保持失败响应：

```json
{
  "code": 500,
  "success": false,
  "message": "错误信息",
  "data": null,
  "requestId": "...",
  "timestamp": "..."
}
```

3. 文件下载、SSE、静态资源必须跳过统一包装。

## Assumptions & Decisions

1. 默认保留 MySQL 数据库和现有表结构，不迁移数据库 schema。
2. 默认保留 TypeORM，避免把所有复杂 QueryBuilder 和实体关系迁移到新 ORM。
3. 默认保留 ioredis，因为 BullMQ 官方推荐 Redis 客户端场景下继续使用 ioredis 更稳妥。
4. 默认保留 BullMQ，但移除 Nest BullMQ 封装。
5. 默认保留 LangChain 和 OpenAI 兼容实现。
6. 默认不使用 Express，不使用 Nest，不使用 Nest 模块系统。
7. 默认接口路径、权限码、Redis key、响应格式、数据库字段保持兼容。
8. 定时任务动态调用将不再自动扫描所有 Service，而是使用显式服务注册表。这是必要的架构差异。
9. 如果 TypeORM、BullMQ、LangChain 在 Bun 下出现不可兼容问题，应优先局部替换实现，而不是回退到 Nest 或 Node 启动方式。
10. 当前迁移范围非常大，执行时应按模块逐步迁移和验证，不应一次性重写后再统一调试。

## 需要提前告知的可能无法完全等价点

1. Nest 自动 Provider 发现机制无法在 Elysia 中原样实现。
   - 替代方案：显式服务注册表。
   - 影响：定时任务 `invokeTarget` 只能调用已注册的服务方法。

2. Nest 装饰器路由元数据无法原样依赖。
   - 替代方案：Elysia 路由元信息。
   - 影响：路由声明方式会变化，但外部接口行为可保持一致。

3. Nest Interceptor/Guard/Filter 执行链无法原样复用。
   - 替代方案：Elysia hook 链。
   - 影响：需要重点测试鉴权、限流、响应缓存、操作日志的执行顺序。

4. Express/Multer/StreamableFile 不可复用。
   - 替代方案：Elysia multipart、Web Response、ReadableStream。
   - 影响：上传、Excel、SSE 需要专项验证。

5. TypeORM 在 Bun 下存在兼容性风险。
   - 替代方案：如验证失败，再考虑局部改原生 SQL 或其他 ORM。
   - 影响：这是迁移的第一优先验证项。

6. LangChain streaming 在 Bun 下存在兼容性风险。
   - 替代方案：如验证失败，改用 OpenAI 兼容 HTTP SSE 原生请求。
   - 影响：AI 流式接口可能需要降级实现，但接口可保持一致。

## Implementation Order

1. 初始化 `bun_server` 包结构、依赖和基础脚本。
2. 迁移配置系统、常量、工具函数。
3. 迁移实体和 TypeORM DataSource，验证数据库连接。
4. 迁移 RedisService 和 CaptchaService。
5. 建立 Elysia app、全局前缀、静态资源、统一响应和异常。
6. 实现路由元信息系统和全局 hook 链。
7. 迁移 Auth 模块，完成登录、JWT、用户上下文、权限缓存。
8. 迁移 System 模块：用户、角色、菜单、字典。
9. 迁移 Common 模块：上传、Excel、邮件。
10. 迁移 Monitor 基础模块：健康、服务器、缓存、在线用户、日志。
11. 迁移 BullMQ 定时任务模块。
12. 迁移 AI SSE 模块。
13. 迁移 Resource Prompt 模块。
14. 全量接口对照测试和兼容性修复。

## Verification steps

执行阶段完成后，应使用 Bun 进行验证：

1. 依赖安装

```sh
bun install
```

2. 类型检查或构建检查

```sh
bun run build
```

如不配置 build，则至少运行：

```sh
bun index.ts
```

3. 启动开发服务

```sh
bun run dev
```

4. 基础接口验证

- `GET /api/test`
- `GET /api/captcha`
- `POST /api/login`
- `GET /api/getInfo`
- `GET /api/getRoutes`

5. 鉴权验证

- 无 token 访问受保护接口应失败
- 错误 token 应失败
- Redis 中删除 token 后应失败
- 正常 token 应续期
- 权限不足应失败
- 管理员权限应通过

6. 系统管理验证

- 用户 CRUD
- 角色 CRUD
- 菜单 CRUD
- 字典 CRUD
- 角色授权
- 用户角色绑定

7. 文件功能验证

- 普通上传
- 秒传检查
- 分片上传
- 分片合并
- 分片清理
- `/uploads/` 静态访问

8. 导出验证

- 登录日志导出
- 操作日志导出
- 任务日志导出
- 下载响应头和文件内容正确

9. 监控验证

- 健康检查
- 数据库检查
- 内存检查
- 磁盘检查
- Redis INFO
- 缓存 key 查询和删除
- 在线用户列表和强退

10. 定时任务验证

- 新增任务
- 修改任务
- 启停任务
- 立即执行一次
- 任务成功日志
- 任务失败日志
- 服务注册表中的方法调用

11. AI 验证

- 创建新会话并流式返回
- 历史会话列表
- 消息列表
- 修改会话标题
- 删除会话
- SSE 不被统一响应包装
- 流结束返回 `[DONE]` 或现有前端兼容结束标记

12. 回归对照

- 对照 Nest 项目的接口路径、请求参数、响应数据结构和状态码。
- 前端切换后端地址后，主要页面应无需改动即可运行。
