/**
 * SalesReport.jsx — Enhanced Enterprise Sales Analytics
 * Upgraded to match premium PurchaseReport UI/UX, feature set, and architecture.
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import html2pdf from "html2pdf.js";
import { Link } from "react-router-dom";

import {
  AreaChart,
  Area,
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
  ReferenceLine,
} from "recharts";

import {
  Wallet,
  Users,
  Building2,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  CheckCircle,
  Activity,
  FileText,
  Download,
  Filter,
  RotateCcw,
  X,
  Calendar,
  ArrowDownLeft,
  ChevronDown,
  RefreshCcw,
  FileDown,
  Maximize2,
  List,
  LayoutDashboard,
  LineChart as LineChartIcon,
  Lightbulb,
  BarChart2,
  Percent,
  DollarSign,
  Zap,
} from "lucide-react";

import { getRequest } from "../../../Services/axiosService.jsx";
import { errorAlert, successAlert } from "../../../Services/sweetAlert.jsx";

import GlobalLoader from "../../components/common/GlobalLoader.jsx";
import PageTransition from "../../components/common/PageTransition.jsx";
import PremiumEmptyState from "../../components/common/PremiumEmptyState.jsx";
import { SkeletonTableRows } from "../../components/common/SkeletonLoader.jsx";

/* ─────────────────────────────────────────────
   ANIMATED NUMBER
───────────────────────────────────────────── */
const AnimatedNumber = ({ value, isCurrency = false }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }
    const increment = end / (1000 / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  const formatted = Math.ceil(count).toLocaleString("en-IN");
  return <>{isCurrency ? `₹ ${formatted}` : formatted}</>;
};

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const CHART_COLORS = [
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
];

const tooltipStyle = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border-custom)",
    borderRadius: "10px",
    fontSize: "12px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
    padding: "10px 14px",
  },
  itemStyle: { color: "var(--primary)", fontWeight: "700" },
};

const fmt = (val) => `₹${(val / 1000).toFixed(0)}k`;
const fmtFull = (value) => [`₹ ${value.toLocaleString("en-IN")}`, "Revenue"];

