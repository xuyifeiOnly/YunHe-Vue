<template>
  <div class="app-content">
    <ProSearch :items="items" v-model="queryParams" @query="handleQuery" @reset="resetQuery" />

    <div class="mb-16px">
      <el-button plain type="primary" @click="handleCreate()">
        <template #icon> <SvgIcon name="Plus" /> </template>
        <span>新增</span>
      </el-button>
      <el-button type="info" plain @click="toggleExpandAll">
        <template #icon> <SvgIcon name="Sort" /> </template>
        <span>{{ isExpandAll ? '折叠' : '展开' }}</span>
      </el-button>
    </div>

    <ProTable :loading="loading" :data="list" :columns="columns" row-key="id" :default-expand-all="isExpandAll" v-if="refreshTable">
      <template #image="{ row }">
        <el-image v-if="row.image" :src="row.image" :preview-src-list="[row.image]" fit="cover" class="w-40px h-40px" preview-teleported />
        <span v-else>-</span>
      </template>
      <template #status="{ row }">
        <DictTag :options="sys_normal_disable" :value="row.status" />
      </template>
      <template #action="{ row }">
        <el-link type="primary" @click="handleCreate(row)">新增</el-link>
        <el-link type="primary" @click="handleEdit(row)">修改</el-link>
        <el-link type="primary" @click="handleDelete(row)">删除</el-link>
      </template>
    </ProTable>

    <el-dialog v-model="visible" :title="dialogTitle" :close-on-click-modal="false" :width="dialogWidth">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" :labelPosition>
        <el-form-item label="上级分类" prop="parentId">
          <el-tree-select
            v-model="form.parentId"
            :data="parentOptions"
            :props="{ label: 'name', children: 'children' }"
            node-key="id"
            check-strictly
            placeholder="请选择上级分类"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="分类名称" prop="name">
          <el-input v-model.trim="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类图片" prop="image">
          <UploadImage v-model="form.image" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="999" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status" :options="sys_normal_disable" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model.trim="form.description" type="textarea" placeholder="请输入描述" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { TipModal } from '@/utils'
import { CommonConstant } from '@/common'
import { GoodsCategoryRequest } from '@/api/goods/goods-category.request'
import type { ProTableColumn, ProSearchItem, GoodsCategoryEntity, GoodsCategoryTreeEntity } from '@/types'

const { sys_normal_disable } = useDict('sys_normal_disable')

const list = ref<GoodsCategoryTreeEntity[]>([])
const loading = ref<boolean>(false)
const isExpandAll = ref<boolean>(false)
const refreshTable = ref<boolean>(true)
const queryParams = ref<{ name?: string; status?: string }>({})

const visible = ref<boolean>(false)
const dialogTitle = ref<string>('新增商品分类')
const formRef = useTemplateRef('formRef')
const form = ref<GoodsCategoryEntity>({ parentId: '0', status: CommonConstant.STATUS_NORMAL, sort: 0 } as GoodsCategoryEntity)
const isUpdate = computed(() => !!form.value.id)
const parentOptions = ref<any[]>([])

const appStore = useAppStore()
const dialogWidth = computed(() => (appStore.isDesktop ? '600px' : 'calc(100% - 32px)'))
const labelPosition = computed(() => (appStore.isDesktop ? 'left' : 'top'))

const items: ProSearchItem[] = [
  { type: 'input', prop: 'name', label: '分类名称' },
  { type: 'select', prop: 'status', label: '状态', options: sys_normal_disable },
]

const columns: ProTableColumn<GoodsCategoryEntity>[] = [
  { align: 'left', label: '分类名称', prop: 'name', minWidth: 180 },
  { align: 'center', label: '分类图片', slot: 'image', width: 80 },
  { align: 'center', label: '排序', prop: 'sort', width: 80 },
  { align: 'center', label: '状态', slot: 'status', width: 80 },
  { align: 'center', label: '描述', prop: 'description', minWidth: 150, showOverflowTooltip: true },
  { align: 'center', label: '创建时间', prop: 'createTime', width: 170 },
  { align: 'center', label: '操作', slot: 'action', width: 180, fixed: 'right' },
]

const rules = {
  name: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }],
  status: [{ required: true, message: '状态不能为空', trigger: 'change' }],
}

async function getList() {
  try {
    loading.value = true
    const data = await GoodsCategoryRequest.findList(queryParams.value)
    list.value = data as unknown as GoodsCategoryTreeEntity[]
  } catch (error) {
    console.error('GoodsCategoryRequest findList error:', error)
    return Promise.reject(error)
  } finally {
    loading.value = false
  }
}

function handleQuery() {
  getList()
}

function resetQuery() {
  queryParams.value = {}
  handleQuery()
}

function toggleExpandAll() {
  refreshTable.value = false
  isExpandAll.value = !isExpandAll.value
  nextTick(() => (refreshTable.value = true))
}

function handleCreate(row?: GoodsCategoryEntity) {
  dialogTitle.value = '新增商品分类'
  resetForm()
  if (row) {
    form.value.parentId = row.id
  }
  loadParentOptions()
  visible.value = true
}

function handleEdit(row: GoodsCategoryEntity) {
  dialogTitle.value = '修改商品分类'
  form.value = { ...row }
  loadParentOptions()
  visible.value = true
}

async function loadParentOptions() {
  try {
    const data = await GoodsCategoryRequest.findParentList()
    parentOptions.value = data as unknown as any[]
  } catch (error) {
    console.error('loadParentOptions error:', error)
  }
}

async function handleDelete(row: GoodsCategoryEntity) {
  try {
    const { cancel } = await TipModal.confirm(`确定要删除《${row.name}》吗？`)
    if (cancel) return TipModal.msg('操作取消')
    await GoodsCategoryRequest.delete({ ids: row.id })
    await getList()
    TipModal.msgSuccess('删除成功')
  } catch (error) {
    console.error('GoodsCategoryRequest delete error:', error)
    return Promise.reject(error)
  }
}

async function handleSubmit() {
  try {
    await formRef.value?.validate()
    const func = isUpdate.value ? GoodsCategoryRequest.update : GoodsCategoryRequest.create
    await func(form.value)
    TipModal.msgSuccess(isUpdate.value ? '修改成功' : '新增成功')
    closeDialog()
    await getList()
  } catch (error: unknown) {
    console.error('error: ', error)
  }
}

function closeDialog() {
  visible.value = false
  resetForm()
}

function resetForm() {
  form.value = { parentId: '0', status: CommonConstant.STATUS_NORMAL, sort: 0 } as GoodsCategoryEntity
  formRef.value?.resetFields()
}

onMounted(() => {
  getList()
})
</script>

<style lang="scss" scoped></style>