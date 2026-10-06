import { Router } from 'express';
import pool from '../utils/db.js';
import { auth, adminOnly } from '../middleware/auth.js';

const router = Router();


// ======================================================
// GET ASSETS
// ======================================================

router.get('/', async (req, res, next) => {
  try {

    const search = String(req.query.q || '').trim();

    let sql = `
      SELECT
        a.*,
        c.CategoryName
      FROM Asset a
      LEFT JOIN Category c
        ON a.CategoryID = c.CategoryID
    `;

    const params = [];

    if (search) {

      sql += `
        WHERE
          a.AssetName LIKE ?
          OR a.SerialNumber LIKE ?
          OR c.CategoryName LIKE ?
      `;

      const q = `%${search}%`;

      params.push(q, q, q);
    }

    sql += `
      ORDER BY a.AssetID DESC
    `;

    const [rows] = await pool.query(
      sql,
      params
    );

    res.json(rows);

  } catch (e) {

    console.error('GET /assets error:', e);

    next(e);

  }
});


// ======================================================
// GET CATEGORIES
// ======================================================

router.get('/categories', async (req, res, next) => {
  try {

    const [rows] = await pool.query(
      `
      SELECT *
      FROM Category
      ORDER BY CategoryName
      `
    );

    res.json(rows);

  } catch (e) {

    console.error(
      'GET /assets/categories error:',
      e
    );

    next(e);

  }
});


// ======================================================
// GET DEPARTMENTS
// ======================================================

router.get('/departments', async (req, res, next) => {
  try {

    const [rows] = await pool.query(
      `
      SELECT *
      FROM Department
      ORDER BY DepartmentName
      `
    );

    res.json(rows);

  } catch (e) {

    console.error(
      'GET /assets/departments error:',
      e
    );

    next(e);

  }
});


// ======================================================
// CREATE ASSET
// POST /api/assets
// ======================================================

