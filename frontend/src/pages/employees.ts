
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../api/client";

import type { Employee } from "../types/employee";
import type { Restaurant } from "../types/restaurant";

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

function getEmployeeValue(
  employee: Employee,
): Employee & {
  is_active?: boolean | number | string;
  active?: boolean | number | string;
  restaurant_name?: string;
} {
  return employee as Employee & {
    is_active?: boolean | number | string;
    active?: boolean | number | string;
    restaurant_name?: string;
  };
}

function isEmployeeActive(employee: Employee): boolean {
  const employeeData = getEmployeeValue(employee);

  const value =
    employeeData.is_active ??
    employeeData.active ??
    true;

  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
}

function formatSalary(value: unknown): string {
  const salary = Number(value);

  if (!Number.isFinite(salary)) {
    return String(value ?? "-");
  }

  return salary.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
      "#employee-page-message",
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
      "#employee-page-message",
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
// EMPLOYEE STATUS
// ============================================================

function renderStatusBadge(employee: Employee): string {
  const active = isEmployeeActive(employee);

  return active
    ? `
      <span class="inline-flex items-center rounded-md bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
        Active
      </span>
    `
    : `
      <span class="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
        Inactive
      </span>
    `;
}

// ============================================================
// TABLE ROWS
// ============================================================

function renderEmployeeRows(
  employees: Employee[],
): string {
  if (employees.length === 0) {
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
              stroke-linecap="round"
              stroke-linejoin="round"
              class="text-gray-400"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>

            <p class="text-sm font-medium text-gray-700">
              No employees found.
            </p>

            <p class="text-xs text-gray-500">
              Try another search or add a new employee.
            </p>

          </div>
        </td>
      </tr>
    `;
  }

  return employees
    .map((employee) => {
      const employeeData = getEmployeeValue(employee);

      const employeeId = employeeData.employee_id;
      const employeeName = employeeData.employee_name;
      const designation = employeeData.designation;
      const phone = employeeData.phone;
      const salary = employeeData.salary;
      const restaurantId = employeeData.restaurant_id;
      const restaurantName =
        employeeData.restaurant_name ||
        `Restaurant #${restaurantId ?? "-"}`;

      return `
        <tr class="border-b border-gray-100 transition hover:bg-gray-50">

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(employeeId)}
          </td>

          <td class="min-w-44 px-6 py-4 text-sm font-medium text-gray-900">
            ${escapeHtml(employeeName)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(designation)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(phone)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(formatSalary(salary))}
          </td>

          <td class="min-w-44 px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(restaurantName)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm">
            ${renderStatusBadge(employee)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm">
            <div class="flex flex-wrap gap-2">

              <button
                type="button"
                data-edit-employee="${escapeHtml(employeeId)}"
                aria-label="Edit ${escapeHtml(employeeName)}"
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
                data-delete-employee="${escapeHtml(employeeId)}"
                aria-label="Delete ${escapeHtml(employeeName)}"
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

function validateEmployeeForm(
  employeeName: string,
  designation: string,
  phone: string,
  salary: string,
  restaurantId: string,
): string | null {
  if (
    !employeeName ||
    !designation ||
    !phone ||
    !salary ||
    !restaurantId
  ) {
    return "All fields are required.";
  }

  if (employeeName.length > 255) {
    return "Employee name is too long.";
  }

  if (designation.length > 100) {
    return "Designation is too long.";
  }

  if (phone.length > 30) {
    return "Phone number is too long.";
  }

  const salaryValue = Number(salary);

  if (!Number.isFinite(salaryValue) || salaryValue < 0) {
    return "Please enter a valid salary.";
  }

  return null;
}

// ============================================================
// EMPLOYEE FORM
// ============================================================

function renderEmployeeForm(
  restaurants: Restaurant[],
  employee?: Employee,
): void {
  const formContainer =
    document.querySelector<HTMLDivElement>(
      "#employee-form-container",
    );

  if (!formContainer) {
    return;
  }

  const isEditing = Boolean(employee);
  const employeeData = employee
    ? getEmployeeValue(employee)
    : null;

  const employeeName = employeeData
    ? escapeHtml(employeeData.employee_name)
    : "";

  const designation = employeeData
    ? escapeHtml(employeeData.designation)
    : "";

  const phone = employeeData
    ? escapeHtml(employeeData.phone)
    : "";

  const salary = employeeData
    ? escapeHtml(employeeData.salary)
    : "";

  const selectedRestaurantId = employeeData
    ? String(employeeData.restaurant_id ?? "")
    : "";

  const active = employee
    ? isEmployeeActive(employee)
    : true;

  const restaurantOptions = restaurants
    .map((restaurant) => {
      const restaurantId = String(
        restaurant.restaurant_id,
      );

      const selected =
        restaurantId === selectedRestaurantId
          ? "selected"
          : "";

      return `
        <option
          value="${escapeHtml(restaurantId)}"
          ${selected}
        >
          ${escapeHtml(restaurant.restaurant_name)}
        </option>
      `;
    })
    .join("");

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
              ${isEditing ? "Edit Employee" : "Add Employee"}
            </h3>

          </div>

          <p class="mt-2 text-sm text-gray-500">
            ${
              isEditing
                ? "Update the employee information below."
                : "Add a new employee to the system."
            }
          </p>
        </div>

        <button
          type="button"
          id="cancel-employee-form"
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

      <form id="employee-form" class="space-y-5">

        <!-- Employee Name and Designation -->

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label
              for="employee-name"
              class="${labelClass}"
            >
              Employee Name
            </label>

            <input
              id="employee-name"
              name="employee_name"
              type="text"
              required
              maxlength="255"
              value="${employeeName}"
              placeholder="Enter employee name"
              class="${inputClass}"
            />
          </div>

          <div>
            <label
              for="employee-designation"
              class="${labelClass}"
            >
              Designation
            </label>

            <input
              id="employee-designation"
              name="designation"
              type="text"
              required
              maxlength="100"
              value="${designation}"
              placeholder="Enter designation"
              class="${inputClass}"
            />
          </div>

        </div>

        <!-- Phone and Salary -->

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label
              for="employee-phone"
              class="${labelClass}"
            >
              Phone
            </label>

            <input
              id="employee-phone"
              name="phone"
              type="text"
              required
              maxlength="30"
              value="${phone}"
              placeholder="Enter phone number"
              class="${inputClass}"
            />
          </div>

          <div>
            <label
              for="employee-salary"
              class="${labelClass}"
            >
              Salary
            </label>

            <input
              id="employee-salary"
              name="salary"
              type="number"
              required
              min="0"
              step="0.01"
              value="${salary}"
              placeholder="Enter salary"
              class="${inputClass}"
            />
          </div>

        </div>

        <!-- Restaurant -->

        <div>
          <label
            for="employee-restaurant"
            class="${labelClass}"
          >
            Restaurant
          </label>

          <select
            id="employee-restaurant"
            name="restaurant_id"
            required
            class="${inputClass}"
          >
            <option value="">
              Select a restaurant
            </option>

            ${restaurantOptions}
          </select>
        </div>

        <!-- Active Status -->

        <div>
          <label
            for="employee-active"
            class="${labelClass}"
          >
            Status
          </label>

          <select
            id="employee-active"
            name="is_active"
            class="${inputClass}"
          >
            <option value="true" ${active ? "selected" : ""}>
              Active
            </option>

            <option value="false" ${!active ? "selected" : ""}>
              Inactive
            </option>
          </select>
        </div>

        <!-- Form Buttons -->

        <div class="flex flex-wrap gap-3 border-t border-gray-200 pt-5">

          <button
            type="submit"
            id="employee-submit-button"
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

            ${isEditing ? "Update Employee" : "Save Employee"}
          </button>

          <button
            type="button"
            id="cancel-employee-form-bottom"
            class="${secondaryButtonClass}"
          >
            Cancel
          </button>

        </div>

        <p
          id="employee-form-message"
          class="text-sm"
          role="status"
          aria-live="polite"
        ></p>

      </form>
    </div>
  `;

  const form =
    document.querySelector<HTMLFormElement>(
      "#employee-form",
    );

  const cancelButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-employee-form",
    );

  const cancelBottomButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-employee-form-bottom",
    );

  const formMessage =
    document.querySelector<HTMLParagraphElement>(
      "#employee-form-message",
    );

  const submitButton =
    document.querySelector<HTMLButtonElement>(
      "#employee-submit-button",
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

    const employeeName = String(
      formData.get("employee_name") || "",
    ).trim();

    const designation = String(
      formData.get("designation") || "",
    ).trim();

    const phone = String(
      formData.get("phone") || "",
    ).trim();

    const salary = String(
      formData.get("salary") || "",
    ).trim();

    const restaurantId = String(
      formData.get("restaurant_id") || "",
    ).trim();

    const isActive =
      String(formData.get("is_active")) === "true";

    const validationError =
      validateEmployeeForm(
        employeeName,
        designation,
        phone,
        salary,
        restaurantId,
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
      employee_name: employeeName,
      designation,
      phone,
      salary: Number(salary),
      restaurant_id: Number(restaurantId),
      is_active: isActive,
    };

    submitButton.disabled = true;

    submitButton.textContent = isEditing
      ? "Updating..."
      : "Saving...";

    showFormMessage(
      formMessage,
      isEditing
        ? "Updating employee..."
        : "Saving employee...",
      "loading",
    );

    try {
      const response = isEditing
        ? await apiPut(
            `/employees/${employee?.employee_id}`,
            requestBody,
          )
        : await apiPost(
            "/employees",
            requestBody,
          );

      const successMessage =
        response.message ||
        (isEditing
          ? "Employee updated successfully."
          : "Employee created successfully.");

      showFormMessage(
        formMessage,
        successMessage,
        "success",
      );

      await loadEmployees();

      showMessage(successMessage, "success");
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
        ? "Update Employee"
        : "Save Employee";
    }
  });
}

