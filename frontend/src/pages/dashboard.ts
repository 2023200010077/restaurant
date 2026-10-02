import { apiGet } from "../api/client";

interface DashboardStats {
  restaurants: number;
  customers: number;
  employees: number;
  menuItems: number;
  orders: number;
  payments: number;
  totalRevenue: number;
  orderSummary: {
    pending: number;
    preparing: number;
    ready: number;
    completed: number;
    cancelled: number;
  };
}

function getPageContent(): HTMLDivElement {
  const pageContent =
    document.querySelector<HTMLDivElement>("#page-content");

  if (!pageContent) {
    throw new Error("Page content element not found.");
  }

  return pageContent;
}

function renderDashboard(stats: DashboardStats) {
  const pageContent = getPageContent();

  pageContent.innerHTML = `
    <div class="mb-6">
      <h1 class="text-3xl font-bold text-gray-800">
        Dashboard
      </h1>

      <p class="mt-2 text-gray-600">
        Overview of your Restaurant Management System
      </p>
    </div>

    <div id="dashboard-message"></div>

    <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

      <div class="rounded-xl bg-white p-6 shadow-md">
        <h2 class="text-sm font-medium text-gray-500">
          Total Restaurants
        </h2>

        <p class="mt-3 text-3xl font-bold text-blue-600">
          ${stats.restaurants}
        </p>
      </div>

      <div class="rounded-xl bg-white p-6 shadow-md">
        <h2 class="text-sm font-medium text-gray-500">
          Total Customers
        </h2>

        <p class="mt-3 text-3xl font-bold text-green-600">
          ${stats.customers}
        </p>
      </div>

      <div class="rounded-xl bg-white p-6 shadow-md">
        <h2 class="text-sm font-medium text-gray-500">
          Total Employees
        </h2>

        <p class="mt-3 text-3xl font-bold text-purple-600">
          ${stats.employees}
        </p>
      </div>

      <div class="rounded-xl bg-white p-6 shadow-md">
        <h2 class="text-sm font-medium text-gray-500">
          Total Menu Items
        </h2>

        <p class="mt-3 text-3xl font-bold text-orange-600">
          ${stats.menuItems}
        </p>
      </div>

      <div class="rounded-xl bg-white p-6 shadow-md">
        <h2 class="text-sm font-medium text-gray-500">
          Total Orders
        </h2>

        <p class="mt-3 text-3xl font-bold text-indigo-600">
          ${stats.orders}
        </p>
      </div>

      <div class="rounded-xl bg-white p-6 shadow-md">
        <h2 class="text-sm font-medium text-gray-500">
          Total Payments
        </h2>

        <p class="mt-3 text-3xl font-bold text-pink-600">
          ${stats.payments}
        </p>
      </div>

    </div>

    <div class="mt-8">
      <h2 class="mb-4 text-2xl font-bold text-gray-800">
        Financial Summary
      </h2>

      <div class="rounded-xl bg-white p-6 shadow-md">
        <h3 class="text-sm font-medium text-gray-500">
          Total Revenue
        </h3>

        <p class="mt-3 text-3xl font-bold text-emerald-600">
          ৳${stats.totalRevenue.toFixed(2)}
        </p>

        <p class="mt-2 text-sm text-gray-500">
          Revenue from paid payments
        </p>
      </div>
    </div>

    <div class="mt-8">
      <h2 class="mb-4 text-2xl font-bold text-gray-800">
        Order Summary
      </h2>

      <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">

        <div class="rounded-xl bg-white p-6 shadow-md">
          <h3 class="text-sm font-medium text-gray-500">
            Pending
          </h3>

          <p class="mt-3 text-3xl font-bold text-yellow-600">
            ${stats.orderSummary.pending}
          </p>
        </div>

        <div class="rounded-xl bg-white p-6 shadow-md">
          <h3 class="text-sm font-medium text-gray-500">
            Preparing
          </h3>

          <p class="mt-3 text-3xl font-bold text-orange-600">
            ${stats.orderSummary.preparing}
          </p>
        </div>

        <div class="rounded-xl bg-white p-6 shadow-md">
          <h3 class="text-sm font-medium text-gray-500">
            Ready
          </h3>

          <p class="mt-3 text-3xl font-bold text-blue-600">
            ${stats.orderSummary.ready}
          </p>
        </div>

        <div class="rounded-xl bg-white p-6 shadow-md">
          <h3 class="text-sm font-medium text-gray-500">
            Completed
          </h3>

          <p class="mt-3 text-3xl font-bold text-green-600">
            ${stats.orderSummary.completed}
          </p>
        </div>

        <div class="rounded-xl bg-white p-6 shadow-md">
          <h3 class="text-sm font-medium text-gray-500">
            Cancelled
          </h3>

          <p class="mt-3 text-3xl font-bold text-red-600">
            ${stats.orderSummary.cancelled}
          </p>
        </div>

      </div>
    </div>
  `;
}

export async function loadDashboard() {
  const pageContent = getPageContent();

  pageContent.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <p class="text-lg text-gray-600">
        Loading dashboard...
      </p>
    </div>
  `;

  try {
    const [
      restaurantsResponse,
      customersResponse,
      employeesResponse,
      menuItemsResponse,
      ordersResponse,
      paymentsResponse,
      summaryResponse,
    ] = await Promise.all([
      apiGet<unknown[]>("/restaurants"),
      apiGet<unknown[]>("/customers"),
      apiGet<unknown[]>("/employees"),
      apiGet<unknown[]>("/menu-items"),
      apiGet<unknown[]>("/orders"),
      apiGet<unknown[]>("/payments"),
      apiGet<{
        total_revenue: number;
        order_summary: {
          pending: number;
          preparing: number;
          ready: number;
          completed: number;
          cancelled: number;
        };
      }>("/dashboard/summary"),
    ]);

    const summary = summaryResponse.data;

    const stats: DashboardStats = {
      restaurants: restaurantsResponse.data?.length ?? 0,
      customers: customersResponse.data?.length ?? 0,
      employees: employeesResponse.data?.length ?? 0,
      menuItems: menuItemsResponse.data?.length ?? 0,
      orders: ordersResponse.data?.length ?? 0,
      payments: paymentsResponse.data?.length ?? 0,
      totalRevenue: Number(summary?.total_revenue ?? 0),
      orderSummary: summary?.order_summary ?? {
        pending: 0,
        preparing: 0,
        ready: 0,
        completed: 0,
        cancelled: 0,
      },
    };

    renderDashboard(stats);
  } catch (error) {
    console.error("Dashboard loading error:", error);

    pageContent.innerHTML = `
      <div class="rounded-lg bg-red-100 px-4 py-3 text-red-700">
        Failed to load dashboard data.
        Please check whether the backend is running.
      </div>
    `;
  }
}