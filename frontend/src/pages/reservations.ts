
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../api/client";

import type {
  Reservation,
  ReservationStatus,
} from "../types/reservation";

// ============================================================
// TYPES
// ============================================================

interface Customer {
  customer_id: number;
  customer_name: string;
}

interface RestaurantTable {
  table_id: number;
  restaurant_id: number;
  table_number: number;
  capacity: number;
  table_status: string;
}

// ============================================================
// STATE
// ============================================================

const RESERVATION_STATUSES: ReservationStatus[] = [
  "pending",
  "confirmed",
  "completed",
  "cancelled",
  "no_show",
];

let reservations: Reservation[] = [];
let customers: Customer[] = [];
let tables: RestaurantTable[] = [];

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

  if (!date) return "";

  const parsedDate = new Date(
    `${date.substring(0, 10)}T00:00:00`,
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString();
}

function formatTime(value: unknown): string {
  const time = String(value ?? "");

  return time.length >= 5
    ? time.substring(0, 5)
    : time;
}

function normalizeDateForInput(value: unknown): string {
  const date = String(value ?? "");

  return date.includes("T")
    ? date.split("T")[0]
    : date.substring(0, 10);
}

function normalizeTimeForInput(value: unknown): string {
  return formatTime(value);
}

// ============================================================
// BUTTON AND FORM STYLES
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
// MESSAGE HELPERS
// ============================================================

function showMessage(
  message: string,
  type: "success" | "error",
): void {
  const element =
    document.querySelector<HTMLParagraphElement>(
      "#reservation-page-message",
    );

  if (!element) return;

  element.textContent = message;

  element.className =
    type === "success"
      ? "mb-4 text-sm text-green-600"
      : "mb-4 text-sm text-red-600";
}

function clearMessage(): void {
  const element =
    document.querySelector<HTMLParagraphElement>(
      "#reservation-page-message",
    );

  if (!element) return;

  element.textContent = "";
  element.className = "mb-4 text-sm";
}

function showFormMessage(
  element: HTMLParagraphElement | null,
  message: string,
  type: "success" | "error" | "loading",
): void {
  if (!element) return;

  element.textContent = message;

  element.className =
    type === "success"
      ? "text-sm text-green-600"
      : type === "error"
        ? "text-sm text-red-600"
        : "text-sm text-gray-500";
}

// ============================================================
// STATUS AND SELECT OPTIONS
// ============================================================

function getStatusBadge(status: string): string {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    no_show: "bg-gray-100 text-gray-800",
  };

  const style =
    styles[status] ?? "bg-gray-100 text-gray-800";

  return `
    <span class="inline-flex items-center rounded-md
      px-2.5 py-1 text-xs font-medium ${style}">
      ${escapeHtml(status.replace("_", " ").toUpperCase())}
    </span>
  `;
}

function getCustomerOptions(
  selectedId?: number,
): string {
  return customers
    .map(
      (customer) => `
        <option
          value="${escapeHtml(customer.customer_id)}"
          ${
            selectedId === customer.customer_id
              ? "selected"
              : ""
          }
        >
          ${escapeHtml(customer.customer_name)}
        </option>
      `,
    )
    .join("");
}

function getTableOptions(
  selectedId?: number,
): string {
  return tables
    .map(
      (table) => `
        <option
          value="${escapeHtml(table.table_id)}"
          ${
            selectedId === table.table_id
              ? "selected"
              : ""
          }
        >
          Table ${escapeHtml(table.table_number)}
          - Capacity ${escapeHtml(table.capacity)}
          - Restaurant ID ${escapeHtml(table.restaurant_id)}
        </option>
      `,
    )
    .join("");
}

function getStatusOptions(
  selectedStatus: ReservationStatus = "pending",
): string {
  return RESERVATION_STATUSES
    .map(
      (status) => `
        <option
          value="${escapeHtml(status)}"
          ${
            selectedStatus === status
              ? "selected"
              : ""
          }
        >
          ${escapeHtml(status.replace("_", " ").toUpperCase())}
        </option>
      `,
    )
    .join("");
}

// ============================================================
// DATA LOADING
// ============================================================

