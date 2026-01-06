<template>
  <div class="coupon-management">
    <div class="page-header">
      <h2>优惠券管理</h2>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon>
        创建优惠券
      </el-button>
    </div>

    <el-table :data="templates" v-loading="loading" style="width: 100%">
      <el-table-column label="优惠券名称" prop="couponName" width="180" />
      <el-table-column label="类型" width="120">
        <template #default="{ row }">
          <el-tag :type="getCouponTypeTag(row.couponType)">
            {{ getCouponTypeName(row.couponType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="优惠内容" width="150">
        <template #default="{ row }">
          <span v-if="row.couponType === 1 || row.couponType === 3">
            减{{ row.discountAmount }}元
          </span>
          <span v-else>
            {{ (row.discountRate * 10).toFixed(1) }}折
          </span>
        </template>
      </el-table-column>
      <el-table-column label="使用门槛" width="120">
        <template #default="{ row }">
          <span v-if="row.minAmount > 0">满{{ row.minAmount }}元</span>
          <span v-else>无门槛</span>
        </template>
      </el-table-column>
      <el-table-column label="兑换积分" width="100" prop="pointsCost" />
      <el-table-column label="发行数量" width="120">
        <template #default="{ row }">
          <span v-if="row.totalCount === -1">不限量</span>
          <span v-else>{{ row.totalCount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="已领取" width="100" prop="receivedCount" />
      <el-table-column label="有效期" width="100">
        <template #default="{ row }">
          {{ row.validDays }}天
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-switch
            v-model="row.status"
            :active-value="1"
            :inactive-value="2"
            @change="handleStatusChange(row)"
          />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-if="total > 0"
      v-model:current-page="page"
      :page-size="size"
      :total="total"
      layout="prev, pager, next, total"
      @current-change="loadTemplates"
      style="margin-top: 20px; justify-content: center"
    />

    <!-- 创建/编辑优惠券对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑优惠券' : '创建优惠券'"
      width="600px"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="优惠券名称" prop="couponName">
          <el-input v-model="form.couponName" placeholder="请输入优惠券名称" />
        </el-form-item>

        <el-form-item label="优惠券类型" prop="couponType">
          <el-radio-group v-model="form.couponType">
            <el-radio :label="1">满减券</el-radio>
            <el-radio :label="2">折扣券</el-radio>
            <el-radio :label="3">无门槛券</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item 
          v-if="form.couponType === 1 || form.couponType === 3" 
          label="减免金额" 
          prop="discountAmount"
        >
          <el-input-number 
            v-model="form.discountAmount" 
            :min="0.01" 
            :precision="2"
            placeholder="减免金额"
          />
          <span style="margin-left: 10px">元</span>
        </el-form-item>

        <el-form-item 
          v-if="form.couponType === 2" 
          label="折扣率" 
          prop="discountRate"
        >
          <el-input-number 
            v-model="form.discountRate" 
            :min="0.1" 
            :max="0.99"
            :step="0.1"
            :precision="2"
            placeholder="折扣率"
          />
          <span style="margin-left: 10px">（0.8表示8折）</span>
        </el-form-item>

        <el-form-item 
          v-if="form.couponType === 1 || form.couponType === 2" 
          label="最低消费" 
          prop="minAmount"
        >
          <el-input-number 
            v-model="form.minAmount" 
            :min="0" 
            :precision="2"
            placeholder="最低消费金额"
          />
          <span style="margin-left: 10px">元</span>
        </el-form-item>

        <el-form-item label="兑换积分" prop="pointsCost">
          <el-input-number 
            v-model="form.pointsCost" 
            :min="1" 
            placeholder="所需积分"
          />
          <span style="margin-left: 10px">积分</span>
        </el-form-item>

        <el-form-item label="发行数量" prop="totalCount">
          <el-input-number 
            v-model="form.totalCount" 
            :min="-1" 
            placeholder="发行数量"
          />
          <span style="margin-left: 10px">（-1表示不限量）</span>
        </el-form-item>

        <el-form-item label="有效天数" prop="validDays">
          <el-input-number 
            v-model="form.validDays" 
            :min="1" 
            placeholder="有效天数"
          />
          <span style="margin-left: 10px">天</span>
        </el-form-item>

        <el-form-item label="使用说明" prop="description">
          <el-input 
            v-model="form.description" 
            type="textarea" 
            :rows="3"
            placeholder="请输入使用说明"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'

const loading = ref(false)
const submitting = ref(false)
const templates = ref<any[]>([])
const page = ref(1)
const size = ref(20)
const total = ref(0)

const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref()

const form = reactive({
  id: null,
  couponName: '',
  couponType: 1,
  discountAmount: null,
  discountRate: null,
  minAmount: 0,
  pointsCost: 100,
  totalCount: -1,
  validDays: 30,
  description: ''
})

const rules = {
  couponName: [{ required: true, message: '请输入优惠券名称', trigger: 'blur' }],
  couponType: [{ required: true, message: '请选择优惠券类型', trigger: 'change' }],
  pointsCost: [{ required: true, message: '请输入兑换积分', trigger: 'blur' }],
  validDays: [{ required: true, message: '请输入有效天数', trigger: 'blur' }]
}

const loadTemplates = async () => {
  loading.value = true
  try {
    const res = await request.get('/merchant/coupon/template/list', {
      params: { page: page.value, size: size.value }
    })
    templates.value = res.data?.list || []
    total.value = res.data?.total || 0
  } catch (error: any) {
    console.error('加载优惠券模板失败', error)
    ElMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const showCreateDialog = () => {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

const handleEdit = (row: any) => {
  isEdit.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

const resetForm = () => {
  form.id = null
  form.couponName = ''
  form.couponType = 1
  form.discountAmount = null
  form.discountRate = null
  form.minAmount = 0
  form.pointsCost = 100
  form.totalCount = -1
  form.validDays = 30
  form.description = ''
}

const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    submitting.value = true
    
    if (isEdit.value) {
      await request.put(`/merchant/coupon/template/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await request.post('/merchant/coupon/template', form)
      ElMessage.success('创建成功')
    }
    
    dialogVisible.value = false
    loadTemplates()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('提交失败', error)
      ElMessage.error(error.message || '操作失败')
    }
  } finally {
    submitting.value = false
  }
}

const handleStatusChange = async (row: any) => {
  try {
    await request.put(`/merchant/coupon/template/${row.id}/status`, null, {
      params: { status: row.status }
    })
    ElMessage.success('状态更新成功')
  } catch (error: any) {
    console.error('更新状态失败', error)
    ElMessage.error(error.message || '更新失败')
    row.status = row.status === 1 ? 2 : 1
  }
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm(
      '确定要删除该优惠券模板吗？',
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    await request.delete(`/merchant/coupon/template/${row.id}`)
    ElMessage.success('删除成功')
    loadTemplates()
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除失败', error)
      ElMessage.error(error.message || '删除失败')
    }
  }
}

const getCouponTypeName = (type: number) => {
  const typeMap: Record<number, string> = {
    1: '满减券',
    2: '折扣券',
    3: '无门槛券'
  }
  return typeMap[type] || '未知'
}

const getCouponTypeTag = (type: number) => {
  const tagMap: Record<number, string> = {
    1: 'success',
    2: 'warning',
    3: 'danger'
  }
  return tagMap[type] || 'info'
}

onMounted(() => {
  loadTemplates()
})
</script>

<style scoped>
.coupon-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
}
</style>
