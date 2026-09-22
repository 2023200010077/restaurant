
import { Router, Request, Response } from "express";
import pool from "../config/database.js";

const router = Router();

// GET all order items
router.get("/", async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        oi.order_item_id,
        oi.order_id,
        oi.item_id,
        oi.quantity,
        oi.unit_price,
        oi.subtotal,
        mi.item_name,
        o.restaurant_id,
        r.restaurant_name
      FROM order_item oi
      INNER JOIN menu_item mi
        ON oi.item_id = mi.item_id
      INNER JOIN orders o
        ON oi.order_id = o.order_id
      INNER JOIN restaurant r
        ON o.restaurant_id = r.restaurant_id
      ORDER BY oi.order_item_id DESC
      `
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching order items:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch order items.",
    });
  }
});

// SEARCH order items
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
        oi.order_item_id,
        oi.order_id,
        oi.item_id,
        oi.quantity,
        oi.unit_price,
        oi.subtotal,
        mi.item_name,
        r.restaurant_name
      FROM order_item oi
      INNER JOIN menu_item mi
        ON oi.item_id = mi.item_id
      INNER JOIN orders o
        ON oi.order_id = o.order_id
      INNER JOIN restaurant r
        ON o.restaurant_id = r.restaurant_id
      WHERE
        CAST(oi.order_item_id AS CHAR) LIKE ?
        OR CAST(oi.order_id AS CHAR) LIKE ?
        OR mi.item_name LIKE ?
        OR r.restaurant_name LIKE ?
      ORDER BY oi.order_item_id DESC
      `,
      [searchValue, searchValue, searchValue, searchValue]
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error searching order items:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search order items.",
    });
  }
});

// CREATE an order item
router.post("/", async (req: Request, res: Response) => {
  const connection = await pool.getConnection();

  try {
    const {
      order_id,
      item_id,
      quantity,
      unit_price,
    } = req.body;

    const orderId = Number(order_id);
    const itemId = Number(item_id);
    const itemQuantity = Number(quantity);
    const itemUnitPrice = Number(unit_price);

    if (
      !Number.isInteger(orderId) ||
      orderId <= 0 ||
      !Number.isInteger(itemId) ||
      itemId <= 0 ||
      !Number.isInteger(itemQuantity) ||
      itemQuantity <= 0 ||
      !Number.isFinite(itemUnitPrice) ||
      itemUnitPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid order ID, item ID, positive quantity, and nonnegative unit price are required.",
      });
    }

    await connection.beginTransaction();

    // Check whether the order exists
    const [orderRows] = await connection.query(
      `
      SELECT order_id
      FROM orders
      WHERE order_id = ?
      `,
      [orderId]
    );

    const orders = orderRows as { order_id: number }[];

    if (orders.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Check whether the menu item exists
    const [itemRows] = await connection.query(
      `
      SELECT item_id, price, availability
      FROM menu_item
      WHERE item_id = ?
      `,
      [itemId]
    );

    const menuItems = itemRows as {
      item_id: number;
      price: number;
      availability: number | boolean;
    }[];

    if (menuItems.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }

    if (!Boolean(menuItems[0].availability)) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "This menu item is currently unavailable.",
      });
    }

    const subtotal = Number(
      (itemQuantity * itemUnitPrice).toFixed(2)
    );

    const [result] = await connection.query(
      `
      INSERT INTO order_item
        (order_id, item_id, quantity, unit_price, subtotal)
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        orderId,
        itemId,
        itemQuantity,
        itemUnitPrice,
        subtotal,
      ]
    );

    await connection.commit();

    const insertResult = result as { insertId: number };

    res.status(201).json({
      success: true,
      message: "Order item created successfully.",
      data: {
        order_item_id: insertResult.insertId,
        order_id: orderId,
        item_id: itemId,
        quantity: itemQuantity,
        unit_price: itemUnitPrice,
        subtotal,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error("Error creating order item:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create order item.",
    });
  } finally {
    connection.release();
  }
});

// UPDATE an order item
router.put("/:id", async (req: Request, res: Response) => {
  const connection = await pool.getConnection();

  try {
    const orderItemId = Number(req.params.id);

    const {
      order_id,
      item_id,
      quantity,
      unit_price,
    } = req.body;

    const orderId = Number(order_id);
    const itemId = Number(item_id);
    const itemQuantity = Number(quantity);
    const itemUnitPrice = Number(unit_price);

    if (
      !Number.isInteger(orderItemId) ||
      orderItemId <= 0 ||
      !Number.isInteger(orderId) ||
      orderId <= 0 ||
      !Number.isInteger(itemId) ||
      itemId <= 0 ||
      !Number.isInteger(itemQuantity) ||
      itemQuantity <= 0 ||
      !Number.isFinite(itemUnitPrice) ||
      itemUnitPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid order item ID, order ID, item ID, positive quantity, and nonnegative unit price are required.",
      });
    }

    await connection.beginTransaction();

    // Check whether the order item exists
    const [existingRows] = await connection.query(
      `
      SELECT order_item_id
      FROM order_item
      WHERE order_item_id = ?
      `,
      [orderItemId]
    );

    const existingItems = existingRows as {
      order_item_id: number;
    }[];

    if (existingItems.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Order item not found.",
      });
    }

    // Check whether the order exists
    const [orderRows] = await connection.query(
      `
      SELECT order_id
      FROM orders
      WHERE order_id = ?
      `,
      [orderId]
    );

    const orders = orderRows as { order_id: number }[];

    if (orders.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Check whether the menu item exists
    const [itemRows] = await connection.query(
      `
      SELECT item_id, availability
      FROM menu_item
      WHERE item_id = ?
      `,
      [itemId]
    );

    const menuItems = itemRows as {
      item_id: number;
      availability: number | boolean;
    }[];

    if (menuItems.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }

    if (!Boolean(menuItems[0].availability)) {
      await connection.rollback();

      return res.status(400).json({
        success: false,
        message: "This menu item is currently unavailable.",
      });
    }

    const subtotal = Number(
      (itemQuantity * itemUnitPrice).toFixed(2)
    );

    await connection.query(
      `
      UPDATE order_item
      SET
        order_id = ?,
        item_id = ?,
        quantity = ?,
        unit_price = ?,
        subtotal = ?
      WHERE order_item_id = ?
      `,
      [
        orderId,
        itemId,
        itemQuantity,
        itemUnitPrice,
        subtotal,
        orderItemId,
      ]
    );

    await connection.commit();

    res.status(200).json({
      success: true,
      message: "Order item updated successfully.",
      data: {
        order_item_id: orderItemId,
        order_id: orderId,
        item_id: itemId,
        quantity: itemQuantity,
        unit_price: itemUnitPrice,
        subtotal,
      },
    });
  } catch (error) {
    await connection.rollback();

    console.error("Error updating order item:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update order item.",
    });
  } finally {
    connection.release();
  }
});

// DELETE an order item
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const orderItemId = Number(req.params.id);

    if (!Number.isInteger(orderItemId) || orderItemId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid order item ID is required.",
      });
    }

    const [existingRows] = await pool.query(
      `
      SELECT order_item_id
      FROM order_item
      WHERE order_item_id = ?
      `,
      [orderItemId]
    );

    const existingItems = existingRows as {
      order_item_id: number;
    }[];

    if (existingItems.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Order item not found.",
      });
    }

    await pool.query(
      `
      DELETE FROM order_item
      WHERE order_item_id = ?
      `,
      [orderItemId]
    );

    res.status(200).json({
      success: true,
      message: "Order item deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting order item:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete order item.",
    });
  }
});

export default router;