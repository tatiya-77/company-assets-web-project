<template>
  <div class="my-borrow-page">

    <!-- =====================================================
         HEADER
    ====================================================== -->

    <div class="header">

      <div>
        <h1>รายการยืมของฉัน</h1>

        <p>
          ตรวจสอบสถานะการยืมและการคืนทรัพย์สิน
        </p>
      </div>

      <button
        class="refresh-btn"
        @click="loadAll"
        :disabled="loading"
      >
        {{ loading ? 'กำลังโหลด...' : 'รีเฟรช' }}
      </button>

    </div>


    <!-- =====================================================
         ERROR
    ====================================================== -->

    <div
      v-if="error"
      class="error"
    >
      {{ error }}
    </div>


    <!-- =====================================================
         NOTIFICATIONS
    ====================================================== -->

    <div class="notification-section">

      <div class="notification-title">

        <div>
          <h2>🔔 การแจ้งเตือน</h2>

          <p>
            ข่าวสารเกี่ยวกับรายการยืมและการคืนทรัพย์สิน
          </p>
        </div>

        <span
          v-if="unreadCount > 0"
          class="unread-count"
        >
          {{ unreadCount }} รายการใหม่
        </span>

      </div>


      <!-- ไม่มีการแจ้งเตือน -->

      <div
        v-if="notifications.length === 0"
        class="notification-empty"
      >
        ยังไม่มีการแจ้งเตือน
      </div>


      <!-- รายการแจ้งเตือน -->

      <div
        v-else
        class="notification-list"
      >

        <div
          v-for="notification in notifications"
          :key="notification.NotificationID"
          class="notification-card"
          :class="{
            unread: notification.Status !== 'Read'
          }"
        >

          <div class="notification-icon">
            {{ notification.Status === 'Read' ? '📨' : '🔔' }}
          </div>


          <div class="notification-content">

            <p>
              {{ notification.Message }}
            </p>

            <small>
              {{ formatDateTime(notification.CreatedAt || notification.CreatedDate) }}
            </small>

          </div>


          <button
            v-if="notification.Status !== 'Read'"
            class="read-btn"
            @click="markAsRead(notification.NotificationID)"
          >
            อ่านแล้ว
          </button>

        </div>

      </div>

    </div>


    <!-- =====================================================
         LOADING
    ====================================================== -->

    <div
      v-if="loading"
      class="loading"
    >
      กำลังโหลดข้อมูล...
    </div>


    <!-- =====================================================
         EMPTY BORROW
    ====================================================== -->

    <div
      v-else-if="rows.length === 0"
      class="card empty"
    >

      <h3>
        ยังไม่มีรายการยืม
      </h3>

      <p>
        เมื่อคุณส่งคำขอยืม รายการจะแสดงที่หน้านี้
      </p>

    </div>


    <!-- =====================================================
         BORROW LIST
    ====================================================== -->

    <div
      v-else
      class="borrow-list"
    >

      <div
        v-for="item in rows"
        :key="item.TransactionID"
        class="card borrow-card"
      >

        <!-- =================================================
             TITLE
        ================================================== -->

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


        <!-- =================================================
             DETAILS
        ================================================== -->

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
            <strong>วันที่ขอคืน</strong>

            <span>
              {{ formatDate(item.ReturnRequestedDate) }}
            </span>
          </div>


          <div>
            <strong>วันที่รับคืน</strong>

            <span>
              {{ formatDate(item.ReturnDate) }}
            </span>
          </div>

        </div>


        <!-- =================================================
             PENDING BORROW
        ================================================== -->

        <div
          v-if="item.Status === 'PendingApproval'"
          class="info pending"
        >
          ⏳ รอ Admin อนุมัติคำขอยืม
        </div>


        <!-- =================================================
             BORROWED
        ================================================== -->

        <div
          v-else-if="item.Status === 'Borrowed'"
          class="return-box"
        >

          <div class="info borrowed">

            📦 กำลังยืมทรัพย์สิน

          </div>


          <button
            class="return-btn"
            :disabled="returningId === item.TransactionID"
            @click="requestReturn(item)"
          >

            {{
              returningId === item.TransactionID
                ? 'กำลังส่งคำขอ...'
                : '🔄 ขอคืนทรัพย์สิน'
            }}

          </button>

        </div>


        <!-- =================================================
             RETURN REQUESTED
        ================================================== -->

        <div
          v-else-if="item.Status === 'ReturnRequested'"
          class="info return-requested"
        >

          ⏳
          <strong>รอ Admin อนุมัติการคืน</strong>

          <p>
            ระบบได้รับคำขอคืนทรัพย์สินแล้ว
            กรุณารอเจ้าหน้าที่ตรวจสอบและอนุมัติ
          </p>

        </div>


        <!-- =================================================
             RETURNED
        ================================================== -->

        <div
          v-else-if="item.Status === 'Returned'"
          class="info returned"
        >

          <div class="returned-title">
            ✓ รับการคืนทรัพย์สินแล้ว
          </div>

          <p>
            ทรัพย์สินถูกคืนและเจ้าหน้าที่อนุมัติเรียบร้อยแล้ว
          </p>

          <div class="return-detail">

            <div>
              <strong>ทรัพย์สิน</strong>
              <span>
                {{ item.AssetName }}
              </span>
            </div>

            <div>
              <strong>Serial</strong>
              <span>
                {{ item.SerialNumber || '-' }}
              </span>
            </div>

            <div>
              <strong>วันที่รับคืน</strong>
              <span>
                {{ formatDate(item.ReturnDate) }}
              </span>
            </div>

            <div v-if="item.AdminName">
              <strong>ผู้อนุมัติ</strong>
              <span>
                {{ item.AdminName }}
              </span>
            </div>

          </div>

        </div>


        <!-- =================================================
             REJECTED
        ================================================== -->

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
  computed,
  onMounted
} from 'vue';

