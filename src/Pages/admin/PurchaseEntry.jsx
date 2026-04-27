import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  RefreshCcw,
  AlertCircle,
  Calendar,
  Building2,
  FileText,
  Search,
  Filter,
  Plus,
  RotateCcw,
  CheckCircle2,
  X,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  MapPin,
  Truck,
  Hash,
  Percent,
  Phone,
  PackagePlus,
  Briefcase,
  Wallet,
} from "lucide-react";

// 🌟 Import Axios Service
import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
} from "../../../Services/axiosService";

// 🌟 Import SweetAlert
import {
  successAlert,
  errorAlert,
  warningAlert,
  confirmAlert,
} from "./../../../Services/sweetAlert";

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
  return (
    <>
      {isCurrency
        ? `₹${Math.ceil(count).toLocaleString("en-IN")}`
        : Math.ceil(count)}
    </>
  );
};

export default function PurchaseEntry() {
  // 🌟 INITIAL STATES
  const [purchases, setPurchases] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);

  // Filters
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  // Premium UI States
  const [initialLoad, setInitialLoad] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // FY Lock
  const [activeFy, setActiveFy] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Payment State
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: "",
    referenceNo: "",
    remarks: "",
  });

  // ✅ PERFECTED FRONTEND MODEL STATE TO MATCH BACKEND API STRICTLY
  const emptyForm = {
    id: 0,
    vendorId: "",
    billNo: "",
    billDate: "",
    gstType: "GST",
    ewayBillNo: "",
    placeOfSupply: "",
    transportName: "",
    transportMobile: "",
    vehicleNo: "",
    items: [],
  };

  const [form, setForm] = useState(emptyForm);
  const [selectedProduct, setSelectedProduct] = useState("");

  // 🌟 FETCH INITIAL DATA
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setInitialLoad(true);
    try {
      const fyRes = await getRequest("FinancialYear/List");
      if (fyRes.Status === "OK" || fyRes.status === "OK") {
        const fyData = fyRes.Result || fyRes.result || [];
        const currentActiveFy = fyData.find((y) => !y.isDelete) || null;
        setActiveFy(currentActiveFy);
      }

      await Promise.all([
        fetchPurchases(false, true),
        fetchVendors(),
        fetchProducts(),
      ]);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setInitialLoad(false), 700);
    }
  };

  const fetchPurchases = async (isRefresh = false, isInit = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else if (!isInit) setLoading(true);

      const res = await getRequest("PurchaseMaster/List");
      if (res.Status === "OK" || res.status === "OK") {
        setPurchases(res.Result || res.result || []);
      }
    } catch (err) {
      const errMsg =
        err?.Result ||
        err?.result ||
        err?.message ||
        "Failed to fetch purchases";
      errorAlert("Error", errMsg);
    } finally {
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 600);
      else if (!isInit) setTimeout(() => setLoading(false), 400);
    }
  };

  const fetchVendors = async () => {
    try {
      const res = await getRequest("Vendor/List");
      if (res.Status === "OK" || res.status === "OK") {
        setVendors(res.Result || res.result || []);
      }
    } catch (err) {
      console.error("Vendors fetch error", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await getRequest("ProductMaster/List");
      if (res.Status === "OK" || res.status === "OK") {
        setProducts(res.Result || res.result || []);
      }
    } catch (err) {
      console.error("Products fetch error", err);
    }
  };

  const handleRefresh = () => {
    fetchPurchases(true);
    fetchVendors();
    fetchProducts();
  };

  const resetFilters = () => {
    setSearch("");
    setVendorFilter("");
    setFromDate("");
    setToDate("");
    setSortOrder("newest");
    setCurrentPage(1);
  };

  const isFyLocked = !activeFy;
  const activeFiltersCount = [search, vendorFilter, fromDate, toDate].filter(
    Boolean,
  ).length;

  // 🌟 LIVE TOTAL CALCULATIONS FOR UI
  const calculateTotals = () => {
    const grossAmount = form.items.reduce(
      (sum, i) => sum + Number(i.qty) * Number(i.rate),
      0,
    );
    const gstAmount = form.items.reduce((sum, i) => {
      const prod = products.find((p) => p.id === Number(i.productMasterId));
      const gstRate = prod ? Number(prod.gst) || 0 : 0;
      return sum + Number(i.qty) * Number(i.rate) * (gstRate / 100);
    }, 0);
    return {
      grossAmount,
      gstAmount,
      total: grossAmount + gstAmount,
    };
  };

  const uiTotals = calculateTotals();

  // ✅ PERFECTED PAYLOAD BUILDER
  const buildPayload = (staffId) => {
    const { grossAmount, gstAmount, total } = calculateTotals();

    return {
      id: Number(form.id) || 0,
      vendorId: form.vendorId ? Number(form.vendorId) : 0,
      financialYearId: activeFy?.id || 0,
      staffMasterId: staffId || null,
      billNo: form.billNo,
      billDate: form.billDate,
      grossAmount: Number(grossAmount),
      gstAmount: Number(gstAmount),
      total: Number(total),
      gstType: form.gstType || "GST",
      ewayBillNo: form.ewayBillNo || "",
      placeOfSupply: form.placeOfSupply || "",
      transportName: form.transportName || "",
      transportMobile: form.transportMobile || "",
      vehicleNo: form.vehicleNo || "",

      purchaseItems: form.items.map((i) => {
        const prod = products.find((p) => p.id === Number(i.productMasterId));
        const amount = Number(i.qty) * Number(i.rate);
        const gstRate = prod ? Number(prod.gst) || 0 : 0;
        return {
          id: Number(i.id) || 0,
          productMasterId: Number(i.productMasterId),
          qty: Number(i.qty),
          rate: Number(i.rate),
          amount: Number(amount),
          total: Number(amount + amount * (gstRate / 100)),
        };
      }),
    };
  };

  // 🌟 FORM HANDLERS
  const handleAddClick = () => {
    if (isFyLocked) {
      return warningAlert(
        "Financial Year Locked",
        "Cannot add purchases in a closed or missing financial year.",
      );
    }
    setForm({
      ...emptyForm,
      billDate: new Date().toISOString().split("T")[0],
    });
    setSelectedProduct("");
    setShowModal(true);
  };

  // ✏️ EDIT HANDLER
  const handleEdit = async (id) => {
    if (isFyLocked) {
      return warningAlert("Financial Year Locked", "Cannot edit purchases");
    }

    try {
      const res = await getRequest(`PurchaseMaster/Detail/${id}`);

      if (res.Status === "OK" || res.status === "OK") {
        const data = res.Result || res.result;

        const rawItems = data.purchaseItems || data.PurchaseItems || [];

        let mappedItems = rawItems.map((i) => ({
          id: Number(i.id || i.Id || 0),
          productMasterId: Number(i.productMasterId || i.ProductMasterId || 0),
          qty: Number(i.qty || i.Qty || 0),
          rate: Number(i.rate || i.Rate || 0),
        }));

        mappedItems = mappedItems.filter(
          (i) => i.productMasterId > 0 && i.qty > 0 && i.rate > 0,
        );

        setForm({
          id: Number(data.id || data.Id || 0),
          vendorId: data.vendorId || data.VendorId || "",
          billNo: data.billNo || data.BillNo || "",
          billDate: data.billDate
            ? data.billDate.split("T")[0]
            : data.BillDate
              ? data.BillDate.split("T")[0]
              : "",
          gstType: data.gstType || data.GSTType || "GST",
          ewayBillNo: data.ewayBillNo || data.EwayBillNo || "",
          placeOfSupply: data.placeOfSupply || data.PlaceOfSupply || "",
          transportName: data.transportName || data.TransportName || "",
          transportMobile: data.transportMobile || data.TransportMobile || "",
          vehicleNo: data.vehicleNo || data.VehicleNo || "",
          items: mappedItems,
        });

        setShowModal(true);
      }
    } catch (err) {
      console.error("EDIT ERROR:", err);
      errorAlert("Error", "Failed to load purchase");
    }
  };

  // 🗑 DELETE HANDLER
  const handleDelete = async (id) => {
    const confirm = await confirmAlert("Delete?", "Are you sure?");
    if (!confirm.isConfirmed) return;
    try {
      const res = await deleteRequest(`PurchaseMaster/Delete/${id}`);
      if (res.Status === "OK" || res.status === "OK") {
        successAlert("Deleted", "Purchase deleted");
        fetchPurchases();
      } else {
        throw new Error(res.Result || res.result || res.message);
      }
    } catch (err) {
      console.error("Delete Error:", err);
      const errMsg =
        err?.Result ||
        err?.result ||
        err?.message ||
        (typeof err === "string" ? err : "Delete failed");
      errorAlert("Error", errMsg);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleAddItem = () => {
    if (!selectedProduct) return;
    const prod = products.find((p) => p.id === Number(selectedProduct));
    if (!prod) return;

    if (form.items.some((item) => Number(item.productMasterId) === prod.id)) {
      return warningAlert("Duplicate", "Product already added.");
    }

    const newItem = {
      id: 0,
      productMasterId: prod.id,
      qty: 1,
      rate: prod.costPrice || 0,
    };

    setForm({ ...form, items: [...form.items, newItem] });
    setSelectedProduct("");
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...form.items];
    newItems[index] = { ...newItems[index], [field]: parseFloat(value) || 0 };
    setForm({ ...form, items: newItems });
  };

  const handleRemoveItem = (index) => {
    const newItems = form.items.filter((_, i) => i !== index);
    setForm({ ...form, items: newItems });
  };

  // ✅ VALIDATION
  const validateForm = () => {
    if (!form.vendorId) return "Vendor required";
    if (!form.billNo) return "Bill number required";
    if (!form.billDate) return "Bill date required";
    if (!form.items || form.items.length === 0) return "Add at least 1 item";

    for (let item of form.items) {
      if (Number(item.qty) <= 0) return "Qty must be > 0";
      if (Number(item.rate) <= 0) return "Rate must be > 0";
    }

    return null;
  };

  // 💾 SAVE / UPDATE FUNCTION
  const handleSave = async () => {
    try {
      setSubmitLoading(true);

      const error = validateForm();
      if (error) {
        return errorAlert("Validation", error);
      }

      let staffId = null;
      try {
        const staffStr = localStorage.getItem("staffAuth");
        if (staffStr) {
          const staff = JSON.parse(staffStr);
          staffId = staff?.id || null;
        }
      } catch (e) {}

      const payload = buildPayload(staffId);

      let res;
      if (form.id > 0) {
        res = await putRequest("PurchaseMaster/Update", payload);
      } else {
        res = await postRequest("PurchaseMaster/Save", payload);
      }

      if (res.Status !== "OK" && res.status !== "OK") {
        throw new Error(
          res.Result ||
            res.result ||
            res.Message ||
            res.message ||
            "Save failed",
        );
      }

      const data = res.Result || res.result;

      successAlert(
        "Success",
        typeof data === "string"
          ? data
          : form.id > 0
            ? "Purchase Updated"
            : "Purchase Saved",
      );

      fetchPurchases();
      setShowModal(false);
      setForm(emptyForm);
    } catch (err) {
      console.error("❌ SAVE/UPDATE ERROR:", err);
      const errMsg =
        err?.response?.data?.Message ||
        err?.response?.data?.Result ||
        err?.message ||
        "Something went wrong";
      errorAlert("Error", errMsg);
    } finally {
      setSubmitLoading(false);
    }
  };

  // ==========================================
  // 💰 PURCHASE PAYMENT LOGIC
  // ==========================================

  const handlePayment = (purchase) => {
    if (isFyLocked) {
      return warningAlert(
        "Locked",
        "No active Financial Year. Cannot add payment.",
      );
    }

    if (Number(purchase.pendingAmount) <= 0) {
      return successAlert("Settled", "This bill is already fully paid.");
    }

    setSelectedPurchase(purchase);
    setPaymentForm({
      amount: purchase.pendingAmount,
      paymentDate: new Date().toISOString().split("T")[0],
      referenceNo: "",
      remarks: "",
    });
    setShowPaymentModal(true);
  };

  const handleSavePayment = async () => {
    try {
      if (!selectedPurchase) return;
      if (isFyLocked) {
        return warningAlert("Locked", "No active Financial Year.");
      }

      const payAmount = Number(paymentForm.amount);
      if (!payAmount || payAmount <= 0) {
        return warningAlert("Validation", "Enter a valid payment amount");
      }

      if (payAmount > Number(selectedPurchase.pendingAmount)) {
        return warningAlert(
          "Invalid Amount",
          "Payment cannot exceed pending balance.",
        );
      }

      setPaymentSubmitting(true);

      let staffId = null;
      try {
        const staffStr = localStorage.getItem("staffAuth");
        if (staffStr) {
          const staff = JSON.parse(staffStr);
          staffId = staff?.id || null;
        }
      } catch {}

      const payload = {
        id: 0,
        purchaseMasterId: selectedPurchase.id,
        amount: payAmount,
        paymentDate: paymentForm.paymentDate,
        referenceNo: paymentForm.referenceNo || "",
        remarks: paymentForm.remarks || "",
        staffMasterId: staffId,
      };

      console.log("💰 POSTING PAYMENT:", payload);

      const res = await postRequest("PurchasePayment/Save", payload);

      if (res.Status !== "OK" && res.status !== "OK") {
        throw new Error(
          res.Result || res.result || res.Message || "Payment failed",
        );
      }

      successAlert("Success", "Payment recorded successfully!");

      setShowPaymentModal(false);
      setSelectedPurchase(null);
      setPaymentForm({
        amount: "",
        paymentDate: "",
        referenceNo: "",
        remarks: "",
      });

      fetchPurchases(); // 🔥 REFRESH TOTALS
    } catch (err) {
      console.error("❌ PAYMENT ERROR:", err);
      errorAlert(
        "Error",
        err?.message || err?.response?.data?.Message || "Payment failed",
      );
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // 🌟 DATA PROCESSING (Filters & Sort)
  const processedData = useMemo(() => {
    let result = [...purchases];

    if (search) {
      const s = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.billNo?.toLowerCase().includes(s) ||
          p.vendor?.toLowerCase().includes(s),
      );
    }

    if (vendorFilter) {
      result = result.filter(
        (p) => Number(p.vendorId) === Number(vendorFilter),
      );
    }

    if (fromDate) {
      result = result.filter(
        (p) => new Date(p.billDate || p.createdAt) >= new Date(fromDate),
      );
    }

    if (toDate) {
      result = result.filter(
        (p) => new Date(p.billDate || p.createdAt) <= new Date(toDate),
      );
    }

    if (sortOrder === "newest") {
      result.sort(
        (a, b) => new Date(b.billDate || 0) - new Date(a.billDate || 0),
      );
    } else if (sortOrder === "oldest") {
      result.sort(
        (a, b) => new Date(a.billDate || 0) - new Date(b.billDate || 0),
      );
    } else if (sortOrder === "high-val") {
      result.sort((a, b) => b.total - a.total);
    } else if (sortOrder === "low-val") {
      result.sort((a, b) => a.total - b.total);
    }

    return result;
  }, [purchases, search, vendorFilter, fromDate, toDate, sortOrder]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentRecords = processedData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, vendorFilter, fromDate, toDate, sortOrder]);

  // 🌟 DYNAMIC STATS
  const totalPurchaseValue = purchases.reduce(
    (sum, p) => sum + (Number(p.total) || 0),
    0,
  );
  const currentMonthPurchases = useMemo(() => {
    const today = new Date();
    return purchases.reduce((sum, p) => {
      const d = new Date(p.billDate || p.createdAt);
      if (
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
      ) {
        return sum + (Number(p.total) || 0);
      }
      return sum;
    }, 0);
  }, [purchases]);
  const totalInvoices = purchases.length;

  return (
    <div style={{ zoom: 0.85 }}>
      <GlobalLoader isLoading={initialLoad} />
      <PageTransition>
        <PageWrapper className="p-3 p-md-4">
          <HeaderSection className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
            <div className="title-area">
              <PageTitle className="fw-bold m-0 gradient-text">
                <ShoppingCart className="title-icon me-2" size={28} /> Purchase
                Entry
              </PageTitle>
              <p className="subtitle text-muted-custom mt-1 mb-0">
                Manage vendor bills and inbound inventory
              </p>
            </div>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <PremiumBtn
                className="secondary"
                onClick={handleRefresh}
                disabled={loading || isRefreshing || initialLoad}
              >
                <RefreshCcw size={16} className={isRefreshing ? "spin" : ""} />
                {isRefreshing ? "Syncing..." : "Sync"}
              </PremiumBtn>
              <PremiumBtn
                className="primary"
                onClick={handleAddClick}
                disabled={isFyLocked}
                style={{ opacity: isFyLocked ? 0.6 : 1 }}
              >
                <Plus size={16} className="me-1" /> New Purchase
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

          {/* 📊 Premium Summary Cards */}
          <SummaryGrid className="mb-4">
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
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <span
                        className="text-muted-custom fw-semibold text-uppercase tracking-wide"
                        style={{ fontSize: "11px" }}
                      >
                        Lifetime Purchase
                      </span>
                      <div className="icon-box bg-primary-subtle text-primary">
                        <IndianRupee size={24} />
                      </div>
                    </div>
                    <h3 className="fw-bold mt-2 text-custom mb-0">
                      <AnimatedNumber value={totalPurchaseValue} isCurrency />
                    </h3>
                    <small className="text-success mt-2 d-block fw-bold">
                      <i className="fas fa-check-circle me-1"></i> Total Bill
                      Value
                    </small>
                  </div>
                </SummaryCard>

                <SummaryCard>
                  <div className="inner-content">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <span
                        className="text-muted-custom fw-semibold text-uppercase tracking-wide"
                        style={{ fontSize: "11px" }}
                      >
                        This Month
                      </span>
                      <div className="icon-box bg-info-subtle text-info">
                        <Calendar size={24} />
                      </div>
                    </div>
                    <h3 className="fw-bold mt-2 text-custom mb-0">
                      <AnimatedNumber
                        value={currentMonthPurchases}
                        isCurrency
                      />
                    </h3>
                    <small className="text-muted-custom mt-2 d-block fw-bold">
                      Current Month Spends
                    </small>
                  </div>
                </SummaryCard>

                <SummaryCard>
                  <div className="inner-content">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <span
                        className="text-muted-custom fw-semibold text-uppercase tracking-wide"
                        style={{ fontSize: "11px" }}
                      >
                        Total Invoices
                      </span>
                      <div className="icon-box bg-warning-subtle text-warning">
                        <FileText size={24} />
                      </div>
                    </div>
                    <h3 className="fw-bold mt-2 text-custom mb-0">
                      <AnimatedNumber value={totalInvoices} />
                    </h3>
                    <small className="text-warning mt-2 d-block fw-bold">
                      Bills Recorded
                    </small>
                  </div>
                </SummaryCard>
              </>
            )}
          </SummaryGrid>

          <MainGlassCard className="p-3 p-md-4 mb-4">
            {/* 🔍 Premium Single Row Compact Filter Bar */}
            <CompactFilterBar className="mb-4">
              <div className="filter-item search-item">
                <Search size={14} className="icon" />
                <input
                  type="text"
                  placeholder="Search bills, vendors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="filter-item">
                <Building2 size={14} className="icon" />
                <select
                  value={vendorFilter}
                  onChange={(e) => setVendorFilter(e.target.value)}
                >
                  <option value="">All Vendors</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.businessName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-item">
                <Filter size={14} className="icon" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="high-val">Highest Value</option>
                  <option value="low-val">Lowest Value</option>
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
                onClick={resetFilters}
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
              <StyledTable>
                <thead>
                  <tr>
                    <th>Bill Details</th>
                    <th>Vendor</th>
                    <th>Date</th>
                    <th>Total Value</th>
                    <th>Paid</th>
                    <th>Pending</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {initialLoad || loading || isRefreshing ? (
                    <SkeletonTableRows rows={itemsPerPage} columns={8} />
                  ) : currentRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        style={{ padding: "3rem 0", borderBottom: "none" }}
                      >
                        <PremiumEmptyState
                          icon={<ShoppingCart size={36} strokeWidth={1.5} />}
                          title="No Purchase Records Found"
                          subtitle="No purchase bills match your search or filters."
                        />
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((p) => (
                      <tr key={p.id} className="list-row">
                        <td>
                          <div className="product-info">
                            <div className="prd-avatar shadow-sm">
                              <FileText size={20} />
                            </div>
                            <div>
                              <div className="fw-bolder text-custom fs-6">
                                {p.billNo}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-custom fw-medium">
                            {p.vendor || "-"}
                          </span>
                        </td>
                        <td>
                          <span className="text-muted-custom small">
                            {new Date(
                              p.billDate || p.createdAt,
                            ).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </td>
                        <td>
                          <span className="text-custom fw-bold">
                            ₹{Number(p.total).toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td>
                          <span className="text-success fw-bold">
                            ₹{Number(p.paidAmount || 0).toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td>
                          <span className="text-danger fw-bold">
                            ₹
                            {Number(p.pendingAmount || 0).toLocaleString(
                              "en-IN",
                            )}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              p.status === "Paid"
                                ? "bg-success"
                                : p.status === "Partial"
                                  ? "bg-warning text-dark"
                                  : "bg-danger"
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td>
                          <ActionButtons>
                            <button
                              className="edit"
                              onClick={() => handleEdit(p.id)}
                              disabled={isFyLocked}
                              title={
                                isFyLocked ? "Locked in active FY" : "Edit"
                              }
                            >
                              <Edit3 size={16} />
                            </button>
                            <div className="action-divider"></div>
                            <button
                              className="delete"
                              onClick={() => handleDelete(p.id)}
                              disabled={isFyLocked}
                              title={
                                isFyLocked ? "Locked in active FY" : "Delete"
                              }
                            >
                              <Trash2 size={16} />
                            </button>
                            <div className="action-divider"></div>
                            <PremiumBtn
                              className="info"
                              style={{
                                padding: "6px 12px",
                                fontSize: "12px",
                                height: "36px",
                              }}
                              onClick={() => handlePayment(p)}
                              disabled={isFyLocked || p.pendingAmount <= 0}
                              title={
                                p.pendingAmount <= 0
                                  ? "Fully Paid"
                                  : "Add Payment"
                              }
                            >
                              <Wallet size={14} /> Pay
                            </PremiumBtn>
                          </ActionButtons>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </StyledTable>
            </TableWrapper>

            {/* 🌟 Pagination Logic */}
            {!loading &&
              !initialLoad &&
              processedData.length > itemsPerPage && (
                <PaginationWrapper className="mt-4 pt-3 border-top border-custom">
                  <span className="text-muted-custom small fw-medium">
                    Showing <b>{indexOfFirst + 1}</b> to{" "}
                    <b>{Math.min(indexOfLast, processedData.length)}</b> of{" "}
                    <b>{processedData.length}</b> entries
                  </span>
                  <div className="d-flex gap-2">
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
          </MainGlassCard>

          {/* 🎭 PURCHASE ENTRY MODAL */}
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
                  style={{ maxWidth: "1000px" }}
                >
                  <ModalHeader>
                    <h5 className="fw-bolder mb-0 text-custom d-flex align-items-center gap-3 fs-4">
                      <div className="icon-box-sm bg-primary-subtle text-primary shadow-sm">
                        <ShoppingCart size={20} />
                      </div>
                      {form.id > 0
                        ? "Edit Purchase Bill"
                        : "New Purchase Entry"}
                    </h5>
                    <button
                      className="close-btn"
                      onClick={() => {
                        if (!submitLoading) {
                          setShowModal(false);
                          setForm(emptyForm);
                        }
                      }}
                      disabled={submitLoading}
                    >
                      <X size={20} />
                    </button>
                  </ModalHeader>

                  <div
                    className="modal-body p-4 custom-scrollbar"
                    style={{ maxHeight: "75vh", overflowY: "auto" }}
                  >
                    <div className="row g-4">
                      {/* SECTION 1: Basic Info */}
                      <div className="col-12">
                        <h6
                          className="text-primary border-bottom border-custom pb-2 fw-bold text-uppercase"
                          style={{ fontSize: "12px", letterSpacing: "0.5px" }}
                        >
                          <Briefcase size={14} className="me-2" /> Document
                          Details
                        </h6>
                      </div>

                      <div className="col-md-4">
                        <FormGroup>
                          <label>
                            Vendor <span className="text-danger">*</span>
                          </label>
                          <FormSelect
                            name="vendorId"
                            value={form.vendorId}
                            onChange={handleChange}
                            disabled={submitLoading}
                          >
                            <option value="">Select Vendor</option>
                            {vendors.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.businessName}
                              </option>
                            ))}
                          </FormSelect>
                        </FormGroup>
                      </div>

                      <div className="col-md-4">
                        <FormGroup>
                          <label>
                            Bill Number <span className="text-danger">*</span>
                          </label>
                          <FormInput
                            name="billNo"
                            value={form.billNo}
                            onChange={handleChange}
                            placeholder="e.g. INV-123"
                            disabled={submitLoading}
                          />
                        </FormGroup>
                      </div>

                      <div className="col-md-4">
                        <FormGroup>
                          <label>
                            Bill Date <span className="text-danger">*</span>
                          </label>
                          <FormInput
                            type="date"
                            name="billDate"
                            value={form.billDate}
                            onChange={handleChange}
                            disabled={submitLoading}
                          />
                        </FormGroup>
                      </div>

                      <div className="col-md-4">
                        <FormGroup>
                          <label>GST Type</label>
                          <FormSelect
                            name="gstType"
                            value={form.gstType}
                            onChange={handleChange}
                            disabled={submitLoading}
                          >
                            <option value="" disabled hidden></option>
                            <option value="GST">GST</option>
                            <option value="IGST">IGST</option>
                            <option value="EXEMPT">Exempt</option>
                          </FormSelect>
                        </FormGroup>
                      </div>

                      {/* SECTION 2: Transport & Shipping */}
                      <div className="col-12 mt-4">
                        <h6
                          className="text-primary border-bottom border-custom pb-2 fw-bold text-uppercase"
                          style={{ fontSize: "12px", letterSpacing: "0.5px" }}
                        >
                          <Truck size={14} className="me-2" /> Shipping &
                          Transport
                        </h6>
                      </div>

                      <div className="col-md-4">
                        <FormGroup>
                          <label>E-Way Bill No.</label>
                          <FormInput
                            name="ewayBillNo"
                            value={form.ewayBillNo}
                            onChange={handleChange}
                            placeholder="Optional"
                            disabled={submitLoading}
                          />
                        </FormGroup>
                      </div>

                      <div className="col-md-4">
                        <FormGroup>
                          <label>Place of Supply</label>
                          <FormInput
                            name="placeOfSupply"
                            value={form.placeOfSupply}
                            onChange={handleChange}
                            placeholder="City, State"
                            disabled={submitLoading}
                          />
                        </FormGroup>
                      </div>

                      <div className="col-md-4">
                        <FormGroup>
                          <label>Transport Name</label>
                          <FormInput
                            name="transportName"
                            value={form.transportName}
                            onChange={handleChange}
                            placeholder="Transporter"
                            disabled={submitLoading}
                          />
                        </FormGroup>
                      </div>

                      <div className="col-md-4">
                        <FormGroup>
                          <label>Transport Mobile</label>
                          <FormInput
                            name="transportMobile"
                            value={form.transportMobile}
                            onChange={handleChange}
                            placeholder="Mobile No."
                            disabled={submitLoading}
                          />
                        </FormGroup>
                      </div>

                      <div className="col-md-4">
                        <FormGroup>
                          <label>Vehicle No.</label>
                          <FormInput
                            name="vehicleNo"
                            value={form.vehicleNo}
                            onChange={handleChange}
                            placeholder="e.g. GJ 06 AB 1234"
                            disabled={submitLoading}
                          />
                        </FormGroup>
                      </div>

                      {/* SECTION 3: Items */}
                      <div className="col-12 mt-4">
                        <h6
                          className="text-primary border-bottom border-custom pb-2 fw-bold text-uppercase"
                          style={{ fontSize: "12px", letterSpacing: "0.5px" }}
                        >
                          <PackagePlus size={14} className="me-2" /> Inventory
                          Items
                        </h6>
                      </div>

                      <div className="col-md-9">
                        <FormGroup>
                          <label>Select Product to Add</label>
                          <FormSelect
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            disabled={submitLoading}
                          >
                            <option value="">-- Choose Product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Code: {p.code})
                              </option>
                            ))}
                          </FormSelect>
                        </FormGroup>
                      </div>

                      <div className="col-md-3 d-flex align-items-end">
                        <PremiumBtn
                          className="primary w-100"
                          style={{ height: "48px", padding: "0" }}
                          onClick={handleAddItem}
                          disabled={submitLoading || !selectedProduct}
                        >
                          <Plus size={16} className="me-2" /> Add Item
                        </PremiumBtn>
                      </div>

                      <div className="col-12">
                        <div className="table-responsive border border-custom rounded">
                          <table className="table table-bordered mb-0">
                            <thead
                              className="bg-light-custom"
                              style={{ fontSize: "12px" }}
                            >
                              <tr>
                                <th>Item Name</th>
                                <th width="100">Qty</th>
                                <th width="120">Rate</th>
                                <th width="120">Amount</th>
                                <th width="120">Total (w/ GST)</th>
                                <th width="50" className="text-center">
                                  <Trash2 size={14} className="text-muted" />
                                </th>
                              </tr>
                            </thead>
                            <tbody style={{ fontSize: "13px" }}>
                              {form.items.length === 0 ? (
                                <tr>
                                  <td
                                    colSpan="6"
                                    className="text-center py-4 text-muted"
                                  >
                                    No items added yet. Please select a product
                                    above.
                                  </td>
                                </tr>
                              ) : (
                                form.items.map((item, index) => {
                                  const pData = products.find(
                                    (p) =>
                                      p.id === Number(item.productMasterId),
                                  );
                                  const pName = pData ? pData.name : "Unknown";
                                  const pGst = pData
                                    ? Number(pData.gst) || 0
                                    : 0;
                                  const amt =
                                    Number(item.qty) * Number(item.rate);
                                  const tAmt = amt + amt * (pGst / 100);

                                  return (
                                    <tr key={index}>
                                      <td className="align-middle fw-bold">
                                        {pName}
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          value={item.qty}
                                          min="1"
                                          onChange={(e) =>
                                            handleItemChange(
                                              index,
                                              "qty",
                                              e.target.value,
                                            )
                                          }
                                          disabled={submitLoading}
                                          style={{
                                            background:
                                              "var(--bg-light-custom)",
                                            color: "var(--text)",
                                            border:
                                              "1px solid var(--border-custom)",
                                          }}
                                        />
                                      </td>
                                      <td>
                                        <input
                                          type="number"
                                          className="form-control form-control-sm"
                                          value={item.rate}
                                          min="0"
                                          onChange={(e) =>
                                            handleItemChange(
                                              index,
                                              "rate",
                                              e.target.value,
                                            )
                                          }
                                          disabled={submitLoading}
                                          style={{
                                            background:
                                              "var(--bg-light-custom)",
                                            color: "var(--text)",
                                            border:
                                              "1px solid var(--border-custom)",
                                          }}
                                        />
                                      </td>
                                      <td className="align-middle">
                                        ₹{amt.toFixed(2)}
                                      </td>
                                      <td className="align-middle fw-bold text-primary">
                                        ₹{tAmt.toFixed(2)}
                                      </td>
                                      <td className="align-middle text-center p-2">
                                        <ActionButtons
                                          style={{
                                            gap: 0,
                                            justifyContent: "center",
                                          }}
                                        >
                                          <button
                                            className="delete"
                                            style={{
                                              width: "28px",
                                              height: "28px",
                                            }}
                                            onClick={() =>
                                              handleRemoveItem(index)
                                            }
                                            disabled={submitLoading}
                                          >
                                            <Trash2 size={14} />
                                          </button>
                                        </ActionButtons>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* SECTION 4: Bill Summary */}
                      <div className="col-md-6 offset-md-6 mt-4">
                        <div className="bg-light-custom p-3 rounded border border-custom">
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted fw-bold">
                              Gross Amount:
                            </span>
                            <span className="fw-bold text-custom">
                              ₹{uiTotals.grossAmount.toFixed(2)}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span className="text-muted fw-bold">
                              Tax Amount (GST):
                            </span>
                            <span className="fw-bold text-custom">
                              ₹{uiTotals.gstAmount.toFixed(2)}
                            </span>
                          </div>
                          <hr className="my-2 border-custom" />
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-primary fw-bolder fs-5">
                              Grand Total:
                            </span>
                            <span
                              className="text-primary fw-bolder fs-4"
                              style={{
                                textShadow: "0 0 10px rgba(59,130,246,0.3)",
                              }}
                            >
                              ₹{uiTotals.total.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <ModalFooter>
                    <button
                      className="modal-action-btn danger"
                      onClick={() => {
                        setShowModal(false);
                        setForm(emptyForm);
                      }}
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
                          ? "Update Purchase"
                          : "Save Purchase"}
                    </button>
                  </ModalFooter>
                </ModalContent>
              </ModalOverlay>
            )}
          </AnimatePresence>

          {/* 🎭 PURCHASE PAYMENT MODAL (PREMIUM UI) */}
          <AnimatePresence>
            {showPaymentModal && selectedPurchase && (
              <ModalOverlay
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                onClick={() => {
                  if (!paymentSubmitting) {
                    setShowPaymentModal(false);
                    setSelectedPurchase(null);
                  }
                }}
              >
                <ModalContent
                  initial={{ scale: 0.95, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.95, y: 20, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{ maxWidth: "600px" }}
                >
                  <ModalHeader>
                    <h5 className="fw-bolder mb-0 text-custom d-flex align-items-center gap-3 fs-4">
                      <div className="icon-box-sm bg-info-subtle text-info shadow-sm">
                        <Wallet size={20} />
                      </div>
                      Record Payment
                    </h5>
                    <button
                      className="close-btn"
                      onClick={() => {
                        if (!paymentSubmitting) {
                          setShowPaymentModal(false);
                          setSelectedPurchase(null);
                        }
                      }}
                      disabled={paymentSubmitting}
                    >
                      <X size={20} />
                    </button>
                  </ModalHeader>

                  <div className="modal-body p-4">
                    <div
                      className="p-3 mb-4 rounded d-flex justify-content-between align-items-center"
                      style={{
                        background: "rgba(59, 130, 246, 0.1)",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                      }}
                    >
                      <div>
                        <small className="text-primary d-block fw-bold text-uppercase mb-1">
                          Bill Info
                        </small>
                        <span className="fw-bolder fs-5 text-custom">
                          {selectedPurchase.billNo}
                        </span>
                      </div>
                      <div className="text-end">
                        <small className="text-danger d-block fw-bold text-uppercase mb-1">
                          Pending Balance
                        </small>
                        <span className="fw-bolder fs-4 text-danger">
                          ₹
                          {Number(
                            selectedPurchase.pendingAmount,
                          ).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>

                    <div className="row g-4">
                      <div className="col-md-6">
                        <FormGroup>
                          <label>
                            Payment Amount (₹){" "}
                            <span className="text-danger">*</span>
                          </label>
                          <div className="position-relative">
                            <FormInput
                              type="number"
                              value={paymentForm.amount}
                              onChange={(e) =>
                                setPaymentForm({
                                  ...paymentForm,
                                  amount: e.target.value,
                                })
                              }
                              disabled={paymentSubmitting}
                              placeholder="0.00"
                              max={selectedPurchase.pendingAmount}
                            />
                          </div>
                        </FormGroup>
                      </div>
                      <div className="col-md-6">
                        <FormGroup>
                          <label>
                            Payment Date <span className="text-danger">*</span>
                          </label>
                          <FormInput
                            type="date"
                            value={paymentForm.paymentDate}
                            onChange={(e) =>
                              setPaymentForm({
                                ...paymentForm,
                                paymentDate: e.target.value,
                              })
                            }
                            disabled={paymentSubmitting}
                          />
                        </FormGroup>
                      </div>
                      <div className="col-12">
                        <FormGroup>
                          <label>Reference No. / UTR</label>
                          <FormInput
                            type="text"
                            value={paymentForm.referenceNo}
                            onChange={(e) =>
                              setPaymentForm({
                                ...paymentForm,
                                referenceNo: e.target.value,
                              })
                            }
                            disabled={paymentSubmitting}
                            placeholder="Bank TXN ID or Cheque No."
                          />
                        </FormGroup>
                      </div>
                      <div className="col-12">
                        <FormGroup>
                          <label>Remarks / Notes</label>
                          <FormInput
                            type="text"
                            value={paymentForm.remarks}
                            onChange={(e) =>
                              setPaymentForm({
                                ...paymentForm,
                                remarks: e.target.value,
                              })
                            }
                            disabled={paymentSubmitting}
                            placeholder="Any optional notes"
                          />
                        </FormGroup>
                      </div>
                    </div>
                  </div>

                  <ModalFooter>
                    <button
                      className="modal-action-btn secondary"
                      onClick={() => {
                        setShowPaymentModal(false);
                        setSelectedPurchase(null);
                      }}
                      disabled={paymentSubmitting}
                    >
                      <X size={16} className="me-2" /> Cancel
                    </button>
                    <button
                      className="modal-action-btn success"
                      onClick={handleSavePayment}
                      disabled={
                        paymentSubmitting ||
                        Number(paymentForm.amount) >
                          Number(selectedPurchase.pendingAmount)
                      }
                    >
                      {paymentSubmitting ? (
                        <RefreshCcw className="spin me-2" size={16} />
                      ) : (
                        <CheckCircle2 size={16} className="me-2" />
                      )}
                      {paymentSubmitting ? "Processing..." : "Confirm Payment"}
                    </button>
                  </ModalFooter>
                </ModalContent>
              </ModalOverlay>
            )}
          </AnimatePresence>
        </PageWrapper>
      </PageTransition>
      <style>{`
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ================= STYLED COMPONENTS ================= */

const PageWrapper = styled.div`
  min-height: 100vh;
  color: var(--text);
  font-family: "Inter", sans-serif;
  max-width: 1600px;
  margin: 0 auto;

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--border-custom);
    border-radius: 10px;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;

  .title-area {
    .subtitle {
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 500;
      margin: 4px 0 0 0;
    }
  }
`;

const PageTitle = styled.h2`
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  .title-icon {
    color: #3b82f6;
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

  &.info {
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    color: white;
    box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(14, 165, 233, 0.4);
      filter: brightness(1.1);
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 20px;
`;

const SummaryCard = styled.div`
  position: relative;
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px rgba(13, 51, 236, 0.81);
  z-index: 1;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  .inner-content {
    padding: 20px;
    background: transparent;
    border-radius: 15px;
  }

  &:hover {
    transform: translateY(-5px) scale(1.02);
    box-shadow: 0 16px 40px rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.3);
  }

  .icon-box {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.05);
  }

  &:hover .icon-box {
    transform: scale(1.15) rotate(8deg);
    box-shadow: 0 8px 24px inherit;
  }
`;

const MainGlassCard = styled.div`
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(13, 51, 236, 0.81);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition:
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.4s ease,
    border-color 0.4s ease;

  &:hover {
    box-shadow: 0 16px 40px rgba(59, 130, 246, 0.1);
  }
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

const StyledTable = styled.table`
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

  .prd-avatar {
    width: 42px;
    height: 42px;
    background: rgba(59, 130, 246, 0.15);
    color: var(--primary);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    transition: all 0.3s ease;
  }

  tr.list-row:hover .prd-avatar {
    transform: scale(1.1) rotate(5deg);
    background: var(--primary);
    color: white;
  }

  .product-info {
    display: flex;
    align-items: center;
    gap: 15px;
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
    box-shadow: 0 4px 6px rgba(13, 51, 236, 0.81);
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

/* ================= MODAL COMPONENTS ================= */

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
  max-width: 1000px;
  border-radius: 20px;
  border: 1px solid var(--border-custom);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(59, 130, 246, 0.15);
  overflow: hidden;
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

    &.secondary {
      background: transparent;
      color: var(--text);
      border: 1px solid var(--border-custom);
    }

    &.secondary:hover:not(:disabled) {
      background: var(--bg-hover);
      transform: translateY(-2px);
    }

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
