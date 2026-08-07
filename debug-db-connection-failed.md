# debug-db-connection-failed

状态：[OPEN]

## 问题

`bun run dev` 启动时出现：

```text
[ERROR] 数据库连接失败
error: script "dev" exited with code 1
```

## 假设

1. 数据库服务未启动。
2. 环境变量中的连接地址、端口、账号或密码错误。
3. 数据库名不存在。
4. 服务读取了错误的 env 文件或配置项。
5. 网络或权限导致连接被拒绝。

## 证据记录

待收集。