import api from '../api';


/* =========================================================
   DATA
========================================================= */

const rows = ref([]);

const notifications = ref([]);

const loading = ref(false);

const error = ref('');

const returningId = ref(null);


/* =========================================================
   UNREAD COUNT
========================================================= */

const unreadCount = computed(() => {

  return notifications.value.filter(
    item => item.Status !== 'Read'
  ).length;

});


/* =========================================================
   LOAD BORROW
========================================================= */

async function loadBorrow() {

  const response = await api.get(
    '/borrow/my'
  );

  rows.value =
    response.data?.data ??
    response.data ??
    [];

}


/* =========================================================
   LOAD NOTIFICATIONS
========================================================= */

async function loadNotifications() {

  const response = await api.get(
    '/notifications/my'
  );

  notifications.value =
    response.data?.data ??
    response.data ??
    [];

}


/* =========================================================
   LOAD ALL
========================================================= */

async function loadAll() {

  try {

    loading.value = true;

    error.value = '';

    await Promise.all([
      loadBorrow(),
      loadNotifications()
    ]);

  } catch (e) {

    console.error(e);

    error.value =
      e.response?.data?.message ||
      'ไม่สามารถโหลดข้อมูลได้';

  } finally {

    loading.value = false;

  }

}


/* =========================================================
   REQUEST RETURN
========================================================= */

async function requestReturn(item) {

  if (!item?.TransactionID) {
    return;
  }


  const confirmed = window.confirm(
    `ต้องการขอคืน "${item.AssetName}" ใช่หรือไม่?`
  );


  if (!confirmed) {
    return;
  }


  try {

    returningId.value =
      item.TransactionID;

    error.value = '';


    await api.put(
      `/borrow/${item.TransactionID}/request-return`
    );


    alert(
      'ส่งคำขอคืนทรัพย์สินเรียบร้อยแล้ว\nกรุณารอ Admin อนุมัติ'
    );


    await loadAll();

  } catch (e) {

    console.error(e);

    alert(
      e.response?.data?.message ||
      'ไม่สามารถส่งคำขอคืนทรัพย์สินได้'
    );

  } finally {

    returningId.value = null;

  }

}


/* =========================================================
   MARK NOTIFICATION AS READ
========================================================= */

