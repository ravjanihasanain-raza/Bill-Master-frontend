import React, { useEffect, useState } from "react";
import styled, { keyframes, css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Hash,
  CreditCard,
  UserCheck,
  Clock,
  Edit3,
  RefreshCcw
} from "lucide-react";
import Swal from "sweetalert2";
import { getRequest, postRequest, putRequest } from "../../../Services/axiosService.jsx";

// --- PREMIUM UTILITIES ---
import GlobalLoader from "../../components/common/GlobalLoader.jsx";
import PageTransition from "../../components/common/PageTransition.jsx";
import PremiumEmptyState from "../../components/common/PremiumEmptyState.jsx";
import { SkeletonForm, SkeletonStats } from "../../components/common/SkeletonLoader.jsx";

/* =========================================================
   ANIMATIONS & MIXINS
   ========================================================= */
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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
   STYLED COMPONENTS (PREMIUM ERP THEME)
   ========================================================= */
const PageWrapper = styled.div`
  padding: 24px;
  min-height: 100vh;
  font-family: "Inter", sans-serif;
  background: var(--bg);
  @media (max-width: 768px) { padding: 14px; }
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
    p { color: var(--text-muted); margin: 5px 0 0 0; font-size: 14px; font-weight: 500; }
  }
`;

const ProfileLayout = styled.div`
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 25px;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const GlassCard = styled(motion.div)`
  background: var(--card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-custom);
  border-radius: 24px;
  padding: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.05);
  ${premiumHover}

  &::before {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0; height: 3px;
    background: linear-gradient(90deg, transparent, #3b82f6, #06b6d4, transparent);
    opacity: 0.3;
  }
`;

/* --- SIDEBAR COMPONENTS --- */
const AvatarContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border-custom);
  margin-bottom: 20px;

  .avatar-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 42px;
    font-weight: 800;
    color: white;
    box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
    margin-bottom: 15px;
    position: relative;
    border: 4px solid var(--card);
    
    &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      box-shadow: inset 0 0 20px rgba(255,255,255,0.3);
    }
  }

  h2 { font-size: 22px; font-weight: 800; color: var(--text); margin: 0 0 5px 0; }
  .role-badge {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    padding: 6px 16px;
    border-radius: 50px;
    font-size: 12px;
    font-weight: 700;
    border: 1px solid rgba(59, 130, 246, 0.3);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 10px;
  }
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 50px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  background: ${(p) => p.$active ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)"};
  color: ${(p) => p.$active ? "#10b981" : "#ef4444"};
  border: 1px solid ${(p) => p.$active ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"};
`;

const ContactList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;

  .contact-item {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--text);
    font-size: 14px;
    font-weight: 500;

    .icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: var(--bg-light-custom);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary);
      border: 1px solid var(--border-custom);
    }
  }
`;

/* --- TABS & MAIN CONTENT --- */
const TabContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 25px;
  border-bottom: 1px solid var(--border-custom);
  padding-bottom: 15px;
  overflow-x: auto;
  
  &::-webkit-scrollbar { height: 0px; }
`;

const TabButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: ${(p) => p.$active ? "rgba(59, 130, 246, 0.1)" : "transparent"};
  border: 1px solid ${(p) => p.$active ? "rgba(59, 130, 246, 0.3)" : "transparent"};
  color: ${(p) => p.$active ? "#3b82f6" : "var(--text-muted)"};
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background: rgba(59, 130, 246, 0.05);
    color: var(--text);
  }
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
`;

const InfoBox = styled.div`
  background: var(--bg-light-custom);
  border: 1px solid var(--border-custom);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(59, 130, 246, 0.4);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    transform: translateY(-2px);
  }

  .label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
    svg { color: var(--primary); }
  }

  .value {
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    word-break: break-word;
  }
`;

/* --- EDIT PROFILE COMPONENTS --- */
const EditProfileBtn = styled.button`
  background: transparent;
  border: none;
  color: #06b6d4;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  &:hover {
    color: #22d3ee;
    text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
  }
