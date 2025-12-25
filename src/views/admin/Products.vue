<template>
  <div class="products">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商品审核</span>
        </div>
      </template>

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
        <el-table-column prop="productName" label="商品名称" width="200" show-overflow-tooltip />
        <el-table-column prop="productSn" label="商品货号" width="150" />
        <el-table-column label="价格" width="120">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold;">¥{{ row.salePrice }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getAuditType(row.auditStatus)">
              {{ getAuditText(row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditRemark" label="审核备注" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="提交时间" width="180" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.auditStatus === 1" size="small" type="success" @click="showAuditDialog(row, 2)">
              通过
            </el-button>
            <el-button v-if="row.auditStatus === 1" size="small" type="danger" @click="showAuditDialog(row, 3)">
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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

    <el-dialog v-model="auditDialogVisible" :title="auditTitle" width="500px">
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="商品名称">
          <span>{{ currentProduct?.productName }}</span>
        </el-form-item>
        <el-form-item label="审核结果">
          <el-tag :type="auditForm.status === 2 ? 'success' : 'danger'">
            {{ auditForm.status === 2 ? '通过' : '拒绝' }}
          </el-tag>
        </el-form-item>
        <el-form-item label="审核备注">
          <el-input v-model="auditForm.remark" type="textarea" :rows="4" placeholder="请输入审核备注（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAudit" :loading="auditing">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const auditing = ref(false)
const products = ref<any[]>([])
const auditDialogVisible = ref(false)
const auditTitle = ref('')
const currentProduct = ref<any>(null)

const pagination = reactive({
  page: 1,
  size: 20,
  total: 0
})

const auditForm = reactive({
  id: null as number | null,
  status: 2,
  remark: ''
})

const loadProducts = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/product/pending', {
      params: {
        page: pagination.page,
        size: pagination.size
      }
    })
    products.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('加载商品列表失败', error)
    ElMessage.error('加载商品列表失败')
  } finally {
    loading.value = false
  }
}

const getAuditType = (status: number) => {
  const types: any = { 1: 'warning', 2: 'success', 3: 'danger' }
  return types[status] || 'info'
}

const getAuditText = (status: number) => {
  const texts: any = { 1: '待审核', 2: '已通过', 3: '已拒绝' }
  return texts[status] || '未知'
}

const showAuditDialog = (row: any, status: number) => {
  currentProduct.value = row
  auditForm.id = row.id
  auditForm.status = status
  auditForm.remark = ''
  auditTitle.value = status === 2 ? '审核通过' : '审核拒绝'
  auditDialogVisible.value = true
}

const handleAudit = async () => {
  auditing.value = true
  try {
    await request.put(`/admin/product/${auditForm.id}/approve`, null, {
      params: {
        status: auditForm.status,
        remark: auditForm.remark || undefined
      }
    })
    ElMessage.success('审核成功')
    auditDialogVisible.value = false
    loadProducts()
  } catch (error) {
    console.error('审核失败', error)
    ElMessage.error('审核失败')
  } finally {
    auditing.value = false
  }
}

onMounted(() => {
  loadProducts()
})
</script>

<style scoped>
.products h2 {
  margin-bottom: 20px;
}
</style>
