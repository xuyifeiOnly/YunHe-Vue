<template>
  <div class="screen-adapter" ref="wrapperRef" :style="styles">
    <div class="screen-adapter__container" ref="containerRef">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'ScreenAdapter' })
import { debounce } from 'lodash-es'
import type { FitContainerProps } from './types'

const appStore = useAppStore()
const wrapperRef = useTemplateRef('wrapperRef')
const containerRef = useTemplateRef('containerRef')

const props = withDefaults(defineProps<FitContainerProps>(), {
  designWidth: 1920,
  designHeight: 1080,
})

const styles = computed(() => ({
  '--screen-adapter-container-width': `${props.designWidth}px`,
  '--screen-adapter-container-height': `${props.designHeight}px`,
}))

function resizeHandler() {
  if (!wrapperRef.value || !containerRef.value) return
  if (appStore.isMobile) {
    containerRef.value.style.transform = `translate(${0}px, ${0}px) scale(${1})`
    return
  }
  // 父容器实际尺寸
  const { clientWidth, clientHeight } = wrapperRef.value
  // 策略：取宽度和高度缩放比例的最小值，确保内容完整显示（类似 background-size: cover）
  const scaleX = clientWidth / props.designWidth
  const scaleY = clientHeight / props.designHeight
  // 取较小比例，确保内容完整不裁剪
  const scale = Math.min(scaleX, scaleY)
  // 🔥 关键修复：手动计算居中偏移，避免被裁剪
  const offsetX = (clientWidth - props.designWidth * scale) / 2
  const offsetY = (clientHeight - props.designHeight * scale) / 2
  // 应用缩放 + 居中（原点改为左上角，避免布局偏移）
  containerRef.value.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`
}

// 防抖处理（16ms = 60帧最优）
const debounceResize = debounce(() => requestAnimationFrame(resizeHandler), 16)

useResizeObserver(wrapperRef, debounceResize)

onMounted(resizeHandler)

onUnmounted(() => {
  debounceResize.cancel()
})
</script>

<style lang="scss" scoped>
.screen-adapter {
  position: relative;
  width: 100%;
  height: 100%;

  .screen-adapter__container {
    position: absolute;
    left: 0;
    top: 0;
    width: var(--screen-adapter-container-width);
    height: var(--screen-adapter-container-height);
    margin: 0 auto;
    flex-shrink: 0;
    transition: transform var(--el-transition-duration) ease-in-out;
    transform-origin: left top; // 原点改为左上角，避免布局偏移
  }
}

html[data-device='mobile'] .screen-adapter {
  .screen-adapter__container {
    width: 100%;
    height: auto;
  }
}
</style>
