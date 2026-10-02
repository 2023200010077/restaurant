
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../api/client";

import type {
  Order,
  OrderStatus,
  OrderType,
} from "../types/order";

// ============================================================
// TYPES
// ============================================================

interface Customer {
  customer_id: number;
  customer_name: string;
}

interface Restaurant {
  restaurant_id: number;
  restaurant_name: string;
}

interface RestaurantTable {
  table_id: number;
  restaurant_id: number;
  table_number: number;
}

interface Employee {
  employee_id: number;
  restaurant_id: number;
  employee_name: string;
}

interface OrderFormData {
  customer_id: number;
  restaurant_id: number;
  table_id: number | null;
  employee_id: number | null;
  order_date: string;
  order_time: string;
  order_type: OrderType;
  order_status: OrderStatus;
  total_amount: number;
}

// ============================================================
// CONSTANTS
// ============================================================

const ORDER_TYPES: OrderType[] = [
  "dine_in",
  "takeaway",
  "delivery",
];

const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

// ============================================================
// PAGE STATE
// ============================================================

let orders: Order[] = [];
let customers: Customer[] = [];
let restaurants: Restaurant[] = [];
let restaurantTables: RestaurantTable[] = [];
let employees: Employee[] = [];

let editingOrderId: number | null = null;

// ============================================================
// PAGE HELPERS
// ============================================================

