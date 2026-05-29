import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  PackageMinus,
  PackageOpen,
  RefreshCcw,
  Calendar,
  AlertCircle,
  RotateCcw,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  CheckCircle2,
  FileText,
  Eye,
  TrendingDown,
  Users,
  Activity,
  Clock,
  Hash,
  Box,
  Layers,
  BarChart3,
  Zap,
  Shield,
  ArrowUpRight,
} from "lucide-react";
import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
} from "../../../Services/axiosService";

import {
  successAlert,
  errorAlert,
  warningAlert,
  confirmAlert,
  infoAlert,
} from "./../../../Services/sweetAlert";

import GlobalLoader from "../../components/common/GlobalLoader.jsx";
import PageTransition from "../../components/common/PageTransition.jsx";
import PremiumEmptyState from "../../components/common/PremiumEmptyState.jsx";
import {
  SkeletonCard,
  SkeletonTableRows,
} from "../../components/common/SkeletonLoader.jsx";

/* ─────────────────────────────────────────────
   ANIMATED NUMBER COUNTER
───────────────────────────────────────────── */
const AnimatedNumber = ({ value }) => {
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
  return <>{Math.ceil(count)}</>;
};

/* ─────────────────────────────────────────────
   STATUS BADGE HELPER
───────────────────────────────────────────── */
const getStatusVariant = (itemsCount) => {
  const n = itemsCount || 0;
  if (n === 0) return { label: "Pending", color: "warning" };
  if (n < 3) return { label: "Partial", color: "info" };
  return { label: "Complete", color: "success" };
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function OutwardEntry() {
  const emptyForm = {
    id: 0,
    staffMasterId: "",
    outwardDate: new Date().toISOString().split("T")[0],
    remark: "",
  };

  const emptyItemForm = {
    inwardStockId: "",
    qty: "",
    outwardDate: "",
  };

  /* ── Master States ── */
  const [outwards, setOutwards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [staffs, setStaffs] = useState([]);

  /* ── Sub-Module (Stock Used) States ── */
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [selectedOutward, setSelectedOutward] = useState(null);
  const [outwardDetails, setOutwardDetails] = useState(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemForm, setItemForm] = useState(emptyItemForm);
  const [itemSubmitLoading, setItemSubmitLoading] = useState(false);

  /* ── Dropdowns ── */
  const [inwardStocksList, setInwardStocksList] = useState([]);

  /* ── Filter States ── */
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  /* ── Pagination ── */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  /* ── Premium Enhancement States ── */
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFy, setActiveFy] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  /* ═══════════════ FETCH INITIAL DATA ═══════════════ */
  const fetchInitialData = async () => {
    setInitialLoad(true);
    try {
      const fyRes = await getRequest("FinancialYear/List").catch(() => null);
      if (
        fyRes &&
        (fyRes.status === "OK" || fyRes.Status === "OK") &&
        (fyRes.result || fyRes.Result)
      ) {
        const resultData = fyRes.result || fyRes.Result;
        const currentActiveFy = resultData.find(
          (y) => (y.isActive || y.IsActive) && !(y.isDelete || y.IsDelete),
        );
        setActiveFy(currentActiveFy || null);
      }
      await Promise.all([
        fetchOutwards(false, true),
        fetchStaffs(),
        fetchInwardStocks(),
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setInitialLoad(false), 700);
    }
  };

  /* ═══════════════ FETCH DATA ═══════════════ */
  const fetchOutwards = async (isRefresh = false, isInit = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else if (!isInit) setLoading(true);
      const res = await getRequest("Outward/ListOutward");
      if (res && (res.status === "OK" || res.Status === "OK")) {
        const outwardData = res.result || res.Result || [];

        try {
          const stockUsedRes = await getRequest("StockUsed/ListStockUsed");

          if (
            stockUsedRes &&
            (stockUsedRes.status === "OK" || stockUsedRes.Status === "OK")
          ) {
            const stockItems = stockUsedRes.result || stockUsedRes.Result || [];

            const updatedOutwards = outwardData.map((outward) => {
              const outwardId = outward.id || outward.Id;

              const relatedItems = stockItems.filter(
                (item) =>
                  Number(item.outwardMasterId || item.OutwardMasterId) ===
                  Number(outwardId),
              );

              return {
                ...outward,
                itemsCount: relatedItems.length,
                totalConsumedQty: relatedItems.reduce(
                  (sum, item) => sum + Number(item.qty || item.Qty || 0),
                  0,
                ),
              };
            });

            setOutwards(updatedOutwards);
          } else {
            setOutwards(outwardData);
          }
        } catch {
          setOutwards(outwardData);
        }
      }
    } catch (err) {
      errorAlert("Error", "Failed to fetch outward entries");
    } finally {
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 600);
      else if (!isInit) setTimeout(() => setLoading(false), 500);
    }
  };

  const fetchStaffs = async () => {
    try {
      const res = await getRequest("StaffMaster/List");
      if (res && (res.status === "OK" || res.Status === "OK"))
        setStaffs(res.result || res.Result || []);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchInwardStocks = async () => {
    try {
      const res = await getRequest("InwardStock/List");
      if (res && (res.status === "OK" || res.Status === "OK"))
        setInwardStocksList(res.result || res.Result || []);
    } catch (error) {
      console.error(error);
    }
  };

  // const fetchOutwardItems = async (outwardId) => {
  //   try {
  //     setItemsLoading(true);
  //     const res = await getRequest(`StockUsed/ListStockUsed`);
  //     if (res && (res.status === "OK" || res.Status === "OK")) {
  //       const allItems = res.result || res.Result || [];
  //       const filteredItems = allItems.filter(
  //         (item) =>
  //           Number(item.outwardMasterId || item.OutwardMasterId) ===
  //           Number(outwardId),
  //       );
  //       setOutwardItems(filteredItems);
  //     }
  //   } catch (err) {
  //     console.error(err);
  //   } finally {
  //     setItemsLoading(false);
  //   }
  // };

  /* ═══════════════ HANDLERS ═══════════════ */
  const handleRefresh = () => {
    fetchOutwards(true);
    fetchStaffs();
    fetchInwardStocks();
  };

  const handleResetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setSortOrder("newest");
    setCurrentPage(1);
  };

  const isFyLocked = activeFy && (activeFy.isClosed || activeFy.IsClosed);
  const activeFiltersCount = [search, fromDate, toDate].filter(Boolean).length;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setItemForm({ ...itemForm, [name]: value });
  };

  const handleAddClick = () => {
    if (isFyLocked || !activeFy)
      return warningAlert(
        "Financial Year Locked",
        "Cannot modify outwards in closed or missing financial year.",
      );
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleEdit = async (id) => {
    if (isFyLocked || !activeFy)
      return warningAlert(
        "Financial Year Locked",
        "Cannot modify outwards in closed or missing financial year.",
      );
    try {
      const res = await getRequest(`Outward/DetailOutward/${id}`);
      if (
        res &&
        (res.status === "OK" || res.Status === "OK") &&
        (res.result || res.Result)
      ) {
        const data = res.result || res.Result;
        setForm({
          id: data.id || data.Id || 0,
          staffMasterId: data.staffMasterId || data.StaffMasterId || "",
          outwardDate: data.outwardDate
            ? data.outwardDate.split("T")[0]
            : data.OutwardDate
              ? data.OutwardDate.split("T")[0]
              : "",
          remark: data.remark || data.Remark || "",
        });
        setShowModal(true);
      } else {
        errorAlert("Error", res.message || res.Result || "Record not found");
      }
    } catch (err) {
      errorAlert(
        "Error",
        err?.Result ||
          err?.result ||
          err?.message ||
          "Server error while fetching details.",
      );
    }
  };

  const handleDelete = async (id) => {
    if (isFyLocked || !activeFy)
      return warningAlert(
        "Financial Year Locked",
        "Cannot delete outwards in closed or missing financial year.",
      );
    const confirm = await confirmAlert(
      "Are you sure?",
      "This outward entry will be permanently deleted.",
    );
    if (!confirm.isConfirmed) return;
    try {
      const res = await deleteRequest(`Outward/DeleteOutward/${id}`);
      if (res && (res.status === "OK" || res.Status === "OK")) {
        successAlert("Deleted", "Outward record removed");
        fetchOutwards();
      } else
        throw new Error(
          res.message || res.Result || res.result || "Delete failed",
        );
    } catch (err) {
      errorAlert(
        "Error",
        err?.Result ||
          err?.result ||
          err?.message ||
          "Delete operation failed.",
      );
    }
  };

  const handleSave = async () => {
    if (!form.staffMasterId || !form.outwardDate)
      return warningAlert("Validation", "Staff and Outward Date are required.");
    const today = new Date().toISOString().split("T")[0];
    if (form.outwardDate > today)
      return warningAlert(
        "Validation",
        "Outward date cannot be in the future.",
      );
    try {
      setSubmitLoading(true);
      const payload = {
        id: Number(form.id) || 0,
        staffMasterId: Number(form.staffMasterId),
        remark: form.remark || "",
        outwardDate: form.outwardDate.includes("T")
          ? form.outwardDate
          : `${form.outwardDate}T00:00:00.000Z`,
      };
      const response =
        payload.id > 0
          ? await putRequest("Outward/UpdateOutward", payload)
          : await postRequest("Outward/SaveOutward", payload);
      if (response && (response.status === "OK" || response.Status === "OK")) {
        successAlert(
          "Success",
          payload.id > 0 ? "Record updated." : "Outward created successfully.",
        );
        setShowModal(false);
        setForm(emptyForm);
        fetchOutwards();
      } else
        throw new Error(
          response.message ||
            response.Result ||
            response.result ||
            "Could not save entry",
        );
    } catch (err) {
      errorAlert(
        "API Error",
        err?.Result ||
          err?.result ||
          err?.message ||
          "Server connection failed",
      );
    } finally {
      setSubmitLoading(false);
    }
  };

  /* ═══════════════ ITEMS SUB-MODULE HANDLERS ═══════════════ */
  const handleViewItems = async (outward) => {
    try {
      setItemsLoading(true);

      const outwardId = outward.id || outward.Id;

      const res = await getRequest(`Outward/DetailOutward/${outwardId}`);

      if (res && (res.status === "OK" || res.Status === "OK")) {
        setOutwardDetails(res.result || res.Result);
        setSelectedOutward(outward);
        setShowItemsModal(true);
      }
    } catch (err) {
      console.error(err);
      errorAlert("Error", "Failed to load outward details");
    } finally {
      setItemsLoading(false);
    }
  };

  /*
   * PRESERVED FOR FUTURE USE — Stock item save/delete handlers
   * handleSaveItem: calls StockUsed/SaveStockUsed with payload { id, inwardStockId, qty, outwardMasterId, outwardDate }
   * handleDeleteItem: calls StockUsed/DeleteStockUsed/{itemId}
   */
  const handleSaveItem = async () => {
    if (isFyLocked || !activeFy)
      return warningAlert("Financial Year Locked", "Action not allowed.");
    if (!itemForm.inwardStockId || !itemForm.qty)
      return warningAlert(
        "Validation",
        "Stock Item and Quantity are required.",
      );
    try {
      setItemSubmitLoading(true);
      const outDate =
        itemForm.outwardDate ||
        selectedOutward.outwardDate ||
        selectedOutward.OutwardDate;
      const payload = {
        id: 0,
        inwardStockId: Number(itemForm.inwardStockId),
        qty: Number(itemForm.qty),
        outwardMasterId: Number(selectedOutward.id || selectedOutward.Id),
        outwardDate: outDate.includes("T")
          ? outDate
          : `${outDate}T00:00:00.000Z`,
      };
      const res = await postRequest("StockUsed/SaveStockUsed", payload);
      if (res && (res.status === "OK" || res.Status === "OK")) {
        successAlert("Success", "Item added to outward record.");
        setItemForm({
          ...emptyItemForm,
          outwardDate:
            selectedOutward.outwardDate || selectedOutward.OutwardDate,
        });
        handleViewItems(selectedOutward);
        fetchOutwards();
      } else
        throw new Error(
          res.message || res.Result || res.result || "Could not add item.",
        );
    } catch (err) {
      errorAlert(
        "API Error",
        err?.Result ||
          err?.result ||
          err?.message ||
          "Server connection failed",
      );
    } finally {
      setItemSubmitLoading(false);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (isFyLocked || !activeFy)
      return warningAlert("Financial Year Locked", "Action not allowed.");
    const confirm = await confirmAlert("Remove Item?", "Are you sure?");
    if (!confirm.isConfirmed) return;
    try {
      const res = await deleteRequest(`StockUsed/DeleteStockUsed/${itemId}`);
      if (res && (res.status === "OK" || res.Status === "OK")) {
        successAlert("Removed", "Item removed successfully.");
        handleViewItems(selectedOutward);
        fetchOutwards();
      } else
        throw new Error(
          res.message || res.Result || res.result || "Delete failed",
        );
    } catch (err) {
      errorAlert(
        "Error",
        err?.Result ||
          err?.result ||
          err?.message ||
          "Delete operation failed.",
      );
    }
  };

  const exportOutwardReport = () =>
    infoAlert("Export", "Export functionality triggered.");

  /* ═══════════════ FILTER & PAGINATION ═══════════════ */
  const processedData = useMemo(() => {
    let result = [...outwards];
    if (search)
      result = result.filter(
        (p) =>
          (p.staffName &&
            p.staffName.toLowerCase().includes(search.toLowerCase())) ||
          (p.remark && p.remark.toLowerCase().includes(search.toLowerCase())) ||
          (p.id && p.id.toString().includes(search.toLowerCase())),
      );
    if (fromDate)
      result = result.filter(
        (p) => new Date(p.outwardDate || p.OutwardDate) >= new Date(fromDate),
      );
    if (toDate)
      result = result.filter(
        (p) => new Date(p.outwardDate || p.OutwardDate) <= new Date(toDate),
      );
    switch (sortOrder) {
      case "a-z":
        result.sort((a, b) =>
          (a.staffName || "").localeCompare(b.staffName || ""),
        );
        break;
      case "oldest":
        result.sort(
          (a, b) =>
            new Date(a.outwardDate || a.OutwardDate) -
            new Date(b.outwardDate || b.OutwardDate),
        );
        break;
      default:
        result.sort(
          (a, b) =>
            new Date(b.outwardDate || b.OutwardDate) -
            new Date(a.outwardDate || a.OutwardDate),
        );
    }
    return result;
  }, [outwards, search, fromDate, toDate, sortOrder]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentRecords = useMemo(
    () => processedData.slice(indexOfFirst, indexOfLast),
    [processedData, indexOfFirst, indexOfLast],
  );
  const totalPages = Math.ceil(processedData.length / itemsPerPage);
  useEffect(() => {
    setCurrentPage(1);
  }, [search, fromDate, toDate, sortOrder]);

  /* ═══════════════ DASHBOARD METRICS ═══════════════ */
  const todayStr = new Date().toISOString().split("T")[0];
  const todaysOutwards = outwards.filter((s) => {
    const d = s.outwardDate || s.OutwardDate;
    return d ? d.split("T")[0] === todayStr : false;
  }).length;

  const totalItems = outwards.reduce(
    (acc, o) => acc + (o.itemsCount || o.ItemsCount || 0),
    0,
  );
  const lastActivity =
    outwards.length > 0
      ? new Date(
          Math.max(
            ...outwards.map(
              (o) => new Date(o.outwardDate || o.OutwardDate || 0),
            ),
          ),
        ).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  /* ════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════ */
  return (
    <>
      <GlobalLoader isLoading={initialLoad} />
      <PageTransition>
        <PageShell>
          {/* ─── PREMIUM PAGE HEADER ─── */}
          <PageHeader
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <HeaderLeft>
              <ModuleIcon>
                <TrendingDown size={22} />
              </ModuleIcon>
              <HeaderText>
                <PageTitle>Stock Consumption</PageTitle>
                <Breadcrumb>
                  <BreadcrumbLink to="/admin/dashboard">Home</BreadcrumbLink>
                  <BreadSep>/</BreadSep>
                  <BreadcrumbLink to="#">Inventory</BreadcrumbLink>
                  <BreadSep>/</BreadSep>
                  <BreadActive>Stock Outward</BreadActive>
                </Breadcrumb>
              </HeaderText>
            </HeaderLeft>

            <HeaderRight>
              {activeFy && (
                <FyChip className={isFyLocked ? "locked" : "active"}>
                  <Shield size={12} />
                  {activeFy.yearName || activeFy.YearName}
                  {isFyLocked && <LockedTag>LOCKED</LockedTag>}
                </FyChip>
              )}
              {!activeFy && !initialLoad && (
                <FyChip className="error">
                  <AlertCircle size={12} /> No Active FY
                </FyChip>
              )}
              <SyncIndicator $active={isRefreshing}>
                <span className="dot" />
                <span className="label">
                  {isRefreshing ? "Syncing" : "Live"}
                </span>
              </SyncIndicator>
              <HeaderBtn
                variant="ghost"
                onClick={handleRefresh}
                disabled={loading || isRefreshing || initialLoad}
              >
                <RefreshCcw size={15} className={isRefreshing ? "spin" : ""} />
                {isRefreshing ? "Syncing…" : "Refresh"}
              </HeaderBtn>
              <HeaderBtn variant="outline" onClick={exportOutwardReport}>
                <FileText size={15} />
                Export
              </HeaderBtn>
              <HeaderBtn
                variant="primary"
                onClick={handleAddClick}
                disabled={isFyLocked}
                title={isFyLocked ? "Financial year is locked" : ""}
              >
                <Plus size={15} />
                New Entry
              </HeaderBtn>
            </HeaderRight>
          </PageHeader>

          {/* ─── KPI SUMMARY DASHBOARD ─── */}
          <KpiGrid
            as={motion.div}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            {initialLoad ? (
              [0, 1, 2, 3, 4].map((i) => <KpiSkeleton key={i} />)
            ) : (
              <>
                <KpiCard $accent="#3b82f6">
                  <KpiIconWrap $color="#3b82f6">
                    <Layers size={20} />
                  </KpiIconWrap>
                  <KpiBody>
                    <KpiLabel>Total Outward Records</KpiLabel>
                    <KpiValue>
                      <AnimatedNumber value={outwards.length} />
                    </KpiValue>
                  </KpiBody>
                  <KpiGlow $color="#3b82f6" />
                </KpiCard>
                <KpiCard $accent="#10b981">
                  <KpiIconWrap $color="#10b981">
                    <Calendar size={20} />
                  </KpiIconWrap>
                  <KpiBody>
                    <KpiLabel>Today's Consumption</KpiLabel>
                    <KpiValue>
                      <AnimatedNumber value={todaysOutwards} />
                    </KpiValue>
                  </KpiBody>
                  <KpiGlow $color="#10b981" />
                </KpiCard>
                <KpiCard $accent="#8b5cf6">
                  <KpiIconWrap $color="#8b5cf6">
                    <Users size={20} />
                  </KpiIconWrap>
                  <KpiBody>
                    <KpiLabel>Total Staff Assigned</KpiLabel>
                    <KpiValue>
                      <AnimatedNumber value={staffs.length} />
                    </KpiValue>
                  </KpiBody>
                  <KpiGlow $color="#8b5cf6" />
                </KpiCard>
                <KpiCard $accent="#f59e0b">
                  <KpiIconWrap $color="#f59e0b">
                    <Box size={20} />
                  </KpiIconWrap>
                  <KpiBody>
                    <KpiLabel>Total Consumed Items</KpiLabel>
                    <KpiValue>
                      <AnimatedNumber value={totalItems} />
                    </KpiValue>
                  </KpiBody>
                  <KpiGlow $color="#f59e0b" />
                </KpiCard>
                <KpiCard $accent="#06b6d4">
                  <KpiIconWrap $color="#06b6d4">
                    <Activity size={20} />
                  </KpiIconWrap>
                  <KpiBody>
                    <KpiLabel>Last Activity</KpiLabel>
                    <KpiValue style={{ fontSize: "1.1rem" }}>
                      {lastActivity}
                    </KpiValue>
                  </KpiBody>
                  <KpiGlow $color="#06b6d4" />
                </KpiCard>
              </>
            )}
          </KpiGrid>

          {/* ─── MAIN TABLE CARD ─── */}
          <TableCard
            as={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* FILTER BAR */}
            <FilterBar>
              <FilterField $grow={2}>
                <Search size={14} className="fi" />
                <input
                  type="text"
                  placeholder="Search by staff, remark, or ID…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <ClearBtn onClick={() => setSearch("")}>
                    <X size={12} />
                  </ClearBtn>
                )}
              </FilterField>

              <FilterField>
                <Filter size={14} className="fi" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="a-z">Staff A→Z</option>
                </select>
              </FilterField>

              <FilterField $date>
                <span className="lbl">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </FilterField>

              <FilterField $date>
                <span className="lbl">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </FilterField>

              <ResetBtn onClick={handleResetFilters}>
                <RotateCcw size={13} />
                Reset
                {activeFiltersCount > 0 && (
                  <FilterBadge>{activeFiltersCount}</FilterBadge>
                )}
              </ResetBtn>
            </FilterBar>

            {/* RESULTS INFO */}
            {!initialLoad && !loading && (
              <ResultsInfo>
                <span>
                  {processedData.length === 0
                    ? "No records found"
                    : `${processedData.length} record${processedData.length !== 1 ? "s" : ""} found`}
                  {activeFiltersCount > 0 && " (filtered)"}
                </span>
              </ResultsInfo>
            )}

            {/* DATA GRID */}
            <DataGridWrap>
              <DataGrid>
                <thead>
                  <tr>
                    <Th>Outward ID</Th>
                    <Th>Date</Th>
                    <Th>Staff Member</Th>
                    <Th>Remark</Th>
                    <Th center>Items</Th>
                    <Th center>Status</Th>
                    <Th center>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {initialLoad || loading || isRefreshing ? (
                    <SkeletonTableRows rows={itemsPerPage} columns={7} />
                  ) : currentRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        style={{ padding: "4rem 0", borderBottom: "none" }}
                      >
                        <PremiumEmptyState
                          icon={<PackageMinus size={40} strokeWidth={1.2} />}
                          title="No Consumption Records"
                          subtitle="Stock outward entries generated from sales will appear here."
                        />
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((p, i) => {
                      const status = getStatusVariant(p.itemsCount);
                      const dateStr =
                        p.outwardDate || p.OutwardDate
                          ? new Date(
                              p.outwardDate || p.OutwardDate,
                            ).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—";
                      return (
                        <DataRow
                          key={p.id || p.Id}
                          as={motion.tr}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                        >
                          <Td>
                            <OutwardId>
                              <Hash size={11} />
                              OUT-{p.id || p.Id || "N/A"}
                            </OutwardId>
                          </Td>
                          <Td>
                            <DateCell>
                              <Clock size={12} />
                              {dateStr}
                            </DateCell>
                          </Td>
                          <Td>
                            <StaffCell>
                              <StaffAvatar>
                                {(p.staffName ||
                                  p.StaffName ||
                                  "?")[0].toUpperCase()}
                              </StaffAvatar>
                              <span>{p.staffName || p.StaffName || "—"}</span>
                            </StaffCell>
                          </Td>
                          <Td>
                            <RemarkCell>
                              {p.remark || p.Remark || (
                                <span className="muted">—</span>
                              )}
                            </RemarkCell>
                          </Td>
                          <Td center>
                            <ItemsChip>{p.itemsCount ?? 0}</ItemsChip>
                          </Td>
                          <Td center>
                            <StatusBadge $variant={status.color}>
                              {status.label}
                            </StatusBadge>
                          </Td>
                          <Td center>
                            <ActionsGroup>
                              <ActionBtn
                                $type="view"
                                title="View Stock Consumption"
                                onClick={() => handleViewItems(p)}
                              >
                                <Eye size={14} />
                              </ActionBtn>
                              <ActionBtn
                                $type="edit"
                                title={
                                  isFyLocked
                                    ? "Financial year locked"
                                    : "Edit Record"
                                }
                                onClick={() => handleEdit(p.id || p.Id)}
                                disabled={isFyLocked}
                              >
                                <Edit3 size={14} />
                              </ActionBtn>
                              <ActionBtn
                                $type="delete"
                                title={
                                  isFyLocked
                                    ? "Financial year locked"
                                    : "Delete Record"
                                }
                                onClick={() => handleDelete(p.id || p.Id)}
                                disabled={isFyLocked}
                              >
                                <Trash2 size={14} />
                              </ActionBtn>
                            </ActionsGroup>
                          </Td>
                        </DataRow>
                      );
                    })
                  )}
                </tbody>
              </DataGrid>
            </DataGridWrap>

            {/* PAGINATION */}
            {!loading &&
              !initialLoad &&
              processedData.length > itemsPerPage && (
                <PaginationRow>
                  <PaginationInfo>
                    Showing{" "}
                    <strong>
                      {indexOfFirst + 1}–
                      {Math.min(indexOfLast, processedData.length)}
                    </strong>{" "}
                    of <strong>{processedData.length}</strong>
                  </PaginationInfo>
                  <PaginationControls>
                    <PageBtn
                      onClick={() => setCurrentPage((c) => c - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft size={15} /> Prev
                    </PageBtn>
                    <PageIndicator>
                      {currentPage} / {totalPages || 1}
                    </PageIndicator>
                    <PageBtn
                      onClick={() => setCurrentPage((c) => c + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next <ChevronRight size={15} />
                    </PageBtn>
                  </PaginationControls>
                </PaginationRow>
              )}
          </TableCard>

          {/* ════════════════════════════════════════════════
              ADD / EDIT OUTWARD MODAL
          ════════════════════════════════════════════════ */}
          <AnimatePresence>
            {showModal && (
              <Overlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => {
                  if (!submitLoading) {
                    setShowModal(false);
                    setForm(emptyForm);
                  }
                }}
              >
                <ModalBox
                  style={{ maxWidth: "580px" }}
                  initial={{ scale: 0.94, y: 24, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.94, y: 24, opacity: 0 }}
                  transition={{ type: "spring", damping: 26, stiffness: 320 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ModalHead>
                    <ModalIconWrap $color="#3b82f6">
                      <PackageOpen size={18} />
                    </ModalIconWrap>
                    <ModalTitle>
                      {form.id > 0 ? "Edit Outward Entry" : "New Outward Entry"}
                    </ModalTitle>
                    <CloseBtn
                      onClick={() => {
                        setShowModal(false);
                        setForm(emptyForm);
                      }}
                      disabled={submitLoading}
                    >
                      <X size={18} />
                    </CloseBtn>
                  </ModalHead>

                  <ModalBody>
                    <FormRow>
                      <FormGroup>
                        <FormLabel>
                          Assigned Staff <Required>*</Required>
                        </FormLabel>
                        <FormSelect
                          name="staffMasterId"
                          value={form.staffMasterId}
                          onChange={handleChange}
                          disabled={submitLoading}
                          autoFocus
                        >
                          <option value="">— Choose Staff —</option>
                          {staffs.map((s, idx) => (
                            <option
                              key={s.id || s.Id || idx}
                              value={s.id || s.Id}
                            >
                              {s.fullName || s.FullName}
                            </option>
                          ))}
                        </FormSelect>
                      </FormGroup>

                      <FormGroup>
                        <FormLabel>
                          Outward Date <Required>*</Required>
                        </FormLabel>
                        <FormInput
                          type="date"
                          name="outwardDate"
                          value={form.outwardDate}
                          onChange={handleChange}
                          disabled={submitLoading}
                        />
                      </FormGroup>
                    </FormRow>

                    <FormGroup>
                      <FormLabel>Remarks / Notes</FormLabel>
                      <FormInput
                        type="text"
                        name="remark"
                        value={form.remark}
                        onChange={handleChange}
                        placeholder="e.g. Purpose or project code…"
                        disabled={submitLoading}
                      />
                    </FormGroup>
                  </ModalBody>

                  <ModalFoot>
                    <ModalBtn
                      $variant="cancel"
                      onClick={() => {
                        setShowModal(false);
                        setForm(emptyForm);
                      }}
                      disabled={submitLoading}
                    >
                      <X size={14} /> Cancel
                    </ModalBtn>
                    <ModalBtn
                      $variant="save"
                      onClick={handleSave}
                      disabled={submitLoading}
                    >
                      {submitLoading ? (
                        <RefreshCcw size={14} className="spin" />
                      ) : (
                        <CheckCircle2 size={14} />
                      )}
                      {submitLoading
                        ? "Saving…"
                        : form.id > 0
                          ? "Update Entry"
                          : "Save Entry"}
                    </ModalBtn>
                  </ModalFoot>
                </ModalBox>
              </Overlay>
            )}
          </AnimatePresence>

          {/* ════════════════════════════════════════════════
              STOCK CONSUMPTION DETAILS MODAL (VIEW ONLY)
          ════════════════════════════════════════════════ */}
          <AnimatePresence>
            {showItemsModal && selectedOutward && (
              <Overlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowItemsModal(false)}
              >
                <ModalBox
                  style={{ maxWidth: "860px" }}
                  initial={{ scale: 0.94, y: 24, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.94, y: 24, opacity: 0 }}
                  transition={{ type: "spring", damping: 26, stiffness: 320 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <ModalHead $consumption>
                    <ModalIconWrap $color="#8b5cf6">
                      <TrendingDown size={18} />
                    </ModalIconWrap>
                    <div>
                      <ModalTitle>Stock Consumption Details</ModalTitle>
                      <ModalSubtitle>
                        Read-only consumption history for this outward entry
                      </ModalSubtitle>
                    </div>
                    <CloseBtn onClick={() => setShowItemsModal(false)}>
                      <X size={18} />
                    </CloseBtn>
                  </ModalHead>

                  {/* Info Panel */}
                  <ConsumptionInfoPanel>
                    <InfoGrid>
                      <InfoItem>
                        <InfoLabel>
                          <BarChart3 size={12} /> Total Qty Used
                        </InfoLabel>

                        <InfoValue $highlight>
                          {(outwardDetails?.consumedItems || []).reduce(
                            (sum, item) =>
                              sum + Number(item.qty || item.Qty || 0),
                            0,
                          )}
                        </InfoValue>
                      </InfoItem>
                      <InfoItem>
                        <InfoLabel>
                          <Hash size={12} /> Outward Number
                        </InfoLabel>
                        <InfoValue $bold>
                          OUT-{selectedOutward.id || selectedOutward.Id}
                        </InfoValue>
                      </InfoItem>
                      <InfoItem>
                        <InfoLabel>
                          <Users size={12} /> Staff Name
                        </InfoLabel>
                        <InfoValue>
                          {selectedOutward.staffName ||
                            selectedOutward.StaffName ||
                            "—"}
                        </InfoValue>
                      </InfoItem>
                      <InfoItem>
                        <InfoLabel>
                          <Calendar size={12} /> Consumption Date
                        </InfoLabel>
                        <InfoValue>
                          {selectedOutward.outwardDate ||
                          selectedOutward.OutwardDate
                            ? new Date(
                                selectedOutward.outwardDate ||
                                  selectedOutward.OutwardDate,
                              ).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                              })
                            : "—"}
                        </InfoValue>
                      </InfoItem>
                      <InfoItem>
                        <InfoLabel>
                          <Box size={12} /> Total Items Consumed
                        </InfoLabel>
                        <InfoValue $highlight>
                          {(outwardDetails?.consumedItems || []).reduce(
                            (sum, item) =>
                              sum + Number(item.qty || item.Qty || 0),
                            0,
                          )}
                        </InfoValue>
                      </InfoItem>
                      <InfoItem $full>
                        <InfoLabel>
                          <FileText size={12} /> Remarks
                        </InfoLabel>
                        <InfoValue>
                          {selectedOutward.remark || selectedOutward.Remark || (
                            <span className="muted">No remarks provided</span>
                          )}
                        </InfoValue>
                      </InfoItem>
                      {activeFy && (
                        <InfoItem>
                          <InfoLabel>
                            <Shield size={12} /> Financial Year
                          </InfoLabel>
                          <InfoValue>
                            <FyInlineChip>
                              {activeFy.yearName || activeFy.YearName}
                            </FyInlineChip>
                          </InfoValue>
                        </InfoItem>
                      )}
                    </InfoGrid>
                  </ConsumptionInfoPanel>

                  {/* Consumed Stock Table */}
                  <ConsumptionTableSection>
                    <SectionHeading>
                      <Layers size={15} />
                      Consumed Stock Items
                      {!itemsLoading && (
                        <ItemCountBadge>
                          {outwardDetails?.totalItemsConsumed || 0}
                        </ItemCountBadge>
                      )}
                    </SectionHeading>

                    <DataGridWrap $modal>
                      <DataGrid>
                        <thead>
                          <tr>
                            <Th>Product Name</Th>
                            <Th>Batch No.</Th>
                            <Th center>Qty Used</Th>
                            <Th center>Available Qty</Th>
                            <Th>Unit</Th>
                            <Th>Consumption Date</Th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemsLoading ? (
                            <SkeletonTableRows rows={4} columns={6} />
                          ) : (outwardDetails?.consumedItems || []).length ===
                            0 ? (
                            <tr>
                              <td
                                colSpan="6"
                                style={{
                                  padding: "3rem 0",
                                  borderBottom: "none",
                                }}
                              >
                                <ConsumptionEmptyState>
                                  <EmptyIcon>
                                    <Box size={36} strokeWidth={1.2} />
                                  </EmptyIcon>
                                  <EmptyTitle>No Consumption Data</EmptyTitle>
                                  <EmptySubtitle>
                                    Stock items for this outward entry will
                                    appear here once generated from invoices.
                                  </EmptySubtitle>
                                </ConsumptionEmptyState>
                              </td>
                            </tr>
                          ) : (
                            (outwardDetails?.consumedItems || []).map(
                              (it, idx) => {
                                const prdName =
                                  it.productName || it.ProductName || "N/A";

                                const bNo = it.batchNo || it.BatchNo || "N/A";

                                const availQty =
                                  it.availableQty || it.AvailableQty || 0;

                                const qtyUsed =
                                  it.qtyUsed ||
                                  it.QtyUsed ||
                                  it.qty ||
                                  it.Qty ||
                                  0;

                                const unit = it.unit || it.Unit || "-";

                                const rawDate =
                                  it.consumptionDate ||
                                  it.ConsumptionDate ||
                                  it.outwardDate ||
                                  it.OutwardDate ||
                                  it.createdAt ||
                                  it.CreatedAt;

                                const consumptionDate = rawDate
                                  ? new Date(rawDate).toLocaleDateString(
                                      "en-IN",
                                      {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      },
                                    )
                                  : "-";
                                return (
                                  <DataRow
                                    key={it.id || it.Id}
                                    as={motion.tr}
                                    initial={{ opacity: 0, x: -6 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                  >
                                    <Td>
                                      <ProductNameCell>
                                        <ProductDot />
                                        {prdName}
                                      </ProductNameCell>
                                    </Td>
                                    <Td>
                                      <BatchTag>{bNo}</BatchTag>
                                    </Td>
                                    <Td center>
                                      <QtyUsed>{qtyUsed}</QtyUsed>
                                    </Td>
                                    <Td center>
                                      <AvailQty>{availQty}</AvailQty>
                                    </Td>
                                    <Td>
                                      <UnitTag>{unit}</UnitTag>
                                    </Td>
                                    <Td>
                                      <DateCell>
                                        <Clock size={12} />
                                        {consumptionDate}
                                      </DateCell>
                                    </Td>
                                  </DataRow>
                                );
                              },
                            )
                          )}
                        </tbody>
                      </DataGrid>
                    </DataGridWrap>
                  </ConsumptionTableSection>

                  <ModalFoot $readOnly>
                    <ReadOnlyNote>
                      <Shield size={13} />
                      Read-only view — Items are generated from the
                      invoice/sales flow
                    </ReadOnlyNote>
                    <ModalBtn
                      $variant="cancel"
                      onClick={() => setShowItemsModal(false)}
                    >
                      Close
                    </ModalBtn>
                  </ModalFoot>
                </ModalBox>
              </Overlay>
            )}
          </AnimatePresence>

          <style>{`
            .swal2-container { z-index: 99999 !important; }
            .spin { animation: _spin 1s linear infinite; }
            @keyframes _spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>
        </PageShell>
      </PageTransition>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════
   KEYFRAMES
═══════════════════════════════════════════════════════════ */
const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
`;

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

/* ═══════════════════════════════════════════════════════════
   PAGE SHELL
═══════════════════════════════════════════════════════════ */
const PageShell = styled.div`
  min-height: 100vh;
  color: var(--text);
  font-family: "Inter", "DM Sans", sans-serif;
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px 20px 48px;

  @media (max-width: 768px) {
    padding: 16px 12px 40px;
  }
`;

/* ═══════════════════════════════════════════════════════════
   PAGE HEADER
═══════════════════════════════════════════════════════════ */
const PageHeader = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 28px;
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  padding: 18px 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
`;

const ModuleIcon = styled.div`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, #3b82f6 0%, #6366f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
  flex-shrink: 0;
`;

const HeaderText = styled.div``;

const PageTitle = styled.h1`
  margin: 0;
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--text);
  letter-spacing: -0.3px;
`;

const Breadcrumb = styled.nav`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
`;

const BreadcrumbLink = styled(Link)`
  font-size: 12px;
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 500;
  &:hover {
    color: var(--primary);
  }
`;

const BreadSep = styled.span`
  font-size: 11px;
  color: var(--text-muted);
  opacity: 0.5;
`;

const BreadActive = styled.span`
  font-size: 12px;
  color: var(--primary);
  font-weight: 700;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
`;

const FyChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.3px;
  border: 1px solid;

  &.active {
    background: rgba(16, 185, 129, 0.08);
    border-color: rgba(16, 185, 129, 0.3);
    color: #10b981;
  }
  &.locked {
    background: rgba(245, 158, 11, 0.08);
    border-color: rgba(245, 158, 11, 0.3);
    color: #f59e0b;
  }
  &.error {
    background: rgba(239, 68, 68, 0.08);
    border-color: rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }
`;

const LockedTag = styled.span`
  background: #f59e0b;
  color: white;
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 4px;
  letter-spacing: 0.5px;
`;

const SyncIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
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
  .label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-muted);
  }
`;

const HeaderBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.25s ease;
  white-space: nowrap;

  ${(p) =>
    p.variant === "primary" &&
    css`
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.32);
      &:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.42);
      }
    `}
  ${(p) =>
    p.variant === "outline" &&
    css`
      background: transparent;
      color: var(--text);
      border-color: var(--border-custom);
      &:hover:not(:disabled) {
        border-color: var(--primary);
        color: var(--primary);
        background: rgba(59, 130, 246, 0.05);
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
    transform: none !important;
  }
`;

/* ═══════════════════════════════════════════════════════════
   KPI GRID
═══════════════════════════════════════════════════════════ */
const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  margin-bottom: 24px;

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

const KpiCard = styled.div`
  position: relative;
  overflow: hidden;
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: ${(p) => p.$accent};
    border-radius: 14px 14px 0 0;
    opacity: 0.8;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px ${(p) => p.$accent}22;
    border-color: ${(p) => p.$accent}44;
  }
`;

const KpiIconWrap = styled.div`
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: ${(p) => p.$color}18;
  color: ${(p) => p.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.3s ease;
  ${KpiCard}:hover & {
    transform: scale(1.12) rotate(6deg);
  }
`;

const KpiBody = styled.div`
  flex: 1;
  min-width: 0;
`;

const KpiLabel = styled.p`
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const KpiValue = styled.h3`
  margin: 4px 0 0;
  font-size: 1.7rem;
  font-weight: 800;
  color: var(--text);
  line-height: 1;
`;

const KpiGlow = styled.div`
  position: absolute;
  bottom: -20px;
  right: -20px;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${(p) => p.$color}0d;
  pointer-events: none;
`;

const KpiSkeleton = styled.div`
  height: 90px;
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

/* ═══════════════════════════════════════════════════════════
   TABLE CARD
═══════════════════════════════════════════════════════════ */
const TableCard = styled.div`
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

/* ─── FILTER BAR ─── */
const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-custom);
  background: var(--bg-light-custom);
  flex-wrap: wrap;

  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const FilterField = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 9px;
  padding: 0 12px;
  height: 38px;
  transition: all 0.2s ease;
  flex: ${(p) => (p.$grow ? p.$grow : "1")};
  min-width: ${(p) => (p.$date ? "140px" : "160px")};
  position: relative;

  &:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }

  .fi {
    color: var(--text-muted);
    flex-shrink: 0;
  }

  .lbl {
    font-size: 10px;
    font-weight: 800;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    flex-shrink: 0;
  }

  input,
  select {
    border: none;
    background: transparent;
    color: var(--text);
    font-size: 13px;
    font-weight: 500;
    width: 100%;
    outline: none;
    &::placeholder {
      color: var(--text-muted);
      opacity: 0.7;
    }
  }
  input[type="date"]::-webkit-calendar-picker-indicator {
    cursor: pointer;
    filter: invert(0.5);
  }
