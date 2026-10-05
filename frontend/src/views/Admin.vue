<template>
  <div class="admin-page">

    <!-- =====================================================
         HEADER
    ====================================================== -->

    <div class="header">
      <div>
        <h1>Admin System</h1>
        <p>ระบบจัดการทรัพย์สินและการยืมคืน</p>
      </div>

      <button class="logout-btn" @click="logout">
        ออกจากระบบ
      </button>
    </div>


    <!-- =====================================================
         ERROR / SUCCESS
    ====================================================== -->

    <div v-if="message" class="alert success">
      {{ message }}
    </div>

    <div v-if="error" class="alert error">
      {{ error }}
    </div>


    <!-- =====================================================
         DASHBOARD
    ====================================================== -->

    <div class="grid">

      <div class="card stat-card">
        <span>ทรัพย์สินทั้งหมด</span>
        <h2>{{ stats.assets }}</h2>
      </div>

      <div class="card stat-card">
        <span>พร้อมให้ยืม</span>
        <h2>{{ stats.available }}</h2>
      </div>

      <div class="card stat-card">
        <span>กำลังถูกยืม</span>
        <h2>{{ stats.borrowed }}</h2>
      </div>

      <div class="card stat-card pending">
        <span>รออนุมัติ</span>
        <h2>{{ stats.pending }}</h2>
      </div>

      <div class="card stat-card returned">
        <span>คืนแล้ว</span>
        <h2>{{ stats.returned }}</h2>
      </div>

      <div class="card stat-card">
        <span>สมาชิกทั้งหมด</span>
        <h2>{{ stats.employees }}</h2>
      </div>

    </div>


    <!-- =====================================================
         ASSET MANAGEMENT
    ====================================================== -->

    <div class="card">

      <div class="section-header">
        <div>
          <h2>จัดการทรัพย์สิน</h2>
          <p>เพิ่ม แก้ไข ลบ และค้นหาทรัพย์สิน</p>
        </div>
      </div>

      <input
        v-model="q"
        @input="loadAssets"
        class="search"
        placeholder="ค้นหาชื่อทรัพย์สิน / Serial Number..."
      />

      <div class="table-wrapper">

        <table>

          <thead>
            <tr>
              <th>ID</th>
              <th>ชื่อทรัพย์สิน</th>
              <th>ประเภท</th>
              <th>สถานะ</th>
              <th>Serial</th>
              <th>สถานที่</th>
              <th>จัดการ</th>
            </tr>
          </thead>

          <tbody>

            <tr
              v-for="asset in assets"
              :key="asset.AssetID"
            >

              <td>
                {{ asset.AssetID }}
              </td>

              <td>
                {{ asset.AssetName }}
              </td>

              <td>
                {{ asset.CategoryName || '-' }}
              </td>

              <td>

                <span
                  class="status"
                  :class="asset.Status"
                >
                  {{ asset.Status }}
                </span>

              </td>

              <td>
                {{ asset.SerialNumber || '-' }}
              </td>

              <td>
                {{ asset.Location || '-' }}
              </td>

              <td>

                <button
                  class="small-btn"
                  @click="edit(asset)"
                >
                  แก้ไข
                </button>

                <button
                  class="small-btn danger"
                  @click="remove(asset.AssetID)"
                >
                  ลบ
                </button>

              </td>

            </tr>

            <tr v-if="assets.length === 0">

              <td
                colspan="7"
                class="empty"
              >
                ไม่พบข้อมูลทรัพย์สิน
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>


    <!-- =====================================================
         ASSET FORM
    ====================================================== -->

    <div class="card">

      <h2>
        {{ form.AssetID ? 'แก้ไขทรัพย์สิน' : 'เพิ่มทรัพย์สิน' }}
      </h2>

      <div class="form-grid">

        <div class="form-group">

          <label>
            ชื่อทรัพย์สิน
          </label>

          <input
            v-model="form.AssetName"
            placeholder="เช่น Notebook Dell"
          />

        </div>


        <div class="form-group">

          <label>
            ประเภท
          </label>

          <select v-model="form.CategoryID">

            <option
              disabled
              value=""
            >
              -- เลือกประเภท --
            </option>

            <option
              v-for="category in categories"
              :key="category.CategoryID"
              :value="category.CategoryID"
            >
              {{ category.CategoryName }}
            </option>

          </select>

        </div>


        <div class="form-group">

          <label>
            สถานะ
          </label>

          <select
            v-model="form.Status"
            :disabled="form.Status === 'Borrowed'"
          >

            <option value="Available">
              Available
            </option>

            <option value="Borrowed">
              Borrowed
            </option>

            <option value="Broken">
              Broken
            </option>

          </select>

        </div>


        <div class="form-group">

          <label>
            วันที่ซื้อ
          </label>

          <input
            v-model="form.PurchaseDate"
            type="date"
          />

        </div>


        <div class="form-group">

          <label>
            ราคา
          </label>

          <input
            v-model="form.Price"
            type="number"
            min="0"
            placeholder="ราคา"
          />

        </div>


        <div class="form-group">

          <label>
            Serial Number
          </label>

          <input
            v-model="form.SerialNumber"
            placeholder="Serial Number"
          />

        </div>


        <div class="form-group">

          <label>
            สถานที่เก็บ
          </label>

          <input
            v-model="form.Location"
            placeholder="เช่น ห้อง IT"
          />

        </div>

      </div>


      <div class="form-actions">

        <button
          class="primary"
          @click="save"
        >
          {{ form.AssetID ? 'Update' : 'Insert' }}
        </button>

        <button
          class="secondary"
          @click="clear"
        >
          Clear
        </button>

      </div>

    </div>


    <!-- =====================================================
         BORROW MANAGEMENT
    ====================================================== -->

    <div class="card">

      <div class="section-header">

        <div>
          <h2>
            รายการยืม / คืนทรัพย์สิน
          </h2>

          <p>
            Admin สามารถอนุมัติ ปฏิเสธ และรับคืนทรัพย์สิน
          </p>
        </div>

      </div>


      <div class="table-wrapper">

        <table>

          <thead>

            <tr>
              <th>ID</th>
              <th>สมาชิก</th>
              <th>Email</th>
              <th>ทรัพย์สิน</th>
              <th>วันที่ยืม</th>
              <th>กำหนดคืน</th>
              <th>วันที่คืน</th>
              <th>สถานะ</th>
              <th>Action</th>
            </tr>

          </thead>


          <tbody>

            <tr
              v-for="borrow in borrows"
              :key="borrow.TransactionID"
            >

              <td>
                {{ borrow.TransactionID }}
              </td>

              <td>
                {{ borrow.EmployeeName }}
              </td>

              <td>
                {{ borrow.EmployeeEmail || '-' }}
              </td>

              <td>
                {{ borrow.AssetName }}
              </td>

              <td>
                {{ formatDate(borrow.BorrowDate) }}
              </td>

              <td>
                {{ formatDate(borrow.DueDate) }}
              </td>

              <td>
                {{ formatDate(borrow.ReturnDate) }}
              </td>

              <td>

                <span
                  class="status"
                  :class="borrow.Status"
                >
                  {{ statusText(borrow.Status) }}
                </span>

              </td>

              <td>

                <!-- Pending -->
                <div
                  v-if="borrow.Status === 'PendingApproval'"
                  class="actions"
                >

                  <button
                    class="approve"
                    @click="approve(borrow.TransactionID)"
                  >
                    อนุมัติ
                  </button>

                  <button
                    class="reject"
                    @click="reject(borrow.TransactionID)"
                  >
                    ปฏิเสธ
                  </button>

                </div>


                <!-- Borrowed -->

                <button
                  v-else-if="borrow.Status === 'Borrowed'"
                  class="return-btn"
                  @click="returnAsset(borrow.TransactionID)"
                >
                  รับคืน
                </button>


                <!-- Returned -->

                <span
                  v-else-if="borrow.Status === 'Returned'"
                  class="done"
                >
                  คืนแล้ว
                </span>


                <!-- Rejected -->

                <span
                  v-else-if="borrow.Status === 'Rejected'"
                  class="rejected-text"
                >
                  ปฏิเสธแล้ว
                </span>

              </td>

            </tr>


            <tr v-if="borrows.length === 0">

              <td
                colspan="9"
                class="empty"
              >
                ไม่มีรายการยืม
              </td>

            </tr>

          </tbody>

        </table>

      </div>

    </div>

  </div>
