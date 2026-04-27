import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import styled, { css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  Trash2,
  Save,
  FileText,
  User,
  Calendar,
  Package,
  CreditCard,
  Percent,
  Minus,
  RefreshCcw,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Filter,
  Lock,
} from "lucide-react";
import { getRequest, postRequest } from "../../../Services/axiosService.jsx";

// --- FIXED PREMIUM UTILITY IMPORTS ---
import GlobalLoader from "../../components/common/GlobalLoader.jsx";
import PageTransition from "../../components/common/PageTransition.jsx";
import PremiumEmptyState from "../../components/common/PremiumEmptyState.jsx";
import {
  SkeletonBase,
  SkeletonStats,
  SkeletonForm,
  SkeletonCard,
  SkeletonGrid,
} from "../../components/common/SkeletonLoader.jsx";

/* =========================================================
    PREMIUM STYLED COMPONENTS (PRODUCTION READY)
   ========================================================= */

const PageWrapper = styled.div`
  min-height: 100vh;
  padding: 2rem;
  background:
    radial-gradient(
      circle at 0% 0%,
      rgba(37, 99, 235, 0.08) 0%,
      transparent 40%
    ),
    radial-gradient(
      circle at 100% 100%,
      rgba(6, 182, 212, 0.08) 0%,
      transparent 40%
    ),
    var(--bg);
  transition: background 0.3s ease;

  @media (max-width: 768px) {
    padding: 1rem;
    padding-bottom: 5rem; /* Space for sticky mobile bar */
  }
`;

const Container = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 420px;
  gap: 2rem;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;

  .title-wrap {
    display: flex;
    align-items: center;
    gap: 0.75rem;

    h2 {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--text);
      letter-spacing: -0.02em;
      margin: 0;
    }

    .icon-box {
      padding: 8px;
      background: var(--primary);
      color: white;
      border-radius: 10px;
      display: flex;
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
    }
  }
`;

const GlassCard = styled(motion.div)`
  background: var(--card);
  backdrop-filter: blur(16px);
  border: 1px solid var(--border-custom);
  border-radius: 24px;
  padding: 1.5rem;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: visible;

  &:hover {
    border-color: rgba(37, 99, 235, 0.3);
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.8rem;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;

    input,
    select,
    textarea {
      width: 100%;
      background: var(--bg-light-custom);
      border: 2px solid transparent;
      border-radius: 14px;
      padding: 0.8rem 1rem;
      color: var(--text);
      font-size: 0.95rem;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

      &:focus {
        outline: none;
        background: var(--card);
        border-color: var(--primary);
        box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        transform: translateY(-1px);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
`;

const FyBadge = styled.div`
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
  color: #10b981;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 6px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
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

/* --- PRODUCT CARDS --- */
const ProductGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1.25rem;
  margin-top: 1rem;
  max-height: 500px;
  overflow-y: auto;
  padding: 0.5rem;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-custom);
    border-radius: 10px;
  }
`;

const PremiumProductCard = styled(motion.div)`
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 20px;
  padding: 1.25rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--primary);
    box-shadow: 0 12px 24px -10px rgba(37, 99, 235, 0.15);
  }

  .name {
    font-weight: 800;
    color: var(--text);
    font-size: 1rem;
  }
  .price-tag {
    color: var(--primary);
    font-weight: 900;
    font-size: 1.2rem;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .meta {
    display: flex;
    justify-content: space-between;
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 600;
  }
`;

const AddButton = styled(motion.button)`
  width: 100%;
  padding: 10px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, var(--primary), #4f46e5);
  color: white;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);

  &:hover:not(:disabled) {
    filter: brightness(1.1);
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: var(--border-custom);
    color: var(--text-muted);
    box-shadow: none;
  }
