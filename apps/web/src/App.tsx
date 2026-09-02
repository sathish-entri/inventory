import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth";
import { AppShell } from "./shell";
import {
  AdjustmentsPage,
  BillsPage,
  DashboardPage,
  EstimatesPage,
  FulfillmentPage,
  Guard,
  InvoicesPage,
  InventoryPage,
  LoginPage,
  PartiesPage,
  PaymentsPage,
  ProductsPage,
  PurchaseOrdersPage,
  PurchaseReturnsPage,
  RegisterPage,
  ReportsPage,
  SalesOrdersPage,
  SalesReturnsPage,
  SettingsPage,
  SimpleListPage,
  TransfersPage,
  UsersPage,
  WarehousesPage,
  useToastStyles,
} from "./pages";

const client = new QueryClient();

function StyledRoutes() {
  useToastStyles();
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <Guard>
            <AppShell />
          </Guard>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="warehouses" element={<WarehousesPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="adjustments" element={<AdjustmentsPage />} />
        <Route path="transfers" element={<TransfersPage />} />
        <Route path="customers" element={<PartiesPage kind="customers" />} />
        <Route path="vendors" element={<PartiesPage kind="vendors" />} />
        <Route path="estimates" element={<EstimatesPage />} />
        <Route path="sales-orders" element={<SalesOrdersPage />} />
        <Route path="packages" element={<FulfillmentPage kind="packages" />} />
        <Route path="shipments" element={<FulfillmentPage kind="shipments" />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="sales-returns" element={<SalesReturnsPage />} />
        <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
        <Route
          path="receives"
          element={
            <SimpleListPage
              title="Purchase receives"
              path="/purchase-receives"
              headers={["Number"]}
              map={(r) => [String(r.number)]}
            />
          }
        />
        <Route path="bills" element={<BillsPage />} />
        <Route path="purchase-returns" element={<PurchaseReturnsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route
          path="notifications"
          element={
            <SimpleListPage
              title="Notifications"
              path="/notifications"
              headers={["Type", "Title"]}
              map={(r) => [String(r.type), String(r.title)]}
            />
          }
        />
        <Route path="users" element={<UsersPage />} />
        <Route
          path="audit"
          element={
            <SimpleListPage
              title="Audit log"
              path="/audit-logs"
              headers={["Action", "Resource"]}
              map={(r) => [String(r.action), String(r.resourceType)]}
            />
          }
        />
        <Route
          path="integrations"
          element={
            <SimpleListPage
              title="Integrations"
              path="/integrations"
              headers={["Provider", "Type", "Enabled"]}
              map={(r) => [String(r.provider), String(r.type), String(r.isEnabled)]}
            />
          }
        />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <BrowserRouter>
          <StyledRoutes />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