`;

const ClearBtn = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 2px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  &:hover {
    color: #ef4444;
  }
`;

const ResetBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 14px;
  border-radius: 9px;
  border: 1px solid rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.05);
  color: #ef4444;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  position: relative;
  transition: all 0.2s ease;
  flex-shrink: 0;
  &:hover {
    background: #ef4444;
    color: white;
    border-color: #ef4444;
  }
`;

const FilterBadge = styled.span`
  position: absolute;
  top: -6px;
  right: -6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  font-size: 9px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ResultsInfo = styled.div`
  padding: 10px 20px;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
  border-bottom: 1px solid var(--border-custom);
`;

/* ─── DATA GRID ─── */
const DataGridWrap = styled.div`
  overflow-x: auto;
  ${(p) =>
    p.$modal &&
    css`
      border: 1px solid var(--border-custom);
      border-radius: 12px;
      overflow: hidden;
    `}

  &::-webkit-scrollbar {
    height: 5px;
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
  text-align: ${(p) => (p.center ? "center" : "left")};
  font-size: 10.5px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.8px;
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
  transition: all 0.2s ease;
  border-bottom: 1px solid var(--border-custom);

  &:last-child {
    border-bottom: none;
  }

  &:nth-child(even) {
    background: var(--bg-light-custom);
  }
  &:hover {
    background: rgba(59, 130, 246, 0.04) !important;
    td {
      border-color: rgba(59, 130, 246, 0.12);
    }
    box-shadow: inset 3px 0 0 var(--primary);
  }
`;

