export type Prettify<T> = {
  // 可以显示展示类型信息
  [k in keyof T]: T[k]
}
