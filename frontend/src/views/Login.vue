<template>
  <div class="card">
    <h1>เข้าสู่ระบบ</h1>
    <p>Admin ใช้ Username / Password ส่วนสมาชิกใช้ Email / Password</p>
    <label>Username / Email</label>
    <input v-model="username" />
    <label>Password</label>
    <input type="password" v-model="password" />
    <button @click="login">Login</button>
    <p><router-link to="/register">สมัครสมาชิก</router-link> · <router-link to="/forgot-password">ลืม Password</router-link></p>
    <p class="error">{{ error }}</p>
  </div>
</template>
<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../api';
const router=useRouter(), username=ref(''), password=ref(''), error=ref('');
async function login(){
  try {
    const {data}=await api.post('/auth/login',{username:username.value,password:password.value});
    localStorage.setItem('token',data.token); localStorage.setItem('user',JSON.stringify(data.user));
    router.push(data.user.type==='admin'?'/admin':'/');
    location.reload();
  } catch(e){ error.value=e.response?.data?.message||'เข้าสู่ระบบไม่สำเร็จ'; }
}
</script>
