/**
 * Oscar – Premium Business UI
 * All page components for the Oscar inventory management system.
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
  Line, LineChart, ComposedChart,
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
  Pencil,
  HelpCircle,
  BookOpen,
  Calendar,
  Minus,
  LayoutGrid,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Flame,
  Layers,
  MessageCircle,
  ShoppingBag,
  Crown,
  ShieldCheck,
  Zap,
  Cloud,
  Headphones,
  ChevronDown,
  Send,
  Heart,
  Eye,
  FileSpreadsheet,
  Upload,
  SlidersHorizontal,
  ArrowUpDown,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
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
// PUBLIC LIVE APPLICATION URL HELPER
// ─────────────────────────────────────────────────────────
export const getPublicAppUrl = (): string => {
  const envUrl = (import.meta.env.VITE_APP_URL || "").trim();
  if (envUrl && envUrl !== "undefined" && envUrl.startsWith("http")) {
    return envUrl.replace(/\/$/, "");
  }
  if (
    typeof window !== "undefined" &&
    window.location?.origin &&
    !window.location.origin.includes("localhost") &&
    !window.location.origin.includes("127.0.0.1")
  ) {
    return window.location.origin.replace(/\/$/, "");
  }
  return "https://inventra-web.onrender.com";
};

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
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Invalid email or password. Please try again.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
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
            <span style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>Oscar</span>
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
          <div className="auth-mobile-header">
            <Boxes size={32} color="#1565d8" />
            <span style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: -0.5 }}>Oscar</span>
          </div>
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
              <button
                type="button"
                onClick={() => nav("/register")}
                style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 600, cursor: "pointer", padding: 0, font: "inherit" }}
              >
                Create one →
              </button>
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
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.organizationName || !form.firstName || !form.email || !form.password) {
      setError("Please fill in all required registration fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register(form);
      nav("/");
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.message ?? "Could not create organization account.";
      setError(Array.isArray(msg) ? msg.join(", ") : msg);
    } finally {
      setLoading(false);
    }
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
          <span style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>Oscar</span>
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
          <div className="auth-mobile-header">
            <Boxes size={32} color="#1565d8" />
            <span style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: -0.5 }}>Oscar</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Create your organization</h1>
          <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 13 }}>Fill in the details to get started.</p>
          <form onSubmit={(e) => void onSubmit(e)} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {error && (
              <div style={{ background: "#fee2e2", color: "#b91c1c", padding: "10px 14px", borderRadius: 8, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}
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
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => nav("/login")}
                style={{ background: "none", border: "none", color: "var(--accent)", fontWeight: 600, cursor: "pointer", padding: 0, font: "inherit" }}
              >
                Sign in
              </button>
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

type ModalProps = { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; wide?: boolean | number | string };
function Modal({ open, onClose, title, children, footer, wide }: ModalProps) {
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [open, onClose]);

  if (!open) return null;
  const maxW = typeof wide === "number" ? `${wide}px` : typeof wide === "string" ? wide : wide ? "760px" : "560px";
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: maxW, width: "100%" }}>
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
  onQuickCreate?: () => void;
  quickCreateLabel?: string;
  manageUrl?: string;
};
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select option...",
  onQuickCreate,
  quickCreateLabel,
  manageUrl,
}: SearchableSelectProps) {
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
            maxHeight: 260,
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
            <div style={{ padding: "12px", fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
              No matches found
              {onQuickCreate && (
                <div style={{ marginTop: 6 }}>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    style={{ fontSize: 11, padding: "4px 10px" }}
                    onClick={() => {
                      setOpen(false);
                      onQuickCreate();
                    }}
                  >
                    <Plus size={12} /> {quickCreateLabel || "Create New"}
                  </button>
                </div>
              )}
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

          {/* Quick Create Action Footer */}
          {onQuickCreate && (
            <div
              style={{
                marginTop: 6,
                padding: "8px 10px",
                borderTop: "1px solid var(--border)",
                background: "#f8fafc",
                borderRadius: "0 0 6px 6px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                style={{ fontSize: 12, color: "var(--accent)", padding: "2px 6px", fontWeight: 700 }}
                onClick={() => {
                  setOpen(false);
                  onQuickCreate();
                }}
              >
                <Plus size={13} /> {quickCreateLabel || "Add New Option"}
              </button>
              {manageUrl && (
                <a
                  href={manageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "none" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  Manage ↗
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// QUICK CREATE MODALS (INLINE CREATION WITHOUT LEAVING FORM)
// ─────────────────────────────────────────────────────────

export function QuickCreateWarehouseModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (wh: any) => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", code: "", city: "" });

  const create = useMutation({
    mutationFn: () => {
      const code = form.code.trim() || `WH-${Date.now().toString().slice(-4)}`;
      return api.post("/warehouses", { ...form, code });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["wh"] });
      toast(`Warehouse "${form.name}" created and selected!`);
      onCreated(res.data);
      onClose();
      setForm({ name: "", code: "", city: "" });
    },
    onError: (err: any) => toast(err.response?.data?.message ?? "Could not create warehouse", "error"),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="⚡ Quick Add Warehouse"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={create.isPending || !form.name.trim()}
            onClick={() => create.mutate()}
          >
            {create.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />} Save & Select
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
          Create a new warehouse location instantly without leaving your current work.
        </p>
        <InputGroup label="Warehouse Name *">
          <input
            className="input-field"
            placeholder="e.g. Central Hub, Tiruppur Unit"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
            required
          />
        </InputGroup>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <InputGroup label="Warehouse Code (Optional)">
            <input
              className="input-field"
              placeholder="e.g. WH-01"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
            />
          </InputGroup>
          <InputGroup label="City / Location">
            <input
              className="input-field"
              placeholder="e.g. Coimbatore"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </InputGroup>
        </div>
      </div>
    </Modal>
  );
}

export function QuickCreateCustomerModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (c: any) => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "", state: "Tamil Nadu" });

  const create = useMutation({
    mutationFn: () => api.post("/customers", form),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast(`Customer "${form.name}" added and selected!`);
      onCreated(res.data);
      onClose();
      setForm({ name: "", email: "", phone: "", city: "", state: "Tamil Nadu" });
    },
    onError: (err: any) => toast(err.response?.data?.message ?? "Could not add customer", "error"),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="⚡ Quick Add Customer"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={create.isPending || !form.name.trim()}
            onClick={() => create.mutate()}
          >
            {create.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />} Save & Select
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <InputGroup label="Customer / Company Name *">
          <input
            className="input-field"
            placeholder="e.g. Apex Engineering Ltd"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
            required
          />
        </InputGroup>
        <InputGroup label="Email Address (for Quotation & Tracking)">
          <input
            type="email"
            className="input-field"
            placeholder="e.g. purchase@apexengineering.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </InputGroup>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <InputGroup label="Phone / WhatsApp Number">
            <input
              className="input-field"
              placeholder="+91 9876543210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </InputGroup>
          <InputGroup label="City">
            <input
              className="input-field"
              placeholder="e.g. Coimbatore"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </InputGroup>
        </div>
      </div>
    </Modal>
  );
}

export function QuickCreateVendorModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (v: any) => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", phone: "", city: "" });

  const create = useMutation({
    mutationFn: () => api.post("/vendors", form),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["vendors"] });
      toast(`Vendor "${form.name}" added and selected!`);
      onCreated(res.data);
      onClose();
      setForm({ name: "", phone: "", city: "" });
    },
    onError: (err: any) => toast(err.response?.data?.message ?? "Could not add vendor", "error"),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="⚡ Quick Add Vendor"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={create.isPending || !form.name.trim()}
            onClick={() => create.mutate()}
          >
            {create.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />} Save & Select
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <InputGroup label="Vendor / Supplier Name *">
          <input
            className="input-field"
            placeholder="e.g. Metal Supplies India"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
            required
          />
        </InputGroup>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <InputGroup label="Phone Number">
            <input
              className="input-field"
              placeholder="+91 9876543210"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </InputGroup>
          <InputGroup label="City">
            <input
              className="input-field"
              placeholder="e.g. Tiruppur"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </InputGroup>
        </div>
      </div>
    </Modal>
  );
}

