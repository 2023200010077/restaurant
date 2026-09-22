import { Router } from "express";
import pool from "../config/database.js";

const router = Router();

// GET dashboard summary
router.get("/summary", async (_req, res) => {
  try {
    const [revenueRows] = await pool.query(`
      SELECT
        COALESCE(SUM(payment_amount), 0) AS total_revenue
      FROM payment
      WHERE payment_status = 'paid'
    `);

    const [orderStatusRows] = await pool.query(`
      SELECT
        order_status,
        COUNT(*) AS total
      FROM orders
      GROUP BY order_status
    `);

    const revenueResult = revenueRows as {
      total_revenue: number | string;
    }[];

    const statusResult = orderStatusRows as {
      order_status: string;
      total: number | string;
    }[];

    const orderSummary = {
      pending: 0,
      preparing: 0,
      ready: 0,
      completed: 0,
      cancelled: 0,
    };

    for (const row of statusResult) {
      if (row.order_status in orderSummary) {
        orderSummary[
          row.order_status as keyof typeof orderSummary
        ] = Number(row.total);
      }
    }

    res.json({
      success: true,
      data: {
        total_revenue: Number(revenueResult[0]?.total_revenue ?? 0),
        order_summary: orderSummary,
      },
    });
  } catch (error) {
    console.error("Dashboard summary error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard summary.",
    });
  }
});

// GET recent orders
router.get("/recent-orders", async (_req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        o.order_id,
        COALESCE(c.customer_name, 'Walk-in Customer') AS customer_name,
        r.restaurant_name,
        o.order_type,
        o.order_status,
        o.total_amount,
        o.order_date,
        o.order_time
      FROM orders o
      LEFT JOIN customer c
        ON o.customer_id = c.customer_id
      INNER JOIN restaurant r
        ON o.restaurant_id = r.restaurant_id
      ORDER BY o.order_id DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Recent orders error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load recent orders.",
    });
  }
});

export default router;