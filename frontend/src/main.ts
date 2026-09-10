
import "./style.css";

import { loadDashboard } from "./pages/dashboard";
import { loadRestaurants } from "./pages/restaurants";
import { loadCustomers } from "./pages/customers";
import { loadEmployees } from "./pages/employees";
import { loadCategories } from "./pages/categories";
import { loadMenuItems } from "./pages/menu-items";
import { loadTables } from "./pages/tables";
import { loadReservationPage } from "./pages/reservations";
import { loadOrders } from "./pages/orders";
import { loadOrderItems } from "./pages/order-items";
import { loadPayments } from "./pages/payments";

const appElement = document.querySelector<HTMLDivElement>("#app");

if (!appElement) {
  throw new Error("Application root not found.");
}

const app: HTMLDivElement = appElement;

const FIXED_USERNAME = "admin";
const FIXED_PASSWORD = "admin123";
const AUTH_KEY = "restaurant_manager_logged_in";

type ApplicationPage =
  | "dashboard"
  | "restaurants"
  | "customers"
  | "employees"
  | "categories"
  | "menu-items"
  | "tables"
  | "reservations"
  | "orders"
  | "order-items"
  | "payments";

const validPages: ApplicationPage[] = [
  "dashboard",
  "restaurants",
  "customers",
  "employees",
  "categories",
  "menu-items",
  "tables",
  "reservations",
  "orders",
  "order-items",
  "payments",
];

function isLoggedIn(): boolean {
  return localStorage.getItem(AUTH_KEY) === "true";
}

function setLoggedIn(value: boolean): void {
  if (value) {
    localStorage.setItem(AUTH_KEY, "true");
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

function navigateTo(path: string): void {
  window.history.pushState({}, "", path);
  handleRoute();
}

function getCurrentPath(): string {
  const path = window.location.pathname;

  if (path === "" || path === "/") {
    return "/";
  }

  return path.replace(/\/+$/, "");
}

function getPageFromPath(): ApplicationPage {
  const path = getCurrentPath().replace("/", "");

  if (validPages.includes(path as ApplicationPage)) {
    return path as ApplicationPage;
  }

  return "dashboard";
}

function showLoginPage(message = ""): void {
  app.innerHTML = `
    <div class="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div class="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">

        <div class="mb-8 text-center">
          <h1 class="text-3xl font-bold text-slate-800">
            Restaurant Manager
          </h1>

          <p class="mt-2 text-slate-500">
            Admin Login
          </p>
        </div>

        ${
          message
            ? `
              <div class="mb-5 rounded-lg bg-red-100 px-4 py-3 text-sm text-red-700">
                ${message}
              </div>
            `
            : ""
        }

        <form id="login-form" class="space-y-5">

          <div>
            <label
              for="username"
              class="mb-2 block text-sm font-medium text-slate-700"
            >
              Username
            </label>

            <input
              id="username"
              name="username"
              type="text"
              required
              autocomplete="username"
              class="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label
              for="password"
              class="mb-2 block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <input
              id="password"
              name="password"
              type="password"
              required
              autocomplete="current-password"
              class="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Enter password"
            />
          </div>

          <button
            type="submit"
            class="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Login
          </button>

        </form>

        <p class="mt-6 text-center text-xs text-slate-400">
          Restaurant Management System
        </p>

      </div>
    </div>
  `;

  const loginForm =
    document.querySelector<HTMLFormElement>("#login-form");

  loginForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(loginForm);

    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (
      username === FIXED_USERNAME &&
      password === FIXED_PASSWORD
    ) {
      setLoggedIn(true);
      navigateTo("/dashboard");
    } else {
      showLoginPage("Invalid username or password.");
    }
  });
}

