
import { Router, Request, Response } from "express";
import pool from "../config/database.js";

const router = Router();

const validStatuses = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

// GET all reservations
router.get("/", async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        r.reservation_id,
        r.customer_id,
        c.customer_name,
        r.table_id,
        rt.table_number,
        rt.restaurant_id,
        rest.restaurant_name,
        r.reservation_date,
        r.reservation_time,
        r.party_size,
        r.reservation_status
      FROM reservation r
      INNER JOIN customer c
        ON r.customer_id = c.customer_id
      INNER JOIN restaurant_tables rt
        ON r.table_id = rt.table_id
      INNER JOIN restaurant rest
        ON rt.restaurant_id = rest.restaurant_id
      ORDER BY r.reservation_date DESC, r.reservation_time DESC
    `);

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching reservations:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch reservations.",
    });
  }
});

// GET search reservations
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
        r.reservation_id,
        r.customer_id,
        c.customer_name,
        r.table_id,
        rt.table_number,
        rt.restaurant_id,
        rest.restaurant_name,
        r.reservation_date,
        r.reservation_time,
        r.party_size,
        r.reservation_status
      FROM reservation r
      INNER JOIN customer c
        ON r.customer_id = c.customer_id
      INNER JOIN restaurant_tables rt
        ON r.table_id = rt.table_id
      INNER JOIN restaurant rest
        ON rt.restaurant_id = rest.restaurant_id
      WHERE
        c.customer_name LIKE ?
        OR rest.restaurant_name LIKE ?
        OR CAST(rt.table_number AS CHAR) LIKE ?
        OR r.reservation_status LIKE ?
      ORDER BY r.reservation_date DESC, r.reservation_time DESC
      `,
      [searchTerm, searchTerm, searchTerm, searchTerm]
    );

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error searching reservations:", error);

    res.status(500).json({
      success: false,
      message: "Failed to search reservations.",
    });
  }
});

