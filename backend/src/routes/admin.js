import { Router } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../utils/db.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = Router();

router.get('/employees', auth, adminOnly, async (req, res, next) => {
  try {
    const q = `%${req.query.q || ''}%`;
    const [rows] = await pool.query(
      `SELECT e.EmployeeID,e.Name,e.Email,e.Phone,e.DepartmentID,d.DepartmentName
       FROM Employee e JOIN Department d ON d.DepartmentID=e.DepartmentID
       WHERE e.Name LIKE ? OR e.Email LIKE ? OR d.DepartmentName LIKE ?
       ORDER BY e.EmployeeID DESC`, [q,q,q]
    );
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/logs', auth, adminOnly, async (req, res, next) => {
  try {
    const [rows] = await pool.query('SELECT * FROM AuditLog ORDER BY LogID DESC LIMIT 100');
    res.json(rows);
  } catch (e) { next(e); }
});

router.get('/stats', auth, adminOnly, async (req, res, next) => {
  try {
    const [[assets]] = await pool.query('SELECT COUNT(*) total FROM Asset');
    const [[available]] = await pool.query("SELECT COUNT(*) total FROM Asset WHERE Status='Available'");
    const [[borrowed]] = await pool.query("SELECT COUNT(*) total FROM Asset WHERE Status='Borrowed'");
    const [[pending]] = await pool.query("SELECT COUNT(*) total FROM BorrowTransaction WHERE Status='PendingApproval'");
    res.json({ assets: assets.total, available: available.total, borrowed: borrowed.total, pending: pending.total });
  } catch (e) { next(e); }
});

export default router;
