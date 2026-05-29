import React, { useEffect, useState, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";

import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Search,
  Calendar,
  CalendarDays,
  RefreshCcw,
  Eye,
  Download,
  Printer,
  ChevronLeft,
  ChevronRight,
  Wallet,
  X,
  Trash2,
  Filter,
  IndianRupee,
  RotateCcw,
  FileSpreadsheet,
  MoreVertical,
  Copy,
  CheckCircle,
  AlertCircle,
  Square,
  CheckSquare,
  Users,
  CreditCard,
  TrendingDown,
  MinusSquare,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import CountUp from "react-countup";
import { getRequest, deleteRequest } from "../../../Services/axiosService.jsx";
import { errorAlert, successAlert } from "../../../Services/sweetAlert.jsx";

// --- UNIFORM ERP PAGE TRANSITION & LOADERS ---
import PageTransition from "../../components/common/PageTransition.jsx";
import GlobalLoader from "../../components/common/GlobalLoader.jsx";
import PremiumEmptyState from "../../components/common/PremiumEmptyState.jsx";
import { SkeletonTableRows } from "../../components/common/SkeletonLoader.jsx";

/* =========================================================
   STYLED COMPONENTS (PREMIUM ERP DESIGN SYSTEM)
   ========================================================= */

const PageWrapper = styled.div`
  padding: 24px;
  min-height: 100vh;
  font-family: "Inter", sans-serif;
  background: var(--bg);
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
      font-size: 28px;
      font-weight: 800;
      background: linear-gradient(90deg, #3b82f6, #06b6d4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
    }
    p {
      color: var(--text-muted);
      margin: 5px 0 0 0;
      font-size: 14px;
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const GlassCard = styled(motion.div)`
  background: var(--card);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid var(--border-custom);
  border-radius: 20px;
  padding: 20px;
  position: relative;
  overflow: visible;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      ${(props) => props.$glowColor || "#3b82f6"},
      ${(props) => props.$glowSecondary || "#06b6d4"},
      transparent
    );
    background-size: 200% auto;
    opacity: 0.5;
  }

  &:hover {
    border-color: ${(props) =>
      props.$glowColor ? `${props.$glowColor}66` : "rgba(10, 102, 249, 0.87)"};
    box-shadow: 3px 15px 45px
      ${(props) =>
        props.$glowColor
          ? `${props.$glowColor}33`
          : "rgba(59, 131, 246, 0.49)"};
    transform: translateY(-5px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;

  .icon-box {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${(props) => props.bg || "rgba(59, 130, 246, 0.1)"};
    color: ${(props) => props.color || "#3b82f6"};
  }

  .details {
    span {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 500;
    }
    h3 {
      font-size: 24px;
      font-weight: 800;
      margin: 2px 0 0 0;
      color: var(--text);
    }
  }

  .action-col {
    margin-left: auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .top-row {
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .btn-report {
    margin-left: auto;
    padding: 8px 16px;
    border: none;
    border-radius: 10px;
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    color: #fff;
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
    transition: all 0.3s ease;
    &:hover {
      transform: scale(1.05);
      filter: brightness(1.1);
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
    }
  }
`;

const FilterCard = styled(GlassCard)`
  padding: 15px 20px;
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
  svg {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-muted);
  }
  input {
    width: 100%;
    padding: 10px 10px 10px 40px;
    background: var(--bg-light-custom);
    border: 1px solid var(--border-custom);
    border-radius: 10px;
    color: var(--text);
    &:focus {
      border-color: #3b82f6;
      outline: none;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
    border-radius: 10px;
    padding: 0 12px;
    height: 40px;
    transition: 0.3s;
    &:focus-within {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    svg {
      color: var(--text-muted);
      margin-right: 8px;
      width: 16px;
    }
    select,
    input {
      border: none;
      background: transparent;
      color: var(--text);
      padding: 8px 0;
      font-size: 13px;
      &:focus {
        outline: none;
      }
      option {
        background: var(--card);
        color: var(--text);
      }
      &::placeholder {
        color: var(--text-muted);
      }
    }
    input[type="number"] {
      width: 80px;
    }
  }
  @media (max-width: 1024px) {
    width: 100%;
  }
`;

const TableWrapper = styled(GlassCard)`
  padding: 0;
  border-radius: 16px;
  overflow: hidden;

  .table-responsive {
    overflow-x: auto;
    width: 100%;
  }

  table {
    width: 100%;
    border-collapse: collapse;

    th {
      background: var(--bg-light-custom);
      padding: 16px 20px;
      color: #38bdf8;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-align: left;
      font-weight: 700;
      border-bottom: 1px solid var(--border-custom);
      position: sticky;
      top: 0;
      z-index: 10;
    }

    td {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-custom);
      color: var(--text);
      font-size: 14px;
      transition: all 0.2s;
    }

    tr:hover td {
      background: rgba(59, 130, 246, 0.05);
    }
  }
`;

const StatusBadge = styled.span`
  padding: 6px 14px;
  border-radius: 50px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: ${(p) =>
    p.$status === "Paid"
      ? "rgba(16, 185, 129, 0.15)"
      : p.$status === "Partial"
        ? "rgba(245, 158, 11, 0.15)"
        : "rgba(239, 68, 68, 0.15)"};
  color: ${(p) =>
    p.$status === "Paid"
      ? "#10b981"
      : p.$status === "Partial"
        ? "#f59e0b"
        : "#ef4444"};
  border: 1px solid
    ${(p) =>
      p.$status === "Paid"
        ? "rgba(16, 185, 129, 0.3)"
        : p.$status === "Partial"
          ? "rgba(245, 158, 11, 0.3)"
          : "rgba(239, 68, 68, 0.3)"};
  box-shadow: ${(p) =>
    p.$status === "Paid"
      ? "0 0 10px rgba(16, 185, 129, 0.2)"
      : p.$status === "Partial"
        ? "0 0 10px rgba(245, 158, 11, 0.2)"
        : "0 0 10px rgba(239, 68, 68, 0.2)"};
`;

const CheckboxWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${(p) => (p.$disabled ? "not-allowed" : "pointer")};
  color: ${(p) => (p.$checked ? "var(--primary)" : "var(--text-muted)")};
  opacity: ${(p) => (p.$disabled ? 0.5 : 1)};
  transition: 0.2s;
  &:hover {
    color: ${(p) => (p.$disabled ? "var(--text-muted)" : "var(--primary)")};
  }
`;

const ActionMenuWrap = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
`;

const ActionMenuBtn = styled.button`
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  transition: 0.3s;
  &:hover {
    background: var(--bg-hover);
    color: var(--text);
  }
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  right: 0;
  top: 100%;
  background: var(--card);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border-custom);
  border-radius: 12px;
  min-width: 180px;
  z-index: 50;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  padding: 8px;
`;

const DropdownItem = styled.button`
  background: transparent;
  border: none;
  padding: 10px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: ${(p) => (p.$danger ? "#ef4444" : "var(--text)")};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
  text-align: left;

  &:hover {
    background: ${(p) =>
      p.$danger ? "rgba(239, 68, 68, 0.1)" : "var(--bg-hover)"};
    color: ${(p) => (p.$danger ? "#ef4444" : "var(--primary)")};
  }
`;

const PaginationBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 25px;
  background: var(--bg-light-custom);

  .info {
    font-size: 13px;
    color: var(--text-muted);
  }
  .controls {
    display: flex;
    gap: 8px;
  }
`;

const PageBtn = styled.button`
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  border: 1px solid var(--border-custom);
  background: ${(props) =>
    props.$active
      ? "linear-gradient(135deg, #3b82f6, #06b6d4)"
      : "var(--card)"};
  color: ${(props) => (props.$active ? "#fff" : "var(--text)")};
  cursor: pointer;
  transition: 0.3s;
  box-shadow: ${(props) =>
    props.$active ? "0 4px 15px rgba(59, 130, 246, 0.4)" : "none"};

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  &:hover:not(:disabled) {
    border-color: #176ffd;
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  }
`;

const PremiumBtn = styled(motion.button)`
  padding: 10px 24px;
  border-radius: 10px;
  border: none;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &.primary {
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    color: white;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
  }
  &.secondary {
    background: var(--bg-light-custom);
    color: var(--text);
    border: 1px solid var(--border-custom);
  }
  &.danger-outline {
    background: transparent;
    color: #ef4444;
    border: 1px solid #ef4444;
    ${(p) =>
      p.$pulse &&
      css`
        animation: pulseRed 1.5s infinite;
        @keyframes pulseRed {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
      `}
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.15);
    box-shadow: 0 8px 25px rgba(59, 131, 246, 0.3);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

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
  max-width: 450px;
  border-radius: 24px;
  border: 1px solid var(--border-custom);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.35),
    0 0 30px rgba(59, 130, 246, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  text-align: center;
`;

const ModalHeader = styled.div`
  padding: 24px 30px 10px;
  background: var(--bg-light-custom);
  display: flex;
  justify-content: center;
  align-items: center;
  h2 {
    font-size: 24px;
    font-weight: 800;
    margin: 0;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 12px;
  }
`;

const ModalFooter = styled.div`
  padding: 24px 30px;
  background: transparent;
  display: flex;
  justify-content: center;
`;

const FloatingActionBar = styled(motion.div)`
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--card);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--primary);
  box-shadow: 0 10px 40px rgba(59, 130, 246, 0.3);
  border-radius: 50px;
  padding: 10px 20px;
  z-index: 1000;
  display: flex;
  gap: 15px;
  align-items: center;

  .selected-count {
    color: var(--primary);
    font-weight: 800;
    padding-right: 15px;
    border-right: 1px solid var(--border-custom);
  }
`;

const DrawerOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  z-index: 2000;
`;

const DrawerContent = styled(motion.div)`
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: 420px;
  max-width: 100vw;
  background: var(--card);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-left: 1px solid var(--border-custom);
  z-index: 2001;
  box-shadow: -10px 0 40px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;

  .drawer-header {
    padding: 24px;
    border-bottom: 1px solid var(--border-custom);
    background: var(--bg-light-custom);
    display: flex;
    justify-content: space-between;
    align-items: center;
    h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 800;
      color: var(--text);
    }
    button {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      transition: 0.3s;
      &:hover {
        color: #ef4444;
        transform: rotate(90deg);
      }
    }
  }

  .drawer-body {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;

    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--border-custom);
      border-radius: 10px;
    }
  }

  .drawer-footer {
    padding: 24px;
    border-top: 1px solid var(--border-custom);
    background: var(--bg-light-custom);
  }

  .info-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
    label {
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 700;
      text-transform: uppercase;
    }
    span {
      font-size: 15px;
      color: var(--text);
      font-weight: 600;
    }
  }
