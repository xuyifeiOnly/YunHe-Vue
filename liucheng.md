# 后端请求到响应完整流程图

本文只梳理当前项目后端 `apps/server` 的请求处理链路：从 HTTP 请求进入 NestJS 开始，到权限处理、参数验证、业务执行、响应包装或异常返回结束。

## 一、后端总览流程

```mermaid
flowchart TD
  A[HTTP 请求进入后端] --> B[main.ts 创建 NestJS 应用]
  B --> C[Helmet 安全头处理]
  C --> D[静态资源与全局路由前缀]
  D --> E[匹配 Controller 路由]
  E --> F[BeforeEachMiddleware]
  F --> F1[生成 requestId]
  F1 --> F2[写入响应头 x-request-id]
  F2 --> F3[打印请求方法、路径、参数、请求头日志]
  F3 --> G[全局 Guard 链路]

  G --> G1[ThrottlerLimitGuard 限流]
  G1 --> G2{接口 + IP 是否超过频率限制}
  G2 -- 是 --> X[抛出业务异常]
  G2 -- 否 --> G3[JwtAuthGuard 登录认证]

  G3 --> G4{接口是否标记 Public}
  G4 -- 是 --> G7[跳过 JWT 校验]
  G4 -- 否 --> G5{Token 是否有效}
  G5 -- 否 --> X
  G5 -- 是 --> G6[解析用户信息并写入请求上下文]
  G6 --> G7

  G7 --> G8[RoleAuthGuard 角色校验]
  G8 --> G9{接口是否声明角色要求}
  G9 -- 否 --> G12[跳过角色校验]
  G9 -- 是 --> G10[从 Redis 读取用户角色缓存]
  G10 --> G11{是否命中任一角色}
  G11 -- 否 --> X
  G11 -- 是 --> G12

  G12 --> G13[PermissionAuthGuard 权限校验]
  G13 --> G14{接口是否声明权限要求}
  G14 -- 否 --> G17[跳过权限校验]
  G14 -- 是 --> G15[从 Redis 读取用户权限缓存]
  G15 --> G16{是否命中任一权限}
  G16 -- 否 --> X
  G16 -- 是 --> G17

  G17 --> G18[RepeatSubmitGuard 防重复提交]
  G18 --> G19{接口是否使用 RepeatSubmit 且重复提交}
  G19 -- 是 --> X
  G19 -- 否 --> G20[DemoEnvironmentGuard 演示环境限制]
  G20 --> G21{演示环境是否禁止当前操作}
  G21 -- 是 --> X
  G21 -- 否 --> H[ValidationPipe 参数校验]

  H --> H1{DTO 校验是否通过}
  H1 -- 否 --> X
  H1 -- 是 --> I[进入 Controller]
  I --> J[调用 Service]
  J --> K[访问数据库 / Redis / 其他资源]
  K --> L[返回业务数据]

  L --> M[响应拦截器链路]
  M --> M1[OperationLogInterceptor 操作日志]
  M1 --> M2[ResponseCacheInterceptor 响应缓存]
  M2 --> M3[ReponseTransformInterceptor 统一响应包装]
  M3 --> N[返回成功 JSON]

  X --> Y[AllExceptionsFilter 统一异常处理]
  Y --> Z[返回异常 JSON]
```

## 二、后端启动与全局能力注册

```mermaid
flowchart TD
  A[bootstrap] --> B[NestFactory.create AppModule]
  B --> C[加载 Winston 日志]
  C --> D[app.use helmet]
  D --> E[读取配置 serverPort / globalPrefix]
  E --> F[配置 uploads 静态资源]
  F --> G[app.setGlobalPrefix]
  G --> H[app.listen 启动 HTTP 服务]
```

关键文件：

- `apps/server/src/main.ts`：后端启动入口，配置 Helmet、静态资源、全局前缀、端口监听。
- `apps/server/src/app.module.ts`：注册全局 Guard、Pipe、Filter、Interceptor 和中间件。

`AppModule` 中的全局处理顺序大致如下：

