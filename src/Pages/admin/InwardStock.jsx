import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
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
  Box,
  Truck,
  Users,
  Shield,
  Clock,
  Hash,
  Layers,
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
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{Math.ceil(count)}</>;
};

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function InwardStock() {
  const emptyForm = {
    id: 0,
    purchaseItemId: "",
    batchNo: "",
    qty: "",
    inwardDate: new Date().toISOString().split("T")[0],
    staffUserId: "",
    remark: "",
  };

  /* ── Master States ── */
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  /* ── Dropdowns ── */
  const [purchaseItemsList, setPurchaseItemsList] = useState([]);
  const [staffList, setStaffList] = useState([]);

  /* ── Filters ── */
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
      if (fyRes && fyRes.status === "OK" && fyRes.result) {
        const currentActiveFy = fyRes.result.find(
          (y) => y.isActive && !y.isDelete,
        );
        setActiveFy(currentActiveFy || null);
      }

      await Promise.all([fetchStocks(false, true), fetchDropdowns()]);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setInitialLoad(false), 700);
    }
  };

  /* ═══════════════ FETCH DATA ═══════════════ */
  const fetchStocks = async (isRefresh = false, isInit = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else if (!isInit) setLoading(true);

      const res = await getRequest("InwardStock/List");
      if (res && res.status === "OK") {
        setStocks(res.result || []);
      }
    } catch (err) {
      errorAlert("Error", "Failed to fetch inward stocks");
    } finally {
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 600);
      else if (!isInit) setTimeout(() => setLoading(false), 500);
    }
  };

  const fetchDropdowns = async () => {
    try {
      const [itemsRes, staffRes] = await Promise.all([
        getRequest("PurchaseItems/List").catch(() => null),
        getRequest("StaffMaster/List").catch(() => null),
      ]);

      if (itemsRes?.status === "OK")
        setPurchaseItemsList(itemsRes.result || []);
      if (staffRes?.status === "OK") setStaffList(staffRes.result || []);
    } catch (error) {
      console.error("Dropdown fetch error:", error);
    }
  };

  /* ═══════════════ HANDLERS ═══════════════ */
  const handleRefresh = () => {
    fetchStocks(true);
    fetchDropdowns();
  };

  const handleResetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setSortOrder("newest");
    setCurrentPage(1);
  };

  const isFyLocked = activeFy && activeFy.isClosed;
  const activeFiltersCount = [search, fromDate, toDate].filter(Boolean).length;

  // 🟢 DYNAMIC PURCHASE ITEMS: Filter out items that are fully inwarded
  const dynamicPurchaseItems = useMemo(() => {
    return purchaseItemsList
      .map((item) => {
        const itemId = item.id || item.Id;
        // Calculate how many have already been inwarded
        const inwardedCount = stocks
          .filter(
            (s) =>
              (s.purchaseItemId || s.PurchaseItemId) === itemId &&
              s.id !== form.id,
          ) // Exclude current editing row
          .reduce((sum, s) => sum + Number(s.qty || s.Qty), 0);

        const originalQty = Number(item.qty || item.Qty);
        return { ...item, remainingQty: originalQty - inwardedCount };
      })
      .filter(
        (item) =>
          item.remainingQty > 0 ||
          (form.id > 0 && (item.id || item.Id) === Number(form.purchaseItemId)),
      );
  }, [purchaseItemsList, stocks, form.id, form.purchaseItemId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const validateForm = () => {
    if (!form.purchaseItemId)
      return warningAlert("Validation", "Please select a Purchased Item.");

    if (!form.inwardDate)
      return warningAlert("Validation", "Inward Date is required.");

    // 🔥 VALIDATION: Date cannot be future
    const today = new Date().toISOString().split("T")[0];
    if (form.inwardDate > today) {
      return warningAlert("Validation", "Inward Date cannot be a future date.");
    }

    if (!form.qty || Number(form.qty) <= 0)
      return warningAlert("Validation", "Quantity must be greater than 0.");

    if (!form.staffUserId)
      return warningAlert("Validation", "Please select the processing Staff.");

    const selectedItem = dynamicPurchaseItems.find(
      (p) => (p.id || p.Id) === Number(form.purchaseItemId),
    );

    // 🔥 VALIDATION: Quantity must not exceed remaining
    if (selectedItem && Number(form.qty) > selectedItem.remainingQty) {
      return warningAlert(
        "Validation",
        `Cannot inward ${form.qty}. Only ${selectedItem.remainingQty} units remain on this bill.`,
      );
    }

    // 🔥 VALIDATION: Prevent Duplicate Entry (Same Item + Batch + Date)
    const isDuplicate = stocks.some(
      (s) =>
        (s.purchaseItemId === Number(form.purchaseItemId) ||
          s.PurchaseItemId === Number(form.purchaseItemId)) &&
        (s.batchNo === form.batchNo || s.BatchNo === form.batchNo) &&
        s.inwardDate &&
        s.inwardDate.split("T")[0] === form.inwardDate &&
        s.id !== form.id, // Ignore current editing record
    );

    if (isDuplicate) {
      return warningAlert(
        "Duplicate Entry",
        "An entry with this exact Item, Batch No, and Date already exists!",
      );
    }

    return true;
  };

  const handleAddClick = () => {
    if (isFyLocked || !activeFy) {
      return warningAlert(
        "Financial Year Locked",
        "Cannot modify stock in closed or missing financial year.",
      );
    }
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (validateForm() !== true) return;

    try {
      setSubmitLoading(true);
      const payload = {
        ...form,
        id: Number(form.id),
        purchaseItemId: Number(form.purchaseItemId),
        qty: Number(form.qty),
        staffUserId: Number(form.staffUserId),
      };
      console.log(payload);
      const response =
        form.id > 0
          ? await putRequest("InwardStock/Update", payload)
          : await postRequest("InwardStock/Save", payload);

      if (response && response.status === "OK") {
        successAlert(
          "Success",
          form.id > 0
            ? "Inward updated successfully."
            : "Stock inwarded successfully.",
        );
        setShowModal(false);
        setForm(emptyForm);
        fetchStocks();
      } else {
        errorAlert("Failed", response.message || "Could not save entry");
      }
    } catch (err) {
      errorAlert("API Error", err.message || "Server connection failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = async (id) => {
    if (isFyLocked || !activeFy) {
      return warningAlert(
        "Financial Year Locked",
        "Cannot modify stock in closed or missing financial year.",
      );
    }
    try {
      const res = await getRequest(`InwardStock/Detail/${id}`);
      if (res && res.status === "OK" && res.result) {
        const data = res.result;
        setForm({
          id: data.id || data.Id || 0,
          purchaseItemId: data.purchaseItemId || data.PurchaseItemId || "",
          batchNo: data.batchNo || data.BatchNo || "",
          qty: data.qty || data.Qty || "",
          inwardDate: data.inwardDate
            ? data.inwardDate.split("T")[0]
            : data.InwardDate
              ? data.InwardDate.split("T")[0]
              : "",
          staffUserId: data.staffUserId || data.StaffUserId || "",
          remark: data.remark || data.Remark || "",
        });
        setShowModal(true);
      } else {
        errorAlert("Error", "Record not found");
      }
    } catch (err) {
      errorAlert("Error", "Server error while fetching details.");
    }
  };

  const handleDelete = async (id) => {
    if (isFyLocked || !activeFy) {
      return warningAlert(
        "Financial Year Locked",
        "Cannot delete stock in closed or missing financial year.",
      );
    }
    const confirm = await confirmAlert(
      "Are you sure?",
      "This inward entry will be permanently deleted.",
    );
    if (!confirm.isConfirmed) return;
    try {
      const res = await deleteRequest(`InwardStock/Delete/${id}`);
      if (res && res.status === "OK") {
        successAlert("Deleted", "Inward record removed");
        fetchStocks();
      } else {
        errorAlert("Failed", res.message || "Delete failed");
      }
    } catch (err) {
      errorAlert("Error", "Delete operation failed.");
    }
  };

  /* ═══════════════ FILTER & PAGINATION ═══════════════ */
  const processedData = useMemo(() => {
    let result = [...stocks];
    if (search) {
      result = result.filter(
        (p) =>
          (p.batchNo &&
            p.batchNo.toLowerCase().includes(search.toLowerCase())) ||
          (p.product &&
            p.product.toLowerCase().includes(search.toLowerCase())) ||
          (p.billNo && p.billNo.toLowerCase().includes(search.toLowerCase())),
      );
    }
    if (fromDate)
      result = result.filter(
        (p) => new Date(p.inwardDate) >= new Date(fromDate),
      );
    if (toDate)
      result = result.filter((p) => new Date(p.inwardDate) <= new Date(toDate));

    switch (sortOrder) {
      case "a-z":
        result.sort((a, b) => (a.product || "").localeCompare(b.product || ""));
        break;
      case "qty-high":
        result.sort((a, b) => b.qty - a.qty);
        break;
      case "oldest":
        result.sort((a, b) => new Date(a.inwardDate) - new Date(b.inwardDate));
        break;
      case "newest":
      default:
        result.sort((a, b) => new Date(b.inwardDate) - new Date(a.inwardDate));
        break;
    }
    return result;
  }, [stocks, search, fromDate, toDate, sortOrder]);

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
  const todaysArrivals = stocks.filter((s) => {
    const d = s.inwardDate ? s.inwardDate.split("T")[0] : "";
    return d === todayStr;
  }).length;

  const todaysTotalQty = stocks
    .filter(
      (s) => (s.inwardDate ? s.inwardDate.split("T")[0] : "") === todayStr,
    )
    .reduce((acc, curr) => acc + Number(curr.qty), 0);

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
                <PackageOpen size={22} />
              </ModuleIcon>
              <HeaderText>
                <PageTitle>Stock Inward</PageTitle>
                <Breadcrumb>
                  <BreadcrumbLink to="/admin/dashboard">Home</BreadcrumbLink>
                  <BreadSep>/</BreadSep>
                  <BreadcrumbLink to="#">Inventory</BreadcrumbLink>
                  <BreadSep>/</BreadSep>
                  <BreadActive>Inward Stock</BreadActive>
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
              <HeaderBtn
                variant="primary"
                onClick={handleAddClick}
                disabled={isFyLocked}
                title={isFyLocked ? "Financial year is locked" : ""}
              >
                <Plus size={15} />
                Receive Stock
              </HeaderBtn>
            </HeaderRight>
          </PageHeader>

          {/* ─── KPI SUMMARY DASHBOARD ─── */}
          <KpiGrid
            as={motion.div}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            $columns={3}
          >
            {initialLoad ? (
              [0, 1, 2].map((i) => <KpiSkeleton key={i} />)
            ) : (
              <>
                <KpiCard $accent="#3b82f6">
                  <KpiIconWrap $color="#3b82f6">
                    <Layers size={24} />
                  </KpiIconWrap>
                  <KpiBody>
                    <KpiLabel>Total Inward Records</KpiLabel>
                    <KpiValue>
                      <AnimatedNumber value={stocks.length} />
                    </KpiValue>
                    <KpiSub>All time receipts</KpiSub>
                  </KpiBody>
                  <KpiGlow $color="#3b82f6" />
                </KpiCard>
                <KpiCard $accent="#10b981">
                  <KpiIconWrap $color="#10b981">
                    <Truck size={24} />
                  </KpiIconWrap>
                  <KpiBody>
                    <KpiLabel>Today's Arrivals</KpiLabel>
                    <KpiValue
                      style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: "8px",
                      }}
                    >
                      <AnimatedNumber value={todaysArrivals} />
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          fontWeight: "500",
                        }}
                      >
                        (<AnimatedNumber value={todaysTotalQty} /> items)
                      </span>
                    </KpiValue>
                    <KpiSub>Inwarded today</KpiSub>
                  </KpiBody>
                  <KpiGlow $color="#10b981" />
                </KpiCard>
                <KpiCard $accent="#0ea5e9">
                  <KpiIconWrap $color="#0ea5e9">
                    <Users size={24} />
                  </KpiIconWrap>
                  <KpiBody>
                    <KpiLabel>Active Processors</KpiLabel>
                    <KpiValue>
                      <AnimatedNumber value={staffList.length} />
                    </KpiValue>
                    <KpiSub>Available staff</KpiSub>
                  </KpiBody>
                  <KpiGlow $color="#0ea5e9" />
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
                  placeholder="Search batch, product or bill..."
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
                  <option value="newest">Newest Inwards</option>
                  <option value="oldest">Oldest Inwards</option>
                  <option value="qty-high">Quantity: High to Low</option>
                  <option value="a-z">Product (A-Z)</option>
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

            {/* DATA GRID */}
            <DataGridWrap>
              <DataGrid>
                <thead>
                  <tr>
                    <Th>Batch & Date</Th>
                    <Th>Product Details</Th>
                    <Th>Purchased Bill</Th>
                    <Th center>Inward Qty</Th>
                    <Th>Processed By</Th>
                    <Th center>Stock Status</Th>
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
                          icon={<PackageOpen size={40} strokeWidth={1.2} />}
                          title="No Inward Records Found"
                          subtitle="No stock inward entries match your search or filters."
                        />
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((p, i) => {
                      const dateStr = p.inwardDate
                        ? new Date(p.inwardDate).toLocaleDateString("en-IN", {
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
                            <BatchCell>
                              <div className="batch-no">
                                <Hash size={12} /> {p.batchNo || "N/A"}
                              </div>
                              <div className="date-sub">
                                <Clock size={11} /> {dateStr}
                              </div>
                            </BatchCell>
                          </Td>
                          <Td>
                            <ProductCell>
                              <Avatar>
                                {p.product ? (
                                  p.product.charAt(0).toUpperCase()
                                ) : (
                                  <Box size={16} />
                                )}
                              </Avatar>
                              <div className="name-wrap">
                                <span className="prd-name">
                                  {p.product || "—"}
                                </span>
                              </div>
                            </ProductCell>
                          </Td>
                          <Td>
                            <BillChip>{p.billNo || "—"}</BillChip>
                          </Td>
                          <Td center>
                            <QtyHighlight>{p.qty}</QtyHighlight>
                          </Td>
                          <Td>
                            <StaffText>
                              <Users size={12} className="icon" />
                              {p.staff || "—"}
                            </StaffText>
                          </Td>
                          <Td center>
                            <StatusCell>
                              <div className="avail">
                                {p.availableQty ?? p.AvailableQty} Avail.
                              </div>
                              <div className="used">
                                Used: {p.usedQty ?? p.UsedQty}
                              </div>
                            </StatusCell>
                          </Td>
                          <Td center>
                            <ActionsGroup>
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
              ADD / EDIT MODAL
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
                  style={{ maxWidth: "680px" }}
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
                      {form.id > 0
                        ? "Edit Godown Receipt"
                        : "New Inward Receipt"}
                    </ModalTitle>
                    <CloseBtn
                      onClick={() => {
                        if (!submitLoading) {
                          setShowModal(false);
                          setForm(emptyForm);
                        }
                      }}
                      disabled={submitLoading}
                    >
                      <X size={18} />
                    </CloseBtn>
                  </ModalHead>

                  <ModalBody>
                    <FormGroup>
                      <FormLabel>
                        Select Purchased Item <Required>*</Required>
                      </FormLabel>
                      <FormSelect
                        name="purchaseItemId"
                        value={form.purchaseItemId}
                        onChange={handleChange}
                        disabled={submitLoading}
                        autoFocus
                      >
                        <option value="">
                          -- Choose Item from Purchase Bills --
                        </option>
                        {dynamicPurchaseItems.map((item, idx) => {
                          const billNo =
                            item.purchaseBill || item.PurchaseBill || "-";
                          const prdName =
                            item.product || item.Product || "Unknown Item";
                          const remQty = item.remainingQty;
                          const itemId = item.id || item.Id;
                          return (
                            <option key={itemId || idx} value={itemId}>
                              Bill: {billNo} | Item: {prdName} | Pending Qty:{" "}
                              {remQty}
                            </option>
                          );
                        })}
                      </FormSelect>
                      <InputHint>
                        Only shows items that haven't been fully inwarded.
                      </InputHint>
                    </FormGroup>

                    <FormRow>
                      <FormGroup>
                        <FormLabel>Batch Number</FormLabel>
                        <FormInput
                          type="text"
                          name="batchNo"
                          value={form.batchNo}
                          onChange={handleChange}
                          placeholder="e.g. BATCH-A01 (Optional)"
                          disabled={submitLoading}
                        />
                      </FormGroup>

                      <FormGroup>
                        <FormLabel>
                          Inward Date <Required>*</Required>
                        </FormLabel>
                        <FormInput
                          type="date"
                          name="inwardDate"
                          value={form.inwardDate}
                          onChange={handleChange}
                          disabled={submitLoading}
                        />
                      </FormGroup>
                    </FormRow>

                    <FormRow>
                      <FormGroup>
                        <FormLabel>
                          Received Quantity <Required>*</Required>
                        </FormLabel>
                        <FormInput
                          type="number"
                          name="qty"
                          value={form.qty}
                          onChange={handleChange}
                          placeholder="0"
                          disabled={submitLoading}
                        />
                      </FormGroup>

                      <FormGroup>
                        <FormLabel>
                          Processed By (Staff) <Required>*</Required>
                        </FormLabel>
                        <FormSelect
                          name="staffUserId"
                          value={form.staffUserId}
                          onChange={handleChange}
                          disabled={submitLoading}
                        >
                          <option value="">Select Staff</option>
                          {staffList.map((s, idx) => {
                            const staffName =
                              s.fullName || s.FullName || "Unknown Staff";
                            const sId = s.id || s.Id;
                            return (
                              <option key={sId || idx} value={sId}>
                                {staffName}
                              </option>
                            );
                          })}
                        </FormSelect>
                      </FormGroup>
                    </FormRow>

                    <FormGroup>
                      <FormLabel>Remarks / Notes</FormLabel>
                      <FormInput
                        type="text"
                        name="remark"
                        value={form.remark}
                        onChange={handleChange}
                        placeholder="Any condition notes..."
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
                          ? "Update Stock"
                          : "Save Stock Inward"}
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
   KEYFRAMES & STYLED COMPONENTS (FROM SYSTEM)
═══════════════════════════════════════════════════════════ */
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
`;

const shimmer = keyframes`
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
`;

const PageShell = styled.div`
  min-height: 100vh;
  color: var(--text);
  font-family: "Inter", "DM Sans", sans-serif;
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px 20px 48px;
  zoom: 0.8; /* STRICT SCALING REQUIREMENT */

  @media (max-width: 768px) {
    padding: 16px 12px 40px;
  }
`;

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
  background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
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

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: ${(p) => `repeat(${p.$columns || 5}, 1fr)`};
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
  width: 48px;
  height: 48px;
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
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const KpiValue = styled.h3`
  margin: 4px 0 0;
  font-size: 1.8rem;
  font-weight: 800;
  color: var(--text);
  line-height: 1;
`;

const KpiSub = styled.span`
  display: block;
  font-size: 11px;
  font-weight: 700;
  margin-top: 6px;
  color: ${(p) => (p.$warning ? "#f59e0b" : "var(--text-muted)")};
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
  height: 100px;
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

const TableCard = styled.div`
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 18px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

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

const DataGridWrap = styled.div`
  overflow-x: auto;
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

const BatchCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;

  .batch-no {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 800;
    color: var(--text);
    font-family: monospace;
    letter-spacing: 0.5px;
  }
  .date-sub {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: var(--text-muted);
    font-weight: 500;
  }
`;

const ProductCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .name-wrap {
    display: flex;
    flex-direction: column;
    .prd-name {
      font-size: 13.5px;
      font-weight: 700;
      color: var(--text);
    }
  }
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.12);
  color: var(--primary);
  border: 1px solid rgba(59, 130, 246, 0.25);
  font-size: 14px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.3s ease;

  ${DataRow}:hover & {
    background: var(--primary);
    color: white;
    transform: scale(1.1) rotate(-5deg);
  }
`;

const BillChip = styled.span`
  display: inline-flex;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  font-family: monospace;
  background: var(--bg-light-custom);
  color: var(--text-muted);
  border: 1px solid var(--border-custom);
`;

const QtyHighlight = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  padding: 4px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 800;
  background: rgba(14, 165, 233, 0.1);
  color: #0ea5e9;
  border: 1px solid rgba(14, 165, 233, 0.25);
`;

const StaffText = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-muted);

  .icon {
    color: var(--primary);
    opacity: 0.8;
  }
`;

const StatusCell = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  .avail {
    display: inline-flex;
    padding: 3px 8px;
    border-radius: 6px;
    font-size: 11.5px;
    font-weight: 700;
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.25);
    white-space: nowrap;
  }

  .used {
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
  }
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
  align-items: center;
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
  grid-template-columns: ${(p) => `repeat(${p.$cols || 2}, 1fr)`};
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

const InputHint = styled.small`
  font-size: 11px;
  color: var(--text-muted);
  margin-left: 4px;
  font-weight: 500;
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
  justify-content: flex-end;
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
