import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  RefreshCcw,
  AlertCircle,
  Calendar,
  Building2,
  MapPin,
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
  UserCheck,
  Shield,
  Activity,
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
export default function ClientMaster() {
  const emptyForm = {
    id: 0,
    businessName: "",
    contactPerson: "",
    emailId: "",
    contactNumber: "",
    address: "",
    city: "",
    stateCode: "",
    state: "",
    zipCode: "",
    country: "",
    gstin: "",
    pan: "",
    staffMasterId: "",
    status: true,
  };

  /* ── Master States ── */
  const [clients, setClients] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitLoading, setSubmitLoading] = useState(false);

  /* ── Premium Enhancement States ── */
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFy, setActiveFy] = useState(null);

  /* ── Filters ── */
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ── Pagination Fixed at 5 ── */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchInitialData();
  }, []);

  /* ═══════════════ FETCH INITIAL DATA ═══════════════ */
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
      await fetchClients(false, true);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setInitialLoad(false), 700);
    }
  };

  /* ═══════════════ FETCH DATA ═══════════════ */
  const fetchClients = async (isRefresh = false, isInit = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else if (!isInit) setLoading(true);

      const res = await getRequest("ClientMaster/List");
      if (res.status === "OK") {
        setClients(res.result || []);
      }
    } catch (err) {
      errorAlert("Error", "Failed to fetch clients");
    } finally {
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 600);
      else if (!isInit) setTimeout(() => setLoading(false), 400);
    }
  };

  /* ═══════════════ HANDLERS ═══════════════ */
  const handleRefresh = () => {
    fetchClients(true);
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
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAddClick = () => {
    if (isFyLocked || !activeFy) {
      return warningAlert(
        "Financial Year Locked",
        "Cannot modify clients in closed or missing financial year.",
      );
    }
    setForm(emptyForm);
    setShowModal(true);
  };

  const handleEditClick = async (id) => {
    if (isFyLocked || !activeFy) {
      return warningAlert(
        "Financial Year Locked",
        "Cannot modify clients in closed or missing financial year.",
      );
    }
    try {
      const res = await getRequest(`ClientMaster/Detail/${id}`);
      if (res.status === "OK" && res.result) {
        setForm(res.result);
        setShowModal(true);
      }
    } catch {
      errorAlert("Error", "Failed to fetch client details");
    }
  };

  const handleDeleteClick = async (id) => {
    if (isFyLocked || !activeFy) {
      return warningAlert(
        "Financial Year Locked",
        "Cannot modify clients in closed or missing financial year.",
      );
    }
    const confirm = await confirmAlert(
      "Delete Client?",
      "This cannot be undone.",
    );
    if (!confirm.isConfirmed) return;

    try {
      const res = await deleteRequest(`ClientMaster/Delete/${id}`);
      if (res.status === "OK") {
        successAlert("Deleted", "Client removed successfully");
        fetchClients();
      } else {
        errorAlert("Error", res.result || "Delete failed");
      }
    } catch {
      errorAlert("Error", "Deletion failed");
    }
  };

  const handleSave = async () => {
    if (!form.businessName.trim() || !form.contactPerson.trim()) {
      return warningAlert(
        "Validation Error",
        "Business Name and Contact Person are required",
      );
    }

    try {
      setSubmitLoading(true);

      const payload = {
        Id: form.id || 0,
        BusinessName: form.businessName,
        ContactPerson: form.contactPerson,
        Email: form.emailId || "",
        ContactNo: form.contactNumber || "",
        Address: form.address,
        StateCode: form.stateCode,
        State: form.state,
        GSTIN: form.gstin,
        StaffMasterId: Number(form.staffMasterId) || 0,
        City: form.city,
        ZipCode: form.zipCode,
        Country: form.country,
        Pan: form.pan,
        Status: true,
      };

      const res =
        form.id > 0
          ? await putRequest("ClientMaster/Update", payload)
          : await postRequest("ClientMaster/Save", payload);

      if (res.status === "OK") {
        successAlert("Success", "Client Saved");
        setShowModal(false);
        setForm(emptyForm);
        fetchClients();
      } else {
        errorAlert("Error", res?.result || res?.message || "Failed to save");
      }
    } catch (err) {
      console.error(err);
      errorAlert("Error", err?.result || err?.message || "Server Error");
    } finally {
      setSubmitLoading(false);
    }
  };

  /* ═══════════════ FILTER & PAGINATION ═══════════════ */
  const processedData = useMemo(() => {
    let result = [...clients];

    if (search) {
      result = result.filter(
        (c) =>
          c.businessName?.toLowerCase().includes(search.toLowerCase()) ||
          c.contactPerson?.toLowerCase().includes(search.toLowerCase()) ||
          (c.email || c.emailId)?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (fromDate)
      result = result.filter(
        (c) => new Date(c.createdAt || new Date()) >= new Date(fromDate),
      );
    if (toDate)
      result = result.filter(
        (c) => new Date(c.createdAt || new Date()) <= new Date(toDate),
      );

    if (sortOrder === "a-z")
      result.sort((a, b) =>
        (a.businessName || "").localeCompare(b.businessName || ""),
      );
    else if (sortOrder === "oldest")
      result.sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      );
    else
      result.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
      );

    return result;
  }, [clients, search, fromDate, toDate, sortOrder]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentRecords = processedData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, fromDate, toDate, sortOrder]);

  /* ═══════════════ DASHBOARD METRICS ═══════════════ */
  const totalClients = clients.length;
  const uniqueCities = new Set(
    clients.map((c) => c.city || c.City).filter(Boolean),
  ).size;
  const newClients = clients.filter((c) => {
    const date = new Date(c.createdAt || new Date());
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return date >= thirtyDaysAgo;
  }).length;

  const activeFiltersCount = [search, fromDate, toDate].filter(Boolean).length;

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
                <Users size={22} />
              </ModuleIcon>
              <HeaderText>
                <PageTitle>Client Master</PageTitle>
                <Breadcrumb>
                  <BreadcrumbLink to="/admin/dashboard">Home</BreadcrumbLink>
                  <BreadSep>/</BreadSep>
                  <BreadcrumbLink to="#">Directory</BreadcrumbLink>
                  <BreadSep>/</BreadSep>
                  <BreadActive>Clients</BreadActive>
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
                New Client
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
                    <Users size={24} />
                  </KpiIconWrap>
                  <KpiBody>
                    <KpiLabel>Total Clients</KpiLabel>
                    <KpiValue>
                      <AnimatedNumber value={totalClients} />
                    </KpiValue>
                    <KpiSub>Active Profiles</KpiSub>
                  </KpiBody>
                  <KpiGlow $color="#3b82f6" />
                </KpiCard>
                <KpiCard $accent="#06b6d4">
                  <KpiIconWrap $color="#06b6d4">
                    <MapPin size={24} />
                  </KpiIconWrap>
                  <KpiBody>
                    <KpiLabel>Regions Covered</KpiLabel>
                    <KpiValue>
                      <AnimatedNumber value={uniqueCities} />
                    </KpiValue>
                    <KpiSub>Unique Cities</KpiSub>
                  </KpiBody>
                  <KpiGlow $color="#06b6d4" />
                </KpiCard>
                <KpiCard $accent="#f59e0b">
                  <KpiIconWrap $color="#f59e0b">
                    <Activity size={24} />
                  </KpiIconWrap>
                  <KpiBody>
                    <KpiLabel>New Clients</KpiLabel>
                    <KpiValue>
                      <AnimatedNumber value={newClients} />
                    </KpiValue>
                    <KpiSub $warning>Added in last 30 days</KpiSub>
                  </KpiBody>
                  <KpiGlow $color="#f59e0b" />
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
                  placeholder="Search by name, contact, email…"
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
                  <option value="a-z">Name (A→Z)</option>
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

              <ResetBtn onClick={resetFilters}>
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
                    <Th>Client Profile</Th>
                    <Th>Contact Details</Th>
                    <Th>Location</Th>
                    <Th>Tax Info</Th>
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
                          icon={<UserCheck size={40} strokeWidth={1.2} />}
                          title="No Clients Found"
                          subtitle="No client records match your search or filters."
                        />
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((c, i) => (
                      <DataRow
                        key={c.id || c.Id}
                        as={motion.tr}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Td>
                          <ProfileCell>
                            <Avatar>
                              {c.businessName ? (
                                c.businessName.charAt(0).toUpperCase()
                              ) : (
                                <Building2 size={16} />
                              )}
                            </Avatar>
                            <div>
                              <div className="fw-bolder">{c.businessName}</div>
                              <span className="sub">
                                <Briefcase size={11} className="icon" />
                                {c.contactPerson}
                              </span>
                            </div>
                          </ProfileCell>
                        </Td>
                        <Td>
                          <DetailsCell>
                            <span>
                              <Phone size={12} className="icon phone" />
                              {c.contactNo ||
                                c.ContactNo ||
                                c.contactNumber ||
                                "N/A"}
                            </span>
                            <span>
                              <Mail size={12} className="icon mail" />
                              {c.email || c.Email || c.emailId || "N/A"}
                            </span>
                          </DetailsCell>
                        </Td>
                        <Td>
                          <DetailsCell>
                            <span style={{ color: "var(--text)" }}>
                              <MapPin size={12} className="icon pin" />
                              {c.city || c.City
                                ? `${c.city || c.City}, ${c.state || c.State}`
                                : "N/A"}
                            </span>
                          </DetailsCell>
                        </Td>
                        <Td>
                          <TaxChip>
                            GST: {c.gstin || c.GSTIN || "Unregistered"}
                          </TaxChip>
                        </Td>
                        <Td center>
                          <ActionsGroup>
                            <ActionBtn
                              $type="edit"
                              title={
                                isFyLocked
                                  ? "Financial year locked"
                                  : "Edit Client"
                              }
                              onClick={() => handleEditClick(c.id || c.Id)}
                              disabled={isFyLocked}
                            >
                              <Edit3 size={14} />
                            </ActionBtn>
                            <ActionBtn
                              $type="delete"
                              title={
                                isFyLocked
                                  ? "Financial year locked"
                                  : "Delete Client"
                              }
                              onClick={() => handleDeleteClick(c.id || c.Id)}
                              disabled={isFyLocked}
                            >
                              <Trash2 size={14} />
                            </ActionBtn>
                          </ActionsGroup>
                        </Td>
                      </DataRow>
                    ))
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
              ADD / EDIT CLIENT MODAL
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
                  style={{ maxWidth: "780px" }}
                  initial={{ scale: 0.94, y: 24, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.94, y: 24, opacity: 0 }}
                  transition={{ type: "spring", damping: 26, stiffness: 320 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ModalHead>
                    <ModalIconWrap $color="#3b82f6">
                      <Building2 size={18} />
                    </ModalIconWrap>
                    <ModalTitle>
                      {form.id > 0
                        ? "Edit Client Profile"
                        : "New Client Profile"}
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
                    <SectionHeading>
                      <Briefcase size={14} className="icon" /> Basic Information
                    </SectionHeading>
                    <FormRow>
                      <FormGroup>
                        <FormLabel>
                          Business Name <Required>*</Required>
                        </FormLabel>
                        <FormInput
                          name="businessName"
                          value={form.businessName}
                          onChange={handleChange}
                          placeholder="e.g. Acme Corporation"
                          autoFocus
                          disabled={submitLoading}
                        />
                      </FormGroup>
                      <FormGroup>
                        <FormLabel>
                          Contact Person <Required>*</Required>
                        </FormLabel>
                        <FormInput
                          name="contactPerson"
                          value={form.contactPerson}
                          onChange={handleChange}
                          placeholder="e.g. John Doe"
                          disabled={submitLoading}
                        />
                      </FormGroup>
                    </FormRow>

                    <FormRow>
                      <FormGroup>
                        <FormLabel>Email Address</FormLabel>
                        <FormInput
                          type="email"
                          name="emailId"
                          value={form.emailId}
                          onChange={handleChange}
                          placeholder="contact@example.com"
                          disabled={submitLoading}
                        />
                      </FormGroup>
                      <FormGroup>
                        <FormLabel>Contact Number</FormLabel>
                        <FormInput
                          type="tel"
                          name="contactNumber"
                          value={form.contactNumber}
                          onChange={handleChange}
                          placeholder="+91 9876543210"
                          disabled={submitLoading}
                        />
                      </FormGroup>
                    </FormRow>

                    <FormRow>
                      <FormGroup>
                        <FormLabel>
                          Staff Master ID (Assigned To) <Required>*</Required>
                        </FormLabel>
                        <FormInput
                          type="number"
                          name="staffMasterId"
                          value={form.staffMasterId}
                          onChange={handleChange}
                          placeholder="Enter Staff ID"
                          disabled={submitLoading}
                        />
                      </FormGroup>
                    </FormRow>

                    <SectionHeading style={{ marginTop: "10px" }}>
                      <MapPin size={14} className="icon" /> Location & Tax
                      Details
                    </SectionHeading>

                    <FormGroup>
                      <FormLabel>Full Address</FormLabel>
                      <FormTextarea
                        name="address"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Complete street address..."
                        disabled={submitLoading}
                        rows={2}
                      />
                    </FormGroup>

                    <FormRow $cols={4}>
                      <FormGroup>
                        <FormLabel>City</FormLabel>
                        <FormInput
                          name="city"
                          value={form.city}
                          onChange={handleChange}
                          placeholder="City"
                          disabled={submitLoading}
                        />
                      </FormGroup>
                      <FormGroup>
                        <FormLabel>State</FormLabel>
                        <FormInput
                          name="state"
                          value={form.state}
                          onChange={handleChange}
                          placeholder="State"
                          disabled={submitLoading}
                        />
                      </FormGroup>
                      <FormGroup>
                        <FormLabel>State Code</FormLabel>
                        <FormInput
                          name="stateCode"
                          value={form.stateCode}
                          onChange={handleChange}
                          placeholder="e.g. 24"
                          disabled={submitLoading}
                        />
                      </FormGroup>
                      <FormGroup>
                        <FormLabel>Country</FormLabel>
                        <FormInput
                          name="country"
                          value={form.country}
                          onChange={handleChange}
                          placeholder="Country"
                          disabled={submitLoading}
                        />
                      </FormGroup>
                    </FormRow>

                    <FormRow>
                      <FormGroup>
                        <FormLabel>GSTIN</FormLabel>
                        <FormInput
                          name="gstin"
                          value={form.gstin}
                          onChange={handleChange}
                          placeholder="22AAAAA0000A1Z5"
                          disabled={submitLoading}
                        />
                      </FormGroup>
                      <FormGroup>
                        <FormLabel>PAN Number</FormLabel>
                        <FormInput
                          name="pan"
                          value={form.pan}
                          onChange={handleChange}
                          placeholder="ABCDE1234F"
                          disabled={submitLoading}
                        />
                      </FormGroup>
                    </FormRow>
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
                          ? "Update Profile"
                          : "Save Profile"}
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
  color: ${(p) => (p.$warning ? "#f59e0b" : "#10b981")};
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

const ProfileCell = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;

  .fw-bolder {
    font-size: 13.5px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 2px;
  }

  .sub {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11.5px;
    color: var(--text-muted);
    font-weight: 500;
    .icon {
      color: var(--primary);
      opacity: 0.8;
    }
  }
`;

const Avatar = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(59, 130, 246, 0.15);
  color: var(--primary);
  border: 1px solid rgba(59, 130, 246, 0.3);
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
    transform: scale(1.08) rotate(5deg);
  }
`;

const DetailsCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-muted);

  span {
    display: flex;
    align-items: center;
    gap: 6px;

    .icon {
      flex-shrink: 0;
      opacity: 0.8;
      &.phone {
        color: #3b82f6;
      }
      &.mail {
        color: #10b981;
      }
      &.pin {
        color: #06b6d4;
      }
    }
  }
`;

const TaxChip = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  border: 1px solid var(--border-custom);
  white-space: nowrap;
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

const SectionHeading = styled.h6`
  font-size: 12px;
  font-weight: 800;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 4px 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-custom);
  display: flex;
  align-items: center;
  gap: 6px;

  .icon {
    opacity: 0.8;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: ${(p) => `repeat(${p.$cols || 2}, 1fr)`};
  gap: 18px;

  @media (max-width: 640px) {
    grid-template-columns: ${(p) => (p.$cols === 4 ? "1fr 1fr" : "1fr")};
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

const FormTextarea = styled.textarea`
  ${inputStyles}
  resize: vertical;
  min-height: 80px;
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
