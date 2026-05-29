import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import { motion } from "framer-motion";
import {
  DollarSign,
  Plus,
  Edit3,
  Trash2,
  Search,
  RefreshCcw,
  X,
  RotateCcw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Hash,
  ToggleLeft,
  ToggleRight,
  Layers,
  CreditCard,
  Activity,
  Calendar,
  Download,
  FileText,
} from "lucide-react";
import { format, isSameMonth } from "date-fns";

import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
} from "../../../../Services/axiosService.jsx";
import {
  successAlert,
  errorAlert,
  warningAlert,
  confirmAlert,
} from "../../../../Services/sweetAlert.jsx";

import GlobalLoader from "../../../components/common/GlobalLoader.jsx";
import PageTransition from "../../../components/common/PageTransition.jsx";
import PremiumEmptyState from "../../../components/common/PremiumEmptyState.jsx";
import { SkeletonTableRows } from "../../../components/common/SkeletonLoader.jsx";
import ExpenseModal from "./ExpenseModal.jsx";
import { exportToPDF, exportToExcel } from "./ExpenseExportService";

/* ─────────────────────────────────────────
   ANIMATED NUMBER
───────────────────────────────────────── */
const AnimatedNumber = ({ value, prefix = "" }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = parseFloat(value) || 0;
    if (end === 0) {
      setCount(0);
      return;
    }
    const increment = end / (800 / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <>
      {prefix}
      {count.toLocaleString(undefined, {
        minimumFractionDigits: prefix ? 2 : 0,
        maximumFractionDigits: prefix ? 2 : 0,
      })}
    </>
  );
};

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function ExpenseMaster() {
  const emptyForm = {
    id: 0,
    expenseDate: new Date().toISOString().split("T")[0],
    expenseCategoryId: "",
    expenseTitle: "",
    amount: "",
    paymentMode: "Bank Transfer",
    referenceNo: "",
    notes: "",
    isApproved: false,
    attachmentURL: "",
  };

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchCategories(), fetchExpenses(false, true)]);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setInitialLoad(false);
      }, 500);
    }
  };

  const fetchCategories = async () => {
    const res = await getRequest("ExpenseCategory/List");
    if (res && (res.status === "OK" || res.Status === "OK")) {
      setCategories(res.result || res.Result || []);
    }
  };

  const fetchExpenses = async (isRefresh = false, skipLoading = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else if (!skipLoading) setLoading(true);

      const res = await getRequest("ExpenseMaster/List");
      if (res && (res.status === "OK" || res.Status === "OK")) {
        // Map category names dynamically if backend doesn't provide them
        const rawData = res.result || res.Result || [];
        setExpenses(rawData);
      }
    } catch (err) {
      errorAlert("Error", "Failed to fetch expenses.");
    } finally {
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 600);
      else if (!skipLoading) setTimeout(() => setLoading(false), 500);
    }
  };

  const handleRefresh = () => fetchExpenses(true);
  const handleMarkPaid = async (id) => {
    try {
      const confirm = window.confirm(
        "Are you sure you want to mark this expense as paid?",
      );

      if (!confirm) return;

      setLoading(true);

      const response = await putRequest(
        `ExpenseMaster/MarkPaid/${id}`,
        {},
        true,
      );

      if (response.status === "OK") {
        alert("Expense marked as paid");

        fetchExpenses();
      } else {
        alert(response.result);
      }
    } catch (error) {
      console.error(error);

      alert("Failed to mark paid");
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleEdit = async (id) => {
    try {
      const res = await getRequest(`ExpenseMaster/Detail/${id}`);
      if (
        res &&
        (res.status === "OK" || res.Status === "OK") &&
        (res.result || res.Result)
      ) {
        const d = res.result || res.Result;
        setForm({
          id: d.id || d.Id || 0,
          expenseDate:
            d.expenseDate || d.ExpenseDate
              ? (d.expenseDate || d.ExpenseDate).split("T")[0]
              : "",
          expenseCategoryId: d.expenseCategoryId || d.ExpenseCategoryId || "",
          expenseTitle: d.expenseTitle || d.ExpenseTitle || "",
          amount: d.amount || d.Amount || "",
          paymentMode: d.paymentMode || d.PaymentMode || "Bank Transfer",
          referenceNo: d.referenceNo || d.ReferenceNo || "",
          notes: d.notes || d.Notes || "",

          attachmentURL: d.attachmentURL || d.AttachmentURL || "",
        });
        setShowModal(true);
      } else {
        errorAlert("Error", res?.message || "Record not found.");
      }
    } catch (err) {
      errorAlert("Error", err?.message || "Server error fetching details.");
    }
  };

  const handleDelete = async (id) => {
    const confirm = await confirmAlert(
      "Delete Expense?",
      "This expense record will be permanently removed.",
    );
    if (!confirm.isConfirmed) return;
    try {
      const res = await deleteRequest(`ExpenseMaster/Delete/${id}`);
      if (res && (res.status === "OK" || res.Status === "OK")) {
        successAlert("Deleted", "Expense removed successfully.");
        fetchExpenses();
      } else throw new Error(res?.message || "Delete failed.");
    } catch (err) {
      errorAlert("Error", err?.message || "Delete operation failed.");
    }
  };

  const handleSave = async () => {
    if (
      !form.expenseTitle?.trim() ||
      !form.amount ||
      !form.expenseDate ||
      !form.expenseCategoryId
    )
      return warningAlert(
        "Validation",
        "Please fill in all required fields (Date, Category, Title, Amount).",
      );

    try {
      setSubmitLoading(true);
      const payload = {
        id: Number(form.id) || 0,
        expenseDate: new Date(form.expenseDate).toISOString(),

        expenseCategoryId: Number(form.expenseCategoryId),
        description: form.expenseTitle.trim(),
        amount: parseFloat(form.amount) || 0,
        paymentMode: form.paymentMode,
        referenceNo: form.referenceNo?.trim() || "",
        notes: form.notes?.trim() || "",
        // isApproved: !!form.isApproved,
        attachmentURL: form.attachmentURL || "",
      };

      const response =
        payload.id > 0
          ? await putRequest("ExpenseMaster/Update", payload)
          : await postRequest("ExpenseMaster/Save", payload);

      if (response && (response.status === "OK" || response.Status === "OK")) {
        successAlert(
          "Success",
          payload.id > 0 ? "Expense updated." : "Expense added.",
        );
        setShowModal(false);
        fetchExpenses();
      } else throw new Error(response?.message || "Save failed.");
    } catch (err) {
      errorAlert("API Error", err?.message || "Server connection failed.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setPaymentFilter("all");
    setDateFrom("");
    setDateTo("");
    setSortOrder("newest");
    setCurrentPage(1);
  };

  // Inject Category Name for UI if backend returns only ID
  const enhancedExpenses = useMemo(() => {
    return expenses.map((exp) => {
      const catId = exp.expenseCategoryId || exp.ExpenseCategoryId;
      const matchedCat = categories.find((c) => (c.id || c.Id) === catId);
      return {
        ...exp,
        calculatedCategoryName:
          exp.categoryName ||
          exp.CategoryName ||
          matchedCat?.categoryName ||
          matchedCat?.CategoryName ||
          "Unknown",
      };
    });
  }, [expenses, categories]);

  // Process Filters
  const processedData = useMemo(() => {
    let list = [...enhancedExpenses];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (e) =>
          (
  e.description ||
  e.Description ||
  e.expenseTitle ||
  e.ExpenseTitle ||
  ""
)
  .toLowerCase()
  .includes(q) ||
          e.calculatedCategoryName.toLowerCase().includes(q) ||
          (e.notes || e.Notes || "").toLowerCase().includes(q) ||
          (e.referenceNo || e.ReferenceNo || "").toLowerCase().includes(q),
      );
    }

    if (categoryFilter !== "all") {
      list = list.filter(
        (e) =>
          (e.expenseCategoryId || e.ExpenseCategoryId) ===
          Number(categoryFilter),
      );
    }
    if (statusFilter === "paid") {
      list = list.filter((e) => e.isPaid || e.IsPaid);
    }

    if (statusFilter === "pending") {
      list = list.filter((e) => !(e.isPaid || e.IsPaid));
    }
    if (paymentFilter !== "all")
      list = list.filter(
        (e) => (e.paymentMode || e.PaymentMode) === paymentFilter,
      );

    if (dateFrom) {
      const from = new Date(dateFrom).setHours(0, 0, 0, 0);
      list = list.filter(
        (e) => new Date(e.expenseDate || e.ExpenseDate).getTime() >= from,
      );
    }
    if (dateTo) {
      const to = new Date(dateTo).setHours(23, 59, 59, 999);
      list = list.filter(
        (e) => new Date(e.expenseDate || e.ExpenseDate).getTime() <= to,
      );
    }

    list.sort((a, b) => {
      const aDate = new Date(a.expenseDate || a.ExpenseDate).getTime();
      const bDate = new Date(b.expenseDate || b.ExpenseDate).getTime();
      const aId = a.id || a.Id || 0;
      const bId = b.id || b.Id || 0;
      if (sortOrder === "newest")
        return bDate !== aDate ? bDate - aDate : bId - aId;
      return aDate !== bDate ? aDate - bDate : aId - bId;
    });
    return list;
  }, [
    enhancedExpenses,
    search,
    categoryFilter,
    statusFilter,
    paymentFilter,
    dateFrom,
    dateTo,
    sortOrder,
  ]);

  const activeFiltersCount = [
    search,
    categoryFilter !== "all",
    statusFilter !== "all",
    paymentFilter !== "all",
    dateFrom,
    dateTo,
  ].filter(Boolean).length;
  const totalPages = Math.max(
    1,
    Math.ceil(processedData.length / itemsPerPage),
  );
  const currentRecords = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Stats Logic
  const totalAmount = enhancedExpenses.reduce(
    (sum, e) => sum + (e.amount || e.Amount || 0),
    0,
  );
  const thisMonthExpenses = enhancedExpenses.filter((e) =>
    isSameMonth(new Date(e.expenseDate || e.ExpenseDate), new Date()),
  );
  const thisMonthAmount = thisMonthExpenses.reduce(
    (sum, e) => sum + (e.amount || e.Amount || 0),
    0,
  );
  const paidCount = enhancedExpenses.filter((e) => e.isPaid || e.IsPaid).length;

  const pendingCount = enhancedExpenses.filter(
    (e) => !(e.isPaid || e.IsPaid),
  ).length;

  // Export Handlers
  const handleExportPDF = () => {
    setExporting(true);
    setTimeout(() => {
      exportToPDF(
        processedData,
        processedData.reduce((sum, e) => sum + (e.amount || e.Amount || 0), 0),
      );
      setExporting(false);
    }, 500);
  };

  const handleExportExcel = () => {
    setExporting(true);
    setTimeout(() => {
      exportToExcel(
        processedData,
        processedData.reduce((sum, e) => sum + (e.amount || e.Amount || 0), 0),
      );
      setExporting(false);
    }, 500);
  };

  return (
    <>
      <GlobalLoader isLoading={loading || exporting} />
      <PageTransition>
        <PageWrapper>
          {/* ─── PAGE HEADER ─── */}
          <PageHeader>
            <HeaderLeft>
              <ModuleIcon>
                <DollarSign size={22} />
              </ModuleIcon>
              <HeaderText>
                <PageTitle>Expense Master</PageTitle>
                <Breadcrumb>
                  <BreadcrumbLink to="/admin/dashboard">
                    Dashboard
                  </BreadcrumbLink>
                  <BreadSep>/</BreadSep>
                  <BreadActive>Expenses</BreadActive>
                </Breadcrumb>
              </HeaderText>
            </HeaderLeft>
            <HeaderRight>
              <SyncIndicator $active={isRefreshing}>
                <div className="dot" />
                <span className="label">
                  {isRefreshing ? "Syncing…" : "Live"}
                </span>
              </SyncIndicator>

              <HeaderBtn
                variant="ghost"
                onClick={handleExportPDF}
                title="Export PDF"
              >
                <FileText size={14} /> PDF
              </HeaderBtn>
              <HeaderBtn
                variant="ghost"
                onClick={handleExportExcel}
                title="Export Excel"
              >
                <Download size={14} /> Excel
              </HeaderBtn>

              <HeaderBtn
                variant="ghost"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCcw size={14} className={isRefreshing ? "spin" : ""} />{" "}
                Refresh
              </HeaderBtn>
              <HeaderBtn variant="primary" onClick={handleAddClick}>
                <Plus size={15} /> Log Expense
              </HeaderBtn>
            </HeaderRight>
          </PageHeader>

          {/* ─── KPI CARDS ─── */}
          <KpiGrid
            as={motion.div}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            {/* TOTAL EXPENSES */}
            <KpiCard $accent="#3b82f6">
              <KpiIconWrap $color="#3b82f6">
                <Layers size={20} />
              </KpiIconWrap>

              <KpiBody>
                <KpiLabel>Total Expenses</KpiLabel>

                <KpiValue>
                  <AnimatedNumber value={totalAmount} prefix="₹" />
                </KpiValue>
              </KpiBody>

              <KpiGlow $color="#3b82f6" />
            </KpiCard>

            {/* THIS MONTH */}
            <KpiCard $accent="#8b5cf6">
              <KpiIconWrap $color="#8b5cf6">
                <Calendar size={20} />
              </KpiIconWrap>

              <KpiBody>
                <KpiLabel>This Month</KpiLabel>

                <KpiValue>
                  <AnimatedNumber value={thisMonthAmount} prefix="₹" />
                </KpiValue>
              </KpiBody>

              <KpiGlow $color="#8b5cf6" />
            </KpiCard>

            {/* PAID */}
            <KpiCard $accent="#10b981">
              <KpiIconWrap $color="#10b981">
                <ToggleRight size={20} />
              </KpiIconWrap>

              <KpiBody>
                <KpiLabel>Paid Expenses</KpiLabel>

                <KpiValue>
                  <AnimatedNumber value={paidCount} />
                </KpiValue>
              </KpiBody>

              <KpiGlow $color="#10b981" />
            </KpiCard>

            {/* PENDING */}
            <KpiCard $accent="#f59e0b">
              <KpiIconWrap $color="#f59e0b">
                <ToggleLeft size={20} />
              </KpiIconWrap>

              <KpiBody>
                <KpiLabel>Pending Expenses</KpiLabel>

                <KpiValue>
                  <AnimatedNumber value={pendingCount} />
                </KpiValue>
              </KpiBody>

              <KpiGlow $color="#f59e0b" />
            </KpiCard>
          </KpiGrid>

          {/* ─── TABLE CARD ─── */}
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
                  placeholder="Search title, category, notes..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
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
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id || c.Id} value={c.id || c.Id}>
                      {c.categoryName || c.CategoryName}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField>
                <Filter size={14} className="fi" />
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
              </FilterField>

              <FilterField>
                <CreditCard size={14} className="fi" />
                <select
                  value={paymentFilter}
                  onChange={(e) => {
                    setPaymentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Payment Modes</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Credit Card">Credit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </FilterField>

              <FilterField title="Start Date">
                <Calendar size={14} className="fi" />
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                {dateFrom && (
                  <ClearBtn onClick={() => setDateFrom("")}>
                    <X size={12} />
                  </ClearBtn>
                )}
              </FilterField>
              <FilterField title="End Date">
                <Calendar size={14} className="fi" />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                {dateTo && (
                  <ClearBtn onClick={() => setDateTo("")}>
                    <X size={12} />
                  </ClearBtn>
                )}
              </FilterField>

              <FilterField>
                <Activity size={14} className="fi" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </FilterField>

              <ResetBtn onClick={handleResetFilters}>
                <RotateCcw size={13} /> Reset
                {activeFiltersCount > 0 && (
                  <FilterBadge>{activeFiltersCount}</FilterBadge>
                )}
              </ResetBtn>
            </FilterBar>

            {!initialLoad && !loading && (
              <ResultsInfo>
                <span>
                  {processedData.length === 0
                    ? "No expenses found"
                    : `${processedData.length} expense${processedData.length !== 1 ? "s" : ""} found`}
                  {activeFiltersCount > 0 && " (filtered)"}
                  &nbsp; | &nbsp;{" "}
                  <b>
                    Total Filtered Amount: $
                    {processedData
                      .reduce((sum, e) => sum + (e.amount || e.Amount || 0), 0)
                      .toFixed(2)}
                  </b>
                </span>
              </ResultsInfo>
            )}

            {/* TABLE */}
            <DataGridWrap>
              <DataGrid>
                <thead>
                  <tr>
                    <Th>#ID</Th>
                    <Th>Date</Th>
                    <Th>Expense Details</Th>
                    <Th>Amount</Th>
                    <Th>Payment Mode</Th>
                    <Th $center>Status</Th>
                    <Th $center>Actions</Th>
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
                          icon={<DollarSign size={40} strokeWidth={1.2} />}
                          title="No Expenses Found"
                          subtitle="Adjust filters or log a new expense."
                        />
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((exp, idx) => {
                      const id = exp.id || exp.Id;
                      const date = exp.expenseDate || exp.ExpenseDate;
                      const title =
  exp.description ||
  exp.Description ||
  exp.expenseTitle ||
  exp.ExpenseTitle ||
  "—";
                      const amount = exp.amount || exp.Amount;
                      const mode = exp.paymentMode || exp.PaymentMode;
                      const isPaid = exp.isPaid || exp.IsPaid;

                      return (
                        <DataRow
                          key={id}
                          as={motion.tr}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.04 }}
                        >
                          <Td>
                            <IdBadge>
                              <Hash size={11} />
                              {id}
                            </IdBadge>
                          </Td>
                          <Td>
                            <span
                              style={{
                                fontWeight: 600,
                                color: "var(--text-muted)",
                                fontSize: "12.5px",
                              }}
                            >
                              {date
                                ? format(new Date(date), "dd MMM yyyy")
                                : "—"}
                            </span>
                          </Td>

                          <Td>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "3px",
                              }}
                            >
                              <NameCell>
                                <NameDot $color="#3b82f6" />
                                {title}
                              </NameCell>
                              <DescCell>{exp.calculatedCategoryName}</DescCell>
                            </div>
                          </Td>
                          <Td>
                            <span
                              style={{
                                fontWeight: 800,
                                color: "var(--text)",
                                fontSize: "14px",
                              }}
                            >
                              ₹{Number(amount).toFixed(2)}
                            </span>
                          </Td>
                          <Td>
                            <DescCell
                              style={{
                                WebkitLineClamp: "unset",
                                maxWidth: "unset",
                              }}
                            >
                              {mode}
                            </DescCell>
                          </Td>
                          <Td $center>
                            <StatusBadge $active={isPaid}>
                              {isPaid ? (
                                <>
                                  <ToggleRight size={12} /> Paid
                                </>
                              ) : (
                                <>
                                  <ToggleLeft size={12} /> Pending
                                </>
                              )}
                            </StatusBadge>
                          </Td>
                          <Td $center>
                            <ActionGroup>
                              <ActionBtn
                                $edit
                                onClick={() => handleEdit(id)}
                                title="Edit"
                              >
                                <Edit3 size={14} />
                              </ActionBtn>
                              <ActionBtn
                                $delete
                                onClick={() => handleDelete(id)}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </ActionBtn>
                              <button
                                onClick={() => handleMarkPaid(exp.id || exp.Id)}
                                disabled={exp.isPaid || exp.IsPaid}
                                style={{
                                  padding: "8px 14px",
                                  borderRadius: "10px",
                                  border: "none",
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  cursor: exp.isPaid || exp.IsPaid
                                    ? "not-allowed"
                                    : "pointer",
                                  background: exp.isPaid || exp.IsPaid
                                    ? "linear-gradient(135deg, #10b981, #059669)"
                                    : "linear-gradient(135deg, #f59e0b, #d97706)",
                                  color: "#fff",
                                  boxShadow: exp.isPaid || exp.IsPaid
                                    ? "0 0 12px rgba(16,185,129,0.35)"
                                    : "0 0 12px rgba(245,158,11,0.35)",
                                  transition: "all 0.25s ease",
                                  minWidth: "95px",
                                }}
                              >
                                {exp.isPaid || exp.IsPaid ? "Paid" : "Mark Paid"}
                              </button>
                            </ActionGroup>
                          </Td>
                        </DataRow>
                      );
                    })
                  )}
                </tbody>
              </DataGrid>
            </DataGridWrap>

            {/* PAGINATION */}
            {!initialLoad && totalPages > 1 && (
              <PaginationBar>
                <PaginationInfo>
                  Showing <b>{(currentPage - 1) * itemsPerPage + 1}</b>–
                  <b>
                    {Math.min(currentPage * itemsPerPage, processedData.length)}
                  </b>{" "}
                  of <b>{processedData.length}</b>
                </PaginationInfo>
                <PaginationControls>
                  <PageBtn
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft size={15} />
                  </PageBtn>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (pg) =>
                        pg === 1 ||
                        pg === totalPages ||
                        Math.abs(pg - currentPage) <= 1,
                    )
                    .reduce((acc, pg, i, arr) => {
                      if (i > 0 && pg - arr[i - 1] > 1) acc.push("…");
                      acc.push(pg);
                      return acc;
                    }, [])
                    .map((item, i) =>
                      item === "…" ? (
                        <span
                          key={`e₹{i}`}
                          style={{
                            padding: "0 6px",
                            color: "var(--text-muted)",
                          }}
                        >
                          …
                        </span>
                      ) : (
                        <PageBtn
                          key={item}
                          $active={currentPage === item}
                          onClick={() => setCurrentPage(item)}
                        >
                          {item}
                        </PageBtn>
                      ),
                    )}
                  <PageBtn
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight size={15} />
                  </PageBtn>
                </PaginationControls>
              </PaginationBar>
            )}
          </TableCard>

          <ExpenseModal
            show={showModal}
            onClose={() => setShowModal(false)}
            onSave={handleSave}
            form={form}
            setForm={setForm}
            categories={categories}
            submitLoading={submitLoading}
          />
        </PageWrapper>
      </PageTransition>

      <style>{`.spin { animation: spin360 1s linear infinite; } @keyframes spin360 { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

/* ═══════════════════════════════════════
   STYLED COMPONENTS
═══════════════════════════════════════ */
const pulse = keyframes`0%, 100% { opacity: 1; } 50% { opacity: 0.4; }`;

const PageWrapper = styled.div`
  padding: 24px;
  min-height: 100vh;
  background: var(--bg);
  font-family: "Inter", sans-serif;
  @media (max-width: 768px) {
    padding: 14px;
  }
`;

const PageHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  gap: 12px;
  flex-wrap: wrap;
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

/* KPI */
const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
  @media (max-width: 1024px) {
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
  flex-shrink: 0;
  background: ${(p) => p.$color}18;
  color: ${(p) => p.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${(p) => p.$color}30;
`;
const KpiBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
`;
const KpiLabel = styled.span`
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;
const KpiValue = styled.span`
  font-size: 1.65rem;
  font-weight: 800;
  color: var(--text);
  line-height: 1.1;
`;
const KpiGlow = styled.div`
  position: absolute;
  right: -20px;
  bottom: -20px;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: radial-gradient(circle, ${(p) => p.$color}18, transparent 70%);
  pointer-events: none;
`;

/* TABLE */
const TableCard = styled.div`
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
`;

const FilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--border-custom);
  background: var(--bg-light-custom);
