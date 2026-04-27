import React, { useState, useEffect, useMemo, useRef } from "react";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import html2pdf from "html2pdf.js";
// import { Wallet } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  ChartBar,
  RefreshCcw,
  AlertCircle,
  Calendar,
  FileText,
  Filter,
  RotateCcw,
  Download,
  Printer,
  FileDown,
  TrendingUp,
  Store,
  ShoppingCart,
  ChevronDown,
  PieChart as PieChartIcon,
  Clock,
  ArrowDownLeft,
  Building2,
  Wallet
} from "lucide-react";

import { getRequest } from "../../../Services/axiosService.jsx";
import { errorAlert, successAlert } from "../../../Services/sweetAlert.jsx";

// --- PREMIUM UTILITY IMPORTS ---
import GlobalLoader from "../../components/common/GlobalLoader.jsx";
import PageTransition from "../../components/common/PageTransition.jsx";
import PremiumEmptyState from "../../components/common/PremiumEmptyState.jsx";
import {
  SkeletonCard,
  SkeletonTableRows,
} from "../../components/common/SkeletonLoader.jsx";

// 🌟 NUMBER ANIMATION COMPONENT FOR SUMMARY CARDS
const AnimatedNumber = ({ value, isCurrency = false }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }
    const increment = end / (1000 / 16); // 1-second animation at 60fps
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  const formatted = Math.ceil(count).toLocaleString("en-IN");
  return <>{isCurrency ? `₹ ${formatted}` : formatted}</>;
};

// Colors for Pie Chart & Bars
const CHART_COLORS = [
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#8b5cf6",
  "#f59e0b",
  "#ec4899",
];

