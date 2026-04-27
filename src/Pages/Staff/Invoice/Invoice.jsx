import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { getRequest } from "../../../../Services/axiosService.jsx";

export default function InvoicePreview() {
  const downloadPDF = () => {
    const element = document.getElementById("invoice");

    const opt = {
      margin: 0,
      filename: `Invoice-${invoice.invoiceNo}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 3, // 🔥 increase clarity
        useCORS: true,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
    };

    html2pdf().set(opt).from(element).save();
  };

  const table = {
    width: "100%",
    marginTop: 10,
    borderCollapse: "collapse",
    fontSize: "12px",
    pageBreakInside: "auto",
  };
  const location = useLocation();
  const id = location?.state?.id;

  const [company, setCompany] = useState({});
  const [client, setClient] = useState({});
const [invoice, setInvoice] = useState(location.state?.invoice || null);
  const [items, setItems] = useState([]);

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
    const res = await getRequest("SoftwareSettings/Get");
    setCompany(res?.result || {});
  };

  const loadClient = async () => {
    const res = await getRequest(
      "ClientMaster/Detail/" + invoice.clientMasterId,
    );
    setClient(res?.result || {});
  };

  const exportToExcel = () => {
    let csv = "Sr,Product,Qty,Rate,Total\n";

    items.forEach((i, index) => {
      csv += `${index + 1},${i.name},${i.qty},${i.price},${i.total}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "invoice.csv";
    a.click();
  };

  const numberToWords = (num) => {
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
      if (n < 100) return b[Math.floor(n / 10)] + " " + a[n % 10];
      if (n < 1000)
        return a[Math.floor(n / 100)] + " Hundred " + inWords(n % 100);
      if (n < 100000)
        return inWords(Math.floor(n / 1000)) + " Thousand " + inWords(n % 1000);
      return n;
    };

    return inWords(Math.floor(num)) + " Rupees Only";
  };

  if (!invoice) return <h3 style={{ padding: 20 }}>Loading...</h3>;

  return (
    <div style={{ background: "#f1f5f9", padding: 20 }}>
      <div
        id="invoice"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "10mm",
          background: "white",
        }}
      >
        {" "}
        {/* HEADER */}
        <div style={header}>
          <img src={company.logoURL || ""} style={{ width: 70 }} />
          <div style={{ textAlign: "center", flex: 1 }}>
            <h2>{company.businessName}</h2>
            <p>{company.addressLine1}</p>
            <p>
              {company.contactNo} | {company.email}
            </p>
            <p>
              GSTIN: {company.gstin} | PAN: {company.pan}
            </p>
          </div>
        </div>
        {/* TITLE */}
        <div style={title}>
          TAX INVOICE
          <span style={{ float: "right", fontSize: 12 }}>
            Original for Recipient
          </span>
        </div>
        {/* INFO */}
        <div style={row}>
          <div style={box} className="no-break">
            <p>
              <b>Invoice No:</b> {invoice.invoiceNo}
            </p>
            <p>
              <b>Date:</b> {new Date(invoice.invoiceDate).toLocaleDateString()}
            </p>
            <p>
              <b>State:</b> {client.state}
            </p>
          </div>

          <div style={box} className="no-break">
            <p>
              <b>Place of Supply:</b> {client.state}
            </p>
            <p>
              <b>Payment Terms:</b> Immediate
            </p>
            <p>
              <b>PO Number:</b> {invoice.poNumber || "-"}
            </p>
            <p>
              <b>PO Date:</b> {invoice.poDate || "-"}
            </p>
          </div>
        </div>
        {/* CLIENT */}
        <div style={row}>
          <div style={box} className="no-break">
            <b>Receiver (Billed to)</b>
            <p>
              <b>Name:</b> {client.businessName}
            </p>
            <p>
              <b>Address:</b> {client.address}
            </p>
            <p>
              <b>Mobile:</b> {client.contactNo}
            </p>
            <p>
              <b>Email:</b> {client.email}
            </p>
            <p>
              <b>GSTIN:</b> {client.gstin}
            </p>
            <p>
              <b>State:</b> {client.state}
            </p>
            <p>
              <b>State Code:</b> {client.stateCode}
            </p>
          </div>

          <div style={box} className="no-break">
            <b>Consignee (Shipped to)</b>
            <p>
              <b>Name:</b> {client.businessName}
            </p>
            <p>
              <b>Address:</b> {client.address}
            </p>
            <p>
              <b>GSTIN:</b> {client.gstin}
            </p>
            <p>
              <b>State:</b> {client.state}
            </p>
            <p>
              <b>State Code:</b> {client.stateCode}
            </p>
          </div>
        </div>
        {/* TABLE */}
        <table style={table}>
          <thead>
            <tr style={{ background: "#f1f5f9" }}>
              <th style={th}>Sr</th>
              <th style={th}>Product</th>
              <th style={th}>HSN</th>
              <th style={th}>Qty</th>
              <th style={th}>Unit</th>
              <th style={th}>Rate</th>
              <th style={th}>Taxable</th>
              <th style={th}>GST%</th>
              <th style={th}>GST Amt</th>
              <th style={th}>Total</th>
            </tr>
          </thead>

          <tbody>
            {(items || []).map((i, index) => (
              <tr key={index}>
                <td style={td}>{index + 1}</td>
                <td style={{ ...td, fontWeight: "600" }}>{i.name}</td>
                <td style={td}>{i.hsn || "-"}</td>
                <td style={td}>{i.qty}</td>
                <td style={td}>{i.unit || "NOS"}</td>
                <td style={td}>₹{i.price}</td>
                <td style={td}>₹{i.taxable}</td>
                <td style={td}>{i.gst}%</td>
                <td style={td}>₹{i.gstAmount}</td>
                <td style={{ ...td, fontWeight: "600" }}>₹{i.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* TOTAL */}
        <div className="no-break" style={{ textAlign: "right", marginTop: 10 }}>
          <p>
            Total Qty: {(items || []).reduce((a, i) => a + (i.qty || 0), 0)}
          </p>
          <p>Total Taxable: ₹{invoice.grossAmount}</p>
          <p>Total GST: ₹{invoice.gstAmount}</p>
          <h3 style={{ color: "#16a34a" }}>₹{invoice.total}</h3>
        </div>
        <p>
          <b>Amount in Words:</b> {numberToWords(invoice.total)}
        </p>
        {/* BANK + TERMS */}
        <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
          <div style={box} className="no-break">
            <b>Bank Details</b>
            <p>
              <b>Account Name:</b> {company.accountHolderName}
            </p>
            <p>
              <b>Account No:</b> {company.accountNumber}
            </p>
            <p>
              <b>Bank Name:</b> {company.bankName}
            </p>
            <p>
              <b>IFSC:</b> {company.bankIFSC}
            </p>
          </div>

          <div style={box} className="no-break">
            <b>Terms & Conditions</b>
            <p>1. Computer generated invoice</p>
            <p>2. Subject to jurisdiction</p>
          </div>
        </div>
        {/* FOOTER */}
       {/* SIGNATURE + FOOTER */}
<div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 40,
  }}
>
  {/* Left Side */}
  <div>
    <p style={{ fontWeight: "600" }}>Thank you for your business</p>
  </div>

  {/* Right Side (Signature) */}
  <div style={{ textAlign: "center" }}>
    {company?.signatureURL && (
      <img
        src={company.signatureURL}
        alt="Authorized Signature"
        style={{
          height: 80,
          objectFit: "contain",
          marginBottom: 5,
        }}
      />
    )}
    <p style={{ fontWeight: "600", margin: 0 }}>
      Authorized Signatory
    </p>
    <p style={{ fontSize: 12 }}>{company.businessName}</p>
  </div>
</div>
      </div>

      {/* BUTTONS */}
      <div
        style={{
          marginTop: 20,
          display: "flex",
          gap: 10,
          justifyContent: "center",
        }}
      >
        <button className="btn btn-success" onClick={downloadPDF}>
          Download PDF
        </button>

        <button className="btn btn-primary" onClick={() => window.print()}>
          Print
        </button>

        <button className="btn btn-warning" onClick={exportToExcel}>
          Export Excel
        </button>
      </div>

      {/* PRINT FIX */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice, #invoice * { visibility: visible; }
        }
      `}</style>
    </div>
  );
}

/* STYLES */
const th = { border: "1px solid #cbd5e1", padding: "6px", fontSize: "12px" };
const td = { border: "1px solid #cbd5e1", padding: "6px", fontSize: "12px" };

const container = {
  background: "#ffffff",
  color: "#000000",
  padding: 20,
  borderRadius: 10,
  maxWidth: "900px",
  margin: "auto",
  border: "1px solid #cbd5e1",
};

const header = {
  display: "flex",
  alignItems: "center",
  borderBottom: "2px solid #3b82f6",
  paddingBottom: 10,
};

const title = {
  background: "linear-gradient(to right, #3b82f6, #2563eb)",
  color: "#fff",
  textAlign: "center",
  padding: 10,
  marginTop: 10,
  fontWeight: "bold",
  borderRadius: 4,
};

const row = {
  display: "flex",
  gap: 10,
  marginTop: 10,
};

const box = {
  flex: 1,
  border: "1px solid #cbd5e1",
  padding: 10,
  borderRadius: 6,
  background: "#f8fafc",
};

const table = {
  width: "100%",
  marginTop: 10,
  borderCollapse: "collapse",
  fontSize: "12px",
};
