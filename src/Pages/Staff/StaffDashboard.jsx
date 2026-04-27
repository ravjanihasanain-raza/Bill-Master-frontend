import React, { useEffect, useState, useMemo, useCallback } from "react";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  FileText,
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  AlertCircle,
  Wallet,
  RefreshCcw,
  Clock,
  Calendar,
  CalendarDays,
  CalendarRange,
  Filter,
  BarChart2,
  TrendingUp,
  Activity,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Eye,
  PlusCircle,
  FileBox,
} from "lucide-react";
import CountUp from "react-countup";
import { useNavigate } from "react-router-dom";
import { getRequest } from "../../../Services/axiosService.jsx";
import GlobalLoader from "../../components/common/GlobalLoader.jsx";
import PageTransition from "../../components/common/PageTransition.jsx";
import PremiumEmptyState from "../../components/common/PremiumEmptyState.jsx";
import {
  SkeletonCard,
  SkeletonTableRows,
  SkeletonBase,
} from "../../components/common/SkeletonLoader.jsx";

/* =========================================================
   ANIMATIONS & MIXINS
   ========================================================= */
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
  100% { transform: translateY(0px); }
`;

const pulseGlow = keyframes`
  0% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.2); }
  50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.5); }
  100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.2); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const premiumHover = css`
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    border-color: rgba(10, 102, 249, 0.87);
    box-shadow: 3px 12px 35px rgba(59, 131, 246, 0.35);
    transform: translateY(-4px);
  }
`;

/* =========================================================
   STYLED COMPONENTS
   ========================================================= */
const PageWrapper = styled.div`
  padding: 16px 20px;
  min-height: 100vh;
  font-family: "Inter", sans-serif;
  background: var(--bg);
  max-width: 1600px;
  margin: 0 auto;
  @media (max-width: 768px) {
    padding: 12px;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 10px;

  .title-area {
    h1 {
      font-size: 22px;
      font-weight: 800;
      background: linear-gradient(90deg, #3b82f6, #06b6d4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0 0 2px 0;
      letter-spacing: -0.5px;
    }
    p {
      color: var(--text-muted);
      margin: 0;
      font-size: 12px;
      font-weight: 500;
    }
  }

  .datetime-area {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--card);
    padding: 6px 12px;
    border-radius: 10px;
    border: 1px solid var(--border-custom);
    color: var(--text);
    font-size: 11px;
    font-weight: 600;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
    svg {
      color: var(--primary);
    }
  }
`;

const PremiumBtn = styled(motion.button)`
  padding: 8px 16px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  transition: all 0.3s ease;
  &:hover {
    filter: brightness(1.15);
    box-shadow: 0 6px 20px rgba(59, 131, 246, 0.4);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const RotatingRefreshIcon = styled(RefreshCcw)`
  ${(props) =>
    props.$loading &&
    css`
      animation: ${spin} 1s linear infinite;
    `}
`;

const FyBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 16px;
`;

/* ── Quick Actions ── */
const QuickActionsContainer = styled(motion.div)`
  background: var(--card);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      #0c62ec,
      #08d2f5,
      #5a19f2,
      transparent
    );
    background-size: 200% auto;
    
    animation: ${shimmer} 4s linear infinite;
    opacity: 0.6;
  }
`;

const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }
  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const QuickActionBtn = styled(motion.button)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 10px;
  background: var(--bg-light-custom);
  box-shadow: 0 8px 32px rgba(21, 59, 173, 0.43);
  border: 1px solid var(--border-custom);
  border-radius: 12px;
  color: var(--text);
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  .icon-wrap {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${(p) => p.$gradient};
    color: white;
    box-shadow: 0 4px 10px ${(p) => p.$shadowColor};
    transition: all 0.3s ease;
  }

  span {
    z-index: 1;
  }

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    background: ${(p) => p.$gradient};
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 0;
  }

  &:hover {
    border-color: ${(p) => p.$hoverBorder};
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);

    .icon-wrap {
      animation: ${float} 2s ease-in-out infinite;
      box-shadow: 0 6px 15px ${(p) => p.$shadowColor};
    }
  }

  &:active {
    transform: translateY(0px) scale(0.98);
  }
`;

/* ── Filters ── */
const SectionFilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-light-custom);
  padding: 4px;
  border-radius: 10px;
  border: 1px solid var(--border-custom);
  overflow-x: auto;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const FilterPill = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 6px;
  border: none;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  background: ${(p) => (p.$active ? "var(--primary)" : "transparent")};
  color: ${(p) => (p.$active ? "#fff" : "var(--text-muted)")};
  box-shadow: ${(p) =>
    p.$active ? "0 2px 6px rgba(59, 130, 246, 0.3)" : "none"};
  transition: all 0.2s;
  &:hover {
    color: ${(p) => (p.$active ? "#fff" : "var(--text)")};
    background: ${(p) => (p.$active ? "var(--primary)" : "var(--card)")};
  }
`;