// POST create reservation
router.post("/", async (req: Request, res: Response) => {
  try {
    const {
      customer_id,
      table_id,
      reservation_date,
      reservation_time,
      party_size,
      reservation_status,
    } = req.body;

    if (
      customer_id === undefined ||
      table_id === undefined ||
      !reservation_date ||
      !reservation_time ||
      party_size === undefined
    ) {
      res.status(400).json({
        success: false,
        message:
          "Customer, table, date, time, and party size are required.",
      });
      return;
    }

    const customerId = Number(customer_id);
    const tableId = Number(table_id);
    const partySize = Number(party_size);
    const status = reservation_status || "pending";

    if (
      !Number.isInteger(customerId) ||
      customerId <= 0 ||
      !Number.isInteger(tableId) ||
      tableId <= 0 ||
      !Number.isInteger(partySize) ||
      partySize <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid customer, table, or party size.",
      });
      return;
    }

    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "Invalid reservation status.",
      });
      return;
    }

    // Verify customer
    const [customerRows]: any = await pool.query(
      `
      SELECT customer_id
      FROM customer
      WHERE customer_id = ?
      `,
      [customerId]
    );

    if (customerRows.length === 0) {
      res.status(400).json({
        success: false,
        message: "Selected customer does not exist.",
      });
      return;
    }

    // Verify table
    const [tableRows]: any = await pool.query(
      `
      SELECT table_id, capacity
      FROM restaurant_tables
      WHERE table_id = ?
      `,
      [tableId]
    );

    if (tableRows.length === 0) {
      res.status(400).json({
        success: false,
        message: "Selected table does not exist.",
      });
      return;
    }

    if (partySize > tableRows[0].capacity) {
      res.status(400).json({
        success: false,
        message: "Party size exceeds the selected table capacity.",
      });
      return;
    }

    // Check overlapping active reservation
    const [conflictRows]: any = await pool.query(
      `
      SELECT reservation_id
      FROM reservation
      WHERE table_id = ?
        AND reservation_date = ?
        AND reservation_time = ?
        AND reservation_status IN ('pending', 'confirmed')
      `,
      [tableId, reservation_date, reservation_time]
    );

    if (conflictRows.length > 0) {
      res.status(409).json({
        success: false,
        message:
          "This table is already reserved for the selected date and time.",
      });
      return;
    }

    const [result]: any = await pool.query(
      `
      INSERT INTO reservation
      (
        customer_id,
        table_id,
        reservation_date,
        reservation_time,
        party_size,
        reservation_status
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        customerId,
        tableId,
        reservation_date,
        reservation_time,
        partySize,
        status,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Reservation created successfully.",
      data: {
        reservation_id: result.insertId,
      },
    });
  } catch (error) {
    console.error("Error creating reservation:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create reservation.",
    });
  }
});

// PUT update reservation
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const reservationId = Number(req.params.id);

    if (!Number.isInteger(reservationId) || reservationId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid reservation ID.",
      });
      return;
    }

    const {
      customer_id,
      table_id,
      reservation_date,
      reservation_time,
      party_size,
      reservation_status,
    } = req.body;

    if (
      customer_id === undefined ||
      table_id === undefined ||
      !reservation_date ||
      !reservation_time ||
      party_size === undefined ||
      !reservation_status
    ) {
      res.status(400).json({
        success: false,
        message:
          "Customer, table, date, time, party size, and status are required.",
      });
      return;
    }

    const customerId = Number(customer_id);
    const tableId = Number(table_id);
    const partySize = Number(party_size);

    if (
      !Number.isInteger(customerId) ||
      customerId <= 0 ||
      !Number.isInteger(tableId) ||
      tableId <= 0 ||
      !Number.isInteger(partySize) ||
      partySize <= 0
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid customer, table, or party size.",
      });
      return;
    }

    if (!validStatuses.includes(reservation_status)) {
      res.status(400).json({
        success: false,
        message: "Invalid reservation status.",
      });
      return;
    }

    // Verify reservation
    const [existingRows]: any = await pool.query(
      `
      SELECT reservation_id
      FROM reservation
      WHERE reservation_id = ?
      `,
      [reservationId]
    );

    if (existingRows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
      return;
    }

    // Verify customer
    const [customerRows]: any = await pool.query(
      `
      SELECT customer_id
      FROM customer
      WHERE customer_id = ?
      `,
      [customerId]
    );

    if (customerRows.length === 0) {
      res.status(400).json({
        success: false,
        message: "Selected customer does not exist.",
      });
      return;
    }

    // Verify table and capacity
    const [tableRows]: any = await pool.query(
      `
      SELECT table_id, capacity
      FROM restaurant_tables
      WHERE table_id = ?
      `,
      [tableId]
    );

    if (tableRows.length === 0) {
      res.status(400).json({
        success: false,
        message: "Selected table does not exist.",
      });
      return;
    }

    if (partySize > tableRows[0].capacity) {
      res.status(400).json({
        success: false,
        message: "Party size exceeds the selected table capacity.",
      });
      return;
    }

    // Check conflicting reservation, excluding current record
    const [conflictRows]: any = await pool.query(
      `
      SELECT reservation_id
      FROM reservation
      WHERE table_id = ?
        AND reservation_date = ?
        AND reservation_time = ?
        AND reservation_id <> ?
        AND reservation_status IN ('pending', 'confirmed')
      `,
      [tableId, reservation_date, reservation_time, reservationId]
    );

    if (conflictRows.length > 0) {
      res.status(409).json({
        success: false,
        message:
          "This table is already reserved for the selected date and time.",
      });
      return;
    }

    await pool.query(
      `
      UPDATE reservation
      SET
        customer_id = ?,
        table_id = ?,
        reservation_date = ?,
        reservation_time = ?,
        party_size = ?,
        reservation_status = ?
      WHERE reservation_id = ?
      `,
      [
        customerId,
        tableId,
        reservation_date,
        reservation_time,
        partySize,
        reservation_status,
        reservationId,
      ]
    );

    res.json({
      success: true,
      message: "Reservation updated successfully.",
    });
  } catch (error) {
    console.error("Error updating reservation:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update reservation.",
    });
  }
});

// DELETE reservation
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const reservationId = Number(req.params.id);

    if (!Number.isInteger(reservationId) || reservationId <= 0) {
      res.status(400).json({
        success: false,
        message: "Invalid reservation ID.",
      });
      return;
    }

    const [existingRows]: any = await pool.query(
      `
      SELECT reservation_id
      FROM reservation
      WHERE reservation_id = ?
      `,
      [reservationId]
    );

    if (existingRows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Reservation not found.",
      });
      return;
    }

    await pool.query(
      `
      DELETE FROM reservation
      WHERE reservation_id = ?
      `,
      [reservationId]
    );

    res.json({
      success: true,
      message: "Reservation deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting reservation:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete reservation.",
    });
  }
});

export default router;