function showApplicationLayout(): void {
  app.innerHTML = `
    <div class="min-h-screen bg-slate-100">

      <header class="bg-slate-900 text-white">
        <div class="mx-auto flex items-center justify-between px-6 py-4">

          <h1 class="text-xl font-bold">
            Restaurant Management & Ordering System
          </h1>

          <div class="flex items-center gap-4">
            <span class="text-sm text-slate-300">
              Admin Panel
            </span>

            <button
              id="logout-button"
              class="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Logout
            </button>
          </div>

        </div>
      </header>

      <div class="mx-auto flex">

        <aside class="hidden min-h-[calc(100vh-68px)] w-60 bg-slate-900 shadow-sm md:block border-t-2 border-slate-800">
          <nav class="space-y-1">

            <button
              class="nav-button"
              data-page="dashboard"
            >
              Dashboard
            </button>

            <button
              class="nav-button"
              data-page="restaurants"
            >
              Restaurants
            </button>

            <button
              class="nav-button"
              data-page="customers"
            >
              Customers
            </button>

            <button
              class="nav-button"
              data-page="employees"
            >
              Employees
            </button>

            <button
              class="nav-button"
              data-page="categories"
            >
              Categories
            </button>

            <button
              class="nav-button"
              data-page="menu-items"
            >
              Menu Items
            </button>

            <button
              class="nav-button"
              data-page="tables"
            >
              Tables
            </button>

            <button
              class="nav-button"
              data-page="reservations"
            >
              Reservations
            </button>

            <button
              class="nav-button"
              data-page="orders"
            >
              Orders
            </button>

            <button
              class="nav-button"
              data-page="order-items"
            >
              Order Items
            </button>

            <button
              class="nav-button"
              data-page="payments"
            >
              Payments
            </button>

          </nav>
        </aside>

        <main
          id="page-content"
          class="min-w-0 flex-1 p-6"
        >
          <div class="flex items-center justify-center py-12">
            <p class="text-lg text-slate-500">
              Loading...
            </p>
          </div>
        </main>

      </div>
    </div>
  `;

  const logoutButton =
    document.querySelector<HTMLButtonElement>("#logout-button");

  logoutButton?.addEventListener("click", () => {
    setLoggedIn(false);
    navigateTo("/");
  });

  const navigationButtons =
    document.querySelectorAll<HTMLButtonElement>(".nav-button");

  navigationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const page = button.dataset.page as ApplicationPage | undefined;

      if (!page || !validPages.includes(page)) {
        return;
      }

      navigateTo(`/${page}`);
    });
  });
}

function updateActiveButton(selectedPage: string): void {
  const navigationButtons =
    document.querySelectorAll<HTMLButtonElement>(".nav-button");

  navigationButtons.forEach((button) => {
    const isActive = button.dataset.page === selectedPage;

    button.classList.toggle("active", isActive);
  });
}

function renderPage(page: ApplicationPage): void {
  updateActiveButton(page);

  if (page === "dashboard") {
    void loadDashboard();
  } else if (page === "restaurants") {
    void loadRestaurants();
  } else if (page === "customers") {
    void loadCustomers();
  } else if (page === "employees") {
    void loadEmployees();
  } else if (page === "categories") {
    void loadCategories();
  } else if (page === "menu-items") {
    void loadMenuItems();
  } else if (page === "tables") {
    void loadTables();
  } else if (page === "reservations") {
    void loadReservationPage();
  } else if (page === "orders") {
    void loadOrders();
  } else if (page === "order-items") {
    void loadOrderItems();
  } else if (page === "payments") {
    void loadPayments();
  }
}

function handleRoute(): void {
  const path = getCurrentPath();

  if (!isLoggedIn()) {
    if (path !== "/") {
      window.history.replaceState({}, "", "/");
    }

    showLoginPage();
    return;
  }

  if (path === "/") {
    navigateTo("/dashboard");
    return;
  }

  const page = getPageFromPath();

  showApplicationLayout();
  renderPage(page);
}

window.addEventListener("popstate", () => {
  handleRoute();
});

handleRoute();