const Td = styled.td`
  padding: 14px 16px;
  vertical-align: middle;
  font-size: 13.5px;
  text-align: ${(p) => (p.center ? "center" : "left")};
  color: var(--text);
`;

/* ─── CELL COMPONENTS ─── */
const OutwardId = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-weight: 800;
  font-size: 13px;
  color: var(--primary);
  background: rgba(59, 130, 246, 0.08);
  padding: 4px 10px;
  border-radius: 6px;
  font-family: "JetBrains Mono", "Fira Code", monospace;
`;

const DateCell = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12.5px;
  color: var(--text-muted);
  font-weight: 500;
`;

const StaffCell = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StaffAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  font-size: 13px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const RemarkCell = styled.span`
  font-size: 13px;
  color: var(--text-muted);
  max-width: 220px;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  .muted {
    color: var(--text-muted);
    opacity: 0.5;
    font-style: italic;
  }
`;

const ItemsChip = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 26px;
  padding: 0 10px;
  background: rgba(59, 130, 246, 0.1);
  color: var(--primary);
  border-radius: 100px;
  font-size: 12px;
  font-weight: 700;
`;

const statusColors = {
  success: {
    bg: "rgba(16,185,129,0.1)",
    color: "#10b981",
    border: "rgba(16,185,129,0.3)",
  },
  info: {
    bg: "rgba(6,182,212,0.1)",
    color: "#06b6d4",
    border: "rgba(6,182,212,0.3)",
  },
  warning: {
    bg: "rgba(245,158,11,0.1)",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.3)",
  },
};

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  background: ${(p) => statusColors[p.$variant]?.bg || "transparent"};
  color: ${(p) => statusColors[p.$variant]?.color || "inherit"};
  border: 1px solid ${(p) => statusColors[p.$variant]?.border || "transparent"};
`;

const ActionsGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
`;

const ActionBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid var(--border-custom);
  background: var(--bg-light-custom);
  color: var(--text-muted);
  transition: all 0.2s ease;

  ${(p) =>
    p.$type === "view" &&
    css`
      &:hover:not(:disabled) {
        background: #8b5cf6;
        color: white;
        border-color: #8b5cf6;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
      }
    `}
  ${(p) =>
    p.$type === "edit" &&
    css`
      &:hover:not(:disabled) {
        background: #0ea5e9;
        color: white;
        border-color: #0ea5e9;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
      }
    `}
  ${(p) =>
    p.$type === "delete" &&
    css`
      &:hover:not(:disabled) {
        background: #ef4444;
        color: white;
        border-color: #ef4444;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }
    `}
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

/* ─── PAGINATION ─── */
const PaginationRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-custom);
  background: var(--bg-light-custom);
`;

const PaginationInfo = styled.span`
  font-size: 12.5px;
  color: var(--text-muted);
  font-weight: 500;
  strong {
    color: var(--text);
    font-weight: 700;
  }
`;

const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PageBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1px solid var(--border-custom);
  background: var(--card);
  color: var(--text);
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    color: white;
    border-color: transparent;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    transform: translateY(-1px);
  }
`;

const PageIndicator = styled.span`
  color: var(--primary);
  font-weight: 800;
  font-size: 12.5px;
  padding: 6px 14px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.2);