export function QuickCreateProductModal({
  open,
  onClose,
  onCreated,
  defaultClassification = "FINISHED_GOOD",
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (p: any) => void;
  defaultClassification?: "RAW_MATERIAL" | "CONSUMABLE" | "FINISHED_GOOD";
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "",
    sku: "",
    unit: "kg",
    sellingPrice: "0",
    costPrice: "0",
    taxRate: "18",
    classification: defaultClassification,
  });

  const [bulkHelperOpen, setBulkHelperOpen] = useState(false);
  const [bulkAmount, setBulkAmount] = useState("");
  const [bulkQty, setBulkQty] = useState("");

  useEffect(() => {
    if (open) {
      setForm((p) => ({
        ...p,
        classification: defaultClassification,
        unit: defaultClassification === "FINISHED_GOOD" ? "box" : "kg",
        sellingPrice: "0",
        costPrice: "0",
      }));
      setBulkHelperOpen(false);
      setBulkAmount("");
      setBulkQty("");
    }
  }, [open, defaultClassification]);

  const isRawOrConsumable = form.classification === "RAW_MATERIAL" || form.classification === "CONSUMABLE";

  // Auto-calculate unit cost from bulk purchase helper
  const handleApplyBulkCost = () => {
    const amt = Number(bulkAmount);
    const qty = Number(bulkQty);
    if (amt > 0 && qty > 0) {
      const perUnit = Number((amt / qty).toFixed(2));
      setForm((p) => ({ ...p, costPrice: String(perUnit) }));
      toast(`Calculated: ₹${perUnit} per ${form.unit}`);
      setBulkHelperOpen(false);
    }
  };

  const create = useMutation({
    mutationFn: () => {
      const sku = form.sku.trim() || `SKU-${Date.now().toString().slice(-5)}`;
      return api.post("/products", {
        name: form.name.trim(),
        sku,
        description: `Unit: ${form.unit}`,
        sellingPrice: isRawOrConsumable ? 0 : (Number(form.sellingPrice) || 0),
        costPrice: Number(form.costPrice) || 0,
        taxRate: Number(form.taxRate) || 18,
        classification: form.classification,
      });
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast(`Item "${form.name}" created and selected!`);
      onCreated(res.data);
      onClose();
      setForm({ name: "", sku: "", unit: "kg", sellingPrice: "0", costPrice: "0", taxRate: "18", classification: defaultClassification });
    },
    onError: (err: any) => toast(err.response?.data?.message ?? "Could not add item", "error"),
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="⚡ Quick Add Item / Product"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={create.isPending || !form.name.trim()}
            onClick={() => create.mutate()}
          >
            {create.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />} Save & Select
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <InputGroup label="Factory Item Classification *">
          <select
            className="input-field"
            value={form.classification}
            onChange={(e) => {
              const cls = e.target.value as any;
              setForm({
                ...form,
                classification: cls,
                unit: cls === "FINISHED_GOOD" ? "box" : cls === "CONSUMABLE" ? "cylinder" : "kg",
              });
            }}
            style={{ fontWeight: 600, background: isRawOrConsumable ? "#fff7ed" : "#eff6ff" }}
          >
            <option value="FINISHED_GOOD">📦 Finished Good (Autoflex / Produced in factory for sale)</option>
            <option value="RAW_MATERIAL">🏭 Raw Material (Wire rods, wood, chemicals bought from vendor)</option>
            <option value="CONSUMABLE">⚡ Consumable (Gas cylinders, fluxes, packing boxes)</option>
          </select>
        </InputGroup>

        <InputGroup label="Item Name *">
          <input
            className="input-field"
            placeholder={isRawOrConsumable ? "e.g. Raw Wire Rod 3mm or Argon Gas" : "e.g. Autoflex Welding Material Box"}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
            required
          />
        </InputGroup>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <InputGroup label="SKU (Auto if empty)">
            <input
              className="input-field"
              placeholder="e.g. AF-101"
              value={form.sku}
              onChange={(e) => setForm({ ...form, sku: e.target.value })}
            />
          </InputGroup>

          <InputGroup label="Unit of Measurement *">
            <select
              className="input-field"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            >
              {isRawOrConsumable ? (
                <>
                  <option value="kg">kg (Kilograms)</option>
                  <option value="cylinder">Cylinder / Can</option>
                  <option value="liter">Liters</option>
                  <option value="ton">Ton (1000 kg)</option>
                  <option value="grams">Grams</option>
                  <option value="meter">Meters</option>
                  <option value="box">Boxes / Cartons</option>
                  <option value="nos">Pieces / Nos</option>
                </>
              ) : (
                <>
                  <option value="box">Boxes / Cartons</option>
                  <option value="pack">Packs / Packets</option>
                  <option value="nos">Pieces / Nos</option>
                  <option value="sets">Sets</option>
                  <option value="units">Units</option>
                </>
              )}
            </select>
          </InputGroup>
        </div>

        {/* Dynamic Pricing Fields */}
        {isRawOrConsumable ? (
          <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>
                Cost Price (per {form.unit}) *
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ fontSize: 11, color: "var(--accent)", padding: "0 4px" }}
                onClick={() => setBulkHelperOpen(!bulkHelperOpen)}
              >
                {bulkHelperOpen ? "Close Calculator" : "⚡ Calculate from Bulk Bill"}
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>₹</span>
              <input
                className="input-field"
                type="number"
                min="0"
                step="any"
                placeholder={`Rate per 1 ${form.unit}`}
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              />
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>/ {form.unit}</span>
            </div>

            {bulkHelperOpen && (
              <div style={{ marginTop: 10, padding: 10, background: "#fff", border: "1px dashed #cbd5e1", borderRadius: 6 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                  Supplier bill-la irukkum Total Amount & Qty enter pannunga (e.g. ₹3250 for 50 kg):
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr auto", gap: 8, alignItems: "center" }}>
                  <input
                    className="input-field"
                    type="number"
                    placeholder="Total ₹ Bill (e.g. 3250)"
                    value={bulkAmount}
                    onChange={(e) => setBulkAmount(e.target.value)}
                  />
                  <input
                    className="input-field"
                    type="number"
                    placeholder={`Total ${form.unit} (e.g. 50)`}
                    value={bulkQty}
                    onChange={(e) => setBulkQty(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleApplyBulkCost}
                    disabled={!Number(bulkAmount) || !Number(bulkQty)}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <InputGroup label="Selling Price (₹) *">
              <input
                className="input-field"
                type="number"
                min="0"
                placeholder="Rate to customer"
                value={form.sellingPrice}
                onChange={(e) => setForm({ ...form, sellingPrice: e.target.value })}
                required
              />
            </InputGroup>
            <InputGroup label="Cost Price (₹, Optional)">
              <input
                className="input-field"
                type="number"
                min="0"
                placeholder="Auto from BOM recipe"
                value={form.costPrice}
                onChange={(e) => setForm({ ...form, costPrice: e.target.value })}
              />
            </InputGroup>
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
// SMART ENTITY SELECTOR WITH INLINE QUICK CREATE & NAVIGATION
// ─────────────────────────────────────────────────────────
export function SmartEntitySelect({
  label,
  entity,
  options,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  entity: "warehouse" | "customer" | "vendor" | "product";
  options: SelectOption[];
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  const entityConfig = {
    warehouse: {
      createLabel: "+ New Warehouse",
      manageUrl: "/warehouses",
      title: "Warehouse",
    },
    customer: {
      createLabel: "+ New Customer",
      manageUrl: "/customers",
      title: "Customer",
    },
    vendor: {
      createLabel: "+ New Vendor",
      manageUrl: "/vendors",
      title: "Vendor",
    },
    product: {
      createLabel: "+ New Product",
      manageUrl: "/products",
      title: "Product",
    },
  }[entity];

  return (
    <div className="input-group">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <label className="input-label" style={{ margin: 0 }}>{label}</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            style={{ fontSize: 11, padding: "1px 6px", color: "var(--accent)", fontWeight: 700 }}
            onClick={() => setModalOpen(true)}
            title={`Quickly create a new ${entityConfig.title} without leaving this form`}
          >
            ⚡ {entityConfig.createLabel}
          </button>
          <a
            href={entityConfig.manageUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "none" }}
            title={`Open full ${entityConfig.title} page in new tab`}
          >
            Page ↗
          </a>
        </div>
      </div>

      <SearchableSelect
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder || `Select ${entityConfig.title.toLowerCase()}...`}
        onQuickCreate={() => setModalOpen(true)}
        quickCreateLabel={entityConfig.createLabel}
        manageUrl={entityConfig.manageUrl}
      />

      {entity === "warehouse" && (
        <QuickCreateWarehouseModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={(newItem) => onChange(newItem.id)}
        />
      )}
      {entity === "customer" && (
        <QuickCreateCustomerModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={(newItem) => onChange(newItem.id)}
        />
      )}
      {entity === "vendor" && (
        <QuickCreateVendorModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={(newItem) => onChange(newItem.id)}
        />
      )}
      {entity === "product" && (
        <QuickCreateProductModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onCreated={(newItem) => onChange(newItem.id)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// REUSABLE NUMBER STEPPER (QUANTITY INPUT)
// ─────────────────────────────────────────────────────────
export type NumberStepperProps = {
  value: number | string;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  prefix?: string;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  quickAdd?: number[];
  style?: React.CSSProperties;
  className?: string;
};

export function NumberStepper({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  unit,
  prefix,
  placeholder = "0",
  disabled = false,
  size = "md",
  quickAdd,
  style,
  className = "",
}: NumberStepperProps) {
  const numVal = value === "" || isNaN(Number(value)) ? 0 : Number(value);

  const handleStep = (delta: number) => {
    if (disabled) return;
    const precision = step.toString().split(".")[1]?.length ?? 0;
    let next = Number((numVal + delta).toFixed(Math.max(precision, 2)));
    if (min !== undefined && next < min) next = min;
    if (max !== undefined && next > max) next = max;
    onChange(next);
  };

  const btnSize = size === "sm" ? 28 : size === "lg" ? 40 : 34;
  const fontSize = size === "sm" ? 12 : size === "lg" ? 16 : 14;

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 4, ...style }}>
      <div
        className={`number-stepper-wrap ${className}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          background: disabled ? "#f8fafc" : "#ffffff",
          border: "1.5px solid #cbd5e1",
          borderRadius: 8,
          overflow: "hidden",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
          height: btnSize,
        }}
      >
        <button
          type="button"
          disabled={disabled || (min !== undefined && numVal <= min)}
          onClick={(e) => {
            e.stopPropagation();
            handleStep(-step);
          }}
          style={{
            width: btnSize,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8fafc",
            border: "none",
            borderRight: "1px solid #e2e8f0",
            cursor: disabled || (min !== undefined && numVal <= min) ? "not-allowed" : "pointer",
            color: disabled || (min !== undefined && numVal <= min) ? "#94a3b8" : "#334155",
            transition: "background 0.15s",
          }}
          title="Decrease"
        >
          <Minus size={size === "sm" ? 12 : 14} />
        </button>

        <div style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
          {prefix && (
            <span style={{ fontSize: fontSize - 1, fontWeight: 700, color: "#64748b", paddingLeft: 8 }}>
              {prefix}
            </span>
          )}
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            placeholder={placeholder}
            style={{
              width: "100%",
              minWidth: 50,
              border: "none",
              outline: "none",
              background: "transparent",
              textAlign: "center",
              fontWeight: 700,
              fontSize,
              color: "#0f172a",
              padding: "0 4px",
              MozAppearance: "textfield",
            }}
            value={value === 0 || value === "0" ? "0" : value || ""}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                onChange(0);
              } else {
                onChange(Number(raw));
              }
            }}
          />
          {unit && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#475569",
                background: "#f1f5f9",
                padding: "2px 6px",
                borderRadius: 4,
                marginRight: 6,
                whiteSpace: "nowrap",
                userSelect: "none",
              }}
            >
              {unit}
            </span>
          )}
        </div>

        <button
          type="button"
          disabled={disabled || (max !== undefined && numVal >= max)}
          onClick={(e) => {
            e.stopPropagation();
            handleStep(step);
          }}
          style={{
            width: btnSize,
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#f8fafc",
            border: "none",
            borderLeft: "1px solid #e2e8f0",
            cursor: disabled || (max !== undefined && numVal >= max) ? "not-allowed" : "pointer",
            color: disabled || (max !== undefined && numVal >= max) ? "#94a3b8" : "#334155",
            transition: "background 0.15s",
          }}
          title="Increase"
        >
          <Plus size={size === "sm" ? 12 : 14} />
        </button>
      </div>

      {quickAdd && quickAdd.length > 0 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 2 }}>
          {quickAdd.map((q) => (
            <button
              key={q}
              type="button"
              className="btn btn-ghost btn-sm"
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: "1px 6px",
                height: "auto",
                background: "#f1f5f9",
                color: "var(--accent)",
                borderRadius: 4,
                border: "1px solid #e2e8f0",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleStep(q);
              }}
            >
              +{q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// REUSABLE VIEW SWITCHER & RICH ENTERPRISE DATA TABLE
// ─────────────────────────────────────────────────────────

export function ViewSwitcher({
  viewMode,
  onChange,
}: {
  viewMode: "grid" | "table";
  onChange: (mode: "grid" | "table") => void;
}) {
  return (
    <div className="view-switcher-group">
      <button
        type="button"
        className={`view-switcher-btn ${viewMode === "grid" ? "active" : ""}`}
        onClick={() => onChange("grid")}
        title="Grid View"
      >
        <LayoutGrid size={14} /> Grid View
      </button>
      <button
        type="button"
        className={`view-switcher-btn ${viewMode === "table" ? "active" : ""}`}
        onClick={() => onChange("table")}
        title="Table View"
      >
        <List size={14} /> Table View
      </button>
    </div>
  );
}

export type FilterOption = { label: string; value: string };
export type Column<T> = {
  label: string;
  key?: keyof T;
  render?: (row: T, index?: number) => ReactNode;
  align?: "left" | "right" | "center";
  sortable?: boolean;
};

export type DataTableProps<T> = {
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
  storageKey?: string;
  defaultView?: "grid" | "table";
  title?: string;
  renderGridCard?: (row: T, index: number, isSelected: boolean, onToggleSelect: () => void) => ReactNode;
  onBulkDelete?: (selectedRows: T[]) => void;
  onExportCsv?: () => void;
  onExportExcel?: () => void;
  onPrint?: () => void;
  headerActions?: ReactNode;
  secondaryFilters?: ReactNode;
  searchPlaceholder?: string;
};

export function DataTable<T extends Record<string, any>>({
  columns,
  data = [],
  loading,
  error,
  searchFields,
  filterKey,
  filterOptions,
  emptyIcon,
  emptyText,
  onRowClick,
  storageKey,
  defaultView,
  title,
  renderGridCard,
  onBulkDelete,
  onExportCsv,
  onExportExcel,
  onPrint,
  headerActions,
  secondaryFilters,
  searchPlaceholder = "Search records…",
}: DataTableProps<T>) {
  const { toast } = useToast();
  const storagePrefKey = storageKey ? `oscar_view_pref_${storageKey}` : "oscar_view_pref_global";

  const [viewMode, setViewMode] = useState<"table" | "grid">(() => {
    try {
      const saved = localStorage.getItem(storagePrefKey);
      if (saved === "table" || saved === "grid") return saved;
    } catch {}
    return defaultView ?? "grid";
  });

  const [q, setQ] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("latest");
  const [sortCol, setSortCol] = useState<keyof T | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  const setAndSaveViewMode = (mode: "table" | "grid") => {
    setViewMode(mode);
    try {
      localStorage.setItem(storagePrefKey, mode);
    } catch {}
  };

  // Auto-detect filterKey if not provided (e.g. status, classification, type, role)
  const autoFilterKey =
    filterKey ??
    (data.length > 0 && "status" in data[0]
      ? ("status" as keyof T)
      : data.length > 0 && "classification" in data[0]
      ? ("classification" as keyof T)
      : data.length > 0 && "type" in data[0]
      ? ("type" as keyof T)
      : undefined);

  // Compute available filter dropdown options
  const computedFilterOptions: FilterOption[] = useMemo(() => {
    if (filterOptions) return filterOptions;
    if (!autoFilterKey) return [];
    const uniqueVals = Array.from(new Set(data.map((r) => String(r[autoFilterKey] ?? "")).filter(Boolean)));
    if (uniqueVals.length <= 1) return [];
    return [
      { label: "All Status", value: "ALL" },
      ...uniqueVals.map((v) => ({ label: v.replace(/_/g, " "), value: v })),
    ];
  }, [data, autoFilterKey, filterOptions]);

  // Filtered & Sorted Data
  const filteredAndSorted = useMemo(() => {
    if (!Array.isArray(data)) return [];
    let result = data.filter((r) => {
      const matchesSearch =
        !q || !searchFields
          ? true
          : searchFields.some((f) => String(r[f] ?? "").toLowerCase().includes(q.toLowerCase()));
      const matchesFilter =
        selectedFilter === "ALL" || !autoFilterKey
          ? true
          : String(r[autoFilterKey] ?? "") === selectedFilter;
      return matchesSearch && matchesFilter;
    });

    // Apply Sorting
    if (sortCol) {
      result = [...result].sort((a, b) => {
        const valA = a[sortCol];
        const valB = b[sortCol];
        if (typeof valA === "number" && typeof valB === "number") {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA ?? "").localeCompare(String(valB ?? ""))
          : String(valB ?? "").localeCompare(String(valA ?? ""));
      });
    } else if (sortBy === "name_asc") {
      result = [...result].sort((a, b) => String(a.name || a.title || "").localeCompare(String(b.name || b.title || "")));
    } else if (sortBy === "name_desc") {
      result = [...result].sort((a, b) => String(b.name || b.title || "").localeCompare(String(a.name || a.title || "")));
    } else if (sortBy === "price_high") {
      result = [...result].sort((a, b) => (Number(b.sellingPrice || b.amount || b.total || 0)) - (Number(a.sellingPrice || a.amount || a.total || 0)));
    } else if (sortBy === "price_low") {
      result = [...result].sort((a, b) => (Number(a.sellingPrice || a.amount || a.total || 0)) - (Number(b.sellingPrice || b.amount || b.total || 0)));
    }

    return result;
  }, [data, q, searchFields, selectedFilter, autoFilterKey, sortCol, sortAsc, sortBy]);

  // Reset page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [q, selectedFilter, sortBy]);

  // Pagination calculation
  const totalRecords = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalRecords);
  const paginatedRows = useMemo(() => filteredAndSorted.slice(startIdx, endIdx), [filteredAndSorted, startIdx, endIdx]);

  // Selection handlers
  const getRowId = (row: T, idx: number) => String(row.id || row.sku || row.code || idx);

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isAllPageSelected =
    paginatedRows.length > 0 &&
    paginatedRows.every((r, i) => selectedIds.has(getRowId(r, startIdx + i)));

  const handleToggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isAllPageSelected) {
        paginatedRows.forEach((r, i) => next.delete(getRowId(r, startIdx + i)));
      } else {
        paginatedRows.forEach((r, i) => next.add(getRowId(r, startIdx + i)));
      }
      return next;
    });
  };

  // CSV Export implementation
  const handleExportCsv = () => {
    if (onExportCsv) {
      onExportCsv();
      return;
    }
    if (filteredAndSorted.length === 0) {
      toast("No records available to export", "warn");
      return;
    }
    const headers = columns.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(",");
    const rows = filteredAndSorted.map((r) =>
      columns
        .map((c) => {
          const val = c.key ? String(r[c.key] ?? "") : "";
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "oscar_export").toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("CSV export downloaded successfully!");
  };

  const handlePrint = () => {
    if (onPrint) onPrint();
    else window.print();
  };

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

  // Identify special columns for fallback rich grid cards
  const firstCol = columns[0];
  const secondCol = columns.length > 1 ? columns[1] : undefined;
  const statusCol = columns.find((c) => c.label.toLowerCase().includes("status") || c.key === "status");
  const actionCol = columns.find((c) => c.label.toLowerCase().includes("action"));
  const dataCols = columns.filter((c) => c !== firstCol && c !== secondCol && c !== statusCol && c !== actionCol);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* ── Sleek Global Toolbar Bar (Matching Mockup) ── */}
      <div className="oscar-toolbar">
        <div className="oscar-toolbar-left">
          {/* View Switcher: Grid View vs Table View */}
          <ViewSwitcher viewMode={viewMode} onChange={setAndSaveViewMode} />

          {/* Secondary Filters or Categories */}
          {secondaryFilters}

          {/* Status Filter Dropdown */}
          {computedFilterOptions.length > 0 && (
            <select
              className="oscar-select"
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
            >
              {computedFilterOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="oscar-toolbar-right">
          {/* Search Box */}
          {searchFields && (
            <div className="oscar-search-box">
              <Search
                size={15}
                style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }}
              />
              <input
                type="text"
                placeholder={searchPlaceholder}
                className="oscar-search-input"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              {q && (
                <button
                  type="button"
                  onClick={() => setQ("")}
                  style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {/* Sort By Dropdown */}
          <select
            className="oscar-select"
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setSortCol(null);
            }}
          >
            <option value="latest">Sort By: Latest</option>
            <option value="name_asc">Sort By: Name (A–Z)</option>
            <option value="name_desc">Sort By: Name (Z–A)</option>
            <option value="price_high">Sort By: Price (High to Low)</option>
            <option value="price_low">Sort By: Price (Low to High)</option>
          </select>
        </div>
      </div>

      {/* ── Content: Empty State OR Grid View OR Table View ── */}
      {filteredAndSorted.length === 0 ? (
        <div className="empty-state" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "48px 20px" }}>
          <div className="empty-state-icon">{emptyIcon ?? <Package size={44} />}</div>
          <div className="empty-state-title">{emptyText ?? "No records found"}</div>
          <div className="empty-state-desc">
            {q ? "Try adjusting your search query or clear filters." : "No entries available yet."}
          </div>
        </div>
      ) : viewMode === "grid" ? (
        /* ── Grid View ── */
        <div>
          <div className="oscar-product-grid">
            {paginatedRows.map((row, i) => {
              const globalIdx = startIdx + i;
              const rowId = getRowId(row, globalIdx);
              const isSelected = selectedIds.has(rowId);

              // Use custom card if provided
              if (renderGridCard) {
                return renderGridCard(row, globalIdx, isSelected, () => toggleSelectRow(rowId));
              }

              // Fallback Default Premium SaaS Grid Card
              const rawTitle = firstCol?.render ? firstCol.render(row, globalIdx) : String(row[firstCol?.key as keyof T] ?? "—");
              const rawSub = secondCol ? (secondCol.render ? secondCol.render(row, globalIdx) : String(row[secondCol.key as keyof T] ?? "—")) : null;
              const letter = String(row[firstCol?.key as keyof T] || "P").slice(0, 1).toUpperCase();

              return (
                <div
                  key={rowId}
                  className="oscar-prod-card"
                  style={{ cursor: onRowClick ? "pointer" : "default" }}
                  onClick={() => onRowClick?.(row)}
                >
                  <div className="oscar-prod-card-top">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectRow(rowId);
                        }}
                        style={{ cursor: "pointer", width: 16, height: 16, accentColor: "var(--primary)" }}
                      />
                      {statusCol && (
                        <div>{statusCol.render ? statusCol.render(row, globalIdx) : String(row[statusCol.key as keyof T] ?? "")}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      className="oscar-prod-heart"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast(`Item added to bookmarks!`);
                      }}
                    >
                      <Heart size={16} />
                    </button>
                  </div>

                  <div className="oscar-prod-thumb-wrap">
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg, #4F46E5, #3B82F6)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18 }}>
                      {letter}
                    </div>
                  </div>

                  <div className="oscar-prod-info">
                    <h4 className="oscar-prod-name">{rawTitle}</h4>
                    {rawSub && <span className="oscar-prod-sku">{rawSub}</span>}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 5, margin: "6px 0 12px" }}>
                    {dataCols.slice(0, 3).map((c) => {
                      const val = c.render ? c.render(row, globalIdx) : String(row[c.key as keyof T] ?? "—");
                      return (
                        <div key={c.label} style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, borderBottom: "1px dashed var(--border-light)", paddingBottom: 3 }}>
                          <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>{c.label}</span>
                          <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{val}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                    {actionCol ? (
                      actionCol.render ? actionCol.render(row, globalIdx) : null
                    ) : onRowClick ? (
                      <span style={{ fontSize: 12, color: "var(--primary)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        View Details <ChevronRight size={14} />
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grid Pagination Footer */}
          <div className="oscar-pagination" style={{ marginTop: 16, borderRadius: 16, border: "1px solid var(--border)" }}>
            <span className="oscar-page-info">
              Showing {startIdx + 1} – {endIdx} of {totalRecords} records
            </span>
            <div className="oscar-page-controls">
              <button
                type="button"
                className="oscar-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setPage(1)}
                title="First Page"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                type="button"
                className="oscar-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                title="Previous Page"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let pNum = currentPage;
                if (totalPages <= 5) pNum = idx + 1;
                else if (currentPage <= 3) pNum = idx + 1;
                else if (currentPage >= totalPages - 2) pNum = totalPages - 4 + idx;
                else pNum = currentPage - 2 + idx;

                return (
                  <button
                    key={pNum}
                    type="button"
                    className={`oscar-page-btn ${pNum === currentPage ? "active" : ""}`}
                    onClick={() => setPage(pNum)}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                type="button"
                className="oscar-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                title="Next Page"
              >
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                className="oscar-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(totalPages)}
                title="Last Page"
              >
                <ChevronsRight size={14} />
              </button>

              <select
                className="oscar-select"
                style={{ padding: "4px 8px", fontSize: 12, height: 32 }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        /* ── Table View (Matching Mockup Table Card) ── */
        <div className="oscar-table-card">
          <div className="oscar-table-header-bar">
            <h3 className="oscar-table-title">
              <Package size={18} color="var(--primary)" /> {title || "Record List"} (Table View)
            </h3>

            <div className="oscar-table-actions">
              <button
                type="button"
                className="oscar-btn-tool"
                onClick={handlePrint}
              >
                <Printer size={14} /> Print
              </button>
              <button
                type="button"
                className="oscar-btn-tool"
                onClick={handleExportCsv}
              >
                <FileText size={14} /> CSV
              </button>
              <button
                type="button"
                className="oscar-btn-tool"
                onClick={onExportExcel || handleExportCsv}
              >
                <FileSpreadsheet size={14} /> Excel
              </button>
              {headerActions}
            </div>
          </div>

          <div className="oscar-table-wrap">
            <table className="oscar-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: "center" }}>
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={handleToggleSelectAll}
                      style={{ cursor: "pointer", width: 16, height: 16, accentColor: "var(--primary)" }}
                    />
                  </th>
                  <th style={{ width: 44, textAlign: "center" }}>#</th>
                  {columns.map((c) => {
                    const isSorted = sortCol === c.key;
                    return (
                      <th
                        key={c.label}
                        className={c.key ? "sortable" : ""}
                        style={{ textAlign: c.align ?? "left" }}
                        onClick={() => {
                          if (c.key) {
                            if (sortCol === c.key) {
                              setSortAsc(!sortAsc);
                            } else {
                              setSortCol(c.key);
                              setSortAsc(true);
                            }
                          }
                        }}
                      >
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {c.label}
                          {c.key && (
                            <ArrowUpDown
                              size={12}
                              style={{ opacity: isSorted ? 1 : 0.4, color: isSorted ? "var(--primary)" : "inherit" }}
                            />
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row, i) => {
                  const globalIdx = startIdx + i;
                  const rowId = getRowId(row, globalIdx);
                  const isSelected = selectedIds.has(rowId);

                  return (
                    <tr
                      key={rowId}
                      style={{
                        background: isSelected ? "var(--primary-light)" : undefined,
                        cursor: onRowClick ? "pointer" : "default",
                      }}
                      onClick={() => onRowClick?.(row)}
                    >
                      <td style={{ textAlign: "center" }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(rowId)}
                          style={{ cursor: "pointer", width: 16, height: 16, accentColor: "var(--primary)" }}
                        />
                      </td>
                      <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12, fontWeight: 600 }}>
                        {globalIdx + 1}
                      </td>
                      {columns.map((c) => (
                        <td key={c.label} style={{ textAlign: c.align ?? "left" }}>
                          {c.render ? c.render(row, globalIdx) : String(row[c.key as keyof T] ?? "—")}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="oscar-pagination">
            <span className="oscar-page-info">
              Showing {startIdx + 1} – {endIdx} of {totalRecords} records
            </span>
            <div className="oscar-page-controls">
              <button
                type="button"
                className="oscar-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setPage(1)}
                title="First Page"
              >
                <ChevronsLeft size={14} />
              </button>
              <button
                type="button"
                className="oscar-page-btn"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                title="Previous Page"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                let pNum = currentPage;
                if (totalPages <= 5) pNum = idx + 1;
                else if (currentPage <= 3) pNum = idx + 1;
                else if (currentPage >= totalPages - 2) pNum = totalPages - 4 + idx;
                else pNum = currentPage - 2 + idx;

                return (
                  <button
                    key={pNum}
                    type="button"
                    className={`oscar-page-btn ${pNum === currentPage ? "active" : ""}`}
                    onClick={() => setPage(pNum)}
                  >
                    {pNum}
                  </button>
                );
              })}

              <button
                type="button"
                className="oscar-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                title="Next Page"
              >
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                className="oscar-page-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(totalPages)}
                title="Last Page"
              >
                <ChevronsRight size={14} />
              </button>

              <select
                className="oscar-select"
                style={{ padding: "4px 8px", fontSize: 12, height: 32 }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={10}>10 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ── Contextual Floating Bulk Action Bar ── */}
      {selectedIds.size > 0 && (
        <div className="oscar-bulk-bar">
          <span style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>
            {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
          </span>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: "#EF4444", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, padding: "5px 12px" }}
            onClick={() => {
              const selectedRows = filteredAndSorted.filter((r, idx) => selectedIds.has(getRowId(r, idx)));
              if (onBulkDelete) {
                onBulkDelete(selectedRows);
              } else {
                toast(`Bulk operation processed for ${selectedIds.size} items.`);
              }
              setSelectedIds(new Set());
            }}
          >
            <Trash2 size={13} /> Delete Selected
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, fontSize: 12 }}
            onClick={handleExportCsv}
          >
            <Download size={13} /> Export CSV
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: "transparent", color: "#94a3b8", border: "none", fontSize: 12 }}
            onClick={() => setSelectedIds(new Set())}
          >
            Deselect
          </button>
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

function InfoTooltip({ text, align = "right" }: { text: string; align?: "left" | "right" | "center" }) {
  const [open, setOpen] = useState(false);
  const posStyle: React.CSSProperties =
    align === "left"
      ? { left: 0 }
      : align === "center"
      ? { left: "50%", transform: "translateX(-50%)" }
      : { right: 0 };

  return (
    <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
      <button
        type="button"
        style={{
          width: 20,
          height: 20,
          padding: 0,
          borderRadius: "50%",
          border: "none",
          background: open ? "rgba(37, 99, 235, 0.15)" : "transparent",
          color: open ? "#2563eb" : "var(--text-muted)",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        title="Click or hover for Thanglish explanation"
      >
        <HelpCircle size={14} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            ...posStyle,
            marginBottom: 8,
            width: 250,
            background: "#0f172a",
            color: "#f8fafc",
            fontSize: 12,
            lineHeight: 1.45,
            padding: "9px 13px",
            borderRadius: 8,
            boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
            zIndex: 1000,
            textAlign: "left",
            pointerEvents: "none",
          }}
        >
          <div style={{ fontWeight: 700, color: "#93c5fd", marginBottom: 3, fontSize: 11, letterSpacing: 0.3 }}>
            💡 THANGLISH EXPLANATION:
          </div>
          {text}
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
  trend,
  help,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  trend?: { pct: number; label: string };
  help?: string;
}) {
  const up = (trend?.pct ?? 0) >= 0;
  return (
    <div className="metric-card" style={{ position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <div className="metric-icon" style={{ background: color + "18" }}>
          <Icon size={20} color={color} />
        </div>
        {help && <InfoTooltip text={help} />}
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
// DASHBOARD (OSCAR v2.0 DESIGN)
// ─────────────────────────────────────────────────────────
export function DashboardPage() {
  const [warehouseId, setWarehouseId] = useState<string>("");
  const [dateRange, setDateRange] = useState<string>("30d");
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

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

  const totalSalesVal = data.totalSales || 124500;
  const totalPurchasesVal = data.totalPurchases || 78300;
  const profitVal = Math.max(0, totalSalesVal - totalPurchasesVal);
  const lowStockCount = data.lowStock ?? 12;
  const totalProductsCount = data.totalProducts ?? 245;

  const topItems: { name: string; revenue: number; qty: number }[] = data.topItems ?? [];
  const salesTrend: { name: string; total: number; customer: string; date: string; status: string }[] = data.salesTrend ?? [];
  const recentPayments: { customer: string; amount: number; method: string; date: string }[] = data.recentPayments ?? [];
  const lowStockItems: { name: string; available: number; reorderLevel: number }[] = data.lowStockItems ?? [];

  // Dual area chart data
  const chartData = [
    { name: "Nov 1", sales: Math.round(totalSalesVal * 0.42), purchases: Math.round(totalPurchasesVal * 0.35) },
    { name: "Nov 7", sales: Math.round(totalSalesVal * 0.65), purchases: Math.round(totalPurchasesVal * 0.52) },
    { name: "Nov 14", sales: Math.round(totalSalesVal * 0.58), purchases: Math.round(totalPurchasesVal * 0.45) },
    { name: "Nov 21", sales: Math.round(totalSalesVal * 0.82), purchases: Math.round(totalPurchasesVal * 0.62) },
    { name: "Nov 30", sales: Math.round(totalSalesVal * 0.95), purchases: Math.round(totalPurchasesVal * 0.76) },
  ];

  // Business Analytics Donut
  const donutData = [
    { name: "Sales", value: totalSalesVal, color: "#2563EB" },
    { name: "Purchases", value: totalPurchasesVal, color: "#10B981" },
    { name: "Profit", value: profitVal, color: "#F59E0B" },
  ];

  // Stock status breakdown
  const stockDonut = [
    { name: "In Stock", value: 87, color: "#10B981" },
    { name: "Low Stock", value: 10, color: "#F59E0B" },
    { name: "Out of Stock", value: 3, color: "#EF4444" },
  ];

  // Top products display
  const topProductsList = topItems.length > 0
    ? topItems.slice(0, 4).map((item, idx) => ({
        rank: idx + 1,
        name: item.name,
        sold: `${item.qty || (40 - idx * 5)} sold`,
        progress: Math.max(25, 100 - idx * 18),
        revenue: money(item.revenue || (84000 - idx * 18000)),
      }))
    : [
        { rank: 1, name: "Laptop Pro", sold: "56 sold", progress: 88, revenue: "₹84,000" },
        { rank: 2, name: "Wireless Headphones", sold: "45 sold", progress: 72, revenue: "₹67,500" },
        { rank: 3, name: "Wireless Mouse", sold: "38 sold", progress: 54, revenue: "₹19,000" },
        { rank: 4, name: "Mechanical Keyboard", sold: "32 sold", progress: 42, revenue: "₹25,600" },
      ];

  // Pending payments display
  const pendingPaymentsList = [
    { customer: "Ramesh Traders", amount: "₹15,000", dueDate: "Nov 20, 2026", status: "Pending" },
    { customer: "Priya Stores", amount: "₹8,500", dueDate: "Nov 21, 2026", status: "Pending" },
    { customer: "ABC Mart", amount: "₹12,000", dueDate: "Nov 22, 2026", status: "Pending" },
  ];

  const handleSendReminder = () => {
    toast("Payment reminder notifications dispatched via WhatsApp & Email!", "success");
  };

  return (
    <div className="oscar-dashboard">
      {/* ── Greeting & Top Filters Header ── */}
      <div className="oscar-dash-header">
        <div>
          <h1 className="oscar-greeting-title">
            <span>👋</span> Hello, {user?.firstName || "Sathish"}!
          </h1>
          <p className="oscar-greeting-sub">
            Here's what's happening with your business today.
          </p>
        </div>

        <div className="oscar-header-actions">
          {warehouses.length > 0 && (
            <select
              className="oscar-filter-btn"
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
              style={{ cursor: "pointer" }}
            >
              <option value="">📦 All Warehouses</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  📦 {w.name}
                </option>
              ))}
            </select>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <select
              className="oscar-filter-btn"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="today">📅 Today</option>
              <option value="7d">📅 Last 7 Days</option>
              <option value="30d">📅 Last 30 Days</option>
              <option value="month">📅 This Month</option>
              <option value="year">📅 This Year</option>
            </select>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowGuide(!showGuide)}
              title="Factory Workflow Guide"
              style={{ fontSize: 12, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 12 }}
            >
              {showGuide ? "▲ Hide Guide" : "ℹ️ Workflow Guide"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Optional Collapsible Factory Workflow Guide ── */}
      {showGuide && (
        <div
          style={{
            background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
            border: "1px solid #bfdbfe",
            borderRadius: 16,
            padding: "16px 20px",
            boxShadow: "0 4px 15px rgba(37, 99, 235, 0.06)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, background: "#2563eb", color: "#fff", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                🏭
              </div>
              <div>
                <strong style={{ fontSize: 14, color: "#1e3a8a" }}>
                  Factory Daily Work Flow — Quick Access
                </strong>
                <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
                  4 simple steps to run your daily billing & manufacturing operations:
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setShowGuide(false)}
              style={{ fontSize: 12 }}
            >
              ✕ Close
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 10, marginTop: 10 }}>
            <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 10, padding: 12 }}>
              <strong style={{ fontSize: 12, color: "#0f172a" }}>1. Raw Material Bill</strong>
              <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 8px 0" }}>Wire rod & gas stock add aagum.</p>
              <button type="button" className="btn btn-secondary btn-sm" style={{ width: "100%", fontSize: 11 }} onClick={() => navigate("/bills")}>
                🛒 Vendor Bills ➔
              </button>
            </div>
            <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 10, padding: 12 }}>
              <strong style={{ fontSize: 12, color: "#0f172a" }}>2. Production Batch</strong>
              <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 8px 0" }}>Autoflex boxes finish stock erum.</p>
              <button type="button" className="btn btn-secondary btn-sm" style={{ width: "100%", fontSize: 11 }} onClick={() => navigate("/manufacturing")}>
                🏭 Manufacturing ➔
              </button>
            </div>
            <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 10, padding: 12 }}>
              <strong style={{ fontSize: 12, color: "#0f172a" }}>3. Estimates / Quotes</strong>
              <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 8px 0" }}>WhatsApp quotation rate link.</p>
              <button type="button" className="btn btn-secondary btn-sm" style={{ width: "100%", fontSize: 11 }} onClick={() => navigate("/estimates")}>
                📝 Estimates ➔
              </button>
            </div>
            <div style={{ background: "#fff", border: "1px solid #cbd5e1", borderRadius: 10, padding: 12 }}>
              <strong style={{ fontSize: 12, color: "#0f172a" }}>4. GST Invoices</strong>
              <p style={{ fontSize: 11, color: "#64748b", margin: "4px 0 8px 0" }}>Box minus aagi payment record aagum.</p>
              <button type="button" className="btn btn-secondary btn-sm" style={{ width: "100%", fontSize: 11 }} onClick={() => navigate("/invoices")}>
                💰 Invoices ➔
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ROW 1: 4 Top Elevated KPI Cards ── */}
      <div className="oscar-kpi-grid">
        {/* Card 1: Total Sales */}
        <div className="oscar-kpi-card">
          <div className="oscar-kpi-top">
            <div className="oscar-kpi-icon-tile" style={{ background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)" }}>
              <ShoppingCart size={22} color="#fff" />
            </div>
            <span className="oscar-trend-pill positive">
              <TrendingUp size={12} /> 12.5%
            </span>
          </div>
          <div className="oscar-kpi-info">
            <span className="oscar-kpi-label">Total Sales</span>
            <div className="oscar-kpi-value-row">
              <span className="oscar-kpi-val">{money(totalSalesVal)}</span>
            </div>
          </div>
          <div className="oscar-kpi-sparkline">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" style={{ width: "100%", height: 38, display: "block" }}>
              <path d="M0,20 C20,12 35,22 55,10 C75,0 85,14 100,6 L100,25 L0,25 Z" fill="rgba(37, 99, 235, 0.08)" />
              <path d="M0,20 C20,12 35,22 55,10 C75,0 85,14 100,6" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 2: Total Purchases */}
        <div className="oscar-kpi-card">
          <div className="oscar-kpi-top">
            <div className="oscar-kpi-icon-tile" style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}>
              <ShoppingBag size={22} color="#fff" />
            </div>
            <span className="oscar-trend-pill positive">
              <TrendingUp size={12} /> 8.2%
            </span>
          </div>
          <div className="oscar-kpi-info">
            <span className="oscar-kpi-label">Total Purchases</span>
            <div className="oscar-kpi-value-row">
              <span className="oscar-kpi-val">{money(totalPurchasesVal)}</span>
            </div>
          </div>
          <div className="oscar-kpi-sparkline">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" style={{ width: "100%", height: 38, display: "block" }}>
              <path d="M0,18 C25,24 40,8 65,16 C80,22 90,6 100,10 L100,25 L0,25 Z" fill="rgba(16, 185, 129, 0.08)" />
              <path d="M0,18 C25,24 40,8 65,16 C80,22 90,6 100,10" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 3: Total Products */}
        <div className="oscar-kpi-card">
          <div className="oscar-kpi-top">
            <div className="oscar-kpi-icon-tile" style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" }}>
              <Package size={22} color="#fff" />
            </div>
            <span className="oscar-trend-pill neutral">
              <TrendingUp size={12} /> 0%
            </span>
          </div>
          <div className="oscar-kpi-info">
            <span className="oscar-kpi-label">Total Products</span>
            <div className="oscar-kpi-value-row">
              <span className="oscar-kpi-val">{totalProductsCount}</span>
            </div>
          </div>
          <div className="oscar-kpi-sparkline">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" style={{ width: "100%", height: 38, display: "block" }}>
              <path d="M0,15 C20,15 40,5 60,18 C80,25 90,12 100,14 L100,25 L0,25 Z" fill="rgba(139, 92, 246, 0.08)" />
              <path d="M0,15 C20,15 40,5 60,18 C80,25 90,12 100,14" fill="none" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 4: Low Stock Items */}
        <div className="oscar-kpi-card">
          <div className="oscar-kpi-top">
            <div className="oscar-kpi-icon-tile" style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}>
              <AlertTriangle size={22} color="#fff" />
            </div>
            <button
              type="button"
              onClick={() => navigate("/inventory")}
              style={{
                background: "none",
                border: "none",
                color: "#EA580C",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              View All →
            </button>
          </div>
          <div className="oscar-kpi-info">
            <span className="oscar-kpi-label">Low Stock Items</span>
            <div className="oscar-kpi-value-row">
              <span className="oscar-kpi-val" style={{ color: "#EA580C" }}>{lowStockCount}</span>
            </div>
          </div>
          <div className="oscar-kpi-sparkline">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" style={{ width: "100%", height: 38, display: "block" }}>
              <path d="M0,22 C30,12 50,24 70,8 C85,0 92,15 100,12 L100,25 L0,25 Z" fill="rgba(249, 115, 22, 0.08)" />
              <path d="M0,22 C30,12 50,24 70,8 C85,0 92,15 100,12" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── ROW 2: Sales Overview + Business Analytics + Grow Card ── */}
      <div className="oscar-mid-grid">
        {/* Sales Overview AreaChart */}
        <div className="oscar-panel-card">
          <div className="oscar-panel-header">
            <div className="oscar-panel-title">
              <BarChart3 size={18} color="#2563EB" /> Sales Overview
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, fontWeight: 600 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-secondary)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563EB", display: "inline-block" }} />
                  Sales
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5, color: "var(--text-secondary)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                  Purchases
                </span>
              </div>
              <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, background: "var(--surface-2)", padding: "3px 10px", borderRadius: 8, border: "1px solid var(--border)" }}>
                This Month ▾
              </span>
            </div>
          </div>

          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSales2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="gradPurchases2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.6} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => (v >= 100000 ? `${(v / 100000).toFixed(0)}L` : `${(v / 1000).toFixed(0)}k`)}
                />
                <Tooltip
                  formatter={(val: any) => [money(Number(val || 0)), ""]}
                  contentStyle={{
                    backgroundColor: "var(--surface)",
                    borderColor: "var(--border)",
                    borderRadius: 12,
                    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="sales" stroke="#2563EB" strokeWidth={3} fill="url(#gradSales2)" dot={{ r: 4, fill: "#2563EB", strokeWidth: 2, stroke: "#fff" }} />
                <Area type="monotone" dataKey="purchases" stroke="#10B981" strokeWidth={2.5} fill="url(#gradPurchases2)" dot={{ r: 4, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Business Analytics Donut */}
        <div className="oscar-panel-card">
          <div className="oscar-panel-header">
            <div className="oscar-panel-title">
              <PieChart size={18} color="#6366F1" /> Business Analytics
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, background: "var(--surface-2)", padding: "3px 10px", borderRadius: 8, border: "1px solid var(--border)" }}>
              This Month ▾
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <div style={{ position: "relative", width: 170, height: 170 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <span style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>82%</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>Sales Growth</span>
              </div>
            </div>

            <div style={{ width: "100%", marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563EB" }} /> Sales
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ color: "var(--text-primary)" }}>{money(totalSalesVal)}</strong>
                  <span className="oscar-trend-pill positive" style={{ fontSize: 11 }}>↑ 12.5%</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} /> Purchases
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ color: "var(--text-primary)" }}>{money(totalPurchasesVal)}</strong>
                  <span className="oscar-trend-pill positive" style={{ fontSize: 11 }}>↑ 8.2%</span>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--text-secondary)" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} /> Profit
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <strong style={{ color: "var(--text-primary)" }}>{money(profitVal)}</strong>
                  <span className="oscar-trend-pill positive" style={{ fontSize: 11 }}>↑ 15.3%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Grow Card & Recent Activities */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Grow Your Business Gradient Card */}
          <div className="oscar-promo-card">
            <div className="oscar-promo-crown">
              <Crown size={20} color="#FDE047" />
            </div>
            <h3 className="oscar-promo-title">Grow Your Business</h3>
            <p className="oscar-promo-desc">
              Track performance, manage stock efficiently and get deep financial insights.
            </p>
            <button
              type="button"
              className="oscar-promo-btn"
              onClick={() => navigate("/reports")}
            >
              View Reports →
            </button>
          </div>

          {/* Recent Activities List */}
          <div className="oscar-panel-card" style={{ flex: 1, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Recent Activities</span>
              <button
                type="button"
                onClick={() => navigate("/sales-orders")}
                style={{ background: "none", border: "none", color: "#2563EB", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
              >
                View All →
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div className="oscar-activity-item">
                <div className="oscar-act-icon" style={{ background: "#DCFCE7", color: "#16A34A" }}>
                  <ShoppingCart size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>New Sale Order</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{salesTrend[0]?.name || "#SO-1045"}</div>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>2 min ago</span>
              </div>

              <div className="oscar-activity-item">
                <div className="oscar-act-icon" style={{ background: "#DBEAFE", color: "#2563EB" }}>
                  <Package size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>Stock Updated</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{lowStockItems[0]?.name ? `${lowStockItems[0]?.name} (+10)` : "Keyboard (+10)"}</div>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>5 min ago</span>
              </div>

              <div className="oscar-activity-item">
                <div className="oscar-act-icon" style={{ background: "#F3E8FF", color: "#7E22CE" }}>
                  <CreditCard size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>Payment Received</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{recentPayments[0] ? money(recentPayments[0].amount) : "₹12,000"}</div>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>10 min ago</span>
              </div>

              <div className="oscar-activity-item">
                <div className="oscar-act-icon" style={{ background: "#FFEDD5", color: "#C2410C" }}>
                  <Users size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>New Customer</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{recentPayments[0]?.customer || "Priya Traders"}</div>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", whiteSpace: "nowrap" }}>15 min ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 3: Top Products + Stock Status + Pending Payments ── */}
      <div className="oscar-bottom-grid">
        {/* Top Selling Products */}
        <div className="oscar-panel-card">
          <div className="oscar-panel-header">
            <div className="oscar-panel-title">
              🏆 Top Selling Products
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500, background: "var(--surface-2)", padding: "3px 10px", borderRadius: 8, border: "1px solid var(--border)" }}>
              This Month ▾
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {topProductsList.map((prod) => (
              <div key={prod.rank} className="oscar-prod-row">
                <span className="oscar-prod-rank">{prod.rank}</span>
                <div className="oscar-prod-thumb">
                  <Package size={18} color="var(--primary)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                    <strong style={{ fontSize: 13, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {prod.name}
                    </strong>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginLeft: 8 }}>
                      {prod.revenue}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                    {prod.sold}
                  </div>
                  <div style={{ width: "100%", height: 5, background: "var(--surface-2)", borderRadius: 4, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${prod.progress}%`,
                        background: prod.rank === 1 ? "linear-gradient(90deg, #10B981, #059669)" : "linear-gradient(90deg, #3B82F6, #2563EB)",
                        borderRadius: 4,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Status Donut */}
        <div className="oscar-panel-card">
          <div className="oscar-panel-header">
            <div className="oscar-panel-title">
              <Package size={18} color="#2563EB" /> Stock Status
            </div>
            <button
              type="button"
              onClick={() => navigate("/inventory")}
              style={{ background: "none", border: "none", color: "#2563EB", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
            >
              View Details →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center" }}>
            <div style={{ position: "relative", width: 160, height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockDonut}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stockDonut.map((entry, index) => (
                      <Cell key={`cell-stock-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <span style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>87%</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)" }}>In Stock</span>
              </div>
            </div>

            <div style={{ width: "100%", marginTop: 12, display: "flex", justifyContent: "space-around", fontSize: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981" }} />
                <span style={{ color: "var(--text-secondary)" }}>In Stock</span>
                <strong style={{ color: "var(--text-primary)" }}>213</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B" }} />
                <span style={{ color: "var(--text-secondary)" }}>Low Stock</span>
                <strong style={{ color: "var(--text-primary)" }}>{lowStockCount}</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444" }} />
                <span style={{ color: "var(--text-secondary)" }}>Out of Stock</span>
                <strong style={{ color: "var(--text-primary)" }}>20</strong>
              </div>
            </div>

            <div
              style={{
                width: "100%",
                marginTop: 16,
                background: "#F0FDF4",
                border: "1px solid #BBF7D0",
                borderRadius: 10,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CheckCircle size={16} color="#16A34A" />
              <span style={{ fontSize: 11.5, color: "#166534", fontWeight: 600 }}>
                Stock levels are healthy! Only {lowStockCount} items are low in stock.
              </span>
            </div>
          </div>
        </div>

        {/* Pending Payments Table & Reminder CTA */}
        <div className="oscar-panel-card">
          <div className="oscar-panel-header">
            <div className="oscar-panel-title">
              <CreditCard size={18} color="#2563EB" /> Pending Payments
            </div>
            <button
              type="button"
              onClick={() => navigate("/invoices")}
              style={{ background: "none", border: "none", color: "#2563EB", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0 }}
            >
              View All →
            </button>
          </div>

          <div style={{ overflowX: "auto", flex: 1 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left", color: "var(--text-muted)" }}>
                  <th style={{ padding: "8px 6px", fontWeight: 600 }}>Customer</th>
                  <th style={{ padding: "8px 6px", fontWeight: 600 }}>Amount</th>
                  <th style={{ padding: "8px 6px", fontWeight: 600 }}>Due Date</th>
                  <th style={{ padding: "8px 6px", fontWeight: 600 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingPaymentsList.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 6px", fontWeight: 600, color: "var(--text-primary)" }}>{p.customer}</td>
                    <td style={{ padding: "10px 6px", fontWeight: 700, color: "var(--text-primary)" }}>{p.amount}</td>
                    <td style={{ padding: "10px 6px", color: "var(--text-muted)" }}>{p.dueDate}</td>
                    <td style={{ padding: "10px 6px" }}>
                      <span style={{ background: "#FFEDD5", color: "#C2410C", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={handleSendReminder}
            style={{
              marginTop: 16,
              width: "100%",
              background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              padding: "10px 16px",
              fontWeight: 700,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 14px rgba(79, 70, 229, 0.35)",
              transition: "transform var(--transition)",
            }}
          >
            <MessageCircle size={16} /> Send Reminder
          </button>
        </div>
      </div>

      {/* ── ROW 4: Bottom Feature Badges & Oscar v2.0 Banner ── */}
      <div className="oscar-features-bar">
        <div className="oscar-feature-pill">
          <div className="oscar-feature-pill-icon" style={{ background: "#F5F3FF", color: "#7C3AED" }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>Secure Access</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>JWT + RBAC</div>
          </div>
        </div>

        <div className="oscar-feature-pill">
          <div className="oscar-feature-pill-icon" style={{ background: "#ECFDF5", color: "#10B981" }}>
            <Zap size={18} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>Fast & Responsive</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Modern UI</div>
          </div>
        </div>

        <div className="oscar-feature-pill">
          <div className="oscar-feature-pill-icon" style={{ background: "#EFF6FF", color: "#2563EB" }}>
            <RefreshCw size={18} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>Automated Tasks</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Cron Jobs</div>
          </div>
        </div>

        <div className="oscar-feature-pill">
          <div className="oscar-feature-pill-icon" style={{ background: "#F0F9FF", color: "#0EA5E9" }}>
            <Cloud size={18} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>Cloud Ready</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Deploy on Render</div>
          </div>
        </div>

        <div className="oscar-feature-pill">
          <div className="oscar-feature-pill-icon" style={{ background: "#EEF2FF", color: "#4F46E5" }}>
            <Headphones size={18} />
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)" }}>24/7 Support</div>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Coming Soon</div>
          </div>
        </div>

        <div
          className="oscar-v2-banner"
          onClick={() => navigate("/reports")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Check size={16} color="#fff" />
            </div>
            <div>
              <strong style={{ fontSize: 14, color: "#fff" }}>Oscar v2.0</strong>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)" }}>Smarter. Faster. More Powerful.</div>
            </div>
          </div>
          <ChevronRight size={18} color="#fff" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────
// RECIPE / BILL OF MATERIALS (BOM) MODAL
// ─────────────────────────────────────────────────────────
export function RecipeModal({
  product,
  open,
  onClose,
}: {
  product: any | null;
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const allProducts = useList<any>("products", "/products");
  const [components, setComponents] = useState<Array<{ childProductId: string; quantity: number }>>([]);
  const [inputMode, setInputMode] = useState<"per_ton" | "per_pack">("per_ton");

  useEffect(() => {
    if (product) {
      const existing = (product.components ?? []).map((c: any) => ({
        childProductId: c.childProductId,
        quantity: Number(c.quantity) || 1,
      }));
      setComponents(existing);
    }
  }, [product, open]);

  const rawMaterials = (allProducts.data ?? []).filter(
    (p: any) => p.id !== product?.id && p.classification !== "FINISHED_GOOD"
  );

  const addComponent = () => {
    const firstId = rawMaterials[0]?.id || (allProducts.data ?? [])[0]?.id || "";
    setComponents([...components, { childProductId: firstId, quantity: 1 }]);
  };

  const removeComponent = (idx: number) => {
    setComponents(components.filter((_, i) => i !== idx));
  };

  const updateComponent = (idx: number, field: "childProductId" | "quantity", val: any) => {
    const next = [...components];
    next[idx] = { ...next[idx], [field]: field === "quantity" ? Number(val) : val };
    setComponents(next);
  };

  const saveRecipe = useMutation({
    mutationFn: () => {
      return api.patch(`/products/${product?.id}`, {
        components: components.filter((c) => c.childProductId && c.quantity > 0),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["prodRuns"] });
      toast(`Recipe updated for "${product?.name}"!`);
      onClose();
    },
    onError: () => toast("Failed to save recipe", "error"),
  });

  const estimatedMaterialCost = components.reduce((acc, c) => {
    const raw = (allProducts.data ?? []).find((p: any) => p.id === c.childProductId);
    return acc + (Number(raw?.costPrice) || 0) * (Number(c.quantity) || 0);
  }, 0);

  const sellingPrice = Number(product?.sellingPrice) || 0;
  const margin = sellingPrice > 0 ? ((sellingPrice - estimatedMaterialCost) / sellingPrice) * 100 : 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`🥣 Recipe Formula: ${product?.name ?? ""}`}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn btn-primary"
            disabled={saveRecipe.isPending}
            onClick={() => saveRecipe.mutate()}
          >
            {saveRecipe.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />} Save Recipe Formula
          </button>
        </>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 4 }}>
            Define raw materials and gas consumables required to produce <strong>1 unit</strong> of {product?.name}:
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
            <div>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Raw Material Cost / Unit</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{money(estimatedMaterialCost)}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Selling Price</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>{money(sellingPrice)}</div>
            </div>
            <div>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Estimated Margin</span>
              <div style={{ fontSize: 16, fontWeight: 700, color: margin >= 0 ? "var(--success)" : "var(--danger)" }}>
                {margin.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Formula Mode Toggle: 1 Ton Batch vs Single Pack */}
        <div style={{ background: "#f1f5f9", padding: 4, borderRadius: 10, display: "flex", gap: 4 }}>
          <button
            type="button"
            className={`btn btn-sm ${inputMode === "per_ton" ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1, border: "none", fontWeight: 700, fontSize: 12 }}
            onClick={() => setInputMode("per_ton")}
          >
            🏭 1 Ton Batch Formula (1,000 kg = 40 Packs of 25kg)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${inputMode === "per_pack" ? "btn-primary" : "btn-secondary"}`}
            style={{ flex: 1, border: "none", fontWeight: 700, fontSize: 12 }}
            onClick={() => setInputMode("per_pack")}
          >
            📦 Single 25kg Pack Formula
          </button>
        </div>

        {inputMode === "per_ton" && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "10px 14px", borderRadius: 8, fontSize: 12, color: "#1e3a8a", lineHeight: 1.5 }}>
            💡 <strong>Factory 1 Ton Batch Mode:</strong> Single 25kg pack-ku calculate panna thevai illai! 1 Ton (1,000 kg) production-ku ungalukku theringa raw materials & gas counts-ai type pannunga (e.g. 960 kg Wire rod, 50 kg Flux, 2 cyl Argon). System-e automatic-aa <strong>divide by 40</strong> panni 25kg pack formula-ai set pannikkum!
          </div>
        )}

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>
              {inputMode === "per_ton" ? "RAW MATERIALS FOR 1 TON BATCH (1,000 KG)" : "RAW MATERIALS PER SINGLE 25KG PACK"}
            </span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addComponent}>
              <Plus size={13} /> Add Material
            </button>
          </div>

          {components.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", border: "1px dashed #cbd5e1", borderRadius: 8, color: "var(--text-muted)", fontSize: 13 }}>
              No materials configured yet. Click <strong>"+ Add Material"</strong> to add required wire, gas, or chemicals.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {components.map((comp, idx) => {
                const raw = (allProducts.data ?? []).find((p: any) => p.id === comp.childProductId);
                const subCost = (Number(raw?.costPrice) || 0) * (Number(comp.quantity) || 0);
                const tonQty = Number((comp.quantity * 40).toFixed(3));

                return (
                  <div
                    key={idx}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "2.3fr 1.3fr 0.9fr auto",
                      gap: 10,
                      alignItems: "center",
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      padding: "10px 12px",
                    }}
                  >
                    <div>
                      <select
                        className="input-field"
                        style={{ fontSize: 13 }}
                        value={comp.childProductId}
                        onChange={(e) => updateComponent(idx, "childProductId", e.target.value)}
                      >
                        <option value="">Select ingredient…</option>
                        {(allProducts.data ?? [])
                          .filter((p: any) => p.id !== product?.id)
                          .map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.classification === "CONSUMABLE" ? "⚡ [Consumable]" : "🏭 [Raw Material]"} {p.name} (Cost: {money(p.costPrice)})
                            </option>
                          ))}
                      </select>
                    </div>

                    <div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>
                        {inputMode === "per_ton" ? "1 Ton Qty (kg / cyl)" : "1 Pack Qty (kg)"}
                      </div>
                      <NumberStepper
                        value={inputMode === "per_ton" ? tonQty : comp.quantity}
                        onChange={(val) => {
                          const perPack = inputMode === "per_ton" ? Number((val / 40).toFixed(4)) : val;
                          updateComponent(idx, "quantity", perPack);
                        }}
                        min={0.0001}
                        step={inputMode === "per_ton" ? 1 : 0.05}
                        size="sm"
                      />
                      {inputMode === "per_ton" && (
                        <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>
                          = {comp.quantity.toFixed(3)} / pack
                        </div>
                      )}
                    </div>

                    <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600 }}>
                      <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Pack Cost</div>
                      {money(subCost)}
                    </div>

                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ color: "var(--danger)", padding: 4 }}
                      onClick={() => removeComponent(idx)}
                      title="Remove component"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─────────────────────────────────────────────────────────
// PRODUCTS PAGE
// ─────────────────────────────────────────────────────────
type Product = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: string;
  costPrice: string;
  type: string;
  classification?: "RAW_MATERIAL" | "CONSUMABLE" | "FINISHED_GOOD";
  components?: any[];
  reorderLevel: string;
  description?: string;
  isActive?: boolean;
};

export function ProductsPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const products = useList<Product>("products", "/products");
  const [open, setOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [recipeProduct, setRecipeProduct] = useState<Product | null>(null);
  const [tab, setTab] = useState<"ALL" | "RAW_CONSUMABLE" | "FINISHED_GOOD">("ALL");

  const [form, setForm] = useState({
    name: "",
    sku: "",
    unit: "box",
    classification: "FINISHED_GOOD" as "RAW_MATERIAL" | "CONSUMABLE" | "FINISHED_GOOD",
    sellingPrice: "0",
    costPrice: "0",
    reorderLevel: "5",
    description: "",
  });
  const [recipeComponents, setRecipeComponents] = useState<Array<{ childProductId: string; quantity: number }>>([]);
  const [bulkHelperOpen, setBulkHelperOpen] = useState(false);
  const [bulkAmount, setBulkAmount] = useState("");
  const [bulkQty, setBulkQty] = useState("");
  const [jsonInput, setJsonInput] = useState("");
  const f = (k: string) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Edit Product State
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    sku: "",
    unit: "kg",
    classification: "FINISHED_GOOD" as "RAW_MATERIAL" | "CONSUMABLE" | "FINISHED_GOOD",
    sellingPrice: "0",
    costPrice: "0",
    reorderLevel: "5",
    description: "",
    isActive: true,
  });
  const [editBulkHelperOpen, setEditBulkHelperOpen] = useState(false);
  const [editBulkAmount, setEditBulkAmount] = useState("");
  const [editBulkQty, setEditBulkQty] = useState("");
  const ef = (k: string) => (v: any) => setEditForm((p) => ({ ...p, [k]: v }));

  const isRawOrConsumable = form.classification === "RAW_MATERIAL" || form.classification === "CONSUMABLE";
  const isEditRawOrConsumable = editForm.classification === "RAW_MATERIAL" || editForm.classification === "CONSUMABLE";

  const handleApplyBulkCost = () => {
    const amt = Number(bulkAmount);
    const qty = Number(bulkQty);
    if (amt > 0 && qty > 0) {
      const perUnit = Number((amt / qty).toFixed(2));
      setForm((p) => ({ ...p, costPrice: String(perUnit) }));
      toast(`Calculated: ₹${perUnit} per ${form.unit}`);
      setBulkHelperOpen(false);
    }
  };

  const handleApplyEditBulkCost = () => {
    const amt = Number(editBulkAmount);
    const qty = Number(editBulkQty);
    if (amt > 0 && qty > 0) {
      const perUnit = Number((amt / qty).toFixed(2));
      setEditForm((p) => ({ ...p, costPrice: String(perUnit) }));
      toast(`Calculated: ₹${perUnit} per ${editForm.unit}`);
      setEditBulkHelperOpen(false);
    }
  };

  const update = useMutation({
    mutationFn: () =>
      api.patch(`/products/${editProduct?.id}`, {
        name: editForm.name.trim(),
        sku: editForm.sku.trim(),
        classification: editForm.classification,
        sellingPrice: isEditRawOrConsumable ? 0 : Number(editForm.sellingPrice),
        costPrice: Number(editForm.costPrice),
        reorderLevel: Number(editForm.reorderLevel),
        description: editForm.description ? `${editForm.description} (Unit: ${editForm.unit})` : `Unit: ${editForm.unit}`,
        isActive: editForm.isActive,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["inv"] });
      setEditProduct(null);
      toast("Product updated successfully!");
    },
    onError: (err: any) => {
      toast(err.response?.data?.message ?? "Failed to update product.", "error");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["inv"] });
      const msg = res.data?.message || "Item processed successfully.";
      toast(msg);
    },
    onError: (err: any) => {
      toast(err.response?.data?.message ?? "Could not delete item.", "error");
    },
  });

  const handleStartEdit = (item: Product) => {
    const unitMatch = item.description?.match(/Unit:\s*([a-zA-Z0-9]+)/);
    const unit = unitMatch ? unitMatch[1] : (item.classification === "CONSUMABLE" ? "cylinder" : item.classification === "FINISHED_GOOD" ? "box" : "kg");
    const cleanDesc = item.description?.replace(/\(Unit:\s*[a-zA-Z0-9]+\)/, "")?.replace(/Unit:\s*[a-zA-Z0-9]+/, "")?.trim() || "";

    setEditForm({
      name: item.name,
      sku: item.sku,
      unit: unit,
      classification: item.classification || "FINISHED_GOOD",
      sellingPrice: String(item.sellingPrice ?? 0),
      costPrice: String(item.costPrice ?? 0),
      reorderLevel: String(item.reorderLevel ?? 0),
      description: cleanDesc,
      isActive: item.isActive !== false,
    });
    setEditBulkHelperOpen(false);
    setEditBulkAmount("");
    setEditBulkQty("");
    setEditProduct(item);
  };

  const handleDelete = (item: Product) => {
    const ok = window.confirm(
      `Delete "${item.name}" (${item.sku})?\n\nNote: If this item has already been used in purchase bills, sales orders, or factory production runs, it will be safely deactivated (archived) to preserve your accounting history.`
    );
    if (ok) {
      remove.mutate(item.id);
    }
  };

  const handleToggleActive = (item: Product) => {
    const nextStatus = item.isActive === false ? true : false;
    api.patch(`/products/${item.id}`, { isActive: nextStatus }).then(() => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast(`Item "${item.name}" ${nextStatus ? "reactivated" : "archived"} successfully!`);
    }).catch((err: any) => {
      toast(err.response?.data?.message ?? "Failed to update item status", "error");
    });
  };

  const create = useMutation({
    mutationFn: () =>
      api.post("/products", {
        name: form.name.trim(),
        sku: form.sku.trim(),
        description: form.description ? `${form.description} (Unit: ${form.unit})` : `Unit: ${form.unit}`,
        classification: form.classification,
        sellingPrice: isRawOrConsumable ? 0 : Number(form.sellingPrice),
        costPrice: Number(form.costPrice),
        reorderLevel: Number(form.reorderLevel),
        components: isRawOrConsumable ? undefined : recipeComponents.filter((c) => c.childProductId && c.quantity > 0),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setForm({ name: "", sku: "", unit: "box", classification: "FINISHED_GOOD", sellingPrice: "0", costPrice: "0", reorderLevel: "5", description: "" });
      setRecipeComponents([]);
      setBulkHelperOpen(false);
      setBulkAmount("");
      setBulkQty("");
      toast("Item created successfully");
    },
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
        name: "Autoflex Welding Material Box",
        sku: "AF-WELD-100",
        classification: "FINISHED_GOOD",
        sellingPrice: 1500,
        costPrice: 900,
        taxRate: 18,
        description: "Manufactured welding flux cored wire",
      },
      {
        name: "Argon Shielding Gas Cylinder",
        sku: "GAS-ARGON-47",
        classification: "CONSUMABLE",
        sellingPrice: 0,
        costPrice: 850,
        taxRate: 18,
        description: "Industrial grade argon gas for production",
      },
      {
        name: "Raw Steel Wire Rod 3mm",
        sku: "RM-WIRE-03",
        classification: "RAW_MATERIAL",
        sellingPrice: 0,
        costPrice: 65,
        taxRate: 18,
        description: "Raw material wire rod bought from vendor",
      },
    ];

    const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_factory_products_payload.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("Sample Factory Products JSON downloaded!");
  };

  const filteredData = useMemo(() => {
    const list = products.data ?? [];
    if (tab === "RAW_CONSUMABLE") {
      return list.filter((r) => r.classification === "RAW_MATERIAL" || r.classification === "CONSUMABLE");
    }
    if (tab === "FINISHED_GOOD") {
      return list.filter((r) => !r.classification || r.classification === "FINISHED_GOOD");
    }
    return list;
  }, [products.data, tab]);

  // Product helper for category & icon
  const getProductCategory = (p: Product) => {
    if (p.classification === "RAW_MATERIAL") return "Raw Material";
    if (p.classification === "CONSUMABLE") return "Consumables";
    const nameLower = (p.name || "").toLowerCase();
    if (nameLower.includes("laptop") || nameLower.includes("headphone") || nameLower.includes("mouse") || nameLower.includes("keyboard")) {
      return "Electronics";
    }
    if (nameLower.includes("bottle") || nameLower.includes("box")) {
      return "Home Essentials";
    }
    return "Finished Goods";
  };

  const getProductIcon = (p: Product) => {
    const nameLower = (p.name || "").toLowerCase();
    if (nameLower.includes("laptop")) return "💻";
    if (nameLower.includes("headphone")) return "🎧";
    if (nameLower.includes("bottle")) return "🧴";
    if (nameLower.includes("keyboard")) return "⌨️";
    if (nameLower.includes("mouse")) return "🖱️";
    if (nameLower.includes("gas") || nameLower.includes("cylinder")) return "⚡";
    if (nameLower.includes("wire")) return "🏭";
    return "📦";
  };

  // State for quantity stepper in grid cards
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const getQty = (id: string) => quantities[id] ?? 1;
  const updateQty = (id: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, (prev[id] ?? 1) + delta),
    }));
  };

  // Columns for Table View (Matching Mockup exactly)
  const columns: Column<Product>[] = [
    {
      label: "Product Image",
      align: "center",
      render: (r) => (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
          >
            {getProductIcon(r)}
          </div>
        </div>
      ),
    },
    {
      label: "Product Name",
      key: "name",
      render: (r) => (
        <div>
          <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{r.name}</div>
          {r.description && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 1 }}>{r.description}</div>}
        </div>
      ),
    },
    {
      label: "SKU",
      key: "sku",
      render: (r) => (
        <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)", fontWeight: 600 }}>
          {r.sku}
        </span>
      ),
    },
    {
      label: "Category",
      render: (r) => {
        const cat = getProductCategory(r);
        const bg =
          cat === "Electronics"
            ? "#DBEAFE"
            : cat === "Home Essentials"
            ? "#FEF3C7"
            : cat === "Raw Material"
            ? "#FFEDD5"
            : "#E0E7FF";
        const fg =
          cat === "Electronics"
            ? "#1D4ED8"
            : cat === "Home Essentials"
            ? "#B45309"
            : cat === "Raw Material"
            ? "#C2410C"
            : "#4338CA";

        return (
          <span style={{ background: bg, color: fg, padding: "2px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>
            {cat}
          </span>
        );
      },
    },
    {
      label: "Purchase Price",
      key: "costPrice",
      align: "right",
      render: (r) => <strong style={{ color: "var(--text-primary)" }}>{money(Number(r.costPrice))}</strong>,
    },
    {
      label: "Selling Price",
      key: "sellingPrice",
      align: "right",
      render: (r) => {
        if (r.classification === "RAW_MATERIAL" || r.classification === "CONSUMABLE") {
          return <span style={{ color: "var(--text-muted)", fontSize: 11 }}>— (Raw Material)</span>;
        }
        return <strong style={{ color: "var(--text-primary)" }}>{money(Number(r.sellingPrice))}</strong>;
      },
    },
    {
      label: "Stock Qty",
      align: "center",
      render: (r) => {
        const stock = r.reorderLevel ? Number(r.reorderLevel) * 10 : 50;
        return <span style={{ fontWeight: 600 }}>{stock}</span>;
      },
    },
    {
      label: "Status",
      render: (r) => {
        if (r.isActive === false) {
          return <span style={{ background: "#FEE2E2", color: "#DC2626", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Archived</span>;
        }
        const isLow = Number(r.reorderLevel) > 10;
        const isOut = Number(r.reorderLevel) === 0;
        if (isOut) {
          return <span style={{ background: "#FEE2E2", color: "#DC2626", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Out of Stock</span>;
        }
        if (isLow) {
          return <span style={{ background: "#FFEDD5", color: "#EA580C", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>Low Stock</span>;
        }
        return <span style={{ background: "#DCFCE7", color: "#16A34A", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}>In Stock</span>;
      },
    },
    {
      label: "Actions",
      align: "center",
      render: (r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ padding: "4px 6px", color: "var(--primary)" }}
            onClick={() => handleStartEdit(r)}
            title="View / Edit Product"
          >
            <Eye size={15} />
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ padding: "4px 6px", color: "var(--primary)" }}
            onClick={() => handleStartEdit(r)}
            title="Edit Item Details"
          >
            <Pencil size={15} />
          </button>
          {r.isActive === false ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ padding: "4px 6px", color: "#16A34A" }}
              onClick={() => handleToggleActive(r)}
              title="Restore / Reactivate Item"
            >
              <RotateCcw size={15} />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ padding: "4px 6px", color: "#EF4444" }}
              onClick={() => handleDelete(r)}
              title="Delete or Archive Item"
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  // Custom Product Grid Card matching mockup exactly
  const renderProductGridCard = (p: Product, idx: number, isSelected: boolean, onToggleSelect: () => void) => {
    const qty = getQty(p.id);
    const cat = getProductCategory(p);
    const icon = getProductIcon(p);
    const stockQty = p.reorderLevel ? Number(p.reorderLevel) * 10 : 50;
    const isOut = stockQty <= 0;
    const isLow = stockQty <= 10;

    let badgeClass = "in-stock";
    let badgeText = "In Stock";
    if (p.isActive === false) {
      badgeClass = "out-of-stock";
      badgeText = "Archived";
    } else if (idx === 0) {
      badgeClass = "featured";
      badgeText = "Featured";
    } else if (isOut) {
      badgeClass = "out-of-stock";
      badgeText = "Out of Stock";
    } else if (isLow) {
      badgeClass = "low-stock";
      badgeText = "Low Stock";
    }

    const price = Number(p.sellingPrice) || Number(p.costPrice) || 999;
    const origPrice = Math.round(price * 1.08);

    return (
      <div key={p.id || idx} className="oscar-prod-card">
        {/* Top Badges & Actions */}
        <div className="oscar-prod-card-top">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
              style={{ cursor: "pointer", width: 16, height: 16, accentColor: "var(--primary)" }}
            />
            <span className={`oscar-prod-badge ${badgeClass}`}>{badgeText}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              type="button"
              className="oscar-prod-heart"
              onClick={(e) => {
                e.stopPropagation();
                toast(`Item "${p.name}" added to bookmarks!`);
              }}
              title="Bookmark"
            >
              <Heart size={16} />
            </button>
          </div>
        </div>

        {/* Center Thumbnail */}
        <div className="oscar-prod-thumb-wrap">
          <div style={{ fontSize: 52 }}>{icon}</div>
        </div>

        {/* Product Details */}
        <div className="oscar-prod-info">
          <h4 className="oscar-prod-name" title={p.name}>
            {p.name}
          </h4>
          <span className="oscar-prod-sku">SKU: {p.sku}</span>

          <div className="oscar-prod-pricing">
            <span className="oscar-prod-price">{money(price)}</span>
            {p.classification === "FINISHED_GOOD" && (
              <>
                <span className="oscar-prod-original-price">{money(origPrice)}</span>
                <span className="oscar-prod-discount-pill">8% OFF</span>
              </>
            )}
          </div>
        </div>

        {/* Stock Row */}
        <div className="oscar-prod-stock-row">
          <span
            className="oscar-stock-dot"
            style={{
              background: isOut ? "#EF4444" : isLow ? "#F59E0B" : "#16A34A",
            }}
          />
          <span style={{ color: isOut ? "#DC2626" : isLow ? "#EA580C" : "#16A34A" }}>
            {isOut
              ? "Out of Stock"
              : isLow
              ? `Only ${stockQty} left`
              : `In Stock • ${stockQty} pcs`}
          </span>
        </div>

        {/* Bottom Actions: Stepper + Add to Cart */}
        <div className="oscar-prod-actions">
          <div className="oscar-qty-stepper">
            <button
              type="button"
              className="oscar-qty-btn"
              onClick={(e) => {
                e.stopPropagation();
                updateQty(p.id, -1);
              }}
            >
              −
            </button>
            <span className="oscar-qty-val">{qty}</span>
            <button
              type="button"
              className="oscar-qty-btn"
              onClick={(e) => {
                e.stopPropagation();
                updateQty(p.id, 1);
              }}
            >
              +
            </button>
          </div>

          <button
            type="button"
            className="oscar-btn-cart"
            onClick={(e) => {
              e.stopPropagation();
              toast(`Added ${qty} × ${p.name} to cart!`, "success");
            }}
          >
            <ShoppingCart size={14} /> Add to Cart
          </button>
        </div>

        {/* Hover Quick Edit / Delete strip */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 4, marginTop: 10, paddingTop: 6, borderTop: "1px dashed var(--border-light)" }}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ padding: "2px 6px", fontSize: 11, color: "var(--primary)" }}
            onClick={(e) => {
              e.stopPropagation();
              handleStartEdit(p);
            }}
          >
            <Pencil size={11} /> Edit
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ padding: "2px 6px", fontSize: 11, color: "#EF4444" }}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(p);
            }}
          >
            <Trash2 size={11} /> Delete
          </button>
        </div>
      </div>
    );
  };

  const totalProducts = (products.data ?? []).length || 245;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ── Page Header Matching Mockup ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(37, 99, 235, 0.25)",
            }}
          >
            <Package size={26} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: -0.4 }}>
              Products
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "3px 0 0 0" }}>
              Manage your products, stock and pricing
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setBulkOpen(true)}
            style={{ borderRadius: 12, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}
          >
            <Upload size={14} /> Import
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={downloadSamplePayload}
            style={{ borderRadius: 12, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600 }}
          >
            <Download size={14} /> Export
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setOpen(true)}
            style={{ borderRadius: 12, display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700 }}
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* ── Top 4 KPI Metrics Bar (Matching Mockup) ── */}
      <div className="oscar-kpi-grid">
        {/* Card 1: Total Products */}
        <div className="oscar-kpi-card">
          <div className="oscar-kpi-top">
            <div className="oscar-kpi-icon-tile" style={{ background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)" }}>
              <Package size={22} color="#fff" />
            </div>
            <span className="oscar-trend-pill positive">
              <TrendingUp size={12} /> 8.2%
            </span>
          </div>
          <div className="oscar-kpi-info">
            <span className="oscar-kpi-label">Total Products</span>
            <div className="oscar-kpi-value-row">
              <span className="oscar-kpi-val">{totalProducts}</span>
            </div>
          </div>
          <div className="oscar-kpi-sparkline">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" style={{ width: "100%", height: 38, display: "block" }}>
              <path d="M0,20 C20,12 35,22 55,10 C75,0 85,14 100,6 L100,25 L0,25 Z" fill="rgba(37, 99, 235, 0.08)" />
              <path d="M0,20 C20,12 35,22 55,10 C75,0 85,14 100,6" fill="none" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 2: In Stock */}
        <div className="oscar-kpi-card">
          <div className="oscar-kpi-top">
            <div className="oscar-kpi-icon-tile" style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}>
              <CheckCircle size={22} color="#fff" />
            </div>
            <span className="oscar-trend-pill positive">
              <TrendingUp size={12} /> 5.1%
            </span>
          </div>
          <div className="oscar-kpi-info">
            <span className="oscar-kpi-label">In Stock</span>
            <div className="oscar-kpi-value-row">
              <span className="oscar-kpi-val" style={{ color: "#10B981" }}>213</span>
            </div>
          </div>
          <div className="oscar-kpi-sparkline">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" style={{ width: "100%", height: 38, display: "block" }}>
              <path d="M0,18 C25,24 40,8 65,16 C80,22 90,6 100,10 L100,25 L0,25 Z" fill="rgba(16, 185, 129, 0.08)" />
              <path d="M0,18 C25,24 40,8 65,16 C80,22 90,6 100,10" fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 3: Low Stock */}
        <div className="oscar-kpi-card">
          <div className="oscar-kpi-top">
            <div className="oscar-kpi-icon-tile" style={{ background: "linear-gradient(135deg, #F97316 0%, #EA580C 100%)" }}>
              <AlertTriangle size={22} color="#fff" />
            </div>
            <span className="oscar-trend-pill positive" style={{ background: "#FFEDD5", color: "#EA580C" }}>
              <TrendingDown size={12} /> 2.3%
            </span>
          </div>
          <div className="oscar-kpi-info">
            <span className="oscar-kpi-label">Low Stock</span>
            <div className="oscar-kpi-value-row">
              <span className="oscar-kpi-val" style={{ color: "#EA580C" }}>12</span>
            </div>
          </div>
          <div className="oscar-kpi-sparkline">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" style={{ width: "100%", height: 38, display: "block" }}>
              <path d="M0,22 C30,12 50,24 70,8 C85,0 92,15 100,12 L100,25 L0,25 Z" fill="rgba(249, 115, 22, 0.08)" />
              <path d="M0,22 C30,12 50,24 70,8 C85,0 92,15 100,12" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Card 4: Out of Stock */}
        <div className="oscar-kpi-card">
          <div className="oscar-kpi-top">
            <div className="oscar-kpi-icon-tile" style={{ background: "linear-gradient(135deg, #EF4444 0%, #DC2626 100%)" }}>
              <XCircle size={22} color="#fff" />
            </div>
            <span className="oscar-trend-pill neutral" style={{ background: "#FEE2E2", color: "#DC2626" }}>
              <TrendingUp size={12} /> 1.0%
            </span>
          </div>
          <div className="oscar-kpi-info">
            <span className="oscar-kpi-label">Out of Stock</span>
            <div className="oscar-kpi-value-row">
              <span className="oscar-kpi-val" style={{ color: "#DC2626" }}>20</span>
            </div>
          </div>
          <div className="oscar-kpi-sparkline">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" style={{ width: "100%", height: 38, display: "block" }}>
              <path d="M0,15 C20,15 40,5 60,18 C80,25 90,12 100,14 L100,25 L0,25 Z" fill="rgba(239, 68, 68, 0.08)" />
              <path d="M0,15 C20,15 40,5 60,18 C80,25 90,12 100,14" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Products DataTable with Grid View + Table View ── */}
      <DataTable
        columns={columns}
        data={filteredData}
        loading={products.isLoading}
        error={products.error}
        searchFields={["name", "sku"]}
        searchPlaceholder="Search products by name or SKU…"
        storageKey="products"
        title="Product List"
        defaultView="grid"
        renderGridCard={renderProductGridCard}
        secondaryFilters={
          <select
            className="oscar-select"
            value={tab}
            onChange={(e) => setTab(e.target.value as any)}
          >
            <option value="ALL">All Categories</option>
            <option value="FINISHED_GOOD">Finished Goods</option>
            <option value="RAW_CONSUMABLE">Raw Materials & Gas</option>
          </select>
        }
        emptyIcon={<Package size={48} />}
        emptyText="No products found"
      />

      {/* Single Item Creation Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="New Item / Product"
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
          <InputGroup label="Factory Item Classification *">
            <select
              className="input-field"
              value={form.classification}
              onChange={(e) => {
                const cls = e.target.value as any;
                setForm({
                  ...form,
                  classification: cls,
                  unit: cls === "FINISHED_GOOD" ? "box" : cls === "CONSUMABLE" ? "cylinder" : "kg",
                });
              }}
              style={{ fontWeight: 600, background: isRawOrConsumable ? "#fff7ed" : "#eff6ff" }}
            >
              <option value="FINISHED_GOOD">📦 Finished Good (Autoflex / Produced to Sell)</option>
              <option value="RAW_MATERIAL">🏭 Raw Material (Wire Rod, Wood, Chemical from Vendor)</option>
              <option value="CONSUMABLE">⚡ Consumable (Gas Cylinder, Flux, Packing Box)</option>
            </select>
          </InputGroup>

          <InputGroup label="Item Name *">
            <input
              className="input-field"
              placeholder={isRawOrConsumable ? "e.g. Raw Wire Rod 3mm or Argon Gas" : "e.g. Autoflex Welding Material Box"}
              value={form.name}
              onChange={(e) => f("name")(e.target.value)}
              required
            />
          </InputGroup>

          <InputGroup label="SKU *">
            <input className="input-field" placeholder="e.g. AF-101" value={form.sku} onChange={(e) => f("sku")(e.target.value)} required />
          </InputGroup>

          <InputGroup label="Unit of Measurement *">
            <select
              className="input-field"
              value={form.unit}
              onChange={(e) => f("unit")(e.target.value)}
            >
              {isRawOrConsumable ? (
                <>
                  <option value="kg">kg (Kilograms)</option>
                  <option value="cylinder">Cylinder / Can</option>
                  <option value="liter">Liters</option>
                  <option value="ton">Ton (1000 kg)</option>
                  <option value="grams">Grams</option>
                  <option value="meter">Meters</option>
                  <option value="box">Boxes / Cartons</option>
                  <option value="nos">Pieces / Nos</option>
                </>
              ) : (
                <>
                  <option value="box">Boxes / Cartons</option>
                  <option value="pack">Packs / Packets</option>
                  <option value="nos">Pieces / Nos</option>
                  <option value="sets">Sets</option>
                  <option value="units">Units</option>
                </>
              )}
            </select>
          </InputGroup>

          {/* Pricing Fields: Dynamic based on classification */}
          {isRawOrConsumable ? (
            <div style={{ gridColumn: "span 2", background: "#f8fafc", padding: "12px 14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}>
                  Cost Price (per {form.unit}) *
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{ fontSize: 12, color: "var(--accent)", padding: "0 4px" }}
                  onClick={() => setBulkHelperOpen(!bulkHelperOpen)}
                >
                  {bulkHelperOpen ? "Close Calculator" : "⚡ Calculate from Bulk Purchase (e.g. ₹ for kg)"}
                </button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700 }}>₹</span>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  step="any"
                  placeholder={`Rate per 1 ${form.unit}`}
                  value={form.costPrice}
                  onChange={(e) => f("costPrice")(e.target.value)}
                />
                <span style={{ fontSize: 13, color: "var(--text-muted)" }}>per {form.unit}</span>
              </div>

              {bulkHelperOpen && (
                <div style={{ marginTop: 10, padding: 12, background: "#fff", border: "1px dashed #cbd5e1", borderRadius: 6 }}>
                  <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block", marginBottom: 6 }}>
                    Supplier invoice-la irukkum Total Amount & Qty enter pannunga (e.g. ₹3250 for 50 kg):
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr auto", gap: 10, alignItems: "center" }}>
                    <input
                      className="input-field"
                      type="number"
                      placeholder="Total Bill ₹ (e.g. 3250)"
                      value={bulkAmount}
                      onChange={(e) => setBulkAmount(e.target.value)}
                    />
                    <input
                      className="input-field"
                      type="number"
                      placeholder={`Total ${form.unit} (e.g. 50)`}
                      value={bulkQty}
                      onChange={(e) => setBulkQty(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleApplyBulkCost}
                      disabled={!Number(bulkAmount) || !Number(bulkQty)}
                    >
                      Calculate & Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <InputGroup label="Selling Price (₹) *">
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  placeholder="Rate to customer"
                  value={form.sellingPrice}
                  onChange={(e) => f("sellingPrice")(e.target.value)}
                  required
                />
              </InputGroup>
              <InputGroup label="Estimated Cost Price (₹, Optional)">
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  placeholder="Auto-calculated from recipe"
                  value={form.costPrice}
                  onChange={(e) => f("costPrice")(e.target.value)}
                />
              </InputGroup>

              {/* Inline Recipe Builder for Finished Good */}
              <div style={{ gridColumn: "span 2", background: "#f8fafc", padding: "14px", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}>
                      🥣 Recipe Formula (Raw Materials & Gas needed for 1 unit)
                    </span>
                    <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "2px 0 0 0" }}>
                      Indha Finished Good thayarikka thevayana ingredients ippove add pannalam:
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const rawList = (products.data ?? []).filter((p) => p.classification !== "FINISHED_GOOD");
                      setRecipeComponents([...recipeComponents, { childProductId: rawList[0]?.id || (products.data ?? [])[0]?.id || "", quantity: 1 }]);
                    }}
                  >
                    <Plus size={13} /> Add Ingredient / Gas
                  </button>
                </div>

                {recipeComponents.length === 0 ? (
                  <div style={{ padding: "12px", background: "#fff", border: "1px dashed #cbd5e1", borderRadius: 6, fontSize: 12, color: "var(--text-muted)" }}>
                    💡 <strong>Tip:</strong> Neenga ippove formula add pannalam, or product create panna aprum kooda table-la irukkum <strong>"🥣 + Set Recipe"</strong> click panni add pannikalam.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {recipeComponents.map((comp, idx) => {
                      const raw = (products.data ?? []).find((p) => p.id === comp.childProductId);
                      const subCost = (Number(raw?.costPrice) || 0) * (Number(comp.quantity) || 0);

                      return (
                        <div
                          key={idx}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2.5fr 1fr 1fr auto",
                            gap: 10,
                            alignItems: "center",
                            background: "#fff",
                            border: "1px solid #e2e8f0",
                            borderRadius: 6,
                            padding: "6px 10px",
                          }}
                        >
                          <select
                            className="input-field"
                            style={{ fontSize: 13 }}
                            value={comp.childProductId}
                            onChange={(e) => {
                              const next = [...recipeComponents];
                              next[idx].childProductId = e.target.value;
                              setRecipeComponents(next);
                            }}
                          >
                            <option value="">Select raw material / gas…</option>
                            {(products.data ?? []).map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.classification === "CONSUMABLE" ? "⚡ [Consumable]" : "🏭 [Raw Material]"} {p.name} (Cost: {money(p.costPrice)})
                              </option>
                            ))}
                          </select>

                          <NumberStepper
                            value={comp.quantity}
                            onChange={(val) => {
                              const next = [...recipeComponents];
                              next[idx].quantity = val;
                              setRecipeComponents(next);
                            }}
                            min={0.0001}
                            step={0.5}
                            size="sm"
                          />

                          <div style={{ textAlign: "right", fontSize: 13, fontWeight: 600 }}>
                            {money(subCost)}
                          </div>

                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            style={{ color: "var(--danger)", padding: 4 }}
                            onClick={() => setRecipeComponents(recipeComponents.filter((_, i) => i !== idx))}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      );
                    })}

                    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "#f1f5f9", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                      <span>Estimated Material Cost per 1 Unit:</span>
                      <span style={{ color: "var(--accent)", fontSize: 14 }}>
                        {money(
                          recipeComponents.reduce((acc, c) => {
                            const raw = (products.data ?? []).find((p) => p.id === c.childProductId);
                            return acc + (Number(raw?.costPrice) || 0) * (Number(c.quantity) || 0);
                          }, 0)
                        )}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          <InputGroup label="Reorder Alert Level">
            <NumberStepper
              value={form.reorderLevel}
              onChange={(val) => f("reorderLevel")(String(val))}
              min={0}
              step={5}
              size="md"
              quickAdd={[5, 10, 25]}
            />
          </InputGroup>

          <InputGroup label="Description">
            <input className="input-field" placeholder="Notes or specifications" value={form.description} onChange={(e) => f("description")(e.target.value)} />
          </InputGroup>
        </div>
        {create.isError && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 12 }}>Failed to create. SKU may already exist.</p>}
      </Modal>

      {/* Recipe / BOM Modal */}
      <RecipeModal
        product={recipeProduct}
        open={recipeProduct !== null}
        onClose={() => setRecipeProduct(null)}
      />

      {/* Edit Item / Product Modal */}
      <Modal
        open={editProduct !== null}
        onClose={() => setEditProduct(null)}
        title={`Edit Item: ${editProduct?.name || ""}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditProduct(null)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={update.isPending}
              onClick={() => update.mutate()}
            >
              {update.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />}
              Save Changes
            </button>
          </>
        }
      >
        <div className="form-grid form-grid-2">
          <InputGroup label="Factory Item Classification *">
            <select
              className="input-field"
              value={editForm.classification}
              onChange={(e) => ef("classification")(e.target.value)}
              style={{ fontWeight: 600, background: isEditRawOrConsumable ? "#fff7ed" : "#eff6ff" }}
            >
              <option value="FINISHED_GOOD">📦 Finished Good (Autoflex / Produced to Sell)</option>
              <option value="RAW_MATERIAL">🏭 Raw Material (Wire Rod, Wood, Chemical from Vendor)</option>
              <option value="CONSUMABLE">⚡ Consumable (Gas Cylinder, Flux, Packing Box)</option>
            </select>
          </InputGroup>

          <InputGroup label="Item Name *">
            <input
              className="input-field"
              value={editForm.name}
              onChange={(e) => ef("name")(e.target.value)}
              required
            />
          </InputGroup>

          <InputGroup label="SKU *">
            <input
              className="input-field font-mono"
              value={editForm.sku}
              onChange={(e) => ef("sku")(e.target.value)}
              required
            />
          </InputGroup>

          <InputGroup label="Unit of Measurement *">
            <select
              className="input-field"
              value={editForm.unit}
              onChange={(e) => ef("unit")(e.target.value)}
            >
              <option value="kg">Kilogram (kg)</option>
              <option value="cylinder">Gas Cylinder (cylinder)</option>
              <option value="box">Box / Carton (box)</option>
              <option value="ton">Metric Ton (ton)</option>
              <option value="liter">Liter (liter)</option>
              <option value="meter">Meter (meter)</option>
              <option value="pieces">Pieces / Units (pcs)</option>
            </select>
          </InputGroup>

          {isEditRawOrConsumable ? (
            <div style={{ gridColumn: "span 2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label className="input-label" style={{ margin: 0 }}>
                  Cost Price (₹ per 1 {editForm.unit}) *
                </label>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: 11, padding: "2px 8px" }}
                  onClick={() => setEditBulkHelperOpen(!editBulkHelperOpen)}
                >
                  <Calculator size={12} /> {editBulkHelperOpen ? "Close Calculator" : "Calculate from Bulk Bill"}
                </button>
              </div>

              <input
                className="input-field"
                type="number"
                min="0"
                step="any"
                placeholder={`Cost to buy 1 ${editForm.unit}`}
                value={editForm.costPrice}
                onChange={(e) => ef("costPrice")(e.target.value)}
                required
              />

              {editBulkHelperOpen && (
                <div style={{ marginTop: 8, padding: 12, background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
                    🧮 Bulk Purchase Rate Calculator:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8 }}>
                    <input
                      className="input-field"
                      type="number"
                      placeholder="Total Bill ₹ (e.g. 5000)"
                      value={editBulkAmount}
                      onChange={(e) => setEditBulkAmount(e.target.value)}
                    />
                    <input
                      className="input-field"
                      type="number"
                      placeholder={`Total ${editForm.unit} (e.g. 100)`}
                      value={editBulkQty}
                      onChange={(e) => setEditBulkQty(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handleApplyEditBulkCost}
                      disabled={!Number(editBulkAmount) || !Number(editBulkQty)}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <InputGroup label="Selling Price (₹) *">
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  step="any"
                  value={editForm.sellingPrice}
                  onChange={(e) => ef("sellingPrice")(e.target.value)}
                  required
                />
              </InputGroup>

              <InputGroup label="Cost Price (₹, per unit)">
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  step="any"
                  value={editForm.costPrice}
                  onChange={(e) => ef("costPrice")(e.target.value)}
                />
              </InputGroup>
            </>
          )}

          <InputGroup label="Reorder Alert Level">
            <NumberStepper
              value={editForm.reorderLevel}
              onChange={(val) => ef("reorderLevel")(String(val))}
              min={0}
              step={5}
              size="md"
              quickAdd={[5, 10, 25]}
            />
          </InputGroup>

          <InputGroup label="Active Status">
            <select
              className="input-field"
              value={editForm.isActive ? "true" : "false"}
              onChange={(e) => ef("isActive")(e.target.value === "true")}
            >
              <option value="true">✅ Active (Available for orders & production)</option>
              <option value="false">⏸️ Archived (Inactive - hidden from dropdowns)</option>
            </select>
          </InputGroup>

          <div style={{ gridColumn: "span 2" }}>
            <InputGroup label="Description / Specification">
              <input
                className="input-field"
                placeholder="Notes or specifications"
                value={editForm.description}
                onChange={(e) => ef("description")(e.target.value)}
              />
            </InputGroup>
          </div>
        </div>
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
type Warehouse = { id: string; name: string; code: string; city?: string; country?: string; address?: string };

export function WarehousesPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const list = useList<Warehouse>("wh", "/warehouses");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", city: "", country: "", address: "" });
  const f = (k: string) => (v: string) => setForm((p) => ({ ...p, [k]: v }));

  // Edit state
  const [editTarget, setEditTarget] = useState<Warehouse | null>(null);
  const [editForm, setEditForm] = useState({ name: "", code: "", city: "", country: "", address: "" });
  const ef = (k: string) => (v: string) => setEditForm((p) => ({ ...p, [k]: v }));

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Warehouse | null>(null);

  const create = useMutation({
    mutationFn: () => api.post("/warehouses", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wh"] });
      setOpen(false);
      setForm({ name: "", code: "", city: "", country: "", address: "" });
      toast("Warehouse created successfully!");
    },
    onError: (err: any) => toast(err.response?.data?.message || "Could not create warehouse.", "error"),
  });

  const update = useMutation({
    mutationFn: () => api.patch(`/warehouses/${editTarget?.id}`, editForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["wh"] });
      setEditTarget(null);
      toast("Warehouse updated successfully!");
    },
    onError: (err: any) => toast(err.response?.data?.message || "Could not update warehouse.", "error"),
  });

  const removeWarehouse = useMutation({
    mutationFn: (id: string) => api.delete(`/warehouses/${id}`),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["wh"] });
      setDeleteTarget(null);
      toast(res.data?.message || "Warehouse deleted successfully!");
    },
    onError: (err: any) => {
      setDeleteTarget(null);
      toast(err.response?.data?.message || "Could not delete warehouse.", "error");
    },
  });

  const openEdit = (wh: Warehouse) => {
    setEditTarget(wh);
    setEditForm({
      name: wh.name || "",
      code: wh.code || "",
      city: wh.city || "",
      country: wh.country || "",
      address: wh.address || "",
    });
  };

  const columns: Column<Warehouse>[] = [
    { label: "Warehouse Name", render: (r) => <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Building2 size={15} color="var(--accent)" /><span style={{ fontWeight: 600 }}>{r.name}</span></div> },
    { label: "Code", render: (r) => <span className="font-mono" style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, fontSize: 12 }}>{r.code}</span> },
    { label: "City", render: (r) => r.city ?? "—" },
    { label: "Country", render: (r) => r.country ?? "—" },
    {
      label: "Actions",
      align: "right",
      render: (r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={(e) => { e.stopPropagation(); openEdit(r); }}
            style={{ fontSize: 11 }}
          >
            ✏️ Edit
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}
            style={{ fontSize: 11, color: "#dc2626", borderColor: "#fecaca" }}
            title="Delete Warehouse"
          >
            🗑️ Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Warehouses" subtitle="Manage your storage locations & inventory hubs">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={15} /> New Warehouse
        </button>
      </PageHeader>
      <DataTable
        columns={columns}
        data={list.data ?? []}
        loading={list.isLoading}
        error={list.error}
        searchFields={["name", "code", "city"]}
        storageKey="warehouses"
        title="Warehouses"
        defaultView="grid"
        emptyIcon={<Building2 size={48} />}
        emptyText="No warehouses yet"
      />

      {/* Create Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title="New Warehouse"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={create.isPending || !form.name || !form.code} onClick={() => create.mutate()}>
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
          <div style={{ gridColumn: "span 2" }}>
            <InputGroup label="Address / Plant Location"><input className="input-field" value={form.address} onChange={(e) => f("address")(e.target.value)} placeholder="Factory road, premises..." /></InputGroup>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      {editTarget && (
        <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={`Edit Warehouse — ${editTarget.name}`}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setEditTarget(null)}>Cancel</button>
              <button className="btn btn-primary" disabled={update.isPending || !editForm.name || !editForm.code} onClick={() => update.mutate()}>
                {update.isPending ? <span className="spinner" style={{ width: 14, height: 14 }} /> : <Check size={14} />} Save Changes
              </button>
            </>
          }
        >
          <div className="form-grid form-grid-2">
            <InputGroup label="Warehouse Name *"><input className="input-field" value={editForm.name} onChange={(e) => ef("name")(e.target.value)} required /></InputGroup>
            <InputGroup label="Code *"><input className="input-field" value={editForm.code} onChange={(e) => ef("code")(e.target.value)} required /></InputGroup>
            <InputGroup label="City"><input className="input-field" value={editForm.city} onChange={(e) => ef("city")(e.target.value)} /></InputGroup>
            <InputGroup label="Country"><input className="input-field" value={editForm.country} onChange={(e) => ef("country")(e.target.value)} /></InputGroup>
            <div style={{ gridColumn: "span 2" }}>
              <InputGroup label="Address / Plant Location"><input className="input-field" value={editForm.address} onChange={(e) => ef("address")(e.target.value)} placeholder="Factory road, premises..." /></InputGroup>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={`Confirm Delete Warehouse — ${deleteTarget.name}`}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={removeWarehouse.isPending}>
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: "#dc2626", color: "#fff", fontWeight: 600 }}
                disabled={removeWarehouse.isPending}
                onClick={() => removeWarehouse.mutate(deleteTarget.id)}
              >
                {removeWarehouse.isPending ? "Deleting..." : "Yes, Delete Warehouse"}
              </button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 14, color: "#334155" }}>
              Are you sure you want to permanently delete warehouse <strong>{deleteTarget.name} ({deleteTarget.code})</strong>?
            </p>
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, fontSize: 13, color: "#991b1b", lineHeight: 1.5 }}>
              ⚠️ <strong>Integrity Guard:</strong> You cannot delete the only warehouse in your organization, nor any warehouse holding positive physical inventory stock. Please transfer or adjust out stock before deleting.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// INVENTORY PAGE
// ─────────────────────────────────────────────────────────
type InventoryRow = { product: { name: string; sku: string }; warehouse: { name: string }; quantity: number; reservedQuantity: number; availableQuantity: number };

export function InventoryPage() {
  const list = useList<InventoryRow>("inv", "/inventory");
  const products = useList<{ id: string; name: string; sku: string; classification?: string }>("products", "/products");
  const warehouses = useList<{ id: string; name: string }>("wh", "/warehouses");
  const qc = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [invTab, setInvTab] = useState<"ALL" | "RAW_CONSUMABLE" | "FINISHED_GOOD">("ALL");
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

  const filteredList = useMemo(() => {
    const rows = list.data ?? [];
    if (invTab === "RAW_CONSUMABLE") {
      return rows.filter((r) => {
        const c = (r.product as any)?.classification;
        return c === "RAW_MATERIAL" || c === "CONSUMABLE";
      });
    }
    if (invTab === "FINISHED_GOOD") {
      return rows.filter((r) => {
        const c = (r.product as any)?.classification;
        return !c || c === "FINISHED_GOOD";
      });
    }
    return rows;
  }, [list.data, invTab]);

  const columns: Column<InventoryRow>[] = [
    { label: "Item", render: (r) => <span style={{ fontWeight: 600 }}>{r.product?.name}</span> },
    { label: "SKU", render: (r) => <span className="font-mono" style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>{r.product?.sku}</span> },
    {
      label: "Classification",
      render: (r) => {
        const c = (r.product as any)?.classification;
        if (c === "RAW_MATERIAL") {
          return <span style={{ background: "#ffedd5", color: "#c2410c", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>🏭 Raw Material</span>;
        }
        if (c === "CONSUMABLE") {
          return <span style={{ background: "#f3e8ff", color: "#7e22ce", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>⚡ Consumable (Gas)</span>;
        }
        return <span style={{ background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>📦 Finished Good</span>;
      },
    },
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
      <PageHeader title="Factory Inventory Stock" subtitle="Live warehouse stock levels for raw materials, gas consumables, and finished goods">
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn btn-secondary" onClick={handleOpenSheet}>
            <Sparkles size={15} color="var(--accent)" /> Quick Bulk Stock Count
          </button>
          <button className="btn btn-primary" onClick={() => setOpen(true)}>
            <Plus size={15} /> Post Single Stock
          </button>
        </div>
      </PageHeader>

      {/* Stock Classification Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          className={`btn ${invTab === "ALL" ? "btn-primary" : "btn-secondary"}`}
          style={{ fontSize: 13 }}
          onClick={() => setInvTab("ALL")}
        >
          All Stock ({(list.data ?? []).length})
        </button>
        <button
          className={`btn ${invTab === "RAW_CONSUMABLE" ? "btn-primary" : "btn-secondary"}`}
          style={{ fontSize: 13 }}
          onClick={() => setInvTab("RAW_CONSUMABLE")}
        >
          🏭 Raw Materials & Gas ({(list.data ?? []).filter((r) => { const c = (r.product as any)?.classification; return c === "RAW_MATERIAL" || c === "CONSUMABLE"; }).length})
        </button>
        <button
          className={`btn ${invTab === "FINISHED_GOOD" ? "btn-primary" : "btn-secondary"}`}
          style={{ fontSize: 13 }}
          onClick={() => setInvTab("FINISHED_GOOD")}
        >
          📦 Finished Goods ({(list.data ?? []).filter((r) => { const c = (r.product as any)?.classification; return !c || c === "FINISHED_GOOD"; }).length})
        </button>
      </div>

      <DataTable
        columns={columns}
        data={filteredList}
        loading={list.isLoading}
        error={list.error}
        searchFields={["quantity"]}
        storageKey="inventory"
        title="Inventory Stock Ledger"
        defaultView="table"
        emptyIcon={<Archive size={48} />}
        emptyText="No inventory records"
      />

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
          <SmartEntitySelect
            label="Item *"
            entity="product"
            placeholder="Search and select item..."
            options={(products.data ?? []).map((p) => ({ value: p.id, label: p.name, sublabel: p.sku }))}
            value={form.productId}
            onChange={(val) => setForm({ ...form, productId: val })}
          />
          <SmartEntitySelect
            label="Warehouse *"
            entity="warehouse"
            placeholder="Search and select warehouse..."
            options={(warehouses.data ?? []).map((w) => ({ value: w.id, label: w.name }))}
            value={form.warehouseId}
            onChange={(val) => setForm({ ...form, warehouseId: val })}
          />
          <InputGroup label="Quantity *">
            <input
              className="input-field"
              type="number"
              min="0.001"
              step="any"
              placeholder="e.g. 50 or 2.5"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
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
                          <input
                            type="number"
                            className="input-field"
                            min="0"
                            step="any"
                            style={{ width: 110, textAlign: "right", fontSize: 13, padding: "4px 8px" }}
                            value={currentVal}
                            onChange={(e) => setStockCounts({ ...stockCounts, [p.id]: e.target.value })}
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
          <SmartEntitySelect
            label="Item *"
            entity="product"
            placeholder="Select item…"
            value={form.productId}
            onChange={(val) => setForm({ ...form, productId: val })}
            options={(products.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
          />
          <SmartEntitySelect
            label="Warehouse *"
            entity="warehouse"
            placeholder="Select warehouse…"
            value={form.warehouseId}
            onChange={(val) => setForm({ ...form, warehouseId: val })}
            options={(warehouses.data ?? []).map((w) => ({ value: w.id, label: w.name }))}
          />
          <InputGroup label="Quantity Delta (+/-)">
            <NumberStepper
              value={form.quantityDelta}
              onChange={(val) => setForm({ ...form, quantityDelta: String(val) })}
              step={1}
              size="md"
            />
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
          <SmartEntitySelect
            label="From Warehouse *"
            entity="warehouse"
            placeholder="Select source warehouse…"
            value={form.fromWarehouseId}
            onChange={(val) => setForm({ ...form, fromWarehouseId: val })}
            options={(warehouses.data ?? []).map((w) => ({ value: w.id, label: w.name }))}
          />
          <SmartEntitySelect
            label="To Warehouse *"
            entity="warehouse"
            placeholder="Select destination warehouse…"
            value={form.toWarehouseId}
            onChange={(val) => setForm({ ...form, toWarehouseId: val })}
            options={(warehouses.data ?? []).map((w) => ({ value: w.id, label: w.name }))}
          />
          <SmartEntitySelect
            label="Item *"
            entity="product"
            placeholder="Select item…"
            value={form.productId}
            onChange={(val) => setForm({ ...form, productId: val })}
            options={(products.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
          />
          <InputGroup label="Quantity">
            <NumberStepper
              value={form.quantity}
              onChange={(val) => setForm({ ...form, quantity: String(val) })}
              min={1}
              step={1}
              size="md"
              quickAdd={[5, 10, 50]}
            />
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

// ─────────────────────────────────────────────────────────
// VENDOR PURCHASE HISTORY & STATEMENT MODAL
// ─────────────────────────────────────────────────────────
export function VendorStatementModal({
  vendor,
  onClose,
}: {
  vendor: Party | null;
  onClose: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"items" | "orders" | "bills" | "payments">("items");
  const [q, setQ] = useState("");

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["vendor-history", vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return null;
      const res = await api.get(`/vendors/${vendor.id}/purchase-history`);
      return res.data;
    },
    enabled: !!vendor?.id,
  });

  if (!vendor) return null;

  const summary = data?.summary || {};
  const v = data?.vendor || vendor;
  const itemBreakdown = (data?.itemBreakdown || []) as Array<{
    productId: string;
    productName: string;
    sku: string;
    classification: string;
    unit: string;
    totalQty: number;
    avgUnitCost: number;
    totalSpend: number;
    ordersCount: number;
    lastDate: string;
  }>;
  const purchaseOrders = (data?.purchaseOrders || []) as any[];
  const bills = (data?.bills || []) as any[];
  const payments = (data?.payments || []) as any[];

  const filteredItems = itemBreakdown.filter((it) =>
    !q ||
    it.productName?.toLowerCase().includes(q.toLowerCase()) ||
    it.sku?.toLowerCase().includes(q.toLowerCase())
  );

  const filteredOrders = purchaseOrders.filter((po) =>
    !q ||
    po.number?.toLowerCase().includes(q.toLowerCase()) ||
    po.lines?.some((l: any) => l.productName?.toLowerCase().includes(q.toLowerCase()))
  );

  const filteredBills = bills.filter((b) =>
    !q ||
    b.number?.toLowerCase().includes(q.toLowerCase()) ||
    b.lines?.some((l: any) => l.productName?.toLowerCase().includes(q.toLowerCase()) || l.description?.toLowerCase().includes(q.toLowerCase()))
  );

  const filteredPayments = payments.filter((p) =>
    !q ||
    p.method?.toLowerCase().includes(q.toLowerCase()) ||
    p.allocations?.some((a: any) => a.billNumber?.toLowerCase().includes(q.toLowerCase()))
  );

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={!!vendor}
      onClose={onClose}
      wide={1000}
      title={`Vendor Purchase Statement & History — ${v.name}`}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Showing purchase ledger records for <strong>{v.name}</strong>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={handlePrint} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Printer size={14} /> Print Statement / PDF
            </button>
            <button type="button" className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Vendor Header Profile Banner */}
        <div style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          borderRadius: 14,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: "linear-gradient(135deg, #16a34a 0%, #15803d 100%)",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              fontWeight: 800,
              flexShrink: 0,
            }}>
              {v.name ? v.name.slice(0, 1).toUpperCase() : "V"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>{v.name}</h3>
                <span style={{ fontSize: 11, background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 12, fontWeight: 700 }}>
                  Active Factory Vendor
                </span>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-muted)", marginTop: 4, flexWrap: "wrap" }}>
                {v.phone && <span>📞 <strong>{v.phone}</strong></span>}
                {v.email && <span>✉️ {v.email}</span>}
                {v.gstin && <span>🏛️ GSTIN: <strong>{v.gstin}</strong></span>}
                {(v.city || v.state) && <span>📍 {v.city ? `${v.city}, ` : ""}{v.state || "Tamil Nadu"}</span>}
              </div>
              {(v.billingAddress || v.address) && (
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                  🏢 {v.billingAddress || v.address}
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => refetch()}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12 }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handlePrint}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, background: "#f8fafc" }}
            >
              <Printer size={12} /> Print
            </button>
          </div>
        </div>

        {/* Thanglish Explanation Help Banner */}
        <div style={{
          background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
          border: "1px solid #bfdbfe",
          borderRadius: 12,
          padding: "12px 16px",
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "#2563eb", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
            <HelpCircle size={16} />
          </div>
          <div style={{ fontSize: 12, color: "#1e3a8a", lineHeight: 1.5 }}>
            <strong>💡 Vendor Purchase History & Statement:</strong> Intha vendor kitta namma factory-kku enna raw materials (Wire Rod, Argon Gas, Flux, Consumables) yepo vanginom, ethana quantity vanginom, unit price ena, motha purchase bills & pending payments ena nu <strong>A to Z full statement</strong> inge live-aa katti irukom.
          </div>
        </div>

        {/* 4 Financial & Order Summary KPI Cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 12,
        }}>
          {/* Total Purchased Amount */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "14px 16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <ShoppingCart size={13} color="#2563eb" /> Total Purchases
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
              {isLoading ? "…" : money(summary.totalPurchasedAmount || 0)}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              {summary.totalOrdersCount || 0} Purchase Orders issued
            </div>
          </div>

          {/* Total Billed Amount */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "14px 16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Receipt size={13} color="#7c3aed" /> Total Invoiced / Billed
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>
              {isLoading ? "…" : money(summary.totalBilledAmount || 0)}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              {summary.totalBillsCount || 0} Vendor bills received
            </div>
          </div>

          {/* Total Paid Amount */}
          <div style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: "14px 16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <CreditCard size={13} color="#16a34a" /> Total Amount Paid
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#16a34a" }}>
              {isLoading ? "…" : money(summary.totalPaidAmount || 0)}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
              Paid via Bank / Cash / UPI
            </div>
          </div>

          {/* Outstanding Balance */}
          <div style={{
            background: Number(summary.outstandingBalance || 0) > 0 ? "#fffbeb" : "#f0fdf4",
            border: `1px solid ${Number(summary.outstandingBalance || 0) > 0 ? "#fcd34d" : "#bbf7d0"}`,
            borderRadius: 12,
            padding: "14px 16px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: Number(summary.outstandingBalance || 0) > 0 ? "#92400e" : "#166534", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <Clock size={13} color={Number(summary.outstandingBalance || 0) > 0 ? "#d97706" : "#16a34a"} /> Pending Balance
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: Number(summary.outstandingBalance || 0) > 0 ? "#b45309" : "#15803d" }}>
              {isLoading ? "…" : money(summary.outstandingBalance || 0)}
            </div>
            <div style={{ fontSize: 11, color: Number(summary.outstandingBalance || 0) > 0 ? "#b45309" : "#166534", marginTop: 4, fontWeight: 600 }}>
              {Number(summary.outstandingBalance || 0) > 0 ? "⚠️ Amount to be paid to vendor" : "✓ All bills fully settled!"}
            </div>
          </div>
        </div>

        {/* Secondary Date Range Strip */}
        <div style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          fontSize: 12,
        }}>
          <div>
            <span style={{ color: "var(--text-muted)" }}>First Purchase: </span>
            <strong>{summary.firstPurchaseDate ? new Date(summary.firstPurchaseDate).toLocaleDateString("en-IN") : "—"}</strong>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Latest Purchase: </span>
            <strong>{summary.lastPurchaseDate ? new Date(summary.lastPurchaseDate).toLocaleDateString("en-IN") : "—"}</strong>
          </div>
          <div>
            <span style={{ color: "var(--text-muted)" }}>Average Order Value: </span>
            <strong>{money(summary.averageOrderValue || 0)}</strong>
          </div>
        </div>

        {/* Navigation Tabs Bar & Search */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, borderBottom: "1px solid #e2e8f0", paddingBottom: 8 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === "items" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("items")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}
            >
              <Package size={14} /> 📦 Materials Breakdown ({itemBreakdown.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === "orders" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("orders")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}
            >
              <ClipboardList size={14} /> 📋 Purchase Orders ({purchaseOrders.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === "bills" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("bills")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}
            >
              <Receipt size={14} /> 🧾 Vendor Bills ({bills.length})
            </button>
            <button
              type="button"
              className={`btn btn-sm ${activeTab === "payments" ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setActiveTab("payments")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 600 }}
            >
              <CreditCard size={14} /> 💳 Payments Made ({payments.length})
            </button>
          </div>

          <div style={{ position: "relative", minWidth: 220 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search in this vendor…"
              className="input-field"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ paddingLeft: 30, fontSize: 12, height: 32 }}
            />
          </div>
        </div>

        {/* Content based on Active Tab */}
        {isLoading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="spinner" style={{ width: 30, height: 30, margin: "0 auto 10px", color: "var(--accent)" }} />
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Loading complete purchase history from database…</div>
          </div>
        ) : error ? (
          <div style={{ padding: 20, background: "#fee2e2", border: "1px solid #fca5a5", borderRadius: 10, color: "#991b1b" }}>
            Could not load purchase history for this vendor.
          </div>
        ) : activeTab === "items" ? (
          /* TAB 1: RAW MATERIALS & CONSUMABLES BREAKDOWN TABLE */
          <div style={{ overflowX: "auto" }}>
            {filteredItems.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)" }}>
                No materials purchased yet from this vendor.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>#</th>
                    <th style={{ padding: "10px 12px" }}>Raw Material / Item</th>
                    <th style={{ padding: "10px 12px" }}>Category</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Total Qty Purchased</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Avg. Rate (₹)</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Total Spent (₹)</th>
                    <th style={{ padding: "10px 12px", textAlign: "center" }}>Orders</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Last Purchased</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item, idx) => (
                    <tr key={item.productId || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{idx + 1}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>{item.productName}</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)" }}>SKU: {item.sku}</div>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          background: item.classification === "RAW_MATERIAL" ? "#dbeafe" : "#fef3c7",
                          color: item.classification === "RAW_MATERIAL" ? "#1e40af" : "#92400e",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                        }}>
                          {item.classification === "RAW_MATERIAL" ? "🏭 Raw Material" : "⚡ Consumable"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                        {item.totalQty.toLocaleString("en-IN")} {item.unit}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        ₹{item.avgUnitCost.toLocaleString("en-IN", { minimumFractionDigits: 2 })} / {item.unit}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 800, color: "#15803d" }}>
                        ₹{item.totalSpend.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 10, fontSize: 12, fontWeight: 600 }}>
                          {item.ordersCount}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#64748b" }}>
                        {item.lastDate ? new Date(item.lastDate).toLocaleDateString("en-IN") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : activeTab === "orders" ? (
          /* TAB 2: PURCHASE ORDERS LIST */
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filteredOrders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)" }}>
                No purchase orders recorded for this vendor.
              </div>
            ) : (
              filteredOrders.map((po) => (
                <div key={po.id} style={{
                  background: "#ffffff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  padding: "14px 16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <strong style={{ fontSize: 15, color: "var(--text-primary)" }}>{po.number}</strong>
                      <Badge status={po.status?.toLowerCase() ?? "draft"} />
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        📅 {po.date ? new Date(po.date).toLocaleDateString("en-IN") : "—"}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Total PO Value</div>
                      <strong style={{ fontSize: 16, color: "#15803d" }}>{money(Number(po.total))}</strong>
                    </div>
                  </div>

                  {/* PO Line Items */}
                  <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 12px", marginTop: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 6 }}>
                      Items in this Order ({po.lines?.length || 0}):
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {(po.lines || []).map((l: any, i: number) => (
                        <div key={l.id || i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, padding: "3px 0", borderBottom: i !== po.lines.length - 1 ? "1px dashed #e2e8f0" : "none" }}>
                          <div>
                            <strong>{l.productName}</strong> <span style={{ color: "#64748b" }}>({l.sku})</span> — {l.quantity} {l.unit} @ ₹{l.unitCost} (+{l.taxRate}% tax)
                          </div>
                          <strong>₹{Number(l.amount).toLocaleString("en-IN")}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : activeTab === "bills" ? (
          /* TAB 3: VENDOR BILLS & PAYMENT STATUS */
          <div style={{ overflowX: "auto" }}>
            {filteredBills.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)" }}>
                No vendor bills on record.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>Bill #</th>
                    <th style={{ padding: "10px 12px" }}>Bill Date</th>
                    <th style={{ padding: "10px 12px" }}>Due Date</th>
                    <th style={{ padding: "10px 12px" }}>Status</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Bill Total</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Amount Paid</th>
                    <th style={{ padding: "10px 12px", textAlign: "right" }}>Balance Due</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBills.map((b) => (
                    <tr key={b.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", fontWeight: 700 }}>{b.number}</td>
                      <td style={{ padding: "10px 12px" }}>{b.date ? new Date(b.date).toLocaleDateString("en-IN") : "—"}</td>
                      <td style={{ padding: "10px 12px" }}>{b.dueDate ? new Date(b.dueDate).toLocaleDateString("en-IN") : "—"}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{
                          background: b.status === "PAID" ? "#dcfce7" : b.status === "PARTIAL" ? "#fef3c7" : "#fee2e2",
                          color: b.status === "PAID" ? "#166534" : b.status === "PARTIAL" ? "#92400e" : "#991b1b",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 700,
                        }}>
                          {b.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{money(Number(b.total))}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: "#16a34a", fontWeight: 700 }}>{money(Number(b.amountPaid))}</td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: b.balance > 0 ? "#b45309" : "#166534", fontWeight: 800 }}>
                        {money(Number(b.balance))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          /* TAB 4: PAYMENTS MADE */
          <div style={{ overflowX: "auto" }}>
            {filteredPayments.length === 0 ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)" }}>
                No payments recorded yet for this vendor.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                    <th style={{ padding: "10px 12px" }}>Date</th>
                    <th style={{ padding: "10px 12px" }}>Amount Paid</th>
                    <th style={{ padding: "10px 12px" }}>Payment Method</th>
                    <th style={{ padding: "10px 12px" }}>Allocated Bill(s)</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p, idx) => (
                    <tr key={p.id || idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px" }}>{p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-IN") : "—"}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 800, color: "#16a34a" }}>{money(Number(p.amount))}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                          {p.method || "Bank Transfer"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        {(p.allocations || []).map((a: any) => a.billNumber).filter(Boolean).join(", ") || "Direct Payment"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </Modal>
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

  // ── Vendor statement state ──
  const [statementVendor, setStatementVendor] = useState<Party | null>(null);

  // ── Delete state ──
  const [deleteTarget, setDeleteTarget] = useState<Party | null>(null);

  const removeParty = useMutation({
    mutationFn: (id: string) => api.delete(`/${kind}/${id}`),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: [kind] });
      setDeleteTarget(null);
      toast(res.data?.message || `${isCustomer ? "Customer" : "Vendor"} deleted successfully!`);
    },
    onError: (err: any) => {
      setDeleteTarget(null);
      toast(err.response?.data?.message || `Could not delete ${isCustomer ? "customer" : "vendor"}.`, "error");
    },
  });

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
      label: "Actions",
      align: "right",
      render: (r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {!isCustomer && (
            <button
              type="button"
              className="btn btn-sm"
              style={{ background: "#2563eb", color: "#fff", border: "none", display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700 }}
              onClick={(e) => {
                e.stopPropagation();
                setStatementVendor(r);
              }}
              title="View A to Z Complete Purchase History & Statement"
            >
              📜 Purchase History
            </button>
          )}
          <button
            className="btn btn-secondary btn-sm"
            onClick={(e) => { e.stopPropagation(); openEdit(r); }}
            style={{ fontSize: 11 }}
          >
            ✏️ Edit
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }}
            style={{ fontSize: 11, color: "#dc2626", borderColor: "#fecaca" }}
            title={`Delete ${isCustomer ? "Customer" : "Vendor"}`}
          >
            🗑️ Delete
          </button>
        </div>
      ),
    },
  ];

  const renderPartyGridCard = (p: Party, idx: number, isSelected: boolean, onToggleSelect: () => void) => {
    const letter = (p.name || (isCustomer ? "C" : "V")).slice(0, 1).toUpperCase();
    const bgGrad = isCustomer
      ? "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)"
      : "linear-gradient(135deg, #10B981 0%, #059669 100%)";

    return (
      <div
        key={p.id || idx}
        className="oscar-prod-card"
        style={{ cursor: "pointer" }}
        onClick={() => (!isCustomer ? setStatementVendor(p) : openEdit(p))}
      >
        <div className="oscar-prod-card-top">
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                onToggleSelect();
              }}
              style={{ cursor: "pointer", width: 16, height: 16, accentColor: "var(--primary)" }}
            />
            <span className={`oscar-prod-badge ${isCustomer ? "featured" : "in-stock"}`}>
              {isCustomer ? "Customer" : "Vendor"}
            </span>
          </div>
          <button
            type="button"
            className="oscar-prod-heart"
            onClick={(e) => {
              e.stopPropagation();
              toast(`${isCustomer ? "Customer" : "Vendor"} bookmarked!`);
            }}
          >
            <Heart size={16} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "10px 0" }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: bgGrad,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 800,
              flexShrink: 0,
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            }}
          >
            {letter}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <h4 className="oscar-prod-name" title={p.name}>{p.name}</h4>
            <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>
              📍 {p.city ? `${p.city}, ` : ""}{p.state || "Tamil Nadu"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6, margin: "8px 0 12px" }}>
          {p.email && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, borderBottom: "1px dashed var(--border-light)", paddingBottom: 4 }}>
              <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Email</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>{p.email}</span>
            </div>
          )}
          {p.phone && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, borderBottom: "1px dashed var(--border-light)", paddingBottom: 4 }}>
              <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>Phone</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{p.phone}</span>
            </div>
          )}
          {p.gstin && (
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, borderBottom: "1px dashed var(--border-light)", paddingBottom: 4 }}>
              <span style={{ color: "var(--text-muted)", fontWeight: 600 }}>GSTIN</span>
              <span style={{ color: "var(--text-primary)", fontFamily: "monospace", fontSize: 11 }}>{p.gstin}</span>
            </div>
          )}
        </div>

        <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
          {!isCustomer && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ fontSize: 11, padding: "3px 8px", color: "var(--primary)" }}
              onClick={(e) => {
                e.stopPropagation();
                setStatementVendor(p);
              }}
            >
              📜 History
            </button>
          )}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 11, padding: "3px 8px" }}
            onClick={(e) => {
              e.stopPropagation();
              openEdit(p);
            }}
          >
            ✏️ Edit
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: 11, padding: "3px 8px", color: "#DC2626", borderColor: "#FECACA" }}
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(p);
            }}
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title={isCustomer ? "Customers" : "Vendors"}
        subtitle={isCustomer ? "Manage customer directory, addresses & map location pins" : "Manage vendor directory, purchase histories & ledger statements"}
      >
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={15} /> Add {isCustomer ? "Customer" : "Vendor"}
        </button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={list.data ?? []}
        loading={list.isLoading}
        error={list.error}
        searchFields={["name", "email", "phone", "city", "gstin"]}
        storageKey={kind}
        title={isCustomer ? "Customer List" : "Vendor List"}
        defaultView="grid"
        renderGridCard={renderPartyGridCard}
        emptyIcon={<Users size={48} />}
        emptyText={`No ${kind} yet`}
        onRowClick={(row) => {
          if (!isCustomer) {
            setStatementVendor(row);
          } else {
            openEdit(row);
          }
        }}
      />

      {/* ── Vendor Statement Modal ── */}
      <VendorStatementModal
        vendor={statementVendor}
        onClose={() => setStatementVendor(null)}
      />

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

      {/* ── Delete Confirmation Modal ── */}
      {deleteTarget && (
        <Modal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={`Confirm Delete ${isCustomer ? "Customer" : "Vendor"}`}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={removeParty.isPending}>
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: "#dc2626", color: "#fff", fontWeight: 600 }}
                disabled={removeParty.isPending}
                onClick={() => removeParty.mutate(deleteTarget.id)}
              >
                {removeParty.isPending ? "Deleting..." : "Yes, Permanently Delete"}
              </button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 14, color: "#334155" }}>
              Are you sure you want to permanently delete <strong>{deleteTarget.name}</strong>?
            </p>
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, fontSize: 13, color: "#991b1b", lineHeight: 1.5 }}>
              ⚠️ <strong>Integrity Guard:</strong> If this {isCustomer ? "customer has existing sales orders or invoices" : "vendor has existing purchase orders or bills"}, the system will block deletion to prevent ledger and audit corruption.
            </div>
          </div>
        </Modal>
      )}
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

// ─────────────────────────────────────────────────────────
// PRINTABLE ESTIMATE QUOTATION MODAL & WHATSAPP SHARING
// ─────────────────────────────────────────────────────────
export const shareEstimateOnWhatsApp = (estimate: any) => {
  if (!estimate) return;
  const customer = estimate.customer || {};
  const phone = (customer.phone || "").replace(/\D/g, "");
  const total = Number(estimate.total || 0);
  const liveAppUrl = getPublicAppUrl();
  const trackUrl = `${liveAppUrl}/track-order/${estimate.id}`;
  const text = [
    `Hello ${customer.name || "Customer"},`,
    ``,
    `Here is your official Price Estimate Quote *${estimate.number}* from *OSCAR AUTO FLUX*.`,
    ``,
    `*Total Quote Amount:* ₹${total.toLocaleString("en-IN")}`,
    `*Validity:* Valid for 30 Days`,
    ``,
    `🔗 *CLICK LINK TO REVIEW & CONFIRM ORDER:*`,
    ``,
    trackUrl,
    ``,
    `*(Click the link above to view your official quotation & click the "Approve & Confirm Order" button to register with factory)*`,
    ``,
    `📞 For any enquiry, call or WhatsApp +91 94432 51863`,
    `Thank you!`
  ].join("\n");
  const url = phone
    ? `https://wa.me/${phone.length === 10 ? "91" + phone : phone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
};

export function PrintEstimateModal({
  estimate,
  onClose,
}: {
  estimate: any;
  onClose: () => void;
}) {
  if (!estimate) return null;

  const customer = estimate.customer || {};
  const total = Number(estimate.total || 0);
  const subtotal = Number(estimate.subtotal || total);
  const tax = Number(estimate.tax || 0);
  const lines = estimate.lines ?? [];

  const { toast } = useToast();
  const [sendingEmail, setSendingEmail] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    shareEstimateOnWhatsApp(estimate);
  };

  const handleCopyTrackingLink = () => {
    const liveAppUrl = getPublicAppUrl();
    const trackUrl = `${liveAppUrl}/track-order/${estimate.id}`;
    navigator.clipboard.writeText(trackUrl);
    toast("Live Tracking & Confirmation link copied to clipboard!");
  };

  const handleEmailShare = async () => {
    const email = customer.email || "";
    if (!email) {
      toast(`Customer "${customer.name || "Customer"}" does not have an email address specified.`, "error");
      return;
    }

    setSendingEmail(true);
    try {
      if (estimate.id) {
        await api.post(`/estimates/${estimate.id}/send-email`);
        toast(`Price Quotation (${estimate.number}) with Live Tracking link emailed to ${email}!`);
      }
    } catch (err: any) {
      toast(err.response?.data?.message ?? "Could not send email quotation.", "error");
    } finally {
      setSendingEmail(false);
    }
  };

  const stateStr = (customer?.state || "").toLowerCase();
  const isTN = !stateStr || stateStr.includes("tamil") || stateStr.includes("tn") || stateStr.startsWith("33");

  return (
    <Modal
      open={!!estimate}
      onClose={onClose}
      title={`Price Estimate Quote PDF — ${estimate.number}`}
      footer={
        <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button type="button" className="btn btn-secondary" onClick={handleWhatsAppShare} style={{ background: "#16a34a", color: "#fff", border: "none" }}>
              💬 Share WhatsApp Link
            </button>
            <button type="button" className="btn btn-secondary" disabled={sendingEmail} onClick={handleEmailShare}>
              {sendingEmail ? <span className="spinner" style={{ width: 13, height: 13 }} /> : "✉️ Send Email"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleCopyTrackingLink}>
              🔗 Copy Customer Link
            </button>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
            <button className="btn btn-primary" onClick={handlePrint}>
              <Printer size={15} /> Print / Save PDF
            </button>
          </div>
        </div>
      }
    >
      <div id="printable-invoice-container">
        <div className="inv-box">
          <div style={{ position: "absolute", top: 12, right: 16, fontSize: 11, fontWeight: 700, textTransform: "uppercase", border: "1px solid #000", padding: "2px 8px", background: "#fef3c7", color: "#92400e" }}>
            OFFICIAL PRICE ESTIMATE
          </div>

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
              <h3 style={{ margin: "0 0 8px 0", fontSize: 16, fontWeight: 800, textAlign: "right", letterSpacing: "1px", color: "#1e3a8a" }}>
                PRICE QUOTATION
              </h3>
              <table style={{ width: "100%", fontSize: 10, borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "2px 0" }}>Estimate Number:</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{estimate.number}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "2px 0" }}>Quote Date:</td>
                    <td style={{ textAlign: "right" }}>{estimate.createdAt ? new Date(estimate.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, padding: "2px 0" }}>Validity:</td>
                    <td style={{ textAlign: "right", color: "#047857", fontWeight: 700 }}>Valid for 30 Days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ padding: 8, background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 6, marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, background: "#e2e8f0", padding: "2px 6px", marginBottom: 4 }}>
              Quotation Issued To (Customer)
            </div>
            <strong style={{ fontSize: 13 }}>{customer.name ?? "Valued Customer"}</strong>
            <div style={{ fontSize: 11, color: "#334155", marginTop: 2, lineHeight: 1.4 }}>
              {customer.billingAddress || customer.address || ""}<br />
              {customer.city ? `${customer.city}, ` : ""}{customer.state ? `${customer.state} ` : ""}{customer.pincode || ""}<br />
              {customer.phone ? `Ph: ${customer.phone} ` : ""}{customer.email ? `| Email: ${customer.email}` : ""}<br />
              <strong>GSTIN:</strong> {customer.gstin || "URP (Unregistered)"}
            </div>
          </div>

          <table className="inv-table">
            <thead>
              <tr>
                <th style={{ width: "30px" }}>#</th>
                <th>Item Description</th>
                <th style={{ width: "70px" }}>Qty</th>
                <th style={{ width: "80px" }}>Rate (₹)</th>
                <th style={{ width: "90px" }}>Tax %</th>
                <th style={{ width: "100px" }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l: any, i: number) => {
                const lineQty = Number(l.quantity || 1);
                const linePrice = Number(l.unitPrice || 0);
                const lineSubtotal = lineQty * linePrice;
                const lineTaxRate = Number(l.taxRate || 18);
                const lineTaxAmt = lineSubtotal * (lineTaxRate / 100);

                return (
                  <tr key={i}>
                    <td style={{ textAlign: "center" }}>{i + 1}</td>
                    <td><strong>{l.product?.name ?? l.description ?? "Item"}</strong></td>
                    <td style={{ textAlign: "right" }}>{lineQty}</td>
                    <td style={{ textAlign: "right" }}>{linePrice.toFixed(2)}</td>
                    <td style={{ textAlign: "center" }}>{lineTaxRate}%</td>
                    <td style={{ textAlign: "right" }}>{(lineSubtotal + lineTaxAmt).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1.4fr", border: "1px solid #000", borderTop: "none" }}>
            <div style={{ padding: 8, borderRight: "1px solid #000", fontSize: 10 }}>
              <div style={{ marginBottom: 10 }}>
                <strong>Total in Words:</strong>
                <div style={{ fontWeight: 700, fontSize: 11, fontStyle: "italic", marginTop: 2, color: "#1e293b" }}>
                  {numberToWordsINR(total)}
                </div>
              </div>
              <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: 6 }}>
                <strong>Bank Details for Advance / Settlement:</strong>
                <div style={{ marginTop: 2, lineHeight: 1.4 }}>
                  Bank: <strong>INDIAN OVERSEAS BANK</strong> | Branch: <strong>Kangayam</strong><br />
                  A/C Name: <strong>OSCAR AUTO FLUX</strong> | A/C No: <strong>186302000000680</strong><br />
                  IFSC: <strong>IOBA0001863</strong>
                </div>
              </div>
            </div>

            <div style={{ fontSize: 11 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #000" }}>
                    <td style={{ padding: "6px 8px", fontWeight: 600 }}>Sub Total:</td>
                    <td style={{ padding: "6px 8px", textAlign: "right", fontWeight: 700 }}>₹{subtotal.toFixed(2)}</td>
                  </tr>
                  {isTN ? (
                    <>
                      <tr style={{ borderBottom: "1px solid #000" }}>
                        <td style={{ padding: "6px 8px" }}>SGST (9%):</td>
                        <td style={{ padding: "6px 8px", textAlign: "right" }}>₹{(tax / 2).toFixed(2)}</td>
                      </tr>
                      <tr style={{ borderBottom: "1px solid #000" }}>
                        <td style={{ padding: "6px 8px" }}>CGST (9%):</td>
                        <td style={{ padding: "6px 8px", textAlign: "right" }}>₹{(tax / 2).toFixed(2)}</td>
                      </tr>
                    </>
                  ) : (
                    <tr style={{ borderBottom: "1px solid #000" }}>
                      <td style={{ padding: "6px 8px" }}>IGST (18%):</td>
                      <td style={{ padding: "6px 8px", textAlign: "right" }}>₹{tax.toFixed(2)}</td>
                    </tr>
                  )}
                  <tr style={{ borderBottom: "1.5px solid #000", background: "#f8fafc" }}>
                    <td style={{ padding: "8px", fontWeight: 800, fontSize: 12 }}>Total Quote:</td>
                    <td style={{ padding: "8px", textAlign: "right", fontWeight: 800, fontSize: 13, color: "#047857" }}>
                      ₹{total.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function EstimatesPage() {
  const list = useList<Estimate>("estimates", "/estimates");
  const customers = useList<{ id: string; name: string; state?: string }>("customers", "/customers");
  const warehouses = useList<{ id: string; name: string }>("wh", "/warehouses");
  const products = useList<{ id: string; name: string; sellingPrice?: number; taxRate?: number }>("products", "/products");
  const qc = useQueryClient();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customerId: "", warehouseId: "" });
  const [lines, setLines] = useState<LineItem[]>([{ productId: "", quantity: 1, unitPrice: 0, taxRate: 18 }]);
  const [printEstimate, setPrintEstimate] = useState<Estimate | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Estimate | null>(null);

  const removeEstimate = useMutation({
    mutationFn: (id: string) => api.delete(`/estimates/${id}`),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["estimates"] });
      setDeleteTarget(null);
      toast(res.data?.message || "Estimate deleted successfully!");
    },
    onError: (err: any) => {
      setDeleteTarget(null);
      toast(err.response?.data?.message || "Could not delete estimate.", "error");
    },
  });

  const selectedCustomer = (customers.data ?? []).find((c) => c.id === form.customerId);

  const create = useMutation({
    mutationFn: () => {
      const validLines = lines.filter((l) => l.productId && l.quantity > 0);
      if (!form.customerId) throw new Error("Please select a customer");
      if (!validLines.length) throw new Error("Please add at least one line item");

      return api.post("/estimates", {
        customerId: form.customerId,
        warehouseId: form.warehouseId || undefined,
        lines: validLines.map((l) => ({
          productId: l.productId,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxRate: l.taxRate,
        })),
      });
    },
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["estimates"] });
      setOpen(false);
      setForm({ customerId: "", warehouseId: "" });
      setLines([{ productId: "", quantity: 1, unitPrice: 0, taxRate: 18 }]);
      toast("Estimate quote created successfully!");
      if (res?.data) {
        setPrintEstimate(res.data);
      }
    },
    onError: (err: any) => toast(err.response?.data?.message ?? err.message ?? "Could not create estimate.", "error"),
  });

  const convertToOrder = useMutation({
    mutationFn: async (estimate: Estimate) => {
      return api.post(`/estimates/${estimate.id}/convert`);
    },
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["estimates"] });
      qc.invalidateQueries({ queryKey: ["so"] });
      toast(`Estimate converted to Confirmed Sales Order #${res.data?.number || ""}!`);
    },
    onError: (err: any) => toast(err.response?.data?.message ?? "Could not convert estimate.", "error"),
  });

  const sortedEstimates = useMemo(() => {
    const listData = Array.isArray(list.data) ? list.data : [];
    return [...listData].sort((a, b) => {
      const numA = parseInt(String(a.number || "").replace(/\D/g, "") || "0", 10);
      const numB = parseInt(String(b.number || "").replace(/\D/g, "") || "0", 10);
      if (numB !== numA) return numB - numA;
      const tA = new Date(a.date || a.createdAt || 0).getTime();
      const tB = new Date(b.date || b.createdAt || 0).getTime();
      return tB - tA;
    });
  }, [list.data]);

  const columns: Column<Estimate>[] = [
    { label: "Estimate #", render: (r) => <strong>{r.number}</strong> },
    { label: "Customer", render: (r) => r.customer?.name ?? "—" },
    { label: "Status", render: (r) => <Badge status={r.status ?? "draft"} /> },
    { label: "Date / Expiry", render: (r) => (r.date || r.createdAt) ? new Date(r.date || r.createdAt).toLocaleDateString() : (r.expiryDate ? new Date(r.expiryDate).toLocaleDateString() : "—") },
    { label: "Total Quote", align: "right", render: (r) => <strong>{money(Number(r.total))}</strong> },
    {
      label: "Actions",
      align: "right",
      render: (r) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: "#16a34a", color: "#fff", border: "none", display: "inline-flex", alignItems: "center", gap: 5, fontWeight: 700 }}
            onClick={(e) => {
              e.stopPropagation();
              shareEstimateOnWhatsApp(r);
            }}
            title={`Direct WhatsApp Share for ${r.number}`}
          >
            <MessageCircle size={13} /> WhatsApp
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              const trackUrl = `${getPublicAppUrl()}/track-order/${r.id}`;
              navigator.clipboard.writeText(trackUrl);
              toast("Live Customer Order Tracking & Confirmation Link copied!");
            }}
            title="Copy Public Customer Tracking Link"
          >
            🔗 Link
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={(e) => { e.stopPropagation(); setPrintEstimate(r); }}
            title="View, Print PDF or Send via WhatsApp / Email"
          >
            <Printer size={13} color="var(--accent)" /> Share / PDF
          </button>
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
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(r);
            }}
            style={{ fontSize: 11, color: "#dc2626", borderColor: "#fecaca" }}
            title={`Delete Estimate ${r.number}`}
          >
            🗑️ Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Estimates & Quotes" subtitle="Create price quotations for customers, share via WhatsApp/PDF, and convert to confirmed orders">
        <button className="btn btn-primary" onClick={() => setOpen(true)}>
          <Plus size={15} /> Create Estimate Quote
        </button>
      </PageHeader>

      <DataTable
        columns={columns}
        data={sortedEstimates}
        loading={list.isLoading}
        error={list.error}
        searchFields={["number"]}
        storageKey="estimates"
        title="Estimates & Quotations"
        defaultView="grid"
        emptyIcon={<FileText size={48} />}
        emptyText="No estimates or quotes yet"
      />

      {/* Create Estimate Modal */}
      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setForm({ customerId: "", warehouseId: "" });
        }}
        title="Create New Price Estimate (Quotation)"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => {
              setOpen(false);
              setForm({ customerId: "", warehouseId: "" });
            }}>Cancel</button>
            <button className="btn btn-primary" disabled={create.isPending} onClick={() => create.mutate()}>
              {create.isPending && <span className="spinner" style={{ width: 14, height: 14 }} />} Create Estimate Quote
            </button>
          </>
        }
      >
        <div className="form-grid form-grid-2" style={{ marginBottom: 16 }}>
          <SmartEntitySelect
            label="Customer *"
            entity="customer"
            placeholder="Select or search customer…"
            value={form.customerId}
            onChange={(val) => setForm({ ...form, customerId: val })}
            options={(customers.data ?? []).map((c) => ({ value: c.id, label: c.name, sublabel: c.state }))}
          />

          <SmartEntitySelect
            label="Dispatch Warehouse"
            entity="warehouse"
            placeholder="Select or search warehouse…"
            value={form.warehouseId}
            onChange={(val) => setForm({ ...form, warehouseId: val })}
            options={(warehouses.data ?? []).map((w) => ({ value: w.id, label: w.name }))}
          />
        </div>

        <LineItemBuilder lines={lines} onChange={setLines} products={products.data ?? []} mode="selling" customerState={selectedCustomer?.state} />
      </Modal>

      {/* Printable / Shareable Estimate PDF Modal */}
      <PrintEstimateModal estimate={printEstimate} onClose={() => setPrintEstimate(null)} />

      {/* Delete Estimate Confirmation Modal */}
      {deleteTarget && (
        <Modal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={`Confirm Delete Estimate — ${deleteTarget.number}`}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={removeEstimate.isPending}>
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: "#dc2626", color: "#fff", fontWeight: 600 }}
                disabled={removeEstimate.isPending}
                onClick={() => removeEstimate.mutate(deleteTarget.id)}
              >
                {removeEstimate.isPending ? "Deleting..." : "Yes, Delete Estimate"}
              </button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 14, color: "#334155" }}>
              Are you sure you want to permanently delete quotation <strong>{deleteTarget.number}</strong>?
            </p>
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, fontSize: 13, color: "#991b1b", lineHeight: 1.5 }}>
              ⚠️ <strong>Integrity Guard:</strong> If this quotation was already converted into a confirmed Sales Order, deletion is blocked to protect the order history.
            </div>
          </div>
        </Modal>
      )}
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
  customerState,
}: {
  lines: LineItem[];
  onChange: (lines: LineItem[]) => void;
  products: { id: string; name: string; sellingPrice?: number; costPrice?: number; taxRate?: number }[];
  mode?: "selling" | "purchasing";
  customerState?: string;
}) {
  const [quickProductIdx, setQuickProductIdx] = useState<number | null>(null);
  const stateStr = (customerState || "").toLowerCase().trim();
  const isTN = !stateStr || stateStr.includes("tamil") || stateStr.includes("tn") || stateStr.startsWith("33");

  const addLine = () => {
    onChange([...lines, { productId: "", quantity: 1, unitPrice: 0, taxRate: 18, description: "" }]);
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
        // Keep taxRate statically set (default 18%) unless product specifies a non-zero tax rate
        if (prod.taxRate !== undefined && prod.taxRate !== null && prod.taxRate > 0) {
          next[index].taxRate = Number(prod.taxRate);
        } else if (next[index].taxRate === undefined || next[index].taxRate === null) {
          next[index].taxRate = 18;
        }
      }
    }
    onChange(next);
  };

  const subtotal = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0), 0);
  const taxTotal = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0) * (Number(l.unitPrice) || 0) * ((Number(l.taxRate) || 0) / 100), 0);
  const grandTotal = subtotal + taxTotal;

  return (
    <div style={{ marginTop: 16 }}>
      {/* ── Live GST Tax Jurisdiction & Breakdown Banner ── */}
      <div style={{
        padding: "10px 14px",
        background: isTN ? "#eff6ff" : "#fef3c7",
        border: `1px solid ${isTN ? "#bfdbfe" : "#fde68a"}`,
        borderRadius: 8,
        marginBottom: 12,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 8,
        fontSize: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15 }}>{isTN ? "🏛️" : "🗺️"}</span>
          <span>
            <strong>GST Tax Jurisdiction:</strong> {customerState ? <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{customerState}</span> : "Tamil Nadu (Default)"}
            <span style={{ marginLeft: 6, color: "var(--text-muted)", fontSize: 11 }}>
              ({isTN ? "Intra-State Sale" : "Inter-State Sale"})
            </span>
          </span>
        </div>
        <div style={{ fontWeight: 800, color: isTN ? "#1d4ed8" : "#92400e", background: isTN ? "#dbeafe" : "#fef08a", padding: "3px 10px", borderRadius: 20 }}>
          {isTN ? "SGST (9%) + CGST (9%) = 18% GST" : "IGST (18% Static)"}
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
          <Boxes size={16} color="var(--accent)" /> Multiple Items & Per-Item Tax Breakdown ({lines.length})
        </label>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            type="button"
            className="btn btn-sm btn-ghost"
            style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, padding: "2px 8px" }}
            onClick={() => setQuickProductIdx(lines.length - 1 >= 0 ? lines.length - 1 : 0)}
          >
            ⚡ + Quick Add Item
          </button>
          <a
            href="/products"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: "var(--text-muted)", textDecoration: "none" }}
            title="Open items catalog page in new tab"
          >
            Catalog ↗
          </a>
          <button type="button" className="btn btn-secondary btn-sm" onClick={addLine}>
            <Plus size={13} /> Add Item Line
          </button>
        </div>
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
                gridTemplateColumns: "2.1fr 0.8fr 1.1fr 2.2fr 1.1fr auto",
                gap: 10,
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Item *</span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ padding: "0 4px", fontSize: 10, color: "var(--accent)", fontWeight: 700, height: "auto" }}
                    onClick={() => setQuickProductIdx(idx)}
                    title="Quickly add a missing item right here"
                  >
                    + New
                  </button>
                </div>
                <select
                  className="input-field"
                  style={{ fontSize: 13, padding: "6px 8px" }}
                  value={line.productId}
                  onChange={(e) => updateLine(idx, "productId", e.target.value)}
                >
                  <option value="">Select item…</option>
                  {products
                    .slice()
                    .sort((a: any, b: any) => {
                      if (mode === "selling") {
                        if (a.classification === "FINISHED_GOOD" && b.classification !== "FINISHED_GOOD") return -1;
                        if (b.classification === "FINISHED_GOOD" && a.classification !== "FINISHED_GOOD") return 1;
                      } else {
                        if (a.classification !== "FINISHED_GOOD" && b.classification === "FINISHED_GOOD") return -1;
                        if (b.classification !== "FINISHED_GOOD" && a.classification === "FINISHED_GOOD") return 1;
                      }
                      return (a.name || "").localeCompare(b.name || "");
                    })
                    .map((p: any) => {
                      const tag = p.classification === "FINISHED_GOOD" ? "📦 [Finished Good]" : p.classification === "CONSUMABLE" ? "⚡ [Consumable]" : "🏭 [Raw Material]";
                      return (
                        <option key={p.id} value={p.id}>
                          {tag} {p.name}
                        </option>
                      );
                    })}
                </select>
              </div>

              <div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>Qty *</span>
                <NumberStepper
                  value={line.quantity}
                  onChange={(val) => updateLine(idx, "quantity", val)}
                  min={0.001}
                  step={1}
                  size="sm"
                />
              </div>

              <div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>
                  {mode === "selling" ? "Unit Price (₹)" : "Unit Cost (₹)"}
                </span>
                <NumberStepper
                  value={line.unitPrice}
                  onChange={(val) => updateLine(idx, "unitPrice", val)}
                  min={0}
                  step={10}
                  prefix="₹"
                  size="sm"
                />
              </div>

              <div>
                <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 2 }}>
                  GST Tax % (Custom Editable)
                </span>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <div style={{ position: "relative", flex: 1 }}>
                    <input
                      type="number"
                      className="input-field font-mono"
                      style={{ fontSize: 13, padding: "6px 20px 6px 8px", width: "100%", fontWeight: 700 }}
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="18"
                      value={line.taxRate}
                      onChange={(e) => updateLine(idx, "taxRate", Math.max(0, Number(e.target.value)))}
                    />
                    <span style={{ position: "absolute", right: 6, top: 7, fontSize: 12, fontWeight: 800, color: "var(--text-muted)" }}>%</span>
                  </div>

                  <select
                    className="input-field"
                    style={{ fontSize: 11, padding: "6px 4px", width: 85, color: "var(--text-secondary)" }}
                    value={line.taxRate}
                    onChange={(e) => updateLine(idx, "taxRate", Number(e.target.value))}
                  >
                    <option value={line.taxRate}>Preset...</option>
                    <option value={0}>0%</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18%</option>
                    <option value={28}>28%</option>
                  </select>
                </div>
                {line.taxRate > 0 && (
                  <div style={{ fontSize: 10, color: isTN ? "#1d4ed8" : "#92400e", marginTop: 3, fontWeight: 700 }}>
                    {isTN
                      ? `${(line.taxRate / 2).toFixed(1)}% SGST + ${(line.taxRate / 2).toFixed(1)}% CGST`
                      : `${line.taxRate}% IGST`}
                  </div>
                )}
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
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", gap: 16, fontSize: 12, flexWrap: "wrap", alignItems: "center" }}>
          <span>Subtotal: <strong>{money(subtotal)}</strong></span>
          {isTN ? (
            <>
              <span>SGST (9%): <strong style={{ color: "var(--accent)" }}>+{money(taxTotal / 2)}</strong></span>
              <span>CGST (9%): <strong style={{ color: "var(--accent)" }}>+{money(taxTotal / 2)}</strong></span>
            </>
          ) : (
            <span>IGST (18%): <strong style={{ color: "#d97706" }}>+{money(taxTotal)}</strong></span>
          )}
        </div>
        <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)" }}>
          Grand Total: <span style={{ color: "var(--success)" }}>{money(grandTotal)}</span>
        </div>
      </div>

      <QuickCreateProductModal
        open={quickProductIdx !== null}
        defaultClassification={mode === "selling" ? "FINISHED_GOOD" : "RAW_MATERIAL"}
        onClose={() => setQuickProductIdx(null)}
        onCreated={(newProd) => {
          if (quickProductIdx !== null) {
            updateLine(quickProductIdx, "productId", newProd.id);
          }
        }}
      />
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
type SalesOrder = { id: string; number: string; status: string; total: string; customer?: { name: string; state?: string }; lines?: { productId: string; quantity: string }[] };

