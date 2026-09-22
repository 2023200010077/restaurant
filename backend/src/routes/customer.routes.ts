
import { Router } from "express";
import pool from "../config/database.js";

const router = Router();

/**
 * GET /api/customers
 * Retrieve all customers
 */
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        customer_id,
        customer_name,
        email,
        phone,
        address,
        registration_date
      FROM customer
      ORDER BY customer_id DESC
      `
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch customers.",
    });
  }
});

/**
 * POST /api/customers
 * Create a new customer
 */
router.post("/", async (req, res) => {
  try {
    const {
      customer_name,
      email,
      phone,
      address,
    } = req.body;

    if (
      !customer_name ||
      !email ||
      !phone ||
      !address
    ) {
      res.status(400).json({
        success: false,
        message: "All customer fields are required.",
      });

      return;
    }

    const [result] = await pool.execute(
      `
      INSERT INTO customer (
        customer_name,
        email,
        phone,
        address
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        customer_name.trim(),
        email.trim(),
        phone.trim(),
        address.trim(),
      ]
    );

    res.status(201).json({
      success: true,
      message: "Customer created successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error creating customer:", error);

    const databaseError = error as {
      code?: string;
    };

    if (databaseError.code === "ER_DUP_ENTRY") {
      res.status(409).json({
        success: false,
        message: "A customer with this email already exists.",
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to create customer.",
    });
  }
});

/**
 * GET /api/customers/search
 * Search customers by name, email, or phone
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
        customer_id,
        customer_name,
        email,
        phone,
        address,
        registration_date
      FROM customer
      WHERE customer_name LIKE ?
         OR email LIKE ?
         OR phone LIKE ?
      ORDER BY customer_id DESC
      `,
      [
        searchPattern,
        searchPattern,
        searchPattern,
      ]
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error searching customers:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search customers.",
    });
  }
});

/**
 * PUT /api/customers/:id
 * Update an existing customer
 */
router.put("/:id", async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });

      return;
    }

    const {
      customer_name,
      email,
      phone,
      address,
    } = req.body;

    if (!customer_name || !email || !phone || !address) {
      res.status(400).json({
        success: false,
        message: "All customer fields are required.",
      });

      return;
    }

    const [result] = await pool.execute(
      `
      UPDATE customer
      SET
        customer_name = ?,
        email = ?,
        phone = ?,
        address = ?
      WHERE customer_id = ?
      `,
      [
        customer_name.trim(),
        email.trim(),
        phone.trim(),
        address.trim(),
        customerId,
      ],
    );

    const updateResult = result as {
      affectedRows: number;
    };

    if (updateResult.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: "Customer not found.",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Customer updated successfully.",
    });
  } catch (error) {
    console.error("Error updating customer:", error);

    const databaseError = error as {
      code?: string;
    };

    if (databaseError.code === "ER_DUP_ENTRY") {
      res.status(409).json({
        success: false,
        message: "A customer with this email already exists.",
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to update customer.",
    });
  }
});

/**
 * DELETE /api/customers/:id
 * Delete an existing customer
 */
router.delete("/:id", async (req, res) => {
  try {
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId) || customerId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid customer ID.",
      });

      return;
    }

    const [result] = await pool.execute(
      `
      DELETE FROM customer
      WHERE customer_id = ?
      `,
      [customerId],
    );

    const deleteResult = result as {
      affectedRows: number;
    };

    if (deleteResult.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: "Customer not found.",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Customer deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);

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
          "This customer cannot be deleted because related records exist.",
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete customer.",
    });
  }
});

export default router;