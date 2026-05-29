/**
 * InvoicePreview.jsx — Enterprise-Grade A4 Invoice Engine
 * Premium styling, responsive scaling, precise A4 PDF export, and print optimization.
 */

import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";
import styled, { css } from "styled-components";
import {
  Download,
  Printer,
  FileSpreadsheet,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileText,
} from "lucide-react";
import { getRequest } from "../../../../Services/axiosService.jsx";

export default function InvoicePreview() {
  const location = useLocation();
  const id = location?.state?.id;

  const [company, setCompany] = useState({});
  const [client, setClient] = useState({});
  const [invoice, setInvoice] = useState(location.state?.invoice || null);
  const [items, setItems] = useState([]);
  const [scale, setScale] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Responsive Scaling Logic
  useEffect(() => {
    const calculateScale = () => {
      if (isExporting) {
        setScale(1); // Force 100% scale during PDF export for maximum crispness
        return;
      }
      const width = window.innerWidth;
      // 850px accounts for the 210mm (~794px) A4 width + container padding
      if (width < 850) {
        setScale((width - 40) / 794);
      } else {
        setScale(1);
      }
    };

    calculateScale();
    window.addEventListener("resize", calculateScale);
    return () => window.removeEventListener("resize", calculateScale);
  }, [isExporting]);

  useEffect(() => {
    if (!invoice && location.state?.id) {
      loadInvoice(location.state.id);
    }
  }, []);

  const loadInvoice = async () => {
    try {
      const res = await getRequest(`InvoiceMaster/DetailInvoice/${id}`);
      if (res.status === "OK") {
        const data = res.result;
        setInvoice(data);
        setClient(data.client || {});
        setItems(data.invoiceItems || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (invoice) {
      loadClient();
      loadCompany();
    }
  }, [invoice]);

  const loadCompany = async () => {
    try {
      const res = await getRequest("SoftwareSettings/Get");
      setCompany(res?.result || {});
      setLogoError(false);
    } catch (err) {
      console.error(err);
    }
  };

  const loadClient = async () => {
    try {
      const res = await getRequest(
        "ClientMaster/Detail/" + invoice.clientMasterId,
      );
      setClient(res?.result || {});
    } catch (err) {
      console.error(err);
    }
  };

  const downloadPDF = async () => {
    setIsExporting(true);

    // Wait for React to render at 100% scale before capturing
    await new Promise((resolve) => setTimeout(resolve, 300));

    const element = document.getElementById("invoice-print-area");
    const opt = {
      margin: 0,
      filename: `Enterprise_Invoice_${invoice.invoiceNo}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 4, // Ultra-high resolution for enterprise clarity
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
    };

    await html2pdf().set(opt).from(element).save();
    setIsExporting(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const exportToExcel = () => {
    let csv = "Sr,Product,HSN,Qty,Unit,Rate,Taxable,GST%,GST Amt,Total\n";
    items.forEach((i, index) => {
      csv += `${index + 1},"${i.name}",${i.hsn || ""},${i.qty},${i.unit || "NOS"},${i.price},${i.taxable},${i.gst},${i.gstAmount},${i.total}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice_${invoice.invoiceNo}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
      return (
        inWords(Math.floor(n / 10000000)) +
        " Crore" +
        (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "")
      );
    };

    return inWords(Math.floor(num)) + " Rupees Only";
  };

  if (!invoice) {
    return (
      <LoaderWrapper>
        <div className="spinner"></div>
        <p>Loading Invoice Engine...</p>
      </LoaderWrapper>
    );
  }

  return (
    <PageWrapper>
      {/* ─── STICKY TOOLBAR ─── */}
      <Toolbar className="hide-on-print">
        <div className="toolbar-title">
          <FileText size={18} />
          <span>Invoice Preview</span>
          <span className="badge">{invoice.invoiceNo}</span>
        </div>
        <div className="toolbar-actions">
          <ToolBtn onClick={exportToExcel} $variant="ghost">
            <FileSpreadsheet size={16} /> Excel
          </ToolBtn>
          {/* <ToolBtn onClick={handlePrint} $variant="secondary">
            <Printer size={16} /> Print
          </ToolBtn> */}
          <ToolBtn onClick={downloadPDF} $variant="primary">
            <Download size={16} /> Download PDF
          </ToolBtn>
        </div>
      </Toolbar>

      {/* ─── INVOICE SCALING WRAPPER ─── */}
      <PreviewWorkspace className="preview-workspace">
        <ScaleContainer style={{ transform: `scale(${scale})` }}>
          {/* ─── ACTUAL A4 INVOICE ─── */}
          <A4Canvas id="invoice-print-area">
            {/* HEADER */}
            <HeaderSection>
              <div className="company-details">
                {/* ── LOGO: supports relative paths, full URLs, and fallback icon ── */}
                {(() => {
                  const rawLogo =
                    company.logo || company.logoURL || company.logoUrl || "";
                  const finalLogo = rawLogo
                    ? rawLogo.startsWith("/") || rawLogo.startsWith("\\")
                      ? (import.meta.env.VITE_API_URL || "").replace(
                          /\/$/,
                          "",
                        ) + rawLogo
                      : rawLogo
                    : "";

                  return finalLogo && !logoError ? (
                    <img
                      src={finalLogo}
                      alt={company.businessName || "Logo"}
                      crossOrigin="anonymous"
                      onError={() => setLogoError(true)}
                      style={{
                        width: "44px",
                        height: "44px",
                        objectFit: "contain",
                        borderRadius: "6px",
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div className="logo-placeholder">
                      <Building2 size={24} />
                    </div>
                  );
                })()}
                <div>
                  <h1>{company.businessName || "Company Name"}</h1>
                  <p>
                    <MapPin size={10} />{" "}
                    {company.addressLine1 || "Company Address Line 1"}
                  </p>
                  <p>
                    <Phone size={10} /> {company.contactNo || "Contact Number"}
                  </p>
                  <p>GSTIN: {company.GstIN || company.gstIN || "N/A"}</p>
                  {company.email && (
                    <p>
                      <Mail size={10} /> {company.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="invoice-title-box">
                <h2>INVOICE</h2>
                <div className="meta-grid">
                  <span className="lbl">Invoice No:</span>
                  <span className="val">{invoice.invoiceNo}</span>
                  <span className="lbl">Date:</span>
                  <span className="val">{invoice.invoiceDate}</span>
                  <span className="lbl">Terms:</span>
                  <span className="val">Immediate</span>
                  <span className="lbl">Due Date:</span>
                  <span className="val fw-bold">{invoice.invoiceDate}</span>
                </div>
              </div>
            </HeaderSection>

            {/* INFO SPLIT */}
            <InfoStrip>
              <div className="info-block">
                <span className="lbl">Place of Supply</span>
                <span className="val">{client.state || "-"}</span>
              </div>
              <div className="info-block">
                <span className="lbl">Payment Terms</span>
                <span className="val">Immediate</span>
              </div>
              <div className="info-block">
                <span className="lbl">PO Number</span>
                <span className="val">{invoice.poNumber || "N/A"}</span>
              </div>
              <div className="info-block">
                <span className="lbl">PO Date</span>
                <span className="val">{invoice.poDate || "N/A"}</span>
              </div>
            </InfoStrip>

            {/* CLIENT CARDS */}
            <ClientGrid>
              <ClientCard>
                <div className="card-header">Billed To (Receiver)</div>
                <div className="card-body">
                  <p className="client-name">
                    {client.businessName || "Client Name"}
                  </p>
                  <p>{client.address || "Client Address"}</p>
                  <p>
                    State: {client.state}{" "}
                    {client.stateCode ? `(${client.stateCode})` : ""}
                  </p>
                  <p>Phone: {client.contactNo || "N/A"}</p>
                  <p>Email: {client.email || "N/A"}</p>
                  <p className="gstin">
                    GSTIN: {client.gstin || "Unregistered"}
                  </p>
                </div>
              </ClientCard>
              <ClientCard>
                <div className="card-header">Shipped To (Consignee)</div>
                <div className="card-body">
                  <p className="client-name">
                    {client.businessName || "Client Name"}
                  </p>
                  <p>{client.address || "Client Address"}</p>
                  <p>
                    State: {client.state}{" "}
                    {client.stateCode ? `(${client.stateCode})` : ""}
                  </p>
                  <p className="gstin">
                    GSTIN: {client.gstin || "Unregistered"}
                  </p>
                </div>
              </ClientCard>
            </ClientGrid>

            {/* ITEMS TABLE */}
            <TableContainer>
              <ItemsTable>
                <thead>
                  <tr>
                    <th style={{ width: "4%" }}>Sr</th>
                    <th style={{ width: "26%" }}>Product / Description</th>
                    <th style={{ width: "8%" }}>HSN</th>
                    <th style={{ width: "6%" }}>Qty</th>
                    <th style={{ width: "6%" }}>Unit</th>
                    <th style={{ width: "10%", textAlign: "right" }}>Rate</th>
                    <th style={{ width: "12%", textAlign: "right" }}>
                      Taxable
                    </th>
                    <th style={{ width: "6%", textAlign: "center" }}>GST%</th>
                    <th style={{ width: "10%", textAlign: "right" }}>
                      GST Amt
                    </th>
                    <th style={{ width: "12%", textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(items || []).map((item, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td className="product-col">{item.name}</td>
                      <td>{item.hsn || "-"}</td>
                      <td>{item.qty}</td>
                      <td>{item.unit || "NOS"}</td>
                      <td className="num-col">
                        ₹
                        {parseFloat(item.price).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="num-col">
                        ₹
                        {parseFloat(item.taxable).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="text-center">{item.gst}%</td>
                      <td className="num-col">
                        ₹
                        {parseFloat(item.gstAmount).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="num-col fw-bold">
                        ₹
                        {parseFloat(item.total).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                  {/* Fill empty rows if items are few to maintain structure */}
                  {items.length < 5 &&
                    Array.from({ length: 5 - items.length }).map((_, idx) => (
                      <tr key={`empty-${idx}`} className="empty-row">
                        <td>&nbsp;</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                      </tr>
                    ))}
                </tbody>
              </ItemsTable>
            </TableContainer>

            {/* TOTALS & SUMMARY */}
            <SummarySection>
              <div className="amount-words">
                <span className="lbl">Amount in Words:</span>
                <p>{numberToWords(invoice.total)}</p>
                <div className="qty-summary">
                  Total Items: {items.length} | Total Qty:{" "}
                  {(items || []).reduce((acc, i) => acc + (i.qty || 0), 0)}
                </div>
              </div>
              <div className="totals-box">
                <div className="tot-row">
                  <span>Total Taxable Amount</span>
                  <span>
                    ₹
                    {parseFloat(invoice.grossAmount || 0).toLocaleString(
                      "en-IN",
                      { minimumFractionDigits: 2 },
                    )}
                  </span>
                </div>
                <div className="tot-row">
                  <span>Total GST Amount</span>
                  <span>
                    ₹
                    {parseFloat(invoice.gstAmount || 0).toLocaleString(
                      "en-IN",
                      { minimumFractionDigits: 2 },
                    )}
                  </span>
                </div>
                <div className="tot-row grand-total">
                  <span>Grand Total</span>
                  <span>
                    ₹
                    {parseFloat(invoice.total || 0).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              </div>
            </SummarySection>

            {/* BOTTOM CARDS (Bank & Terms) */}
            <BottomGrid>
              <InfoBox>
                <div className="box-title">Bank Account Details</div>
                <div className="box-content grid-2">
                  <span className="lbl">Account Name:</span>
                  <span className="val fw-bold">
                    {company.accountHolderName || "-"}
                  </span>
                  <span className="lbl">Account Number:</span>
                  <span className="val">{company.accountNumber || "-"}</span>
                  <span className="lbl">Bank Name:</span>
                  <span className="val">{company.bankName || "-"}</span>
                  <span className="lbl">IFSC Code:</span>
                  <span className="val">{company.bankIFSC || "-"}</span>
                </div>
              </InfoBox>
              <InfoBox>
                <div className="box-title">Terms & Conditions</div>
                <div className="box-content terms-list">
                  <p>1. This is a computer-generated invoice.</p>
                  <p>2. Goods once sold will not be taken back.</p>
                  <p>3. All disputes are subject to local jurisdiction.</p>
                </div>
              </InfoBox>
            </BottomGrid>

            {/* FOOTER & SIGNATURE */}
            <FooterSection>
              <div className="greeting">
                <p>Thank you for your business!</p>
              </div>
              <div className="signature-area">
                <div className="sig-img-box">
                  {company?.signatureURL ? (
                    <img src={company.signatureURL} alt="Signature" />
                  ) : (
                    <div className="sig-placeholder"></div>
                  )}
                </div>
                <div className="sig-line"></div>
                <p className="sig-name">Authorized Signatory</p>
                <p className="sig-company">For {company.businessName}</p>
              </div>
            </FooterSection>
          </A4Canvas>
        </ScaleContainer>
      </PreviewWorkspace>

      {/* ─── PRINT ONLY STYLES ─── */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body, html { margin: 0; padding: 0; background: white !important; }
          .hide-on-print { display: none !important; }
          .preview-workspace { padding: 0 !important; background: transparent !important; display: block !important; justify-content: flex-start !important; align-items: flex-start !important; }
          /* Reset transform for pure print */
          div[style*="transform: scale"] { transform: none !important; margin: 0 !important; }
          #invoice-print-area { box-shadow: none !important; border: none !important; margin: 0 !important; width: 210mm !important; height: 297mm !important; page-break-after: avoid; }
        }
      `}</style>
    </PageWrapper>
  );
}

/* ═══════════════════════════════════════════════════════════
   STYLED COMPONENTS
═══════════════════════════════════════════════════════════ */

const PageWrapper = styled.div`
  min-height: 100vh;
  background-color: #f1f5f9;
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    sans-serif;
  display: flex;
  flex-direction: column;
`;

const LoaderWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  color: #475569;
  .spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e2e8f0;
    border-top-color: #2563eb;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

/* ── TOOLBAR ── */
const Toolbar = styled.div`
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid #e2e8f0;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);

  .toolbar-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    color: #1e293b;
    font-size: 15px;
    .badge {
      background: #eff6ff;
      color: #2563eb;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      border: 1px solid #bfdbfe;
    }
  }

  .toolbar-actions {
    display: flex;
    gap: 10px;
  }

  @media (max-width: 640px) {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
    .toolbar-actions {
      width: 100%;
      justify-content: space-between;
    }
  }
`;

const ToolBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  ${(p) =>
    p.$variant === "primary" &&
    css`
      background: #2563eb;
      color: white;
      border: none;
      box-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
      &:hover {
        background: #1d4ed8;
        transform: translateY(-1px);
      }
    `}
  ${(p) =>
    p.$variant === "secondary" &&
    css`
      background: white;
      color: #1e293b;
      border: 1px solid #cbd5e1;
      &:hover {
        background: #f8fafc;
        border-color: #94a3b8;
      }
    `}
  ${(p) =>
    p.$variant === "ghost" &&
    css`
      background: transparent;
      color: #10b981;
      border: 1px solid transparent;
      &:hover {
        background: #ecfdf5;
        border-color: #a7f3d0;
      }
    `}
`;

/* ── PREVIEW WORKSPACE ── */
const PreviewWorkspace = styled.div`
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 40px 20px;
  overflow-y: auto;
  overflow-x: hidden;
`;

const ScaleContainer = styled.div`
  transform-origin: top center;
  transition: transform 0.1s ease-out;
  display: flex;
  justify-content: center;
  will-change: transform;
`;

/* ── A4 CANVAS (THE ACTUAL INVOICE) ── */
const A4Canvas = styled.div`
  width: 210mm;
  height: 297mm; /* strictly forced to one page */
  background: white;
  box-sizing: border-box;
  padding: 12mm 15mm;
  box-shadow:
    0 20px 40px rgba(0, 0, 0, 0.1),
    0 1px 3px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  color: #1e293b;
  font-family: "Inter", sans-serif;
  font-size: 10px; /* Base print size */
  line-height: 1.4;

  * {
    box-sizing: border-box;
  }
  p {
    margin: 0 0 3px 0;
  }
  .lbl {
    color: #64748b;
    font-size: 9.5px;
  }
  .val {
    color: #0f172a;
    font-weight: 500;
    font-size: 10px;
  }
  .fw-bold {
    font-weight: 700 !important;
  }
  .text-center {
    text-align: center;
  }
`;

/* ── HEADER SECTION ── */
const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 2px solid #2563eb;
  padding-bottom: 15px;
  margin-bottom: 12px;

  .company-details {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    max-width: 60%;

    .logo-placeholder {
      width: 44px;
      height: 44px;
      background: #eff6ff;
      color: #2563eb;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    h1 {
      margin: 0 0 6px 0;
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    p {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #475569;
      font-size: 9.5px;
      margin-bottom: 2px;
    }
  }

  .invoice-title-box {
    text-align: right;
    h2 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 900;
      color: #1e3a8a;
      letter-spacing: 2px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: auto auto;
      gap: 4px 12px;
      text-align: right;
      .lbl {
        text-align: right;
      }
      .val {
        text-align: left;
        min-width: 80px;
      }
    }
  }
`;

/* ── INFO STRIP ── */
const InfoStrip = styled.div`
  display: flex;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 8px 12px;
  margin-bottom: 15px;
  justify-content: space-between;

  .info-block {
    display: flex;
    flex-direction: column;
    gap: 2px;
    .val {
      font-size: 10px;
      font-weight: 600;
    }
  }
`;

/* ── CLIENT GRID ── */
const ClientGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
`;
const ClientCard = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  .card-header {
    background: #f1f5f9;
    padding: 6px 10px;
    font-size: 9.5px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #e2e8f0;
  }
  .card-body {
    padding: 10px;
    .client-name {
      font-size: 11px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 4px;
    }
    p {
      color: #334155;
      font-size: 9.5px;
    }
    .gstin {
      margin-top: 4px;
      font-weight: 600;
      color: #0f172a;
    }
  }
`;

/* ── TABLE ── */
const TableContainer = styled.div`
  flex: 1; /* Pushes footer down */
  min-height: 0;
  margin-bottom: 15px;
`;
const ItemsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  th {
    background: #1e3a8a;
    color: white;
    padding: 8px 6px;
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: left;
    border: 1px solid #1e3a8a;
  }
  td {
    padding: 8px 6px;
    border: 1px solid #e2e8f0;
    border-top: none;
    font-size: 9.5px;
    color: #334155;
    vertical-align: top;
    word-wrap: break-word;
  }
  .product-col {
    font-weight: 600;
    color: #0f172a;
  }
  .num-col {
    text-align: right;
  }

  tr:nth-child(even):not(.empty-row) {
    background: #f8fafc;
  }
  .empty-row td {
    border-bottom: 1px solid transparent;
    border-left: 1px solid #e2e8f0;
    border-right: 1px solid #e2e8f0;
  }
  .empty-row:last-child td {
    border-bottom: 1px solid #e2e8f0;
  }
`;

/* ── SUMMARY SECTION ── */
const SummarySection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  margin-bottom: 15px;
  page-break-inside: avoid;

  .amount-words {
    flex: 1;
    background: #f8fafc;
    border: 1px dashed #cbd5e1;
    border-radius: 6px;
    padding: 10px;
    p {
      font-size: 11px;
      font-weight: 700;
      color: #1e3a8a;
      margin-top: 4px;
      text-transform: capitalize;
    }
    .qty-summary {
      margin-top: 8px;
      font-size: 9px;
      color: #64748b;
      font-weight: 600;
    }
  }

  .totals-box {
    width: 260px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
    .tot-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 12px;
      font-size: 10px;
      color: #475569;
      border-bottom: 1px solid #e2e8f0;
      span:last-child {
        font-weight: 600;
        color: #0f172a;
      }
    }
    .grand-total {
      background: #eff6ff;
      padding: 10px 12px;
      border-bottom: none;
      span {
        font-size: 13px;
        font-weight: 800;
        color: #1d4ed8;
      }
    }
  }
`;

/* ── BOTTOM GRID ── */
const BottomGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 20px;
  page-break-inside: avoid;
`;
const InfoBox = styled.div`
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  .box-title {
    background: #f1f5f9;
    padding: 5px 10px;
    font-size: 9px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    border-bottom: 1px solid #e2e8f0;
  }
  .box-content {
    padding: 8px 10px;
    font-size: 9.5px;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 4px 8px;
  }
  .terms-list p {
    margin-bottom: 4px;
    color: #475569;
  }
`;

/* ── FOOTER & SIGNATURE ── */
const FooterSection = styled.div`
  margin-top: auto; /* Anchors to bottom */
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  border-top: 2px solid #e2e8f0;
  padding-top: 15px;
  page-break-inside: avoid;

  .greeting {
    p {
      font-size: 11px;
      font-weight: 600;
      color: #2563eb;
      font-style: italic;
    }
  }

  .signature-area {
    text-align: center;
    min-width: 160px;
    .sig-img-box {
      height: 45px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      margin-bottom: 4px;
      img {
        max-height: 100%;
        max-width: 140px;
        object-fit: contain;
      }
      .sig-placeholder {
        height: 100%;
        width: 100%;
      }
    }
    .sig-line {
      height: 1px;
      background: #94a3b8;
      width: 100%;
      margin-bottom: 4px;
    }
    .sig-name {
      font-size: 9px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
    }
    .sig-company {
      font-size: 8px;
      color: #64748b;
    }
  }
`;