/* ─────────────────────────────────────────────
   CUSTOM PIE LABEL
───────────────────────────────────────────── */
const renderPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + (radius + 28) * Math.cos(-midAngle * RADIAN);
  const y = cy + (radius + 28) * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="var(--text-muted)"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={10}
      fontWeight={600}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function SalesReport() {
  /* ── STATE ── */
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);

  const [initialLoad, setInitialLoad] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [fullscreenChart, setFullscreenChart] = useState(null);

  /* ── FILTERS ── */
  const [selectedFyId, setSelectedFyId] = useState("");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const reportRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  /* ══════════════════ API LOGIC ══════════════════ */
  const fetchInitialData = async () => {
    setInitialLoad(true);
    try {
      const fyRes = await getRequest("FinancialYear/List");
      let activeFyId = "";
      if (fyRes?.status === "OK" && Array.isArray(fyRes.result)) {
        setFinancialYears(fyRes.result);
        const activeFy =
          fyRes.result.find((y) => y.isActive && !y.isDelete) ||
          fyRes.result[0];
        if (activeFy) {
          activeFyId = activeFy.id || activeFy.Id;
          setSelectedFyId(activeFyId);
        }
      }
      const [clientsRes, invoicesRes] = await Promise.all([
        getRequest("ClientMaster/List"),
        getRequest("InvoiceMaster/ListInvoice"),
      ]);
      if (clientsRes?.status === "OK" && Array.isArray(clientsRes.result))
        setClients(clientsRes.result);
      if (invoicesRes?.status === "OK" && Array.isArray(invoicesRes.result))
        setInvoices(invoicesRes.result);
    } catch (err) {
      console.error("Report Data Error:", err);
      errorAlert("Error", "Failed to load report data");
    } finally {
      setTimeout(() => setInitialLoad(false), 800);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const invoicesRes = await getRequest("InvoiceMaster/ListInvoice");
      if (invoicesRes?.status === "OK" && Array.isArray(invoicesRes.result)) {
        setInvoices(invoicesRes.result);
        successAlert("Synced", "Latest data loaded");
      }
    } catch {
      errorAlert("Error", "Failed to sync data");
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  /* ── FILTER HANDLERS ── */
  const handleQuickFilter = (type) => {
    setQuickFilter(type);
    const today = new Date();
    const fmtDt = (d) => {
      const nd = new Date(d);
      return `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}-${String(nd.getDate()).padStart(2, "0")}`;
    };
    if (type === "today") {
      setFromDate(fmtDt(today));
      setToDate(fmtDt(today));
    } else if (type === "month") {
      setFromDate(fmtDt(new Date(today.getFullYear(), today.getMonth(), 1)));
      setToDate(fmtDt(today));
    } else if (type === "year") {
      setFromDate(fmtDt(new Date(today.getFullYear(), 0, 1)));
      setToDate(fmtDt(today));
    } else {
      setFromDate("");
      setToDate("");
    }
  };

  const handleDateChange = (type, val) => {
    setQuickFilter("custom");
    if (type === "from") setFromDate(val);
    if (type === "to") setToDate(val);
  };

  const resetFilters = () => {
    setSelectedClientId("");
    setFromDate("");
    setToDate("");
    setMinAmount("");
    setMaxAmount("");
    setStatusFilter("all");
    setQuickFilter("all");
    const activeFy = financialYears.find(
      (y) => (y.isActive || y.IsActive) && !(y.isDelete || y.IsDelete),
    );
    if (activeFy) setSelectedFyId(activeFy.id || activeFy.Id);
  };

  /* ── DATA NORMALIZATION ── */
  const activeFyObj = useMemo(
    () =>
      financialYears.find(
        (fy) => (fy.id || fy.Id)?.toString() === selectedFyId?.toString(),
      ),
    [financialYears, selectedFyId],
  );

  const clientMap = useMemo(() => {
    const map = {};
    clients.forEach((c) => {
      const cId = c.id || c.Id;
      map[cId] =
        c.businessName ||
        c.BusinessName ||
        c.clientName ||
        c.ClientName ||
        `Client #${cId}`;
    });
    return map;
  }, [clients]);

  const normalizedData = useMemo(() => {
    return invoices.map((inv) => {
      const rawDate =
        inv.invoiceDate || inv.InvoiceDate || inv.createdAt || inv.CreatedAt;
      const date = rawDate ? new Date(rawDate) : new Date();
      const amount = parseFloat(
        inv.total ||
          inv.Total ||
          inv.totalAmount ||
          inv.TotalAmount ||
          inv.grandTotal ||
          inv.GrandTotal ||
          inv.netAmount ||
          inv.NetAmount ||
          0,
      );
      const paid = parseFloat(inv.paidAmount || inv.PaidAmount || 0);
      const pending = parseFloat(inv.pendingAmount || inv.PendingAmount || 0);
      const gstAmt = parseFloat(inv.gstAmount || inv.GstAmount || 0);
      const cIdRaw =
        inv.clientId ||
        inv.ClientId ||
        inv.clientMasterId ||
        inv.ClientMasterId ||
        inv.client?.id ||
        inv.client?.Id ||
        "";
      const cId = String(cIdRaw).trim();
      const clientName =
        clientMap[cId] ||
        inv.client?.businessName ||
        inv.client?.BusinessName ||
        inv.clientName ||
        inv.ClientName ||
        "Unknown Client";
      return {
        ...inv,
        normalizedDate: date,
        normalizedAmount: amount,
        normalizedPaid: paid,
        normalizedPending: pending,
        normalizedGst: gstAmt,
        normalizedClientId: cId.toString(),
        normalizedClientName: clientName,
      };
    });
  }, [invoices, clientMap]);

  const filteredData = useMemo(() => {
    let result = [...normalizedData];
    if (activeFyObj) {
      const fyStart = new Date(activeFyObj.startDate || activeFyObj.StartDate);
      const fyEnd = new Date(activeFyObj.endDate || activeFyObj.EndDate);
      fyStart.setHours(0, 0, 0, 0);
      fyEnd.setHours(23, 59, 59, 999);
      result = result.filter(
        (inv) => inv.normalizedDate >= fyStart && inv.normalizedDate <= fyEnd,
      );
    }
    if (fromDate) {
      const f = new Date(fromDate);
      f.setHours(0, 0, 0, 0);
      result = result.filter((inv) => inv.normalizedDate >= f);
    }
    if (toDate) {
      const t = new Date(toDate);
      t.setHours(23, 59, 59, 999);
      result = result.filter((inv) => inv.normalizedDate <= t);
    }
    if (selectedClientId)
      result = result.filter(
        (inv) =>
          String(inv.normalizedClientId).trim() ===
          String(selectedClientId).trim(),
      );
    if (minAmount)
      result = result.filter(
        (inv) => inv.normalizedAmount >= Number(minAmount),
      );
    if (maxAmount)
      result = result.filter(
        (inv) => inv.normalizedAmount <= Number(maxAmount),
      );
    if (statusFilter !== "all")
      result = result.filter(
        (inv) =>
          (inv.status || inv.Status || "").toLowerCase() ===
          statusFilter.toLowerCase(),
      );
    result.sort((a, b) => b.normalizedDate - a.normalizedDate);
    return result;
  }, [
    normalizedData,
    activeFyObj,
    fromDate,
    toDate,
    selectedClientId,
    minAmount,
    maxAmount,
    statusFilter,
  ]);

  /* ── KPIs ── */
  const kpis = useMemo(() => {
    let total = 0,
      paid = 0,
      pending = 0,
      gst = 0,
      highest = 0;
    let currentMonthTotal = 0,
      prevMonthTotal = 0;
    const uniqueClients = new Set();
    const now = new Date();
    const cm = now.getMonth(),
      cy = now.getFullYear();
    const pm = cm === 0 ? 11 : cm - 1,
      py = cm === 0 ? cy - 1 : cy;

    filteredData.forEach((inv) => {
      const amt = inv.normalizedAmount;
      total += amt;
      paid += inv.normalizedPaid;
      pending += inv.normalizedPending;
      gst += inv.normalizedGst;
      if (amt > highest) highest = amt;
      if (inv.normalizedClientId !== "Unknown")
        uniqueClients.add(inv.normalizedClientId);
      const d = inv.normalizedDate;
      if (d.getMonth() === cm && d.getFullYear() === cy)
        currentMonthTotal += amt;
      else if (d.getMonth() === pm && d.getFullYear() === py)
        prevMonthTotal += amt;
    });
    const growth =
      prevMonthTotal === 0
        ? 100
        : ((currentMonthTotal - prevMonthTotal) / prevMonthTotal) * 100;
    return {
      total,
      paid,
      pending,
      gst,
      highest,
      count: filteredData.length,
      avg: filteredData.length ? total / filteredData.length : 0,
      uniqueClientsCount: uniqueClients.size,
      growth,
      currentMonthTotal,
    };
  }, [filteredData]);

  /* ── CHART AGGREGATIONS ── */
  const { barChartData, pieChartData, lineChartData, tableData } =
    useMemo(() => {
      const clientAgg = {},
        monthAgg = {};
      filteredData.forEach((inv) => {
        const amt = inv.normalizedAmount,
          cId = inv.normalizedClientId,
          date = inv.normalizedDate;
        if (!clientAgg[cId])
          clientAgg[cId] = {
            id: cId,
            name: inv.normalizedClientName,
            amount: 0,
            count: 0,
            lastDate: date,
          };
        clientAgg[cId].amount += amt;
        clientAgg[cId].count += 1;
        if (date > new Date(clientAgg[cId].lastDate))
          clientAgg[cId].lastDate = date;
        const mk = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const ml = date.toLocaleString("default", {
          month: "short",
          year: "2-digit",
        });
        if (!monthAgg[mk]) monthAgg[mk] = { sortKey: mk, month: ml, amount: 0 };
        monthAgg[mk].amount += amt;
      });
      const tData = Object.values(clientAgg)
        .map((c) => ({
          ...c,
          avgOrderValue: c.count > 0 ? c.amount / c.count : 0,
        }))
        .sort((a, b) => b.amount - a.amount);
      const bData = tData.slice(0, 8);
      const pData = tData
        .slice(0, 5)
        .map((c) => ({ name: c.name, value: c.amount }));
      if (tData.length > 5) {
        const oa = tData.slice(5).reduce((s, c) => s + c.amount, 0);
        if (oa > 0) pData.push({ name: "Others", value: oa });
      }
      const lData = Object.values(monthAgg).sort((a, b) =>
        a.sortKey.localeCompare(b.sortKey),
      );
      return {
        barChartData: bData,
        pieChartData: pData,
        lineChartData: lData,
        tableData: tData,
      };
    }, [filteredData]);

  /* ── PAYMENT STATUS PIE DATA ── */
  const paymentStatusData = [
    { name: "Received", value: kpis.paid },
    { name: "Pending", value: kpis.pending },
  ];

  /* ── AVERAGE REFERENCE LINE for trend chart ── */
  const avgMonthlyRevenue = useMemo(() => {
    if (!lineChartData.length) return 0;
    return (
      lineChartData.reduce((s, d) => s + d.amount, 0) / lineChartData.length
    );
  }, [lineChartData]);

  /* ── ADVANCED ANALYTICS WIDGETS ── */
  const advancedWidgets = useMemo(() => {
    if (!filteredData.length) return [];
    const topClient = tableData[0] || null;
    const pendingPct = kpis.total ? (kpis.pending / kpis.total) * 100 : 0;
    const paidPct = kpis.total ? (kpis.paid / kpis.total) * 100 : 0;
    const peakMonth = lineChartData.length
      ? lineChartData.reduce((a, b) => (b.amount > a.amount ? b : a))
      : null;
    return [
      topClient && {
        icon: Award,
        color: "#f59e0b",
        label: "Top Client",
        value:
          topClient.name.length > 18
            ? topClient.name.slice(0, 16) + "…"
            : topClient.name,
        sub: `₹${topClient.amount.toLocaleString("en-IN")} · ${((topClient.amount / kpis.total) * 100).toFixed(0)}% share`,
      },
      {
        icon: Percent,
        color: "#10b981",
        label: "Collection Efficiency",
        value: `${paidPct.toFixed(0)}%`,
        sub: `₹${kpis.paid.toLocaleString("en-IN")} received`,
      },
      peakMonth && {
        icon: Zap,
        color: "#8b5cf6",
        label: "Peak Month",
        value: peakMonth.month,
        sub: `₹${peakMonth.amount.toLocaleString("en-IN")} revenue`,
      },
      {
        icon: DollarSign,
        color: "#06b6d4",
        label: "Avg Monthly Revenue",
        value: `₹${Math.round(avgMonthlyRevenue).toLocaleString("en-IN")}`,
        sub: `over ${lineChartData.length} month${lineChartData.length !== 1 ? "s" : ""}`,
      },
    ].filter(Boolean);
  }, [filteredData, tableData, kpis, lineChartData, avgMonthlyRevenue]);

  /* ── SMART INSIGHTS ── */
  const smartInsights = useMemo(() => {
    if (!filteredData.length) return [];
    const insights = [];
    if (kpis.growth > 0)
      insights.push({
        icon: TrendingUp,
        color: "#10b981",
        title: "Revenue Growth",
        text: `Sales increased by ${kpis.growth.toFixed(1)}% compared to last month.`,
      });
    else if (kpis.growth < 0)
      insights.push({
        icon: TrendingDown,
        color: "#ef4444",
        title: "Revenue Decline",
        text: `Sales decreased by ${Math.abs(kpis.growth).toFixed(1)}% compared to last month.`,
      });
    if (tableData.length > 0) {
      const top = tableData[0];
      insights.push({
        icon: Award,
        color: "#f59e0b",
        title: "Top Client Insight",
        text: `${top.name} is your highest-value client, generating ₹${top.amount.toLocaleString("en-IN")} (${((top.amount / kpis.total) * 100).toFixed(1)}% of total revenue).`,
      });
    }
    const pendingPct = kpis.total
      ? ((kpis.pending / kpis.total) * 100).toFixed(1)
      : 0;
    if (pendingPct > 20)
      insights.push({
        icon: AlertTriangle,
        color: "#ef4444",
        title: "High Pending Receivables",
        text: `Outstanding invoices amount to ₹${kpis.pending.toLocaleString("en-IN")} (${pendingPct}% of revenue). Immediate collection follow-up recommended.`,
      });
    else
      insights.push({
        icon: CheckCircle,
        color: "#10b981",
        title: "Healthy Collections",
        text: `Pending receivables are low at ${pendingPct}%. Strong cash flow recovery.`,
      });
    insights.push({
      icon: Activity,
      color: "#8b5cf6",
      title: "Average Invoice Value",
      text: `Enterprise average invoice value stands at ₹${kpis.avg.toLocaleString("en-IN")}.`,
    });
    if (kpis.gst > 0)
      insights.push({
        icon: FileText,
        color: "#06b6d4",
        title: "GST Collection",
        text: `Total GST accrued this period is ₹${kpis.gst.toLocaleString("en-IN")} — approx ${kpis.total ? ((kpis.gst / kpis.total) * 100).toFixed(1) : 0}% of gross.`,
      });
    if (tableData.length > 1) {
      const concentration = (tableData[0].amount / kpis.total) * 100;
      if (concentration > 50)
        insights.push({
          icon: AlertTriangle,
          color: "#f59e0b",
          title: "Client Concentration Risk",
          text: `${tableData[0].name} accounts for ${concentration.toFixed(1)}% of total revenue. Consider diversifying client base.`,
        });
    }
    return insights;
  }, [filteredData, kpis, tableData]);

  /* ── EXPORTS ── */
  const handleExportCSV = () => {
    if (tableData.length === 0)
      return errorAlert("No Data", "No data to export");
    const headers = [
      "Client Name,Invoice Count,Total Revenue (INR),Avg Order Value (INR),Last Transaction Date",
    ];
    const rows = tableData.map(
      (r) =>
        `"${r.name.replace(/"/g, '""')}",${r.count},${r.amount.toFixed(2)},${r.avgOrderValue.toFixed(2)},"${new Date(r.lastDate).toLocaleDateString()}"`,
    );
    const csv = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csv));
    link.setAttribute(
      "download",
      `Enterprise_Sales_Report_${new Date().getTime()}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportMenuOpen(false);
    successAlert("Exported", "CSV downloaded successfully");
  };

  const handleExportPDF = () => {
    if (!reportRef.current) return;
    setExportMenuOpen(false);
    const element = reportRef.current;
    element.classList.add("pdf-export-mode");
    const fyName = activeFyObj
      ? activeFyObj.yearName || activeFyObj.YearName
      : "All Time";
    html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        filename: `Enterprise_Sales_Report_${fyName}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
      })
      .from(element)
      .save()
      .then(() => {
        element.classList.remove("pdf-export-mode");
        successAlert("Generated", "PDF Report saved successfully");
      });
  };

  const activeFiltersCount = [
    selectedClientId,
    fromDate,
    toDate,
    minAmount,
    maxAmount,
    statusFilter !== "all",
  ].filter(Boolean).length;

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <>
      <GlobalLoader isLoading={initialLoad} />
      <PageTransition>
        <PageShell>
          {/* ─── HEADER ─── */}
          <StickyHeader className="hide-on-print">
            <HeaderLeft>
              <ModuleIcon>
                <Wallet size={20} />
              </ModuleIcon>
              <HeaderText>
                <PageTitle>Sales Analytics</PageTitle>
                <Breadcrumb>
                  <BreadLink to="/admin/dashboard">Home</BreadLink>
                  <BreadSep>/</BreadSep>
                  <BreadLink to="#">Reports</BreadLink>
                  <BreadSep>/</BreadSep>
                  <BreadActive>Sales Analytics</BreadActive>
                </Breadcrumb>
              </HeaderText>
            </HeaderLeft>

            <HeaderRight>
              {activeFyObj && (
                <FyChip>
                  <Calendar size={11} />
                  {activeFyObj.yearName || activeFyObj.YearName}
                </FyChip>
              )}
              <SyncDot $active={isRefreshing}>
                <span className="dot" />
                <span className="lbl">{isRefreshing ? "Syncing" : "Live"}</span>
              </SyncDot>
              <HBtn
                variant="ghost"
                onClick={handleRefresh}
                disabled={loading || isRefreshing || initialLoad}
              >
                <RefreshCcw size={14} className={isRefreshing ? "spin" : ""} />
                {isRefreshing ? "Syncing…" : "Refresh"}
              </HBtn>
              <div style={{ position: "relative" }}>
                <HBtn
                  variant="primary"
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                >
                  <Download size={14} /> Export <ChevronDown size={13} />
                </HBtn>
                <AnimatePresence>
                  {exportMenuOpen && (
                    <DropMenu
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    >
                      <DropItem onClick={handleExportPDF}>
                        <FileText size={13} style={{ color: "#ef4444" }} />{" "}
                        Download PDF
                      </DropItem>
                      <DropItem onClick={handleExportCSV}>
                        <FileDown size={13} style={{ color: "#10b981" }} />{" "}
                        Download CSV
                      </DropItem>
                    </DropMenu>
                  )}
                </AnimatePresence>
              </div>
            </HeaderRight>
          </StickyHeader>

          {/* ─── TABS ─── */}
          <TabBar className="hide-on-print">
            {[
              { id: "overview", icon: LayoutDashboard, label: "Overview" },
              { id: "analytics", icon: LineChartIcon, label: "Deep Analytics" },
              { id: "ledger", icon: Building2, label: "Client Ledger" },
              { id: "transactions", icon: List, label: "Transactions" },
              { id: "insights", icon: Lightbulb, label: "Smart Insights" },
            ].map(({ id, icon: Icon, label }) => (
              <TabBtn
                key={id}
                $active={activeTab === id}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={14} /> {label}
              </TabBtn>
            ))}
          </TabBar>

          {/* ─── FILTER BAR ─── */}
          <FilterCard className="hide-on-print">
            {/* Quick pills */}
            <QuickRow>
              {[
                ["all", "All Time"],
                ["today", "Today"],
                ["month", "This Month"],
                ["year", "This Year"],
              ].map(([val, lbl]) => (
                <QPill
                  key={val}
                  $active={quickFilter === val}
                  onClick={() => handleQuickFilter(val)}
                >
                  {lbl}
                </QPill>
              ))}
              {activeFiltersCount > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Filter size={11} /> {activeFiltersCount} active
                </span>
              )}
            </QuickRow>

            {/* Main filter row */}
            <FilterRow>
              <FilterField $grow={2}>
                <Users size={13} className="fi" />
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">All Clients</option>
                  {clients.map((c) => (
                    <option key={c.id || c.Id} value={String(c.id || c.Id)}>
                      {c.businessName ||
                        c.BusinessName ||
                        c.clientName ||
                        c.ClientName}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField>
                <Filter size={13} className="fi" />
                <select
                  value={selectedFyId}
                  onChange={(e) => setSelectedFyId(e.target.value)}
                >
                  <option value="">All Financial Years</option>
                  {financialYears.map((fy) => (
                    <option key={fy.id || fy.Id} value={fy.id || fy.Id}>
                      {fy.yearName || fy.YearName}
                      {fy.isActive || fy.IsActive ? " ★" : ""}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField>
                <Activity size={13} className="fi" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                </select>
              </FilterField>

              <FilterField $date>
                <span className="lbl">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => handleDateChange("from", e.target.value)}
                />
              </FilterField>

              <FilterField $date>
                <span className="lbl">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => handleDateChange("to", e.target.value)}
                />
              </FilterField>

              <ResetBtn onClick={resetFilters}>
                <RotateCcw size={13} /> Reset
                {activeFiltersCount > 0 && (
                  <FBadge>{activeFiltersCount}</FBadge>
                )}
              </ResetBtn>
            </FilterRow>

            {/* Active filter chips */}
            {activeFiltersCount > 0 && (
              <ChipRow>
                {selectedClientId && (
                  <Chip>
                    <Users size={10} />
                    {clients.find(
                      (c) => String(c.id || c.Id) === String(selectedClientId),
                    )?.businessName || "Client"}
                    <button onClick={() => setSelectedClientId("")}>
                      <X size={10} />
                    </button>
                  </Chip>
                )}
                {fromDate && (
                  <Chip>
                    <Calendar size={10} /> From: {fromDate}
                    <button
                      onClick={() => {
                        setFromDate("");
                        setQuickFilter("custom");
                      }}
                    >
                      <X size={10} />
                    </button>
                  </Chip>
                )}
                {toDate && (
                  <Chip>
                    <Calendar size={10} /> To: {toDate}
                    <button
                      onClick={() => {
                        setToDate("");
                        setQuickFilter("custom");
                      }}
                    >
                      <X size={10} />
                    </button>
                  </Chip>
                )}
                {statusFilter !== "all" && (
                  <Chip $color="#8b5cf6">
                    <Activity size={10} /> {statusFilter}
                    <button onClick={() => setStatusFilter("all")}>
                      <X size={10} />
                    </button>
                  </Chip>
                )}
                {minAmount && (
                  <Chip $color="#10b981">
                    Min ₹{minAmount}
                    <button onClick={() => setMinAmount("")}>
                      <X size={10} />
                    </button>
                  </Chip>
                )}
                {maxAmount && (
                  <Chip $color="#10b981">
                    Max ₹{maxAmount}
                    <button onClick={() => setMaxAmount("")}>
                      <X size={10} />
                    </button>
                  </Chip>
                )}
              </ChipRow>
            )}
          </FilterCard>

          {/* ─── EXPORT TARGET ─── */}
          <div
            ref={reportRef}
            id="report-content-to-export"
            className="print-wrapper"
          >
            <PrintHeader className="show-on-print-only">
              <div className="ph-top">
                <div>
                  <h2>Enterprise Sales Report</h2>
                  <p>ERP Analytics Engine</p>
                </div>
                <Building2 size={26} color="#64748b" />
              </div>
              <div className="ph-meta">
                <span>Generated: {new Date().toLocaleString()}</span>
                {activeFyObj && (
                  <span>
                    FY: {activeFyObj.yearName || activeFyObj.YearName}
                  </span>
                )}
                {(fromDate || toDate) && (
                  <span>
                    Period: {fromDate || "Start"} → {toDate || "End"}
                  </span>
                )}
              </div>
            </PrintHeader>

            <AnimatePresence mode="wait">
              {/* ════════════ TAB: OVERVIEW ════════════ */}
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <KpiGrid>
                    {initialLoad ? (
                      [0, 1, 2, 3, 4].map((i) => <KpiSkel key={i} />)
                    ) : (
                      <>
                        <KpiCard $accent="#3b82f6">
                          <KpiIcon $c="#3b82f6">
                            <Wallet size={22} />
                          </KpiIcon>
                          <KpiBody>
                            <KpiLbl>Total Revenue</KpiLbl>
                            <KpiVal>
                              <AnimatedNumber value={kpis.total} isCurrency />
                            </KpiVal>
                            <KpiSub>
                              <ArrowDownLeft size={10} /> Gross incl. tax
                            </KpiSub>
                          </KpiBody>
                          <KpiGlow $c="#3b82f6" />
                        </KpiCard>
                        <KpiCard $accent="#10b981">
                          <KpiIcon $c="#10b981">
                            <CheckCircle size={22} />
                          </KpiIcon>
                          <KpiBody>
                            <KpiLbl>Amount Received</KpiLbl>
                            <KpiVal>
                              <AnimatedNumber value={kpis.paid} isCurrency />
                            </KpiVal>
                            <KpiSub>Collected from clients</KpiSub>
                          </KpiBody>
                          <KpiGlow $c="#10b981" />
                        </KpiCard>
                        <KpiCard $accent="#ef4444">
                          <KpiIcon $c="#ef4444">
                            <AlertTriangle size={22} />
                          </KpiIcon>
                          <KpiBody>
                            <KpiLbl>Pending Receivables</KpiLbl>
                            <KpiVal>
                              <AnimatedNumber value={kpis.pending} isCurrency />
                            </KpiVal>
                            <KpiSub style={{ color: "#ef4444" }}>
                              Outstanding payments
                            </KpiSub>
                          </KpiBody>
                          <KpiGlow $c="#ef4444" />
                        </KpiCard>
                        <KpiCard $accent="#f59e0b">
                          <KpiIcon $c="#f59e0b">
                            <Users size={22} />
                          </KpiIcon>
                          <KpiBody>
                            <KpiLbl>Active Clients</KpiLbl>
                            <KpiVal>
                              <AnimatedNumber value={kpis.uniqueClientsCount} />
                            </KpiVal>
                            <KpiSub>Transacting accounts</KpiSub>
                          </KpiBody>
                          <KpiGlow $c="#f59e0b" />
                        </KpiCard>
                        <KpiCard $accent="#8b5cf6">
                          <KpiIcon $c="#8b5cf6">
                            <FileText size={22} />
                          </KpiIcon>
                          <KpiBody>
                            <KpiLbl>Total Invoices</KpiLbl>
                            <KpiVal>
                              <AnimatedNumber value={kpis.count} />
                            </KpiVal>
                            <KpiSub>Invoices generated</KpiSub>
                          </KpiBody>
                          <KpiGlow $c="#8b5cf6" />
                        </KpiCard>
                        <KpiCard $accent="#06b6d4">
                          <KpiIcon $c="#06b6d4">
                            <Activity size={22} />
                          </KpiIcon>
                          <KpiBody>
                            <KpiLbl>Avg Invoice Value</KpiLbl>
                            <KpiVal>
                              <AnimatedNumber value={kpis.avg} isCurrency />
                            </KpiVal>
                            <KpiSub>Per invoice average</KpiSub>
                          </KpiBody>
                          <KpiGlow $c="#06b6d4" />
                        </KpiCard>
                        <KpiCard $accent="#ec4899">
                          <KpiIcon $c="#ec4899">
                            <Award size={22} />
                          </KpiIcon>
                          <KpiBody>
                            <KpiLbl>Highest Invoice</KpiLbl>
                            <KpiVal>
                              <AnimatedNumber value={kpis.highest} isCurrency />
                            </KpiVal>
                            <KpiSub>Max single sale</KpiSub>
                          </KpiBody>
                          <KpiGlow $c="#ec4899" />
                        </KpiCard>
                        <KpiCard $accent="#14b8a6">
                          <KpiIcon $c="#14b8a6">
                            <TrendingUp size={22} />
                          </KpiIcon>
                          <KpiBody>
                            <KpiLbl>This Month</KpiLbl>
                            <KpiVal>
                              <AnimatedNumber
                                value={kpis.currentMonthTotal}
                                isCurrency
                              />
                            </KpiVal>
                            <KpiSub
                              style={{
                                color: kpis.growth >= 0 ? "#10b981" : "#ef4444",
                              }}
                            >
                              {kpis.growth >= 0 ? "▲" : "▼"}{" "}
                              {Math.abs(kpis.growth).toFixed(1)}% vs last month
                            </KpiSub>
                          </KpiBody>
                          <KpiGlow $c="#14b8a6" />
                        </KpiCard>
                      </>
                    )}
                  </KpiGrid>
                </motion.div>
              )}

              {/* ════════════ TAB: DEEP ANALYTICS ════════════ */}
              {activeTab === "analytics" && (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  {/* Advanced Widgets Row */}
                  {!initialLoad && advancedWidgets.length > 0 && (
                    <WidgetGrid style={{ marginBottom: "20px" }}>
                      {advancedWidgets.map((w, i) => {
                        const Icon = w.icon;
                        return (
                          <WidgetCard key={i} $c={w.color}>
                            <WidgetIcon $c={w.color}>
                              <Icon size={18} />
                            </WidgetIcon>
                            <div>
                              <div
                                style={{
                                  fontSize: "10px",
                                  fontWeight: 700,
                                  color: "var(--text-muted)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                {w.label}
                              </div>
                              <div
                                style={{
                                  fontSize: "1.15rem",
                                  fontWeight: 800,
                                  color: "var(--text)",
                                  marginTop: "2px",
                                }}
                              >
                                {w.value}
                              </div>
                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "var(--text-muted)",
                                  marginTop: "2px",
                                }}
                              >
                                {w.sub}
                              </div>
                            </div>
                            <div
                              style={{
                                position: "absolute",
                                bottom: "-16px",
                                right: "-16px",
                                width: "64px",
                                height: "64px",
                                borderRadius: "50%",
                                background: `${w.color}0a`,
                                pointerEvents: "none",
                              }}
                            />
                          </WidgetCard>
                        );
                      })}
                    </WidgetGrid>
                  )}

                  {filteredData.length === 0 && !initialLoad ? (
                    <EmptyBox>
                      <PremiumEmptyState
                        icon={<BarChart2 size={40} strokeWidth={1.2} />}
                        title="No Chart Data"
                        subtitle="Adjust your filters to see analytics."
                      />
                    </EmptyBox>
                  ) : (
                    <ChartGrid>
                      {/* ── Monthly Trend (full width, taller) ── */}
                      <ChartCard className="span-12">
                        <div className="ch">
                          <ChartHeading>
                            <TrendingUp size={14} className="ic" /> Monthly
                            Revenue Trend
                          </ChartHeading>
                          <ExpandBtn onClick={() => setFullscreenChart("line")}>
                            <Maximize2 size={13} />
                          </ExpandBtn>
                        </div>
                        <div style={{ height: "340px" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                              data={lineChartData}
                              margin={{
                                top: 14,
                                right: 16,
                                left: -10,
                                bottom: 0,
                              }}
                            >
                              <defs>
                                <linearGradient
                                  id="areaGrad"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0.35}
                                  />
                                  <stop
                                    offset="90%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0.02}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--border-custom)"
                                opacity={0.25}
                                vertical={false}
                              />
                              <XAxis
                                dataKey="month"
                                stroke="var(--text-muted)"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                              />
                              <YAxis
                                stroke="var(--text-muted)"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={fmt}
                              />
                              <RechartsTooltip
                                {...tooltipStyle}
                                formatter={fmtFull}
                              />
                              {avgMonthlyRevenue > 0 && (
                                <ReferenceLine
                                  y={avgMonthlyRevenue}
                                  stroke="rgba(59,130,246,0.35)"
                                  strokeDasharray="6 4"
                                  label={{
                                    value: "Avg",
                                    position: "insideTopRight",
                                    fill: "rgba(59,130,246,0.6)",
                                    fontSize: 10,
                                  }}
                                />
                              )}
                              <Area
                                type="monotone"
                                dataKey="amount"
                                stroke="#3b82f6"
                                strokeWidth={2.5}
                                fill="url(#areaGrad)"
                                activeDot={{
                                  r: 6,
                                  strokeWidth: 0,
                                  fill: "#3b82f6",
                                }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </ChartCard>

                      {/* ── Top Client Bar (8/12) ── */}
                      <ChartCard className="span-8">
                        <div className="ch">
                          <ChartHeading>
                            <Building2 size={14} className="ic" /> Top Client
                            Revenue
                          </ChartHeading>
                          <ExpandBtn onClick={() => setFullscreenChart("bar")}>
                            <Maximize2 size={13} />
                          </ExpandBtn>
                        </div>
                        <div style={{ height: "320px" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={barChartData}
                              layout="vertical"
                              margin={{
                                top: 8,
                                right: 16,
                                left: -4,
                                bottom: 0,
                              }}
                            >
                              <defs>
                                <linearGradient
                                  id="barGrad"
                                  x1="0"
                                  y1="0"
                                  x2="1"
                                  y2="0"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor="#06b6d4"
                                    stopOpacity={0.75}
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor="#3b82f6"
                                    stopOpacity={0.9}
                                  />
                                </linearGradient>
                              </defs>
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="var(--border-custom)"
                                opacity={0.25}
                                horizontal={false}
                              />
                              <XAxis
                                type="number"
                                stroke="var(--text-muted)"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={fmt}
                              />
                              <YAxis
                                type="category"
                                dataKey="name"
                                stroke="var(--text-muted)"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                width={110}
                                tickFormatter={(v) =>
                                  v.length > 14 ? v.slice(0, 13) + "…" : v
                                }
                              />
                              <RechartsTooltip
                                cursor={{ fill: "rgba(255,255,255,0.03)" }}
                                {...tooltipStyle}
                                formatter={fmtFull}
                              />
                              <Bar
                                dataKey="amount"
                                fill="url(#barGrad)"
                                radius={[0, 6, 6, 0]}
                                barSize={18}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </ChartCard>

                      {/* ── Received vs Pending Pie (4/12) ── */}
                      <ChartCard className="span-4">
                        <div className="ch">
                          <ChartHeading>
                            <Activity size={14} className="ic" /> Received vs
                            Pending
                          </ChartHeading>
                          <ExpandBtn
                            onClick={() => setFullscreenChart("pieStatus")}
                          >
                            <Maximize2 size={13} />
                          </ExpandBtn>
                        </div>
                        <div style={{ height: "320px" }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={paymentStatusData}
                                cx="50%"
                                cy="46%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={4}
                                dataKey="value"
                                stroke="none"
                                labelLine={false}
                                label={renderPieLabel}
                              >
                                <Cell fill="#10b981" />
                                <Cell fill="#ef4444" />
                              </Pie>
                              <RechartsTooltip
                                {...tooltipStyle}
                                formatter={fmtFull}
                              />
                              <Legend
                                verticalAlign="bottom"
                                height={36}
                                iconType="circle"
                                wrapperStyle={{
                                  fontSize: "12px",
                                  color: "var(--text-muted)",
                                }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </ChartCard>

                      {/* ── Client Distribution Pie (full width) ── */}
                      {pieChartData.length > 0 && (
                        <ChartCard className="span-12">
                          <div className="ch">
                            <ChartHeading>
                              <Award size={14} className="ic" /> Client Revenue
                              Distribution
                            </ChartHeading>
                            <ExpandBtn
                              onClick={() => setFullscreenChart("pie")}
                            >
                              <Maximize2 size={13} />
                            </ExpandBtn>
                          </div>
                          <div style={{ height: "300px" }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={pieChartData}
                                  cx="50%"
                                  cy="48%"
                                  innerRadius={55}
                                  outerRadius={105}
                                  paddingAngle={3}
                                  dataKey="value"
                                  stroke="none"
                                  labelLine={false}
                                  label={renderPieLabel}
                                >
                                  {pieChartData.map((_, idx) => (
                                    <Cell
                                      key={idx}
                                      fill={
                                        CHART_COLORS[idx % CHART_COLORS.length]
                                      }
                                    />
                                  ))}
                                </Pie>
                                <RechartsTooltip
                                  {...tooltipStyle}
                                  formatter={fmtFull}
                                />
                                <Legend
                                  verticalAlign="bottom"
                                  height={40}
                                  iconType="circle"
                                  wrapperStyle={{
                                    fontSize: "11.5px",
                                    color: "var(--text-muted)",
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        </ChartCard>
                      )}
                    </ChartGrid>
                  )}
                </motion.div>
              )}

              {/* ════════════ TAB: CLIENT LEDGER ════════════ */}
              {activeTab === "ledger" && (
                <motion.div
                  key="ledger"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <TableCard>
                    <THead>
                      <ChartHeading style={{ margin: 0 }}>
                        <Building2 size={14} className="ic" /> Aggregated Client
                        Ledger
                      </ChartHeading>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          fontWeight: 600,
                        }}
                      >
                        {tableData.length} clients
                      </span>
                    </THead>
                    <DataGridWrap>
                      <DataGrid>
                        <thead>
                          <tr>
                            <Th>Client Name</Th>
                            <Th $c>Invoice Count</Th>
                            <Th $r>Avg Order Value</Th>
                            <Th $r>Total Revenue</Th>
                            <Th $r>Last Transaction</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading || initialLoad ? (
                            <SkeletonTableRows rows={6} columns={5} />
                          ) : tableData.length === 0 ? (
                            <tr>
                              <td
                                colSpan="5"
                                style={{
                                  padding: "4rem 0",
                                  borderBottom: "none",
                                }}
                              >
                                <PremiumEmptyState
                                  icon={<Users size={38} strokeWidth={1.2} />}
                                  title="No Sales Found"
                                  subtitle="No client aggregations match the current filters."
                                />
                              </td>
                            </tr>
                          ) : (
                            tableData.map((row, i) => (
                              <DataRow key={i}>
                                <Td>
                                  <VCell>
                                    <VAv>
                                      {row.name.charAt(0).toUpperCase()}
                                    </VAv>
                                    <span
                                      style={{
                                        fontWeight: 700,
                                        color: "var(--text)",
                                      }}
                                    >
                                      {row.name}
                                    </span>
                                  </VCell>
                                </Td>
                                <Td $c>
                                  <BCount>{row.count} Invoices</BCount>
                                </Td>
                                <Td $r style={{ color: "var(--text-muted)" }}>
                                  ₹{" "}
                                  {row.avgOrderValue.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </Td>
                                <Td
                                  $r
                                  style={{
                                    color: "var(--primary)",
                                    fontWeight: 800,
                                  }}
                                >
                                  ₹{" "}
                                  {row.amount.toLocaleString("en-IN", {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  })}
                                </Td>
                                <Td
                                  $r
                                  style={{
                                    color: "var(--text-muted)",
                                    fontSize: "12px",
                                  }}
                                >
                                  {new Date(row.lastDate).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "2-digit",
                                      month: "short",
                                      year: "numeric",
                                    },
                                  )}
                                </Td>
                              </DataRow>
                            ))
                          )}
                        </tbody>
                      </DataGrid>
                    </DataGridWrap>
                  </TableCard>
                </motion.div>
              )}

              {/* ════════════ TAB: ALL TRANSACTIONS ════════════ */}
              {activeTab === "transactions" && (
                <motion.div
                  key="transactions"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  <TableCard>
                    <THead>
                      <ChartHeading style={{ margin: 0 }}>
                        <List size={14} className="ic" /> Individual Invoices
                      </ChartHeading>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          fontWeight: 600,
                        }}
                      >
                        {filteredData.length} records
                      </span>
                    </THead>
                    <DataGridWrap>
                      <DataGrid>
                        <thead>
                          <tr>
                            <Th>Invoice Details</Th>
                            <Th>Client</Th>
                            <Th $r>Gross</Th>
                            <Th $r>GST</Th>
                            <Th $r>Total</Th>
                            <Th $r>Paid</Th>
                            <Th $r>Pending</Th>
                            <Th $c>Status</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading || initialLoad ? (
                            <SkeletonTableRows rows={6} columns={8} />
                          ) : filteredData.length === 0 ? (
                            <tr>
                              <td
                                colSpan="8"
                                style={{
                                  padding: "4rem 0",
                                  borderBottom: "none",
                                }}
                              >
                                <PremiumEmptyState
                                  icon={
                                    <FileText size={38} strokeWidth={1.2} />
                                  }
                                  title="No Transactions"
                                  subtitle="No invoices match the current filter criteria."
                                />
                              </td>
                            </tr>
                          ) : (
                            filteredData.map((inv, i) => (
                              <DataRow key={inv.id || i}>
                                <Td>
                                  <div style={{ fontWeight: 700 }}>
                                    {inv.invoiceNo || inv.InvoiceNo || "N/A"}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "11px",
                                      color: "var(--text-muted)",
                                      marginTop: "2px",
                                    }}
                                  >
                                    {inv.normalizedDate.toLocaleDateString(
                                      "en-IN",
                                    )}
                                  </div>
                                </Td>
                                <Td style={{ fontWeight: 600 }}>
                                  {inv.normalizedClientName}
                                </Td>
                                <Td $r style={{ color: "var(--text-muted)" }}>
                                  ₹
                                  {(inv.grossAmount || 0).toLocaleString(
                                    "en-IN",
                                  )}
                                </Td>
                                <Td $r style={{ color: "var(--text-muted)" }}>
                                  ₹{inv.normalizedGst.toLocaleString("en-IN")}
                                </Td>
                                <Td
                                  $r
                                  style={{
                                    color: "var(--primary)",
                                    fontWeight: 800,
                                  }}
                                >
                                  ₹
                                  {inv.normalizedAmount.toLocaleString("en-IN")}
                                </Td>
                                <Td
                                  $r
                                  style={{ color: "#10b981", fontWeight: 600 }}
                                >
                                  ₹{inv.normalizedPaid.toLocaleString("en-IN")}
                                </Td>
                                <Td
                                  $r
                                  style={{ color: "#ef4444", fontWeight: 600 }}
                                >
                                  ₹
                                  {inv.normalizedPending.toLocaleString(
                                    "en-IN",
                                  )}
                                </Td>
                                <Td $c>
                                  <SBadge $s={inv.status || inv.Status}>
                                    {inv.status || inv.Status || "—"}
                                  </SBadge>
                                </Td>
                              </DataRow>
                            ))
                          )}
                        </tbody>
                      </DataGrid>
                    </DataGridWrap>
                  </TableCard>
                </motion.div>
              )}

              {/* ════════════ TAB: SMART INSIGHTS ════════════ */}
              {activeTab === "insights" && (
                <motion.div
                  key="insights"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                >
                  {smartInsights.length > 0 ? (
                    <InsightGrid>
                      {smartInsights.map((ins, i) => {
                        const Icon = ins.icon;
                        return (
                          <InsightCard key={i} $c={ins.color}>
                            <div className="iw">
                              <Icon size={22} />
                            </div>
                            <div>
                              <h6>{ins.title}</h6>
                              <p>{ins.text}</p>
                            </div>
                          </InsightCard>
                        );
                      })}
                    </InsightGrid>
                  ) : (
                    <EmptyBox>
                      <PremiumEmptyState
                        icon={<Lightbulb size={40} strokeWidth={1.2} />}
                        title="Insufficient Data"
                        subtitle="Generate more sales to activate AI-style revenue insights."
                      />
                    </EmptyBox>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── FULLSCREEN CHART MODAL ─── */}
          <AnimatePresence>
            {fullscreenChart && (
              <Overlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setFullscreenChart(null)}
              >
                <ModalBox
                  style={{ maxWidth: "1200px", height: "80vh" }}
                  initial={{ scale: 0.96 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.96 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      padding: "18px 22px",
                      borderBottom: "1px solid var(--border-custom)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "15px",
                        fontWeight: 800,
                        color: "var(--text)",
                      }}
                    >
                      Expanded View
                    </span>
                    <button
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--text-muted)",
                        cursor: "pointer",
                      }}
                      onClick={() => setFullscreenChart(null)}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div style={{ padding: "24px", flex: 1, minHeight: 0 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      {fullscreenChart === "line" ? (
                        <AreaChart
                          data={lineChartData}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="fsGrad"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#3b82f6"
                                stopOpacity={0.35}
                              />
                              <stop
                                offset="90%"
                                stopColor="#3b82f6"
                                stopOpacity={0.02}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border-custom)"
                            opacity={0.25}
                            vertical={false}
                          />
                          <XAxis
                            dataKey="month"
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={fmt}
                          />
                          <RechartsTooltip
                            {...tooltipStyle}
                            formatter={fmtFull}
                          />
                          {avgMonthlyRevenue > 0 && (
                            <ReferenceLine
                              y={avgMonthlyRevenue}
                              stroke="rgba(59,130,246,0.4)"
                              strokeDasharray="6 4"
                            />
                          )}
                          <Area
                            type="monotone"
                            dataKey="amount"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fill="url(#fsGrad)"
                            activeDot={{ r: 7, strokeWidth: 0 }}
                          />
                        </AreaChart>
                      ) : fullscreenChart === "bar" ? (
                        <BarChart
                          data={barChartData}
                          layout="vertical"
                          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="barGradFs"
                              x1="0"
                              y1="0"
                              x2="1"
                              y2="0"
                            >
                              <stop
                                offset="0%"
                                stopColor="#06b6d4"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="100%"
                                stopColor="#3b82f6"
                                stopOpacity={0.9}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--border-custom)"
                            opacity={0.25}
                            horizontal={false}
                          />
                          <XAxis
                            type="number"
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={fmt}
                          />
                          <YAxis
                            type="category"
                            dataKey="name"
                            stroke="var(--text-muted)"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            width={130}
                            tickFormatter={(v) =>
                              v.length > 16 ? v.slice(0, 15) + "…" : v
                            }
                          />
                          <RechartsTooltip
                            cursor={{ fill: "rgba(255,255,255,0.04)" }}
                            {...tooltipStyle}
                            formatter={fmtFull}
                          />
                          <Bar
                            dataKey="amount"
                            fill="url(#barGradFs)"
                            radius={[0, 8, 8, 0]}
                            barSize={28}
                          />
                        </BarChart>
                      ) : (
                        <PieChart>
                          <Pie
                            data={
                              fullscreenChart === "pieStatus"
                                ? paymentStatusData
                                : pieChartData
                            }
                            cx="50%"
                            cy="48%"
                            innerRadius={90}
                            outerRadius={170}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                            labelLine={false}
                            label={renderPieLabel}
                          >
                            {(fullscreenChart === "pieStatus"
                              ? paymentStatusData
                              : pieChartData
                            ).map((_, idx) => (
                              <Cell
                                key={idx}
                                fill={
                                  fullscreenChart === "pieStatus"
                                    ? ["#10b981", "#ef4444"][idx]
                                    : CHART_COLORS[idx % CHART_COLORS.length]
                                }
                              />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            {...tooltipStyle}
                            formatter={fmtFull}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            iconType="circle"
                            wrapperStyle={{
                              fontSize: "13px",
                              color: "var(--text-muted)",
                            }}
                          />
                        </PieChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                </ModalBox>
              </Overlay>
            )}
          </AnimatePresence>
        </PageShell>
      </PageTransition>

      <style>{`
        .spin { animation: _rotate 1s linear infinite; }
        @keyframes _rotate { to { transform: rotate(360deg); } }
        .show-on-print-only { display: none; }
        .text-right { text-align: right; }
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { background: white !important; color: black !important; }
          body * { visibility: hidden; }
          #report-content-to-export, #report-content-to-export * { visibility: visible; color: black !important; }
          #report-content-to-export { position: absolute; left: 0; top: 0; width: 100%; background: white !important; }
          .hide-on-print { display: none !important; }
          .show-on-print-only { display: block !important; margin-bottom: 20px; }
          .print-no-border { border: none !important; }
          table.report-table { border-collapse: collapse !important; width: 100% !important; }
          table.report-table th { background: #f1f5f9 !important; color: #0f172a !important; border: 1px solid #cbd5e1 !important; }
          table.report-table td { border: 1px solid #e2e8f0 !important; }
          table.report-table tr:nth-child(even) td { background-color: #f8fafc !important; }
        }
        .pdf-export-mode .hide-on-print { display: none !important; }
        .pdf-export-mode .show-on-print-only { display: block !important; }
        .pdf-export-mode { padding: 15px; background: white; color: black; }
        .swal2-container { z-index: 99999 !important; }
      `}</style>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   STYLED COMPONENTS
═══════════════════════════════════════════════════════════ */
const pulse = keyframes`0%,100%{opacity:1}50%{opacity:0.4}`;
const shimmer = keyframes`0%{background-position:-400px 0}100%{background-position:400px 0}`;

const PageShell = styled.div`
  min-height: 100vh;
  color: var(--text);
  font-family: "Inter", "DM Sans", sans-serif;
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px 20px 48px;
  @media (max-width: 768px) {
    padding: 14px 12px 40px;
  }
`;

const StickyHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  padding: 16px 22px;
  margin-bottom: 20px;
  position: sticky;
  top: 16px;
  z-index: 50;
  backdrop-filter: blur(20px);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
`;
const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;
const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;
const HeaderText = styled.div``;
const PageTitle = styled.h1`
  margin: 0;
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.3px;
`;
const Breadcrumb = styled.nav`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 2px;
`;
const BreadLink = styled(Link)`
  font-size: 11.5px;
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 500;
  &:hover {
    color: var(--primary);
  }
`;
const BreadSep = styled.span`
  font-size: 10px;
  color: var(--text-muted);
  opacity: 0.4;
`;
const BreadActive = styled.span`
  font-size: 11.5px;
  color: var(--primary);
  font-weight: 700;
`;

const ModuleIcon = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 11px;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 5px 14px rgba(59, 130, 246, 0.3);
  flex-shrink: 0;
`;

const FyChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 100px;
  border: 1px solid rgba(16, 185, 129, 0.25);
  background: rgba(16, 185, 129, 0.07);
  font-size: 11px;
  font-weight: 700;
  color: #10b981;
`;

const SyncDot = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 100px;
  border: 1px solid var(--border-custom);
  background: var(--bg-light-custom);
  .dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${(p) => (p.$active ? "#f59e0b" : "#10b981")};
    animation: ${(p) =>
      p.$active
        ? css`
            ${pulse} 1s ease infinite
          `
        : "none"};
  }
  .lbl {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
  }
`;

const HBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 15px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.22s ease;
  white-space: nowrap;
  ${(p) =>
    p.variant === "primary" &&
    css`
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.28);
      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 18px rgba(59, 130, 246, 0.4);
      }
    `}
  ${(p) =>
    p.variant === "ghost" &&
    css`
      background: var(--bg-light-custom);
      color: var(--text-muted);
      border-color: var(--border-custom);
      &:hover:not(:disabled) {
        color: var(--primary);
        border-color: var(--primary);
      }
    `}
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const DropMenu = styled(motion.div)`
  position: absolute;
  top: calc(100% + 7px);
  right: 0;
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 12px;
  padding: 6px;
  min-width: 176px;
  z-index: 100;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  backdrop-filter: blur(16px);
`;
const DropItem = styled.div`
  padding: 10px 12px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.18s ease;
  &:hover {
    background: rgba(59, 130, 246, 0.08);
    color: var(--primary);
  }
`;

const TabBar = styled.div`
  display: flex;
  gap: 6px;
  margin-bottom: 20px;
  padding: 5px;
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 14px;
  backdrop-filter: blur(16px);
  width: fit-content;
  overflow-x: auto;
  &::-webkit-scrollbar {
    height: 0;
  }
`;
const TabBtn = styled.button`
  padding: 9px 18px;
  border-radius: 10px;
  border: none;
  background: ${(p) => (p.$active ? "rgba(59,130,246,0.13)" : "transparent")};
  color: ${(p) => (p.$active ? "var(--primary)" : "var(--text-muted)")};
  font-weight: 700;
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.22s ease;
  display: flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
  &:hover {
    background: rgba(59, 130, 246, 0.08);
    color: var(--primary);
  }
`;

/* ── Filter components ── */
const FilterCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  padding: 16px 20px;
  margin-bottom: 20px;
  box-shadow: 0 3px 16px rgba(0, 0, 0, 0.03);
`;
const QuickRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
`;
const QPill = styled.button`
  background: ${(p) =>
    p.$active ? "rgba(59,130,246,0.1)" : "var(--bg-light-custom)"};
  border: 1px solid
    ${(p) => (p.$active ? "rgba(59,130,246,0.4)" : "var(--border-custom)")};
  color: ${(p) => (p.$active ? "var(--primary)" : "var(--text-muted)")};
  padding: 5px 14px;
  border-radius: 100px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;
  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }
`;
const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;
const FilterField = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-light-custom);
  border: 1px solid var(--border-custom);
  border-radius: 10px;
  padding: 0 12px;
  height: 40px;
  flex: ${(p) => (p.$grow ? p.$grow : "1")};
  min-width: ${(p) => (p.$date ? "148px" : "170px")};
  transition: all 0.2s ease;
  &:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }
  .fi {
    color: var(--text-muted);
    flex-shrink: 0;
  }
  .lbl {
    font-size: 10.5px;
    font-weight: 700;
    color: var(--text-muted);
    white-space: nowrap;
  }
  input,
  select {
    width: 100%;
    border: none;
    outline: none;
    background: transparent;
    color: var(--text);
    font-size: 13px;
    font-weight: 600;
  }
  input[type="date"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    opacity: 0.6;
  }
`;
const ResetBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 15px;
  border-radius: 10px;
  border: 1px solid rgba(239, 68, 68, 0.25);
  background: rgba(239, 68, 68, 0.06);
  color: #ef4444;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
  &:hover {
    background: #ef4444;
    color: white;
    border-color: #ef4444;
    transform: translateY(-1px);
  }
`;
const FBadge = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 800;
  padding: 0 4px;
`;
const ChipRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
`;
const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 600;
  background: ${(p) => (p.$color ? `${p.$color}12` : "rgba(59,130,246,0.08)")};
  border: 1px solid
    ${(p) => (p.$color ? `${p.$color}30` : "rgba(59,130,246,0.25)")};
  color: ${(p) => p.$color || "var(--primary)"};
  button {
    background: none;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: inherit;
    padding: 0;
    margin-left: 2px;
    opacity: 0.7;
    &:hover {
      opacity: 1;
    }
  }
`;

/* ── KPI Cards ── */
const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;
const KpiCard = styled.div`
  position: relative;
  overflow: hidden;
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.25s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${(p) => p.$accent};
    border-radius: 14px 14px 0 0;
  }
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 26px ${(p) => p.$accent}20;
    border-color: ${(p) => p.$accent}40;
  }
`;
const KpiIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 10px;
  flex-shrink: 0;
  background: ${(p) => p.$c}18;
  color: ${(p) => p.$c};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.25s ease;
  ${KpiCard}:hover & {
    transform: scale(1.1) rotate(5deg);
  }
`;
const KpiBody = styled.div`
  flex: 1;
  min-width: 0;
`;
const KpiLbl = styled.p`
  margin: 0;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;
const KpiVal = styled.h3`
  margin: 4px 0 0;
  font-size: 1.65rem;
  font-weight: 800;
  color: var(--text);
  line-height: 1;
`;
const KpiSub = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text-muted);
  margin-top: 5px;
`;
const KpiGlow = styled.div`
  position: absolute;
  bottom: -18px;
  right: -18px;
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: ${(p) => p.$c}0c;
  pointer-events: none;
`;
const KpiSkel = styled.div`
  height: 96px;
  border-radius: 14px;
  background: linear-gradient(
    90deg,
    var(--bg-light-custom) 25%,
    var(--border-custom) 50%,
    var(--bg-light-custom) 75%
  );
  background-size: 800px 100%;
  animation: ${shimmer} 1.5s infinite linear;
`;

/* ── Advanced Widgets ── */
const WidgetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;
const WidgetCard = styled.div`
  position: relative;
  overflow: hidden;
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 14px;
  padding: 18px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  border-top: 2px solid ${(p) => p.$c};
  transition: all 0.25s ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px ${(p) => p.$c}18;
  }
`;
const WidgetIcon = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 9px;
  flex-shrink: 0;
  background: ${(p) => p.$c}14;
  color: ${(p) => p.$c};
  display: flex;
  align-items: center;
  justify-content: center;
`;

/* ── Charts ── */
const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
  .span-12 {
    grid-column: span 12;
  }
  .span-8 {
    grid-column: span 8;
  }
  .span-4 {
    grid-column: span 4;
  }
  @media (max-width: 992px) {
    .span-8,
    .span-4 {
      grid-column: span 12;
    }
  }
`;
const ChartCard = styled.div`
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 3px 18px rgba(0, 0, 0, 0.04);
  .ch {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
`;
const ChartHeading = styled.h6`
  margin: 0;
  font-size: 12.5px;
  font-weight: 800;
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 7px;
  .ic {
    color: var(--primary);
  }
`;
const ExpandBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 7px;
  cursor: pointer;
  background: var(--bg-light-custom);
  border: 1px solid var(--border-custom);
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s ease;
  &:hover {
    color: var(--primary);
    border-color: var(--primary);
  }
`;
const EmptyBox = styled.div`
  padding: 40px 0;
`;

/* ── Print header ── */
const PrintHeader = styled.div`
  h2 {
    font-size: 19px;
    font-weight: bold;
    margin: 0 0 3px;
    color: #0f172a;
  }
  p {
    margin: 0;
    font-size: 12px;
    color: #64748b;
  }
  .ph-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 10px;
    margin-bottom: 10px;
  }
  .ph-meta {
    display: flex;
    gap: 18px;
    font-size: 11px;
    color: #64748b;
    font-weight: 600;
  }
`;

/* ── Tables ── */
const TableCard = styled.div`
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  overflow: hidden;
  margin-bottom: 20px;
  box-shadow: 0 3px 18px rgba(0, 0, 0, 0.04);
`;
const THead = styled.div`
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-custom);
  background: var(--bg-light-custom);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;