</template>


<script setup>

import {
  ref,
  onMounted
} from 'vue';

import {
  useRouter
} from 'vue-router';

import api from '../api';


/* =========================================================
   ROUTER
========================================================= */

const router = useRouter();


/* =========================================================
   DATA
========================================================= */

const assets = ref([]);

const categories = ref([]);

const borrows = ref([]);

const q = ref('');

const message = ref('');

const error = ref('');


const stats = ref({
  assets: 0,
  available: 0,
  borrowed: 0,
  pending: 0,
  returned: 0,
  rejected: 0,
  employees: 0
});


/* =========================================================
   FORM
========================================================= */

const blank = () => ({
  AssetID: null,
  AssetName: '',
  CategoryID: '',
  Status: 'Available',
  PurchaseDate: '',
  Price: '',
  SerialNumber: '',
  Location: ''
});


const form = ref(blank());


/* =========================================================
   LOAD ASSETS
========================================================= */

async function loadAssets() {

  try {

    const response = await api.get(
      '/assets',
      {
        params: {
          q: q.value
        }
      }
    );

    /*
      รองรับทั้ง API แบบเก่า
      และ API แบบ { success, data }
    */

    assets.value =
      response.data?.data ??
      response.data ??
      [];

  } catch (e) {

    error.value =
      e.response?.data?.message ||
      'โหลดข้อมูลทรัพย์สินไม่สำเร็จ';

  }

}


