<template>
  <el-color-picker v-model="settingStore.primaryColor" @change="handleChange" :predefine="['#0077ff', '#1890ff', '#304156', '#11a988', '#ff983f', '#ff3d3d']" />
</template>

<script setup lang="ts">
defineOptions({ name: 'ThemePicker' })

const settingStore = useSettingStore()

function handleChange() {
  settingStore.setPrimaryColor(settingStore.primaryColor)
}
</script>
