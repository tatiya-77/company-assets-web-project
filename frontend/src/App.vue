
<template>
  <header class="nav">
    <div class="brand" @click="goHome">
      🏢 Company Assets
    </div>

    <nav>
      <router-link to="/">ทรัพย์สิน</router-link>

      <router-link
        v-if="user?.type === 'employee'"
        to="/my-borrow"
      >
        รายการยืมของฉัน
      </router-link>

      <router-link
        v-if="user?.type === 'admin'"
        to="/admin"
      >
        Admin
      </router-link>

      <router-link v-if="!user" to="/login">
        Login
      </router-link>

      <router-link v-if="!user" to="/register">
        สมัครสมาชิก
      </router-link>

      <button
        v-if="user"
        class="link-btn"
        type="button"
        @click="logout"
      >
        ออกจากระบบ
      </button>
    </nav>
  </header>

  <main class="container">
    <router-view />
  </main>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

const user = ref(null);

function loadUser() {
  try {
    user.value = JSON.parse(
      localStorage.getItem('user') || 'null'
    );
  } catch {
    user.value = null;
  }
}

function goHome() {
  router.push('/');
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  loadUser();

  router.replace('/login');
}

// โหลดข้อมูลผู้ใช้เมื่อเปิดแอป
onMounted(() => {
  loadUser();

  // รองรับกรณี localStorage เปลี่ยนจากแท็บอื่น
  window.addEventListener('storage', loadUser);
});

// ถอด Event Listener เมื่อออกจากหน้า
onBeforeUnmount(() => {
  window.removeEventListener('storage', loadUser);
});

// ให้แถบเมนูอัปเดตหลังเปลี่ยนเส้นทาง
router.afterEach(() => {
  loadUser();
});
</script>