`;

/* ═══════════════════════════════════════════════════════════
   MODAL SYSTEM
═══════════════════════════════════════════════════════════ */
const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(10, 15, 30, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 20px;

  @media (max-width: 640px) {
    align-items: flex-end;
    padding: 0;
  }
`;

const ModalBox = styled(motion.div)`
  background: var(--card);
  color: var(--text);
  width: 100%;
  border-radius: 20px;
  border: 1px solid var(--border-custom);
  box-shadow:
    0 32px 64px -16px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(59, 130, 246, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 92vh;

  @media (max-width: 640px) {
    border-radius: 20px 20px 0 0;
    max-height: 96vh;
  }
`;

const ModalHead = styled.div`
  display: flex;
  align-items: ${(p) => (p.$consumption ? "flex-start" : "center")};
  gap: 14px;
  padding: 22px 26px;
  background: var(--bg-light-custom);
  border-bottom: 1px solid var(--border-custom);
`;

const ModalIconWrap = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  flex-shrink: 0;
  background: ${(p) => p.$color}18;
  color: ${(p) => p.$color};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ModalTitle = styled.h5`
  margin: 0;
  font-size: 1.05rem;
  font-weight: 800;
  color: var(--text);
  flex: 1;
`;

const ModalSubtitle = styled.p`
  margin: 2px 0 0;
  font-size: 11.5px;
  color: var(--text-muted);
  font-weight: 500;
`;