```mermaid
flowchart TD
  A[请求进入 AppModule] --> B[BeforeEachMiddleware]
  B --> C[APP_GUARD]
  C --> C1[ThrottlerLimitGuard]
  C1 --> C2[JwtAuthGuard]
  C2 --> C3[RoleAuthGuard]
  C3 --> C4[PermissionAuthGuard]
  C4 --> C5[RepeatSubmitGuard]
  C5 --> C6[DemoEnvironmentGuard]
  C6 --> D[APP_PIPE ValidationPipe]
  D --> E[Controller / Service]
  E --> F[APP_INTERCEPTOR]
  F --> F1[OperationLogInterceptor]
  F1 --> F2[ResponseCacheInterceptor]
  F2 --> F3[ReponseTransformInterceptor]
  E -. 异常 .-> G[APP_FILTER AllExceptionsFilter]
```

## 三、请求上下文中间件

`BeforeEachMiddleware` 会在请求进入业务逻辑前执行。

```mermaid
flowchart TD
  A[请求进入 BeforeEachMiddleware] --> B[生成 requestId]
  B --> C[request 中保存 requestId]
  C --> D[响应头写入 requestId]
  D --> E[打印请求日志]
  E --> F[next 进入后续 Guard / Controller]
```

主要职责：

- 生成每个请求唯一的 `requestId`。
- 将 `requestId` 写入请求对象，供后续日志、异常、响应使用。
- 将 `requestId` 写入响应头。
- 打印请求方法、路径、query、body、authorization、user-agent 等信息。

相关文件：

- `apps/server/src/common/middleware/before-each.middleware.ts`

## 四、Guard 权限与安全处理流程

### 1. 限流守卫 ThrottlerLimitGuard

```mermaid
flowchart TD
  A[进入 ThrottlerLimitGuard] --> B{接口是否 SkipThrottle}
  B -- 是 --> C[直接放行]
  B -- 否 --> D[获取客户端 IP 和接口路径]
  D --> E[生成 Redis 限流 key]
  E --> F{key 是否 locked}
  F -- 是 --> G[抛出 请求过于频繁]
  F -- 否 --> H[Redis incr 请求次数]
  H --> I{是否首次请求}
  I -- 是 --> J[设置限流窗口过期时间]
  I -- 否 --> K[继续判断]
  J --> K
  K --> L{次数是否超过上限}
  L -- 是 --> M[写入 locked 并抛异常]
  L -- 否 --> C
```

规则：

- 默认 10 秒内最多 10 次。
- 超过限制后锁定 30 分钟。
- 使用接口路径 + IP 作为限流维度。

相关文件：

- `apps/server/src/common/guard/throttler-limit.guard.ts`

### 2. JWT 登录认证 JwtAuthGuard

```mermaid
flowchart TD
  A[进入 JwtAuthGuard] --> B{接口是否有 Public 元数据}
  B -- 是 --> C[直接放行]
  B -- 否 --> D[执行 Passport JWT 策略]
  D --> E{Token 是否有效}
  E -- 是 --> F[返回 user 并写入请求上下文]
  E -- 否 --> G[抛出 401 登录已过期]
```

规则：

- 使用 `@Public()` 标记的接口跳过 JWT 校验。
- 非公开接口必须携带有效 Token。
- Token 无效或缺失时抛出 `登录已过期，请重新登录`。

常见公开接口：

- `GET /captcha`
- `POST /login`
- `POST /logout`

相关文件：

- `apps/server/src/common/guard/jwt-auth.guard.ts`
- `apps/server/src/modules/auth/strategies/jwt.strategy.ts`
- `apps/server/src/common/decorator/public.decorator.ts`

### 3. 角色守卫 RoleAuthGuard

```mermaid
flowchart TD
  A[进入 RoleAuthGuard] --> B{接口是否声明角色要求}
  B -- 否 --> C[直接放行]
  B -- 是 --> D[从 request 中读取 userId]
  D --> E{userId 是否存在}
  E -- 否 --> F[抛出未登录或登录过期]
  E -- 是 --> G[从 Redis 读取用户角色缓存]
  G --> H{是否包含任一要求角色}
  H -- 是 --> C
  H -- 否 --> I[抛出 403 暂无角色访问]
```

规则：

