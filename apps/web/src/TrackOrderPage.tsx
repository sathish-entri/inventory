import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  CheckCircle2,
  Package,
  Truck,
  CheckCheck,
  Phone,
  MessageCircle,
  Building2,
  Calendar,
  Clock,
  Printer,
  Sparkles,
  MapPin,
  FileText,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { api } from "./api";

export function TrackOrderPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [justConfirmed, setJustConfirmed] = useState(false);

  const fetchTrackingData = () => {
    if (!id) return;
    api
      .get(`/public/portal/track/${id}`)
      .then((res) => {
        setData(res.data);
        setError(null);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Order or quotation not found. Please verify your link.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTrackingData();
  }, [id]);

  const handleConfirmOrder = async () => {
    if (!id || confirming) return;
    setConfirming(true);
    try {
      const res = await api.post(`/public/portal/confirm/${id}`);
      setJustConfirmed(true);
      fetchTrackingData();
    } catch (err: any) {
      alert(err.response?.data?.message || "Could not confirm order. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="track-loading-container">
        <div style={{ textAlign: "center", padding: 20 }}>
          <div className="track-spinner" />
          <h3 style={{ color: "#1e293b", margin: "16px 0 4px 0", fontSize: 18 }}>Connecting to Factory System…</h3>
          <p style={{ color: "#64748b", fontSize: 14 }}>Fetching live quotation and production status</p>
        </div>
        <style>{`
          .track-loading-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f8fafc;
            font-family: system-ui, -apple-system, sans-serif;
          }
          .track-spinner {
            width: 44px;
            height: 44px;
            border: 4px solid #cbd5e1;
            border-top-color: #2563eb;
            border-radius: 50%;
            animation: trackSpin 0.8s linear infinite;
            margin: 0 auto;
          }
          @keyframes trackSpin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", padding: 16, fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{ maxWidth: 460, width: "100%", background: "#fff", padding: "28px 20px", borderRadius: 16, boxShadow: "0 10px 25px rgba(0,0,0,0.06)", textAlign: "center" }}>
          <div style={{ width: 56, height: 56, background: "#fee2e2", color: "#dc2626", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
            <AlertCircle size={30} />
          </div>
          <h2 style={{ color: "#1e293b", margin: "0 0 8px 0", fontSize: 20 }}>Link Expired or Not Found</h2>
          <p style={{ color: "#64748b", fontSize: 14, lineHeight: 1.5, marginBottom: 20 }}>{error}</p>
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16 }}>
            <p style={{ fontSize: 13, color: "#475569", margin: "0 0 12px 0" }}>Need help with your order?</p>
            <a
              href="tel:+919443251863"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, background: "#16a34a", color: "#fff", textDecoration: "none", padding: "12px 20px", borderRadius: 8, fontWeight: 700, fontSize: 14, width: "100%", maxWidth: 280 }}
            >
              <Phone size={16} /> Call Factory Support
            </a>
          </div>
        </div>
      </div>
    );
  }

  const { order, estimate, factory, isConfirmed } = data;
  const currentStep = order?.trackingStep ?? (isConfirmed ? 1 : 0);

  const steps = [
    {
      num: 1,
      title: "Order Confirmed",
      subtitle: isConfirmed ? (order?.confirmedAt ? `Approved on ${new Date(order.confirmedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Quotation accepted") : "Pending Customer Approval",
      date: isConfirmed ? "Confirmed" : "Step 1",
      icon: CheckCircle2,
      color: "#16a34a",
    },
    {
      num: 2,
      title: "Packed & Prepared",
      subtitle: currentStep >= 2 ? `Boxed #${order?.package?.number || "PKG-1001"}` : "Factory staging & packaging",
      date: order?.package?.packedAt ? new Date(order.package.packedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : currentStep >= 2 ? "Ready" : "Pending",
      icon: Package,
      color: "#2563eb",
    },
    {
      num: 3,
      title: "Dispatched / Shipping",
      subtitle: currentStep >= 3 ? `${order?.shipment?.carrier || "Logistics"} • ${order?.shipment?.trackingNumber || "Dispatched"}` : "Factory dispatch to vehicle",
      date: order?.shipment?.shippedAt ? new Date(order.shipment.shippedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : currentStep >= 3 ? "In Transit" : "Upcoming",
      icon: Truck,
      color: "#9333ea",
    },
    {
      num: 4,
      title: "Delivered",
      subtitle: currentStep >= 4 ? "Received at destination" : "Final handover to customer",
      date: currentStep >= 4 ? "Delivered" : "Final Step",
      icon: CheckCheck,
      color: "#059669",
    },
  ];

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppEnquiry = () => {
    const text = `Hello OSCAR AUTO FLUX Factory Support,\n\nI am inquiring regarding ${isConfirmed ? `Order *#${order?.number}*` : `Quotation *#${estimate?.number}*`}.\nCustomer: ${order?.customer?.name}\nTotal: ₹${Number(order?.total || 0).toLocaleString("en-IN")}\n\nPlease share the status.\nThank you!`;
    window.open(`https://wa.me/919443251863?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="track-page-wrapper">
      <style>{`
        .track-page-wrapper {
          min-height: 100vh;
          background: #f1f5f9;
          font-family: system-ui, -apple-system, sans-serif;
          color: #1e293b;
          padding: 12px 8px 60px 8px;
        }
        .track-container {
          max-width: 820px;
          margin: 0 auto;
        }
        .track-header {
          background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
          border-radius: 16px 16px 0 0;
          padding: 18px 16px;
          color: #fff;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .track-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .track-badge-verified {
          background: #22c55e;
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 20px;
          text-transform: uppercase;
        }
        .track-main-card {
          background: #fff;
          border-radius: 0 0 16px 16px;
          padding: 20px 14px;
          box-shadow: 0 6px 20px rgba(0,0,0,0.05);
        }
        .track-confirm-cta-box {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 2px solid #86efac;
          border-radius: 14px;
          padding: 20px 16px;
          text-align: center;
          margin-bottom: 24px;
          box-shadow: 0 4px 15px rgba(22, 163, 74, 0.12);
        }
        .track-btn-confirm {
          background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
          color: #fff;
          border: none;
          padding: 14px 28px;
          border-radius: 10px;
          font-size: 16px;
          font-weight: 800;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          max-width: 440px;
          margin: 12px auto 0 auto;
          box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35);
          transition: transform 0.15s ease;
        }
        .track-btn-confirm:active {
          transform: scale(0.98);
        }
        .track-btn-confirm:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .track-stepper-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 24px;
        }
        .track-step-card {
          border-radius: 12px;
          padding: 12px 10px;
          background: #fff;
          border: 1px solid #e2e8f0;
          transition: all 0.2s ease;
        }
        .track-desktop-table {
          display: block;
          overflow-x: auto;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          margin-bottom: 16px;
        }
        .track-mobile-cards {
          display: none;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 16px;
        }
        .track-mobile-item-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px;
        }
        .track-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-bottom: 20px;
        }
        .track-action-buttons {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* ── Mobile Responsive Overrides (< 640px) ── */
        @media (max-width: 640px) {
          .track-page-wrapper {
            padding: 6px 4px 70px 4px;
          }
          .track-header {
            flex-direction: column;
            align-items: flex-start;
            padding: 16px 12px;
          }
          .track-header-actions {
            width: 100%;
            display: flex;
            justify-content: flex-end;
          }
          .track-main-card {
            padding: 16px 10px;
          }
          .track-stepper-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .track-step-card {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
          }
          .track-step-card-text {
            flex: 1;
          }
          .track-info-grid {
            grid-template-columns: 1fr;
            gap: 10px;
          }
          .track-desktop-table {
            display: none;
          }
          .track-mobile-cards {
            display: flex;
          }
          .track-btn-confirm {
            font-size: 15px;
            padding: 14px 16px;
          }
          .track-action-buttons {
            flex-direction: column;
            width: 100%;
          }
          .track-action-buttons button,
          .track-action-buttons a {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      `}</style>

      <div className="track-container">
        
        {/* Top Header Card */}
        <header className="track-header">
          <div className="track-header-left">
            <div style={{ width: 40, height: 40, minWidth: 40, borderRadius: 10, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Building2 size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.01em" }}>{factory?.name || "OSCAR AUTO FLUX"}</span>
                <span className="track-badge-verified">Verified Plant</span>
              </div>
              <p style={{ margin: "1px 0 0 0", fontSize: 11, color: "#bfdbfe" }}>{factory?.tagline || "Welding Consumables & Autoflex Manufacturer"}</p>
            </div>
          </div>

          <div className="track-header-actions">
            <button
              onClick={handlePrint}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "#fff", padding: "7px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}
            >
              <Printer size={14} /> Print Receipt
            </button>
          </div>
        </header>

        {/* Status Notification Banner */}
        <div style={{
          background: isConfirmed ? "#16a34a" : "#d97706",
          color: "#fff",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {isConfirmed ? <CheckCircle2 size={18} /> : <Clock size={18} />}
            <span style={{ fontSize: 13, fontWeight: 700 }}>
              {isConfirmed
                ? (justConfirmed ? "🎉 Order Confirmed! Factory Team Notified." : `Order Status: ${currentStep === 4 ? "Delivered" : currentStep === 3 ? "In Transit / Dispatched" : currentStep === 2 ? "Packed in Factory" : "Order Confirmed & Processing"}`)
                : "Official Price Quotation (Approval Pending)"}
            </span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: 16, fontSize: 11, fontWeight: 700 }}>
            {isConfirmed ? `Order #${order?.number}` : `Quote #${estimate?.number || "EST"}`}
          </div>
        </div>

        {/* Main Content Card */}
        <div className="track-main-card">

          {/* ── 1-CLICK CONFIRMATION CTA (Shown ONLY if NOT yet confirmed!) ── */}
          {!isConfirmed ? (
            <div className="track-confirm-cta-box">
              <span style={{ display: "inline-block", background: "#fef3c7", color: "#92400e", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, marginBottom: 8 }}>
                📌 QUOTATION APPROVAL PENDING
              </span>
              <h3 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 800, color: "#14532d" }}>
                Ready to confirm this order?
              </h3>
              <p style={{ margin: "0 auto", fontSize: 13, color: "#166534", maxWidth: 480, lineHeight: 1.4 }}>
                Review the items and pricing below. Click the button below to approve and trigger manufacturing at our factory.
              </p>

              <button
                type="button"
                className="track-btn-confirm"
                disabled={confirming}
                onClick={handleConfirmOrder}
              >
                {confirming ? (
                  <>
                    <span style={{ width: 16, height: 16, border: "2px solid #fff", borderTopColor: "transparent", borderRadius: "50%", animation: "trackSpin 0.8s linear infinite", display: "inline-block" }} />
                    Confirming Order…
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Confirm & Place Order (₹{Number(order?.total || 0).toLocaleString("en-IN")})
                  </>
                )}
              </button>

              <div style={{ fontSize: 11, color: "#15803d", marginTop: 8 }}>
                🔒 1-Click Secure Approval • Direct to Production Floor
              </div>
            </div>
          ) : (
            /* ── ALREADY CONFIRMED BADGE (Cannot be clicked again!) ── */
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "10px 14px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 size={16} color="#16a34a" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>
                  Order Confirmed & Approved
                </span>
              </div>
              <span style={{ fontSize: 12, color: "#166534" }}>
                Confirmed: <strong>{order?.confirmedAt ? new Date(order.confirmedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "Yes"}</strong>
              </span>
            </div>
          )}

          {/* ── Visual Tracking Stepper (Responsive Grid / Mobile Stack) ── */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", gap: 6 }}>
              <Clock size={15} color="#2563eb" /> Manufacturing & Delivery Progress
            </h3>

            <div className="track-stepper-grid">
              {steps.map((st) => {
                const isPassed = isConfirmed && currentStep >= st.num;
                const isCurrent = isConfirmed && currentStep === st.num;
                const IconComponent = st.icon;

                return (
                  <div
                    key={st.num}
                    className="track-step-card"
                    style={{
                      border: isCurrent ? `2px solid ${st.color}` : isPassed ? "1px solid #cbd5e1" : "1px dashed #e2e8f0",
                      background: isCurrent ? "#f8fafc" : isPassed ? "#fff" : "#fafafa",
                      boxShadow: isCurrent ? `0 2px 10px ${st.color}15` : "none",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        minWidth: 32,
                        borderRadius: "50%",
                        background: isPassed ? st.color : "#f1f5f9",
                        color: isPassed ? "#fff" : "#94a3b8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <IconComponent size={16} />
                    </div>

                    <div className="track-step-card-text">
                      <div style={{ fontWeight: 700, fontSize: 13, color: isPassed ? "#0f172a" : "#64748b" }}>
                        {st.title}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748b", lineHeight: 1.2 }}>
                        {st.subtitle}
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: isPassed ? st.color : "#94a3b8", marginTop: 2 }}>
                        {st.date}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Logistics & Dispatch Card (if packed or shipped) */}
          {(order?.shipment || order?.package) && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: "12px 14px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 36, height: 36, background: "#dcfce7", color: "#15803d", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Truck size={18} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13, color: "#166534" }}>Logistics Dispatch Details</div>
                  <div style={{ fontSize: 12, color: "#15803d" }}>
                    Carrier: <strong>{order?.shipment?.carrier || "Factory Vehicle"}</strong> • Waybill: <strong>{order?.shipment?.trackingNumber || "TN-AF-2026"}</strong>
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#166534" }}>
                Package #{order?.package?.number || "PKG-1"}
              </div>
            </div>
          )}

          {/* Customer & Order Info (2-Columns on desktop, 1-Column on mobile) */}
          <div className="track-info-grid">
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={13} color="#2563eb" /> Customer & Delivery Details
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{order?.customer?.name}</div>
              {order?.customer?.phone && (
                <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>Phone: <strong>{order.customer.phone}</strong></div>
              )}
              {order?.customer?.email && (
                <div style={{ fontSize: 12, color: "#475569" }}>Email: {order.customer.email}</div>
              )}
              <div style={{ fontSize: 12, color: "#475569", marginTop: 4 }}>
                {order?.customer?.address ? `${order.customer.address}, ` : ""}{order?.customer?.city || "Tamil Nadu"}, {order?.customer?.state || "India"}
              </div>
            </div>

            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#64748b", marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}>
                <FileText size={13} color="#2563eb" /> Summary Details
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "#64748b" }}>Status:</span>
                <strong style={{ color: isConfirmed ? "#16a34a" : "#d97706" }}>
                  {isConfirmed ? "Confirmed & Active" : "Pending Confirmation"}
                </strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "#64748b" }}>Order / Ref #:</span>
                <strong>{order?.number || estimate?.number}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "#64748b" }}>Date:</span>
                <span>{order?.date ? new Date(order.date).toLocaleDateString("en-IN") : "—"}</span>
              </div>
            </div>
          </div>

          {/* Manufactured Items: Desktop Table vs Mobile Cards */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ margin: "0 0 10px 0", fontSize: 13, fontWeight: 700, color: "#334155" }}>
              Items in this Quotation / Order:
            </h4>

            {/* Desktop Table (hidden on mobile) */}
            <div className="track-desktop-table">
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                    <th style={{ padding: "8px 12px", width: 35 }}>#</th>
                    <th style={{ padding: "8px 12px" }}>Item Description</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Quantity</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Rate (₹)</th>
                    <th style={{ padding: "8px 12px", textAlign: "center" }}>Tax %</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(order?.lines ?? []).map((l: any, i: number) => (
                    <tr key={l.id || i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 12px", color: "#94a3b8" }}>{i + 1}</td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{l.name}</div>
                        <div style={{ fontSize: 11, color: "#64748b" }}>SKU: {l.sku} • Unit: {l.unit}</div>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>
                        {l.quantity} {l.unit}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right" }}>
                        ₹{Number(l.unitPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#64748b" }}>
                        {l.taxRate}%
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                        ₹{Number(l.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards (shown only on mobile) */}
            <div className="track-mobile-cards">
              {(order?.lines ?? []).map((l: any, i: number) => (
                <div key={l.id || i} className="track-mobile-item-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{l.name}</div>
                    <span style={{ background: "#dbeafe", color: "#1e40af", padding: "1px 6px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                      {l.quantity} {l.unit}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6 }}>
                    SKU: {l.sku} • Rate: ₹{Number(l.unitPrice).toLocaleString("en-IN")} (+{l.taxRate}% GST)
                  </div>
                  <div style={{ textAlign: "right", fontWeight: 800, fontSize: 14, color: "#15803d" }}>
                    ₹{Number(l.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>

            {/* Total Calculation Strip */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <div style={{ width: "100%", maxWidth: 280, background: "#f8fafc", padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4, color: "#64748b" }}>
                  <span>Subtotal:</span>
                  <span>₹{Number(order?.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6, color: "#64748b" }}>
                  <span>GST Tax Total:</span>
                  <span>₹{Number(order?.tax || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 800, color: "#15803d", borderTop: "1px solid #e2e8f0", paddingTop: 6 }}>
                  <span>Grand Total:</span>
                  <span>₹{Number(order?.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Direct Factory Support Box */}
          <div style={{ background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)", border: "1px solid #bbf7d0", borderRadius: 12, padding: "16px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
              <div>
                <h4 style={{ margin: "0 0 2px 0", fontSize: 14, fontWeight: 700, color: "#065f46", display: "flex", alignItems: "center", gap: 6 }}>
                  <ShieldCheck size={16} color="#16a34a" /> Questions about your Order or Quotation?
                </h4>
                <p style={{ margin: 0, fontSize: 12, color: "#047857" }}>
                  Speak directly with our factory manager:
                </p>
                <div style={{ fontSize: 11, color: "#065f46", marginTop: 2 }}>
                  Factory: {factory?.address || "Coimbatore, Tamil Nadu"} | GSTIN: {factory?.gstin || "33AABCO1234F1Z5"}
                </div>
              </div>

              <div className="track-action-buttons">
                <a
                  href={`tel:${factory?.supportPhone || "+919443251863"}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#16a34a",
                    color: "#fff",
                    textDecoration: "none",
                    padding: "10px 16px",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    boxShadow: "0 3px 8px rgba(22, 163, 74, 0.25)",
                  }}
                >
                  <Phone size={14} /> Call Factory ({factory?.supportPhone || "+91 94432 51863"})
                </a>

                <button
                  onClick={handleWhatsAppEnquiry}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#25d366",
                    color: "#fff",
                    border: "none",
                    padding: "10px 16px",
                    borderRadius: 8,
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    boxShadow: "0 3px 8px rgba(37, 211, 102, 0.25)",
                  }}
                >
                  <MessageCircle size={14} /> Chat on WhatsApp
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 20 }}>
          © {new Date().getFullYear()} {factory?.name || "OSCAR AUTO FLUX"}. Powered by Inventra Factory ERP.
        </div>
      </div>
    </div>
  );
}
