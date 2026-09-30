import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import pool from '../utils/db.js';

const router = Router();

const passwordPolicy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function sign(user) {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '2h' });
}

// 6.5 สมัครสมาชิก Employee
router.post('/register', async (req, res, next) => {
  try {
    const { name, departmentId, email, phone, password } = req.body;

    if (!name || !departmentId || !email || !password)
      return res.status(400).json({ message: 'กรอกข้อมูลที่จำเป็นให้ครบ' });

    if (!passwordPolicy.test(password)) {
      return res.status(400).json({
        message: 'Password ต้องมีอย่างน้อย 8 ตัวอักษร, A-Z, a-z, ตัวเลข และอักขระพิเศษ'
      });
    }

    const [exists] = await pool.query('SELECT EmployeeID FROM Employee WHERE Email=?', [email]);
    if (exists.length) return res.status(409).json({ message: 'อีเมลนี้สมัครสมาชิกแล้ว' });

    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO Employee (Name, DepartmentID, Email, Phone, Password)
       VALUES (?, ?, ?, ?, ?)`,
      [name, departmentId, email, phone || null, hash]
    );

    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ', employeeId: result.insertId });
  } catch (e) { next(e); }
});

// 6.6 Login: admin ใช้ Username+Password, employee ใช้ Email+Password
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ message: 'กรุณากรอก Username/Email และ Password' });

    const [admins] = await pool.query(
      'SELECT AdminID, Username, Password, Role FROM Admin WHERE Username=?',
      [username]
    );

    if (admins.length) {
      const admin = admins[0];
      if (!(await bcrypt.compare(password, admin.Password)))
        return res.status(401).json({ message: 'Username หรือ Password ไม่ถูกต้อง' });

      const token = sign({
        id: admin.AdminID, username: admin.Username, role: admin.Role, type: 'admin'
      });
      return res.json({
        token,
        user: { id: admin.AdminID, name: admin.Username, role: admin.Role, type: 'admin' }
      });
    }

    const [employees] = await pool.query(
      `SELECT EmployeeID, Name, Email, Password, DepartmentID
       FROM Employee WHERE Email=?`,
      [username]
    );

    if (!employees.length)
      return res.status(401).json({ message: 'Username/Email หรือ Password ไม่ถูกต้อง' });

    const emp = employees[0];
    if (!(await bcrypt.compare(password, emp.Password)))
      return res.status(401).json({ message: 'Username/Email หรือ Password ไม่ถูกต้อง' });

    const token = sign({
      id: emp.EmployeeID, name: emp.Name, role: 'Customer', type: 'employee'
    });

    res.json({
      token,
      user: { id: emp.EmployeeID, name: emp.Name, role: 'Customer', type: 'employee' }
    });
  } catch (e) { next(e); }
});

// 6.6.5 ขอ reset password ทาง email
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    const [rows] = await pool.query(
      'SELECT EmployeeID, Name, Email FROM Employee WHERE Email=?', [email]
    );

    // ไม่เปิดเผยว่า email มีอยู่หรือไม่
    if (!rows.length) return res.json({ message: 'หากอีเมลนี้อยู่ในระบบ จะได้รับลิงก์ reset password' });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // โปรเจกต์ตัวอย่างเก็บ reset token ใน memory เพื่อให้โค้ดตรงกับ schema ข้อ 1-5
    // สำหรับ production ควรสร้าง PasswordResetTokens table
    global.resetTokens ??= new Map();
    global.resetTokens.set(tokenHash, {
      employeeId: rows[0].EmployeeID,
      expires: Date.now() + 15 * 60 * 1000
    });

    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT || 587),
      secure: false,
      auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
    });

    const link = `${process.env.FRONTEND_URL}/reset-password/${rawToken}`;
    await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: 'Reset Password - Company Asset System',
      text: `กดลิงก์เพื่อเปลี่ยนรหัสผ่าน: ${link}\nลิงก์หมดอายุภายใน 15 นาที`
    });

    res.json({ message: 'หากอีเมลนี้อยู่ในระบบ จะได้รับลิงก์ reset password' });
  } catch (e) { next(e); }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!passwordPolicy.test(password))
      return res.status(400).json({
        message: 'Password ต้องมีอย่างน้อย 8 ตัวอักษร, A-Z, a-z, ตัวเลข และอักขระพิเศษ'
      });

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const item = global.resetTokens?.get(hash);

    if (!item || item.expires < Date.now())
      return res.status(400).json({ message: 'ลิงก์ reset password หมดอายุหรือไม่ถูกต้อง' });

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE Employee SET Password=? WHERE EmployeeID=?',
      [passwordHash, item.employeeId]);

    global.resetTokens.delete(hash);
    res.json({ message: 'เปลี่ยน Password สำเร็จ' });
  } catch (e) { next(e); }
});

export default router;
