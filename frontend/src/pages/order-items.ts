import { apiDelete, apiGet, apiPost, apiPut } from "../api/client";
import type { OrderItem } from "../types/order-item";

interface Order {
  order_id: number;
  restaurant_id: number;
  restaurant_name: string;
  order_date: string;
  order_type: string;
  order_status: string;
}

interface MenuItem {
  item_id: number;
  category_id: number;
  category_name: string;
  item_name: string;
  description: string | null;
  price: number;
  availability: boolean | number;
  preparation_time: number;
}

let orderItems: OrderItem[] = [];
let orders: Order[] = [];
let menuItems: MenuItem[] = [];

let editingOrderItemId: number | null = null;

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
  return error instanceof Error ? error.message : fallback;
}

// ============================================================
// BUTTON / INPUT STYLES
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
  const messageElement =
    document.querySelector<HTMLParagraphElement>(
      "#order-item-page-message",
    );

  if (!messageElement) {
    return;
  }

  messageElement.textContent = message;

  messageElement.className =
    type === "success"
      ? "mb-4 text-sm text-green-600"
      : "mb-4 text-sm text-red-600";
}

function clearMessage(): void {
  const messageElement =
    document.querySelector<HTMLParagraphElement>(
      "#order-item-page-message",
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
// OPTION HELPERS
// ============================================================

function getOrderOptions(selectedId = ""): string {
  const options = orders
    .map(
      (order) => `
        <option
          value="${escapeHtml(order.order_id)}"
          ${
            String(order.order_id) === String(selectedId)
              ? "selected"
              : ""
          }
        >
          Order #${escapeHtml(order.order_id)}
          - ${escapeHtml(order.restaurant_name)}
          (${escapeHtml(order.order_status)})
        </option>
      `,
    )
    .join("");

  return `
    <option value="">Select order</option>
    ${options}
  `;
}

function getMenuItemOptions(selectedId = ""): string {
  const options = menuItems
    .filter((item) => Boolean(item.availability))
    .map(
      (item) => `
        <option
          value="${escapeHtml(item.item_id)}"
          data-price="${escapeHtml(item.price)}"
          ${
            String(item.item_id) === String(selectedId)
              ? "selected"
              : ""
          }
        >
          ${escapeHtml(item.item_name)}
          - ${Number(item.price).toFixed(2)}
        </option>
      `,
    )
    .join("");

  return `
    <option value="">Select menu item</option>
    ${options}
  `;
}

// ============================================================
// TABLE RENDERING
// ============================================================

function renderOrderItemRows(
  items: OrderItem[],
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
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path
                d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"
              />
            </svg>

            <p class="text-sm font-medium text-gray-700">
              No order items found.
            </p>

            <p class="text-xs text-gray-500">
              Try another search or add a new order item.
            </p>

          </div>
        </td>
      </tr>
    `;
  }

  return items
    .map(
      (item) => `
        <tr class="border-b border-gray-100 transition hover:bg-gray-50">

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(item.order_item_id)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            #${escapeHtml(item.order_id)}
          </td>

          <td class="min-w-44 px-6 py-4 text-sm font-medium text-gray-900">
            ${escapeHtml(item.item_name)}
          </td>

          <td class="min-w-44 px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(item.restaurant_name)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            <span
              class="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
            >
              ${escapeHtml(item.quantity)}
            </span>
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${Number(item.unit_price).toFixed(2)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-800">
            ${Number(item.subtotal).toFixed(2)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm">
            <div class="flex flex-wrap gap-2">

              <button
                type="button"
                data-edit-order-item="${escapeHtml(
                  item.order_item_id,
                )}"
                aria-label="Edit order item ${escapeHtml(
                  item.order_item_id,
                )}"
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
                  <path
                    d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"
                  />
                </svg>

                Edit
              </button>

              <button
                type="button"
                data-delete-order-item="${escapeHtml(
                  item.order_item_id,
                )}"
                aria-label="Delete order item ${escapeHtml(
                  item.order_item_id,
                )}"
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
// FORM
// ============================================================

