import React, { useEffect, useState, useMemo } from "react";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Search,
  RefreshCcw,
  Plus,
  Edit3,
  Trash2,
  Layers,
  IndianRupee,
  Percent,
  Hash,
  X,
  Archive,
  CheckCircle2,
  Filter,
  LayoutGrid,
  PackageCheck,
  ChevronLeft,
  ChevronRight,
  Download,
  PrinterIcon,
  RotateCcw,
  FileText,
  FileSpreadsheet,
  AlertCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
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

// --- FIXED PREMIUM UTILITY IMPORTS ---
import GlobalLoader from "../../components/common/GlobalLoader.jsx";
import PageTransition from "../../components/common/PageTransition.jsx";
import { SkeletonTableRows } from "../../components/common/SkeletonLoader.jsx";

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
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  &:hover {
    border-color: rgba(10, 102, 249, 0.87);
    box-shadow: 3px 15px 45px rgba(59, 131, 246, 0.49);
    transform: translateY(-5px);
  }
`;

/* =========================================================
    STYLED COMPONENTS
   ========================================================= */

const PageWrapper = styled.div`
  padding: 24px;
  min-height: 100vh;
  font-family: "Inter", sans-serif;
  background: var(--bg);
  transition: all 0.3s ease;
  @media (max-width: 768px) {
    padding: 14px;
  }
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

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  .title-area {
    h1 {
      font-size: 32px;
      font-weight: 800;
      letter-spacing: -1px;
      margin: 0;
      background: linear-gradient(90deg, #3b82f6, #06b6d4);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p {
      color: var(--text-muted);
      margin: 5px 0 0 0;
      font-size: 14px;
      font-weight: 500;
    }
  }
  .action-buttons {
    display: flex;
    gap: 12px;
  }
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
    .action-buttons {
      width: 100%;
      justify-content: space-between;
    }
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
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
    background: ${(props) => props.$bg || "rgba(59, 130, 246, 0.15)"};
    color: ${(props) => props.$color || "#3b82f6"};
    box-shadow: 0 8px 20px -5px rgba(0, 0, 0, 0.1);
  }
  .details {
    span {
      font-size: 13px;
      color: var(--text-muted);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    h3 {
      font-size: 24px;
      font-weight: 800;
      margin: 2px 0 0 0;
      color: var(--text);
    }
  }
  .action-area {
    margin-left: auto;
    button {
      padding: 10px 16px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 800;
      text-transform: uppercase;
      cursor: pointer;
      border: none;
      background: linear-gradient(
        135deg,
        ${(props) => props.$color},
        ${(props) => props.$color}dd
      );
      color: white;
      box-shadow: 0 4px 15px ${(props) => props.$color}40;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      &:hover {
        transform: translateY(-3px) scale(1.05);
        filter: brightness(1.2);
        box-shadow: 0 8px 25px ${(props) => props.$color}60;
      }
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
    border-color: var(--border-custom);
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  flex: 1;
  min-width: 280px;
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
    &::placeholder {
      color: var(--text-muted);
      opacity: 0.8;
    }
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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
    border-radius: 14px;
    padding: 0 12px;
    height: 44px;
    transition: 0.3s;
    &:focus-within {
      border-color: #3b82f6;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
      background: var(--card);
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
      font-size: 14px;
      font-weight: 500;
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
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
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
  border-radius: 20px;
  overflow: hidden;
  &:hover {
    transform: none;
    border-color: var(--border-custom);
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
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
    tr:nth-child(even) td {
      background: var(--bg-hover, rgba(0, 0, 0, 0.02));
    }
    tr:hover td {
      background: rgba(59, 130, 246, 0.08);
      color: var(--primary);
    }
  }
`;

const Badge = styled.span`
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 800;
  background: ${(props) => props.$bg || "rgba(59, 130, 246, 0.15)"};
  color: ${(props) => props.$color || "#38bdf8"};
  border: 1px solid ${(props) => props.$color}40;
`;

const ActionBtn = styled(motion.button)`
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  &.edit {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
  }
  &.delete {
    background: linear-gradient(135deg, #ef4444, #dc2626);
  }
  &:hover:not(:disabled) {
    filter: brightness(1.25);
    box-shadow: 0 8px 20px ${(props) => props.$shadowColor || "rgba(0,0,0,0.2)"};
    transform: translateY(-3px) scale(1.05);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const PremiumBtn = styled(motion.button)`
  padding: 10px 24px;
  border-radius: 14px;
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
  max-width: 750px;
  border-radius: 24px;
  border: 1px solid var(--border-custom);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.35),
    0 0 30px rgba(59, 130, 246, 0.15);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 24px 30px;
  background: var(--bg-light-custom);
  border-bottom: 1px solid var(--border-custom);
  display: flex;
  justify-content: space-between;
  align-items: center;
  h2 {
    font-size: 22px;
    font-weight: 800;
    margin: 0;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  button {
    background: none;
    border: none;
    color: var(--text-muted);
    cursor: pointer;
    transition: 0.3s;
    &:hover:not(:disabled) {
      color: #ef4444;
      transform: scale(1.1) rotate(90deg);
    }
    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
`;

const ModalBody = styled.div`
  padding: 30px;
  max-height: 65vh;
  overflow-y: auto;
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-custom);
    border-radius: 10px;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  @media (max-width: 600px) {
    grid-template-columns: 1fr;
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
    letter-spacing: 0.5px;
  }
  .input-wrapper {
    position: relative;
    svg {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-muted);
      width: 18px;
    }
    input,
    select {
      width: 100%;
      padding: 14px 14px 14px 44px;
      background: var(--bg-light-custom);
      border: 1px solid var(--border-custom);
      border-radius: 14px;
      color: var(--text);
      font-size: 15px;
      font-weight: 500;
      transition: 0.3s;
      &:focus {
        border-color: #3b82f6;
        background: var(--card);
        outline: none;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
      }
      &::placeholder {
        color: var(--text-muted);
        opacity: 0.7;
      }
      option {
        background: var(--card);
        color: var(--text);
      }
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
    select {
      padding-left: 42px;
    }
  }
`;

const InlineError = styled.span`
  color: #ef4444;
  font-size: 11px;
  font-weight: 600;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const LivePreviewGrid = styled.div`
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  margin-top: 10px;
`;

const PreviewCard = styled.div`
  background: var(--bg-light-custom);
  border: 1px dashed var(--border-custom);
  padding: 15px;
  border-radius: 16px;
  text-align: center;
  span {
    display: block;
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    font-weight: 700;
    margin-bottom: 5px;
  }
  h4 {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    color: ${(props) => props.$color || "var(--text)"};
  }
`;

const ModalFooter = styled.div`
  padding: 24px 30px;
  background: var(--bg-light-custom);
  border-top: 1px solid var(--border-custom);
  display: flex;
  justify-content: flex-end;
  gap: 15px;
`;

const SmallExportModal = styled(ModalContent)`
  max-width: 450px;
  text-align: center;
  h2 {
    justify-content: center;
    margin-bottom: 10px;
    border-bottom: none;
  }
  p {
    color: var(--text-muted);
    margin-bottom: 25px;
  }
  .export-options {
    display: flex;
    gap: 15px;
    justify-content: center;
    margin-bottom: 20px;
    padding: 0 30px;
  }
`;

export default function Products() {
  const [data, setData] = useState([]);
  const [category, setCategory] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [gstFilter, setGstFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");

  const [showModal, setShowModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editId, setEditId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    productCategoryId: "",
    unit: "",
    price: "",
    costPrice: "",
    gst: "",
    hsn: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
    loadCategory();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const res = await getRequest("ProductMaster/List");
      setData(res.result || []);
      setFiltered(res.result || []);
    } catch {
      errorAlert("Error", "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const loadCategory = async () => {
    const res = await getRequest("ProductCategory/List");
    setCategory(res.result || []);
  };

  useEffect(() => {
    let temp = [...data];
    if (search)
      temp = temp.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
          (p.categoryName || "").toLowerCase().includes(search.toLowerCase()) ||
          (p.code || "").toLowerCase().includes(search.toLowerCase()),
      );
    if (selectedCategory)
      temp = temp.filter((p) => p.categoryName === selectedCategory);
    if (minPrice) temp = temp.filter((p) => p.price >= Number(minPrice));
    if (maxPrice) temp = temp.filter((p) => p.price <= Number(maxPrice));
    if (gstFilter === "Enabled") temp = temp.filter((p) => p.gst > 0);
    if (gstFilter === "Disabled")
      temp = temp.filter((p) => p.gst === 0 || !p.gst);

    temp.sort((a, b) => {
      if (sortBy === "Name A-Z")
        return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "Name Z-A")
        return (b.name || "").localeCompare(a.name || "");
      if (sortBy === "Price Low-High") return a.price - b.price;
      if (sortBy === "Price High-Low") return b.price - a.price;
      return b.id - a.id;
    });

    setFiltered(temp);
    setCurrentPage(1);
  }, [search, selectedCategory, minPrice, maxPrice, gstFilter, sortBy, data]);

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setGstFilter("All");
    setSortBy("Newest");
  };

  const stats = useMemo(() => {
    const gstCount = data.filter((p) => (p.gst || 0) > 0).length;
    return { total: data.length, categories: category.length, gst: gstCount };
  }, [data, category]);

  const livePrice = Number(form.price) || 0;
  const liveCost = Number(form.costPrice) || 0;
  const liveGst = Number(form.gst) || 0;
  const liveGstAmt = (livePrice * liveGst) / 100;
  const liveFinalPrice = livePrice + liveGstAmt;
  const liveProfit = livePrice - liveCost;

  const handleSave = async () => {
    if (!form.name.trim())
      return errorAlert("Validation Error", "Product name is required.");
    if (!form.productCategoryId)
      return errorAlert("Validation Error", "Category is required.");
    if (!form.unit.trim())
      return errorAlert("Validation Error", "Unit of measure is required.");
    if (
      form.hsn &&
      (!/^\d+$/.test(form.hsn) || ![4, 6, 8].includes(form.hsn.length))
    )
      return errorAlert(
        "Validation Error",
        "HSN must be 4, 6, or 8 numeric digits.",
      );
    if (livePrice <= 0)
      return errorAlert(
        "Validation Error",
        "Selling price must be greater than 0.",
      );
    if (liveCost <= 0)
      return errorAlert(
        "Validation Error",
        "Cost price must be greater than 0.",
      );
    if (livePrice < liveCost)
      return errorAlert(
        "Validation Error",
        "Selling price cannot be less than cost price.",
      );
    if (liveGst < 0 || liveGst > 100)
      return errorAlert("Validation Error", "GST must be between 0 and 100.");

    try {
      setLoading(true);
      const payload = {
        ...form,
        productCategoryId: Number(form.productCategoryId),
        price: livePrice,
        costPrice: liveCost,
        gst: liveGst,
      };
      let res = editId
        ? await putRequest("ProductMaster/Update", { ...payload, id: editId })
        : await postRequest("ProductMaster/Save", payload);

      if (res.status === "OK") {
        successAlert(
          "Success",
          editId
            ? "Product Updated Successfully"
            : "Product Added to Catalogue",
        );
        setShowModal(false);
        setEditId(null);
        setForm({
          name: "",
          productCategoryId: "",
          unit: "",
          price: "",
          costPrice: "",
          gst: "",
          hsn: "",
        });
        await loadProducts();
      } else {
        errorAlert("Error", res.result || "Operation failed");
      }
    } catch (err) {
      errorAlert("Error", "Server connection failed");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p) => {
    setEditId(p.id);
    setForm({
      name: p.name || "",
      productCategoryId: p.productCategoryId || "",
      unit: p.unit || "",
      price: p.price || "",
      costPrice: p.costPrice || "",
      gst: p.gst || "",
      hsn: p.hsn || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const confirm = await confirmAlert(
      "Delete Product?",
      "This action cannot be undone and will permanently remove the item from the catalogue.",
    );
    if (confirm.isConfirmed) {
      try {
        setLoading(true);
        const res = await deleteRequest(`ProductMaster/Delete/${id}`);
        if (res.status === "OK") {
          successAlert("Deleted!", "Product removed successfully");
          await loadProducts();
        } else {
          errorAlert(
            "Access Denied",
            "Product is in use in existing invoices and cannot be deleted.",
          );
        }
      } catch (err) {
        errorAlert("Error", "Delete failed");
      } finally {
        setLoading(false);
      }
    }
  };

  const generateReportHTML = (products, isPrint = false) => {
    return `
      <html>
        <head>
          <title>Product Catalogue Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: ${isPrint ? "0" : "30px"}; color: #1e293b; background: white; margin: 0; }
            .report-header { text-align: center; margin-bottom: 30px; padding: 20px; background: #f8fafc; border-bottom: 3px solid #3b82f6; }
            .report-header h1 { margin: 0; font-size: 28px; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; }
            .report-header p { margin: 8px 0 0; color: #64748b; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
            th { background-color: #3b82f6; color: white; border: 1px solid #cbd5e1; padding: 12px; text-align: left; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
            td { border: 1px solid #cbd5e1; padding: 10px 12px; color: #334155; }
            tr:nth-child(even) td { background-color: #f8fafc; }
            .text-right { text-align: right; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            @media print { body { padding: 0; } thead { display: table-header-group; } @page { margin: 1cm; size: landscape; } }
          </style>
        </head>
        <body>
          <div class="report-header"><h1>Product Catalogue Report</h1><p>Total Products: ${products.length}</p></div>
          <table>
            <thead><tr><th>Code</th><th>Product Name</th><th>Category</th><th>Unit</th><th class="text-right">Cost Price</th><th class="text-right">Selling Price</th><th class="text-right">GST %</th><th>HSN Code</th></tr></thead>
            <tbody>
              ${products.map((p) => `<tr><td><b>${p.code || "N/A"}</b></td><td>${p.name}</td><td>${p.categoryName}</td><td>${p.unit}</td><td class="text-right">₹${Number(p.costPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td><td class="text-right"><b>₹${Number(p.price).toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></td><td class="text-right">${p.gst}%</td><td>${p.hsn}</td></tr>`).join("")}
            </tbody>
          </table>
          <div class="footer">Confidential & Proprietary &bull; Enterprise ERP System</div>
          ${isPrint ? "<script>window.onload = function() { window.print(); window.close(); }</script>" : ""}
        </body>
      </html>
    `;
  };

  const handlePrintAll = () => {
    if (filtered.length === 0) return errorAlert("Empty", "No data to print.");
    const html = generateReportHTML(filtered, true);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handleExportPDF = () => {
    if (filtered.length === 0) return errorAlert("Empty", "No data to export.");
    const html = generateReportHTML(filtered, false);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Product_Catalogue.html`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
    successAlert(
      "Success",
      "Report exported successfully. Open the file to view or print as PDF.",
    );
  };

  const handleExportCSV = () => {
    if (filtered.length === 0)
      return errorAlert("Empty", "No data to download.");
    let csv = "Code,Name,Category,Unit,CostPrice,SellingPrice,GST%,HSN\n";
    filtered.forEach((p) => {
      const name = p.name ? `"${p.name.replace(/"/g, '""')}"` : "";
      csv += `${p.code || ""},${name},${p.categoryName},${p.unit},${p.costPrice},${p.price},${p.gst},${p.hsn}\n`;
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Catalogue_CSV.csv`;
    link.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
    successAlert("Exported", "Catalogue downloaded as CSV.");
  };

  const indexOfLast = currentPage * recordsPerPage;
  const indexOfFirst = indexOfLast - recordsPerPage;
  const currentRecords = filtered.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filtered.length / recordsPerPage);

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
                Product Management
              </motion.h1>
              <p>Manage inventory catalogue and pricing efficiently</p>
            </div>
            <div className="action-buttons">
              <PremiumBtn
                className="secondary"
                onClick={loadProducts}
                disabled={loading}
              >
                <RotatingRefreshIcon $loading={loading} size={16} /> Reload
              </PremiumBtn>
              <PremiumBtn
                className="primary"
                disabled={loading}
                onClick={() => {
                  setEditId(null);
                  setForm({
                    name: "",
                    productCategoryId: "",
                    unit: "",
                    price: "",
                    costPrice: "",
                    gst: "",
                    hsn: "",
                  });
                  setShowModal(true);
                }}
              >
                <Plus size={18} /> Add Product
              </PremiumBtn>
            </div>
          </HeaderSection>

          <StatsGrid
            as={motion.div}
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
            }}
          >
            <GlassCard
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 },
              }}
            >
              <StatItem $color="#3b82f6" $bg="rgba(59, 130, 246, 0.15)">
                <div className="icon-box">
                  <Archive size={26} />
                </div>
                <div className="details">
                  <span>Total Products</span>
                  <h3>
                    <CountUp end={stats.total} duration={2} />
                  </h3>
                </div>
              </StatItem>
            </GlassCard>
            <GlassCard
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 },
              }}
            >
              <StatItem $color="#f59e0b" $bg="rgba(245, 158, 11, 0.15)">
                <div className="icon-box">
                  <Percent size={26} />
                </div>
                <div className="details">
                  <span>GST Enabled Products</span>
                  <h3>
                    <CountUp end={stats.gst} duration={2} />
                  </h3>
                </div>
              </StatItem>
            </GlassCard>
            <GlassCard
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 },
              }}
            >
              <StatItem $color="#0ea5e9" $bg="rgba(14, 165, 233, 0.15)">
                <div className="icon-box">
                  <Download size={24} />
                </div>
                <div className="details">
                  <span>Export Products</span>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      margin: 0,
                      fontWeight: 500,
                    }}
                  >
                    Download format
                  </p>
                </div>
                <div className="action-area">
                  <button onClick={() => setShowExportModal(true)} disabled={loading}>
                    Download
                  </button>
                </div>
              </StatItem>
            </GlassCard>
            <GlassCard
              variants={{
                hidden: { y: 20, opacity: 0 },
                visible: { y: 0, opacity: 1 },
              }}
            >
              <StatItem $color="#10b981" $bg="rgba(16, 185, 129, 0.15)">
                <div className="icon-box">
                  <PrinterIcon size={24} />
                </div>
                <div className="details">
                  <span>Print Catalogue</span>
                  <p
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      margin: 0,
                      fontWeight: 500,
                    }}
                  >
                    Print full listing
                  </p>
                </div>
                <div className="action-area">
                  <button
                    disabled={loading}
                    style={{
                      background: "linear-gradient(135deg, #10b981, #059669)",
                    }}
                    onClick={handlePrintAll}
                  >
                    Print All
                  </button>
                </div>
              </StatItem>
            </GlassCard>
          </StatsGrid>

          <FilterCard
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <SearchWrapper>
              <Search size={20} />
              <input
                type="text"
                placeholder="Search by name, code or category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                disabled={loading}
              />
            </SearchWrapper>

            <FilterGroup>
              <div className="filter-input">
                <Filter size={14} />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  disabled={loading}
                >
                  <option value="">All Categories</option>
                  {category.map((c) => (
                    <option key={c.id} value={c.categoryName}>
                      {c.categoryName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-input">
                <IndianRupee size={14} />
                <input
                  type="number"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  disabled={loading}
                />
                <span style={{ color: "var(--text-muted)", margin: "0 5px" }}>
                  -
                </span>
                <input
                  type="number"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="filter-input">
                <Percent size={14} />
                <select
                  value={gstFilter}
                  onChange={(e) => setGstFilter(e.target.value)}
                  disabled={loading}
                >
                  <option value="All">All GST</option>
                  <option value="Enabled">GST Enabled</option>
                  <option value="Disabled">GST Disabled</option>
                </select>
              </div>
              <div className="filter-input">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  disabled={loading}
                >
                  <option value="Newest">Sort: Newest First</option>
                  <option value="Name A-Z">Name A-Z</option>
                  <option value="Name Z-A">Name Z-A</option>
                  <option value="Price Low-High">Price Low-High</option>
                  <option value="Price High-Low">Price High-Low</option>
                </select>
              </div>
              <PremiumBtn
                className="secondary"
                disabled={loading}
                style={{ padding: "10px 16px", borderRadius: "14px" }}
                onClick={resetFilters}
              >
                <RotateCcw size={16} /> Reset Filters
              </PremiumBtn>
            </FilterGroup>
          </FilterCard>

          <TableWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Unit</th>
                    <th>Selling Price</th>
                    <th>GST %</th>
                    <th>HSN Code</th>
                    <th style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <SkeletonTableRows rows={8} columns={8} />
                  ) : currentRecords.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        style={{
                          textAlign: "center",
                          padding: "80px",
                          color: "var(--text-muted)",
                        }}
                      >
                        No products found matching filters.
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <Badge $color="#94a3b8" $bg="rgba(148, 163, 184, 0.1)">
                            {p.code || "N/A"}
                          </Badge>
                        </td>
                        <td>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: "15px",
                              color: "var(--text)",
                            }}
                          >
                            {p.name}
                          </div>
                        </td>
                        <td>{p.categoryName}</td>
                        <td>
                          <span style={{ fontWeight: 700, color: "#38bdf8" }}>
                            {p.unit}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              color: "#10b981",
                              fontWeight: 800,
                              fontSize: "16px",
                            }}
                          >
                            ₹{Number(p.price).toLocaleString()}
                          </span>
                        </td>
                        <td>
                          <Badge $color="#f59e0b" $bg="rgba(245, 158, 11, 0.1)">
                            {p.gst}%
                          </Badge>
                        </td>
                        <td>
                          <Badge $color="#3b82f6" $bg="rgba(59, 130, 246, 0.1)">
                            {p.hsn}
                          </Badge>
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
                              $shadowColor="rgba(59,130,246,0.4)"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              className="edit"
                              disabled={loading}
                              onClick={() => handleEdit(p)}
                              title="Edit"
                            >
                              <Edit3 size={16} />
                            </ActionBtn>
                            <ActionBtn
                              $shadowColor="rgba(239,68,68,0.4)"
                              whileHover={{ scale: 1.15 }}
                              whileTap={{ scale: 0.9 }}
                              className="delete"
                              disabled={loading}
                              onClick={() => handleDelete(p.id)}
                              title="Delete"
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
              <div className="info">
                Showing records <b>{indexOfFirst + 1}</b> to{" "}
                <b>{Math.min(indexOfLast, filtered.length)}</b> of{" "}
                <b>{filtered.length}</b>
              </div>
              <div className="controls">
                <PremiumBtn
                  className="secondary"
                  disabled={currentPage === 1 || loading}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  style={{
                    width: "auto",
                    padding: "8px 15px",
                    height: "40px",
                    borderRadius: "12px",
                  }}
                >
                  <ChevronLeft size={18} /> Prev
                </PremiumBtn>
                <PageIndicator>
                  Page {currentPage} of {totalPages || 1}
                </PageIndicator>
                <PremiumBtn
                  className="secondary"
                  disabled={currentPage === totalPages || totalPages === 0 || loading}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  style={{
                    width: "auto",
                    padding: "8px 15px",
                    height: "40px",
                    borderRadius: "12px",
                  }}
                >
                  Next <ChevronRight size={18} />
                </PremiumBtn>
              </div>
            </PaginationBar>
          </TableWrapper>

          {/* ADD/EDIT MODAL */}
          <AnimatePresence>
            {showModal && (
              <ModalOverlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <ModalContent
                  initial={{ scale: 0.9, y: 30 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 30 }}
                  transition={{ type: "spring", damping: 25 }}
                >
                  <ModalHeader>
                    <h2
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <Package size={22} color="#3b82f6" />{" "}
                      {editId ? "Update Product Details" : "New Inventory Item"}
                    </h2>
                    <button onClick={() => setShowModal(false)} disabled={loading}>
                      <X size={24} />
                    </button>
                  </ModalHeader>
                  <ModalBody>
                    <FormGrid>
                      <FormInputGroup style={{ gridColumn: "1 / -1" }}>
                        <label>Product Title</label>
                        <div className="input-wrapper">
                          <Package />
                          <input
                            value={form.name}
                            onChange={(e) =>
                              setForm({ ...form, name: e.target.value })
                            }
                            placeholder="e.g. Solar Panel 500W Premium"
                            disabled={loading}
                          />
                        </div>
                        {form.name && form.name.length < 3 && (
                          <InlineError>
                            <AlertCircle size={12} /> Name too short
                          </InlineError>
                        )}
                      </FormInputGroup>
                      <FormInputGroup>
                        <label>Category</label>
                        <div className="input-wrapper">
                          <Layers />
                          <select
                            value={form.productCategoryId}
                            disabled={loading}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                productCategoryId: e.target.value,
                              })
                            }
                          >
                            <option value="">Select Category...</option>
                            {category.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.categoryName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </FormInputGroup>
                      <FormInputGroup>
                        <label>Unit of Measure</label>
                        <div className="input-wrapper">
                          <Hash />
                          <input
                            list="unitOptions"
                            value={form.unit}
                            disabled={loading}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                unit: e.target.value.toUpperCase(),
                              })
                            }
                            placeholder="PCS / NOS / KG"
                          />
                          <datalist id="unitOptions">
                            <option value="PCS" />
                            <option value="NOS" />
                            <option value="SET" />
                            <option value="KG" />
                            <option value="LTR" />
                          </datalist>
                        </div>
                      </FormInputGroup>
                      <FormInputGroup>
                        <label>Cost Price (₹)</label>
                        <div className="input-wrapper">
                          <IndianRupee />
                          <input
                            type="number"
                            value={form.costPrice}
                            disabled={loading}
                            onChange={(e) =>
                              setForm({ ...form, costPrice: e.target.value })
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </FormInputGroup>
                      <FormInputGroup>
                        <label>Selling Price (₹)</label>
                        <div className="input-wrapper">
                          <IndianRupee />
                          <input
                            type="number"
                            value={form.price}
                            disabled={loading}
                            onChange={(e) =>
                              setForm({ ...form, price: e.target.value })
                            }
                            placeholder="0.00"
                          />
                        </div>
                        {livePrice > 0 && livePrice < liveCost && (
                          <InlineError>
                            <AlertCircle size={12} /> Selling price is below cost
                            price!
                          </InlineError>
                        )}
                      </FormInputGroup>
                      <FormInputGroup>
                        <label>GST Tax (%)</label>
                        <div className="input-wrapper">
                          <Percent />
                          <input
                            type="number"
                            value={form.gst}
                            disabled={loading}
                            onChange={(e) =>
                              setForm({ ...form, gst: e.target.value })
                            }
                            placeholder="18"
                          />
                        </div>
                      </FormInputGroup>
                      <FormInputGroup>
                        <label>HSN Code</label>
                        <div className="input-wrapper">
                          <Archive />
                          <input
                            value={form.hsn}
                            disabled={loading}
                            onChange={(e) =>
                              setForm({ ...form, hsn: e.target.value })
                            }
                            placeholder="4, 6 or 8 Digit Code"
                          />
                        </div>
                        {form.hsn &&
                          (!/^\d+$/.test(form.hsn) ||
                            ![4, 6, 8].includes(form.hsn.length)) && (
                            <InlineError>
                              <AlertCircle size={12} /> Invalid HSN Code format
                            </InlineError>
                          )}
                      </FormInputGroup>
                      <LivePreviewGrid>
                        <PreviewCard $color="#f59e0b">
                          <span>GST Amount</span>
                          <h4>₹{liveGstAmt.toFixed(2)}</h4>
                        </PreviewCard>
                        <PreviewCard $color="#10b981">
                          <span>Final Price (Inc. Tax)</span>
                          <h4>₹{liveFinalPrice.toFixed(2)}</h4>
                        </PreviewCard>
                        <PreviewCard
                          $color={liveProfit < 0 ? "#ef4444" : "#3b82f6"}
                        >
                          <span>Gross Profit</span>
                          <h4>₹{liveProfit.toFixed(2)}</h4>
                        </PreviewCard>
                      </LivePreviewGrid>
                    </FormGrid>
                  </ModalBody>
                  <ModalFooter>
                    <PremiumBtn
                      className="danger-outline"
                      disabled={loading}
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </PremiumBtn>
                    <PremiumBtn className="primary" onClick={handleSave} disabled={loading}>
                      <CheckCircle2 size={18} />{" "}
                      {editId ? "Update Product" : "Confirm & Save"}
                    </PremiumBtn>
                  </ModalFooter>
                </ModalContent>
              </ModalOverlay>
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
                <SmallExportModal
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                >
                  <ModalHeader
                    style={{
                      justifyContent: "center",
                      borderBottom: "none",
                      paddingBottom: "10px",
                    }}
                  >
                    <h2 style={{ fontSize: "24px" }}>
                      <Download size={28} color="#0ea5e9" /> Choose Export Format
                    </h2>
                  </ModalHeader>
                  <div style={{ padding: "0 30px" }}>
                    <p>
                      Select how you want to export the currently filtered product
                      catalogue ({filtered.length} records).
                    </p>
                    <div className="export-options">
                      <PremiumBtn
                        className="secondary"
                        disabled={loading}
                        style={{ flex: 1, height: "60px" }}
                        onClick={handleExportPDF}
                      >
                        <FileText size={20} color="#3b82f6" /> HTML / PDF
                      </PremiumBtn>
                      <PremiumBtn
                        className="secondary"
                        disabled={loading}
                        style={{ flex: 1, height: "60px" }}
                        onClick={handleExportCSV}
                      >
                        <FileSpreadsheet size={20} color="#10b981" /> CSV Data
                      </PremiumBtn>
                    </div>
                  </div>
                  <ModalFooter
                    style={{
                      justifyContent: "center",
                      background: "transparent",
                      borderTop: "none",
                    }}
                  >
                    <PremiumBtn
                      className="danger-outline"
                      disabled={loading}
                      onClick={() => setShowExportModal(false)}
                      style={{ width: "100%" }}
                    >
                      Cancel
                    </PremiumBtn>
                  </ModalFooter>
                </SmallExportModal>
              </ModalOverlay>
            )}
          </AnimatePresence>
          <style>{`.swal2-container { z-index: 99999 !important; }`}</style>
        </PageWrapper>
      </PageTransition>
    </>
  );
}