const DataGridWrap = styled.div`
  overflow-x: auto;
  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-custom);
    border-radius: 10px;
  }
`;
const DataGrid = styled.table`
  width: 100%;
  border-collapse: collapse;
`;
const Th = styled.th`
  padding: 13px 16px;
  text-align: ${(p) => (p.$c ? "center" : p.$r ? "right" : "left")};
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.7px;
  color: var(--primary);
  background: var(--bg-light-custom);
  border-bottom: 1px solid var(--border-custom);
  white-space: nowrap;
  position: sticky;
  top: 0;
  z-index: 1;
`;
const DataRow = styled.tr`
  background: var(--card);
  transition: all 0.18s ease;
  border-bottom: 1px solid var(--border-custom);
  &:last-child {
    border-bottom: none;
  }
  &:nth-child(even) {
    background: var(--bg-light-custom);
  }
  &:hover {
    background: rgba(59, 130, 246, 0.04) !important;
    box-shadow: inset 3px 0 0 var(--primary);
  }
`;
const Td = styled.td`
  padding: 13px 16px;
  vertical-align: middle;
  font-size: 13px;
  text-align: ${(p) => (p.$c ? "center" : p.$r ? "right" : "left")};
  color: var(--text);
`;
const VCell = styled.div`
  display: flex;
  align-items: center;
  gap: 11px;
`;
const VAv = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  flex-shrink: 0;
  background: rgba(59, 130, 246, 0.12);
  color: var(--primary);
  border: 1px solid rgba(59, 130, 246, 0.25);
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  ${DataRow}:hover & {
    background: var(--primary);
    color: white;
    transform: scale(1.07) rotate(4deg);
  }
