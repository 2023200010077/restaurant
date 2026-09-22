
import { Router, Request, Response } from "express";
import pool from "../config/database.js";

const router = Router();

const VALID_ORDER_TYPES = ["dine_in", "takeaway", "delivery"];

const VALID_ORDER_STATUSES = [
  "pending",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

function isValidPositiveInteger(value: unknown): boolean {
  return Number.isInteger(Number(value)) && Number(value) > 0;
}

function isValidNonNegativeNumber(value: unknown): boolean {
  return (
    value !== "" &&
    value !== null &&
    value !== undefined &&
    Number.isFinite(Number(value)) &&
    Number(value) >= 0
  );
}

function isValidDate(value: unknown): boolean {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

function isValidTime(value: unknown): boolean {
  if (typeof value !== "string") {
    return false;
  }

  return /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(value);
}

/**
 * GET all orders
 */
router.get("/", async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        o.order_id,
        o.customer_id,
        c.customer_name,
        o.restaurant_id,
        r.restaurant_name,
        o.table_id,
        rt.table_number,
        o.employee_id,
        e.employee_name,
        o.order_date,
        o.order_time,
        o.order_type,
        o.order_status,
        o.total_amount
      FROM orders o
      LEFT JOIN customer c
        ON o.customer_id = c.customer_id
      INNER JOIN restaurant r
        ON o.restaurant_id = r.restaurant_id
      LEFT JOIN restaurant_tables rt
        ON o.table_id = rt.table_id
      LEFT JOIN employee e
        ON o.employee_id = e.employee_id
      ORDER BY o.order_id DESC
      `,
    );

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders.",
    });
  }
});

/**
 * GET orders by search
 */
router.get("/search", async (req: Request, res: Response) => {
  try {
    const search = String(req.query.q ?? "").trim();

    if (!search) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const searchPattern = `%${search}%`;

    const [rows] = await pool.query(
      `
      SELECT
        o.order_id,
        o.customer_id,
        c.customer_name,
        o.restaurant_id,
        r.restaurant_name,
        o.table_id,
        rt.table_number,
        o.employee_id,
        e.employee_name,
        o.order_date,
        o.order_time,
        o.order_type,
        o.order_status,
        o.total_amount
      FROM orders o
      LEFT JOIN customer c
        ON o.customer_id = c.customer_id
      INNER JOIN restaurant r
        ON o.restaurant_id = r.restaurant_id
      LEFT JOIN restaurant_tables rt
        ON o.table_id = rt.table_id
      LEFT JOIN employee e
        ON o.employee_id = e.employee_id
      WHERE
        CAST(o.order_id AS CHAR) LIKE ?
        OR COALESCE(c.customer_name, '') LIKE ?
        OR r.restaurant_name LIKE ?
        OR CAST(o.table_id AS CHAR) LIKE ?
        OR COALESCE(e.employee_name, '') LIKE ?
        OR o.order_type LIKE ?
        OR o.order_status LIKE ?
      ORDER BY o.order_id DESC
      `,
      [
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      ],
    );

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error searching orders:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to search orders.",
    });
  }
});

/**
 * POST create order
 */
router.post("/", async (req: Request, res: Response) => {
  const connection = await pool.getConnection();

  try {
    const {
      customer_id,
      restaurant_id,
      table_id,
      employee_id,
      order_date,
      order_time,
      order_type,
      order_status = "pending",
      total_amount = 0,
    } = req.body;

    if (!isValidPositiveInteger(restaurant_id)) {
      return res.status(400).json({
        success: false,
        message: "A valid restaurant is required.",
      });
    }

    if (!isValidDate(order_date)) {
      return res.status(400).json({
        success: false,
        message: "A valid order date is required.",
      });
    }

    if (!isValidTime(order_time)) {
      return res.status(400).json({
        success: false,
        message: "A valid order time is required.",
      });
    }

    if (!VALID_ORDER_TYPES.includes(order_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order type.",
      });
    }

    if (!VALID_ORDER_STATUSES.includes(order_status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    if (!isValidNonNegativeNumber(total_amount)) {
      return res.status(400).json({
        success: false,
        message: "Total amount must be zero or greater.",
      });
    }

    if (
      customer_id !== null &&
      customer_id !== undefined &&
      customer_id !== "" &&
      !isValidPositiveInteger(customer_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    if (
      table_id !== null &&
      table_id !== undefined &&
      table_id !== "" &&
      !isValidPositiveInteger(table_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid table ID.",
      });
    }

    if (
      employee_id !== null &&
      employee_id !== undefined &&
      employee_id !== "" &&
      !isValidPositiveInteger(employee_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID.",
      });
    }

    await connection.beginTransaction();

    const [restaurantRows]: any = await connection.query(
      `
      SELECT restaurant_id
      FROM restaurant
      WHERE restaurant_id = ?
      `,
      [restaurant_id],
    );

    if (restaurantRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    if (customer_id) {
      const [customerRows]: any = await connection.query(
        `
        SELECT customer_id
        FROM customer
        WHERE customer_id = ?
        `,
        [customer_id],
      );

      if (customerRows.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message: "Customer not found.",
        });
      }
    }

    if (employee_id) {
      const [employeeRows]: any = await connection.query(
        `
        SELECT employee_id, restaurant_id
        FROM employee
        WHERE employee_id = ?
        `,
        [employee_id],
      );

      if (employeeRows.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message: "Employee not found.",
        });
      }

      if (employeeRows[0].restaurant_id !== Number(restaurant_id)) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "Employee does not belong to the selected restaurant.",
        });
      }
    }

    if (table_id) {
      const [tableRows]: any = await connection.query(
        `
        SELECT table_id, restaurant_id
        FROM restaurant_tables
        WHERE table_id = ?
        `,
        [table_id],
      );

      if (tableRows.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message: "Table not found.",
        });
      }

      if (tableRows[0].restaurant_id !== Number(restaurant_id)) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "Table does not belong to the selected restaurant.",
        });
      }
    }

    const [result]: any = await connection.query(
      `
      INSERT INTO orders (
        customer_id,
        restaurant_id,
        table_id,
        employee_id,
        order_date,
        order_time,
        order_type,
        order_status,
        total_amount
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        customer_id || null,
        restaurant_id,
        table_id || null,
        employee_id || null,
        order_date,
        order_time,
        order_type,
        order_status,
        Number(total_amount),
      ],
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      data: {
        order_id: result.insertId,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error("Error creating order:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create order.",
    });
  } finally {
    connection.release();
  }
});

