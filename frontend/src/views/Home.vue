<template>
  <!-- ================= HERO ================= -->
  <section class="hero">
    <h1>ระบบยืมคืนทรัพย์สินบริษัท</h1>

    <p>
      ค้นหาทรัพย์สิน ตรวจสอบสถานะ
      และส่งคำขอยืมได้จากหน้าเดียว
    </p>

    <p v-if="user" class="login-user">
      เข้าสู่ระบบเป็น:
      <b>{{ user.name }}</b>
    </p>
  </section>


  <!-- ================= SEARCH ================= -->
  <div class="card search-card">

    <label>
      ค้นหาทรัพย์สิน
    </label>

    <input
      v-model="q"
      @input="load"
      placeholder="ชื่อทรัพย์สิน / Serial / ประเภท"
    />

  </div>


  <!-- ================= ASSET LIST ================= -->
  <div class="grid">

    <AssetCard
      v-for="asset in assets"
      :key="asset.AssetID"
      :asset="asset"
      :is-member="user?.type === 'employee'"
      @borrow="openBorrow"
    />

  </div>


  <!-- ================= BORROW FORM ================= -->
  <div
    v-if="selected"
    class="card borrow-card"
  >

    <h2>
      ขอยืม: {{ selected.AssetName }}
    </h2>

    <label>
      กำหนดคืน
    </label>

    <input
      type="date"
      v-model="dueDate"
    />

    <div class="borrow-buttons">

      <button
        class="primary-button"
        @click="borrow"
      >
        ส่งคำขอยืม
      </button>

      <button
        class="secondary"
        @click="selected = null"
      >
        ยกเลิก
      </button>

    </div>


    <!-- Success -->
    <p
      class="success"
      v-if="message"
    >
      {{ message }}
    </p>


    <!-- Error -->
    <p
      class="error"
      v-if="error"
    >
      {{ error }}
    </p>

  </div>


  <!-- ================= CONTACT ================= -->
  <div class="card contact-card">

    <h2>
      ติดต่อเรา
    </h2>

    <p class="contact-description">
      ผู้จัดทำระบบยืมคืนทรัพย์สินบริษัท
    </p>


    <!-- Student 1 -->
    <div class="student">

      <h3>
        นางสาว ตติยา ถุนนอก
      </h3>

      <p>
        รหัสนักศึกษา:
        <b>116710906067-9</b>
      </p>

    </div>


    <!-- Student 2 -->
    <div class="student">

      <h3>
        บุญสิตา วงค์เหิม
      </h3>

      <p>
        รหัสนักศึกษา:
        <b>116710906014-1</b>
      </p>

    </div>

  </div>

</template>


<script setup>

import { ref, onMounted } from 'vue'

import api from '../api'

import AssetCard from '../components/AssetCard.vue'


// ==================================================
// DATA
// ==================================================

const assets = ref([])

const q = ref('')

const selected = ref(null)

const dueDate = ref('')

const message = ref('')

const error = ref('')


// ==================================================
// USER
// ==================================================

const user = JSON.parse(
  localStorage.getItem('user') || 'null'
)


// ==================================================
// LOAD ASSETS
// ==================================================

async function load() {

  try {

    const response = await api.get(
      '/assets',
      {
        params: {
          q: q.value
        }
      }
    )

    assets.value =
      response.data?.data ??
      response.data ??
      []

  } catch (e) {

    console.error(
      'Load assets error:',
      e
    )

    error.value =
      e.response?.data?.message ||
      'ไม่สามารถโหลดรายการทรัพย์สินได้'

  }

}


// ==================================================
// OPEN BORROW
// ==================================================

function openBorrow(asset) {

  // ถ้ายังไม่ได้ Login
  if (!user) {

    location.href = '/login'

    return

  }


  // ตรวจสอบว่าเป็นพนักงาน
  if (user.type !== 'employee') {

    alert(
      'เฉพาะพนักงานเท่านั้นที่สามารถขอยืมทรัพย์สินได้'
    )

    return

  }


  selected.value = asset

  message.value = ''

  error.value = ''

  dueDate.value = ''

}


// ==================================================
// BORROW
// ==================================================

async function borrow() {

  try {

    // ตรวจสอบว่ามีวันคืนหรือไม่
    if (!dueDate.value) {

      error.value =
        'กรุณาเลือกกำหนดคืน'

      return

    }


    // ตรวจสอบว่ามีทรัพย์สินที่เลือกหรือไม่
    if (!selected.value) {

      error.value =
        'กรุณาเลือกทรัพย์สิน'

      return

    }


    // ส่งคำขอยืม
    await api.post(
      '/borrow',
      {
        assetId:
          selected.value.AssetID,

        dueDate:
          dueDate.value
      }
    )


    // แสดงข้อความสำเร็จ
    message.value =
      'ส่งคำขอยืมแล้ว รอ Admin อนุมัติ'


    // ปิดฟอร์ม
    selected.value = null

    dueDate.value = ''


    // โหลดข้อมูลใหม่
    await load()


  } catch (e) {

    console.error(
      'Borrow error:',
      e
    )


    error.value =
      e.response?.data?.message ||
      'เกิดข้อผิดพลาดในการส่งคำขอยืม'

  }

}


