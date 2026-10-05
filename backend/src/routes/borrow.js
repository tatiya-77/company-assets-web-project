import { Router } from 'express';
import pool from '../utils/db.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = Router();

/* =========================================================
   EMPLOYEE - REQUEST BORROW
   POST /api/borrow
========================================================= */

router.post('/', auth, async (req, res, next) => {
  try {
    if (req.user.type !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'เฉพาะสมาชิกเท่านั้นที่ขอยืมได้'
      });
    }

    const { assetId, dueDate } = req.body;

    if (!assetId || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุทรัพย์สินและวันที่ต้องการคืน'
      });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      /* ตรวจสอบทรัพย์สิน */
      const [assets] = await conn.query(
        `SELECT
          AssetID,
          AssetName,
          SerialNumber,
          Status
         FROM Asset
         WHERE AssetID = ?
         FOR UPDATE`,
        [assetId]
      );

      if (assets.length === 0) {
        await conn.rollback();

        return res.status(404).json({
          success: false,
          message: 'ไม่พบทรัพย์สิน'
        });
      }

      const asset = assets[0];

      if (asset.Status !== 'Available') {
        await conn.rollback();

        return res.status(400).json({
          success: false,
          message: 'ทรัพย์สินนี้ไม่พร้อมให้ยืม'
        });
      }

      /* สร้างรายการยืม */
      const [result] = await conn.query(
        `INSERT INTO BorrowTransaction
          (
            EmployeeID,
            AssetID,
            BorrowDate,
            DueDate,
            Status
          )
         VALUES (?, ?, CURDATE(), ?, 'PendingApproval')`,
        [
          req.user.id,
          assetId,
          dueDate
        ]
      );

      /* แจ้งเตือน Employee */
      await conn.query(
        `INSERT INTO Notification
          (
            EmployeeID,
            Message
          )
         VALUES (?, ?)`,
        [
          req.user.id,
          `ส่งคำขอยืม ${asset.AssetName} แล้ว รอ Admin อนุมัติ`
        ]
      );

      await conn.commit();

      return res.status(201).json({
        success: true,
        message: 'ส่งคำขอยืมสำเร็จ',
        transactionId: result.insertId
      });

    } catch (error) {
      await conn.rollback();
      throw error;

    } finally {
      conn.release();
    }

  } catch (error) {
    next(error);
  }
});


/* =========================================================
   EMPLOYEE - MY BORROW TRANSACTIONS
   GET /api/borrow/my
========================================================= */

router.get('/my', auth, async (req, res, next) => {
  try {
    if (req.user.type !== 'employee') {
      return res.status(403).json({
        success: false,
        message: 'เฉพาะสมาชิกเท่านั้น'
      });
    }

    const [rows] = await pool.query(
      `SELECT
        b.TransactionID,
        b.EmployeeID,
        b.AssetID,
        b.BorrowDate,
        b.DueDate,
        b.ReturnDate,
        b.Status,
        b.AdminID,

        a.AssetName,
        a.SerialNumber,

        ad.Username AS AdminName

       FROM BorrowTransaction b

       JOIN Asset a
         ON a.AssetID = b.AssetID

       LEFT JOIN Admin ad
         ON ad.AdminID = b.AdminID

       WHERE b.EmployeeID = ?

       ORDER BY b.TransactionID DESC`,
      [req.user.id]
    );

    return res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    next(error);
  }
});


/* =========================================================
   ADMIN - GET ALL BORROW TRANSACTIONS
   GET /api/borrow
========================================================= */

