
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
} from "../api/client";
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

function formatTime(value: unknown): string {
  const time = String(value ?? "");

  return time.length >= 5
    ? time.substring(0, 5)
    : time;
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
      "#restaurant-page-message",
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
      "#restaurant-page-message",
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

function renderRestaurantRows(
  restaurants: Restaurant[],
): string {
  if (restaurants.length === 0) {
    return `
      <tr>
        <td
          colspan="7"
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>

            <p class="text-sm font-medium text-gray-700">
              No restaurants found.
            </p>

            <p class="text-xs text-gray-500">
              Try another search or add a new restaurant.
            </p>
          </div>
        </td>
      </tr>
    `;
  }

  return restaurants
    .map(
      (restaurant) => `
        <tr class="border-b border-gray-100 transition hover:bg-gray-50">

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(restaurant.restaurant_id)}
          </td>

          <td class="min-w-44 px-6 py-4 text-sm font-medium text-gray-900">
            ${escapeHtml(restaurant.restaurant_name)}
          </td>

          <td class="max-w-xs whitespace-normal wrap-break-word px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(restaurant.address)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(restaurant.city)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            ${escapeHtml(restaurant.phone)}
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
            <span class="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              ${escapeHtml(formatTime(restaurant.opening_time))}
              -
              ${escapeHtml(formatTime(restaurant.closing_time))}
            </span>
          </td>

          <td class="whitespace-nowrap px-6 py-4 text-sm">
            <div class="flex flex-wrap gap-2">

              <button
                type="button"
                data-edit-restaurant="${escapeHtml(restaurant.restaurant_id)}"
                aria-label="Edit ${escapeHtml(restaurant.restaurant_name)}"
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
                data-delete-restaurant="${escapeHtml(restaurant.restaurant_id)}"
                aria-label="Delete ${escapeHtml(restaurant.restaurant_name)}"
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

function validateRestaurantForm(
  restaurantName: string,
  address: string,
  city: string,
  phone: string,
  openingTime: string,
  closingTime: string,
): string | null {
  if (
    !restaurantName ||
    !address ||
    !city ||
    !phone ||
    !openingTime ||
    !closingTime
  ) {
    return "All fields are required.";
  }

  if (restaurantName.length > 255) {
    return "Restaurant name is too long.";
  }

  if (city.length > 100) {
    return "City name is too long.";
  }

  if (phone.length > 30) {
    return "Phone number is too long.";
  }

  if (openingTime === closingTime) {
    return "Opening and closing times cannot be the same.";
  }

  // Same-day operating hours validation.
  // If overnight hours are supported by your system,
  // adjust this rule accordingly.
  if (closingTime < openingTime) {
    return "Closing time must be later than opening time.";
  }

  return null;
}

// ============================================================
// FORM RENDERING
// ============================================================

function renderRestaurantForm(
  restaurant?: Restaurant,
): void {
  const formContainer =
    document.querySelector<HTMLDivElement>(
      "#restaurant-form-container",
    );

  if (!formContainer) {
    return;
  }

  const isEditing = Boolean(restaurant);

  const restaurantName = restaurant
    ? escapeHtml(restaurant.restaurant_name)
    : "";

  const city = restaurant
    ? escapeHtml(restaurant.city)
    : "";

  const address = restaurant
    ? escapeHtml(restaurant.address)
    : "";

  const phone = restaurant
    ? escapeHtml(restaurant.phone)
    : "";

  const openingTime = restaurant
    ? escapeHtml(formatTime(restaurant.opening_time))
    : "";

  const closingTime = restaurant
    ? escapeHtml(formatTime(restaurant.closing_time))
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
                    ? `<path d="M12 20h9"/>
                       <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>`
                    : `<path d="M12 5v14"/>
                       <path d="M5 12h14"/>`
                }
              </svg>
            </div>

            <h3 class="text-xl font-semibold text-gray-800">
              ${isEditing ? "Edit Restaurant" : "Add Restaurant"}
            </h3>

          </div>

          <p class="mt-2 text-sm text-gray-500">
            ${
              isEditing
                ? "Update the restaurant information below."
                : "Add a new restaurant to the system."
            }
          </p>
        </div>

        <button
          type="button"
          id="cancel-restaurant-form"
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

      <form id="restaurant-form" class="space-y-5">

        <!-- Restaurant Name and City -->

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label
              for="restaurant-name"
              class="${labelClass}"
            >
              Restaurant Name
            </label>

            <input
              id="restaurant-name"
              name="restaurant_name"
              type="text"
              required
              maxlength="255"
              value="${restaurantName}"
              placeholder="Enter restaurant name"
              class="${inputClass}"
            />
          </div>

          <div>
            <label
              for="restaurant-city"
              class="${labelClass}"
            >
              City
            </label>

            <input
              id="restaurant-city"
              name="city"
              type="text"
              required
              maxlength="100"
              value="${city}"
              placeholder="Enter city"
              class="${inputClass}"
            />
          </div>

        </div>

        <!-- Address -->

        <div>
          <label
            for="restaurant-address"
            class="${labelClass}"
          >
            Address
          </label>

          <textarea
            id="restaurant-address"
            name="address"
            rows="3"
            required
            placeholder="Enter restaurant address"
            class="${inputClass} resize-y"
          >${address}</textarea>
        </div>

        <!-- Phone -->

        <div>
          <label
            for="restaurant-phone"
            class="${labelClass}"
          >
            Phone
          </label>

          <input
            id="restaurant-phone"
            name="phone"
            type="text"
            required
            maxlength="30"
            value="${phone}"
            placeholder="Enter phone number"
            class="${inputClass}"
          />
        </div>

        <!-- Opening and Closing Time -->

        <div class="grid grid-cols-1 gap-5 md:grid-cols-2">

          <div>
            <label
              for="restaurant-opening-time"
              class="${labelClass}"
            >
              Opening Time
            </label>

            <input
              id="restaurant-opening-time"
              name="opening_time"
              type="time"
              required
              value="${openingTime}"
              class="${inputClass}"
            />
          </div>

          <div>
            <label
              for="restaurant-closing-time"
              class="${labelClass}"
            >
              Closing Time
            </label>

            <input
              id="restaurant-closing-time"
              name="closing_time"
              type="time"
              required
              value="${closingTime}"
              class="${inputClass}"
            />
          </div>

        </div>

        <!-- Form Buttons -->

        <div class="flex flex-wrap gap-3 border-t border-gray-200 pt-5">

          <button
            type="submit"
            id="restaurant-submit-button"
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

            ${isEditing ? "Update Restaurant" : "Save Restaurant"}
          </button>

          <button
            type="button"
            id="cancel-restaurant-form-bottom"
            class="${secondaryButtonClass}"
          >
            Cancel
          </button>

        </div>

        <p
          id="restaurant-form-message"
          class="text-sm"
          role="status"
          aria-live="polite"
        ></p>

      </form>
    </div>
  `;

  const form =
    document.querySelector<HTMLFormElement>(
      "#restaurant-form",
    );

  const cancelButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-restaurant-form",
    );

  const cancelBottomButton =
    document.querySelector<HTMLButtonElement>(
      "#cancel-restaurant-form-bottom",
    );

  const formMessage =
    document.querySelector<HTMLParagraphElement>(
      "#restaurant-form-message",
    );

  const submitButton =
    document.querySelector<HTMLButtonElement>(
      "#restaurant-submit-button",
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

    const restaurantName = String(
      formData.get("restaurant_name") || "",
    ).trim();

    const address = String(
      formData.get("address") || "",
    ).trim();

    const city = String(
      formData.get("city") || "",
    ).trim();

    const phone = String(
      formData.get("phone") || "",
    ).trim();

    const openingTime = String(
      formData.get("opening_time") || "",
    ).trim();

    const closingTime = String(
      formData.get("closing_time") || "",
    ).trim();

    const validationError =
      validateRestaurantForm(
        restaurantName,
        address,
        city,
        phone,
        openingTime,
        closingTime,
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
      restaurant_name: restaurantName,
      address,
      city,
      phone,
      opening_time: openingTime,
      closing_time: closingTime,
    };

    submitButton.disabled = true;

    submitButton.textContent = isEditing
      ? "Updating..."
      : "Saving...";

    showFormMessage(
      formMessage,
      isEditing
        ? "Updating restaurant..."
        : "Saving restaurant...",
      "loading",
    );

    try {
      const response = isEditing
        ? await apiPut(
            `/restaurants/${restaurant?.restaurant_id}`,
            requestBody,
          )
        : await apiPost(
            "/restaurants",
            requestBody,
          );

      showFormMessage(
        formMessage,
        response.message ||
          (isEditing
            ? "Restaurant updated successfully."
            : "Restaurant created successfully."),
        "success",
      );

      await loadRestaurants();

      showMessage(
        response.message ||
          (isEditing
            ? "Restaurant updated successfully."
            : "Restaurant created successfully."),
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
        ? "Update Restaurant"
        : "Save Restaurant";
    }
  });
}

// ============================================================
// MAIN PAGE RENDERING
// ============================================================

function renderRestaurants(
  restaurants: Restaurant[],
  searchTerm = "",
): void {
  const pageContent = getPageContent();

  pageContent.innerHTML = `
    <!-- PAGE HEADER -->

    <div class="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-center">

      <div>
        <h2 class="text-2xl font-bold text-gray-800">
          Restaurant Management
        </h2>

        <p class="mt-1 text-sm text-gray-500">
          Manage restaurants and their information.
        </p>
      </div>

      <button
        id="add-restaurant-button"
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

        Add Restaurant
      </button>

    </div>

    <!-- PAGE MESSAGE -->

    <p
      id="restaurant-page-message"
      class="mb-4 text-sm"
      role="status"
      aria-live="polite"
    ></p>

    <!-- FORM CONTAINER -->

    <div
      id="restaurant-form-container"
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
          Search Restaurants
        </h3>

      </div>

      <div class="flex flex-col gap-3 sm:flex-row">

        <input
          id="restaurant-search"
          type="search"
          value="${escapeHtml(searchTerm)}"
          placeholder="Search by restaurant name or city..."
          aria-label="Search restaurants by name or city"
          class="min-w-0 flex-1 ${inputClass}"
        />

        <button
          id="restaurant-search-button"
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
          id="restaurant-reset-button"
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
        id="restaurant-search-message"
        class="mt-3 text-sm"
        role="status"
        aria-live="polite"
      ></p>

    </div>

    <!-- TABLE CARD -->

    <div class="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">

      <div class="flex flex-col justify-between gap-2 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center">

        <h3 class="text-base font-semibold text-gray-800">
          Restaurant List
        </h3>

        <span class="text-sm text-gray-500">
          ${restaurants.length} restaurant${restaurants.length === 1 ? "" : "s"}
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
                Address
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                City
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
                Opening Hours
              </th>

              <th
                scope="col"
                class="whitespace-nowrap px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500"
              >
                Actions
              </th>

            </tr>

          </thead>

          <tbody id="restaurant-table-body">
            ${renderRestaurantRows(restaurants)}
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
      "#add-restaurant-button",
    );

  const searchInput =
    document.querySelector<HTMLInputElement>(
      "#restaurant-search",
    );

  const searchButton =
    document.querySelector<HTMLButtonElement>(
      "#restaurant-search-button",
    );

  const resetButton =
    document.querySelector<HTMLButtonElement>(
      "#restaurant-reset-button",
    );

  const searchMessage =
    document.querySelector<HTMLParagraphElement>(
      "#restaurant-search-message",
    );

  const tableBody =
    document.querySelector<HTMLTableSectionElement>(
      "#restaurant-table-body",
    );

  // ============================================================
  // ADD RESTAURANT
  // ============================================================

  addButton?.addEventListener("click", () => {
    clearMessage();
    renderRestaurantForm();
  });

  // ============================================================
  // SEARCH RESTAURANTS
  // ============================================================

  const performSearch = async (): Promise<void> => {
    const searchTerm =
      searchInput?.value.trim() || "";

    if (!searchTerm) {
      await loadRestaurants();
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
      const response = await apiGet<Restaurant[]>(
        `/restaurants/search?q=${encodeURIComponent(searchTerm)}`,
      );

      renderRestaurants(
        response.data ?? [],
        searchTerm,
      );
    } catch (error) {
      if (searchMessage) {
        searchMessage.textContent =
          getErrorMessage(
            error,
            "Failed to search restaurants.",
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
    void loadRestaurants();
  });

  // ============================================================
  // TABLE ACTIONS
  // ============================================================

  tableBody?.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;

    const editButton =
      target.closest<HTMLButtonElement>(
        "[data-edit-restaurant]",
      );

    const deleteButton =
      target.closest<HTMLButtonElement>(
        "[data-delete-restaurant]",
      );

    // --------------------------------------------------------
    // EDIT
    // --------------------------------------------------------

    if (editButton) {
      const restaurantId = Number(
        editButton.dataset.editRestaurant,
      );

      const restaurant = restaurants.find(
        (item) =>
          item.restaurant_id === restaurantId,
      );

      if (restaurant) {
        clearMessage();
        renderRestaurantForm(restaurant);
      }

      return;
    }

    // --------------------------------------------------------
    // DELETE
    // --------------------------------------------------------

    if (deleteButton) {
      const restaurantId = Number(
        deleteButton.dataset.deleteRestaurant,
      );

      if (!Number.isFinite(restaurantId)) {
        showMessage(
          "Invalid restaurant ID.",
          "error",
        );

        return;
      }

      const restaurant = restaurants.find(
        (item) =>
          item.restaurant_id === restaurantId,
      );

      const restaurantName =
        restaurant?.restaurant_name ||
        "this restaurant";

      const confirmed = window.confirm(
        `Are you sure you want to delete "${restaurantName}"?`,
      );

      if (!confirmed) {
        return;
      }

      deleteButton.disabled = true;

      try {
        const response = await apiDelete(
          `/restaurants/${restaurantId}`,
        );

        showMessage(
          response.message ||
            "Restaurant deleted successfully.",
          "success",
        );

        await loadRestaurants();
      } catch (error) {
        showMessage(
          getErrorMessage(
            error,
            "Failed to delete restaurant.",
          ),
          "error",
        );

        deleteButton.disabled = false;
      }
    }
  });
}

// ============================================================
// LOAD RESTAURANTS
// ============================================================

export async function loadRestaurants(): Promise<void> {
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
        Loading restaurants...
      </p>

    </div>
  `;

  try {
    const response = await apiGet<Restaurant[]>(
      "/restaurants",
    );

    renderRestaurants(response.data ?? []);
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
              Failed to Load Restaurants
            </h2>

            <p class="mt-2 text-sm text-red-600">
              ${escapeHtml(errorMessage)}
            </p>

            <button
              id="retry-restaurants-button"
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
        "#retry-restaurants-button",
      )
      ?.addEventListener("click", () => {
        void loadRestaurants();
      });
  }
}