
import { Router, Request, Response } from "express";
import pool from "../config/database.js";

const router = Router();

// GET all menu items
router.get("/", async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        m.item_id,
        m.category_id,
        c.category_name,
        m.item_name,
        m.description,
        m.price,
        m.availability,
        m.preparation_time
      FROM menu_item m
      INNER JOIN category c
        ON m.category_id = c.category_id
      ORDER BY m.item_id DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching menu items:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch menu items.",
    });
  }
});

// GET menu items by search
router.get("/search", async (req: Request, res: Response) => {
  try {
    const search = String(req.query.q || "").trim();

    if (!search) {
      res.status(400).json({
        success: false,
        message: "Search query is required.",
      });
      return;
    }

    const searchTerm = `%${search}%`;

    const [rows] = await pool.query(
      `
      SELECT
        m.item_id,
        m.category_id,
        c.category_name,
        m.item_name,
        m.description,
        m.price,
        m.availability,
        m.preparation_time
      FROM menu_item m
      INNER JOIN category c
        ON m.category_id = c.category_id
      WHERE
        m.item_name LIKE ?
        OR m.description LIKE ?
        OR c.category_name LIKE ?
      ORDER BY m.item_id DESC
      `,
      [searchTerm, searchTerm, searchTerm]
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error searching menu items:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search menu items.",
    });
  }
});

// POST create a menu item
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      category_id,
      item_name,
      description,
      price,
      availability,
      preparation_time,
    } = req.body;

    if (
      category_id === undefined ||
      !item_name ||
      price === undefined ||
      availability === undefined ||
      preparation_time === undefined
    ) {
      res.status(400).json({
        success: false,
        message:
          "Category, item name, price, availability, and preparation time are required.",
      });
      return;
    }

    const categoryId = Number(category_id);
    const itemPrice = Number(price);
    const preparationTime = Number(preparation_time);

    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0 ||
      !Number.isFinite(itemPrice) ||
      itemPrice < 0 ||
      !Number.isInteger(preparationTime) ||
      preparationTime < 0
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid category, price, or preparation time.",
      });
      return;
    }

    if (typeof item_name !== "string" || !item_name.trim()) {
      res.status(400).json({
        success: false,
        message: "Item name must be a valid string.",
      });
      return;
    }

    if (typeof availability !== "boolean" && availability !== 0 && availability !== 1) {
      res.status(400).json({
        success: false,
        message: "Availability must be true or false.",
      });
      return;
    }

    const [categoryRows]: any = await pool.query(
      `
      SELECT category_id
      FROM category
      WHERE category_id = ?
      `,
      [categoryId]
    );

    if (categoryRows.length === 0) {
      res.status(400).json({
        success: false,
        message: "Selected category does not exist.",
      });
      return;
    }

    const [duplicateRows]: any = await pool.query(
      `
      SELECT item_id
      FROM menu_item
      WHERE item_name = ?
      `,
      [item_name.trim()]
    );

    if (duplicateRows.length > 0) {
      res.status(409).json({
        success: false,
        message: "A menu item with this name already exists.",
      });
      return;
    }

    const [result]: any = await pool.query(
      `
      INSERT INTO menu_item
      (
        category_id,
        item_name,
        description,
        price,
        availability,
        preparation_time
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        categoryId,
        item_name.trim(),
        description?.trim() || null,
        itemPrice,
        availability ? 1 : 0,
        preparationTime,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Menu item created successfully.",
      data: {
        item_id: result.insertId,
      },
    });
  } catch (error) {
    console.error("Error creating menu item:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create menu item.",
    });
  }
});

// PUT update a menu item
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.id);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid menu item ID.",
      });
      return;
    }

    const {
      category_id,
      item_name,
      description,
      price,
      availability,
      preparation_time,
    } = req.body;

    if (
      category_id === undefined ||
      !item_name ||
      price === undefined ||
      availability === undefined ||
      preparation_time === undefined
    ) {
      res.status(400).json({
        success: false,
        message:
          "Category, item name, price, availability, and preparation time are required.",
      });
      return;
    }

    const categoryId = Number(category_id);
    const itemPrice = Number(price);
    const preparationTime = Number(preparation_time);

    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0 ||
      !Number.isFinite(itemPrice) ||
      itemPrice < 0 ||
      !Number.isInteger(preparationTime) ||
      preparationTime < 0
    ) {
      res.status(400).json({
        success: false,
        message:
          "Invalid category, price, or preparation time.",
      });
      return;
    }

    if (typeof item_name !== "string" || !item_name.trim()) {
      res.status(400).json({
        success: false,
        message: "Item name must be a valid string.",
      });
      return;
    }

    if (typeof availability !== "boolean" && availability !== 0 && availability !== 1) {
      res.status(400).json({
        success: false,
        message: "Availability must be true or false.",
      });
      return;
    }

    const [existingRows]: any = await pool.query(
      `
      SELECT item_id
      FROM menu_item
      WHERE item_id = ?
      `,
      [itemId]
    );

    if (existingRows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
      return;
    }

    const [categoryRows]: any = await pool.query(
      `
      SELECT category_id
      FROM category
      WHERE category_id = ?
      `,
      [categoryId]
    );

    if (categoryRows.length === 0) {
      res.status(400).json({
        success: false,
        message: "Selected category does not exist.",
      });
      return;
    }

    const [duplicateRows]: any = await pool.query(
      `
      SELECT item_id
      FROM menu_item
      WHERE item_name = ?
        AND item_id <> ?
      `,
      [item_name.trim(), itemId]
    );

    if (duplicateRows.length > 0) {
      res.status(409).json({
        success: false,
        message: "A menu item with this name already exists.",
      });
      return;
    }

    await pool.query(
      `
      UPDATE menu_item
      SET
        category_id = ?,
        item_name = ?,
        description = ?,
        price = ?,
        availability = ?,
        preparation_time = ?
      WHERE item_id = ?
      `,
      [
        categoryId,
        item_name.trim(),
        description?.trim() || null,
        itemPrice,
        availability ? 1 : 0,
        preparationTime,
        itemId,
      ]
    );

    res.json({
      success: true,
      message: "Menu item updated successfully.",
    });
  } catch (error) {
    console.error("Error updating menu item:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update menu item.",
    });
  }
});

// DELETE a menu item
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.id);

    if (!Number.isInteger(itemId) || itemId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid menu item ID.",
      });
      return;
    }

    const [existingRows]: any = await pool.query(
      `
      SELECT item_id
      FROM menu_item
      WHERE item_id = ?
      `,
      [itemId]
    );

    if (existingRows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
      return;
    }

    const [orderItemRows]: any = await pool.query(
      `
      SELECT order_item_id
      FROM order_item
      WHERE item_id = ?
      LIMIT 1
      `,
      [itemId]
    );

    if (orderItemRows.length > 0) {
      res.status(409).json({
        success: false,
        message:
          "This menu item cannot be deleted because it is used in an order.",
      });
      return;
    }

    await pool.query(
      `
      DELETE FROM menu_item
      WHERE item_id = ?
      `,
      [itemId]
    );

    res.json({
      success: true,
      message: "Menu item deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting menu item:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete menu item.",
    });
  }
});

export default router;