// ============================================================
// EMPLOYEE TABLE AND PAGE RENDERING
// ============================================================

function renderEmployees(
  employees: Employee[],
  searchTerm = "",
): void {
  const pageContent = getPageContent();

  pageContent.innerHTML = `
    <!-- PAGE HEADER -->

    <div class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

      <div>
        <h2 class="text-2xl font-bold text-gray-800">
          Employee Management
        </h2>

        <p class="mt-1 text-sm text-gray-500">
          Manage restaurant employees and their information.
        </p>
      </div>

      <button
        id="add-employee-button"
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

        Add Employee
      </button>

    </div>

    <!-- PAGE MESSAGE -->

    <p
      id="employee-page-message"
      class="mb-4 text-sm"
      role="status"
      aria-live="polite"
    ></p>

    <!-- FORM CONTAINER -->

    <div
      id="employee-form-container"
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
          Search Employees
        </h3>

      </div>

      <div class="flex flex-col gap-3 sm:flex-row">

        <input
          id="employee-search"
          type="search"
          value="${escapeHtml(searchTerm)}"
          placeholder="Search by employee name or designation..."
          aria-label="Search employees"
          class="min-w-0 flex-1 ${inputClass}"
        />

        <button
          id="employee-search-button"
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
          id="employee-reset-button"
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
        id="employee-search-message"
        class="mt-3 text-sm"
        role="status"
        aria-live="polite"
      ></p>

    </div>

    <!-- TABLE CARD -->

    <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

      <div class="flex flex-col justify-between gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center">

        <h3 class="text-base font-semibold text-gray-800">
          Employee List
        </h3>

        <span class="text-sm text-gray-500">
          ${employees.length}
          employee${employees.length === 1 ? "" : "s"}
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
                Name
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Designation
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Phone
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Salary
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

          <tbody id="employee-table-body">
            ${renderEmployeeRows(employees)}
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
      "#add-employee-button",
    );

  const searchInput =
    document.querySelector<HTMLInputElement>(
      "#employee-search",
    );

  const searchButton =
    document.querySelector<HTMLButtonElement>(
      "#employee-search-button",
    );

  const resetButton =
    document.querySelector<HTMLButtonElement>(
      "#employee-reset-button",
    );

  const searchMessage =
    document.querySelector<HTMLParagraphElement>(
      "#employee-search-message",
    );

  const tableBody =
    document.querySelector<HTMLTableSectionElement>(
      "#employee-table-body",
    );

  // ============================================================
  // ADD EMPLOYEE
  // ============================================================

  addButton?.addEventListener("click", async () => {
    clearMessage();

    try {
      const response = await apiGet<Restaurant[]>(
        "/restaurants",
      );

      renderEmployeeForm(response.data ?? []);
    } catch (error) {
      showMessage(
        getErrorMessage(
          error,
          "Failed to load restaurants.",
        ),
        "error",
      );
    }
  });

  // ============================================================
  // SEARCH EMPLOYEES
  // ============================================================

  const performSearch = async (): Promise<void> => {
    const currentSearchTerm =
      searchInput?.value.trim() || "";

    if (!currentSearchTerm) {
      await loadEmployees();
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
      const response = await apiGet<Employee[]>(
        `/employees/search?q=${encodeURIComponent(currentSearchTerm)}`,
      );

      renderEmployees(
        response.data ?? [],
        currentSearchTerm,
      );
    } catch (error) {
      if (searchMessage) {
        searchMessage.textContent =
          getErrorMessage(
            error,
            "Failed to search employees.",
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
    void loadEmployees();
  });

  // ============================================================
  // TABLE ACTIONS
  // ============================================================

  tableBody?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;

    const editButton =
      target.closest<HTMLButtonElement>(
        "[data-edit-employee]",
      );

    const deleteButton =
      target.closest<HTMLButtonElement>(
        "[data-delete-employee]",
      );

    // ----------------------------------------------------------
    // EDIT EMPLOYEE
    // ----------------------------------------------------------

    if (editButton) {
      const employeeId = Number(
        editButton.dataset.editEmployee,
      );

      const employee = employees.find(
        (item) =>
          Number(item.employee_id) === employeeId,
      );

      if (!employee) {
        showMessage(
          "Employee not found.",
          "error",
        );

        return;
      }

      clearMessage();

      try {
        const response = await apiGet<Restaurant[]>(
          "/restaurants",
        );

        renderEmployeeForm(
          response.data ?? [],
          employee,
        );
      } catch (error) {
        showMessage(
          getErrorMessage(
            error,
            "Failed to load restaurants.",
          ),
          "error",
        );
      }

      return;
    }

    // ----------------------------------------------------------
    // DELETE EMPLOYEE
    // ----------------------------------------------------------

    if (deleteButton) {
      const employeeId = Number(
        deleteButton.dataset.deleteEmployee,
      );

      if (!Number.isFinite(employeeId)) {
        showMessage(
          "Invalid employee ID.",
          "error",
        );

        return;
      }

      const employee = employees.find(
        (item) =>
          Number(item.employee_id) === employeeId,
      );

      const employeeName =
        employee?.employee_name ||
        "this employee";

      const confirmed = window.confirm(
        `Are you sure you want to delete "${employeeName}"?`,
      );

      if (!confirmed) {
        return;
      }

      deleteButton.disabled = true;

      try {
        const response = await apiDelete(
          `/employees/${employeeId}`,
        );

        showMessage(
          response.message ||
            "Employee deleted successfully.",
          "success",
        );

        await loadEmployees();
      } catch (error) {
        showMessage(
          getErrorMessage(
            error,
            "Failed to delete employee.",
          ),
          "error",
        );

        deleteButton.disabled = false;
      }
    }
  });
}

// ============================================================
// LOAD EMPLOYEES
// ============================================================

export async function loadEmployees(): Promise<void> {
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
        Loading employees...
      </p>

    </div>
  `;

  try {
    const response = await apiGet<Employee[]>(
      "/employees",
    );

    renderEmployees(response.data ?? []);
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
              Failed to Load Employees
            </h2>

            <p class="mt-2 text-sm text-red-600">
              ${escapeHtml(errorMessage)}
            </p>

            <button
              id="retry-employees-button"
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
        "#retry-employees-button",
      )
      ?.addEventListener("click", () => {
        void loadEmployees();
      });
  }
}