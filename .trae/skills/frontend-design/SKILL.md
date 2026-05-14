---
name: frontend-design
description: YunHe-Vue 前端设计规范助手，覆盖组件选用、BEM 样式、响应式布局、暗黑模式、图标/消息/表格等封装约定。当用户说"设计前端页面""写一个新页面""优化样式""前端 UI 怎么搞"时自动调用。
---

# 前端设计规范助手

严格遵循 YunHe-Vue 项目前端规范，确保生成页面风格一致、可直接运行。

## 组件选用优先级

| 场景     | 使用                                                | 禁止              |
| -------- | --------------------------------------------------- | ----------------- |
| 表格     | `ProTable`                                          | 直接用 `el-table` |
| 搜索表单 | `ProSearch`                                         | 手写搜索表单      |
| 图标     | `SvgIcon`，name 为 `src/assets/icons/svg/` 下文件名 | `ElIcon`          |
| 消息提示 | `TipModal.success/error/confirm`                    | `ElMessage`       |
| UI 组件  | Element Plus 组件                                   | 自己实现已有组件  |

## CSS 规范

1. **BEM 命名** — 禁止 UnoCSS 原子类，样式写在 `<style lang="scss" scoped>` 内
2. **色彩** — 优先使用 Element Plus CSS 变量（`var(--el-color-primary)`、`var(--el-text-color-primary)`、`var(--el-bg-color)`、`var(--el-border-color)` 等），实现暗黑主题自动适配
3. **路由页面** — 根节点统一挂载 `class="app-content"`，其自带内边距和基础样式，页面内子内容无需再重复写 padding 等布局样式
4. **暗黑模式** — 自定义 CSS 变量通过 `.dark` 选择器覆写

## 响应式布局

- 使用 Element Plus 响应式栅格（`:xs` / `:sm` / `:md` / `:lg` / `:xl`）
- 移动端适配通过 `html[data-device='mobile']` 选择器覆写样式
- 使用 `appStore.isDesktop` 判断设备类型，动态切换布局

## 组件规范

### el-button 图标

```html
<el-button plain type="primary">
  <template #icon> <SvgIcon name="Plus" /> </template>
  <span>新增</span>
</el-button>
```

### ProTable 列配置

```typescript
const columns: ProTableColumn<Entity>[] = [
  { align: 'center', type: 'selection' },
  { align: 'center', type: 'index', label: '序号', width: 64 },
  { align: 'center', prop: 'name', label: '名称', showOverflowTooltip: true, minWidth: 120 },
  { align: 'center', prop: 'status', label: '状态', slot: 'status' },
  { align: 'center', prop: 'createTime', label: '创建时间', minWidth: 170 },
  { align: 'center', slot: 'action', label: '操作', fixed: 'right', width: 120 },
]
```

- 字典字段用 `slot` + `<DictTag>` 渲染
- 时间列统一 `minWidth: 170`
- 操作列固定在最右侧 `fixed: 'right'`

### ProSearch 配置

```typescript
const items: ProSearchItem[] = [
  { type: 'input', prop: 'name', label: '名称' },
  { type: 'select', prop: 'status', label: '状态', options: sys_normal_disable },
  { type: 'date', prop: 'createTime', label: '创建时间' },
]
```

### 状态字段

```html
<el-form-item label="状态" prop="status">
  <el-radio-group v-model="form.status" :options="sys_normal_disable" />
</el-form-item>
```

### DictTag 渲染字典值

```html
<template #status="{ row }">
  <DictTag :options="sys_normal_disable" :value="row.status" />
</template>
```

## 代码结构

### `<script setup>` 严格顺序

1. `import` 语句（按行长度从短到长排序，type import 也一样）
2. `useDict()` 调用
3. 响应式变量（`ref` / `reactive`）
4. 计算属性（`computed`）
5. 配置常量（`items` / `columns` / `rules`）
6. 方法定义（`function` 关键字，不用箭头函数）
7. 初始化调用（如 `getList()`）

### 不需要手动引入

`ref`、`computed`、`onMounted`、`useRouter`、`useTemplateRef` 等已配置自动引入，直接使用即可。

## 表单弹窗模板

```html
<el-dialog v-model="visible" :title="dialogTitle" :close-on-click-modal="false" :width="dialogWidth">
  <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" :labelPosition>
    <!-- 表单字段 -->
  </el-form>
  <template #footer>
    <el-button @click="closeDialog">取消</el-button>
    <el-button type="primary" @click="handleSubmit">确定</el-button>
  </template>
</el-dialog>
```

- `dialogWidth` = `appStore.isDesktop ? '600px' : 'calc(100% - 32px)'`
- `labelPosition` = `appStore.isDesktop ? 'left' : 'top'`

## 样式示例

（以下为页面内部子内容块的 BEM 样式范例，padding 等布局由 `app-content` 提供，无需重复声明）

```scss
.my-block {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  &__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__card {
    margin-bottom: 16px;
  }
}

html[data-device='mobile'] {
  .my-block {
    &__header {
      flex-direction: column;
      gap: 12px;
    }
  }
}
```

## SVG 图标

- 所有图标文件位于 `apps/admin/src/assets/icons/` 目录
- 使用前确认图标文件存在，常用图标：`Plus`、`Delete`、`Edit`、`Search`、`Refresh`、`Save`、`Close`、`Check`、`Setting`、`User`、`Role`、`Menu`、`Dict`、`Home`、`Monitor`、`Server`、`Online`、`Log` 等
- 图标不存在又必须用时，提醒用户去 iconfont 下载或找 UI 设计师索要，不要自行创建替代图标
