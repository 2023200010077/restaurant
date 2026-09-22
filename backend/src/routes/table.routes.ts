
import { Router, Request, Response } from "express";
import pool from "../config/database.js";

const router = Router();

const VALID_TABLE_STATUSES = [
  "available",
  "occupied",
  "reserved",
  "maintenance",
];

function isValidPositiveInteger(value: unknown): boolean {
  return (
    Number.isInteger(Number(value)) &&
    Number(value) > 0
  );
}

// GET all tables
router.get("/", async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        rt.table_id,
        rt.restaurant_id,
        r.restaurant_name,
        rt.table_number,
        rt.capacity,
        rt.table_status
      FROM restaurant_tables rt
      INNER JOIN restaurant r
        ON rt.restaurant_id = r.restaurant_id
      ORDER BY rt.restaurant_id, rt.table_number
    `);

    return res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Get tables error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to fetch tables.",
    });
  }
});

// GET tables by search
router.get(
  "/search",
  async (req: Request, res: Response) => {
    try {
      const query = String(req.query.q ?? "").trim();

      if (!query) {
        const [rows] = await pool.query(`
          SELECT
            rt.table_id,
            rt.restaurant_id,
            r.restaurant_name,
            rt.table_number,
            rt.capacity,
            rt.table_status
          FROM restaurant_tables rt
          INNER JOIN restaurant r
            ON rt.restaurant_id = r.restaurant_id
          ORDER BY rt.restaurant_id, rt.table_number
        `);

        return res.status(200).json({
          success: true,
          data: rows,
        });
      }

      const searchValue = `%${query}%`;

      const [rows] = await pool.query(
        `
          SELECT
            rt.table_id,
            rt.restaurant_id,
            r.restaurant_name,
            rt.table_number,
            rt.capacity,
            rt.table_status
          FROM restaurant_tables rt
          INNER JOIN restaurant r
            ON rt.restaurant_id = r.restaurant_id
          WHERE
            r.restaurant_name LIKE ?
            OR CAST(rt.table_number AS CHAR) LIKE ?
            OR CAST(rt.capacity AS CHAR) LIKE ?
            OR rt.table_status LIKE ?
          ORDER BY rt.restaurant_id, rt.table_number
        `,
        [
          searchValue,
          searchValue,
          searchValue,
          searchValue,
        ],
      );

      return res.status(200).json({
        success: true,
        data: rows,
      });
    } catch (error) {
      console.error("Search tables error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to search tables.",
      });
    }
  },
);

// POST add table
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      restaurant_id,
      table_number,
      capacity,
      table_status = "available",
    } = req.body;

    if (
      !isValidPositiveInteger(restaurant_id) ||
      !isValidPositiveInteger(table_number) ||
      !isValidPositiveInteger(capacity)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Restaurant ID, table number, and capacity must be positive integers.",
      });
    }

    if (!VALID_TABLE_STATUSES.includes(table_status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid table status.",
      });
    }

    const [restaurantRows] = await pool.query(
      `
        SELECT restaurant_id
        FROM restaurant
        WHERE restaurant_id = ?
      `,
      [restaurant_id],
    );

    const restaurants = restaurantRows as {
      restaurant_id: number;
    }[];

    if (restaurants.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    const [existingRows] = await pool.query(
      `
        SELECT table_id
        FROM restaurant_tables
        WHERE restaurant_id = ?
          AND table_number = ?
      `,
      [restaurant_id, table_number],
    );

    const existingTables = existingRows as {
      table_id: number;
    }[];

    if (existingTables.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This table number already exists in the selected restaurant.",
      });
    }

    const [result] = await pool.query(
      `
        INSERT INTO restaurant_tables
          (
            restaurant_id,
            table_number,
            capacity,
            table_status
          )
        VALUES (?, ?, ?, ?)
      `,
      [
        restaurant_id,
        table_number,
        capacity,
        table_status,
      ],
    );

    const insertResult = result as {
      insertId: number;
    };

    return res.status(201).json({
      success: true,
      message: "Table added successfully.",
      data: {
        table_id: insertResult.insertId,
      },
    });
  } catch (error) {
    console.error("Add table error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to add table.",
    });
  }
});

// PUT update table
router.put(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const tableId = Number(req.params.id);

      const {
        restaurant_id,
        table_number,
        capacity,
        table_status,
      } = req.body;

      if (!isValidPositiveInteger(tableId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid table ID.",
        });
      }

      if (
        !isValidPositiveInteger(restaurant_id) ||
        !isValidPositiveInteger(table_number) ||
        !isValidPositiveInteger(capacity)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Restaurant ID, table number, and capacity must be positive integers.",
        });
      }

      if (!VALID_TABLE_STATUSES.includes(table_status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid table status.",
        });
      }

      const [tableRows] = await pool.query(
        `
          SELECT table_id
          FROM restaurant_tables
          WHERE table_id = ?
        `,
        [tableId],
      );

      const existingTableRows = tableRows as {
        table_id: number;
      }[];

      if (existingTableRows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Table not found.",
        });
      }

      const [restaurantRows] = await pool.query(
        `
          SELECT restaurant_id
          FROM restaurant
          WHERE restaurant_id = ?
        `,
        [restaurant_id],
      );

      const restaurants = restaurantRows as {
        restaurant_id: number;
      }[];

      if (restaurants.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Restaurant not found.",
        });
      }

      const [duplicateRows] = await pool.query(
        `
          SELECT table_id
          FROM restaurant_tables
          WHERE restaurant_id = ?
            AND table_number = ?
            AND table_id <> ?
        `,
        [
          restaurant_id,
          table_number,
          tableId,
        ],
      );

      const duplicateTables = duplicateRows as {
        table_id: number;
      }[];

      if (duplicateTables.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "This table number already exists in the selected restaurant.",
        });
      }

      await pool.query(
        `
          UPDATE restaurant_tables
          SET
            restaurant_id = ?,
            table_number = ?,
            capacity = ?,
            table_status = ?
          WHERE table_id = ?
        `,
        [
          restaurant_id,
          table_number,
          capacity,
          table_status,
          tableId,
        ],
      );

      return res.status(200).json({
        success: true,
        message: "Table updated successfully.",
      });
    } catch (error) {
      console.error("Update table error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to update table.",
      });
    }
  },
);

// DELETE table
router.delete(
  "/:id",
  async (req: Request, res: Response) => {
    try {
      const tableId = Number(req.params.id);

      if (!isValidPositiveInteger(tableId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid table ID.",
        });
      }

      const [tableRows] = await pool.query(
        `
          SELECT table_id
          FROM restaurant_tables
          WHERE table_id = ?
        `,
        [tableId],
      );

      const existingTables = tableRows as {
        table_id: number;
      }[];

      if (existingTables.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Table not found.",
        });
      }

      const [reservationRows] = await pool.query(
        `
          SELECT reservation_id
          FROM reservation
          WHERE table_id = ?
          LIMIT 1
        `,
        [tableId],
      );

      const reservations = reservationRows as {
        reservation_id: number;
      }[];

      if (reservations.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "Cannot delete this table because it is used in a reservation.",
        });
      }

      const [orderRows] = await pool.query(
        `
          SELECT order_id
          FROM orders
          WHERE table_id = ?
          LIMIT 1
        `,
        [tableId],
      );

      const orders = orderRows as {
        order_id: number;
      }[];

      if (orders.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "Cannot delete this table because it is used in an order.",
        });
      }

      await pool.query(
        `
          DELETE FROM restaurant_tables
          WHERE table_id = ?
        `,
        [tableId],
      );

      return res.status(200).json({
        success: true,
        message: "Table deleted successfully.",
      });
    } catch (error) {
      console.error("Delete table error:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to delete table.",
      });
    }
  },
);

export default router;