`;
const FilterField = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 9px;
  padding: 0 12px;
  height: 38px;
  transition: border-color 0.2s;
  flex: ${(p) => p.$grow || 1};
  min-width: ${(p) => (p.$grow ? "220px" : "auto")};
  .fi {
    color: var(--text-muted);
    flex-shrink: 0;
  }
  input,
  select {
    flex: 1;
    border: none;
    background: transparent;
    color: var(--text);
    font-size: 13px;
    outline: none;
    min-width: 100px;
    &::placeholder {
      color: var(--text-muted);
    }
    option {
      background: var(--card);
      color: var(--text);
    }
  }
  &:focus-within {
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }
`;
const ClearBtn = styled.button`
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 2px;
  display: flex;
  border-radius: 4px;
  &:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.08);
  }
`;
const ResetBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  height: 38px;
  border-radius: 9px;
  border: 1px solid var(--border-custom);
  background: var(--card);
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  &:hover {
    border-color: var(--primary);
    color: var(--primary);
    background: rgba(59, 130, 246, 0.05);
  }
`;
const FilterBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary);
  color: white;
  font-size: 9px;
  font-weight: 800;
`;
const ResultsInfo = styled.div`
  padding: 8px 20px;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
  background: var(--bg-light-custom);
  border-bottom: 1px solid var(--border-custom);
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
  min-width: 800px;
`;
const Th = styled.th`
  padding: 14px 20px;
  text-align: ${(p) => (p.$center ? "center" : "left")};
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: var(--bg-light-custom);
  border-bottom: 1px solid var(--border-custom);
  white-space: nowrap;
`;
const DataRow = styled.tr`
  transition: background 0.15s;
  &:hover td {
    background: rgba(59, 130, 246, 0.03);
  }
  &:last-child td {
    border-bottom: none;
  }
`;
const Td = styled.td`
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-custom);
  font-size: 13px;
  color: var(--text);
  text-align: ${(p) => (p.$center ? "center" : "left")};
`;

const IdBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(59, 130, 246, 0.08);
  color: var(--primary);
  border: 1px solid rgba(59, 130, 246, 0.2);
`;
const NameCell = styled.span`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
`;
const NameDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${(p) => p.$color || "#3b82f6"};
  flex-shrink: 0;
  box-shadow: 0 0 6px ${(p) => p.$color || "#3b82f6"}80;
`;
const DescCell = styled.span`
  color: var(--text-muted);
  font-size: 12.5px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-width: 280px;
`;
const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 11px;
  font-weight: 700;
  background: ${(p) =>
    p.$active ? "rgba(16,185,129,0.1)" : "rgba(245, 158, 11, 0.1)"};
  color: ${(p) => (p.$active ? "#10b981" : "#f59e0b")};
  border: 1px solid
    ${(p) => (p.$active ? "rgba(16,185,129,0.3)" : "rgba(245, 158, 11, 0.3)")};
`;

const ActionGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;
const ActionBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 1px solid var(--border-custom);
  cursor: pointer;
  transition: all 0.2s;
  ${(p) =>
    p.$edit &&
    css`
      background: rgba(59, 130, 246, 0.06);
      color: #3b82f6;
      &:hover {
        background: rgba(59, 130, 246, 0.15);
        border-color: rgba(59, 130, 246, 0.4);
      }
    `} ${(p) =>
    p.$delete &&
    css`
      background: rgba(239, 68, 68, 0.06);
      color: #ef4444;
      &:hover {
        background: rgba(239, 68, 68, 0.15);
        border-color: rgba(239, 68, 68, 0.4);
      }
    `}
`;

const PaginationBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  background: var(--bg-light-custom);
  border-top: 1px solid var(--border-custom);
  flex-wrap: wrap;
  gap: 10px;
`;
const PaginationInfo = styled.span`
  font-size: 12.5px;
  color: var(--text-muted);
  font-weight: 500;
  b {
    color: var(--text);
  }
`;
const PaginationControls = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;
const PageBtn = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  border: 1px solid
    ${(p) => (p.$active ? "var(--primary)" : "var(--border-custom)")};
  background: ${(p) => (p.$active ? "var(--primary)" : "var(--card)")};
  color: ${(p) => (p.$active ? "white" : "var(--text)")};
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover:not(:disabled) {
    border-color: var(--primary);
    color: ${(p) => (p.$active ? "white" : "var(--primary)")};
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;