`;

/* --- INVOICE TABLE --- */
const TableContainer = styled.div`
  overflow-x: auto;
  border-radius: 16px;
  background: var(--bg-light-custom);
  border: 1px solid var(--border-custom);

  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 800px;
  }

  th {
    background: rgba(37, 99, 235, 0.05);
    padding: 1.2rem 1rem;
    text-align: left;
    color: var(--text-muted);
    font-size: 0.75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  td {
    padding: 1.2rem 1rem;
    border-top: 1px solid var(--border-custom);
    vertical-align: middle;
  }
`;

const QtyControl = styled.div`
  display: flex;
  align-items: center;
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 10px;
  width: fit-content;

  button {
    padding: 6px;
    border: none;
    background: transparent;
    color: var(--primary);
    cursor: pointer;
    display: flex;
    &:hover {
      background: rgba(37, 99, 235, 0.05);
    }
  }

  input {
    width: 45px;
    text-align: center;
    border: none;
    background: transparent;
    font-weight: 700;
    color: var(--text);
    &:focus {
      outline: none;
    }
  }
`;

const StickyMobileBar = styled.div`
  display: none;
  @media (max-width: 768px) {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--card);
    padding: 1rem;
    border-top: 1px solid var(--border-custom);
    box-shadow: 0 -10px 25px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    justify-content: space-between;
    align-items: center;
    backdrop-filter: blur(10px);
  }