function renderOrderItemForm(
  orderItem?: OrderItem,
): void {
  const formContainer =
    document.querySelector<HTMLDivElement>(
      "#order-item-form-container",
    );

  if (!formContainer) {
    return;
  }

  const isEditing = Boolean(orderItem);

  const orderId = orderItem
    ? escapeHtml(orderItem.order_id)
    : "";

  const itemId = orderItem
    ? escapeHtml(orderItem.item_id)
    : "";

  const quantity = orderItem
    ? escapeHtml(orderItem.quantity)
    : "1";

  const unitPrice = orderItem
    ? Number(orderItem.unit_price).toFixed(2)
    : "";

  const subtotal = orderItem
    ? Number(orderItem.subtotal).toFixed(2)
    : "0.00";

  formContainer.innerHTML = `
    <div class="rounded-xl border border-gray-200 bg-gray-50 p-6 shadow-sm">

      <!-- FORM HEADER -->

      <div
        class="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-start"
      >

        <div>

          <div class="flex items-center gap-2">

            <div
              class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600"
            >
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
                      <path
                        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"
                      />
                    `
                    : `
                      <path d="M12 5v14"/>
                      <path d="M5 12h14"/>
                    `
                }
              </svg>
            </div>

            <h3 class="text-xl font-semibold text-gray-800">
              ${isEditing ? "Edit Order Item" : "Add Order Item"}
            </h3>

          </div>

          <p class="mt-2 text-sm text-gray-500">
            ${
              isEditing
                ? "Update the order item information below."
                : "Add a menu item to an existing order."
            }
          </p>

        </div>

        <button
          type="button"
          id="cancel-order-item-form"
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

      <!-- FORM -->

      <form
        id="order-item-form"
        class="space-y-5"
      >

        <!-- ORDER + MENU ITEM -->

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>

            <label
              for="order-id"
              class="${labelClass}"
            >
              Order
            </label>

            <select
              id="order-id"
              name="order_id"
              required
              class="${inputClass}"
            >
              ${getOrderOptions(orderId)}
            </select>

          </div>

          <div>

            <label
              for="item-id"
              class="${labelClass}"
            >
              Menu Item
            </label>

            <select
              id="item-id"
              name="item_id"
              required
              class="${inputClass}"
            >
              ${getMenuItemOptions(itemId)}
            </select>

          </div>

        </div>

        <!-- QUANTITY + UNIT PRICE -->

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>

            <label
              for="quantity"
              class="${labelClass}"
            >
              Quantity
            </label>

            <input
              id="quantity"
              name="quantity"
              type="number"
              min="1"
              step="1"
              value="${quantity}"
              required
              class="${inputClass}"
              placeholder="Enter quantity"
            />

          </div>

          <div>

            <label
              for="unit-price"
              class="${labelClass}"
            >
              Unit Price
            </label>

            <input
              id="unit-price"
              name="unit_price"
              type="number"
              min="0"
              step="0.01"
              value="${unitPrice}"
              required
              class="${inputClass}"
              placeholder="Enter unit price"
            />

          </div>

        </div>

        <!-- SUBTOTAL -->

        <div>

          <label
            for="subtotal"
            class="${labelClass}"
          >
            Subtotal
          </label>

          <input
            id="subtotal"
            type="number"
            value="${subtotal}"
            readonly
            class="${inputClass} bg-gray-100"
          />

        </div>

        <!-- BUTTONS -->

        <div
          class="flex flex-wrap gap-3 border-t border-gray-200 pt-5"
        >

          <button
            type="submit"
            id="order-item-submit-button"
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
              <path
                d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"
              />
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>

            ${
              isEditing
                ? "Update Order Item"
                : "Save Order Item"
            }
          </button>

          <button
            type="button"
            id="cancel-order-item-form-bottom"
            class="${secondaryButtonClass}"
          >
            Cancel
          </button>

        </div>

        <p
          id="order-item-form-message"
          class="text-sm"
          role="status"
          aria-live="polite"
        ></p>

      </form>

    </div>
  `;

  const form =
    document.querySelector<HTMLFormElement>(
      "#order-item-form",
    );

  const cancelButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-order-item-form",
    );

  const cancelBottomButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-order-item-form-bottom",
    );

  const formMessage =
    document.querySelector<HTMLParagraphElement>(
      "#order-item-form-message",
    );

  const submitButton =
    document.querySelector<HTMLButtonElement>(
      "#order-item-submit-button",
    );

  const closeForm = (): void => {
    formContainer.innerHTML = "";
    editingOrderItemId = null;
  };

  cancelButton?.addEventListener(
    "click",
    closeForm,
  );

  cancelBottomButton?.addEventListener(
    "click",
    closeForm,
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

      const orderIdValue = Number(
        formData.get("order_id"),
      );

      const itemIdValue = Number(
        formData.get("item_id"),
      );

      const quantityValue = Number(
        formData.get("quantity"),
      );

      const unitPriceValue = Number(
        formData.get("unit_price"),
      );

      const validationError =
        validateOrderItemForm(
          orderIdValue,
          itemIdValue,
          quantityValue,
          unitPriceValue,
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
        order_id: orderIdValue,
        item_id: itemIdValue,
        quantity: quantityValue,
        unit_price: unitPriceValue,
      };

      submitButton.disabled = true;

      submitButton.textContent = editingOrderItemId
        ? "Updating..."
        : "Saving...";

      showFormMessage(
        formMessage,
        editingOrderItemId
          ? "Updating order item..."
          : "Saving order item...",
        "loading",
      );

      try {
        const response =
          editingOrderItemId === null
            ? await apiPost(
                "/order-items",
                requestBody,
              )
            : await apiPut(
                `/order-items/${editingOrderItemId}`,
                requestBody,
              );

        showFormMessage(
          formMessage,
          response.message ||
            (
              editingOrderItemId === null
                ? "Order item created successfully."
                : "Order item updated successfully."
            ),
          "success",
        );

        showMessage(
          response.message ||
            (
              editingOrderItemId === null
                ? "Order item created successfully."
                : "Order item updated successfully."
            ),
          "success",
        );

        await loadOrderItemsData();

        setTimeout(() => {
          formContainer.innerHTML = "";
          editingOrderItemId = null;
        }, 400);

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

        submitButton.textContent =
          editingOrderItemId
            ? "Update Order Item"
            : "Save Order Item";
      }
    },
  );

  attachFormListeners();

  updateSubtotal();
}

// ============================================================
// FORM VALIDATION
// ============================================================

function validateOrderItemForm(
  orderId: number,
  itemId: number,
  quantity: number,
  unitPrice: number,
): string | null {
  if (
    !Number.isInteger(orderId) ||
    orderId <= 0
  ) {
    return "Please select a valid order.";
  }

  if (
    !Number.isInteger(itemId) ||
    itemId <= 0
  ) {
    return "Please select a valid menu item.";
  }

  if (
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return "Quantity must be a positive whole number.";
  }

  if (
    !Number.isFinite(unitPrice) ||
    unitPrice < 0
  ) {
    return "Unit price must be a nonnegative number.";
  }

  return null;
}

// ============================================================
// SUBTOTAL
// ============================================================

function updateSubtotal(): void {
  const quantityInput =
    document.querySelector<HTMLInputElement>(
      "#quantity",
    );

  const unitPriceInput =
    document.querySelector<HTMLInputElement>(
      "#unit-price",
    );

  const subtotalInput =
    document.querySelector<HTMLInputElement>(
      "#subtotal",
    );

  if (
    !quantityInput ||
    !unitPriceInput ||
    !subtotalInput
  ) {
    return;
  }

  const quantity = Number(
    quantityInput.value,
  );

  const unitPrice = Number(
    unitPriceInput.value,
  );

  const subtotal =
    Number.isFinite(quantity) &&
    Number.isFinite(unitPrice)
      ? quantity * unitPrice
      : 0;

  subtotalInput.value =
    subtotal.toFixed(2);
}

function updateUnitPriceFromMenuItem(): void {
  const itemSelect =
    document.querySelector<HTMLSelectElement>(
      "#item-id",
    );

  const unitPriceInput =
    document.querySelector<HTMLInputElement>(
      "#unit-price",
    );

  if (
    !itemSelect ||
    !unitPriceInput
  ) {
    return;
  }

  const selectedOption =
    itemSelect.options[
      itemSelect.selectedIndex
    ];

  const selectedPrice =
    selectedOption?.dataset.price;

  if (
    selectedPrice !== undefined &&
    editingOrderItemId === null
  ) {
    unitPriceInput.value =
      Number(selectedPrice).toFixed(2);
  }

  updateSubtotal();
}

// ============================================================
// FORM LISTENERS
// ============================================================

function attachFormListeners(): void {
  const itemSelect =
    document.querySelector<HTMLSelectElement>(
      "#item-id",
    );

  const quantityInput =
    document.querySelector<HTMLInputElement>(
      "#quantity",
    );

  const unitPriceInput =
    document.querySelector<HTMLInputElement>(
      "#unit-price",
    );

  itemSelect?.addEventListener(
    "change",
    updateUnitPriceFromMenuItem,
  );

  quantityInput?.addEventListener(
    "input",
    updateSubtotal,
  );

  unitPriceInput?.addEventListener(
    "input",
    updateSubtotal,
  );
}

// ============================================================
// START EDITING
// ============================================================

function startEditing(
  orderItemId: number,
): void {
  const item = orderItems.find(
    (orderItem) =>
      orderItem.order_item_id ===
      orderItemId,
  );

  if (!item) {
    showMessage(
      "Order item not found.",
      "error",
    );

    return;
  }

  clearMessage();

  editingOrderItemId = orderItemId;

  renderOrderItemForm(item);

  getPageContent().scrollTo({
    top: 0,
    behavior: "smooth",
  });
}

// ============================================================
// DELETE
// ============================================================

async function deleteOrderItem(
  orderItemId: number,
): Promise<void> {
  const item = orderItems.find(
    (orderItem) =>
      orderItem.order_item_id ===
      orderItemId,
  );

  const itemName =
    item?.item_name || "this order item";

  const confirmed = window.confirm(
    `Are you sure you want to delete "${itemName}"?`,
  );

  if (!confirmed) {
    return;
  }

  try {
    const response =
      await apiDelete(
        `/order-items/${orderItemId}`,
      );

    showMessage(
      response.message ||
        "Order item deleted successfully.",
      "success",
    );

    if (
      editingOrderItemId ===
      orderItemId
    ) {
      const formContainer =
        document.querySelector<HTMLDivElement>(
          "#order-item-form-container",
        );

      if (formContainer) {
        formContainer.innerHTML = "";
      }

      editingOrderItemId = null;
    }

    await loadOrderItemsData();

  } catch (error) {
    showMessage(
      getErrorMessage(
        error,
        "Failed to delete order item.",
      ),
      "error",
    );
  }
}

// ============================================================
// SEARCH
// ============================================================

function searchOrderItems(
  searchTerm: string,
): void {
  const normalizedSearch =
    searchTerm
      .trim()
      .toLowerCase();

  if (!normalizedSearch) {
    renderOrderItemTable(orderItems);
    return;
  }

  const filteredItems =
    orderItems.filter((item) => {
      return (
        String(
          item.order_item_id,
        ).includes(normalizedSearch) ||

        String(
          item.order_id,
        ).includes(normalizedSearch) ||

        item.item_name
          .toLowerCase()
          .includes(normalizedSearch) ||

        item.restaurant_name
          .toLowerCase()
          .includes(normalizedSearch)
      );
    });

  renderOrderItemTable(
    filteredItems,
  );
}

// ============================================================
// TABLE ONLY
// ============================================================

function renderOrderItemTable(
  items: OrderItem[],
): void {
  const tableBody =
    document.querySelector<HTMLTableSectionElement>(
      "#order-item-table-body",
    );

  const countElement =
    document.querySelector<HTMLSpanElement>(
      "#order-item-count",
    );

  if (!tableBody) {
    return;
  }

  tableBody.innerHTML =
    renderOrderItemRows(items);

  if (countElement) {
    countElement.textContent =
      `${items.length} order item${
        items.length === 1
          ? ""
          : "s"
      }`;
  }
}

// ============================================================
// MAIN PAGE RENDERING
// ============================================================

function renderPage(): void {
  const pageContent =
    getPageContent();

  pageContent.innerHTML = `
    <!-- PAGE HEADER -->

    <div
      class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center"
    >

      <div>

        <h2
          class="text-2xl font-bold text-gray-800"
        >
          Order Item Management
        </h2>

        <p
          class="mt-1 text-sm text-gray-500"
        >
          Manage menu items included in each order.
        </p>

      </div>

      <button
        id="add-order-item-button"
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

        Add Order Item
      </button>

    </div>

    <!-- PAGE MESSAGE -->

    <p
      id="order-item-page-message"
      class="mb-4 text-sm"
      role="status"
      aria-live="polite"
    ></p>

    <!-- FORM CONTAINER -->

    <div
      id="order-item-form-container"
      class="mb-6"
    ></div>

    <!-- SEARCH CARD -->

    <div
      class="mb-6 rounded-xl border border-gray-100 bg-white p-5 shadow-sm"
    >

      <div
        class="mb-3 flex items-center gap-2"
      >

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

        <h3
          class="text-sm font-semibold text-gray-800"
        >
          Search Order Items
        </h3>

      </div>

      <div
        class="flex flex-col gap-3 sm:flex-row"
      >

        <input
          id="order-item-search"
          type="search"
          placeholder="Search by order ID, menu item or restaurant..."
          aria-label="Search order items"
          class="min-w-0 flex-1 ${inputClass}"
        />

        <button
          id="order-item-search-button"
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
          id="order-item-reset-button"
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
            <path
              d="M3 12a9 9 0 1 0 3-6.7"
            />
            <path
              d="M3 3v6h6"
            />
          </svg>

          Reset
        </button>

      </div>

      <p
        id="order-item-search-message"
        class="mt-3 text-sm"
        role="status"
        aria-live="polite"
      ></p>

    </div>

    <!-- TABLE CARD -->

    <div
      class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
    >

      <div
        class="flex flex-col justify-between gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center"
      >

        <h3
          class="text-base font-semibold text-gray-800"
        >
          Order Item List
        </h3>

        <span
          id="order-item-count"
          class="text-sm text-gray-500"
        >
          0 order items
        </span>

      </div>

      <div
        class="overflow-x-auto"
      >

        <table
          class="min-w-full"
        >

          <thead
            class="bg-gray-50"
          >

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
                Order ID
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Menu Item
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
                Quantity
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Unit Price
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Subtotal
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Actions
              </th>

            </tr>

          </thead>

          <tbody
            id="order-item-table-body"
          ></tbody>

        </table>

      </div>

    </div>
  `;

  attachPageListeners();

  renderOrderItemTable(
    orderItems,
  );
}

// ============================================================
// PAGE EVENT LISTENERS
// ============================================================

function attachPageListeners(): void {
  const addButton =
    document.querySelector<HTMLButtonElement>(
      "#add-order-item-button",
    );

  const searchInput =
    document.querySelector<HTMLInputElement>(
      "#order-item-search",
    );

  const searchButton =
    document.querySelector<HTMLButtonElement>(
      "#order-item-search-button",
    );

  const resetButton =
    document.querySelector<HTMLButtonElement>(
      "#order-item-reset-button",
    );

  const tableBody =
    document.querySelector<HTMLTableSectionElement>(
      "#order-item-table-body",
    );

  addButton?.addEventListener(
    "click",
    () => {
      clearMessage();

      editingOrderItemId = null;

      renderOrderItemForm();
    },
  );

  const performSearch = (): void => {
    const searchTerm =
      searchInput?.value.trim() || "";

    const searchMessage =
      document.querySelector<HTMLParagraphElement>(
        "#order-item-search-message",
      );

    if (!searchTerm) {
      renderOrderItemTable(
        orderItems,
      );

      if (searchMessage) {
        searchMessage.textContent = "";
        searchMessage.className =
          "mt-3 text-sm";
      }

      return;
    }

    searchOrderItems(
      searchTerm,
    );

    const currentCount =
      document.querySelector<HTMLSpanElement>(
        "#order-item-count",
      );

    if (searchMessage) {
      searchMessage.textContent =
        currentCount
          ? `Showing ${currentCount.textContent}`
          : "";

      searchMessage.className =
        "mt-3 text-sm text-gray-500";
    }
  };

  searchButton?.addEventListener(
    "click",
    performSearch,
  );

  searchInput?.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Enter") {
        event.preventDefault();

        performSearch();
      }
    },
  );

  searchInput?.addEventListener(
    "input",
    () => {
      const value =
        searchInput.value.trim();

      if (!value) {
        renderOrderItemTable(
          orderItems,
        );

        const searchMessage =
          document.querySelector<HTMLParagraphElement>(
            "#order-item-search-message",
          );

        if (searchMessage) {
          searchMessage.textContent = "";
        }
      }
    },
  );

  resetButton?.addEventListener(
    "click",
    () => {
      if (searchInput) {
        searchInput.value = "";
      }

      const searchMessage =
        document.querySelector<HTMLParagraphElement>(
          "#order-item-search-message",
        );

      if (searchMessage) {
        searchMessage.textContent = "";
      }

      renderOrderItemTable(
        orderItems,
      );
    },
  );

  tableBody?.addEventListener(
    "click",
    (event) => {
      const target =
        event.target as HTMLElement;

      const editButton =
        target.closest<HTMLButtonElement>(
          "[data-edit-order-item]",
        );

      const deleteButton =
        target.closest<HTMLButtonElement>(
          "[data-delete-order-item]",
        );

      if (editButton) {
        const id = Number(
          editButton.dataset
            .editOrderItem,
        );

        if (
          Number.isInteger(id) &&
          id > 0
        ) {
          startEditing(id);
        }

        return;
      }

      if (deleteButton) {
        const id = Number(
          deleteButton.dataset
            .deleteOrderItem,
        );

        if (
          Number.isInteger(id) &&
          id > 0
        ) {
          void deleteOrderItem(id);
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
    ordersResponse,
    menuItemsResponse,
  ] = await Promise.all([
    apiGet<Order[]>(
      "/orders",
    ),

    apiGet<MenuItem[]>(
      "/menu-items",
    ),
  ]);

  orders =
    ordersResponse.data ?? [];

  menuItems =
    menuItemsResponse.data ?? [];
}

// ============================================================
// LOAD ORDER ITEMS
// ============================================================

async function loadOrderItemsData(): Promise<void> {
  const response =
    await apiGet<OrderItem[]>(
      "/order-items",
    );

  orderItems =
    response.data ?? [];

  renderOrderItemTable(
    orderItems,
  );
}

// ============================================================
// LOADING STATE
// ============================================================

function renderLoadingState(): void {
  const pageContent =
    getPageContent();

  pageContent.innerHTML = `
    <div
      class="flex min-h-64 flex-col items-center justify-center gap-3"
    >

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
        Loading order items...
      </p>

    </div>
  `;
}

// ============================================================
// ERROR STATE
// ============================================================

function renderErrorState(
  error: unknown,
): void {
  const pageContent =
    getPageContent();

  const errorMessage =
    getErrorMessage(
      error,
      "An unexpected error occurred.",
    );

  pageContent.innerHTML = `
    <div
      class="rounded-xl border border-red-100 bg-red-50 p-6"
    >

      <div
        class="flex items-start gap-3"
      >

        <div
          class="mt-0.5 text-red-600"
        >
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
            <circle
              cx="12"
              cy="12"
              r="10"
            />
            <line
              x1="12"
              y1="8"
              x2="12"
              y2="12"
            />
            <line
              x1="12"
              y1="16"
              x2="12.01"
              y2="16"
            />
          </svg>
        </div>

        <div>

          <h2
            class="text-lg font-semibold text-red-700"
          >
            Failed to Load Order Items
          </h2>

          <p
            class="mt-2 text-sm text-red-600"
          >
            ${escapeHtml(errorMessage)}
          </p>

          <button
            id="retry-order-items-button"
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
              <path
                d="M3 12a9 9 0 1 0 3-6.7"
              />
              <path
                d="M3 3v6h6"
              />
            </svg>

            Try Again
          </button>

        </div>

      </div>

    </div>
  `;

  document
    .querySelector<HTMLButtonElement>(
      "#retry-order-items-button",
    )
    ?.addEventListener(
      "click",
      () => {
        void loadOrderItems();
      },
    );
}

// ============================================================
// PUBLIC PAGE LOADER
// ============================================================

export async function loadOrderItems(): Promise<void> {
  try {
    renderLoadingState();

    await loadReferenceData();

    renderPage();

    await loadOrderItemsData();

  } catch (error) {
    console.error(
      "Error loading order items:",
      error,
    );

    renderErrorState(
      error,
    );
  }
}