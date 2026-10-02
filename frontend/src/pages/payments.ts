import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../api/client";

import type {
  Payment,
  PaymentMethod,
  PaymentStatus,
} from "../types/payment";

// ============================================================
// TYPES
// ============================================================

interface Order {
  order_id: number;
  restaurant_id: number;
  restaurant_name: string;
  customer_id: number | null;
  customer_name: string | null;
  order_date: string;
  order_type: string;
  order_status: string;
  total_amount: number;
}

// ============================================================
// CONSTANTS
// ============================================================

const PAYMENT_METHODS: PaymentMethod[] = [
  "cash",
  "card",
  "mobile_banking",
  "other",
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  "pending",
  "paid",
  "refunded",
  "failed",
];

// ============================================================
// PAGE STATE
// ============================================================

let payments: Payment[] = [];
let orders: Order[] = [];

// ============================================================
// PAGE HELPERS
// ============================================================

function getPageContent(): HTMLElement {
  const pageContent =
    document.querySelector<HTMLElement>(
      "#page-content",
    );

  if (!pageContent) {
    throw new Error(
      "Page content container not found.",
    );
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

function formatPaymentMethod(
  method: string,
): string {
  return method
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function formatPaymentStatus(
  status: string,
): string {
  return (
    status.charAt(0).toUpperCase() +
    status.slice(1)
  );
}

function formatDate(
  value: unknown,
): string {
  const date = String(value ?? "");

  if (!date) {
    return "";
  }

  return date.includes("T")
    ? date.substring(0, 10)
    : date.substring(0, 10);
}

function getTodayDate(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(
    now.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    now.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
      "#payment-page-message",
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
      "#payment-page-message",
    );

  if (!messageElement) {
    return;
  }

  messageElement.textContent = "";
  messageElement.className =
    "mb-4 text-sm";
}

function showFormMessage(
  element: HTMLParagraphElement | null,
  message: string,
  type:
    | "success"
    | "error"
    | "loading",
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
  focus-visible:ring-2
  focus-visible:ring-blue-500
  focus-visible:ring-offset-2
  disabled:cursor-not-allowed
  disabled:opacity-60
`;

const secondaryButtonClass = `
  inline-flex items-center justify-center gap-2
  rounded-lg border border-gray-300
  px-5 py-2.5
  text-sm font-medium text-gray-700
  transition hover:bg-gray-100
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-blue-500
  focus-visible:ring-offset-2
`;

const editButtonClass = `
  inline-flex items-center justify-center gap-1.5
  rounded-lg bg-blue-100 px-3 py-2
  text-xs font-medium text-blue-700
  transition hover:bg-blue-200
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-blue-500
  focus-visible:ring-offset-2
`;

const deleteButtonClass = `
  inline-flex items-center justify-center gap-1.5
  rounded-lg bg-red-100 px-3 py-2
  text-xs font-medium text-red-700
  transition hover:bg-red-200
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-red-500
  focus-visible:ring-offset-2
`;

const inputClass = `
  w-full rounded-lg border border-gray-300
  bg-white px-4 py-2.5
  text-sm text-gray-800
  outline-none transition
  placeholder:text-gray-400
  focus:border-blue-500
  focus:ring-2
  focus:ring-blue-100
  disabled:cursor-not-allowed
  disabled:bg-gray-100
`;

const labelClass = `
  mb-2 block text-sm font-medium text-gray-700
`;

// ============================================================
// PAYMENT STATUS BADGE
// ============================================================

function renderPaymentStatus(
  status: string,
): string {
  const normalized =
    status.toLowerCase();

  if (normalized === "paid") {
    return `
      <span class="inline-flex items-center rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
        Paid
      </span>
    `;
  }

  if (normalized === "pending") {
    return `
      <span class="inline-flex items-center rounded-md bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
        Pending
      </span>
    `;
  }

  if (normalized === "refunded") {
    return `
      <span class="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700">
        Refunded
      </span>
    `;
  }

  if (normalized === "failed") {
    return `
      <span class="inline-flex items-center rounded-md bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
        Failed
      </span>
    `;
  }

  return `
    <span class="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
      ${escapeHtml(
        formatPaymentStatus(status),
      )}
    </span>
  `;
}

// ============================================================
// DROPDOWN OPTIONS
// ============================================================

function renderOrderOptions(
  selectedOrderId = "",
): string {
  return `
    <option value="">
      Select order
    </option>

    ${orders
      .map(
        (order) => `
          <option
            value="${escapeHtml(
              order.order_id,
            )}"
            ${
              String(
                order.order_id,
              ) === String(selectedOrderId)
                ? "selected"
                : ""
            }
          >
            Order #${escapeHtml(
              order.order_id,
            )}
            -
            ${escapeHtml(
              order.restaurant_name,
            )}
            -
            ${escapeHtml(
              order.order_status,
            )}
          </option>
        `,
      )
      .join("")}
  `;
}

function renderPaymentMethodOptions(
  selectedMethod = "",
): string {
  return `
    <option value="">
      Select payment method
    </option>

    ${PAYMENT_METHODS.map(
      (method) => `
        <option
          value="${method}"
          ${
            method === selectedMethod
              ? "selected"
              : ""
          }
        >
          ${escapeHtml(
            formatPaymentMethod(method),
          )}
        </option>
      `,
    ).join("")}
  `;
}

function renderPaymentStatusOptions(
  selectedStatus = "pending",
): string {
  return PAYMENT_STATUSES.map(
    (status) => `
      <option
        value="${status}"
        ${
          status === selectedStatus
            ? "selected"
            : ""
        }
      >
        ${escapeHtml(
          formatPaymentStatus(status),
        )}
      </option>
    `,
  ).join("");
}

// ============================================================
// TABLE RENDERING
// ============================================================

function renderPaymentRows(
  paymentList: Payment[],
): string {
  if (paymentList.length === 0) {
    return `
      <tr>
        <td
          colspan="9"
          class="px-6 py-12 text-center"
        >
          <div
            class="flex flex-col items-center gap-2"
          >

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
                x="2"
                y="5"
                width="20"
                height="14"
                rx="2"
              />
              <line
                x1="2"
                y1="10"
                x2="22"
                y2="10"
              />
              <line
                x1="6"
                y1="15"
                x2="10"
                y2="15"
              />
            </svg>

            <p
              class="text-sm font-medium text-gray-700"
            >
              No payments found.
            </p>

            <p
              class="text-xs text-gray-500"
            >
              Try another search or add a new payment.
            </p>

          </div>
        </td>
      </tr>
    `;
  }

  return paymentList
    .map(
      (payment) => `
        <tr
          class="border-b border-gray-100 transition hover:bg-gray-50"
        >

          <!-- ID -->

          <td
            class="whitespace-nowrap px-6 py-4 text-sm text-gray-600"
          >
            ${escapeHtml(
              payment.payment_id,
            )}
          </td>

          <!-- ORDER ID -->

          <td
            class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900"
          >
            #${escapeHtml(
              payment.order_id,
            )}
          </td>

          <!-- RESTAURANT -->

          <td
            class="min-w-40 px-6 py-4 text-sm text-gray-600"
          >
            ${escapeHtml(
              payment.restaurant_name,
            )}
          </td>

          <!-- CUSTOMER -->

          <td
            class="min-w-40 px-6 py-4 text-sm text-gray-600"
          >
            ${escapeHtml(
              payment.customer_name ||
                "Walk-in customer",
            )}
          </td>

          <!-- METHOD -->

          <td
            class="whitespace-nowrap px-6 py-4 text-sm text-gray-600"
          >
            <span
              class="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
            >
              ${escapeHtml(
                formatPaymentMethod(
                  payment.payment_method,
                ),
              )}
            </span>
          </td>

          <!-- AMOUNT -->

          <td
            class="whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-800"
          >
            ${Number(
              payment.payment_amount,
            ).toFixed(2)}
          </td>

          <!-- DATE -->

          <td
            class="whitespace-nowrap px-6 py-4 text-sm text-gray-600"
          >
            ${escapeHtml(
              formatDate(
                payment.payment_date,
              ),
            )}
          </td>

          <!-- STATUS -->

          <td
            class="whitespace-nowrap px-6 py-4 text-sm"
          >
            ${renderPaymentStatus(
              payment.payment_status,
            )}
          </td>

          <!-- ACTIONS -->

          <td
            class="whitespace-nowrap px-6 py-4 text-sm"
          >

            <div class="flex flex-wrap gap-2">

              <!-- EDIT -->

              <button
                type="button"
                data-edit-payment="${escapeHtml(
                  payment.payment_id,
                )}"
                aria-label="Edit payment ${escapeHtml(
                  payment.payment_id,
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

              <!-- DELETE -->

              <button
                type="button"
                data-delete-payment="${escapeHtml(
                  payment.payment_id,
                )}"
                aria-label="Delete payment ${escapeHtml(
                  payment.payment_id,
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
                  <path
                    d="M19 6l-1 14H6L5 6"
                  />
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
// FORM VALIDATION
// ============================================================

