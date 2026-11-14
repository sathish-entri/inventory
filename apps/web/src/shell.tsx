import { useState, useEffect, useMemo, useRef } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Modal } from "antd";
import { useAuth } from "./auth";
import { useTheme } from "./theme";
import {
  LayoutDashboard, Package, Warehouse, Archive, ArrowLeftRight,
  Users, FileText, ShoppingCart, Box, Truck, Receipt, DollarSign,
  RotateCcw, ShoppingBag, Download, FileCheck,
  Bell, Settings, UserCog, ClipboardList, Plug, LogOut, Boxes,
  BarChart3, RefreshCw, Menu, X, ChevronDown, ChevronRight,
  Search, Sun, Moon, Rocket, ExternalLink, ShieldCheck, Sparkles,
} from "lucide-react";

// Primary quick-access navigation matching the Oscar SaaS design
const primaryNav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/products", label: "Products", icon: Package },
  { to: "/inventory", label: "Inventory", icon: Archive },
  { to: "/sales-orders", label: "Sales Orders", icon: ShoppingCart },
  { to: "/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/vendors", label: "Vendors", icon: ShoppingBag },
  { to: "/invoices", label: "Billing", icon: Receipt },
  { to: "/payments", label: "Payments", icon: DollarSign },
  { to: "/reports", label: "Reports", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

// Complete categorized groups preserving 100% of routes
const allModules = [
  {
    title: "Overview",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
      { to: "/reports", label: "Analytics & Reports", icon: BarChart3 },
      { to: "/notifications", label: "Notifications", icon: Bell },
    ],
  },
  {
    title: "Inventory & Warehouses",
    items: [
      { to: "/products", label: "Products & Consumables", icon: Package },
      { to: "/warehouses", label: "Warehouses Hubs", icon: Warehouse },
      { to: "/inventory", label: "Physical Inventory", icon: Archive },
      { to: "/manufacturing", label: "Production & BOM Formula", icon: Boxes },
      { to: "/adjustments", label: "Stock Adjustments", icon: RefreshCw },
      { to: "/transfers", label: "Warehouse Transfers", icon: ArrowLeftRight },
    ],
  },
  {
    title: "Sales Operations",
    items: [
      { to: "/customers", label: "Customers Directory", icon: Users },
      { to: "/estimates", label: "Estimates & Quotes", icon: FileText },
      { to: "/sales-orders", label: "Sales Orders", icon: ShoppingCart },
      { to: "/packages", label: "Packaging & Boxes", icon: Box },
      { to: "/shipments", label: "Shipments & Logistics", icon: Truck },
      { to: "/invoices", label: "Invoices & Billing", icon: Receipt },
      { to: "/payments", label: "Payments Received", icon: DollarSign },
      { to: "/sales-returns", label: "Sales Returns", icon: RotateCcw },
    ],
  },
  {
    title: "Purchasing",
    items: [
      { to: "/vendors", label: "Vendors Directory", icon: ShoppingBag },
      { to: "/purchase-orders", label: "Purchase Orders", icon: ClipboardList },
      { to: "/receives", label: "Material Receives", icon: Download },
      { to: "/bills", label: "Vendor Bills", icon: FileCheck },
      { to: "/purchase-returns", label: "Purchase Returns", icon: RotateCcw },
    ],
  },
  {
    title: "Administration",
    items: [
      { to: "/users", label: "Users & Staff Roles", icon: UserCog },
      { to: "/audit", label: "Audit & Security Log", icon: ClipboardList },
      { to: "/integrations", label: "API Integrations", icon: Plug },
      { to: "/settings", label: "Company Settings", icon: Settings },
    ],
  },
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
  const { theme, toggleTheme, isDark } = useTheme();
  const nav = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAllModules, setShowAllModules] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Auto-close sidebar on navigation
  useEffect(() => {
    setSidebarOpen(false);
    setUserDropdownOpen(false);
  }, [location.pathname]);

  // Global Ctrl+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setSearchOpen(false);
        setUserDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
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
        title: "Install Oscar as an App",
        centered: true,
        content: (
          <div style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6 }}>
            <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              💻 Google Chrome / Microsoft Edge on PC:
            </p>
            <p style={{ color: "var(--text-secondary)", marginBottom: 12 }}>
              Look at your browser's address bar (top-right next to the bookmark star) and click the <strong>Install icon</strong> (🖥️ or 📥), or click the browser menu (<strong>⋮</strong>) and select <strong>"Install Oscar..."</strong>.
            </p>
            <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              📱 Android (Chrome):
            </p>
            <p style={{ color: "var(--text-secondary)", marginBottom: 12 }}>
              Tap the <strong>three dots (⋮)</strong> in Chrome and tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
            </p>
            <p style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
              🍏 iPhone / iPad (Safari):
            </p>
            <p style={{ color: "var(--text-secondary)" }}>
              Tap the <strong>Share</strong> button (square with arrow) at the bottom, then scroll down and tap <strong>"Add to Home Screen"</strong>.
            </p>
          </div>
        ),
      });
    }
  };

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName ?? ""}`.trim()
    : "Sathish C";

  const initials = user?.firstName
    ? `${user.firstName[0]}${user.lastName?.[0] ?? ""}`.toUpperCase()
    : "S";

  const closeSidebar = () => setSidebarOpen(false);

  // Quick navigation search items
  const searchableLinks = useMemo(() => {
    const list: { label: string; to: string; group: string }[] = [];
    allModules.forEach((g) => {
      g.items.forEach((it) => {
        list.push({ label: it.label, to: it.to, group: g.title });
      });
    });
    return list;
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return searchableLinks.slice(0, 8);
    const q = searchQuery.toLowerCase();
    return searchableLinks.filter(
      (item) => item.label.toLowerCase().includes(q) || item.group.toLowerCase().includes(q)
    );
  }, [searchQuery, searchableLinks]);

  return (
    <div className="app-layout">
      {/* ── Mobile Overlay ── */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* ── Dark Premium Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`} aria-label="Sidebar Navigation">
        {/* Brand Header */}
        <div className="sidebar-logo">
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 12,
                background: "linear-gradient(135deg, #5146E5 0%, #6366F1 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(81, 70, 229, 0.45)",
                flexShrink: 0,
              }}
            >
              <ShoppingCart size={20} color="#ffffff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "#ffffff",
                  letterSpacing: "-0.4px",
                  lineHeight: 1.2,
                }}
              >
                Oscar
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#94A3B8",
                  fontWeight: 500,
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                Inventory Operations
              </div>
            </div>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={closeSidebar}
            title="Close menu"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          {!showAllModules ? (
            <div style={{ padding: "8px 0" }}>
              {primaryNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
                    onClick={closeSidebar}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}

              <div style={{ padding: "8px 12px 0" }}>
                <button
                  type="button"
                  onClick={() => setShowAllModules(true)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px dashed rgba(255,255,255,0.12)",
                    borderRadius: 10,
                    color: "#94A3B8",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 150ms",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#94A3B8")}
                >
                  <span>More Operations (18 Modules)</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "4px 0" }}>
              <div style={{ padding: "0 14px 6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: 0.8 }}>All Operations</span>
                <button
                  type="button"
                  onClick={() => setShowAllModules(false)}
                  style={{ background: "none", border: "none", color: "#818CF8", fontSize: 11, fontWeight: 600, cursor: "pointer", padding: 0 }}
                >
                  ← Main Menu
                </button>
              </div>
              {allModules.map((g) => (
                <div key={g.title} style={{ marginBottom: 12 }}>
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
                        <Icon size={17} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {/* Upgrade to Pro Card Widget (Matching Mockup) */}
          <div style={{ padding: "14px 12px 6px" }}>
            <div
              style={{
                background: "linear-gradient(135deg, rgba(81, 70, 229, 0.22) 0%, rgba(99, 102, 241, 0.12) 100%)",
                border: "1px solid rgba(99, 102, 241, 0.28)",
                borderRadius: 14,
                padding: "16px 14px",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "linear-gradient(135deg, #818CF8, #4F46E5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(79, 70, 229, 0.4)",
                  }}
                >
                  <Rocket size={14} color="#ffffff" />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#ffffff" }}>
                  Upgrade to Pro
                </div>
              </div>
              <p style={{ margin: "0 0 12px", fontSize: 11, color: "#94A3B8", lineHeight: 1.4 }}>
                Get advanced analytics and more features.
              </p>
              <button
                type="button"
                onClick={() => nav("/reports")}
                style={{
                  width: "100%",
                  padding: "7px 12px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #5146E5 0%, #6366F1 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  boxShadow: "0 2px 8px rgba(81, 70, 229, 0.35)",
                }}
              >
                <span>Upgrade Now</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Sidebar Footer with User Profile */}
        <div className="sidebar-footer">
          {!isInstalled && (
            <button
              onClick={handleInstallClick}
              className="sidebar-install-btn"
              title="Install Oscar as App"
            >
              <Download size={15} />
              <span>Install App</span>
            </button>
          )}

          <div
            className="sidebar-user"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 8px",
              background: "rgba(255,255,255,0.04)",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#ffffff",
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#ffffff",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {displayName}
                </div>
                <div style={{ fontSize: 10, color: "#94A3B8" }}>
                  {user?.role ?? "Admin"}
                </div>
              </div>
            </div>

            <button
              onClick={() => void logout().then(() => nav("/login"))}
              title="Sign out"
              style={{
                background: "transparent",
                border: "none",
                color: "rgba(255,255,255,0.5)",
                cursor: "pointer",
                padding: 6,
                borderRadius: 8,
                display: "flex",
                transition: "color 150ms",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#EF4444")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main Workspace Content ── */}
      <div className="page-content">
        {/* Desktop Top Navigation Bar (Matching Mockup) */}
        <header className="desktop-topbar">
          <div className="desktop-topbar-inner">
            {/* Search Input Bar with Ctrl+K shortcut */}
            <div
              className="topbar-search-box"
              onClick={() => setSearchOpen(true)}
              role="button"
              tabIndex={0}
            >
              <Search size={16} className="topbar-search-icon" />
              <span className="topbar-search-placeholder">
                Search products, invoices, customers...
              </span>
              <kbd className="topbar-search-kbd">Ctrl + K</kbd>
            </div>

            {/* Right Quick Action Icons & Profile */}
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Install PWA Button */}
              {!isInstalled && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="topbar-action-btn"
                  title="Install Oscar Application"
                >
                  <Download size={17} />
                </button>
              )}

              {/* Notification Bell with Badge */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => nav("/notifications")}
                  className="topbar-action-btn"
                  title="View Notifications"
                >
                  <Bell size={18} />
                  <span className="topbar-badge">3</span>
                </button>
              </div>

              {/* Dark / Light Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="topbar-action-btn"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} />}
              </button>

              {/* User Avatar & Dropdown Pill */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen((p) => !p)}
                  className="topbar-user-pill"
                >
                  <div className="topbar-user-avatar">{initials}</div>
                  <span className="topbar-user-name">{displayName}</span>
                  <ChevronDown size={14} color="var(--text-muted)" />
                </button>

                {userDropdownOpen && (
                  <div
                    className="topbar-dropdown-menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)" }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{displayName}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{user?.email ?? "admin@oscar.com"}</div>
                    </div>
                    <button
                      type="button"
                      className="topbar-dropdown-item"
                      onClick={() => { setUserDropdownOpen(false); nav("/settings"); }}
                    >
                      <Settings size={15} /> Company Settings
                    </button>
                    <button
                      type="button"
                      className="topbar-dropdown-item"
                      onClick={() => { setUserDropdownOpen(false); nav("/users"); }}
                    >
                      <UserCog size={15} /> User & Permissions
                    </button>
                    <button
                      type="button"
                      className="topbar-dropdown-item"
                      style={{ color: "var(--danger)" }}
                      onClick={() => void logout().then(() => nav("/login"))}
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Header */}
        <header className="mobile-topbar">
          <button
            className="mobile-hamburger"
            onClick={() => setSidebarOpen((prev) => !prev)}
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          >
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <div className="mobile-topbar-logo">
            <ShoppingCart size={19} color="#5146E5" />
            <span>Oscar</span>
            {user?.organization?.name && (
              <span className="mobile-topbar-org">{user.organization.name}</span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              type="button"
              onClick={toggleTheme}
              className="topbar-action-btn"
              style={{ width: 34, height: 34 }}
              title="Toggle Theme"
            >
              {isDark ? <Sun size={16} color="#F59E0B" /> : <Moon size={16} />}
            </button>
            <button
              className="mobile-hamburger"
              onClick={() => void logout().then(() => nav("/login"))}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page Content Outlet */}
        <main className="page-main">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation Tabs */}
        <nav className="mobile-bottom-nav" aria-label="Main navigation">
          <div className="mobile-bottom-nav-inner">
            <NavLink
              to="/"
              end
              className={({ isActive }) => `mobile-tab-item${isActive ? " active" : ""}`}
            >
              <LayoutDashboard size={20} />
              <span>Home</span>
            </NavLink>

            <NavLink
              to="/sales-orders"
              className={({ isActive }) => `mobile-tab-item${isActive ? " active" : ""}`}
            >
              <ShoppingCart size={20} />
              <span>Sales</span>
            </NavLink>

            <NavLink
              to="/invoices"
              className={({ isActive }) => `mobile-tab-item${isActive ? " active" : ""}`}
            >
              <Receipt size={20} />
              <span>Billing</span>
            </NavLink>

            <NavLink
              to="/products"
              className={({ isActive }) => `mobile-tab-item${isActive ? " active" : ""}`}
            >
              <Package size={20} />
              <span>Stock</span>
            </NavLink>

            <button
              type="button"
              className={`mobile-tab-item${sidebarOpen ? " active" : ""}`}
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle full menu"
            >
              <Menu size={20} />
              <span>Menu</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Global Quick Search Modal (Ctrl + K) */}
      {searchOpen && (
        <div
          className="search-modal-backdrop"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="search-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-modal-header">
              <Search size={18} color="var(--primary)" />
              <input
                type="text"
                autoFocus
                placeholder="Type to search modules, products, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-modal-input"
              />
              <button
                type="button"
                className="search-modal-close"
                onClick={() => setSearchOpen(false)}
              >
                Esc
              </button>
            </div>

            <div className="search-modal-results">
              <div style={{ padding: "8px 12px 4px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                Quick Jump
              </div>
              {searchResults.length === 0 ? (
                <div style={{ padding: "24px 12px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                  No matches found for "{searchQuery}".
                </div>
              ) : (
                searchResults.map((it) => (
                  <div
                    key={it.to}
                    className="search-modal-item"
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery("");
                      nav(it.to);
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="search-modal-pill">{it.group}</span>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{it.label}</span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{it.to}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