- 只有接口声明角色元数据时才校验。
- 从 Redis 读取 `ADMIN_USER_ROLES:userId`。
- 只要用户拥有要求角色中的任意一个，就允许访问。

相关文件：

- `apps/server/src/common/guard/role-auth.guard.ts`
- `apps/server/src/common/decorator/require-roles.decorator.ts`

### 4. 权限守卫 PermissionAuthGuard

```mermaid
flowchart TD
  A[进入 PermissionAuthGuard] --> B{接口是否声明权限要求}
  B -- 否 --> C[直接放行]
  B -- 是 --> D[从 request 中读取 userId]
  D --> E{userId 是否存在}
  E -- 否 --> F[抛出未登录或登录过期]
  E -- 是 --> G[从 Redis 读取用户权限缓存]
  G --> H{是否包含任一要求权限}
  H -- 是 --> C
  H -- 否 --> I[抛出 403 暂无权限访问]
```

规则：

- 只有接口声明权限元数据时才校验。
- 从 Redis 读取 `ADMIN_USER_PERMISSIONS:userId`。
- 只要用户拥有要求权限中的任意一个，就允许访问。

相关文件：

- `apps/server/src/common/guard/permission-auth.guard.ts`
- `apps/server/src/common/decorator/require-permissions.decorator.ts`

### 5. 防重复提交 RepeatSubmitGuard

```mermaid
flowchart TD
  A[进入 RepeatSubmitGuard] --> B{接口是否使用 RepeatSubmit 装饰器}
  B -- 否 --> C[直接放行]
  B -- 是 --> D[读取 requestId]
  D --> E[根据 method + path + params + query + body 生成唯一 key]
  E --> F[对 key 做 MD5]
  F --> G{Redis 中是否已存在}
  G -- 是 --> H[抛出 数据正在处理中，请勿重复提交]
  G -- 否 --> I[写入 Redis 并设置过期时间]
  I --> C
```

规则：

- 只有使用 `@RepeatSubmit()` 的接口才启用。
- 默认过期时间 5 秒。
- 基于请求方法、路径、params、query、body 生成唯一标识。

相关文件：

- `apps/server/src/common/guard/repeat-submit.guard.ts`
- `apps/server/src/common/decorator/repeat-submit.decorator.ts`

### 6. 演示环境守卫 DemoEnvironmentGuard

```mermaid
flowchart TD
  A[进入 DemoEnvironmentGuard] --> B{是否演示环境}
  B -- 否 --> C[直接放行]
  B -- 是 --> D[读取请求方法和路径]
  D --> E{是否 GET 请求}
  E -- 是 --> C
  E -- 否 --> F{是否白名单接口}
  F -- 是 --> C
  F -- 否 --> G[抛出 演示环境，不允许操作]
```

规则：

- 非演示环境全部放行。
- 演示环境允许 GET 请求。
- 演示环境允许白名单中的非 GET 请求，例如登录、退出。
- 其他写操作全部拦截。

相关文件：

- `apps/server/src/common/guard/demo-environment.guard.ts`

## 五、参数验证流程

后端通过全局 `ValidationPipe` 统一处理 DTO 参数校验。

```mermaid
flowchart TD
  A[Guard 全部通过] --> B[ValidationPipe]
  B --> C[读取 Controller 参数 DTO]
  C --> D[执行 class-validator 装饰器校验]
  D --> E[过滤 DTO 未声明字段]
  E --> F[执行类型转换]
  F --> G{校验是否通过}
  G -- 是 --> H[进入 Controller 方法]
  G -- 否 --> I[抛出 BadRequestException]
  I --> J[AllExceptionsFilter 格式化响应]
```

全局配置：

```ts
new ValidationPipe({
  whitelist: true,
  transform: true,
  stopAtFirstError: true,
})
```

配置含义：

- `whitelist: true`：过滤 DTO 中未声明的字段。
- `transform: true`：按 DTO 类型转换参数。
- `stopAtFirstError: true`：遇到第一个错误即停止。

常见 DTO 校验装饰器：

- `@IsNotEmpty()`：不能为空。
- `@IsOptional()`：可选。
- `@IsArray()`：必须是数组。
- `@Matches()`：必须匹配正则。