router.post(
  '/',
  auth,
  adminOnly,
  async (req, res, next) => {

    try {

      console.log('========== CREATE ASSET ==========');
      console.log('Request body:', req.body);


      // --------------------------------------------------
      // รองรับทั้ง camelCase และตัวพิมพ์ใหญ่
      // --------------------------------------------------

      const assetName =
        req.body.assetName ??
        req.body.AssetName ??
        '';

      const categoryId =
        req.body.categoryId ??
        req.body.CategoryID ??
        null;

      const status =
        req.body.status ??
        req.body.Status ??
        'Available';

      const purchaseDate =
        req.body.purchaseDate ??
        req.body.PurchaseDate ??
        null;

      const price =
        req.body.price ??
        req.body.Price ??
        null;

      const serialNumber =
        req.body.serialNumber ??
        req.body.SerialNumber ??
        null;

      const location =
        req.body.location ??
        req.body.Location ??
        null;


      // --------------------------------------------------
      // ตรวจสอบชื่อทรัพย์สิน
      // --------------------------------------------------

      if (!String(assetName).trim()) {

        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกชื่อทรัพย์สิน'
        });

      }


      // --------------------------------------------------
      // ตรวจสอบหมวดหมู่
      // --------------------------------------------------

      if (!categoryId) {

        return res.status(400).json({
          success: false,
          message: 'กรุณาเลือกหมวดหมู่'
        });

      }


      // --------------------------------------------------
      // ตรวจสอบ Category ว่ามีจริง
      // --------------------------------------------------

      const [categoryRows] = await pool.query(
        `
        SELECT CategoryID
        FROM Category
        WHERE CategoryID = ?
        `,
        [categoryId]
      );

      if (categoryRows.length === 0) {

        return res.status(400).json({
          success: false,
          message: 'ไม่พบหมวดหมู่ที่เลือก'
        });

      }


      // --------------------------------------------------
      // ตรวจสอบ Serial ซ้ำ
      // --------------------------------------------------

      if (serialNumber) {

        const [serialRows] = await pool.query(
          `
          SELECT AssetID
          FROM Asset
          WHERE SerialNumber = ?
          `,
          [serialNumber]
        );

        if (serialRows.length > 0) {

          return res.status(400).json({
            success: false,
            message: 'Serial Number นี้มีอยู่ในระบบแล้ว'
          });

        }

      }


      // --------------------------------------------------
      // INSERT ASSET
      // --------------------------------------------------

      const [result] = await pool.query(
        `
        INSERT INTO Asset
        (
          AssetName,
          CategoryID,
          Status,
          PurchaseDate,
          Price,
          SerialNumber,
          Location
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          String(assetName).trim(),
          categoryId,
          status,
          purchaseDate || null,
          price === '' ? null : price,
          serialNumber || null,
          location || null
        ]
      );


      // --------------------------------------------------
      // AUDIT LOG
      // --------------------------------------------------

      await pool.query(
        `
        INSERT INTO AuditLog
        (
          TableName,
          Action,
          UserID
        )
        VALUES ('Asset', 'INSERT', ?)
        `,
        [req.user.id]
      );


      // --------------------------------------------------
      // RESPONSE
      // --------------------------------------------------

      res.status(201).json({
        success: true,
        message: 'เพิ่มทรัพย์สินสำเร็จ',
        AssetID: result.insertId
      });


    } catch (e) {

      console.error(
        'POST /assets error:',
        e
      );

      next(e);

    }

  }
);


// ======================================================
// UPDATE ASSET
// PUT /api/assets/:id
// ======================================================

router.put(
  '/:id',
  auth,
  adminOnly,
  async (req, res, next) => {

    try {

      const assetId = req.params.id;


      const assetName =
        req.body.assetName ??
        req.body.AssetName ??
        '';

      const categoryId =
        req.body.categoryId ??
        req.body.CategoryID ??
        null;

      const status =
        req.body.status ??
        req.body.Status ??
        'Available';

      const purchaseDate =
        req.body.purchaseDate ??
        req.body.PurchaseDate ??
        null;

      const price =
        req.body.price ??
        req.body.Price ??
        null;

      const serialNumber =
        req.body.serialNumber ??
        req.body.SerialNumber ??
        null;

      const location =
        req.body.location ??
        req.body.Location ??
        null;


      // --------------------------------------------------
      // VALIDATE
      // --------------------------------------------------

      if (!String(assetName).trim()) {

        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกชื่อทรัพย์สิน'
        });

      }


      if (!categoryId) {

        return res.status(400).json({
          success: false,
          message: 'กรุณาเลือกหมวดหมู่'
        });

      }


      // --------------------------------------------------
      // CHECK ASSET
      // --------------------------------------------------

      const [assetRows] = await pool.query(
        `
        SELECT AssetID
        FROM Asset
        WHERE AssetID = ?
        `,
        [assetId]
      );

      if (assetRows.length === 0) {

        return res.status(404).json({
          success: false,
          message: 'ไม่พบทรัพย์สิน'
        });

      }


      // --------------------------------------------------
      // CHECK CATEGORY
      // --------------------------------------------------

      const [categoryRows] = await pool.query(
        `
        SELECT CategoryID
        FROM Category
        WHERE CategoryID = ?
        `,
        [categoryId]
      );

      if (categoryRows.length === 0) {

        return res.status(400).json({
          success: false,
          message: 'ไม่พบหมวดหมู่ที่เลือก'
        });

      }


      // --------------------------------------------------
      // CHECK SERIAL DUPLICATE
      // --------------------------------------------------

      if (serialNumber) {

        const [serialRows] = await pool.query(
          `
          SELECT AssetID
          FROM Asset
          WHERE SerialNumber = ?
          AND AssetID <> ?
          `,
          [
            serialNumber,
            assetId
          ]
        );

        if (serialRows.length > 0) {

          return res.status(400).json({
            success: false,
            message: 'Serial Number นี้มีอยู่ในระบบแล้ว'
          });

        }

      }


      // --------------------------------------------------
      // UPDATE
      // --------------------------------------------------

      await pool.query(
        `
        UPDATE Asset
        SET
          AssetName = ?,
          CategoryID = ?,
          Status = ?,
          PurchaseDate = ?,
          Price = ?,
          SerialNumber = ?,
          Location = ?
        WHERE AssetID = ?
        `,
        [
          String(assetName).trim(),
          categoryId,
          status,
          purchaseDate || null,
          price === '' ? null : price,
          serialNumber || null,
          location || null,
          assetId
        ]
      );


      // --------------------------------------------------
      // AUDIT LOG
      // --------------------------------------------------

      await pool.query(
        `
        INSERT INTO AuditLog
        (
          TableName,
          Action,
          UserID
        )
        VALUES ('Asset', 'UPDATE', ?)
        `,
        [req.user.id]
      );


      res.json({
        success: true,
        message: 'แก้ไขทรัพย์สินสำเร็จ'
      });


    } catch (e) {

      console.error(
        'PUT /assets/:id error:',
        e
      );

      next(e);

    }

  }
);


// ======================================================
// DELETE ASSET
// DELETE /api/assets/:id
// ======================================================

router.delete(
  '/:id',
  auth,
  adminOnly,
  async (req, res, next) => {

    try {

      const assetId = req.params.id;


      // --------------------------------------------------
      // ตรวจสอบว่ามีรายการยืมอยู่หรือไม่
      // --------------------------------------------------

      const [borrowRows] = await pool.query(
        `
        SELECT TransactionID
        FROM BorrowTransaction
        WHERE AssetID = ?
        AND Status IN (
          'PendingApproval',
          'Borrowed',
          'ReturnRequested'
        )
        LIMIT 1
        `,
        [assetId]
      );


      if (borrowRows.length > 0) {

        return res.status(400).json({
          success: false,
          message:
            'ไม่สามารถลบทรัพย์สินที่มีรายการยืมอยู่ได้'
        });

      }


      // --------------------------------------------------
      // DELETE
      // --------------------------------------------------

      const [result] = await pool.query(
        `
        DELETE FROM Asset
        WHERE AssetID = ?
        `,
        [assetId]
      );


      if (result.affectedRows === 0) {

        return res.status(404).json({
          success: false,
          message: 'ไม่พบทรัพย์สิน'
        });

      }


      // --------------------------------------------------
      // AUDIT LOG
      // --------------------------------------------------

      await pool.query(
        `
        INSERT INTO AuditLog
        (
          TableName,
          Action,
          UserID
        )
        VALUES ('Asset', 'DELETE', ?)
        `,
        [req.user.id]
      );


      res.json({
        success: true,
        message: 'ลบทรัพย์สินสำเร็จ'
      });


    } catch (e) {

      console.error(
        'DELETE /assets/:id error:',
        e
      );

      next(e);

    }

  }
);


export default router;