<template>
  <section class="hero">
    <h1>ระบบยืมคืนทรัพย์สินบริษัท</h1>
    <p>ค้นหาทรัพย์สิน ตรวจสอบสถานะ และส่งคำขอยืมได้จากหน้าเดียว</p>
    <p v-if="user">เข้าสู่ระบบเป็น: <b>{{ user.name }}</b></p>
  </section>

  <div class="card">
    <label>ค้นหาทรัพย์สิน</label>
    <input v-model="q" @input="load" placeholder="ชื่อทรัพย์สิน / Serial / ประเภท" />
  </div>

  <div class="grid">
    <AssetCard v-for="asset in assets" :key="asset.AssetID"
      :asset="asset" :is-member="user?.type==='employee'"
      @borrow="openBorrow" />
  </div>

  <div v-if="selected" class="card">
    <h2>ขอยืม: {{ selected.AssetName }}</h2>
    <label>กำหนดคืน</label>
    <input type="date" v-model="dueDate" />
    <button @click="borrow">ส่งคำขอยืม</button>
    <button class="secondary" @click="selected=null">ยกเลิก</button>
    <p class="success" v-if="message">{{ message }}</p>
    <p class="error" v-if="error">{{ error }}</p>
  </div>

  <div class="card">
    <h2>ติดต่อเรา</h2>
    <p>ฝ่าย IT บริษัท — ดูแลระบบยืมคืนทรัพย์สิน</p>
    <p>Email: it@company.local | โทร: 02-000-0000</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../api';
import AssetCard from '../components/AssetCard.vue';

const assets = ref([]);
const q = ref('');
const selected = ref(null);
const dueDate = ref('');
const message = ref('');
const error = ref('');
const user = JSON.parse(localStorage.getItem('user') || 'null');

async function load() {
  const { data } = await api.get('/assets', { params: { q: q.value } });
  assets.value = data;
}
function openBorrow(asset) {
  if (!user) return location.href='/login';
  selected.value = asset; message.value=''; error.value='';
}
async function borrow() {
  try {
    if (!dueDate.value) return error.value='กรุณาเลือกกำหนดคืน';
    await api.post('/borrow', { assetId:selected.value.AssetID, dueDate:dueDate.value });
    message.value='ส่งคำขอยืมแล้ว รอ Admin อนุมัติ';
    selected.value=null;
    await load();
  } catch(e) { error.value=e.response?.data?.message || 'เกิดข้อผิดพลาด'; }
}
onMounted(load);
</script>
