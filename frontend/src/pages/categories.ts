
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../api/client";

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

// ============================================================
// MESSAGE HELPERS
// ============================================================

function showMessage(
  message: string,
  type: "success" | "error",
): void {
  const messageElement =
    document.querySelector<HTMLParagraphElement>(
      "#category-page-message",
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
      "#category-page-message",
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
// CATEGORY TABLE ROWS
// ============================================================

function renderCategoryRows(
  categories: Category[],
): string {
  if (categories.length === 0) {
    return `
      <tr>
        <td
          colspan="4"
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
              <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/>
              <path d="M8 7h8"/>
              <path d="M8 11h8"/>
              <path d="M8 15h5"/>
            </svg>

            <p class="text-sm font-medium text-gray-700">
              No categories found.
            </p>

            <p class="text-xs text-gray-500">
              Try another search or add a new category.
            </p>

          </div>
        </td>
      </tr>
    `;
  }

  return categories
    .map(
      (category) => `
        <tr class="border-b border-gray-100 transition hover:bg-gray-50">

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(category.category_id)}
          </td>

          <td class="min-w-44 px-6 py-4 text-sm font-medium text-gray-900">
            ${escapeHtml(category.category_name)}
          </td>

          <td class="max-w-xl whitespace-normal wrap-break-word px-6 py-4 text-sm text-gray-600">
            ${
              category.description
                ? escapeHtml(category.description)
                : "—"
            }
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm">
            <div class="flex flex-wrap gap-2">

              <button
                type="button"
                data-edit-category="${escapeHtml(category.category_id)}"
                aria-label="Edit ${escapeHtml(category.category_name)}"
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
                data-delete-category="${escapeHtml(category.category_id)}"
                aria-label="Delete ${escapeHtml(category.category_name)}"
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
// FORM VALIDATION
// ============================================================

function validateCategoryForm(
  categoryName: string,
  description: string,
): string | null {
  if (!categoryName) {
    return "Category name is required.";
  }

  if (categoryName.length > 100) {
    return "Category name is too long.";
  }

  if (description.length > 1000) {
    return "Description is too long.";
  }

  return null;
}

// ============================================================
// CATEGORY FORM
// ============================================================

function renderCategoryForm(
  category?: Category,
): void {
  const formContainer =
    document.querySelector<HTMLDivElement>(
      "#category-form-container",
    );

  if (!formContainer) {
    return;
  }

  const isEditing = Boolean(category);

  const categoryName = category
    ? escapeHtml(category.category_name)
    : "";

  const description = category
    ? escapeHtml(category.description ?? "")
    : "";

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
              ${isEditing ? "Edit Category" : "Add Category"}
            </h3>

          </div>

          <p class="mt-2 text-sm text-gray-500">
            ${
              isEditing
                ? "Update the category information below."
                : "Create a category for your menu items."
            }
          </p>
        </div>

        <button
          type="button"
          id="cancel-category-form"
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

      <form id="category-form" class="space-y-5">

        <!-- Category Name -->

        <div>
          <label
            for="category-name"
            class="${labelClass}"
          >
            Category Name
          </label>

          <input
            id="category-name"
            name="category_name"
            type="text"
            maxlength="100"
            required
            value="${categoryName}"
            placeholder="e.g. Main Course"
            class="${inputClass}"
          />
        </div>

        <!-- Description -->

        <div>
          <label
            for="category-description"
            class="${labelClass}"
          >
            Description
          </label>

          <textarea
            id="category-description"
            name="description"
            rows="4"
            maxlength="1000"
            placeholder="Enter category description"
            class="${inputClass} resize-y"
          >${description}</textarea>
        </div>

        <!-- Form Buttons -->

        <div class="flex flex-wrap gap-3 border-t border-gray-200 pt-5">

          <button
            type="submit"
            id="category-submit-button"
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

            ${isEditing ? "Update Category" : "Save Category"}
          </button>

          <button
            type="button"
            id="cancel-category-form-bottom"
            class="${secondaryButtonClass}"
          >
            Cancel
          </button>

        </div>

        <p
          id="category-form-message"
          class="text-sm"
          role="status"
          aria-live="polite"
        ></p>

      </form>
    </div>
  `;

  const form =
    document.querySelector<HTMLFormElement>(
      "#category-form",
    );

  const cancelButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-category-form",
    );

  const cancelBottomButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-category-form-bottom",
    );

  const formMessage =
    document.querySelector<HTMLParagraphElement>(
      "#category-form-message",
    );

  const submitButton =
    document.querySelector<HTMLButtonElement>(
      "#category-submit-button",
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

    const categoryName = String(
      formData.get("category_name") || "",
    ).trim();

    const description = String(
      formData.get("description") || "",
    ).trim();

    const validationError =
      validateCategoryForm(
        categoryName,
        description,
      );

    if (validationError) {
      showFormMessage(
        formMessage,
        validationError,
        "error",
      );

      return;
    }

    const categoryData = {
      category_name: categoryName,
      description,
    };

    submitButton.disabled = true;

    submitButton.textContent = isEditing
      ? "Updating..."
      : "Saving...";

    showFormMessage(
      formMessage,
      isEditing
        ? "Updating category..."
        : "Saving category...",
      "loading",
    );

    try {
      const response = isEditing
        ? await apiPut(
            `/categories/${category?.category_id}`,
            categoryData,
          )
        : await apiPost(
            "/categories",
            categoryData,
          );

      const successMessage =
        response.message ||
        (isEditing
          ? "Category updated successfully."
          : "Category created successfully.");

      showFormMessage(
        formMessage,
        successMessage,
        "success",
      );

      await loadCategories();

      showMessage(
        successMessage,
        "success",
      );
    } catch (error) {
      showFormMessage(
        formMessage,
        getErrorMessage(
          error,
          isEditing
            ? "Failed to update category."
            : "Failed to create category.",
        ),
        "error",
      );

      submitButton.disabled = false;

      submitButton.textContent = isEditing
        ? "Update Category"
        : "Save Category";
    }
  });
}

