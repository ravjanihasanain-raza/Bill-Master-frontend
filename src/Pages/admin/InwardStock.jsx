import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
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

  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [purchaseItemsList, setPurchaseItemsList] = useState([]);
  const [staffList, setStaffList] = useState([]);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFy, setActiveFy] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

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

  return (
    <>
      <GlobalLoader isLoading={initialLoad} />
      <PageTransition>
        <MainContainer className="p-2 p-md-4">
          <HeaderSection className="mb-4 fade-slide-up delay-1 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
            <div className="title-area">
              <h2 className="fw-bold m-0 gradient-text">Stock Inward</h2>
              <small className="text-muted-custom d-flex align-items-center gap-2 mt-1">
                <BreadcrumbLink to="/admin/dashboard">
                  <i className="fas fa-home me-1"></i> Home
                </BreadcrumbLink>
                <i
                  className="fas fa-chevron-right"
                  style={{ fontSize: "10px" }}
                ></i>
                <span>Inventory</span>
                <i
                  className="fas fa-chevron-right"
                  style={{ fontSize: "10px" }}
                ></i>
                <span className="text-primary fw-medium">Inward Stock</span>
              </small>
            </div>
            <div className="d-flex align-items-center gap-2 w-100 w-md-auto flex-wrap">
              <PremiumBtn
                className="secondary w-100 w-md-auto"
                onClick={handleRefresh}
                disabled={loading || isRefreshing || initialLoad}
              >
                <RefreshCcw size={16} className={isRefreshing ? "spin" : ""} />
                {isRefreshing ? "Syncing..." : "Sync"}
              </PremiumBtn>
              <PremiumBtn
                className="primary w-100 w-md-auto"
                onClick={handleAddClick}
                disabled={isFyLocked}
                style={{ opacity: isFyLocked ? 0.6 : 1 }}
              >
                <Plus size={16} /> Receive Stock
              </PremiumBtn>
            </div>
          </HeaderSection>

          {activeFy ? (
            <FyBadgeWrapper>
              <FyBadge>
                <Calendar size={14} /> ACTIVE FINANCIAL YEAR:{" "}
                {activeFy.yearName}
              </FyBadge>
            </FyBadgeWrapper>
          ) : (
            !initialLoad && (
              <FyBadgeWrapper>
                <FyBadge className="error">
                  <AlertCircle size={14} /> No Active Financial Year Found
                </FyBadge>
              </FyBadgeWrapper>
            )
          )}

          <SummaryGrid className="mb-4 fade-slide-up delay-2">
            {initialLoad || loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                <SummaryCard className="primary-tint">
                  <div className="icon-box">
                    <i className="fas fa-boxes"></i>
                  </div>
                  <div className="content">
                    <p>Total Inward Records</p>
                    <h3>
                      <AnimatedNumber value={stocks.length} />
                    </h3>
                  </div>
                </SummaryCard>
                <SummaryCard className="success-tint">
                  <div className="icon-box">
                    <i className="fas fa-truck"></i>
                  </div>
                  <div className="content">
                    <p>Today's Arrivals</p>
                    <h3>
                      <AnimatedNumber value={todaysArrivals} />{" "}
                      <span
                        style={{
                          fontSize: "14px",
                          fontWeight: "normal",
                          color: "var(--text-muted)",
                          marginLeft: "5px",
                        }}
                      >
                        (<AnimatedNumber value={todaysTotalQty} /> Items)
                      </span>
                    </h3>
                  </div>
                </SummaryCard>
                <SummaryCard className="info-tint">
                  <div className="icon-box">
                    <i className="fas fa-users-cog"></i>
                  </div>
                  <div className="content">
                    <p>Active Staff Processors</p>
                    <h3>
                      <AnimatedNumber value={staffList.length} />
                    </h3>
                  </div>
                </SummaryCard>
              </>
            )}
          </SummaryGrid>

          <SolidCard className="p-3 p-md-4 fade-slide-up delay-3">
            <CompactFilterBar className="mb-4">
              <div className="filter-item search-item">
                <Search size={14} className="icon" />
                <input
                  type="text"
                  placeholder="Search batch, product or bill..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="filter-item">
                <Filter size={14} className="icon" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Newest Inwards</option>
                  <option value="oldest">Oldest Inwards</option>
                  <option value="qty-high">Quantity: High to Low</option>
                  <option value="a-z">Product (A-Z)</option>
                </select>
              </div>
              <div className="filter-item date-item">
                <span className="label">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>
              <div className="filter-item date-item">
                <span className="label">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
              <button
                className="btn-reset position-relative"
                onClick={handleResetFilters}
              >
                <RotateCcw size={14} /> Reset
                {activeFiltersCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: "9px", padding: "3px 5px" }}
                  >
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </CompactFilterBar>

            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <th>Batch & Date</th>
                    <th>Product Details</th>
                    <th>Purchased Bill No.</th>
                    <th>Inward Qty</th>
                    <th>Processed By</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {initialLoad || loading || isRefreshing ? (
                    <SkeletonTableRows rows={itemsPerPage} columns={6} />
                  ) : currentRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{ padding: "3rem 0", borderBottom: "none" }}
                      >
                        <PremiumEmptyState
                          icon={PackageOpen}
                          title="No Inward Records Found"
                          subtitle="No stock inward entries match your search or filters."
                        />
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((p, i) => (
                      <tr
                        key={p.id}
                        className="fade-in list-row"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <td>
                          <div className="fw-bold text-custom">
                            {p.batchNo || "N/A"}
                          </div>
                          <small className="text-muted-custom">
                            {p.inwardDate
                              ? new Date(p.inwardDate).toLocaleDateString()
                              : "-"}
                          </small>
                        </td>
                        <td>
                          <div className="product-info">
                            <div className="prd-avatar bg-primary-subtle text-primary">
                              <i className="fas fa-box"></i>
                            </div>
                            <span className="text-custom fw-medium">
                              {p.product || "-"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="badge-custom">
                            {p.billNo || "-"}
                          </span>
                        </td>
                        <td>
                          <div className="price-tag text-info">{p.qty}</div>
                        </td>
                        <td>
                          <span className="text-muted-custom">
                            {p.staff || "-"}
                          </span>
                        </td>
                        <td>
                          <div className="price-tag text-info">
                            {p.availableQty ?? p.AvailableQty}
                          </div>
                          <small style={{ color: "gray" }}>
                            Used: {p.usedQty ?? p.UsedQty}
                          </small>
                        </td>
                        <td>
                          <ActionButtons>
                            <button
                              className="edit"
                              title={
                                isFyLocked
                                  ? "Locked in active FY"
                                  : "Edit Record"
                              }
                              onClick={() => handleEdit(p.id)}
                              disabled={isFyLocked}
                            >
                              <Edit3 size={16} />
                            </button>
                            <div className="action-divider"></div>
                            <button
                              className="delete"
                              title={
                                isFyLocked
                                  ? "Locked in active FY"
                                  : "Delete Record"
                              }
                              onClick={() => handleDelete(p.id)}
                              disabled={isFyLocked}
                            >
                              <Trash2 size={16} />
                            </button>
                          </ActionButtons>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableWrapper>

            {!loading &&
              !initialLoad &&
              processedData.length > itemsPerPage && (
                <PaginationWrapper className="mt-4 pt-3 border-top border-custom">
                  <span className="text-muted-custom small fw-medium text-center text-md-start">
                    Showing <b>{indexOfFirst + 1}</b> to{" "}
                    <b>{Math.min(indexOfLast, processedData.length)}</b> of{" "}
                    <b>{processedData.length}</b> entries
                  </span>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="action-btn-page"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((c) => c - 1)}
                    >
                      <ChevronLeft size={16} className="me-1" /> Prev
                    </button>
                    <span className="page-indicator">
                      {currentPage} / {totalPages || 1}
                    </span>
                    <button
                      className="action-btn-page"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((c) => c + 1)}
                    >
                      Next <ChevronRight size={16} className="ms-1" />
                    </button>
                  </div>
                </PaginationWrapper>
              )}
          </SolidCard>

          <AnimatePresence>
            {showModal && (
              <ModalOverlay
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                onClick={() => {
                  if (!submitLoading) {
                    setShowModal(false);
                    setForm(emptyForm);
                  }
                }}
              >
                <ModalContent
                  initial={{ scale: 0.95, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.95, y: 20, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ModalHeader>
                    <h5 className="fw-bolder mb-0 text-custom d-flex align-items-center gap-3 fs-4">
                      <div className="icon-box-sm bg-primary-subtle text-primary shadow-sm">
                        <PackageOpen size={20} />
                      </div>
                      {form.id > 0
                        ? "Edit Godown Receipt"
                        : "New Inward Receipt"}
                    </h5>
                    <button
                      className="close-btn"
                      onClick={() => setShowModal(false)}
                      disabled={submitLoading}
                    >
                      <X size={20} />
                    </button>
                  </ModalHeader>
                  <div
                    className="modal-body p-4 custom-scrollbar"
                    style={{ maxHeight: "70vh", overflowY: "auto" }}
                  >
                    <div className="row g-3">
                      <div className="col-12">
                        <FormGroup>
                          <label>Select Purchased Item *</label>
                          <FormSelect
                            name="purchaseItemId"
                            value={form.purchaseItemId}
                            onChange={handleChange}
                            disabled={submitLoading}
                            autoFocus // 🔥 UX Improvement: Auto focus on first input
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
                                  Bill: {billNo} | Item: {prdName} | Pending
                                  Qty: {remQty}
                                </option>
                              );
                            })}
                          </FormSelect>
                          <small className="text-muted-custom ms-1">
                            Only shows items that haven't been fully inwarded.
                          </small>
                        </FormGroup>
                      </div>
                      <div className="col-md-6">
                        <FormGroup>
                          <label>Batch Number</label>
                          <FormInput
                            type="text"
                            name="batchNo"
                            value={form.batchNo}
                            onChange={handleChange}
                            placeholder="e.g. BATCH-A01 (Optional)"
                            disabled={submitLoading}
                          />
                        </FormGroup>
                      </div>
                      <div className="col-md-6">
                        <FormGroup>
                          <label>Inward Date *</label>
                          <FormInput
                            type="date"
                            name="inwardDate"
                            value={form.inwardDate}
                            onChange={handleChange}
                            disabled={submitLoading}
                          />
                        </FormGroup>
                      </div>
                      <div className="col-md-6">
                        <FormGroup>
                          <label>Received Quantity *</label>
                          <FormInput
                            type="number"
                            name="qty"
                            value={form.qty}
                            onChange={handleChange}
                            placeholder="0"
                            disabled={submitLoading}
                          />
                        </FormGroup>
                      </div>
                      <div className="col-md-6">
                        <FormGroup>
                          <label>Processed By (Staff) *</label>
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
                      </div>
                      <div className="col-12">
                        <FormGroup>
                          <label>Remarks / Notes</label>
                          <FormInput
                            type="text"
                            name="remark"
                            value={form.remark}
                            onChange={handleChange}
                            placeholder="Any condition notes..."
                            disabled={submitLoading}
                          />
                        </FormGroup>
                      </div>
                    </div>
                  </div>
                  <ModalFooter>
                    <button
                      className="modal-action-btn danger"
                      onClick={() => setShowModal(false)}
                      disabled={submitLoading}
                    >
                      <X size={16} className="me-2" /> Cancel
                    </button>
                    <button
                      className="modal-action-btn success"
                      onClick={handleSave}
                      disabled={submitLoading}
                    >
                      {submitLoading ? (
                        <RefreshCcw className="spin me-2" size={16} />
                      ) : (
                        <CheckCircle2 size={16} className="me-2" />
                      )}
                      {submitLoading
                        ? "Saving..."
                        : form.id > 0
                          ? "Update Stock"
                          : "Save Stock Inward"}
                    </button>
                  </ModalFooter>
                </ModalContent>
              </ModalOverlay>
            )}
          </AnimatePresence>

          <style>{`
            .swal2-container { z-index: 99999 !important; }
            .spin { animation: rotate 1s linear infinite; }
            @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          `}</style>
        </MainContainer>
      </PageTransition>
    </>
  );
}