相关文件：

- `apps/server/src/app.module.ts`
- `apps/server/src/modules/**/*.dto.ts`

## 六、Controller 与 Service 业务处理

```mermaid
flowchart TD
  A[参数校验通过] --> B[Controller 方法]
  B --> C[读取 Body / Query / Param / Headers / CurrentUser]
  C --> D[调用 Service]
  D --> E[Service 执行业务规则]
  E --> F[访问数据库 / Redis / 文件 / 第三方服务]
  F --> G{业务是否成功}
  G -- 是 --> H[返回业务数据]
  G -- 否 --> I[抛出 BusinessException 或其他异常]
```

职责划分：

- Controller：接收请求参数，调用 Service，不承载复杂业务逻辑。
- Service：执行业务规则、数据库访问、Redis 访问、文件处理等。
- Entity / DTO：描述数据结构和参数规则。

## 七、响应拦截器流程

### 1. 操作日志 OperationLogInterceptor

```mermaid
flowchart TD
  A[Controller 返回或抛错] --> B[OperationLogInterceptor]
  B --> C{接口是否配置操作日志装饰器}
  C -- 否 --> D[不记录日志]
  C -- 是 --> E[计算请求耗时]
  E --> F[读取 requestId / 用户 / 参数 / IP / 地址]
  F --> G[组装操作日志实体]
  G --> H[写入操作日志]
```

相关文件：

- `apps/server/src/common/interceptor/operation-log.interceptor.ts`
- `apps/server/src/common/decorator/oper-log.decorator.ts`

### 2. 响应缓存 ResponseCacheInterceptor

```mermaid
flowchart TD
  A[进入 ResponseCacheInterceptor] --> B[读取响应缓存装饰器配置]
  B --> C{是否配置缓存 key}
  C -- 否 --> D[直接执行后续逻辑]
  C -- 是 --> E[从 Redis 读取缓存]
  E --> F{是否命中缓存}
  F -- 是 --> G[直接返回缓存数据]
  F -- 否 --> H[执行后续逻辑]
  H --> I[将结果写入 Redis 并设置 TTL]
  I --> J[返回结果]
```

相关文件：

- `apps/server/src/common/interceptor/response-cache.interceptor.ts`
- `apps/server/src/common/decorator/response-cache.decorator.ts`

### 3. 统一响应包装 ReponseTransformInterceptor

```mermaid
flowchart TD
  A[业务数据返回] --> B[ReponseTransformInterceptor]
  B --> C{是否 SkipTransform}
  C -- 是 --> D[返回原始数据]
  C -- 否 --> E[读取 requestId]
  E --> F[组装 code / success / message / requestId / data / timestamp]
  F --> G[AjaxResult.success 包装]
  G --> H[返回 JSON]
```

成功响应格式大致为：

```json
{
  "code": 200,
  "success": true,
  "message": "请求成功",
  "requestId": "请求 ID",
  "data": {},
  "timestamp": 1780000000000
}
```

相关文件：

- `apps/server/src/common/interceptor/reponse-transform.interceptor.ts`
- `apps/server/src/common/decorator/skip-transform.decorator.ts`
- `apps/server/src/common/class/ajax-result.class.ts`

## 八、异常处理流程

```mermaid
flowchart TD
  A[任意阶段抛出异常] --> B[AllExceptionsFilter 捕获]
  B --> C[获取 request / response]
  C --> D[读取 requestId]
  D --> E[分析异常类型]
  E --> F[得到 HTTP status / 业务 code / message]
  F --> G[格式化特殊异常消息]
  G --> G1[DTO 参数错误]
  G --> G2[接口不存在]
  G --> G3[请求频率限制]
  G --> G4[数据库连接异常]
  G --> G5[外键约束异常]
  G1 --> H[打印错误日志]
  G2 --> H
  G3 --> H
  G4 --> H
  G5 --> H
  H --> I[返回统一异常 JSON]
```

异常响应格式大致为：

```json
{
  "code": 400,
  "success": false,
  "message": "错误信息",
  "requestId": "请求 ID",
  "data": null,
  "timestamp": 1780000000000
}
```