// ==================================================
// ON MOUNT
// ==================================================

onMounted(() => {

  load()

})

</script>


<style scoped>

/* ==================================================
   GENERAL
================================================== */

.card {
  background: #ffffff;

  border-radius: 16px;

  padding: 25px;

  margin-bottom: 20px;

  box-shadow:
    0 4px 15px
    rgba(0, 0, 0, 0.06);
}


/* ==================================================
   HERO
================================================== */

.hero {
  text-align: center;

  padding: 45px 20px 30px;
}

.hero h1 {
  margin: 0 0 12px;

  font-size: 32px;

  font-weight: 700;
}

.hero p {
  margin: 8px 0;

  color: #6b7280;

  font-size: 16px;
}

.hero .login-user {
  margin-top: 15px;

  color: #2563eb;
}


/* ==================================================
   SEARCH
================================================== */

.search-card {
  margin-bottom: 25px;
}

.search-card label {
  display: block;

  margin-bottom: 8px;

  font-weight: 600;

  font-size: 16px;
}

.search-card input {
  width: 100%;

  padding: 13px 15px;

  border: 1px solid #d1d5db;

  border-radius: 10px;

  font-size: 15px;

  outline: none;

  box-sizing: border-box;
}

.search-card input:focus {
  border-color: #2563eb;

  box-shadow:
    0 0 0 3px
    rgba(37, 99, 235, 0.1);
}


/* ==================================================
   ASSET GRID
================================================== */

.grid {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 20px;

  margin-bottom: 25px;
}


/* ==================================================
   BORROW FORM
================================================== */

.borrow-card h2 {
  margin-top: 0;

  margin-bottom: 20px;
}

.borrow-card label {
  display: block;

  margin-bottom: 8px;

  font-weight: 600;
}

.borrow-card input[type="date"] {
  width: 100%;

  padding: 12px;

  border: 1px solid #d1d5db;

  border-radius: 10px;

  font-size: 15px;

  box-sizing: border-box;
}

.borrow-buttons {
  display: flex;

  gap: 10px;

  margin-top: 15px;
}


/* ==================================================
   BUTTONS
================================================== */

.primary-button {
  background: #111827;

  color: white;

  border: none;

  border-radius: 9px;

  padding: 11px 18px;

  cursor: pointer;

  font-weight: 600;
}

.primary-button:hover {
  background: #1f2937;
}

.secondary {
  background: #e5e7eb;

  color: #374151;

  border: none;

  border-radius: 9px;

  padding: 11px 18px;

  cursor: pointer;
}

.secondary:hover {
  background: #d1d5db;
}


/* ==================================================
   MESSAGE
================================================== */

.success {
  margin-top: 15px;

  padding: 12px 15px;

  border-radius: 9px;

  background: #dcfce7;

  color: #15803d;

  font-weight: 600;
}

.error {
  margin-top: 15px;

  padding: 12px 15px;

  border-radius: 9px;

  background: #fee2e2;

  color: #dc2626;

  font-weight: 600;
}


/* ==================================================
   CONTACT
================================================== */

.contact-card {
  margin-top: 30px;

  margin-bottom: 30px;
}

.contact-card h2 {
  margin-top: 0;

  margin-bottom: 10px;

  font-size: 27px;
}

.contact-description {
  color: #6b7280;

  margin-bottom: 20px;
}


/* ==================================================
   STUDENT
================================================== */

.student {
  background: #f9fafb;

  border: 1px solid #e5e7eb;

  border-radius: 12px;

  padding: 18px 20px;

  margin-bottom: 12px;
}

.student:last-child {
  margin-bottom: 0;
}

.student h3 {
  margin: 0 0 8px;

  font-size: 18px;

  color: #111827;
}

.student p {
  margin: 0;

  color: #6b7280;
}

.student b {
  color: #111827;
}


/* ==================================================
   RESPONSIVE
================================================== */

@media (max-width: 900px) {

  .grid {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }

}

@media (max-width: 600px) {

  .hero {
    padding-top: 30px;
  }

  .hero h1 {
    font-size: 25px;
  }

  .grid {
    grid-template-columns: 1fr;
  }

  .borrow-buttons {
    flex-direction: column;
  }

  .primary-button,
  .secondary {
    width: 100%;
  }

}

</style>