import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ConfigProvider, App as AntApp } from "antd";
import { App } from "./App";
import "./index.css";

const antTheme = {
  token: {
    colorPrimary: "#1565d8",
    colorSuccess: "#16a34a",
    colorWarning: "#d97706",
    colorError: "#dc2626",
    borderRadius: 8,
    borderRadiusLG: 12,
    fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
    fontSize: 13,
    colorBgContainer: "#ffffff",
    colorBorder: "#e2e8f0",
    colorTextBase: "#0f172a",
    colorTextSecondary: "#475569",
    colorBgLayout: "#f0f4f8",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    boxShadowSecondary: "0 1px 3px rgba(0,0,0,0.06)",
  },
  components: {
    Table: {
      headerBg: "#f8fafc",
      headerColor: "#94a3b8",
      headerSortActiveBg: "#f1f5f9",
      rowHoverBg: "#f8fafd",
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
      borderColor: "#f1f5f9",
      headerBorderRadius: 0,
    },
    Button: {
      controlHeight: 34,
      paddingContentHorizontal: 16,
      primaryShadow: "none",
    },
    Input: {
      controlHeight: 36,
      paddingInline: 12,
    },
    Select: {
      controlHeight: 36,
    },
    Modal: {
      borderRadiusLG: 20,
    },
    Card: {
      borderRadiusLG: 14,
    },
    Form: {
      labelColor: "#475569",
      labelFontSize: 12,
    },
    Statistic: {
      titleFontSize: 12,
      contentFontSize: 26,
    },
    Tag: {
      borderRadiusSM: 100,
      defaultBg: "#f1f5f9",
    },
    Drawer: {
      footerPaddingBlock: 14,
      footerPaddingInline: 20,
    },
  },
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ConfigProvider theme={antTheme}>
      <AntApp>
        <App />
      </AntApp>
    </ConfigProvider>
  </StrictMode>,
);
