import { Router } from 'express';
import pool from '../utils/db.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const [rows] = await pool.query(
      `SELECT a.*, c.CategoryName
       FROM Asset a JOIN Category c ON a.CategoryID=c.CategoryID
       WHERE a.AssetName LIKE ? OR a.SerialNumber LIKE ? OR c.CategoryName LIKE ?
       ORDER BY a.AssetID DESC`, [q, q, q]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/categories', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Category ORDER BY CategoryName');
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/departments', async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM Department ORDER BY DepartmentName');
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/', auth, adminOnly, async (req, res, next) => {
  try {
    const { assetName, categoryId, status, purchaseDate, price, serialNumber, location } = req.body;
    const [r] = await pool.query(
      `INSERT INTO Asset (AssetName,CategoryID,Status,PurchaseDate,Price,SerialNumber,Location)
       VALUES (?,?,?,?,?,?,?)`,
      [assetName, categoryId, status || 'Available', purchaseDate || null, price || null, serialNumber || null, location || null]
    );
    await pool.query(
      `INSERT INTO AuditLog(TableName,Action,UserID) VALUES ('Asset','INSERT',?)`,
      [req.user.id]
    );
    res.status(201).json({ AssetID: r.insertId });
  } catch (e) { next(e); }
});

router.put('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    const { assetName, categoryId, status, purchaseDate, price, serialNumber, location } = req.body;
    await pool.query(
      `UPDATE Asset SET AssetName=?,CategoryID=?,Status=?,PurchaseDate=?,Price=?,SerialNumber=?,Location=?
       WHERE AssetID=?`,
      [assetName, categoryId, status, purchaseDate || null, price || null, serialNumber || null, location || null, req.params.id]
    );
    await pool.query(
      `INSERT INTO AuditLog(TableName,Action,UserID) VALUES ('Asset','UPDATE',?)`,
      [req.user.id]
    );
    res.json({ message: 'แก้ไขทรัพย์สินสำเร็จ' });
  } catch (e) { next(e); }
});

router.delete('/:id', auth, adminOnly, async (req, res, next) => {
  try {
    await pool.query('DELETE FROM Asset WHERE AssetID=?', [req.params.id]);
    await pool.query(
      `INSERT INTO AuditLog(TableName,Action,UserID) VALUES ('Asset','DELETE',?)`,
      [req.user.id]
    );
    res.json({ message: 'ลบทรัพย์สินสำเร็จ' });
  } catch (e) { next(e); }
});

export default router;
