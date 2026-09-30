import { Router } from 'express';
import pool from '../utils/db.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = Router();

router.post('/', auth, async (req, res, next) => {
  try {
    if (req.user.type !== 'employee')
      return res.status(403).json({ message: 'เฉพาะสมาชิกเท่านั้นที่ขอยืมได้' });

    const { assetId, dueDate } = req.body;
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [assets] = await conn.query(
        'SELECT AssetID, AssetName, Status FROM Asset WHERE AssetID=? FOR UPDATE', [assetId]
      );
      if (!assets.length || assets[0].Status !== 'Available') {
        await conn.rollback();
        return res.status(400).json({ message: 'ทรัพย์สินไม่พร้อมให้ยืม' });
      }

      const [result] = await conn.query(
        `INSERT INTO BorrowTransaction
         (EmployeeID,AssetID,BorrowDate,DueDate,Status)
         VALUES (?, ?, CURDATE(), ?, 'PendingApproval')`,
        [req.user.id, assetId, dueDate]
      );

      await conn.query(
        `INSERT INTO Notification(EmployeeID,Message)
         VALUES (?,?)`,
        [req.user.id, `ส่งคำขอยืม ${assets[0].AssetName} แล้ว รอ Admin อนุมัติ`]
      );

      await conn.commit();
      res.status(201).json({ transactionId: result.insertId });
    } catch (e) {
      await conn.rollback(); throw e;
    } finally { conn.release(); }
  } catch (e) { next(e); }
});

router.get('/my', auth, async (req, res, next) => {
  try {
    if (req.user.type !== 'employee')
      return res.status(403).json({ message: 'เฉพาะสมาชิกเท่านั้น' });

    const [rows] = await pool.query(
      `SELECT b.*, a.AssetName, a.SerialNumber
       FROM BorrowTransaction b
       JOIN Asset a ON a.AssetID=b.AssetID
       WHERE b.EmployeeID=?
       ORDER BY b.TransactionID DESC`, [req.user.id]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/', auth, adminOnly, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT b.*, e.Name EmployeeName, e.Email, a.AssetName, ad.Username AdminName
       FROM BorrowTransaction b
       JOIN Employee e ON e.EmployeeID=b.EmployeeID
       JOIN Asset a ON a.AssetID=b.AssetID
       LEFT JOIN Admin ad ON ad.AdminID=b.AdminID
       ORDER BY b.TransactionID DESC`
    );
    res.json(rows);
  } catch (e) { next(e); }
});

// Admin approve
router.put('/:id/approve', auth, adminOnly, async (req, res, next) => {
  try {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      const [rows] = await conn.query(
        `SELECT b.*, a.Status AssetStatus, a.AssetName
         FROM BorrowTransaction b JOIN Asset a ON a.AssetID=b.AssetID
         WHERE b.TransactionID=? FOR UPDATE`, [req.params.id]
      );
      if (!rows.length || rows[0].Status !== 'PendingApproval' || rows[0].AssetStatus !== 'Available') {
        await conn.rollback();
        return res.status(400).json({ message: 'ไม่สามารถอนุมัติรายการนี้ได้' });
      }

      await conn.query(
        `UPDATE BorrowTransaction SET AdminID=?, Status='Borrowed' WHERE TransactionID=?`,
        [req.user.id, req.params.id]
      );
      await conn.query(`UPDATE Asset SET Status='Borrowed' WHERE AssetID=?`, [rows[0].AssetID]);
      await conn.query(
        `INSERT INTO Notification(EmployeeID,Message) VALUES (?,?)`,
        [rows[0].EmployeeID, `คำขอยืม ${rows[0].AssetName} ได้รับการอนุมัติแล้ว`]
      );
      await conn.commit();
      res.json({ message: 'อนุมัติสำเร็จ' });
    } catch (e) { await conn.rollback(); throw e; }
    finally { conn.release(); }
  } catch (e) { next(e); }
});

// Admin mark returned
router.put('/:id/return', auth, adminOnly, async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT EmployeeID, AssetID FROM BorrowTransaction WHERE TransactionID=?', [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'ไม่พบรายการ' });

    await pool.query(
      `UPDATE BorrowTransaction SET ReturnDate=CURDATE(), Status='Returned', AdminID=? WHERE TransactionID=?`,
      [req.user.id, req.params.id]
    );
    await pool.query(`UPDATE Asset SET Status='Available' WHERE AssetID=?`, [rows[0].AssetID]);
    await pool.query(
      `INSERT INTO Notification(EmployeeID,Message) VALUES (?,?)`,
      [rows[0].EmployeeID, 'ทรัพย์สินถูกบันทึกว่าคืนแล้ว']
    );
    res.json({ message: 'คืนทรัพย์สินสำเร็จ' });
  } catch (e) { next(e); }
});

export default router;
