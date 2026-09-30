import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { checkDatabaseConnection } from './utils/db.js';

import authRoutes from './routes/auth.js';
import assetRoutes from './routes/assets.js';
import borrowRoutes from './routes/borrow.js';
import adminRoutes from './routes/admin.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config();

const app = express();


// ========================================
// Middleware
// ========================================

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173'
  })
);

app.use(express.json());


// ========================================
// Health Check
// ========================================

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Company Asset Borrowing API is running'
  });
});


// ========================================
// API Routes
// ========================================

app.use('/api/auth', authRoutes);

app.use('/api/assets', assetRoutes);

app.use('/api/borrow', borrowRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/notifications', notificationRoutes);


// ========================================
// Error Handler
// ========================================

app.use((err, req, res, next) => {
  console.error(err);

  res.status(500).json({
    success: false,
    message: 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์'
  });
});


// ========================================
// Start Server
// ========================================

const PORT = process.env.PORT || 3000;

async function startServer() {

  console.log('');
  console.log('========================================');
  console.log('   Company Asset Borrowing System');
  console.log('========================================');

  // ตรวจสอบ MySQL ก่อนเปิด Server
  const databaseConnected = await checkDatabaseConnection();

  if (!databaseConnected) {

    console.log('');
    console.log('✗ Server was NOT started');
    console.log('✗ Please check MySQL / .env configuration');
    console.log('========================================');

    process.exit(1);
  }

  app.listen(PORT, () => {

    console.log('✓ Server Running');
    console.log(`✓ API: http://localhost:${PORT}`);
    console.log('========================================');
    console.log('');
  });
}

startServer();