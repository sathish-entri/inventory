/**
 * Inventra – Premium Business UI
 * All page components for the Inventra inventory management system.
 * Senior-grade implementation with full CRUD, status badges, modals,
 * search/filter, and rich data display.
 */

import {
  type FormEvent,
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Area, AreaChart, CartesianGrid, Bar, BarChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend,
} from "recharts";
import api from "./api";
import { useAuth } from "./auth";
import {
  Search, X, Plus, Check, AlertTriangle,
  TrendingUp, TrendingDown, Package, DollarSign, ShoppingCart,
  Users, BarChart3, AlertCircle, Inbox,
  CheckCircle, XCircle, Clock, Truck, Download,
  RefreshCw, ChevronRight,
  FileText, CreditCard, Boxes, FileCheck,
  Building2, UserCog, ClipboardList,
  Archive, ArrowLeftRight, Box, Receipt, RotateCcw,
  Trash2, GripVertical, Kanban, List, Sparkles, Calculator, Printer, Filter, MapPin, Compass, Navigation, Map,
} from "lucide-react";

// ─────────────────────────────────────────────────────────
// TOAST SYSTEM
// ─────────────────────────────────────────────────────────
type Toast = { id: number; msg: string; type: "success" | "error" | "warn" };
type ToastCtx = { toast: (msg: string, type?: Toast["type"]) => void };
const ToastContext = createContext<ToastCtx>({ toast: () => undefined });

export function useToast() { return useContext(ToastContext); }

function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const id = useRef(0);

  const toast = useCallback((msg: string, type: Toast["type"] = "success") => {
    const t: Toast = { id: ++id.current, msg, type };
    setToasts((p) => [...p, t]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== t.id)), 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            {t.type === "success" && <CheckCircle size={16} />}
            {t.type === "error" && <XCircle size={16} />}
            {t.type === "warn" && <AlertTriangle size={16} />}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────
// GUARD
// ─────────────────────────────────────────────────────────
export function Guard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ width: 32, height: 32, color: "#1565d8" }} />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return <ToastProvider>{children}</ToastProvider>;
}

// ─────────────────────────────────────────────────────────
// AUTH PAGES
// ─────────────────────────────────────────────────────────
export function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@demo.local");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      nav("/");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <div className="auth-panel-left">
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <Boxes size={36} color="#5b9bf8" />
            <span style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>Inventra</span>
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: "#fff", lineHeight: 1.2, marginBottom: 16 }}>
            Complete Inventory<br />Management System
          </h2>
          <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 15, lineHeight: 1.7 }}>
            Track products, manage warehouses, handle sales &amp; purchases,
            and get real-time insights — all in one place.
          </p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {["Multi-warehouse inventory tracking", "Sales & purchase order management", "Invoice & payment processing", "Real-time reports & analytics"].map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.75)", fontSize: 14 }}>
              <CheckCircle size={16} color="#5b9bf8" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-panel-right">
        <div className="auth-card">
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Sign in</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: 28, fontSize: 14 }}>
            Welcome back! Enter your credentials to continue.
          </p>
          <form onSubmit={(e) => void onSubmit(e)} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {error && (
              <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}
            <InputGroup label="Email address">
              <input className="input-field" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </InputGroup>
            <InputGroup label="Password">
              <input className="input-field" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </InputGroup>
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "11px 16px", fontSize: 14, marginTop: 4 }} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
              {loading ? "Signing in…" : "Sign in"}
            </button>
            <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
              New organization?{" "}
              <a href="/register" style={{ color: "var(--accent)", fontWeight: 600 }}>Create one →</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({ organizationName: "", firstName: "", lastName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try { await register(form); nav("/"); }
    finally { setLoading(false); }
  }

  const fields: { key: keyof typeof form; label: string; type?: string }[] = [
    { key: "organizationName", label: "Organization name" },
    { key: "firstName", label: "First name" },
    { key: "lastName", label: "Last name" },
    { key: "email", label: "Email address", type: "email" },
    { key: "password", label: "Password", type: "password" },
  ];

  return (
    <div className="auth-page">
      <div className="auth-panel-left">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <Boxes size={36} color="#5b9bf8" />
          <span style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>Inventra</span>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>
          Start your free<br />trial today
        </h2>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, lineHeight: 1.7, marginTop: 12 }}>
          Set up your organization and start managing your inventory in minutes.
        </p>
      </div>
      <div className="auth-panel-right">
        <div className="auth-card">
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Create your organization</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 13 }}>Fill in the details to get started.</p>
          <form onSubmit={(e) => void onSubmit(e)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {fields.map(({ key, label, type }) => (
              <InputGroup key={key} label={label}>
                <input
                  className="input-field"
                  type={type ?? "text"}
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required
                />
              </InputGroup>
            ))}
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", padding: "11px 16px", fontSize: 14, marginTop: 4 }} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : null}
              {loading ? "Creating…" : "Create account"}
            </button>
            <p style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
              Already have an account? <a href="/login" style={{ color: "var(--accent)", fontWeight: 600 }}>Sign in</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SHARED HELPERS
// ─────────────────────────────────────────────────────────
function money(n: number | string | null | undefined) {
  const val = parseFloat(String(n ?? 0)) || 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

function InputGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="input-group">
      <label className="input-label">{label}</label>
      {children}
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const s = status?.toLowerCase() ?? "draft";
  const map: Record<string, string> = {
    draft: "badge-draft", pending: "badge-pending", confirmed: "badge-confirmed",
    shipped: "badge-shipped", paid: "badge-paid", partial: "badge-partial",
    cancelled: "badge-cancelled", open: "badge-open", received: "badge-received",
    billed: "badge-billed", active: "badge-active", inactive: "badge-inactive",
    issued: "badge-confirmed", void: "badge-cancelled",
  };
  return <span className={`badge ${map[s] ?? "badge-draft"}`}>{status}</span>;
}

function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p style={{ color: "var(--text-muted)", fontSize: 13, marginTop: 2 }}>{subtitle}</p>}
      </div>
      {children && <div className="page-header-actions">{children}</div>}
    </div>
  );
}

