import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, RefreshCcw, AlertCircle, Calendar, Printer, 
  Download, RotateCcw, Search, LayoutGrid, Percent, Filter, 
  Plus, FileText, FileSpreadsheet, X, Layers, Hash, Archive, IndianRupee, PieChart, CheckCircle2, Edit3, Trash2, ChevronLeft, ChevronRight, PackageCheck
} from "lucide-react";
import CountUp from "react-countup";

import {
  getRequest,
  postRequest,
  putRequest,
  deleteRequest,
} from "./../../../Services/axiosService";
import {
  successAlert,
  errorAlert,
  warningAlert,
  confirmAlert,
} from "./../../../Services/sweetAlert";

import GlobalLoader from "../../components/common/GlobalLoader.jsx";
import PageTransition from "../../components/common/PageTransition.jsx";
import PremiumEmptyState from "../../components/common/PremiumEmptyState.jsx";
import {
  SkeletonCard,
  SkeletonTableRows,
} from "../../components/common/SkeletonLoader.jsx";

// 🌟 NUMBER ANIMATION COMPONENT
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
      if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
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

export default function ProductMaster() {
  const emptyProduct = {
    id: 0,
    code: "",
    name: "",
    productCategoryId: "",
    unit: "NOS",
    price: "",
    costPrice: "",
    gst: "",
    hsn: "",
  };

  const [product, setProduct] = useState(emptyProduct);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  // 🌟 Premium Enhancement States
  const [initialLoad, setInitialLoad] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeFy, setActiveFy] = useState(null);

  // 🌟 Filters
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [gstFilter, setGstFilter] = useState("all");

  // 🌟 Pagination Fixed at 5
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setInitialLoad(true);
    try {
      const fyRes = await getRequest("FinancialYear/List");
      if (fyRes.status === "OK" && fyRes.result) {
        const currentActiveFy = fyRes.result.find(
          (y) => y.isActive && !y.isDelete
        );
        setActiveFy(currentActiveFy || null);
      }
      await Promise.all([fetchCategories(), fetchProducts(false, true)]);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setInitialLoad(false), 700);
    }
  };

  const fetchProducts = async (isRefresh = false, isInit = false) => {
    try {
      if (isRefresh) setIsRefreshing(true);
      else if (!isInit) setLoading(true);

      const res = await getRequest("ProductMaster/List");
      if (res.status === "OK") setProducts(res.result || []);
    } catch {
      errorAlert("Error", "Failed to load products");
    } finally {
      if (isRefresh) setTimeout(() => setIsRefreshing(false), 600);
      else if (!isInit) setTimeout(() => setLoading(false), 400);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getRequest("ProductCategory/List");
      if (res.status === "OK") setCategories(res.result || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefresh = () => {
    fetchCategories();
    fetchProducts(true);
  };

  const handleResetFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setSortOrder("newest");
    setFromDate("");
    setToDate("");
    setMinPrice("");
    setMaxPrice("");
    setGstFilter("all");
    setCurrentPage(1);
  };

  // 🌟 Processing Data with ALL Filters
  const processedData = useMemo(() => {
    let result = [...products];
    
    if (search) {
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(search.toLowerCase()) ||
          p.code?.toLowerCase().includes(search.toLowerCase()) ||
          p.category?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (categoryFilter) {
      result = result.filter(
        (p) => Number(p.productCategoryId) === Number(categoryFilter)
      );
    }
    if (minPrice) {
      result = result.filter((p) => Number(p.price) >= Number(minPrice));
    }
    if (maxPrice) {
      result = result.filter((p) => Number(p.price) <= Number(maxPrice));
    }
    if (gstFilter === "gst") {
      result = result.filter((p) => Number(p.gst) > 0);
    }
    if (gstFilter === "no-gst") {
      result = result.filter((p) => Number(p.gst) === 0 || !p.gst);
    }
    if (fromDate)
      result = result.filter(
        (p) => new Date(p.createdAt || new Date()) >= new Date(fromDate)
      );
    if (toDate)
      result = result.filter(
        (p) => new Date(p.createdAt || new Date()) <= new Date(toDate)
      );

    if (sortOrder === "a-z")
      result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    else if (sortOrder === "price-high")
      result.sort((a, b) => b.price - a.price);
    else if (sortOrder === "oldest")
      result.sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      );
    else
      result.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    return result;
  }, [products, search, fromDate, toDate, sortOrder, categoryFilter, minPrice, maxPrice, gstFilter]);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentRecords = processedData.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortOrder, categoryFilter, fromDate, toDate, minPrice, maxPrice, gstFilter]);

  // 🌟 Export Functions (Staff Product Style)
  const handleExportCSV = () => {
    if (processedData.length === 0)
      return warningAlert("Empty", "No data to export");
    const headers = [
      "ID",
      "Code",
      "Name",
      "Category",
      "Unit",
      "Selling Price",
      "Cost Price",
      "GST %",
      "HSN",
    ];
    const rows = processedData.map((p) => [
      p.id,
      `"${p.code || ""}"`,
      `"${p.name || ""}"`,
      `"${p.category || ""}"`,
      p.unit,
      p.price,
      p.costPrice,
      p.gst,
      p.hsn,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Product_Catalogue_${new Date().getTime()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportModal(false);
  };

  const handleExportPDF = () => {
    if (processedData.length === 0)
      return warningAlert("Empty", "No data to export");

    const printWindow = window.open("", "_blank");
    const currentDate = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    const htmlContent = `
      <html>
        <head>
          <title>Product Catalogue Report</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; background: #fff; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
            .header h1 { margin: 0 0 10px 0; color: #0f172a; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
            .header p { margin: 0; color: #64748b; font-size: 14px; }
            .meta-info { display: flex; justify-content: space-between; margin-bottom: 30px; background: #f8fafc; padding: 15px 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .meta-info div { font-size: 13px; font-weight: 600; color: #475569; }
            .meta-info span { color: #0f172a; font-weight: 700; margin-left: 8px; }
            table { width: 100%; border-collapse: separate; border-spacing: 0; margin-bottom: 30px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
            th, td { padding: 14px 16px; text-align: left; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
            th { background: #f8fafc; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; font-size: 11px; }
            tr:last-child td { border-bottom: none; }
            tbody tr:nth-child(even) { background: #f8fafc; }
            .badge { padding: 4px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; background: #e0f2fe; color: #0284c7; }
            .price { font-weight: 700; color: #0f172a; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
            @media print {
              body { padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .meta-info { break-inside: avoid; }
              table { break-inside: auto; }
              tr { break-inside: avoid; page-break-after: auto; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PRODUCT CATALOGUE REPORT</h1>
            <p>Complete Enterprise Inventory Listing</p>
          </div>
          <div class="meta-info">
            <div>Total Products: <span>${processedData.length}</span></div>
            <div>Generated On: <span>${currentDate}</span></div>
            <div>Status: <span>Confidential / Internal</span></div>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Product Details</th>
                <th>Category</th>
                <th>Unit</th>
                <th>MRP (₹)</th>
                <th>GST %</th>
              </tr>
            </thead>
            <tbody>
              ${processedData
                .map(
                  (p, index) => `
                <tr>
                  <td style="color: #64748b; font-weight: 600;">${
                    index + 1
                  }</td>
                  <td>
                    <div style="font-weight: 700; color: #0f172a; margin-bottom: 4px;">${
                      p.name
                    }</div>
                    <div style="font-size: 11px; color: #64748b;">Code: ${
                      p.code || "N/A"
                    }</div>
                  </td>
                  <td><span class="badge">${
                    p.category || "Uncategorized"
                  }</span></td>
                  <td style="font-weight: 600; color: #475569;">${p.unit}</td>
                  <td class="price">₹${Number(p.price).toLocaleString(
                    "en-IN"
                  )}</td>
                  <td style="font-weight: 600; color: #475569;">${p.gst}%</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            Generated by Abson Energy ERP System &bull; ${new Date().toLocaleString()}
          </div>
          <script>
            window.onload = function() {
              setTimeout(() => {
                window.print();
                window.onafterprint = function() { window.close(); }
              }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setShowExportModal(false);
  };

  const isFyLocked = activeFy && activeFy.isClosed;

  const handleChange = (e) => {
    setProduct({ ...product, [e.target.name]: e.target.value });
  };

  const handleAddClick = () => {
    if (isFyLocked || !activeFy) {
      return warningAlert(
        "Financial Year Locked",
        "Cannot modify products in closed or missing financial year."
      );
    }
    setProduct(emptyProduct);
    setShowModal(true);
  };

  const handleEditClick = async (id) => {
    if (isFyLocked || !activeFy) {
      return warningAlert(
        "Financial Year Locked",
        "Cannot modify products in closed or missing financial year."
      );
    }
    try {
      const res = await getRequest(`ProductMaster/Detail/${id}`);
      if (res.status === "OK" && res.result) {
        setProduct({
          id: res.result.id,
          code: res.result.code || "",
          name: res.result.name || "",
          productCategoryId: res.result.productCategoryId || "",
          unit: res.result.unit || "NOS",
          price: res.result.price || "",
          costPrice: res.result.costPrice || "",
          gst: res.result.gst || "",
          hsn: res.result.hsn || "",
        });
        setShowModal(true);
      }
    } catch {
      errorAlert("Error", "Failed to load details");
    }
  };

  const handleDeleteClick = async (id) => {
    if (isFyLocked || !activeFy) {
      return warningAlert(
        "Financial Year Locked",
        "Cannot modify products in closed or missing financial year."
      );
    }
    const confirm = await confirmAlert(
      "Delete Product?",
      "This cannot be undone."
    );
    if (!confirm.isConfirmed) return;
    try {
      const res = await deleteRequest(`ProductMaster/Delete/${id}`);
      if (res.status === "OK") {
        successAlert("Deleted", "Product deleted");
        fetchProducts();
      } else {
        errorAlert("Error", res.message);
      }
    } catch {
      errorAlert("Error", "Delete failed");
    }
  };

  const handleSave = async () => {
    if (!product.name || !product.productCategoryId)
      return warningAlert("Validation", "Name & Category are required.");
    try {
      setSubmitLoading(true);
      const payload = {
        ...product,
        productCategoryId: Number(product.productCategoryId),
      };
      const res =
        product.id > 0
          ? await putRequest("ProductMaster/Update", payload)
          : await postRequest("ProductMaster/Save", payload);

      if (res.status === "OK") {
        successAlert(
          "Success",
          product.id > 0 ? "Product Updated" : "Product Added"
        );
        setShowModal(false);
        setProduct(emptyProduct);
        fetchProducts();
      } else {
        errorAlert("Error", res.message || "Failed to save");
      }
    } catch (err) {
      errorAlert("API Error", err.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  /* ===== DYNAMIC STATS ===== */
  const totalProducts = products.length;
  const activeCategories = new Set(products.map((p) => p.productCategoryId)).size;
  const totalCatalogCost = products.reduce((acc, p) => acc + (Number(p.costPrice) || 0), 0);
  const gstEnabledCount = products.filter(p => Number(p.gst) > 0).length;

  return (
    <>
      <GlobalLoader isLoading={initialLoad} />
      <PageTransition>
        <PageWrapper className="p-2 p-md-4">
          <HeaderSection className="mb-4 d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end gap-3 no-print">
            <div className="title-area">
              <PageTitle>
                <Package className="title-icon" size={28} /> Product Catalog
              </PageTitle>
              <p className="subtitle">Enterprise catalog & inventory management</p>
            </div>
            
            <button
              className="btn-glow primary w-100 w-md-auto"
              onClick={handleAddClick}
              disabled={isFyLocked}
              style={{ opacity: isFyLocked ? 0.6 : 1 }}
            >
              <Plus size={18} style={{ marginRight: '6px' }} /> Add Product
            </button>
          </HeaderSection>

          {activeFy ? (
            <FyBadge className="no-print">
              <Calendar size={12} /> Active Financial Year: {activeFy.yearName}
            </FyBadge>
          ) : (
            !initialLoad && (
              <FyBadge className="error no-print">
                <AlertCircle size={12} /> No Active Financial Year Found
              </FyBadge>
            )
          )}

          {/* 📊 Premium Summary & Action Cards */}
          <ActionAndStatGrid className="mb-4 no-print">
            {initialLoad || loading ? (
              <>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </>
            ) : (
              <>
                {/* Stats Cards */}
                <SummaryCard>
                  <div className="inner-content">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <span className="text-muted-custom fw-semibold text-uppercase tracking-wide" style={{ fontSize: "11px" }}>
                        Total Inventory
                      </span>
                      <div className="icon-box bg-primary-subtle text-primary">
                        <Package size={20} />
                      </div>
                    </div>
                    <h3 className="fw-bold mt-2 text-custom mb-0">
                      <AnimatedNumber value={totalProducts} />
                    </h3>
                    <small className="text-success mt-2 d-block fw-bold">
                      Items in Catalog
                    </small>
                  </div>
                </SummaryCard>

                <SummaryCard>
                  <div className="inner-content">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <span className="text-muted-custom fw-semibold text-uppercase tracking-wide" style={{ fontSize: "11px" }}>
                        Total Catalog Cost
                      </span>
                      <div className="icon-box bg-warning-subtle text-warning">
                        <i className="fas fa-rupee-sign" style={{ fontSize: "18px" }}></i>
                      </div>
                    </div>
                    <h3 className="fw-bold mt-2 text-custom mb-0">
                      <AnimatedNumber value={totalCatalogCost} isCurrency />
                    </h3>
                    <small className="text-warning mt-2 d-block fw-bold">
                      Sum of 1 unit each
                    </small>
                  </div>
                </SummaryCard>

                <SummaryCard>
                  <div className="inner-content">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <span className="text-muted-custom fw-semibold text-uppercase tracking-wide" style={{ fontSize: "11px" }}>
                        GST Enabled
                      </span>
                      <div className="icon-box bg-danger-subtle text-danger">
                        <Percent size={20} />
                      </div>
                    </div>
                    <h3 className="fw-bold mt-2 text-custom mb-0">
                      <AnimatedNumber value={gstEnabledCount} />
                    </h3>
                    <small className="text-danger mt-2 d-block fw-bold">
                      Products with tax
                    </small>
                  </div>
                </SummaryCard>

                {/* Action Cards (Staff Style) */}
                <ActionCard onClick={() => setShowExportModal(true)}>
                  <div className="left-content">
                    <div className="icon-wrapper bg-primary-subtle text-primary">
                      <Printer size={20} />
                    </div>
                    <div className="text-content">
                      <h6>Print List</h6>
                      <small>Print filtered view</small>
                    </div>
                  </div>
                  <button className="btn-action-small" disabled={initialLoad || loading || processedData.length === 0}>
                    Print
                  </button>
                </ActionCard>

                <ActionCard onClick={() => setShowExportModal(true)}>
                  <div className="left-content">
                    <div className="icon-wrapper bg-success-subtle text-success">
                      <Download size={20} />
                    </div>
                    <div className="text-content">
                      <h6>Export Data</h6>
                      <small>Download excel data</small>
                    </div>
                  </div>
                  <button className="btn-action-small" disabled={initialLoad || loading || processedData.length === 0}>
                    Export
                  </button>
                </ActionCard>

                <ActionCard onClick={handleRefresh}>
                  <div className="left-content">
                    <div className="icon-wrapper bg-info-subtle text-info">
                      <RefreshCcw size={20} className={isRefreshing ? "spin" : ""} />
                    </div>
                    <div className="text-content">
                      <h6>Sync Data</h6>
                      <small>Refresh inventory</small>
                    </div>
                  </div>
                  <button className="btn-action-small" disabled={initialLoad || loading || isRefreshing}>
                    Sync
                  </button>
                </ActionCard>
              </>
            )}
          </ActionAndStatGrid>

          <GlassCard className="p-3 p-md-4 mb-4">
            {/* 🔍 Compact Single Row Filter Bar */}
            <CompactFilterBar className="mb-4 no-print">
              <div className="filter-item search-item">
                <Search size={14} className="icon" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="filter-item">
                <LayoutGrid size={14} className="icon" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.categoryName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-item">
                <i className="fas fa-rupee-sign icon" style={{ fontSize: '13px' }}></i>
                <input
                  type="number"
                  placeholder="Min Price"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
              </div>
              <div className="filter-item">
                <i className="fas fa-rupee-sign icon" style={{ fontSize: '13px' }}></i>
                <input
                  type="number"
                  placeholder="Max Price"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              <div className="filter-item">
                <Percent size={14} className="icon" />
                <select
                  value={gstFilter}
                  onChange={(e) => setGstFilter(e.target.value)}
                >
                  <option value="all">All GST Status</option>
                  <option value="gst">GST Included</option>
                  <option value="no-gst">No GST</option>
                </select>
              </div>
              <div className="filter-item">
                <Filter size={14} className="icon" />
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-high">Highest Price</option>
                  <option value="a-z">Name (A-Z)</option>
                </select>
              </div>
              <div className="filter-item date-item">
                <Calendar size={14} className="icon" />
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  title="From Date"
                />
              </div>
              <div className="filter-item date-item">
                <Calendar size={14} className="icon" />
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  title="To Date"
                />
              </div>
              <button className="btn-reset" onClick={handleResetFilters}>
                <RotateCcw size={14} /> Reset
              </button>
            </CompactFilterBar>

            <TableWrapper className="printable-table">
              <Table>
                <thead>
                  <tr>
                    <th>Product Details</th>
                    <th>Category</th>
                    <th>Price / Cost</th>
                    <th>Taxes (GST)</th>
                    <th className="no-print" style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {initialLoad || loading || isRefreshing ? (
                    <SkeletonTableRows rows={itemsPerPage} columns={5} />
                  ) : currentRecords.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: "3rem 0", borderBottom: "none" }}>
                        <PremiumEmptyState
                          icon={Package}
                          title="No Products Found"
                          subtitle="No products match your filters or available records."
                        />
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((p, i) => (
                      <tr key={p.id} className="list-row">
                        <td>
                          <div className="product-info">
                            <div className="prd-avatar shadow-sm">
                              <i className="fas fa-box"></i>
                            </div>
                            <div>
                              <div className="fw-bolder text-custom fs-6">{p.name}</div>
                              <small className="text-muted-custom fw-medium">
                                Code: {p.code || "N/A"}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge-custom bg-info-subtle text-info fw-bold">
                            {p.category || "-"}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <span className="text-success fw-bold">
                              SP: ₹{p.price} / {p.unit}
                            </span>
                            <span className="text-muted-custom small fw-medium">
                              CP: ₹{p.costPrice}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column">
                            <span className="text-custom fw-bold">{p.gst}%</span>
                            <span className="text-muted-custom small fw-medium">
                              HSN: {p.hsn || "-"}
                            </span>
                          </div>
                        </td>
                        <td className="no-print">
                          <ActionButtons>
                            <button
                              className="edit"
                              onClick={() => handleEditClick(p.id)}
                              disabled={isFyLocked}
                              title={isFyLocked ? "Locked in active FY" : "Edit"}
                            >
                              <i className="fas fa-pen"></i>
                            </button>
                            <div className="action-divider"></div>
                            <button
                              className="delete"
                              onClick={() => handleDeleteClick(p.id)}
                              disabled={isFyLocked}
                              title={isFyLocked ? "Locked in active FY" : "Delete"}
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

            {/* 🌟 Pagination Logic */}
            {!loading && !initialLoad && processedData.length > itemsPerPage && (
              <PaginationWrapper className="mt-4 pt-3 border-top border-custom no-print">
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
                    <i className="fas fa-chevron-left me-1"></i> Prev
                  </button>
                  <span className="page-indicator">
                    {currentPage} / {totalPages || 1}
                  </span>
                  <button
                    className="action-btn-page"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((c) => c + 1)}
                  >
                    Next <i className="fas fa-chevron-right ms-1"></i>
                  </button>
                </div>
              </PaginationWrapper>
            )}
          </GlassCard>

          {/* 🎭 MODAL (Premium Layout) */}
          <AnimatePresence>
            {showModal && (
              <ModalOverlay
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                onClick={() => {
                  if (!submitLoading) {
                    setShowModal(false);
                    setProduct(emptyProduct);
                  }
                }}
              >
                <ModalContent
                  initial={{ scale: 0.95, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.95, y: 20, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <ModalHeader>
                    <h5 className="fw-bolder mb-0 text-custom d-flex align-items-center gap-3 fs-4">
                      <div className="icon-box-sm bg-primary-subtle text-primary shadow-sm">
                        <i className="fas fa-box"></i>
                      </div>
                      {product.id > 0 ? "Edit Product" : "Add New Product"}
                    </h5>
                    <button
                      className="close-btn"
                      onClick={() => {
                        if (!submitLoading) {
                          setShowModal(false);
                          setProduct(emptyProduct);
                        }
                      }}
                      disabled={submitLoading}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </ModalHeader>
                  <div
                    className="modal-body p-4 custom-scrollbar"
                    style={{ maxHeight: "70vh", overflowY: "auto" }}
                  >
                    <div className="row g-4">
                      <div className="col-md-6">
                        <FormGroup>
                          <label>Product Name <span className="text-danger">*</span></label>
                          <FormInput name="name" value={product.name} onChange={handleChange} placeholder="Product Name" disabled={submitLoading} autoFocus />
                        </FormGroup>
                      </div>
                      <div className="col-md-6">
                        <FormGroup>
                          <label>Product Code</label>
                          <FormInput name="code" value={product.code} onChange={handleChange} placeholder="Product Code" disabled={submitLoading} />
                        </FormGroup>
                      </div>
                      <div className="col-md-6">
                        <FormGroup>
                          <label>Category <span className="text-danger">*</span></label>
                          <FormSelect name="productCategoryId" value={product.productCategoryId} onChange={handleChange} disabled={submitLoading}>
                            <option value="">Select Category</option>
                            {categories.map((c) => (<option key={c.id} value={c.id}>{c.categoryName}</option>))}
                          </FormSelect>
                        </FormGroup>
                      </div>
                      <div className="col-md-6">
                        <FormGroup>
                          <label>Measurement Unit</label>
                          <FormSelect name="unit" value={product.unit} onChange={handleChange} disabled={submitLoading}>
                            <option value="NOS">NOS (Numbers)</option>
                            <option value="PCS">PCS (Pieces)</option>
                            <option value="KG">KG</option>
                            <option value="LTR">Liters</option>
                            <option value="MTR">Meters</option>
                            <option value="SET">SET</option>
                          </FormSelect>
                        </FormGroup>
                      </div>
                      <div className="col-12 mt-2">
                        <h6 className="text-primary border-bottom border-custom pb-2 fw-bold text-uppercase" style={{fontSize: "12px", letterSpacing: "0.5px"}}><i className="fas fa-tags me-2"></i>Pricing & Taxes</h6>
                      </div>
                      <div className="col-md-6">
                        <FormGroup>
                          <label>Selling Price (MRP) <span className="text-danger">*</span></label>
                          <div className="currency-input d-flex">
                            <span className="currency-symbol" style={{background: 'var(--bg-light-custom)', border: '1px solid var(--border-custom)', borderRight: 'none', padding: '14px 18px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', color: 'var(--text-muted)', fontWeight: 'bold'}}>₹</span>
                            <FormInput type="number" name="price" value={product.price} onChange={handleChange} placeholder="e.g., 2500" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} disabled={submitLoading} />
                          </div>
                        </FormGroup>
                      </div>
                      <div className="col-md-6">
                        <FormGroup>
                          <label>Cost Price (Purchase Rate)</label>
                          <div className="currency-input d-flex">
                            <span className="currency-symbol" style={{background: 'var(--bg-light-custom)', border: '1px solid var(--border-custom)', borderRight: 'none', padding: '14px 18px', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px', color: 'var(--text-muted)', fontWeight: 'bold'}}>₹</span>
                            <FormInput type="number" name="costPrice" value={product.costPrice} onChange={handleChange} placeholder="e.g., 2100" style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }} disabled={submitLoading} />
                          </div>
                        </FormGroup>
                      </div>
                      <div className="col-md-6">
                        <FormGroup>
                          <label>GST (%)</label>
                          <FormInput type="number" name="gst" value={product.gst} onChange={handleChange} placeholder="e.g., 18" disabled={submitLoading} />
                        </FormGroup>
                      </div>
                      <div className="col-md-6">
                        <FormGroup>
                          <label>HSN / SAC Code</label>
                          <FormInput name="hsn" value={product.hsn} onChange={handleChange} placeholder="e.g., 854140" disabled={submitLoading} />
                        </FormGroup>
                      </div>
                    </div>
                  </div>
                  <ModalFooter>
                    <button
                      className="modal-action-btn danger"
                      onClick={() => {
                        setShowModal(false);
                        setProduct(emptyProduct);
                      }}
                      disabled={submitLoading}
                    >
                      <i className="fas fa-times me-2"></i> Cancel
                    </button>
                    <button
                      className="modal-action-btn success"
                      onClick={handleSave}
                      disabled={submitLoading}
                    >
                      {submitLoading ? (
                        <i className="fas fa-spinner fa-spin me-2"></i>
                      ) : (
                        <i className="fas fa-check me-2"></i>
                      )}
                      {submitLoading ? "Saving..." : product.id > 0 ? "Update" : "Save"}
                    </button>
                  </ModalFooter>
                </ModalContent>
              </ModalOverlay>
            )}
          </AnimatePresence>

          {/* 🎭 EXPORT MODAL */}
          <AnimatePresence>
            {showExportModal && (
              <ModalOverlay
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowExportModal(false)}
                style={{ zIndex: 1060 }}
              >
                <SmallExportModal
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 text-center">
                    <div className="icon-circle mx-auto mb-3">
                      <Download size={32} color="#3b82f6" />
                    </div>
                    <h4 className="fw-bold mb-2 text-custom">Choose Export Format</h4>
                    <p className="text-muted-custom small mb-4">Select how you want to export the currently filtered product catalogue.</p>
                    <div className="d-flex gap-3">
                      <PremiumBtn 
                        className="secondary" 
                        style={{ flex: 1, height: "60px", flexDirection: 'column', gap: '5px' }} 
                        onClick={handleExportPDF}
                        disabled={loading || processedData.length === 0}
                      >
                        <FileText size={20} color="#3b82f6" /> <span style={{fontSize: '11px'}}>HTML / PDF</span>
                      </PremiumBtn>
                      <PremiumBtn 
                        className="secondary" 
                        style={{ flex: 1, height: "60px", flexDirection: 'column', gap: '5px' }} 
                        onClick={handleExportCSV}
                        disabled={loading || processedData.length === 0}
                      >
                        <FileSpreadsheet size={20} color="#10b981" /> <span style={{fontSize: '11px'}}>CSV Data</span>
                      </PremiumBtn>
                    </div>
                  </div>
                  <ModalFooter style={{ justifyContent: "center", background: "transparent", borderTop: "none", padding: "0 24px 24px" }}>
                    <PremiumBtn className="danger-outline" onClick={() => setShowExportModal(false)} style={{ width: "100%" }}>
                      Cancel
                    </PremiumBtn>
                  </ModalFooter>
                </SmallExportModal>
              </ModalOverlay>
            )}
          </AnimatePresence>

        </PageWrapper>
      </PageTransition>

      <style>{`
        .spin { animation: rotate 1s linear infinite; }
        @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media print {
          body * { visibility: hidden; }
          .printable-table, .printable-table * { visibility: visible; }
          .printable-table { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; }
          .no-print { display: none !important; }
        }
      `}</style>
    </>
  );
}

/* ================= STYLED COMPONENTS ================= */

const PageWrapper = styled.div`
  min-height: 100vh;
  color: var(--text);
  font-family: "Inter", sans-serif;
  max-width: 1600px;
  margin: 0 auto;

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--border-custom);
    border-radius: 10px;
  }
`;

const BreadcrumbLink = styled(Link)`
  color: var(--text-muted);
  text-decoration: none;
  transition: all 0.2s ease;
  font-weight: 600;
  &:hover {
    color: var(--primary);
  }
`;

const HeaderSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;

  .title-area {
    .subtitle {
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 500;
      margin: 4px 0 0 0;
    }
  }
  
  .btn-glow {
    padding: 10px 20px;
    border: none;
    border-radius: 10px;
    font-weight: 700;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.primary {
      background: linear-gradient(135deg, #3b82f6, #06b6d4);
      color: white;
      box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    }
    
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      filter: brightness(1.1);
      box-shadow: 0 8px 20px rgba(59, 130, 246, 0.4);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      box-shadow: none;
      transform: none;
    }
  }
`;

const PageTitle = styled.h2`
  font-size: 28px;
  font-weight: 800;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;

  .title-icon {
    color: #3b82f6;
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

/* 🌟 DYNAMIC SUMMARY & ACTION CARDS WITH PREMIUM DESIGN */
const ActionAndStatGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  
  gap: 16px;
`;

const SummaryCard = styled.div`
  position: relative;
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px rgba(13, 51, 236, 0.81);
  z-index: 1;

  .inner-content {
    padding: 20px;
    background: transparent;
    border-radius: 15px;
  }
  
  &:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 12px 30px rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
  }
  
  .icon-box {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  &:hover .icon-box {
    transform: scale(1.1) rotate(5deg);
  }
`;

const ActionCard = styled.div`
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 6px rgba(13, 51, 236, 0.81);
  cursor: pointer;

  &:hover {
    transform: translateY(-4px) scale(1.01);
    box-shadow: 0 12px 30px rgba(59, 130, 246, 0.1);
    border-color: rgba(59, 130, 246, 0.3);
  }

  .left-content {
    display: flex;
    align-items: center;
    gap: 12px;

    .icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;
    }

    &:hover .icon-wrapper {
      transform: scale(1.1) rotate(5deg);
    }

    .text-content {
      display: flex;
      flex-direction: column;
      h6 { margin: 0; font-size: 14px; font-weight: 800; color: var(--text); letter-spacing: 0.3px; }
      small { margin: 0; font-size: 11px; color: var(--text-muted); font-weight: 600; text-transform: uppercase; }
    }
  }

  .btn-action-small {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 700;
    border: 1px solid var(--border-custom);
    background: var(--bg-light-custom);
    color: var(--text);
    transition: all 0.3s ease;
    cursor: pointer;

    &:hover:not(:disabled) {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
      border-color: transparent;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      transform: translateY(-2px);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }
`;

const GlassCard = styled.div`
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 20px;
  box-shadow: 0 4px 6px rgba(13, 51, 236, 0.81);
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s ease, border-color 0.4s ease;

  &:hover {
    box-shadow: 0 16px 40px rgba(59, 130, 246, 0.05);
  }
`;

const CompactFilterBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  background: var(--bg-light-custom);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--border-custom);
  box-shadow: 0 4px 15px rgba(0,0,0,0.02);
  overflow-x: auto;
  white-space: nowrap;

  &::-webkit-scrollbar { height: 4px; }
  &::-webkit-scrollbar-thumb { background: var(--border-custom); border-radius: 10px; }

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
    min-width: 130px;

    &:focus-within {
      border-color: var(--primary);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .icon {
      color: var(--text-muted);
      margin-right: 8px;
    }

    input, select {
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
    min-width: 200px;
  }

  .date-item {
    min-width: 140px;
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
  border-radius: 12px;
  border: 1px solid var(--border-custom);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th {
    padding: 16px;
    text-align: left;
    color: #38bdf8;
    font-size: 11px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    background: var(--bg-light-custom);
    border-bottom: 1px solid var(--border-custom);
  }
  
  td {
    padding: 16px;
    vertical-align: middle;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-bottom: 1px solid var(--border-custom);
  }

  tr.list-row {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  /* 🌟 PREMIUM HOVER ANIMATION */
  tr.list-row:hover {
    background: var(--bg-hover);
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(59, 130, 246, 0.05);
  }
  
  tr.list-row:hover td {
    border-color: rgba(59, 130, 246, 0.2);
  }

  .prd-avatar {
    width: 42px;
    height: 42px;
    background: rgba(59, 130, 246, 0.15);
    color: var(--primary);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: all 0.3s ease;
  }

  tr.list-row:hover .prd-avatar {
    transform: scale(1.1) rotate(5deg);
    background: var(--primary);
    color: white;
  }

  .product-info {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .badge-custom {
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 700;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;

  .action-divider {
    width: 1px;
    height: 20px;
    background: var(--border-custom);
    margin: 0 4px;
  }

  button {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-light-custom);

    &.edit { color: #0ea5e9; }
    &.delete { color: #ef4444; }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:hover:not(:disabled).edit {
      transform: translateY(-3px);
      background: #0ea5e9;
      color: white;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
    }
    
    &:hover:not(:disabled).delete {
      transform: translateY(-3px);
      background: #ef4444;
      color: white;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
    }
  }
`;

const PaginationWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
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
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
`;

const ModalContent = styled(motion.div)`
  background: var(--card);
  color: var(--text);
  width: 90%;
  max-width: 800px;
  border-radius: 20px;
  border: 1px solid var(--border-custom);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(59, 130, 246, 0.15);
  overflow: hidden;
`;

const SmallExportModal = styled(motion.div)`
  background: var(--card);
  width: 100%;
  max-width: 400px;
  border-radius: 20px;
  border: 1px solid var(--border-custom);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  
  .icon-circle {
    width: 64px; height: 64px;
    background: rgba(59, 130, 246, 0.1);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
  }
`;

const ModalHeader = styled.div`
  padding: 24px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--bg-light-custom);
  border-bottom: 1px solid var(--border-custom);
  
  .icon-box-sm {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .close-btn {
    background: var(--card);
    border: 1px solid var(--border-custom);
    color: var(--text-muted);
    width: 36px;
    height: 36px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover:not(:disabled) {
      background: var(--danger);
      color: white;
      border-color: var(--danger);
      transform: rotate(90deg);
      box-shadow: 0 4px 10px rgba(239, 68, 68, 0.3);
    }
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text);
    margin-left: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const FormInput = styled.input`
  width: 100%;
  padding: 14px 18px;
  border-radius: 12px;
  background: var(--bg-light-custom);
  color: var(--text) !important;
  border: 1px solid var(--border-custom);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &::placeholder {
    color: var(--text-muted);
    opacity: 0.6;
  }
  
  &:hover:not(:disabled) {
    border-color: rgba(59, 130, 246, 0.5);
  }
  
  &:focus:not(:disabled) {
    background: var(--card);
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
    outline: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 14px 18px;
  border-radius: 12px;
  background: var(--bg-light-custom);
  color: var(--text) !important;
  border: 1px solid var(--border-custom);
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover:not(:disabled) {
    border-color: rgba(59, 130, 246, 0.5);
  }
  
  &:focus:not(:disabled) {
    background: var(--card);
    border-color: var(--primary);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
    outline: none;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ModalFooter = styled.div`
  padding: 24px 30px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  border-top: 1px solid var(--border-custom);
  background: var(--bg-light-custom);

  .modal-action-btn {
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 700;
    font-size: 13px;
    border: none;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.danger {
      background: transparent;
      color: #ef4444;
      border: 1px solid #ef4444;
    }
    
    &.danger:hover:not(:disabled) {
      background: #ef4444;
      color: white;
      box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);
      transform: translateY(-2px);
    }
    
    &.success {
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    }
    
    &.success:hover:not(:disabled) {
      filter: brightness(1.1);
      box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
      transform: translateY(-2px);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
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

  &.secondary {
    background: var(--card);
    color: var(--text);
    border: 1px solid var(--border-custom);
    box-shadow: 0 2px 6px rgba(0,0,0,0.05);
    &:hover:not(:disabled) {
      transform: translateY(-2px);
      border-color: var(--primary);
      color: var(--primary);
      box-shadow: 0 8px 16px rgba(59, 130, 246, 0.15);
    }
  }

  &.danger-outline {
    background: transparent;
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
    &:hover:not(:disabled) {
      background: rgba(239, 68, 68, 0.1);
      border-color: #ef4444;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;