import React, { createContext, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// ADMIN LAYOUT
import AbsonLayout from "./layouts/AdminLayout.jsx";

// ADMIN PAGES
import Dashboard from "./Pages/admin/Dashboard.jsx";
import ProductCategory from "./Pages/admin/ProductCategory.jsx";
import SoftwareSettings from "./Pages/admin/SoftwareSettings.jsx";
import ProductMaster from "./Pages/admin/ProductMaster";
import VendorMaster from "./Pages/admin/Vendor.jsx";
import ClientMaster from "./Pages/admin/ClientMaster";
import StaffMaster from "./Pages/admin/StaffMaster.jsx";
import FinancialYear from "./Pages/admin/FinancialYear.jsx";
import PurchaseEntry from "./Pages/admin/PurchaseEntry.jsx";
import InvoiceEntry from "./Pages/admin/InvoiceEntry.jsx";
import InwardStock from "./Pages/admin/InwardStock.jsx";
import OutwardEntry from "./Pages/admin/OutwardEntry.jsx";
import AdminProfile from "./Pages/admin/AdminProfile.jsx";
import AdminLogin from "./Pages/auth/Login.jsx";
import purchasereport from "./Pages/admin/PurchaseReport.jsx"
import SalesReport from "./Pages/admin/Salesreport.jsx";

// ✅ LOADER (ONLY IMPORT, NO useContext OUTSIDE)
import Loader from "./components/layouts/Loader.jsx";

// STAFF LAYOUT
import StaffLayout from "./layouts/StaffLayout.jsx";

// STAFF PAGES
import StaffDashboard from "./Pages/Staff/StaffDashboard.jsx";
import CreateInvoice from "./Pages/Staff/CreateInvoice.jsx";
import InvoicePreview from "./Pages/Staff/Invoice/Invoice.jsx";
import MyInvoices from "./Pages/Staff/MyInvoices.jsx";
import Payments from "./Pages/Staff/Payments.jsx";
import Customer from "./Pages/Staff/Customers.jsx";
import Products from "./Pages/Staff/Products.jsx";
import StaffHeader from "./components/layouts/StaffHeader.jsx";
import StaffLogin from "./Pages/auth/Login.jsx";
import StaffProfile from "./Pages/Staff/StaffProfile.jsx";
import PurchaseReport from "./Pages/admin/PurchaseReport.jsx";



// CONTEXT
export const rootContext = createContext();

export default function App() {

  const [loading, setLoading] = useState(false);

  return (
    <rootContext.Provider value={{ loading, setLoading }}>

      {/* ✅ GLOBAL LOADER */}
      {loading && <Loader />}

      <BrowserRouter>

        <Routes>
          {/* ================= ADMIN ================= */}
          
          <Route path="AdminLogin" element={<AdminLogin />} />
          <Route path="/admin" element={<AbsonLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="productcategory" element={<ProductCategory />} />
            <Route path="softwaresettings" element={<SoftwareSettings />} />
            <Route path="productmaster" element={<ProductMaster />} />
            <Route path="vendormaster" element={<VendorMaster />} />
            <Route path="clientmaster" element={<ClientMaster />} />
            <Route path="staffmaster" element={<StaffMaster />} />
            <Route path="financialyear" element={<FinancialYear />} />
            <Route path="purchaseentry" element={<PurchaseEntry />} />
            <Route path="invoiceentry" element={<InvoiceEntry />} />
            <Route path="inwardstock" element={<InwardStock />} />
            <Route path="outward" element={<OutwardEntry />} />
            <Route path="profile" element={<AdminProfile />} />
            <Route path="SalesReport" element={<SalesReport />} />
            <Route path="PurchaseReport" element={<PurchaseReport />} />
            

          </Route>

          {/* ================= STAFF ================= */}
          <Route path="/staff/Login" element={<StaffLogin />}></Route>
          <Route path="/staff" element={<StaffLayout />}>
          

            {/* DEFAULT STAFF REDIRECT */}
            <Route index element={<Navigate to="dashboard" />} />

            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="invoice" element={<CreateInvoice />} />
            <Route path="invoicepreview" element={<InvoicePreview />} />
            <Route path="myinvoices" element={<MyInvoices />} />

            <Route path="Payments" element={<Payments />} />
            <Route path="Customer" element={<Customer />} />
            <Route path="Products" element={<Products />} />
            <Route path="StaffProfile" element={<StaffProfile />} />
            

            {/* OPTIONAL LOADER ROUTE */}
            <Route path="loader" element={<Loader />} />
            <Route path="StaffHeader" element={<StaffHeader />} />


          </Route>

          {/* 404 FALLBACK */}
          <Route
            path="*"
            element={<h4 style={{ padding: 20 }}>Page Not Found</h4>}
          />

        </Routes>

      </BrowserRouter>

    </rootContext.Provider>
  );
}