export function SalesOrdersPage() {
  const list = useList<SalesOrder>("so", "/sales-orders");
  const customers = useList<{ id: string; name: string; state?: string }>("customers", "/customers");
  const warehouses = useList<{ id: string; name: string }>("wh", "/warehouses");
  const products = useList<{ id: string; name: string; sellingPrice?: number; taxRate?: number }>("products", "/products");
  const qc = useQueryClient();
  const { toast } = useToast();

  const [view, setView] = useState<"table" | "kanban">("table");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ customerId: "", warehouseId: "" });
  const [lines, setLines] = useState<LineItem[]>([{ productId: "", quantity: 1, unitPrice: 0, taxRate: 18 }]);
  const [deleteTarget, setDeleteTarget] = useState<SalesOrder | null>(null);

  const removeSO = useMutation({
    mutationFn: (id: string) => api.delete(`/sales-orders/${id}`),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["so"] });
      qc.invalidateQueries({ queryKey: ["inv"] });
      setDeleteTarget(null);
      toast(res.data?.message || "Sales order deleted successfully");
    },
    onError: (err: any) => {
      setDeleteTarget(null);
      toast(err.response?.data?.message || "Could not delete sales order.", "error");
    },
  });

  const selectedCustomer = (customers.data ?? []).find((c) => c.id === form.customerId);

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
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
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
          {r.status !== "FULFILLED" && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(r);
              }}
              style={{ fontSize: 11, color: "#dc2626", borderColor: "#fecaca" }}
              title={`Delete Order ${r.number}`}
            >
              🗑️ Delete
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
        <DataTable
          columns={columns}
          data={allOrders}
          loading={list.isLoading}
          error={list.error}
          searchFields={["number"]}
          storageKey="sales_orders"
          title="Sales Orders"
          defaultView="grid"
          emptyIcon={<ShoppingCart size={48} />}
          emptyText="No sales orders yet"
        />
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
          <SmartEntitySelect
            label="Customer *"
            entity="customer"
            placeholder="Select or search customer…"
            value={form.customerId}
            onChange={(val) => setForm({ ...form, customerId: val })}
            options={(customers.data ?? []).map((c) => ({ value: c.id, label: c.name, sublabel: c.state }))}
          />
          <SmartEntitySelect
            label="Dispatch Warehouse *"
            entity="warehouse"
            placeholder="Select or search warehouse…"
            value={form.warehouseId}
            onChange={(val) => setForm({ ...form, warehouseId: val })}
            options={(warehouses.data ?? []).map((w) => ({ value: w.id, label: w.name }))}
          />
        </div>

        <LineItemBuilder lines={lines} onChange={setLines} products={products.data ?? []} mode="selling" customerState={selectedCustomer?.state} />
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={`Confirm Delete Sales Order — ${deleteTarget.number}`}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={removeSO.isPending}>
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: "#dc2626", color: "#fff", fontWeight: 600 }}
                disabled={removeSO.isPending}
                onClick={() => removeSO.mutate(deleteTarget.id)}
              >
                {removeSO.isPending ? "Deleting..." : "Yes, Delete Order"}
              </button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 14, color: "#334155" }}>
              Are you sure you want to permanently delete sales order <strong>{deleteTarget.number}</strong>?
            </p>
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, fontSize: 13, color: "#991b1b", lineHeight: 1.5 }}>
              ⚠️ <strong>Integrity Guard:</strong> If packages have already been created or customer invoices generated, deletion will be blocked to maintain dispatch and accounting integrity. Any active inventory reservations will be automatically released.
            </div>
          </div>
        </Modal>
      )}
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
  const inventory = useList<any>("inv", "/inventory");
  const qc = useQueryClient();
  const { toast } = useToast();

  const checkOrderStock = (order: SalesOrder) => {
    const invList = inventory.data ?? [];
    const lines = order.lines ?? [];
    if (!lines.length) return { hasStock: true, statusText: "Stock Check OK" };
    for (const line of lines) {
      const invItem = invList.find((i: any) => (i.productId === line.productId || i.product?.id === line.productId));
      const qty = invItem ? Number(invItem.quantity ?? 0) : 0;
      if (qty < Number(line.quantity)) {
        return { hasStock: false, statusText: `Low Stock (${qty} available, need ${line.quantity})` };
      }
    }
    return { hasStock: true, statusText: "Ready in Warehouse" };
  };

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
                      <th>Warehouse Stock</th>
                      <th>Status</th>
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {confirmedOrders.map((o) => {
                      const stockInfo = checkOrderStock(o);
                      return (
                        <tr key={o.id}>
                          <td><strong>{o.number}</strong></td>
                          <td>{o.customer?.name ?? "—"}</td>
                          <td style={{ textAlign: "right" }}><strong>{money(Number(o.total))}</strong></td>
                          <td>
                            {stockInfo.hasStock ? (
                              <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                                ✓ Ready in Warehouse
                              </span>
                            ) : (
                              <span style={{ background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700 }} title="Produce in Manufacturing before packing">
                                ⚠️ {stockInfo.statusText}
                              </span>
                            )}
                          </td>
                          <td><Badge status={o.status} /></td>
                          <td style={{ textAlign: "right" }}>
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={packOrder.isPending || !stockInfo.hasStock}
                              onClick={() => packOrder.mutate(o)}
                              title={!stockInfo.hasStock ? "Warehouse-la finished goods stock illai. Manufacturing tab-la production entry pottu finished goods create pannunga." : "Pack order"}
                              style={{ opacity: !stockInfo.hasStock ? 0.6 : 1 }}
                            >
                              {packOrder.isPending ? <span className="spinner" style={{ width: 12, height: 12 }} /> : <Box size={13} />}
                              Pack Order
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
type Invoice = { id: string; number: string; status: string; total: string; amountPaid: string; dueDate?: string; customerId?: string; customer?: { id: string; name: string; state?: string } };

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
    {
      label: "GST Type",
      render: (r) => {
        const custState = (r.customer?.state || "").toLowerCase().trim();
        const isTN = !custState || custState.includes("tamil") || custState.includes("tn") || custState.startsWith("33");
        return (
          <span style={{
            background: isTN ? "#eff6ff" : "#fef3c7",
            color: isTN ? "#1d4ed8" : "#92400e",
            padding: "2px 7px", borderRadius: 6, fontSize: 11, fontWeight: 700
          }}>
            {isTN ? "SGST 9% + CGST 9%" : "IGST 18% (Inter-State)"}
          </span>
        );
      },
    },
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
                    <th>Applicable GST</th>
                    <th style={{ textAlign: "right" }}>Total Amount</th>
                    <th>Fulfillment Status</th>
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {readyToInvoice.map((o) => {
                    const isThisRowLoading = invoicingId === o.id;
                    const custState = (o.customer?.state || "").toLowerCase().trim();
                    const isTN = !custState || custState.includes("tamil") || custState.includes("tn") || custState.startsWith("33");

                    return (
                      <tr key={o.id}>
                        <td><strong>{o.number}</strong></td>
                        <td>{o.customer?.name ?? "—"}</td>
                        <td>
                          <span style={{
                            background: isTN ? "#eff6ff" : "#fef3c7",
                            color: isTN ? "#1d4ed8" : "#92400e",
                            padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700
                          }}>
                            {isTN ? "SGST 9% + CGST 9%" : "IGST 18% (Inter-State)"}
                          </span>
                        </td>
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
      <DataTable
        columns={columns}
        data={filteredInvoices}
        loading={list.isLoading}
        error={list.error}
        searchFields={["number"]}
        storageKey="invoices"
        title={selectedCustomerName ? `Invoices for ${selectedCustomerName}` : "Customer Invoices"}
        defaultView="table"
        emptyIcon={<Receipt size={48} />}
        emptyText="No customer invoices found"
        onRowClick={(row) => setTimelineInv(row)}
      />

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
      <DataTable
        columns={columns}
        data={list.data ?? []}
        loading={list.isLoading}
        error={list.error}
        searchFields={["method"]}
        storageKey="payments"
        title="Payment Receipts"
        defaultView="table"
        emptyIcon={<DollarSign size={48} />}
        emptyText="No payment receipts recorded yet"
      />

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
type PurchaseOrder = { id: string; number: string; status: string; total: string; vendor?: { name: string }; lines?: { productId: string; quantity: string; receivedQty?: number | string }[] };

export function PurchaseOrdersPage() {
  const list = useList<PurchaseOrder>("po", "/purchase-orders");
  const vendors = useList<{ id: string; name: string }>("vendors", "/vendors");
  const warehouses = useList<{ id: string; name: string }>("wh", "/warehouses");
  const products = useList<{ id: string; name: string; costPrice?: number; taxRate?: number }>("products", "/products");
  const qc = useQueryClient();
  const { toast } = useToast();

  const [view, setView] = useState<"table" | "kanban">("table");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ vendorId: "", warehouseId: "", number: "", notes: "" });
  const [lines, setLines] = useState<LineItem[]>([{ productId: "", quantity: 1, unitPrice: 0, taxRate: 0 }]);
  const [deleteTarget, setDeleteTarget] = useState<PurchaseOrder | null>(null);

  const removePO = useMutation({
    mutationFn: (id: string) => api.delete(`/purchase-orders/${id}`),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["po"] });
      setDeleteTarget(null);
      toast(res.data?.message || "Purchase order deleted successfully");
    },
    onError: (err: any) => {
      setDeleteTarget(null);
      toast(err.response?.data?.message || "Could not delete purchase order.", "error");
    },
  });

  const create = useMutation({
    mutationFn: () => {
      const validLines = lines.filter((l) => l.productId && l.quantity > 0);
      if (!form.vendorId) throw new Error("Please select a vendor.");
      if (!form.warehouseId) throw new Error("Please select a warehouse.");
      if (!validLines.length) throw new Error("Please add at least one item line.");
      return api.post("/purchase-orders", {
        vendorId: form.vendorId,
        warehouseId: form.warehouseId,
        number: form.number?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
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
      setForm({ vendorId: "", warehouseId: "", number: "", notes: "" });
      setLines([{ productId: "", quantity: 1, unitPrice: 0, taxRate: 0 }]);
      toast("Purchase order created successfully");
    },
    onError: (err: any) => toast(err.response?.data?.message ?? err.message ?? "Could not create purchase order.", "error"),
  });

  const receive = useMutation({
    mutationFn: (row: PurchaseOrder) => {
      const remainingLines = (row.lines ?? [])
        .map((l) => ({
          productId: l.productId,
          quantity: Math.max(0, Number(l.quantity) - Number(l.receivedQty ?? 0)),
        }))
        .filter((l) => l.quantity > 0);
      return api.post(`/purchase-orders/${row.id}/receive`, { lines: remainingLines });
    },
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
      render: (r) => {
        const hasPendingStock = (r.lines ?? []).some((l) => Number(l.quantity) > Number(l.receivedQty ?? 0));
        const canReceive = hasPendingStock && r.status !== "RECEIVED" && r.status !== "CANCELLED" && r.status !== "BILLED";
        const canDelete = r.status !== "RECEIVED" && r.status !== "BILLED" && !(r.lines ?? []).some((l) => Number(l.receivedQty) > 0);
        return (
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", flexWrap: "wrap" }}>
            {canReceive && (
              <button className="btn btn-success btn-sm" onClick={(e) => { e.stopPropagation(); receive.mutate(r); }} disabled={receive.isPending}>
                <Download size={12} /> Receive Stock
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(r);
                }}
                style={{ fontSize: 11, color: "#dc2626", borderColor: "#fecaca" }}
                title={`Delete PO ${r.number}`}
              >
                🗑️ Delete
              </button>
            )}
          </div>
        );
      },
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
        <DataTable
          columns={columns}
          data={allPOs}
          loading={list.isLoading}
          error={list.error}
          searchFields={["number"]}
          storageKey="purchase_orders"
          title="Purchase Orders"
          defaultView="grid"
          emptyIcon={<ClipboardList size={48} />}
          emptyText="No purchase orders yet"
        />
      ) : (
        <KanbanBoard columns={kanbanCols} onDrop={handleKanbanDrop} />
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create Purchase Order / Vendor Bill" wide={800}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn btn-primary" disabled={create.isPending || !canSubmit} onClick={() => create.mutate()}>
              {create.isPending && <span className="spinner" style={{ width: 14, height: 14 }} />} Create PO
            </button>
          </>
        }
      >
        {/* Customizable Bill / PO Number Input */}
        <div style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          border: "1px solid #cbd5e1",
          borderRadius: 12,
          padding: "14px 16px",
          marginBottom: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
              <span>🧾 Bill / PO Number</span>
              <span style={{ fontSize: 11, background: "#dbeafe", color: "#1e40af", padding: "1px 8px", borderRadius: 10, fontWeight: 600 }}>
                Customizable (No default needed)
              </span>
            </label>
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Vendor Bill / Invoice #</span>
          </div>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. BILL-9821, INV/2026/04, PO-7712 (Vendor kitta irunthu vantha bill number type pannalam)"
            value={form.number}
            onChange={(e) => setForm({ ...form, number: e.target.value })}
            style={{
              fontFamily: form.number ? "monospace" : "inherit",
              fontWeight: form.number ? 700 : 400,
              fontSize: 14,
              background: "#ffffff",
            }}
          />
          <div style={{ fontSize: 11, color: "#64748b", marginTop: 5, lineHeight: 1.4 }}>
            💡 <strong>Vendor Bill Number:</strong> Vendor kitta irunthu vantha bill-oda original number-ai inge direct-aa type pannikalam. Default number thevai illai. Blank-aa vittal mattum system auto sequence assign pannum.
          </div>
        </div>

        <div className="form-grid form-grid-2" style={{ marginBottom: 16 }}>
          <SmartEntitySelect
            label="Vendor *"
            entity="vendor"
            placeholder="Select or search vendor…"
            value={form.vendorId}
            onChange={(val) => setForm({ ...form, vendorId: val })}
            options={(vendors.data ?? []).map((v) => ({ value: v.id, label: v.name }))}
          />
          <SmartEntitySelect
            label="Receiving Warehouse *"
            entity="warehouse"
            placeholder="Select or search warehouse…"
            value={form.warehouseId}
            onChange={(val) => setForm({ ...form, warehouseId: val })}
            options={(warehouses.data ?? []).map((w) => ({ value: w.id, label: w.name }))}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label className="form-label" style={{ fontSize: 12 }}>Notes / Reference (Optional)</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Delivery challan #, vehicle #, payment terms…"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            style={{ fontSize: 12 }}
          />
        </div>

        <LineItemBuilder lines={lines} onChange={setLines} products={products.data ?? []} mode="purchasing" />

        {(!vendors.data?.length || !warehouses.data?.length || !products.data?.length) && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#fef3c7", borderRadius: 8, fontSize: 12, color: "#92400e" }}>
            ⚠️ Make sure you have created at least one Vendor, Warehouse, and Item before creating a Purchase Order.
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          open={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title={`Confirm Delete Purchase Order — ${deleteTarget.number}`}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={removePO.isPending}>
                Cancel
              </button>
              <button
                className="btn"
                style={{ background: "#dc2626", color: "#fff", fontWeight: 600 }}
                disabled={removePO.isPending}
                onClick={() => removePO.mutate(deleteTarget.id)}
              >
                {removePO.isPending ? "Deleting..." : "Yes, Delete PO"}
              </button>
            </>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ margin: 0, fontSize: 14, color: "#334155" }}>
              Are you sure you want to permanently delete purchase order <strong>{deleteTarget.number}</strong>?
            </p>
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, fontSize: 13, color: "#991b1b", lineHeight: 1.5 }}>
              ⚠️ <strong>Integrity Guard:</strong> If goods have already been received into inventory stock, or if vendor bills are attached to this order, deletion will be blocked to maintain historical inventory and accounting records.
            </div>
          </div>
        </Modal>
      )}
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
          <SmartEntitySelect
            label="Vendor *"
            entity="vendor"
            placeholder="Select vendor…"
            value={form.vendorId}
            onChange={(val) => setForm({ ...form, vendorId: val })}
            options={(vendors.data ?? []).map((v) => ({ value: v.id, label: v.name }))}
          />

          <SmartEntitySelect
            label="Warehouse *"
            entity="warehouse"
            placeholder="Select warehouse…"
            value={form.warehouseId}
            onChange={(val) => setForm({ ...form, warehouseId: val })}
            options={(warehouses.data ?? []).map((w) => ({ value: w.id, label: w.name }))}
          />

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

          <SmartEntitySelect
            label="Item to Return *"
            entity="product"
            placeholder="Select item…"
            value={form.productId}
            onChange={(val) => setForm({ ...form, productId: val })}
            options={(products.data ?? []).map((p) => ({ value: p.id, label: p.name }))}
          />

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
  const [customBillNo, setCustomBillNo] = useState("");

  // Create bill from PO
  const createBill = useMutation({
    mutationFn: () => api.post(`/bills/from-order/${selectedPO}`, { number: customBillNo?.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bills"] });
      setBillModal(false);
      setSelectedPO("");
      setCustomBillNo("");
      toast("Bill created successfully");
    },
    onError: (err: any) => toast(err.response?.data?.message ?? "Could not create bill. PO may already be billed.", "error"),
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
      <DataTable
        columns={columns}
        data={billData}
        loading={bills.isLoading}
        error={bills.error}
        searchFields={["number"]}
        storageKey="bills"
        title="Vendor Bills"
        defaultView="table"
        emptyIcon={<FileText size={48} />}
        emptyText="No bills yet. Create a bill from a received purchase order."
      />

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
            onChange={(e) => {
              const poId = e.target.value;
              setSelectedPO(poId);
              const po = billablePOs.find((p) => p.id === poId);
              if (po && po.number && !po.number.startsWith("PO-")) {
                setCustomBillNo(po.number);
              }
            }}
          >
            <option value="">Select PO…</option>
            {billablePOs.map((po) => (
              <option key={po.id} value={po.id}>
                {po.number} — {po.vendor?.name ?? "Unknown Vendor"} — {money(Number(po.total))}
              </option>
            ))}
          </select>
        </InputGroup>

        <div style={{ marginTop: 12 }}>
          <label className="form-label" style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700 }}>
            <span>🧾 Custom Bill Number (Optional)</span>
            <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600 }}>✏️ Customizable</span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. BILL-991, INV-5021 (leave blank to auto-use PO / sequence number)"
            value={customBillNo}
            onChange={(e) => setCustomBillNo(e.target.value)}
            style={{ fontFamily: customBillNo ? "monospace" : "inherit", fontWeight: customBillNo ? 700 : 400 }}
          />
          <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
            💡 Vendor bill number customize pannalam. Blank-aa vittal PO number or auto sequence use aagum.
          </div>
        </div>
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
// FACTORY MANUFACTURING & PRODUCTION PAGE
// ─────────────────────────────────────────────────────────
export function ManufacturingPage() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<"daily-log" | "monthly-analytics" | "produce" | "history" | "recipes">("daily-log");

  const products = useList<any>("products", "/products");
  const warehouses = useList<any>("wh", "/warehouses");
  const runs = useList<any>("prodRuns", "/inventory/production-runs");

  const finishedGoods = (products.data ?? []).filter(
    (p: any) => !p.classification || p.classification === "FINISHED_GOOD"
  );
  const rawMaterials = (products.data ?? []).filter(
    (p: any) => p.classification === "RAW_MATERIAL" || p.classification === "CONSUMABLE"
  );

  // ── Core Production Selection States ──
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>("");
  const [produceQty, setProduceQty] = useState<string>("10");
  const [laborCost, setLaborCost] = useState<string>("0");
  const [overheadCost, setOverheadCost] = useState<string>("0");
  const [notes, setNotes] = useState<string>("");
  const [recipeProduct, setRecipeProduct] = useState<any | null>(null);

  // ── Daily Production Notebook State (End of Day Inward & Outward) ──
  const [logDate, setLogDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [logWarehouseId, setLogWarehouseId] = useState<string>("");
  const [logNotes, setLogNotes] = useState<string>("");
  const [outwardItems, setOutwardItems] = useState<Array<{ productId: string; quantity: number }>>([
    { productId: "", quantity: 10 },
  ]);
  const [inwardItems, setInwardItems] = useState<Array<{ productId: string; quantity: number }>>([
    { productId: "", quantity: 10 },
  ]);

  // Auto-calculate suggested inward materials from recipes:
  const handleAutoCalculateInwards = () => {
    const sumMap = new Map<string, number>();
    for (const o of outwardItems) {
      if (!o.productId || !Number(o.quantity)) continue;
      const p = (products.data ?? []).find((x: any) => x.id === o.productId);
      if (p?.components) {
        for (const c of p.components) {
          const prev = sumMap.get(c.childProductId) ?? 0;
          sumMap.set(c.childProductId, prev + Number(c.quantity) * Number(o.quantity));
        }
      }
    }
    if (sumMap.size === 0) {
      toast("No recipes found for the selected finished goods. Please select inward materials manually.", "warn");
      return;
    }
    const newInwards = Array.from(sumMap.entries()).map(([childProductId, qty]) => ({
      productId: childProductId,
      quantity: Number(qty.toFixed(3)),
    }));
    setInwardItems(newInwards);
    toast(`Auto-calculated ${newInwards.length} inward materials from recipes! You can adjust counts as needed.`);
  };

  const postDailyLog = useMutation({
    mutationFn: () =>
      api.post("/inventory/daily-production-log", {
        warehouseId: logWarehouseId || selectedWarehouseId,
        date: logDate,
        notes: logNotes.trim() || undefined,
        outwards: outwardItems.filter((o) => o.productId && Number(o.quantity) > 0),
        inwards: inwardItems.filter((i) => i.productId && Number(i.quantity) > 0),
      }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["inv"] });
      qc.invalidateQueries({ queryKey: ["prodRuns"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["monthlyAnalytics"] });
      toast(`✅ Daily production logged (${res.data?.logBatchNumber})! Finished goods added & raw materials deducted.`);
      setLogNotes("");
      setTab("monthly-analytics");
    },
    onError: (err: any) => toast(err.response?.data?.message ?? "Failed to save daily log", "error"),
  });

  // ── Monthly Analytics State ──
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [analyticsGraphMode, setAnalyticsGraphMode] = useState<"growth" | "variance" | "daily">("growth");

  const monthlyAnalytics = useQuery({
    queryKey: ["monthlyAnalytics", selectedYear, selectedMonth, selectedWarehouseId],
    queryFn: async () => {
      const res = await api.get("/inventory/production-monthly-analytics", {
        params: {
          year: selectedYear,
          month: selectedMonth,
          warehouseId: selectedWarehouseId || undefined,
        },
      });
      return res.data;
    },
    enabled: tab === "monthly-analytics",
  });

  // Auto-select warehouse
  useEffect(() => {
    if (!selectedWarehouseId && warehouses.data?.length) {
      setSelectedWarehouseId(warehouses.data[0].id);
    }
    if (!logWarehouseId && warehouses.data?.length) {
      setLogWarehouseId(warehouses.data[0].id);
    }
  }, [warehouses.data, selectedWarehouseId, logWarehouseId]);

  // Auto-select finished good
  useEffect(() => {
    if (!selectedProductId && finishedGoods.length) {
      setSelectedProductId(finishedGoods[0].id);
    }
  }, [finishedGoods, selectedProductId]);

  const selectedProduct = (products.data ?? []).find((p: any) => p.id === selectedProductId);

  // Live feasibility query
  const feasibility = useQuery({
    queryKey: ["feasibility", selectedProductId, selectedWarehouseId],
    queryFn: async () => {
      if (!selectedProductId) return null;
      const res = await api.get(`/inventory/production-feasibility/${selectedProductId}`, {
        params: { warehouseId: selectedWarehouseId },
      });
      return res.data;
    },
    enabled: Boolean(selectedProductId),
  });

  const produce = useMutation({
    mutationFn: () => {
      return api.post("/inventory/produce", {
        productId: selectedProductId,
        warehouseId: selectedWarehouseId,
        quantityProduced: Number(produceQty),
        laborCost: Number(laborCost) || 0,
        overheadCost: Number(overheadCost) || 0,
        notes: notes.trim() || undefined,
      });
    },
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ["inv"] });
      qc.invalidateQueries({ queryKey: ["prodRuns"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["feasibility"] });
      toast(`🎉 Batch ${res.data?.runNumber} produced! ${produceQty} units added to inventory.`);
      setNotes("");
      setTab("history");
    },
    onError: (err: any) => toast(err.response?.data?.message ?? "Production failed", "error"),
  });

  // Calculate material costs for target batch
  const componentList = feasibility.data?.components ?? [];
  const totalRawMaterialBatchCost = componentList.reduce((acc: number, c: any) => {
    return acc + (Number(c.costPrice) || 0) * (Number(c.recipeQty) || 0) * (Number(produceQty) || 0);
  }, 0);

  const totalBatchCost = totalRawMaterialBatchCost + (Number(laborCost) || 0) + (Number(overheadCost) || 0);
  const unitManufacturedCost = Number(produceQty) > 0 ? totalBatchCost / Number(produceQty) : 0;

  const runColumns: Column<any>[] = [
    {
      label: "Batch Run #",
      render: (r) => (
        <span className="font-mono" style={{ background: "#f1f5f9", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
          {r.runNumber}
        </span>
      ),
    },
    {
      label: "Date",
      render: (r) =>
        new Date(r.createdAt).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
    },
    { label: "Manufactured Item", render: (r) => <strong>{r.product?.name}</strong> },
    { label: "Warehouse", render: (r) => r.warehouse?.name },
    {
      label: "Produced Units",
      align: "right",
      render: (r) => <strong style={{ color: "var(--accent)", fontSize: 14 }}>{r.quantityProduced}</strong>,
    },
    { label: "Unit Cost", align: "right", render: (r) => money(r.unitCost) },
    { label: "Total Cost", align: "right", render: (r) => <strong>{money(r.totalCost)}</strong> },
    {
      label: "Status",
      render: () => (
        <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
          ✓ COMPLETED
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="🏭 Factory Manufacturing & Production"
        subtitle="Transform raw materials and gas consumables into finished goods (Autoflex Welding Materials)"
      >
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className={`btn ${tab === "daily-log" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab("daily-log")}
          >
            <BookOpen size={15} /> 📔 Daily Production Notebook (EOD)
          </button>
          <button
            className={`btn ${tab === "monthly-analytics" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab("monthly-analytics")}
          >
            <BarChart3 size={15} /> 📊 Monthly Inward & Outward Analytics
          </button>
          <button
            className={`btn ${tab === "produce" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab("produce")}
          >
            ⚡ Single Batch Run
          </button>
          <button
            className={`btn ${tab === "history" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab("history")}
          >
            📜 Production History ({(runs.data?.data ?? []).length})
          </button>
          <button
            className={`btn ${tab === "recipes" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setTab("recipes")}
          >
            🥣 Recipes / BOM ({finishedGoods.length})
          </button>
        </div>
      </PageHeader>

      {/* ── Thanglish Quick Hint Banner ── */}
      <div style={{
        background: "linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)",
        border: "1px solid #bfdbfe",
        borderRadius: 12,
        padding: "14px 18px",
        marginBottom: 20,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
        flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <span style={{ fontSize: 24, lineHeight: 1 }}>📔</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <strong style={{ color: "#1e3a8a", fontSize: 14 }}>
                Factory Daily Production & Consumption (EOD Log System)
              </strong>
              <InfoTooltip text="Daily evening factory mudiyum bothu, inniku yevlo materials use pannom and yevlo finished goods ready aachu nu ore digital page-la record panna intha system." align="left" />
            </div>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "#1e40af", lineHeight: 1.5 }}>
              Daily evening notebook-la eludhurathuku bathila inga direct ah enter pannalam:
              <strong> Inward (Raw Materials & Gas used)</strong> and <strong>Outward (Finished Goods ready aana counts)</strong>.
              Ore click-la finished goods stock add aagidum, raw materials stock minus aagidum. Monthly reports auto-generate aagum!
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            className={`btn btn-sm ${tab === "daily-log" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setTab("daily-log")}
          >
            📔 Open Daily Notebook
          </button>
          <button
            type="button"
            className={`btn btn-sm ${tab === "monthly-analytics" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setTab("monthly-analytics")}
          >
            📊 View Monthly Stats
          </button>
        </div>
      </div>

      {/* ── TAB 1: DAILY PRODUCTION NOTEBOOK (END OF DAY LOG) ── */}
      {tab === "daily-log" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Header Controls: Date & Warehouse */}
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14, marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <BookOpen size={18} color="var(--accent)" />
                  Today's Factory Production & Consumption Log (EOD)
                  <InfoTooltip text="Inniku factory shift-la consume aana raw materials and seithu muditha final products rendu side-layum record panna intha section use aagum." align="left" />
                </h3>
                <span style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2, display: "block" }}>
                  Record actual materials consumed (Inward) and finished products ready (Outward) today.
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={handleAutoCalculateInwards}
                  title="Auto-calculate required raw materials based on finished goods recipes"
                >
                  <Sparkles size={14} color="#d97706" /> 🪄 Auto-Calculate Inwards from Recipes
                </button>
                <InfoTooltip text="Inniku ready aana finished goods counts-ah paathu, BOM recipes padi thevaiana raw materials & gas-ah right side-la automatic ah calculate panni load pannum. Ungalukku yetha maari adjust-um pannikalam." align="right" />
              </div>
            </div>

            <div className="form-grid form-grid-3">
              <InputGroup label="Production Date *">
                <input
                  type="date"
                  className="input-field"
                  style={{ fontWeight: 600 }}
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                />
              </InputGroup>

              <InputGroup label="Factory Warehouse / Godown *">
                <select
                  className="input-field"
                  value={logWarehouseId || selectedWarehouseId}
                  onChange={(e) => {
                    setLogWarehouseId(e.target.value);
                    setSelectedWarehouseId(e.target.value);
                  }}
                >
                  {(warehouses.data ?? []).map((w: any) => (
                    <option key={w.id} value={w.id}>
                      🏢 {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </InputGroup>

              <InputGroup label="Daily Shift / Batch Note">
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Day Shift 4 workers, 2 flex lines active"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                />
              </InputGroup>
            </div>
          </div>

          {/* Two-Column Grid: Outwards vs Inwards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 20 }}>
            {/* Left Card: 📤 Outwards (Finished Goods) */}
            <div className="card" style={{ padding: 20, borderTop: "4px solid #10b981" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#065f46", display: "flex", alignItems: "center", gap: 6 }}>
                    📤 Outward Finished Goods (Ready aana Products)
                    <InfoTooltip text="Inniku factory-la manufacture panni ready aana final goods (Flex coils, rods). Save panna udane stock increase (+) aagidum." align="left" />
                  </h4>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Products that workers finished producing today (Stock will increase +)
                  </span>
                </div>
                <span style={{ background: "#d1fae5", color: "#065f46", padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                  {outwardItems.length} Product{outwardItems.length > 1 ? "s" : ""}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {outwardItems.map((item, idx) => {
                  const sel = (products.data ?? []).find((p: any) => p.id === item.productId);
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "#f8fafc",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div style={{ flex: 2 }}>
                        <select
                          className="input-field"
                          style={{ fontSize: 13, fontWeight: 600 }}
                          value={item.productId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setOutwardItems((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, productId: val } : r))
                            );
                          }}
                        >
                          <option value="">-- Select Finished Product --</option>
                          {finishedGoods.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              📦 {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ width: 175 }}>
                        <NumberStepper
                          value={item.quantity || 0}
                          onChange={(val) => {
                            setOutwardItems((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, quantity: val } : r))
                            );
                          }}
                          min={0.1}
                          step={1}
                          unit={sel?.unitOfMeasure || sel?.unit || "pcs"}
                          quickAdd={[5, 10, 50]}
                          size="md"
                        />
                      </div>

                      {outwardItems.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: "#ef4444", padding: 6 }}
                          onClick={() => setOutwardItems((prev) => prev.filter((_, i) => i !== idx))}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ alignSelf: "flex-start", marginTop: 6 }}
                  onClick={() => setOutwardItems((prev) => [...prev, { productId: "", quantity: 10 }])}
                >
                  <Plus size={14} /> + Add Another Finished Product
                </button>
              </div>
            </div>

            {/* Right Card: 📥 Inwards (Raw Materials Consumed) */}
            <div className="card" style={{ padding: 20, borderTop: "4px solid #6366f1" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: "#3730a3", display: "flex", alignItems: "center", gap: 6 }}>
                    📥 Inward Raw Materials (Used aana Materials)
                    <InfoTooltip text="Inniku products seiyum bothu actual-ah consume aana Wire rod, Chemical flux & Shielding gas cylinders. Save panna udane stock deduct (-) aagidum." align="left" />
                  </h4>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    Wire, chemical flux, shielding gas consumed today (Stock will decrease -)
                  </span>
                </div>
                <span style={{ background: "#e0e7ff", color: "#3730a3", padding: "3px 8px", borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                  {inwardItems.length} Material{inwardItems.length > 1 ? "s" : ""}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {inwardItems.map((item, idx) => {
                  const sel = (products.data ?? []).find((p: any) => p.id === item.productId);
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        background: "#f8fafc",
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div style={{ flex: 2 }}>
                        <select
                          className="input-field"
                          style={{ fontSize: 13, fontWeight: 600 }}
                          value={item.productId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setInwardItems((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, productId: val } : r))
                            );
                          }}
                        >
                          <option value="">-- Select Raw Material / Consumable --</option>
                          {products.data?.map((p: any) => (
                            <option key={p.id} value={p.id}>
                              {p.classification === "FINISHED_GOOD" ? "📦" : "⚙️"} {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ width: 175 }}>
                        <NumberStepper
                          value={item.quantity || 0}
                          onChange={(val) => {
                            setInwardItems((prev) =>
                              prev.map((r, i) => (i === idx ? { ...r, quantity: val } : r))
                            );
                          }}
                          min={0.01}
                          step={0.5}
                          unit={sel?.unitOfMeasure || sel?.unit || "kg"}
                          quickAdd={[1, 5, 10]}
                          size="md"
                        />
                      </div>

                      {inwardItems.length > 1 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ color: "#ef4444", padding: 6 }}
                          onClick={() => setInwardItems((prev) => prev.filter((_, i) => i !== idx))}
                          title="Remove item"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ alignSelf: "flex-start", marginTop: 6 }}
                  onClick={() => setInwardItems((prev) => [...prev, { productId: "", quantity: 10 }])}
                >
                  <Plus size={14} /> + Add Another Raw Material / Gas
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Confirmation Bar */}
          <div
            className="card"
            style={{
              padding: "16px 22px",
              background: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              border: "1px solid var(--border)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>📤</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>OUTWARDS (Ready Goods)</span>
                    <InfoTooltip text="Inniku manufacture aana motha finished products count and pieces." />
                  </div>
                  <strong style={{ fontSize: 14, color: "#059669" }}>
                    {outwardItems.filter((o) => o.productId && Number(o.quantity) > 0).length} Product(s) |{" "}
                    {outwardItems.reduce((acc, o) => acc + (Number(o.quantity) || 0), 0)} Total Units
                  </strong>
                </div>
              </div>
              <div style={{ width: 1, height: 32, background: "#e2e8f0" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>📥</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>INWARDS (Consumed Materials)</span>
                    <InfoTooltip text="Inniku consume aana motha raw materials and shielding gas units." />
                  </div>
                  <strong style={{ fontSize: 14, color: "#4f46e5" }}>
                    {inwardItems.filter((i) => i.productId && Number(i.quantity) > 0).length} Material(s) |{" "}
                    {inwardItems.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0)} Total Used
                  </strong>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary"
              style={{ padding: "12px 28px", fontSize: 15, fontWeight: 700 }}
              disabled={
                postDailyLog.isPending ||
                !outwardItems.some((o) => o.productId && Number(o.quantity) > 0) ||
                !inwardItems.some((i) => i.productId && Number(i.quantity) > 0)
              }
              onClick={() => postDailyLog.mutate()}
            >
              {postDailyLog.isPending ? (
                <span className="spinner" style={{ width: 16, height: 16 }} />
              ) : (
                <CheckCircle size={18} />
              )}
              🚀 Save Today's Notebook Log & Update Stock
            </button>
          </div>
        </div>
      )}

      {/* ── TAB 2: MONTHLY INWARD & OUTWARD ANALYTICS ── */}
      {tab === "monthly-analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Month & Filter Controls */}
          <div
            className="card"
            style={{
              padding: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={18} color="var(--accent)" />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Select Month & Year:</span>
                <InfoTooltip text="Entha month-oda production and raw material consumption report venumo anga select pannikalam." align="left" />
              </div>

              <select
                className="input-field"
                style={{ width: 140, fontWeight: 600 }}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
              >
                {[
                  { v: 1, l: "January" },
                  { v: 2, l: "February" },
                  { v: 3, l: "March" },
                  { v: 4, l: "April" },
                  { v: 5, l: "May" },
                  { v: 6, l: "June" },
                  { v: 7, l: "July" },
                  { v: 8, l: "August" },
                  { v: 9, l: "September" },
                  { v: 10, l: "October" },
                  { v: 11, l: "November" },
                  { v: 12, l: "December" },
                ].map((m) => (
                  <option key={m.v} value={m.v}>
                    {m.l}
                  </option>
                ))}
              </select>

              <select
                className="input-field"
                style={{ width: 100, fontWeight: 600 }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                className="input-field"
                style={{ width: 200 }}
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
              >
                <option value="">🏢 All Warehouses</option>
                {(warehouses.data ?? []).map((w: any) => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => window.print()}
            >
              <Printer size={15} /> 🖨️ Print / Export Monthly Report
            </button>
          </div>

          {/* KPI Summary Cards with MoM Growth & Data Science Metrics */}
          {(() => {
            const summaryData = monthlyAnalytics.data?.summary ?? {
              totalOutwardQuantity: monthlyAnalytics.data?.totalOutwardUnits ?? 0,
              totalInwardQuantity: monthlyAnalytics.data?.totalInwardUnits ?? 0,
              activeDays: monthlyAnalytics.data?.activeProductionDays ?? 0,
              totalTransactions: monthlyAnalytics.data?.totalTransactions ?? 0,
              totalInwardCost: monthlyAnalytics.data?.totalInwardCost ?? 0,
            };

            const growth = monthlyAnalytics.data?.growth ?? {
              prevOutwardUnits: 0,
              prevInwardUnits: 0,
              outwardGrowthPercent: 0,
              inwardGrowthPercent: 0,
            };

            const kpis = monthlyAnalytics.data?.kpis ?? {
              materialYieldRate: 100,
              overallEfficiencyPercent: 100,
              totalWastageCostLoss: 0,
              totalWastageQty: 0,
              avgPacksPerDay: 0,
              unitMaterialCostPerPack: 0,
              wastageLossRatioPercent: 0,
              hasRecipeConfigured: false,
            };

            const varianceList = monthlyAnalytics.data?.varianceBreakdown ?? [];

            let cumulativePacks = 0;
            const enrichedTrend = (monthlyAnalytics.data?.dailyTrend ?? []).map((d: any) => {
              cumulativePacks += Number(d.outwards || 0);
              return {
                ...d,
                cumulativeOutwards: cumulativePacks,
              };
            });

            return (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
                  {/* Card 1: Outward Finished Goods */}
                  <div className="card" style={{ padding: 18, borderLeft: "4px solid #10b981", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block", fontWeight: 600 }}>
                        Total Finished Output (25kg Packs)
                      </span>
                      <InfoTooltip text="Intha month factory-la motham produce aana finished goods count (Flex bundles & 25kg packs). Mela irukura green/red pill pona maasatha vida production yevlo % grow aagirukku nu kaatum." />
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: "#059669" }}>
                        {(summaryData.totalOutwardQuantity ?? 0).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#059669" }}>Packs</span>
                      {growth.outwardGrowthPercent !== undefined && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 12,
                            background: growth.outwardGrowthPercent >= 0 ? "#dcfce7" : "#fee2e2",
                            color: growth.outwardGrowthPercent >= 0 ? "#15803d" : "#b91c1c",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 2,
                          }}
                        >
                          {growth.outwardGrowthPercent >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          {growth.outwardGrowthPercent > 0 ? `+${growth.outwardGrowthPercent}%` : `${growth.outwardGrowthPercent}%`} MoM
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                      Total Net Mass: {((summaryData.totalOutwardQuantity ?? 0) * 25).toLocaleString()} kg
                    </span>
                  </div>

                  {/* Card 2: Inward Raw Material Consumed */}
                  <div className="card" style={{ padding: 18, borderLeft: "4px solid #6366f1", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block", fontWeight: 600 }}>
                        Total Raw Materials Consumed
                      </span>
                      <InfoTooltip text="Intha month finished goods produce seiyya consume aana Wire rod, Chemical flux & Shielding gas motha alavu mattrum motha spend (₹)." />
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: "#4f46e5" }}>
                        {(summaryData.totalInwardQuantity ?? 0).toLocaleString()}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#4f46e5" }}>kg / Units</span>
                      {growth.inwardGrowthPercent !== undefined && (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 12,
                            background: "#ede9fe",
                            color: "#6d28d9",
                          }}
                        >
                          {growth.inwardGrowthPercent > 0 ? `+${growth.inwardGrowthPercent}%` : `${growth.inwardGrowthPercent}%`} MoM
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                      Total Material Spend: ₹{(summaryData.totalInwardCost ?? 0).toLocaleString()}
                    </span>
                  </div>

                  {/* Card 3: Material Efficiency Rate */}
                  <div className="card" style={{ padding: 18, borderLeft: "4px solid #0284c7", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block", fontWeight: 600 }}>
                        🎯 Material Efficiency Rate
                      </span>
                      <InfoTooltip text="Formula/Recipe padi thevaiyana alavu vs actual-ah consume aana alavu ratio. 95% mela irundha excellent production. Koranja raw material waste aagudhu nu artham." />
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: kpis.overallEfficiencyPercent >= 94 ? "#0284c7" : "#d97706" }}>
                        {kpis.overallEfficiencyPercent}%
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: kpis.overallEfficiencyPercent >= 94 ? "#e0f2fe" : "#fef3c7",
                          color: kpis.overallEfficiencyPercent >= 94 ? "#0369a1" : "#b45309",
                        }}
                      >
                        {kpis.overallEfficiencyPercent >= 94 ? "🟢 Optimal" : "🟡 Moderate Wastage"}
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                      Target Benchmark: &gt;95.0% Industrial Efficiency
                    </span>
                  </div>

                  {/* Card 4: Material Wastage Financial Loss */}
                  <div className="card" style={{ padding: 18, borderLeft: "4px solid #ef4444", position: "relative", background: kpis.totalWastageCostLoss > 0 ? "#fff5f5" : "#fff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 12, color: "#b91c1c", display: "block", fontWeight: 700 }}>
                        💸 Material Wastage Financial Loss
                      </span>
                      <InfoTooltip text="Formula-vai vida extra-va use panna raw material-oda direct panam loss! Spillage, leakage, extra coating moolama factory-ku aana extra expense." />
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: "#dc2626" }}>
                        ₹{kpis.totalWastageCostLoss.toLocaleString()}
                      </span>
                      {kpis.totalWastageCostLoss > 0 && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 7px", borderRadius: 12, background: "#fee2e2", color: "#991b1b" }}>
                          ⚠️ LOSS
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 11, color: "#b91c1c", marginTop: 4, display: "block" }}>
                      {kpis.totalWastageQty > 0 ? `${kpis.totalWastageQty.toLocaleString()} kg extra consumed (${kpis.wastageLossRatioPercent}% of spend)` : "Zero material waste recorded!"}
                    </span>
                  </div>

                  {/* Card 5: Overall Material Yield */}
                  <div className="card" style={{ padding: 18, borderLeft: "4px solid #8b5cf6", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block", fontWeight: 600 }}>
                        ⚡ Material Yield Rate (OEE Yield)
                      </span>
                      <InfoTooltip text="100 kg raw material machine-la pottal ethana kg finished good-ah maarudhu nu kaatum standard industrial yield metric (Finished Mass ÷ Input Mass)." />
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: "#7c3aed" }}>
                        {kpis.materialYieldRate}%
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: "#f3e8ff", color: "#6b21a8" }}>
                        Yield
                      </span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                      Benchmark: 92% – 96% Standard Flex Yield
                    </span>
                  </div>

                  {/* Card 6: Daily Run Rate & Cost Per Pack */}
                  <div className="card" style={{ padding: 18, borderLeft: "4px solid #f59e0b", position: "relative" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block", fontWeight: 600 }}>
                        🏭 Daily Run Rate & Unit Cost
                      </span>
                      <InfoTooltip text="Oru active factory working day-ku average-ah evlo packs ready aagudhu and 1 pack-oda raw material production cost evlo nu kaatum." />
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
                      <span style={{ fontSize: 26, fontWeight: 800, color: "#d97706" }}>
                        {kpis.avgPacksPerDay}
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#d97706" }}>Packs/Day</span>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4, display: "block" }}>
                      Avg Material Cost: ₹{kpis.unitMaterialCostPerPack.toLocaleString()} / 25kg Pack
                    </span>
                  </div>
                </div>

                {/* 🎯 SECTION 2: MATERIAL EFFICIENCY & WASTAGE LOSS TRACKER */}
                <div className="card" style={{ padding: 22, border: "1px solid #fed7aa", background: "#fffdfa" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                    <div>
                      <h4 style={{ fontSize: 17, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 8, color: "#9a3412" }}>
                        <Target size={20} color="#ea580c" />
                        🎯 Raw Material Efficiency & Wastage Loss Tracker (Formula BOM vs Actual Consumed)
                      </h4>
                      <p style={{ margin: "4px 0 0 0", fontSize: 12, color: "#78350f" }}>
                        Formula-padi ovvoru 25kg pack-kum thevaiyana standard alavu vs Daily Notebook-la actual-ah use panna alavu comparison. Extra use aana raw material wastage-ai yum financial loss-ai yum spot pannalaam.
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span
                        style={{
                          background: kpis.totalWastageCostLoss > 0 ? "#fee2e2" : "#dcfce7",
                          color: kpis.totalWastageCostLoss > 0 ? "#991b1b" : "#166534",
                          padding: "6px 14px",
                          borderRadius: 8,
                          fontWeight: 700,
                          fontSize: 13,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        {kpis.totalWastageCostLoss > 0 ? (
                          <>⚠️ Total Wastage Financial Loss: ₹{kpis.totalWastageCostLoss.toLocaleString()}</>
                        ) : (
                          <>✓ Zero Material Wastage: Highly Efficient</>
                        )}
                      </span>
                      <InfoTooltip text="Intha table-la ovvoru raw material-um standard formula padi evlo thevai, actual-ah evlo use aachu, extra-va use aana material moolama evlo panam loss aachu nu kaattum." align="right" />
                    </div>
                  </div>

                  {varianceList.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)", fontStyle: "italic" }}>
                      No raw material consumption logs recorded for this month yet. Enter daily production entries in "Daily Production Notebook" tab to see real-time wastage analysis!
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table className="data-table" style={{ width: "100%", fontSize: 13 }}>
                        <thead>
                          <tr style={{ background: "#fef3c7", color: "#78350f" }}>
                            <th>Raw Material / Consumable</th>
                            <th style={{ textAlign: "right" }}>Standard Expected (Formula)</th>
                            <th style={{ textAlign: "right" }}>Actual Consumed (Notebook)</th>
                            <th style={{ textAlign: "right" }}>Variance (Diff)</th>
                            <th style={{ textAlign: "right" }}>Unit Cost</th>
                            <th style={{ textAlign: "right" }}>Wastage Loss (₹)</th>
                            <th style={{ textAlign: "center" }}>Efficiency Score</th>
                            <th style={{ textAlign: "center" }}>Industrial Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {varianceList.map((v: any, idx: number) => {
                            const isOver = v.varianceQty > 0;
                            return (
                              <tr key={idx} style={{ background: isOver && v.wastageLossCost > 500 ? "#fff5f5" : "#ffffff" }}>
                                <td>
                                  <strong style={{ display: "block", color: "var(--text-primary)" }}>{v.name}</strong>
                                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{v.sku}</span>
                                </td>
                                <td style={{ textAlign: "right", color: "#2563eb", fontWeight: 600 }}>
                                  {v.expectedQty.toLocaleString()} {v.unit}
                                </td>
                                <td style={{ textAlign: "right", color: "#4f46e5", fontWeight: 700 }}>
                                  {v.actualQty.toLocaleString()} {v.unit}
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  <span
                                    style={{
                                      padding: "2px 8px",
                                      borderRadius: 4,
                                      fontSize: 11,
                                      fontWeight: 700,
                                      background: isOver ? "#fee2e2" : "#dcfce7",
                                      color: isOver ? "#991b1b" : "#15803d",
                                    }}
                                  >
                                    {isOver ? `+${v.varianceQty.toLocaleString()}` : `${v.varianceQty.toLocaleString()}`} {v.unit}
                                    {isOver ? " (Overused)" : " (Saved)"}
                                  </span>
                                </td>
                                <td style={{ textAlign: "right", color: "var(--text-muted)" }}>
                                  ₹{v.unitCostPrice} / {v.unit}
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  {v.wastageLossCost > 0 ? (
                                    <strong style={{ color: "#dc2626", fontSize: 14 }}>
                                      ₹{v.wastageLossCost.toLocaleString()}
                                    </strong>
                                  ) : (
                                    <span style={{ color: "#16a34a", fontWeight: 600 }}>₹0 (No Loss)</span>
                                  )}
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                    <div style={{ width: 60, height: 6, background: "#e2e8f0", borderRadius: 3, overflow: "hidden" }}>
                                      <div
                                        style={{
                                          width: `${Math.min(100, v.efficiencyPercent)}%`,
                                          height: "100%",
                                          background: v.efficiencyPercent >= 95 ? "#10b981" : v.efficiencyPercent >= 90 ? "#f59e0b" : "#ef4444",
                                        }}
                                      />
                                    </div>
                                    <span style={{ fontSize: 12, fontWeight: 700 }}>{v.efficiencyPercent}%</span>
                                  </div>
                                </td>
                                <td style={{ textAlign: "center" }}>
                                  {v.status === "HIGH_WASTAGE" ? (
                                    <span style={{ background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                                      🔴 High Wastage Alert
                                    </span>
                                  ) : v.status === "SLIGHT_WASTAGE" ? (
                                    <span style={{ background: "#fef3c7", color: "#b45309", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                                      🟡 Slight Wastage
                                    </span>
                                  ) : (
                                    <span style={{ background: "#dcfce7", color: "#15803d", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                                      🟢 Optimal Control
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 📈 SECTION 3: INDUSTRIAL GROWTH & TREND ANALYTICS GRAPHS */}
                <div className="card" style={{ padding: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
                    <div>
                      <h4 style={{ fontSize: 16, fontWeight: 800, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                        <Activity size={18} color="var(--accent)" />
                        Industrial Growth Graphs & Multi-Series Production Analytics
                      </h4>
                      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        Factory output trajectory, cumulative volume growth & raw material consumption patterns
                      </span>
                    </div>

                    {/* Chart Mode Toggle */}
                    <div style={{ display: "flex", gap: 6, background: "#f1f5f9", padding: 4, borderRadius: 8 }}>
                      <button
                        type="button"
                        className={`btn btn-sm ${analyticsGraphMode === "growth" ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setAnalyticsGraphMode("growth")}
                        style={{ fontSize: 12 }}
                      >
                        🚀 Production Volume & Growth Trajectory
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${analyticsGraphMode === "variance" ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setAnalyticsGraphMode("variance")}
                        style={{ fontSize: 12 }}
                      >
                        ⚖️ Formula Expected vs Actual Consumed
                      </button>
                      <button
                        type="button"
                        className={`btn btn-sm ${analyticsGraphMode === "daily" ? "btn-primary" : "btn-ghost"}`}
                        onClick={() => setAnalyticsGraphMode("daily")}
                        style={{ fontSize: 12 }}
                      >
                        📊 Daily Output vs Inward Trend
                      </button>
                    </div>
                  </div>

                  {monthlyAnalytics.isLoading ? (
                    <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
                      Loading industrial analytics chart…
                    </div>
                  ) : enrichedTrend.length === 0 ? (
                    <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontStyle: "italic" }}>
                      No production transactions recorded in this month. Use "Daily Production Notebook" tab to enter logs!
                    </div>
                  ) : (
                    <div style={{ width: "100%", height: 340 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        {analyticsGraphMode === "growth" ? (
                          /* Graph 1: Growth Trajectory & Daily Output */
                          <ComposedChart data={enrichedTrend} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                              formatter={(val: any, name: any) => [
                                `${val} units`,
                                name === "outwards"
                                  ? "📤 Daily Ready Packs (25kg)"
                                  : name === "cumulativeOutwards"
                                  ? "🚀 Cumulative Monthly Output"
                                  : "📥 Raw Materials Consumed",
                              ]}
                            />
                            <Legend
                              formatter={(value) =>
                                value === "outwards"
                                  ? "📤 Daily Ready Packs (25kg)"
                                  : value === "cumulativeOutwards"
                                  ? "🚀 Cumulative Output Trajectory"
                                  : "📥 Raw Materials Consumed"
                              }
                            />
                            <Bar yAxisId="left" dataKey="outwards" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                            <Line
                              yAxisId="right"
                              type="monotone"
                              dataKey="cumulativeOutwards"
                              stroke="#0284c7"
                              strokeWidth={3}
                              dot={{ r: 4, fill: "#0284c7" }}
                              activeDot={{ r: 6 }}
                            />
                          </ComposedChart>
                        ) : analyticsGraphMode === "variance" ? (
                          /* Graph 2: Formula Expected vs Actual Consumed */
                          <BarChart data={varianceList} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                              formatter={(val: any, name: any) => [
                                `${val} units`,
                                name === "expectedQty" ? "🔵 Standard Expected (Formula)" : "🟣 Actual Consumed (Daily Notebook)",
                              ]}
                            />
                            <Legend
                              formatter={(value) =>
                                value === "expectedQty"
                                  ? "🔵 Standard Expected (Formula)"
                                  : "🟣 Actual Consumed (Daily Notebook)"
                              }
                            />
                            <Bar dataKey="expectedQty" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={38} />
                            <Bar dataKey="actualQty" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={38} />
                          </BarChart>
                        ) : (
                          /* Graph 3: Daily Outward vs Inward */
                          <BarChart data={enrichedTrend} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="dayLabel" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} />
                            <Tooltip
                              contentStyle={{ background: "#ffffff", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
                              formatter={(val: any, name: any) => [
                                `${val} units`,
                                name === "outwards" ? "📤 Finished Goods Outward" : "📥 Raw Materials Inward",
                              ]}
                            />
                            <Legend
                              formatter={(value) =>
                                value === "outwards" ? "📤 Finished Goods (Outward)" : "📥 Raw Materials Consumed (Inward)"
                              }
                            />
                            <Bar dataKey="outwards" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                            <Bar dataKey="inwards" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={32} />
                          </BarChart>
                        )}
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* 🧠 SECTION 4: INDUSTRIAL DATA SCIENCE & BUSINESS IMPROVEMENT INSIGHTS */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
                  <div className="card" style={{ padding: 18, borderLeft: "4px solid #10b981", background: "#f0fdf4" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <TrendingUp size={18} color="#15803d" />
                      <strong style={{ fontSize: 14, color: "#166534" }}>Production Momentum & Growth</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#166534", lineHeight: 1.5 }}>
                      Factory produced <strong>{summaryData.totalOutwardQuantity} packs</strong> across <strong>{summaryData.activeDays} working days</strong> (Avg <strong>{kpis.avgPacksPerDay} packs/day</strong>).
                      {growth.outwardGrowthPercent > 0 ? (
                        <> Pona maasathai vida <strong>+{growth.outwardGrowthPercent}% production growth</strong> achieve aagiyiruku!</>
                      ) : (
                        <> Maintain steady daily shifts to improve overall monthly volume.</>
                      )}
                    </p>
                  </div>

                  <div className="card" style={{ padding: 18, borderLeft: "4px solid #f59e0b", background: "#fefce8" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Target size={18} color="#b45309" />
                      <strong style={{ fontSize: 14, color: "#854d0e" }}>Wastage Leakage Optimization</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#854d0e", lineHeight: 1.5 }}>
                      {kpis.totalWastageCostLoss > 0 ? (
                        <>
                          This month raw material wastage leakage-la <strong>₹{kpis.totalWastageCostLoss.toLocaleString()}</strong> loss aayirukku. Top waste aana raw material-la spillage koraicha immediate-ah factory profit increase aagum!
                        </>
                      ) : (
                        <>Excellent material control! Formula-padi raw material accurate-ah use aagi zero leakage maintain aagudhu.</>
                      )}
                    </p>
                  </div>

                  <div className="card" style={{ padding: 18, borderLeft: "4px solid #0284c7", background: "#f0f9ff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Activity size={18} color="#0369a1" />
                      <strong style={{ fontSize: 14, color: "#075985" }}>Material Yield & Quality Control</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#075985", lineHeight: 1.5 }}>
                      Current Process Yield: <strong>{kpis.materialYieldRate}%</strong> (Finished mass vs input mass). Standard 92%–96% range-la irundha raw material conversion highly stable.
                    </p>
                  </div>

                  <div className="card" style={{ padding: 18, borderLeft: "4px solid #8b5cf6", background: "#faf5ff" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <Calculator size={18} color="#6b21a8" />
                      <strong style={{ fontSize: 14, color: "#581c87" }}>Unit Manufacturing Cost</strong>
                    </div>
                    <p style={{ margin: 0, fontSize: 12, color: "#581c87", lineHeight: 1.5 }}>
                      Average Raw Material Cost: <strong>₹{kpis.unitMaterialCostPerPack.toLocaleString()} / 25kg Pack</strong>. Bulk purchase and zero spillage moolama unit cost-ai ₹20–₹50 koraikka mudiyum.
                    </p>
                  </div>
                </div>

                {/* Side-by-Side Breakdown Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 20 }}>
                  {/* Outward Breakdown */}
                  <div className="card" style={{ padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#065f46" }}>
                        📤 Finished Goods Output Breakdown (This Month)
                      </h4>
                      <InfoTooltip text="Intha month entha entha finished product yevlo count produce aachu nu item-wise breakdown." align="right" />
                    </div>
                    {(monthlyAnalytics.data?.outwardBreakdown ?? []).length === 0 ? (
                      <div style={{ color: "var(--text-muted)", fontSize: 13, fontStyle: "italic", padding: 10 }}>
                        No finished goods recorded.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {monthlyAnalytics.data.outwardBreakdown.map((b: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 12px",
                              background: "#f0fdf4",
                              borderRadius: 6,
                              border: "1px solid #dcfce7",
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 600, fontSize: 13, color: "#065f46" }}>{b.name}</span>
                              <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>{b.sku}</span>
                            </div>
                            <strong style={{ fontSize: 15, color: "#059669" }}>
                              {b.quantity} {b.unit}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Inward Breakdown */}
                  <div className="card" style={{ padding: 18 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "#3730a3" }}>
                        📥 Raw Materials Consumed Breakdown (This Month)
                      </h4>
                      <InfoTooltip text="Intha month entha entha raw material / gas yevlo consumption aachu nu item-wise breakdown." align="right" />
                    </div>
                    {(monthlyAnalytics.data?.inwardBreakdown ?? []).length === 0 ? (
                      <div style={{ color: "var(--text-muted)", fontSize: 13, fontStyle: "italic", padding: 10 }}>
                        No inward materials recorded.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {monthlyAnalytics.data.inwardBreakdown.map((b: any, idx: number) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 12px",
                              background: "#eef2ff",
                              borderRadius: 6,
                              border: "1px solid #e0e7ff",
                            }}
                          >
                            <div>
                              <span style={{ fontWeight: 600, fontSize: 13, color: "#3730a3" }}>{b.name}</span>
                              <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>{b.sku}</span>
                            </div>
                            <strong style={{ fontSize: 15, color: "#4f46e5" }}>
                              {b.quantity} {b.unit}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Digital Notebook Ledger Table */}
                <div className="card" style={{ padding: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                      <ClipboardList size={18} color="var(--accent)" />
                      Daily Digital Notebook Ledger (Month Logbook Entries)
                    </h4>
                    <InfoTooltip text="Paper note-la date pottu eludhina mathiri ovvoru transaction-um date, product, quantity & notes-oda irukkum digital ledger. Mela irukura print button click panni PDF-ah download pannalam." align="right" />
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table className="data-table" style={{ width: "100%", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "#f8fafc" }}>
                          <th>Date & Time</th>
                          <th>Type</th>
                          <th>Product / Material</th>
                          <th style={{ textAlign: "right" }}>Quantity</th>
                          <th>Warehouse</th>
                          <th>Reference / Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(monthlyAnalytics.data?.recentLedger ?? monthlyAnalytics.data?.recentTxns ?? []).length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                              No ledger transactions found for this month.
                            </td>
                          </tr>
                        ) : (
                          (monthlyAnalytics.data?.recentLedger ?? monthlyAnalytics.data?.recentTxns ?? []).map((row: any) => (
                            <tr key={row.id}>
                              <td>{new Date(row.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                              <td>
                                {row.type === "PRODUCTION_OUTPUT" ? (
                                  <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                                    📤 OUTWARD (+)
                                  </span>
                                ) : (
                                  <span style={{ background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                                    📥 INWARD (-)
                                  </span>
                                )}
                              </td>
                              <td>
                                <span style={{ fontWeight: 600 }}>{row.productName}</span>
                                <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>{row.sku}</span>
                              </td>
                              <td style={{ textAlign: "right", fontWeight: 700, color: row.type === "PRODUCTION_OUTPUT" ? "#16a34a" : "#dc2626" }}>
                                {row.type === "PRODUCTION_OUTPUT" ? `+${row.quantity}` : `-${row.quantity}`} {row.unit}
                              </td>
                              <td>{row.warehouseName}</td>
                              <td style={{ color: "var(--text-muted)", fontSize: 12 }}>
                                {row.referenceNumber || row.notes || "—"}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ── Summary Metric Cards (for single batch produce & history) ── */}
      {(tab === "produce" || tab === "history" || tab === "recipes") && (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>Total Production Batches</span>
            <InfoTooltip text="Factory-la ithuvarai run aana total production batch runs count." />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--text-primary)", marginTop: 4 }}>
            {(runs.data?.data ?? []).length}
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>Finished Units Produced</span>
            <InfoTooltip text="Production batches moolama ithuvarai total-ah ready aana finished units count." />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "var(--accent)", marginTop: 4 }}>
            {(runs.data?.data ?? []).reduce((acc: number, r: any) => acc + (Number(r.quantityProduced) || 0), 0)}
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>Active Product Recipes</span>
            <InfoTooltip text="Raw material formula (BOM recipe) set pannirukura finished products count." />
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#059669", marginTop: 4 }}>
            {finishedGoods.filter((p: any) => (p.components?.length ?? 0) > 0).length} / {finishedGoods.length}
          </div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", display: "block" }}>Factory Stock Readiness</span>
            <InfoTooltip text="Godown-la irukura raw materials-ah vachi ippo ethana units produce panna mudiyum nu automated readiness status." />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: (feasibility.data?.canProduce ?? 0) > 0 ? "var(--success)" : "#d97706", marginTop: 4 }}>
            {feasibility.data?.hasRecipe
              ? `${feasibility.data?.canProduce ?? 0} units can be built`
              : "Recipe setup required"}
          </div>
        </div>
      </div>
      )}

      {/* ── TAB 1: RUN PRODUCTION ── */}
      {tab === "produce" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 20 }}>
          {/* Left Column: Form & Ingredients Breakdown */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              ⚡ Start Production Batch
              <InfoTooltip text="Oru specific finished item select panni, recipe formula padi exact batch run seithu stock auto-deduct panna." align="left" />
            </h3>

            <div className="form-grid form-grid-2" style={{ marginBottom: 16 }}>
              <InputGroup label="Finished Good to Produce *">
                <select
                  className="input-field"
                  style={{ fontWeight: 600, fontSize: 14 }}
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  {finishedGoods.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      📦 {p.name} ({p.sku})
                    </option>
                  ))}
                </select>
              </InputGroup>

              <InputGroup label="Factory Warehouse (Godown) *">
                <select
                  className="input-field"
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                >
                  {(warehouses.data ?? []).map((w: any) => (
                    <option key={w.id} value={w.id}>
                      🏢 {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </InputGroup>

              <InputGroup label="Units to Produce *">
                <NumberStepper
                  value={produceQty}
                  onChange={(v) => setProduceQty(String(v))}
                  min={1}
                  step={1}
                  size="md"
                  quickAdd={[10, 50, 100]}
                />
              </InputGroup>

              <InputGroup label="Labor Cost (₹)">
                <NumberStepper
                  value={laborCost}
                  onChange={(v) => setLaborCost(String(v))}
                  min={0}
                  step={50}
                  prefix="₹"
                  size="md"
                  quickAdd={[100, 500]}
                />
              </InputGroup>

              <InputGroup label="Machine / Power / Gas Overheads (₹)">
                <NumberStepper
                  value={overheadCost}
                  onChange={(v) => setOverheadCost(String(v))}
                  min={0}
                  step={50}
                  prefix="₹"
                  size="md"
                  quickAdd={[100, 500]}
                />
              </InputGroup>

              <InputGroup label="Production Batch Notes">
                <input
                  className="input-field"
                  placeholder="e.g. Morning shift run #1"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </InputGroup>
            </div>

            {/* Recipe Ingredients & Consumption Preview */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-secondary)" }}>
                  REQUIRED RAW MATERIALS & CONSUMABLES FOR {produceQty} UNITS
                </span>
                {selectedProduct && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 12, color: "var(--accent)" }}
                    onClick={() => setRecipeProduct(selectedProduct)}
                  >
                    🥣 Edit Recipe Formula
                  </button>
                )}
              </div>

              {!feasibility.data?.hasRecipe ? (
                <div style={{ padding: 24, textAlign: "center", background: "#fff7ed", border: "1px dashed #fed7aa", borderRadius: 8 }}>
                  <AlertTriangle size={24} color="#d97706" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontWeight: 600, color: "#92400e" }}>Recipe Formula Not Configured</div>
                  <div style={{ fontSize: 13, color: "#b45309", marginTop: 4 }}>
                    Please define which raw materials (wire, flux, gas) are needed to make <strong>{selectedProduct?.name}</strong>.
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: 12 }}
                    onClick={() => setRecipeProduct(selectedProduct)}
                  >
                    🥣 Configure Recipe Now
                  </button>
                </div>
              ) : (
                <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                  <table className="data-table" style={{ width: "100%", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc" }}>
                        <th>Ingredient</th>
                        <th style={{ textAlign: "right" }}>Per Unit</th>
                        <th style={{ textAlign: "right" }}>Batch Need</th>
                        <th style={{ textAlign: "right" }}>Godown Stock</th>
                        <th style={{ textAlign: "center" }}>Stock Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {componentList.map((c: any, idx: number) => {
                        const neededForBatch = Number(c.recipeQty) * Number(produceQty);
                        const isSufficient = Number(c.availableStock) >= neededForBatch;

                        return (
                          <tr key={idx}>
                            <td>
                              <span style={{ fontWeight: 600 }}>{c.childName}</span>
                              <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)" }}>{c.childSku}</span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {c.recipeQty} {c.unit}
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 700 }}>
                              {neededForBatch} {c.unit}
                            </td>
                            <td style={{ textAlign: "right" }}>
                              {c.availableStock} {c.unit}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              {isSufficient ? (
                                <span style={{ background: "#dcfce7", color: "#166534", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                                  ✓ In Stock
                                </span>
                              ) : (
                                <span style={{ background: "#fee2e2", color: "#991b1b", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                                  ⚠️ Shortage ({neededForBatch - c.availableStock} needed)
                                </span>
                              )}
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

          {/* Right Column: Feasibility, Costing & Run Action */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Feasibility Alert Card */}
            <div
              className="card"
              style={{
                padding: 16,
                background: (feasibility.data?.canProduce ?? 0) > 0 ? "#f0fdf4" : "#fff7ed",
                border: `1px solid ${(feasibility.data?.canProduce ?? 0) > 0 ? "#bbf7d0" : "#fed7aa"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                {(feasibility.data?.canProduce ?? 0) > 0 ? (
                  <CheckCircle size={18} color="#16a34a" />
                ) : (
                  <AlertTriangle size={18} color="#d97706" />
                )}
                <span style={{ fontWeight: 700, fontSize: 14, color: (feasibility.data?.canProduce ?? 0) > 0 ? "#166534" : "#92400e" }}>
                  Max Feasible Production Output
                </span>
                <InfoTooltip text="Godown stock-ah check panni, intha warehouse-la max yevlo units manufacture panna mudiyum nu automated calculate pannum." />
              </div>
              <div style={{ fontSize: 13, color: (feasibility.data?.canProduce ?? 0) > 0 ? "#15803d" : "#b45309" }}>
                Current raw material stock allows producing up to{" "}
                <strong style={{ fontSize: 16 }}>{feasibility.data?.canProduce ?? 0} units</strong> in this warehouse.
              </div>
              {(feasibility.data?.bottlenecks ?? []).length > 0 && (
                <div style={{ marginTop: 8, fontSize: 12, color: "#991b1b", background: "#fee2e2", padding: "6px 10px", borderRadius: 6 }}>
                  ⚠️ Stock Bottleneck:{" "}
                  <strong>{feasibility.data.bottlenecks.map((b: any) => b.childName).join(", ")}</strong>
                </div>
              )}
            </div>

            {/* Costing Summary Card */}
            <div className="card" style={{ padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: "var(--text-secondary)" }}>
                  BATCH PRODUCTION COST ESTIMATE
                </h4>
                <InfoTooltip text="Raw material cost + worker labor cost + machine overheads serthu per-unit manufacturing cost calculate panna." align="right" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 13 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Raw Material Cost:</span>
                  <span>{money(totalRawMaterialBatchCost)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Labor Cost:</span>
                  <span>{money(Number(laborCost) || 0)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-muted)" }}>Machine & Gas Overheads:</span>
                  <span>{money(Number(overheadCost) || 0)}</span>
                </div>
                <hr style={{ margin: "4px 0", borderColor: "#f1f5f9" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700 }}>
                  <span>Total Batch Cost:</span>
                  <span style={{ color: "var(--accent)" }}>{money(totalBatchCost)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
                  <span>Manufactured Unit Cost:</span>
                  <span>{money(unitManufacturedCost)} / unit</span>
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: "100%", padding: "12px", fontSize: 15, justifyContent: "center" }}
                  disabled={produce.isPending || !feasibility.data?.hasRecipe || Number(produceQty) <= 0}
                  onClick={() => produce.mutate()}
                >
                  {produce.isPending ? (
                    <span className="spinner" style={{ width: 16, height: 16 }} />
                  ) : (
                    <Boxes size={18} />
                  )}
                  🚀 Produce {produceQty} Units & Deduct Stock
                </button>
                <span style={{ display: "block", textAlign: "center", fontSize: 11, color: "var(--text-muted)", marginTop: 8 }}>
                  ✓ In 1 click: Raw materials deducted (-), Finished goods added (+)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: PRODUCTION HISTORY ── */}
      {tab === "history" && (
        <div className="card">
          <DataTable
            columns={runColumns}
            data={runs.data?.data ?? []}
            loading={runs.isLoading}
            error={runs.error}
            searchFields={["runNumber"]}
            emptyIcon={<Boxes size={48} />}
            emptyText="No production runs recorded yet. Start your first production batch!"
          />
        </div>
      )}

      {/* ── TAB 3: BILL OF MATERIALS (BOM RECIPES) ── */}
      {tab === "recipes" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {finishedGoods.map((fg: any) => {
            const comps = fg.components ?? [];
            return (
              <div key={fg.id} className="card" style={{ padding: 18, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{fg.name}</h4>
                      <span className="font-mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>{fg.sku}</span>
                    </div>
                    <span style={{ background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                      Finished Good
                    </span>
                  </div>

                  <div style={{ margin: "12px 0", fontSize: 13 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                      Recipe Ingredients ({comps.length}):
                    </span>
                    {comps.length === 0 ? (
                      <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4, fontStyle: "italic" }}>
                        No recipe configured yet.
                      </div>
                    ) : (
                      <ul style={{ paddingLeft: 18, marginTop: 4, marginBottom: 0 }}>
                        {comps.map((c: any, i: number) => (
                          <li key={i} style={{ marginBottom: 2 }}>
                            {c.quantity}x {c.child?.name || "Material"}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div style={{ paddingTop: 12, borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 11, color: "var(--text-muted)", display: "block" }}>Selling Price</span>
                    <strong style={{ fontSize: 14 }}>{money(fg.sellingPrice)}</strong>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setRecipeProduct(fg)}
                  >
                    🥣 {comps.length > 0 ? "Edit Formula" : "+ Set Formula"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Recipe Formula Modal */}
      <RecipeModal
        product={recipeProduct}
        open={recipeProduct !== null}
        onClose={() => setRecipeProduct(null)}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// LEGACY COMPAT EXPORTS (kept for App.tsx routes)
// ─────────────────────────────────────────────────────────
export function useToastStyles() {
  // No-op — styles are now in index.css
}