router.get('/', auth, adminOnly, async (req, res, next) => {
  try {

    const [rows] = await pool.query(
      `SELECT
        b.TransactionID,
        b.EmployeeID,
        b.AssetID,
        b.BorrowDate,
        b.DueDate,
        b.ReturnDate,
        b.Status,
        b.AdminID,

        e.Name AS EmployeeName,
        e.Email AS EmployeeEmail,

        a.AssetName,
        a.SerialNumber,
        a.Status AS AssetStatus,

        ad.Username AS AdminName

       FROM BorrowTransaction b

       JOIN Employee e
         ON e.EmployeeID = b.EmployeeID

       JOIN Asset a
         ON a.AssetID = b.AssetID

       LEFT JOIN Admin ad
         ON ad.AdminID = b.AdminID

       ORDER BY b.TransactionID DESC`
    );

    return res.json({
      success: true,
      data: rows
    });

  } catch (error) {
    next(error);
  }
});


/* =========================================================
   ADMIN - APPROVE BORROW
   PUT /api/borrow/:id/approve
========================================================= */

router.put('/:id/approve', auth, adminOnly, async (req, res, next) => {
  try {

    const transactionId = req.params.id;

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      /* ตรวจสอบรายการยืม */
      const [rows] = await conn.query(
        `SELECT
          b.TransactionID,
          b.EmployeeID,
          b.AssetID,
          b.Status,

          a.AssetName,
          a.Status AS AssetStatus

         FROM BorrowTransaction b

         JOIN Asset a
           ON a.AssetID = b.AssetID

         WHERE b.TransactionID = ?

         FOR UPDATE`,
        [transactionId]
      );

      if (rows.length === 0) {
        await conn.rollback();

        return res.status(404).json({
          success: false,
          message: 'ไม่พบรายการยืม'
        });
      }

      const borrow = rows[0];

      /* ต้องเป็น PendingApproval เท่านั้น */
      if (borrow.Status !== 'PendingApproval') {
        await conn.rollback();

        return res.status(400).json({
          success: false,
          message: 'รายการนี้ไม่ได้อยู่ระหว่างรออนุมัติ'
        });
      }

      /* Asset ต้อง Available */
      if (borrow.AssetStatus !== 'Available') {
        await conn.rollback();

        return res.status(400).json({
          success: false,
          message: 'ทรัพย์สินนี้ไม่พร้อมให้ยืม'
        });
      }

      /* เปลี่ยนรายการยืมเป็น Borrowed */
      await conn.query(
        `UPDATE BorrowTransaction

         SET
           AdminID = ?,
           Status = 'Borrowed'

         WHERE TransactionID = ?`,
        [
          req.user.id,
          transactionId
        ]
      );

      /* เปลี่ยน Asset เป็น Borrowed */
      await conn.query(
        `UPDATE Asset

         SET Status = 'Borrowed'

         WHERE AssetID = ?`,
        [borrow.AssetID]
      );

      /* แจ้ง Employee */
      await conn.query(
        `INSERT INTO Notification
          (
            EmployeeID,
            Message
          )
         VALUES (?, ?)`,
        [
          borrow.EmployeeID,
          `คำขอยืม ${borrow.AssetName} ได้รับการอนุมัติแล้ว`
        ]
      );

      await conn.commit();

      return res.json({
        success: true,
        message: 'อนุมัติการยืมสำเร็จ'
      });

    } catch (error) {
      await conn.rollback();
      throw error;

    } finally {
      conn.release();
    }

  } catch (error) {
    next(error);
  }
});


/* =========================================================
   ADMIN - RETURN ASSET
   PUT /api/borrow/:id/return
========================================================= */

