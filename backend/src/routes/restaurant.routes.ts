
import { Router } from "express";
import pool from "../config/database.js";

const router = Router();

/**
 * GET /api/restaurants
 * Retrieve all restaurants
 */
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        restaurant_id,
        restaurant_name,
        address,
        city,
        phone,
        opening_time,
        closing_time,
        created_at
      FROM restaurant
      ORDER BY restaurant_id DESC
      `
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching restaurants:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch restaurants.",
    });
  }
});

/**
 * POST /api/restaurants
 * Create a new restaurant
 */
router.post("/", async (req, res) => {
  try {
    const {
      restaurant_name,
      address,
      city,
      phone,
      opening_time,
      closing_time,
    } = req.body;

    if (
      !restaurant_name ||
      !address ||
      !city ||
      !phone ||
      !opening_time ||
      !closing_time
    ) {
      res.status(400).json({
        success: false,
        message: "All restaurant fields are required.",
      });

      return;
    }

    const [result] = await pool.execute(
      `
      INSERT INTO restaurant (
        restaurant_name,
        address,
        city,
        phone,
        opening_time,
        closing_time
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        restaurant_name,
        address,
        city,
        phone,
        opening_time,
        closing_time,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Restaurant created successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error creating restaurant:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create restaurant.",
    });
  }
});

/**
 * GET /api/restaurants/search
 * Search restaurants by name or city
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
        restaurant_id,
        restaurant_name,
        address,
        city,
        phone,
        opening_time,
        closing_time,
        created_at
      FROM restaurant
      WHERE restaurant_name LIKE ?
         OR city LIKE ?
      ORDER BY restaurant_id DESC
      `,
      [searchPattern, searchPattern]
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error searching restaurants:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search restaurants.",
    });
  }
});

/**
 * PUT /api/restaurants/:id
 * Update an existing restaurant
 */
router.put("/:id", async (req, res) => {
  try {
    const restaurantId = Number(req.params.id);

    const {
      restaurant_name,
      address,
      city,
      phone,
      opening_time,
      closing_time,
    } = req.body;

    if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid restaurant ID.",
      });

      return;
    }

    if (
      !restaurant_name ||
      !address ||
      !city ||
      !phone ||
      !opening_time ||
      !closing_time
    ) {
      res.status(400).json({
        success: false,
        message: "All restaurant fields are required.",
      });

      return;
    }

    if (opening_time >= closing_time) {
      res.status(400).json({
        success: false,
        message: "Closing time must be later than opening time.",
      });

      return;
    }

    const [result] = await pool.execute(
      `
      UPDATE restaurant
      SET
        restaurant_name = ?,
        address = ?,
        city = ?,
        phone = ?,
        opening_time = ?,
        closing_time = ?
      WHERE restaurant_id = ?
      `,
      [
        restaurant_name,
        address,
        city,
        phone,
        opening_time,
        closing_time,
        restaurantId,
      ]
    );

    const updateResult = result as {
      affectedRows: number;
    };

    if (updateResult.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Restaurant updated successfully.",
    });
  } catch (error) {
    console.error("Error updating restaurant:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update restaurant.",
    });
  }
});

/**
 * DELETE /api/restaurants/:id
 * Delete an existing restaurant
 */
router.delete("/:id", async (req, res) => {
  try {
    const restaurantId = Number(req.params.id);

    if (!Number.isInteger(restaurantId) || restaurantId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid restaurant ID.",
      });

      return;
    }

    const [result] = await pool.execute(
      `
      DELETE FROM restaurant
      WHERE restaurant_id = ?
      `,
      [restaurantId]
    );

    const deleteResult = result as {
      affectedRows: number;
    };

    if (deleteResult.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Restaurant deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting restaurant:", error);

    res.status(500).json({
      success: false,
      message:
        "Unable to delete restaurant. It may be referenced by other records.",
    });
  }
});

export default router;