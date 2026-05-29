import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";import * as XLSX from "xlsx";
import { format } from "date-fns";

export const exportToPDF = (data, totalAmount) => {
  const doc = new jsPDF("p", "mm", "a4");

  // Premium Header
  doc.setFillColor(15, 23, 42); // Dark slate background
  doc.rect(0, 0, doc.internal.pageSize.width, 40, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("EXPENSE REPORT", 14, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated On: ${format(new Date(), "PPpp")}`, 14, 30);

  // Prepare Table Data
  const tableColumn = [
    "ID",
    "Date",
    "Category",
    "Title",
    "Amount",
    "Payment Mode",
    "Status",
    "Ref No",
  ];

  const tableRows = data.map((exp) => {
  const amount = Number(exp.amount || exp.Amount || 0);

  return [
    exp.id || exp.Id || "—",

    exp.expenseDate || exp.ExpenseDate
      ? format(
          new Date(exp.expenseDate || exp.ExpenseDate),
          "MMM dd, yyyy"
        )
      : "—",

    exp.categoryName ||
      exp.CategoryName ||
      exp.calculatedCategoryName ||
      "—",

    exp.description ||
      exp.Description ||
      exp.expenseTitle ||
      exp.ExpenseTitle ||
      "—",

    `Rs. ${amount.toFixed(2)}`,

    exp.paymentMode || exp.PaymentMode || "—",

    exp.isPaid || exp.IsPaid ? "Paid" : "Pending",

    exp.referenceNo || exp.ReferenceNo || "—",
  ];
});

  // Total Row
  tableRows.push([
    {
      content: "TOTAL AMOUNT",
      colSpan: 5,
      styles: {
        halign: "right",
        fontStyle: "bold",
        textColor: [255, 255, 255],
        fillColor: [59, 130, 246],
      },
    },
    {
      content: `Rs. ${totalAmount.toFixed(2)}`,
      colSpan: 3,
      styles: {
        fontStyle: "bold",
        textColor: [255, 255, 255],
        fillColor: [59, 130, 246],
      },
    },
  ]);

 autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 48,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246], // Premium Blue
      textColor: 255,
      fontStyle: "bold",
      fontSize: 10,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Light zebra
    },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: [226, 232, 240],
      lineWidth: 0.1,
    },
    didDrawPage: function (data) {
      // Footer
      const str = "Page " + doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        str,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10,
      );
    },
  });

  doc.save(`Expense_Report_${format(new Date(), "yyyyMMdd_HHmm")}.pdf`);
};

export const exportToExcel = (data, totalAmount) => {
  const exportData = data.map((exp) => ({
    "Expense ID": exp.id || exp.Id,
    Date: exp.expenseDate
      ? format(new Date(exp.expenseDate || exp.ExpenseDate), "MMM dd, yyyy")
      : "—",
    Category: exp.categoryName || exp.CategoryName || "—",
    Title: exp.description || exp.Description || "—",
    Amount: exp.amount || exp.Amount || 0,
    "Payment Mode": exp.paymentMode || exp.PaymentMode || "—",
    Status: exp.isPaid || exp.IsPaid ? "Paid" : "Pending",
    "Ref No": exp.referenceNo || exp.ReferenceNo || "—",
    Notes: exp.notes || exp.Notes || "—",
  }));

  // Add total row
  exportData.push({
    "Expense ID": "TOTAL",
    Date: "",
    Category: "",
    Title: "",
    Amount: totalAmount,
    "Payment Mode": "",
    Status: "",
    "Ref No": "",
    Notes: "",
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();

  // Format column widths
  const wscols = [
    { wch: 10 },
    { wch: 15 },
    { wch: 20 },
    { wch: 25 },
    { wch: 15 },
    { wch: 15 },
    { wch: 12 },
    { wch: 15 },
    { wch: 30 },
  ];
  worksheet["!cols"] = wscols;

  XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
  XLSX.writeFile(
    workbook,
    `Expense_Report_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`,
  );
};