/* ── Grids & Cards ── */
const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
`;

const KpiCard = styled(motion.div)`
  background: var(--card);
  backdrop-filter: blur(18px);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  padding: 16px;
  position: relative;
  overflow: hidden;
box-shadow: 0 8px 32px rgba(21, 59, 173, 0.43);  ${premiumHover}
  .glow-bg {
    position: absolute;
    top: -16px;
    right: -16px;
    width: 80px;
    height: 80px;
    background: radial-gradient(
      circle,
      ${(p) => p.$color}33 0%,
      transparent 70%
    );
    border-radius: 50%;
    pointer-events: none;
  }
  .kpi-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 10px;
  }
  .icon-box {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${(p) => p.$color}15;
    color: ${(p) => p.$color};
    box-shadow: inset 0 0 8px ${(p) => p.$color}10;
  }
  .kpi-title {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .kpi-value {
    font-size: 20px;
    font-weight: 900;
    color: var(--text);
    margin-top: 4px;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .kpi-trend {
    margin-top: 8px;
    font-size: 10px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 4px;
    color: ${(p) =>
      p.$trendUp
        ? "#10b981"
        : p.$trendUp === false
        ? "#ef4444"
        : "var(--text-muted)"};
  }
`;

/* ── Charts ── */
const SectionTitle = styled.h3`
  font-size: 15px;
  font-weight: 800;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 24px 0 12px 0;
  svg {
    color: var(--primary);
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled(motion.div)`
  background: var(--card);
  backdrop-filter: blur(18px);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  padding: 16px;
box-shadow: 0 8px 32px rgba(21, 59, 173, 0.43);  ${premiumHover} display: flex;
  flex-direction: column;
  .chart-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chart-title {
    font-size: 13px;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 2px;
  }
  .chart-sub {
    font-size: 10px;
    color: var(--text-muted);
    font-weight: 500;
  }
  .chart-body {
    flex: 1;
    min-height: 240px;
    position: relative;
  }
`;

const TooltipWrapper = styled.div`
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 8px;
  padding: 8px 12px;
box-shadow: 0 8px 32px rgba(21, 59, 173, 0.43);  .label {
    font-weight: 800;
    font-size: 11px;
    margin-bottom: 6px;
    color: var(--text);
    border-bottom: 1px solid var(--border-custom);
    padding-bottom: 4px;
  }
  .item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    margin-top: 4px;
  }
  .val {
    margin-left: auto;
    font-weight: 800;
  }
`;

/* ── Table ── */
const TableGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const TableWrapper = styled(motion.div)`
  background: var(--card);
  backdrop-filter: blur(18px);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  overflow: hidden;
box-shadow: 0 8px 32px rgba(21, 59, 173, 0.43);  ${premiumHover} display: flex;
  flex-direction: column;
  .table-header-area {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-custom);
    background: var(--bg-light-custom);
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
  }
  .table-title {
    font-weight: 800;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--text);
  }
  .table-responsive {
    overflow-x: auto;
    width: 100%;
    max-height: 350px;
    flex: 1;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 450px;
    th {
      background: var(--bg-light-custom);
      padding: 10px 12px;
      color: #38bdf8;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-align: left;
      font-weight: 800;
      border-bottom: 1px solid var(--border-custom);
      position: sticky;
      top: 0;
      z-index: 2;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-custom);
      color: var(--text);
      font-size: 12px;
      font-weight: 500;
      transition: background 0.2s;
    }
    tr:hover td {
      background: rgba(59, 130, 246, 0.05);
    }
  }
`;

const StatusBadge = styled.span`
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
  background: ${(p) =>
    p.$status === "Paid"
      ? "rgba(16, 185, 129, 0.15)"
      : p.$status === "Partial"
      ? "rgba(245, 158, 11, 0.15)"
      : "rgba(239, 68, 68, 0.15)"};
  color: ${(p) =>
    p.$status === "Paid"
      ? "#10b981"
      : p.$status === "Partial"
      ? "#f59e0b"
      : "#ef4444"};
  border: 1px solid
    ${(p) =>
      p.$status === "Paid"
        ? "rgba(16, 185, 129, 0.3)"
        : p.$status === "Partial"
        ? "rgba(245, 158, 11, 0.3)"
        : "rgba(239, 68, 68, 0.3)"};
`;

const ActionBtn = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  color: white;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
  transition: all 0.2s ease;
  &:hover {
    filter: brightness(1.15);
    transform: scale(1.1);
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
  }
`;

const ErrorCard = styled.div`
  background: rgba(239, 68, 68, 0.1);
  border: 1px dashed rgba(239, 68, 68, 0.3);
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  color: #ef4444;
  margin-top: 30px;
  h3 {
    font-size: 18px;
    font-weight: 800;
    margin: 12px 0 8px;
  }
  p {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 16px;
  }
`;

/* =========================================================
   CONSTANTS & HELPERS
   ========================================================= */
const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const PIE_COLORS = [
  "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#a855f7", "#ec4899",
];

const isSameDay = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();
const isSameMonth = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
const isSameYear = (d1, d2) => d1.getFullYear() === d2.getFullYear();

// Reusable Filter Component
const SectionFilter = React.memo(({ activeFilter, onChange }) => (
  <SectionFilterBar>
    <FilterPill
      $active={activeFilter === "today"}
      onClick={() => onChange("today")}
    >
      <Calendar size={10} /> Today
    </FilterPill>
    <FilterPill
      $active={activeFilter === "month"}
      onClick={() => onChange("month")}
    >
      <CalendarDays size={10} /> Month
    </FilterPill>
    <FilterPill
      $active={activeFilter === "year"}
      onClick={() => onChange("year")}
    >
      <CalendarRange size={10} /> Year
    </FilterPill>
  </SectionFilterBar>
));

/* =========================================================
   MAIN DASHBOARD COMPONENT
   ========================================================= */
export default function StaffDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [activeFy, setActiveFy] = useState(null);
  const [rawData, setRawData] = useState({
    invoices: [], invoiceItems: [], invoicePayments: [], purchases: [], purchasePayments: [],
    clients: [], products: [], categories: [], inwardStock: [], stockUsed: [], staff: [], vendors: [],
  });

  // Independent Filters
  const [filters, setFilters] = useState({
    kpis: "month",
    revChart: "year",
    catChart: "year",
    invTable: "month",
    payTable: "month",
    purTable: "month",
  });

  const updateFilter = useCallback((section, val) => {
    setFilters((prev) => ({ ...prev, [section]: val }));
  }, []);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAllData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      // Fetch FY first
      const fyRes = await getRequest("FinancialYear/List");
      let currentActiveFy = null;
      if (fyRes.status === "OK" && fyRes.result) {
        currentActiveFy = fyRes.result.find(
          (y) => y.isActive && !y.isClosed && !y.isDelete,
        );
        setActiveFy(currentActiveFy);
      }

      // Parallel API calls
      const endpoints = [
        "InvoiceMaster/ListInvoice", "InvoiceItems/List", "InvoicePayment/List",
        "PurchaseMaster/List", "PurchasePayment/List", "ClientMaster/List",
        "ProductMaster/List", "ProductCategory/List", "InwardStock/List",
        "StockUsed/ListStockUsed", "StaffMaster/List", "Vendor/List",
      ];

      const responses = await Promise.allSettled(
        endpoints.map((ep) => getRequest(ep)),
      );

      const parsedData = responses.map((res) =>
        res.status === "fulfilled" && res.value?.status === "OK"
          ? res.value.result || []
          : [],
      );

      // Filter Data by Active FY globally if available
      let fInv = parsedData[0];
      let fPur = parsedData[3];
      let fInvPay = parsedData[2];
      let fPurPay = parsedData[4];
      let fInw = parsedData[8];
      let fOut = parsedData[9];

      if (currentActiveFy) {
        const fyStart = new Date(currentActiveFy.startDate);
        const fyEnd = new Date(currentActiveFy.endDate);

        const inRange = (dStr) => {
          if (!dStr) return false;
          const d = new Date(dStr);
          return d >= fyStart && d <= fyEnd;
        };

        fInv = fInv.filter((i) => inRange(i.invoiceDate || i.InvoiceDate));
        fPur = fPur.filter((p) => inRange(p.billDate || p.BillDate));
        fInvPay = fInvPay.filter((p) =>
          inRange(p.paymentDate || p.PaymentDate),
        );
        fPurPay = fPurPay.filter((p) =>
          inRange(p.paymentDate || p.PaymentDate),
        );
        fInw = fInw.filter((s) => inRange(s.inwardDate || s.InwardDate));
        fOut = fOut.filter((s) => inRange(s.outwardDate || s.OutwardDate));
      }

      setRawData({
        invoices: fInv, invoiceItems: parsedData[1], invoicePayments: fInvPay, purchases: fPur,
        purchasePayments: fPurPay, clients: parsedData[5], products: parsedData[6],
        categories: parsedData[7], inwardStock: fInw, stockUsed: fOut, staff: parsedData[10], vendors: parsedData[11],
      });
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setError("Failed to fetch dashboard data. Please check your connection.");
    } finally {
      if (isRefresh) setRefreshing(false);
      else setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // --- DYNAMIC DATA COMPUTATION WITH INDEPENDENT FILTERS ---

  const filterDataByScope = useCallback((dataArray, dateField, scope) => {
    const today = new Date();
    return dataArray.filter((item) => {
      const dStr =
        item[dateField] ||
        item[dateField.charAt(0).toUpperCase() + dateField.slice(1)];
      if (!dStr) return false;
      const d = new Date(dStr);
      if (scope === "today") return isSameDay(d, today);
      if (scope === "month") return isSameMonth(d, today);
      if (scope === "year") return isSameYear(d, today);
      return true;
    });
  }, []);

  const dashData = useMemo(() => {
    if (!rawData.invoices) return null;

    // 1. KPIs
    const kpiInv = filterDataByScope(rawData.invoices, "invoiceDate", filters.kpis);
    const kpiPur = filterDataByScope(rawData.purchases, "billDate", filters.kpis);
    const kpiInvPay = filterDataByScope(rawData.invoicePayments, "paymentDate", filters.kpis);
    const kpiInw = filterDataByScope(rawData.inwardStock, "inwardDate", filters.kpis);
    const kpiOut = filterDataByScope(rawData.stockUsed, "outwardDate", filters.kpis);

    const totalRev = kpiInv.reduce((s, i) => s + (Number(i.total || i.Total) || 0), 0);
    const totalPur = kpiPur.reduce((s, p) => s + (Number(p.total || p.Total) || 0), 0);
    const totalCol = kpiInvPay.reduce((s, p) => s + (Number(p.amount || p.Amount) || 0), 0);
    const netProfit = totalRev - totalPur;
    const profitMargin = totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : 0;
    const outstanding = Math.max(0, totalRev - totalCol);
    const stockIn = kpiInw.reduce((s, st) => s + (Number(st.qty || st.Qty) || 0), 0);
    const stockOut = kpiOut.reduce((s, st) => s + (Number(st.qty || st.Qty) || 0), 0);

    // Global low stock calc (not date filtered)
    const productStock = {};
    rawData.products.forEach((p) => (productStock[p.id || p.Id] = 0));
    rawData.inwardStock.forEach((s) => {
      const pid = s.ProductMasterId || s.productMasterId || s.PurchaseItem?.ProductMasterId;
      if (pid && productStock[pid] !== undefined)
        productStock[pid] += Number(s.qty || s.Qty) || 0;
    });
    rawData.stockUsed.forEach((s) => {
      const pid = s.InwardStock?.PurchaseItem?.ProductMasterId;
      if (pid && productStock[pid] !== undefined)
        productStock[pid] -= Number(s.qty || s.Qty) || 0;
    });
    const lowStock = Object.values(productStock).filter((qty) => qty < 10).length;

    const kpiData = {
      totalRev, totalPur, netProfit, profitMargin, outstanding, stockIn, stockOut, lowStock,
      totalEntities: rawData.clients.length + rawData.vendors.length,
    };

    // 2. Revenue vs Purchase Chart
    const chRevData = filterDataByScope(rawData.invoices, "invoiceDate", filters.revChart);
    const chPurData = filterDataByScope(rawData.purchases, "billDate", filters.revChart);
    const chartMap = {};

    if (filters.revChart === "year") {
      MONTH_NAMES.forEach(
        (m) => (chartMap[m] = { label: m, Revenue: 0, Purchase: 0 }),
      );
      chRevData.forEach((i) => {
        const m = MONTH_NAMES[new Date(i.invoiceDate || i.InvoiceDate).getMonth()];
        if (m) chartMap[m].Revenue += Number(i.total || i.Total) || 0;
      });
      chPurData.forEach((p) => {
        const m = MONTH_NAMES[new Date(p.billDate || p.BillDate).getMonth()];
        if (m) chartMap[m].Purchase += Number(p.total || p.Total) || 0;
      });
    } else {
      const today = new Date();
      const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
      for (let d = 1; d <= days; d++)
        chartMap[d] = { label: `${d} ${MONTH_NAMES[today.getMonth()]}`, Revenue: 0, Purchase: 0 };
      chRevData.forEach((i) => {
        const d = new Date(i.invoiceDate || i.InvoiceDate).getDate();
        if (chartMap[d]) chartMap[d].Revenue += Number(i.total || i.Total) || 0;
      });
      chPurData.forEach((p) => {
        const d = new Date(p.billDate || p.BillDate).getDate();
        if (chartMap[d]) chartMap[d].Purchase += Number(p.total || p.Total) || 0;
      });
    }
    const revVsPurChart = Object.values(chartMap);

    // 3. Category Chart
    const catInvData = filterDataByScope(rawData.invoices, "invoiceDate", filters.catChart);
    const validInvIds = new Set(catInvData.map((i) => i.id || i.Id));
    const catMap = {};
    rawData.invoiceItems.forEach((item) => {
      if (validInvIds.has(item.invoiceMasterId || item.InvoiceMasterId)) {
        const prod = rawData.products.find(
          (p) => (p.id || p.Id) === (item.productMasterId || item.ProductMasterId),
        );
        const catName = prod?.CategoryName || prod?.categoryName || "Uncategorized";
        catMap[catName] = (catMap[catName] || 0) + (Number(item.total || item.Total) || 0);
      }
    });
    const catChart = Object.entries(catMap)
      .map(([name, value]) => ({ name, value }))
      .filter((x) => x.value > 0);

    // 4. Tables
    const tblInv = filterDataByScope(rawData.invoices, "invoiceDate", filters.invTable)
      .sort((a, b) => new Date(b.invoiceDate || b.InvoiceDate) - new Date(a.invoiceDate || a.InvoiceDate))
      .slice(0, 6);

    const tblPay = filterDataByScope(rawData.invoicePayments, "paymentDate", filters.payTable)
      .sort((a, b) => new Date(b.paymentDate || b.PaymentDate) - new Date(a.paymentDate || a.PaymentDate))
      .slice(0, 6);

    const tblPur = filterDataByScope(rawData.purchases, "billDate", filters.purTable)
      .sort((a, b) => new Date(b.billDate || b.BillDate) - new Date(a.billDate || a.BillDate))
      .slice(0, 6);

    return {
      kpiData,
      charts: { revVsPurData: revVsPurChart, salesByCategory: catChart },
      tables: { recentInvoices: tblInv, recentPayments: tblPay, recentPurchases: tblPur },
    };
  }, [rawData, filters, filterDataByScope]);

  // Status computation helper
  const getInvStatus = useCallback(
    (inv) => {
      const paid = rawData.invoicePayments
        .filter((p) => (p.invoiceMasterId || p.InvoiceMasterId) === (inv.id || inv.Id))
        .reduce((s, p) => s + (Number(p.amount || p.Amount) || 0), 0);
      const total = Number(inv.total || inv.Total) || 0;
      if (paid >= total && total > 0) return "Paid";
      if (paid > 0) return "Partial";
      return "Pending";
    },
    [rawData.invoicePayments],
  );

  // Tooltips
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <TooltipWrapper>
          <div className="label">{label}</div>
          {payload.map((entry, idx) => (
            <div key={idx} className="item">
              <span
                style={{ width: 10, height: 10, borderRadius: "50%", background: entry.color || entry.payload.fill }}
              ></span>
              <span style={{ color: "var(--text-muted)" }}>{entry.name}:</span>
              <span className="val">₹{Number(entry.value).toLocaleString("en-IN")}</span>
            </div>
          ))}
        </TooltipWrapper>
      );
    }
    return null;
  };

  const DonutTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <TooltipWrapper>
          <div className="label">{payload[0].name}</div>
          <div className="item">
            <span
              style={{ width: 10, height: 10, borderRadius: "50%", background: payload[0].payload.fill || payload[0].payload.color }}
            ></span>
            <span className="val">₹{Number(payload[0].value).toLocaleString("en-IN")}</span>
          </div>
        </TooltipWrapper>
      );
    }
    return null;
  };

  return (
    <>
      <GlobalLoader isLoading={loading} />
      <PageTransition>
        <PageWrapper>
          <HeaderSection>
            <div className="title-area">
              <motion.h1
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                Staff Dashboard
              </motion.h1>
              <p>Welcome back, here is your system overview.</p>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <div className="datetime-area">
                <Clock size={14} />
                {currentTime.toLocaleDateString("en-IN", {
                  weekday: "short", day: "numeric", month: "short",
                })}{" "}
                •{" "}
                {currentTime.toLocaleTimeString("en-IN", {
                  hour: "2-digit", minute: "2-digit", second: "2-digit",
                })}
              </div>
              <PremiumBtn
                onClick={() => fetchAllData(true)}
                disabled={loading || refreshing}
              >
                <RotatingRefreshIcon size={14} $loading={refreshing} />{" "}
                {refreshing ? "Syncing..." : "Sync Data"}
              </PremiumBtn>
            </div>
          </HeaderSection>
           {activeFy ? (
            <FyBadge>
              <Calendar size={12} /> Active Financial Year: {activeFy.yearName}
            </FyBadge>
          ) : (
            !loading && (
              <FyBadge
                style={{
                  color: "#ef4444",
                  borderColor: "#ef4444",
                  background: "rgba(239,68,68,0.1)",
                }}
              >
                <AlertCircle size={12} /> No Active Financial Year Found
              </FyBadge>
            )
          )}

          {/* QUICK ACTIONS SECTION */}
          <QuickActionsContainer
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <h4
              style={{
                margin: "0 0 10px 0",
                fontSize: "13px",
                fontWeight: 800,
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Activity size={14} color="var(--primary)" /> Quick Actions
            </h4>
            <QuickActionsGrid>
              <QuickActionBtn
                onClick={() => navigate("/staff/invoice")}
                whileTap={{ scale: 0.96 }}
                $gradient="linear-gradient(135deg, #3b82f6, #2563eb)"
                $shadowColor="rgba(59, 130, 246, 0.3)"
                $hoverBorder="rgba(59, 130, 246, 0.5)"
              >
                <div className="icon-wrap"><PlusCircle size={18} /></div>
                <span>Create Invoice</span>
              </QuickActionBtn>

              <QuickActionBtn
                onClick={() => navigate("/staff/customer")}
                whileTap={{ scale: 0.96 }}
                $gradient="linear-gradient(135deg, #06b6d4, #0891b2)"
                $shadowColor="rgba(6, 182, 212, 0.3)"
                $hoverBorder="rgba(6, 182, 212, 0.5)"
              >
                <div className="icon-wrap"><Users size={18} /></div>
                <span>Customers</span>
              </QuickActionBtn>

              <QuickActionBtn
                onClick={() => navigate("/staff/myinvoices")}
                whileTap={{ scale: 0.96 }}
                $gradient="linear-gradient(135deg, #8b5cf6, #7c3aed)"
                $shadowColor="rgba(139, 92, 246, 0.3)"
                $hoverBorder="rgba(139, 92, 246, 0.5)"
              >
                <div className="icon-wrap"><FileBox size={18} /></div>
                <span>My Invoices</span>
              </QuickActionBtn>

              <QuickActionBtn
                onClick={() => navigate("/staff/payments")}
                whileTap={{ scale: 0.96 }}
                $gradient="linear-gradient(135deg, #10b981, #059669)"
                $shadowColor="rgba(16, 185, 129, 0.3)"
                $hoverBorder="rgba(16, 185, 129, 0.5)"
              >
                <div className="icon-wrap"><Wallet size={18} /></div>
                <span>Payments</span>
              </QuickActionBtn>

              <QuickActionBtn
                onClick={() => navigate("/staff/products")}
                whileTap={{ scale: 0.96 }}
                $gradient="linear-gradient(135deg, #f59e0b, #d97706)"
                $shadowColor="rgba(245, 158, 11, 0.3)"
                $hoverBorder="rgba(245, 158, 11, 0.5)"
              >
                <div className="icon-wrap"><Package size={18} /></div>
                <span>Products</span>
              </QuickActionBtn>
            </QuickActionsGrid>
          </QuickActionsContainer>

         

          {error && !loading ? (
            <ErrorCard>
              <AlertCircle size={40} style={{ margin: "0 auto" }} />
              <h3>Data Sync Failed</h3>
              <p>{error}</p>
              <PremiumBtn
                onClick={() => fetchAllData()}
                style={{ margin: "0 auto" }}
              >
                Retry Connection
              </PremiumBtn>
            </ErrorCard>
          ) : (
            dashData && (
              <AnimatePresence mode="wait">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  key="dashboard-content"
                >
                  {/* KPI Section */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "12px" }}>
                    <SectionTitle style={{ margin: 0 }}>
                      <Activity size={16} /> Key Metrics
                    </SectionTitle>
                    <SectionFilter
                      activeFilter={filters.kpis}
                      onChange={(v) => updateFilter("kpis", v)}
                    />
                  </div>

                  <StatsGrid>
                    <KpiCard
                      $color="#3b82f6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 }}
                    >
                      <div className="glow-bg" />
                      <div className="kpi-header">
                        <div className="kpi-title">Total Revenue</div>
                        <div className="icon-box"><DollarSign size={18} /></div>
                      </div>
                      <div className="kpi-value">
                        <CountUp end={dashData.kpiData.totalRev} duration={1.5} prefix="₹" separator="," decimals={2} />
                      </div>
                      <div className="kpi-trend">Invoiced Sales</div>
                    </KpiCard>

                    <KpiCard
                      $color="#f59e0b"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <div className="glow-bg" />
                      <div className="kpi-header">
                        <div className="kpi-title">Total Purchases</div>
                        <div className="icon-box"><ShoppingCart size={18} /></div>
                      </div>
                      <div className="kpi-value">
                        <CountUp end={dashData.kpiData.totalPur} duration={1.5} prefix="₹" separator="," decimals={2} />
                      </div>
                      <div className="kpi-trend">Procurement</div>
                    </KpiCard>

                    <KpiCard
                      $color={dashData.kpiData.netProfit >= 0 ? "#10b981" : "#ef4444"}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <div className="glow-bg" />
                      <div className="kpi-header">
                        <div className="kpi-title">Net Profit</div>
                        <div className="icon-box"><TrendingUp size={18} /></div>
                      </div>
                      <div className="kpi-value">
                        <CountUp end={dashData.kpiData.netProfit} duration={1.5} prefix="₹" separator="," decimals={2} />
                      </div>
                      <div
                        className="kpi-trend"
                        style={{ color: dashData.kpiData.netProfit >= 0 ? "#10b981" : "#ef4444" }}
                      >
                        {dashData.kpiData.profitMargin}% Margin
                      </div>
                    </KpiCard>

                    <KpiCard
                      $color="#ef4444"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="glow-bg" />
                      <div className="kpi-header">
                        <div className="kpi-title">Outstanding</div>
                        <div className="icon-box"><AlertCircle size={18} /></div>
                      </div>
                      <div className="kpi-value">
                        <CountUp end={dashData.kpiData.outstanding} duration={1.5} prefix="₹" separator="," decimals={2} />
                      </div>
                      <div className="kpi-trend">Pending Dues</div>
                    </KpiCard>

                    <KpiCard
                      $color="#10b981"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <div className="glow-bg" />
                      <div className="kpi-header">
                        <div className="kpi-title">Stock In</div>
                        <div className="icon-box"><ArrowDownToLine size={18} /></div>
                      </div>
                      <div className="kpi-value">
                        <CountUp end={dashData.kpiData.stockIn} duration={1.5} separator="," />
                      </div>
                      <div className="kpi-trend">Units Received</div>
                    </KpiCard>

                    <KpiCard
                      $color="#8b5cf6"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <div className="glow-bg" />
                      <div className="kpi-header">
                        <div className="kpi-title">Stock Out</div>
                        <div className="icon-box"><ArrowUpFromLine size={18} /></div>
                      </div>
                      <div className="kpi-value">
                        <CountUp end={dashData.kpiData.stockOut} duration={1.5} separator="," />
                      </div>
                      <div className="kpi-trend">Units Dispatched</div>
                    </KpiCard>

                    <KpiCard
                      $color={dashData.kpiData.lowStock > 0 ? "#ef4444" : "#10b981"}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      <div className="glow-bg" />
                      <div className="kpi-header">
                        <div className="kpi-title">Low Stock Alert</div>
                        <div className="icon-box"><AlertTriangle size={18} /></div>
                      </div>
                      <div className="kpi-value">
                        <CountUp end={dashData.kpiData.lowStock} duration={1.5} />
                      </div>
                      <div className="kpi-trend">Items Below Threshold</div>
                    </KpiCard>

                    <KpiCard
                      $color="#06b6d4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <div className="glow-bg" />
                      <div className="kpi-header">
                        <div className="kpi-title">Total Entities</div>
                        <div className="icon-box"><Users size={18} /></div>
                      </div>
                      <div className="kpi-value">
                        <CountUp end={dashData.kpiData.totalEntities} duration={1.5} separator="," />
                      </div>
                      <div className="kpi-trend">Clients & Vendors</div>
                    </KpiCard>
                  </StatsGrid>

                  {/* CHARTS SECTION */}
                  <ChartsGrid>
                    <ChartCard>
                      <div className="chart-header">
                        <div>
                          <div className="chart-title">Revenue vs Purchase Trend</div>
                          <div className="chart-sub">Cash flow comparison over period</div>
                        </div>
                        <SectionFilter
                          activeFilter={filters.revChart}
                          onChange={(v) => updateFilter("revChart", v)}
                        />
                      </div>

                      <div className="chart-body">
                        {dashData.charts.revVsPurData &&
                        dashData.charts.revVsPurData.every((d) => d.Revenue === 0 && d.Purchase === 0) ? (
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <PremiumEmptyState title="No Financial Data" subtitle="No transactions found for this period." />
                          </div>
                        ) : dashData.charts.revVsPurData ? (
                          <ResponsiveContainer width="100%" height={240}>
                            <AreaChart data={dashData.charts.revVsPurData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorPur" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-custom)" />
                              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: "var(--text-muted)", fontSize: 11 }} tickFormatter={(val) => `₹${val >= 1000 ? val / 1000 + "k" : val}`} />
                              <RechartsTooltip content={<CustomTooltip />} />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: "10px" }} />
                              <Area type="monotone" dataKey="Revenue" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                              <Area type="monotone" dataKey="Purchase" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorPur)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : null}
                      </div>
                    </ChartCard>

                    <ChartCard>
                      <div className="chart-header">
                        <div>
                          <div className="chart-title">Sales by Category</div>
                          <div className="chart-sub">Revenue distribution by product groups</div>
                        </div>
                        <SectionFilter
                          activeFilter={filters.catChart}
                          onChange={(v) => updateFilter("catChart", v)}
                        />
                      </div>

                      <div className="chart-body">
                        {dashData.charts.salesByCategory.length === 0 ? (
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <PremiumEmptyState title="No Sales Data" subtitle="Generate invoices to view distribution." />
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height={240}>
                            <PieChart>
                              <Pie
                                data={dashData.charts.salesByCategory}
                                cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4}
                                dataKey="value" nameKey="name"
                              >
                                {dashData.charts.salesByCategory.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                                ))}
                              </Pie>
                              <RechartsTooltip content={<DonutTooltip />} />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </ChartCard>
                  </ChartsGrid>

                  {/* TABLES SECTION */}
                  <TableGrid>
                    {/* Recent Invoices */}
                    <TableWrapper>
                      <div className="table-header-area">
                        <div className="table-title">
                          <FileText size={16} color="#3b82f6" /> Recent Invoices
                        </div>
                        <SectionFilter
                          activeFilter={filters.invTable}
                          onChange={(v) => updateFilter("invTable", v)}
                        />
                      </div>

                      {dashData.tables.recentInvoices.length === 0 ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                          <PremiumEmptyState title="No Invoices" subtitle="No recent billing activity." />
                        </div>
                      ) : (
                        <div className="table-responsive custom-scrollbar">
                          <table>
                            <thead>
                              <tr>
                                <th>Inv No</th>
                                <th>Client</th>
                                <th>Amount</th>
                                <th>Status</th>
                                <th style={{ textAlign: "center" }}>View</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashData.tables.recentInvoices.map((inv, idx) => {
                                const status = getInvStatus(inv);
                                return (
                                  <tr key={idx}>
                                    <td>
                                      <span style={{ color: "var(--primary)", fontWeight: 800 }}>
                                        {inv.invoiceNo || inv.InvoiceNo}
                                      </span>
                                    </td>
                                    <td>
                                      {inv.clientName || inv.ClientName || "-"}
                                    </td>
                                    <td style={{ fontWeight: 800 }}>
                                      ₹{Number(inv.total || inv.Total).toLocaleString()}
                                    </td>
                                    <td>
                                      <StatusBadge $status={status}>{status}</StatusBadge>
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <ActionBtn
                                        onClick={() =>
                                          navigate("/staff/invoicepreview", {
                                            state: { id: inv.id || inv.Id },
                                          })
                                        }
                                      >
                                        <Eye size={12} />
                                      </ActionBtn>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </TableWrapper>

                    {/* Recent Payments */}
                    <TableWrapper>
                      <div className="table-header-area">
                        <div className="table-title">
                          <Wallet size={16} color="#10b981" /> Recent Payments
                        </div>
                        <SectionFilter
                          activeFilter={filters.payTable}
                          onChange={(v) => updateFilter("payTable", v)}
                        />
                      </div>

                      {dashData.tables.recentPayments.length === 0 ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                          <PremiumEmptyState title="No Payments" subtitle="No recent collections recorded." />
                        </div>
                      ) : (
                        <div className="table-responsive custom-scrollbar">
                          <table>
                            <thead>
                              <tr>
                                <th>Invoice</th>
                                <th>Date</th>
                                <th>Method/Ref</th>
                                <th>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashData.tables.recentPayments.map((p, idx) => (
                                <tr key={idx}>
                                  <td>
                                    <span style={{ color: "var(--primary)", fontWeight: 800 }}>
                                      {p.InvoiceNo || p.invoiceNo || "-"}
                                    </span>
                                  </td>
                                  <td>
                                    {new Date(p.paymentDate || p.PaymentDate).toLocaleDateString("en-IN", {
                                      day: "numeric", month: "short",
                                    })}
                                  </td>
                                  <td>
                                    {p.referenceNo || p.ReferenceNo || "Cash/Direct"}
                                  </td>
                                  <td>
                                    <span style={{ color: "#10b981", fontWeight: 800 }}>
                                      +₹{Number(p.amount || p.Amount).toLocaleString()}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </TableWrapper>

                    {/* Recent Purchases */}
                    <TableWrapper style={{ gridColumn: "1 / -1" }}>
                      <div className="table-header-area">
                        <div className="table-title">
                          <ShoppingCart size={16} color="#f59e0b" /> Recent Purchases
                        </div>
                        <SectionFilter
                          activeFilter={filters.purTable}
                          onChange={(v) => updateFilter("purTable", v)}
                        />
                      </div>

                      {dashData.tables.recentPurchases.length === 0 ? (
                        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
                          <PremiumEmptyState title="No Purchases" subtitle="No recent procurement activity." />
                        </div>
                      ) : (
                        <div className="table-responsive custom-scrollbar">
                          <table>
                            <thead>
                              <tr>
                                <th>Bill No</th>
                                <th>Vendor</th>
                                <th>Date</th>
                                <th>Amount</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dashData.tables.recentPurchases.map((p, idx) => (
                                <tr key={idx}>
                                  <td>
                                    <span style={{ color: "var(--primary)", fontWeight: 800 }}>
                                      {p.billNo || p.BillNo}
                                    </span>
                                  </td>
                                  <td>{p.Vendor || p.vendor || "-"}</td>
                                  <td>
                                    {new Date(p.billDate || p.BillDate).toLocaleDateString("en-IN", {
                                      day: "numeric", month: "short",
                                    })}
                                  </td>
                                  <td>
                                    <span style={{ color: "#ef4444", fontWeight: 800 }}>
                                      -₹{Number(p.total || p.Total).toLocaleString()}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </TableWrapper>
                  </TableGrid>
                </motion.div>
              </AnimatePresence>
            )
          )}
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--border-custom); border-radius: 10px; }
          `}</style>
        </PageWrapper>
      </PageTransition>
    </>
  );
}