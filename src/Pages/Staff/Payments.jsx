import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Search,
  Calendar,
  CalendarDays,
  RefreshCcw,
  Edit3,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Plus,
  Download,
  Clock,
  FileText,
  Hash,
  CreditCard,
  TrendingUp,
  AlertCircle,
  Lock,
} from "lucide-react";
import CountUp from "react-countup";
import {
  getRequest,
  postRequest,
  deleteRequest,
  putRequest,
} from "../../../Services/axiosService.jsx";
import {
  errorAlert,
  confirmAlert,
  successAlert,
} from "../../../Services/sweetAlert.jsx";

// --- UNIFORM ERP PREMIUM UTILITIES ---
import GlobalLoader from "../../components/common/GlobalLoader.jsx";
import PageTransition from "../../components/common/PageTransition.jsx";
import { SkeletonTableRows } from "../../components/common/SkeletonLoader.jsx";
import PremiumEmptyState from "../../components/common/PremiumEmptyState.jsx";

/* =========================================================
    ANIMATIONS & GLOBAL STYLES
   ========================================================= */

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const RotatingRefreshIcon = styled(RefreshCcw)`
  margin-right: 10px;
  ${(props) =>
    props.$loading &&
    css`
      animation: ${spin} 1s linear infinite;
    `}
`;

