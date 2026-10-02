import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../api/client";
import type {
  RestaurantTable,
  TableStatus,
} from "../types/table";

// ============================================================
// TYPES
// ============================================================

interface Restaurant {
  restaurant_id: number;
  restaurant_name: string;
}

const TABLE_STATUSES: TableStatus[] = [
  "available",
  "occupied",
  "reserved",
  "maintenance",
];

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

function formatTableStatus(
  status: TableStatus,
): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusBadgeClass(
  status: TableStatus,
): string {
  switch (status) {
    case "available":
      return "bg-green-100 text-green-700";

    case "occupied":
      return "bg-red-100 text-red-700";

    case "reserved":
      return "bg-blue-100 text-blue-700";

    case "maintenance":
      return "bg-yellow-100 text-yellow-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
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
      "#table-page-message",
    );

  if (!messageElement) {
    return;
  }

  messageElement.textContent = message;

  messageElement.className =
    type === "success"
      ? "mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700"
      : "mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700";
}

function clearMessage(): void {
  const messageElement =
    document.querySelector<HTMLParagraphElement>(
      "#table-page-message",
    );

  if (!messageElement) {
    return;
  }

  messageElement.textContent = "";
  messageElement.className = "mt-4 text-sm";
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
// BUTTON STYLES
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
// TABLE RENDERING
// ============================================================

function renderTableRows(
  tables: RestaurantTable[],
): string {
  if (tables.length === 0) {
    return `
      <tr>
        <td
          colspan="6"
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
              <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
              />

              <path d="M3 10h18"/>
              <path d="M8 5v5"/>
              <path d="M16 5v5"/>
              <path d="M8 14h.01"/>
              <path d="M12 14h.01"/>
              <path d="M16 14h.01"/>
            </svg>

            <p class="text-sm font-medium text-gray-700">
              No tables found.
            </p>

            <p class="text-xs text-gray-500">
              Try another search or add a new table.
            </p>

          </div>
        </td>
      </tr>
    `;
  }

  return tables
    .map(
      (table) => `
        <tr class="border-b border-gray-100 transition hover:bg-gray-50">

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(table.table_id)}
          </td>

          <td class="min-w-44 px-6 py-4 text-sm font-medium text-gray-900">
            ${escapeHtml(table.restaurant_name)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(table.table_number)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(table.capacity)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            <span
              class="inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                table.table_status,
              )}"
            >
              ${escapeHtml(
                formatTableStatus(table.table_status),
              )}
            </span>
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm">
            <div class="flex flex-wrap gap-2">

              <button
                type="button"
                data-edit-table="${escapeHtml(table.table_id)}"
                aria-label="Edit table ${escapeHtml(table.table_id)}"
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
                data-delete-table="${escapeHtml(table.table_id)}"
                aria-label="Delete table ${escapeHtml(table.table_id)}"
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
// FORM OPTIONS
// ============================================================

function renderRestaurantOptions(
  restaurants: Restaurant[],
  selectedRestaurantId = "",
): string {
  return restaurants
    .map(
      (restaurant) => `
        <option
          value="${escapeHtml(restaurant.restaurant_id)}"
          ${
            String(restaurant.restaurant_id) ===
            selectedRestaurantId
              ? "selected"
              : ""
          }
        >
          ${escapeHtml(restaurant.restaurant_name)}
        </option>
      `,
    )
    .join("");
}

function renderStatusOptions(
  selectedStatus: TableStatus = "available",
): string {
  return TABLE_STATUSES.map(
    (status) => `
      <option
        value="${escapeHtml(status)}"
        ${status === selectedStatus ? "selected" : ""}
      >
        ${escapeHtml(formatTableStatus(status))}
      </option>
    `,
  ).join("");
}

// ============================================================
// FORM VALIDATION
// ============================================================

function validateTableForm(
  restaurantId: string,
  tableNumber: string,
  capacity: string,
  tableStatus: string,
): string | null {
  if (!restaurantId || !tableNumber || !capacity || !tableStatus) {
    return "All fields are required.";
  }

  const parsedRestaurantId = Number(restaurantId);
  const parsedTableNumber = Number(tableNumber);
  const parsedCapacity = Number(capacity);

  if (
    !Number.isInteger(parsedRestaurantId) ||
    parsedRestaurantId <= 0
  ) {
    return "Please select a valid restaurant.";
  }

  if (
    !Number.isInteger(parsedTableNumber) ||
    parsedTableNumber <= 0
  ) {
    return "Table number must be a positive whole number.";
  }

  if (
    !Number.isInteger(parsedCapacity) ||
    parsedCapacity <= 0
  ) {
    return "Capacity must be a positive whole number.";
  }

  if (
    !TABLE_STATUSES.includes(
      tableStatus as TableStatus,
    )
  ) {
    return "Please select a valid table status.";
  }

  return null;
}

// ============================================================
// FORM RENDERING
// ============================================================

function renderTableForm(
  table: RestaurantTable | undefined,
  restaurantList: Restaurant[],
): void {
  const formContainer =
    document.querySelector<HTMLDivElement>(
      "#table-form-container",
    );

  if (!formContainer) {
    return;
  }

  const isEditing = Boolean(table);

  const restaurantId = table
    ? escapeHtml(table.restaurant_id)
    : "";

  const tableNumber = table
    ? escapeHtml(table.table_number)
    : "";

  const capacity = table
    ? escapeHtml(table.capacity)
    : "";

  const tableStatus = table?.table_status ?? "available";

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
                    ? `<path d="M12 20h9"/>
                       <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>`
                    : `<path d="M12 5v14"/>
                       <path d="M5 12h14"/>`
                }
              </svg>
            </div>

            <h3 class="text-xl font-semibold text-gray-800">
              ${isEditing ? "Edit Table" : "Add Table"}
            </h3>

          </div>

          <p class="mt-2 text-sm text-gray-500">
            ${
              isEditing
                ? "Update the restaurant table information below."
                : "Add a new table to the restaurant."
            }
          </p>
        </div>

        <button
          type="button"
          id="cancel-table-form"
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

      <form id="table-form" class="space-y-5">

        <!-- Restaurant and Table Number -->

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label
              for="table-restaurant-id"
              class="${labelClass}"
            >
              Restaurant
            </label>

            <select
              id="table-restaurant-id"
              name="restaurant_id"
              required
              class="${inputClass}"
            >
              <option value="">
                Select restaurant
              </option>

              ${renderRestaurantOptions(
                restaurantList,
                String(restaurantId),
              )}
            </select>
          </div>

          <div>
            <label
              for="table-number"
              class="${labelClass}"
            >
              Table Number
            </label>

            <input
              id="table-number"
              name="table_number"
              type="number"
              min="1"
              step="1"
              required
              value="${tableNumber}"
              placeholder="Enter table number"
              class="${inputClass}"
            />
          </div>

        </div>

        <!-- Capacity and Status -->

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label
              for="table-capacity"
              class="${labelClass}"
            >
              Capacity
            </label>

            <input
              id="table-capacity"
              name="capacity"
              type="number"
              min="1"
              step="1"
              required
              value="${capacity}"
              placeholder="Enter table capacity"
              class="${inputClass}"
            />
          </div>

          <div>
            <label
              for="table-status"
              class="${labelClass}"
            >
              Table Status
            </label>

            <select
              id="table-status"
              name="table_status"
              required
              class="${inputClass}"
            >
              ${renderStatusOptions(tableStatus)}
            </select>
          </div>

        </div>

        <!-- Form Buttons -->

        <div class="flex flex-wrap gap-3 border-t border-gray-200 pt-5">

          <button
            type="submit"
            id="table-submit-button"
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

            ${isEditing ? "Update Table" : "Save Table"}
          </button>

          <button
            type="button"
            id="cancel-table-form-bottom"
            class="${secondaryButtonClass}"
          >
            Cancel
          </button>

        </div>

        <p
          id="table-form-message"
          class="text-sm"
          role="status"
          aria-live="polite"
        ></p>

      </form>
    </div>
  `;

  const form =
    document.querySelector<HTMLFormElement>(
      "#table-form",
    );

  const cancelButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-table-form",
    );

  const cancelBottomButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-table-form-bottom",
    );

  const formMessage =
    document.querySelector<HTMLParagraphElement>(
      "#table-form-message",
    );

  const submitButton =
    document.querySelector<HTMLButtonElement>(
      "#table-submit-button",
    );

  const closeForm = (): void => {
    formContainer.innerHTML = "";
  };

  cancelButton?.addEventListener("click", closeForm);
  cancelBottomButton?.addEventListener("click", closeForm);

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!formMessage || !submitButton) {
      return;
    }

    if (submitButton.disabled) {
      return;
    }

    const formData = new FormData(form);

    const restaurantId = String(
      formData.get("restaurant_id") || "",
    ).trim();

    const tableNumber = String(
      formData.get("table_number") || "",
    ).trim();

    const capacity = String(
      formData.get("capacity") || "",
    ).trim();

    const tableStatus = String(
      formData.get("table_status") || "",
    ).trim();

    const validationError = validateTableForm(
      restaurantId,
      tableNumber,
      capacity,
      tableStatus,
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
      restaurant_id: Number(restaurantId),
      table_number: Number(tableNumber),
      capacity: Number(capacity),
      table_status: tableStatus as TableStatus,
    };

    submitButton.disabled = true;

    submitButton.textContent = isEditing
      ? "Updating..."
      : "Saving...";

    showFormMessage(
      formMessage,
      isEditing
        ? "Updating table..."
        : "Saving table...",
      "loading",
    );

    try {
      const response = isEditing
        ? await apiPut(
            `/tables/${table?.table_id}`,
            requestBody,
          )
        : await apiPost(
            "/tables",
            requestBody,
          );

      showFormMessage(
        formMessage,
        response.message ||
          (isEditing
            ? "Table updated successfully."
            : "Table created successfully."),
        "success",
      );

      await loadTables();

      showMessage(
        response.message ||
          (isEditing
            ? "Table updated successfully."
            : "Table created successfully."),
        "success",
      );
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
        ? "Update Table"
        : "Save Table";
    }
  });
}

