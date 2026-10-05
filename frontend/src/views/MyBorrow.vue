<template>
  <div class="my-borrow-page">

    <div class="header">
      <div>
        <h1>รายการยืมของฉัน</h1>
        <p>ตรวจสอบสถานะการยืมและการคืนทรัพย์สิน</p>
      </div>

      <button
        class="refresh-btn"
        @click="load"
      >
        รีเฟรช
      </button>
    </div>


    <!-- Error -->

    <div
      v-if="error"
      class="error"
    >
      {{ error }}
    </div>


    <!-- Loading -->

    <div
      v-if="loading"
      class="loading"
    >
      กำลังโหลดข้อมูล...
    </div>


    <!-- Empty -->

    <div
      v-else-if="rows.length === 0"
      class="card empty"
    >
      <h3>ยังไม่มีรายการยืม</h3>
      <p>เมื่อคุณส่งคำขอยืม รายการจะแสดงที่หน้านี้</p>
    </div>


    <!-- Borrow List -->

    <div
      v-else
      class="borrow-list"
    >

      <div
        class="card borrow-card"
        v-for="item in rows"
        :key="item.TransactionID"
      >

        <div class="borrow-header">

          <div>

            <h3>
              {{ item.AssetName }}
            </h3>

            <p class="serial">
              Serial:
              {{ item.SerialNumber || '-' }}
            </p>

          </div>

          <span
            class="badge"
            :class="item.Status"
          >
            {{ statusText(item.Status) }}
          </span>

        </div>


        <div class="details">

          <div>
            <strong>วันที่ยืม</strong>
            <span>
              {{ formatDate(item.BorrowDate) }}
            </span>
          </div>


          <div>
            <strong>กำหนดคืน</strong>
            <span>
              {{ formatDate(item.DueDate) }}
            </span>
          </div>


          <div>
            <strong>วันที่คืน</strong>
            <span>
              {{ formatDate(item.ReturnDate) }}
            </span>
          </div>

        </div>


        <!-- Status message -->

        <div
          v-if="item.Status === 'PendingApproval'"
          class="info pending"
        >
          ⏳ รอ Admin อนุมัติคำขอยืม
        </div>


        <div
          v-else-if="item.Status === 'Borrowed'"
          class="info borrowed"
        >
          📦 กำลังยืมทรัพย์สิน
        </div>


        <div
          v-else-if="item.Status === 'Returned'"
          class="info returned"
        >
          ✓ คืนทรัพย์สินเรียบร้อยแล้ว
        </div>


        <div
          v-else-if="item.Status === 'Rejected'"
          class="info rejected"
        >
          ✕ คำขอยืมถูกปฏิเสธ
        </div>

      </div>

    </div>

  </div>
</template>


<script setup>

import {
  ref,
  onMounted
} from 'vue';

import api from '../api';


/* =========================================================
   DATA
========================================================= */

const rows = ref([]);

const loading = ref(false);

const error = ref('');


/* =========================================================
   LOAD BORROW DATA
========================================================= */

async function load() {

  try {

    loading.value = true;

    error.value = '';

    const response = await api.get(
      '/borrow/my'
    );

    /*
      borrow.js ตอนนี้ส่งกลับ:

      {
        success: true,
        data: [...]
      }

      รองรับ API แบบเก่าด้วย
    */

    rows.value =
      response.data?.data ??
      response.data ??
      [];

  } catch (e) {

    console.error(e);

    error.value =
      e.response?.data?.message ||
      'ไม่สามารถโหลดรายการยืมได้';

  } finally {

    loading.value = false;

  }

}


/* =========================================================
   STATUS TEXT
========================================================= */

function statusText(status) {

  const map = {

    PendingApproval:
      'รออนุมัติ',

    Borrowed:
      'กำลังยืม',

    Returned:
      'คืนแล้ว',

    Rejected:
      'ปฏิเสธ'

  };

  return map[status] || status;

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatDate(value) {

  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    'th-TH'
  );

}


/* =========================================================
   LOAD WHEN PAGE OPENS
========================================================= */

onMounted(() => {

  load();

});

</script>


<style scoped>

.my-borrow-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 30px;
}


/* =========================================================
   HEADER
========================================================= */

.header {
  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 25px;
}

.header h1 {
  margin: 0;
}

.header p {
  margin-top: 5px;

  opacity: 0.7;
}


/* =========================================================
   REFRESH
========================================================= */

.refresh-btn {
  border: none;

  background: #2563eb;

  color: white;

  padding: 10px 18px;

  border-radius: 8px;

  cursor: pointer;
}

.refresh-btn:hover {
  opacity: 0.9;
}


/* =========================================================
   CARD
========================================================= */

.card {
  background: white;

  border-radius: 12px;

  padding: 20px;

  margin-bottom: 15px;

  box-shadow:
    0 2px 10px
    rgba(0, 0, 0, 0.08);
}


/* =========================================================
   BORROW HEADER
========================================================= */

.borrow-header {
  display: flex;

  justify-content: space-between;

  align-items: flex-start;

  gap: 15px;
}

.borrow-header h3 {
  margin: 0 0 5px;
}

.serial {
  margin: 0;

  font-size: 13px;

  opacity: 0.6;
}


/* =========================================================
   DETAILS
========================================================= */

.details {
  display: grid;

  grid-template-columns:
    repeat(3, 1fr);

  gap: 15px;

  margin-top: 20px;

  padding-top: 15px;

  border-top: 1px solid #eee;
}

.details div {
  display: flex;

  flex-direction: column;

  gap: 5px;
}

.details strong {
  font-size: 13px;

  opacity: 0.6;
}

.details span {
  font-size: 15px;
}


/* =========================================================
   BADGE
========================================================= */

.badge {
  display: inline-block;

  padding: 6px 12px;

  border-radius: 20px;

  font-size: 13px;

  font-weight: 600;

  white-space: nowrap;
}

.badge.PendingApproval {
  background: #fff4d6;

  color: #8a5b00;
}

.badge.Borrowed {
  background: #e8f0ff;

  color: #1d4ed8;
}

.badge.Returned {
  background: #e8f7ed;

  color: #18733a;
}

.badge.Rejected {
  background: #fdeaea;

  color: #b00020;
}


/* =========================================================
   STATUS INFO
========================================================= */

.info {
  margin-top: 20px;

  padding: 12px;

  border-radius: 8px;
}

.info.pending {
  background: #fff8e5;
}

.info.borrowed {
  background: #eef4ff;
}

.info.returned {
  background: #eaf8ef;
}

.info.rejected {
  background: #fdeeee;
}


/* =========================================================
   ERROR
========================================================= */

.error {
  background: #fdeaea;

  color: #b00020;

  padding: 12px 15px;

  border-radius: 8px;

  margin-bottom: 15px;
}


/* =========================================================
   LOADING / EMPTY
========================================================= */

.loading {
  text-align: center;

  padding: 40px;

  opacity: 0.7;
}

.empty {
  text-align: center;

  padding: 40px;
}

.empty p {
  opacity: 0.6;
}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 700px) {

  .my-borrow-page {
    padding: 15px;
  }

  .header {
    flex-direction: column;

    align-items: flex-start;

    gap: 15px;
  }

  .details {
    grid-template-columns: 1fr;
  }

  .borrow-header {
    flex-direction: column;
  }

}

</style>