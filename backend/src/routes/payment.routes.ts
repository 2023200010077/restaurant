
import { Router, Request, Response } from "express";
import pool from "../config/database.js";

const router = Router();

const PAYMENT_METHODS = [
  "cash",
  "card",
  "mobile_banking",
  "other",
] as const;

const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "refunded",
  "failed",
] as const;

// GET all payments
router.get("/", async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        p.payment_id,
        p.order_id,
        p.payment_method,
        p.payment_amount,
        p.payment_date,
        p.payment_status,
        o.restaurant_id,
        r.restaurant_name,
        o.customer_id,
        c.customer_name
      FROM payment p
      INNER JOIN orders o
        ON p.order_id = o.order_id
      INNER JOIN restaurant r
        ON o.restaurant_id = r.restaurant_id
      LEFT JOIN customer c
        ON o.customer_id = c.customer_id
      ORDER BY p.payment_id DESC
    `);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching payments:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch payments.",
    });
  }
});

// SEARCH payments
router.get("/search", async (req: Request, res: Response) => {
  try {
    const searchTerm = String(req.query.q ?? "").trim();

    if (!searchTerm) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const searchValue = `%${searchTerm}%`;

    const [rows] = await pool.query(
      `
      SELECT
        p.payment_id,
        p.order_id,
        p.payment_method,
        p.payment_amount,
        p.payment_date,
        p.payment_status,
        r.restaurant_name,
        c.customer_name
      FROM payment p
      INNER JOIN orders o
        ON p.order_id = o.order_id
      INNER JOIN restaurant r
        ON o.restaurant_id = r.restaurant_id
      LEFT JOIN customer c
        ON o.customer_id = c.customer_id
      WHERE
        CAST(p.payment_id AS CHAR) LIKE ?
        OR CAST(p.order_id AS CHAR) LIKE ?
        OR p.payment_method LIKE ?
        OR p.payment_status LIKE ?
        OR r.restaurant_name LIKE ?
        OR c.customer_name LIKE ?
      ORDER BY p.payment_id DESC
      `,
      [
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
        searchValue,
      ]
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error searching payments:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search payments.",
    });
  }
});

// CREATE a payment
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      order_id,
      payment_method,
      payment_amount,
      payment_date,
      payment_status,
    } = req.body;

    const orderId = Number(order_id);
    const amount = Number(payment_amount);

    if (
      !Number.isInteger(orderId) ||
      orderId <= 0 ||
      !PAYMENT_METHODS.includes(payment_method) ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !PAYMENT_STATUSES.includes(payment_status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid order ID, payment method, nonnegative amount, and payment status are required.",
      });
    }

    if (!payment_date || isNaN(Date.parse(payment_date))) {
      return res.status(400).json({
        success: false,
        message: "A valid payment date is required.",
      });
    }

    const [orderRows] = await pool.query(
      `
      SELECT order_id
      FROM orders
      WHERE order_id = ?
      `,
      [orderId]
    );

    const orders = orderRows as { order_id: number }[];

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const [result] = await pool.query(
      `
      INSERT INTO payment
        (
          order_id,
          payment_method,
          payment_amount,
          payment_date,
          payment_status
        )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        orderId,
        payment_method,
        amount,
        payment_date,
        payment_status,
      ]
    );

    const insertResult = result as { insertId: number };

    res.status(201).json({
      success: true,
      message: "Payment created successfully.",
      data: {
        payment_id: insertResult.insertId,
        order_id: orderId,
        payment_method,
        payment_amount: amount,
        payment_date,
        payment_status,
      },
    });
  } catch (error) {
    console.error("Error creating payment:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create payment.",
    });
  }
});

// UPDATE a payment
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const paymentId = Number(req.params.id);

    const {
      order_id,
      payment_method,
      payment_amount,
      payment_date,
      payment_status,
    } = req.body;

    const orderId = Number(order_id);
    const amount = Number(payment_amount);

    if (
      !Number.isInteger(paymentId) ||
      paymentId <= 0 ||
      !Number.isInteger(orderId) ||
      orderId <= 0 ||
      !PAYMENT_METHODS.includes(payment_method) ||
      !Number.isFinite(amount) ||
      amount < 0 ||
      !PAYMENT_STATUSES.includes(payment_status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid payment ID, order ID, payment method, nonnegative amount, and payment status are required.",
      });
    }

    if (!payment_date || isNaN(Date.parse(payment_date))) {
      return res.status(400).json({
        success: false,
        message: "A valid payment date is required.",
      });
    }

    const [paymentRows] = await pool.query(
      `
      SELECT payment_id
      FROM payment
      WHERE payment_id = ?
      `,
      [paymentId]
    );

    const payments = paymentRows as { payment_id: number }[];

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    const [orderRows] = await pool.query(
      `
      SELECT order_id
      FROM orders
      WHERE order_id = ?
      `,
      [orderId]
    );

    const orders = orderRows as { order_id: number }[];

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    await pool.query(
      `
      UPDATE payment
      SET
        order_id = ?,
        payment_method = ?,
        payment_amount = ?,
        payment_date = ?,
        payment_status = ?
      WHERE payment_id = ?
      `,
      [
        orderId,
        payment_method,
        amount,
        payment_date,
        payment_status,
        paymentId,
      ]
    );

    res.status(200).json({
      success: true,
      message: "Payment updated successfully.",
      data: {
        payment_id: paymentId,
        order_id: orderId,
        payment_method,
        payment_amount: amount,
        payment_date,
        payment_status,
      },
    });
  } catch (error) {
    console.error("Error updating payment:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update payment.",
    });
  }
});

// DELETE a payment
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const paymentId = Number(req.params.id);

    if (!Number.isInteger(paymentId) || paymentId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid payment ID is required.",
      });
    }

    const [paymentRows] = await pool.query(
      `
      SELECT payment_id
      FROM payment
      WHERE payment_id = ?
      `,
      [paymentId]
    );

    const payments = paymentRows as { payment_id: number }[];

    if (payments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Payment not found.",
      });
    }

    await pool.query(
      `
      DELETE FROM payment
      WHERE payment_id = ?
      `,
      [paymentId]
    );

    res.status(200).json({
      success: true,
      message: "Payment deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting payment:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete payment.",
    });
  }
});

export default router;