/* =========================================================
   LOAD ALL DATA
========================================================= */

async function load() {

  try {

    error.value = '';

    const [
      assetsResponse,
      categoriesResponse,
      borrowResponse,
      statsResponse
    ] = await Promise.all([

      api.get(
        '/assets',
        {
          params: {
            q: q.value
          }
        }
      ),

      api.get('/assets/categories'),

      api.get('/borrow'),

      api.get('/admin/stats')

    ]);


    /* Assets */

    assets.value =
      assetsResponse.data?.data ??
      assetsResponse.data ??
      [];


    /* Categories */

    categories.value =
      categoriesResponse.data?.data ??
      categoriesResponse.data ??
      [];


    /* Borrow */

    borrows.value =
      borrowResponse.data?.data ??
      borrowResponse.data ??
      [];


    /* Stats */

    const statsData =
      statsResponse.data?.data ??
      statsResponse.data ??
      {};

    stats.value = {
      assets: Number(statsData.assets || 0),
      available: Number(statsData.available || 0),
      borrowed: Number(statsData.borrowed || 0),
      pending: Number(statsData.pending || 0),
      returned: Number(statsData.returned || 0),
      rejected: Number(statsData.rejected || 0),
      employees: Number(statsData.employees || 0)
    };

  } catch (e) {

    console.error(e);

    error.value =
      e.response?.data?.message ||
      'โหลดข้อมูล Admin ไม่สำเร็จ';

  }

}


/* =========================================================
   EDIT ASSET
========================================================= */