`;

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

export default function MyInvoices() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Advanced Filters
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState("Oldest First");
  const [statusFilter, setStatusFilter] = useState("All");
  const [staffFilter, setStaffFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportScope, setExportScope] = useState("page");

  // New Features States
  const [selectedInvoices, setSelectedInvoices] = useState([]);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedInvoiceForDrawer, setSelectedInvoiceForDrawer] =
    useState(null);

  const location = useLocation();
  const invoiceId = location.state?.invoiceId;
  useEffect(() => {
    if (!invoiceId) {
      console.log("No invoice id");
      return;
    }

    console.log("Invoice ID:", invoiceId);
  }, []);

  const navigate = useNavigate();

  useEffect(() => {
    loadInvoices();
  }, []);

  // Handle clicking outside of dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (openMenuId && !e.target.closest(".action-menu-container")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenuId]);

  const loadInvoices = async () => {
    try {
      setLoading(true);

      const res = await getRequest("InvoiceMaster/ListInvoice");

      if (res.status !== "OK") {
        return errorAlert("Error", res.message);
      }

      const cleanData = (res.result || []).map((i) => {
        const paid = i.paidAmount ?? i.PaidAmount ?? 0;
        const total = i.total ?? 0;
        const pending = total - paid;

        return {
          ...i,
          paidAmount: paid,
          pendingAmount: pending,
          status: paid === 0 ? "Pending" : paid < total ? "Partial" : "Paid",
        };
      });

      setData(cleanData);
      setFiltered(cleanData);
    } catch (err) {
      errorAlert("Error", err?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    applyFilter();
  }, [
    search,
    fromDate,
    toDate,
    minAmount,
    maxAmount,
    sortBy,
    statusFilter,
    staffFilter,
    monthFilter,
    data,
  ]);

  const applyFilter = () => {
    let temp = [...data];
    if (search) {
      temp = temp.filter(
        (i) =>
          i.invoiceNo?.toLowerCase().includes(search.toLowerCase()) ||
          i.clientName?.toLowerCase().includes(search.toLowerCase()) ||
          i.staffName?.toLowerCase().includes(search.toLowerCase()),
      );
    }
    if (fromDate)
      temp = temp.filter((i) => new Date(i.invoiceDate) >= new Date(fromDate));
    if (toDate)
      temp = temp.filter((i) => new Date(i.invoiceDate) <= new Date(toDate));
    if (minAmount)
      temp = temp.filter((i) => Number(i.total) >= Number(minAmount));
    if (maxAmount)
      temp = temp.filter((i) => Number(i.total) <= Number(maxAmount));

    if (statusFilter !== "All") {
      temp = temp.filter((i) => i.status === statusFilter);
    }
    if (staffFilter !== "All") {
      temp = temp.filter((i) => i.staffName === staffFilter);
    }
    if (monthFilter !== "All") {
      temp = temp.filter((i) => {
        const d = new Date(i.invoiceDate);
        return d.getMonth() + 1 === parseInt(monthFilter);
      });
    }

    temp.sort((a, b) => {
      if (sortBy === "Newest First")
        return new Date(b.invoiceDate) - new Date(a.invoiceDate);
      if (sortBy === "Oldest First")
        return new Date(a.invoiceDate) - new Date(b.invoiceDate);
      if (sortBy === "Highest Amount") return Number(b.total) - Number(a.total);
      if (sortBy === "Lowest Amount") return Number(a.total) - Number(b.total);
      return 0;
    });

    setFiltered(temp);

    setCurrentPage((prev) => {
      const maxPage = Math.ceil(temp.length / recordsPerPage);
      return prev > maxPage ? Math.max(1, maxPage) : prev;
    });
  };

  const resetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setMinAmount("");
    setMaxAmount("");
    setSortBy("Oldest First");
    setStatusFilter("All");
    setStaffFilter("All");
    setMonthFilter("All");
  };

  const staffNames = useMemo(() => {
    const names = new Set(data.map((i) => i.staffName).filter(Boolean));
    return Array.from(names);
  }, [data]);

  const stats = useMemo(() => {
    let total = 0;
    let collected = 0;
    let pending = 0;
    let partial = 0;

    filtered.forEach((i) => {
      const t = Number(i.total) || 0;
      const p = Number(i.paidAmount) || 0;
      const pend = Number(i.pendingAmount) || 0;

      total += t;
      collected += p;
      pending += pend;

      if (i.status === "Partial") {
        partial += pend;
      }
    });

    return {
      totalInvoices: filtered.length,
      totalBilled: total,
      collected,
      pending,
      partial,
    };
  }, [filtered]);

  /* =========================================================
     BULK SELECT LOGIC
     ========================================================= */

  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const currentRecords = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / recordsPerPage);

  const selectedOnPageCount = currentRecords.filter((i) =>
    selectedInvoices.includes(i.id),
  ).length;
  const isAllSelectedOnPage =
    currentRecords.length > 0 && selectedOnPageCount === currentRecords.length;
  const isIndeterminate =
    selectedOnPageCount > 0 && selectedOnPageCount < currentRecords.length;

  const handleSelectAll = () => {
    if (isAllSelectedOnPage || isIndeterminate) {
      const remaining = selectedInvoices.filter(
        (id) => !currentRecords.find((r) => r.id === id),
      );
      setSelectedInvoices(remaining);
    } else {
      const newSelections = new Set([
        ...selectedInvoices,
        ...currentRecords.map((r) => r.id),
      ]);
      setSelectedInvoices(Array.from(newSelections));
    }
  };
  const [paymentHistory, setPaymentHistory] = useState([]);
  const loadPaymentHistory = async (invoiceId) => {
    try {
      const res = await getRequest(`InvoicePayment/ListByInvoice/${invoiceId}`);

      if (res.status === "OK") {
        setPaymentHistory(res.result);
      } else {
        errorAlert("Error", res.message);
      }
    } catch (err) {
      errorAlert("Error", "Failed to load payment history");
    }
  };
  const toggleSelection = (id) => {
    if (selectedInvoices.includes(id)) {
      setSelectedInvoices(selectedInvoices.filter((item) => item !== id));
    } else {
      setSelectedInvoices([...selectedInvoices, id]);
    }
  };

  /* =========================================================
     REAL EXPORT & PRINT LOGIC
     ========================================================= */

  const generateReportHTML = (invoices) => {
    const dateStr = new Date().toLocaleDateString();
    return `
      <html>
        <head>
          <title>Invoice Records Report - ${dateStr}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1e293b; background: white; }
            .report-header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
            .report-header h1 { margin: 0; font-size: 26px; color: #3b82f6; }
            .report-header p { margin: 5px 0; color: #64748b; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #f8fafc; color: #3b82f6; border: 1px solid #e2e8f0; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
            td { border: 1px solid #e2e8f0; padding: 12px; font-size: 13px; color: #334155; }
            tr:nth-child(even) { background-color: #fcfcfc; }
            .status-Paid { color: #10b981; font-weight: bold; }
            .status-Pending { color: #ef4444; font-weight: bold; }
            .status-Partial { color: #f59e0b; font-weight: bold; }
            @media print { thead { display: table-header-group; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="report-header">
            <h1>Enterprise Invoice Listing</h1>
            <p>Generated on ${dateStr} | Total Records: ${invoices.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Invoice No</th>
                <th>Date</th>
                <th>Client Name</th>
                <th>Staff</th>
                <th>Status</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              ${invoices
                .map(
                  (i) => `
                <tr>
                  <td><b>${i.invoiceNo}</b></td>
                  <td>${new Date(i.invoiceDate).toLocaleDateString()}</td>
                  <td>${i.clientName}</td>
                  <td>${i.staffName}</td>
                  <td class="status-${i.status}">${i.status}</td>
                  <td>₹${Number(i.total).toLocaleString()}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
  };

  const getExportDataTarget = () => {
    if (exportScope === "page") return currentRecords;
    if (exportScope === "filtered") return filtered;
    return data;
  };

  const handlePrint = (recordsToPrint) => {
    if (recordsToPrint.length === 0)
      return errorAlert("Empty", "No data available to print.");
    const html = generateReportHTML(recordsToPrint);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleExportHTML = () => {
    const targetData = getExportDataTarget();
    if (targetData.length === 0)
      return errorAlert("Empty", "No data available to download.");

    setActionLoading(true);
    setTimeout(() => {
      const html = generateReportHTML(targetData);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_Report_${new Date().toISOString().split("T")[0]}.html`;
      link.click();
      URL.revokeObjectURL(url);
      setShowExportModal(false);
      setActionLoading(false);
      successAlert("Exported", "Report HTML/PDF file downloaded successfully.");
    }, 800);
  };

  const handleExportCSV = () => {
    const targetData = getExportDataTarget();
    if (targetData.length === 0)
      return errorAlert("Empty", "No data to download.");

    setActionLoading(true);
    setTimeout(() => {
      let csv = "Invoice No,Date,Client Name,Staff,Status,Total Amount\n";
      targetData.forEach((i) => {
        const client = i.clientName
          ? `"${i.clientName.replace(/"/g, '""')}"`
          : "";
        const staff = i.staffName ? `"${i.staffName.replace(/"/g, '""')}"` : "";
        csv += `${i.invoiceNo},${new Date(i.invoiceDate).toLocaleDateString()},${client},${staff},${i.status},${i.total}\n`;
      });
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Invoice_Report_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      setShowExportModal(false);
      setActionLoading(false);
      successAlert("Exported", "Invoice records downloaded as CSV.");
    }, 800);
  };

  /* ========================================================= */

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Invoice?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
    });

    if (result.isConfirmed) {
      try {
        setActionLoading(true);

        const res = await deleteRequest(`InvoiceMaster/DeleteInvoice/${id}`);

        if (res.status === "OK") {
          successAlert("Deleted!", "Invoice deleted.");
          loadInvoices();
        } else {
          errorAlert("Failed", res.result);
        }
      } catch (err) {
        errorAlert("Error", err.message);
      } finally {
        setActionLoading(false);
      }
    }
  };

  const getStatus = (i) => {
    if (i.paidAmount === 0) return "Pending";
    if (i.paidAmount < i.total) return "Partial";
    return "Paid";
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.length === 0) {
      return warningAlert(
        "Empty Selection",
        "Please select at least one invoice.",
      );
    }

    const result = await Swal.fire({
      title: `Delete ${selectedInvoices.length} Invoices?`,
      text: "This action will permanently remove all selected invoice records.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Yes, Delete All",
      customClass: { popup: "glassy-swal-popup" },
    });

    if (result.isConfirmed) {
      setActionLoading(true);
      let successCount = 0;
      let errorMsgs = [];

      try {
        const promises = selectedInvoices.map((id) =>
          deleteRequest(`InvoiceMaster/DeleteInvoice/${id}`),
        );
        const results = await Promise.allSettled(promises);

        results.forEach((res, index) => {
          if (res.status === "fulfilled" && res.value?.status === "OK") {
            successCount++;
          } else {
            errorMsgs.push(
              res.value?.message || res.value?.result || "Unknown error",
            );
          }
        });

        if (successCount === selectedInvoices.length) {
          successAlert("Deleted!", "Selected invoices deleted successfully.");
        } else {
          errorAlert(
            "Partial Success",
            `Deleted ${successCount} items. Errors: ${errorMsgs[0]}`,
          );
        }

        setSelectedInvoices([]);
        await loadInvoices();
      } catch (err) {
        errorAlert("Error", "Server connection failed during bulk delete.");
      } finally {
        setActionLoading(false);
      }
    }
  };

  const handleDuplicate = (invoice) => {
    navigate("/staff/invoice", { state: { duplicateData: invoice } });
  };

  const handleMarkPaid = (id) => {
    // Stub for marking paid
    successAlert("Success", "Invoice marked as paid. (Payment Record created)");
    setOpenMenuId(null);
  };

  const viewInvoice = (invoice) => {
    navigate("/staff/invoicepreview", {
      state: {
        id: invoice.id,
      },
    });
  };

  const openDrawer = (invoice, e) => {
    if (e.target.closest(".no-drawer-click")) return;

    setSelectedInvoiceForDrawer(invoice);
    setDrawerOpen(true);

    loadPaymentHistory(invoice.id); // 🔥 important
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  const handlePaymentNavigate = (invoice) => {
    if (!invoice?.id) {
      console.error("Invalid invoice for payment");
      return;
    }

    navigate("/staff/payments", {
      state: {
        invoiceId: invoice.id,
        invoiceData: invoice, // optional but useful
      },
    });
  };

  const getCTA = (inv) => {
    if (inv.pendingAmount === 0) {
      return {
        label: "Download Receipt",
        action: "receipt",
        color: "#10b981",
      };
    }

    if (inv.paidAmount === 0) {
      return {
        label: "Pay Now",
        action: "pay",
        color: "#ef4444",
      };
    }

    return {
      label: "Complete Payment",
      action: "pay",
      color: "#f59e0b",
    };
  };
  const cta = selectedInvoiceForDrawer
    ? getCTA(selectedInvoiceForDrawer)
    : null;
  const formatInvoiceMessage = (inv) => {
    const safe = (val) => Number(val || 0).toLocaleString();
    const days = getDaysPending(inv.invoiceDate);
    const progress = getProgress(inv.paidAmount, inv.total);

    // ✅ PAID CASE FIRST
    if (inv.pendingAmount === 0) {
      return `🧾 *INVOICE SUMMARY*

🔢 *Invoice:* ${inv.invoiceNo}
👤 *Client:* ${inv.clientName}

━━━━━━━━━━━━━━━
💰 *Total:* ₹${safe(inv.total)}
✅ *Paid:* ₹${safe(inv.paidAmount)}
📊 *Progress:* 100%
━━━━━━━━━━━━━━━

📊 *Status:* 🟢 Paid
📅 *Date:* ${new Date(inv.invoiceDate).toLocaleDateString("en-IN")}

🎉 Thank you! Payment received successfully.

🙏 We appreciate your business.
`;
    }

    // ❌ OTHER CASES (Pending / Partial)
    const status = inv.paidAmount === 0 ? "🔴 Pending" : "🟡 Partial";

    return `🧾 *INVOICE SUMMARY*

🔢 *Invoice:* ${inv.invoiceNo}
👤 *Client:* ${inv.clientName}

━━━━━━━━━━━━━━━
💰 *Total:* ₹${safe(inv.total)}
✅ *Paid:* ₹${safe(inv.paidAmount)}
⏳ *Pending:* ₹${safe(inv.pendingAmount)}
📊 *Progress:* ${progress}%
━━━━━━━━━━━━━━━

📊 *Status:* ${status}
📅 *Date:* ${new Date(inv.invoiceDate).toLocaleDateString("en-IN")}

⚠ *Pending Since:* ${days} days



👉 Kindly clear the pending amount to avoid delays.
`;
  };
  const sendWhatsApp = (inv) => {
    const text = encodeURIComponent(formatInvoiceMessage(inv));
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };
  const [messageType, setMessageType] = useState("whatsapp");

  const sendEmail = (inv) => {
    const subject = `Invoice ${inv.invoiceNo} - Payment Reminder`;
    const body = formatInvoiceMessage(inv);

    window.location.href = `mailto:${inv.clientEmail || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };
  const getDaysPending = (date) => {
    const today = new Date();
    const invoiceDate = new Date(date);
    const diff = Math.floor((today - invoiceDate) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getProgress = (paid, total) => {
    if (!total) return 0;
    return Math.round((paid / total) * 100);
  };
  return (
    <>
      <GlobalLoader isLoading={loading} />
      <PageTransition>
        <PageWrapper className="staff-page">
          <HeaderSection>
            <div className="title-area">
              <motion.h1
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
              >
                My Invoices
              </motion.h1>
              <p>Review and manage all enterprise billing records</p>
            </div>
            <button
              className="staff-btn secondary action-btn"
              onClick={loadInvoices}
              disabled={loading || actionLoading}
              style={{ width: "auto", padding: "8px 16px", boxShadow: "none" }}
            >
              <RefreshCcw
                size={16}
                className={loading || actionLoading ? "spin" : ""}
              />
              <span
                className="d-none d-sm-inline"
                style={{ marginLeft: "8px" }}
              >
                Refresh
              </span>
            </button>
          </HeaderSection>

          <StatsGrid
            as={motion.div}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <GlassCard variants={itemVariants}>
              <StatItem color="#3b82f6" bg="rgba(59, 130, 246, 0.15)">
                <div className="icon-box">
                  <FileText size={24} />
                </div>
                <div className="details">
                  <span>Total Invoices</span>
                  <h3>
                    <CountUp end={stats.total} duration={1.5} separator="," />
                  </h3>
                </div>
              </StatItem>
            </GlassCard>

            <GlassCard variants={itemVariants} $glowColor="#10b981">
              <StatItem color="#10b981" bg="rgba(16, 185, 129, 0.15)">
                <div className="icon-box">
                  <Wallet size={24} />
                </div>
                <div className="details">
                  <span>Total Revenue</span>
                  <h3>
                    <CountUp
                      end={stats.revenue}
                      duration={1.5}
                      prefix="₹"
                      separator=","
                      decimals={2}
                    />
                  </h3>
                </div>
              </StatItem>
            </GlassCard>

            <GlassCard variants={itemVariants} $glowColor="#ef4444">
              <StatItem color="#ef4444" bg="rgba(239, 68, 68, 0.15)">
                <div className="icon-box">
                  <TrendingDown size={24} />
                </div>
                <div className="details">
                  <span>Pending Amount</span>
                  <h3>
                    <CountUp
                      end={stats.pending}
                      duration={1.5}
                      prefix="₹"
                      separator=","
                      decimals={2}
                    />
                  </h3>
                </div>
              </StatItem>
            </GlassCard>

            <GlassCard variants={itemVariants} $glowColor="#06b6d4">
              <StatItem color="#06b6d4" bg="rgba(6, 182, 212, 0.15)">
                <div className="top-row">
                  <div className="icon-box">
                    <Download size={24} />
                  </div>
                  <div className="details">
                    <span>Export Data</span>
                    <p
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        margin: 0,
                        fontWeight: 500,
                      }}
                    >
                      PDF / CSV / Excel
                    </p>
                  </div>
                </div>
                <div className="action-col">
                  <button
                    className="btn-report"
                    onClick={() => setShowExportModal(true)}
                  >
                    Export Menu
                  </button>
                </div>
              </StatItem>
            </GlassCard>
          </StatsGrid>

          <FilterCard initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SearchWrapper>
              <Search size={18} />
              <input
                type="text"
                placeholder="Search by invoice, client or staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </SearchWrapper>

            <FilterGroup>
              <div className="filter-input">
                <Calendar size={14} />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
                <span style={{ margin: "0 5px", color: "var(--text-muted)" }}>
                  -
                </span>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>

              <div className="filter-input">
                <IndianRupee size={14} />
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                />
                <span style={{ margin: "0 5px", color: "var(--text-muted)" }}>
                  -
                </span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                />
              </div>

              <div className="filter-input">
                <CheckCircle size={14} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Partial">Partial</option>
                </select>
              </div>

              <div className="filter-input">
                <Users size={14} />
                <select
                  value={staffFilter}
                  onChange={(e) => setStaffFilter(e.target.value)}
                >
                  <option value="All">All Staff</option>
                  {staffNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-input">
                <CalendarDays size={14} />
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                >
                  <option value="All">All Months</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(0, i).toLocaleString("default", {
                        month: "short",
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-input">
                <Filter size={14} />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="Oldest First">Sort: Oldest First</option>
                  <option value="Newest First">Sort: Newest First</option>
                  <option value="Highest Amount">Amount: High-Low</option>
                  <option value="Lowest Amount">Amount: Low-High</option>
                </select>
              </div>

              <PremiumBtn
                className="secondary"
                style={{
                  padding: "8px 15px",
                  height: "40px",
                  borderRadius: "10px",
                }}
                onClick={resetFilters}
              >
                <RotateCcw size={16} /> Reset
              </PremiumBtn>
            </FilterGroup>
          </FilterCard>

          <TableWrapper
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "40px", textAlign: "center" }}>
                      <CheckboxWrap
                        className="no-drawer-click"
                        $checked={isAllSelectedOnPage || isIndeterminate}
                        $disabled={actionLoading}
                        onClick={!actionLoading ? handleSelectAll : undefined}
                      >
                        {isIndeterminate ? (
                          <MinusSquare size={18} />
                        ) : isAllSelectedOnPage ? (
                          <CheckSquare size={18} />
                        ) : (
                          <Square size={18} />
                        )}
                      </CheckboxWrap>
                    </th>
                    <th>Invoice No</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Total Value</th>
                    <th>Staff</th>
                    <th>Payment Status</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonTableRows rows={5} columns={8} />
                  ) : currentRecords.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: "4rem 0" }}>
                        <PremiumEmptyState
                          icon={FileText}
                          title="No Invoices Found"
                          subtitle="No billing records match your current filters or search query."
                        />
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((i, idx) => {
                      const isSelected = selectedInvoices.includes(i.id);
                      return (
                        <motion.tr
                          key={i.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          style={{
                            cursor: "pointer",
                            background: isSelected
                              ? "rgba(59, 130, 246, 0.05)"
                              : "transparent",
                          }}
                          onClick={(e) => openDrawer(i, e)}
                        >
                          <td style={{ textAlign: "center" }}>
                            <CheckboxWrap
                              className="no-drawer-click"
                              $checked={isSelected}
                              $disabled={actionLoading}
                              onClick={() =>
                                !actionLoading && toggleSelection(i.id)
                              }
                            >
                              {isSelected ? (
                                <CheckSquare size={18} />
                              ) : (
                                <Square size={18} />
                              )}
                            </CheckboxWrap>
                          </td>
                          <td>
                            <span
                              className="neon-text-blue"
                              style={{ fontWeight: 800 }}
                            >
                              {i.invoiceNo}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: 600 }}>
                              {new Date(i.invoiceDate).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700 }}>
                              {i.clientName}
                            </div>
                          </td>
                          <td>
                            <span style={{ color: "#10b981", fontWeight: 800 }}>
                              ₹{i.total.toLocaleString()}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                background: "rgba(59,130,246,0.1)",
                                color: "#38bdf8",
                                padding: "4px 8px",
                                borderRadius: "6px",
                                fontSize: "11px",
                                fontWeight: 700,
                              }}
                            >
                              {i.staffName}
                            </span>
                          </td>
                          <td>
                            <StatusBadge $status={i.status}>
                              {i.status === "Paid" && <CheckCircle size={12} />}
                              {i.status === "Pending" && (
                                <AlertCircle size={12} />
                              )}
                              {i.status}
                            </StatusBadge>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <ActionMenuWrap className="no-drawer-click action-menu-container">
                              <ActionMenuBtn
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === i.id ? null : i.id,
                                  )
                                }
                              >
                                <MoreVertical size={18} />
                              </ActionMenuBtn>

                              <AnimatePresence>
                                {openMenuId === i.id && (
                                  <DropdownMenu
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <DropdownItem
                                      onClick={() => viewInvoice(i.id)}
                                    >
                                      <Eye size={14} /> View Full Invoice
                                    </DropdownItem>
                                    <DropdownItem
                                      onClick={() => handlePrint([i])}
                                    >
                                      <Printer size={14} /> Print Document
                                    </DropdownItem>
                                    <DropdownItem
                                      onClick={() => handleDuplicate(i)}
                                    >
                                      <Copy size={14} /> Duplicate to New
                                    </DropdownItem>
                                    {i.status !== "Paid" && (
                                      <DropdownItem
                                        onClick={() => handleMarkPaid(i.id)}
                                      >
                                        <CheckCircle size={14} /> Mark as Paid
                                      </DropdownItem>
                                    )}
                                    <div
                                      style={{
                                        height: "1px",
                                        background: "var(--border-custom)",
                                        margin: "4px 0",
                                      }}
                                    />
                                    <DropdownItem
                                      $danger
                                      onClick={() => handleDelete(i.id)}
                                    >
                                      <Trash2 size={14} /> Delete Record
                                    </DropdownItem>
                                  </DropdownMenu>
                                )}
                              </AnimatePresence>
                            </ActionMenuWrap>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar>
              <div className="info d-none d-sm-block">
                Showing <b>{filtered.length > 0 ? indexOfFirst + 1 : 0}</b> to{" "}
                <b>{Math.min(indexOfLast, filtered.length)}</b> of{" "}
                <b>{filtered.length}</b> records
              </div>
              <div className="controls">
                <PageBtn
                  disabled={currentPage === 1 || actionLoading}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  <ChevronLeft size={18} />
                </PageBtn>
                {[...Array(totalPages)].map((_, i) => {
                  // Logic to show limited pages
                  if (
                    totalPages > 5 &&
                    (i < currentPage - 2 || i > currentPage)
                  ) {
                    if (i === 0 || i === totalPages - 1)
                      return (
                        <PageBtn
                          key={i}
                          disabled={actionLoading}
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </PageBtn>
                      );
                    if (i === currentPage - 3 || i === currentPage + 1)
                      return (
                        <span
                          key={i}
                          style={{
                            color: "var(--text-muted)",
                            padding: "0 5px",
                          }}
                        >
                          ...
                        </span>
                      );
                    return null;
                  }
                  return (
                    <PageBtn
                      key={i}
                      $active={currentPage === i + 1}
                      disabled={actionLoading}
                      onClick={() => setCurrentPage(i + 1)}
                      className="d-none d-md-flex"
                    >
                      {i + 1}
                    </PageBtn>
                  );
                })}
                <PageBtn
                  disabled={
                    currentPage === totalPages ||
                    totalPages === 0 ||
                    actionLoading
                  }
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  <ChevronRight size={18} />
                </PageBtn>
              </div>
            </PaginationBar>
          </TableWrapper>

          {/* FLOATING BULK ACTION BAR */}
          <AnimatePresence>
            {selectedInvoices.length > 0 && (
              <FloatingActionBar
                initial={{ y: 100, opacity: 0, x: "-50%" }}
                animate={{ y: 0, opacity: 1, x: "-50%" }}
                exit={{ y: 100, opacity: 0, x: "-50%" }}
              >
                <div className="selected-count">
                  {selectedInvoices.length} Selected
                </div>
                <PremiumBtn
                  className="secondary"
                  disabled={actionLoading}
                  onClick={() =>
                    handlePrint(
                      data.filter((i) => selectedInvoices.includes(i.id)),
                    )
                  }
                  style={{ padding: "8px 16px" }}
                >
                  <Printer size={16} /> Print All
                </PremiumBtn>
                <PremiumBtn
                  className="danger-outline"
                  $pulse={actionLoading}
                  disabled={actionLoading}
                  onClick={handleBulkDelete}
                  style={{
                    padding: "8px 16px",
                    background: "rgba(239,68,68,0.1)",
                  }}
                >
                  {actionLoading ? (
                    <RefreshCcw size={16} className="spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                  {actionLoading ? "Deleting..." : "Delete All"}
                </PremiumBtn>
                <button
                  onClick={() => !actionLoading && setSelectedInvoices([])}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: actionLoading ? "not-allowed" : "pointer",
                    padding: "8px",
                  }}
                >
                  <X size={18} />
                </button>
              </FloatingActionBar>
            )}
          </AnimatePresence>

          {/* INVOICE SUMMARY DRAWER */}
          <AnimatePresence>
            {drawerOpen && selectedInvoiceForDrawer && (
              <>
                <DrawerOverlay
                  onClick={() => setDrawerOpen(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
                <DrawerContent
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                >
                  <div className="drawer-header">
                    <h3>Invoice Summary</h3>
                    <button onClick={() => setDrawerOpen(false)}>
                      <X size={20} />
                    </button>
                  </div>
                  <div className="drawer-body">
                    <div style={{ textAlign: "center", marginBottom: "10px" }}>
                      <div
                        style={{
                          fontSize: "24px",
                          fontWeight: 900,
                          color: "var(--primary)",
                        }}
                      >
                        {selectedInvoiceForDrawer.invoiceNo}
                      </div>
                      <StatusBadge
                        $status={selectedInvoiceForDrawer.status}
                        style={{ marginTop: "10px" }}
                      >
                        {selectedInvoiceForDrawer.status}
                      </StatusBadge>
                    </div>
                    <div
                      style={{
                        background: "var(--bg-light-custom)",
                        padding: "20px",
                        borderRadius: "16px",
                        border: "1px solid var(--border-custom)",
                      }}
                    >
                      <div className="info-group">
                        <label>Client Name</label>
                        <span>{selectedInvoiceForDrawer.clientName}</span>
                      </div>
                      <hr
                        style={{
                          borderColor: "var(--border-custom)",
                          margin: "15px 0",
                        }}
                      />
                      <div className="info-group">
                        <label>Date Issued</label>
                        <span>
                          {new Date(
                            selectedInvoiceForDrawer.invoiceDate,
                          ).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                      <hr
                        style={{
                          borderColor: "var(--border-custom)",
                          margin: "15px 0",
                        }}
                      />
                      <div className="info-group">
                        <label>Prepared By</label>
                        <span>{selectedInvoiceForDrawer.staffName}</span>
                      </div>
                    </div>
                    <div
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(59,130,246,0.1), rgba(6,182,212,0.1))",
                        padding: "20px",
                        borderRadius: "16px",
                        border: "1px solid rgba(59,130,246,0.3)",
                      }}
                    >
                      <div
                        className="info-group"
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: "10px",
                        }}
                      >
                        <label style={{ color: "var(--text)" }}>
                          Gross Amount
                        </label>
                        <span style={{ fontSize: "14px" }}>
                          ₹
                          {selectedInvoiceForDrawer.grossAmount?.toLocaleString()}
                        </span>
                      </div>
                      <div
                        className="info-group"
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginBottom: "15px",
                        }}
                      >
                        <label style={{ color: "var(--text)" }}>
                          Total GST
                        </label>
                        <span style={{ fontSize: "14px" }}>
                          ₹
                          {selectedInvoiceForDrawer.gstAmount?.toLocaleString()}
                        </span>
                      </div>
                      <div
                        className="info-group"
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <label>Paid Amount</label>
                        <span>
                          ₹
                          {selectedInvoiceForDrawer.paidAmount?.toLocaleString()}
                        </span>
                      </div>

                      <div
                        className="info-group"
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                        }}
                      >
                        <label>Pending Amount</label>
                        <span style={{ color: "#ef4444" }}>
                          ₹
                          {selectedInvoiceForDrawer.pendingAmount?.toLocaleString()}
                        </span>
                      </div>
                      <div
                        className="info-group"
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <label
                          style={{ color: "var(--primary)", fontSize: "14px" }}
                        >
                          Grand Total
                        </label>
                        <span
                          style={{
                            fontSize: "24px",
                            color: "var(--primary)",
                            fontWeight: 900,
                          }}
                        >
                          ₹{selectedInvoiceForDrawer.total?.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        padding: "16px",
                        borderRadius: "16px",
                        background:
                          selectedInvoiceForDrawer.status === "Paid"
                            ? "rgba(16,185,129,0.1)"
                            : selectedInvoiceForDrawer.status === "Partial"
                              ? "rgba(245,158,11,0.1)"
                              : "rgba(239,68,68,0.1)",
                        border: "1px solid var(--border-custom)",
                      }}
                    >
                      {/* STATUS MESSAGE */}
                      <div
                        style={{
                          fontWeight: 800,
                          fontSize: "14px",
                          marginBottom: "8px",
                        }}
                      >
                        {selectedInvoiceForDrawer.status === "Paid" &&
                          "✅ Fully Paid"}
                        {selectedInvoiceForDrawer.status === "Partial" &&
                          `⚠ ₹${selectedInvoiceForDrawer.pendingAmount.toLocaleString()} Pending`}
                        {selectedInvoiceForDrawer.status === "Pending" &&
                          "🚨 No Payment Received"}
                      </div>

                      {/* PROGRESS BAR */}
                      <div
                        style={{
                          height: "6px",
                          background: "var(--border-custom)",
                          borderRadius: "10px",
                          overflow: "hidden",
                          marginBottom: "12px",
                        }}
                      >
                        <div
                          style={{
                            width: `${
                              (selectedInvoiceForDrawer.paidAmount /
                                selectedInvoiceForDrawer.total) *
                              100
                            }%`,
                            height: "100%",
                            background:
                              selectedInvoiceForDrawer.status === "Paid"
                                ? "#10b981"
                                : selectedInvoiceForDrawer.status === "Partial"
                                  ? "#f59e0b"
                                  : "#ef4444",
                            transition: "0.5s",
                          }}
                        />
                      </div>

                      {/* QUICK ACTIONS */}
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                        }}
                      >
                        {/* 🔵 PRIMARY ACTION */}
                        <PremiumBtn
                          className="primary"
                          style={{
                            width: "100%",
                            background:
                              messageType === "whatsapp"
                                ? "#25D366"
                                : "#3b82f6",
                            fontSize: "15px",
                            fontWeight: 800,
                          }}
                          onClick={() => {
                            if (messageType === "whatsapp") {
                              sendWhatsApp(selectedInvoiceForDrawer);
                            } else {
                              sendEmail(selectedInvoiceForDrawer);
                            }
                          }}
                        >
                          {messageType === "whatsapp"
                            ? "📲 Send via WhatsApp"
                            : "📧 Send via Email"}
                        </PremiumBtn>
                        {/* 🟦 CHANNEL SWITCH */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            gap: "8px",
                          }}
                        >
                          {["whatsapp", "email"].map((type) => (
                            <button
                              key={type}
                              onClick={() => setMessageType(type)}
                              style={{
                                padding: "6px 12px",
                                borderRadius: "999px",
                                border: "1px solid var(--border-custom)",
                                background:
                                  messageType === type
                                    ? "rgba(59,130,246,0.15)"
                                    : "transparent",
                                color:
                                  messageType === type
                                    ? "#3b82f6"
                                    : "var(--text-muted)",
                                fontWeight: 700,
                                fontSize: "12px",
                                cursor: "pointer",
                              }}
                            >
                              {type === "whatsapp" ? "WhatsApp" : "Email"}
                            </button>
                          ))}
                        </div>{" "}
                        <div style={{ display: "flex", gap: "10px" }}>
                          <PremiumBtn
                            className="secondary"
                            style={{ flex: 1 }}
                            onClick={async () => {
                              try {
                                const text = formatInvoiceMessage(
                                  selectedInvoiceForDrawer,
                                );

                                await navigator.clipboard.writeText(text);

                                successAlert(
                                  "Copied",
                                  "Invoice details copied successfully",
                                );
                              } catch (err) {
                                console.error(err);

                                // fallback for older browsers
                                const text = formatInvoiceMessage(
                                  selectedInvoiceForDrawer,
                                );

                                const textarea =
                                  document.createElement("textarea");
                                textarea.value = text;
                                document.body.appendChild(textarea);
                                textarea.select();
                                document.execCommand("copy");
                                document.body.removeChild(textarea);

                                successAlert(
                                  "Copied",
                                  "Fallback copy successful",
                                );
                              }
                            }}
                          >
                            Copy Info
                          </PremiumBtn>
                        </div>
                      </div>
                    </div>
                    {selectedInvoiceForDrawer?.pendingAmount > 0 && cta && (
                      <PremiumBtn
                        className="primary"
                        style={{ background: cta.color, flex: 1 }}
                        onClick={(e) => {
                          e.stopPropagation(); // 🔥 IMPORTANT (prevents drawer interference)

                          if (cta.action === "pay") {
                            handlePaymentNavigate(selectedInvoiceForDrawer);
                          } else {
                            window.open(
                              `/receipt/${selectedInvoiceForDrawer.id}`,
                            );
                          }
                        }}
                      >
                        {cta.label}
                      </PremiumBtn>
                    )}{" "}
                  </div>

                  <div style={{ marginTop: "10px" }}>
                    <h4
                      style={{
                        fontWeight: 800,
                        marginBottom: "10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      Payment History
                      <span
                        style={{ fontSize: "12px", color: "var(--text-muted)" }}
                      >
                        {paymentHistory.length} records
                      </span>
                    </h4>

                    <div
                      style={{
                        maxHeight: "180px",
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        paddingRight: "5px",
                      }}
                    >
                      {paymentHistory.length === 0 ? (
                        <div
                          style={{
                            textAlign: "center",
                            padding: "20px",
                            background: "var(--bg-light-custom)",
                            borderRadius: "12px",
                            border: "1px dashed var(--border-custom)",
                            color: "var(--text-muted)",
                            fontWeight: 600,
                          }}
                        >
                          No payments yet
                        </div>
                      ) : (
                        paymentHistory.map((p) => (
                          <div
                            key={p.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              padding: "12px 14px",
                              borderRadius: "14px",
                              background:
                                "linear-gradient(135deg, rgba(59,130,246,0.08), rgba(6,182,212,0.08))",
                              border: "1px solid rgba(59,130,246,0.2)",
                              backdropFilter: "blur(10px)",
                              transition: "0.3s",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform =
                                "translateY(-3px)";
                              e.currentTarget.style.boxShadow =
                                "0 8px 25px rgba(59,130,246,0.2)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "none";
                              e.currentTarget.style.boxShadow = "none";
                            }}
                          >
                            {/* LEFT */}
                            <div>
                              <div
                                style={{
                                  fontWeight: 800,
                                  fontSize: "15px",
                                  color: "#10b981",
                                }}
                              >
                                ₹{p.amount.toLocaleString()}
                              </div>

                              <div
                                style={{
                                  fontSize: "11px",
                                  color: "var(--text-muted)",
                                  marginTop: "2px",
                                }}
                              >
                                {new Date(p.paymentDate).toLocaleDateString(
                                  "en-IN",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </div>
                            </div>

                            {/* RIGHT */}
                            <div style={{ textAlign: "right" }}>
                              <div
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  color: "#38bdf8",
                                }}
                              >
                                {p.staffName}
                              </div>

                              <div
                                style={{
                                  fontSize: "10px",
                                  color: "var(--text-muted)",
                                }}
                              >
                                Ref: {p.referenceNo || "—"}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="drawer-footer">
                    <PremiumBtn
                      className="primary"
                      style={{ width: "100%" }}
                      onClick={() => viewInvoice(selectedInvoiceForDrawer)}
                    >
                      View Full Details
                    </PremiumBtn>
                  </div>
                </DrawerContent>
              </>
            )}
          </AnimatePresence>

          {/* EXPORT MODAL */}
          <AnimatePresence>
            {showExportModal && (
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
                    <h2 style={{ fontSize: "24px" }}>
                      <Download size={28} color="#0ea5e9" /> Advanced Export
                    </h2>
                  </ModalHeader>
                  <div style={{ padding: "0 30px", textAlign: "left" }}>
                    <p
                      style={{
                        color: "var(--text-muted)",
                        marginBottom: "20px",
                        textAlign: "center",
                      }}
                    >
                      Configure your export settings below.
                    </p>

                    <div style={{ marginBottom: "20px" }}>
                      <label
                        style={{
                          fontSize: "12px",
                          fontWeight: 800,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          marginBottom: "10px",
                          display: "block",
                        }}
                      >
                        Data Scope
                      </label>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <label
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "var(--bg-light-custom)",
                            padding: "12px",
                            borderRadius: "10px",
                            border: `1px solid ${exportScope === "page" ? "var(--primary)" : "var(--border-custom)"}`,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="radio"
                            name="scope"
                            value="page"
                            checked={exportScope === "page"}
                            onChange={(e) => setExportScope(e.target.value)}
                          />
                          <span style={{ fontSize: "13px", fontWeight: 600 }}>
                            Current Page
                          </span>
                        </label>
                        <label
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "var(--bg-light-custom)",
                            padding: "12px",
                            borderRadius: "10px",
                            border: `1px solid ${exportScope === "filtered" ? "var(--primary)" : "var(--border-custom)"}`,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="radio"
                            name="scope"
                            value="filtered"
                            checked={exportScope === "filtered"}
                            onChange={(e) => setExportScope(e.target.value)}
                          />
                          <span style={{ fontSize: "13px", fontWeight: 600 }}>
                            Filtered ({filtered.length})
                          </span>
                        </label>
                        <label
                          style={{
                            flex: 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            background: "var(--bg-light-custom)",
                            padding: "12px",
                            borderRadius: "10px",
                            border: `1px solid ${exportScope === "all" ? "var(--primary)" : "var(--border-custom)"}`,
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="radio"
                            name="scope"
                            value="all"
                            checked={exportScope === "all"}
                            onChange={(e) => setExportScope(e.target.value)}
                          />
                          <span style={{ fontSize: "13px", fontWeight: 600 }}>
                            All Data
                          </span>
                        </label>
                      </div>
                    </div>

                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: 800,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        marginBottom: "10px",
                        display: "block",
                      }}
                    >
                      Export Format
                    </label>
                    <div
                      style={{
                        display: "flex",
                        gap: "15px",
                        justifyContent: "center",
                        marginBottom: "20px",
                      }}
                    >
                      <PremiumBtn
                        className="secondary"
                        style={{
                          flex: 1,
                          height: "60px",
                          flexDirection: "column",
                          gap: "5px",
                        }}
                        onClick={handleExportHTML}
                        disabled={actionLoading}
                      >
                        <FileText size={20} color="#3b82f6" />
                        <span style={{ fontSize: "11px" }}>PDF Report</span>
                      </PremiumBtn>
                      <PremiumBtn
                        className="secondary"
                        style={{
                          flex: 1,
                          height: "60px",
                          flexDirection: "column",
                          gap: "5px",
                        }}
                        onClick={handleExportCSV}
                        disabled={actionLoading}
                      >
                        <FileSpreadsheet size={20} color="#10b981" />
                        <span style={{ fontSize: "11px" }}>Excel CSV</span>
                      </PremiumBtn>
                    </div>
                  </div>
                  <ModalFooter>
                    <PremiumBtn
                      className="danger-outline"
                      onClick={() => setShowExportModal(false)}
                      style={{ width: "100%" }}
                      disabled={actionLoading}
                    >
                      Cancel
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