/* ================= STYLED COMPONENTS ================= */
const animFadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const slideUpScale = keyframes`from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); }`;

const MainContainer = styled.div`
  min-height: 100vh;
  color: var(--text);
  /* 🌟 VISUAL SCALE COMPLIANCE - ZOOM EFFECT 80% */
  zoom: 0.8;
`;
const BreadcrumbLink = styled(Link)`
  color: var(--text-muted);
  text-decoration: none;
  font-weight: 500;
  &:hover {
    color: var(--primary);
  }
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  .gradient-text {
    background: linear-gradient(90deg, var(--primary), #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: inline-block;
  }
`;

const FyBadgeWrapper = styled.div`
  margin-bottom: 24px;
`;

const FyBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
  padding: 8px 16px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);

  &.error {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.1);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
  }
`;

const PremiumBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 13px;
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
      filter: brightness(1.1);
    }
  }

  &.secondary {
    background: var(--card);
    color: var(--text);
    border: 1px solid var(--border-custom);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      border-color: var(--primary);
      color: var(--primary);
      box-shadow: 0 8px 16px rgba(59, 130, 246, 0.15);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
`;

const SummaryCard = styled.div`
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  transition: 0.3s;
  box-shadow: 0 4px 6px rgba(13, 51, 236, 0.81);
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.05);
  }
  .icon-box {
    width: 60px;
    height: 60px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
  }
  .content p {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.9rem;
    font-weight: 500;
  }
  .content h3 {
    margin: 5px 0 0 0;
    color: var(--text);
    font-weight: 700;
    font-size: 1.8rem;
  }
  &.primary-tint .icon-box {
    background: rgba(59, 130, 246, 0.1);
    color: var(--primary);
  }
  &.info-tint .icon-box {
    background: rgba(14, 165, 233, 0.1);
    color: #0ea5e9;
  }
  &.success-tint .icon-box {
    background: rgba(34, 197, 94, 0.1);
    color: var(--success);
  }
`;