`;

const EditInput = styled.input`
  width: 100%;
  background: rgba(2, 6, 23, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #f8fafc;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  margin-top: 4px;
  outline: none;
  transition: all 0.3s ease;
  font-family: "Inter", sans-serif;
  &:focus {
    border-color: #06b6d4;
    box-shadow: 0 0 8px rgba(6, 182, 212, 0.3);
    background: rgba(15, 23, 42, 0.8);
  }
`;

const EditTextarea = styled.textarea`
  width: 100%;
  background: rgba(2, 6, 23, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.3);
  color: #f8fafc;
  border-radius: 10px;
  padding: 10px 14px;
  font-size: 14px;
  margin-top: 4px;
  outline: none;
  transition: all 0.3s ease;
  min-height: 80px;
  resize: vertical;
  font-family: "Inter", sans-serif;
  &:focus {
    border-color: #06b6d4;
    box-shadow: 0 0 8px rgba(6, 182, 212, 0.3);
    background: rgba(15, 23, 42, 0.8);
  }
`;

const SaveBtn = styled.button`
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.3s;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  &:hover:not(:disabled) {
    filter: brightness(1.1);
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelBtn = styled.button`
  background: transparent;
  color: #94a3b8;
  border: 1px solid #475569;
  padding: 10px 24px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.3s;
  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.05);
    color: #f8fafc;
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/* --- FORM & SECURITY --- */
const FormInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;

  label {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;

    svg.prefix {
      position: absolute;
      left: 14px;
      color: var(--text-muted);
      width: 18px;
    }

    input {
      width: 100%;
      padding: 14px 44px 14px 44px;
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
      &::placeholder { color: var(--text-muted); opacity: 0.7; }
    }

    .suffix-btn {
      position: absolute;
      right: 14px;
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0;
      display: flex;
      align-items: center;
      transition: 0.3s;
      &:hover { color: var(--primary); }
    }
  }
`;

const PasswordStrengthBar = styled.div`
  display: flex;
  gap: 5px;
  margin-top: 8px;
  height: 4px;

  div {
    flex: 1;
    border-radius: 2px;
    background: var(--border-custom);
    transition: 0.3s all ease;
  }

  &.strength-1 div:nth-child(1) { background: #ef4444; }
  &.strength-2 div:nth-child(1), &.strength-2 div:nth-child(2) { background: #f59e0b; }
  &.strength-3 div:nth-child(1), &.strength-3 div:nth-child(2), &.strength-3 div:nth-child(3) { background: #10b981; }
  &.strength-4 div { background: #3b82f6; box-shadow: 0 0 8px rgba(59, 130, 246, 0.6); }
`;

const PremiumBtn = styled(motion.button)`
  padding: 12px 24px;
  border-radius: 14px;
  border: none;
  font-weight: 800;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  color: white;
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: 100%;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    filter: brightness(1.15);
    box-shadow: 0 8px 25px rgba(59, 131, 246, 0.4);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/* =========================================================
   MAIN COMPONENT
   ========================================================= */
export default function StaffProfile() {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("personal");

  // 🌟 Editable Profile States
  const [editMode, setEditMode] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    fullName: "",
    email: "",
    contactNo: "",
    address: "",
    role: "",
    status: ""
  });

  // Password State
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState({
    old: false,
    new: false,
    confirm: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Read Staff Auth from localStorage
  const authData = JSON.parse(localStorage.getItem("staffAuth") || "{}");
  const staffId = authData?.id || localStorage.getItem("staffId") || 1;

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getRequest(`StaffMaster/Detail/${staffId}`);
      if (res.status === "OK" && res.result) {
        setProfileData(res.result);
        
        // Sync Form Data
        setFormData({
          id: res.result.id || 0,
          fullName: res.result.fullName || "",
          email: res.result.email || "",
          contactNo: res.result.contactNo || "",
          address: res.result.address || "",
          role: res.result.role || "",
          status: res.result.status || ""
        });

      } else {
        throw new Error(res.message || "Failed to load profile.");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Profile Error',
        text: 'Could not fetch your profile data. Please try again later.',
        background: "rgba(15, 23, 42, 0.9)",
        color: "#f8fafc"
      });
    } finally {
      setLoading(false);
    }
  };

  // 🌟 Form Handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setFormData({
      id: profileData?.id || 0,
      fullName: profileData?.fullName || "",
      email: profileData?.email || "",
      contactNo: profileData?.contactNo || "",
      address: profileData?.address || "",
      role: profileData?.role || "",
      status: profileData?.status || ""
    });
  };

  const handleProfileSubmit = async () => {
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.contactNo.trim()) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill out all required fields before saving.",
        background: "rgba(15, 23, 42, 0.9)",
        color: "#f8fafc",
      });
    }

    setProfileLoading(true);
    try {
      const payload = {
        id: formData.id,
        fullName: formData.fullName,
        email: formData.email,
        contactNo: formData.contactNo,
        address: formData.address,
        role: formData.role, // Preserve backend required fields
        status: formData.status
      };

      const res = await putRequest("StaffMaster/Update", payload);

      if (res.status === "OK") {
        const updatedData = { ...profileData, ...payload };
        
        // Update Local State
        setProfileData(updatedData);
        
        // Update Local Storage
        localStorage.setItem("staffAuth", JSON.stringify(updatedData));
        
        setEditMode(false);

        Swal.fire({
          icon: "success",
          title: "Updated Successfully",
          text: "Profile updated successfully",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          background: "rgba(15, 23, 42, 0.9)",
          color: "#f8fafc",
          iconColor: "#06b6d4",
        });
      } else {
        throw new Error(res.message || "Failed to update profile");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.message || "Something went wrong",
        background: "rgba(15, 23, 42, 0.9)",
        color: "#f8fafc",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  // 🌟 Password Handlers
  const handlePasswordChange = (e) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const toggleShowPassword = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const calculateStrength = (pass) => {
    let score = 0;
    if (!pass) return 0;
    if (pass.length > 6) score += 1;
    if (pass.length > 10) score += 1;
    if (/[A-Z]/.test(pass) && /[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return Math.min(4, score);
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    if (!passwords.oldPassword || !passwords.newPassword || !passwords.confirmPassword) {
      return Swal.fire({
        icon: "warning",
        title: "Required",
        text: "Please fill all password fields",
        background: "rgba(15, 23, 42, 0.9)",
        color: "#f8fafc"
      });
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      return Swal.fire({
        icon: "error",
        title: "Mismatch",
        text: "New password and Confirm password do not match",
        background: "rgba(15, 23, 42, 0.9)",
        color: "#f8fafc"
      });
    }
    if (calculateStrength(passwords.newPassword) < 2) {
      return Swal.fire({
        icon: "warning",
        title: "Weak Password",
        text: "Please choose a stronger new password",
        background: "rgba(15, 23, 42, 0.9)",
        color: "#f8fafc"
      });
    }

    try {
      setIsSubmitting(true);
      const payload = {
        staffId: Number(staffId),
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      };

      const res = await postRequest("StaffMaster/ChangePassword", payload);

      if (res.status === "OK") {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Password updated successfully.',
          timer: 2000,
          showConfirmButton: false,
          background: "rgba(15, 23, 42, 0.9)",
          color: "#f8fafc"
        });
        setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        throw new Error(res.result || res.message || "Failed to update password");
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || "Invalid old password or server error.",
        background: "rgba(15, 23, 42, 0.9)",
        color: "#f8fafc"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  const getInitials = (name) => {
    if (!name) return "S";
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <>
      <GlobalLoader isLoading={loading} />
      <PageTransition>
        <PageWrapper>
          <HeaderSection>
            <div className="title-area">
              <motion.h1 initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}>My Profile</motion.h1>
              <p>Manage your personal information and security settings.</p>
            </div>
          </HeaderSection>

          {!profileData && !loading ? (
            <PremiumEmptyState 
              icon={User} 
              title="Profile Not Found" 
              subtitle="Unable to locate your profile information in the system." 
            />
          ) : (
            <ProfileLayout>
              
              {/* LEFT SIDEBAR */}
              <GlassCard initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                {loading ? (
                  <div style={{ padding: '20px' }}>
                     <SkeletonStats />
                     <SkeletonForm />
                     <SkeletonForm />
                  </div>
                ) : (
                  <>
                    <AvatarContainer>
                      <div className="avatar-circle">
                        {getInitials(profileData?.fullName)}
                      </div>
                      <h2>{profileData?.fullName || "Staff Member"}</h2>
                      <div className="role-badge">{profileData?.role || "Employee"}</div>
                      <StatusBadge $active={profileData?.status === "Active"}>
                        {profileData?.status === "Active" ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
                        {profileData?.status || "Unknown"}
                      </StatusBadge>
                    </AvatarContainer>

                    <ContactList>
                      <div className="contact-item">
                        <div className="icon-wrap"><Mail size={16}/></div>
                        <span>{profileData?.email || "N/A"}</span>
                      </div>
                      <div className="contact-item">
                        <div className="icon-wrap"><Phone size={16}/></div>
                        <span>{profileData?.contactNo || "N/A"}</span>
                      </div>
                      <div className="contact-item">
                        <div className="icon-wrap"><MapPin size={16}/></div>
                        <span>{profileData?.address || "Address not provided"}</span>
                      </div>
                    </ContactList>
                  </>
                )}
              </GlassCard>

              {/* RIGHT MAIN CONTENT */}
              <GlassCard initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                
                <TabContainer>
                  <TabButton $active={activeTab === "personal"} onClick={() => setActiveTab("personal")}>
                    <User size={16} /> Personal Info
                  </TabButton>
                  <TabButton $active={activeTab === "employment"} onClick={() => setActiveTab("employment")}>
                    <Briefcase size={16} /> Employment
                  </TabButton>
                  <TabButton $active={activeTab === "security"} onClick={() => setActiveTab("security")}>
                    <ShieldCheck size={16} /> Security
                  </TabButton>
                </TabContainer>

                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: PERSONAL INFO */}
                  {activeTab === "personal" && (
                    <motion.div
                      key="personal"
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                          Personal Details
                        </h3>
                        {!editMode && (
                          <EditProfileBtn onClick={() => setEditMode(true)}>
                            <Edit3 size={15} /> Edit Profile
                          </EditProfileBtn>
                        )}
                      </div>

                      <InfoGrid>
                        <InfoBox>
                          <div className="label"><User size={14}/> Full Name</div>
                          {editMode ? (
                            <EditInput name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter full name" />
                          ) : (
                            <div className="value">{profileData?.fullName || "-"}</div>
                          )}
                        </InfoBox>
                        
                        <InfoBox>
                          <div className="label"><Mail size={14}/> Email Address</div>
                          {editMode ? (
                            <EditInput type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email" />
                          ) : (
                            <div className="value">{profileData?.email || "-"}</div>
                          )}
                        </InfoBox>
                        
                        <InfoBox>
                          <div className="label"><Phone size={14}/> Contact Number</div>
                          {editMode ? (
                            <EditInput type="tel" name="contactNo" value={formData.contactNo} onChange={handleChange} placeholder="Enter contact number" />
                          ) : (
                            <div className="value">{profileData?.contactNo || "-"}</div>
                          )}
                        </InfoBox>
                        
                        <InfoBox>
                          <div className="label"><UserCheck size={14}/> Gender</div>
                          <div className="value text-muted-custom">{profileData?.gender || "Not Specified"}</div>
                        </InfoBox>
                        
                        <InfoBox>
                          <div className="label"><Calendar size={14}/> Date of Birth</div>
                          <div className="value text-muted-custom">{formatDate(profileData?.dob)}</div>
                        </InfoBox>
                        
                        <InfoBox>
                          <div className="label"><CreditCard size={14}/> Aadhar Number</div>
                          <div className="value text-muted-custom">{profileData?.aadharNo || "Not Provided"}</div>
                        </InfoBox>
                        
                        <InfoBox style={{ gridColumn: "1 / -1" }}>
                          <div className="label"><MapPin size={14}/> Full Address</div>
                          {editMode ? (
                            <EditTextarea name="address" value={formData.address} onChange={handleChange} placeholder="Enter full address" />
                          ) : (
                            <div className="value">{profileData?.address || "-"}</div>
                          )}
                        </InfoBox>

                        {/* 🌟 SAVE & CANCEL BUTTONS */}
                        {editMode && (
                          <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "10px" }}>
                            <CancelBtn type="button" onClick={handleCancelEdit} disabled={profileLoading}>
                              Cancel
                            </CancelBtn>
                            <SaveBtn type="button" onClick={handleProfileSubmit} disabled={profileLoading}>
                              {profileLoading ? <span style={{display:'flex', alignItems:'center', gap:'8px'}}><RefreshCcw className="spin" size={14} /> Saving...</span> : "Save Changes"}
                            </SaveBtn>
                          </div>
                        )}
                      </InfoGrid>
                    </motion.div>
                  )}

                  {/* TAB 2: EMPLOYMENT DETAILS */}
                  {activeTab === "employment" && (
                    <motion.div
                      key="employment"
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                    >
                      <InfoGrid>
                        <InfoBox>
                          <div className="label"><Hash size={14}/> Employee ID</div>
                          <div className="value">EMP-{profileData?.id?.toString().padStart(4, '0') || "0000"}</div>
                        </InfoBox>
                        <InfoBox>
                          <div className="label"><Briefcase size={14}/> Primary Role</div>
                          <div className="value" style={{ color: "var(--primary)" }}>{profileData?.role || "-"}</div>
                        </InfoBox>
                        <InfoBox>
                          <div className="label"><CheckCircle2 size={14}/> Current Status</div>
                          <div className="value">
                            <span style={{ color: profileData?.status === "Active" ? "#10b981" : "#ef4444" }}>
                              {profileData?.status || "-"}
                            </span>
                          </div>
                        </InfoBox>
                        <InfoBox>
                          <div className="label"><Calendar size={14}/> Date of Joining</div>
                          <div className="value">{formatDate(profileData?.doj)}</div>
                        </InfoBox>
                        <InfoBox>
                          <div className="label"><Clock size={14}/> Profile Created At</div>
                          <div className="value">{formatDate(profileData?.createdAt)}</div>
                        </InfoBox>
                      </InfoGrid>
                    </motion.div>
                  )}

                  {/* TAB 3: SECURITY SETTINGS */}
                  {activeTab === "security" && (
                    <motion.form
                      key="security"
                      initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                      onSubmit={submitPasswordChange}
                    >
                      <div style={{ maxWidth: '400px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)', margin: '0 0 20px 0' }}>
                          Update Password
                        </h3>
                        
                        <FormInputGroup>
                          <label>Current Password</label>
                          <div className="input-wrapper">
                            <Lock className="prefix" />
                            <input 
                              type={showPassword.old ? "text" : "password"} 
                              name="oldPassword"
                              value={passwords.oldPassword}
                              onChange={handlePasswordChange}
                              placeholder="Enter current password"
                              required
                            />
                            <button type="button" className="suffix-btn" onClick={() => toggleShowPassword('old')}>
                              {showPassword.old ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                          </div>
                        </FormInputGroup>

                        <FormInputGroup>
                          <label>New Password</label>
                          <div className="input-wrapper">
                            <ShieldCheck className="prefix" />
                            <input 
                              type={showPassword.new ? "text" : "password"} 
                              name="newPassword"
                              value={passwords.newPassword}
                              onChange={handlePasswordChange}
                              placeholder="Enter new password"
                              required
                            />
                            <button type="button" className="suffix-btn" onClick={() => toggleShowPassword('new')}>
                              {showPassword.new ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                          </div>
                          <PasswordStrengthBar className={`strength-${calculateStrength(passwords.newPassword)}`}>
                            <div></div><div></div><div></div><div></div>
                          </PasswordStrengthBar>
                        </FormInputGroup>

                        <FormInputGroup>
                          <label>Confirm New Password</label>
                          <div className="input-wrapper">
                            <CheckCircle2 className="prefix" />
                            <input 
                              type={showPassword.confirm ? "text" : "password"} 
                              name="confirmPassword"
                              value={passwords.confirmPassword}
                              onChange={handlePasswordChange}
                              placeholder="Confirm new password"
                              required
                            />
                            <button type="button" className="suffix-btn" onClick={() => toggleShowPassword('confirm')}>
                              {showPassword.confirm ? <EyeOff size={18}/> : <Eye size={18}/>}
                            </button>
                          </div>
                        </FormInputGroup>

                        <PremiumBtn type="submit" disabled={isSubmitting}>
                          {isSubmitting ? <span style={{display:'flex', alignItems:'center', gap:'8px'}}><RefreshCcw className="spin" size={16}/> Updating...</span> : "Update Security Settings"}
                        </PremiumBtn>
                      </div>
                      
                      <style>{`
                        .spin { animation: spin 1s linear infinite; }
                        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                      `}</style>
                    </motion.form>
                  )}

                </AnimatePresence>
              </GlassCard>
            </ProfileLayout>
          )}

        </PageWrapper>
      </PageTransition>
    </>
  );
}