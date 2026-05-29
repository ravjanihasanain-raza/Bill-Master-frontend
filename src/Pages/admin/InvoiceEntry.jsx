import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import html2pdf from "html2pdf.js";

import {
  FileText,
  RefreshCcw,
  AlertCircle,
  Calendar,
  Building2,
  Search,
  Filter,
  RotateCcw,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Users,
  Eye,
  Info,
  Printer,
  FileDown,
  FileSpreadsheet,
  Shield,
  Receipt
} from "lucide-react";

import { getRequest, deleteRequest } from "../../../Services/axiosService";
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
  SkeletonTableRows,
  SkeletonCard,
} from "../../components/common/SkeletonLoader.jsx";

/* ─────────────────────────────────────────────
   ANIMATED NUMBER COMPONENT
───────────────────────────────────────────── */
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

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════ */
export default function InvoiceEntry() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal & Detail States
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [clientDetails, setClientDetails] = useState({});
  const [companySettings, setCompanySettings] = useState({});

  // Premium UI States
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFy, setActiveFy] = useState(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  // Pagination Fixed at 7
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    fetchInitialData();
  }, []);

  /* ================= FETCH INITIAL DATA ================= */
  const fetchInitialData = async () => {
    setInitialLoad(true);
    try {
      const fyRes = await getRequest("FinancialYear/List");
      if (fyRes && fyRes.status === "OK" && fyRes.result) {
        const currentActiveFy = fyRes.result.find(
          (y) => y.isActive && !y.isDelete,
        );
        setActiveFy(currentActiveFy || null);
      }
      await fetchInvoices(false, true);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setInitialLoad(false), 700);
    }
  };

  /* ================= FETCH DATA ================= */
  const fetchInvoices = async (isRefresh = false, isInit = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else if (!isInit) setLoading(true);

      const res = await getRequest("InvoiceMaster/ListInvoice");
      if (res && res.status === "OK") {
        setInvoices(res.result || []);
      }
    } catch {
      errorAlert("Error", "Failed to fetch invoices");
    } finally {
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 600);
      else if (!isInit) setTimeout(() => setLoading(false), 500);
    }
  };

  const handleRefresh = () => {
    fetchInvoices(true);
  };

  const resetFilters = () => {
    setSearch("");
    setSortOrder("newest");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const isFyLocked = activeFy && activeFy.isClosed;

  /* ================= VIEW INVOICE (Detailed Fetch) ================= */
  const viewInvoice = async (invoiceObj) => {
    try {
      const res = await getRequest(
        `InvoiceMaster/DetailInvoice/${invoiceObj.id}`,
      );

      if (res && res.status === "OK") {
        const invData = res.result;
        setSelectedInvoice(invData);
        setInvoiceItems(invData.invoiceItems || []);

        if (invData.clientMasterId) {
          const clientRes = await getRequest(
            `ClientMaster/Detail/${invData.clientMasterId}`,
          ).catch(() => null);
          setClientDetails(clientRes?.result || invData.client || {});
        } else {
          setClientDetails(invData.client || {});
        }

        const compRes = await getRequest("SoftwareSettings/Get").catch(
          () => null,
        );
        setCompanySettings(compRes?.result || {});

        setShowViewModal(true);
      } else {
        errorAlert("Failed", "Could not fetch complete invoice details.");
      }
    } catch (err) {
      errorAlert("API Error", "Server error while fetching details.");
    }
  };

  /* ================= DELETE ================= */
  const handleDelete = async (id) => {
    if (isFyLocked || !activeFy) {
      return warningAlert(
        "Financial Year Locked",
        "Cannot modify invoices in closed or missing financial year.",
      );
    }

    const confirm = await confirmAlert(
      "Are you sure?",
      "This invoice will be permanently deleted.",
    );
    if (!confirm.isConfirmed) return;

    try {
      const res = await deleteRequest(`InvoiceMaster/DeleteInvoice/${id}`);
      if (res.status === "OK") {
        successAlert("Deleted", "Invoice deleted successfully");
        fetchInvoices();
      } else {
        errorAlert("Failed", res.message || "Could not delete");
      }
    } catch {
      errorAlert("Error", "Delete operation failed");
    }
  };

  /* ================= 🖨️ PRINT FUNCTION ================= */
  const handlePrint = () => {
    const printContent = document.getElementById(
      "invoice-download-section",
    ).innerHTML;
    const printWindow = window.open("", "_blank", "width=900,height=700");

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${selectedInvoice?.invoiceNo || "Print"}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
            @page { size: A4 portrait; margin: 0; }
            body { 
              font-family: 'Inter', sans-serif; 
              padding: 15mm; 
              color: #000; 
              background: #fff;
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important;
            }
            .hide-on-print { display: none !important; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; }
            th { background-color: #f1f5f9 !important; font-weight: bold; color: #1e293b; }
            h2, h3, p { margin: 0; }
            div, table, tr { page-break-inside: avoid; }
            html, body { height: 100%; width: 100%; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  /* ================= 📄 PDF DOWNLOAD ================= */
  const handleDownloadPDF = () => {
    const element = document.getElementById("invoice-download-section");
    const opt = {
      margin: 0.3,
      filename: `Invoice_${selectedInvoice?.invoiceNo}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };
    html2pdf().set(opt).from(element).save();
  };

  /* ================= 📊 EXPORT EXCEL ================= */
  const exportToExcel = () => {
    let csv = "Sr,Product,HSN,Qty,Unit,Rate,Taxable,GST%,GST Amt,Total\n";

    invoiceItems.forEach((i, index) => {
      const name = i.name || "Item";
      const hsn = i.hsn || "-";
      const qty = i.qty || 0;
      const unit = i.unit || "NOS";
      const rate = i.price || i.rate || 0;
      const taxable = i.taxable || qty * rate;
      const gstPct = i.gst || 0;
      const gstAmt = i.gstAmount || 0;
      const total = i.total || 0;
      csv += `${index + 1},${name},${hsn},${qty},${unit},${rate},${taxable},${gstPct},${gstAmt},${total}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice_${selectedInvoice?.invoiceNo || "Export"}.csv`;
    a.click();
  };

  const numberToWords = (num) => {
    if (!num) return "Zero Rupees Only";
    const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
    const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
    const inWords = (n) => {
      if (n < 20) return a[n];
      if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
      if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + inWords(n % 100) : "");
      if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
      if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
      return n;
    };
    return inWords(Math.floor(num)) + " Rupees Only";
  };

  /* ================= FILTER, SORT & PAGINATION ================= */
  const processedData = useMemo(() => {
    let result = [...invoices];
    if (search) {
      result = result.filter(
        (p) =>
          (p.invoiceNo &&
            p.invoiceNo.toLowerCase().includes(search.toLowerCase())) ||
          (p.clientName &&
            p.clientName.toLowerCase().includes(search.toLowerCase())),
      );
    }
    if (fromDate)
      result = result.filter(
        (p) => new Date(p.invoiceDate) >= new Date(fromDate),
      );
    if (toDate)
      result = result.filter(
        (p) => new Date(p.invoiceDate) <= new Date(toDate),
      );

    switch (sortOrder) {
      case "a-z":
        result.sort((a, b) =>
          (a.clientName || "").localeCompare(b.clientName || ""),
        );
        break;
      case "amount-high":
        result.sort((a, b) => b.total - a.total);
        break;
      case "oldest":
        result.sort(
          (a, b) => new Date(a.invoiceDate) - new Date(b.invoiceDate),
        );
        break;
      case "newest":
      default:
        result.sort(
          (a, b) => new Date(b.invoiceDate) - new Date(a.invoiceDate),
        );
        break;
    }
    return result;
  }, [invoices, search, fromDate, toDate, sortOrder]);

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

  /* ===== DYNAMIC STATS FOR SUMMARY CARDS ===== */
  const totalInvoicesCount = invoices.length;
  const activeClientsCount = new Set(
    invoices.map((p) => p.clientName).filter(Boolean),
  ).size;
  const totalRevenue = invoices.reduce(
    (acc, curr) => acc + (Number(curr.total) || 0),
    0,
  );

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
                <FileText size={22} />
              </ModuleIcon>
              <HeaderText>
                <PageTitle>Invoice Transactions</PageTitle>
                <Breadcrumb>
                  <BreadcrumbLink to="/admin/dashboard">Home</BreadcrumbLink>
                  <BreadSep>/</BreadSep>
                  <BreadcrumbLink to="#">Transactions</BreadcrumbLink>
                  <BreadSep>/</BreadSep>
                  <BreadActive>Invoices (Admin)</BreadActive>
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
                onClick={() =>
                  warningAlert(
                    "Feature Note",
                    "For actual billing, please use the Staff Portal's Create Invoice page.",
                  )
                }
              >
                <Info size={15} />
                Notice
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
            {initialLoad || loading ? (
              [0, 1, 2].map((i) => <KpiSkeleton key={i} />)
            ) : (
              <>
                <KpiCard $accent="#3b82f6">
                  <KpiIconWrap $color="#3b82f6">
                    <Receipt size={24} />
                  </KpiIconWrap>
                  <KpiBody>
                    <KpiLabel>Total Invoices</KpiLabel>
                    <KpiValue>
                      <AnimatedNumber value={totalInvoicesCount} />
                    </KpiValue>
                    <KpiSub>Bills Generated</KpiSub>
                  </KpiBody>
                  <KpiGlow $color="#3b82f6" />
                </KpiCard>
                <KpiCard $accent="#0ea5e9">
                  <KpiIconWrap $color="#0ea5e9">
                    <Users size={24} />
                  </KpiIconWrap>
                  <KpiBody>
                    <KpiLabel>Active Clients</KpiLabel>
                    <KpiValue>
                      <AnimatedNumber value={activeClientsCount} />
                    </KpiValue>
                    <KpiSub style={{ color: "#0ea5e9" }}>Billed Customers</KpiSub>
                  </KpiBody>
                  <KpiGlow $color="#0ea5e9" />
                </KpiCard>
                <KpiCard $accent="#10b981">
                  <KpiIconWrap $color="#10b981">
                    <IndianRupee size={24} />
                  </KpiIconWrap>
                  <KpiBody>
                    <KpiLabel>Total Revenue</KpiLabel>
                    <KpiValue>
                      <AnimatedNumber value={totalRevenue} isCurrency />
                    </KpiValue>
                    <KpiSub style={{ color: "#10b981" }}>Overall Sales Value</KpiSub>
                  </KpiBody>
                  <KpiGlow $color="#10b981" />
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
                  placeholder="Search invoice no or client..."
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
                  <option value="newest">Newest Invoices</option>
                  <option value="oldest">Oldest Invoices</option>
                  <option value="amount-high">Total: High to Low</option>
                  <option value="a-z">Client Name (A-Z)</option>
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
                    <Th>Invoice Details</Th>
                    <Th>Client</Th>
                    <Th>Amount (Gross + GST)</Th>
                    <Th>Total Billed</Th>
                    <Th>Processed By</Th>
                    <Th center>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {loading || initialLoad || isRefreshing ? (
                    <SkeletonTableRows rows={itemsPerPage} columns={6} />
                  ) : currentRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        style={{ padding: "4rem 0", borderBottom: "none" }}
                      >
                        <PremiumEmptyState
                          icon={<FileText size={40} strokeWidth={1.2} />}
                          title="No Invoices Found"
                          subtitle="No invoice records match your search or filters."
                        />
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((p, i) => (
                      <DataRow
                        key={p.id}
                        as={motion.tr}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                      >
                        <Td>
                          <ProfileCell>
                            <Avatar>
                              <FileText size={16} />
                            </Avatar>
                            <div>
                              <div className="fw-bolder">{p.invoiceNo}</div>
                              <span className="sub">
                                <Calendar size={11} className="icon" />
                                {p.invoiceDate
                                  ? new Date(p.invoiceDate).toLocaleDateString()
                                  : "-"}
                              </span>
                            </div>
                          </ProfileCell>
                        </Td>
                        <Td>
                          <span style={{ fontWeight: "600", color: "var(--text)" }}>
                            {p.clientName || "-"}
                          </span>
                        </Td>
                        <Td>
                          <DetailsCell>
                            <span style={{ color: "var(--text)", fontWeight: "600" }}>
                              Gross: ₹{p.grossAmount}
                            </span>
                            <span style={{ fontSize: "11.5px" }}>
                              GST: ₹{p.gstAmount}
                            </span>
                          </DetailsCell>
                        </Td>
                        <Td>
                          <span style={{ fontWeight: "800", color: "var(--primary)", fontSize: "14px" }}>
                            ₹{p.total?.toLocaleString() || 0}
                          </span>
                        </Td>
                        <Td>
                          <StaffBadge>{p.staffName || "-"}</StaffBadge>
                        </Td>
                        <Td center>
                          <ActionsGroup>
                            <ActionBtn
                              $type="view"
                              title="View Full Invoice"
                              onClick={() => viewInvoice(p)}
                            >
                              <Eye size={14} />
                            </ActionBtn>
                            <ActionBtn
                              $type="delete"
                              title={isFyLocked ? "Financial year locked" : "Delete Invoice"}
                              onClick={() => handleDelete(p.id)}
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
            {!loading && !initialLoad && processedData.length > itemsPerPage && (
              <PaginationRow>
                <PaginationInfo>
                  Showing{" "}
                  <strong>
                    {indexOfFirst + 1}–{Math.min(indexOfLast, processedData.length)}
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
              VIEW INVOICE MODAL
          ════════════════════════════════════════════════ */}
          <AnimatePresence>
            {showViewModal && selectedInvoice && (
              <Overlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowViewModal(false)}
              >
                <ModalBox
                  style={{ maxWidth: "900px" }}
                  initial={{ scale: 0.94, y: 24, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.94, y: 24, opacity: 0 }}
                  transition={{ type: "spring", damping: 26, stiffness: 320 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ModalHead>
                    <ModalIconWrap $color="#3b82f6">
                      <Receipt size={18} />
                    </ModalIconWrap>
                    <ModalTitle>
                      Invoice Summary: {selectedInvoice.invoiceNo}
                    </ModalTitle>
                    <CloseBtn onClick={() => setShowViewModal(false)}>
                      <X size={18} />
                    </CloseBtn>
                  </ModalHead>

                  {/* Document Content - Preserves original inline styles for accurate HTML2PDF Generation */}
                  <div
                    className="modal-body p-4 custom-scrollbar print-area"
                    style={{
                      maxHeight: "70vh",
                      overflowY: "auto",
                      background: "#f1f5f9",
                    }}
                  >
                    <div id="invoice-download-section" style={containerStyle}>
                      {/* HEADER */}
                      <div style={headerStyle}>
                        {companySettings.logoURL ? (
                          <img
                            src={companySettings.logoURL}
                            alt="Logo"
                            style={{ width: 70 }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 70,
                              height: 70,
                              background: "#e2e8f0",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            Logo
                          </div>
                        )}
                        <div style={{ textAlign: "center", flex: 1 }}>
                          <h2
                            style={{
                              margin: "0 0 5px 0",
                              fontSize: "22px",
                              fontWeight: "bold",
                            }}
                          >
                            {companySettings.businessName || "Company Name"}
                          </h2>
                          <p style={{ margin: "2px 0", fontSize: "13px" }}>
                            {companySettings.addressLine1 || "Company Address"}
                          </p>
                          <p style={{ margin: "2px 0", fontSize: "13px" }}>
                            {companySettings.contactNo || "Contact"} |{" "}
                            {companySettings.email || "Email"}
                          </p>
                          <p style={{ margin: "2px 0", fontSize: "13px" }}>
                            GSTIN: {companySettings.gstin || "-"} | PAN:{" "}
                            {companySettings.pan || "-"}
                          </p>
                        </div>
                      </div>

                      {/* TITLE */}
                      <div style={titleStyle}>
                        TAX INVOICE
                        <span
                          style={{
                            float: "right",
                            fontSize: "12px",
                            fontWeight: "normal",
                            marginTop: "2px",
                          }}
                        >
                          Original for Recipient
                        </span>
                      </div>

                      {/* INFO */}
                      <div style={rowStyle}>
                        <div style={boxStyle}>
                          <p style={{ margin: "4px 0" }}>
                            <b>Invoice No:</b> {selectedInvoice.invoiceNo}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <b>Date:</b>{" "}
                            {selectedInvoice.invoiceDate
                              ? new Date(
                                  selectedInvoice.invoiceDate,
                                ).toLocaleDateString()
                              : "-"}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <b>State:</b> {clientDetails.state || "-"}
                          </p>
                        </div>
                        <div style={boxStyle}>
                          <p style={{ margin: "4px 0" }}>
                            <b>Place of Supply:</b> {clientDetails.state || "-"}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <b>Payment Terms:</b> Immediate
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <b>PO Number:</b> {selectedInvoice.poNumber || "-"}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <b>PO Date:</b> {selectedInvoice.poDate || "-"}
                          </p>
                        </div>
                      </div>

                      {/* CLIENT */}
                      <div style={rowStyle}>
                        <div style={boxStyle}>
                          <b
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              borderBottom: "1px solid #cbd5e1",
                              paddingBottom: "4px",
                            }}
                          >
                            Receiver (Billed to)
                          </b>
                          <p style={{ margin: "4px 0" }}>
                            <b>Name:</b>{" "}
                            {clientDetails.businessName ||
                              selectedInvoice.clientName}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <b>Address:</b> {clientDetails.address || "-"}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <b>Mobile:</b> {clientDetails.contactNo || "-"}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <b>Email:</b> {clientDetails.email || "-"}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <b>GSTIN:</b> {clientDetails.gstin || "-"}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <b>State Code:</b> {clientDetails.stateCode || "-"}
                          </p>
                        </div>
                        <div style={boxStyle}>
                          <b
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              borderBottom: "1px solid #cbd5e1",
                              paddingBottom: "4px",
                            }}
                          >
                            Consignee (Shipped to)
                          </b>
                          <p style={{ margin: "4px 0" }}>
                            <b>Name:</b>{" "}
                            {clientDetails.businessName ||
                              selectedInvoice.clientName}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <b>Address:</b> {clientDetails.address || "-"}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <b>GSTIN:</b> {clientDetails.gstin || "-"}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <b>State:</b> {clientDetails.state || "-"}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <b>State Code:</b> {clientDetails.stateCode || "-"}
                          </p>
                        </div>
                      </div>

                      {/* ITEMS TABLE */}
                      <table style={tableStyle}>
                        <thead>
                          <tr style={{ background: "#f1f5f9" }}>
                            <th style={thStyle}>Sr</th>
                            <th style={thStyle}>Product</th>
                            <th style={thStyle}>HSN</th>
                            <th style={thStyle}>Qty</th>
                            <th style={thStyle}>Unit</th>
                            <th style={thStyle}>Rate</th>
                            <th style={thStyle}>Taxable</th>
                            <th style={thStyle}>GST%</th>
                            <th style={thStyle}>GST Amt</th>
                            <th style={thStyle}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoiceItems.length > 0 ? (
                            invoiceItems.map((i, index) => (
                              <tr key={index}>
                                <td style={tdStyle}>{index + 1}</td>
                                <td style={{ ...tdStyle, fontWeight: "600" }}>
                                  {i.name}
                                </td>
                                <td style={tdStyle}>{i.hsn || "-"}</td>
                                <td style={tdStyle}>{i.qty}</td>
                                <td style={tdStyle}>{i.unit || "NOS"}</td>
                                <td style={tdStyle}>₹{i.price || i.rate}</td>
                                <td style={tdStyle}>₹{i.taxable}</td>
                                <td style={tdStyle}>{i.gst}%</td>
                                <td style={tdStyle}>₹{i.gstAmount}</td>
                                <td style={{ ...tdStyle, fontWeight: "600" }}>
                                  ₹{i.total}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="10"
                                style={{
                                  ...tdStyle,
                                  textAlign: "center",
                                  padding: "20px",
                                }}
                              >
                                No items found for this invoice.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>

                      {/* TOTAL */}
                      <div
                        style={{
                          textAlign: "right",
                          marginTop: 15,
                          padding: "10px",
                          background: "#f8fafc",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        <p style={{ margin: "4px 0" }}>
                          Total Qty:{" "}
                          {invoiceItems.reduce((a, i) => a + (i.qty || 0), 0)}
                        </p>
                        <p style={{ margin: "4px 0" }}>
                          Total Taxable: ₹{selectedInvoice.grossAmount}
                        </p>
                        <p style={{ margin: "4px 0" }}>
                          Total GST: ₹{selectedInvoice.gstAmount}
                        </p>
                        <h3
                          style={{
                            color: "#16a34a",
                            margin: "10px 0 0 0",
                            fontWeight: "bold",
                          }}
                        >
                          Grand Total: ₹{selectedInvoice.total}
                        </h3>
                      </div>

                      <p style={{ margin: "15px 0 5px 0", fontSize: "13px" }}>
                        <b>Amount in Words:</b>{" "}
                        {numberToWords(selectedInvoice.total)}
                      </p>

                      {/* BANK + TERMS */}
                      <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
                        <div style={boxStyle}>
                          <b
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              borderBottom: "1px solid #cbd5e1",
                              paddingBottom: "4px",
                            }}
                          >
                            Bank Details
                          </b>
                          <p style={{ margin: "4px 0" }}>
                            <b>Account Name:</b>{" "}
                            {companySettings.accountHolderName || "-"}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <b>Account No:</b>{" "}
                            {companySettings.accountNumber || "-"}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <b>Bank Name:</b> {companySettings.bankName || "-"}
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            <b>IFSC:</b> {companySettings.bankIFSC || "-"}
                          </p>
                        </div>
                        <div style={boxStyle}>
                          <b
                            style={{
                              display: "block",
                              marginBottom: "8px",
                              borderBottom: "1px solid #cbd5e1",
                              paddingBottom: "4px",
                            }}
                          >
                            Terms & Conditions
                          </b>
                          <p style={{ margin: "4px 0" }}>
                            1. Computer generated invoice
                          </p>
                          <p style={{ margin: "4px 0" }}>
                            2. Subject to jurisdiction
                          </p>
                        </div>
                      </div>

                      {/* FOOTER */}
                      <p
                        style={{
                          textAlign: "center",
                          marginTop: 25,
                          fontWeight: "600",
                          fontSize: "14px",
                          color: "#64748b",
                        }}
                      >
                        Thank you for your business
                      </p>
                    </div>
                  </div>

                  <ModalFoot>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <ModalBtn $variant="info" onClick={handlePrint}>
                        <Printer size={14} /> Print
                      </ModalBtn>
                      <ModalBtn $variant="success" onClick={handleDownloadPDF}>
                        <FileDown size={14} /> PDF
                      </ModalBtn>
                      <ModalBtn $variant="warning" onClick={exportToExcel}>
                        <FileSpreadsheet size={14} /> Excel
                      </ModalBtn>
                    </div>
                    <ModalBtn
                      $variant="cancel"
                      onClick={() => setShowViewModal(false)}
                    >
                      <X size={14} /> Close
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
            
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: #cbd5e1;
              border-radius: 10px;
            }
          `}</style>
        </PageShell>
      </PageTransition>
    </>
  );
}

/* ================= INLINE STYLES FOR INVOICE PREVIEW (PRESERVED) ================= */
const containerStyle = {
  background: "#ffffff",
  color: "#000000",
  padding: "30px",
  borderRadius: "10px",
  margin: "auto",
  border: "1px solid #cbd5e1",
  fontSize: "13px",
};
const headerStyle = {
  display: "flex",
  alignItems: "center",
  borderBottom: "2px solid #3b82f6",
  paddingBottom: "15px",
};
const titleStyle = {
  background: "linear-gradient(to right, #3b82f6, #2563eb)",
  color: "#fff",
  textAlign: "center",
  padding: "10px 15px",
  marginTop: "15px",
  fontWeight: "bold",
  borderRadius: "6px",
  fontSize: "16px",
};
const rowStyle = { display: "flex", gap: "15px", marginTop: "15px" };
const boxStyle = {
  flex: 1,
  border: "1px solid #cbd5e1",
  padding: "12px",
  borderRadius: "8px",
  background: "#f8fafc",
};
const tableStyle = {
  width: "100%",
  marginTop: "15px",
  borderCollapse: "collapse",
  fontSize: "12px",
};
const thStyle = {
  border: "1px solid #cbd5e1",
  padding: "8px",
  fontSize: "13px",
  fontWeight: "bold",
  color: "#1e293b",
  textAlign: "left",
};
const tdStyle = {
  border: "1px solid #cbd5e1",
  padding: "8px",
  color: "#334155",
};

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
  color: var(--text-muted);
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
  }
`;

const StaffBadge = styled.span`
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
    p.$type === "view" &&
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

const ModalFoot = styled.div`
  padding: 18px 26px;
  display: flex;
  align-items: center;
  justify-content: space-between;
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
    p.$variant === "success" &&
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
    p.$variant === "warning" &&
    css`
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
      &:hover:not(:disabled) {
        filter: brightness(1.08);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
      }
    `}
  ${(p) =>
    p.$variant === "info" &&
    css`
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.3);
      &:hover:not(:disabled) {
        filter: brightness(1.08);
        transform: translateY(-1px);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
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