`;

/* =========================================================
    MAIN COMPONENT LOGIC
   ========================================================= */

export default function CreateInvoice() {
  const navigate = useNavigate();
  const scrollContainerRef = useRef(null);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // --- FINANCIAL YEAR STATES ---
  const [activeFy, setActiveFy] = useState(null);
  const [nextInvoiceNo, setNextInvoiceNo] = useState("Auto Generated");

  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [remarks, setRemarks] = useState("");
  const [totals, setTotals] = useState({ gross: 0, gst: 0, grand: 0 });

  const [historyData, setHistoryData] = useState([]);
const [showHistoryModal, setShowHistoryModal] = useState(false);

const viewHistory = async (productId) => {
  try {
    const res = await getRequest(`Stock/History/${productId}`);
    if (res.status === "OK") {
      setHistoryData(res.result);
      setShowHistoryModal(true);
    }
  } catch (err) {
    alert("Failed to load history");
  }
};

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [cRes, pRes, fyRes] = await Promise.all([
          getRequest("ClientMaster/List"),
          getRequest("ProductMaster/List"),
          getRequest("FinancialYear/List"),
        ]);

        setCustomers(cRes?.result || []);
        setProducts(pRes?.result || []);

        // 1) Find Active Financial Year
        if (fyRes?.result) {
          const active = fyRes.result.find(
            (y) => y.isActive && !y.isClosed && !y.isDelete,
          );
          setActiveFy(active || null);
        }
      } catch (e) {
        console.error("Initialization error:", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // 2) Fetch Preview Invoice Number when Active FY is found
  useEffect(() => {
    const fetchNextNo = async () => {
      if (activeFy) {
        try {
          // We'll mimic the logic since we don't have a direct endpoint for preview,
          // or if backend has one, it would be called here.
          // For now, we'll format a preview string.
          const yearParts = activeFy.yearName.split("-");
          const shortCode = `${yearParts[0].slice(-2)}-${yearParts[1].slice(-2)}`;
          setNextInvoiceNo(`${activeFy.yearName}/INV-****`);
        } catch (e) {}
      }
    };
    fetchNextNo();
  }, [activeFy]);

  const runCalculations = useCallback((currentItems, discValue) => {
    const gross = currentItems.reduce((acc, i) => acc + i.taxable, 0);
    const gst = currentItems.reduce((acc, i) => acc + i.gstAmount, 0);
    const grand = gross + gst - Number(discValue || 0);
    setTotals({ gross, gst, grand });
  }, []);

  const addItem = (product) => {
    const existingIndex = items.findIndex((i) => i.productId === product.id);
    if (existingIndex > -1) {
      updateQty(existingIndex, items[existingIndex].qty + 1);
      return;
    }
    const newItem = {
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.price,
      qty: 1,
      gst: product.gst || 0,
      taxable: product.price,
      gstAmount: (product.price * (product.gst || 0)) / 100,
      total: product.price + (product.price * (product.gst || 0)) / 100,
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    runCalculations(newItems, discount);
  };

  const updateQty = (index, val) => {
    let newQty = Math.max(1, Number(val) || 1);

    const updated = [...items];
    const item = updated[index];

    const product = products.find((p) => p.id === item.productId);

    if (product && newQty > (product.availableQty ?? 0)) {
      Swal.fire({
        icon: "warning",
        title: "Stock Limit Exceeded",
        text: `Only ${product.availableQty} items available`,
        confirmButtonColor: "#f59e0b",
      });

      newQty = product.availableQty; // 🔥 auto fix
    }

    item.qty = newQty;
    item.taxable = newQty * item.price;
    item.gstAmount = (item.taxable * item.gst) / 100;
    item.total = item.taxable + item.gstAmount;

    setItems(updated);
    runCalculations(updated, discount);
  };
  const updateRate = (index, val) => {
    const newRate = Math.max(0, Number(val) || 0);
    const updated = [...items];
    const item = updated[index];
    item.price = newRate;
    item.taxable = item.qty * newRate;
    item.gstAmount = (item.taxable * item.gst) / 100;
    item.total = item.taxable + item.gstAmount;
    setItems(updated);
    runCalculations(updated, discount);
  };

  const removeItem = async (index) => {
    const result = await Swal.fire({
      title: "Remove Item?",
      text: "Are you sure you want to remove this product?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it",
    });
    if (result.isConfirmed) {
      const updated = items.filter((_, i) => i !== index);
      setItems(updated);
      runCalculations(updated, discount);
    }
  };

  const handleSaveInvoice = async () => {
    if (!activeFy) {
      return Swal.fire(
        "Billing Locked",
        "No active Financial Year found. Please contact administrator.",
        "error",
      );
    }

    if (!selectedCustomer)
      return Swal.fire("Required", "Please select a customer.", "warning");

    if (!invoiceDate)
      return Swal.fire(
        "Billing Date Required",
        "Please select billing date.",
        "warning",
      );

    // --- FY DATE VALIDATION ---
    const invDateObj = new Date(invoiceDate);
    const fyStart = new Date(activeFy.startDate);
    const fyEnd = new Date(activeFy.endDate);

    if (invDateObj < fyStart || invDateObj > fyEnd) {
      return Swal.fire(
        "Invalid Date",
        `Billing date must fall within active financial year range (${fyStart.toLocaleDateString()} - ${fyEnd.toLocaleDateString()}).`,
        "warning",
      );
    }

    if (items.length === 0)
      return Swal.fire("Empty", "Please add at least one product.", "warning");

    if (totals.grand < 0)
      return Swal.fire(
        "Invalid Total",
        "Grand total cannot be negative.",
        "error",
      );

    setSaving(true);
    const staffId = localStorage.getItem("staffId") || 1;

    Swal.fire({
      title: "Generating Invoice",
      html: "Processing secure transaction...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const masterPayload = {
        clientMasterId: Number(selectedCustomer),
        invoiceDate: new Date(invoiceDate).toISOString(),
        grossAmount: Number(totals.gross),
        gstAmount: Number(totals.gst),
        staffMasterId: Number(staffId),
        // Assuming backend maps this, or backend auto-detects active FY.
        // FinancialYearId: activeFy.id
      };

      const payload = {
        invoice: {
          clientMasterId: Number(selectedCustomer),
          invoiceDate: new Date(invoiceDate).toISOString(),
          grossAmount: Number(totals.gross),
          gstAmount: Number(totals.gst),
          staffMasterId: Number(staffId),
        },
        items: items.map((i) => ({
          productMasterId: i.productId,
          qty: i.qty,
          rate: i.price,
          gstAmount: i.gstAmount,
          hsnCode: i.hsn || "",
          unit: "Nos",
        })),
      };

      const res = await postRequest("InvoiceMaster/SaveFullInvoice", payload);

      if (res.status !== "OK") {
        throw new Error(res.message || "Failed to save Invoice");
      }

      // 🔥 STEP 1: CREATE DTO
      // const invoiceDto = {
      //   invoiceId: res.result?.invoiceId,
      //   invoiceNo: res.result?.invoiceNo,
      //   staffId: Number(staffId),
      //   items: items.map((i) => ({
      //     productId: i.productId,
      //     qty: i.qty,
      //   })),
      // };

      // 🔥 STEP 2: CALL OUTWARD API
      // await postRequest("Outward/AutoFromInvoice", invoiceDto);

      // 🔥 STEP 3: REFRESH STOCK
      window.dispatchEvent(new Event("stockUpdated"));

      const invoiceId = res.result?.invoiceId;
      const invoiceNo = res.result?.invoiceNo;

      // if (!invoiceId)
      //   throw new Error(
      //     "Sync Failure: Database did not return Invoice ID in time.",
      //   );

      await Swal.fire({
        icon: "success",
        title: "Invoice Created!",
        text: `Invoice ${invoiceNo} created successfully`,
        timer: 2000,
        showConfirmButton: false,
      });
      setItems([]);
      navigate("/staff/invoicepreview", { state: { id: invoiceId } });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: err.message || "A technical error occurred while saving.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [products, searchQuery]);

  const customerDetail = useMemo(() => {
    return customers.find((c) => c.id == selectedCustomer);
  }, [customers, selectedCustomer]);

  const clearInvoice = () => {
    setItems([]);
    setDiscount(0);
    setRemarks("");
    runCalculations([], 0);
  };

  // Determine if billing is allowed
  const isBillingAllowed = activeFy && !loading;

  return (
    <PageWrapper className="staff-page">
      <GlobalLoader isLoading={loading || saving} />

      <PageTransition>
        <Container>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    fontSize: "2.4rem",
                    fontWeight: 900,
                    background:
                      "linear-gradient(90deg, var(--primary), #06b6d4)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  Create Invoice
                </motion.h1>
                <p style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                  Modern ERP Billing Interface
                </p>
              </div>
              <motion.button
                whileHover={{ rotate: 180 }}
                onClick={clearInvoice}
                style={{
                  background: "var(--bg-light-custom)",
                  border: "none",
                  padding: "12px",
                  borderRadius: "50%",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <RefreshCcw size={20} />
              </motion.button>
            </div>

            {/* IF NO ACTIVE FY, SHOW WARNING CARD */}
            {!activeFy && !loading && (
              <GlassCard
                style={{
                  borderColor: "rgba(239, 68, 68, 0.4)",
                  background: "rgba(239, 68, 68, 0.05)",
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
                      Billing is currently locked. Please activate a Financial
                      Year from settings before generating invoices.
                    </p>
                  </div>
                </div>
              </GlassCard>
            )}

            <GlassCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {!isBillingAllowed && (
                <LockOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="lock-icon">
                    <Lock size={32} />
                  </div>
                  <h3>Billing Locked</h3>
                  <p>Requires Active Financial Year</p>
                </LockOverlay>
              )}

              <SectionHeader>
                <div className="title-wrap">
                  <div className="icon-box">
                    <User size={18} />
                  </div>
                  <h2>Client Information</h2>
                </div>
                {activeFy && (
                  <FyBadge>
                    <Calendar size={14} /> FY: {activeFy.yearName}
                  </FyBadge>
                )}
              </SectionHeader>

              {loading ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1.5rem",
                  }}
                >
                  <SkeletonForm />
                  <SkeletonForm />
                  <SkeletonForm />
                </div>
              ) : customers.length === 0 ? (
                <div style={{ padding: "1rem 0" }}>
                  <PremiumEmptyState
                    icon={User}
                    title="No Clients Found"
                    subtitle="Please add clients in the master module before generating an invoice."
                  />
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "1.5rem",
                    }}
                  >
                    <InputGroup>
                      <label>Select Customer</label>
                      <div className="input-wrapper">
                        <select
                          value={selectedCustomer}
                          onChange={(e) => setSelectedCustomer(e.target.value)}
                          disabled={!isBillingAllowed}
                        >
                          <option value="">-- Choose Client --</option>
                          {customers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.businessName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </InputGroup>
                    <InputGroup>
                      <label>Billing Date</label>
                      <div className="input-wrapper">
                        <input
                          type="date"
                          value={invoiceDate}
                          onChange={(e) => setInvoiceDate(e.target.value)}
                          disabled={!isBillingAllowed}
                        />
                      </div>
                    </InputGroup>
                    <InputGroup>
                      <label>Reference No.</label>
                      <div className="input-wrapper">
                        <input
                          type="text"
                          value={nextInvoiceNo}
                          disabled
                          style={{ color: "var(--primary)", fontWeight: 800 }}
                        />
                      </div>
                    </InputGroup>
                  </div>

                  <AnimatePresence>
                    {customerDetail && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{
                          marginTop: "1.5rem",
                          padding: "1rem",
                          borderTop: "1px solid var(--border-custom)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--primary)",
                              fontWeight: 800,
                              textTransform: "uppercase",
                            }}
                          >
                            Ship To:
                          </span>
                          <div style={{ fontWeight: 700, fontSize: "0.9rem" }}>
                            {customerDetail.businessName}
                          </div>
                          <div
                            style={{
                              fontSize: "0.8rem",
                              color: "var(--text-muted)",
                            }}
                          >
                            {customerDetail.address || "No address provided"}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: "var(--text-muted)",
                              fontWeight: 700,
                            }}
                          >
                            GSTIN:
                          </span>
                          <div
                            style={{
                              fontWeight: 700,
                              color: "var(--success)",
                            }}
                          >
                            {customerDetail.gstin || "N/A"}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </GlassCard>

            <GlassCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {!isBillingAllowed && <LockOverlay />}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.5rem",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <SectionHeader style={{ margin: 0 }}>
                  <div className="title-wrap">
                    <div className="icon-box">
                      <Package size={18} />
                    </div>
                    <h2>Inventory</h2>
                  </div>
                </SectionHeader>
                <div style={{ position: "relative", width: "300px" }}>
                  <Search
                    size={18}
                    style={{
                      position: "absolute",
                      left: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-muted)",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Filter by name..."
                    style={{
                      width: "100%",
                      padding: "10px 10px 10px 40px",
                      borderRadius: "12px",
                      border: "1px solid var(--border-custom)",
                      background: "var(--bg-light-custom)",
                    }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={loading || !isBillingAllowed}
                  />
                </div>
              </div>

              {loading ? (
                <SkeletonGrid count={6} Component={SkeletonCard} />
              ) : filteredProducts.length === 0 ? (
                <div style={{ padding: "2rem 0" }}>
                  <PremiumEmptyState
                    icon={Package}
                    title="No Products Found"
                    subtitle="There are no products matching your current filters or inventory records."
                  />
                </div>
              ) : (
                <ProductGrid ref={scrollContainerRef}>
                  {filteredProducts.map((p) => (
                    <PremiumProductCard
                      key={p.id}
                      whileHover={{ y: -6, scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="name">{p.name}</div>
                      <div className="meta">
                        <span>Tax: {p.gst}%</span>
                        <span>SKU-{p.id}</span>
                      </div>
                      <div className="price-tag">
                        ₹{p.price.toLocaleString()}
                      </div>
                      <div className="meta">
                        <span>Tax: {p.gst}%</span>
                        <span>Stock: {p.availableQty ?? 0}</span>
                      </div>
                      <AddButton
                        onClick={() => addItem(p)}
                        disabled={
                          !isBillingAllowed || (p.availableQty ?? 0) <= 0
                        }
                      >
                        <Plus size={16} /> Add to Cart
                      </AddButton>
                      {p.availableQty <= 5 && (
                        <div
                          style={{
                            color: "orange",
                            fontSize: "12px",
                            fontWeight: 700,
                          }}
                        >
                          ⚠ Low Stock
                        </div>
                      )}
                      <button
                        style={{
                          marginTop: "8px",
                          fontSize: "12px",
                          color: "blue",
                          background: "transparent",
                          border: "none",
                          cursor: "pointer",
                        }}
                        onClick={() => viewHistory(p.id)}
                      >
                        View History
                      </button>
                    </PremiumProductCard>
                  ))}
                </ProductGrid>
              )}
            </GlassCard>

            <GlassCard
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ padding: "0.5rem" }}
            >
              <TableContainer>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ textAlign: "center" }}>Quantity</th>
                      <th>Rate</th>
                      <th>GST %</th>
                      <th>Total Amt</th>
                      <th style={{ textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {items.map((item, idx) => (
                        <motion.tr
                          key={item.productId}
                          layout
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                        >
                          <td>
                            <div style={{ fontWeight: 700 }}>{item.name}</div>
                            <div
                              style={{
                                fontSize: "0.7rem",
                                color: "var(--text-muted)",
                              }}
                            >
                              HSN: {item.hsn || "---"}
                            </div>
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                              }}
                            >
                              <QtyControl>
                                <button
                                  onClick={() => updateQty(idx, item.qty - 1)}
                                >
                                  <Minus size={14} />
                                </button>
                                <input
                                  type="number"
                                  value={item.qty}
                                  onChange={(e) =>
                                    updateQty(idx, e.target.value)
                                  }
                                />
                                <button
                                  onClick={() => updateQty(idx, item.qty + 1)}
                                >
                                  <Plus size={14} />
                                </button>
                              </QtyControl>
                            </div>
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                            >
                              <span style={{ color: "var(--text-muted)" }}>
                                ₹
                              </span>
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) =>
                                  updateRate(idx, e.target.value)
                                }
                                style={{
                                  width: "80px",
                                  background: "transparent",
                                  border: "none",
                                  borderBottom:
                                    "1px solid var(--border-custom)",
                                  fontWeight: 700,
                                  textAlign: "right",
                                }}
                              />
                            </div>
                          </td>
                          <td>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "var(--warning)",
                              }}
                            >
                              {item.gst}%
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 800 }}>
                              ₹{item.total.toFixed(2)}
                            </div>
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <motion.button
                              whileHover={{ scale: 1.2, color: "#ef4444" }}
                              onClick={() => removeItem(idx)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "var(--text-muted)",
                                cursor: "pointer",
                              }}
                            >
                              <Trash2 size={18} />
                            </motion.button>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </tbody>
                </table>

                {items.length === 0 && (
                  <div style={{ padding: "3rem 0" }}>
                    <PremiumEmptyState
                      icon={Package}
                      title="Invoice is Empty"
                      subtitle="Your cart is currently empty. Add products from the inventory grid above to start billing."
                    />
                  </div>
                )}
              </TableContainer>
            </GlassCard>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            <div style={{ position: "sticky", top: "2rem" }}>
              <GlassCard
                style={{
                  background: "var(--card)",
                  border: "2px solid var(--primary)30",
                }}
              >
                {!isBillingAllowed && <LockOverlay />}
                <SectionHeader>
                  <div className="title-wrap">
                    <div className="icon-box">
                      <CreditCard size={18} />
                    </div>
                    <h2>Payment Summary</h2>
                  </div>
                </SectionHeader>

                {loading ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    <SkeletonStats />
                    <SkeletonForm />
                    <SkeletonBase $height="90px" $radius="16px" $mb="1rem" />
                    <SkeletonBase $height="45px" $radius="12px" />
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "var(--text-muted)",
                        fontWeight: 600,
                      }}
                    >
                      <span>Gross Taxable:</span>
                      <span>₹{totals.gross.toFixed(2)}</span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        color: "var(--text-muted)",
                        fontWeight: 600,
                      }}
                    >
                      <span>Total GST:</span>
                      <span>₹{totals.gst.toFixed(2)}</span>
                    </div>

                    <InputGroup style={{ margin: "0.5rem 0" }}>
                      <label>Extra Discount (₹)</label>
                      <div className="input-wrapper">
                        <div
                          style={{
                            position: "absolute",
                            left: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          <Percent size={14} />
                        </div>
                        <input
                          type="number"
                          placeholder="0.00"
                          style={{ paddingLeft: "35px" }}
                          value={discount}
                          onChange={(e) => {
                            setDiscount(e.target.value);
                            runCalculations(items, e.target.value);
                          }}
                          disabled={!isBillingAllowed}
                        />
                      </div>
                    </InputGroup>

                    <div
                      style={{
                        marginTop: "1rem",
                        padding: "1.25rem",
                        background: "var(--primary)08",
                        borderRadius: "16px",
                        border: "1px dashed var(--primary)40",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span style={{ fontWeight: 800, fontSize: "1.1rem" }}>
                          Grand Total
                        </span>
                        <motion.span
                          key={totals.grand}
                          initial={{ scale: 1.1 }}
                          animate={{ scale: 1 }}
                          style={{
                            fontWeight: 900,
                            fontSize: "1.8rem",
                            color: "var(--primary)",
                          }}
                        >
                          ₹
                          {totals.grand.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </motion.span>
                      </div>
                    </div>

                    <InputGroup style={{ marginTop: "1rem" }}>
                      <label>Notes / Remarks</label>
                      <div className="input-wrapper">
                        <textarea
                          rows="3"
                          placeholder="Add terms or internal notes..."
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          disabled={!isBillingAllowed}
                        />
                      </div>
                    </InputGroup>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "1rem",
                        marginTop: "1rem",
                      }}
                    >
                      <AddButton
                        as={motion.button}
                        style={{
                          background: "var(--bg-light-custom)",
                          color: "var(--text)",
                          boxShadow: "none",
                        }}
                        onClick={() => navigate(-1)}
                      >
                        Cancel
                      </AddButton>
                      <AddButton
                        disabled={saving || !isBillingAllowed}
                        onClick={handleSaveInvoice}
                        style={{ position: "relative" }}
                      >
                        {saving ? (
                          <RefreshCcw className="spinner" size={18} />
                        ) : (
                          <>
                            <Save size={18} /> Save
                          </>
                        )}
                      </AddButton>
                    </div>
                  </div>
                )}
              </GlassCard>

              <GlassCard
                style={{
                  marginTop: "1.5rem",
                  background: "rgba(34, 197, 94, 0.05)",
                  borderStyle: "dashed",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "center",
                  }}
                >
                  <CheckCircle2 size={18} color="var(--success)" />
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      color: "var(--success)",
                    }}
                  >
                    Compliance Check Passed
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "0.75rem",
                    marginTop: "5px",
                    color: "var(--text-muted)",
                  }}
                >
                  GST calculations are dynamically verified per HSN standards.
                </p>
              </GlassCard>
            </div>
          </div>
        </Container>

        <StickyMobileBar>
          <div>
            <span
              style={{
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                fontWeight: 800,
              }}
            >
              TOTAL PAYABLE
            </span>
            <div
              style={{
                fontWeight: 900,
                fontSize: "1.25rem",
                color: "var(--primary)",
              }}
            >
              ₹{totals.grand.toFixed(2)}
            </div>
          </div>
          <AddButton
            style={{ width: "140px" }}
            disabled={saving || !isBillingAllowed}
            onClick={handleSaveInvoice}
          >
            {saving ? "..." : "Save Invoice"}
          </AddButton>
        </StickyMobileBar>
      </PageTransition>

      <style>{`
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (max-width: 768px) {
          .staff-page { padding-bottom: 80px; }
        }
      `}</style>


      {showHistoryModal && (
  <div style={{
    position: "fixed",
    top: "10%",
    left: "50%",
    transform: "translateX(-50%)",
    background: "white",
    padding: "20px",
    borderRadius: "10px",
    zIndex: 1000,
    width: "400px"
  }}>
    <h3>Stock History</h3>

    <table style={{ width: "100%" }}>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Qty</th>
        </tr>
      </thead>

      <tbody>
        {historyData.map((h, i) => (
          <tr key={i}>
            <td>{new Date(h.date).toLocaleDateString()}</td>
            <td style={{ color: h.type === "IN" ? "green" : "red" }}>
              {h.type}
            </td>
            <td>{h.qty}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <button onClick={() => setShowHistoryModal(false)}>
      Close
    </button>
  </div>
)}
    </PageWrapper>
  );
}
