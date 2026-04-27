import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tags,
  RefreshCcw,
  AlertCircle,
  Calendar,
  Search,
  Filter,
  Plus,
  RotateCcw,
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
} from "./../../../Services/axiosService";
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

// 🌟 NUMBER ANIMATION COMPONENT
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
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
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

export default function ProductCategory() {
  const emptyForm = {
    id: 0,
    categoryName: "",
    description: "",
  };

  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitLoading, setSubmitLoading] = useState(false);

  // 🌟 Premium Enhancement States
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFy, setActiveFy] = useState(null);

  // 🌟 Filters
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  // 🌟 Pagination Fixed at 5
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchInitialData();
  }, []);

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
      await fetchCategories(false);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setInitialLoad(false), 700);
    }
  };

  const fetchCategories = async (isRefresh = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else setLoading(true);

      const res = await getRequest("ProductCategory/List");
      if (res && (res.status === "OK" || res.Status === "OK")) {
        setCategories(res.result || res.Result || []);
      }
    } catch (err) {
      errorAlert("Error", "Failed to fetch categories");
    } finally {
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 600);
      else setTimeout(() => setLoading(false), 400);
    }
  };

  const isFyLocked = activeFy && (activeFy.isClosed || activeFy.IsClosed);

  const handleResetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setSortOrder("newest");
    setCurrentPage(1);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddClick = () => {
    if (isFyLocked || !activeFy) {
      return warningAlert(
        "Financial Year Locked",
        "Cannot modify categories in closed or missing financial year.",
      );
    }
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleEditClick = async (id) => {
    if (isFyLocked || !activeFy) {
      return warningAlert(
        "Financial Year Locked",
        "Cannot modify categories in closed or missing financial year.",
      );
    }
    try {
      const res = await getRequest(`ProductCategory/Detail/${id}`);
      if (
        res &&
        (res.status === "OK" || res.Status === "OK") &&
        (res.result || res.Result)
      ) {
        setForm(res.result || res.Result);
        setShowModal(true);
      }
    } catch {
      errorAlert("Error", "Failed to fetch details");
    }
  };

  const handleDeleteClick = async (id) => {
    if (isFyLocked || !activeFy) {
      return warningAlert(
        "Financial Year Locked",
        "Cannot modify categories in closed or missing financial year.",
      );
    }
    const confirm = await confirmAlert(
      "Delete Category?",
      "This cannot be undone.",
    );
    if (!confirm.isConfirmed) return;

    try {
      const res = await deleteRequest(`ProductCategory/Delete/${id}`);
      if (res && (res.status === "OK" || res.Status === "OK")) {
        successAlert("Deleted", "Category removed");
        fetchCategories();
      } else {
        errorAlert("Error", res.message || res.Message || "Delete failed");
      }
    } catch {
      errorAlert("Error", "Deletion failed");
    }
  };

  const handleSave = async () => {
    if (!form.categoryName.trim()) {
      return warningAlert("Validation", "Category name is required");
    }

    try {
      setSubmitLoading(true);
      const res =
        form.id > 0
          ? await putRequest("ProductCategory/Update", form)
          : await postRequest("ProductCategory/Save", form);

      if (res && (res.status === "OK" || res.Status === "OK")) {
        successAlert(
          "Success",
          form.id > 0 ? "Category Updated" : "Category Added",
        );
        setShowModal(false);
        setForm(emptyForm);
        fetchCategories();
      } else {
        errorAlert("Error", res.message || res.Message || "Failed to save");
      }
    } catch (err) {
      errorAlert("Error", "Server Error");
    } finally {
      setSubmitLoading(false);
    }
  };

  // 🌟 Processing Data
  const processedData = useMemo(() => {
    let result = [...categories];
    if (search) {
      result = result.filter((c) =>
        c.categoryName?.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (fromDate)
      result = result.filter(
        (c) =>
          new Date(c.createdAt || c.CreatedAt || new Date()) >=
          new Date(fromDate),
      );
    if (toDate)
      result = result.filter(
        (c) =>
          new Date(c.createdAt || c.CreatedAt || new Date()) <=
          new Date(toDate),
      );

    if (sortOrder === "a-z")
      result.sort((a, b) =>
        (a.categoryName || "").localeCompare(b.categoryName || ""),
      );
    else if (sortOrder === "oldest")
      result.sort(
        (a, b) =>
          new Date(a.createdAt || a.CreatedAt || 0) -
          new Date(b.createdAt || b.CreatedAt || 0),
      );
    else
      result.sort(
        (a, b) =>
          new Date(b.createdAt || b.CreatedAt || 0) -
          new Date(a.createdAt || a.CreatedAt || 0),
      );

    return result;
  }, [categories, search, fromDate, toDate, sortOrder]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentRecords = processedData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, fromDate, toDate, sortOrder]);

  /* ===== DYNAMIC STATS ===== */
  const totalCategories = categories.length;
  const newCategories = useMemo(() => {
    return categories.filter((c) => {
      const date = new Date(c.createdAt || c.CreatedAt || new Date());
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return date >= thirtyDaysAgo;
    }).length;
  }, [categories]);

  const activeFiltersCount = [search, fromDate, toDate].filter(Boolean).length;

  return (
    <>
      <GlobalLoader isLoading={initialLoad} />
      <PageTransition>
        <PageWrapper className="p-2 p-md-4">
          <HeaderSection className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
            <div className="title-area">
              <h2 className="fw-bold m-0 gradient-text">Product Categories</h2>
              <small className="text-muted-custom d-flex align-items-center gap-2 mt-1">
                <BreadcrumbLink to="/admin/dashboard">
                  <i className="fas fa-home me-1"></i> Home
                </BreadcrumbLink>
                <i
                  className="fas fa-chevron-right"
                  style={{ fontSize: "10px" }}
                ></i>
                <span>Masters</span>
                <i
                  className="fas fa-chevron-right"
                  style={{ fontSize: "10px" }}
                ></i>
                <span className="text-primary fw-medium">Categories</span>
              </small>
            </div>

            <div className="d-flex align-items-center gap-2 w-100 w-md-auto flex-wrap">
              <PremiumBtn
                className="secondary w-100 w-md-auto"
                onClick={() => fetchCategories(true)}
                disabled={loading || isRefreshing || initialLoad}
              >
                <RefreshCcw
                  size={16}
                  className={isRefreshing ? "spin" : ""}
                  style={{ marginRight: "6px" }}
                />
                {isRefreshing ? "Syncing..." : "Sync"}
              </PremiumBtn>
              <PremiumBtn
                className="primary w-100 w-md-auto"
                onClick={handleAddClick}
                disabled={isFyLocked}
                style={{ opacity: isFyLocked ? 0.6 : 1 }}
              >
                <Plus size={16} className="me-1" /> Add Category
              </PremiumBtn>
            </div>
          </HeaderSection>

          {activeFy ? (
            <FyBadgeWrapper>
              <FyBadge>
                <Calendar size={14} /> ACTIVE FINANCIAL YEAR:{" "}
                {activeFy.yearName || activeFy.YearName}
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
                        Total Categories
                      </span>
                      <div className="icon-box bg-primary-subtle text-primary">
                        <Tags size={24} />
                      </div>
                    </div>
                    <h3 className="fw-bold mt-2 text-custom mb-0">
                      <AnimatedNumber value={totalCategories} />
                    </h3>
                    <small className="text-success mt-2 d-block fw-bold">
                      <CheckCircle2 size={12} className="me-1" /> Active Classes
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
                        New (30 Days)
                      </span>
                      <div className="icon-box bg-info-subtle text-info">
                        <Calendar size={24} />
                      </div>
                    </div>
                    <h3 className="fw-bold mt-2 text-custom mb-0">
                      <AnimatedNumber value={newCategories} />
                    </h3>
                    <small className="text-muted-custom mt-2 d-block fw-bold">
                      Recently added groups
                    </small>
                  </div>
                </SummaryCard>
              </>
            )}
          </SummaryGrid>

          <GlassCard className="p-3 p-md-4 mb-4">
            {/* 🔍 Filters Form */}
            <FilterBar className="mb-4">
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <div className="modern-input-group">
                    <Search size={14} className="icon" />
                    <input
                      type="text"
                      placeholder="Search category name..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-12 col-md-3">
                  <div className="modern-input-group">
                    <Filter size={14} className="icon" />
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="a-z">Name (A-Z)</option>
                    </select>
                  </div>
                </div>
                <div className="col-12 col-md-5 d-flex gap-2">
                  <div className="modern-input-group flex-grow-1">
                    <span className="label">From</span>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </div>
                  <div className="modern-input-group flex-grow-1">
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
                    <RotateCcw size={14} />
                    {activeFiltersCount > 0 && (
                      <span
                        className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                        style={{ fontSize: "9px", padding: "3px 5px" }}
                      >
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </FilterBar>

            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <th>Category Name</th>
                    <th>Description</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {initialLoad || loading || isRefreshing ? (
                    <SkeletonTableRows rows={itemsPerPage} columns={3} />
                  ) : currentRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan="3"
                        style={{ padding: "3rem 0", borderBottom: "none" }}
                      >
                        <PremiumEmptyState
                          icon={Tags}
                          title="No Categories Found"
                          subtitle="No product categories match your filters or available records."
                        />
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((c, i) => (
                      <tr key={c.id || c.Id} className="list-row">
                        <td>
                          <div className="product-info">
                            <div className="prd-avatar shadow-sm">
                              <Tags size={20} />
                            </div>
                            <div className="fw-bolder text-custom fs-6">
                              {c.categoryName || c.CategoryName}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-muted-custom fw-medium">
                            {c.description || c.Description || "—"}
                          </span>
                        </td>
                        <td>
                          <ActionButtons>
                            <button
                              className="edit"
                              onClick={() => handleEditClick(c.id || c.Id)}
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
                              onClick={() => handleDeleteClick(c.id || c.Id)}
                              disabled={isFyLocked}
                              title={
                                isFyLocked ? "Locked in active FY" : "Delete"
                              }
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
          </GlassCard>

          {/* 🎭 MODAL (Premium Layout) */}
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
                        <Tags size={20} />
                      </div>
                      {form.id > 0 ? "Edit Category" : "Add Category"}
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
                    style={{ maxHeight: "65vh", overflowY: "auto" }}
                  >
                    <div className="row g-4">
                      <div className="col-12">
                        <FormGroup>
                          <label>
                            Category Name <span className="text-danger">*</span>
                          </label>
                          <FormInput
                            name="categoryName"
                            value={form.categoryName}
                            onChange={handleChange}
                            placeholder="e.g. Electronics"
                            autoFocus
                            disabled={submitLoading}
                          />
                        </FormGroup>
                      </div>
                      <div className="col-12">
                        <FormGroup>
                          <label>Description</label>
                          <FormTextarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            placeholder="Detailed category description..."
                            disabled={submitLoading}
                          />
                        </FormGroup>
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
                        <RefreshCcw size={16} className="spin me-2" />
                      ) : (
                        <CheckCircle2 size={16} className="me-2" />
                      )}
                      {submitLoading
                        ? "Saving..."
                        : form.id > 0
                          ? "Update"
                          : "Save"}
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
    </>
  );
}

/* ================= STYLED COMPONENTS (Unified Original Theme + Premium Specs) ================= */

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

const BreadcrumbLink = styled(Link)`
  color: var(--text-muted);
  text-decoration: none;
  transition: all 0.2s ease;
  font-weight: 600;
  &:hover {
    color: var(--primary);
  }
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .gradient-text {
    background: linear-gradient(90deg, #3b82f6, #06b6d4);
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
  margin-bottom: 20px;

  &.error {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.1);
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
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    color: white;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      filter: brightness(1.1);
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
    }
  }

  &.secondary {
    background: var(--card);
    color: var(--text);
    border: 1px solid var(--border-custom);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
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
    box-shadow: none;
    transform: none;
  }
`;

/* 🌟 DYNAMIC SUMMARY CARDS WITH PREMIUM DESIGN */
const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
    box-shadow: 0 16px 40px rgba(59, 130, 246, 0.3);
    border-color: rgba(59, 130, 246, 0.5);
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

const GlassCard = styled.div`
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
    box-shadow: 0 16px 40px rgba(59, 130, 246, 0.15);
  }
`;

const FilterBar = styled.div`
  background: var(--bg-light-custom);
  padding: 15px;
  border-radius: 12px;
  border: 1px solid var(--border-custom);

  .modern-input-group {
    display: flex;
    align-items: center;
    background: var(--card);
    border: 1px solid var(--border-custom);
    border-radius: 10px;
    padding: 0 12px;
    transition: all 0.3s ease;
    height: 44px;

    &:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
    }
    .icon {
      color: var(--text-muted);
      margin-right: 10px;
      font-size: 14px;
    }
    .label {
      color: var(--text-muted);
      font-size: 12px;
      font-weight: 700;
      margin-right: 10px;
      padding-right: 10px;
      border-right: 1px solid var(--border-custom);
      text-transform: uppercase;
    }
    input,
    select {
      flex: 1;
      border: none;
      background: transparent;
      color: var(--text);
      font-size: 13px;
      font-weight: 600;
      outline: none;
      width: 100%;
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
    gap: 6px;
    height: 44px;
    padding: 0 16px;
    border-radius: 10px;
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
  }

  td {
    padding: 16px;
    vertical-align: middle;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-bottom: 1px solid var(--border-custom);
  }

  tr.list-row {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--card);
  }

  /* 🌟 PREMIUM HOVER ANIMATION */
  tr.list-row:hover {
    background: var(--bg-hover);
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(59, 130, 246, 0.1);
  }

  tr.list-row:hover td {
    border-color: rgba(59, 130, 246, 0.2);
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
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-light-custom);

    &.edit {
      color: #0ea5e9;
    }
    &.delete {
      color: #ef4444;
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:hover:not(:disabled).edit {
      transform: translateY(-3px);
      background: #0ea5e9;
      color: white;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
    }

    &:hover:not(:disabled).delete {
      transform: translateY(-3px);
      background: #ef4444;
      color: white;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
  }
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .action-btn-page {
    padding: 8px 16px;
    border-radius: 8px;
    border: 1px solid var(--border-custom);
    box-shadow: 0 4px 6px rgba(13, 51, 236, 0.05);

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
  max-width: 550px;
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

const FormTextarea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 14px 18px;
  border-radius: 12px;
  background: var(--bg-light-custom);
  color: var(--text) !important;
  border: 1px solid var(--border-custom);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  resize: vertical;

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