const CloseBtn = styled.button`
  width: 34px;
  height: 34px;
  border-radius: 9px;
  flex-shrink: 0;
  border: 1px solid var(--border-custom);
  background: var(--card);
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  margin-left: auto;
  &:hover:not(:disabled) {
    background: #ef4444;
    color: white;
    border-color: #ef4444;
    transform: rotate(90deg);
    box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModalBody = styled.div`
  padding: 24px 26px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-custom);
    border-radius: 10px;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const FormLabel = styled.label`
  font-size: 11px;
  font-weight: 800;
  color: var(--text);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Required = styled.span`
  color: #ef4444;
`;

const inputStyles = css`
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid var(--border-custom);
  background: var(--bg-light-custom);
  color: var(--text);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  outline: none;
  &::placeholder {
    color: var(--text-muted);
    opacity: 0.6;
  }
  &:hover:not(:disabled) {
    border-color: rgba(59, 130, 246, 0.5);
  }
  &:focus:not(:disabled) {
    background: var(--card);
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const FormInput = styled.input`
  ${inputStyles}
`;
const FormSelect = styled.select`
  ${inputStyles}
`;

const ModalFoot = styled.div`
  padding: 18px 26px;
  display: flex;
  align-items: center;
  justify-content: ${(p) => (p.$readOnly ? "space-between" : "flex-end")};
  gap: 10px;
  border-top: 1px solid var(--border-custom);
  background: var(--bg-light-custom);
`;

const ModalBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 22px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.25s ease;

  ${(p) =>
    p.$variant === "save" &&
    css`
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
      &:hover:not(:disabled) {
        filter: brightness(1.08);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
      }
    `}
  ${(p) =>
    p.$variant === "cancel" &&
    css`
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border-custom);
      &:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.06);
        color: #ef4444;
        border-color: rgba(239, 68, 68, 0.4);
      }
    `}
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none !important;
  }