/**
 * PUT update order
 */
router.put("/:id", async (req: Request, res: Response) => {
  const connection = await pool.getConnection();

  try {
    const { id } = req.params;

    if (!isValidPositiveInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const {
      customer_id,
      restaurant_id,
      table_id,
      employee_id,
      order_date,
      order_time,
      order_type,
      order_status,
      total_amount,
    } = req.body;

    if (!isValidPositiveInteger(restaurant_id)) {
      return res.status(400).json({
        success: false,
        message: "A valid restaurant is required.",
      });
    }

    if (!isValidDate(order_date)) {
      return res.status(400).json({
        success: false,
        message: "A valid order date is required.",
      });
    }

    if (!isValidTime(order_time)) {
      return res.status(400).json({
        success: false,
        message: "A valid order time is required.",
      });
    }

    if (!VALID_ORDER_TYPES.includes(order_type)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order type.",
      });
    }

    if (!VALID_ORDER_STATUSES.includes(order_status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status.",
      });
    }

    if (!isValidNonNegativeNumber(total_amount)) {
      return res.status(400).json({
        success: false,
        message: "Total amount must be zero or greater.",
      });
    }

    if (
      customer_id !== null &&
      customer_id !== undefined &&
      customer_id !== "" &&
      !isValidPositiveInteger(customer_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });
    }

    if (
      table_id !== null &&
      table_id !== undefined &&
      table_id !== "" &&
      !isValidPositiveInteger(table_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid table ID.",
      });
    }

    if (
      employee_id !== null &&
      employee_id !== undefined &&
      employee_id !== "" &&
      !isValidPositiveInteger(employee_id)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid employee ID.",
      });
    }

    await connection.beginTransaction();

    const [existingRows]: any = await connection.query(
      `
      SELECT order_id
      FROM orders
      WHERE order_id = ?
      `,
      [id],
    );

    if (existingRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const [restaurantRows]: any = await connection.query(
      `
      SELECT restaurant_id
      FROM restaurant
      WHERE restaurant_id = ?
      `,
      [restaurant_id],
    );

    if (restaurantRows.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    if (customer_id) {
      const [customerRows]: any = await connection.query(
        `
        SELECT customer_id
        FROM customer
        WHERE customer_id = ?
        `,
        [customer_id],
      );

      if (customerRows.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message: "Customer not found.",
        });
      }
    }

    if (employee_id) {
      const [employeeRows]: any = await connection.query(
        `
        SELECT employee_id, restaurant_id
        FROM employee
        WHERE employee_id = ?
        `,
        [employee_id],
      );

      if (employeeRows.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message: "Employee not found.",
        });
      }

      if (employeeRows[0].restaurant_id !== Number(restaurant_id)) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "Employee does not belong to the selected restaurant.",
        });
      }
    }

    if (table_id) {
      const [tableRows]: any = await connection.query(
        `
        SELECT table_id, restaurant_id
        FROM restaurant_tables
        WHERE table_id = ?
        `,
        [table_id],
      );

      if (tableRows.length === 0) {
        await connection.rollback();

        return res.status(404).json({
          success: false,
          message: "Table not found.",
        });
      }

      if (tableRows[0].restaurant_id !== Number(restaurant_id)) {
        await connection.rollback();

        return res.status(400).json({
          success: false,
          message: "Table does not belong to the selected restaurant.",
        });
      }
    }

    await connection.query(
      `
      UPDATE orders
      SET
        customer_id = ?,
        restaurant_id = ?,
        table_id = ?,
        employee_id = ?,
        order_date = ?,
        order_time = ?,
        order_type = ?,
        order_status = ?,
        total_amount = ?
      WHERE order_id = ?
      `,
      [
        customer_id || null,
        restaurant_id,
        table_id || null,
        employee_id || null,
        order_date,
        order_time,
        order_type,
        order_status,
        Number(total_amount),
        id,
      ],
    );

    await connection.commit();

    return res.status(200).json({
      success: true,
      message: "Order updated successfully.",
    });
  } catch (error) {
    await connection.rollback();

    console.error("Error updating order:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update order.",
    });
  } finally {
    connection.release();
  }
});

/**
 * DELETE order
 */
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!isValidPositiveInteger(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const [orderRows]: any = await pool.query(
      `
      SELECT order_id
      FROM orders
      WHERE order_id = ?
      `,
      [id],
    );

    if (orderRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    const [itemRows]: any = await pool.query(
      `
      SELECT order_item_id
      FROM order_item
      WHERE order_id = ?
      LIMIT 1
      `,
      [id],
    );

    if (itemRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete an order that contains order items.",
      });
    }

    const [paymentRows]: any = await pool.query(
      `
      SELECT payment_id
      FROM payment
      WHERE order_id = ?
      LIMIT 1
      `,
      [id],
    );

    if (paymentRows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete an order that has payment records.",
      });
    }

    await pool.query(
      `
      DELETE FROM orders
      WHERE order_id = ?
      `,
      [id],
    );

    return res.status(200).json({
      success: true,
      message: "Order deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting order:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete order.",
    });
  }
});

export default router;