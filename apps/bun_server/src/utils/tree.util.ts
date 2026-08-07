interface TreeHelperConfig {
  id: string
  children: string
  parentId: string
}

const DEFAULT_CONFIG: TreeHelperConfig = { id: 'id', children: 'children', parentId: 'parentId' }

export function listToTree<T = any>(list: any[], config: Partial<TreeHelperConfig> = {}): T[] {
  const { id, parentId, children } = Object.assign({}, DEFAULT_CONFIG, config)
  const nodeMap = new Map()
  const treeList: T[] = []
  for (const node of list) {
    node[children] = node[children] || []
    nodeMap.set(node[id], node)
  }
  for (const node of list) {
    const parent = nodeMap.get(node[parentId])
    ;(parent ? parent[children] : treeList).push(node)
  }
  return treeList
}
