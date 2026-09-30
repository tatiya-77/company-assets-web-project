<template>
  <h1>รายการยืมของฉัน</h1>
  <div class="card" v-for="x in rows" :key="x.TransactionID">
    <h3>{{x.AssetName}}</h3>
    <p>วันที่ยืม: {{x.BorrowDate}} | กำหนดคืน: {{x.DueDate}}</p>
    <p>วันที่คืน: {{x.ReturnDate || '-'}} | สถานะ: <span class="badge">{{x.Status}}</span></p>
  </div>
</template>
<script setup>
import {ref,onMounted} from 'vue'; import api from '../api';
const rows=ref([]);
onMounted(async()=>rows.value=(await api.get('/borrow/my')).data);
</script>
