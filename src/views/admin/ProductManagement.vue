<template>
  <div class="product-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <h2>商品管理</h2>
        </div>
      </template>

      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索商品名称或品牌"
          style="width: 300px; margin-right: 10px;"
          clearable
          @keyup.enter="loadProducts"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        
        <el-select
          v-model="filterStatus"
          placeholder="商品状态"
          style="width: 150px; margin-right: 10px;"
          clearable
          @change="loadProducts"
        >
          <el-option label="全部" :value="null" />
          <el-option label="待审核" :value="1" />
          <el-option label="已上架" :value="2" />
          <el-option label="已下架" :value="3" />
        </el-select>

        <el-button type="primary" @click="loadProducts">
          <el-icon><Search /></el-icon>
          搜索
        </el-button>
      </div>

      <!-- 商品列表 -->
      <el-table :data="products" v-loading="loading" style="width: 100%; margin-top: 20px;">
        <el-table-column type="index" label="序号" width="60" />
        
        <el-table-column label="商品图片" width="100">
          <template #default="{ row }">
            <el-image
              :src="row.mainImage"
              style="width: 60px; height: 60px; border-radius: 4px;"
              fit="cover"
            />
          </template>
        </el-table-column>
        
        <el-table-column prop="productName" label="商品名称" min-width="200" />
        
        <el-table-column prop="brand" label="品牌" width="120" />
        
        <el-table-column prop="shopName" label="商家" width="150" />
        
        <el-table-column label="价格" width="120">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold;">¥{{ row.salePrice }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="stock" label="库存" width="80" />
        
        <el-table-column prop="salesVolume" label="销量" width="80" />
        
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.productStatus === 1" type="warning">待审核</el-tag>
            <el-tag v-else-if="row.productStatus === 2" type="success">已上架</el-tag>
            <el-tag v-else-if="row.productStatus === 3" type="info">已下架</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.auditStatus === 1" type="warning">待审核</el-tag>
            <el-tag v-else-if="row.auditStatus === 2" type="success">已通过</el-tag>
            <el-tag v-else-if="row.auditStatus === 3" type="danger">已拒绝</el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showProductDetail(row)">
              查看
            </el-button>
            
            <!-- 待审核商品：可以审核 -->
            <el-button 
              v-if="row.auditStatus === 1"
              link 
              type="success" 
              size="small" 
              @click="auditProduct(row.id, 2)"
            >
              通过
            </el-button>
            <el-button 
              v-if="row.auditStatus === 1"
              link 
              type="danger" 
              size="small" 
              @click="showRejectDialog(row)"
            >
              拒绝
            </el-button>
            
            <!-- 已上架的商品：可以下架 -->
            <el-button 
              v-if="row.productStatus === 2"
              link 
              type="warning" 
              size="small" 
              @click="updateProductStatus(row.id, 3)"
            >
              下架
            </el-button>
            
            <!-- 审核拒绝的商品：可以重新审核 -->
            <el-button 
              v-if="row.auditStatus === 3"
              link 
              type="success" 
              size="small" 
              @click="auditProduct(row.id, 2)"
            >
              重新通过
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="loadProducts"
        @current-change="loadProducts"
        style="margin-top: 20px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 拒绝审核对话框 -->
    <el-dialog v-model="rejectDialogVisible" title="拒绝审核" width="500px">
      <el-form :model="rejectForm" label-width="100px">
        <el-form-item label="拒绝原因">
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReject">确定</el-button>
      </template>
    </el-dialog>

    <!-- 商品详情对话框 -->
    <el-dialog v-model="detailDialogVisible" title="商品详情" width="900px">
      <el-descriptions :column="2" border v-if="currentProduct">
        <el-descriptions-item label="商品ID">{{ currentProduct.id }}</el-descriptions-item>
        <el-descriptions-item label="商品SKU">{{ currentProduct.productSn || '无' }}</el-descriptions-item>
        <el-descriptions-item label="商品名称" :span="2">{{ currentProduct.productName }}</el-descriptions-item>
        <el-descriptions-item label="品牌">{{ currentProduct.brand }}</el-descriptions-item>
        <el-descriptions-item label="商家">{{ currentProduct.shopName }}</el-descriptions-item>
        <el-descriptions-item label="原价">
          <span style="text-decoration: line-through; color: #909399;">¥{{ currentProduct.originalPrice }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="售价">
          <span style="color: #f56c6c; font-weight: bold; font-size: 18px;">¥{{ currentProduct.salePrice }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="库存">{{ currentProduct.stock }} 件</el-descriptions-item>
        <el-descriptions-item label="实际销量">{{ currentProduct.salesVolume }} 件</el-descriptions-item>
        <el-descriptions-item label="虚拟销量">{{ currentProduct.virtualSales || 0 }} 件</el-descriptions-item>
        <el-descriptions-item label="总销量">{{ (currentProduct.salesVolume || 0) + (currentProduct.virtualSales || 0) }} 件</el-descriptions-item>
        <el-descriptions-item label="商品状态">
          <el-tag v-if="currentProduct.productStatus === 1" type="warning">待审核</el-tag>
          <el-tag v-else-if="currentProduct.productStatus === 2" type="success">已上架</el-tag>
          <el-tag v-else-if="currentProduct.productStatus === 3" type="info">已下架</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="审核状态">
          <el-tag v-if="currentProduct.auditStatus === 1" type="warning">待审核</el-tag>
          <el-tag v-else-if="currentProduct.auditStatus === 2" type="success">已通过</el-tag>
          <el-tag v-else-if="currentProduct.auditStatus === 3" type="danger">已拒绝</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="平均评分" v-if="currentProduct.averageRating">
          <el-rate v-model="currentProduct.averageRating" disabled show-score text-color="#ff9900" />
        </el-descriptions-item>
        <el-descriptions-item label="评价数量" v-if="currentProduct.ratingCount">
          {{ currentProduct.ratingCount }} 条
        </el-descriptions-item>
        <el-descriptions-item label="审核备注" :span="2" v-if="currentProduct.auditRemark">
          <span style="color: #f56c6c;">{{ currentProduct.auditRemark }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">
          {{ formatDate(currentProduct.createdAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="更新时间">
          {{ formatDate(currentProduct.updatedAt) }}
        </el-descriptions-item>
        <el-descriptions-item label="商品图片" :span="2">
          <el-image
            :src="currentProduct.mainImage"
            style="width: 200px; height: 200px; border-radius: 8px;"
            fit="cover"
            :preview-src-list="[currentProduct.mainImage]"
          />
        </el-descriptions-item>
      </el-descriptions>

      <!-- SKU规格列表 -->
      <div v-if="currentProduct.skuList && currentProduct.skuList.length > 0" style="margin-top: 20px;">
        <el-divider content-position="left">
          <span style="font-weight: bold; font-size: 16px;">商品规格 ({{ currentProduct.skuList.length }})</span>
        </el-divider>
        <el-table :data="currentProduct.skuList" border style="width: 100%">
          <el-table-column label="SKU图片" width="100">
            <template #default="{ row }">
              <el-image
                v-if="row.skuImage"
                :src="row.skuImage"
                style="width: 60px; height: 60px; border-radius: 4px;"
                fit="cover"
                :preview-src-list="[row.skuImage]"
              />
              <span v-else style="color: #909399;">无图片</span>
            </template>
          </el-table-column>
          <el-table-column prop="skuCode" label="SKU编码" width="140" />
          <el-table-column prop="skuName" label="规格名称" min-width="200" />
          <el-table-column prop="price" label="价格" width="120">
            <template #default="{ row }">
              <span style="color: #f56c6c; font-weight: bold;">¥{{ row.price }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="stock" label="库存" width="100" />
          <el-table-column prop="salesVolume" label="销量" width="100" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.status === 1" type="success" size="small">启用</el-tag>
              <el-tag v-else type="info" size="small">禁用</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div v-else style="margin-top: 20px; text-align: center; color: #909399;">
        该商品暂无SKU规格信息
      </div>

      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="viewProductPage(currentProduct.id)">
          前往商品详情页
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import request from '@/utils/request'

const router = useRouter()
const loading = ref(false)
const products = ref<any[]>([])
const searchKeyword = ref('')
const filterStatus = ref<number | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)
const total = ref(0)
const rejectDialogVisible = ref(false)
const detailDialogVisible = ref(false)
const currentProduct = ref<any>(null)
const rejectForm = ref({
  productId: null as number | null,
  reason: ''
})

onMounted(() => {
  loadProducts()
})

const loadProducts = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      size: pageSize.value
    }
    
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    
    if (filterStatus.value !== null) {
      params.productStatus = filterStatus.value
    }

    const res = await request.get('/admin/products', { params })
    products.value = res.data?.list || res.data?.records || []
    total.value = res.data?.total || 0
  } catch (error: any) {
    console.error('加载商品列表失败', error)
    ElMessage.error(error.message || '加载商品列表失败')
  } finally {
    loading.value = false
  }
}

const showProductDetail = (product: any) => {
  currentProduct.value = product
  detailDialogVisible.value = true
}

const viewProductPage = (id: number) => {
  router.push(`/customer/product/${id}`)
}

const updateProductStatus = async (productId: number, status: number) => {
  const statusText = status === 2 ? '上架' : '下架'
  try {
    await ElMessageBox.confirm(`确定要${statusText}该商品吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.put(`/admin/products/${productId}/status`, null, {
      params: { status }
    })
    
    ElMessage.success(`${statusText}成功`)
    loadProducts()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('操作失败', error)
      ElMessage.error(error.message || '操作失败')
    }
  }
}

const auditProduct = async (productId: number, status: number) => {
  try {
    await ElMessageBox.confirm('确定要通过该商品的审核吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.put(`/admin/products/${productId}/audit`, {
      auditStatus: status,
      auditRemark: '审核通过'
    })
    
    ElMessage.success('审核成功')
    loadProducts()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('审核失败', error)
      ElMessage.error(error.message || '审核失败')
    }
  }
}

const showRejectDialog = (product: any) => {
  rejectForm.value.productId = product.id
  rejectForm.value.reason = ''
  rejectDialogVisible.value = true
}

const confirmReject = async () => {
  if (!rejectForm.value.reason) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  
  try {
    await request.put(`/admin/products/${rejectForm.value.productId}/audit`, {
      auditStatus: 3,
      auditRemark: rejectForm.value.reason
    })
    
    ElMessage.success('已拒绝该商品')
    rejectDialogVisible.value = false
    loadProducts()
  } catch (error: any) {
    console.error('操作失败', error)
    ElMessage.error(error.message || '操作失败')
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.product-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h2 {
  margin: 0;
  font-size: 20px;
}

.search-bar {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}
</style>
