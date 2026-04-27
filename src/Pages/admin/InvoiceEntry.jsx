import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { getRequest, deleteRequest } from "../../../Services/axiosService";
import html2pdf from "html2pdf.js";

// 🌟 Import global SweetAlert functions
import {
  successAlert,
  errorAlert,
  warningAlert,
  confirmAlert,
} from "./../../../Services/sweetAlert";

// ✅ PREMIUM IMPORTS
import GlobalLoader from "../../components/common/GlobalLoader.jsx";
import PageTransition from "../../components/common/PageTransition.jsx";
import PremiumEmptyState from "../../components/common/PremiumEmptyState.jsx";
import {
  SkeletonTableRows,
  SkeletonCard,
} from "../../components/common/SkeletonLoader.jsx";
import {
  Calendar,
  AlertCircle,
  RefreshCcw,
  Search,
  Filter,
  RotateCcw,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

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

export default function InvoiceEntry() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal & Detail States
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceItems, setInvoiceItems] = useState([]);
  const [clientDetails, setClientDetails] = useState({});
  const [companySettings, setCompanySettings] = useState({});

  // ✅ NEW STATES (FY + LOADER)
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFy, setActiveFy] = useState(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");

  // Pagination (No Change - Kept at 7)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7;

  useEffect(() => {
    fetchInitialData();
  }, []);

  /* ================= FETCH INITIAL DATA (FY + LIST) ================= */
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
    const a = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const b = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const inWords = (n) => {
      if (n < 20) return a[n];
      if (n < 100)
        return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
      if (n < 1000)
        return (
          a[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 !== 0 ? " " + inWords(n % 100) : "")
        );
      if (n < 100000)
        return (
          inWords(Math.floor(n / 1000)) +
          " Thousand" +
          (n % 1000 !== 0 ? " " + inWords(n % 1000) : "")
        );
      if (n < 10000000)
        return (
          inWords(Math.floor(n / 100000)) +
          " Lakh" +
          (n % 100000 !== 0 ? " " + inWords(n % 100000) : "")
        );
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

  return (
    <>
      <GlobalLoader isLoading={initialLoad} />

      <PageTransition>
        <PageWrapper className="p-2 p-md-4">
          {/* 🚀 Header */}
          <HeaderSection className="mb-4 fade-slide-up delay-1 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3">
            <div className="title-area">
              <h2 className="fw-bold m-0 gradient-text">
                Invoice Transactions
              </h2>
              <small className="text-muted-custom d-flex align-items-center gap-2 mt-1">
                <BreadcrumbLink to="/admin/dashboard">
                  <i className="fas fa-home me-1"></i> Home
                </BreadcrumbLink>
                <i
                  className="fas fa-chevron-right"
                  style={{ fontSize: "10px" }}
                ></i>
                <span>Transactions</span>
                <i
                  className="fas fa-chevron-right"
                  style={{ fontSize: "10px" }}
                ></i>
                <span className="text-primary fw-medium">Invoices (Admin)</span>
              </small>
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
                onClick={() =>
                  warningAlert(
                    "Feature Note",
                    "For actual billing, please use the Staff Portal's Create Invoice page.",
                  )
                }
              >
                <i className="fas fa-info-circle me-2"></i> Notice
              </PremiumBtn>
            </div>
          </HeaderSection>

          {activeFy ? (
            <FyBadgeWrapper className="fade-slide-up delay-1">
              <FyBadge>
                <Calendar size={14} /> ACTIVE FINANCIAL YEAR:{" "}
                {activeFy.yearName}
              </FyBadge>
            </FyBadgeWrapper>
          ) : (
            !initialLoad && (
              <FyBadgeWrapper className="fade-slide-up delay-1">
                <FyBadge className="error">
                  <AlertCircle size={14} /> No Active Financial Year Found
                </FyBadge>
              </FyBadgeWrapper>
            )
          )}

          {/* 📊 Premium Summary Cards with RGB Glow */}
          <SummaryGrid className="mb-4 fade-slide-up delay-2">
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
                        Total Invoices
                      </span>
                      <div className="icon-box bg-primary-subtle text-primary">
                        <i className="fas fa-file-invoice summary-icon"></i>
                      </div>
                    </div>
                    <h3 className="fw-bold mt-2 text-custom mb-0">
                      <AnimatedNumber value={totalInvoicesCount} />
                    </h3>
                    <small className="text-muted-custom mt-2 d-block">
                      Bills Generated
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
                        Active Clients
                      </span>
                      <div className="icon-box bg-info-subtle text-info">
                        <i className="fas fa-users summary-icon"></i>
                      </div>
                    </div>
                    <h3 className="fw-bold mt-2 text-custom mb-0">
                      <AnimatedNumber value={activeClientsCount} />
                    </h3>
                    <small className="text-success mt-2 d-block">
                      <i className="fas fa-check-circle me-1"></i> Billed
                      Customers
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
                        Total Revenue
                      </span>
                      <div className="icon-box bg-success-subtle text-success">
                        <i className="fas fa-rupee-sign summary-icon"></i>
                      </div>
                    </div>
                    <h3 className="fw-bold mt-2 text-custom mb-0">
                      <AnimatedNumber value={totalRevenue} isCurrency />
                    </h3>
                    <small className="text-success mt-2 d-block">
                      Overall Sales Value
                    </small>
                  </div>
                </SummaryCard>
              </>
            )}
          </SummaryGrid>

          <GlassCard className="p-3 p-md-4 fade-slide-up delay-3">
            {/* 🔍 Premium Single Row Compact Filter Bar */}
            <CompactFilterBar className="mb-4">
              <div className="filter-item search-item">
                <Search size={14} className="icon" />
                <input
                  type="text"
                  placeholder="Search invoice no or client..."
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
                  <option value="newest">Newest Invoices</option>
                  <option value="oldest">Oldest Invoices</option>
                  <option value="amount-high">Total: High to Low</option>
                  <option value="a-z">Client Name (A-Z)</option>
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

            {/* 📊 Table */}
            <TableWrapper>
              <Table>
                <thead>
                  <tr>
                    <th>Invoice Details</th>
                    <th>Client</th>
                    <th>Amount (Gross + GST)</th>
                    <th>Total Billed</th>
                    <th>Processed By</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonTableRows columns={6} rows={itemsPerPage} />
                  ) : currentRecords.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-5 border-0">
                        <PremiumEmptyState
                          icon={<FileText size={36} strokeWidth={1.5} />}
                          title="No Invoices Found"
                          subtitle="There are no invoices matching your current filters."
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
                          <div className="product-info">
                            <div className="avatar-circle">
                              <i className="fas fa-file-invoice"></i>
                            </div>
                            <div>
                              <div className="fw-bold text-custom">
                                {p.invoiceNo}
                              </div>
                              <small className="text-muted-custom">
                                {p.invoiceDate
                                  ? new Date(p.invoiceDate).toLocaleDateString()
                                  : "-"}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="text-custom fw-medium">
                            {p.clientName || "-"}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex flex-column gap-1">
                            <span
                              className="text-custom"
                              style={{ fontSize: "13px" }}
                            >
                              Gross: ₹{p.grossAmount}
                            </span>
                            <small className="text-muted-custom">
                              GST: ₹{p.gstAmount}
                            </small>
                          </div>
                        </td>
                        <td>
                          <div className="price-tag">
                            ₹{p.total?.toLocaleString() || 0}
                          </div>
                        </td>
                        <td>
                          <span className="badge-custom">
                            {p.staffName || "-"}
                          </span>
                        </td>
                        <td>
                          <ActionButtons>
                            <button
                              className="action-btn primary"
                              style={{ width: "auto", padding: "0 12px" }}
                              onClick={() => viewInvoice(p)}
                              title="View Full Invoice"
                            >
                              <i className="fas fa-eye me-1"></i> View
                            </button>
                            <div className="action-divider"></div>
                            <button
                              className="delete"
                              onClick={() => handleDelete(p.id)}
                              title="Delete Invoice"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </ActionButtons>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </TableWrapper>

            {/* 🔢 Pagination */}
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

          {/* 🎭 SOLID MODAL (Full Detailed Invoice View) */}
          {showViewModal && selectedInvoice && (
            <ModalOverlay onClick={() => setShowViewModal(false)}>
              <ModalContent
                onClick={(e) => e.stopPropagation()}
                className="glowing-modal"
              >
                <ModalHeader className="hide-on-print">
                  <h5 className="fw-bold mb-0 text-custom d-flex align-items-center gap-2">
                    <div className="icon-box-sm bg-primary-subtle text-primary">
                      <i className="fas fa-receipt"></i>
                    </div>
                    Invoice Summary: {selectedInvoice.invoiceNo}
                  </h5>
                  <button
                    className="close-btn"
                    onClick={() => setShowViewModal(false)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </ModalHeader>

                {/* 📜 INVOICE PRINT AREA */}
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

                <ModalFooter
                  className="hide-on-print"
                  style={{ justifyContent: "space-between" }}
                >
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button className="action-btn info" onClick={handlePrint}>
                      <i className="fas fa-print me-2"></i> Print
                    </button>
                    <button
                      className="action-btn success"
                      onClick={handleDownloadPDF}
                    >
                      <i className="fas fa-file-pdf me-2"></i> PDF
                    </button>
                    <button
                      className="action-btn warning"
                      onClick={exportToExcel}
                    >
                      <i className="fas fa-file-excel me-2"></i> Excel
                    </button>
                  </div>
                  <button
                    className="action-btn danger"
                    onClick={() => setShowViewModal(false)}
                  >
                    <i className="fas fa-times me-2"></i> Close
                  </button>
                </ModalFooter>
              </ModalContent>
            </ModalOverlay>
          )}
        </PageWrapper>
      </PageTransition>
      <style>{`
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}

/* ================= INLINE STYLES FOR INVOICE PREVIEW ================= */
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

/* ================= STYLED COMPONENTS (Unified Original Theme + Premium RGB Glow) ================= */

const animFadeIn = keyframes`from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }`;
const fadeIn = keyframes`from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(8px); }`;
const slideUpScale = keyframes`from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); }`;

/* 🌟 PREMIUM RGB GLOW ANIMATION FOR CARDS */
const rgbGlow = keyframes`
  0%   { box-shadow: 0 0 10px 0px rgba(255, 0, 0, 0.3); border-color: rgba(255, 0, 0, 0.4); }
  25%  { box-shadow: 0 0 10px 0px rgba(0, 255, 0, 0.3); border-color: rgba(0, 255, 0, 0.4); }
  50%  { box-shadow: 0 0 10px 0px rgba(0, 0, 255, 0.3); border-color: rgba(0, 0, 255, 0.4); }
  75%  { box-shadow: 0 0 10px 0px rgba(255, 0, 255, 0.3); border-color: rgba(255, 0, 255, 0.4); }
  100% { box-shadow: 0 0 10px 0px rgba(255, 0, 0, 0.3); border-color: rgba(255, 0, 0, 0.4); }
