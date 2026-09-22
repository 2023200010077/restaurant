import { Router } from "express";
import pool from "../config/database.js";

const router = Router();

/**
 * GET /api/categories
 * Get all categories
 */
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        category_id,
        category_name,
        description
      FROM category
      ORDER BY category_id DESC
    `);

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load categories.",
    });
  }
});

/**
 * POST /api/categories
 * Create a new category
 */
router.post("/", async (req, res) => {
  try {
    const { category_name, description } = req.body;

    const categoryName = String(category_name || "").trim();
    const categoryDescription = String(
      description || "",
    ).trim();

    if (!categoryName) {
      res.status(400).json({
        success: false,
        message: "Category name is required.",
      });

      return;
    }

    if (categoryName.length > 100) {
      res.status(400).json({
        success: false,
        message:
          "Category name must not exceed 100 characters.",
      });

      return;
    }

    const [existingRows] = await pool.execute(
      `
      SELECT category_id
      FROM category
      WHERE category_name = ?
      `,
      [categoryName],
    );

    const existingCategories = existingRows as {
      category_id: number;
    }[];

    if (existingCategories.length > 0) {
      res.status(409).json({
        success: false,
        message: "This category already exists.",
      });

      return;
    }

    const [result] = await pool.execute(
      `
      INSERT INTO category (
        category_name,
        description
      )
      VALUES (?, ?)
      `,
      [
        categoryName,
        categoryDescription || null,
      ],
    );

    const insertResult = result as {
      insertId: number;
    };

    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: {
        category_id: insertResult.insertId,
      },
    });
  } catch (error) {
    console.error("Error creating category:", error);

    const databaseError = error as {
      code?: string;
    };

    if (databaseError.code === "ER_DUP_ENTRY") {
      res.status(409).json({
        success: false,
        message: "This category already exists.",
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to create category.",
    });
  }
});

/**
 * GET /api/categories/search?q=
 * Search categories
 *
 * IMPORTANT:
 * This route is placed before /:id.
 */
router.get("/search", async (req, res) => {
  try {
    const searchTerm = String(req.query.q || "").trim();

    if (!searchTerm) {
      res.status(400).json({
        success: false,
        message: "Search term is required.",
      });

      return;
    }

    const searchPattern = `%${searchTerm}%`;

    const [rows] = await pool.execute(
      `
      SELECT
        category_id,
        category_name,
        description
      FROM category
      WHERE
        category_name LIKE ?
        OR description LIKE ?
      ORDER BY category_id DESC
      `,
      [
        searchPattern,
        searchPattern,
      ],
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error searching categories:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search categories.",
    });
  }
});

/**
 * PUT /api/categories/:id
 * Update a category
 */
router.put("/:id", async (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });

      return;
    }

    const { category_name, description } = req.body;

    const categoryName = String(category_name || "").trim();
    const categoryDescription = String(
      description || "",
    ).trim();

    if (!categoryName) {
      res.status(400).json({
        success: false,
        message: "Category name is required.",
      });

      return;
    }

    if (categoryName.length > 100) {
      res.status(400).json({
        success: false,
        message:
          "Category name must not exceed 100 characters.",
      });

      return;
    }

    const [existingRows] = await pool.execute(
      `
      SELECT category_id
      FROM category
      WHERE category_name = ?
        AND category_id != ?
      `,
      [
        categoryName,
        categoryId,
      ],
    );

    const existingCategories = existingRows as {
      category_id: number;
    }[];

    if (existingCategories.length > 0) {
      res.status(409).json({
        success: false,
        message: "This category already exists.",
      });

      return;
    }

    const [result] = await pool.execute(
      `
      UPDATE category
      SET
        category_name = ?,
        description = ?
      WHERE category_id = ?
      `,
      [
        categoryName,
        categoryDescription || null,
        categoryId,
      ],
    );

    const updateResult = result as {
      affectedRows: number;
    };

    if (updateResult.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: "Category not found.",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Category updated successfully.",
    });
  } catch (error) {
    console.error("Error updating category:", error);

    const databaseError = error as {
      code?: string;
    };

    if (databaseError.code === "ER_DUP_ENTRY") {
      res.status(409).json({
        success: false,
        message: "This category already exists.",
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to update category.",
    });
  }
});

/**
 * DELETE /api/categories/:id
 * Delete a category
 */
router.delete("/:id", async (req, res) => {
  try {
    const categoryId = Number(req.params.id);

    if (
      !Number.isInteger(categoryId) ||
      categoryId <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid category ID.",
      });

      return;
    }

    const [result] = await pool.execute(
      `
      DELETE FROM category
      WHERE category_id = ?
      `,
      [categoryId],
    );

    const deleteResult = result as {
      affectedRows: number;
    };

    if (deleteResult.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: "Category not found.",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Category deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting category:", error);

    const databaseError = error as {
      code?: string;
    };

    if (
      databaseError.code === "ER_ROW_IS_REFERENCED_2" ||
      databaseError.code === "ER_ROW_IS_REFERENCED"
    ) {
      res.status(409).json({
        success: false,
        message:
          "This category cannot be deleted because menu items are associated with it.",
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete category.",
    });
  }
});

export default router;