const SolidCard = styled.div`
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  box-shadow: 0 4px 6px rgba(13, 51, 236, 0.81);
`;

const CompactFilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-light-custom);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--border-custom);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
  overflow-x: auto;
  white-space: nowrap;

  &::-webkit-scrollbar {
    height: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-custom);
    border-radius: 10px;
  }

  @media (max-width: 992px) {
    flex-wrap: wrap;
  }

  .filter-item {
    display: flex;
    align-items: center;
    background: var(--card);
    border: 1px solid var(--border-custom);
    border-radius: 8px;
    padding: 0 12px;
    height: 38px;
    transition: all 0.3s ease;
    flex: 1 1 auto;
    min-width: 140px;

    &:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .icon {
      color: var(--text-muted);
      margin-right: 8px;
    }

    .label {
      color: var(--text-muted);
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      margin-right: 8px;
    }

    input,
    select {
      border: none;
      background: transparent;
      color: var(--text);
      font-size: 13px;
      font-weight: 600;
      width: 100%;
      outline: none;
    }

    input[type="date"]::-webkit-calendar-picker-indicator {
      cursor: pointer;
      filter: invert(0.5);
    }
    [data-theme="dark"] input[type="date"]::-webkit-calendar-picker-indicator {
      filter: invert(1);
    }
  }

  .search-item {
    min-width: 250px;
    flex: 2 1 auto;
  }

  .btn-reset {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 38px;
    padding: 0 16px;
    border-radius: 8px;
    border: 1px solid rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.05);
    color: #ef4444;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;

    &:hover {
      background: #ef4444;
      color: white;
    }
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid var(--border-custom);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    padding: 16px;
    text-align: left;
    color: #38bdf8;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: var(--bg-light-custom);
    border-bottom: 1px solid var(--border-custom);
    white-space: nowrap;
  }

  td {
    padding: 16px;
    vertical-align: middle;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-bottom: 1px solid var(--border-custom);
  }

  tr.list-row {
    background: var(--card);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
      background: var(--bg-hover);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.08);
      td {
        border-color: rgba(59, 130, 246, 0.2);
      }
    }
  }

  .product-info {
    display: flex;
    align-items: center;
    gap: 12px;
    .prd-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      background: rgba(37, 99, 235, 0.1);
      color: var(--primary);
    }
  }
  .badge-custom {
    background: rgba(37, 99, 235, 0.1);
    color: var(--primary);
    padding: 5px 12px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .price-tag {
    font-weight: 700;
    font-size: 1rem;
  }
  .fade-in {
    animation: ${animFadeIn} 0.5s ease forwards;
    opacity: 0;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  .action-divider {
    width: 1px;
    height: 20px;
    background: var(--border-custom);
    margin: 0 4px;
  }

  button {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid var(--border-custom);
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-light-custom);
    color: var(--text-muted);

    &.edit:hover:not(:disabled) {
      background: #0ea5e9;
      color: white;
      border-color: #0ea5e9;
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
    }

    &.delete:hover:not(:disabled) {
      background: #ef4444;
      color: white;
      border-color: #ef4444;
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;

  .action-btn-page {
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid var(--border-custom);
    background: var(--card);
    color: var(--text);
    font-weight: 600;
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
      color: white;
      border-color: transparent;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      transform: translateY(-2px);
    }
  }

  .page-indicator {
    color: var(--primary);
    font-weight: 800;
    padding: 6px 16px;
    background: rgba(59, 130, 246, 0.1);
    border-radius: 8px;
    border: 1px solid rgba(59, 130, 246, 0.2);
    font-size: 13px;
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
`;

const ModalContent = styled(motion.div)`
  background: var(--card);
  color: var(--text);
  width: 90%;
  max-width: 800px;
  border-radius: 20px;
  border: 1px solid var(--border-custom);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(59, 130, 246, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
`;

const ModalHeader = styled.div`
  padding: 24px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-light-custom);
  border-bottom: 1px solid var(--border-custom);

  .icon-box-sm {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .close-btn {
    background: var(--card);
    border: 1px solid var(--border-custom);
    color: var(--text-muted);
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
      background: var(--danger);
      color: white;
      border-color: var(--danger);
      transform: rotate(90deg);
      box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
    }
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text);
    margin-left: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const FormInput = styled.input`
  width: 100%;
  padding: 14px 18px;
  border-radius: 12px;
  background: var(--bg-light-custom);
  color: var(--text) !important;
  border: 1px solid var(--border-custom);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;

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
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
    outline: none;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 14px 18px;
  border-radius: 12px;
  background: var(--bg-light-custom);
  color: var(--text) !important;
  border: 1px solid var(--border-custom);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    border-color: rgba(59, 130, 246, 0.5);
  }
  &:focus:not(:disabled) {
    background: var(--card);
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
    outline: none;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ModalFooter = styled.div`
  padding: 24px 30px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--border-custom);
  background: var(--bg-light-custom);

  .modal-action-btn {
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 13px;
    border: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;

    &.danger {
      background: transparent;
      color: #ef4444;
      border: 1px solid #ef4444;
    }

    &.danger:hover:not(:disabled) {
      background: #ef4444;
      color: white;
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
      transform: translateY(-2px);
    }

    &.success {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    }

    &.success:hover:not(:disabled) {
      filter: brightness(1.1);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }
`;