`;

const PageWrapper = styled.div`
  min-height: 100vh;
  color: var(--text);
  font-family: "Inter", sans-serif;
  max-width: 1600px;
  margin: 0 auto;
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
  flex-wrap: wrap;
  gap: 16px;
  /* 🌟 ORIGINAL TITLE GRADIENT */
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

/* 🌟 DYNAMIC SUMMARY CARDS WITH RGB GLOW HOVER */
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
  transition: all 0.4s ease-in-out;
  box-shadow: 0 4px 6px rgba(13, 51, 236, 0.81);
  z-index: 1;
  .inner-content {
    padding: 20px;
    background: var(--card);
    border-radius: 15px;
  }
  /* 🔥 RGB GLOW ON HOVER */
  &:hover {
    transform: translateY(-5px);
    animation: ${rgbGlow} 3s infinite linear;
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
  padding: 1.5rem;
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
  /* 🌟 LIST HOVER ANIMATION */
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
  .badge-custom {
    background: rgba(37, 99, 235, 0.1);
    color: var(--primary);
    padding: 4px 12px;
    border-radius: 8px;
    font-size: 0.85rem;
    font-weight: 500;
  }
  .fade-in {
    animation: ${animFadeIn} 0.5s ease forwards;
    opacity: 0;
  }
  .price-tag {
    font-weight: 700;
    color: var(--success);
    font-size: 1rem;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  button {
    height: 35px;
    border-radius: 8px;
    cursor: pointer;
    transition: 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    &.delete {
      width: 35px;
      border: none;
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
    &:hover {
      transform: translateY(-2px);
      filter: brightness(1.1);
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
    }
    &.delete:hover {
      box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
    }
  }
  .action-btn.primary {
    border: none;
    background: var(--primary);
    color: white;
  }
  .action-btn.primary:hover {
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
  .action-divider {
    width: 1px;
    background: var(--border-custom);
    margin: 0 4px;
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

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
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
  max-width: 950px;
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
  .action-btn.danger:hover {
    box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
    transform: translateY(-2px);
  }
  .action-btn.success {
    background: var(--success);
    color: white;
  }
  .action-btn.success:hover {
    box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
    transform: translateY(-2px);
  }
  .action-btn.info {
    background: var(--info);
    color: white;
  }
  .action-btn.info:hover {
    box-shadow: 0 4px 12px rgba(14, 165, 233, 0.4);
    transform: translateY(-2px);
  }
  .action-btn.warning {
    background: var(--warning);
    color: white;
  }
  .action-btn.warning:hover {
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
    transform: translateY(-2px);
  }
`;
