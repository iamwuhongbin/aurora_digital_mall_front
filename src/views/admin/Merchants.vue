<template>
  <div class="merchants">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>商家管理</span>
        </div>
      </template>

      <el-form :inline="true" class="search-form">
        <el-form-item label="审核状态">
          <el-select v-model="searchForm.status" placeholder="全部" clearable style="width: 150px">
            <el-option label="待审核" :value="1" />
            <el-option label="已通过" :value="2" />
            <el-option label="已拒绝" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="店铺名称/用户名" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadMerchants">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="merchants" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="shopName" label="店铺名称" width="200" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="contactPerson" label="联系人" width="120" />
        <el-table-column prop="contactPhone" label="联系电话" width="130" />
        <el-table-column label="审核状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getAuditType(row.auditStatus)">
              {{ getAuditText(row.auditStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditRemark" label="审核备注" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="申请时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.auditStatus === 1" size="small" type="success" @click="showAuditDialog(row, 2)">
              通过
            </el-button>
            <el-button v-if="row.auditStatus === 1" size="small" type="danger" @click="showAuditDialog(row, 3)">
              拒绝
            </el-button>
            <el-button v-if="row.auditStatus === 2" size="small" type="warning" @click="updateStatus(row.id, 3)">
              禁用
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
        @size-change="loadMerchants"
        @current-change="loadMerchants"
        style="margin-top: 20px; justify-content: flex-end"
      />
    </el-card>

    <el-dialog v-model="auditDialogVisible" :title="auditTitle" width="500px">
      <el-form :model="auditForm" label-width="80px">
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
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const auditing = ref(false)
const merchants = ref<any[]>([])
const auditDialogVisible = ref(false)
const auditTitle = ref('')

const searchForm = reactive({
  status: null as number | null,
  keyword: ''
})

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

const loadMerchants = async () => {
  loading.value = true
  try {
    const res = await request.get('/admin/merchant/list', {
      params: {
        status: searchForm.status,
        keyword: searchForm.keyword || undefined,
        page: pagination.page,
        size: pagination.size
      }
    })
    merchants.value = res.data.list
    pagination.total = res.data.total
  } catch (error) {
    console.error('加载商家列表失败', error)
    ElMessage.error('加载商家列表失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.status = null
  searchForm.keyword = ''
  pagination.page = 1
  loadMerchants()
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
  auditForm.id = row.id
  auditForm.status = status
  auditForm.remark = ''
  auditTitle.value = status === 2 ? '审核通过' : '审核拒绝'
  auditDialogVisible.value = true
}

const handleAudit = async () => {
  auditing.value = true
  try {
    await request.put(`/admin/merchant/${auditForm.id}/approve`, null, {
      params: {
        status: auditForm.status,
        remark: auditForm.remark || undefined
      }
    })
    
    const statusText = auditForm.status === 2 ? '通过' : '拒绝'
    ElMessage.success(`审核${statusText}成功`)
    auditDialogVisible.value = false
    
    // 如果当前筛选的是"待审核"，审核后清空筛选以显示所有商家
    if (searchForm.status === 1) {
      ElMessage.info('已清空筛选条件，显示所有商家')
      searchForm.status = null
    }
    
    loadMerchants()
  } catch (error) {
    console.error('审核失败', error)
    ElMessage.error('审核失败')
  } finally {
    auditing.value = false
  }
}

const updateStatus = async (id: number, status: number) => {
  try {
    await ElMessageBox.confirm('确定要禁用该商家吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await request.put(`/admin/merchant/${id}/status`, null, {
      params: { status }
    })
    ElMessage.success('操作成功')
    loadMerchants()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('操作失败', error)
      ElMessage.error('操作失败')
    }
  }
}

onMounted(() => {
  loadMerchants()
})
</script>

<style scoped>
.merchants h2 {
  margin-bottom: 20px;
}
</style>
