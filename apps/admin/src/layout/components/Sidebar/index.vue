<template>
  <aside class="flex flex-col">
    <AppLogo v-if="settingStore.showLogo" />

    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu class="sidebar-menu" :collapse="isCollapse" :collapse-transition="false" :default-active="defaultActive" :default-openeds="defaultOpeneds" :unique-opened="uniqueOpened">
        <SidebarItem v-for="(route, index) in sidebarRouters" :key="route.path + index" :item="route" :base-path="route.path" />
      </el-menu>
    </el-scrollbar>
  </aside>
</template>

<script setup lang="ts">
defineOptions({ name: 'Sidebar' })
import AppLogo from '../AppLogo/index.vue'
import SidebarItem from './SidebarItem.vue'
import type { RouteRecordRaw } from 'vue-router'
import { isExternal } from '@yunhe/utils'

const route = useRoute()
const appStore = useAppStore()
const settingStore = useSettingStore()
const permissionStore = usePermissionStore()

const isCollapse = computed(() => appStore.isCollapse)
const sidebarRouters = computed(() => permissionStore.sidebarRoutes)
const defaultActive = computed(() => String(route.meta.activeMenu || route.path))
const defaultOpeneds = computed(() => findOpeneds(sidebarRouters.value, defaultActive.value))
const uniqueOpened = computed(() => settingStore.uniqueOpened)

function normalizePath(path: string): string {
  return path ? path.replace(/\/+/g, '/').replace(/\/$/, '') : path
}

function resolveChildPath(parentPath: string, routePath: string) {
  if (isExternal(routePath)) return routePath
  if (isExternal(parentPath)) return parentPath
  if (routePath.startsWith('/')) return normalizePath(routePath)
  return normalizePath(`${parentPath}/${routePath}`)
}

function findOpeneds(routes: RouteRecordRaw[], activePath: string, parentPath = ''): string[] {
  for (const item of routes) {
    if (item.meta?.hidden) continue
    const currentPath = resolveChildPath(parentPath, item.path)
    const children = item.children?.filter((child) => !child.meta?.hidden) ?? []
    if (currentPath === activePath) return []
    const childOpeneds = findOpeneds(children, activePath, currentPath)
    if (childOpeneds.length || children.some((child) => resolveChildPath(currentPath, child.path) === activePath)) {
      return [currentPath, ...childOpeneds]
    }
  }
  return []
}
</script>

<style lang="scss" scoped>
.sidebar-menu {
  --el-menu-bg-color: var(--el-sidebar-bg-color);
  --el-menu-text-color: var(--el-sidebar-text-color);
  --el-menu-hover-text-color: var(--el-color-primary);
  --el-menu-hover-bg-color: var(--el-sidebar-hover-bg-color);
  --el-menu-active-text-color: var(--el-color-white);
  --el-menu-active-bg-color: var(--el-color-primary);
  --el-menu-item-height: var(--el-sidebar-item-height);
  --el-menu-sub-item-height: var(--el-sidebar-item-height);
  user-select: none;
  border: none;
  overflow: hidden;
}

.scrollbar-wrapper {
  background-color: purple !important;
}

/* 折叠状态下多级菜单有子菜单激活时顶级主菜单的样式 */
:deep(.sidebar-menu.el-menu--collapse .el-sub-menu.is-active .el-sub-menu__title),
:deep(.sidebar-menu.el-menu--collapse .el-menu-item.is-active) {
  color: var(--el-menu-active-text-color);
  background-color: var(--el-menu-active-bg-color);
}

/** 强制折叠后的图标水平垂直居中 */
:deep() .sidebar-menu.el-menu--collapse .el-tooltip__trigger {
  display: flex;
  justify-content: center;
  align-items: center;
}

/** 展开模式的子菜单样式 */
:deep() .el-sub-menu.is-opened .el-menu {
  background-color: var(--el-sidebar-nested-bg-color);
}
</style>

<style lang="scss">
.el-menu.el-menu--popup {
  --el-menu-item-height: var(--el-sidebar-item-height);
  --el-menu-sub-item-height: var(--el-sidebar-item-height);
  --el-menu-text-color: var(--el-sidebar-text-color);
  --el-menu-bg-color: var(--el-sidebar-bg-color);
  --el-menu-hover-text-color: var(--el-color-primary);
  --el-menu-hover-bg-color: var(--el-sidebar-hover-bg-color);
  border: none;
}
</style>