async function loadCustomers(): Promise<void> {
  customers =
    (await apiGet<Customer[]>("/customers")).data ?? [];
}

async function loadTables(): Promise<void> {
  tables =
    (await apiGet<RestaurantTable[]>("/tables")).data ?? [];
}

async function loadReservationData(): Promise<void> {
  await Promise.all([
    loadCustomers(),
    loadTables(),
  ]);
}

// ============================================================
// RESERVATION VALIDATION
// ============================================================

function validateReservationForm(
  customerId: number,
  tableId: number,
  reservationDate: string,
  reservationTime: string,
  partySize: number,
  reservationStatus: string,
): string | null {
  if (
    !customerId ||
    !tableId ||
    !reservationDate ||
    !reservationTime ||
    !reservationStatus
  ) {
    return "All fields are required.";
  }

  if (!Number.isInteger(partySize) || partySize < 1) {
    return "Party size must be at least 1.";
  }

  const selectedTable = tables.find(
    (table) => table.table_id === tableId,
  );

  if (
    selectedTable &&
    partySize > selectedTable.capacity
  ) {
    return `Party size cannot exceed the table capacity of ${selectedTable.capacity}.`;
  }

  return null;
}

// ============================================================
// TABLE ROW RENDERING
// ============================================================

function renderReservationRows(
  reservationList: Reservation[],
): string {
  if (reservationList.length === 0) {
    return `
      <tr>
        <td
          colspan="9"
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
              <rect x="3" y="4" width="18" height="16" rx="2"/>
              <path d="M8 2v4"/>
              <path d="M16 2v4"/>
              <path d="M3 10h18"/>
              <path d="M8 14h2"/>
              <path d="M14 14h2"/>
            </svg>

            <p class="text-sm font-medium text-gray-700">
              No reservations found.
            </p>

            <p class="text-xs text-gray-500">
              Try another search or add a new reservation.
            </p>

          </div>
        </td>
      </tr>
    `;
  }

  return reservationList
    .map(
      (reservation) => `
        <tr class="border-b border-gray-100 transition hover:bg-gray-50">

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(reservation.reservation_id)}
          </td>

          <td class="min-w-40 px-6 py-4 text-sm font-medium text-gray-900">
            ${escapeHtml(reservation.customer_name)}
          </td>

          <td class="min-w-40 px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(reservation.restaurant_name)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            Table ${escapeHtml(reservation.table_number)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(formatDate(reservation.reservation_date))}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(formatTime(reservation.reservation_time))}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(reservation.party_size)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm">
            ${getStatusBadge(reservation.reservation_status)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm">

            <div class="flex flex-wrap gap-2">

              <button
                type="button"
                data-edit-reservation="${escapeHtml(reservation.reservation_id)}"
                aria-label="Edit reservation ${escapeHtml(reservation.reservation_id)}"
                class="${editButtonClass}"
              >
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

                Edit
              </button>

              <button
                type="button"
                data-delete-reservation="${escapeHtml(reservation.reservation_id)}"
                aria-label="Delete reservation ${escapeHtml(reservation.reservation_id)}"
                class="${deleteButtonClass}"
              >
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

                Delete
              </button>

            </div>

          </td>

        </tr>
      `,
    )
    .join("");
}

// ============================================================
// RESERVATION FORM RENDERING
// ============================================================