function edit(asset) {

  form.value = {
    AssetID: asset.AssetID,
    AssetName: asset.AssetName || '',
    CategoryID: asset.CategoryID || '',
    Status: asset.Status || 'Available',
    PurchaseDate: asset.PurchaseDate
      ? String(asset.PurchaseDate).substring(0, 10)
      : '',
    Price: asset.Price ?? '',
    SerialNumber: asset.SerialNumber || '',
    Location: asset.Location || ''
  };

  window.scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth'
  });

}


/* =========================================================
   CLEAR FORM
========================================================= */

function clear() {

  form.value = blank();

}


/* =========================================================
   SAVE ASSET
========================================================= */

async function save() {

  try {

    message.value = '';
    error.value = '';

    if (!form.value.AssetName) {

      error.value =
        'กรุณากรอกชื่อทรัพย์สิน';

      return;
    }

    if (!form.value.CategoryID) {

      error.value =
        'กรุณาเลือกประเภททรัพย์สิน';

      return;
    }


    if (form.value.AssetID) {

      await api.put(
        `/assets/${form.value.AssetID}`,
        form.value
      );

      message.value =
        'แก้ไขทรัพย์สินสำเร็จ';

    } else {

      await api.post(
        '/assets',
        form.value
      );

      message.value =
        'เพิ่มทรัพย์สินสำเร็จ';
    }


    clear();

    await load();

  } catch (e) {

    error.value =
      e.response?.data?.message ||
      'บันทึกทรัพย์สินไม่สำเร็จ';

  }

}


/* =========================================================
   DELETE ASSET
========================================================= */

async function remove(id) {

  if (
    !confirm(
      'ยืนยันการลบทรัพย์สินรายการนี้?'
    )
  ) {
    return;
  }


  try {

    message.value = '';
    error.value = '';

    await api.delete(
      `/assets/${id}`
    );

    message.value =
      'ลบทรัพย์สินสำเร็จ';

    await load();

  } catch (e) {

    error.value =
      e.response?.data?.message ||
      'ลบทรัพย์สินไม่สำเร็จ';

  }

}


/* =========================================================
   APPROVE BORROW
========================================================= */

async function approve(id) {

  if (
    !confirm(
      'ยืนยันอนุมัติการยืมทรัพย์สินรายการนี้?'
    )
  ) {
    return;
  }


  try {

    message.value = '';
    error.value = '';

    await api.put(
      `/borrow/${id}/approve`
    );

    message.value =
      'อนุมัติการยืมสำเร็จ';

    await load();

  } catch (e) {

    error.value =
      e.response?.data?.message ||
      'อนุมัติไม่สำเร็จ';

  }

}


/* =========================================================
   REJECT BORROW
========================================================= */

async function reject(id) {

  if (
    !confirm(
      'ยืนยันปฏิเสธคำขอยืมรายการนี้?'
    )
  ) {
    return;
  }


  try {

    message.value = '';
    error.value = '';

    await api.put(
      `/borrow/${id}/reject`
    );

    message.value =
      'ปฏิเสธการยืมสำเร็จ';

    await load();

  } catch (e) {

    error.value =
      e.response?.data?.message ||
      'ปฏิเสธไม่สำเร็จ';

  }

}


/* =========================================================
   RETURN ASSET
========================================================= */

async function returnAsset(id) {

  if (
    !confirm(
      'ยืนยันว่ารับคืนทรัพย์สินรายการนี้แล้ว?'
    )
  ) {
    return;
  }


  try {

    message.value = '';
    error.value = '';

    await api.put(
      `/borrow/${id}/return`
    );

    message.value =
      'รับคืนทรัพย์สินสำเร็จ';

    await load();

  } catch (e) {

    error.value =
      e.response?.data?.message ||
      'รับคืนทรัพย์สินไม่สำเร็จ';

  }

}


/* =========================================================
   STATUS TEXT
========================================================= */

function statusText(status) {

  const map = {

    PendingApproval: 'รออนุมัติ',

    Borrowed: 'กำลังยืม',

    Returned: 'คืนแล้ว',

    Rejected: 'ปฏิเสธ',

    Available: 'พร้อมให้ยืม',

    Broken: 'ชำรุด'

  };

  return map[status] || status;

}