type ModalProps = { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean };
function Modal({ open, onClose, title, children, footer, wide }: ModalProps) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: wide ? 760 : 560 }}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button onClick={onClose} className="btn btn-ghost btn-icon" style={{ marginLeft: "auto" }}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// REUSABLE SEARCHABLE SELECT DROPDOWN
// ─────────────────────────────────────────────────────────
type SelectOption = { value: string; label: string; sublabel?: string };
type SearchableSelectProps = {
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
};
export function SearchableSelect({ options, value, onChange, placeholder = "Select option..." }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const selectedOpt = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = search
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          (o.sublabel && o.sublabel.toLowerCase().includes(search.toLowerCase()))
      )
    : options;

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <div
        className="input-field"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          background: "#fff",
        }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ color: selectedOpt ? "var(--text-primary)" : "var(--text-muted)" }}>
          {selectedOpt ? selectedOpt.label : placeholder}
        </span>
        <ChevronRight size={14} style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            marginTop: 4,
            background: "#fff",
            border: "1px solid var(--border)",
            borderRadius: 8,
            boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
            zIndex: 9999,
            maxHeight: 220,
            overflowY: "auto",
            padding: 6,
          }}
        >
          <div style={{ padding: 4, marginBottom: 4 }}>
            <input
              type="text"
              className="input-field"
              style={{ fontSize: 12, padding: "6px 10px" }}
              placeholder="Type to search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
              No matches found
            </div>
          ) : (
            filtered.map((opt) => (
              <div
                key={opt.value}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  cursor: "pointer",
                  fontSize: 13,
                  background: opt.value === value ? "#f1f5f9" : "transparent",
                  fontWeight: opt.value === value ? 600 : 400,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <span>{opt.label}</span>
                {opt.sublabel && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{opt.sublabel}</span>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// REUSABLE NUMBER STEPPER (QUANTITY INPUT)
// ─────────────────────────────────────────────────────────
type NumberStepperProps = {
  value: number | string;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  style?: React.CSSProperties;
};
export function NumberStepper({ value, onChange, min = 0, max, step = 1, style }: NumberStepperProps) {
  const current = Number(value || 0);

  const dec = () => {
    const next = current - step;
    if (min !== undefined && next < min) return;
    onChange(next);
  };

  const inc = () => {
    const next = current + step;
    if (max !== undefined && next > max) return;
    onChange(next);
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", background: "#fff", ...style }}>
      <button
        type="button"
        style={{ border: "none", background: "#f8fafc", padding: "6px 10px", cursor: "pointer", fontSize: 14, fontWeight: 700, borderRight: "1px solid var(--border)", color: "var(--text-secondary)" }}
        onClick={dec}
      >
        -
      </button>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: 60, border: "none", textAlign: "center", fontSize: 13, fontWeight: 600, padding: "4px 0" }}
        min={min}
        max={max}
      />
      <button
        type="button"
        style={{ border: "none", background: "#f8fafc", padding: "6px 10px", cursor: "pointer", fontSize: 14, fontWeight: 700, borderLeft: "1px solid var(--border)", color: "var(--text-secondary)" }}
        onClick={inc}
      >
        +
      </button>
    </div>
  );
}

type FilterOption = { label: string; value: string };
type Column<T> = { label: string; key?: keyof T; render?: (row: T) => ReactNode; align?: "left" | "right" | "center" };
type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: unknown;
  searchFields?: (keyof T)[];
  filterKey?: keyof T;
  filterOptions?: FilterOption[];
  emptyIcon?: ReactNode;
  emptyText?: string;
  onRowClick?: (row: T) => void;
};

function DataTable<T extends Record<string, unknown>>({
  columns, data = [], loading, error, searchFields, filterKey, filterOptions, emptyIcon, emptyText, onRowClick,
}: DataTableProps<T>) {
  const [q, setQ] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");

  // Auto-detect filterKey if not provided (e.g. status, type, role)
  const autoFilterKey = filterKey ?? (data.length > 0 && "status" in data[0] ? ("status" as keyof T) : data.length > 0 && "type" in data[0] ? ("type" as keyof T) : undefined);

  // Compute available filter dropdown options
  const computedFilterOptions: FilterOption[] = useMemo(() => {
    if (filterOptions) return filterOptions;
    if (!autoFilterKey) return [];
    const uniqueVals = Array.from(new Set(data.map((r) => String(r[autoFilterKey] ?? "")).filter(Boolean)));
    if (uniqueVals.length <= 1) return [];
    return [
      { label: "All Records", value: "ALL" },
      ...uniqueVals.map((v) => ({ label: v.replace(/_/g, " "), value: v })),
    ];
  }, [data, autoFilterKey, filterOptions]);

  const filtered = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter((r) => {
      const matchesSearch = !q || !searchFields ? true : searchFields.some((f) => String(r[f] ?? "").toLowerCase().includes(q.toLowerCase()));
      const matchesFilter = selectedFilter === "ALL" || !autoFilterKey ? true : String(r[autoFilterKey] ?? "") === selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }, [data, q, searchFields, selectedFilter, autoFilterKey]);

  if (loading)
    return (
      <div style={{ padding: "60px 0", textAlign: "center" }}>
        <div className="spinner" style={{ width: 32, height: 32, margin: "0 auto 12px", color: "var(--accent)" }} />
        <div style={{ color: "var(--text-muted)", fontSize: 13, fontWeight: 500 }}>Loading records…</div>
      </div>
    );

  if (error)
    return (
      <div style={{ padding: "24px", background: "#fee2e2", borderRadius: 12, border: "1px solid #fca5a5", color: "#991b1b", textAlign: "center" }}>
        <AlertCircle size={28} style={{ margin: "0 auto 8px" }} />
        <div style={{ fontWeight: 600, fontSize: 14 }}>Could not load data. Please refresh the page.</div>
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Sleek Filter & View Control Bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, background: "#ffffff", padding: "12px 16px",
        borderRadius: 12, border: "1px solid var(--border)", flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 240 }}>
          {searchFields && (
            <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
              <input
                type="text"
                placeholder="Search records…"
                className="input-field"
                style={{ paddingLeft: 34, fontSize: 13 }}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          )}

          {/* Filter Dropdown Option */}
          {computedFilterOptions.length > 0 && (
            <div style={{ position: "relative" }}>
              <select
                className="input-field"
                style={{ fontSize: 12, fontWeight: 600, cursor: "pointer", paddingRight: 28 }}
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
              >
                {computedFilterOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", background: "#f1f5f9", padding: "4px 10px", borderRadius: 8 }}>
            {filtered.length} record{filtered.length !== 1 ? "s" : ""}
          </span>
          <div style={{ display: "flex", background: "#f1f5f9", padding: 3, borderRadius: 8, gap: 2 }}>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === "table" ? "btn-primary" : "btn-ghost"}`}
              style={{ fontSize: 12, padding: "4px 10px" }}
              onClick={() => setViewMode("table")}
              title="Table View"
            >
              <List size={14} /> Table
            </button>
            <button
              type="button"
              className={`btn btn-sm ${viewMode === "grid" ? "btn-primary" : "btn-ghost"}`}
              style={{ fontSize: 12, padding: "4px 10px" }}
              onClick={() => setViewMode("grid")}
              title="Grid View"
            >
              <Boxes size={14} /> Grid
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state" style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: "48px 20px" }}>
          <div className="empty-state-icon">{emptyIcon ?? <Package size={44} />}</div>
          <div className="empty-state-title">{emptyText ?? "No records found"}</div>
          <div className="empty-state-desc">
            {q ? "Try adjusting your search query." : "No entries available yet."}
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid-view">
          {filtered.map((row, i) => {
            const firstCol = columns[0];
            const secondCol = columns[1];
            const otherCols = columns.slice(2);

            return (
              <div
                key={i}
                className="grid-card"
                style={{ cursor: onRowClick ? "pointer" : "default" }}
                onClick={() => onRowClick?.(row)}
              >
                <div className="grid-card-header">
                  <div>
                    <div className="grid-card-title">
                      {firstCol?.render ? firstCol.render(row) : String(row[firstCol?.key as keyof T] ?? "—")}
                    </div>
                    {secondCol && (
                      <div className="grid-card-sub">
                        {secondCol.render ? secondCol.render(row) : String(row[secondCol.key as keyof T] ?? "—")}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid-card-body">
                  {otherCols.map((c) => (
                    <div key={c.label} className="grid-card-row" style={{ justifyContent: "space-between" }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase" }}>
                        {c.label}:
                      </span>
                      <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                        {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "—")}
                      </span>
                    </div>
                  ))}
                </div>

                {onRowClick && (
                  <div className="grid-card-footer">
                    <span style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)" }}>View details</span>
                    <ChevronRight size={14} color="var(--accent)" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="data-table-wrap" style={{ background: "#fff", borderRadius: 12, border: "1px solid var(--border)" }}>
          <table className="data-table">
            <thead>
              <tr>
                {columns.map((c) => (
                  <th key={c.label} style={{ textAlign: c.align ?? "left" }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row, i) => (
                <tr
                  key={i}
                  style={{ cursor: onRowClick ? "pointer" : "default" }}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((c) => (
                    <td key={c.label} style={{ textAlign: c.align ?? "left" }}>
                      {c.render ? c.render(row) : String(row[c.key as keyof T] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function useList<T>(key: string, path: string) {
  return useQuery({
    queryKey: [key],
    queryFn: async () => {
      const { data } = await api.get(path);
      return (Array.isArray(data) ? data : data.data) as T[];
    },
  });
}

function MetricCard({
  label, value, icon: Icon, color, trend,
}: { label: string; value: string | number; icon: React.ElementType; color: string; trend?: { pct: number; label: string } }) {
  const up = (trend?.pct ?? 0) >= 0;
  return (
    <div className="metric-card">
      <div className="metric-icon" style={{ background: color + "18" }}>
        <Icon size={20} color={color} />
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value}</div>
      {trend && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
          {up ? <TrendingUp size={12} color="var(--success)" /> : <TrendingDown size={12} color="var(--danger)" />}
          <span style={{ fontSize: 11, color: up ? "var(--success)" : "var(--danger)", fontWeight: 600 }}>
            {up ? "+" : ""}{trend.pct}%
          </span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{trend.label}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────
export function DashboardPage() {
  const [warehouseId, setWarehouseId] = useState<string>("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", warehouseId],
    queryFn: async () => {
      const url = warehouseId ? `/dashboard?warehouseId=${warehouseId}` : "/dashboard";
      return (await api.get(url)).data;
    },
  });

  if (isLoading)
    return (
      <div style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <div className="spinner" style={{ width: 36, height: 36, color: "var(--accent)" }} />
      </div>
    );
  if (error)
    return (
      <div className="empty-state" style={{ paddingTop: 80 }}>
        <AlertCircle size={40} color="var(--danger)" />
        <div className="empty-state-title">Dashboard failed to load</div>
      </div>
    );

  const warehouses: { id: string; name: string }[] = data.warehouses ?? [];
  const activeWarehouse = warehouses.find((w) => w.id === warehouseId);

  const COLORS = ["#1565d8", "#16a34a", "#d97706", "#7c3aed", "#ef4444"];

  // Billing pie: collected vs outstanding
  const billingPie = [
    { name: "Collected", value: data.totalCollected ?? 0 },
    { name: "Outstanding", value: data.receivables ?? 0 },
  ].filter((d) => d.value > 0);

  // Payables pie
  const payablesPie = [
    { name: "Bills Paid", value: data.totalBillsPaid ?? 0 },
    { name: "Payables", value: data.payables ?? 0 },
  ].filter((d) => d.value > 0);

  const topItems: { name: string; revenue: number; qty: number }[] = data.topItems ?? [];
  const salesTrend: { name: string; total: number; customer: string; date: string; status: string }[] = data.salesTrend ?? [];
  const recentPayments: { customer: string; amount: number; method: string; date: string }[] = data.recentPayments ?? [];
  const lowStockItems: { name: string; available: number; reorderLevel: number }[] = data.lowStockItems ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Header with Warehouse Filter ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            {activeWarehouse ? `📦 ${activeWarehouse.name} — Analytics` : "📊 Business Dashboard"}
          </h1>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            {activeWarehouse && <span style={{ marginLeft: 8, color: "var(--accent)", fontWeight: 600 }}>• Warehouse View</span>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", whiteSpace: "nowrap" }}>View by Warehouse:</label>
          <select
            className="input-field"
            style={{ width: 200, fontSize: 13 }}
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Row 1: Key Business Metrics ── */}
      <div className="analytics-kpi-grid">
        <MetricCard label="Total Sales Revenue" value={money(data.totalSales)} icon={TrendingUp} color="#1565d8" />
        <MetricCard label="Total Collected (Payments)" value={money(data.totalCollected ?? 0)} icon={CheckCircle} color="#16a34a" />
        <MetricCard label="Receivables (Pending)" value={money(data.receivables)} icon={DollarSign} color="#d97706" />
        <MetricCard label="Total Purchases" value={money(data.totalPurchases)} icon={ShoppingCart} color="#7c3aed" />
        <MetricCard label="Bills Payable (Pending)" value={money(data.payables)} icon={CreditCard} color="#dc2626" />
        <MetricCard label="Inventory Value" value={money(data.inventoryValue)} icon={Boxes} color="#0891b2" />
        <MetricCard label="Stock Units (in Warehouse)" value={`${(data.totalStockUnits ?? 0).toLocaleString()} units`} icon={Archive} color="#7c3aed" />
        <MetricCard label="Low Stock Items" value={`${data.lowStock ?? 0} items`} icon={AlertTriangle} color="#ef4444" />
      </div>

      {/* ── Row 2: Billing KPIs ── */}
      <div className="analytics-kpi-grid">
        {[
          { label: "Total Invoices Raised", value: data.totalInvoices ?? 0, sub: "Customer invoices", color: "#1565d8", icon: FileText },
          { label: "Unpaid Invoices", value: data.unpaidInvoices ?? 0, sub: "Awaiting payment", color: "#d97706", icon: Clock },
          { label: "Overdue Invoices", value: data.overdueInvoices ?? 0, sub: "Past due date", color: "#dc2626", icon: AlertCircle },
          { label: "Vendor Bills Open", value: data.unpaidBills ?? 0, sub: "Bills to pay", color: "#7c3aed", icon: ClipboardList },
        ].map((m) => (
          <div key={m.label} className="card" style={{ padding: "16px 20px", borderLeft: `4px solid ${m.color}`, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: m.value > 0 ? m.color : "var(--text-primary)", marginTop: 4 }}>{m.value}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{m.sub}</div>
              </div>
              <div style={{ background: m.color + "18", borderRadius: 10, padding: 10, flexShrink: 0 }}>
                <m.icon size={20} color={m.color} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 3: Sales Trend + Billing Breakdown ── */}
      <div className="analytics-row-split">
        {/* Sales Trend Area Chart */}
        <div className="card" style={{ minWidth: 0 }}>
          <div className="card-header">
            <span style={{ fontWeight: 600, fontSize: 14 }}>📈 Sales Order Trend</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Recent 10 orders</span>
          </div>
          <div className="card-body chart-card-body">
            {salesTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={salesTrend} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1565d8" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#1565d8" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    formatter={(v: any) => [money(Number(v || 0)), "Order Value"]}
                    labelFormatter={(label) => `Order: ${label}`}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#1565d8" strokeWidth={2.5} fill="url(#gradSales)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state" style={{ padding: "40px 0" }}>
                <BarChart3 size={36} style={{ opacity: 0.3 }} />
                <div className="empty-state-desc">No sales orders yet</div>
              </div>
            )}
          </div>
        </div>

        {/* Customer Receivables Pie */}
        <div className="card" style={{ minWidth: 0 }}>
          <div className="card-header">
            <span style={{ fontWeight: 600, fontSize: 14 }}>💰 Collections Overview</span>
          </div>
          <div className="card-body chart-card-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {billingPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={billingPie} cx="50%" cy="50%" innerRadius={48} outerRadius={70} paddingAngle={3} dataKey="value">
                    {billingPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => money(Number(v || 0))} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12, padding: "20px 0" }}>No billing data yet</div>
            )}
            {/* Quick stats */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>Collected</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#16a34a" }}>{money(data.totalCollected ?? 0)}</div>
              </div>
              <div style={{ background: "#fff7ed", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#d97706", textTransform: "uppercase" }}>Outstanding</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#d97706" }}>{money(data.receivables ?? 0)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 4: Top Products + Inventory Health ── */}
      <div className="analytics-grid-2">
        {/* Top Selling Products */}
        <div className="card" style={{ minWidth: 0 }}>
          <div className="card-header">
            <span style={{ fontWeight: 600, fontSize: 14 }}>🏆 Top Selling Items</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>By revenue</span>
          </div>
          <div className="card-body chart-card-body" style={{ padding: 0 }}>
            {topItems.length > 0 ? (
              <>
                <div style={{ padding: "0 16px 8px", minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={topItems} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e8edf3" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#94a3b8" }} />
                      <YAxis tick={{ fontSize: 9, fill: "#94a3b8" }} tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => [money(Number(v || 0)), "Revenue"]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="revenue" fill="#1565d8" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="data-table-wrap" style={{ border: "none", borderRadius: 0, borderTop: "1px solid var(--border)" }}>
                  <table className="data-table">
                    <thead><tr><th>Item</th><th style={{ textAlign: "right" }}>Revenue</th><th style={{ textAlign: "right" }}>Qty Sold</th></tr></thead>
                    <tbody>
                      {topItems.map((item, i) => (
                        <tr key={i}>
                          <td><span style={{ fontWeight: 600 }}>#{i + 1}</span> {item.name}</td>
                          <td style={{ textAlign: "right" }}><strong style={{ color: "var(--accent)" }}>{money(item.revenue)}</strong></td>
                          <td style={{ textAlign: "right" }}>{item.qty.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="empty-state" style={{ padding: "40px 0" }}>
                <Package size={36} style={{ opacity: 0.3 }} />
                <div className="empty-state-desc">No sales data yet</div>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Health */}
        <div className="card" style={{ minWidth: 0 }}>
          <div className="card-header">
            <span style={{ fontWeight: 600, fontSize: 14 }}>🔴 Low Stock Alerts</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{warehouseId ? activeWarehouse?.name : "All Warehouses"}</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {lowStockItems.length > 0 ? (
              <div className="data-table-wrap" style={{ border: "none", borderRadius: 0 }}>
                <table className="data-table">
                  <thead><tr><th>Item</th><th style={{ textAlign: "right" }}>Available</th><th style={{ textAlign: "right" }}>Reorder At</th><th>Status</th></tr></thead>
                  <tbody>
                    {lowStockItems.map((item, i) => {
                      const critical = item.available <= 0;
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{item.name}</td>
                          <td style={{ textAlign: "right", color: critical ? "var(--danger)" : "#d97706", fontWeight: 700 }}>{item.available}</td>
                          <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{item.reorderLevel}</td>
                          <td>
                            <span style={{
                              background: critical ? "#fef2f2" : "#fff7ed",
                              color: critical ? "#dc2626" : "#d97706",
                              padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700
                            }}>
                              {critical ? "OUT OF STOCK" : "LOW STOCK"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "40px 0" }}>
                <CheckCircle size={36} color="var(--success)" style={{ opacity: 0.6 }} />
                <div className="empty-state-title" style={{ fontSize: 14 }}>All items well-stocked!</div>
                <div className="empty-state-desc">No reorder alerts for {warehouseId ? activeWarehouse?.name : "any warehouse"}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 5: Recent Payments (Cash Flow) + Recent Orders ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Cash Flow — Recent Payments */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 600, fontSize: 14 }}>💳 Recent Payments Received</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentPayments.length > 0 ? (
              <div className="data-table-wrap" style={{ border: "none", borderRadius: 0 }}>
                <table className="data-table">
                  <thead><tr><th>Customer</th><th style={{ textAlign: "right" }}>Amount</th><th>Method</th><th>Date</th></tr></thead>
                  <tbody>
                    {recentPayments.map((p, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{p.customer}</td>
                        <td style={{ textAlign: "right" }}><strong style={{ color: "var(--success)" }}>{money(p.amount)}</strong></td>
                        <td><span className="badge badge-confirmed">{p.method}</span></td>
                        <td style={{ color: "var(--text-muted)", fontSize: 12 }}>{p.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "40px 0" }}>
                <DollarSign size={36} style={{ opacity: 0.3 }} />
                <div className="empty-state-desc">No payments received yet</div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales Orders */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 600, fontSize: 14 }}>🛒 Recent Sales Orders</span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {salesTrend.length > 0 ? (
              <div className="data-table-wrap" style={{ border: "none", borderRadius: 0 }}>
                <table className="data-table">
                  <thead><tr><th>Order #</th><th>Customer</th><th style={{ textAlign: "right" }}>Amount</th><th>Status</th></tr></thead>
                  <tbody>
                    {salesTrend.map((o, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{o.name}</td>
                        <td style={{ color: "var(--text-muted)" }}>{o.customer}</td>
                        <td style={{ textAlign: "right" }}><strong>{money(o.total)}</strong></td>
                        <td><Badge status={o.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: "40px 0" }}>
                <ClipboardList size={36} style={{ opacity: 0.3 }} />
                <div className="empty-state-desc">No sales orders yet</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Low Stock Banner ── */}
      {(data.lowStock ?? 0) > 0 && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: "14px 18px", display: "flex", alignItems: "center", gap: 12 }}>
          <AlertTriangle size={18} color="#d97706" />
          <span style={{ fontSize: 13, color: "#92400e" }}>
            <strong>{data.lowStock} item{data.lowStock !== 1 ? "s" : ""}</strong> {warehouseId ? `in ${activeWarehouse?.name}` : "across warehouses"} are running low. Reorder soon!
          </span>
          <a href="/reports" style={{ marginLeft: "auto", color: "var(--accent)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            View full report <ChevronRight size={14} />
          </a>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PRODUCTS PAGE
// ─────────────────────────────────────────────────────────
type Product = { id: string; name: string; sku: string; sellingPrice: string; costPrice: string; type: string; reorderLevel: string };

export function ProductsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const products = useList<Product>("products", "/products");
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [form, setForm] = useState({ name: "", sku: "", sellingPrice: "0", costPrice: "0", reorderLevel: "5", description: "" });
  const [jsonInput, setJsonInput] = useState("");
  const f = (k: string) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  const create = useMutation({
    mutationFn: () => api.post("/products", { ...form, sellingPrice: Number(form.sellingPrice), costPrice: Number(form.costPrice), reorderLevel: Number(form.reorderLevel) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setOpen(false); setForm({ name: "", sku: "", sellingPrice: "0", costPrice: "0", reorderLevel: "5", description: "" }); toast("Item created successfully"); },
    onError: () => toast("Could not create item. SKU may already exist.", "error"),
  });

  const bulkCreate = useMutation({
    mutationFn: (items: any[]) => api.post("/products/bulk", items),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setBulkOpen(false);
      setJsonInput("");
      toast(`Bulk products created! Added ${res.data?.count ?? 0} items.`);
    },
    onError: (err: any) => toast(err.response?.data?.message ?? "Bulk product creation failed. Check JSON.", "error"),
  });

  const handleBulkSubmit = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      const items = Array.isArray(parsed) ? parsed : (parsed.items ?? []);
      if (!Array.isArray(items) || items.length === 0) {
        toast("JSON must contain an array of product objects.", "error");
        return;
      }
      bulkCreate.mutate(items);
    } catch (e) {
      toast("Invalid JSON format. Please check syntax.", "error");
    }
  };

  const downloadSamplePayload = () => {
    const sample = [
      {
        name: "Wireless Keyboard",
        sku: "KB-101",
        sellingPrice: 1500,
        costPrice: 900,
        taxRate: 18,
        description: "Ergonomic wireless 2.4GHz keyboard"
      },
      {
        name: "Optical Mouse",
        sku: "MS-202",
        sellingPrice: 800,
        costPrice: 450,
        taxRate: 18,
        description: "High precision optical mouse"
      }
    ];

    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_products_payload.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Sample Product JSON payload downloaded!");
  };

  const columns: Column<Product>[] = [
    { label: "Item Name", render: (r) => <span style={{ fontWeight: 600 }}>{r.name}</span> },
    { label: "SKU", render: (r) => <span className="font-mono" style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>{r.sku}</span> },
    { label: "Type", render: (r) => <Badge status={r.type ?? "GOODS"} /> },
    { label: "Selling Price", key: "sellingPrice", align: "right", render: (r) => <strong>{money(Number(r.sellingPrice))}</strong> },
    { label: "Cost Price", key: "costPrice", align: "right", render: (r) => money(Number(r.costPrice)) },
    { label: "Reorder Lvl", key: "reorderLevel", align: "right" },
  ];

  return (
    <div>
      <PageHeader title="Products Catalog" subtitle="Manage your items catalog & bulk product creation">
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setBulkOpen(true)}>
            <Download size={15} /> Bulk Upload Products
          </button>
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={15} /> New Item
          </button>
        </div>
      </PageHeader>
      <div className="card">
        <DataTable
          columns={columns}
          data={products.data ?? []}
          loading={products.isLoading}
          error={products.error}
          searchFields={["name", "sku"]}
          emptyIcon={<Package size={48} />}
          emptyText="No items yet"
        />
      </div>

      {/* Single Item Creation Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="New Item"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Plus size={14} />}
              Create Item
            </button>
          </>
        }
      >
        <div className="form-grid form-grid-2">
          <InputGroup label="Item Name *">
            <input className="input-field" value={form.name} onChange={(e) => f("name")(e.target.value)} required />
          </InputGroup>
          <InputGroup label="SKU *">
            <input className="input-field" value={form.sku} onChange={(e) => f("sku")(e.target.value)} required />
          </InputGroup>
          <InputGroup label="Selling Price (₹)">
            <input className="input-field" type="number" min="0" value={form.sellingPrice} onChange={(e) => f("sellingPrice")(e.target.value)} />
          </InputGroup>
          <InputGroup label="Cost Price (₹)">
            <input className="input-field" type="number" min="0" value={form.costPrice} onChange={(e) => f("costPrice")(e.target.value)} />
          </InputGroup>
          <InputGroup label="Reorder Level">
            <input className="input-field" type="number" min="0" value={form.reorderLevel} onChange={(e) => f("reorderLevel")(e.target.value)} />
          </InputGroup>
          <InputGroup label="Description">
            <input className="input-field" value={form.description} onChange={(e) => f("description")(e.target.value)} />
          </InputGroup>
        </div>
        {create.isError && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 12 }}>Failed to create. SKU may already exist.</p>}
      </Modal>

      {/* Bulk Upload Products Modal */}
      <Modal open={bulkOpen} onClose={() => setBulkOpen(false)} title="Bulk Create Products (JSON)"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setBulkOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={bulkCreate.isPending || !jsonInput.trim()} onClick={handleBulkSubmit}>
              {bulkCreate.isPending && <span className="spinner" style={{ width: 14, height: 14 }} />} Create Products in Bulk
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Paste your array of Product objects below or download sample JSON:
            </span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={downloadSamplePayload}>
              <Download size={13} /> Sample Payload
            </button>
          </div>

          <textarea
            className="input-field font-mono"
            style={{ width: "100%", height: 180, fontSize: 12, padding: 10 }}
            placeholder={`[\n  {\n    "name": "Wireless Keyboard",\n    "sku": "KB-101",\n    "sellingPrice": 1500,\n    "costPrice": 900,\n    "taxRate": 18\n  }\n]`}
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
          />

          <div style={{ fontSize: 11, color: "var(--text-muted)", background: "#f8fafc", padding: "8px 12px", borderRadius: 6 }}>
            💡 <strong>Expected JSON format:</strong> Array of objects with <code>name</code>, <code>sku</code>, <code>sellingPrice</code>, and <code>costPrice</code>.
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// WAREHOUSES PAGE
// ─────────────────────────────────────────────────────────
type Warehouse = { id: string; name: string; code: string; city?: string; country?: string };

export function WarehousesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const list = useList<Warehouse>("wh", "/warehouses");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", city: "", country: "" });
  const f = (k: string) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  const create = useMutation({
    mutationFn: () => api.post("/warehouses", form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["wh"] }); setOpen(false); setForm({ name: "", code: "", city: "", country: "" }); toast("Warehouse created"); },
    onError: () => toast("Could not create warehouse.", "error"),
  });

  const columns: Column<Warehouse>[] = [
    { label: "Warehouse Name", render: (r) => <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Building2 size={15} color="var(--accent)" /><span style={{ fontWeight: 600 }}>{r.name}</span></div> },
    { label: "Code", render: (r) => <span className="font-mono" style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>{r.code}</span> },
    { label: "City", render: (r) => r.city ?? "—" },
    { label: "Country", render: (r) => r.country ?? "—" },
  ];

  return (
    <div>
      <PageHeader title="Warehouses" subtitle="Manage your storage locations">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={15} /> New Warehouse
        </button>
      </PageHeader>
      <div className="card">
        <DataTable columns={columns} data={list.data ?? []} loading={list.isLoading} error={list.error} searchFields={["name", "code", "city"]} emptyIcon={<Building2 size={48} />} emptyText="No warehouses yet" />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Warehouse"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Plus size={14} />} Create
            </button>
          </>
        }
      >
        <div className="form-grid form-grid-2">
          <InputGroup label="Warehouse Name *"><input className="input-field" value={form.name} onChange={(e) => f("name")(e.target.value)} required /></InputGroup>
          <InputGroup label="Code *"><input className="input-field" value={form.code} onChange={(e) => f("code")(e.target.value)} required /></InputGroup>
          <InputGroup label="City"><input className="input-field" value={form.city} onChange={(e) => f("city")(e.target.value)} /></InputGroup>
          <InputGroup label="Country"><input className="input-field" value={form.country} onChange={(e) => f("country")(e.target.value)} /></InputGroup>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// INVENTORY PAGE
// ─────────────────────────────────────────────────────────
type InventoryRow = { product: { name: string; sku: string }; warehouse: { name: string }; quantity: number; reservedQuantity: number; availableQuantity: number };

export function InventoryPage() {
  const list = useList<InventoryRow>("inv", "/inventory");
  const products = useList<{ id: string; name: string; sku: string }>("products", "/products");
  const warehouses = useList<{ id: string; name: string }>("wh", "/warehouses");
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [targetWarehouseId, setTargetWarehouseId] = useState("");
  const [stockCounts, setStockCounts] = useState<{ [productId: string]: string }>({});
  const [form, setForm] = useState({ productId: "", warehouseId: "", quantity: "0" });

  const opening = useMutation({
    mutationFn: () => api.post("/inventory/opening-stock", { productId: form.productId, warehouseId: form.warehouseId, quantity: Number(form.quantity) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["inv"] }); setOpen(false); toast("Opening stock posted"); },
    onError: () => toast("Could not post opening stock.", "error"),
  });

  const saveBulkSheet = useMutation({
    mutationFn: async (items: Array<{ productId: string; warehouseId: string; quantity: number }>) => {
      return api.post("/inventory/opening-stock/bulk", items);
    },
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["inv"] });
      setSheetOpen(false);
      setStockCounts({});
      toast(`Bulk stock count updated! Updated ${res.data?.count ?? 0} items.`);
    },
    onError: () => toast("Failed to update bulk stock count.", "error"),
  });

  const handleOpenSheet = () => {
    const defaultWh = warehouses.data?.[0]?.id ?? "";
    setTargetWarehouseId(defaultWh);
    // Pre-fill existing stock counts
    const initialCounts: { [productId: string]: string } = {};
    (list.data ?? []).forEach((r) => {
      if (r.product && r.warehouse?.name) {
        initialCounts[r.product.name] = String(r.quantity ?? 0);
      }
    });
    setStockCounts(initialCounts);
    setSheetOpen(true);
  };

  const handleSaveSheet = () => {
    if (!targetWarehouseId) {
      toast("Please select a target warehouse", "error");
      return;
    }
    const itemsToSave: Array<{ productId: string; warehouseId: string; quantity: number }> = [];
    (products.data ?? []).forEach((p) => {
      const val = stockCounts[p.id];
      if (val !== undefined && val !== "" && Number(val) >= 0) {
        itemsToSave.push({
          productId: p.id,
          warehouseId: targetWarehouseId,
          quantity: Number(val),
        });
      }
    });

    if (itemsToSave.length === 0) {
      toast("No stock changes to save.", "warn");
      return;
    }

    saveBulkSheet.mutate(itemsToSave);
  };

  const columns: Column<InventoryRow>[] = [
    { label: "Item", render: (r) => <span style={{ fontWeight: 600 }}>{r.product?.name}</span> },
    { label: "SKU", render: (r) => <span className="font-mono" style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>{r.product?.sku}</span> },
    { label: "Warehouse", render: (r) => r.warehouse?.name },
    { label: "On Hand", align: "right", render: (r) => <strong style={{ color: "var(--text-primary)" }}>{r.quantity}</strong> },
    { label: "Reserved", align: "right", render: (r) => <span style={{ color: r.reservedQuantity > 0 ? "var(--warning)" : "var(--text-muted)" }}>{r.reservedQuantity}</span> },
    {
      label: "Available", align: "right",
      render: (r) => (
        <span style={{ color: r.availableQuantity <= 0 ? "var(--danger)" : r.availableQuantity < 10 ? "var(--warning)" : "var(--success)", fontWeight: 700 }}>
          {r.availableQuantity}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Inventory Stock" subtitle="Stock levels & interactive bulk stock count editor">
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleOpenSheet}>
            <Sparkles size={15} color="var(--accent)" /> Quick Bulk Stock Count
          </button>
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={15} /> Post Single Stock
          </button>
        </div>
      </PageHeader>
      <div className="card">
        <DataTable columns={columns} data={list.data ?? []} loading={list.isLoading} error={list.error} searchFields={undefined} emptyIcon={<Archive size={48} />} emptyText="No inventory records" />
      </div>

      {/* Single Opening Stock Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="Post Single Stock"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={opening.isPending || !form.productId || !form.warehouseId || Number(form.quantity) <= 0} onClick={() => opening.mutate()}>
              {opening.isPending && <span className="spinner" style={{ width: 14, height: 14 }} />} Post Stock
            </button>
          </>
        }
      >
        <div className="form-grid">
          <InputGroup label="Item">
            <SearchableSelect
              placeholder="Search and select item..."
              options={(products.data ?? []).map((p) => ({ value: p.id, label: p.name, sublabel: p.sku }))}
              value={form.productId}
              onChange={(val) => setForm({ ...form, productId: val })}
            />
          </InputGroup>
          <InputGroup label="Warehouse">
            <SearchableSelect
              placeholder="Search and select warehouse..."
              options={(warehouses.data ?? []).map((w) => ({ value: w.id, label: w.name }))}
              value={form.warehouseId}
              onChange={(val) => setForm({ ...form, warehouseId: val })}
            />
          </InputGroup>
          <InputGroup label="Quantity">
            <NumberStepper
              value={form.quantity}
              onChange={(val) => setForm({ ...form, quantity: String(val) })}
              min={1}
            />
          </InputGroup>
        </div>
      </Modal>

      {/* Interactive Bulk Quick Stock Count Modal */}
      <Modal open={sheetOpen} onClose={() => setSheetOpen(false)} title="Quick Bulk Stock Count (Spreadsheet Grid)"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setSheetOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={saveBulkSheet.isPending || !targetWarehouseId} onClick={handleSaveSheet}>
              {saveBulkSheet.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />} Save All Stock Counts
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: 13 }}>Target Warehouse:</span>
              <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>Select where to update physical stock count</p>
            </div>
            <div style={{ width: 220 }}>
              <SearchableSelect
                placeholder="Search warehouse..."
                options={(warehouses.data ?? []).map((w) => ({ value: w.id, label: w.name }))}
                value={targetWarehouseId}
                onChange={(val) => setTargetWarehouseId(val)}
              />
            </div>
          </div>

          <div style={{ maxHeight: 320, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 8 }}>
            <table className="data-table" style={{ margin: 0 }}>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th style={{ width: 160, textAlign: "right" }}>New Physical Stock Qty</th>
                </tr>
              </thead>
              <tbody>
                {(products.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", color: "var(--text-muted)", padding: 20 }}>
                      No products found. Add products first.
                    </td>
                  </tr>
                ) : (
                  (products.data ?? []).map((p) => {
                    const currentVal = stockCounts[p.id] ?? 0;
                    return (
                      <tr key={p.id}>
                        <td><strong style={{ fontSize: 13 }}>{p.name}</strong></td>
                        <td><span className="font-mono" style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>{p.sku}</span></td>
                        <td style={{ textAlign: "right" }}>
                          <NumberStepper
                            value={currentVal}
                            onChange={(val) => setStockCounts({ ...stockCounts, [p.id]: String(val) })}
                            min={0}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ADJUSTMENTS PAGE
// ─────────────────────────────────────────────────────────
type Adjustment = { id: string; reason: string; quantityDelta: string; createdAt: string; product?: { name: string }; warehouse?: { name: string } };

export function AdjustmentsPage() {
  const list = useList<Adjustment>("adj", "/inventory/adjustments");
  const products = useList<{ id: string; name: string }>("products", "/products");
  const warehouses = useList<{ id: string; name: string }>("wh", "/warehouses");
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ productId: "", warehouseId: "", quantityDelta: "1", reason: "Cycle count" });

  const create = useMutation({
    mutationFn: () => api.post("/inventory/adjustments", { productId: form.productId, warehouseId: form.warehouseId, quantityDelta: Number(form.quantityDelta), reason: form.reason }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["adj"] }); qc.invalidateQueries({ queryKey: ["inv"] }); setOpen(false); toast("Adjustment posted"); },
    onError: () => toast("Could not post adjustment.", "error"),
  });

  const columns: Column<Adjustment>[] = [
    { label: "Item", render: (r) => r.product?.name ?? "—" },
    { label: "Warehouse", render: (r) => r.warehouse?.name ?? "—" },
    { label: "Reason", key: "reason" },
    { label: "Δ Qty", align: "right", render: (r) => <span style={{ color: Number(r.quantityDelta) >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 700 }}>{Number(r.quantityDelta) >= 0 ? "+" : ""}{r.quantityDelta}</span> },
    { label: "Date", render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—" },
  ];

  return (
    <div>
      <PageHeader title="Stock Adjustments" subtitle="Manage manual inventory corrections">
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> New Adjustment</button>
      </PageHeader>
      <div className="card">
        <DataTable columns={columns} data={list.data ?? []} loading={list.isLoading} error={list.error} searchFields={["reason"]} emptyIcon={<RefreshCw size={48} />} emptyText="No adjustments yet" />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Post Stock Adjustment"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={create.isPending || !form.productId || !form.warehouseId || !form.reason || Number(form.quantityDelta) === 0} onClick={() => create.mutate()}>
              {create.isPending && <span className="spinner" style={{ width: 14, height: 14 }} />} Post
            </button>
          </>
        }
      >
        <div className="form-grid form-grid-2">
          <InputGroup label="Item">
            <select className="input-field" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">Select item…</option>
              {(products.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </InputGroup>
          <InputGroup label="Warehouse">
            <select className="input-field" value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}>
              <option value="">Select warehouse…</option>
              {(warehouses.data ?? []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </InputGroup>
          <InputGroup label="Quantity Delta (+/-)">
            <input className="input-field" type="number" value={form.quantityDelta} onChange={(e) => setForm({ ...form, quantityDelta: e.target.value })} />
          </InputGroup>
          <InputGroup label="Reason">
            <input className="input-field" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </InputGroup>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// TRANSFERS PAGE
// ─────────────────────────────────────────────────────────
type Transfer = { id: string; number: string; fromWarehouseId: string; toWarehouseId: string; status: string; createdAt: string };

export function TransfersPage() {
  const list = useList<Transfer>("trf", "/inventory/transfers");
  const warehouses = useList<{ id: string; name: string }>("wh", "/warehouses");
  const products = useList<{ id: string; name: string }>("products", "/products");
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ fromWarehouseId: "", toWarehouseId: "", productId: "", quantity: "1" });

  const create = useMutation({
    mutationFn: () => api.post("/inventory/transfers", { fromWarehouseId: form.fromWarehouseId, toWarehouseId: form.toWarehouseId, lines: [{ productId: form.productId, quantity: Number(form.quantity) }] }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["trf"] }); setOpen(false); toast("Transfer created"); },
    onError: () => toast("Could not create transfer.", "error"),
  });

  const whMap = Object.fromEntries((warehouses.data ?? []).map((w) => [w.id, w.name]));
  const columns: Column<Transfer>[] = [
    { label: "Number", render: (r) => <strong>{r.number}</strong> },
    { label: "From", render: (r) => whMap[r.fromWarehouseId] ?? r.fromWarehouseId },
    { label: "To", render: (r) => whMap[r.toWarehouseId] ?? r.toWarehouseId },
    { label: "Status", render: (r) => <Badge status={r.status} /> },
    { label: "Date", render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—" },
  ];

  return (
    <div>
      <PageHeader title="Warehouse Transfers" subtitle="Move stock between warehouses">
        <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> New Transfer</button>
      </PageHeader>
      <div className="card">
        <DataTable columns={columns} data={list.data ?? []} loading={list.isLoading} error={list.error} searchFields={["number"]} emptyIcon={<ArrowLeftRight size={48} />} emptyText="No transfers yet" />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New Warehouse Transfer"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={create.isPending || !form.fromWarehouseId || !form.toWarehouseId || !form.productId || Number(form.quantity) <= 0 || form.fromWarehouseId === form.toWarehouseId} onClick={() => create.mutate()}>
              {create.isPending && <span className="spinner" style={{ width: 14, height: 14 }} />} Create Transfer
            </button>
          </>
        }
      >
        <div className="form-grid form-grid-2">
          <InputGroup label="From Warehouse">
            <select className="input-field" value={form.fromWarehouseId} onChange={(e) => setForm({ ...form, fromWarehouseId: e.target.value })}>
              <option value="">Select…</option>
              {(warehouses.data ?? []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </InputGroup>
          <InputGroup label="To Warehouse">
            <select className="input-field" value={form.toWarehouseId} onChange={(e) => setForm({ ...form, toWarehouseId: e.target.value })}>
              <option value="">Select…</option>
              {(warehouses.data ?? []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </InputGroup>
          <InputGroup label="Item">
            <select className="input-field" value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
              <option value="">Select…</option>
              {(products.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </InputGroup>
          <InputGroup label="Quantity">
            <input className="input-field" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          </InputGroup>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MAP LOCATION PICKER COMPONENT
// ─────────────────────────────────────────────────────────
type MapLocationPickerProps = {
  latitude?: number | string;
  longitude?: number | string;
  onChange: (loc: { latitude: number; longitude: number; city?: string; state?: string; pincode?: string; address?: string }) => void;
};

export function MapLocationPicker({ latitude, longitude, onChange }: MapLocationPickerProps) {
  const [lat, setLat] = useState<number>(Number(latitude) || 11.0168); // Default Coimbatore
  const [lng, setLng] = useState<number>(Number(longitude) || 76.9558);
  const [loadingGeo, setLoadingGeo] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [resolved, setResolved] = useState<{ city?: string; state?: string; pincode?: string }>({});

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setLoadingGeo(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const newLat = Number(pos.coords.latitude.toFixed(6));
        const newLng = Number(pos.coords.longitude.toFixed(6));
        setLat(newLat);
        setLng(newLng);
        setLoadingGeo(false);
        reverseGeocode(newLat, newLng);
      },
      () => {
        setLoadingGeo(false);
        alert("Could not fetch GPS location. Please check browser permissions.");
      }
    );
  };

  const reverseGeocode = async (targetLat: number, targetLng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${targetLat}&lon=${targetLng}`);
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || "";
        const state = addr.state || "";
        const pincode = addr.postcode || "";
        const fullAddr = data.display_name || "";
        setResolved({ city, state, pincode });
        onChange({ latitude: targetLat, longitude: targetLng, city, state, pincode, address: fullAddr });
      } else {
        onChange({ latitude: targetLat, longitude: targetLng });
      }
    } catch (e) {
      onChange({ latitude: targetLat, longitude: targetLng });
    }
  };

  const handleSearchCity = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const first = data[0];
        const newLat = Number(Number(first.lat).toFixed(6));
        const newLng = Number(Number(first.lon).toFixed(6));
        setLat(newLat);
        setLng(newLng);
        reverseGeocode(newLat, newLng);
      }
    } catch (e) {
      // ignore
    }
  };

  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.05}%2C${lat - 0.05}%2C${lng + 0.05}%2C${lat + 0.05}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12, background: "#f8fafc" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <MapPin size={16} color="var(--accent)" />
          <span style={{ fontWeight: 700, fontSize: 13 }}>Interactive Map Location Picker</span>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-secondary"
          onClick={handleGetCurrentLocation}
          disabled={loadingGeo}
        >
          <Navigation size={13} /> {loadingGeo ? "Locating GPS..." : "Pin My GPS Location"}
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <input
          type="text"
          className="input-field"
          style={{ fontSize: 12, padding: "6px 10px" }}
          placeholder="Search location (e.g. Coimbatore, Satara, Chennai, Mumbai)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearchCity())}
        />
        <button type="button" className="btn btn-sm btn-primary" onClick={handleSearchCity}>
          Search
        </button>
      </div>

      {/* Embedded OpenStreetMap */}
      <div style={{ position: "relative", height: 180, borderRadius: 8, overflow: "hidden", border: "1px solid #cbd5e1" }}>
        <iframe
          title="Location Map"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          src={mapEmbedUrl}
          style={{ border: 0 }}
        />
      </div>

      {/* Resolved Location Details */}
      {(resolved.city || resolved.state || resolved.pincode) && (
        <div style={{ marginTop: 8, padding: "8px 10px", background: "#ecfdf5", borderRadius: 6, border: "1px solid #6ee7b7", fontSize: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
          <span>✅ <strong>Auto-filled from map:</strong></span>
          {resolved.city && <span>📍 City: <strong>{resolved.city}</strong></span>}
          {resolved.state && <span>🗺️ State: <strong>{resolved.state}</strong></span>}
          {resolved.pincode && <span>📮 Pincode: <strong>{resolved.pincode}</strong></span>}
        </div>
      )}

      {/* Pinned Coordinates Display */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, fontSize: 12 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <span><strong>Lat:</strong> <span className="font-mono">{lat}</span></span>
          <span><strong>Lng:</strong> <span className="font-mono">{lng}</span></span>
        </div>
        <a
          href={`https://www.google.com/maps?q=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}
        >
          View on Google Maps ↗
        </a>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────
// PARTIES (CUSTOMERS / VENDORS)
// ─────────────────────────────────────────────────────────
type Party = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  billingAddress?: string;
  shippingAddress?: string;
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
};

// SHARED PARTY FORM BODY (Top-level component to preserve focus)
// ─────────────────────────────────────────────────────────
function PartyFormBody({ values, onChange, sameBilling, setSameBilling, kind }: {
  values: any;
  onChange: (k: string) => (v: any) => void;
  sameBilling: boolean;
  setSameBilling: (v: boolean) => void;
  kind?: string;
}) {
  return (
    <>
      <div className="form-grid form-grid-2" style={{ gap: 12 }}>
        <InputGroup label="Name *">
          <input className="input-field" value={values.name} onChange={(e) => onChange("name")(e.target.value)} placeholder="e.g. United Corporation" required />
        </InputGroup>
        <InputGroup label="GSTIN">
          <input className="input-field font-mono" value={values.gstin} onChange={(e) => onChange("gstin")(e.target.value)} placeholder="e.g. 33JEJPS1904F1ZH" />
        </InputGroup>
        <InputGroup label="Email">
          <input className="input-field" type="email" value={values.email} onChange={(e) => onChange("email")(e.target.value)} placeholder="email@domain.com" />
        </InputGroup>
        <InputGroup label="Phone">
          <input className="input-field" value={values.phone} onChange={(e) => onChange("phone")(e.target.value)} placeholder="+91 98765 43210" />
        </InputGroup>
        <InputGroup label="City">
          <input className="input-field" value={values.city} onChange={(e) => onChange("city")(e.target.value)} placeholder="e.g. Coimbatore" />
        </InputGroup>
        <InputGroup label="State (Determines GST Tax Type)">
          <input className="input-field" value={values.state} onChange={(e) => onChange("state")(e.target.value)} placeholder="e.g. Tamil Nadu / Maharashtra" />
        </InputGroup>
        <InputGroup label="Pincode">
          <input className="input-field" value={values.pincode} onChange={(e) => onChange("pincode")(e.target.value)} placeholder="641041" />
        </InputGroup>
      </div>

      <div style={{ marginTop: 14 }}>
        <MapLocationPicker
          latitude={values.latitude}
          longitude={values.longitude}
          onChange={(loc) => {
            onChange("latitude")(loc.latitude);
            onChange("longitude")(loc.longitude);
            if (loc.city) onChange("city")(loc.city);
            if (loc.state) onChange("state")(loc.state);
            if (loc.pincode) onChange("pincode")(loc.pincode);
            if (loc.address) {
              onChange("billingAddress")(loc.address);
              if (sameBilling) onChange("shippingAddress")(loc.address);
            }
          }}
        />
      </div>

      <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
        <div style={{ marginBottom: 10 }}>
          <InputGroup label="Billing Address (Buyer Bill-To Address)">
            <textarea className="input-field" rows={2} value={values.billingAddress}
              onChange={(e) => { onChange("billingAddress")(e.target.value); if (sameBilling) onChange("shippingAddress")(e.target.value); }}
              placeholder="Door / Flat No, Street, Landmark, Area..." />
          </InputGroup>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <input type="checkbox" id={`sameAddr-${kind || "form"}`} checked={sameBilling}
            onChange={(e) => {
              setSameBilling(e.target.checked);
              if (e.target.checked) onChange("shippingAddress")(values.billingAddress);
            }}
          />
          <label htmlFor={`sameAddr-${kind || "form"}`} style={{ fontSize: 13, cursor: "pointer", userSelect: "none" }}>
            Same as Billing Address for Shipping
          </label>
        </div>

        {!sameBilling && (
          <InputGroup label="Shipping Address (Buyer Ship-To Address)">
            <textarea className="input-field" rows={2} value={values.shippingAddress}
              onChange={(e) => onChange("shippingAddress")(e.target.value)}
              placeholder="Factory / Warehouse delivery address..." />
          </InputGroup>
        )}
      </div>
    </>
  );
}

export function PartiesPage({ kind }: { kind: "customers" | "vendors" }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const list = useList<Party>(kind, `/${kind}`);

  // ── Create state ──
  const [open, setOpen] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const emptyForm = {
    name: "", email: "", phone: "", city: "",
    state: "Tamil Nadu", pincode: "", gstin: "",
    billingAddress: "", shippingAddress: "",
    latitude: 11.0168, longitude: 76.9558,
  };
  const [form, setForm] = useState(emptyForm);

  // ── Edit state ──
  const [editParty, setEditParty] = useState<Party | null>(null);
  const [editSameAsBilling, setEditSameAsBilling] = useState(true);
  const [editForm, setEditForm] = useState(emptyForm);

  const f = (k: string) => (v: any) =>
    setForm((p) => {
      const next = { ...p, [k]: v };
      if (sameAsBilling && k === "billingAddress") next.shippingAddress = v;
      return next;
    });

  const ef = (k: string) => (v: any) =>
    setEditForm((p) => {
      const next = { ...p, [k]: v };
      if (editSameAsBilling && k === "billingAddress") next.shippingAddress = v;
      return next;
    });

  const isCustomer = kind === "customers";

  // ── Create mutation ──
  const create = useMutation({
    mutationFn: () => api.post(`/${kind}`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [kind] });
      setOpen(false);
      setForm(emptyForm);
      toast(`${isCustomer ? "Customer" : "Vendor"} added successfully!`);
    },
    onError: () => toast(`Could not add ${isCustomer ? "customer" : "vendor"}.`, "error"),
  });

  // ── Update mutation ──
  const update = useMutation({
    mutationFn: () => api.patch(`/${kind}/${editParty?.id}`, editForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [kind] });
      setEditParty(null);
      toast(`${isCustomer ? "Customer" : "Vendor"} updated successfully!`);
    },
    onError: (err: any) => toast(err.response?.data?.message ?? `Could not update ${isCustomer ? "customer" : "vendor"}.`, "error"),
  });

  const openEdit = (party: Party) => {
    setEditParty(party);
    const isSame = !party.shippingAddress || party.shippingAddress === party.billingAddress;
    setEditSameAsBilling(isSame);
    setEditForm({
      name: party.name || "",
      email: party.email || "",
      phone: party.phone || "",
      city: party.city || "",
      state: party.state || "Tamil Nadu",
      pincode: party.pincode || "",
      gstin: party.gstin || "",
      billingAddress: party.billingAddress || party.address || "",
      shippingAddress: party.shippingAddress || party.billingAddress || party.address || "",
      latitude: Number(party.latitude) || 11.0168,
      longitude: Number(party.longitude) || 76.9558,
    });
  };

  const columns: Column<Party>[] = [
    {
      label: "Name",
      render: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: isCustomer ? "#dbeafe" : "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Users size={14} color={isCustomer ? "#1e40af" : "#166534"} />
          </div>
          <div>
            <span style={{ fontWeight: 600 }}>{r.name}</span>
            {(r.billingAddress || r.address) && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
                📍 {r.city ? `${r.city}, ` : ""}{r.state ?? ""}
              </div>
            )}
          </div>
        </div>
      ),
    },
    { label: "Email", render: (r) => r.email ? <a href={`mailto:${r.email}`} className="link">{r.email}</a> : "—" },
    { label: "Phone", render: (r) => r.phone ?? "—" },
    { label: "State / Pincode", render: (r) => <span>{r.state ?? "—"}{r.pincode ? <span className="font-mono" style={{ marginLeft: 6, fontSize: 11, background: "#f1f5f9", padding: "1px 5px", borderRadius: 3 }}>{r.pincode}</span> : ""}</span> },
    {
      label: "Map",
      render: (r) => (
        <a href={`https://www.google.com/maps?q=${r.latitude || 11.0168},${r.longitude || 76.9558}`}
          target="_blank" rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
          style={{ fontSize: 11, padding: "2px 8px" }}
          onClick={(e) => e.stopPropagation()}
        >
          <MapPin size={12} color="var(--accent)" />
          {r.latitude ? `${Number(r.latitude).toFixed(2)}°, ${Number(r.longitude).toFixed(2)}°` : "Map Pin"}
        </a>
      ),
    },
    { label: "GSTIN", render: (r) => r.gstin ? <span className="font-mono" style={{ fontSize: 11 }}>{r.gstin}</span> : "—" },
    {
      label: "Edit",
      align: "right",
      render: (r) => (
        <button
          className="btn btn-secondary btn-sm"
          onClick={(e) => { e.stopPropagation(); openEdit(r); }}
          style={{ fontSize: 11 }}
        >
          ✏️ Edit
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={isCustomer ? "Customers" : "Vendors"}
        subtitle={isCustomer ? "Manage customer directory, addresses & map location pins" : "Manage vendor directory & map location pins"}
      >
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={15} /> Add {isCustomer ? "Customer" : "Vendor"}
        </button>
      </PageHeader>

      <div className="card">
        <DataTable columns={columns} data={list.data ?? []} loading={list.isLoading} error={list.error}
          searchFields={["name", "email", "phone", "city"]} emptyIcon={<Users size={48} />} emptyText={`No ${kind} yet`} />
      </div>

      {/* ── Create Modal ── */}
      <Modal open={open} onClose={() => setOpen(false)} title={`Add New ${isCustomer ? "Customer" : "Vendor"}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={create.isPending || !form.name} onClick={() => create.mutate()}>
              {create.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />} Save {isCustomer ? "Customer" : "Vendor"}
            </button>
          </>
        }
      >
        <PartyFormBody values={form} onChange={f} sameBilling={sameAsBilling} setSameBilling={setSameAsBilling} kind={kind} />
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal open={!!editParty} onClose={() => setEditParty(null)}
        title={`Edit ${isCustomer ? "Customer" : "Vendor"} — ${editParty?.name ?? ""}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditParty(null)}>Cancel</button>
            <button className="btn btn-primary" disabled={update.isPending || !editForm.name} onClick={() => update.mutate()}>
              {update.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />} Save Changes
            </button>
          </>
        }
      >
        <PartyFormBody values={editForm} onChange={ef} sameBilling={editSameAsBilling} setSameBilling={setEditSameAsBilling} kind={kind} />
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ESTIMATES (QUOTATIONS) PAGE
// ─────────────────────────────────────────────────────────
type Estimate = {
  id: string;
  number: string;
  total: string;
  status: string;
  expiryDate?: string;
  createdAt?: string;
  customer?: { id: string; name: string };
  lines?: { productId: string; quantity: string; unitPrice: string; taxRate: string }[];
};

export function EstimatesPage() {
  const list = useList<Estimate>("estimates", "/estimates");
  const customers = useList<{ id: string; name: string }>("customers", "/customers");
  const products = useList<{ id: string; name: string; sellingPrice?: number; taxRate?: number }>("products", "/products");
  const qc = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customerId: "" });
  const [lines, setLines] = useState<LineItem[]>([{ productId: "", quantity: 1, unitPrice: 0, taxRate: 0 }]);

  const create = useMutation({
    mutationFn: () => {
      const validLines = lines.filter((l) => l.productId && l.quantity > 0);
      if (!form.customerId) throw new Error("Please select a customer");
      if (!validLines.length) throw new Error("Please add at least one line item");

      return api.post("/estimates", {
        customerId: form.customerId,
        lines: validLines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
        })),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["estimates"] });
      setOpen(false);
      setLines([{ productId: "", quantity: 1, unitPrice: 0, taxRate: 0 }]);
      toast("Estimate quote created successfully!");
    },
    onError: (err: any) => toast(err.response?.data?.message ?? err.message ?? "Could not create estimate.", "error"),
  });

  const convertToOrder = useMutation({
    mutationFn: async (estimate: Estimate) => {
      return api.post("/sales-orders", {
        customerId: estimate.customer?.id,
        lines: (estimate.lines ?? []).map((l: any) => ({
          productId: l.productId,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          taxRate: Number(l.taxRate),
        })),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so"] });
      toast("Estimate converted to Sales Order successfully!");
    },
    onError: (err: any) => toast(err.response?.data?.message ?? "Could not convert estimate.", "error"),
  });

  const columns: Column<Estimate>[] = [
    { label: "Estimate #", render: (r) => <strong>{r.number}</strong> },
    { label: "Customer", render: (r) => r.customer?.name ?? "—" },
    { label: "Status", render: (r) => <Badge status={r.status ?? "draft"} /> },
    { label: "Date / Expiry", render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : (r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : "—") },
    { label: "Total Quote", align: "right", render: (r) => <strong>{money(Number(r.total))}</strong> },
    {
      label: "Action",
      align: "right",
      render: (r) => (
        <button
          className="btn btn-primary btn-sm"
          disabled={convertToOrder.isPending}
          onClick={(e) => {
            e.stopPropagation();
            convertToOrder.mutate(r);
          }}
        >
          {convertToOrder.isPending ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <ShoppingCart size={13} />}
          Convert to Order
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Estimates & Quotes" subtitle="Create price quotations for customers before confirming orders">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={15} /> Create Estimate Quote
        </button>
      </PageHeader>

      <div className="card">
        <DataTable
          columns={columns}
          data={list.data ?? []}
          loading={list.isLoading}
          error={list.error}
          searchFields={["number"]}
          emptyIcon={<FileText size={48} />}
          emptyText="No estimates or quotes yet"
        />
      </div>

      {/* Create Estimate Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create New Price Estimate (Quotation)"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={create.isPending} onClick={() => create.mutate()}>
              {create.isPending && <span className="spinner" style={{ width: 14, height: 14 }} />} Create Estimate Quote
            </button>
          </>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <InputGroup label="Customer *">
            <SearchableSelect
              placeholder="Search and select customer..."
              options={(customers.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
              value={form.customerId}
              onChange={(val) => setForm({ ...form, customerId: val })}
            />
          </InputGroup>
        </div>

        <LineItemBuilder lines={lines} onChange={setLines} products={products.data ?? []} mode="selling" />
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// LINE ITEM BUILDER COMPONENT
// ─────────────────────────────────────────────────────────
export type LineItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  description?: string;
};

export function LineItemBuilder({
  lines,
  onChange,
  products,
  mode = "selling",
}: {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
  products: { id: string; name: string; sellingPrice?: number; costPrice?: number; taxRate?: number }[];
  mode?: "selling" | "purchasing";
}) {
  const addLine = () => {
    onChange([...lines, { productId: "", quantity: 1, unitPrice: 0, taxRate: 0, description: "" }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 1) return;
    onChange(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof LineItem, val: any) => {
    const next = [...lines];
    next[index] = { ...next[index], [field]: val };
    if (field === "productId") {
      const prod = products.find((p) => p.id === val);
      if (prod) {
        const price = mode === "selling" ? Number(prod.sellingPrice ?? 0) : Number(prod.costPrice ?? 0);
        next[index].unitPrice = price;
        next[index].taxRate = Number(prod.taxRate ?? 0);
      }
    }
    onChange(next);
  };

  const subtotal = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  const taxTotal = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) * ((Number(l.taxRate) || 0) / 100), 0);
  const grandTotal = subtotal + taxTotal;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
          <Boxes size={16} color="var(--accent)" /> Multiple Items & Per-Item Tax Breakdown ({lines.length})
        </label>
        <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
          <Plus size={13} /> Add Item Line
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {lines.map((line, idx) => {
          const lineSubtotal = (Number(line.quantity) || 0) * (Number(line.unitPrice) || 0);
          const lineTax = lineSubtotal * ((Number(line.taxRate) || 0) / 100);
          const lineTotal = lineSubtotal + lineTax;

          return (
            <div
              key={idx}
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "12px 14px",
                display: "grid",
                gridTemplateColumns: "2.5fr 1fr 1.2fr 1.3fr 1.2fr auto",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Item *</span>
                <select
                  className="input-field"
                  style={{ fontSize: 13, padding: "6px 8px" }}
                  value={line.productId}
                  onChange={(e) => updateLine(idx, "productId", e.target.value)}
                >
                  <option value="">Select item…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Qty *</span>
                <input
                  className="input-field"
                  style={{ fontSize: 13, padding: "6px 8px" }}
                  type="number"
                  min="1"
                  value={line.quantity}
                  onChange={(e) => updateLine(idx, "quantity", Math.max(1, Number(e.target.value)))}
                />
              </div>

              <div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>
                  {mode === "selling" ? "Unit Price ($)" : "Unit Cost ($)"}
                </span>
                <input
                  className="input-field"
                  style={{ fontSize: 13, padding: "6px 8px" }}
                  type="number"
                  min="0"
                  step="0.01"
                  value={line.unitPrice}
                  onChange={(e) => updateLine(idx, "unitPrice", Number(e.target.value))}
                />
              </div>

              <div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Item Tax %</span>
                <select
                  className="input-field"
                  style={{ fontSize: 13, padding: "6px 8px" }}
                  value={line.taxRate}
                  onChange={(e) => updateLine(idx, "taxRate", Number(e.target.value))}
                >
                  <option value={0}>0% Tax Exempt</option>
                  <option value={5}>5% GST / VAT</option>
                  <option value={12}>12% GST / VAT</option>
                  <option value={18}>18% Standard GST</option>
                  <option value={28}>28% Luxury GST</option>
                </select>
              </div>

              <div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Line Total</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
                  {money(lineTotal)}
                </span>
              </div>

              <div style={{ paddingTop: 14 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ color: lines.length > 1 ? "var(--danger)" : "#cbd5e1", padding: "6px 8px" }}
                  onClick={() => removeLine(idx)}
                  disabled={lines.length <= 1}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Box */}
      <div
        style={{
          marginTop: 14,
          padding: "12px 16px",
          background: "#ffffff",
          border: "1.5px solid #cbd5e1",
          borderRadius: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 20, fontSize: 13 }}>
          <span>Subtotal: <strong>{money(subtotal)}</strong></span>
          <span>Tax: <strong style={{ color: "var(--accent)" }}>+{money(taxTotal)}</strong></span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>
          Grand Total: <span style={{ color: "var(--success)" }}>{money(grandTotal)}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// DRAG & DROP KANBAN BOARD COMPONENT
// ─────────────────────────────────────────────────────────
export type KanbanCol<T> = {
  id: string;
  title: string;
  badgeStatus: string;
  color: string;
  items: T[];
};

export function KanbanBoard<
  T extends { id: string; number?: string; status?: string; total?: string | number; createdAt?: string; customer?: { name: string }; vendor?: { name: string } }
>({
  columns,
  onDrop,
}: {
  columns: KanbanCol<T>[];
  onDrop: (itemId: string, targetStatus: string) => void;
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedId;
    if (id && targetStatus) {
      onDrop(id, targetStatus);
    }
    setDraggedId(null);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns.length}, minmax(260px, 1fr))`, gap: 16, marginTop: 16 }}>
      {columns.map((col) => (
        <div
          key={col.id}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, col.id)}
          style={{
            background: "#f8fafc",
            border: "1.5px dashed #cbd5e1",
            borderRadius: 12,
            padding: 14,
            minHeight: 420,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 8, borderBottom: "2px solid #e2e8f0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: col.color }} />
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{col.title}</span>
            </div>
            <span className="font-mono" style={{ background: "#e2e8f0", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>
              {col.items.length}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
            {col.items.length === 0 ? (
              <div style={{ padding: "50px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 12, fontStyle: "italic" }}>
                Drag & drop cards here to move step
              </div>
            ) : (
              col.items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item.id)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: 10,
                    padding: "12px 14px",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                    cursor: "grab",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#cbd5e1";
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.04)";
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <GripVertical size={14} color="#94a3b8" />
                      <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>{item.number}</span>
                    </div>
                    <Badge status={item.status ?? col.badgeStatus} />
                  </div>

                  {(item.customer?.name || item.vendor?.name) && (
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>
                      👤 {item.customer?.name ?? item.vendor?.name}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 6, borderTop: "1px solid #f1f5f9", fontSize: 12 }}>
                    <span style={{ color: "var(--text-muted)" }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ""}
                    </span>
                    <strong style={{ fontSize: 13, color: "var(--text-primary)" }}>
                      {money(Number(item.total ?? 0))}
                    </strong>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SALES ORDERS PAGE
// ─────────────────────────────────────────────────────────
type SalesOrder = { id: string; number: string; status: string; total: string; customer?: { name: string }; lines?: { productId: string; quantity: string }[] };

export function SalesOrdersPage() {
  const list = useList<SalesOrder>("so", "/sales-orders");
  const customers = useList<{ id: string; name: string }>("customers", "/customers");
  const warehouses = useList<{ id: string; name: string }>("wh", "/warehouses");
  const products = useList<{ id: string; name: string; sellingPrice?: number; taxRate?: number }>("products", "/products");
  const qc = useQueryClient();
  const { toast } = useToast();

  const [view, setView] = useState<"table" | "kanban">("table");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customerId: "", warehouseId: "" });
  const [lines, setLines] = useState<LineItem[]>([{ productId: "", quantity: 1, unitPrice: 0, taxRate: 0 }]);

  const create = useMutation({
    mutationFn: () => {
      const validLines = lines.filter((l) => l.productId && l.quantity > 0);
      if (!form.customerId) throw new Error("Please select a customer");
      if (!form.warehouseId) throw new Error("Please select a warehouse");
      if (!validLines.length) throw new Error("Please add at least one line item");
      return api.post("/sales-orders", {
        customerId: form.customerId,
        warehouseId: form.warehouseId,
        lines: validLines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
        })),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so"] });
      setOpen(false);
      setLines([{ productId: "", quantity: 1, unitPrice: 0, taxRate: 0 }]);
      toast("Sales order created successfully");
    },
    onError: (err: any) => toast(err.response?.data?.message ?? err.message ?? "Could not create sales order.", "error"),
  });

  const confirm = useMutation({
    mutationFn: (id: string) => api.post(`/sales-orders/${id}/confirm`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so"] });
      qc.invalidateQueries({ queryKey: ["packages"] });
      toast("Order confirmed & stock reserved");
    },
    onError: (err: any) => toast(err.response?.data?.message ?? "Could not confirm order.", "error"),
  });

  const cancel = useMutation({
    mutationFn: (id: string) => api.post(`/sales-orders/${id}/cancel`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so"] });
      toast("Order cancelled");
    },
    onError: (err: any) => toast(err.response?.data?.message ?? "Could not cancel order.", "error"),
  });

  const fulfillAndShip = useMutation({
    mutationFn: async (orderId: string) => {
      const { data: pkg } = await api.post("/packages", { salesOrderId: orderId, lines: [] });
      await api.post(`/shipments/from-package/${pkg.id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["so"] });
      qc.invalidateQueries({ queryKey: ["packages"] });
      qc.invalidateQueries({ queryKey: ["shipments"] });
      qc.invalidateQueries({ queryKey: ["inv"] });
      toast("Order packed, shipped & stock updated!");
    },
    onError: (err: any) =>
      toast(err.response?.data?.message ?? "Could not fulfill order.", "error"),
  });

  const handleKanbanDrop = (itemId: string, targetStatus: string) => {
    const order = (list.data ?? []).find((o) => o.id === itemId);
    if (!order) return;

    if (targetStatus === "CONFIRMED" && order.status === "DRAFT") {
      confirm.mutate(itemId);
    } else if (targetStatus === "FULFILLED" && (order.status === "CONFIRMED" || order.status === "DRAFT")) {
      if (order.status === "DRAFT") {
        confirm.mutate(itemId, {
          onSuccess: () => fulfillAndShip.mutate(itemId),
        });
      } else {
        fulfillAndShip.mutate(itemId);
      }
    } else if (targetStatus === "CANCELLED" && order.status !== "CANCELLED" && order.status !== "FULFILLED") {
      cancel.mutate(itemId);
    } else {
      toast(`Cannot move order from ${order.status} to ${targetStatus}`, "warn");
    }
  };

  const columns: Column<SalesOrder>[] = [
    { label: "Order #", render: (r) => <strong>{r.number}</strong> },
    { label: "Customer", render: (r) => r.customer?.name ?? "—" },
    { label: "Status", render: (r) => <Badge status={r.status} /> },
    { label: "Total", align: "right", render: (r) => <strong>{money(Number(r.total))}</strong> },
    {
      label: "Actions",
      align: "right",
      render: (r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          {r.status === "DRAFT" && (
            <button className="btn btn-success btn-sm" onClick={(e) => { e.stopPropagation(); confirm.mutate(r.id); }}>
              <Check size={12} /> Confirm
            </button>
          )}
          {r.status !== "CANCELLED" && r.status !== "FULFILLED" && (
            <button className="btn btn-secondary btn-sm" style={{ color: "var(--danger)" }} onClick={(e) => { e.stopPropagation(); cancel.mutate(r.id); }}>
              Cancel
            </button>
          )}
        </div>
      ),
    },
  ];

  const allOrders = list.data ?? [];
  const kanbanCols: KanbanCol<SalesOrder>[] = [
    { id: "DRAFT", title: "Draft Orders", badgeStatus: "DRAFT", color: "#94a3b8", items: allOrders.filter((o) => o.status === "DRAFT") },
    { id: "CONFIRMED", title: "Confirmed Orders", badgeStatus: "CONFIRMED", color: "#3b82f6", items: allOrders.filter((o) => o.status === "CONFIRMED") },
    { id: "FULFILLED", title: "Fulfilled / Shipped", badgeStatus: "FULFILLED", color: "#10b981", items: allOrders.filter((o) => o.status === "FULFILLED" || o.status === "SHIPPED" || o.status === "PACKED") },
    { id: "CANCELLED", title: "Cancelled Orders", badgeStatus: "CANCELLED", color: "#ef4444", items: allOrders.filter((o) => o.status === "CANCELLED") },
  ];

  return (
    <div>
      <PageHeader title="Sales Orders" subtitle="Manage customer orders & drag-and-drop status flow">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          {/* View Toggle */}
          <div style={{ background: "#e2e8f0", borderRadius: 8, padding: 3, display: "flex", gap: 2 }}>
            <button
              className={`btn btn-sm ${view === "table" ? "btn-primary" : "btn-secondary"}`}
              style={{ border: "none", padding: "5px 10px" }}
              onClick={() => setView("table")}
            >
              <List size={14} /> Table
            </button>
            <button
              className={`btn btn-sm ${view === "kanban" ? "btn-primary" : "btn-secondary"}`}
              style={{ border: "none", padding: "5px 10px" }}
              onClick={() => setView("kanban")}
            >
              <Kanban size={14} /> Drag & Drop Board
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={15} /> New Order
          </button>
        </div>
      </PageHeader>

      {view === "table" ? (
        <div className="card">
          <DataTable columns={columns} data={allOrders} loading={list.isLoading} error={list.error} searchFields={["number"]} emptyIcon={<ShoppingCart size={48} />} emptyText="No sales orders yet" />
        </div>
      ) : (
        <KanbanBoard columns={kanbanCols} onDrop={handleKanbanDrop} />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create Sales Order with Multiple Items"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={create.isPending} onClick={() => create.mutate()}>
              {create.isPending && <span className="spinner" style={{ width: 14, height: 14 }} />} Create Sales Order
            </button>
          </>
        }
      >
        <div className="form-grid form-grid-2" style={{ marginBottom: 16 }}>
          <InputGroup label="Customer *">
            <select className="input-field" value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} required>
              <option value="">Select customer…</option>
              {(customers.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </InputGroup>
          <InputGroup label="Dispatch Warehouse *">
            <select className="input-field" value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} required>
              <option value="">Select warehouse…</option>
              {(warehouses.data ?? []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </InputGroup>
        </div>

        <LineItemBuilder lines={lines} onChange={setLines} products={products.data ?? []} mode="selling" />
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// FULFILLMENT (PACKAGES & SHIPMENTS)
// ─────────────────────────────────────────────────────────
type FulfillRow = { id: string; number: string; status: string; createdAt?: string };

export function FulfillmentPage({ kind }: { kind: "packages" | "shipments" }) {
  const list = useList<FulfillRow>(kind, `/${kind}`);
  const packages = useList<FulfillRow>("packages", "/packages");
  const orders = useList<SalesOrder>("so", "/sales-orders");
  const qc = useQueryClient();
  const { toast } = useToast();

  const packOrder = useMutation({
    mutationFn: async (order: SalesOrder) => {
      let lines = (order.lines ?? []).map((l) => ({ productId: l.productId, quantity: Number(l.quantity) }));
      if (!lines.length) {
        // Fetch detailed order if lines not populated
        const { data: detailed } = await api.get(`/sales-orders/${order.id}`);
        lines = (detailed.lines ?? []).map((l: any) => ({ productId: l.productId, quantity: Number(l.quantity) }));
      }
      if (!lines.length) throw new Error("Order has no line items.");
      return api.post("/packages", { salesOrderId: order.id, lines });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["packages"] });
      qc.invalidateQueries({ queryKey: ["so"] });
      toast("Package created successfully!");
    },
    onError: (err: any) => toast(err.response?.data?.message ?? err.message ?? "Could not create package.", "error"),
  });

  const shipPackage = useMutation({
    mutationFn: (packageId: string) => api.post(`/shipments/from-package/${packageId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shipments"] });
      qc.invalidateQueries({ queryKey: ["packages"] });
      qc.invalidateQueries({ queryKey: ["inv"] });
      qc.invalidateQueries({ queryKey: ["so"] });
      toast("Shipment created & stock deducted!");
    },
    onError: (err: any) => toast(err.response?.data?.message ?? "Could not create shipment.", "error"),
  });

  const existingPackedOrderIds = new Set((packages.data ?? []).map((p: any) => p.salesOrderId).filter(Boolean));

  // Show confirmed orders that have NOT yet been packed into a package
  const confirmedOrders = (orders.data ?? []).filter(
    (o) => o.status === "CONFIRMED" && !existingPackedOrderIds.has(o.id)
  );

  const unshippedPackages = (packages.data ?? []).filter((p) => p.status !== "SHIPPED");

  const columns: Column<FulfillRow>[] = [
    { label: "Package / Shipment #", render: (r) => <strong>{r.number}</strong> },
    { label: "Status", render: (r) => <Badge status={r.status} /> },
    { label: "Date", render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={kind === "packages" ? "Packages & Fulfillment" : "Shipments"}
        subtitle={kind === "packages" ? "Pack confirmed sales orders into packages" : "Ship packed packages to customers"}
      />

      {/* ── PACKAGES VIEW: Show Confirmed Orders waiting to be packed ── */}
      {kind === "packages" && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ background: "#f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Box size={18} color="var(--accent)" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Orders Ready for Packing</span>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
              {confirmedOrders.length} confirmed order{confirmedOrders.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {confirmedOrders.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                ✓ No confirmed orders waiting to be packed. Confirm a Sales Order first.
              </div>
            ) : (
              <div className="data-table-wrap" style={{ border: "none", borderRadius: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th style={{ textAlign: "right" }}>Total</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {confirmedOrders.map((o) => (
                      <tr key={o.id}>
                        <td><strong>{o.number}</strong></td>
                        <td>{o.customer?.name ?? "—"}</td>
                        <td style={{ textAlign: "right" }}><strong>{money(Number(o.total))}</strong></td>
                        <td><Badge status={o.status} /></td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={packOrder.isPending}
                            onClick={() => packOrder.mutate(o)}
                          >
                            {packOrder.isPending ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Box size={13} />}
                            Pack Order
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── SHIPMENTS VIEW: Show Packages waiting to be shipped ── */}
      {kind === "shipments" && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ background: "#f0fdf4" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Truck size={18} color="#16a34a" />
              <span style={{ fontWeight: 600, fontSize: 14 }}>Packages Ready to Ship</span>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
              {unshippedPackages.length} package{unshippedPackages.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {unshippedPackages.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                ✓ No packages waiting to be shipped. Create a package first.
              </div>
            ) : (
              <div className="data-table-wrap" style={{ border: "none", borderRadius: 0 }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Package #</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unshippedPackages.map((p) => (
                      <tr key={p.id}>
                        <td><strong>{p.number}</strong></td>
                        <td><Badge status={p.status} /></td>
                        <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "—"}</td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="btn btn-success btn-sm"
                            disabled={shipPackage.isPending}
                            onClick={() => shipPackage.mutate(p.id)}
                          >
                            {shipPackage.isPending ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Truck size={13} />}
                            Ship Package
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Main List Table (Packages or Shipments history) ── */}
      <div className="card">
        <div className="card-header">
          <span style={{ fontWeight: 600 }}>{kind === "packages" ? "Package History" : "Shipment History"}</span>
        </div>
        <DataTable
          columns={columns}
          data={list.data ?? []}
          loading={list.isLoading}
          error={list.error}
          searchFields={["number"]}
          emptyIcon={kind === "packages" ? <Box size={48} /> : <Truck size={48} />}
          emptyText={`No ${kind} history yet`}
        />
      </div>
    </div>
  );
}



// ─────────────────────────────────────────────────────────
// NUMBER TO WORDS CONVERTER (INR)
// ─────────────────────────────────────────────────────────
export function numberToWordsINR(amount: number): string {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return "Zero Rupees Only";

  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ",
    "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "
  ];
  const b = ["", "", "Twenty ", "Thirty ", "Forty ", "Fifty ", "Sixty ", "Seventy ", "Eighty ", "Ninety "];

  const inWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + "Crore " + inWords(n % 10000000);
  };

  const words = inWords(num).trim();
  return words ? `Rupees ${words} Only` : "Zero Rupees Only";
}

// ─────────────────────────────────────────────────────────
// PRINTABLE TAX INVOICE MODAL (OSCAR AUTO FLUX TEMPLATE)
// ─────────────────────────────────────────────────────────
export function PrintInvoiceModal({
  invoice,
  onClose,
}: {
  invoice: any;
  onClose: () => void;
}) {
  const [copyType, setCopyType] = useState<"Original" | "Duplicate" | "Triplicate">("Original");
  const [vehicleNo, setVehicleNo] = useState<string>(invoice?.vehicleNo || "TN42 V 1080");
  const [placeOfSupply, setPlaceOfSupply] = useState<string>(invoice?.customer?.state || "Tamil Nadu (33)");
  const [dueDateStr, setDueDateStr] = useState<string>(
    invoice?.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : new Date(Date.now() + 30 * 86400000).toLocaleDateString()
  );

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const lines = invoice.lines ?? [];
  const subtotal = Number(invoice.subtotal ?? invoice.total ?? 0);
  const tax = Number(invoice.tax ?? 0);
  const total = Number(invoice.total ?? 0);

  const customer = invoice.customer || {};
  const billAddress = customer.billingAddress || customer.address || "Address not provided";
  const shipAddress = customer.shippingAddress || customer.billingAddress || customer.address || "Address not provided";

  // Determine intra-state (Tamil Nadu: SGST 9% + CGST 9%) vs inter-state (Other States: IGST 18%)
  const stateStr = (placeOfSupply || customer?.state || "").toLowerCase();
  const isTamilNadu = stateStr.includes("tamil") || stateStr.includes("tn") || stateStr.includes("33");
  const isInterState = !isTamilNadu;

  return (
    <Modal
      open={!!invoice}
      onClose={onClose}
      title={`Tax Invoice PDF — ${invoice.number}`}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Copy Mode:</span>
              {(["Original", "Duplicate", "Triplicate"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`btn btn-sm ${copyType === type ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setCopyType(type)}
                >
                  {type}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Vehicle #:</span>
              <input
                type="text"
                className="input-field"
                style={{ width: 110, fontSize: 12, padding: "4px 8px" }}
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={15} /> Print / Save PDF
            </button>
          </div>
        </div>
      }
    >
      <div id="printable-invoice-container">
        <style>{`
          @media print {
            body * {
              visibility: hidden !important;
            }
            #printable-invoice-container, #printable-invoice-container * {
              visibility: visible !important;
            }
            #printable-invoice-container {
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              height: 100% !important;
              margin: 0 !important;
              padding: 20px !important;
              background: #fff !important;
              z-index: 999999 !important;
            }
          }
          .inv-box {
            font-family: Arial, Helvetica, sans-serif;
            border: 1.5px solid #000;
            background: #fff;
            color: #000;
            padding: 16px;
            box-sizing: border-box;
            position: relative;
          }
          .inv-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .inv-table th, .inv-table td {
            border: 1px solid #000;
            padding: 6px 8px;
            font-size: 11px;
          }
          .inv-table th {
            background-color: #f1f5f9;
            font-weight: 700;
            text-align: center;
          }
        `}</style>

        <div className="inv-box">
          {/* Copy Indicator Badge */}
          <div style={{ position: "absolute", top: 12, right: 16, fontSize: 11, fontWeight: 700, textTransform: "uppercase", border: "1px solid #000", padding: "2px 8px" }}>
            {copyType}
          </div>

          {/* Header Section (Company Info - Fixed) */}
          <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1.2fr", borderBottom: "1.5px solid #000", paddingBottom: 10, marginBottom: 10 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#1e3a8a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 }}>
                  OAF
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e3a8a", letterSpacing: "0.5px" }}>
                    OSCAR AUTO FLUX
                  </h2>
                  <div style={{ fontSize: 10, fontStyle: "italic", color: "#475569" }}>
                    Manufacturers of Welding consumables | ISO 9001:2015 company
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 10, marginTop: 8, lineHeight: 1.4 }}>
                S.F.No.517/1, Veerampalayam, Kangeyam, Tiruppur.<br />
                State: Tamilnadu. PIN: 638701<br />
                <strong>GSTIN:</strong> 33CQZPR8943L1ZM | <strong>MSME:</strong> UDYAM-TN-28-0165042
              </div>
            </div>

            <div style={{ borderLeft: "1.5px solid #000", paddingLeft: 12 }}>
              <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 800, textAlign: "right", letterSpacing: "1px" }}>
                TAX INVOICE
              </h3>
              <table style={{ width: "100%", fontSize: 10, borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "2px 0" }}>Invoice Number:</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{invoice.number}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "2px 0" }}>Invoice Date:</td>
                    <td style={{ textAlign: "right" }}>{invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "2px 0" }}>Place Of Supply:</td>
                    <td style={{ textAlign: "right" }}>{placeOfSupply}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "2px 0" }}>Vehicle Number:</td>
                    <td style={{ textAlign: "right" }}>{vehicleNo || "—"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "2px 0" }}>Due Date:</td>
                    <td style={{ textAlign: "right" }}>{dueDateStr}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Dynamic Buyer Details Grid (From Customer API) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid #000", marginBottom: 10 }}>
            <div style={{ padding: 8, borderRight: "1px solid #000" }}>
              <div style={{ fontSize: 10, fontWeight: 700, background: "#e2e8f0", padding: "2px 4px", marginBottom: 4 }}>
                Buyer (Bill to)
              </div>
              <strong style={{ fontSize: 12 }}>{customer.name ?? "Walk-in Customer"}</strong>
              <div style={{ fontSize: 10, color: "#334155", marginTop: 2, lineHeight: 1.4 }}>
                {billAddress}<br />
                {customer.city ? `${customer.city}, ` : ""}{customer.state ? `${customer.state} ` : ""}{customer.pincode || ""}<br />
                {customer.phone ? `Ph: ${customer.phone} ` : ""}{customer.email ? `| Email: ${customer.email}` : ""}<br />
                <strong>GSTIN:</strong> {customer.gstin || "URP (Unregistered)"}
              </div>
            </div>

            <div style={{ padding: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, background: "#e2e8f0", padding: "2px 4px", marginBottom: 4 }}>
                Buyer (Ship to)
              </div>
              <strong style={{ fontSize: 12 }}>{customer.name ?? "Walk-in Customer"}</strong>
              <div style={{ fontSize: 10, color: "#334155", marginTop: 2, lineHeight: 1.4 }}>
                {shipAddress}<br />
                {customer.city ? `${customer.city}, ` : ""}{customer.state ? `${customer.state} ` : ""}{customer.pincode || ""}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="inv-table">
            <thead>
              <tr>
                <th style={{ width: "30px" }}>#</th>
                <th>Item & Description</th>
                <th style={{ width: "80px" }}>HSN Code</th>
                <th style={{ width: "70px" }}>Qty (kg)</th>
                <th style={{ width: "70px" }}>Rate</th>
                {!isInterState ? (
                  <>
                    <th style={{ width: "80px" }}>SGST 9%</th>
                    <th style={{ width: "80px" }}>CGST 9%</th>
                  </>
                ) : (
                  <th style={{ width: "100px" }}>IGST 18%</th>
                )}
                <th style={{ width: "90px" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 ? (
                <tr>
                  <td style={{ textAlign: "center" }}>1</td>
                  <td>SAW FLUX AUTOWELD Gr - 3</td>
                  <td style={{ textAlign: "center" }}>38109010</td>
                  <td style={{ textAlign: "right" }}>500</td>
                  <td style={{ textAlign: "right" }}>96.00</td>
                  {!isInterState ? (
                    <>
                      <td style={{ textAlign: "right" }}>4,320.00</td>
                      <td style={{ textAlign: "right" }}>4,320.00</td>
                    </>
                  ) : (
                    <td style={{ textAlign: "right" }}>8,640.00</td>
                  )}
                  <td style={{ textAlign: "right" }}>48,000.00</td>
                </tr>
              ) : (
                lines.map((l: any, i: number) => {
                  const lineQty = Number(l.quantity || 1);
                  const linePrice = Number(l.unitPrice || 0);
                  const lineSubtotal = lineQty * linePrice;
                  const lineTaxRate = Number(l.taxRate || 18);
                  const lineTaxAmt = lineSubtotal * (lineTaxRate / 100);
                  const halfTax = lineTaxAmt / 2;

                  return (
                    <tr key={i}>
                      <td style={{ textAlign: "center" }}>{i + 1}</td>
                      <td>
                        <strong>{l.product?.name ?? l.description ?? "Item"}</strong>
                      </td>
                      <td style={{ textAlign: "center" }}>{l.product?.sku ?? "38109010"}</td>
                      <td style={{ textAlign: "right" }}>{lineQty}</td>
                      <td style={{ textAlign: "right" }}>{linePrice.toFixed(2)}</td>
                      {!isInterState ? (
                        <>
                          <td style={{ textAlign: "right" }}>{halfTax.toFixed(2)}</td>
                          <td style={{ textAlign: "right" }}>{halfTax.toFixed(2)}</td>
                        </>
                      ) : (
                        <td style={{ textAlign: "right" }}>{lineTaxAmt.toFixed(2)}</td>
                      )}
                      <td style={{ textAlign: "right" }}>{(lineSubtotal + lineTaxAmt).toFixed(2)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Bottom Summary Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.4fr", border: "1px solid #000", borderTop: "none" }}>
            <div style={{ padding: 8, borderRight: "1px solid #000", fontSize: 10 }}>
              <div style={{ marginBottom: 10 }}>
                <strong>Total in Words:</strong>
                <div style={{ fontWeight: 700, fontSize: 11, fontStyle: "italic", marginTop: 2, color: "#1e293b" }}>
                  {numberToWordsINR(total || 56640)}
                </div>
              </div>

              <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: 6, marginBottom: 8 }}>
                <strong>Bank Details:</strong>
                <div style={{ marginTop: 2, lineHeight: 1.4 }}>
                  Bank Name: <strong>INDIAN OVERSEAS BANK</strong><br />
                  A/C Name: <strong>OSCAR AUTO FLUX</strong><br />
                  A/C No: <strong>186302000000680</strong> | Branch: <strong>Kangayam</strong><br />
                  IFSC Code: <strong>IOBA0001863</strong>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: 6, fontSize: 9, color: "#475569" }}>
                <strong>Terms & Conditions:</strong>
                <ol style={{ margin: "2px 0 0 14px", padding: 0 }}>
                  <li>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</li>
                  <li>Payment should be made within agreed terms or 18% per annum interest would be charged on the complete invoice.</li>
                </ol>
                <div style={{ marginTop: 2 }}>Disputes if any, subject to Tirupur jurisdiction.</div>
              </div>
            </div>

            <div style={{ fontSize: 11 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #000" }}>
                    <td style={{ padding: "6px 8px", fontWeight: 600 }}>Sub Total:</td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700 }}>₹{subtotal.toFixed(2)}</td>
                  </tr>
                  {!isInterState ? (
                    <>
                      <tr style={{ borderBottom: "1px solid #000" }}>
                        <td style={{ padding: "6px 8px" }}>SGST @ 9%:</td>
                        <td style={{ padding: "6px 8px", textAlign: "right" }}>₹{(tax / 2).toFixed(2)}</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #000" }}>
                        <td style={{ padding: "6px 8px" }}>CGST @ 9%:</td>
                        <td style={{ padding: "6px 8px", textAlign: "right" }}>₹{(tax / 2).toFixed(2)}</td>
                      </tr>
                    </>
                  ) : (
                    <tr style={{ borderBottom: "1px solid #000" }}>
                      <td style={{ padding: "6px 8px" }}>IGST @ 18%:</td>
                      <td style={{ padding: "6px 8px", textAlign: "right" }}>₹{tax.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: "1.5px solid #000", background: "#f8fafc" }}>
                    <td style={{ padding: "8px", fontWeight: 800, fontSize: 12 }}>Total Amount:</td>
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: 800, fontSize: 13, color: "#047857" }}>
                      ₹{total.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ padding: "24px 12px 8px 12px", textAlign: "right" }}>
                <div style={{ fontSize: 11, fontWeight: 700 }}>For Oscar Auto Flux</div>
                <div style={{ height: 36 }} />
                <div style={{ fontSize: 10, color: "#64748b" }}>(Authorized Signatory)</div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 10, borderTop: "2px solid #1e3a8a", paddingTop: 4, textAlign: "center", fontSize: 9, color: "#64748b" }}>
            S.F.No 517/1, Veeranampalayam, Kangeyam, Tiruppur, Tamilnadu – 638701. Phone: +91-8667753591 | Email: info.oscarautoweld@gmail.com
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
// INVOICE TIMELINE HISTORY MODAL
// ─────────────────────────────────────────────────────────
function fmtDateTime(d?: string | Date | null) {
  if (!d) return null;
  const obj = new Date(d);
  if (isNaN(obj.getTime())) return null;
  return obj.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }) + ", " + obj.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function InvoiceTimelineModal({ invoice, onClose }: { invoice: any; onClose: () => void }) {
  const customer = invoice.customer || {};
  const total = Number(invoice.total || 0);
  const paid = Number(invoice.amountPaid || 0);
  const balance = Math.max(0, total - paid);

  const soDate = invoice.salesOrder?.createdAt || invoice.createdAt;
  const pkgDate = invoice.salesOrder?.packages?.[0]?.createdAt || invoice.createdAt;
  const shipDate = invoice.salesOrder?.shipments?.[0]?.shippedAt || invoice.salesOrder?.shipments?.[0]?.createdAt;
  const invDate = invoice.createdAt;
  const payDate = invoice.payments?.[0]?.payment?.createdAt || invoice.allocations?.[0]?.payment?.createdAt || (paid > 0 ? invoice.updatedAt : null);
  const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;

  const timelineEvents = [
    {
      title: "Quotation / Estimate Approved",
      desc: "Estimate pricing & terms approved by customer",
      time: fmtDateTime(soDate) ?? "Date N/A",
      icon: FileCheck,
      color: "#16a34a",
    },
    {
      title: `Sales Order Confirmed`,
      desc: `Sales Order #${invoice.salesOrder?.number || invoice.number.replace("INV", "SO")} confirmed in system`,
      time: fmtDateTime(soDate) ?? "Date N/A",
      icon: ShoppingCart,
      color: "#1565d8",
    },
    {
      title: "Warehouse Fulfillment & Packaging",
      desc: invoice.salesOrder?.packages?.length ? `Package #${invoice.salesOrder.packages[0].number || "1"} prepared` : "Items picked, packed & verified for shipment",
      time: fmtDateTime(pkgDate) ?? "Date N/A",
      icon: Box,
      color: "#0891b2",
    },
    {
      title: `Tax Invoice Generated (${invoice.number})`,
      desc: `Official Tax Invoice issued. Total: ₹${total.toLocaleString("en-IN")}`,
      time: fmtDateTime(invDate) ?? "Date N/A",
      icon: Receipt,
      color: "#7c3aed",
    },
    {
      title: shipDate ? "Shipment Dispatched" : "Dispatch Status",
      desc: invoice.salesOrder?.shipments?.[0]?.trackingNumber
        ? `Carrier: ${invoice.salesOrder.shipments[0].carrier || "Standard"} • Tracking #${invoice.salesOrder.shipments[0].trackingNumber}`
        : "Order ready for dispatch",
      time: fmtDateTime(shipDate) ?? (shipDate ? "Dispatched" : "In Progress"),
      icon: Truck,
      color: shipDate ? "#16a34a" : "#64748b",
    },
    {
      title: paid >= total ? "Payment Fully Settled" : paid > 0 ? "Partial Payment Received" : "Payment Pending",
      desc: paid >= total
        ? `₹${paid.toLocaleString("en-IN")} received in full via Bank / UPI`
        : paid > 0
        ? `₹${paid.toLocaleString("en-IN")} received. Outstanding balance: ₹${balance.toLocaleString("en-IN")}`
        : `Payment expected by ${dueDate ? dueDate.toLocaleDateString("en-IN") : "due date"}. Balance due: ₹${balance.toLocaleString("en-IN")}`,
      time: fmtDateTime(payDate) ?? (paid > 0 ? "Payment Recorded" : "Awaiting Payment"),
      icon: DollarSign,
      color: paid >= total ? "#16a34a" : paid > 0 ? "#d97706" : "#dc2626",
    },
  ];

  return (
    <Modal open onClose={onClose} title={`Invoice Timeline & Audit Lifecycle — ${invoice.number}`} wide>
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Customer & Financial Details */}
        <div className="analytics-grid-2">
          <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Customer Details</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4 }}>{customer.name || "Walk-in Customer"}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.5 }}>
              {customer.phone && <div>📞 {customer.phone}</div>}
              {customer.email && <div>✉️ {customer.email}</div>}
              {customer.gstin && <div>🏛️ GSTIN: <span className="font-mono">{customer.gstin}</span></div>}
              {customer.city && <div>📍 {customer.city}, {customer.state || ""}</div>}
            </div>
          </div>

          <div style={{ background: "#f8fafc", padding: 14, borderRadius: 10, border: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Invoice Financial Summary</span>
              <Badge status={invoice.status} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>TOTAL</div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>{money(total)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>PAID</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: "var(--success)" }}>{money(paid)}</div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 600 }}>BALANCE</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: balance > 0 ? "var(--danger)" : "var(--success)" }}>{money(balance)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Step-by-Step Timeline History with Timings */}
        <div style={{ border: "1px solid var(--border)", borderRadius: 12, padding: 18, background: "#ffffff" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 18, display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={16} color="var(--accent)" /> Detailed Timeline History & Event Timings
          </div>

          <div style={{ position: "relative", paddingLeft: 32, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Timeline vertical bar */}
            <div style={{ position: "absolute", left: 11, top: 8, bottom: 8, width: 2, background: "#e2e8f0" }} />

            {timelineEvents.map((ev, i) => {
              const Icon = ev.icon;
              return (
                <div key={i} style={{ position: "relative", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{
                    position: "absolute", left: -32, top: 0,
                    width: 24, height: 24, borderRadius: "50%",
                    background: ev.color, color: "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 0 4px #fff", zIndex: 2
                  }}>
                    <Icon size={12} />
                  </div>

                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{ev.title}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{ev.desc}</div>
                  </div>

                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", background: "#f8fafc", padding: "4px 9px", borderRadius: 6, border: "1px solid #e2e8f0", whiteSpace: "nowrap" }}>
                    ⏱️ {ev.time}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
// INVOICES PAGE
// ─────────────────────────────────────────────────────────
type Invoice = { id: string; number: string; status: string; total: string; amountPaid: string; dueDate?: string; customerId?: string; customer?: { id: string; name: string } };

export function InvoicesPage() {
  const list = useList<Invoice>("invs", "/invoices");
  const orders = useList<SalesOrder>("so", "/sales-orders");
  const customers = useList<{ id: string; name: string }>("cust", "/customers");
  const qc = useQueryClient();
  const { toast } = useToast();

  const [printInv, setPrintInv] = useState<any>(null);
  const [timelineInv, setTimelineInv] = useState<any>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [invoicingId, setInvoicingId] = useState<string | null>(null);

  const createInvoice = useMutation({
    mutationFn: (orderId: string) => api.post(`/invoices/from-order/${orderId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invs"] });
      qc.invalidateQueries({ queryKey: ["so"] });
      toast("Tax Invoice created successfully!");
    },
    onError: (err: any) => toast(err.response?.data?.message ?? "Could not create invoice.", "error"),
    onSettled: () => setInvoicingId(null),
  });

  const existingInvoicedOrderIds = new Set((list.data ?? []).map((inv: any) => inv.salesOrderId).filter(Boolean));

  const readyToInvoice = (orders.data ?? []).filter(
    (o) =>
      ["CONFIRMED", "SHIPPED", "PACKED", "FULFILLED", "PARTIALLY_FULFILLED"].includes(o.status ?? "") &&
      !existingInvoicedOrderIds.has(o.id),
  );

  // Filter invoices by selected customer
  const allInvoices = list.data ?? [];
  const filteredInvoices = selectedCustomerId
    ? allInvoices.filter((inv) => inv.customerId === selectedCustomerId || inv.customer?.name === (customers.data ?? []).find(c => c.id === selectedCustomerId)?.name)
    : allInvoices;

  // Customer-based analytics summary metrics
  const custTotalSales = filteredInvoices.reduce((sum, inv) => sum + parseFloat(String(inv.total || 0)), 0);
  const custTotalPaid = filteredInvoices.reduce((sum, inv) => sum + parseFloat(String(inv.amountPaid || 0)), 0);
  const custBalanceDue = Math.max(0, custTotalSales - custTotalPaid);

  const selectedCustomerName = (customers.data ?? []).find((c) => c.id === selectedCustomerId)?.name;

  const columns: Column<Invoice>[] = [
    { label: "Invoice #", render: (r) => <strong>{r.number}</strong> },
    { label: "Customer", render: (r) => r.customer?.name ?? "—" },
    { label: "Status", render: (r) => <Badge status={r.status} /> },
    { label: "Due Date", render: (r) => r.dueDate ? new Date(r.dueDate).toLocaleDateString() : "—" },
    { label: "Total", align: "right", render: (r) => <strong>{money(Number(r.total))}</strong> },
    {
      label: "Amount Paid", align: "right",
      render: (r) => <span style={{ color: "var(--success)" }}>{money(Number(r.amountPaid))}</span>,
    },
    {
      label: "Balance Due", align: "right",
      render: (r) => {
        const bal = Number(r.total) - Number(r.amountPaid);
        return <span style={{ color: bal > 0 ? "var(--danger)" : "var(--success)", fontWeight: 700 }}>{money(bal)}</span>;
      },
    },
    {
      label: "Actions",
      align: "right",
      render: (r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); setTimelineInv(r); }}>
            <Clock size={13} color="var(--accent)" /> Timeline
          </button>
          <button className="btn btn-secondary btn-sm" onClick={(e) => { e.stopPropagation(); setPrintInv(r); }}>
            <Printer size={13} /> Print
          </button>
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <PageHeader title="Invoices & Analytics" subtitle="Customer tax invoices, analytics breakdown & audit timeline history" />

      {/* ── Customer-Based Analytics Filter & Summary Bar ── */}
      <div className="card" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Users size={18} color="var(--accent)" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>
              {selectedCustomerName ? `Customer Analytics — ${selectedCustomerName}` : "Customer Analytics Overview"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)" }}>Filter Customer:</label>
            <select
              className="input-field"
              style={{ width: 220, fontSize: 13 }}
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
            >
              <option value="">All Customers Analytics</option>
              {(customers.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Customer Analytics KPI Cards */}
        <div className="analytics-kpi-grid">
          <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Invoices Count</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2, color: "var(--accent)" }}>{filteredInvoices.length}</div>
          </div>
          <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: 10, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Total Sales Amount</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{money(custTotalSales)}</div>
          </div>
          <div style={{ background: "#f0fdf4", padding: "12px 16px", borderRadius: 10, border: "1px solid #bbf7d0" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#16a34a", textTransform: "uppercase" }}>Amount Collected</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2, color: "#16a34a" }}>{money(custTotalPaid)}</div>
          </div>
          <div style={{ background: "#fef2f2", padding: "12px 16px", borderRadius: 10, border: "1px solid #fecaca" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase" }}>Outstanding Balance</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2, color: "#dc2626" }}>{money(custBalanceDue)}</div>
          </div>
        </div>
      </div>

      {/* ── Section: Shipped / Confirmed Orders Ready for Invoicing ── */}
      <div className="card">
        <div className="card-header" style={{ background: "#f8fafc" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={18} color="var(--accent)" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Orders Ready for Invoicing</span>
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
            {readyToInvoice.length} order{readyToInvoice.length !== 1 ? "s" : ""} waiting
          </span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {readyToInvoice.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              ✓ All orders are invoiced! No pending orders waiting for invoicing.
            </div>
          ) : (
            <div className="data-table-wrap" style={{ border: "none", borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th style={{ textAlign: "right" }}>Total Amount</th>
                    <th>Fulfillment Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {readyToInvoice.map((o) => {
                    const isThisRowLoading = invoicingId === o.id;
                    return (
                      <tr key={o.id}>
                        <td><strong>{o.number}</strong></td>
                        <td>{o.customer?.name ?? "—"}</td>
                        <td style={{ textAlign: "right" }}><strong>{money(Number(o.total))}</strong></td>
                        <td><Badge status={o.status} /></td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="btn btn-primary btn-sm"
                            disabled={!!invoicingId}
                            onClick={() => {
                              setInvoicingId(o.id);
                              createInvoice.mutate(o.id);
                            }}
                          >
                            {isThisRowLoading ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <FileText size={13} />}
                            Create Invoice
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Invoices History Table ── */}
      <div className="card">
        <div className="card-header">
          <span style={{ fontWeight: 600 }}>
            {selectedCustomerName ? `Invoices for ${selectedCustomerName}` : "All Customer Invoices"}
          </span>
        </div>
        <DataTable
          columns={columns}
          data={filteredInvoices}
          loading={list.isLoading}
          error={list.error}
          searchFields={["number"]}
          emptyIcon={<Receipt size={48} />}
          emptyText="No customer invoices found"
          onRowClick={(row) => setTimelineInv(row)}
        />
      </div>

      {/* Printable Invoice Modal */}
      {printInv && <PrintInvoiceModal invoice={printInv} onClose={() => setPrintInv(null)} />}

      {/* Timeline Audit History Modal */}
      {timelineInv && <InvoiceTimelineModal invoice={timelineInv} onClose={() => setTimelineInv(null)} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PAYMENTS PAGE
// ─────────────────────────────────────────────────────────
type Payment = { id: string; amount: string; method: string; status: string; customer?: { name: string }; createdAt?: string };
type InvoiceForPay = { id: string; number: string; customerId: string; total: string; amountPaid: string };

export function PaymentsPage() {
  const list = useList<Payment>("pay", "/payments");
  const invoices = useList<InvoiceForPay & { customer?: { name: string } }>("invs", "/invoices");
  const qc = useQueryClient();
  const { toast } = useToast();

  const [payModalInv, setPayModalInv] = useState<(InvoiceForPay & { customer?: { name: string } }) | null>(null);
  const [payForm, setPayForm] = useState({ amount: "", method: "BANK" });

  const recordPayment = useMutation({
    mutationFn: async (inv: InvoiceForPay) => {
      const amt = Number(payForm.amount) || (Number(inv.total) - Number(inv.amountPaid));
      if (!amt || amt <= 0) throw new Error("Please enter a valid payment amount.");
      return api.post("/payments", {
        customerId: inv.customerId,
        amount: amt,
        method: payForm.method,
        allocations: [{ invoiceId: inv.id, amount: amt }],
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pay"] });
      qc.invalidateQueries({ queryKey: ["invs"] });
      qc.invalidateQueries({ queryKey: ["so"] });
      setPayModalInv(null);
      toast("Customer payment recorded successfully!");
    },
    onError: (err: any) => toast(err.response?.data?.message ?? err.message ?? "Could not record payment.", "error"),
  });

  const openInvoices = (invoices.data ?? []).filter((i) => Number(i.total) - Number(i.amountPaid) > 0);

  const columns: Column<Payment>[] = [
    { label: "Customer", render: (r) => <strong>{r.customer?.name ?? "—"}</strong> },
    { label: "Amount Collected", align: "right", render: (r) => <strong style={{ color: "var(--success)" }}>{money(Number(r.amount))}</strong> },
    { label: "Payment Method", render: (r) => <span className="badge badge-confirmed">{r.method}</span> },
    { label: "Status", render: (r) => <Badge status={r.status} /> },
    { label: "Date Received", render: (r) => r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Payments Received" subtitle="Record customer payments & track receipts" />

      {/* ── Section: Invoices Awaiting Payment Collection ── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ background: "#f0fdf4" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <DollarSign size={18} color="#16a34a" />
            <span style={{ fontWeight: 600, fontSize: 14 }}>Invoices Awaiting Payment Collection</span>
          </div>
          <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>
            {openInvoices.length} invoice{openInvoices.length !== 1 ? "s" : ""} open
          </span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {openInvoices.length === 0 ? (
            <div style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              ✓ All customer invoices are fully paid! No outstanding receivables waiting.
            </div>
          ) : (
            <div className="data-table-wrap" style={{ border: "none", borderRadius: 0 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Customer</th>
                    <th style={{ textAlign: "right" }}>Invoice Total</th>
                    <th style={{ textAlign: "right" }}>Amount Paid</th>
                    <th style={{ textAlign: "right" }}>Balance Due</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {openInvoices.map((inv) => {
                    const due = Number(inv.total) - Number(inv.amountPaid);
                    return (
                      <tr key={inv.id}>
                        <td><strong>{inv.number}</strong></td>
                        <td>{inv.customer?.name ?? "—"}</td>
                        <td style={{ textAlign: "right" }}>{money(Number(inv.total))}</td>
                        <td style={{ textAlign: "right", color: "var(--success)" }}>{money(Number(inv.amountPaid))}</td>
                        <td style={{ textAlign: "right" }}><strong style={{ color: "var(--danger)" }}>{money(due)}</strong></td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => {
                              setPayForm({ amount: String(due), method: "BANK" });
                              setPayModalInv(inv);
                            }}
                          >
                            <DollarSign size={13} /> Collect Payment
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Customer Payments History Table ── */}
      <div className="card">
        <div className="card-header">
          <span style={{ fontWeight: 600 }}>Payment Receipt History</span>
        </div>
        <DataTable
          columns={columns}
          data={list.data ?? []}
          loading={list.isLoading}
          error={list.error}
          searchFields={["method"]}
          emptyIcon={<DollarSign size={48} />}
          emptyText="No payment receipts recorded yet"
        />
      </div>

      {/* ── Record Payment Modal ── */}
      <Modal
        open={!!payModalInv}
        onClose={() => setPayModalInv(null)}
        title={`Record Payment — Invoice ${payModalInv?.number ?? ""}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setPayModalInv(null)}>Cancel</button>
            <button
              className="btn btn-success"
              disabled={recordPayment.isPending || !payForm.amount}
              onClick={() => payModalInv && recordPayment.mutate(payModalInv)}
            >
              {recordPayment.isPending && <span className="spinner" style={{ width: 14, height: 14 }} />}
              <DollarSign size={14} /> Record Payment
            </button>
          </>
        }
      >
        {payModalInv && (
          <div>
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Customer</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{payModalInv.customer?.name ?? "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Invoice Total</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{money(Number(payModalInv.total))}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Amount Paid</div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, color: "var(--success)" }}>{money(Number(payModalInv.amountPaid))}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>Balance Due</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2, color: "var(--danger)" }}>{money(Number(payModalInv.total) - Number(payModalInv.amountPaid))}</div>
              </div>
            </div>

            <div className="form-grid form-grid-2">
              <InputGroup label="Collection Amount (₹) *">
                <input
                  className="input-field"
                  type="number"
                  min="1"
                  max={Number(payModalInv.total) - Number(payModalInv.amountPaid)}
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                  required
                />
              </InputGroup>
              <InputGroup label="Payment Method *">
                <select
                  className="input-field"
                  value={payForm.method}
                  onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                >
                  <option value="BANK">Bank Transfer</option>
                  <option value="UPI">UPI</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                </select>
              </InputGroup>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PURCHASE ORDERS PAGE
// ─────────────────────────────────────────────────────────
type PurchaseOrder = { id: string; number: string; status: string; total: string; vendor?: { name: string }; lines?: { productId: string; quantity: string }[] };

export function PurchaseOrdersPage() {
  const list = useList<PurchaseOrder>("po", "/purchase-orders");
  const vendors = useList<{ id: string; name: string }>("vendors", "/vendors");
  const warehouses = useList<{ id: string; name: string }>("wh", "/warehouses");
  const products = useList<{ id: string; name: string; costPrice?: number; taxRate?: number }>("products", "/products");
  const qc = useQueryClient();
  const { toast } = useToast();

  const [view, setView] = useState<"table" | "kanban">("table");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ vendorId: "", warehouseId: "" });
  const [lines, setLines] = useState<LineItem[]>([{ productId: "", quantity: 1, unitPrice: 0, taxRate: 0 }]);

  const create = useMutation({
    mutationFn: () => {
      const validLines = lines.filter((l) => l.productId && l.quantity > 0);
      if (!form.vendorId) throw new Error("Please select a vendor.");
      if (!form.warehouseId) throw new Error("Please select a warehouse.");
      if (!validLines.length) throw new Error("Please add at least one item line.");
      return api.post("/purchase-orders", {
        vendorId: form.vendorId,
        warehouseId: form.warehouseId,
        lines: validLines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitCost: l.unitPrice,
          taxRate: l.taxRate,
        })),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["po"] });
      setOpen(false);
      setLines([{ productId: "", quantity: 1, unitPrice: 0, taxRate: 0 }]);
      toast("Purchase order created successfully");
    },
    onError: (err: any) => toast(err.response?.data?.message ?? err.message ?? "Could not create purchase order.", "error"),
  });

  const receive = useMutation({
    mutationFn: (row: PurchaseOrder) => api.post(`/purchase-orders/${row.id}/receive`, { lines: (row.lines ?? []).map((l) => ({ productId: l.productId, quantity: Number(l.quantity) })) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["po"] }); qc.invalidateQueries({ queryKey: ["inv"] }); toast("Stock received & inventory updated"); },
    onError: (err: any) => toast(err.response?.data?.message ?? "Could not receive stock.", "error"),
  });

  const columns: Column<PurchaseOrder>[] = [
    { label: "PO Number", render: (r) => <strong>{r.number}</strong> },
    { label: "Vendor", render: (r) => r.vendor?.name ?? "—" },
    { label: "Status", render: (r) => <Badge status={r.status} /> },
    { label: "Total", align: "right", render: (r) => <strong>{money(Number(r.total))}</strong> },
    {
      label: "Actions", align: "right",
      render: (r) => (r.status === "ISSUED" || r.status === "OPEN" || r.status === "DRAFT") ? (
        <button className="btn btn-success btn-sm" onClick={(e) => { e.stopPropagation(); receive.mutate(r); }} disabled={receive.isPending}>
          <Download size={12} /> Receive Stock
        </button>
      ) : null,
    },
  ];

  const allPOs = list.data ?? [];
  const kanbanCols: KanbanCol<PurchaseOrder>[] = [
    { id: "DRAFT", title: "Draft Orders", badgeStatus: "DRAFT", color: "#94a3b8", items: allPOs.filter((o) => o.status === "DRAFT") },
    { id: "ISSUED", title: "Issued / Sent", badgeStatus: "ISSUED", color: "#3b82f6", items: allPOs.filter((o) => o.status === "ISSUED" || o.status === "OPEN") },
    { id: "RECEIVED", title: "Received Stock", badgeStatus: "RECEIVED", color: "#10b981", items: allPOs.filter((o) => o.status === "RECEIVED" || o.status === "BILLED" || o.status === "COMPLETED") },
  ];

  const handleKanbanDrop = (itemId: string, targetStatus: string) => {
    const po = allPOs.find((o) => o.id === itemId);
    if (!po) return;
    if (targetStatus === "RECEIVED" && (po.status === "ISSUED" || po.status === "OPEN" || po.status === "DRAFT")) {
      receive.mutate(po);
    } else {
      toast(`Status flow to ${targetStatus} is updated on stock receive`, "warn");
    }
  };

  const canSubmit = form.vendorId && form.warehouseId && lines.some((l) => l.productId && l.quantity > 0);

  return (
    <div>
      <PageHeader title="Purchase Orders" subtitle="Supplier orders & drag-and-drop workflow tracking">
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ background: "#e2e8f0", borderRadius: 8, padding: 3, display: "flex", gap: 2 }}>
            <button
              className={`btn btn-sm ${view === "table" ? "btn-primary" : "btn-secondary"}`}
              style={{ border: "none", padding: "5px 10px" }}
              onClick={() => setView("table")}
            >
              <List size={14} /> Table
            </button>
            <button
              className={`btn btn-sm ${view === "kanban" ? "btn-primary" : "btn-secondary"}`}
              style={{ border: "none", padding: "5px 10px" }}
              onClick={() => setView("kanban")}
            >
              <Kanban size={14} /> Drag & Drop Board
            </button>
          </div>

          <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={15} /> New PO</button>
        </div>
      </PageHeader>

      {view === "table" ? (
        <div className="card">
          <DataTable columns={columns} data={allPOs} loading={list.isLoading} error={list.error} searchFields={["number"]} emptyIcon={<ClipboardList size={48} />} emptyText="No purchase orders yet" />
        </div>
      ) : (
        <KanbanBoard columns={kanbanCols} onDrop={handleKanbanDrop} />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create Purchase Order with Multiple Items"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={create.isPending || !canSubmit} onClick={() => create.mutate()}>
              {create.isPending && <span className="spinner" style={{ width: 14, height: 14 }} />} Create PO
            </button>
          </>
        }
      >
        <div className="form-grid form-grid-2" style={{ marginBottom: 16 }}>
          <InputGroup label="Vendor *">
            <select className="input-field" value={form.vendorId} onChange={(e) => setForm({ ...form, vendorId: e.target.value })} required>
              <option value="">Select vendor…</option>
              {(vendors.data ?? []).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </InputGroup>
          <InputGroup label="Receiving Warehouse *">
            <select className="input-field" value={form.warehouseId} onChange={(e) => setForm({ ...form, warehouseId: e.target.value })} required>
              <option value="">Select warehouse…</option>
              {(warehouses.data ?? []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </InputGroup>
        </div>

        <LineItemBuilder lines={lines} onChange={setLines} products={products.data ?? []} mode="purchasing" />

        {(!vendors.data?.length || !warehouses.data?.length || !products.data?.length) && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#fef3c7", borderRadius: 8, fontSize: 12, color: "#92400e" }}>
            ⚠️ Make sure you have created at least one Vendor, Warehouse, and Item before creating a Purchase Order.
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SALES RETURNS PAGE
// ─────────────────────────────────────────────────────────
type SalesReturnRow = {
  id: string;
  number: string;
  customerId: string;
  warehouseId: string;
  status: string;
  reason?: string;
  createdAt: string;
};

export function SalesReturnsPage() {
  const list = useList<SalesReturnRow>("sales-returns", "/sales-returns");
  const customers = useList<{ id: string; name: string }>("customers", "/customers");
  const warehouses = useList<{ id: string; name: string }>("wh", "/warehouses");
  const products = useList<{ id: string; name: string }>("products", "/products");
  const salesOrders = useList<{ id: string; number: string }>("so", "/sales-orders");

  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    warehouseId: "",
    salesOrderId: "",
    productId: "",
    quantity: "1",
    reason: "",
  });

  const create = useMutation({
    mutationFn: () =>
      api.post("/sales-returns", {
        customerId: form.customerId,
        warehouseId: form.warehouseId,
        salesOrderId: form.salesOrderId || undefined,
        reason: form.reason || undefined,
        lines: [{ productId: form.productId, quantity: Number(form.quantity) }],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales-returns"] });
      qc.invalidateQueries({ queryKey: ["inv"] });
      setOpen(false);
      toast("Sales return created");
      setForm({ customerId: "", warehouseId: "", salesOrderId: "", productId: "", quantity: "1", reason: "" });
    },
    onError: (err: any) =>
      toast(err?.response?.data?.message ?? "Could not create sales return.", "error"),
  });

  const customerMap = Object.fromEntries((customers.data ?? []).map((c) => [c.id, c.name]));
  const whMap = Object.fromEntries((warehouses.data ?? []).map((w) => [w.id, w.name]));

  const columns: Column<SalesReturnRow>[] = [
    { label: "Number", render: (r) => <strong>{r.number}</strong> },
    { label: "Customer", render: (r) => customerMap[r.customerId] ?? r.customerId },
    { label: "Warehouse", render: (r) => whMap[r.warehouseId] ?? r.warehouseId },
    { label: "Reason", render: (r) => r.reason ?? "—" },
    { label: "Status", render: (r) => <Badge status={r.status} /> },
    { label: "Date", render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—") },
  ];

  return (
    <div>
      <PageHeader title="Sales Returns" subtitle="Process returned goods from customers">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={15} /> New Sales Return
        </button>
      </PageHeader>
      <div className="card">
        <DataTable
          columns={columns}
          data={list.data ?? []}
          loading={list.isLoading}
          error={list.error}
          searchFields={["number", "reason"]}
          emptyIcon={<RotateCcw size={48} />}
          emptyText="No sales returns yet"
        />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Sales Return"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={create.isPending || !form.customerId || !form.warehouseId || !form.productId || Number(form.quantity) <= 0}
              onClick={() => create.mutate()}
            >
              {create.isPending && <span className="spinner" style={{ width: 14, height: 14 }} />} Create Return
            </button>
          </>
        }
      >
        <div className="form-grid form-grid-2">
          <InputGroup label="Customer">
            <select
              className="input-field"
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
            >
              <option value="">Select customer…</option>
              {(customers.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </InputGroup>

          <InputGroup label="Warehouse">
            <select
              className="input-field"
              value={form.warehouseId}
              onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
            >
              <option value="">Select warehouse…</option>
              {(warehouses.data ?? []).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </InputGroup>

          <InputGroup label="Sales Order (Optional)">
            <select
              className="input-field"
              value={form.salesOrderId}
              onChange={(e) => setForm({ ...form, salesOrderId: e.target.value })}
            >
              <option value="">Select order (optional)…</option>
              {(salesOrders.data ?? []).map((so) => (
                <option key={so.id} value={so.id}>
                  {so.number}
                </option>
              ))}
            </select>
          </InputGroup>

          <InputGroup label="Returned Item">
            <select
              className="input-field"
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">Select item…</option>
              {(products.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </InputGroup>

          <InputGroup label="Return Quantity">
            <input
              className="input-field"
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </InputGroup>

          <InputGroup label="Reason for Return">
            <input
              className="input-field"
              placeholder="e.g. Customer requested refund/exchange"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </InputGroup>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// PURCHASE RETURNS PAGE
// ─────────────────────────────────────────────────────────
type PurchaseReturnRow = {
  id: string;
  number: string;
  vendorId: string;
  warehouseId: string;
  status: string;
  reason?: string;
  createdAt: string;
};

export function PurchaseReturnsPage() {
  const list = useList<PurchaseReturnRow>("purchase-returns", "/purchase-returns");
  const vendors = useList<{ id: string; name: string }>("vendors", "/vendors");
  const warehouses = useList<{ id: string; name: string }>("wh", "/warehouses");
  const products = useList<{ id: string; name: string }>("products", "/products");
  const pos = useList<{ id: string; number: string }>("po", "/purchase-orders");

  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    vendorId: "",
    warehouseId: "",
    purchaseOrderId: "",
    productId: "",
    quantity: "1",
    reason: "",
  });

  const create = useMutation({
    mutationFn: () =>
      api.post("/purchase-returns", {
        vendorId: form.vendorId,
        warehouseId: form.warehouseId,
        purchaseOrderId: form.purchaseOrderId || undefined,
        reason: form.reason || undefined,
        lines: [{ productId: form.productId, quantity: Number(form.quantity) }],
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchase-returns"] });
      qc.invalidateQueries({ queryKey: ["inv"] });
      setOpen(false);
      toast("Purchase return created & stock deducted");
      setForm({ vendorId: "", warehouseId: "", purchaseOrderId: "", productId: "", quantity: "1", reason: "" });
    },
    onError: (err: any) =>
      toast(err?.response?.data?.message ?? "Could not create purchase return.", "error"),
  });

  const vendorMap = Object.fromEntries((vendors.data ?? []).map((v) => [v.id, v.name]));
  const whMap = Object.fromEntries((warehouses.data ?? []).map((w) => [w.id, w.name]));

  const columns: Column<PurchaseReturnRow>[] = [
    { label: "Number", render: (r) => <strong>{r.number}</strong> },
    { label: "Vendor", render: (r) => vendorMap[r.vendorId] ?? r.vendorId },
    { label: "Warehouse", render: (r) => whMap[r.warehouseId] ?? r.warehouseId },
    { label: "Reason", render: (r) => r.reason ?? "—" },
    { label: "Status", render: (r) => <Badge status={r.status} /> },
    { label: "Date", render: (r) => (r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—") },
  ];

  return (
    <div>
      <PageHeader title="Purchase Returns" subtitle="Return defective or excess stock to vendors">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={15} /> New Purchase Return
        </button>
      </PageHeader>
      <div className="card">
        <DataTable
          columns={columns}
          data={list.data ?? []}
          loading={list.isLoading}
          error={list.error}
          searchFields={["number", "reason"]}
          emptyIcon={<RotateCcw size={48} />}
          emptyText="No purchase returns yet"
        />
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Purchase Return"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={create.isPending || !form.vendorId || !form.warehouseId || !form.productId || Number(form.quantity) <= 0}
              onClick={() => create.mutate()}
            >
              {create.isPending && <span className="spinner" style={{ width: 14, height: 14 }} />} Create Return
            </button>
          </>
        }
      >
        <div className="form-grid form-grid-2">
          <InputGroup label="Vendor">
            <select
              className="input-field"
              value={form.vendorId}
              onChange={(e) => setForm({ ...form, vendorId: e.target.value })}
            >
              <option value="">Select vendor…</option>
              {(vendors.data ?? []).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </InputGroup>

          <InputGroup label="Warehouse">
            <select
              className="input-field"
              value={form.warehouseId}
              onChange={(e) => setForm({ ...form, warehouseId: e.target.value })}
            >
              <option value="">Select warehouse…</option>
              {(warehouses.data ?? []).map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </InputGroup>

          <InputGroup label="Purchase Order (Optional)">
            <select
              className="input-field"
              value={form.purchaseOrderId}
              onChange={(e) => setForm({ ...form, purchaseOrderId: e.target.value })}
            >
              <option value="">Select order (optional)…</option>
              {(pos.data ?? []).map((po) => (
                <option key={po.id} value={po.id}>
                  {po.number}
                </option>
              ))}
            </select>
          </InputGroup>

          <InputGroup label="Item to Return">
            <select
              className="input-field"
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
            >
              <option value="">Select item…</option>
              {(products.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </InputGroup>

          <InputGroup label="Return Quantity">
            <input
              className="input-field"
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
            />
          </InputGroup>

          <InputGroup label="Reason for Return">
            <input
              className="input-field"
              placeholder="e.g. Damaged or defective items"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
            />
          </InputGroup>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SIMPLE LIST PAGE (bills, returns, etc.)
// ─────────────────────────────────────────────────────────
export function SimpleListPage({ title, path, headers, map }: { title: string; path: string; headers: string[]; map: (row: Record<string, unknown>) => ReactNode[] }) {
  const list = useQuery({ queryKey: [path], queryFn: async () => (await api.get(path)).data });
  const rows = Array.isArray(list.data) ? list.data : (list.data?.data ?? []);

  return (
    <div>
      <PageHeader title={title} />
      <div className="card">
        {list.isLoading && (
          <div style={{ padding: "60px 0", textAlign: "center" }}>
            <div className="spinner" style={{ width: 28, height: 28, color: "var(--accent)", margin: "0 auto" }} />
          </div>
        )}
        {!list.isLoading && rows.length === 0 && (
          <div className="empty-state"><FileText size={48} style={{ opacity: 0.3 }} /><div className="empty-state-title">No records found</div></div>
        )}
        {rows.length > 0 && (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((row: Record<string, unknown>, i: number) => (
                  <tr key={i}>{map(row).map((cell, j) => <td key={j}>{typeof cell === "string" ? (cell.match(/^(DRAFT|OPEN|CONFIRMED|SHIPPED|PAID|PARTIAL|CANCELLED|RECEIVED|BILLED|ISSUED)$/i) ? <Badge status={cell} /> : cell) : cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// REPORTS PAGE
// ─────────────────────────────────────────────────────────
export function ReportsPage() {
  const inv = useQuery({ queryKey: ["rep-inv"], queryFn: async () => (await api.get("/reports/inventory")).data });
  const low = useQuery({ queryKey: ["rep-low"], queryFn: async () => (await api.get("/reports/low-stock")).data });

  return (
    <div>
      <PageHeader title="Reports" subtitle="Inventory analytics & insights" />
      <div style={{ display: "grid", gap: 24 }}>
        {/* Inventory valuation */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 600 }}>Inventory Valuation</span>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Cost × Quantity on hand</span>
          </div>
          {inv.isLoading ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}><div className="spinner" style={{ width: 24, height: 24, color: "var(--accent)", margin: "0 auto" }} /></div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>SKU</th><th>Item</th><th>Warehouse</th><th style={{ textAlign: "right" }}>Qty</th><th style={{ textAlign: "right" }}>Value</th></tr></thead>
                <tbody>
                  {(inv.data ?? []).map((r: { sku: string; name: string; warehouse: string; quantity: number; value: number }, i: number) => (
                    <tr key={i}>
                      <td><span className="font-mono" style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>{r.sku}</span></td>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td>{r.warehouse}</td>
                      <td style={{ textAlign: "right" }}>{r.quantity}</td>
                      <td style={{ textAlign: "right" }}><strong>{money(r.value)}</strong></td>
                    </tr>
                  ))}
                  {(inv.data ?? []).length === 0 && <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--text-muted)", padding: "30px 0" }}>No inventory data.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low stock */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} color="var(--warning)" />
              <span style={{ fontWeight: 600 }}>Low Stock Alerts</span>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Items below reorder level</span>
          </div>
          {low.isLoading ? (
            <div style={{ padding: "40px 0", textAlign: "center" }}><div className="spinner" style={{ width: 24, height: 24, color: "var(--accent)", margin: "0 auto" }} /></div>
          ) : (
            <div className="data-table-wrap">
              <table className="data-table">
                <thead><tr><th>SKU</th><th>Item</th><th style={{ textAlign: "right" }}>Available</th><th style={{ textAlign: "right" }}>Reorder Level</th></tr></thead>
                <tbody>
                  {(low.data ?? []).map((r: { sku: string; name: string; available: number; reorderLevel?: number }, i: number) => (
                    <tr key={i}>
                      <td><span className="font-mono" style={{ background: "#fee2e2", padding: "2px 6px", borderRadius: 4, fontSize: 11, color: "var(--danger)" }}>{r.sku}</span></td>
                      <td style={{ fontWeight: 600 }}>{r.name}</td>
                      <td style={{ textAlign: "right" }}><span style={{ color: "var(--danger)", fontWeight: 700 }}>{r.available}</span></td>
                      <td style={{ textAlign: "right", color: "var(--text-muted)" }}>{r.reorderLevel ?? "—"}</td>
                    </tr>
                  ))}
                  {(low.data ?? []).length === 0 && <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--text-muted)", padding: "30px 0" }}>✓ All items are well-stocked.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// USERS PAGE
// ─────────────────────────────────────────────────────────
type User = { id: string; firstName: string; lastName: string; email: string; isActive: boolean };

export function UsersPage() {
  const list = useQuery({ queryKey: ["users"], queryFn: async () => (await api.get("/users")).data });
  const users: User[] = list.data ?? [];

  const columns: Column<User>[] = [
    {
      label: "User",
      render: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
            {r.firstName?.[0]}{r.lastName?.[0]}
          </div>
          <span style={{ fontWeight: 600 }}>{r.firstName} {r.lastName}</span>
        </div>
      ),
    },
    { label: "Email", render: (r) => <a href={`mailto:${r.email}`} className="link">{r.email}</a> },
    { label: "Status", render: (r) => <Badge status={r.isActive !== false ? "active" : "inactive"} /> },
  ];

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage team members and access">
      </PageHeader>
      <div className="card">
        <DataTable columns={columns} data={users} loading={list.isLoading} error={list.error} searchFields={["firstName", "lastName", "email"]} emptyIcon={<UserCog size={48} />} emptyText="No users found" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SETTINGS PAGE
// ─────────────────────────────────────────────────────────
export function SettingsPage() {
  const org = useQuery({ queryKey: ["org"], queryFn: async () => (await api.get("/organization")).data });

  return (
    <div>
      <PageHeader title="Settings" subtitle="Organization configuration" />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <span style={{ fontWeight: 600 }}>Organization Details</span>
          </div>
          <div className="card-body">
            {org.isLoading ? (
              <div className="spinner" style={{ width: 24, height: 24, color: "var(--accent)" }} />
            ) : org.data ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  { label: "Organization Name", value: org.data.name },
                  { label: "Slug", value: org.data.slug },
                  { label: "Allow Negative Stock", value: org.data.allowNegativeStock ? "Yes" : "No" },
                  { label: "Default Currency", value: org.data.currency ?? "INR" },
                  { label: "Timezone", value: org.data.timezone ?? "Asia/Kolkata" },
                ].map(({ label, value }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 12 }}>
                    <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Could not load organization data.</p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span style={{ fontWeight: 600 }}>Quick Stats</span></div>
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "System Status", value: "Operational", color: "var(--success)" },
                { label: "Database", value: "MongoDB Atlas", color: "var(--accent)" },
                { label: "API Version", value: "v1.0", color: "var(--text-secondary)" },
                { label: "Environment", value: "Production", color: "var(--text-secondary)" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// BILLS PAGE  (Purchase billing — vendor invoices)
// ─────────────────────────────────────────────────────────
type Bill = {
  id: string;
  number: string;
  status: string;
  total: string;
  amountPaid: string;
  dueDate?: string;
  vendor?: { id: string; name: string };
  purchaseOrderId?: string;
  createdAt?: string;
};

type BillPO = { id: string; number: string; status: string; vendor?: { name: string }; total: string };

export function BillsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const bills = useList<Bill>("bills", "/bills");
  const pos = useList<BillPO>("po", "/purchase-orders");

  // Pay-bill modal state
  const [payModal, setPayModal] = useState<Bill | null>(null);
  const [payForm, setPayForm] = useState({ amount: "", method: "BANK" });

  // Create-bill modal state
  const [billModal, setBillModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState("");

  // Create bill from PO
  const createBill = useMutation({
    mutationFn: () => api.post(`/bills/from-order/${selectedPO}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills"] });
      setBillModal(false);
      setSelectedPO("");
      toast("Bill created successfully");
    },
    onError: () => toast("Could not create bill. PO may already be billed.", "error"),
  });

  // Pay a bill
  const payBill = useMutation({
    mutationFn: (bill: Bill) =>
      api.post(`/bills/${bill.id}/pay`, {
        vendorId: bill.vendor?.id ?? "",
        amount: Number(payForm.amount),
        method: payForm.method,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills"] });
      setPayModal(null);
      setPayForm({ amount: "", method: "BANK" });
      toast("Vendor payment recorded");
    },
    onError: () => toast("Could not record payment.", "error"),
  });

  // Summary metrics
  const billData = bills.data ?? [];
  const totalBilled = billData.reduce((s, b) => s + Number(b.total), 0);
  const totalPaid   = billData.reduce((s, b) => s + Number(b.amountPaid), 0);
  const totalDue    = totalBilled - totalPaid;
  const overdueCnt  = billData.filter((b) => b.status !== "PAID" && b.dueDate && new Date(b.dueDate) < new Date()).length;

  // Billable POs (received but not yet fully billed)
  const billablePOs = (pos.data ?? []).filter((p) => p.status === "RECEIVED" || p.status === "PARTIALLY_BILLED");

  const columns: Column<Bill>[] = [
    {
      label: "Bill #",
      render: (r) => <strong style={{ fontFamily: "monospace", fontSize: 13 }}>{r.number}</strong>,
    },
    {
      label: "Vendor",
      render: (r) => (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={13} color="#166534" />
          </div>
          <span style={{ fontWeight: 600 }}>{r.vendor?.name ?? "—"}</span>
        </div>
      ),
    },
    { label: "Status", render: (r) => <Badge status={r.status} /> },
    {
      label: "Due Date",
      render: (r) => {
        if (!r.dueDate) return "—";
        const overdue = r.status !== "PAID" && new Date(r.dueDate) < new Date();
        return (
          <span style={{ color: overdue ? "var(--danger)" : "var(--text-secondary)", fontWeight: overdue ? 700 : 400 }}>
            {overdue && <AlertTriangle size={11} style={{ marginRight: 4 }} />}
            {new Date(r.dueDate).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      label: "Bill Amount",
      align: "right",
      render: (r) => <strong>{money(Number(r.total))}</strong>,
    },
    {
      label: "Amount Paid",
      align: "right",
      render: (r) => <span style={{ color: "var(--success)" }}>{money(Number(r.amountPaid))}</span>,
    },
    {
      label: "Balance Due",
      align: "right",
      render: (r) => {
        const bal = Number(r.total) - Number(r.amountPaid);
        return (
          <span style={{ color: bal > 0 ? "var(--danger)" : "var(--success)", fontWeight: 700 }}>
            {money(bal)}
          </span>
        );
      },
    },
    {
      label: "",
      align: "right",
      render: (r) => {
        const due = Number(r.total) - Number(r.amountPaid);
        if (due <= 0) return <span style={{ color: "var(--success)", fontSize: 12 }}>✓ Paid</span>;
        return (
          <button
            className="btn btn-primary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setPayForm({ amount: String(due), method: "BANK" });
              setPayModal(r);
            }}
          >
            <CreditCard size={12} /> Pay
          </button>
        );
      },
    },
  ];

  return (
    <div>
      <PageHeader title="Bills" subtitle="Vendor bills & payment tracking">
        <button className="btn btn-secondary" onClick={() => setBillModal(true)} disabled={billablePOs.length === 0}>
          <Plus size={15} /> Bill from PO
        </button>
      </PageHeader>

      {/* Summary metric bar */}
      <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 20 }}>
        <MetricCard label="Total Billed" value={money(totalBilled)} icon={FileText} color="#7c3aed" />
        <MetricCard label="Amount Paid" value={money(totalPaid)} icon={CheckCircle} color="#16a34a" />
        <MetricCard label="Balance Due" value={money(totalDue)} icon={CreditCard} color="#dc2626" />
        <MetricCard label="Overdue Bills" value={overdueCnt} icon={AlertTriangle} color="#d97706" />
      </div>

      {/* Bills table */}
      <div className="card">
        <DataTable
          columns={columns}
          data={billData}
          loading={bills.isLoading}
          error={bills.error}
          searchFields={["number"]}
          emptyIcon={<FileText size={48} />}
          emptyText="No bills yet. Create a bill from a received purchase order."
        />
      </div>

      {/* ── Create bill from PO modal ── */}
      <Modal
        open={billModal}
        onClose={() => setBillModal(false)}
        title="Create Bill from Purchase Order"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setBillModal(false)}>Cancel</button>
            <button
              className="btn btn-primary"
              disabled={!selectedPO || createBill.isPending}
              onClick={() => createBill.mutate()}
            >
              {createBill.isPending && <span className="spinner" style={{ width: 14, height: 14 }} />}
              Create Bill
            </button>
          </>
        }
      >
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          Select a received purchase order to generate a vendor bill.
        </p>
        <InputGroup label="Purchase Order">
          <select
            className="input-field"
            value={selectedPO}
            onChange={(e) => setSelectedPO(e.target.value)}
          >
            <option value="">Select PO…</option>
            {billablePOs.map((po) => (
              <option key={po.id} value={po.id}>
                {po.number} — {po.vendor?.name ?? "Unknown Vendor"} — {money(Number(po.total))}
              </option>
            ))}
          </select>
        </InputGroup>
        {billablePOs.length === 0 && (
          <div style={{ marginTop: 12, padding: "12px 16px", background: "#fef3c7", borderRadius: 8, fontSize: 13, color: "#92400e", display: "flex", gap: 8 }}>
            <AlertTriangle size={15} />
            No received POs available. Receive a purchase order first.
          </div>
        )}
      </Modal>

      {/* ── Pay bill modal ── */}
      <Modal
        open={!!payModal}
        onClose={() => setPayModal(null)}
        title={`Pay Bill — ${payModal?.number ?? ""}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setPayModal(null)}>Cancel</button>
            <button
              className="btn btn-success"
              disabled={payBill.isPending || !payForm.amount}
              onClick={() => payModal && payBill.mutate(payModal)}
            >
              {payBill.isPending && <span className="spinner" style={{ width: 14, height: 14 }} />}
              <DollarSign size={14} /> Record Payment
            </button>
          </>
        }
      >
        {payModal && (
          <div>
            {/* Bill summary */}
            <div style={{ background: "#f8fafc", borderRadius: 10, padding: "14px 16px", marginBottom: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {[
                { label: "Vendor", value: payModal.vendor?.name ?? "—" },
                { label: "Bill #", value: payModal.number },
                { label: "Bill Total", value: money(Number(payModal.total)) },
                { label: "Amount Paid", value: money(Number(payModal.amountPaid)) },
                { label: "Balance Due", value: money(Number(payModal.total) - Number(payModal.amountPaid)) },
                { label: "Status", value: payModal.status },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>

            <div className="form-grid form-grid-2">
              <InputGroup label="Payment Amount (₹)">
                <input
                  className="input-field"
                  type="number"
                  min="1"
                  max={Number(payModal.total) - Number(payModal.amountPaid)}
                  value={payForm.amount}
                  onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                />
              </InputGroup>
              <InputGroup label="Payment Method">
                <select
                  className="input-field"
                  value={payForm.method}
                  onChange={(e) => setPayForm({ ...payForm, method: e.target.value })}
                >
                  <option value="BANK">Bank Transfer</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                </select>
              </InputGroup>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// LEGACY COMPAT EXPORTS (kept for App.tsx routes)
// ─────────────────────────────────────────────────────────
export function useToastStyles() {
  // No-op — styles are now in index.css
}