async function markAsRead(notificationId) {

  try {

    await api.put(
      `/notifications/${notificationId}/read`
    );


    const item =
      notifications.value.find(
        x =>
          x.NotificationID === notificationId
      );


    if (item) {
      item.Status = 'Read';
    }

  } catch (e) {

    console.error(e);

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

    ReturnRequested:
      'รออนุมัติการคืน',

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
   FORMAT DATE + TIME
========================================================= */

function formatDateTime(value) {

  if (!value) {
    return '';
  }


  const date = new Date(value);


  if (Number.isNaN(date.getTime())) {
    return value;
  }


  return date.toLocaleString(
    'th-TH',
    {
      dateStyle: 'short',
      timeStyle: 'short'
    }
  );

}


/* =========================================================
   LOAD WHEN PAGE OPENS
========================================================= */

onMounted(() => {

  loadAll();

});

</script>


<style scoped>

/* =========================================================
   PAGE
========================================================= */

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


.refresh-btn:disabled {

  opacity: 0.6;

  cursor: not-allowed;

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
   NOTIFICATION
========================================================= */

.notification-section {

  margin-bottom: 25px;

}


.notification-title {

  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 12px;

}


.notification-title h2 {

  margin: 0;

  font-size: 20px;

}


.notification-title p {

  margin: 5px 0 0;

  opacity: 0.65;

  font-size: 14px;

}


.unread-count {

  background: #ef4444;

  color: white;

  padding: 6px 12px;

  border-radius: 20px;

  font-size: 13px;

  font-weight: 600;

}


.notification-list {

  display: flex;

  flex-direction: column;

  gap: 10px;

}


.notification-card {

  display: flex;

  align-items: center;

  gap: 12px;

  background: white;

  border-radius: 10px;

  padding: 14px;

  box-shadow:
    0 2px 8px
    rgba(0, 0, 0, 0.06);

}


.notification-card.unread {

  border-left: 4px solid #2563eb;

  background: #f5f8ff;

}


.notification-icon {

  font-size: 22px;

}


.notification-content {

  flex: 1;

}


.notification-content p {

  margin: 0;

  line-height: 1.5;

}


.notification-content small {

  display: block;

  margin-top: 5px;

  opacity: 0.55;

}


.read-btn {

  border: none;

  background: #e8f0ff;

  color: #2563eb;

  padding: 7px 12px;

  border-radius: 7px;

  cursor: pointer;

}


.read-btn:hover {

  background: #dbe7ff;

}


.notification-empty {

  background: white;

  border-radius: 10px;

  padding: 18px;

  text-align: center;

  opacity: 0.6;

  box-shadow:
    0 2px 8px
    rgba(0, 0, 0, 0.05);

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
    repeat(4, 1fr);

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


.badge.ReturnRequested {

  background: #fff4d6;

  color: #8a5b00;

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
   INFO
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


/* =========================================================
   RETURN REQUESTED
========================================================= */

.info.return-requested {

  background: #fff8e5;

  color: #8a5b00;

}


.info.return-requested p {

  margin: 7px 0 0;

  font-size: 14px;

}


/* =========================================================
   RETURNED
========================================================= */

.info.returned {

  background: #eaf8ef;

  color: #18733a;

}


.returned-title {

  font-weight: 700;

  font-size: 16px;

}


.info.returned p {

  margin: 7px 0 15px;

}


.return-detail {

  display: grid;

  grid-template-columns:
    repeat(2, 1fr);

  gap: 10px;

  border-top: 1px solid rgba(0, 0, 0, 0.08);

  padding-top: 12px;

}


.return-detail div {

  display: flex;

  flex-direction: column;

  gap: 3px;

}


.return-detail strong {

  font-size: 12px;

  opacity: 0.65;

}


.return-detail span {

  font-size: 14px;

}


/* =========================================================
   RETURN BUTTON
========================================================= */

.return-box {

  margin-top: 20px;

}


.return-box .info {

  margin-top: 0;

}


.return-btn {

  width: 100%;

  margin-top: 12px;

  border: none;

  background: #2563eb;

  color: white;

  padding: 13px 18px;

  border-radius: 8px;

  font-size: 15px;

  font-weight: 600;

  cursor: pointer;

}


.return-btn:hover {

  background: #1d4ed8;

}


.return-btn:disabled {

  opacity: 0.6;

  cursor: not-allowed;

}


/* =========================================================
   REJECTED
========================================================= */

.info.rejected {

  background: #fdeeee;

  color: #b00020;

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
   LOADING
========================================================= */

.loading {

  text-align: center;

  padding: 40px;

  opacity: 0.7;

}


/* =========================================================
   EMPTY
========================================================= */

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


  .notification-card {

    align-items: flex-start;

  }


  .read-btn {

    align-self: center;

  }


  .return-detail {

    grid-template-columns: 1fr;

  }

}

</style>