/* =========================================================
   DATE
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
   LOGOUT
========================================================= */

function logout() {

  localStorage.removeItem('token');

  localStorage.removeItem('user');

  router.push('/login');

}


/* =========================================================
   START
========================================================= */

onMounted(() => {

  load();

});

</script>


<style scoped>

.admin-page {
  max-width: 1400px;
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

.logout-btn {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}


/* =========================================================
   GRID
========================================================= */

.grid {
  display: grid;
  grid-template-columns:
    repeat(auto-fit, minmax(180px, 1fr));

  gap: 15px;

  margin-bottom: 20px;
}


/* =========================================================
   CARD
========================================================= */

.card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;

  box-shadow:
    0 2px 10px rgba(0, 0, 0, 0.08);
}

.stat-card {
  text-align: center;
}

.stat-card h2 {
  font-size: 32px;
  margin: 10px 0 0;
}

.stat-card.pending {
  border-left: 5px solid orange;
}

.stat-card.returned {
  border-left: 5px solid green;
}


/* =========================================================
   ALERT
========================================================= */

.alert {
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 15px;
}

.alert.success {
  background: #e8f7ed;
}

.alert.error {
  background: #fdeaea;
  color: #b00020;
}


/* =========================================================
   SEARCH
========================================================= */

.search {
  width: 100%;
  box-sizing: border-box;
  padding: 12px;
  margin-bottom: 15px;

  border: 1px solid #ddd;
  border-radius: 8px;
}


/* =========================================================
   TABLE
========================================================= */

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  border-bottom: 1px solid #eee;
  text-align: left;
  white-space: nowrap;
}

th {
  background: #f7f7f7;
}


/* =========================================================
   STATUS
========================================================= */

.status {
  display: inline-block;

  padding: 5px 10px;

  border-radius: 20px;

  font-size: 13px;
  font-weight: 600;
}

.status.Available {
  background: #e8f7ed;
  color: #18733a;
}

.status.Borrowed {
  background: #fff4d6;
  color: #8a5b00;
}

.status.Broken {
  background: #fdeaea;
  color: #b00020;
}

.status.PendingApproval {
  background: #fff4d6;
  color: #8a5b00;
}

.status.Returned {
  background: #e8f7ed;
  color: #18733a;
}

.status.Rejected {
  background: #fdeaea;
  color: #b00020;
}


/* =========================================================
   FORM
========================================================= */

.form-grid {
  display: grid;

  grid-template-columns:
    repeat(auto-fit, minmax(220px, 1fr));

  gap: 15px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-group input,
.form-group select {
  padding: 10px;

  border: 1px solid #ddd;
  border-radius: 7px;

  box-sizing: border-box;
}

.form-actions {
  margin-top: 20px;

  display: flex;
  gap: 10px;
}


/* =========================================================
   BUTTONS
========================================================= */

button {
  border: none;
  border-radius: 7px;

  padding: 9px 14px;

  cursor: pointer;
}

.primary {
  background: #2563eb;
  color: white;
}

.secondary {
  background: #e5e7eb;
}

.small-btn {
  margin-right: 5px;
}

.danger {
  background: #dc2626;
  color: white;
}

.approve {
  background: #16a34a;
  color: white;
}

.reject {
  background: #dc2626;
  color: white;
}

.return-btn {
  background: #2563eb;
  color: white;
}

.actions {
  display: flex;
  gap: 6px;
}

.done {
  color: #16803c;
  font-weight: 600;
}

.rejected-text {
  color: #b00020;
  font-weight: 600;
}

.empty {
  text-align: center;
  padding: 30px;
  opacity: 0.6;
}


/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 700px) {

  .admin-page {
    padding: 15px;
  }

  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .card {
    padding: 15px;
  }

}

</style>