function getPageContent(): HTMLElement {
  const pageContent =
    document.querySelector<HTMLElement>("#page-content");

  if (!pageContent) {
    throw new Error("Page content container not found.");
  }

  return pageContent;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

function formatDate(value: unknown): string {
  const date = String(value ?? "");

  if (!date) {
    return "-";
  }

  return date.includes("T")
    ? date.split("T")[0]
    : date;
}

function formatTime(value: unknown): string {
  const time = String(value ?? "");

  return time.length >= 5
    ? time.substring(0, 5)
    : time || "-";
}

function formatOrderType(value: unknown): string {
  const type = String(value ?? "");

  return type
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ");
}

function formatCurrency(value: unknown): string {
  const amount = Number(value ?? 0);

  if (!Number.isFinite(amount)) {
    return "0.00";
  }

  return amount.toFixed(2);
}

// ============================================================
// MESSAGE HELPERS
// ============================================================

function showMessage(
  message: string,
  type: "success" | "error",
): void {
  const messageElement =
    document.querySelector<HTMLParagraphElement>(
      "#order-page-message",
    );

  if (!messageElement) {
    return;
  }

  messageElement.textContent = message;

  messageElement.className =
    type === "success"
      ? "mb-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"
      : "mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700";
}

function clearMessage(): void {
  const messageElement =
    document.querySelector<HTMLParagraphElement>(
      "#order-page-message",
    );

  if (!messageElement) {
    return;
  }

  messageElement.textContent = "";
  messageElement.className = "mb-4 text-sm";
}

function showFormMessage(
  element: HTMLParagraphElement | null,
  message: string,
  type: "success" | "error" | "loading",
): void {
  if (!element) {
    return;
  }

  element.textContent = message;

  element.className =
    type === "success"
      ? "text-sm text-green-600"
      : type === "error"
        ? "text-sm text-red-600"
        : "text-sm text-gray-500";
}

// ============================================================
// BUTTON AND INPUT STYLES
// ============================================================

const primaryButtonClass = `
  inline-flex items-center justify-center gap-2
  rounded-lg bg-blue-600 px-5 py-2.5
  text-sm font-medium text-white
  transition hover:bg-blue-700
  focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-blue-500
  focus-visible:ring-offset-2
  disabled:cursor-not-allowed disabled:opacity-60
`;

const secondaryButtonClass = `
  inline-flex items-center justify-center gap-2
  rounded-lg border border-gray-300
  px-5 py-2.5 text-sm font-medium text-gray-700
  transition hover:bg-gray-100
  focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-blue-500
  focus-visible:ring-offset-2
`;

const editButtonClass = `
  inline-flex items-center justify-center gap-1.5
  rounded-lg bg-blue-100 px-3 py-2
  text-xs font-medium text-blue-700
  transition hover:bg-blue-200
  focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-blue-500
  focus-visible:ring-offset-2
`;

const deleteButtonClass = `
  inline-flex items-center justify-center gap-1.5
  rounded-lg bg-red-100 px-3 py-2
  text-xs font-medium text-red-700
  transition hover:bg-red-200
  focus-visible:outline-none
  focus-visible:ring-2 focus-visible:ring-red-500
  focus-visible:ring-offset-2
`;

const inputClass = `
  w-full rounded-lg border border-gray-300
  bg-white px-4 py-2.5 text-sm text-gray-800
  outline-none transition
  placeholder:text-gray-400
  focus:border-blue-500 focus:ring-2 focus:ring-blue-100
  disabled:cursor-not-allowed disabled:bg-gray-100
`;

const labelClass = `
  mb-2 block text-sm font-medium text-gray-700
`;

// ============================================================
// ICONS
// ============================================================

const editIcon = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M12 20h9"/>
    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
  </svg>
`;

const deleteIcon = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M3 6h18"/>
    <path d="M8 6V4h8v2"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v5"/>
    <path d="M14 11v5"/>
  </svg>
`;

const plusIcon = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M12 5v14"/>
    <path d="M5 12h14"/>
  </svg>
`;

const searchIcon = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="text-gray-500"
  >
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
`;

const resetIcon = `
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path d="M3 12a9 9 0 1 0 3-6.7"/>
    <path d="M3 3v6h6"/>
  </svg>
`;

// ============================================================
// SELECT OPTION HELPERS
// ============================================================

function renderCustomerOptions(
  selectedId?: number | null,
): string {
  return `
    <option value="">Select customer</option>
    ${customers
      .map(
        (customer) => `
          <option
            value="${escapeHtml(customer.customer_id)}"
            ${
              customer.customer_id === selectedId
                ? "selected"
                : ""
            }
          >
            ${escapeHtml(customer.customer_name)}
          </option>
        `,
      )
      .join("")}
  `;
}

function renderRestaurantOptions(
  selectedId?: number | null,
): string {
  return `
    <option value="">Select restaurant</option>
    ${restaurants
      .map(
        (restaurant) => `
          <option
            value="${escapeHtml(restaurant.restaurant_id)}"
            ${
              restaurant.restaurant_id === selectedId
                ? "selected"
                : ""
            }
          >
            ${escapeHtml(restaurant.restaurant_name)}
          </option>
        `,
      )
      .join("")}
  `;
}

function renderTableOptions(
  selectedRestaurantId?: number | null,
  selectedTableId?: number | null,
): string {
  const filteredTables =
    selectedRestaurantId == null
      ? []
      : restaurantTables.filter(
          (table) =>
            table.restaurant_id ===
            selectedRestaurantId,
        );

  return `
    <option value="">No table selected</option>
    ${filteredTables
      .map(
        (table) => `
          <option
            value="${escapeHtml(table.table_id)}"
            ${
              table.table_id === selectedTableId
                ? "selected"
                : ""
            }
          >
            Table ${escapeHtml(table.table_number)}
          </option>
        `,
      )
      .join("")}
  `;
}

function renderEmployeeOptions(
  selectedRestaurantId?: number | null,
  selectedEmployeeId?: number | null,
): string {
  const filteredEmployees =
    selectedRestaurantId == null
      ? []
      : employees.filter(
          (employee) =>
            employee.restaurant_id ===
            selectedRestaurantId,
        );

  return `
    <option value="">No employee selected</option>
    ${filteredEmployees
      .map(
        (employee) => `
          <option
            value="${escapeHtml(employee.employee_id)}"
            ${
              employee.employee_id === selectedEmployeeId
                ? "selected"
                : ""
            }
          >
            ${escapeHtml(employee.employee_name)}
          </option>
        `,
      )
      .join("")}
  `;
}

function renderOrderTypeOptions(
  selectedType?: OrderType,
): string {
  return ORDER_TYPES.map(
    (type) => `
      <option
        value="${escapeHtml(type)}"
        ${type === selectedType ? "selected" : ""}
      >
        ${escapeHtml(formatOrderType(type))}
      </option>
    `,
  ).join("");
}

function renderOrderStatusOptions(
  selectedStatus?: OrderStatus,
): string {
  return ORDER_STATUSES.map(
    (status) => `
      <option
        value="${escapeHtml(status)}"
        ${status === selectedStatus ? "selected" : ""}
      >
        ${escapeHtml(formatOrderType(status))}
      </option>
    `,
  ).join("");
}

// ============================================================
// STATUS BADGES
// ============================================================

function getStatusBadgeClass(
  status: unknown,
): string {
  switch (String(status)) {
    case "pending":
      return "bg-yellow-100 text-yellow-700";

    case "preparing":
      return "bg-blue-100 text-blue-700";

    case "ready":
      return "bg-purple-100 text-purple-700";

    case "completed":
      return "bg-green-100 text-green-700";

    case "cancelled":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
}

function renderStatusBadge(
  status: unknown,
): string {
  return `
    <span
      class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(status)}"
    >
      ${escapeHtml(formatOrderType(status))}
    </span>
  `;
}

// ============================================================
// ORDER HELPERS
// ============================================================

function getOrderCustomerName(
  order: Order,
): string {
  const orderWithRelations =
    order as Order & {
      customer?: Customer;
      customer_name?: string;
    };

  return (
    orderWithRelations.customer_name ||
    orderWithRelations.customer?.customer_name ||
    customers.find(
      (customer) =>
        customer.customer_id === order.customer_id,
    )?.customer_name ||
    "-"
  );
}

function getOrderRestaurantName(
  order: Order,
): string {
  const orderWithRelations =
    order as Order & {
      restaurant?: Restaurant;
      restaurant_name?: string;
    };

  return (
    orderWithRelations.restaurant_name ||
    orderWithRelations.restaurant?.restaurant_name ||
    restaurants.find(
      (restaurant) =>
        restaurant.restaurant_id ===
        order.restaurant_id,
    )?.restaurant_name ||
    "-"
  );
}

function getOrderTableNumber(
  order: Order,
): string {
  const orderWithRelations =
    order as Order & {
      table?: RestaurantTable;
      table_number?: number;
    };

  if (
    orderWithRelations.table_number !== undefined &&
    orderWithRelations.table_number !== null
  ) {
    return String(orderWithRelations.table_number);
  }

  if (orderWithRelations.table?.table_number) {
    return String(
      orderWithRelations.table.table_number,
    );
  }

  const table = restaurantTables.find(
    (item) => item.table_id === order.table_id,
  );

  return table
    ? String(table.table_number)
    : "-";
}

function getOrderEmployeeName(
  order: Order,
): string {
  const orderWithRelations =
    order as Order & {
      employee?: Employee;
      employee_name?: string;
    };

  return (
    orderWithRelations.employee_name ||
    orderWithRelations.employee?.employee_name ||
    employees.find(
      (employee) =>
        employee.employee_id === order.employee_id,
    )?.employee_name ||
    "-"
  );
}

// ============================================================
// TABLE RENDERING
// ============================================================

function renderOrderRows(
  orderList: Order[],
): string {
  if (orderList.length === 0) {
    return `
      <tr>
        <td
          colspan="10"
          class="px-6 py-12 text-center"
        >
          <div class="flex flex-col items-center gap-2">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              class="text-gray-400"
            >
              <path d="M6 2h12v20H6z"/>
              <path d="M9 6h6"/>
              <path d="M9 10h6"/>
              <path d="M9 14h4"/>
            </svg>

            <p class="text-sm font-medium text-gray-700">
              No orders found.
            </p>

            <p class="text-xs text-gray-500">
              Try another search or add a new order.
            </p>

          </div>
        </td>
      </tr>
    `;
  }

  return orderList
    .map((order) => {
      const orderId = Number(
        (order as Order & {
          order_id?: number;
          id?: number;
        }).order_id ??
          (order as Order & { id?: number }).id,
      );

      return `
        <tr class="border-b border-gray-100 transition hover:bg-gray-50">

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(orderId)}
          </td>

          <td class="min-w-40 px-6 py-4 text-sm font-medium text-gray-900">
            ${escapeHtml(getOrderCustomerName(order))}
          </td>

          <td class="min-w-40 px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(getOrderRestaurantName(order))}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${
              getOrderTableNumber(order) === "-"
                ? "-"
                : `Table ${escapeHtml(getOrderTableNumber(order))}`
            }
          </td>

          <td class="min-w-36 px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(getOrderEmployeeName(order))}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(formatDate(order.order_date))}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            <span class="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              ${escapeHtml(formatOrderType(order.order_type))}
            </span>
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm">
            ${renderStatusBadge(order.order_status)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-700">
            ${escapeHtml(formatCurrency(order.total_amount))}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm">
            <div class="flex flex-wrap gap-2">

              <button
                type="button"
                data-edit-order="${escapeHtml(orderId)}"
                aria-label="Edit order ${escapeHtml(orderId)}"
                class="${editButtonClass}"
              >
                ${editIcon}
                Edit
              </button>

              <button
                type="button"
                data-delete-order="${escapeHtml(orderId)}"
                aria-label="Delete order ${escapeHtml(orderId)}"
                class="${deleteButtonClass}"
              >
                ${deleteIcon}
                Delete
              </button>

            </div>
          </td>

        </tr>
      `;
    })
    .join("");
}

// ============================================================
// FORM VALIDATION
// ============================================================

function validateOrderForm(
  customerId: number,
  restaurantId: number,
  orderDate: string,
  orderTime: string,
  orderType: string,
  orderStatus: string,
  totalAmount: number,
): string | null {
  if (
    !customerId ||
    !restaurantId ||
    !orderDate ||
    !orderTime ||
    !orderType ||
    !orderStatus
  ) {
    return "Please fill in all required fields.";
  }

  if (!Number.isFinite(totalAmount)) {
    return "Please enter a valid total amount.";
  }

  if (totalAmount < 0) {
    return "Total amount cannot be negative.";
  }

  if (!ORDER_TYPES.includes(orderType as OrderType)) {
    return "Please select a valid order type.";
  }

  if (
    !ORDER_STATUSES.includes(
      orderStatus as OrderStatus,
    )
  ) {
    return "Please select a valid order status.";
  }

  return null;
}

// ============================================================
// FORM DEFAULTS
// ============================================================

function getCurrentDate(): string {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getCurrentTime(): string {
  const date = new Date();

  const hours = String(
    date.getHours(),
  ).padStart(2, "0");

  const minutes = String(
    date.getMinutes(),
  ).padStart(2, "0");

  return `${hours}:${minutes}`;
}

// ============================================================
// FORM RENDERING
// ============================================================

function renderOrderForm(
  order?: Order,
): void {
  const formContainer =
    document.querySelector<HTMLDivElement>(
      "#order-form-container",
    );

  if (!formContainer) {
    return;
  }

  const isEditing = Boolean(order);

  editingOrderId = order
    ? Number(
        (order as Order & {
          order_id?: number;
          id?: number;
        }).order_id ??
          (order as Order & { id?: number }).id,
      )
    : null;

  const selectedRestaurantId =
    order?.restaurant_id ?? null;

  const orderDate = order
    ? escapeHtml(formatDate(order.order_date))
    : getCurrentDate();

  const orderTime = order
    ? escapeHtml(formatTime(order.order_time))
    : getCurrentTime();

  const selectedCustomerId =
    order?.customer_id ?? null;

  const selectedTableId =
    order?.table_id ?? null;

  const selectedEmployeeId =
    order?.employee_id ?? null;

  const selectedOrderType =
    order?.order_type ?? "dine_in";

  const selectedOrderStatus =
    order?.order_status ?? "pending";

  const totalAmount = order
    ? escapeHtml(order.total_amount)
    : "0.00";

  formContainer.innerHTML = `
    <div class="rounded-xl border border-gray-200 bg-gray-50 p-6 shadow-sm">

      <div class="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

        <div>

          <div class="flex items-center gap-2">

            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">

              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                ${
                  isEditing
                    ? `
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                    `
                    : `
                      <path d="M12 5v14"/>
                      <path d="M5 12h14"/>
                    `
                }
              </svg>

            </div>

            <h3 class="text-xl font-semibold text-gray-800">
              ${isEditing ? "Edit Order" : "Add Order"}
            </h3>

          </div>

          <p class="mt-2 text-sm text-gray-500">
            ${
              isEditing
                ? "Update the order information below."
                : "Add a new order to the system."
            }
          </p>

        </div>

        <button
          type="button"
          id="cancel-order-form"
          class="${secondaryButtonClass}"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>

          Cancel
        </button>

      </div>

      <form id="order-form" class="space-y-5">

        <!-- Customer and Restaurant -->

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>

            <label
              for="order-customer"
              class="${labelClass}"
            >
              Customer
            </label>

            <select
              id="order-customer"
              name="customer_id"
              required
              class="${inputClass}"
            >
              ${renderCustomerOptions(selectedCustomerId)}
            </select>

          </div>

          <div>

            <label
              for="order-restaurant"
              class="${labelClass}"
            >
              Restaurant
            </label>

            <select
              id="order-restaurant"
              name="restaurant_id"
              required
              class="${inputClass}"
            >
              ${renderRestaurantOptions(selectedRestaurantId)}
            </select>

          </div>

        </div>

        <!-- Table and Employee -->

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>

            <label
              for="order-table"
              class="${labelClass}"
            >
              Table
            </label>

            <select
              id="order-table"
              name="table_id"
              class="${inputClass}"
            >
              ${renderTableOptions(
                selectedRestaurantId,
                selectedTableId,
              )}
            </select>

          </div>

          <div>

            <label
              for="order-employee"
              class="${labelClass}"
            >
              Employee
            </label>

            <select
              id="order-employee"
              name="employee_id"
              class="${inputClass}"
            >
              ${renderEmployeeOptions(
                selectedRestaurantId,
                selectedEmployeeId,
              )}
            </select>

          </div>

        </div>

        <!-- Order Date and Time -->

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>

            <label
              for="order-date"
              class="${labelClass}"
            >
              Order Date
            </label>

            <input
              id="order-date"
              name="order_date"
              type="date"
              required
              value="${orderDate}"
              class="${inputClass}"
            />

          </div>

          <div>

            <label
              for="order-time"
              class="${labelClass}"
            >
              Order Time
            </label>

            <input
              id="order-time"
              name="order_time"
              type="time"
              required
              value="${orderTime}"
              class="${inputClass}"
            />

          </div>

        </div>

        <!-- Order Type and Status -->

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>

            <label
              for="order-type"
              class="${labelClass}"
            >
              Order Type
            </label>

            <select
              id="order-type"
              name="order_type"
              required
              class="${inputClass}"
            >
              ${renderOrderTypeOptions(selectedOrderType)}
            </select>

          </div>

          <div>

            <label
              for="order-status"
              class="${labelClass}"
            >
              Order Status
            </label>

            <select
              id="order-status"
              name="order_status"
              required
              class="${inputClass}"
            >
              ${renderOrderStatusOptions(selectedOrderStatus)}
            </select>

          </div>

        </div>

        <!-- Total Amount -->

        <div>

          <label
            for="order-total-amount"
            class="${labelClass}"
          >
            Total Amount
          </label>

          <input
            id="order-total-amount"
            name="total_amount"
            type="number"
            min="0"
            step="0.01"
            required
            value="${totalAmount}"
            placeholder="Enter total amount"
            class="${inputClass}"
          />

        </div>

        <!-- Form Buttons -->

        <div class="flex flex-wrap gap-3 border-t border-gray-200 pt-5">

          <button
            type="submit"
            id="order-submit-button"
            class="${primaryButtonClass}"
          >

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>

            ${isEditing ? "Update Order" : "Save Order"}

          </button>

          <button
            type="button"
            id="cancel-order-form-bottom"
            class="${secondaryButtonClass}"
          >
            Cancel
          </button>

        </div>

        <p
          id="order-form-message"
          class="text-sm"
          role="status"
          aria-live="polite"
        ></p>

      </form>

    </div>
  `;

  const form =
    document.querySelector<HTMLFormElement>(
      "#order-form",
    );

  const cancelButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-order-form",
    );

  const cancelBottomButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-order-form-bottom",
    );

  const formMessage =
    document.querySelector<HTMLParagraphElement>(
      "#order-form-message",
    );

  const submitButton =
    document.querySelector<HTMLButtonElement>(
      "#order-submit-button",
    );

  const restaurantSelect =
    document.querySelector<HTMLSelectElement>(
      "#order-restaurant",
    );

  const tableSelect =
    document.querySelector<HTMLSelectElement>(
      "#order-table",
    );

  const employeeSelect =
    document.querySelector<HTMLSelectElement>(
      "#order-employee",
    );

  const closeForm = (): void => {
    editingOrderId = null;
    formContainer.innerHTML = "";
  };

  cancelButton?.addEventListener(
    "click",
    closeForm,
  );

  cancelBottomButton?.addEventListener(
    "click",
    closeForm,
  );

  restaurantSelect?.addEventListener(
    "change",
    () => {
      const restaurantId = Number(
        restaurantSelect.value,
      );

      const validRestaurantId =
        Number.isFinite(restaurantId) &&
        restaurantId > 0
          ? restaurantId
          : null;

      if (tableSelect) {
        tableSelect.innerHTML =
          renderTableOptions(validRestaurantId);

        tableSelect.disabled =
          validRestaurantId === null;
      }

      if (employeeSelect) {
        employeeSelect.innerHTML =
          renderEmployeeOptions(validRestaurantId);

        employeeSelect.disabled =
          validRestaurantId === null;
      }
    },
  );

  form?.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      if (!formMessage || !submitButton) {
        return;
      }

      if (submitButton.disabled) {
        return;
      }

      const formData = new FormData(form);

      const customerId = Number(
        formData.get("customer_id"),
      );

      const restaurantId = Number(
        formData.get("restaurant_id"),
      );

      const tableValue = String(
        formData.get("table_id") || "",
      ).trim();

      const employeeValue = String(
        formData.get("employee_id") || "",
      ).trim();

      const tableId = tableValue
        ? Number(tableValue)
        : null;

      const employeeId = employeeValue
        ? Number(employeeValue)
        : null;

      const orderDate = String(
        formData.get("order_date") || "",
      ).trim();

      const orderTime = String(
        formData.get("order_time") || "",
      ).trim();

      const orderType = String(
        formData.get("order_type") || "",
      ).trim() as OrderType;

      const orderStatus = String(
        formData.get("order_status") || "",
      ).trim() as OrderStatus;

      const totalAmount = Number(
        formData.get("total_amount"),
      );

      const validationError =
        validateOrderForm(
          customerId,
          restaurantId,
          orderDate,
          orderTime,
          orderType,
          orderStatus,
          totalAmount,
        );

      if (validationError) {
        showFormMessage(
          formMessage,
          validationError,
          "error",
        );

        return;
      }

      const requestBody: OrderFormData = {
        customer_id: customerId,
        restaurant_id: restaurantId,
        table_id: tableId,
        employee_id: employeeId,
        order_date: orderDate,
        order_time: orderTime,
        order_type: orderType,
        order_status: orderStatus,
        total_amount: totalAmount,
      };

      submitButton.disabled = true;

      submitButton.textContent = editingOrderId
        ? "Updating..."
        : "Saving...";

      showFormMessage(
        formMessage,
        editingOrderId
          ? "Updating order..."
          : "Saving order...",
        "loading",
      );

      try {
        const response = editingOrderId
          ? await apiPut(
              `/orders/${editingOrderId}`,
              requestBody,
            )
          : await apiPost(
              "/orders",
              requestBody,
            );

        const successMessage =
          response.message ||
          (editingOrderId
            ? "Order updated successfully."
            : "Order created successfully.");

        showFormMessage(
          formMessage,
          successMessage,
          "success",
        );

        showMessage(
          successMessage,
          "success",
        );

        await loadOrders();

      } catch (error) {
        showFormMessage(
          formMessage,
          getErrorMessage(
            error,
            "An unexpected error occurred.",
          ),
          "error",
        );

        submitButton.disabled = false;

        submitButton.textContent = editingOrderId
          ? "Update Order"
          : "Save Order";
      }
    },
  );
}

