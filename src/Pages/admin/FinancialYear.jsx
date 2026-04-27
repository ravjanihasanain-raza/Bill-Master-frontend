import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
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
} from "../../../Services/sweetAlert";

import GlobalLoader from "../../components/common/GlobalLoader.jsx";

const AnimatedNumber = ({ value, prefix = "", isCurrency = false }) => {
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

  const displayValue = isCurrency
    ? Math.ceil(count).toLocaleString("en-IN")
    : Math.ceil(count);

  return (
    <>
      {prefix}
      {displayValue}
    </>
  );
};

export default function FinancialYear() {
  const emptyForm = {
    id: 0,
    yearName: "",
    startDate: "",
    endDate: "",
  };

  const [years, setYears] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [sortOrder, setSortOrder] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async (preservePage = false) => {
    try {
      setLoading(true);
      const res = await getRequest("FinancialYear/List");
      if (res.status === "OK") {
        setYears(res.result || []);
        if (!preservePage) setCurrentPage(1);
      }
    } catch (err) {
      errorAlert("Error", "Failed to fetch financial years");
    } finally {
      setTimeout(() => setLoading(false), 400);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!form.yearName)
      return warningAlert("Validation", "Year Name is required");
    if (!form.startDate)
      return warningAlert("Validation", "Start Date is required");
    if (!form.endDate)
      return warningAlert("Validation", "End Date is required");

    try {
      setSubmitLoading(true);
      const res =
        form.id > 0
          ? await putRequest("FinancialYear/Update", form)
          : await postRequest("FinancialYear/Save", form);

      if (res.status === "OK") {
        successAlert("Success", form.id > 0 ? "Year Updated" : "Year Added");
        setShowModal(false);
        setForm(emptyForm);
        fetchYears(true);
      } else {
        errorAlert("Error", res.result || res.message || "Operation failed");
      }
    } catch (err) {
      errorAlert("Error", "Server connection failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = async (id) => {
    try {
      setLoading(true);
      const res = await getRequest(`FinancialYear/Detail/${id}`);
      if (res.status === "OK" && res.result) {
        setForm({
          id: res.result.id,
          yearName: res.result.yearName || "",
          startDate: res.result.startDate
            ? res.result.startDate.split("T")[0]
            : "",
          endDate: res.result.endDate ? res.result.endDate.split("T")[0] : "",
        });
        setShowModal(true);
      } else {
        errorAlert("Error", res.result || res.message);
      }
    } catch {
      errorAlert("Error", "Failed to fetch details");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await confirmAlert(
      "Delete Year?",
      "This cannot be undone.",
    );
    if (!confirm.isConfirmed) return;
    try {
      setLoading(true);
      const res = await deleteRequest(`FinancialYear/Delete/${id}`);
      if (res.status === "OK") {
        successAlert("Deleted", "Year removed successfully");
        fetchYears(true);
      } else {
        errorAlert("Error", res.result || res.message);
      }
    } catch {
      errorAlert("Error", "Deletion failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSetActive = async (id) => {
    try {
      setLoading(true);
      const res = await putRequest(`FinancialYear/SetActive/${id}`, {});
      if (res.status === "OK") {
        successAlert(
          "Activated",
          "Financial Year is now Active. Invoice sequence will reset to this year.",
        );
        fetchYears(true);
      } else {
        errorAlert("Error", res.result || res.message);
      }
    } catch {
      errorAlert("Error", "Failed to activate year");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseYear = async (id) => {
    const confirm = await confirmAlert(
      "Lock Financial Year?",
      "Once closed, no invoices or transactions can be modified in this year. This is irreversible.",
    );
    if (!confirm.isConfirmed) return;
    try {
      setLoading(true);
      const res = await putRequest(`FinancialYear/CloseYear/${id}`, {});
      if (res.status === "OK") {
        successAlert("Locked", "Financial Year is permanently closed.");
        fetchYears(true);
      } else {
        errorAlert("Error", res.result || res.message);
      }
    } catch {
      errorAlert("Error", "Failed to lock year");
    } finally {
      setLoading(false);
    }
  };

  const handleViewReport = () => {
    successAlert(
      "Coming Soon",
      "Advanced Financial Year Report Module will be available in the next update.",
    );
  };

  const handleBackupData = () => {
    successAlert(
      "Coming Soon",
      "Backup Module will be available in the next update.",
    );
  };

  const getStatus = (y) => {
    if (y.isClosed) return "CLOSED";
    if (y.isActive) return "ACTIVE";
    const today = new Date();
    const start = new Date(y.startDate);
    if (start > today) return "UPCOMING";
    return "INACTIVE";
  };

  const resetFilters = () => {
    setSearch("");
    setSortOrder("newest");
    setStatusFilter("ALL");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const processedData = useMemo(() => {
    let result = [...years];

    if (search) {
      result = result.filter((y) =>
        y.yearName?.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (fromDate)
      result = result.filter(
        (y) => new Date(y.startDate) >= new Date(fromDate),
      );
    if (toDate)
      result = result.filter((y) => new Date(y.endDate) <= new Date(toDate));

    if (statusFilter !== "ALL") {
      result = result.filter((y) => getStatus(y) === statusFilter);
    }

    if (sortOrder === "a-z")
      result.sort((a, b) => (a.yearName || "").localeCompare(b.yearName || ""));
    else if (sortOrder === "oldest")
      result.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    else result.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

    return result;
  }, [years, search, fromDate, toDate, sortOrder, statusFilter]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentRecords = processedData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  const totalYears = years.length;
  const activeYearData = years.find((y) => getStatus(y) === "ACTIVE");
  const closedCount = years.filter((y) => y.isClosed).length;
  const upcomingCount = years.filter(
    (y) => new Date(y.startDate) > new Date() && !y.isClosed,
  ).length;

  return (
    <>
      <GlobalLoader isLoading={loading || submitLoading} />
      <PageWrapper className="p-2 p-md-4">
        <HeaderSection className="mb-4 fade-slide-up delay-1 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
          <div className="title-area">
            <h2 className="fw-bold m-0 gradient-text">Financial Year</h2>
            <small className="text-muted-custom d-flex align-items-center gap-2 mt-1">
              <BreadcrumbLink to="/admin/dashboard">
                <i className="fas fa-home me-1"></i> Home
              </BreadcrumbLink>
              <i
                className="fas fa-chevron-right"
                style={{ fontSize: "10px" }}
              ></i>
              <span>Settings</span>
              <i
                className="fas fa-chevron-right"
                style={{ fontSize: "10px" }}
              ></i>
              <span className="text-primary fw-medium">Financial Year</span>
            </small>
          </div>
          <button
            className="btn-glow primary w-100 w-md-auto"
            onClick={() => {
              setForm(emptyForm);
              setShowModal(true);
            }}
            disabled={loading}
          >
            <i className="fas fa-calendar-plus me-2"></i> Add Year
          </button>
        </HeaderSection>

        <SummaryGrid className="mb-4 fade-slide-up delay-2">
          <SummaryCard>
            <div className="inner-content">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <span
                  className="text-muted-custom fw-semibold text-uppercase tracking-wide"
                  style={{ fontSize: "11px" }}
                >
                  Total Records
                </span>
                <div className="icon-box bg-primary-subtle text-primary">
                  <i className="fas fa-database summary-icon"></i>
                </div>
              </div>
              <h3 className="fw-bold mt-2 text-custom mb-0">
                <AnimatedNumber value={totalYears} />
              </h3>
              <small className="text-muted-custom mt-2 d-block">
                Financial Years in System
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
                  Active Year
                </span>
                <div className="icon-box bg-success-subtle text-success">
                  <i className="fas fa-calendar-check summary-icon"></i>
                </div>
              </div>
              <h3
                className="fw-bold mt-2 text-custom mb-0"
                style={{ fontSize: "1.5rem" }}
              >
                {activeYearData ? activeYearData.yearName : "None"}
              </h3>
              <small className="text-success mt-2 d-block">
                Currently generating invoices
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
                  Closed Years
                </span>
                <div className="icon-box bg-danger-subtle text-danger">
                  <i className="fas fa-lock summary-icon"></i>
                </div>
              </div>
              <h3 className="fw-bold mt-2 text-custom mb-0">
                <AnimatedNumber value={closedCount} />
              </h3>
              <small className="text-danger mt-2 d-block">
                Locked for modifications
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
                  Upcoming Years
                </span>
                <div
                  className="icon-box bg-info-subtle text-info"
                  style={{ color: "#0ea5e9" }}
                >
                  <i className="fas fa-hourglass-half summary-icon"></i>
                </div>
              </div>
              <h3 className="fw-bold mt-2 text-custom mb-0">
                <AnimatedNumber value={upcomingCount} />
              </h3>
              <small
                className="text-info mt-2 d-block"
                style={{ color: "#0ea5e9" }}
              >
                Scheduled for future
              </small>
            </div>
          </SummaryCard>
        </SummaryGrid>

        <FilterCard className="fade-slide-up delay-3">
          <SearchWrapper>
            <i className="fas fa-search icon"></i>
            <input
              type="text"
              placeholder="Search year name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              disabled={loading}
            />
          </SearchWrapper>

          <FilterGroup>
            <QuickPill
              $active={statusFilter === "ACTIVE"}
              onClick={() => {
                setStatusFilter("ACTIVE");
                setCurrentPage(1);
              }}
              disabled={loading}
            >
              Active Only
            </QuickPill>
            <QuickPill
              $active={statusFilter === "CLOSED"}
              onClick={() => {
                setStatusFilter("CLOSED");
                setCurrentPage(1);
              }}
              disabled={loading}
            >
              Closed Only
            </QuickPill>

            <div className="filter-input">
              <i className="fas fa-filter text-muted-custom me-2"></i>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={loading}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <div className="filter-input">
              <i className="fas fa-sort-amount-down text-muted-custom me-2"></i>
              <select
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={loading}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="a-z">Name (A-Z)</option>
              </select>
            </div>

            <div className="filter-input">
              <i className="fas fa-calendar-alt text-muted-custom me-2"></i>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={loading}
              />
              <span className="mx-2 text-muted-custom">-</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setCurrentPage(1);
                }}
                disabled={loading}
              />
            </div>

            <button
              className="action-btn secondary px-3 py-2"
              onClick={resetFilters}
              disabled={loading}
              style={{ borderRadius: "14px", height: "40px" }}
            >
              <i className="fas fa-undo"></i>
            </button>
          </FilterGroup>
        </FilterCard>

        <GlassCard className="p-0 overflow-hidden fade-slide-up delay-3 mt-4">
          <TableWrapper>
            <Table>
              <thead>
                <tr>
                  <th>Financial Year</th>
                  <th>Duration (Start - End)</th>
                  <th>Status</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan="4"
                      className="text-center py-5 border-0 text-muted-custom"
                    >
                      <i className="fas fa-calendar-times fs-1 mb-3 opacity-50"></i>
                      <br />
                      No financial years found matching criteria.
                    </td>
                  </tr>
                ) : (
                  currentRecords.map((y, i) => {
                    const status = getStatus(y);
                    return (
                      <tr
                        key={y.id}
                        className="fade-in list-row"
                        style={{ animationDelay: `${i * 0.05}s` }}
                      >
                        <td>
                          <div className="product-info">
                            <div className="avatar-circle">
                              <i className="fas fa-calendar-alt"></i>
                            </div>
                            <div className="fw-bold text-custom">
                              {y.yearName}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            <span className="text-success fw-medium">
                              Start:{" "}
                              {y.startDate
                                ? new Date(y.startDate).toLocaleDateString()
                                : "-"}
                            </span>
                            <span className="text-danger small">
                              End:{" "}
                              {y.endDate
                                ? new Date(y.endDate).toLocaleDateString()
                                : "-"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <StatusBadge $status={status}>{status}</StatusBadge>
                        </td>
                        <td>
                          <ActionButtons>
                            {status !== "ACTIVE" && status !== "CLOSED" ? (
                              <button
                                className="success"
                                onClick={() => handleSetActive(y.id)}
                                title="Set Active"
                                disabled={loading}
                              >
                                <i className="fas fa-check-circle"></i>
                              </button>
                            ) : (
                              <button
                                className="success disabled-action"
                                disabled
                                title={
                                  status === "CLOSED"
                                    ? "Year is closed"
                                    : "Currently Active"
                                }
                              >
                                <i className="fas fa-check-circle"></i>
                              </button>
                            )}

                            {status !== "CLOSED" ? (
                              <button
                                className="danger"
                                onClick={() => handleCloseYear(y.id)}
                                title="Lock / Close Year"
                                disabled={loading}
                              >
                                <i className="fas fa-lock"></i>
                              </button>
                            ) : (
                              <button
                                className="danger disabled-action"
                                disabled
                                title="Already Locked"
                              >
                                <i className="fas fa-lock"></i>
                              </button>
                            )}

                            <button
                              className="info"
                              onClick={() => handleViewReport(y.id)}
                              title="View Report"
                              disabled={loading}
                            >
                              <i className="fas fa-chart-bar"></i>
                            </button>
                            <button
                              className="secondary"
                              onClick={() => handleBackupData(y.id)}
                              title="Backup Data"
                              disabled={loading}
                            >
                              <i className="fas fa-database"></i>
                            </button>

                            <div className="action-divider"></div>

                            {status !== "CLOSED" ? (
                              <>
                                <button
                                  className="edit"
                                  onClick={() => handleEdit(y.id)}
                                  title="Edit"
                                  disabled={loading}
                                >
                                  <i className="fas fa-pen"></i>
                                </button>
                                <button
                                  className="delete"
                                  onClick={() => handleDelete(y.id)}
                                  title="Delete"
                                  disabled={loading}
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="edit disabled-action"
                                  disabled
                                  title="Locked"
                                >
                                  <i className="fas fa-lock"></i>
                                </button>
                                <button
                                  className="delete disabled-action"
                                  disabled
                                  title="Locked"
                                >
                                  <i className="fas fa-lock"></i>
                                </button>
                              </>
                            )}
                          </ActionButtons>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </TableWrapper>

          {processedData.length > itemsPerPage && (
            <PaginationWrapper className="p-4 border-top border-custom bg-light-custom">
              <span className="text-muted-custom small fw-medium">
                Showing {indexOfFirst + 1} to{" "}
                {Math.min(indexOfLast, processedData.length)} of{" "}
                {processedData.length} entries
              </span>
              <div className="d-flex gap-2">
                <button
                  className="action-btn secondary"
                  disabled={currentPage === 1 || loading}
                  onClick={() => setCurrentPage((c) => c - 1)}
                >
                  <i className="fas fa-chevron-left me-1"></i> Prev
                </button>
                <span className="text-custom fw-bold px-3 py-1 bg-card rounded-pill border border-custom d-flex align-items-center">
                  {currentPage} / {totalPages || 1}
                </span>
                <button
                  className="action-btn secondary"
                  disabled={currentPage === totalPages || loading}
                  onClick={() => setCurrentPage((c) => c + 1)}
                >
                  Next <i className="fas fa-chevron-right ms-1"></i>
                </button>
              </div>
            </PaginationWrapper>
          )}
        </GlassCard>

        {showModal && (
          <ModalOverlay
            onClick={() => {
              setShowModal(false);
              setForm(emptyForm);
            }}
          >
            <ModalContent
              onClick={(e) => e.stopPropagation()}
              className="glowing-modal"
            >
              <ModalHeader>
                <h5 className="fw-bold mb-0 text-custom d-flex align-items-center gap-2">
                  <div className="icon-box-sm bg-primary-subtle text-primary">
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  {form.id > 0 ? "Edit Financial Year" : "Add Financial Year"}
                </h5>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowModal(false);
                    setForm(emptyForm);
                  }}
                >
                  <i className="fas fa-times"></i>
                </button>
              </ModalHeader>
              <div
                className="modal-body p-4 custom-scrollbar"
                style={{ maxHeight: "65vh", overflowY: "auto" }}
              >
                <div className="row g-3">
                  <div className="col-12">
                    <FormGroup>
                      <label>
                        Year Name <span className="text-danger">*</span>
                      </label>
                      <FormInput
                        name="yearName"
                        value={form.yearName}
                        onChange={handleChange}
                        placeholder="e.g. 2025-2026"
                        autoFocus
                      />
                    </FormGroup>
                  </div>
                  <div className="col-md-6">
                    <FormGroup>
                      <label>
                        Start Date <span className="text-danger">*</span>
                      </label>
                      <FormInput
                        type="date"
                        name="startDate"
                        value={form.startDate}
                        onChange={handleChange}
                      />
                    </FormGroup>
                  </div>
                  <div className="col-md-6">
                    <FormGroup>
                      <label>
                        End Date <span className="text-danger">*</span>
                      </label>
                      <FormInput
                        type="date"
                        name="endDate"
                        value={form.endDate}
                        onChange={handleChange}
                      />
                    </FormGroup>
                  </div>
                </div>
              </div>
              <ModalFooter>
                <button
                  className="action-btn danger"
                  onClick={() => {
                    setShowModal(false);
                    setForm(emptyForm);
                  }}
                  disabled={submitLoading}
                >
                  <i className="fas fa-times me-2"></i> Cancel
                </button>
                <button
                  className="action-btn success"
                  onClick={handleSave}
                  disabled={submitLoading}
                >
                  {submitLoading ? (
                    <i className="fas fa-spinner fa-spin me-2"></i>
                  ) : (
                    <i className="fas fa-check me-2"></i>
                  )}
                  {form.id > 0 ? "Update" : "Save"}
                </button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </PageWrapper>
    </>
  );
}

/* ================= STYLED COMPONENTS ================= */

const animFadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const fadeIn = keyframes`from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(8px); }`;
const slideUpScale = keyframes`from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); }`;

const PageWrapper = styled.div`
  min-height: 100vh;
  color: var(--text);
  font-family: "Inter", sans-serif;
  .fade-slide-up {
    opacity: 0;
    animation: ${slideUpScale} 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  }
  .delay-1 {
    animation-delay: 0.1s;
  }
  .delay-2 {
    animation-delay: 0.2s;
  }
  .delay-3 {
    animation-delay: 0.3s;
  }
  .custom-scrollbar::-webkit-scrollbar {
    width: 5px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--border-custom);
    border-radius: 4px;
  }
`;

const BreadcrumbLink = styled(Link)`
  color: var(--text-muted);
  text-decoration: none;
  transition: all 0.2s ease;
  &:hover {
    color: var(--primary);
  }
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  .gradient-text {
    background: linear-gradient(90deg, var(--primary), #8b5cf6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    display: inline-block;
  }
  .btn-glow.primary {
    padding: 10px 20px;
    border: none;
    border-radius: 10px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    background: var(--primary);
    transition: 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  }
  .btn-glow.primary:hover:not(:disabled) {
    transform: scale(1.05);
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.6);
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
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
  .inner-content {
    padding: 20px;
    background: transparent;
    border-radius: 15px;
  }
  &:hover {
    border-color: rgba(10, 102, 249, 0.87);
    box-shadow: 3px 15px 45px rgba(59, 131, 246, 0.49);
    transform: translateY(-5px);
  }
  .icon-box {
    width: 50px;
    height: 50px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    transition: 0.3s;
  }
  &:hover .icon-box {
    transform: scale(1.1) rotate(5deg);
  }
  h3 {
    font-size: 1.8rem;
  }
`;

const GlassCard = styled.div`
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(13, 51, 236, 0.81);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(16px);
  &:hover {
    border-color: rgba(10, 102, 249, 0.87);
    box-shadow: 3px 15px 45px rgba(59, 131, 246, 0.49);
  }
`;

const FilterCard = styled(GlassCard)`
  padding: 18px 24px;
  margin-bottom: 25px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
`;

const SearchWrapper = styled.div`
  position: relative;
  flex: 1;
  min-width: 250px;
  .icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
  }
  input {
    width: 100%;
    padding: 12px 12px 12px 40px;
    background: var(--bg-light-custom);
    border: 1px solid var(--border-custom);
    border-radius: 14px;
    color: var(--text);
    font-weight: 500;
    transition: 0.3s;
    &:focus {
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
      outline: none;
    }
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  .filter-input {
    display: flex;
    align-items: center;
    background: var(--bg-light-custom);
    border: 1px solid var(--border-custom);
    border-radius: 14px;
    padding: 0 12px;
    height: 40px;
    transition: 0.3s;
    &:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
    }
    select,
    input {
      border: none;
      background: transparent;
      color: var(--text);
      font-weight: 500;
      font-size: 13px;
      outline: none;
    }
  }
`;

const QuickPill = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 50px;
  border: 1px solid
    ${(p) => (p.$active ? "transparent" : "var(--border-custom)")};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  background: ${(p) =>
    p.$active
      ? "linear-gradient(135deg, var(--primary), #4f46e5)"
      : "var(--bg-light-custom)"};
  color: ${(p) => (p.$active ? "#fff" : "var(--text)")};
  box-shadow: ${(p) =>
    p.$active ? "0 4px 15px rgba(59, 130, 246, 0.4)" : "none"};
  transition: all 0.3s;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(59, 130, 246, 0.2);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;
const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0 8px;
  th {
    padding: 15px;
    text-align: left;
    color: var(--text-muted);
    font-size: 0.8rem;
    text-transform: uppercase;
  }
  td {
    background: var(--bg-hover);
    padding: 15px;
    vertical-align: middle;
    transition: 0.3s;
    border-top: 1px solid transparent;
    border-bottom: 1px solid transparent;
  }
  tr.list-row {
    transition: all 0.3s ease;
  }
  tr.list-row:hover td {
    background: var(--bg-light-custom);
    border-color: var(--primary);
    box-shadow: inset 0 0 10px rgba(59, 130, 246, 0.1);
    transform: scale(1.001);
  }
  .avatar-circle {
    width: 40px;
    height: 40px;
    background: var(--primary);
    color: white;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
  }
  .product-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .fade-in {
    animation: ${animFadeIn} 0.5s ease forwards;
    opacity: 0;
  }
`;

const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(p) =>
    p.$status === "ACTIVE"
      ? "rgba(16, 185, 129, 0.15)"
      : p.$status === "CLOSED"
        ? "rgba(239, 68, 68, 0.15)"
        : p.$status === "UPCOMING"
          ? "rgba(59, 130, 246, 0.15)"
          : "rgba(100, 116, 139, 0.15)"};
  color: ${(p) =>
    p.$status === "ACTIVE"
      ? "#10b981"
      : p.$status === "CLOSED"
        ? "#ef4444"
        : p.$status === "UPCOMING"
          ? "#3b82f6"
          : "#64748b"};
  border: 1px solid
    ${(p) =>
      p.$status === "ACTIVE"
        ? "rgba(16, 185, 129, 0.3)"
        : p.$status === "CLOSED"
          ? "rgba(239, 68, 68, 0.3)"
          : p.$status === "UPCOMING"
            ? "rgba(59, 130, 246, 0.3)"
            : "rgba(100, 116, 139, 0.3)"};
  position: relative;
  overflow: hidden;
  ${(p) =>
    p.$status === "ACTIVE" &&
    css`
      &::after {
        content: "";
        position: absolute;
        top: 0;
        left: -100%;
        width: 50%;
        height: 100%;
        background: linear-gradient(
          90deg,
          transparent,
          rgba(255, 255, 255, 0.4),
          transparent
        );
        animation: shine 2s infinite;
      }
      @keyframes shine {
        100% {
          left: 200%;
        }
      }
    `}
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 6px;
  .action-divider {
    width: 1px;
    background: var(--border-custom);
    margin: 0 4px;
  }
  button {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    &.edit {
      background: rgba(14, 165, 233, 0.1);
      color: #0ea5e9;
    }
    &.delete {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
    &.info {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
    }
    &.success {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }
    &.danger {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
    &.secondary {
      background: rgba(100, 116, 139, 0.1);
      color: #64748b;
    }
    &.disabled-action {
      opacity: 0.3;
      cursor: not-allowed;
      background: rgba(100, 116, 139, 0.1);
      color: #64748b;
    }

    &:hover.edit:not(:disabled) {
      transform: translateY(-3px);
      border-color: #0ea5e9;
      box-shadow: 0 4px 10px rgba(14, 165, 233, 0.3);
    }
    &:hover.delete:not(:disabled) {
      transform: translateY(-3px);
      border-color: #ef4444;
      box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
    }
    &:hover.info:not(:disabled) {
      transform: translateY(-3px);
      border-color: #8b5cf6;
      box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3);
    }
    &:hover.success:not(:disabled) {
      transform: translateY(-3px);
      border-color: #10b981;
      box-shadow: 0 4px 10px rgba(16, 185, 129, 0.3);
    }
    &:hover.danger:not(:disabled) {
      transform: translateY(-3px);
      border-color: #ef4444;
      box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
    }
    &:hover.secondary:not(:disabled) {
      transform: translateY(-3px);
      border-color: #64748b;
      box-shadow: 0 4px 10px rgba(100, 116, 139, 0.3);
    }
  }
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  button {
    padding: 8px 20px;
    border-radius: 10px;
    border: 1px solid var(--border-custom);
    background: var(--card);
    color: var(--text);
    cursor: pointer;
    display: flex;
    align-items: center;
    transition: 0.3s;
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    &:hover:not(:disabled) {
      background: var(--bg-light-custom);
      border-color: var(--primary);
      box-shadow: 0 0 8px rgba(59, 130, 246, 0.2);
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  animation: ${fadeIn} 0.3s ease-out forwards;
`;

const ModalContent = styled.div`
  background: var(--card);
  color: var(--text);
  width: 90%;
  max-width: 800px;
  border-radius: 20px;
  border: 1px solid var(--border-custom);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  animation: ${slideUpScale} 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transition: 0.3s;
  &.glowing-modal:hover {
    box-shadow:
      0 30px 60px -12px rgba(0, 0, 0, 0.4),
      0 0 20px rgba(59, 130, 246, 0.1);
  }
`;

const ModalHeader = styled.div`
  padding: 20px 25px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-custom);
  background: var(--bg-light-custom);
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  .icon-box-sm {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .close-btn {
    background: var(--card);
    border: 1px solid var(--border-custom);
    color: var(--text-muted);
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: 0.2s;
    &:hover {
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
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    margin-left: 4px;
  }
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--bg-light-custom);
  color: var(--text) !important;
  border: 1px solid var(--border-custom);
  font-size: 14px;
  transition: all 0.3s ease;
  &::placeholder {
    color: var(--text-muted);
    opacity: 0.7;
  }
  &:hover {
    border-color: var(--primary);
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.2);
  }
  &:focus {
    background: var(--card);
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    outline: none;
  }
`;

const ModalFooter = styled.div`
  padding: 20px 25px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--border-custom);
  background: var(--bg-light-custom);
  border-bottom-left-radius: 20px;
  border-bottom-right-radius: 20px;
  .action-btn {
    padding: 10px 20px;
    border-radius: 10px;
    font-weight: 600;
    border: none;
    cursor: pointer;
    transition: 0.3s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .action-btn.danger {
    background: var(--danger);
    color: white;
  }
  .action-btn.danger:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    transform: translateY(-2px);
  }
  .action-btn.success {
    background: var(--success);
    color: white;
  }
  .action-btn.success:hover:not(:disabled) {
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
    transform: translateY(-2px);
  }
  .action-btn.secondary {
    background: var(--card);
    border: 1px solid var(--border-custom);
    color: var(--text);
  }
  .action-btn.secondary:hover:not(:disabled) {
    background: var(--bg-hover);
    border-color: var(--primary);
  }
  .action-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .btn-sm {
    padding: 6px 12px;
    font-size: 12px;
    border-radius: 8px;
  }
`;