// ============================================================
// CATEGORY PAGE RENDERING
// ============================================================

function renderCategories(
  categories: Category[],
  searchTerm = "",
): void {
  const pageContent = getPageContent();

  pageContent.innerHTML = `
    <!-- PAGE HEADER -->

    <div class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

      <div>
        <h2 class="text-2xl font-bold text-gray-800">
          Category Management
        </h2>

        <p class="mt-1 text-sm text-gray-500">
          Manage categories for your menu items.
        </p>
      </div>

      <button
        id="add-category-button"
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

        Add Category
      </button>

    </div>

    <!-- PAGE MESSAGE -->

    <p
      id="category-page-message"
      class="mb-4 text-sm"
      role="status"
      aria-live="polite"
    ></p>

    <!-- FORM CONTAINER -->

    <div
      id="category-form-container"
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
          Search Categories
        </h3>

      </div>

      <div class="flex flex-col gap-3 sm:flex-row">

        <input
          id="category-search"
          type="search"
          value="${escapeHtml(searchTerm)}"
          placeholder="Search by category name or description..."
          aria-label="Search categories by name or description"
          class="min-w-0 flex-1 ${inputClass}"
        />

        <button
          id="category-search-button"
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
          id="category-reset-button"
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
        id="category-search-message"
        class="mt-3 text-sm"
        role="status"
        aria-live="polite"
      ></p>

    </div>

    <!-- TABLE CARD -->

    <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

      <div class="flex flex-col justify-between gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center">

        <h3 class="text-base font-semibold text-gray-800">
          Category List
        </h3>

        <span class="text-sm text-gray-500">
          ${categories.length}
          categor${categories.length === 1 ? "y" : "ies"}
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
                Category Name
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
                Actions
              </th>

            </tr>

          </thead>

          <tbody id="category-table-body">
            ${renderCategoryRows(categories)}
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
      "#add-category-button",
    );

  const searchInput =
    document.querySelector<HTMLInputElement>(
      "#category-search",
    );

  const searchButton =
    document.querySelector<HTMLButtonElement>(
      "#category-search-button",
    );

  const resetButton =
    document.querySelector<HTMLButtonElement>(
      "#category-reset-button",
    );

  const searchMessage =
    document.querySelector<HTMLParagraphElement>(
      "#category-search-message",
    );

  const tableBody =
    document.querySelector<HTMLTableSectionElement>(
      "#category-table-body",
    );

  // ============================================================
  // ADD CATEGORY
  // ============================================================

  addButton?.addEventListener("click", () => {
    clearMessage();
    renderCategoryForm();
  });

  // ============================================================
  // SEARCH CATEGORIES
  // ============================================================

  const performSearch = async (): Promise<void> => {
    const currentSearchTerm =
      searchInput?.value.trim() || "";

    if (!currentSearchTerm) {
      await loadCategories();
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
      const response = await apiGet<Category[]>(
        `/categories/search?q=${encodeURIComponent(currentSearchTerm)}`,
      );

      renderCategories(
        response.data ?? [],
        currentSearchTerm,
      );
    } catch (error) {
      if (searchMessage) {
        searchMessage.textContent =
          getErrorMessage(
            error,
            "Failed to search categories.",
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
    void loadCategories();
  });

  // ============================================================
  // TABLE ACTIONS
  // ============================================================

  tableBody?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;

    const editButton =
      target.closest<HTMLButtonElement>(
        "[data-edit-category]",
      );

    const deleteButton =
      target.closest<HTMLButtonElement>(
        "[data-delete-category]",
      );

    // ----------------------------------------------------------
    // EDIT CATEGORY
    // ----------------------------------------------------------

    if (editButton) {
      const categoryId = Number(
        editButton.dataset.editCategory,
      );

      if (!Number.isFinite(categoryId)) {
        showMessage(
          "Invalid category ID.",
          "error",
        );

        return;
      }

      try {
        const response = await apiGet<Category[]>(
          "/categories",
        );

        const category = (
          response.data ?? []
        ).find(
          (item) =>
            Number(item.category_id) === categoryId,
        );

        if (!category) {
          throw new Error("Category not found.");
        }

        clearMessage();
        renderCategoryForm(category);
      } catch (error) {
        showMessage(
          getErrorMessage(
            error,
            "Failed to load category.",
          ),
          "error",
        );
      }

      return;
    }

    // ----------------------------------------------------------
    // DELETE CATEGORY
    // ----------------------------------------------------------

    if (deleteButton) {
      const categoryId = Number(
        deleteButton.dataset.deleteCategory,
      );

      if (!Number.isFinite(categoryId)) {
        showMessage(
          "Invalid category ID.",
          "error",
        );

        return;
      }

      const category = categories.find(
        (item) =>
          Number(item.category_id) === categoryId,
      );

      const categoryName =
        category?.category_name ||
        "this category";

      const confirmed = window.confirm(
        `Are you sure you want to delete "${categoryName}"?`,
      );

      if (!confirmed) {
        return;
      }

      deleteButton.disabled = true;

      try {
        const response = await apiDelete(
          `/categories/${categoryId}`,
        );

        const successMessage =
          response.message ||
          "Category deleted successfully.";

        showMessage(
          successMessage,
          "success",
        );

        await loadCategories();
      } catch (error) {
        showMessage(
          getErrorMessage(
            error,
            "Failed to delete category.",
          ),
          "error",
        );

        deleteButton.disabled = false;
      }
    }
  });
}

// ============================================================
// LOAD CATEGORIES
// ============================================================

export async function loadCategories(): Promise<void> {
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
        Loading categories...
      </p>

    </div>
  `;

  try {
    const response = await apiGet<Category[]>(
      "/categories",
    );

    renderCategories(response.data ?? []);
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
              Failed to Load Categories
            </h2>

            <p class="mt-2 text-sm text-red-600">
              ${escapeHtml(errorMessage)}
            </p>

            <button
              id="retry-categories-button"
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
        "#retry-categories-button",
      )
      ?.addEventListener("click", () => {
        void loadCategories();
      });
  }
}