`;

/* ═══════════════════════════════════════════════════════════
   CONSUMPTION MODAL SPECIFICS
═══════════════════════════════════════════════════════════ */
const ConsumptionInfoPanel = styled.div`
  padding: 20px 26px;
  border-bottom: 1px solid var(--border-custom);
  background: var(--bg-light-custom);
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 420px) {
    grid-template-columns: 1fr;
  }
`;

const InfoItem = styled.div`
  ${(p) =>
    p.$full &&
    css`
      grid-column: 1 / -1;
    `}
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.span`
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-muted);
`;

const InfoValue = styled.span`
  font-size: 14px;
  color: var(--text);
  font-weight: ${(p) => (p.$bold ? "800" : p.$highlight ? "800" : "500")};
  color: ${(p) => (p.$highlight ? "var(--primary)" : "var(--text)")};
  .muted {
    color: var(--text-muted);
    opacity: 0.6;
    font-style: italic;
  }
`;

const FyInlineChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.3);
`;

const ConsumptionTableSection = styled.div`
  padding: 20px 26px;
  overflow-y: auto;
  flex: 1;
  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-custom);
    border-radius: 10px;
  }
`;

const SectionHeading = styled.h6`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 800;
  color: var(--text);
  margin: 0 0 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ItemCountBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  padding: 0 7px;
  background: rgba(139, 92, 246, 0.15);
  color: #8b5cf6;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 800;