相关文件：

- `apps/server/src/common/filter/all-exception.filter.ts`
- `apps/server/src/common/exception/business.exception.ts`

## 九、登录请求示例

```mermaid
flowchart TD
  A[POST /login] --> B[BeforeEachMiddleware 生成 requestId]
  B --> C[ThrottlerLimitGuard 限流]
  C --> D[JwtAuthGuard 识别 Public 放行]
  D --> E[RoleAuthGuard 无角色要求放行]
  E --> F[PermissionAuthGuard 无权限要求放行]
  F --> G[RepeatSubmitGuard 校验重复登录提交]
  G --> H[DemoEnvironmentGuard 白名单放行]
  H --> I[ValidationPipe 校验 LoginDto]
  I --> J[AuthController.login]
  J --> K[AuthService.login]
  K --> L[校验验证码 / 用户 / 密码]
  L --> M[生成 Token]
  M --> N[ReponseTransformInterceptor 包装响应]
  N --> O[返回 accessToken]
```

## 十、普通业务请求示例

```mermaid
flowchart TD
  A[业务接口请求] --> B[BeforeEachMiddleware]
  B --> C[ThrottlerLimitGuard]
  C --> D[JwtAuthGuard 校验 Token]
  D --> E[RoleAuthGuard 校验角色]
  E --> F[PermissionAuthGuard 校验权限]
  F --> G[RepeatSubmitGuard 按需防重]
  G --> H[DemoEnvironmentGuard 演示环境限制]
  H --> I[ValidationPipe 参数校验]
  I --> J[Controller]
  J --> K[Service]
  K --> L[数据库 / Redis]
  L --> M[OperationLogInterceptor 按需记录日志]
  M --> N[ResponseCacheInterceptor 按需读写缓存]
  N --> O[ReponseTransformInterceptor 包装响应]
  O --> P[返回结果]
```

## 十一、关键文件对照表

| 阶段 | 处理内容 | 位置 |
| --- | --- | --- |
| 后端入口 | NestJS 启动、Helmet、全局前缀 | `apps/server/src/main.ts` |
| 全局注册 | Guard、Pipe、Filter、Interceptor、中间件 | `apps/server/src/app.module.ts` |
| 请求上下文 | requestId、响应头、请求日志 | `apps/server/src/common/middleware/before-each.middleware.ts` |
| 限流 | 接口 + IP 维度限流 | `apps/server/src/common/guard/throttler-limit.guard.ts` |
| 登录认证 | JWT 校验，Public 接口跳过 | `apps/server/src/common/guard/jwt-auth.guard.ts` |
| JWT 策略 | Token 解析与用户载荷验证 | `apps/server/src/modules/auth/strategies/jwt.strategy.ts` |
| 角色校验 | Redis 用户角色缓存匹配 | `apps/server/src/common/guard/role-auth.guard.ts` |
| 权限校验 | Redis 用户权限缓存匹配 | `apps/server/src/common/guard/permission-auth.guard.ts` |
| 后端防重 | `@RepeatSubmit()` 接口防重复提交 | `apps/server/src/common/guard/repeat-submit.guard.ts` |
| 演示环境 | 演示环境禁止非白名单写操作 | `apps/server/src/common/guard/demo-environment.guard.ts` |
| 参数验证 | DTO + `ValidationPipe` | `apps/server/src/app.module.ts`、`apps/server/src/modules/**/*.dto.ts` |
| 异常处理 | 统一异常响应 | `apps/server/src/common/filter/all-exception.filter.ts` |
| 操作日志 | 按装饰器记录接口操作日志 | `apps/server/src/common/interceptor/operation-log.interceptor.ts` |
| 响应缓存 | 命中缓存直接返回，未命中写入 Redis | `apps/server/src/common/interceptor/response-cache.interceptor.ts` |
| 响应包装 | 成功响应统一包装 | `apps/server/src/common/interceptor/reponse-transform.interceptor.ts` |
| 业务入口 | Controller 接收请求 | `apps/server/src/modules/**/*.controller.ts` |
| 业务逻辑 | Service 执行业务 | `apps/server/src/modules/**/*.service.ts` |
