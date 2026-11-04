import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Modal } from "antd";
import { useAuth } from "./auth";
import {
  LayoutDashboard, Package, Warehouse, Archive, ArrowLeftRight,
  Users, FileText, ShoppingCart, Box, Truck, Receipt, DollarSign,
  RotateCcw, ShoppingBag, Download, FileCheck,
  Bell, Settings, UserCog, ClipboardList, Plug, LogOut, Boxes,
  BarChart3, RefreshCw, Menu, X, Home, ShoppingBag as PurchaseIcon,
  ChevronRight, MoreHorizontal,
} from "lucide-react";

const groups = [
  {
    title: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/reports", label: "Reports", icon: BarChart3 },
      { to: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Catalog",
    items: [
      { to: "/products", label: "Products", icon: Package },
      { to: "/warehouses", label: "Warehouses", icon: Warehouse },
      { to: "/inventory", label: "Inventory", icon: Archive },
      { to: "/adjustments", label: "Adjustments", icon: RefreshCw },
      { to: "/transfers", label: "Transfers", icon: ArrowLeftRight },
    ],
  },
  {
    title: "Sales",
    items: [
      { to: "/customers", label: "Customers", icon: Users },
      { to: "/estimates", label: "Estimates", icon: FileText },
      { to: "/sales-orders", label: "Sales Orders", icon: ShoppingCart },
      { to: "/packages", label: "Packages", icon: Box },
      { to: "/shipments", label: "Shipments", icon: Truck },
      { to: "/invoices", label: "Invoices", icon: Receipt },
      { to: "/payments", label: "Payments", icon: DollarSign },
      { to: "/sales-returns", label: "Sales Returns", icon: RotateCcw },
    ],
  },
  {
    title: "Purchases",
    items: [
      { to: "/vendors", label: "Vendors", icon: ShoppingBag },
      { to: "/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
      { to: "/receives", label: "Receives", icon: Download },
      { to: "/bills", label: "Bills", icon: FileCheck },
      { to: "/purchase-returns", label: "Purchase Returns", icon: RotateCcw },
    ],
  },
  {
    title: "Admin",
    items: [
      { to: "/users", label: "Users", icon: UserCog },
      { to: "/audit", label: "Audit Log", icon: ClipboardList },
      { to: "/integrations", label: "Integrations", icon: Plug },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

// Bottom tab items for mobile (most used)
const mobileBottomTabs = [
  { to: "/", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/sales-orders", label: "Sales", icon: ShoppingCart },
  { to: "/invoices", label: "Invoices", icon: Receipt },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/products", label: "Products", icon: Package },
];

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function AppShell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(Boolean(isStandalone));
    };

    checkStandalone();

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setInstallPrompt(null);
        setIsInstalled(true);
      }
    } else {
      Modal.info({
        title: "Install Inventra as an App",
        centered: true,
        content: (
          <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6 }}>
            <p style={{ fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
              💻 Google Chrome / Microsoft Edge on PC:
            </p>
            <p style={{ color: "#475569", marginBottom: 12 }}>
              Look at your browser's address bar (top-right next to the bookmark star) and click the <strong>Install icon</strong> (🖥️ or 📥), or click the browser menu (<strong>⋮</strong>) and select <strong>"Install Inventra..."</strong>.
            </p>
            <p style={{ fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
              📱 Android (Chrome):
            </p>
            <p style={{ color: "#475569", marginBottom: 12 }}>
              Tap the <strong>three dots (⋮)</strong> in Chrome and tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
            </p>
            <p style={{ fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
              🍏 iPhone / iPad (Safari):
            </p>
            <p style={{ color: "#475569" }}>
              Tap the <strong>Share</strong> button (square with arrow) at the bottom, then scroll down and tap <strong>"Add to Home Screen"</strong>.
            </p>
          </div>
        ),
      });
    }
  };

  const initials = user
    ? `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "U";

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      {/* ── Mobile Overlay ── */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={closeSidebar}
      />

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div>
            <div className="sidebar-logo-name">
              <Boxes size={20} color="#5b9bf8" />
              Inventra
            </div>
            <div className="sidebar-org">{user?.organization?.name ?? "Loading…"}</div>
          </div>
          <button className="sidebar-close-btn" onClick={closeSidebar} title="Close menu">
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {groups.map((g) => (
            <div key={g.title} style={{ marginBottom: 6 }}>
              <div className="sidebar-group-label">{g.title}</div>
              {g.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                    onClick={closeSidebar}
                  >
                    <Icon size={15} />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="sidebar-install-btn"
              title="Install Inventra as App"
            >
              <Download size={14} />
              <span>Install App</span>
            </button>
          )}

          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.firstName} {user?.lastName}</div>
              <div className="sidebar-user-role">Administrator</div>
            </div>
            <button
              onClick={() => void logout().then(() => nav("/login"))}
              title="Sign out"
              style={{
                background: "transparent", border: "none",
                color: "rgba(255,255,255,0.4)", cursor: "pointer",
                padding: 4, borderRadius: 4, display: "flex",
                transition: "color 150ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.9)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="page-content">
        {/* Mobile Topbar */}
        <div className="mobile-topbar">
          <button className="mobile-hamburger" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <Menu size={22} />
          </button>
          <div className="mobile-topbar-logo">
            <Boxes size={18} color="#5b9bf8" />
            Inventra
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {!isInstalled && (
              <button
                className="mobile-install-btn"
                onClick={handleInstallClick}
                aria-label="Install App"
                title="Install Inventra App"
              >
                <Download size={14} />
                <span>Install</span>
              </button>
            )}
            <button
              className="mobile-hamburger"
              onClick={() => void logout().then(() => nav("/login"))}
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="page-main">
          <Outlet />
        </main>

        {/* Mobile Bottom Tab Bar */}
        <nav className="mobile-bottom-nav" aria-label="Main navigation">
          <div className="mobile-bottom-nav-inner">
            {mobileBottomTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.end
                ? location.pathname === tab.to
                : location.pathname.startsWith(tab.to);
              return (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  className={({ isActive }) => `mobile-tab-item${isActive ? " active" : ""}`}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