function renderReservationForm(
  reservation?: Reservation,
): void {
  const formContainer =
    document.querySelector<HTMLDivElement>(
      "#reservation-form-container",
    );

  if (!formContainer) return;

  const isEditing = Boolean(reservation);

  const customerId = reservation?.customer_id;
  const tableId = reservation?.table_id;

  const date = reservation
    ? escapeHtml(
        normalizeDateForInput(
          reservation.reservation_date,
        ),
      )
    : "";

  const time = reservation
    ? escapeHtml(
        normalizeTimeForInput(
          reservation.reservation_time,
        ),
      )
    : "";

  const partySize = reservation
    ? escapeHtml(reservation.party_size)
    : "";

  const selectedStatus =
    reservation?.reservation_status ?? "pending";

  formContainer.innerHTML = `
    <div class="mb-6 rounded-xl border border-gray-200
      bg-gray-50 p-6 shadow-sm">

      <div class="mb-6 flex flex-col justify-between gap-3
        sm:flex-row sm:items-start">

        <div>

          <div class="flex items-center gap-2">

            <div class="flex h-9 w-9 items-center
              justify-center rounded-lg bg-blue-100 text-blue-600">

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
              ${isEditing ? "Edit Reservation" : "Add Reservation"}
            </h3>

          </div>

          <p class="mt-2 text-sm text-gray-500">
            ${
              isEditing
                ? "Update the reservation information below."
                : "Add a new reservation to the system."
            }
          </p>

        </div>

        <button
          type="button"
          id="cancel-reservation-form"
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

      <form id="reservation-form" class="space-y-5">

        <!-- Customer and Table -->

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label
              for="reservation-customer-id"
              class="${labelClass}"
            >
              Customer
            </label>

            <select
              id="reservation-customer-id"
              name="customer_id"
              required
              class="${inputClass}"
            >
              <option value="">Select Customer</option>
              ${getCustomerOptions(customerId)}
            </select>
          </div>

          <div>
            <label
              for="reservation-table-id"
              class="${labelClass}"
            >
              Table
            </label>

            <select
              id="reservation-table-id"
              name="table_id"
              required
              class="${inputClass}"
            >
              <option value="">Select Table</option>
              ${getTableOptions(tableId)}
            </select>
          </div>

        </div>

        <!-- Date and Time -->

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label
              for="reservation-date"
              class="${labelClass}"
            >
              Reservation Date
            </label>

            <input
              id="reservation-date"
              name="reservation_date"
              type="date"
              required
              value="${date}"
              class="${inputClass}"
            />
          </div>

          <div>
            <label
              for="reservation-time"
              class="${labelClass}"
            >
              Reservation Time
            </label>

            <input
              id="reservation-time"
              name="reservation_time"
              type="time"
              required
              value="${time}"
              class="${inputClass}"
            />
          </div>

        </div>

        <!-- Party Size and Status -->

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label
              for="reservation-party-size"
              class="${labelClass}"
            >
              Party Size
            </label>

            <input
              id="reservation-party-size"
              name="party_size"
              type="number"
              min="1"
              required
              value="${partySize}"
              placeholder="Enter party size"
              class="${inputClass}"
            />
          </div>

          <div>
            <label
              for="reservation-status"
              class="${labelClass}"
            >
              Status
            </label>

            <select
              id="reservation-status"
              name="reservation_status"
              required
              class="${inputClass}"
            >
              ${getStatusOptions(selectedStatus)}
            </select>
          </div>

        </div>

        <!-- Form Buttons -->

        <div class="flex flex-wrap gap-3
          border-t border-gray-200 pt-5">

          <button
            type="submit"
            id="reservation-submit-button"
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

            ${isEditing ? "Update Reservation" : "Save Reservation"}
          </button>

          <button
            type="button"
            id="cancel-reservation-form-bottom"
            class="${secondaryButtonClass}"
          >
            Cancel
          </button>

        </div>

        <p
          id="reservation-form-message"
          class="text-sm"
          role="status"
          aria-live="polite"
        ></p>

      </form>

    </div>
  `;

  const form =
    document.querySelector<HTMLFormElement>(
      "#reservation-form",
    );

  const cancelButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-reservation-form",
    );

  const cancelBottomButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-reservation-form-bottom",
    );

  const formMessage =
    document.querySelector<HTMLParagraphElement>(
      "#reservation-form-message",
    );

  const submitButton =
    document.querySelector<HTMLButtonElement>(
      "#reservation-submit-button",
    );

  const closeForm = (): void => {
    formContainer.innerHTML = "";
  };

  cancelButton?.addEventListener("click", closeForm);
  cancelBottomButton?.addEventListener("click", closeForm);

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!formMessage || !submitButton) return;

    if (submitButton.disabled) return;

    const formData = new FormData(form);

    const customerId = Number(
      formData.get("customer_id") || 0,
    );

    const tableId = Number(
      formData.get("table_id") || 0,
    );

    const reservationDate = String(
      formData.get("reservation_date") || "",
    ).trim();

    const reservationTime = String(
      formData.get("reservation_time") || "",
    ).trim();

    const partySize = Number(
      formData.get("party_size") || 0,
    );

    const reservationStatus = String(
      formData.get("reservation_status") || "",
    ).trim() as ReservationStatus;

    const validationError =
      validateReservationForm(
        customerId,
        tableId,
        reservationDate,
        reservationTime,
        partySize,
        reservationStatus,
      );

    if (validationError) {
      showFormMessage(
        formMessage,
        validationError,
        "error",
      );

      return;
    }

    const requestBody = {
      customer_id: customerId,
      table_id: tableId,
      reservation_date: reservationDate,
      reservation_time: reservationTime,
      party_size: partySize,
      reservation_status: reservationStatus,
    };

    submitButton.disabled = true;

    submitButton.textContent = isEditing
      ? "Updating..."
      : "Saving...";

    showFormMessage(
      formMessage,
      isEditing
        ? "Updating reservation..."
        : "Saving reservation...",
      "loading",
    );

    try {
      const response = isEditing
        ? await apiPut(
            `/reservations/${reservation?.reservation_id}`,
            requestBody,
          )
        : await apiPost(
            "/reservations",
            requestBody,
          );

      const successMessage =
        response.message ||
        (isEditing
          ? "Reservation updated successfully."
          : "Reservation created successfully.");

      showFormMessage(
        formMessage,
        successMessage,
        "success",
      );

      await loadReservations();

      showMessage(successMessage, "success");

      formContainer.innerHTML = "";
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

      submitButton.textContent = isEditing
        ? "Update Reservation"
        : "Save Reservation";
    }
  });
}

