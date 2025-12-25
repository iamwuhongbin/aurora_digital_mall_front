<template>
  <div class="categories">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商品分类管理</span>
          <el-button type="primary" @click="showAddDialog">添加分类</el-button>
        </div>
      </template>

      <el-table :data="categories" v-loading="loading" style="width: 100%" row-key="id" default-expand-all>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="categoryName" label="分类名称" min-width="200" />
        <el-table-column label="图标" width="100">
          <template #default="{ row }">
            <el-image 
              v-if="row.categoryIcon" 
              :src="row.categoryIcon" 
              style="width: 40px; height: 40px; border-radius: 4px;"
              fit="cover"
            />
          </template>
        </el-table-column>
        <el-table-column label="层级" width="100">
          <template #default="{ row }">
            <el-tag :type="row.level === 1 ? 'primary' : 'success'">
              {{ row.level === 1 ? '一级分类' : '二级分类' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="100" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.isShow === 1 ? 'success' : 'info'">
              {{ row.isShow === 1 ? '显示' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showEditDialog(row)">编辑</el-button>
            <el-button v-if="row.level === 1" link type="success" size="small" @click="showAddChildDialog(row)">
              添加子分类
            </el-button>
            <el-button link type="danger" size="small" @click="deleteCategory(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑分类对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="600px" @close="resetForm">
      <el-form :model="categoryForm" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="分类名称" prop="categoryName">
          <el-input v-model="categoryForm.categoryName" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类图标">
          <ImageUpload v-model="categoryForm.categoryIcon" tip="建议尺寸：200x200像素" />
        </el-form-item>
        <el-form-item label="上级分类" v-if="!categoryForm.parentId">
          <el-select v-model="categoryForm.parentId" placeholder="请选择上级分类（不选则为一级分类）" clearable style="width: 100%">
            <el-option 
              v-for="cat in topCategories" 
              :key="cat.id" 
              :label="cat.categoryName" 
              :value="cat.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="categoryForm.sortOrder" :min="0" />
          <span style="margin-left: 10px; color: #909399; font-size: 12px;">数字越小越靠前</span>
        </el-form-item>
        <el-form-item label="是否显示">
          <el-switch v-model="categoryForm.isShow" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCategory" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import request from '@/utils/request'
import ImageUpload from '@/components/ImageUpload.vue'

const loading = ref(false)
const saving = ref(false)
const categories = ref<any[]>([])
const dialogVisible = ref(false)
const dialogTitle = ref('添加分类')
const formRef = ref<FormInstance>()

const categoryForm = reactive({
  id: null as number | null,
  categoryName: '',
  categoryIcon: '',
  parentId: null as number | null,
  level: 1,
  sortOrder: 0,
  isShow: 1
})

const rules: FormRules = {
  categoryName: [
    { required: true, message: '请输入分类名称', trigger: 'blur' }
  ],
  sortOrder: [
    { required: true, message: '请输入排序', trigger: 'blur' }
  ]
}

const topCategories = computed(() => {
  return categories.value.filter(cat => cat.level === 1)
})

const loadCategories = async () => {
  loading.value = true
  try {
    const res = await request.get('/category/list')
    // 构建树形结构
    const topLevel = res.data.filter((cat: any) => cat.level === 1)
    topLevel.forEach((parent: any) => {
      parent.children = res.data.filter((cat: any) => cat.parentId === parent.id)
    })
    categories.value = topLevel
  } catch (error) {
    console.error('加载分类失败', error)
    ElMessage.error('加载分类失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  dialogTitle.value = '添加分类'
  resetForm()
  dialogVisible.value = true
}

const showAddChildDialog = (parent: any) => {
  dialogTitle.value = `添加子分类（${parent.categoryName}）`
  resetForm()
  categoryForm.parentId = parent.id
  categoryForm.level = 2
  dialogVisible.value = true
}

const showEditDialog = (row: any) => {
  dialogTitle.value = '编辑分类'
  categoryForm.id = row.id
  categoryForm.categoryName = row.categoryName
  categoryForm.categoryIcon = row.categoryIcon || ''
  categoryForm.parentId = row.parentId
  categoryForm.level = row.level
  categoryForm.sortOrder = row.sortOrder
  categoryForm.isShow = row.isShow
  dialogVisible.value = true
}

const resetForm = () => {
  categoryForm.id = null
  categoryForm.categoryName = ''
  categoryForm.categoryIcon = ''
  categoryForm.parentId = null
  categoryForm.level = 1
  categoryForm.sortOrder = 0
  categoryForm.isShow = 1
  formRef.value?.clearValidate()
}

const saveCategory = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    saving.value = true
    try {
      // 根据parentId设置level
      if (categoryForm.parentId) {
        categoryForm.level = 2
      } else {
        categoryForm.level = 1
      }
      
      if (categoryForm.id) {
        await request.put(`/category/${categoryForm.id}`, categoryForm)
        ElMessage.success('更新成功')
      } else {
        await request.post('/category', categoryForm)
        ElMessage.success('添加成功')
      }
      dialogVisible.value = false
      loadCategories()
    } catch (error) {
      console.error('保存分类失败', error)
      ElMessage.error('保存分类失败')
    } finally {
      saving.value = false
    }
  })
}

const deleteCategory = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除该分类吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.delete(`/category/${id}`)
    ElMessage.success('删除成功')
    loadCategories()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadCategories()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