router.put('/:id/return', auth, adminOnly, async (req, res, next) => {
  try {

    const transactionId = req.params.id;

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      /* =====================================================
         ตรวจสอบรายการยืม
      ===================================================== */

      const [rows] = await conn.query(
        `SELECT
          b.TransactionID,
          b.EmployeeID,
          b.AssetID,
          b.Status,

          a.AssetName,
          a.Status AS AssetStatus

         FROM BorrowTransaction b

         JOIN Asset a
           ON a.AssetID = b.AssetID

         WHERE b.TransactionID = ?

         FOR UPDATE`,
        [transactionId]
      );

      /* ไม่พบรายการ */
      if (rows.length === 0) {
        await conn.rollback();

        return res.status(404).json({
          success: false,
          message: 'ไม่พบรายการยืม'
        });
      }

      const borrow = rows[0];

      /* =====================================================
         ต้องเป็น Borrowed เท่านั้น
      ===================================================== */

      if (borrow.Status !== 'Borrowed') {
        await conn.rollback();

        return res.status(400).json({
          success: false,
          message:
            'รายการนี้ไม่สามารถคืนได้ เพราะไม่ได้อยู่ในสถานะกำลังยืม'
        });
      }

      /* =====================================================
         ตรวจสอบ Asset
      ===================================================== */

      if (borrow.AssetStatus !== 'Borrowed') {
        await conn.rollback();

        return res.status(400).json({
          success: false,
          message:
            'สถานะทรัพย์สินไม่ถูกต้อง ไม่สามารถบันทึกการคืนได้'
        });
      }

      /* =====================================================
         UPDATE BorrowTransaction
      ===================================================== */

      await conn.query(
        `UPDATE BorrowTransaction

         SET
           ReturnDate = CURDATE(),
           Status = 'Returned',
           AdminID = ?

         WHERE TransactionID = ?`,
        [
          req.user.id,
          transactionId
        ]
      );

      /* =====================================================
         UPDATE Asset
         คืนแล้ว -> Available
      ===================================================== */

      await conn.query(
        `UPDATE Asset

         SET Status = 'Available'

         WHERE AssetID = ?`,
        [borrow.AssetID]
      );

      /* =====================================================
         Notification
      ===================================================== */

      await conn.query(
        `INSERT INTO Notification
          (
            EmployeeID,
            Message
          )
         VALUES (?, ?)`,
        [
          borrow.EmployeeID,
          `ทรัพย์สิน ${borrow.AssetName} ถูกบันทึกว่าคืนแล้ว`
        ]
      );

      await conn.commit();

      return res.json({
        success: true,
        message: 'คืนทรัพย์สินสำเร็จ'
      });

    } catch (error) {
      await conn.rollback();
      throw error;

    } finally {
      conn.release();
    }

  } catch (error) {
    next(error);
  }
});


/* =========================================================
   ADMIN - REJECT BORROW
   PUT /api/borrow/:id/reject
========================================================= */

router.put('/:id/reject', auth, adminOnly, async (req, res, next) => {
  try {

    const transactionId = req.params.id;

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [rows] = await conn.query(
        `SELECT
          b.TransactionID,
          b.EmployeeID,
          b.AssetID,
          b.Status,
          a.AssetName

         FROM BorrowTransaction b

         JOIN Asset a
           ON a.AssetID = b.AssetID

         WHERE b.TransactionID = ?

         FOR UPDATE`,
        [transactionId]
      );

      if (rows.length === 0) {
        await conn.rollback();

        return res.status(404).json({
          success: false,
          message: 'ไม่พบรายการยืม'
        });
      }

      const borrow = rows[0];

      if (borrow.Status !== 'PendingApproval') {
        await conn.rollback();

        return res.status(400).json({
          success: false,
          message: 'รายการนี้ไม่สามารถปฏิเสธได้'
        });
      }

      await conn.query(
        `UPDATE BorrowTransaction

         SET
           AdminID = ?,
           Status = 'Rejected'

         WHERE TransactionID = ?`,
        [
          req.user.id,
          transactionId
        ]
      );

      await conn.query(
        `INSERT INTO Notification
          (
            EmployeeID,
            Message
          )
         VALUES (?, ?)`,
        [
          borrow.EmployeeID,
          `คำขอยืม ${borrow.AssetName} ถูกปฏิเสธ`
        ]
      );

      await conn.commit();

      return res.json({
        success: true,
        message: 'ปฏิเสธการยืมสำเร็จ'
      });

    } catch (error) {
      await conn.rollback();
      throw error;

    } finally {
      conn.release();
    }

  } catch (error) {
    next(error);
  }
});


export default router;