`;
const BCount = styled.span`
  background: rgba(59, 130, 246, 0.1);
  color: var(--primary);
  padding: 4px 11px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 800;
  border: 1px solid rgba(59, 130, 246, 0.22);
`;
const SBadge = styled.span`
  padding: 4px 11px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  background: ${(p) =>
    p.$s === "Paid"
      ? "rgba(16,185,129,0.1)"
      : p.$s === "Partial"
        ? "rgba(245,158,11,0.1)"
        : "rgba(239,68,68,0.1)"};
  color: ${(p) =>
    p.$s === "Paid" ? "#10b981" : p.$s === "Partial" ? "#f59e0b" : "#ef4444"};
  border: 1px solid
    ${(p) =>
      p.$s === "Paid"
        ? "rgba(16,185,129,0.25)"
        : p.$s === "Partial"
          ? "rgba(245,158,11,0.25)"
          : "rgba(239,68,68,0.25)"};
`;

/* ── Smart Insights ── */
const InsightGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 14px;
`;
const InsightCard = styled.div`
  background: var(--card);
  border: 1px solid ${(p) => p.$c}28;
  border-left: 4px solid ${(p) => p.$c};
  border-radius: 14px;
  padding: 18px;
  display: flex;
  gap: 14px;
  align-items: flex-start;
  transition: all 0.25s ease;
  box-shadow: 0 3px 16px rgba(0, 0, 0, 0.04);
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 24px ${(p) => p.$c}12;
  }
  .iw {
    background: ${(p) => p.$c}12;
    color: ${(p) => p.$c};
    padding: 10px;
    border-radius: 10px;
    flex-shrink: 0;
  }
  h6 {
    margin: 0 0 5px;
    font-size: 14px;
    font-weight: 800;
    color: var(--text);
  }
  p {
    margin: 0;
    font-size: 12.5px;
    color: var(--text-muted);
    line-height: 1.55;
    font-weight: 500;
  }
`;

/* ── Modals ── */
const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(8, 12, 28, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 20px;
`;
const ModalBox = styled(motion.div)`
  background: var(--card);
  color: var(--text);
  width: 100%;
  border-radius: 18px;
  border: 1px solid var(--border-custom);
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 92vh;
`;
