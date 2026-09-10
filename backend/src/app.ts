import express from "express";
import cors from "cors";

import healthRoutes from "./routes/health.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import restaurantRoutes from "./routes/restaurant.routes.js";
import customerRoutes from "./routes/customer.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import menuItemRoutes from "./routes/menu-item.routes.js";
import tableRoutes from "./routes/table.routes.js";
import reservationRoutes from "./routes/reservation.routes.js";
import orderRoutes from "./routes/order.routes.js";
import orderItemRoutes from "./routes/order-item.routes.js";
import paymentRoutes from "./routes/payment.routes.js";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Restaurant Management System API is running.",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/menu-items", menuItemRoutes);
app.use("/api/tables", tableRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/order-items", orderItemRoutes);
app.use("/api/payments", paymentRoutes);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

export default app;