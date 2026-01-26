<template>
  <div class="products">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商品管理</span>
          <el-button type="primary" @click="showAddDialog">添加商品</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :inline="true" class="search-form">
        <el-form-item label="商品名称">
          <el-input v-model="searchForm.keyword" placeholder="请输入商品名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable>
            <el-option label="待上架" :value="1" />
            <el-option label="已上架" :value="2" />
            <el-option label="已下架" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadProducts">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 商品列表 -->
      <el-table :data="products" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="商品图片" width="100">
          <template #default="{ row }">
            <el-image 
              v-if="row.mainImage" 
              :src="row.mainImage" 
              style="width: 60px; height: 60px; border-radius: 4px;"
              fit="cover"
            />
          </template>
        </el-table-column>
        <el-table-column prop="productName" label="商品名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="productSn" label="商品货号" width="150" />
        <el-table-column prop="brand" label="品牌" width="120" show-overflow-tooltip />
        <el-table-column label="价格" width="120">
          <template #default="{ row }">
            <div style="color: #f56c6c; font-weight: bold">¥{{ row.salePrice }}</div>
            <div v-if="row.originalPrice" style="color: #909399; font-size: 12px; text-decoration: line-through">
              ¥{{ row.originalPrice }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column label="销量" width="100">
          <template #default="{ row }">
            {{ row.salesVolume + (row.virtualSales || 0) }}
          </template>
        </el-table-column>
        <el-table-column label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getAuditType(row.auditStatus)">
              {{ getAuditText(row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="商品状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.productStatus)">
              {{ getStatusText(row.productStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showEditDialog(row)">编辑</el-button>
            <el-button 
              v-if="row.productStatus === 1 || row.productStatus === 3"
              link 
              type="success" 
              size="small" 
              @click="toggleStatus(row, 2)"
            >
              上架
            </el-button>
            <el-button 
              v-if="row.productStatus === 2"
              link 
              type="warning" 
              size="small" 
              @click="toggleStatus(row, 3)"
            >
              下架
            </el-button>
            <el-button link type="danger" size="small" @click="deleteProduct(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadProducts"
        @current-change="loadProducts"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <!-- 添加/编辑商品对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="800px"
      @close="resetForm"
    >
      <el-form :model="productForm" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="商品名称" prop="productName">
          <el-input v-model="productForm.productName" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品分类" prop="categoryId">
          <el-cascader
            v-model="categoryPath"
            :options="categoryTree"
            :props="cascaderProps"
            placeholder="请选择商品分类"
            style="width: 100%"
            clearable
            @change="handleCategoryChange"
          />
          <div style="color: #909399; font-size: 12px; margin-top: 5px;">
            请选择具体的商品分类，支持一级、二级或三级分类
          </div>
        </el-form-item>
        <el-form-item label="商品货号">
          <el-input v-model="productForm.productSn" placeholder="留空自动生成" />
        </el-form-item>
        <el-form-item label="品牌">
          <el-input v-model="productForm.brand" placeholder="请输入品牌" />
        </el-form-item>
        <el-form-item label="商品主图" prop="mainImage">
          <ImageUpload v-model="productForm.mainImage" />
        </el-form-item>
        <el-form-item label="商品相册">
          <div class="sub-images-upload">
            <ImageUpload 
              v-for="(img, index) in subImagesList" 
              :key="index"
              v-model="subImagesList[index]"
              @update:modelValue="updateSubImages"
            />
            <el-button 
              v-if="subImagesList.length < 5" 
              type="primary" 
              plain 
              @click="addSubImage"
              style="width: 148px; height: 148px;"
            >
              <el-icon><Plus /></el-icon>
              添加图片
            </el-button>
          </div>
        </el-form-item>
        <el-form-item label="销售价格" prop="salePrice">
          <el-input-number v-model="productForm.salePrice" :min="0" :precision="2" :step="0.01" />
        </el-form-item>
        <el-form-item label="原价">
          <el-input-number v-model="productForm.originalPrice" :min="0" :precision="2" :step="0.01" />
        </el-form-item>
        <el-form-item label="库存" prop="stock">
          <el-input-number v-model="productForm.stock" :min="0" />
        </el-form-item>
        <el-form-item label="虚拟销量">
          <el-input-number v-model="productForm.virtualSales" :min="0" />
        </el-form-item>
        <el-form-item label="商品详情">
          <el-input v-model="productForm.detailHtml" type="textarea" :rows="6" placeholder="请输入商品详情HTML" />
        </el-form-item>
        <el-form-item label="商品规格">
          <SkuManager v-model="productForm.skus" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveProduct" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import ImageUpload from '@/components/ImageUpload.vue'
import SkuManager from '@/components/SkuManager.vue'

const loading = ref(false)
const saving = ref(false)
const products = ref<any[]>([])
const categories = ref<any[]>([]) // 所有分类的扁平列表
const categoryTree = ref<any[]>([]) // 分类树形结构
const categoryPath = ref<number[]>([]) // 当前选中的分类路径
const dialogVisible = ref(false)
const dialogTitle = ref('添加商品')
const formRef = ref<FormInstance>()
const subImagesList = ref<string[]>([])

const searchForm = reactive({
  keyword: '',
  status: null as number | null
})

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const productForm = reactive({
  id: null as number | null,
  categoryId: null as number | null,
  productName: '',
  productSn: '',
  brand: '',
  mainImage: '',
  subImages: '',
  detailHtml: '',
  originalPrice: 0,
  salePrice: 0,
  stock: 0,
  virtualSales: 0,
  skus: [] as any[]
})

const rules: FormRules = {
  productName: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  categoryId: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  mainImage: [{ required: true, message: '请输入商品主图', trigger: 'blur' }],
  salePrice: [{ required: true, message: '请输入销售价格', trigger: 'blur' }],
  stock: [{ required: true, message: '请输入库存', trigger: 'blur' }]
}

const loadProducts = async () => {
  loading.value = true
  try {
    const res = await request.get('/merchant/product/list', {
      params: {
        keyword: searchForm.keyword || undefined,
        status: searchForm.status !== null ? searchForm.status : undefined,
        page: pagination.page,
        size: pagination.size
      }
    })
    products.value = res.data.list || []
    pagination.total = res.data.total || 0
  } catch (error) {
    console.error('加载商品列表失败', error)
    ElMessage.error('加载商品列表失败')
  } finally {
    loading.value = false
  }
}

// 级联选择器配置
const cascaderProps = {
  value: 'id',
  label: 'categoryName',
  children: 'children',
  checkStrictly: true, // 允许选择任意一级
  emitPath: false // 只返回选中节点的值，不返回路径数组
}

const loadCategories = async () => {
  try {
    const res = await request.get('/product/category')
    categoryTree.value = res.data || []
    // 同时保存扁平列表用于查找
    categories.value = flattenCategories(res.data || [])
  } catch (error) {
    console.error('加载分类失败', error)
  }
}

const flattenCategories = (tree: any[]): any[] => {
  const result: any[] = []
  const flatten = (nodes: any[]) => {
    nodes.forEach(node => {
      result.push({ id: node.id, categoryName: node.categoryName, level: node.level, parentId: node.parentId })
      if (node.children && node.children.length > 0) {
        flatten(node.children)
      }
    })
  }
  flatten(tree)
  return result
}

// 处理分类选择变化
const handleCategoryChange = (value: any) => {
  if (Array.isArray(value)) {
    // 如果返回的是数组，取最后一个值
    productForm.categoryId = value[value.length - 1]
  } else {
    // 如果返回的是单个值
    productForm.categoryId = value
  }
}

// 根据分类ID获取分类路径
const getCategoryPath = (categoryId: number | null): number[] => {
  if (!categoryId) return []
  
  const path: number[] = []
  let currentId: number | null = categoryId
  
  while (currentId) {
    const category = categories.value.find(cat => cat.id === currentId)
    if (!category) break
    path.unshift(currentId)
    currentId = category.parentId
  }
  
  return path
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.status = null
  pagination.page = 1
  loadProducts()
}

const showAddDialog = () => {
  dialogTitle.value = '添加商品'
  resetForm()
  dialogVisible.value = true
}

const showEditDialog = async (row: any) => {
  dialogTitle.value = '编辑商品'
  await loadProductDetail(row.id)
  // 设置分类路径
  categoryPath.value = getCategoryPath(productForm.categoryId)
  dialogVisible.value = true
}

const loadProductDetail = async (id: number) => {
  try {
    const res = await request.get(`/merchant/product/${id}`)
    Object.assign(productForm, res.data)
    // 解析副图列表
    if (res.data.subImages) {
      subImagesList.value = res.data.subImages.split(',').filter((url: string) => url.trim())
    } else {
      subImagesList.value = []
    }
    // 加载SKU列表
    try {
      const skuRes = await request.get(`/merchant/product/${id}/skus`)
      productForm.skus = skuRes.data || []
    } catch (error) {
      console.error('加载SKU失败', error)
      productForm.skus = []
    }
  } catch (error) {
    console.error('加载商品详情失败', error)
    ElMessage.error('加载商品详情失败')
  }
}

const resetForm = () => {
  productForm.id = null
  productForm.categoryId = null
  productForm.productName = ''
  productForm.productSn = ''
  productForm.brand = ''
  productForm.mainImage = ''
  productForm.subImages = ''
  productForm.detailHtml = ''
  productForm.originalPrice = 0
  productForm.salePrice = 0
  productForm.stock = 0
  productForm.virtualSales = 0
  productForm.skus = []
  subImagesList.value = []
  categoryPath.value = [] // 清空分类路径
  formRef.value?.clearValidate()
}

const addSubImage = () => {
  if (subImagesList.value.length < 5) {
    subImagesList.value.push('')
  }
}

const updateSubImages = () => {
  // 过滤掉空字符串，将副图列表转换为逗号分隔的字符串
  productForm.subImages = subImagesList.value.filter(url => url.trim()).join(',')
}

const saveProduct = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    saving.value = true
    try {
      if (productForm.id) {
        await request.put(`/merchant/product/${productForm.id}`, productForm)
        ElMessage.success('更新成功')
      } else {
        await request.post('/merchant/product', productForm)
        ElMessage.success('添加成功')
      }
      dialogVisible.value = false
      loadProducts()
    } catch (error) {
      console.error('保存商品失败', error)
      ElMessage.error('保存商品失败')
    } finally {
      saving.value = false
    }
  })
}

const getAuditType = (status: number) => {
  const types: any = {
    1: 'warning',  // 待审核
    2: 'success',  // 已通过
    3: 'danger'    // 已拒绝
  }
  return types[status] || 'info'
}

const getAuditText = (status: number) => {
  const texts: any = {
    1: '待审核',
    2: '已通过',
    3: '已拒绝'
  }
  return texts[status] || '未知'
}

const getStatusType = (status: number) => {
  const types: any = {
    1: 'warning',  // 待上架
    2: 'success',  // 已上架
    3: 'info',     // 已下架
    4: 'danger'    // 已删除
  }
  return types[status] || 'info'
}

const getStatusText = (status: number) => {
  const texts: any = {
    1: '待上架',
    2: '已上架',
    3: '已下架',
    4: '已删除'
  }
  return texts[status] || '未知'
}

const toggleStatus = async (row: any, newStatus: number) => {
  const action = newStatus === 2 ? '上架' : '下架'
  
  try {
    await ElMessageBox.confirm(`确定要${action}该商品吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.put(`/merchant/product/${row.id}/status`, null, {
      params: { status: newStatus }
    })
    ElMessage.success(`${action}成功`)
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('操作失败', error)
      ElMessage.error('操作失败')
    }
  }
}

const deleteProduct = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定要删除该商品吗？删除后无法恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error'
    })
    
    await request.delete(`/merchant/product/${id}`)
    ElMessage.success('删除成功')
    loadProducts()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  loadProducts()
  loadCategories()
})
</script>

<style scoped>
.sub-images-upload {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
</style>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

.search-form {
  margin-bottom: 20px;
}

:deep(.el-pagination) {
  display: flex;
}
</style>
