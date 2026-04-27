import React, { useEffect, useState, useMemo } from "react";
import "./dashboard.css";
import { Link, useNavigate } from "react-router-dom";
import { getRequest } from "../../../Services/axiosService";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Legend,
  PieChart,
  Pie,
} from "recharts";

// PREMIUM COMPONENTS
import GlobalLoader from "../../components/common/GlobalLoader.jsx";
import PageTransition from "../../components/common/PageTransition.jsx";
import PremiumEmptyState from "../../components/common/PremiumEmptyState.jsx";
import {
  SkeletonCard,
  SkeletonBase,
} from "../../components/common/SkeletonLoader.jsx";

/* ===== NUMBER COUNTER ANIMATION ===== */
const AnimatedNumber = ({
  value,
  isCurrency = false,
  isPercentage = false,
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }
    const duration = 1000;
    const increment = end / (duration / 16);

    const timer = setInterval(() => {
      start += increment;
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [value]);

  const formattedCount = Math.ceil(count).toLocaleString("en-IN");

  if (isCurrency) return <>₹{formattedCount}</>;
  if (isPercentage) return <>{count.toFixed(1)}%</>;
  return <>{formattedCount}</>;
};

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  const [activeFy, setActiveFy] = useState(null);

  const [productCount, setProductCount] = useState(0);
  const [vendorCount, setVendorCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);

  const [todaySales, setTodaySales] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalPurchase, setTotalPurchase] = useState(0);

  const [inwardCount, setInwardCount] = useState(0);
  const [outwardCount, setOutwardCount] = useState(0);

  const [recentInvoices, setRecentInvoices] = useState([]);

  // GLOBAL FILTERS
  const [summaryFilter, setSummaryFilter] = useState("monthly");
  const [chartFilter, setChartFilter] = useState("monthly");

  const [rawInvoices, setRawInvoices] = useState([]);
  const [rawPurchases, setRawPurchases] = useState([]);
  const [rawPayments, setRawPayments] = useState([]);

  // LIVE DATE TIME
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /* ===== LOAD DASHBOARD DATA ===== */
  const loadDashboardData = async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      // 1. Fetch Financial Year
      const fyRes = await getRequest("FinancialYear/List");
      let currentActiveFy = null;
      if (fyRes?.status === "OK" && fyRes?.result) {
        currentActiveFy = fyRes.result.find(
          (y) => y.isActive && !y.isClosed && !y.isDelete,
        );
        setActiveFy(currentActiveFy);
      }

      const inRange = (dStr) => {
        if (!currentActiveFy) return true;
        if (!dStr) return false;
        const d = new Date(dStr);
        return (
          d >= new Date(currentActiveFy.startDate) &&
          d <= new Date(currentActiveFy.endDate)
        );
      };

      // 2. Fetch All Endpoints
      const [
        productRes,
        vendorRes,
        clientRes,
        invoiceRes,
        purchaseRes,
        inwardRes,
        outwardRes,
        paymentRes,
      ] = await Promise.allSettled([
        getRequest("ProductMaster/List"),
        getRequest("Vendor/List"),
        getRequest("ClientMaster/List"),
        getRequest("InvoiceMaster/ListInvoice"),
        getRequest("PurchaseMaster/List"),
        getRequest("InwardStock/List"),
        getRequest("Outward/ListOutward"),
        getRequest("InvoicePayment/List"),
      ]);

      // 3. Process Non-Filtered Data
      if (productRes.status === "fulfilled")
        setProductCount(
          productRes.value?.result?.length || productRes.value?.length || 0,
        );
      if (vendorRes.status === "fulfilled")
        setVendorCount(
          vendorRes.value?.result?.length || vendorRes.value?.length || 0,
        );
      if (clientRes.status === "fulfilled")
        setCustomerCount(
          clientRes.value?.result?.length || clientRes.value?.length || 0,
        );

      // 4. Process Filtered Data (By Active FY)
      if (inwardRes.status === "fulfilled") {
        let inw = inwardRes.value?.result || inwardRes.value || [];
        setInwardCount(
          inw.filter((s) => inRange(s.inwardDate || s.createdAt)).length,
        );
      }
      if (outwardRes.status === "fulfilled") {
        let outw = outwardRes.value?.result || outwardRes.value || [];
        setOutwardCount(
          outw.filter((s) => inRange(s.outwardDate || s.createdAt)).length,
        );
      }

      if (paymentRes.status === "fulfilled") {
        let pays = paymentRes.value?.result || paymentRes.value || [];
        setRawPayments(
          pays.filter((p) => inRange(p.paymentDate || p.createdAt)),
        );
      }

      if (purchaseRes.status === "fulfilled") {
        let purchases = purchaseRes.value?.result || purchaseRes.value || [];
        purchases = purchases.filter((p) => inRange(p.billDate || p.createdAt));
        setRawPurchases(purchases);
        setTotalPurchase(
          purchases.reduce((sum, item) => sum + (item.total || 0), 0),
        );
      }

      if (invoiceRes.status === "fulfilled") {
        let invoices = invoiceRes.value?.result || invoiceRes.value || [];
        invoices = invoices.filter((i) =>
          inRange(i.invoiceDate || i.createdAt),
        );
        setRawInvoices(invoices);

        let tSales = 0,
          todayS = 0;
        const todayString = new Date().toISOString().split("T")[0];

        invoices.forEach((inv) => {
          tSales += inv.total || 0;
          if (
            new Date(inv.invoiceDate || inv.createdAt)
              .toISOString()
              .split("T")[0] === todayString
          ) {
            todayS += inv.total || 0;
          }
        });

        setTotalSales(tSales);
        setTodaySales(todayS);
        setRecentInvoices(
          [...invoices].sort(
            (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
          ),
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      if (isRefresh) {
        setTimeout(() => setIsRefreshing(false), 500);
      } else {
        setTimeout(() => setIsLoading(false), 500);
      }
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const viewInvoice = (id) =>
    navigate("/staff/invoicepreview", { state: { id: id } });

  /* ===== DYNAMIC FINANCIAL CALCULATIONS ===== */
  const financialMetrics = useMemo(() => {
    const today = new Date();

    const filterByDate = (data, dateField) => {
      return data.filter((item) => {
        const dStr = item[dateField] || item.createdAt;
        if (!dStr) return false;
        const d = new Date(dStr);
        if (summaryFilter === "today")
          return d.toDateString() === today.toDateString();
        if (summaryFilter === "monthly")
          return (
            d.getMonth() === today.getMonth() &&
            d.getFullYear() === today.getFullYear()
          );
        if (summaryFilter === "yearly")
          return d.getFullYear() === today.getFullYear();
        return true;
      });
    };

    const fInvoices = filterByDate(rawInvoices, "invoiceDate");
    const fPurchases = filterByDate(rawPurchases, "billDate");
    const fPayments = filterByDate(rawPayments, "paymentDate");

    const rev = fInvoices.reduce((sum, i) => sum + (i.total || 0), 0);
    const pur = fPurchases.reduce((sum, p) => sum + (p.total || 0), 0);
    const paid = fPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    const netProf = rev - pur;
    const margin = rev > 0 ? (netProf / rev) * 100 : 0;
    const pending = Math.max(0, rev - paid);
    const expRatio = rev > 0 ? (pur / rev) * 100 : 0;

    // Monthly Growth Calculation
    const lastMonthInvoices = rawInvoices.filter((item) => {
      const d = new Date(item.invoiceDate || item.createdAt);
      const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      return (
        d.getMonth() === lastMonth.getMonth() &&
        d.getFullYear() === lastMonth.getFullYear()
      );
    });
    const lastMonthRev = lastMonthInvoices.reduce(
      (sum, inv) => sum + (inv.total || 0),
      0,
    );
    let growth = 0;
    if (lastMonthRev > 0) growth = ((rev - lastMonthRev) / lastMonthRev) * 100;
    else if (rev > 0) growth = 100;

    return { rev, pur, netProf, margin, pending, expRatio, growth };
  }, [rawInvoices, rawPurchases, rawPayments, summaryFilter]);

  /* ===== BAR CHART DATA ===== */
  const dynamicChartData = useMemo(() => {
    let dataMap = {};
    if (chartFilter === "monthly") {
      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      months.forEach((m) => (dataMap[m] = { name: m, sales: 0, purchase: 0 }));
      rawInvoices.forEach((inv) => {
        const d = new Date(inv.invoiceDate || inv.createdAt);
        if (d.getFullYear() === new Date().getFullYear())
          dataMap[d.toLocaleString("default", { month: "short" })].sales +=
            inv.total || 0;
      });
      rawPurchases.forEach((pur) => {
        const d = new Date(pur.billDate || pur.createdAt);
        if (d.getFullYear() === new Date().getFullYear())
          dataMap[d.toLocaleString("default", { month: "short" })].purchase +=
            pur.total || 0;
      });
    } else if (chartFilter === "yearly") {
      const yr = new Date().getFullYear();
      for (let i = 4; i >= 0; i--)
        dataMap[yr - i] = { name: (yr - i).toString(), sales: 0, purchase: 0 };
      rawInvoices.forEach((inv) => {
        const y = new Date(inv.invoiceDate || inv.createdAt).getFullYear();
        if (dataMap[y]) dataMap[y].sales += inv.total || 0;
      });
      rawPurchases.forEach((pur) => {
        const y = new Date(pur.billDate || pur.createdAt).getFullYear();
        if (dataMap[y]) dataMap[y].purchase += pur.total || 0;
      });
    } else if (chartFilter === "daily") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toLocaleDateString("en-US", {
          weekday: "short",
          day: "numeric",
        });
        dataMap[dayStr] = {
          name: dayStr,
          sales: 0,
          purchase: 0,
          rawDate: d.toISOString().split("T")[0],
        };
      }
      rawInvoices.forEach((item) => {
        const d = new Date(item.invoiceDate || item.createdAt)
          .toISOString()
          .split("T")[0];
        Object.values(dataMap).forEach((e) => {
          if (e.rawDate === d) e.sales += item.total || 0;
        });
      });
      rawPurchases.forEach((item) => {
        const d = new Date(item.billDate || item.createdAt)
          .toISOString()
          .split("T")[0];
        Object.values(dataMap).forEach((e) => {
          if (e.rawDate === d) e.purchase += item.total || 0;
        });
      });
    }
    return Object.values(dataMap);
  }, [chartFilter, rawInvoices, rawPurchases]);

  /* ===== DONUT DATA ===== */
  const donutData = useMemo(
    () => [
      { name: "Total Sales", value: totalSales || 1, color: "var(--primary)" },
      {
        name: "Total Purchase",
        value: totalPurchase || 1,
        color: "var(--success)",
      },
      {
        name: "Stock Inwards",
        value: inwardCount * 1000 || 1,
        color: "var(--info)",
      },
      {
        name: "Stock Outwards",
        value: outwardCount * 1000 || 1,
        color: "var(--warning)",
      },
    ],
    [totalSales, totalPurchase, inwardCount, outwardCount],
  );

  const isDonutEmpty =
    totalSales === 0 &&
    totalPurchase === 0 &&
    inwardCount === 0 &&
    outwardCount === 0;

  const filteredInvoices = recentInvoices
    .filter(
      (inv) =>
        (inv.invoiceNo || "").toLowerCase().includes(search.toLowerCase()) ||
        (inv.clientMaster?.businessName || "")
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .slice(0, 5);

  return (
    <>
      <GlobalLoader isLoading={isLoading} />
      <PageTransition>
        <div className="admin-dashboard-page dashboard-wrapper">
          {" "}
          {/* 1. Header with Live DateTime and Sync */}
          <div className="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-3 fade-in stagger-1">
            <div>
              <h2 className="fw-bolder mb-1 section-title-gradient">
                Dashboard
              </h2>
              <p className="text-muted-custom mb-2">
                Welcome back, here is your system overview.
              </p>
              <div className="title-underline"></div>
            </div>
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <div className="live-datetime d-flex align-items-center gap-2 px-3 py-2 rounded shadow-sm border-custom">
                <i className="fas fa-clock text-primary animate-pulse"></i>
                <span
                  className="fw-bold text-main"
                  style={{ fontSize: "13px" }}
                >
                  {currentTime.toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}{" "}
                  •{" "}
                  {currentTime.toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
              <button
                className="premium-sync-btn"
                onClick={() => loadDashboardData(true)}
                disabled={isLoading || isRefreshing}
              >
                <i
                  className={`fas fa-sync-alt ${isRefreshing ? "fa-spin" : ""}`}
                ></i>{" "}
                {isRefreshing ? "Syncing..." : "Sync Data"}
              </button>
            </div>
          </div>
          {activeFy ? (
            <div className="fy-badge fade-in stagger-1">
              <i className="fas fa-calendar-alt"></i> Active Financial Year:{" "}
              {activeFy.yearName}
            </div>
          ) : (
            !isLoading && (
              <div className="fy-badge error fade-in stagger-1">
                <i className="fas fa-exclamation-circle"></i> No Active
                Financial Year Found
              </div>
            )
          )}
          {/* 2. Quick Actions */}
          <div className="quick-actions glass-card mb-5 p-3 fade-in stagger-2 hover-lift">
            <div className="d-flex flex-wrap gap-2 gap-md-3">
              <Link
                to="/admin/invoiceentry"
                className="action-btn btn-primary flex-grow-1 flex-md-grow-0"
              >
                <i className="fas fa-file-invoice icon-bounce"></i> New Invoice
              </Link>
              <Link
                to="/admin/purchaseentry"
                className="action-btn btn-success flex-grow-1 flex-md-grow-0"
              >
                <i className="fas fa-shopping-cart icon-bounce"></i> Purchase
                Entry
              </Link>
              <Link
                to="/admin/clientmaster"
                className="action-btn btn-info flex-grow-1 flex-md-grow-0"
              >
                <i className="fas fa-user-plus icon-bounce"></i> Add Customer
              </Link>
              <Link
                to="/admin/productmaster"
                className="action-btn btn-purple flex-grow-1 flex-md-grow-0"
              >
                <i className="fas fa-box icon-bounce"></i> Add Product
              </Link>
              <Link
                to="/admin/vendormaster"
                className="action-btn btn-secondary flex-grow-1 flex-md-grow-0"
              >
                <i className="fas fa-industry icon-bounce"></i> Vendors
              </Link>
            </div>
          </div>
          {/* 3. Summary Cards with GLOBAL FILTER */}
          <div className="mb-5 fade-in stagger-3">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
              <h5 className="fw-bold section-title-gradient mb-0 d-flex align-items-center gap-2">
                <i className="fas fa-wallet"></i> Financial Summary
              </h5>
              <div className="segmented-control">
                <button
                  className={summaryFilter === "today" ? "active" : ""}
                  onClick={() => setSummaryFilter("today")}
                >
                  Today
                </button>
                <button
                  className={summaryFilter === "monthly" ? "active" : ""}
                  onClick={() => setSummaryFilter("monthly")}
                >
                  Monthly
                </button>
                <button
                  className={summaryFilter === "yearly" ? "active" : ""}
                  onClick={() => setSummaryFilter("yearly")}
                >
                  Yearly
                </button>
              </div>
            </div>
            <div className="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4">
              {isLoading ? (
                <>
                  <div className="col">
                    <SkeletonCard />
                  </div>
                  <div className="col">
                    <SkeletonCard />
                  </div>
                  <div className="col">
                    <SkeletonCard />
                  </div>
                  <div className="col">
                    <SkeletonCard />
                  </div>
                </>
              ) : (
                <>
                  <SummaryCard
                    title="Total Revenue"
                    value={financialMetrics.rev}
                    isCurrency
                    color="primary"
                    glowClass="glow-primary"
                    icon="fa-coins"
                    trend={
                      financialMetrics.growth > 0
                        ? `+${financialMetrics.growth.toFixed(1)}%`
                        : `${financialMetrics.growth.toFixed(1)}%`
                    }
                  />
                  <SummaryCard
                    title="Total Purchases"
                    value={financialMetrics.pur}
                    isCurrency
                    color="success"
                    glowClass="glow-success"
                    icon="fa-shopping-bag"
                    trend={`${financialMetrics.expRatio.toFixed(1)}% Expense Ratio`}
                  />
                  <SummaryCard
                    title="Net Profit"
                    value={financialMetrics.netProf}
                    isCurrency
                    color="info"
                    glowClass="glow-info"
                    icon="fa-chart-line"
                    trend={`${financialMetrics.margin.toFixed(1)}% Margin`}
                  />
                  <SummaryCard
                    title="Pending Amount"
                    value={financialMetrics.pending}
                    isCurrency
                    color="warning"
                    glowClass="glow-warning"
                    icon="fa-clock"
                    trend="Uncollected Dues"
                  />
                </>
              )}
            </div>
          </div>
          {/* 4. Charts Section with GLOBAL FILTER */}
          <div className="mb-5 fade-in stagger-4">
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 gap-3">
              <h5 className="fw-bold section-title-gradient mb-0 d-flex align-items-center gap-2">
                <i className="fas fa-chart-area"></i> Analytics & Insights
              </h5>
              <div className="segmented-control">
                <button
                  className={chartFilter === "daily" ? "active" : ""}
                  onClick={() => setChartFilter("daily")}
                >
                  Today
                </button>
                <button
                  className={chartFilter === "monthly" ? "active" : ""}
                  onClick={() => setChartFilter("monthly")}
                >
                  Monthly
                </button>
                <button
                  className={chartFilter === "yearly" ? "active" : ""}
                  onClick={() => setChartFilter("yearly")}
                >
                  Yearly
                </button>
              </div>
            </div>
            <div className="row g-4">
              {/* Bar Chart */}
              <div className="col-xl-8">
                <div className="glass-card h-100 p-4 hover-lift">
                  <div className="mb-4">
                    <h6 className="fw-bold text-main mb-1">
                      Revenue vs Purchase Trend
                    </h6>
                    <div className="text-muted-custom small fw-medium">
                      Financial comparison over the selected period
                    </div>
                  </div>
                  <div
                    style={{ width: "100%", height: 320, position: "relative" }}
                  >
                    {isLoading ? (
                      <SkeletonBase
                        $width="100%"
                        $height="320px"
                        $radius="16px"
                      />
                    ) : dynamicChartData.every(
                        (d) => d.sales === 0 && d.purchase === 0,
                      ) ? (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PremiumEmptyState
                          title="No Financial Data"
                          subtitle="No transactions found for this period."
                        />
                      </div>
                    ) : (
                      <ResponsiveContainer>
                        <BarChart
                          data={dynamicChartData}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="var(--border)"
                            opacity={0.5}
                          />
                          <XAxis
                            dataKey="name"
                            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            dy={10}
                          />
                          <YAxis
                            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                            axisLine={false}
                            tickLine={false}
                            tickFormatter={(val) =>
                              `₹${val >= 1000 ? val / 1000 + "k" : val}`
                            }
                          />
                          <Tooltip
                            cursor={{ fill: "var(--hover-bg)" }}
                            contentStyle={{
                              backgroundColor: "var(--card)",
                              backdropFilter: "blur(18px)",
                              borderRadius: "12px",
                              border: "1px solid var(--border)",
                              color: "var(--text-main)",
                              boxShadow: "0 8px 32px rgba(21, 59, 173, 0.43)",
                            }}
                            itemStyle={{ fontWeight: "700" }}
                            labelStyle={{
                              fontWeight: "800",
                              color: "var(--text-main)",
                              marginBottom: "4px",
                              borderBottom: "1px solid var(--border)",
                              paddingBottom: "4px",
                            }}
                          />
                          <Legend
                            iconType="circle"
                            wrapperStyle={{
                              paddingTop: "20px",
                              fontSize: "12px",
                              fontWeight: "700",
                            }}
                          />
                          <Bar
                            dataKey="sales"
                            name="Revenue"
                            radius={[6, 6, 0, 0]}
                            animationDuration={1000}
                          >
                            {dynamicChartData.map((e, i) => (
                              <Cell
                                key={`cs-${i}`}
                                fill="url(#colorSales)"
                                className="chart-bar"
                              />
                            ))}
                          </Bar>
                          <Bar
                            dataKey="purchase"
                            name="Purchase"
                            radius={[6, 6, 0, 0]}
                            animationDuration={1000}
                          >
                            {dynamicChartData.map((e, i) => (
                              <Cell
                                key={`cp-${i}`}
                                fill="url(#colorPurchase)"
                                className="chart-bar"
                              />
                            ))}
                          </Bar>
                          <defs>
                            <linearGradient
                              id="colorSales"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="var(--primary)"
                                stopOpacity={1}
                              />
                              <stop
                                offset="100%"
                                stopColor="var(--primary)"
                                stopOpacity={0.4}
                              />
                            </linearGradient>
                            <linearGradient
                              id="colorPurchase"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="var(--success)"
                                stopOpacity={1}
                              />
                              <stop
                                offset="100%"
                                stopColor="var(--success)"
                                stopOpacity={0.4}
                              />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>

              {/* Donut Chart */}
              <div className="col-xl-4">
                <div className="glass-card h-100 p-4 hover-lift d-flex flex-column">
                  <div className="mb-4">
                    <h6 className="fw-bold text-main mb-1">
                      Lifetime Distribution
                    </h6>
                    <div className="text-muted-custom small fw-medium">
                      Overall metric spread
                    </div>
                  </div>
                  <div
                    className="flex-grow-1 position-relative d-flex justify-content-center align-items-center"
                    style={{ minHeight: "260px" }}
                  >
                    {isLoading ? (
                      <SkeletonBase
                        $width="200px"
                        $height="200px"
                        $radius="50%"
                        style={{ margin: "auto" }}
                      />
                    ) : isDonutEmpty ? (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PremiumEmptyState
                          title="No Analytics Data"
                          subtitle="Insufficient data available."
                        />
                      </div>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "var(--card)",
                                backdropFilter: "blur(18px)",
                                borderRadius: "12px",
                                border: "1px solid var(--border)",
                                color: "var(--text-main)",
                                boxShadow: "0 8px 32px rgba(21, 59, 173, 0.43)",
                              }}
                              itemStyle={{ fontWeight: "700" }}
                            />
                            <Pie
                              data={donutData}
                              cx="50%"
                              cy="50%"
                              innerRadius={75}
                              outerRadius={105}
                              paddingAngle={4}
                              dataKey="value"
                              animationDuration={1000}
                              stroke="none"
                            >
                              {donutData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={entry.color}
                                  className="chart-pie-segment"
                                />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                        <div
                          className="position-absolute d-flex flex-column align-items-center justify-content-center"
                          style={{ pointerEvents: "none" }}
                        >
                          <span className="text-muted-custom small fw-medium">
                            Overview
                          </span>
                          <span className="fs-5 fw-bold text-main">
                            <i className="fas fa-chart-pie opacity-50"></i>
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                  {!isLoading && !isDonutEmpty && (
                    <div className="mt-2 d-flex flex-wrap justify-content-center gap-3">
                      {donutData.map((item, idx) => (
                        <div
                          key={idx}
                          className="d-flex align-items-center gap-2 small text-muted-custom fw-medium hover-text-highlight"
                        >
                          <span
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: item.color,
                              boxShadow: `0 0 6px ${item.color}`,
                            }}
                          ></span>
                          {item.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* 5. Listings / Recent Data */}
          <div className="row g-4 fade-in stagger-5">
            <div className="col-xl-8">
              <div className="glass-card h-100 p-4 hover-lift">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom border-custom pb-3 gap-3">
                  <h6 className="mb-0 fw-bold section-title-gradient">
                    Recent Invoices
                  </h6>
                  <div className="search-pill w-100 w-md-auto">
                    <i className="fas fa-search"></i>
                    <input
                      type="text"
                      placeholder="Search invoices..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>

                <div className="invoice-list">
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="mb-2">
                        <SkeletonBase
                          $width="100%"
                          $height="64px"
                          $radius="12px"
                        />
                      </div>
                    ))
                  ) : filteredInvoices.length > 0 ? (
                    filteredInvoices.map((inv, i) => {
                      const clientName =
                        inv.clientMaster?.businessName || "Cash Customer";
                      return (
                        <div
                          key={i}
                          className="list-row d-flex flex-wrap justify-content-between align-items-center py-3 px-3 mb-2 rounded"
                        >
                          <div className="d-flex align-items-center gap-3">
                            <div className="avatar-circle bg-primary-soft text-primary shadow-sm">
                              {clientName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <strong className="text-main d-block">
                                {inv.invoiceNo || `#INV-00${inv.id}`}
                              </strong>
                              <span className="text-muted-custom small">
                                {clientName}
                              </span>
                            </div>
                          </div>
                          <div className="d-flex align-items-center gap-4 w-100 w-sm-auto justify-content-between mt-3 mt-sm-0">
                            <div className="text-start text-sm-end">
                              <div className="fw-bold text-main">
                                ₹{inv.total?.toLocaleString("en-IN") || 0}
                              </div>
                              <div className="text-muted-custom small">
                                {new Date(
                                  inv.invoiceDate || inv.createdAt,
                                ).toLocaleDateString("en-IN")}
                              </div>
                            </div>
                            <button
                              className="action-btn btn-outline"
                              onClick={() => viewInvoice(inv.id)}
                            >
                              View
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-4 d-flex justify-content-center">
                      <PremiumEmptyState
                        title="No Recent Invoices"
                        subtitle="No recent billing activity available."
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-xl-4">
              <div className="glass-card h-100 p-4 hover-lift d-flex flex-column">
                <h6 className="fw-bold mb-4 section-title-gradient border-bottom border-custom pb-3">
                  Business Entities
                </h6>

                {isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="mb-3">
                      <SkeletonBase
                        $width="100%"
                        $height="70px"
                        $radius="12px"
                      />
                    </div>
                  ))
                ) : (
                  <>
                    <div className="list-row d-flex justify-content-between align-items-center py-3 px-3 rounded mb-3 border border-custom">
                      <div className="d-flex align-items-center gap-3">
                        <div className="icon-box text-primary bg-primary-soft shadow-sm">
                          <i className="fas fa-building"></i>
                        </div>
                        <span className="fw-medium text-muted-custom">
                          Total Clients
                        </span>
                      </div>
                      <h4 className="fw-bold mb-0 text-main">
                        <AnimatedNumber value={customerCount} />
                      </h4>
                    </div>

                    <div className="list-row d-flex justify-content-between align-items-center py-3 px-3 rounded mb-3 border border-custom">
                      <div className="d-flex align-items-center gap-3">
                        <div className="icon-box text-warning bg-warning-soft shadow-sm">
                          <i className="fas fa-industry"></i>
                        </div>
                        <span className="fw-medium text-muted-custom">
                          Total Vendors
                        </span>
                      </div>
                      <h4 className="fw-bold mb-0 text-main">
                        <AnimatedNumber value={vendorCount} />
                      </h4>
                    </div>

                    <div className="list-row d-flex justify-content-between align-items-center py-3 px-3 rounded border border-custom">
                      <div className="d-flex align-items-center gap-3">
                        <div className="icon-box text-purple bg-purple-soft shadow-sm">
                          <i className="fas fa-boxes"></i>
                        </div>
                        <span className="fw-medium text-muted-custom">
                          Total Products
                        </span>
                      </div>
                      <h4 className="fw-bold mb-0 text-main">
                        <AnimatedNumber value={productCount} />
                      </h4>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    </>
  );
}

/* ===== PREMIUM WIDER SUMMARY CARD (SaaS STYLE) ===== */
function SummaryCard({
  title,
  value,
  color,
  glowClass,
  icon,
  isCurrency,
  isPercentage,
  trend,
}) {
  return (
    <div className="col">
      <div
        className={`glass-card p-3 p-xl-4 h-100 hover-lift summary-card ${glowClass}`}
      >
        <div className="d-flex align-items-center gap-3">
          <div
            className={`icon-box text-${color} bg-${color}-soft card-icon-box shadow-sm flex-shrink-0`}
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              fontSize: "20px",
            }}
          >
            <i className={`fas ${icon}`}></i>
          </div>
          <div className="flex-grow-1">
            <span
              className="text-muted-custom fw-bold text-uppercase tracking-wide d-block mb-1"
              style={{ fontSize: "11px" }}
            >
              {title}
            </span>
            <h3
              className="fw-bolder mb-0 text-main"
              style={{ fontSize: "22px", lineHeight: "1.2" }}
            >
              <AnimatedNumber
                value={value}
                isCurrency={isCurrency}
                isPercentage={isPercentage}
              />
            </h3>
          </div>
        </div>
        {trend && (
          <div
            className={`text-sm mt-3 fw-bold px-2 py-1 rounded d-inline-flex align-items-center gap-1 ${trend.includes("+") || trend.includes("Margin") ? "bg-success-soft text-success" : trend.includes("-") || trend.includes("Dues") ? "bg-danger-soft text-danger" : "bg-secondary-soft text-secondary"}`}
            style={{ fontSize: "11px" }}
          >
            {trend}
          </div>
        )}
      </div>
    </div>
  );
}