// ============================================================
// MAIN PAGE RENDERING
// ============================================================

function renderOrders(
  orderList: Order[],
  searchTerm = "",
): void {
  const pageContent = getPageContent();

  pageContent.innerHTML = `
    <!-- PAGE HEADER -->

    <div class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

      <div>

        <h2 class="text-2xl font-bold text-gray-800">
          Order Management
        </h2>

        <p class="mt-1 text-sm text-gray-500">
          Manage customer orders and order information.
        </p>

      </div>

      <button
        id="add-order-button"
        type="button"
        class="${primaryButtonClass}"
      >
        ${plusIcon}
        Add Order
      </button>

    </div>

    <!-- PAGE MESSAGE -->

    <p
      id="order-page-message"
      class="mb-4 text-sm"
      role="status"
      aria-live="polite"
    ></p>

    <!-- FORM CONTAINER -->

    <div
      id="order-form-container"
      class="mb-6"
    ></div>

    <!-- SEARCH CARD -->

    <div class="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">

      <div class="mb-3 flex items-center gap-2">

        ${searchIcon}

        <h3 class="text-sm font-semibold text-gray-800">
          Search Orders
        </h3>

      </div>

      <div class="flex flex-col gap-3 sm:flex-row">

        <input
          id="order-search"
          type="search"
          value="${escapeHtml(searchTerm)}"
          placeholder="Search by customer, restaurant, status, or order type..."
          aria-label="Search orders"
          class="min-w-0 flex-1 ${inputClass}"
        />

        <button
          id="order-search-button"
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
        >
          ${searchIcon}
          <span>Search</span>
        </button>

        <button
          id="order-reset-button"
          type="button"
          class="${secondaryButtonClass}"
        >
          ${resetIcon}
          Reset
        </button>

      </div>

      <p
        id="order-search-message"
        class="mt-3 text-sm"
        role="status"
        aria-live="polite"
      ></p>

    </div>

    <!-- TABLE CARD -->

    <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

      <div class="flex flex-col justify-between gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center">

        <h3 class="text-base font-semibold text-gray-800">
          Order List
        </h3>

        <span class="text-sm text-gray-500">
          ${orderList.length}
          order${orderList.length === 1 ? "" : "s"}
        </span>

      </div>

      <div class="overflow-x-auto">

        <table class="min-w-full">

          <thead class="bg-gray-50">

            <tr>

              ${[
                "ID",
                "Customer",
                "Restaurant",
                "Table",
                "Employee",
                "Date",
                "Type",
                "Status",
                "Amount",
                "Actions",
              ]
                .map(
                  (heading) => `
                    <th
                      scope="col"
                      class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
                    >
                      ${heading}
                    </th>
                  `,
                )
                .join("")}

            </tr>

          </thead>

          <tbody id="order-table-body">
            ${renderOrderRows(orderList)}
          </tbody>

        </table>

      </div>

    </div>
  `;

  // ============================================================
  // ELEMENT REFERENCES
  // ============================================================

  const addButton =
    document.querySelector<HTMLButtonElement>(
      "#add-order-button",
    );

  const searchInput =
    document.querySelector<HTMLInputElement>(
      "#order-search",
    );

  const searchButton =
    document.querySelector<HTMLButtonElement>(
      "#order-search-button",
    );

  const resetButton =
    document.querySelector<HTMLButtonElement>(
      "#order-reset-button",
    );

  const searchMessage =
    document.querySelector<HTMLParagraphElement>(
      "#order-search-message",
    );

  const tableBody =
    document.querySelector<HTMLTableSectionElement>(
      "#order-table-body",
    );

  // ============================================================
  // ADD ORDER
  // ============================================================

  addButton?.addEventListener(
    "click",
    () => {
      clearMessage();
      renderOrderForm();
    },
  );

  // ============================================================
  // SEARCH ORDERS
  // ============================================================

  const performSearch = async (): Promise<void> => {
    const term =
      searchInput?.value.trim() || "";

    if (!term) {
      await loadOrders();
      return;
    }

    if (searchMessage) {
      searchMessage.textContent = "Searching...";
      searchMessage.className =
        "mt-3 text-sm text-gray-500";
    }

    if (searchButton) {
      searchButton.disabled = true;
    }

    try {
      const response = await apiGet<Order[]>(
        `/orders/search?q=${encodeURIComponent(term)}`,
      );

      renderOrders(
        response.data ?? [],
        term,
      );
    } catch (error) {
      if (searchMessage) {
        searchMessage.textContent =
          getErrorMessage(
            error,
            "Failed to search orders.",
          );

        searchMessage.className =
          "mt-3 text-sm text-red-600";
      }

      if (searchButton) {
        searchButton.disabled = false;
      }
    }
  };

  searchButton?.addEventListener(
    "click",
    () => {
      void performSearch();
    },
  );

  searchInput?.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        void performSearch();
      }
    },
  );

  // ============================================================
  // RESET SEARCH
  // ============================================================

  resetButton?.addEventListener(
    "click",
    () => {
      void loadOrders();
    },
  );

  // ============================================================
  // TABLE ACTIONS
  // ============================================================

  tableBody?.addEventListener(
    "click",
    async (event) => {
      const target = event.target as HTMLElement;

      const editButton =
        target.closest<HTMLButtonElement>(
          "[data-edit-order]",
        );

      const deleteButton =
        target.closest<HTMLButtonElement>(
          "[data-delete-order]",
        );

      // --------------------------------------------------------
      // EDIT ORDER
      // --------------------------------------------------------

      if (editButton) {
        const orderId = Number(
          editButton.dataset.editOrder,
        );

        const order = orderList.find(
          (item) => {
            const currentId = Number(
              (item as Order & {
                order_id?: number;
                id?: number;
              }).order_id ??
                (item as Order & {
                  id?: number;
                }).id,
            );

            return currentId === orderId;
          },
        );

        if (order) {
          clearMessage();
          renderOrderForm(order);
        }

        return;
      }

      // --------------------------------------------------------
      // DELETE ORDER
      // --------------------------------------------------------

      if (deleteButton) {
        const orderId = Number(
          deleteButton.dataset.deleteOrder,
        );

        if (!Number.isFinite(orderId)) {
          showMessage(
            "Invalid order ID.",
            "error",
          );

          return;
        }

        const confirmed = window.confirm(
          `Are you sure you want to delete order #${orderId}?`,
        );

        if (!confirmed) {
          return;
        }

        deleteButton.disabled = true;

        try {
          const response = await apiDelete(
            `/orders/${orderId}`,
          );

          showMessage(
            response.message ||
              "Order deleted successfully.",
            "success",
          );

          await loadOrders();

        } catch (error) {
          showMessage(
            getErrorMessage(
              error,
              "Failed to delete order.",
            ),
            "error",
          );

          deleteButton.disabled = false;
        }
      }
    },
  );
}

