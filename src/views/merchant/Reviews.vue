<template>
  <div class="reviews">
    <h2>评价管理</h2>
    <el-card>
      <el-table :data="reviews" style="width: 100%">
        <el-table-column prop="productName" label="商品名称" />
        <el-table-column prop="customerName" label="用户" />
        <el-table-column prop="rating" label="评分">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled />
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评价内容" />
        <el-table-column label="操作">
          <template #default>
            <el-button size="small" type="primary">回复</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const reviews = ref<any[]>([])
</script>

<style scoped>
.reviews h2 {
  margin-bottom: 20px;
}
</style>