export default function PurchaseReport() {
  const [purchases, setPurchases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [financialYears, setFinancialYears] = useState([]);

  // UI States
  const [initialLoad, setInitialLoad] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);

  // Filters
  const [selectedFyId, setSelectedFyId] = useState("");
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");

  const reportRef = useRef(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // 📡 DYNAMIC API FETCHING
  const fetchInitialData = async () => {
    setInitialLoad(true);
    try {
      // Fetch FYs
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

      // Fetch Vendors & Purchases concurrently
      const [vendorsRes, purchasesRes] = await Promise.all([
        getRequest("Vendor/List"),
        getRequest("PurchaseMaster/List"),
      ]);

      if (vendorsRes?.status === "OK" && Array.isArray(vendorsRes.result)) {
        setVendors(vendorsRes.result);
      }
      if (purchasesRes?.status === "OK" && Array.isArray(purchasesRes.result)) {
        setPurchases(purchasesRes.result);
      }
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
      const purchasesRes = await getRequest("PurchaseMaster/List");
      if (purchasesRes?.status === "OK" && Array.isArray(purchasesRes.result)) {
        setPurchases(purchasesRes.result);
        successAlert("Synced", "Latest data loaded");
      }
    } catch {
      errorAlert("Error", "Failed to sync data");
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // 📅 FILTER HANDLERS
  const handleQuickFilter = (type) => {
    setQuickFilter(type);
    const today = new Date();

    const formatDate = (date) => {
      const d = new Date(date);
      let month = "" + (d.getMonth() + 1);
      let day = "" + d.getDate();
      const year = d.getFullYear();
      if (month.length < 2) month = "0" + month;
      if (day.length < 2) day = "0" + day;
      return [year, month, day].join("-");
    };

    if (type === "today") {
      setFromDate(formatDate(today));
      setToDate(formatDate(today));
    } else if (type === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setFromDate(formatDate(firstDay));
      setToDate(formatDate(today));
    } else if (type === "year") {
      const firstDay = new Date(today.getFullYear(), 0, 1);
      setFromDate(formatDate(firstDay));
      setToDate(formatDate(today));
    } else {
      setFromDate("");
      setToDate("");
    }
  };

  const resetFilters = () => {
    setSelectedVendorId("");
    setFromDate("");
    setToDate("");
    setQuickFilter("all");
    const activeFy = financialYears.find(
      (y) => (y.isActive || y.IsActive) && !(y.isDelete || y.IsDelete),
    );
    if (activeFy) setSelectedFyId(activeFy.id || activeFy.Id);
  };

  const handleDateChange = (type, val) => {
    setQuickFilter("custom");
    if (type === "from") setFromDate(val);
    if (type === "to") setToDate(val);
  };

  // 🧠 DYNAMIC DATA MAPPING & NORMALIZATION
  const activeFyObj = useMemo(
    () =>
      financialYears.find(
        (fy) => (fy.id || fy.Id)?.toString() === selectedFyId?.toString(),
      ),
    [financialYears, selectedFyId],
  );

  const vendorMap = useMemo(() => {
    const map = {};
    vendors.forEach((v) => {
      const vId = v.id || v.Id;
      map[vId] =
        v.businessName ||
        v.BusinessName ||
        v.vendorName ||
        v.VendorName ||
        `Vendor #${vId}`;
    });
    return map;
  }, [vendors]);

  const normalizedData = useMemo(() => {
    return purchases.map((pur) => {
      // Safe Fallbacks for robust mapping
      const rawDate =
        pur.billDate ||
        pur.BillDate ||
        pur.purchaseDate ||
        pur.PurchaseDate ||
        pur.createdAt ||
        pur.CreatedAt;
      const date = rawDate ? new Date(rawDate) : new Date();

      const amount = parseFloat(
        pur.total ||
          pur.Total ||
          pur.totalAmount ||
          pur.TotalAmount ||
          pur.grandTotal ||
          pur.GrandTotal ||
          pur.netAmount ||
          pur.NetAmount ||
          0,
      );

      const vId =
        pur.vendorId ||
        pur.VendorId ||
        pur.vendorName ||
        pur.VendorName ||
        "Unknown";
      const vendorName =
        vendorMap[vId] || pur.vendorName || pur.VendorName || "Unknown Vendor";

      return {
        ...pur,
        normalizedDate: date,
        normalizedAmount: amount,
        normalizedVendorId: vId.toString(),
        normalizedVendorName: vendorName,
      };
    });
  }, [purchases, vendorMap]);

  // 🌟 APPLY FILTERS
  const filteredData = useMemo(() => {
    let result = [...normalizedData];

    // 1. FY Filter
    if (activeFyObj) {
      const fyStart = new Date(activeFyObj.startDate || activeFyObj.StartDate);
      const fyEnd = new Date(activeFyObj.endDate || activeFyObj.EndDate);
      fyStart.setHours(0, 0, 0, 0);
      fyEnd.setHours(23, 59, 59, 999);

      result = result.filter((pur) => {
        return pur.normalizedDate >= fyStart && pur.normalizedDate <= fyEnd;
      });
    }

    // 2. Date Range Filter
    if (fromDate) {
      const from = new Date(fromDate);
      from.setHours(0, 0, 0, 0);
      result = result.filter((pur) => pur.normalizedDate >= from);
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      result = result.filter((pur) => pur.normalizedDate <= to);
    }

    // 3. Exact Vendor Filter
    if (selectedVendorId) {
      result = result.filter(
        (pur) => pur.normalizedVendorId === selectedVendorId.toString(),
      );
    }

    return result;
  }, [normalizedData, activeFyObj, fromDate, toDate, selectedVendorId]);

  // 🌟 AGGREGATIONS FOR DASHBOARD CARDS
  const { totalPurchase, totalCount, uniqueVendorsCount } = useMemo(() => {
    let totalAmt = 0;
    const uniqueVendors = new Set();

    filteredData.forEach((pur) => {
      totalAmt += pur.normalizedAmount;
      if (pur.normalizedVendorId && pur.normalizedVendorId !== "Unknown") {
        uniqueVendors.add(pur.normalizedVendorId);
      }
    });

    return {
      totalPurchase: totalAmt,
      totalCount: filteredData.length,
      uniqueVendorsCount: uniqueVendors.size,
    };
  }, [filteredData]);

  // 🌟 CHART & TABLE DATA PROCESSING
  const { barChartData, pieChartData, lineChartData, tableData } =
    useMemo(() => {
      const vendorAgg = {};
      const monthAgg = {};

      filteredData.forEach((pur) => {
        const amt = pur.normalizedAmount;
        const vId = pur.normalizedVendorId;
        const date = pur.normalizedDate;

        // Vendor Mapping for Table & Bar/Pie Charts
        if (!vendorAgg[vId]) {
          vendorAgg[vId] = {
            id: vId,
            name: pur.normalizedVendorName,
            amount: 0,
            count: 0,
            lastDate: date,
          };
        }
        vendorAgg[vId].amount += amt;
        vendorAgg[vId].count += 1;
        if (date > new Date(vendorAgg[vId].lastDate)) {
          vendorAgg[vId].lastDate = date;
        }

        // Monthly Mapping for Line Chart
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const monthLabel = date.toLocaleString("default", {
          month: "short",
          year: "2-digit",
        });

        if (!monthAgg[monthKey]) {
          monthAgg[monthKey] = {
            sortKey: monthKey,
            month: monthLabel,
            amount: 0,
          };
        }
        monthAgg[monthKey].amount += amt;
      });

      // Final Table Data (Sorted DESC)
      const tData = Object.values(vendorAgg)
        .map((v) => ({
          ...v,
          avgOrderValue: v.count > 0 ? v.amount / v.count : 0,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Top Vendors for Bar Chart
      const bData = tData.slice(0, 8);

      // Top 5 + Others for Pie Chart
      const pData = tData
        .slice(0, 5)
        .map((v) => ({ name: v.name, value: v.amount }));
      if (tData.length > 5) {
        const othersAmt = tData.slice(5).reduce((sum, v) => sum + v.amount, 0);
        if (othersAmt > 0) pData.push({ name: "Others", value: othersAmt });
      }

      // Monthly Data Sorted By Time
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

  // 📤 EXPORTS
  const handleExportCSV = () => {
    if (tableData.length === 0)
      return errorAlert("No Data", "No data to export");
    const headers = [
      "Vendor Name,Purchase Count,Total Amount (INR),Avg Order Value (INR),Last Transaction Date",
    ];
    const rows = tableData.map(
      (r) =>
        `"${r.name.replace(/"/g, '""')}",${r.count},${r.amount.toFixed(2)},${r.avgOrderValue.toFixed(2)},"${new Date(
          r.lastDate,
        ).toLocaleDateString()}"`,
    );
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Purchase_Report_${new Date().getTime()}.csv`,
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

    // Inject PDF specific styling class
    element.classList.add("pdf-export-mode");

    const fyName = activeFyObj
      ? activeFyObj.yearName || activeFyObj.YearName
      : "All Time";
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Enterprise_Purchase_Report_${fyName}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, useCORS: true, logging: false },
      jsPDF: { unit: "mm", format: "a4", orientation: "landscape" },
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        element.classList.remove("pdf-export-mode");
        successAlert("Generated", "PDF Report saved successfully");
      });
  };

  const handlePrint = () => {
    setExportMenuOpen(false);
    window.print();
  };

  const activeFiltersCount = [selectedVendorId, fromDate, toDate].filter(
    Boolean,
  ).length;

  return (
    <>
      <GlobalLoader isLoading={initialLoad} />
      <PageTransition>
        <PageWrapper className="p-2 p-md-3">
          <HeaderSection className="mb-3 hide-on-print">
            <div className="title-area">
              <PageTitle>
                <ShoppingCart className="title-icon" size={24} /> Purchase
                Report
              </PageTitle>
              <p className="subtitle">
                Enterprise expense analytics & vendor performance
              </p>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <PremiumBtn
                className="secondary"
                onClick={handleRefresh}
                disabled={loading || isRefreshing || initialLoad}
              >
                <RefreshCcw size={14} className={isRefreshing ? "spin" : ""} />
                {isRefreshing ? "Syncing..." : "Sync"}
              </PremiumBtn>

              <div className="position-relative">
                <PremiumBtn
                  className="primary"
                  onClick={() => setExportMenuOpen(!exportMenuOpen)}
                >
                  <Download size={14} /> Export <ChevronDown size={14} />
                </PremiumBtn>
                <AnimatePresence>
                  {exportMenuOpen && (
                    <DropdownMenu
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    >
                      <DropdownItem onClick={handleExportPDF}>
                        <FileText size={14} className="text-danger" /> Download
                        PDF
                      </DropdownItem>
                      <DropdownItem onClick={handleExportCSV}>
                        <FileDown size={14} className="text-success" /> Download
                        CSV
                      </DropdownItem>
                      <div className="dropdown-divider my-1 border-custom"></div>
                      {/* <DropdownItem onClick={handlePrint}>
                        <Printer size={14} className="text-primary" /> Print
                        Layout
                      </DropdownItem> */}
                    </DropdownMenu>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </HeaderSection>

          {/* 🔍 FILTER BAR */}
          <FilterWrapper className="hide-on-print mb-3">
            <QuickFilters>
              <button
                className={quickFilter === "today" ? "active" : ""}
                onClick={() => handleQuickFilter("today")}
              >
                Today
              </button>
              <button
                className={quickFilter === "month" ? "active" : ""}
                onClick={() => handleQuickFilter("month")}
              >
                This Month
              </button>
              <button
                className={quickFilter === "year" ? "active" : ""}
                onClick={() => handleQuickFilter("year")}
              >
                This Year
              </button>
              <button
                className={quickFilter === "all" ? "active" : ""}
                onClick={() => handleQuickFilter("all")}
              >
                All Time
              </button>
            </QuickFilters>

            <CompactFilterBar>
              <div
                className="filter-item flex-grow-1"
                style={{ minWidth: "180px" }}
              >
                <Store size={12} className="icon" />
                <select
                  value={selectedVendorId}
                  onChange={(e) => setSelectedVendorId(e.target.value)}
                  className="w-100"
                >
                  <option value="">-- All Vendors --</option>
                  {vendors.map((v) => (
                    <option key={v.id || v.Id} value={v.id || v.Id}>
                      {v.businessName ||
                        v.BusinessName ||
                        v.vendorName ||
                        v.VendorName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-item">
                <Filter size={12} className="icon" />
                <select
                  value={selectedFyId}
                  onChange={(e) => setSelectedFyId(e.target.value)}
                >
                  <option value="">-- All FY --</option>
                  {financialYears.map((fy) => (
                    <option key={fy.id || fy.Id} value={fy.id || fy.Id}>
                      {fy.yearName || fy.YearName}{" "}
                      {fy.isActive || fy.IsActive ? "★" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-item date-item">
                <span className="label">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => handleDateChange("from", e.target.value)}
                />
              </div>
              <div className="filter-item date-item">
                <span className="label">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => handleDateChange("to", e.target.value)}
                />
              </div>
              <button
                className="btn-reset position-relative"
                onClick={resetFilters}
              >
                <RotateCcw size={12} /> Reset
                {activeFiltersCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: "8px", padding: "2px 4px" }}
                  >
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </CompactFilterBar>
          </FilterWrapper>

          {/* 📄 REPORT WRAPPER (Target for Print & PDF) */}
          <div
            ref={reportRef}
            id="report-content-to-export"
            className="print-wrapper"
          >
            {/* Print & PDF Only Header */}
            <PrintHeader className="show-on-print-only">
              <div className="d-flex align-items-center justify-content-between mb-2 pb-2 border-bottom">
                <div>
                  <h2>Enterprise Purchase Report</h2>
                  <p className="m-0 text-muted" style={{ fontSize: "12px" }}>
                    ERP Billing System Output
                  </p>
                </div>
                <div className="text-end">
                  <Building2 size={24} color="#64748b" />
                </div>
              </div>
              <div className="print-meta">
                <span>Generated: {new Date().toLocaleString()}</span>
                {activeFyObj && (
                  <span>
                    FY: {activeFyObj.yearName || activeFyObj.YearName}
                  </span>
                )}
                {(fromDate || toDate) && (
                  <span>
                    Period: {fromDate || "Start"} to {toDate || "End"}
                  </span>
                )}
              </div>
            </PrintHeader>

            <FyBadgeWrapper className="hide-on-print">
              {activeFyObj ? (
                <FyBadge>
                  <Calendar size={12} /> DATA FILTERED BY FY:{" "}
                  {activeFyObj.yearName || activeFyObj.YearName}
                </FyBadge>
              ) : (
                <FyBadge className="warning">
                  <AlertCircle size={12} /> Showing Across All Financial Years
                </FyBadge>
              )}
            </FyBadgeWrapper>

            {/* 📊 SUMMARY CARDS */}
            <SummaryGrid className="mb-3">
              {initialLoad || loading ? (
                <>
                  <SkeletonCard />
                  <SkeletonCard />
                  <SkeletonCard />
                </>
              ) : (
                <>
                  <SummaryCard>
                    <div className="inner-content">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span
                          className="text-muted-custom fw-semibold text-uppercase tracking-wide"
                          style={{ fontSize: "10px" }}
                        >
                          Total Purchase Amount
                        </span>
                        <div className="icon-box bg-primary-subtle text-primary">
                          <Wallet size={16} />
                        </div>
                      </div>
                      <h3 className="fw-bold mt-1 text-custom mb-0 fs-4 text-gradient">
                        <AnimatedNumber
                          value={totalPurchase}
                          isCurrency={true}
                        />
                      </h3>
                      <small
                        className="text-danger mt-1 d-block fw-bold d-flex align-items-center gap-1"
                        style={{ fontSize: "10px" }}
                      >
                        <ArrowDownLeft size={12} /> Total Expense Value
                      </small>
                    </div>
                  </SummaryCard>

                  <SummaryCard>
                    <div className="inner-content">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span
                          className="text-muted-custom fw-semibold text-uppercase tracking-wide"
                          style={{ fontSize: "10px" }}
                        >
                          Total Purchases
                        </span>
                        <div className="icon-box bg-info-subtle text-info">
                          <ShoppingCart size={16} />
                        </div>
                      </div>
                      <h3 className="fw-bold mt-1 text-custom mb-0 fs-4">
                        <AnimatedNumber value={totalCount} />
                      </h3>
                      <small
                        className="text-muted-custom mt-1 d-block fw-bold d-flex align-items-center gap-1"
                        style={{ fontSize: "10px" }}
                      >
                        <Clock size={12} /> Generated in period
                      </small>
                    </div>
                  </SummaryCard>

                  <SummaryCard>
                    <div className="inner-content">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span
                          className="text-muted-custom fw-semibold text-uppercase tracking-wide"
                          style={{ fontSize: "10px" }}
                        >
                          Active Vendors
                        </span>
                        <div className="icon-box bg-success-subtle text-success">
                          <Store size={16} />
                        </div>
                      </div>
                      <h3 className="fw-bold mt-1 text-custom mb-0 fs-4">
                        <AnimatedNumber value={uniqueVendorsCount} />
                      </h3>
                      <small
                        className="text-muted-custom mt-1 d-block fw-bold"
                        style={{ fontSize: "10px" }}
                      >
                        Unique transacting suppliers
                      </small>
                    </div>
                  </SummaryCard>
                </>
              )}
            </SummaryGrid>

            {/* 📈 CHARTS SECTION */}
            {!initialLoad && tableData.length > 0 && (
              <ChartGrid className="mb-3">
                <GlassCard className="p-3 chart-line">
                  <h6
                    className="fw-bold text-custom mb-3 d-flex align-items-center gap-2"
                    style={{ fontSize: "12px", textTransform: "uppercase" }}
                  >
                    <TrendingUp size={14} className="text-primary" /> Monthly
                    Purchase Trend
                  </h6>
                  <div style={{ height: "240px", width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={lineChartData}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border-custom)"
                          opacity={0.3}
                          vertical={false}
                        />
                        <XAxis
                          dataKey="month"
                          stroke="var(--text-muted)"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          stroke="var(--text-muted)"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) =>
                            `₹${(val / 1000).toFixed(0)}k`
                          }
                        />
                        <RechartsTooltip
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border-custom)",
                            borderRadius: "8px",
                            fontSize: "11px",
                            boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
                          }}
                          itemStyle={{
                            color: "var(--primary)",
                            fontWeight: "bold",
                          }}
                          formatter={(value) => [
                            `₹ ${value.toLocaleString("en-IN")}`,
                            "Amount",
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="#ec4899"
                          strokeWidth={3}
                          dot={{
                            r: 3,
                            fill: "#ec4899",
                            strokeWidth: 2,
                            stroke: "var(--card)",
                          }}
                          activeDot={{ r: 6, fill: "#be185d", stroke: "#fff" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                <GlassCard className="p-3 chart-bar">
                  <h6
                    className="fw-bold text-custom mb-3 d-flex align-items-center gap-2"
                    style={{ fontSize: "12px", textTransform: "uppercase" }}
                  >
                    <ChartBar size={14} className="text-primary" /> Top Vendor
                    Purchases
                  </h6>
                  <div style={{ height: "240px", width: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={barChartData}
                        margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="var(--border-custom)"
                          opacity={0.3}
                          horizontal={false}
                        />
                        <XAxis
                          type="number"
                          stroke="var(--text-muted)"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) =>
                            `₹${(val / 1000).toFixed(0)}k`
                          }
                        />
                        <YAxis
                          type="category"
                          dataKey="name"
                          stroke="var(--text-muted)"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          width={80}
                          tickFormatter={(val) =>
                            val.length > 10 ? val.substring(0, 10) + ".." : val
                          }
                        />
                        <RechartsTooltip
                          cursor={{ fill: "var(--bg-hover)" }}
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border-custom)",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                          itemStyle={{ color: "#ec4899", fontWeight: "bold" }}
                          formatter={(value) => [
                            `₹ ${value.toLocaleString("en-IN")}`,
                            "Amount",
                          ]}
                        />
                        <Bar
                          dataKey="amount"
                          fill="url(#colorBarPurchase)"
                          radius={[0, 4, 4, 0]}
                          barSize={20}
                        />
                        <defs>
                          <linearGradient
                            id="colorBarPurchase"
                            x1="0"
                            y1="0"
                            x2="1"
                            y2="0"
                          >
                            <stop
                              offset="0%"
                              stopColor="#f472b6"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="100%"
                              stopColor="#db2777"
                              stopOpacity={0.9}
                            />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>

                <GlassCard className="p-3 chart-pie hide-on-print">
                  <h6
                    className="fw-bold text-custom mb-3 d-flex align-items-center gap-2"
                    style={{ fontSize: "12px", textTransform: "uppercase" }}
                  >
                    <PieChartIcon size={14} className="text-primary" /> Purchase
                    Distribution
                  </h6>
                  <div
                    style={{
                      height: "240px",
                      width: "100%",
                      display: "flex",
                      justifyContent: "center",
                    }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="45%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CHART_COLORS[index % CHART_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            background: "var(--card)",
                            border: "1px solid var(--border-custom)",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                          formatter={(value) => [
                            `₹ ${value.toLocaleString("en-IN")}`,
                            "Amount",
                          ]}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                          wrapperStyle={{
                            fontSize: "10px",
                            color: "var(--text-muted)",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              </ChartGrid>
            )}

            {/* 📋 DETAILED TABLE */}
            <GlassCard className="p-0 overflow-hidden print-no-border mb-4">
              <div className="p-3 border-bottom border-custom hide-on-print">
                <h6
                  className="fw-bold text-custom m-0 d-flex align-items-center gap-2"
                  style={{ fontSize: "12px", textTransform: "uppercase" }}
                >
                  <FileText size={14} className="text-primary" /> Detailed
                  Vendor Ledger
                </h6>
              </div>
              <TableWrapper>
                <Table className="report-table">
                  <thead>
                    <tr>
                      <th>Vendor Name</th>
                      <th className="text-center">Purchase Count</th>
                      <th className="text-right">Avg Order Value</th>
                      <th className="text-right">Total Amount</th>
                      <th className="text-right">Last Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading || initialLoad ? (
                      <SkeletonTableRows rows={4} columns={5} />
                    ) : tableData.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-5 border-0">
                          <PremiumEmptyState
                            icon={Store}
                            title="No Purchases Found"
                            subtitle="No purchase records match the current date and filter criteria."
                          />
                        </td>
                      </tr>
                    ) : (
                      tableData.map((row, i) => (
                        <tr key={i} className="list-row">
                          <td className="fw-semibold text-custom py-3">
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="avatar-sm bg-primary-subtle text-primary rounded d-flex align-items-center justify-content-center fw-bold hide-on-print"
                                style={{
                                  width: "24px",
                                  height: "24px",
                                  fontSize: "10px",
                                }}
                              >
                                {row.name.charAt(0).toUpperCase()}
                              </div>
                              {row.name}
                            </div>
                          </td>
                          <td className="text-center py-3">
                            <span className="badge-custom">{row.count}</span>
                          </td>
                          <td className="text-right text-muted-custom py-3">
                            ₹{" "}
                            {row.avgOrderValue.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="text-right fw-bold text-primary py-3">
                            ₹{" "}
                            {row.amount.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </td>
                          <td className="text-right text-muted-custom small py-3">
                            {new Date(row.lastDate).toLocaleDateString(
                              "en-IN",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </TableWrapper>
            </GlassCard>
          </div>
        </PageWrapper>
      </PageTransition>

      <style>{`
        /* Spin Animation */
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        .text-right { text-align: right; }
        .text-gradient {
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .show-on-print-only { display: none; }

        /* Print Specific Styles */
        @media print {
          @page { size: landscape; margin: 10mm; }
          body { background: white !important; color: black !important; }
          body * { visibility: hidden; }
          
          #report-content-to-export, #report-content-to-export * { 
            visibility: visible; 
            color: black !important;
          }
          
          #report-content-to-export { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%; 
            background: white !important;
          }

          .hide-on-print { display: none !important; }
          .show-on-print-only { display: block !important; margin-bottom: 20px; }
          
          /* Simplify glassmorphism for print */
          div[class*="GlassCard"], div[class*="SummaryCard"] { 
            box-shadow: none !important; 
            border: 1px solid #ddd !important; 
            background: white !important; 
            break-inside: avoid;
          }

          .print-no-border { border: none !important; }
          
          /* Remove dark mode impacts on print */
          .text-primary { color: #2563eb !important; }
          .text-muted-custom { color: #4b5563 !important; }
          .bg-primary-subtle { background-color: transparent !important; }
          .badge-custom { background: transparent !important; border: 1px solid #ccc !important; color: black !important; }
          
          /* Table print fixes (Zebra Styling) */
          table.report-table { border-collapse: collapse !important; width: 100% !important; }
          table.report-table th { background: #f1f5f9 !important; color: #0f172a !important; border: 1px solid #cbd5e1 !important; }
          table.report-table td { border: 1px solid #e2e8f0 !important; }
          table.report-table tr:nth-child(even) td { background-color: #f8fafc !important; }
        }

        /* PDF Export Overrides */
        .pdf-export-mode .hide-on-print { display: none !important; }
        .pdf-export-mode .show-on-print-only { display: block !important; }
        .pdf-export-mode { padding: 15px; background: white; color: black; }
        .pdf-export-mode [class*="GlassCard"], .pdf-export-mode [class*="SummaryCard"] { 
            border: 1px solid #e2e8f0; 
            background: white; 
            box-shadow: none;
        }
        .pdf-export-mode table.report-table th { background: #f1f5f9 !important; color: #000 !important; border: 1px solid #cbd5e1 !important;}
        .pdf-export-mode table.report-table td { border: 1px solid #e2e8f0 !important; }
        .pdf-export-mode table.report-table tr:nth-child(even) td { background-color: #f8fafc !important; }
        .pdf-export-mode .badge-custom { border: 1px solid #94a3b8; background: transparent; color: #000; }
        .pdf-export-mode .text-primary { color: #2563eb !important; }
      `}</style>
    </>
  );
}

/* ================= STYLED COMPONENTS ================= */

const PageWrapper = styled.div`
  min-height: 100vh;
  color: var(--text);
  font-family: "Inter", sans-serif;
  max-width: 1600px;
  margin: 0 auto;
  font-size: 13px; /* 80% Scale logic applied */
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;

  .title-area {
    .subtitle {
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 500;
      margin: 2px 0 0 0;
    }
  }
`;

const PageTitle = styled.h2`
  font-size: 22px;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  .title-icon {
    color: #3b82f6;
  }
`;

const PrintHeader = styled.div`
  h2 {
    font-size: 20px;
    font-weight: bold;
    margin: 0 0 4px 0;
    color: #0f172a;
  }
  .print-meta {
    display: flex;
    gap: 20px;
    font-size: 11px;
    color: #64748b;
    font-weight: 600;
    margin-top: 10px;
  }
`;

const FyBadgeWrapper = styled.div`
  margin-bottom: 16px;
`;

const FyBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;

  &.warning {
    color: #f59e0b;
    border-color: rgba(245, 158, 11, 0.3);
    background: rgba(245, 158, 11, 0.1);
  }
`;

const PremiumBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;

  &.primary {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: white;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
    }
  }

  &.secondary {
    background: var(--card);
    color: var(--text);
    border: 1px solid var(--border-custom);
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      border-color: var(--primary);
      color: var(--primary);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 12px;
  padding: 8px;
  min-width: 180px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  z-index: 100;
  backdrop-filter: blur(16px);
`;

const DropdownItem = styled.div`
  padding: 10px 12px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    color: var(--primary);
  }
`;

const FilterWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 4px 6px rgba(13, 51, 236, 0.05);
  backdrop-filter: blur(16px);
`;

const QuickFilters = styled.div`
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;

  &::-webkit-scrollbar {
    height: 2px;
  }

  button {
    background: var(--bg-light-custom);
    border: 1px solid var(--border-custom);
    color: var(--text-muted);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
      border-color: var(--primary);
      color: var(--text);
    }

    &.active {
      background: rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.4);
      color: var(--primary);
    }
  }
`;

const CompactFilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  .filter-item {
    display: flex;
    align-items: center;
    background: var(--bg-hover);
    border: 1px solid var(--border-custom);
    border-radius: 8px;
    padding: 0 12px;
    height: 36px;
    flex: 1 1 auto;
    min-width: 140px;
    transition: all 0.2s;

    &:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
    }

    .icon {
      color: var(--text-muted);
      margin-right: 8px;
    }

    .label {
      color: var(--text-muted);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      margin-right: 8px;
    }

    input,
    select {
      border: none;
      background: transparent;
      color: var(--text);
      font-size: 12px;
      font-weight: 600;
      width: 100%;
      outline: none;

      option {
        background: var(--card);
        color: var(--text);
      }
    }

    input[type="date"]::-webkit-calendar-picker-indicator {
      cursor: pointer;
      filter: invert(0.5);
    }
    [data-theme="dark"] input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(1);
    }
  }

  .btn-reset {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 36px;
    padding: 0 16px;
    border-radius: 8px;
    border: 1px solid rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.05);
    color: #ef4444;
    font-weight: 700;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: #ef4444;
      color: white;
    }
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
`;

const SummaryCard = styled.div`
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
  backdrop-filter: blur(16px);

  .inner-content {
    padding: 18px;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 30px rgba(59, 130, 246, 0.08);
    border-color: rgba(59, 130, 246, 0.3);
  }

  .icon-box {
    width: 38px;
    height: 38px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const ChartGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;

  .chart-line {
    grid-column: span 12;
  }
  .chart-bar {
    grid-column: span 8;
  }
  .chart-pie {
    grid-column: span 4;
  }

  @media (max-width: 992px) {
    .chart-bar,
    .chart-pie {
      grid-column: span 12;
    }
  }
`;

const GlassCard = styled.div`
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  backdrop-filter: blur(16px);
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;

  th {
    padding: 14px 16px;
    text-align: left;
    color: var(--text-muted);
    font-size: 10px;
    text-transform: uppercase;
    font-weight: 800;
    letter-spacing: 0.5px;
    background: var(--bg-hover);
    border-bottom: 1px solid var(--border-custom);
    position: sticky;
    top: 0;
    z-index: 10;
  }

  td {
    padding: 10px 16px;
    vertical-align: middle;
    border-bottom: 1px dashed var(--border-custom);
    font-size: 12px;
  }

  tr:last-child td {
    border-bottom: none;
  }

  tr.list-row {
    transition: all 0.2s ease;
    background: transparent;
  }
  tr.list-row:hover {
    background: var(--bg-light-custom);
  }

  .badge-custom {
    background: rgba(59, 130, 246, 0.1);
    color: var(--primary);
    padding: 4px 10px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 11px;
    border: 1px solid rgba(59, 130, 246, 0.2);
  }
`;