`;

/* ─── Consumption Table Cells ─── */
const ProductNameCell = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 13px;
`;

const ProductDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #6366f1);
  flex-shrink: 0;
`;

const BatchTag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  font-family: monospace;
  background: rgba(6, 182, 212, 0.1);
  color: #06b6d4;
  border: 1px solid rgba(6, 182, 212, 0.25);
`;

const QtyUsed = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.25);
`;

const AvailQty = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 800;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.25);
`;

const UnitTag = styled.span`
  display: inline-flex;
  padding: 3px 9px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  background: var(--bg-light-custom);
  color: var(--text-muted);
  border: 1px solid var(--border-custom);
`;

const ConsumptionEmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 12px;
`;

const EmptyIcon = styled.div`
  width: 72px;
  height: 72px;
  border-radius: 18px;
  background: linear-gradient(
    135deg,
    rgba(139, 92, 246, 0.1),
    rgba(99, 102, 241, 0.1)
  );
  border: 1px solid rgba(139, 92, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8b5cf6;
`;

const EmptyTitle = styled.h4`
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: var(--text);
`;

const EmptySubtitle = styled.p`
  margin: 0;
  font-size: 13px;
  color: var(--text-muted);
  text-align: center;
  max-width: 340px;
  line-height: 1.6;
`;

const ReadOnlyNote = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
  color: var(--text-muted);
  font-weight: 500;
`;
