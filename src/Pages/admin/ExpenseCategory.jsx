import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Tag,
  Plus,
  Edit3,
  Trash2,
  Search,
  RefreshCcw,
  X,
  CheckCircle2,
  RotateCcw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Hash,
  ToggleLeft,
  ToggleRight,
  Layers,
  Activity,
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
} from "../../../Services/sweetAlert";

import GlobalLoader from "../../components/common/GlobalLoader.jsx";
import PageTransition from "../../components/common/PageTransition.jsx";
import PremiumEmptyState from "../../components/common/PremiumEmptyState.jsx";
import { SkeletonTableRows } from "../../components/common/SkeletonLoader.jsx";

/* ─────────────────────────────────────────
   ANIMATED NUMBER
───────────────────────────────────────── */
const AnimatedNumber = ({ value }) => {
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
  return <>{Math.ceil(count)}</>;
};

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function ExpenseCategory() {
  const emptyForm = {
    id: 0,
    categoryName: "",
    description: "",
    isActive: true,
  };

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchCategories(false, true);
  }, []);

  const fetchCategories = async (isRefresh = false, isInit = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else if (!isInit) setLoading(true);
      const res = await getRequest("ExpenseCategory/List");
      if (res && (res.status === "OK" || res.Status === "OK")) {
        setCategories(res.result || res.Result || []);
      }
    } catch (err) {
      errorAlert("Error", "Failed to fetch expense categories.");
    } finally {
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 600);
      else
        setTimeout(() => {
          setLoading(false);
          setInitialLoad(false);
        }, 500);
    }
  };

  const handleRefresh = () => fetchCategories(true);

  const handleAddClick = () => {
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleEdit = async (id) => {
    try {
      const res = await getRequest(`ExpenseCategory/Detail/${id}`);
      if (
        res &&
        (res.status === "OK" || res.Status === "OK") &&
        (res.result || res.Result)
      ) {
        const d = res.result || res.Result;
        setForm({
          id: d.id || d.Id || 0,
          categoryName: d.categoryName || d.CategoryName || "",
          description: d.description || d.Description || "",
          isActive:
            d.isActive !== undefined
              ? d.isActive
              : d.IsActive !== undefined
                ? d.IsActive
                : true,
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
      "Delete Category?",
      "This expense category will be permanently removed.",
    );
    if (!confirm.isConfirmed) return;
    try {
      const res = await deleteRequest(`ExpenseCategory/Delete/${id}`);
      if (res && (res.status === "OK" || res.Status === "OK")) {
        successAlert("Deleted", "Category removed successfully.");
        fetchCategories();
      } else throw new Error(res?.message || "Delete failed.");
    } catch (err) {
      errorAlert("Error", err?.message || "Delete operation failed.");
    }
  };

  const handleSave = async () => {
    if (!form.categoryName?.trim())
      return warningAlert("Validation", "Category name is required.");
    try {
      setSubmitLoading(true);
      const payload = {
        id: Number(form.id) || 0,
        categoryName: form.categoryName.trim(),
        description: form.description?.trim() || "",
        isActive: !!form.isActive,
      };
      const response =
        payload.id > 0
          ? await putRequest("ExpenseCategory/Update", payload)
          : await postRequest("ExpenseCategory/Save", payload);

      if (response && (response.status === "OK" || response.Status === "OK")) {
        successAlert(
          "Success",
          payload.id > 0 ? "Category updated." : "Category added.",
        );
        setShowModal(false);
        setForm(emptyForm);
        fetchCategories();
      } else throw new Error(response?.message || "Save failed.");
    } catch (err) {
      errorAlert("API Error", err?.message || "Server connection failed.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleResetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSortOrder("newest");
    setCurrentPage(1);
  };

  const activeFiltersCount = [search, statusFilter !== "all"].filter(
    Boolean,
  ).length;

  // Processed data
  const processedData = useMemo(() => {
    let list = [...categories];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          (c.categoryName || c.CategoryName || "").toLowerCase().includes(q) ||
          (c.description || c.Description || "").toLowerCase().includes(q),
      );
    }
    if (statusFilter === "active")
      list = list.filter((c) => c.isActive || c.IsActive);
    if (statusFilter === "inactive")
      list = list.filter((c) => !(c.isActive || c.IsActive));
    list.sort((a, b) => {
      const aId = a.id || a.Id || 0;
      const bId = b.id || b.Id || 0;
      return sortOrder === "newest" ? bId - aId : aId - bId;
    });
    return list;
  }, [categories, search, statusFilter, sortOrder]);

  const totalPages = Math.max(
    1,
    Math.ceil(processedData.length / itemsPerPage),
  );
  const currentRecords = processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Stats
  const statsActive = categories.filter((c) => c.isActive || c.IsActive).length;
  const statsInactive = categories.length - statsActive;

  return (
    <>
      <GlobalLoader isLoading={submitLoading} />
      <PageTransition>
        <PageWrapper>
          {/* ─── PAGE HEADER ─── */}
          <PageHeader>
            <HeaderLeft>
              <ModuleIcon>
                <Tag size={22} />
              </ModuleIcon>
              <HeaderText>
                <PageTitle>Expense Categories</PageTitle>
                <Breadcrumb>
                  <BreadcrumbLink to="/admin/dashboard">
                    Dashboard
                  </BreadcrumbLink>
                  <BreadSep>/</BreadSep>
                  <BreadcrumbLink to="/admin/expenses">Expenses</BreadcrumbLink>
                  <BreadSep>/</BreadSep>
                  <BreadActive>Categories</BreadActive>
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
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCcw size={14} className={isRefreshing ? "spin" : ""} />
                Refresh
              </HeaderBtn>
              <HeaderBtn variant="primary" onClick={handleAddClick}>
                <Plus size={15} />
                New Category
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
            <KpiCard $accent="#3b82f6">
              <KpiIconWrap $color="#3b82f6">
                <Layers size={20} />
              </KpiIconWrap>
              <KpiBody>
                <KpiLabel>Total Categories</KpiLabel>
                <KpiValue>
                  <AnimatedNumber value={categories.length} />
                </KpiValue>
              </KpiBody>
              <KpiGlow $color="#3b82f6" />
            </KpiCard>
            <KpiCard $accent="#10b981">
              <KpiIconWrap $color="#10b981">
                <ToggleRight size={20} />
              </KpiIconWrap>
              <KpiBody>
                <KpiLabel>Active</KpiLabel>
                <KpiValue>
                  <AnimatedNumber value={statsActive} />
                </KpiValue>
              </KpiBody>
              <KpiGlow $color="#10b981" />
            </KpiCard>
            <KpiCard $accent="#ef4444">
              <KpiIconWrap $color="#ef4444">
                <ToggleLeft size={20} />
              </KpiIconWrap>
              <KpiBody>
                <KpiLabel>Inactive</KpiLabel>
                <KpiValue>
                  <AnimatedNumber value={statsInactive} />
                </KpiValue>
              </KpiBody>
              <KpiGlow $color="#ef4444" />
            </KpiCard>
            <KpiCard $accent="#8b5cf6">
              <KpiIconWrap $color="#8b5cf6">
                <Activity size={20} />
              </KpiIconWrap>
              <KpiBody>
                <KpiLabel>Filtered Results</KpiLabel>
                <KpiValue>
                  <AnimatedNumber value={processedData.length} />
                </KpiValue>
              </KpiBody>
              <KpiGlow $color="#8b5cf6" />
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
                  placeholder="Search by category name or description…"
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
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </FilterField>

              <FilterField>
                <Filter size={14} className="fi" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                </select>
              </FilterField>

              <ResetBtn onClick={handleResetFilters}>
                <RotateCcw size={13} />
                Reset
                {activeFiltersCount > 0 && (
                  <FilterBadge>{activeFiltersCount}</FilterBadge>
                )}
              </ResetBtn>
            </FilterBar>

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

            {/* TABLE */}
            <DataGridWrap>
              <DataGrid>
                <thead>
                  <tr>
                    <Th>#</Th>
                    <Th>Category Name</Th>
                    <Th>Description</Th>
                    <Th center>Status</Th>
                    <Th center>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {initialLoad || loading || isRefreshing ? (
                    <SkeletonTableRows rows={itemsPerPage} columns={5} />
                  ) : currentRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        style={{ padding: "4rem 0", borderBottom: "none" }}
                      >
                        <PremiumEmptyState
                          icon={<Tag size={40} strokeWidth={1.2} />}
                          title="No Categories Found"
                          subtitle="Add your first expense category to start organizing business expenses."
                        />
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((cat, idx) => {
                      const id = cat.id || cat.Id;
                      const name = cat.categoryName || cat.CategoryName || "—";
                      const desc = cat.description || cat.Description || "—";
                      const active = cat.isActive || cat.IsActive;
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
                            <NameCell>
                              <NameDot $color="#3b82f6" />
                              {name}
                            </NameCell>
                          </Td>
                          <Td>
                            <DescCell>{desc}</DescCell>
                          </Td>
                          <Td center>
                            <StatusBadge $active={active}>
                              {active ? (
                                <>
                                  <ToggleRight size={12} /> Active
                                </>
                              ) : (
                                <>
                                  <ToggleLeft size={12} /> Inactive
                                </>
                              )}
                            </StatusBadge>
                          </Td>
                          <Td center>
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
                          key={`e${i}`}
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

          {/* ════════════════════════════════
              ADD / EDIT MODAL
          ════════════════════════════════ */}
          <AnimatePresence>
            {showModal && (
              <Overlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !submitLoading && setShowModal(false)}
              >
                <ModalBox
                  initial={{ scale: 0.94, y: 24, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.94, y: 24, opacity: 0 }}
                  transition={{ type: "spring", damping: 26, stiffness: 320 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ModalHead>
                    <ModalIconWrap $color="#3b82f6">
                      <Tag size={18} />
                    </ModalIconWrap>
                    <div>
                      <ModalTitle>
                        {form.id > 0 ? "Edit Category" : "New Expense Category"}
                      </ModalTitle>
                      <ModalSubtitle>
                        {form.id > 0
                          ? "Update existing category details"
                          : "Define a new expense category"}
                      </ModalSubtitle>
                    </div>
                    <CloseBtn
                      onClick={() => !submitLoading && setShowModal(false)}
                    >
                      <X size={18} />
                    </CloseBtn>
                  </ModalHead>

                  <ModalBody>
                    <FormGrid>
                      <FormGroup $full>
                        <FormLabel>
                          Category Name <Req>*</Req>
                        </FormLabel>
                        <FormInput
                          name="categoryName"
                          value={form.categoryName}
                          onChange={handleChange}
                          placeholder="e.g. Office Supplies"
                          autoFocus
                        />
                      </FormGroup>
                      <FormGroup $full>
                        <FormLabel>Description</FormLabel>
                        <FormTextarea
                          name="description"
                          value={form.description}
                          onChange={handleChange}
                          placeholder="Optional description for this category…"
                          rows={3}
                        />
                      </FormGroup>
                      <FormGroup>
                        <FormLabel>Status</FormLabel>
                        <ToggleRow>
                          <ToggleSwitch>
                            <input
                              type="checkbox"
                              name="isActive"
                              checked={!!form.isActive}
                              onChange={handleChange}
                            />
                            <span className="slider" />
                          </ToggleSwitch>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: form.isActive
                                ? "#10b981"
                                : "var(--text-muted)",
                            }}
                          >
                            {form.isActive ? "Active" : "Inactive"}
                          </span>
                        </ToggleRow>
                      </FormGroup>
                    </FormGrid>
                  </ModalBody>

                  <ModalFoot>
                    <ModalBtn
                      $variant="cancel"
                      onClick={() => !submitLoading && setShowModal(false)}
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
                          ? "Update"
                          : "Save Category"}
                    </ModalBtn>
                  </ModalFoot>
                </ModalBox>
              </Overlay>
            )}
          </AnimatePresence>
        </PageWrapper>
      </PageTransition>

      <style>{`
        .spin { animation: spin360 1s linear infinite; }
        @keyframes spin360 { to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

/* ═══════════════════════════════════════
   STYLED COMPONENTS
═══════════════════════════════════════ */
const pulse = keyframes`
  0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
`;

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
    min-width: 0;
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
  min-width: 600px;
`;

const Th = styled.th`
  padding: 14px 20px;
  text-align: ${(p) => (p.center ? "center" : "left")};
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
  text-align: ${(p) => (p.center ? "center" : "left")};
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
    p.$active ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)"};
  color: ${(p) => (p.$active ? "#10b981" : "#ef4444")};
  border: 1px solid
    ${(p) => (p.$active ? "rgba(16,185,129,0.3)" : "rgba(239,68,68,0.3)")};
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
    `}
  ${(p) =>
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

/* MODAL */
const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(10, 16, 30, 0.7);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
`;

const ModalBox = styled(motion.div)`
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 18px;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
`;

const ModalHead = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-custom);
  background: var(--bg-light-custom);
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
  border: 1px solid ${(p) => p.$color}30;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: var(--text);
`;

const ModalSubtitle = styled.p`
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
`;

const CloseBtn = styled.button`
  margin-left: auto;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  transition: all 0.2s;
  &:hover {
    background: rgba(239, 68, 68, 0.08);
    color: #ef4444;
  }
`;

const ModalBody = styled.div`
  padding: 22px 24px;
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

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  ${(p) =>
    p.$full &&
    css`
      grid-column: 1 / -1;
    `}
`;

const FormLabel = styled.label`
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const Req = styled.span`
  color: #ef4444;
  margin-left: 2px;
`;

const inputStyles = css`
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13.5px;
  border: 1.5px solid var(--border-custom);
  background: var(--bg-light-custom);
  color: var(--text);
  width: 100%;
  font-weight: 500;
  transition: all 0.2s;
  outline: none;
  &::placeholder {
    color: var(--text-muted);
    opacity: 0.6;
  }
  &:focus {
    background: var(--card);
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }
`;

const FormInput = styled.input`
  ${inputStyles}
`;

const FormTextarea = styled.textarea`
  ${inputStyles}
  resize: vertical;
  min-height: 80px;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 42px;
  height: 22px;
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .slider {
    position: absolute;
    inset: 0;
    background: var(--border-custom);
    border-radius: 22px;
    cursor: pointer;
    transition: 0.3s;
    &::before {
      content: "";
      position: absolute;
      width: 16px;
      height: 16px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
    }
  }
  input:checked + .slider {
    background: #10b981;
  }
  input:checked + .slider::before {
    transform: translateX(20px);
  }
`;

const ModalFoot = styled.div`
  padding: 16px 24px;
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
  padding: 10px 20px;
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
