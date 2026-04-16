<template>
  <div class="dictionaries-container">
    <!-- 操作面板 -->
    <el-card class="operation-card" shadow="never">
      <div class="operation-bar">
        <div class="left-btns">
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增字典</el-button>
        </div>
        
        <div class="center-search">
          <el-input
            v-model="searchForm.keyword"
            placeholder="搜索字典编码、名称"
            clearable
            style="width: 250px"
            @keyup.enter="handleSearch"
          >
            <template #append>
              <el-button :icon="Search" @click="handleSearch" />
            </template>
          </el-input>
        </div>
        
        <div class="right-filters">
          <el-select v-model="searchForm.status" placeholder="状态" clearable style="width: 100px" @change="handleSearch">
            <el-option label="启用" :value="1" />
            <el-option label="禁用" :value="0" />
          </el-select>
        </div>
      </div>
    </el-card>

    <!-- 字典列表 -->
    <el-card class="list-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="dictionaryList"
        style="width: 100%"
        border
        stripe
        row-key="id"
        default-expand-all
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="items-table">
              <div class="items-header">
                <span>字典项列表</span>
                <el-button type="primary" size="small" :icon="Plus" @click="handleAddItem(row)">添加字典项</el-button>
              </div>
              <el-table :data="row.items" border size="small">
                <el-table-column type="index" label="序号" width="60" align="center" />
                <el-table-column prop="item_code" label="编码" width="120" />
                <el-table-column prop="item_name" label="名称" width="150" />
                <el-table-column prop="item_value" label="值" min-width="150" />
                <el-table-column prop="sort_order" label="排序" width="80" align="center" />
                <el-table-column prop="status" label="状态" width="80" align="center">
                  <template #default="{ row: item }">
                    <el-tag :type="item.status === 1 ? 'success' : 'danger'" size="small">
                      {{ item.status === 1 ? '启用' : '禁用' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="150" align="center">
                  <template #default="{ row: item }">
                    <el-button link type="primary" size="small" @click="handleEditItem(row, item)">编辑</el-button>
                    <el-button link type="danger" size="small" @click="handleDeleteItem(row, item)">删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="dict_code" label="字典编码" width="150" />
        <el-table-column prop="dict_name" label="字典名称" width="150" />
        <el-table-column prop="dict_type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.dict_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sort_order" label="排序" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'" size="small">
              {{ row.status === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button 
              link 
              :type="row.status === 1 ? 'danger' : 'success'" 
              size="small" 
              @click="handleToggleStatus(row)"
            >
              {{ row.status === 1 ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 字典表单对话框 -->
    <el-dialog
      :title="dictFormType === 'add' ? '新增字典' : '编辑字典'"
      v-model="dictDialogVisible"
      width="600px"
      :close-on-click-modal="false"
      @close="handleDictClose"
    >
      <el-form ref="dictFormRef" :model="dictForm" :rules="dictRules" label-width="100px">
        <el-form-item label="字典编码" prop="dict_code">
          <el-input v-model="dictForm.dict_code" placeholder="请输入字典编码" :disabled="dictFormType === 'edit'" />
        </el-form-item>
        <el-form-item label="字典名称" prop="dict_name">
          <el-input v-model="dictForm.dict_name" placeholder="请输入字典名称" />
        </el-form-item>
        <el-form-item label="字典类型" prop="dict_type">
          <el-select v-model="dictForm.dict_type" placeholder="请选择字典类型" style="width: 100%">
            <el-option label="字符串" value="string" />
            <el-option label="整数" value="int" />
            <el-option label="布尔值" value="boolean" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="dictForm.description" type="textarea" placeholder="请输入字典描述" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="dictForm.sort_order" :min="0" style="width: 100%" />
        </el-form-item>
        
        <!-- 字典项列表 -->
        <div v-if="dictFormType === 'add'" class="items-section">
          <div class="items-header">
            <span>字典项</span>
            <el-button type="primary" size="small" :icon="Plus" @click="handleAddFormItem">添加</el-button>
          </div>
          <el-table :data="dictForm.items" border size="small">
            <el-table-column type="index" label="序号" width="50" align="center" />
            <el-table-column label="编码" width="120">
              <template #default="{ row, $index }">
                <el-input v-model="row.item_code" size="small" placeholder="编码" />
              </template>
            </el-table-column>
            <el-table-column label="名称" width="120">
              <template #default="{ row, $index }">
                <el-input v-model="row.item_name" size="small" placeholder="名称" />
              </template>
            </el-table-column>
            <el-table-column label="值" min-width="100">
              <template #default="{ row, $index }">
                <el-input v-model="row.item_value" size="small" placeholder="值（可选）" />
              </template>
            </el-table-column>
            <el-table-column label="排序" width="80">
              <template #default="{ row, $index }">
                <el-input-number v-model="row.sort_order" size="small" :min="0" style="width: 100%" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ $index }">
                <el-button link type="danger" size="small" @click="handleRemoveFormItem($index)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-form>
      <template #footer>
        <el-button @click="dictDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitDict" :loading="submitLoading">保存</el-button>
      </template>
    </el-dialog>

    <!-- 字典项表单对话框 -->
    <el-dialog
      :title="itemFormType === 'add' ? '添加字典项' : '编辑字典项'"
      v-model="itemDialogVisible"
      width="500px"
      :close-on-click-modal="false"
      @close="handleItemClose"
    >
      <el-form ref="itemFormRef" :model="itemForm" :rules="itemRules" label-width="100px">
        <el-form-item label="编码" prop="item_code">
          <el-input v-model="itemForm.item_code" placeholder="请输入字典项编码" :disabled="itemFormType === 'edit'" />
        </el-form-item>
        <el-form-item label="名称" prop="item_name">
          <el-input v-model="itemForm.item_name" placeholder="请输入字典项名称" />
        </el-form-item>
        <el-form-item label="值" prop="item_value">
          <el-input v-model="itemForm.item_value" placeholder="请输入字典项值（可选，默认与名称相同）" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="itemForm.sort_order" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="itemForm.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="itemForm.status">
            <el-radio :value="1">启用</el-radio>
            <el-radio :value="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="itemDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitItem" :loading="itemSubmitLoading">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import { 
  getDictionaries, 
  createDictionary, 
  updateDictionary, 
  deleteDictionary,
  addDictionaryItem,
  updateDictionaryItem,
  deleteDictionaryItem
} from '@/api/dictionaries'

// 加载状态
const loading = ref(false)
const submitLoading = ref(false)
const itemSubmitLoading = ref(false)

// 字典列表
const dictionaryList = ref([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 搜索表单
const searchForm = reactive({
  keyword: '',
  status: ''
})

// 字典表单
const dictDialogVisible = ref(false)
const dictFormType = ref('add')
const dictFormRef = ref(null)
const dictForm = reactive({
  dict_code: '',
  dict_name: '',
  dict_type: 'string',
  description: '',
  sort_order: 0,
  items: []
})

const dictRules = {
  dict_code: [{ required: true, message: '请输入字典编码', trigger: 'blur' }],
  dict_name: [{ required: true, message: '请输入字典名称', trigger: 'blur' }],
  dict_type: [{ required: true, message: '请选择字典类型', trigger: 'change' }]
}

// 字典项表单
const itemDialogVisible = ref(false)
const itemFormType = ref('add')
const itemFormRef = ref(null)
const currentDict = ref(null)
const itemForm = reactive({
  item_code: '',
  item_name: '',
  item_value: '',
  sort_order: 0,
  remark: '',
  status: 1
})

const itemRules = {
  item_code: [{ required: true, message: '请输入字典项编码', trigger: 'blur' }],
  item_name: [{ required: true, message: '请输入字典项名称', trigger: 'blur' }]
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      status: searchForm.status
    }
    const res = await getDictionaries(params)
    dictionaryList.value = res.data.list || []
    pagination.total = res.data.pagination?.total || 0
  } catch (error) {
    console.error('获取字典列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

// 分页变化
const handleSizeChange = (size) => {
  pagination.pageSize = size
  fetchData()
}

const handleCurrentChange = (page) => {
  pagination.page = page
  fetchData()
}

// 新增字典
const handleAdd = () => {
  dictFormType.value = 'add'
  Object.assign(dictForm, {
    dict_code: '',
    dict_name: '',
    dict_type: 'string',
    description: '',
    sort_order: 0,
    items: []
  })
  dictDialogVisible.value = true
}

// 编辑字典
const handleEdit = (row) => {
  dictFormType.value = 'edit'
  Object.assign(dictForm, {
    id: row.id,
    dict_code: row.dict_code,
    dict_name: row.dict_name,
    dict_type: row.dict_type,
    description: row.description,
    sort_order: row.sort_order,
    items: []
  })
  dictDialogVisible.value = true
}

// 提交字典
const handleSubmitDict = async () => {
  await dictFormRef.value.validate()
  
  submitLoading.value = true
  try {
    if (dictFormType.value === 'add') {
      await createDictionary(dictForm)
      ElMessage.success('字典创建成功')
    } else {
      const { id, items, ...updateData } = dictForm
      await updateDictionary(id, updateData)
      ElMessage.success('字典更新成功')
    }
    
    dictDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    submitLoading.value = false
  }
}

// 关闭字典表单
const handleDictClose = () => {
  dictFormRef.value?.resetFields()
}

// 添加表单中的字典项
const handleAddFormItem = () => {
  dictForm.items.push({
    item_code: '',
    item_name: '',
    item_value: '',
    sort_order: dictForm.items.length
  })
}

// 删除表单中的字典项
const handleRemoveFormItem = (index) => {
  dictForm.items.splice(index, 1)
}

// 切换状态
const handleToggleStatus = async (row) => {
  const newStatus = row.status === 1 ? 0 : 1
  try {
    await updateDictionary(row.id, { status: newStatus })
    ElMessage.success(newStatus === 1 ? '启用成功' : '禁用成功')
    fetchData()
  } catch (error) {
    console.error('切换状态失败:', error)
  }
}

// 删除字典
const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除字典 "${row.dict_name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteDictionary(row.id)
    ElMessage.success('删除成功')
    fetchData()
  })
}

// 添加字典项
const handleAddItem = (dict) => {
  currentDict.value = dict
  itemFormType.value = 'add'
  Object.assign(itemForm, {
    item_code: '',
    item_name: '',
    item_value: '',
    sort_order: 0,
    remark: '',
    status: 1
  })
  itemDialogVisible.value = true
}

// 编辑字典项
const handleEditItem = (dict, item) => {
  currentDict.value = dict
  itemFormType.value = 'edit'
  Object.assign(itemForm, {
    id: item.id,
    item_code: item.item_code,
    item_name: item.item_name,
    item_value: item.item_value,
    sort_order: item.sort_order,
    remark: item.remark,
    status: item.status
  })
  itemDialogVisible.value = true
}

// 提交字典项
const handleSubmitItem = async () => {
  await itemFormRef.value.validate()
  
  itemSubmitLoading.value = true
  try {
    if (itemFormType.value === 'add') {
      await addDictionaryItem(currentDict.value.id, itemForm)
      ElMessage.success('字典项添加成功')
    } else {
      const { id, item_code, ...updateData } = itemForm
      await updateDictionaryItem(currentDict.value.id, id, updateData)
      ElMessage.success('字典项更新成功')
    }
    
    itemDialogVisible.value = false
    fetchData()
  } catch (error) {
    console.error('保存失败:', error)
  } finally {
    itemSubmitLoading.value = false
  }
}

// 关闭字典项表单
const handleItemClose = () => {
  itemFormRef.value?.resetFields()
}

// 删除字典项
const handleDeleteItem = (dict, item) => {
  ElMessageBox.confirm(`确定要删除字典项 "${item.item_name}" 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    await deleteDictionaryItem(dict.id, item.id)
    ElMessage.success('删除成功')
    fetchData()
  })
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped lang="scss">
.dictionaries-container {
  .operation-card {
    margin-bottom: 15px;
    
    .operation-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
    }
  }
  
  .list-card {
    .items-table {
      padding: 15px;
      background-color: #f5f7fa;
      
      .items-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        font-weight: 600;
      }
    }
    
    .pagination-wrapper {
      margin-top: 20px;
      display: flex;
      justify-content: flex-end;
    }
  }
  
  .items-section {
    margin-top: 20px;
    
    .items-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      font-weight: 600;
    }
  }
}
</style>
