
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../api/client";

import type { MenuItem } from "../types/menu-item";
import type { Category } from "../types/category";

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

function isAvailable(value: unknown): boolean {
  return (
    value === true ||
    value === 1 ||
    String(value) === "1" ||
    String(value).toLowerCase() === "true"
  );
}

function formatPrice(value: unknown): string {
  const price = Number(value);

  return Number.isFinite(price)
    ? price.toFixed(2)
    : "0.00";
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
      "#menu-item-page-message",
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
      "#menu-item-page-message",
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
// CATEGORY HELPERS
// ============================================================

async function getCategories(): Promise<Category[]> {
  const response =
    await apiGet<Category[]>("/categories");

  return response.data ?? [];
}

// ============================================================
// TABLE RENDERING
// ============================================================

function renderMenuItemRows(
  items: MenuItem[],
): string {
  if (items.length === 0) {
    return `
      <tr>
        <td
          colspan="8"
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
              <path d="M9 14h3"/>
            </svg>

            <p class="text-sm font-medium text-gray-700">
              No menu items found.
            </p>

            <p class="text-xs text-gray-500">
              Try another search or add a new menu item.
            </p>

          </div>
        </td>
      </tr>
    `;
  }

  return items
    .map((item) => {
      const available = isAvailable(
        item.availability,
      );

      return `
        <tr class="border-b border-gray-100 transition hover:bg-gray-50">

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(item.item_id)}
          </td>

          <td class="min-w-44 px-6 py-4 text-sm font-medium text-gray-900">
            ${escapeHtml(item.item_name)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(item.category_name || "—")}
          </td>

          <td class="max-w-xs whitespace-normal wrap-break-word px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(item.description || "—")}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${formatPrice(item.price)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm">

            <span
              class="${
                available
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              } inline-flex items-center rounded-md
                 px-2.5 py-1 text-xs font-medium"
            >
              ${available ? "Available" : "Unavailable"}
            </span>

          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(item.preparation_time)} min
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm">

            <div class="flex flex-wrap gap-2">

              <button
                type="button"
                data-edit-menu-item="${escapeHtml(item.item_id)}"
                aria-label="Edit ${escapeHtml(item.item_name)}"
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
                data-delete-menu-item="${escapeHtml(item.item_id)}"
                aria-label="Delete ${escapeHtml(item.item_name)}"
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
      `;
    })
    .join("");
}

// ============================================================
// FORM VALIDATION
// ============================================================

function validateMenuItemForm(
  itemName: string,
  categoryId: number,
  price: number,
  preparationTime: number,
): string | null {
  if (!itemName || !categoryId) {
    return "Item name and category are required.";
  }

  if (itemName.length > 255) {
    return "Item name is too long.";
  }

  if (!Number.isFinite(price) || price < 0) {
    return "Please enter a valid price.";
  }

  if (
    !Number.isInteger(preparationTime) ||
    preparationTime < 0
  ) {
    return "Preparation time must be a non-negative whole number.";
  }

  return null;
}

// ============================================================
// FORM RENDERING
// ============================================================

async function renderMenuItemForm(
  item?: MenuItem,
): Promise<void> {
  const formContainer =
    document.querySelector<HTMLDivElement>(
      "#menu-item-form-container",
    );

  if (!formContainer) {
    return;
  }

  const categories = await getCategories();

  const isEditing = Boolean(item);

  const categoryOptions = categories
    .map(
      (category) => `
        <option
          value="${escapeHtml(category.category_id)}"
          ${
            Number(item?.category_id) ===
            Number(category.category_id)
              ? "selected"
              : ""
          }
        >
          ${escapeHtml(category.category_name)}
        </option>
      `,
    )
    .join("");

  const itemName = item
    ? escapeHtml(item.item_name)
    : "";

  const description = item
    ? escapeHtml(item.description)
    : "";

  const price = item
    ? escapeHtml(item.price)
    : "";

  const preparationTime = item
    ? escapeHtml(item.preparation_time)
    : "";

  const available = isAvailable(
    item?.availability,
  );

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
              ${isEditing ? "Edit Menu Item" : "Add Menu Item"}
            </h3>

          </div>

          <p class="mt-2 text-sm text-gray-500">
            ${
              isEditing
                ? "Update the menu item information below."
                : "Add a new menu item to the system."
            }
          </p>
        </div>

        <button
          type="button"
          id="cancel-menu-item-form"
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

      <form id="menu-item-form" class="space-y-5">

        <!-- Item Name and Category -->

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label
              for="menu-item-name"
              class="${labelClass}"
            >
              Item Name
            </label>

            <input
              id="menu-item-name"
              name="item_name"
              type="text"
              required
              maxlength="255"
              value="${itemName}"
              placeholder="Enter item name"
              class="${inputClass}"
            />
          </div>

          <div>
            <label
              for="menu-item-category"
              class="${labelClass}"
            >
              Category
            </label>

            <select
              id="menu-item-category"
              name="category_id"
              required
              class="${inputClass}"
            >
              <option value="">
                Select category
              </option>

              ${categoryOptions}
            </select>
          </div>

        </div>

        <!-- Description -->

        <div>
          <label
            for="menu-item-description"
            class="${labelClass}"
          >
            Description
          </label>

          <textarea
            id="menu-item-description"
            name="description"
            rows="3"
            maxlength="1000"
            placeholder="Enter menu item description"
            class="${inputClass} resize-y"
          >${description}</textarea>
        </div>

        <!-- Price and Preparation Time -->

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label
              for="menu-item-price"
              class="${labelClass}"
            >
              Price
            </label>

            <input
              id="menu-item-price"
              name="price"
              type="number"
              min="0"
              step="0.01"
              required
              value="${price}"
              placeholder="0.00"
              class="${inputClass}"
            />
          </div>

          <div>
            <label
              for="menu-item-preparation-time"
              class="${labelClass}"
            >
              Preparation Time (Minutes)
            </label>

            <input
              id="menu-item-preparation-time"
              name="preparation_time"
              type="number"
              min="0"
              step="1"
              required
              value="${preparationTime}"
              placeholder="15"
              class="${inputClass}"
            />
          </div>

        </div>

        <!-- Availability -->

        <div>
          <label
            for="menu-item-availability"
            class="${labelClass}"
          >
            Availability
          </label>

          <select
            id="menu-item-availability"
            name="availability"
            required
            class="${inputClass}"
          >
            <option
              value="1"
              ${available ? "selected" : ""}
            >
              Available
            </option>

            <option
              value="0"
              ${item && !available ? "selected" : ""}
            >
              Unavailable
            </option>
          </select>
        </div>

        <!-- Form Buttons -->

        <div class="flex flex-wrap gap-3 border-t border-gray-200 pt-5">

          <button
            type="submit"
            id="menu-item-submit-button"
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

            ${isEditing ? "Update Menu Item" : "Save Menu Item"}
          </button>

          <button
            type="button"
            id="cancel-menu-item-form-bottom"
            class="${secondaryButtonClass}"
          >
            Cancel
          </button>

        </div>

        <p
          id="menu-item-form-message"
          class="text-sm"
          role="status"
          aria-live="polite"
        ></p>

      </form>
    </div>
  `;

  // ============================================================
  // FORM ELEMENT REFERENCES
  // ============================================================

  const form =
    document.querySelector<HTMLFormElement>(
      "#menu-item-form",
    );

  const cancelButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-menu-item-form",
    );

  const cancelBottomButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-menu-item-form-bottom",
    );

  const formMessage =
    document.querySelector<HTMLParagraphElement>(
      "#menu-item-form-message",
    );

  const submitButton =
    document.querySelector<HTMLButtonElement>(
      "#menu-item-submit-button",
    );

  const closeForm = (): void => {
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

  // ============================================================
  // FORM SUBMISSION
  // ============================================================

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!formMessage || !submitButton) {
      return;
    }

    if (submitButton.disabled) {
      return;
    }

    const formData = new FormData(form);

    const itemName = String(
      formData.get("item_name") || "",
    ).trim();

    const categoryId = Number(
      formData.get("category_id"),
    );

    const description = String(
      formData.get("description") || "",
    ).trim();

    const price = Number(
      formData.get("price"),
    );

    const preparationTime = Number(
      formData.get("preparation_time"),
    );

    const availability = Number(
      formData.get("availability"),
    );

    const validationError =
      validateMenuItemForm(
        itemName,
        categoryId,
        price,
        preparationTime,
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
      category_id: categoryId,
      item_name: itemName,
      description: description || null,
      price,
      availability,
      preparation_time: preparationTime,
    };

    submitButton.disabled = true;

    submitButton.textContent = isEditing
      ? "Updating..."
      : "Saving...";

    showFormMessage(
      formMessage,
      isEditing
        ? "Updating menu item..."
        : "Saving menu item...",
      "loading",
    );

    try {
      const response = isEditing
        ? await apiPut(
            `/menu-items/${item?.item_id}`,
            requestBody,
          )
        : await apiPost(
            "/menu-items",
            requestBody,
          );

      const successMessage =
        response.message ||
        (isEditing
          ? "Menu item updated successfully."
          : "Menu item created successfully.");

      showFormMessage(
        formMessage,
        successMessage,
        "success",
      );

      await loadMenuItems();

      showMessage(
        successMessage,
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
        ? "Update Menu Item"
        : "Save Menu Item";
    }
  });
}

// ============================================================
// MAIN PAGE RENDERING
// ============================================================

function renderMenuItems(
  items: MenuItem[],
  searchTerm = "",
): void {
  const pageContent = getPageContent();

  pageContent.innerHTML = `
    <!-- PAGE HEADER -->

    <div class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

      <div>
        <h2 class="text-2xl font-bold text-gray-800">
          Menu Item Management
        </h2>

        <p class="mt-1 text-sm text-gray-500">
          Manage menu items, prices, categories, and availability.
        </p>
      </div>

      <button
        id="add-menu-item-button"
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

        Add Menu Item
      </button>

    </div>

    <!-- PAGE MESSAGE -->

    <p
      id="menu-item-page-message"
      class="mb-4 text-sm"
      role="status"
      aria-live="polite"
    ></p>

    <!-- FORM CONTAINER -->

    <div
      id="menu-item-form-container"
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
          Search Menu Items
        </h3>

      </div>

      <div class="flex flex-col gap-3 sm:flex-row">

        <input
          id="menu-item-search"
          type="search"
          value="${escapeHtml(searchTerm)}"
          placeholder="Search by item name or category..."
          aria-label="Search menu items by name or category"
          class="min-w-0 flex-1 ${inputClass}"
        />

        <button
          id="menu-item-search-button"
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
          id="menu-item-reset-button"
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
        id="menu-item-search-message"
        class="mt-3 text-sm"
        role="status"
        aria-live="polite"
      ></p>

    </div>

    <!-- TABLE CARD -->

    <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

      <div class="flex flex-col justify-between gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center">

        <h3 class="text-base font-semibold text-gray-800">
          Menu Item List
        </h3>

        <span class="text-sm text-gray-500">
          ${items.length} menu item${items.length === 1 ? "" : "s"}
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
                Item Name
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Category
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Description
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Price
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Availability
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Preparation
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Actions
              </th>

            </tr>

          </thead>

          <tbody id="menu-item-table-body">
            ${renderMenuItemRows(items)}
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
      "#add-menu-item-button",
    );

  const searchInput =
    document.querySelector<HTMLInputElement>(
      "#menu-item-search",
    );

  const searchButton =
    document.querySelector<HTMLButtonElement>(
      "#menu-item-search-button",
    );

  const resetButton =
    document.querySelector<HTMLButtonElement>(
      "#menu-item-reset-button",
    );

  const searchMessage =
    document.querySelector<HTMLParagraphElement>(
      "#menu-item-search-message",
    );

  const tableBody =
    document.querySelector<HTMLTableSectionElement>(
      "#menu-item-table-body",
    );

  // ============================================================
  // ADD MENU ITEM
  // ============================================================

  addButton?.addEventListener("click", () => {
    clearMessage();
    void renderMenuItemForm();
  });

  // ============================================================
  // SEARCH MENU ITEMS
  // ============================================================

  const performSearch = async (): Promise<void> => {
    const currentSearchTerm =
      searchInput?.value.trim() || "";

    if (!currentSearchTerm) {
      await loadMenuItems();
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
      const response = await apiGet<MenuItem[]>(
        `/menu-items/search?q=${encodeURIComponent(currentSearchTerm)}`,
      );

      renderMenuItems(
        response.data ?? [],
        currentSearchTerm,
      );
    } catch (error) {
      if (searchMessage) {
        searchMessage.textContent =
          getErrorMessage(
            error,
            "Failed to search menu items.",
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
    void loadMenuItems();
  });

  // ============================================================
  // TABLE ACTIONS
  // ============================================================

  tableBody?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;

    const editButton =
      target.closest<HTMLButtonElement>(
        "[data-edit-menu-item]",
      );

    const deleteButton =
      target.closest<HTMLButtonElement>(
        "[data-delete-menu-item]",
      );

    // --------------------------------------------------------
    // EDIT
    // --------------------------------------------------------

    if (editButton) {
      const itemId = Number(
        editButton.dataset.editMenuItem,
      );

      const item = items.find(
        (menuItem) =>
          Number(menuItem.item_id) === itemId,
      );

      if (item) {
        clearMessage();
        await renderMenuItemForm(item);
      }

      return;
    }

    // --------------------------------------------------------
    // DELETE
    // --------------------------------------------------------

    if (deleteButton) {
      const itemId = Number(
        deleteButton.dataset.deleteMenuItem,
      );

      if (!Number.isFinite(itemId)) {
        showMessage(
          "Invalid menu item ID.",
          "error",
        );

        return;
      }

      const item = items.find(
        (menuItem) =>
          Number(menuItem.item_id) === itemId,
      );

      const itemName =
        item?.item_name ||
        "this menu item";

      const confirmed = window.confirm(
        `Are you sure you want to delete "${itemName}"?`,
      );

      if (!confirmed) {
        return;
      }

      deleteButton.disabled = true;

      try {
        const response = await apiDelete(
          `/menu-items/${itemId}`,
        );

        showMessage(
          response.message ||
            "Menu item deleted successfully.",
          "success",
        );

        await loadMenuItems();
      } catch (error) {
        showMessage(
          getErrorMessage(
            error,
            "Failed to delete menu item.",
          ),
          "error",
        );

        deleteButton.disabled = false;
      }
    }
  });
}

// ============================================================
// LOAD MENU ITEMS
// ============================================================

export async function loadMenuItems(): Promise<void> {
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
        Loading menu items...
      </p>

    </div>
  `;

  try {
    const response = await apiGet<MenuItem[]>(
      "/menu-items",
    );

    renderMenuItems(response.data ?? []);
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
              Failed to Load Menu Items
            </h2>

            <p class="mt-2 text-sm text-red-600">
              ${escapeHtml(errorMessage)}
            </p>

            <button
              id="retry-menu-items-button"
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
        "#retry-menu-items-button",
      )
      ?.addEventListener("click", () => {
        void loadMenuItems();
      });
  }
}