// ============================================================
// MAIN PAGE RENDERING
// ============================================================

function renderReservations(
  reservationList: Reservation[],
  searchTerm = "",
): void {
  const pageContent = getPageContent();

  pageContent.innerHTML = `
    <!-- PAGE HEADER -->

    <div class="mb-6 flex flex-col justify-between gap-4
      md:flex-row md:items-center">

      <div>
        <h2 class="text-2xl font-bold text-gray-800">
          Reservation Management
        </h2>

        <p class="mt-1 text-sm text-gray-500">
          Manage restaurant table reservations.
        </p>
      </div>

      <button
        id="add-reservation-button"
        type="button"
        class="${primaryButtonClass}"
      >
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

        Add Reservation
      </button>

    </div>

    <!-- PAGE MESSAGE -->

    <p
      id="reservation-page-message"
      class="mb-4 text-sm"
      role="status"
      aria-live="polite"
    ></p>

    <!-- FORM CONTAINER -->

    <div id="reservation-form-container"></div>

    <!-- SEARCH CARD -->

    <div class="mb-6 rounded-xl border border-gray-100
      bg-white p-5 shadow-sm">

      <div class="mb-3 flex items-center gap-2">

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

        <h3 class="text-sm font-semibold text-gray-800">
          Search Reservations
        </h3>

      </div>

      <div class="flex flex-col gap-3 sm:flex-row">

        <input
          id="reservation-search"
          type="search"
          value="${escapeHtml(searchTerm)}"
          placeholder="Search by customer, restaurant, table, or status..."
          aria-label="Search reservations"
          class="min-w-0 flex-1 ${inputClass}"
        />

        <button
          id="reservation-search-button"
          type="button"
          class="inline-flex items-center justify-center gap-2
            rounded-lg bg-gray-800 px-5 py-2.5
            text-sm font-medium text-white transition
            hover:bg-gray-900 focus-visible:outline-none
            focus-visible:ring-2 focus-visible:ring-gray-500
            focus-visible:ring-offset-2"
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
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.3-4.3"/>
          </svg>

          Search
        </button>

        <button
          id="reservation-reset-button"
          type="button"
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
            <path d="M3 12a9 9 0 1 0 3-6.7"/>
            <path d="M3 3v6h6"/>
          </svg>

          Reset
        </button>

      </div>

      <p
        id="reservation-search-message"
        class="mt-3 text-sm"
        role="status"
        aria-live="polite"
      ></p>

    </div>

    <!-- TABLE CARD -->

    <div class="overflow-hidden rounded-xl border
      border-gray-100 bg-white shadow-sm">

      <div class="flex flex-col justify-between gap-2
        border-b border-gray-100 px-5 py-4
        sm:flex-row sm:items-center">

        <h3 class="text-base font-semibold text-gray-800">
          Reservation List
        </h3>

        <span class="text-sm text-gray-500">
          ${reservationList.length}
          reservation${reservationList.length === 1 ? "" : "s"}
        </span>

      </div>

      <div class="overflow-x-auto">

        <table class="min-w-full">

          <thead class="bg-gray-50">

            <tr>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left
                  text-xs font-semibold uppercase tracking-wider
                  text-gray-500"
              >
                ID
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left
                  text-xs font-semibold uppercase tracking-wider
                  text-gray-500"
              >
                Customer
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left
                  text-xs font-semibold uppercase tracking-wider
                  text-gray-500"
              >
                Restaurant
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left
                  text-xs font-semibold uppercase tracking-wider
                  text-gray-500"
              >
                Table
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left
                  text-xs font-semibold uppercase tracking-wider
                  text-gray-500"
              >
                Date
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left
                  text-xs font-semibold uppercase tracking-wider
                  text-gray-500"
              >
                Time
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left
                  text-xs font-semibold uppercase tracking-wider
                  text-gray-500"
              >
                Party Size
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left
                  text-xs font-semibold uppercase tracking-wider
                  text-gray-500"
              >
                Status
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left
                  text-xs font-semibold uppercase tracking-wider
                  text-gray-500"
              >
                Actions
              </th>

            </tr>

          </thead>

          <tbody id="reservation-table-body">
            ${renderReservationRows(reservationList)}
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
      "#add-reservation-button",
    );

  const searchInput =
    document.querySelector<HTMLInputElement>(
      "#reservation-search",
    );

  const searchButton =
    document.querySelector<HTMLButtonElement>(
      "#reservation-search-button",
    );

  const resetButton =
    document.querySelector<HTMLButtonElement>(
      "#reservation-reset-button",
    );

  const searchMessage =
    document.querySelector<HTMLParagraphElement>(
      "#reservation-search-message",
    );

  const tableBody =
    document.querySelector<HTMLTableSectionElement>(
      "#reservation-table-body",
    );

  // ============================================================
  // ADD RESERVATION
  // ============================================================

  addButton?.addEventListener("click", () => {
    clearMessage();
    renderReservationForm();
  });

  // ============================================================
  // SEARCH RESERVATIONS
  // ============================================================

  const performSearch = async (): Promise<void> => {
    const query = searchInput?.value.trim() || "";

    if (!query) {
      await loadReservations();
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
      const response = await apiGet<Reservation[]>(
        `/reservations/search?q=${encodeURIComponent(query)}`,
      );

      renderReservations(
        response.data ?? [],
        query,
      );
    } catch (error) {
      if (searchMessage) {
        searchMessage.textContent =
          getErrorMessage(
            error,
            "Failed to search reservations.",
          );

        searchMessage.className =
          "mt-3 text-sm text-red-600";
      }

      if (searchButton) {
        searchButton.disabled = false;
      }
    }
  };

  searchButton?.addEventListener("click", () => {
    void performSearch();
  });

  searchInput?.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void performSearch();
    }
  });

  // ============================================================
  // RESET SEARCH
  // ============================================================

  resetButton?.addEventListener("click", () => {
    void loadReservations();
  });

  // ============================================================
  // TABLE ACTIONS
  // ============================================================

  tableBody?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;

    const editButton =
      target.closest<HTMLButtonElement>(
        "[data-edit-reservation]",
      );

    const deleteButton =
      target.closest<HTMLButtonElement>(
        "[data-delete-reservation]",
      );

    // --------------------------------------------------------
    // EDIT
    // --------------------------------------------------------

    if (editButton) {
      const reservationId = Number(
        editButton.dataset.editReservation,
      );

      const reservation = reservations.find(
        (item) =>
          item.reservation_id === reservationId,
      );

      if (reservation) {
        clearMessage();
        renderReservationForm(reservation);

        document
          .querySelector<HTMLElement>(
            "#reservation-form-container",
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
      }

      return;
    }

    // --------------------------------------------------------
    // DELETE
    // --------------------------------------------------------

    if (deleteButton) {
      const reservationId = Number(
        deleteButton.dataset.deleteReservation,
      );

      if (!Number.isFinite(reservationId)) {
        showMessage(
          "Invalid reservation ID.",
          "error",
        );

        return;
      }

      const reservation = reservations.find(
        (item) =>
          item.reservation_id === reservationId,
      );

      const confirmed = window.confirm(
        `Are you sure you want to delete reservation #${reservation?.reservation_id ?? reservationId}?`,
      );

      if (!confirmed) return;

      deleteButton.disabled = true;

      try {
        const response = await apiDelete(
          `/reservations/${reservationId}`,
        );

        showMessage(
          response.message ||
            "Reservation deleted successfully.",
          "success",
        );

        await loadReservations();
      } catch (error) {
        showMessage(
          getErrorMessage(
            error,
            "Failed to delete reservation.",
          ),
          "error",
        );

        deleteButton.disabled = false;
      }
    }
  });
}