const premiumHover = css`
  &:hover {
    border-color: rgba(10, 102, 249, 0.87);
    box-shadow: 3px 15px 45px rgba(59, 131, 246, 0.49);
    transform: translateY(-5px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

/* =========================================================
    STYLED COMPONENTS (PREMIUM ERP THEME)
   ========================================================= */

const PageWrapper = styled.div`
  padding: 24px;
  min-height: 100vh;
  font-family: "Inter", sans-serif;
  background:
    radial-gradient(
      circle at top left,
      rgba(59, 130, 246, 0.08),
      transparent 35%
    ),
    radial-gradient(
      circle at top right,
      rgba(6, 182, 212, 0.08),
      transparent 35%
    ),
    var(--bg);
  transition: all 0.3s ease;
  @media (max-width: 768px) {
    padding: 14px;
  }
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  .title-area {
    h1 {
      font-size: 32px;
      font-weight: 800;
      background: linear-gradient(90deg, #3b82f6, #06b6d4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
      letter-spacing: -1px;
    }
    p {
      color: var(--text-muted);
      margin: 5px 0 0 0;
      font-size: 14px;
      font-weight: 500;
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const GlassCard = styled(motion.div)`
  background: var(--card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-custom);
  border-radius: 24px;
  padding: 22px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  ${premiumHover}
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(
      90deg,
      transparent,
      #3b82f6,
      #06b6d4,
      transparent
    );
    opacity: 0.3;
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 18px;
  .icon-box {
    width: 54px;
    height: 54px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${(props) => props.$bg || "rgba(59, 130, 246, 0.1)"};
    color: ${(props) => props.$color || "#3b82f6"};
  }
  .details {
    span {
      font-size: 14px;
      color: var(--text-muted);
      font-weight: 600;
    }
    h3 {
      font-size: 24px;
      font-weight: 800;
      margin: 2px 0 0 0;
      color: var(--text);
    }
  }
`;

const FilterCard = styled(GlassCard)`
  padding: 18px 24px;
  margin-bottom: 25px;
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
  &:hover {
    transform: none;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  flex: 1;
  min-width: 300px;
  svg {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
  }
  input {
    width: 100%;
    padding: 12px 12px 12px 45px;
    background: var(--bg-light-custom);
    border: 1px solid var(--border-custom);
    border-radius: 14px;
    color: var(--text);
    font-weight: 500;
    &:focus {
      border-color: #3b82f6;
      outline: none;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
    }
  }
`;

const DateInputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-light-custom);
  border: 1px solid var(--border-custom);
  border-radius: 14px;
  padding: 0 12px;
  input,
  select {
    border: none;
    background: transparent;
    color: var(--text);
    padding: 12px 5px;
    font-size: 13px;
    font-weight: 600;
    &:focus {
      outline: none;
    }
    option {
      background: var(--card);
      color: var(--text);
    }
  }
  svg {
    color: var(--text-muted);
  }
`;

const TableWrapper = styled(GlassCard)`
  padding: 0;
  border-radius: 20px;
  overflow: hidden;
  &:hover {
    transform: none;
  }
  .table-responsive {
    overflow-x: auto;
    width: 100%;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    th {
      background: var(--bg-light-custom);
      padding: 18px 20px;
      color: #38bdf8;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 1.2px;
      text-align: left;
      font-weight: 800;
      border-bottom: 1px solid var(--border-custom);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    td {
      padding: 18px 20px;
      border-bottom: 1px solid var(--border-custom);
      color: var(--text);
      font-size: 14px;
      font-weight: 500;
      transition: 0.3s;
    }
    tr {
      transition: 0.2s;
    }
    tr:hover td {
      background: rgba(59, 130, 246, 0.05);
      color: var(--primary);
    }
  }
`;

const StatusBadge = styled.span`
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(props) =>
    props.$status === "Paid"
      ? "rgba(16, 185, 129, 0.1)"
      : props.$status === "Partial"
        ? "rgba(245, 158, 11, 0.1)"
        : "rgba(239, 68, 68, 0.1)"};
  color: ${(props) =>
    props.$status === "Paid"
      ? "#10b981"
      : props.$status === "Partial"
        ? "#f59e0b"
        : "#ef4444"};
  border: 1px solid
    ${(props) =>
      props.$status === "Paid"
        ? "rgba(16, 185, 129, 0.2)"
        : props.$status === "Partial"
          ? "rgba(245, 158, 11, 0.2)"
          : "rgba(239, 68, 68, 0.2)"};
`;

const FyBadge = styled.span`
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 800;
  background: rgba(59, 130, 246, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(59, 130, 246, 0.4);
`;

const ActionBtn = styled(motion.button)`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  color: white;
  &.edit {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
  }
  &.delete {
    background: linear-gradient(135deg, #ef4444, #dc2626);
  }
  &:hover {
    filter: brightness(1.2);
    box-shadow: 0 0 15px currentColor;
    transform: translateY(-2px);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const PremiumBtn = styled.button`
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  border: none;

  &.primary {
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    color: white;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  }
  &.success {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  }
  &.info {
    background: linear-gradient(135deg, #0ea5e9, #0284c7);
    color: white;
    box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
  }
  &.secondary {
    background: var(--bg-light-custom);
    color: var(--text);
    border: 1px solid var(--border-custom);
  }

  &:hover {
    transform: translateY(-3px);
    filter: brightness(1.1);
    box-shadow: 0 8px 25px rgba(59, 131, 246, 0.4);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const PaginationBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px;
  background: var(--bg-light-custom);
  border-top: 1px solid var(--border-custom);

  .info {
    font-size: 13px;
    color: var(--text-muted);
    font-weight: 500;
  }
  .controls {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
`;

const PageBtn = styled.button`
  padding: 8px 16px;
  border-radius: 12px;
  border: 1px solid var(--border-custom);
  background: ${(props) =>
    props.$active
      ? "linear-gradient(135deg, #3b82f6, #06b6d4)"
      : "var(--card)"};
  color: ${(props) => (props.$active ? "#fff" : "var(--text)")};
  font-weight: 700;
  cursor: pointer;
  transition: 0.3s;
  box-shadow: ${(props) =>
    props.$active ? "0 4px 15px rgba(59, 130, 246, 0.3)" : "none"};

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    border-color: #3b82f6;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.2);
  }
`;

const PageIndicator = styled.div`
  display: flex;
  align-items: center;
  background: var(--card);
  padding: 0 20px;
  border-radius: 12px;
  border: 1px solid var(--border-custom);
  font-weight: 800;
  font-size: 13px;
  height: 38px;
  color: var(--primary);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const LockOverlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(4px);
  border-radius: 24px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;

  .lock-icon {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    padding: 20px;
    border-radius: 50%;
    margin-bottom: 15px;
    box-shadow: 0 0 30px rgba(239, 68, 68, 0.4);
  }

  h3 {
    font-size: 1.5rem;
    font-weight: 800;
    margin: 0 0 8px 0;
  }

  p {
    font-weight: 500;
    color: #cbd5e1;
  }
`;

/* =========================================================
    MODAL STYLES
   ========================================================= */

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(24px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background: var(--card);
  width: 100%;
  max-width: 550px;
  border-radius: 28px;
  border: 1px solid rgba(59, 130, 246, 0.25);
  box-shadow:
    3px 8px 50px rgb(4, 0, 255),
    0 2px rgba(59, 130, 246, 0.15);
  overflow: hidden;
  position: relative;
  &:hover {
    backdrop-filter: blur(24px);
    border: 3px solid rgb(5, 22, 255);
  }
`;

const ModalHeader = styled.div`
  padding: 24px 30px;
  background: var(--bg-light-custom);
  border-bottom: 1px solid var(--border-custom);
  display: flex;
  justify-content: space-between;
  align-items: center;
  h2 {
    font-size: 20px;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(90deg, #3b82f6, #06b6d4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  button {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    transition: 0.3s;
    &:hover {
      color: #ef4444;
      transform: scale(1.1);
    }
  }
`;

const ModalBody = styled.div`
  padding: 30px;
  display: grid;
  gap: 20px;
`;

const FormInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
  }
  .input-wrapper {
    position: relative;
    svg {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      width: 16px;
    }
    input,
    select {
      width: 100%;
      padding: 12px 12px 12px 42px;
      background: var(--bg-light-custom);
      border: 1px solid var(--border-custom);
      border-radius: 14px;
      color: var(--text);
      font-size: 14px;
      transition: 0.3s;
      &:focus {
        border-color: #3b82f6;
        background: var(--card);
        outline: none;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
      }
    }
    select {
      padding-left: 42px;
    }
  }
`;

const ModalFooter = styled.div`
  padding: 20px 30px;
  background: var(--bg-light-custom);
  border-top: 1px solid var(--border-custom);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

/* =========================================================
    MAIN COMPONENT
   ========================================================= */

export default function Payments() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // NEW: FY State & Filter
  const [financialYears, setFinancialYears] = useState([]);
  const [activeFy, setActiveFy] = useState(null);
  const [selectedFyFilter, setSelectedFyFilter] = useState("ALL");

  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [invoiceList, setInvoiceList] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    invoiceNo: "", // invoiceMasterId
    amount: "",
    paymentDate: "",
    referenceNo: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Derived Stats based on filtered data
  const totalPaid = filtered.reduce((sum, i) => sum + i.amount, 0);
  const totalCount = filtered.length;
  const invoiceMap = Object.fromEntries(
    invoiceList.map((i) => [i.id, i.total]),
  );
  const invoiceSummary = Object.values(
    filtered.reduce((acc, item) => {
      if (!acc[item.invoiceMasterId]) {
        acc[item.invoiceMasterId] = {
          invoiceNo: item.invoiceNo,
          totalPaid: 0,
          totalAmount: invoiceMap[item.invoiceMasterId] || 0,
        };
      }

      acc[item.invoiceMasterId].totalPaid += item.amount;
      return acc;
    }, {}),
  );

  const totalPending = invoiceSummary.reduce(
    (sum, i) => sum + (i.totalAmount - i.totalPaid),
    0,
  );
  const location = useLocation();
  useEffect(() => {
    if (location.state?.invoiceId) {
      setForm((prev) => ({
        ...prev,
        invoiceNo: location.state.invoiceId,
      }));
    }
  }, [location.state]);
  const todayStr = new Date().toISOString().split("T")[0];
  const todayCollections = filtered
    .filter((i) => i.paymentDate && i.paymentDate.split("T")[0] === todayStr)
    .reduce((sum, i) => sum + i.amount, 0);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, invoicesRes, fyRes] = await Promise.all([
        getRequest("InvoicePayment/List"),
        getRequest("InvoiceMaster/ListInvoice"),
        getRequest("FinancialYear/List"),
      ]);

      if (paymentsRes.status === "OK") {
        setData(paymentsRes.result || []);
        setFiltered(paymentsRes.result || []);
      }
      if (invoicesRes.status === "OK") {
        setInvoiceList(invoicesRes.result || []);
      }
      if (fyRes.status === "OK") {
        setFinancialYears(fyRes.result || []);
        const active = (fyRes.result || []).find(
          (y) => y.isActive && !y.isClosed && !y.isDelete,
        );
        setActiveFy(active || null);
      }
    } catch (err) {
      errorAlert("Error", "Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  const reloadPayments = async (keepPage = false) => {
    try {
      setLoading(true);
      const res = await getRequest("InvoicePayment/List");
      if (res.status === "OK") {
        setData(res.result || []);
      }
    } catch (err) {
      errorAlert("Error", "Failed to reload payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilter();
  }, [search, fromDate, toDate, selectedFyFilter, data]);

  const applyFilter = () => {
    let temp = [...data];
    if (search) {
      temp = temp.filter(
        (i) =>
          i.invoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
          i.staffName?.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (fromDate)
      temp = temp.filter((i) => new Date(i.paymentDate) >= new Date(fromDate));
    if (toDate)
      temp = temp.filter((i) => new Date(i.paymentDate) <= new Date(toDate));

    // FY Filter Logic (Assuming backend attaches FinancialYearId or we deduce from date)
    // If backend doesn't attach FY ID to payment, we deduce it by date matching the FY dates.
    if (selectedFyFilter !== "ALL") {
      const selectedFyObj = financialYears.find(
        (y) => y.id.toString() === selectedFyFilter,
      );
      if (selectedFyObj) {
        const fyStart = new Date(selectedFyObj.startDate);
        const fyEnd = new Date(selectedFyObj.endDate);
        temp = temp.filter((i) => {
          const pd = new Date(i.paymentDate);
          return pd >= fyStart && pd <= fyEnd;
        });
      }
    }

    setFiltered(temp);
    // Don't reset page if we are just reloading data after an edit/delete
    // Handled mostly by letting useEffect run, but if search changes, we probably want page 1.
    // For simplicity, we keep it as is, but might need refinement for exact preservation.
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setForm({
      invoiceNo: p.invoiceMasterId || "",
      amount: p.amount,
      paymentDate: p.paymentDate?.split("T")[0],
      referenceNo: p.referenceNo || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const confirm = await confirmAlert(
      "Delete Payment?",
      "This action cannot be undone.",
    );
    if (confirm.isConfirmed) {
      try {
        setLoading(true);
        const res = await deleteRequest(`InvoicePayment/Delete/${id}`);
        if (res.status === "OK") {
          successAlert("Deleted", "Payment deleted successfully");
          await reloadPayments(true);
        } else {
          errorAlert("Error", res.message || res.result);
        }
      } catch (err) {
        errorAlert("Error", "Delete failed");
      } finally {
        setLoading(false);
      }
    }
  };

  const exportExcel = () => {
    let csv = "Invoice,Amount,Date,Reference\n";
    filtered.forEach((i) => {
      csv += `${i.invoiceNo},${i.amount},${new Date(i.paymentDate).toLocaleDateString()},${i.referenceNo || "N/A"}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Payments_Report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleSavePayment = async () => {
    try {
      if (!form.invoiceNo || !form.amount || !form.paymentDate) {
        return errorAlert(
          "Required Fields",
          "Please fill all mandatory fields.",
        );
      }

      setSubmitting(true);

      const payload = {
        invoiceMasterId: Number(form.invoiceNo),
        amount: Number(form.amount),
        paymentDate: form.paymentDate,
        referenceNo: form.referenceNo,
        staffMasterId: 1, // Assume handled by token/session
      };

      let res;
      if (editId) {
        payload.id = editId;
        res = await putRequest("InvoicePayment/Update", payload);
      } else {
        // Enforce active FY for new payments if needed
        if (!activeFy) {
          setSubmitting(false);
          return errorAlert(
            "Blocked",
            "No active Financial Year found. Cannot add payment.",
          );
        }
        res = await postRequest("InvoicePayment/Save", payload);
      }

      if (res.status === "OK") {
        successAlert(
          "Success",
          editId
            ? "Payment updated successfully"
            : "Payment saved successfully",
        );
        setShowModal(false);
        setEditId(null);
        setForm({
          invoiceNo: "",
          amount: "",
          paymentDate: "",
          referenceNo: "",
        });
        await reloadPayments(true);
      } else {
        errorAlert("Error", res.message || res.result);
      }
    } catch (err) {
      errorAlert("Error", err.message || "Save failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Determine which FY a payment belongs to for the new column
  const getFyForDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const pd = new Date(dateStr);
    const fy = financialYears.find((y) => {
      const s = new Date(y.startDate);
      const e = new Date(y.endDate);
      return pd >= s && pd <= e;
    });
    return fy ? fy.yearName : "N/A";
  };

  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const currentRecords = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / recordsPerPage);

  let lastInvoice = "";

  const isPaymentAllowed = activeFy !== null;

  return (
    <>
      <GlobalLoader isLoading={loading} />
      <PageTransition>
        <PageWrapper>
          <HeaderSection>
            <div className="title-area">
              <motion.h1
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                Invoice Payments
              </motion.h1>
              <p>Manage and track all received invoice payments globally</p>
            </div>
            <PremiumBtn
              className="secondary"
              onClick={() => reloadPayments(false)}
              disabled={loading}
            >
              <RotatingRefreshIcon size={18} $loading={loading} /> Reload
            </PremiumBtn>
          </HeaderSection>

          {/* IF NO ACTIVE FY, SHOW WARNING CARD */}
          {!isPaymentAllowed && !loading && (
            <GlassCard
              style={{
                borderColor: "rgba(239, 68, 68, 0.4)",
                background: "rgba(239, 68, 68, 0.05)",
                marginBottom: "25px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  color: "#ef4444",
                }}
              >
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.2)",
                    padding: "15px",
                    borderRadius: "50%",
                  }}
                >
                  <AlertCircle size={28} />
                </div>
                <div>
                  <h3 style={{ margin: "0 0 5px 0", fontWeight: 800 }}>
                    No Active Financial Year Found
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "0.9rem",
                      color: "var(--text)",
                    }}
                  >
                    Adding new payments is currently locked. Please activate a
                    Financial Year from settings.
                  </p>
                </div>
              </div>
            </GlassCard>
          )}

          <StatsGrid>
            <GlassCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <StatItem $color="#10b981" $bg="rgba(16, 185, 129, 0.15)">
                <div className="icon-box">
                  <Wallet size={26} />
                </div>
                <div className="details">
                  <span>Total Paid</span>
                  <h3>
                    <CountUp
                      end={totalPaid}
                      duration={2}
                      prefix="₹"
                      separator=","
                      decimals={2}
                    />
                  </h3>
                </div>
              </StatItem>
            </GlassCard>

            <GlassCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <StatItem $color="#8b5cf6" $bg="rgba(139, 92, 246, 0.15)">
                <div className="icon-box">
                  <TrendingUp size={26} />
                </div>
                <div className="details">
                  <span>Today's Collections</span>
                  <h3>
                    <CountUp
                      end={todayCollections}
                      duration={2}
                      prefix="₹"
                      separator=","
                      decimals={2}
                    />
                  </h3>
                </div>
              </StatItem>
            </GlassCard>

            <GlassCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <StatItem $color="#f59e0b" $bg="rgba(245, 158, 11, 0.15)">
                <div className="icon-box">
                  <Clock size={26} />
                </div>
                <div className="details">
                  <span>Pending Dues</span>
                  <h3>
                    <CountUp
                      end={totalPending}
                      duration={2}
                      prefix="₹"
                      separator=","
                      decimals={2}
                    />
                  </h3>
                </div>
              </StatItem>
            </GlassCard>

            <GlassCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <StatItem $color="#3b82f6" $bg="rgba(59, 130, 246, 0.15)">
                <div className="icon-box">
                  <FileText size={26} />
                </div>
                <div className="details">
                  <span>Total Records</span>
                  <h3>
                    <CountUp end={totalCount} duration={2} separator="," />
                  </h3>
                </div>
              </StatItem>
            </GlassCard>
          </StatsGrid>

          <FilterCard>
            <SearchWrapper>
              <Search size={20} />
              <input
                type="text"
                placeholder="Search invoice or staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={loading}
              />
            </SearchWrapper>

            <DateInputGroup>
              <CalendarDays size={18} />
              <select
                value={selectedFyFilter}
                onChange={(e) => setSelectedFyFilter(e.target.value)}
                disabled={loading}
              >
                <option value="ALL">All Financial Years</option>
                {financialYears.map((fy) => (
                  <option key={fy.id} value={fy.id.toString()}>
                    {fy.yearName}
                  </option>
                ))}
              </select>
            </DateInputGroup>

            <DateInputGroup>
              <Calendar size={18} />
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                disabled={loading}
              />
              <span
                style={{
                  margin: "0 10px",
                  color: "var(--text-muted)",
                  fontWeight: 800,
                }}
              >
                TO
              </span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                disabled={loading}
              />
            </DateInputGroup>

            <div style={{ display: "flex", gap: "12px", marginLeft: "auto" }}>
              <PremiumBtn
                className="info"
                onClick={exportExcel}
                disabled={loading || filtered.length === 0}
              >
                <Download size={18} /> Export CSV
              </PremiumBtn>
              <PremiumBtn
                className="success"
                disabled={loading || !isPaymentAllowed}
                onClick={() => {
                  setEditId(null);
                  setForm({
                    invoiceNo: "",
                    amount: "",
                    paymentDate: "",
                    referenceNo: "",
                  });
                  setShowModal(true);
                }}
              >
                <Plus size={18} /> Add Payment
              </PremiumBtn>
            </div>
          </FilterCard>

          <TableWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Invoice No</th>
                    <th>Amount Paid</th>
                    <th>Date Received</th>
                    <th>Financial Year</th>
                    <th>Reference ID</th>
                    <th>Recorded By</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonTableRows rows={5} columns={7} />
                  ) : currentRecords.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: "3rem 0" }}>
                        <PremiumEmptyState
                          icon={Wallet}
                          title="No Payments Found"
                          subtitle="There are no payment records matching your search or filter criteria."
                        />
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((p) => {
                      const showInvoice = lastInvoice !== p.invoiceNo;
                      lastInvoice = p.invoiceNo;

                      const fyName = getFyForDate(p.paymentDate);

                      return (
                        <tr key={p.id}>
                          <td>
                            <span
                              className="neon-text-blue"
                              style={{
                                fontWeight: 800,
                                fontSize: "15px",
                                opacity: showInvoice ? 1 : 0.4,
                              }}
                            >
                              {p.invoiceNo}
                            </span>
                          </td>
                          <td>
                            <span style={{ color: "#10b981", fontWeight: 800 }}>
                              ₹{p.amount.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            {new Date(p.paymentDate).toLocaleDateString(
                              "en-GB",
                              {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </td>
                          <td>
                            <FyBadge>{fyName}</FyBadge>
                          </td>
                          <td>
                            <span
                              style={{
                                color: "var(--text-muted)",
                                fontWeight: 600,
                              }}
                            >
                              {p.referenceNo || "N/A"}
                            </span>
                          </td>
                          <td>
                            <div
                              style={{
                                background: "rgba(59,130,246,0.1)",
                                padding: "4px 10px",
                                borderRadius: "8px",
                                display: "inline-block",
                                fontSize: "12px",
                                fontWeight: 800,
                                color: "#3b82f6",
                              }}
                            >
                              {p.staffName}
                            </div>
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                gap: "10px",
                                justifyContent: "center",
                              }}
                            >
                              <ActionBtn
                                className="edit"
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleEdit(p)}
                                title="Edit"
                                disabled={loading || !isPaymentAllowed}
                              >
                                <Edit3 size={16} />
                              </ActionBtn>
                              <ActionBtn
                                className="delete"
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleDelete(p.id)}
                                title="Delete"
                                disabled={loading}
                              >
                                <Trash2 size={16} />
                              </ActionBtn>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar>
              <div className="info d-none d-sm-block">
                Showing records{" "}
                <b>{filtered.length > 0 ? indexOfFirst + 1 : 0}</b> to{" "}
                <b>{Math.min(indexOfLast, filtered.length)}</b> of{" "}
                <b>{filtered.length}</b>
              </div>
              <div className="controls">
                <PageBtn
                  disabled={currentPage === 1 || loading}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft size={18} />
                </PageBtn>
                <PageIndicator>
                  Page {currentPage} of {totalPages || 1}
                </PageIndicator>
                <PageBtn
                  disabled={
                    currentPage === totalPages || totalPages === 0 || loading
                  }
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <ChevronRight size={18} />
                </PageBtn>
              </div>
            </PaginationBar>
          </TableWrapper>

          <AnimatePresence>
            {showModal && (
              <ModalOverlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ModalContent
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                >
                  <ModalHeader>
                    <h2>
                      {editId ? "Update Payment Record" : "Record New Payment"}
                    </h2>
                    <button
                      onClick={() => setShowModal(false)}
                      disabled={submitting}
                    >
                      <X size={24} />
                    </button>
                  </ModalHeader>
                  <ModalBody>
                    <FormInputGroup>
                      <label>Select Invoice</label>
                      <div className="input-wrapper">
                        <FileText />
                        <select
                          value={form.invoiceNo}
                          onChange={(e) =>
                            setForm({ ...form, invoiceNo: e.target.value })
                          }
                          disabled={submitting}
                        >
                          <option value="">-- Choose Target Invoice --</option>
                          {invoiceList.map((inv) => (
                            <option key={inv.id} value={inv.id}>
                              {inv.invoiceNo} (₹{inv.total})
                            </option>
                          ))}
                        </select>
                      </div>
                    </FormInputGroup>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "20px",
                      }}
                    >
                      <FormInputGroup>
                        <label>Amount Received (₹)</label>
                        <div className="input-wrapper">
                          <Wallet />
                          <input
                            type="number"
                            value={form.amount}
                            onChange={(e) =>
                              setForm({ ...form, amount: e.target.value })
                            }
                            placeholder="0.00"
                            disabled={submitting}
                          />
                        </div>
                      </FormInputGroup>

                      <FormInputGroup>
                        <label>Date of Payment</label>
                        <div className="input-wrapper">
                          <Calendar />
                          <input
                            type="date"
                            value={form.paymentDate}
                            onChange={(e) =>
                              setForm({ ...form, paymentDate: e.target.value })
                            }
                            disabled={submitting}
                          />
                        </div>
                      </FormInputGroup>
                    </div>

                    <FormInputGroup>
                      <label>Transaction Reference / UTR</label>
                      <div className="input-wrapper">
                        <Hash />
                        <input
                          type="text"
                          value={form.referenceNo}
                          onChange={(e) =>
                            setForm({ ...form, referenceNo: e.target.value })
                          }
                          placeholder="Bank TXN ID or Check No."
                          disabled={submitting}
                        />
                      </div>
                    </FormInputGroup>
                  </ModalBody>
                  <ModalFooter>
                    <PremiumBtn
                      className="secondary"
                      onClick={() => setShowModal(false)}
                      disabled={submitting}
                    >
                      Cancel
                    </PremiumBtn>
                    <PremiumBtn
                      className="success"
                      onClick={handleSavePayment}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <RefreshCcw size={16} className="spin" />
                      ) : null}
                      {editId ? "Update Payment" : "Save Payment"}
                    </PremiumBtn>
                  </ModalFooter>
                </ModalContent>
              </ModalOverlay>
            )}
          </AnimatePresence>
          <style>{`
            .spin { animation: rotate 1s linear infinite; }
            @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            .neon-text-blue { color: #38bdf8; text-shadow: 0 0 10px rgba(56, 189, 248, 0.4); }
          `}</style>
        </PageWrapper>
      </PageTransition>
    </>
  );
}