// ============================================================
// LOAD REFERENCE DATA
// ============================================================

async function loadReferenceData(): Promise<void> {
  const [
    customerResponse,
    restaurantResponse,
    tableResponse,
    employeeResponse,
  ] = await Promise.all([
    apiGet<Customer[]>("/customers"),
    apiGet<Restaurant[]>("/restaurants"),
    apiGet<RestaurantTable[]>("/tables"),
    apiGet<Employee[]>("/employees"),
  ]);

  customers = customerResponse.data ?? [];
  restaurants = restaurantResponse.data ?? [];
  restaurantTables = tableResponse.data ?? [];
  employees = employeeResponse.data ?? [];
}

// ============================================================
// LOAD ORDERS
// ============================================================

export async function loadOrders(): Promise<void> {
  const pageContent = getPageContent();

  editingOrderId = null;

  pageContent.innerHTML = `
    <div class="flex min-h-64 flex-col items-center justify-center gap-3">

      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="animate-spin text-blue-600"
      >
        <path d="M12 2v4"/>
        <path d="m16.2 7.8 2.8-2.8"/>
        <path d="M18 12h4"/>
        <path d="m16.2 16.2 2.8 2.8"/>
        <path d="M12 18v4"/>
        <path d="m4.2 19 2.8-2.8"/>
        <path d="M2 12h4"/>
        <path d="m4.2 5 2.8 2.8"/>
      </svg>

      <p class="text-sm text-gray-500">
        Loading orders...
      </p>

    </div>
  `;

  try {
    await loadReferenceData();

    const response = await apiGet<Order[]>(
      "/orders",
    );

    orders = response.data ?? [];

    renderOrders(orders);

  } catch (error) {
    const errorMessage = getErrorMessage(
      error,
      "An unexpected error occurred.",
    );

    pageContent.innerHTML = `
      <div class="rounded-xl border border-red-100 bg-red-50 p-6">

        <div class="flex items-start gap-3">

          <div class="mt-0.5 text-red-600">

            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>

          </div>

          <div>

            <h2 class="text-lg font-semibold text-red-700">
              Failed to Load Orders
            </h2>

            <p class="mt-2 text-sm text-red-600">
              ${escapeHtml(errorMessage)}
            </p>

            <button
              id="retry-orders-button"
              type="button"
              class="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
            >
              ${resetIcon}
              Try Again
            </button>

          </div>

        </div>

      </div>
    `;

    document
      .querySelector<HTMLButtonElement>(
        "#retry-orders-button",
      )
      ?.addEventListener(
        "click",
        () => {
          void loadOrders();
        },
      );
  }
}