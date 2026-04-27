import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  RefreshCcw,
  AlertCircle,
  Calendar,
  UserCheck,
  Mail,
  Phone,
  Briefcase,
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
  Shield,
} from "lucide-react";

import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
} from "./../../../Services/axiosService";

// 🌟 Import global SweetAlert functions
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

export default function StaffMaster() {
  const emptyForm = {
    id: 0,
    fullName: "",
    email: "",
    phone: "",
    role: "",
    status: true,
  };

  const [staff, setStaff] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitLoading, setSubmitLoading] = useState(false);

  // 🌟 Premium Enhancement States
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFy, setActiveFy] = useState(null);

  // 🌟 Filters
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // 🌟 Pagination Fixed at 5
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setInitialLoad(true);
    try {
      const fyRes = await getRequest("FinancialYear/List");
      if (fyRes.status === "OK" && fyRes.result) {
        const currentActiveFy = fyRes.result.find(
          (y) => y.isActive && !y.isDelete,
        );
        setActiveFy(currentActiveFy || null);
      }
      await fetchStaff(false, true);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setInitialLoad(false), 700);
    }
  };

  const fetchStaff = async (isRefresh = false, isInit = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else if (!isInit) setLoading(true);

      const res = await getRequest("StaffMaster/List");
      if (res.status === "OK") {
        setStaff(res.result || []);
      }
    } catch (err) {
      errorAlert("Error", "Failed to fetch staff details");
    } finally {
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 600);
      else if (!isInit) setTimeout(() => setLoading(false), 400);
    }
  };

  const handleRefresh = () => {
    fetchStaff(true);
  };

  const resetFilters = () => {
    setSearch("");
    setSortOrder("newest");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const isFyLocked = activeFy && activeFy.isClosed;

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
  };

  const handleAddClick = () => {
    if (isFyLocked || !activeFy) {
      return warningAlert(
        "Financial Year Locked",
        "Cannot modify staff in closed or missing financial year.",
      );
    }
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleEditClick = async (id) => {
    if (isFyLocked || !activeFy) {
      return warningAlert(
        "Financial Year Locked",
        "Cannot modify staff in closed or missing financial year.",
      );
    }
    try {
      const res = await getRequest(`StaffMaster/Detail/${id}`);
      if (res.status === "OK" && res.result) {
        setForm(res.result);
        setShowModal(true);
      }
    } catch {
      errorAlert("Error", "Failed to fetch staff details");
    }
  };

  const handleDeleteClick = async (id) => {
    if (isFyLocked || !activeFy) {
      return warningAlert(
        "Financial Year Locked",
        "Cannot modify staff in closed or missing financial year.",
      );
    }
    const confirm = await confirmAlert(
      "Delete Staff?",
      "This cannot be undone.",
    );
    if (!confirm.isConfirmed) return;

    try {
      const res = await deleteRequest(`StaffMaster/Delete/${id}`);
      if (res.status === "OK") {
        successAlert("Deleted", "Staff removed successfully");
        fetchStaff();
      } else {
        errorAlert("Error", res.message || "Delete failed");
      }
    } catch {
      errorAlert("Error", "Deletion failed");
    }
  };

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.role.trim()) {
      return warningAlert("Validation Error", "Full Name and Role required");
    }

    const payload = {
      id: form.id || 0,
      fullName: form.fullName.trim(),
      email: form.email?.trim() || "",
      contactNo: form.phone?.trim() || "", // ✅ FIX
      role: form.role.trim(),
      status: form.status ? "Active" : "Inactive", // ✅ FIX
    };

    console.log("SENDING:", payload);

    try {
      setSubmitLoading(true);

      const res =
        form.id > 0
          ? await putRequest("StaffMaster/Update", payload)
          : await postRequest("StaffMaster/Save", payload);

      if (res.status === "OK") {
        successAlert("Success", "Saved Successfully");
        setShowModal(false);
        setForm(emptyForm);
        fetchStaff();
      } else {
        errorAlert("Error", res.message || "Failed");
      }
    } catch (err) {
      console.log("ERROR:", err);
      errorAlert("Error", err?.result || err?.message || "Server Error");
    } finally {
      setSubmitLoading(false);
    }
  };
  const staffAuth = JSON.parse(localStorage.getItem("staffAuth") || "null");
  const currentUserId = staffAuth?.id;

  const updatedStaff = staff.map((s) => ({
    ...s,
    isCurrentUser: s.id == currentUserId,
    displayStatus: s.id == currentUserId ? "Active" : "Inactive",
  }));
  // 🌟 Processing Data
  const processedData = useMemo(() => {
    let result = [...updatedStaff];

    // Search
    if (search) {
      result = result.filter(
        (s) =>
          s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          s.role?.toLowerCase().includes(search.toLowerCase()) ||
          s.email?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Date Filters
    if (fromDate)
      result = result.filter(
        (s) => new Date(s.createdAt || new Date()) >= new Date(fromDate),
      );
    if (toDate)
      result = result.filter(
        (s) => new Date(s.createdAt || new Date()) <= new Date(toDate),
      );

    // Sort
    if (sortOrder === "a-z")
      result.sort((a, b) => (a.fullName || "").localeCompare(b.fullName || ""));
    else if (sortOrder === "oldest")
      result.sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      );
    else
      result.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );

    return result;
  }, [staff, search, fromDate, toDate, sortOrder]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentRecords = processedData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, fromDate, toDate, sortOrder]);

  /* ===== DYNAMIC STATS ===== */
  const totalStaff = staff.length;
  const activeStaff = staff.filter((s) => s.status).length;
  const newStaff = staff.filter((s) => {
    const date = new Date(s.createdAt || new Date());
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date >= thirtyDaysAgo;
  }).length;

  const activeFiltersCount = [search, fromDate, toDate].filter(Boolean).length;

  return (
    <>
      <GlobalLoader isLoading={initialLoad} />
      <PageTransition>
        <PageWrapper className="p-3 p-md-4">
          <HeaderSection className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
            <div className="title-area">
              <PageTitle className="fw-bold m-0 gradient-text">
                <Shield className="title-icon me-2" size={28} /> Staff Master
              </PageTitle>
              <p className="subtitle text-muted-custom mt-1 mb-0">
                Manage enterprise staff & employee access
              </p>
            </div>
            <div className="d-flex align-items-center gap-2 w-100 w-md-auto flex-wrap">
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
                <Plus size={18} /> New Staff
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
                        Total Staff
                      </span>
                      <div className="icon-box bg-primary-subtle text-primary">
                        <Users size={24} />
                      </div>
                    </div>
                    <h3 className="fw-bold mt-2 text-custom mb-0">
                      <AnimatedNumber value={totalStaff} />
                    </h3>
                    <small className="text-muted-custom mt-2 d-block fw-bold">
                      Registered Employees
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
                        Active Staff
                      </span>
                      <div className="icon-box bg-success-subtle text-success">
                        <UserCheck size={24} />
                      </div>
                    </div>
                    <h3 className="fw-bold mt-2 text-custom mb-0">
                      <AnimatedNumber value={activeStaff} />
                    </h3>
                    <small className="text-success mt-2 d-block fw-bold">
                      <i className="fas fa-check-circle me-1"></i> Active System
                      Access
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
                        New Joinings
                      </span>
                      <div className="icon-box bg-warning-subtle text-warning">
                        <Briefcase size={24} />
                      </div>
                    </div>
                    <h3 className="fw-bold mt-2 text-custom mb-0">
                      <AnimatedNumber value={newStaff} />
                    </h3>
                    <small className="text-warning mt-2 d-block fw-bold">
                      Joined in last 30 days
                    </small>
                  </div>
                </SummaryCard>
              </>
            )}
          </SummaryGrid>

          <GlassCard className="p-3 p-md-4 mb-4">
            {/* 🔍 Premium Single Row Compact Filter Bar */}
            <CompactFilterBar className="mb-4">
              <div className="filter-item search-item">
                <Search size={14} className="icon" />
                <input
                  type="text"
                  placeholder="Search staff..."
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
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="a-z">Name (A-Z)</option>
                </select>
              </div>
              <div className="filter-item date-item">
                <span className="label">From</span>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  title="From Date"
                />
              </div>
              <div className="filter-item date-item">
                <span className="label">To</span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  title="To Date"
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
                    <th>Staff Profile</th>
                    <th>Contact Details</th>
                    <th>Status</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {initialLoad || loading || isRefreshing ? (
                    <SkeletonTableRows rows={itemsPerPage} columns={4} />
                  ) : currentRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        style={{ padding: "3rem 0", borderBottom: "none" }}
                      >
                        <PremiumEmptyState
                          icon={Users}
                          title="No Staff Found"
                          subtitle="No staff records match your search or filters."
                        />
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((s, i) => (
                      <tr key={s.id} className="list-row">
                        <td>
                          <div className="product-info">
                            <div className="prd-avatar shadow-sm">
                              {s.fullName ? (
                                s.fullName.charAt(0).toUpperCase()
                              ) : (
                                <Users size={20} />
                              )}
                            </div>
                            <div>
                              <div className="fw-bolder text-custom fs-6">
                                {s.fullName}
                              </div>
                              <small className="text-muted-custom fw-medium">
                                <Briefcase size={12} className="me-1" />
                                {s.role || "N/A"}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            <span className="text-custom fw-medium small">
                              <Phone size={12} className="me-2 text-primary" />
                              {s.phone || "N/A"}
                            </span>
                            <span className="text-muted-custom small">
                              <Mail size={12} className="me-2 text-primary" />
                              {s.email || "N/A"}
                            </span>
                          </div>
                        </td>
                        <td>
                          {s.displayStatus === "Active" ? (
                            <span className="badge bg-success">Active</span>
                          ) : (
                            <span className="badge bg-danger">Inactive</span>
                          )}
                        </td>
                        <td>
                          <ActionButtons>
                            <button
                              className="edit"
                              onClick={() => handleEditClick(s.id)}
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
                              onClick={() => handleDeleteClick(s.id)}
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
                        <Users size={20} />
                      </div>
                      {form.id > 0 ? "Edit Staff" : "Add Staff Profile"}
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
                    style={{ maxHeight: "70vh", overflowY: "auto" }}
                  >
                    <div className="row g-4">
                      <div className="col-md-6">
                        <FormGroup>
                          <label>
                            Full Name <span className="text-danger">*</span>
                          </label>
                          <FormInput
                            name="fullName"
                            value={form.fullName}
                            onChange={handleChange}
                            placeholder="e.g. Jane Doe"
                            autoFocus
                            disabled={submitLoading}
                          />
                        </FormGroup>
                      </div>
                      <div className="col-md-6">
                        <FormGroup>
                          <label>
                            Role <span className="text-danger">*</span>
                          </label>
                          <FormInput
                            name="role"
                            value={form.role}
                            onChange={handleChange}
                            placeholder="e.g. Manager"
                            disabled={submitLoading}
                          />
                        </FormGroup>
                      </div>
                      <div className="col-md-6">
                        <FormGroup>
                          <label>Email Address</label>
                          <FormInput
                            type="email"
                            name="email"
                            value={form.email}
                            onChange={handleChange}
                            placeholder="jane@company.com"
                            disabled={submitLoading}
                          />
                        </FormGroup>
                      </div>
                      <div className="col-md-6">
                        <FormGroup>
                          <label>Phone Number</label>
                          <FormInput
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="+91 9876543210"
                            disabled={submitLoading}
                          />
                        </FormGroup>
                      </div>
                      <div className="col-md-12 d-flex align-items-center mt-3">
                        <FormGroup className="flex-row align-items-center">
                          <input
                            type="checkbox"
                            id="status"
                            name="status"
                            checked={form.status}
                            onChange={handleChange}
                            className="me-2"
                            style={{
                              transform: "scale(1.2)",
                              cursor: "pointer",
                            }}
                            disabled={submitLoading}
                          />
                          <label
                            htmlFor="status"
                            style={{ cursor: "pointer", margin: 0 }}
                          >
                            Active System Access
                          </label>
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
                        <RefreshCcw className="spin me-2" size={16} />
                      ) : (
                        <CheckCircle2 size={16} className="me-2" />
                      )}
                      {submitLoading
                        ? "Saving..."
                        : form.id > 0
                          ? "Update Staff"
                          : "Save Staff"}
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
  box-shadow: 0 4px 12px rgba(9, 241, 164, 0.55);

  &.error {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.1);
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.1);
  }
    &:hover {
    transform: translateY(-5px) scale(1.02);
  box-shadow: 0 4px 12px rgba(9, 241, 164, 0.81);
    border-color: rgba(59, 246, 187, 0.75);
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

  .badge-custom {
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    display: inline-block;
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
