<template>
  <header class="nav">
    <div class="brand" @click="$router.push('/')">🏢 Company Assets</div>
    <nav>
      <router-link to="/">ทรัพย์สิน</router-link>
      <router-link v-if="user?.type==='employee'" to="/my-borrow">รายการยืมของฉัน</router-link>
      <router-link v-if="user?.type==='admin'" to="/admin">Admin</router-link>
      <router-link v-if="!user" to="/login">Login</router-link>
      <router-link v-if="!user" to="/register">สมัครสมาชิก</router-link>
      <button v-if="user" class="link-btn" @click="logout">ออกจากระบบ</button>
    </nav>
  </header>
  <main class="container">
    <router-view />
  </main>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();
const user = computed(() => JSON.parse(localStorage.getItem('user') || 'null'));

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
  location.reload();
}
</script>