// ============================================================
// LOAD RESERVATIONS
// ============================================================

export async function loadReservations(): Promise<void> {
  const pageContent = getPageContent();

  pageContent.innerHTML = `
    <div class="flex min-h-64 flex-col items-center
      justify-center gap-3">

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
        Loading reservations...
      </p>

    </div>
  `;

  try {
    const response = await apiGet<Reservation[]>(
      "/reservations",
    );

    reservations = response.data ?? [];

    renderReservations(reservations);
  } catch (error) {
    const errorMessage = getErrorMessage(
      error,
      "An unexpected error occurred.",
    );

    pageContent.innerHTML = `
      <div class="rounded-xl border border-red-100
        bg-red-50 p-6">

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
              Failed to Load Reservations
            </h2>

            <p class="mt-2 text-sm text-red-600">
              ${escapeHtml(errorMessage)}
            </p>

            <button
              id="retry-reservations-button"
              type="button"
              class="mt-4 inline-flex items-center
                justify-center gap-2 rounded-lg bg-red-600
                px-4 py-2.5 text-sm font-medium text-white
                transition hover:bg-red-700
                focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-red-500
                focus-visible:ring-offset-2"
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
                <path d="M3 12a9 9 0 1 0 3-6.7"/>
                <path d="M3 3v6h6"/>
              </svg>

              Try Again
            </button>

          </div>

        </div>

      </div>
    `;

    document
      .querySelector<HTMLButtonElement>(
        "#retry-reservations-button",
      )
      ?.addEventListener("click", () => {
        void loadReservations();
      });
  }
}

