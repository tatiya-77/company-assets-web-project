<template>
  <h1>Admin System</h1>
  <div class="grid">
    <div class="card"><b>ทรัพย์สินทั้งหมด</b><h2>{{stats.assets}}</h2></div>
    <div class="card"><b>พร้อมให้ยืม</b><h2>{{stats.available}}</h2></div>
    <div class="card"><b>กำลังถูกยืม</b><h2>{{stats.borrowed}}</h2></div>
    <div class="card"><b>รออนุมัติ</b><h2>{{stats.pending}}</h2></div>
  </div>

  <div class="card">
    <h2>จัดการทรัพย์สิน (Insert / Update / Delete / Search)</h2>
    <input v-model="q" @input="loadAssets" placeholder="ค้นหา..." />
    <table>
      <thead><tr><th>ชื่อ</th><th>ประเภท</th><th>สถานะ</th><th>Serial</th><th>จัดการ</th></tr></thead>
      <tbody>
        <tr v-for="a in assets" :key="a.AssetID">
          <td>{{a.AssetName}}</td><td>{{a.CategoryName}}</td><td>{{a.Status}}</td><td>{{a.SerialNumber}}</td>
          <td><button @click="edit(a)">Edit</button> <button class="danger" @click="remove(a.AssetID)">Delete</button></td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>{{form.AssetID ? 'แก้ไขทรัพย์สิน' : 'เพิ่มทรัพย์สิน'}}</h2>
    <input v-model="form.AssetName" placeholder="ชื่อทรัพย์สิน" />
    <select v-model="form.CategoryID"><option v-for="c in categories" :value="c.CategoryID">{{c.CategoryName}}</option></select>
    <select v-model="form.Status"><option>Available</option><option>Borrowed</option><option>Broken</option></select>
    <input v-model="form.PurchaseDate" type="date" />
    <input v-model="form.Price" type="number" placeholder="ราคา" />
    <input v-model="form.SerialNumber" placeholder="Serial Number" />
    <input v-model="form.Location" placeholder="สถานที่เก็บ" />
    <button @click="save">{{form.AssetID ? 'Update' : 'Insert'}}</button>
    <button class="secondary" @click="clear">Clear</button>
    <p class="success">{{message}}</p><p class="error">{{error}}</p>
  </div>

  <div class="card">
    <h2>รายการรออนุมัติ / การคืน</h2>
    <table>
      <thead><tr><th>สมาชิก</th><th>ทรัพย์สิน</th><th>กำหนดคืน</th><th>สถานะ</th><th>Action</th></tr></thead>
      <tbody>
        <tr v-for="x in borrows" :key="x.TransactionID">
          <td>{{x.EmployeeName}}</td><td>{{x.AssetName}}</td><td>{{x.DueDate}}</td><td>{{x.Status}}</td>
          <td>
            <button v-if="x.Status==='PendingApproval'" @click="approve(x.TransactionID)">อนุมัติ</button>
            <button v-if="x.Status==='Borrowed'" @click="returnAsset(x.TransactionID)">รับคืน</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import {ref,onMounted} from 'vue'; import api from '../api';
const assets=ref([]),categories=ref([]),borrows=ref([]),q=ref(''),message=ref(''),error=ref('');
const stats=ref({assets:0,available:0,borrowed:0,pending:0});
const blank=()=>({AssetID:null,AssetName:'',CategoryID:'',Status:'Available',PurchaseDate:'',Price:'',SerialNumber:'',Location:''});
const form=ref(blank());
async function loadAssets(){assets.value=(await api.get('/assets',{params:{q:q.value}})).data}
async function load(){await loadAssets();categories.value=(await api.get('/assets/categories')).data;borrows.value=(await api.get('/borrow')).data;stats.value=(await api.get('/admin/stats')).data}
function edit(a){form.value={...a,CategoryID:a.CategoryID}}
function clear(){form.value=blank()}
async function save(){try{if(form.value.AssetID)await api.put('/assets/'+form.value.AssetID,form.value);else await api.post('/assets',form.value);message.value='บันทึกสำเร็จ';error.value='';clear();await load()}catch(e){error.value=e.response?.data?.message||'บันทึกไม่สำเร็จ'}}
async function remove(id){if(!confirm('ยืนยันลบ?'))return;try{await api.delete('/assets/'+id);await load()}catch(e){error.value=e.response?.data?.message||'ลบไม่สำเร็จ'}}
async function approve(id){await api.put('/borrow/'+id+'/approve');await load()}
async function returnAsset(id){await api.put('/borrow/'+id+'/return');await load()}
onMounted(load);
</script>