function validatePaymentForm(
  orderId: number,
  paymentMethod: string,
  paymentAmount: number,
  paymentDate: string,
  paymentStatus: string,
): string | null {
  if (
    !Number.isInteger(orderId) ||
    orderId <= 0
  ) {
    return "Please select a valid order.";
  }

  if (
    !PAYMENT_METHODS.includes(
      paymentMethod as PaymentMethod,
    )
  ) {
    return "Please select a valid payment method.";
  }

  if (
    !Number.isFinite(paymentAmount) ||
    paymentAmount < 0
  ) {
    return "Payment amount must be a non-negative number.";
  }

  if (!paymentDate) {
    return "Payment date is required.";
  }

  if (
    !PAYMENT_STATUSES.includes(
      paymentStatus as PaymentStatus,
    )
  ) {
    return "Please select a valid payment status.";
  }

  return null;
}

// ============================================================
// FORM RENDERING
// ============================================================

function renderPaymentForm(
  payment?: Payment,
): void {
  const formContainer =
    document.querySelector<HTMLDivElement>(
      "#payment-form-container",
    );

  if (!formContainer) {
    return;
  }

  const isEditing =
    Boolean(payment);

  const orderId = payment
    ? String(payment.order_id)
    : "";

  const paymentMethod = payment
    ? payment.payment_method
    : "";

  const paymentAmount = payment
    ? Number(
        payment.payment_amount,
      ).toFixed(2)
    : "";

  const paymentDate = payment
    ? formatDate(
        payment.payment_date,
      )
    : getTodayDate();

  const paymentStatus = payment
    ? payment.payment_status
    : "pending";

  formContainer.innerHTML = `
    <div
      class="rounded-xl border border-gray-200 bg-gray-50 p-6 shadow-sm"
    >

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
                      <rect
                        x="2"
                        y="5"
                        width="20"
                        height="14"
                        rx="2"
                      />
                      <line
                        x1="2"
                        y1="10"
                        x2="22"
                        y2="10"
                      />
                    `
                }
              </svg>

            </div>

            <h3
              class="text-xl font-semibold text-gray-800"
            >
              ${
                isEditing
                  ? "Edit Payment"
                  : "Add Payment"
              }
            </h3>

          </div>

          <p
            class="mt-2 text-sm text-gray-500"
          >
            ${
              isEditing
                ? "Update the payment information below."
                : "Add a new payment to the system."
            }
          </p>

        </div>

        <!-- TOP CANCEL -->

        <button
          type="button"
          id="cancel-payment-form"
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
        id="payment-form"
        class="space-y-5"
      >

        <!-- ORDER + METHOD -->

        <div
          class="grid grid-cols-1 gap-5 md:grid-cols-2"
        >

          <!-- ORDER -->

          <div>

            <label
              for="payment-order-id"
              class="${labelClass}"
            >
              Order
            </label>

            <select
              id="payment-order-id"
              name="order_id"
              required
              class="${inputClass}"
            >
              ${renderOrderOptions(
                orderId,
              )}
            </select>

          </div>

          <!-- METHOD -->

          <div>

            <label
              for="payment-method"
              class="${labelClass}"
            >
              Payment Method
            </label>

            <select
              id="payment-method"
              name="payment_method"
              required
              class="${inputClass}"
            >
              ${renderPaymentMethodOptions(
                paymentMethod,
              )}
            </select>

          </div>

        </div>

        <!-- AMOUNT -->

        <div>

          <label
            for="payment-amount"
            class="${labelClass}"
          >
            Payment Amount
          </label>

          <input
            id="payment-amount"
            name="payment_amount"
            type="number"
            min="0"
            step="0.01"
            required
            value="${escapeHtml(
              paymentAmount,
            )}"
            placeholder="Enter payment amount"
            class="${inputClass}"
          />

        </div>

        <!-- DATE + STATUS -->

        <div
          class="grid grid-cols-1 gap-5 md:grid-cols-2"
        >

          <!-- DATE -->

          <div>

            <label
              for="payment-date"
              class="${labelClass}"
            >
              Payment Date
            </label>

            <input
              id="payment-date"
              name="payment_date"
              type="date"
              required
              value="${escapeHtml(
                paymentDate,
              )}"
              class="${inputClass}"
            />

          </div>

          <!-- STATUS -->

          <div>

            <label
              for="payment-status"
              class="${labelClass}"
            >
              Payment Status
            </label>

            <select
              id="payment-status"
              name="payment_status"
              required
              class="${inputClass}"
            >
              ${renderPaymentStatusOptions(
                paymentStatus,
              )}
            </select>

          </div>

        </div>

        <!-- FORM BUTTONS -->

        <div
          class="flex flex-wrap gap-3 border-t border-gray-200 pt-5"
        >

          <!-- SAVE -->

          <button
            type="submit"
            id="payment-submit-button"
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
              <polyline
                points="17 21 17 13 7 13 7 21"
              />
              <polyline
                points="7 3 7 8 15 8"
              />
            </svg>

            ${
              isEditing
                ? "Update Payment"
                : "Save Payment"
            }

          </button>

          <!-- BOTTOM CANCEL -->

          <button
            type="button"
            id="cancel-payment-form-bottom"
            class="${secondaryButtonClass}"
          >

            Cancel

          </button>

        </div>

        <!-- FORM MESSAGE -->

        <p
          id="payment-form-message"
          class="text-sm"
          role="status"
          aria-live="polite"
        ></p>

      </form>

    </div>
  `;

  // ==========================================================
  // ELEMENT REFERENCES
  // ==========================================================

  const form =
    document.querySelector<HTMLFormElement>(
      "#payment-form",
    );

  const cancelButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-payment-form",
    );

  const cancelBottomButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-payment-form-bottom",
    );

  const formMessage =
    document.querySelector<HTMLParagraphElement>(
      "#payment-form-message",
    );

  const submitButton =
    document.querySelector<HTMLButtonElement>(
      "#payment-submit-button",
    );

  // ==========================================================
  // CLOSE FORM
  // ==========================================================

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

  // ==========================================================
  // FORM SUBMIT
  // ==========================================================

  form?.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      if (
        !formMessage ||
        !submitButton
      ) {
        return;
      }

      if (submitButton.disabled) {
        return;
      }

      const formData =
        new FormData(form);

      const orderId = Number(
        formData.get("order_id"),
      );

      const paymentMethod = String(
        formData.get(
          "payment_method",
        ) || "",
      ).trim();

      const paymentAmount = Number(
        formData.get(
          "payment_amount",
        ),
      );

      const paymentDate = String(
        formData.get(
          "payment_date",
        ) || "",
      ).trim();

      const paymentStatus = String(
        formData.get(
          "payment_status",
        ) || "",
      ).trim();

      // ------------------------------------------------------
      // VALIDATION
      // ------------------------------------------------------

      const validationError =
        validatePaymentForm(
          orderId,
          paymentMethod,
          paymentAmount,
          paymentDate,
          paymentStatus,
        );

      if (validationError) {
        showFormMessage(
          formMessage,
          validationError,
          "error",
        );

        return;
      }

      // ------------------------------------------------------
      // REQUEST BODY
      // ------------------------------------------------------

      const requestBody = {
        order_id: orderId,

        payment_method:
          paymentMethod as PaymentMethod,

        payment_amount:
          paymentAmount,

        payment_date:
          paymentDate,

        payment_status:
          paymentStatus as PaymentStatus,
      };

      // ------------------------------------------------------
      // SUBMIT STATE
      // ------------------------------------------------------

      submitButton.disabled = true;

      submitButton.textContent =
        isEditing
          ? "Updating..."
          : "Saving...";

      showFormMessage(
        formMessage,
        isEditing
          ? "Updating payment..."
          : "Saving payment...",
        "loading",
      );

      // ------------------------------------------------------
      // API
      // ------------------------------------------------------

      try {
        const response = isEditing
          ? await apiPut(
              `/payments/${payment?.payment_id}`,
              requestBody,
            )
          : await apiPost(
              "/payments",
              requestBody,
            );

        const successMessage =
          response.message ||
          (isEditing
            ? "Payment updated successfully."
            : "Payment created successfully.");

        showFormMessage(
          formMessage,
          successMessage,
          "success",
        );

        await loadPayments();

        showMessage(
          successMessage,
          "success",
        );
      } catch (error) {
        const errorMessage =
          getErrorMessage(
            error,
            "An unexpected error occurred.",
          );

        showFormMessage(
          formMessage,
          errorMessage,
          "error",
        );

        submitButton.disabled = false;

        submitButton.textContent =
          isEditing
            ? "Update Payment"
            : "Save Payment";
      }
    },
  );
}

// ============================================================
// MAIN PAGE RENDERING
// ============================================================

function renderPayments(
  paymentList: Payment[],
  searchTerm = "",
): void {
  const pageContent =
    getPageContent();

  pageContent.innerHTML = `
    <!-- ======================================================
         PAGE HEADER
    ======================================================= -->

    <div
      class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center"
    >

      <div>

        <h2
          class="text-2xl font-bold text-gray-800"
        >
          Payment Management
        </h2>

        <p
          class="mt-1 text-sm text-gray-500"
        >
          Manage payments associated with customer orders.
        </p>

      </div>

      <!-- ADD PAYMENT -->

      <button
        id="add-payment-button"
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

        Add Payment

      </button>

    </div>

    <!-- ======================================================
         PAGE MESSAGE
    ======================================================= -->

    <p
      id="payment-page-message"
      class="mb-4 text-sm"
      role="status"
      aria-live="polite"
    ></p>

    <!-- ======================================================
         FORM CONTAINER
    ======================================================= -->

    <div
      id="payment-form-container"
      class="mb-6"
    ></div>

    <!-- ======================================================
         SEARCH CARD
    ======================================================= -->

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
          <circle
            cx="11"
            cy="11"
            r="8"
          />
          <path
            d="m21 21-4.3-4.3"
          />
        </svg>

        <h3
          class="text-sm font-semibold text-gray-800"
        >
          Search Payments
        </h3>

      </div>

      <div
        class="flex flex-col gap-3 sm:flex-row"
      >

        <!-- SEARCH INPUT -->

        <input
          id="payment-search"
          type="search"
          value="${escapeHtml(
            searchTerm,
          )}"
          placeholder="Search by order, restaurant, customer, method or status..."
          aria-label="Search payments"
          class="min-w-0 flex-1 ${inputClass}"
        />

        <!-- SEARCH -->

        <button
          id="payment-search-button"
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
            <circle
              cx="11"
              cy="11"
              r="8"
            />
            <path
              d="m21 21-4.3-4.3"
            />
          </svg>

          Search

        </button>

        <!-- RESET -->

        <button
          id="payment-reset-button"
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

      <!-- SEARCH MESSAGE -->

      <p
        id="payment-search-message"
        class="mt-3 text-sm"
        role="status"
        aria-live="polite"
      ></p>

    </div>

    <!-- ======================================================
         TABLE CARD
    ======================================================= -->

    <div
      class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm"
    >

      <!-- TABLE HEADER -->

      <div
        class="flex flex-col justify-between gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center"
      >

        <h3
          class="text-base font-semibold text-gray-800"
        >
          Payment List
        </h3>

        <span
          class="text-sm text-gray-500"
        >
          ${paymentList.length}
          payment${paymentList.length === 1 ? "" : "s"}
        </span>

      </div>

      <!-- TABLE -->

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
                Restaurant
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Customer
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Method
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Amount
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Date
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

          <tbody id="payment-table-body">
            ${renderPaymentRows(
              paymentList,
            )}
          </tbody>

        </table>

      </div>

    </div>
  `;

  // ==========================================================
  // ELEMENT REFERENCES
  // ==========================================================

  const addButton =
    document.querySelector<HTMLButtonElement>(
      "#add-payment-button",
    );

  const searchInput =
    document.querySelector<HTMLInputElement>(
      "#payment-search",
    );

  const searchButton =
    document.querySelector<HTMLButtonElement>(
      "#payment-search-button",
    );

  const resetButton =
    document.querySelector<HTMLButtonElement>(
      "#payment-reset-button",
    );

  const searchMessage =
    document.querySelector<HTMLParagraphElement>(
      "#payment-search-message",
    );

  const tableBody =
    document.querySelector<HTMLTableSectionElement>(
      "#payment-table-body",
    );

  // ==========================================================
  // ADD PAYMENT
  // ==========================================================

  addButton?.addEventListener(
    "click",
    () => {
      clearMessage();

      renderPaymentForm();

      document
        .querySelector<HTMLElement>(
          "#payment-form-container",
        )
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    },
  );

  // ==========================================================
  // SEARCH PAYMENTS
  // ==========================================================

  const performSearch =
    async (): Promise<void> => {
      const searchTerm =
        searchInput?.value.trim() || "";

      if (!searchTerm) {
        await loadPayments();

        return;
      }

      if (searchMessage) {
        searchMessage.textContent =
          "Searching...";

        searchMessage.className =
          "mt-3 text-sm text-gray-500";
      }

      if (searchButton) {
        searchButton.disabled = true;
      }

      try {
        /*
         * Keep the search on the frontend
         * because the existing payment page
         * did not define a /payments/search
         * endpoint.
         */

        const normalizedSearch =
          searchTerm.toLowerCase();

        const filteredPayments =
          payments.filter(
            (payment) => {
              return (
                String(
                  payment.payment_id,
                )
                  .toLowerCase()
                  .includes(
                    normalizedSearch,
                  ) ||

                String(
                  payment.order_id,
                )
                  .toLowerCase()
                  .includes(
                    normalizedSearch,
                  ) ||

                (
                  payment.restaurant_name ||
                  ""
                )
                  .toLowerCase()
                  .includes(
                    normalizedSearch,
                  ) ||

                (
                  payment.customer_name ||
                  ""
                )
                  .toLowerCase()
                  .includes(
                    normalizedSearch,
                  ) ||

                (
                  payment.payment_method ||
                  ""
                )
                  .toLowerCase()
                  .includes(
                    normalizedSearch,
                  ) ||

                (
                  payment.payment_status ||
                  ""
                )
                  .toLowerCase()
                  .includes(
                    normalizedSearch,
                  )
              );
            },
          );

        renderPayments(
          filteredPayments,
          searchTerm,
        );
      } catch (error) {
        if (searchMessage) {
          searchMessage.textContent =
            getErrorMessage(
              error,
              "Failed to search payments.",
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

  // ==========================================================
  // RESET SEARCH
  // ==========================================================

  resetButton?.addEventListener(
    "click",
    () => {
      void loadPayments();
    },
  );

  // ==========================================================
  // TABLE ACTIONS
  // ==========================================================

  tableBody?.addEventListener(
    "click",
    async (event) => {
      const target =
        event.target as HTMLElement;

      const editButton =
        target.closest<HTMLButtonElement>(
          "[data-edit-payment]",
        );

      const deleteButton =
        target.closest<HTMLButtonElement>(
          "[data-delete-payment]",
        );

      // --------------------------------------------------------
      // EDIT
      // --------------------------------------------------------

      if (editButton) {
        const paymentId = Number(
          editButton.dataset.editPayment,
        );

        const payment =
          payments.find(
            (item) =>
              item.payment_id ===
              paymentId,
          );

        if (payment) {
          clearMessage();

          renderPaymentForm(
            payment,
          );

          document
            .querySelector<HTMLElement>(
              "#payment-form-container",
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
        const paymentId = Number(
          deleteButton.dataset
            .deletePayment,
        );

        if (
          !Number.isFinite(
            paymentId,
          )
        ) {
          showMessage(
            "Invalid payment ID.",
            "error",
          );

          return;
        }

        const confirmed =
          window.confirm(
            `Are you sure you want to delete payment #${paymentId}?`,
          );

        if (!confirmed) {
          return;
        }

        deleteButton.disabled = true;

        try {
          const response =
            await apiDelete(
              `/payments/${paymentId}`,
            );

          showMessage(
            response.message ||
              "Payment deleted successfully.",
            "success",
          );

          await loadPayments();
        } catch (error) {
          showMessage(
            getErrorMessage(
              error,
              "Failed to delete payment.",
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
// LOAD PAYMENTS
// ============================================================

export async function loadPayments(): Promise<void> {
  const pageContent =
    getPageContent();

  // ==========================================================
  // LOADING STATE
  // ==========================================================

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
        <path
          d="m16.2 7.8 2.8-2.8"
        />
        <path d="M18 12h4"/>
        <path
          d="m16.2 16.2 2.8 2.8"
        />
        <path d="M12 18v4"/>
        <path
          d="m4.2 19 2.8-2.8"
        />
        <path d="M2 12h4"/>
        <path
          d="m4.2 5 2.8 2.8"
        />
      </svg>

      <p
        class="text-sm text-gray-500"
      >
        Loading payments...
      </p>

    </div>
  `;

  try {
    // ========================================================
    // LOAD ORDERS
    // ========================================================

    const ordersResponse =
      await apiGet<Order[]>(
        "/orders",
      );

    orders =
      ordersResponse.data ?? [];

    // ========================================================
    // LOAD PAYMENTS
    // ========================================================

    const paymentsResponse =
      await apiGet<Payment[]>(
        "/payments",
      );

    payments =
      paymentsResponse.data ?? [];

    // ========================================================
    // RENDER
    // ========================================================

    renderPayments(
      payments,
    );
  } catch (error) {
    const errorMessage =
      getErrorMessage(
        error,
        "An unexpected error occurred.",
      );

    // ========================================================
    // ERROR STATE
    // ========================================================

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
              Failed to Load Payments
            </h2>

            <p
              class="mt-2 text-sm text-red-600"
            >
              ${escapeHtml(
                errorMessage,
              )}
            </p>

            <button
              id="retry-payments-button"
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
        "#retry-payments-button",
      )
      ?.addEventListener(
        "click",
        () => {
          void loadPayments();
        },
      );
  }
}