// ============================================================
// PUBLIC PAGE ENTRY POINT
// ============================================================

export async function loadReservationPage(): Promise<void> {
  const pageContent = getPageContent();

  pageContent.innerHTML = `
    <div class="flex min-h-64 flex-col items-center
      justify-center gap-3">

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
        Loading reservation data...
      </p>

    </div>
  `;

  try {
    await loadReservationData();
    await loadReservations();
  } catch (error) {
    const errorMessage = getErrorMessage(
      error,
      "Unable to load reservation data.",
    );

    pageContent.innerHTML = `
      <div class="rounded-xl border border-red-100
        bg-red-50 p-6">

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
              Failed to Load Reservation Data
            </h2>

            <p class="mt-2 text-sm text-red-600">
              ${escapeHtml(errorMessage)}
            </p>

            <button
              id="retry-reservation-data-button"
              type="button"
              class="mt-4 inline-flex items-center
                justify-center gap-2 rounded-lg bg-red-600
                px-4 py-2.5 text-sm font-medium text-white
                transition hover:bg-red-700
                focus-visible:outline-none
                focus-visible:ring-2 focus-visible:ring-red-500
                focus-visible:ring-offset-2"
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
                <path d="M3 12a9 9 0 1 0 3-6.7"/>
                <path d="M3 3v6h6"/>
              </svg>

              Try Again
            </button>

          </div>

        </div>

      </div>
    `;

    document
      .querySelector<HTMLButtonElement>(
        "#retry-reservation-data-button",
      )
      ?.addEventListener("click", () => {
        void loadReservationPage();
      });
  }
}