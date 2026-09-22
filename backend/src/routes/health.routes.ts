import { Router } from "express";
import pool from "../config/database.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    res.status(200).json({
      success: true,
      message: "Backend and database are working.",
    });
  } catch (error) {
    console.error("Health check error:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed.",
    });
  }
});

export default router;