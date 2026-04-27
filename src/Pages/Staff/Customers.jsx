import React, { useEffect, useState, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Search,
  RefreshCcw,
  UserPlus,
  Edit3,
  Trash2,
  MapPin,
  ShieldCheck,
  Globe,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  Briefcase,
  Hash,
  RotateCcw,
  Download,
  FileSpreadsheet
} from "lucide-react";
import CountUp from "react-countup";
import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
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
    transition: 0.3s;
    &:focus {
      border-color: #3b82f6;
      outline: none;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
      background: var(--card);
    }
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

const ActionBtn = styled(motion.button)`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  color: white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
  &.edit {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
  }
  &.delete {
    background: linear-gradient(135deg, #ef4444, #dc2626);
  }
  &:hover {
    filter: brightness(1.2);
    box-shadow: 0 0 20px currentColor;
    transform: translateY(-3px);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
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
    font-weight: 600;
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
  display: flex;
  align-items: center;
  justify-content: center;
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

const PremiumBtn = styled(motion.button)`
  padding: 10px 24px;
  border-radius: 12px;
  border: none;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;

  &.primary {
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    color: white;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
  }
  &.secondary {
    background: var(--bg-light-custom);
    color: var(--text);
    border: 1px solid var(--border-custom);
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

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 3px 15px 45px rgba(59, 131, 246, 0.35);
    filter: brightness(1.1);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
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
  background: rgba(0, 0, 0, 0.75);
  width: 100%;
  max-width: 800px;
  border-radius: 25px;
  border: 1px solid rgba(7, 97, 242, 0.91);
  box-shadow:
    3px 8px 120px rgb(4, 0, 255),
    0 2px rgba(59, 130, 246, 0.15);
  overflow: hidden;
  position: relative;
  &:hover {
    backdrop-filter: blur(24px);
    border: 1px solid rgb(5, 22, 255);
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  max-height: 70vh;
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(247, 248, 250, 0.87);
    border-radius: 10px;
  }
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
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      width: 16px;
    }
    input,
    textarea {
      width: 100%;
      padding: 12px 12px 12px 40px;
      background: var(--bg-light-custom);
      border: 1px solid var(--border-custom);
      border-radius: 12px;
      color: var(--text);
      font-size: 14px;
      transition: 0.3s;
      &:focus {
        border-color: #075fec;
        background: var(--card);
        outline: none;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
      }
      &::placeholder {
        color: var(--text-muted);
        opacity: 0.6;
      }
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

export default function Customer() {
  const [data, setData] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    businessName: "",
    address: "",
    email: "",
    contactNo: "",
    gstin: "",
    state: "",
    stateCode: "",
    contactPerson: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      const res = await getRequest("ClientMaster/List");
      setData(res.result || []);
      setFiltered(res.result || []);
    } catch (err) {
      errorAlert("Error", "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let temp = [...data];
    if (search) {
      temp = temp.filter(
        (c) =>
          (c.businessName || "").toLowerCase().includes(search.toLowerCase()) ||
          (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
          (c.contactNo || "").includes(search),
      );
    }
    setFiltered(temp);
    setCurrentPage(1);
  }, [search, data]);

  const stats = useMemo(() => {
    const uniqueStates = new Set(
      data.map((c) => c.state?.trim()).filter(Boolean),
    );
    const gstRegistered = data.filter(
      (c) => c.gstin && c.gstin.length > 5,
    ).length;
    return {
      total: data.length,
      active: data.length,
      gst: gstRegistered,
      states: uniqueStates.size,
    };
  }, [data]);

  const handleSave = async () => {
    if (!form.businessName.trim())
      return errorAlert("Error", "Business Name is required");
    if (!form.email.trim()) return errorAlert("Error", "Email is required");
    if (!form.contactNo.trim())
      return errorAlert("Error", "Contact number is required");
    if (!form.gstin.trim()) return errorAlert("Error", "GSTIN is required");

    try {
      setLoading(true);
      const payload = { ...form, staffMasterId: 1 };
      let res = editId
        ? await putRequest("ClientMaster/Update", { ...payload, id: editId })
        : await postRequest("ClientMaster/Save", payload);

      if (res.status === "OK") {
        successAlert("Success", editId ? "Customer Updated" : "Customer Saved");
        setShowModal(false);
        setEditId(null);
        setForm({
          businessName: "",
          address: "",
          email: "",
          contactNo: "",
          gstin: "",
          state: "",
          stateCode: "",
          contactPerson: "",
        });
        await loadClients();
      } else {
        errorAlert("Error", res.result || "Operation failed");
      }
    } catch (err) {
      errorAlert("Error", "Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (c) => {
    setEditId(c.id);
    setForm({
      businessName: c.businessName || "",
      address: c.address || "",
      email: c.email || "",
      contactNo: c.contactNo || "",
      gstin: c.gstin || "",
      state: c.state || "",
      stateCode: c.stateCode || "",
      contactPerson: c.contactPerson || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const confirm = await confirmAlert(
      "Delete Customer?",
      "This action cannot be undone.",
    );
    if (confirm.isConfirmed) {
      try {
        setLoading(true);
        const res = await deleteRequest(`ClientMaster/Delete/${id}`);
        if (res.status === "OK") {
          successAlert("Deleted", "Customer record removed.");
          await loadClients();
        } else {
          errorAlert("Error", res.result);
        }
      } catch (err) {
        errorAlert("Error", "Delete failed");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExportCSV = () => {
    if (filtered.length === 0) return errorAlert("Empty", "No data to export.");
    let csv = "Business Name,Contact Person,Email,Phone,GST Number,State,Address\n";
    filtered.forEach((c) => {
      const name = c.businessName ? `"${c.businessName.replace(/"/g, '""')}"` : "";
      const contactPerson = c.contactPerson ? `"${c.contactPerson.replace(/"/g, '""')}"` : "";
      const address = c.address ? `"${c.address.replace(/"/g, '""')}"` : "";
      csv += `${name},${contactPerson},${c.email},${c.contactNo},${c.gstin},${c.state},${address}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Customers_Report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    successAlert("Exported", "Customer records downloaded as CSV.");
  };

  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const currentRecords = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / recordsPerPage);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

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
                Customer Management
              </motion.h1>
              <p>Manage and organize all customer/client records efficiently</p>
            </div>
            <PremiumBtn
              className="secondary"
              onClick={loadClients}
              disabled={loading}
            >
              <RotatingRefreshIcon $loading={loading} size={18} />
              Reload Data
            </PremiumBtn>
          </HeaderSection>

          <StatsGrid
            as={motion.div}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <GlassCard variants={itemVariants}>
              <StatItem $color="#3b82f6" $bg="rgba(59, 130, 246, 0.15)">
                <div className="icon-box">
                  <Users size={26} />
                </div>
                <div className="details">
                  <span>Total Customers</span>
                  <h3>
                    <CountUp end={stats.total} duration={2} />
                  </h3>
                </div>
              </StatItem>
            </GlassCard>

            <GlassCard variants={itemVariants}>
              <StatItem $color="#10b981" $bg="rgba(16, 185, 129, 0.15)">
                <div className="icon-box">
                  <ShieldCheck size={26} />
                </div>
                <div className="details">
                  <span>Active Records</span>
                  <h3>
                    <CountUp end={stats.active} duration={2} />
                  </h3>
                </div>
              </StatItem>
            </GlassCard>

            <GlassCard variants={itemVariants}>
              <StatItem $color="#f59e0b" $bg="rgba(245, 158, 11, 0.15)">
                <div className="icon-box">
                  <Globe size={26} />
                </div>
                <div className="details">
                  <span>GST Registered</span>
                  <h3>
                    <CountUp end={stats.gst} duration={2} />
                  </h3>
                </div>
              </StatItem>
            </GlassCard>

            <GlassCard variants={itemVariants}>
              <StatItem $color="#06b6d4" $bg="rgba(6, 182, 212, 0.15)">
                <div className="icon-box">
                  <MapPin size={26} />
                </div>
                <div className="details">
                  <span>States Covered</span>
                  <h3>
                    <CountUp end={stats.states} duration={2} />
                  </h3>
                </div>
              </StatItem>
            </GlassCard>
          </StatsGrid>

          <FilterCard initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SearchWrapper>
              <Search size={20} />
              <input
                type="text"
                placeholder="Search by name, email or contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={loading}
              />
            </SearchWrapper>
            <div style={{ display: "flex", gap: "12px", marginLeft: "auto", flexWrap: "wrap" }}>
              <PremiumBtn
                className="secondary"
                onClick={() => setSearch("")}
                disabled={loading}
              >
                <RotateCcw size={16} /> Reset
              </PremiumBtn>
              <PremiumBtn
                className="info"
                onClick={handleExportCSV}
                disabled={loading || filtered.length === 0}
              >
                <Download size={18} /> Export CSV
              </PremiumBtn>
              <PremiumBtn
                className="primary"
                disabled={loading}
                onClick={() => {
                  setEditId(null);
                  setForm({
                    businessName: "",
                    address: "",
                    email: "",
                    contactNo: "",
                    gstin: "",
                    state: "",
                    stateCode: "",
                    contactPerson: "",
                  });
                  setShowModal(true);
                }}
              >
                <UserPlus size={18} /> Add Customer
              </PremiumBtn>
            </div>
          </FilterCard>

          <TableWrapper initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Business Name</th>
                    <th>Contact Details</th>
                    <th>GST Number</th>
                    <th>Location</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonTableRows rows={6} columns={5} />
                  ) : currentRecords.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: "3rem 0" }}>
                        <PremiumEmptyState 
                          icon={Users} 
                          title="No Customers Found" 
                          subtitle="There are no customer records matching your search criteria." 
                        />
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ fontWeight: 800, fontSize: "15px" }}>
                            {c.businessName}
                          </div>
                          <small
                            style={{
                              color: "var(--text-muted)",
                              fontWeight: 600,
                            }}
                          >
                            ID: BM-CL-{c.id}
                          </small>
                        </td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "4px",
                            }}
                          >
                            <Phone size={12} /> {c.contactNo}
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <Mail size={12} /> {c.email}
                          </div>
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
                            {c.gstin || "N/A"}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{c.state}</div>
                          <small style={{ color: "var(--text-muted)" }}>
                            {c.address?.substring(0, 30)}...
                          </small>
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
                              onClick={() => handleEdit(c)}
                              title="Edit"
                              disabled={loading}
                            >
                              <Edit3 size={16} />
                            </ActionBtn>
                            <ActionBtn
                              className="delete"
                              onClick={() => handleDelete(c.id)}
                              title="Delete"
                              disabled={loading}
                            >
                              <Trash2 size={16} />
                            </ActionBtn>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <PaginationBar>
              <div className="info d-none d-sm-block">
                Showing records <b>{filtered.length > 0 ? indexOfFirst + 1 : 0}</b> to{" "}
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

          {/* MODAL REDESIGN */}
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
                      {editId ? "Update Client Profile" : "Register New Client"}
                    </h2>
                    <button
                      onClick={() => setShowModal(false)}
                      disabled={loading}
                    >
                      <X size={24} />
                    </button>
                  </ModalHeader>
                  <ModalBody>
                    <FormInputGroup>
                      <label>Business Name</label>
                      <div className="input-wrapper">
                        <Briefcase />
                        <input
                          value={form.businessName}
                          onChange={(e) =>
                            setForm({ ...form, businessName: e.target.value })
                          }
                          placeholder="Legal Entity Name"
                          disabled={loading}
                        />
                      </div>
                    </FormInputGroup>
                    <FormInputGroup>
                      <label>Contact Person</label>
                      <div className="input-wrapper">
                        <Users />
                        <input
                          value={form.contactPerson}
                          onChange={(e) =>
                            setForm({ ...form, contactPerson: e.target.value })
                          }
                          placeholder="Primary Contact Name"
                          disabled={loading}
                        />
                      </div>
                    </FormInputGroup>
                    <FormInputGroup>
                      <label>Email Address</label>
                      <div className="input-wrapper">
                        <Mail />
                        <input
                          value={form.email}
                          onChange={(e) =>
                            setForm({ ...form, email: e.target.value })
                          }
                          placeholder="client@example.com"
                          disabled={loading}
                        />
                      </div>
                    </FormInputGroup>
                    <FormInputGroup>
                      <label>Phone Number</label>
                      <div className="input-wrapper">
                        <Phone />
                        <input
                          value={form.contactNo}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              contactNo: e.target.value.replace(/\D/g, ""),
                            })
                          }
                          placeholder="10 Digit Mobile No"
                          disabled={loading}
                        />
                      </div>
                    </FormInputGroup>
                    <FormInputGroup>
                      <label>GST Identification No.</label>
                      <div className="input-wrapper">
                        <ShieldCheck />
                        <input
                          value={form.gstin}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              gstin: e.target.value.toUpperCase(),
                            })
                          }
                          placeholder="24AAAAA0000A1Z5"
                          disabled={loading}
                        />
                      </div>
                    </FormInputGroup>
                    <FormInputGroup>
                      <label>State & Code</label>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <div className="input-wrapper" style={{ flex: 2 }}>
                          <Globe />
                          <input
                            value={form.state}
                            onChange={(e) =>
                              setForm({ ...form, state: e.target.value })
                            }
                            placeholder="State"
                            disabled={loading}
                          />
                        </div>
                        <div className="input-wrapper" style={{ flex: 1 }}>
                          <Hash />
                          <input
                            value={form.stateCode}
                            onChange={(e) =>
                              setForm({ ...form, stateCode: e.target.value })
                            }
                            placeholder="Code"
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </FormInputGroup>
                    <FormInputGroup style={{ gridColumn: "1 / -1" }}>
                      <label>Full Address</label>
                      <div className="input-wrapper">
                        <MapPin />
                        <textarea
                          rows="2"
                          value={form.address}
                          onChange={(e) =>
                            setForm({ ...form, address: e.target.value })
                          }
                          placeholder="Street, Building, Area..."
                          style={{ paddingLeft: "40px", borderRadius: "12px" }}
                          disabled={loading}
                        />
                      </div>
                    </FormInputGroup>
                  </ModalBody>
                  <ModalFooter>
                    <PremiumBtn
                      className="secondary"
                      onClick={() => setShowModal(false)}
                      disabled={loading}
                    >
                      Cancel
                    </PremiumBtn>
                    <PremiumBtn className="success" onClick={handleSave} disabled={loading}>
                      {editId ? "Update Records" : "Confirm & Save"}
                    </PremiumBtn>
                  </ModalFooter>
                </ModalContent>
              </ModalOverlay>
            )}
          </AnimatePresence>
        </PageWrapper>
      </PageTransition>
    </>
  );
}