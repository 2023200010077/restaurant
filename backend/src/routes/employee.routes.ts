
import { Router } from "express";
import pool from "../config/database.js";

const router = Router();

/**
 * GET /api/employees
 * Retrieve all employees with restaurant information
 */
router.get("/", async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `
      SELECT
        e.employee_id,
        e.restaurant_id,
        r.restaurant_name,
        e.employee_name,
        e.designation,
        e.phone,
        e.salary
      FROM employee e
      INNER JOIN restaurant r
        ON e.restaurant_id = r.restaurant_id
      ORDER BY e.employee_id DESC
      `,
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch employees.",
    });
  }
});

/**
 * POST /api/employees
 * Create a new employee
 */
router.post("/", async (req, res) => {
  try {
    const {
      restaurant_id,
      employee_name,
      designation,
      phone,
      salary,
    } = req.body;

    const restaurantId = Number(restaurant_id);
    const employeeSalary = Number(salary);

    if (
      !Number.isInteger(restaurantId) ||
      restaurantId <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "A valid restaurant is required.",
      });

      return;
    }

    if (
      !employee_name ||
      !designation ||
      !phone ||
      salary === undefined ||
      salary === null ||
      salary === ""
    ) {
      res.status(400).json({
        success: false,
        message: "All employee fields are required.",
      });

      return;
    }

    if (
      !Number.isFinite(employeeSalary) ||
      employeeSalary < 0
    ) {
      res.status(400).json({
        success: false,
        message: "Salary must be a valid non-negative number.",
      });

      return;
    }

    const [restaurantRows] = await pool.execute(
      `
      SELECT restaurant_id
      FROM restaurant
      WHERE restaurant_id = ?
      `,
      [restaurantId],
    );

    const restaurants = restaurantRows as {
      restaurant_id: number;
    }[];

    if (restaurants.length === 0) {
      res.status(404).json({
        success: false,
        message: "Selected restaurant does not exist.",
      });

      return;
    }

    const [result] = await pool.execute(
      `
      INSERT INTO employee (
        restaurant_id,
        employee_name,
        designation,
        phone,
        salary
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        restaurantId,
        employee_name.trim(),
        designation.trim(),
        phone.trim(),
        employeeSalary,
      ],
    );

    res.status(201).json({
      success: true,
      message: "Employee created successfully.",
      data: result,
    });
  } catch (error) {
    console.error("Error creating employee:", error);

    const databaseError = error as {
      code?: string;
    };

    if (databaseError.code === "ER_NO_REFERENCED_ROW_2") {
      res.status(400).json({
        success: false,
        message: "Selected restaurant does not exist.",
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to create employee.",
    });
  }
});

/**
 * GET /api/employees/search
 * Search employees by name, designation, or phone
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
        e.employee_id,
        e.restaurant_id,
        r.restaurant_name,
        e.employee_name,
        e.designation,
        e.phone,
        e.salary
      FROM employee e
      INNER JOIN restaurant r
        ON e.restaurant_id = r.restaurant_id
      WHERE e.employee_name LIKE ?
         OR e.designation LIKE ?
         OR e.phone LIKE ?
         OR r.restaurant_name LIKE ?
      ORDER BY e.employee_id DESC
      `,
      [
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
      ],
    );

    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error searching employees:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search employees.",
    });
  }
});

/**
 * PUT /api/employees/:id
 * Update an existing employee
 */
router.put("/:id", async (req, res) => {
  try {
    const employeeId = Number(req.params.id);

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid employee ID.",
      });

      return;
    }

    const {
      restaurant_id,
      employee_name,
      designation,
      phone,
      salary,
    } = req.body;

    const restaurantId = Number(restaurant_id);
    const employeeSalary = Number(salary);

    if (
      !Number.isInteger(restaurantId) ||
      restaurantId <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "A valid restaurant is required.",
      });

      return;
    }

    if (
      !employee_name ||
      !designation ||
      !phone ||
      salary === undefined ||
      salary === null ||
      salary === ""
    ) {
      res.status(400).json({
        success: false,
        message: "All employee fields are required.",
      });

      return;
    }

    if (
      !Number.isFinite(employeeSalary) ||
      employeeSalary < 0
    ) {
      res.status(400).json({
        success: false,
        message: "Salary must be a valid non-negative number.",
      });

      return;
    }

    const [restaurantRows] = await pool.execute(
      `
      SELECT restaurant_id
      FROM restaurant
      WHERE restaurant_id = ?
      `,
      [restaurantId],
    );

    const restaurants = restaurantRows as {
      restaurant_id: number;
    }[];

    if (restaurants.length === 0) {
      res.status(404).json({
        success: false,
        message: "Selected restaurant does not exist.",
      });

      return;
    }

    const [result] = await pool.execute(
      `
      UPDATE employee
      SET
        restaurant_id = ?,
        employee_name = ?,
        designation = ?,
        phone = ?,
        salary = ?
      WHERE employee_id = ?
      `,
      [
        restaurantId,
        employee_name.trim(),
        designation.trim(),
        phone.trim(),
        employeeSalary,
        employeeId,
      ],
    );

    const updateResult = result as {
      affectedRows: number;
    };

    if (updateResult.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: "Employee not found.",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Employee updated successfully.",
    });
  } catch (error) {
    console.error("Error updating employee:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update employee.",
    });
  }
});

/**
 * DELETE /api/employees/:id
 * Delete an existing employee
 */
router.delete("/:id", async (req, res) => {
  try {
    const employeeId = Number(req.params.id);

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid employee ID.",
      });

      return;
    }

    const [result] = await pool.execute(
      `
      DELETE FROM employee
      WHERE employee_id = ?
      `,
      [employeeId],
    );

    const deleteResult = result as {
      affectedRows: number;
    };

    if (deleteResult.affectedRows === 0) {
      res.status(404).json({
        success: false,
        message: "Employee not found.",
      });

      return;
    }

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting employee:", error);

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
          "This employee cannot be deleted because related records exist.",
      });

      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete employee.",
    });
  }
});

export default router;