// ============================================================
// MAIN PAGE RENDERING
// ============================================================

function renderTables(
  tables: RestaurantTable[],
  restaurants: Restaurant[],
  searchTerm = "",
): void {
  const pageContent = getPageContent();

  pageContent.innerHTML = `
    <!-- PAGE HEADER -->

    <div class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

      <div>
        <h2 class="text-2xl font-bold text-gray-800">
          Table Management
        </h2>

        <p class="mt-1 text-sm text-gray-500">
          Manage restaurant tables, capacities, and statuses.
        </p>
      </div>

      <button
        id="add-table-button"
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

        Add Table
      </button>

    </div>

    <!-- PAGE MESSAGE -->

    <p
      id="table-page-message"
      class="mb-4 text-sm"
      role="status"
      aria-live="polite"
    ></p>

    <!-- FORM CONTAINER -->

    <div
      id="table-form-container"
      class="mb-6"
    ></div>

    <!-- SEARCH CARD -->

    <div class="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">

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
          Search Tables
        </h3>

      </div>

      <div class="flex flex-col gap-3 sm:flex-row">

        <input
          id="table-search"
          type="search"
          value="${escapeHtml(searchTerm)}"
          placeholder="Search by restaurant, table number, capacity, or status..."
          aria-label="Search tables"
          class="min-w-0 flex-1 ${inputClass}"
        />

        <button
          id="table-search-button"
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
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
          id="table-reset-button"
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
        id="table-search-message"
        class="mt-3 text-sm"
        role="status"
        aria-live="polite"
      ></p>

    </div>

    <!-- TABLE CARD -->

    <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

      <div class="flex flex-col justify-between gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center">

        <h3 class="text-base font-semibold text-gray-800">
          Table List
        </h3>

        <span class="text-sm text-gray-500">
          ${tables.length} table${tables.length === 1 ? "" : "s"}
        </span>

      </div>

      <div class="overflow-x-auto">

        <table class="min-w-full">

          <thead class="bg-gray-50">

            <tr>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                ID
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Restaurant
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Table Number
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Capacity
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Status
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Actions
              </th>

            </tr>

          </thead>

          <tbody id="table-table-body">
            ${renderTableRows(tables)}
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
      "#add-table-button",
    );

  const searchInput =
    document.querySelector<HTMLInputElement>(
      "#table-search",
    );

  const searchButton =
    document.querySelector<HTMLButtonElement>(
      "#table-search-button",
    );

  const resetButton =
    document.querySelector<HTMLButtonElement>(
      "#table-reset-button",
    );

  const searchMessage =
    document.querySelector<HTMLParagraphElement>(
      "#table-search-message",
    );

  const tableBody =
    document.querySelector<HTMLTableSectionElement>(
      "#table-table-body",
    );

  // ============================================================
  // ADD TABLE
  // ============================================================

  addButton?.addEventListener("click", () => {
    clearMessage();

    renderTableForm(undefined, restaurants);
  });

  // ============================================================
  // SEARCH TABLES
  // ============================================================

  const performSearch = async (): Promise<void> => {
    const searchTerm =
      searchInput?.value.trim() || "";

    if (!searchTerm) {
      await loadTables();

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
      const response = await apiGet<RestaurantTable[]>(
        `/tables/search?q=${encodeURIComponent(searchTerm)}`,
      );

      renderTables(
        response.data ?? [],
        restaurants,
        searchTerm,
      );
    } catch (error) {
      if (searchMessage) {
        searchMessage.textContent =
          getErrorMessage(
            error,
            "Failed to search tables.",
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
    void loadTables();
  });

  // ============================================================
  // TABLE ACTIONS
  // ============================================================

  tableBody?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;

    const editButton =
      target.closest<HTMLButtonElement>(
        "[data-edit-table]",
      );

    const deleteButton =
      target.closest<HTMLButtonElement>(
        "[data-delete-table]",
      );

    // --------------------------------------------------------
    // EDIT TABLE
    // --------------------------------------------------------

    if (editButton) {
      const tableId = Number(
        editButton.dataset.editTable,
      );

      const table = tables.find(
        (item) => item.table_id === tableId,
      );

      if (table) {
        clearMessage();

        renderTableForm(table, restaurants);
      }

      return;
    }

    // --------------------------------------------------------
    // DELETE TABLE
    // --------------------------------------------------------

    if (deleteButton) {
      const tableId = Number(
        deleteButton.dataset.deleteTable,
      );

      if (!Number.isFinite(tableId)) {
        showMessage(
          "Invalid table ID.",
          "error",
        );

        return;
      }

      const table = tables.find(
        (item) => item.table_id === tableId,
      );

      const tableName = table
        ? `Table ${table.table_number}`
        : "this table";

      const confirmed = window.confirm(
        `Are you sure you want to delete "${tableName}"?`,
      );

      if (!confirmed) {
        return;
      }

      deleteButton.disabled = true;

      try {
        const response = await apiDelete(
          `/tables/${tableId}`,
        );

        showMessage(
          response.message ||
            "Table deleted successfully.",
          "success",
        );

        await loadTables();
      } catch (error) {
        showMessage(
          getErrorMessage(
            error,
            "Failed to delete table. It may be used by reservations or orders.",
          ),
          "error",
        );

        deleteButton.disabled = false;
      }
    }
  });
}

// ============================================================
// LOAD TABLES
// ============================================================

export async function loadTables(): Promise<void> {
  const pageContent = getPageContent();

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
        Loading tables...
      </p>

    </div>
  `;

  try {
    const [tableResponse, restaurantResponse] =
      await Promise.all([
        apiGet<RestaurantTable[]>("/tables"),
        apiGet<Restaurant[]>("/restaurants"),
      ]);

    renderTables(
      tableResponse.data ?? [],
      restaurantResponse.data ?? [],
    );
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
              Failed to Load Tables
            </h2>

            <p class="mt-2 text-sm text-red-600">
              ${escapeHtml(errorMessage)}
            </p>

            <button
              id="retry-tables-button"
              type="button"
              class="mt-4 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
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
        "#retry-tables-button",
      )
      ?.addEventListener("click", () => {
        void loadTables();
      });
  }
}