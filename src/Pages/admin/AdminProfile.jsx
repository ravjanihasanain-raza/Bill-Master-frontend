import React, { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";
import { getRequest, putRequest, postRequest } from "../../../Services/axiosService";
import Swal from "sweetalert2";

export default function AdminProfile() {
  const [company, setCompany] = useState({});
  const [admin, setAdmin] = useState({});
  const [activeTab, setActiveTab] = useState("business");

  // 🌟 Profile Edit States
  const [editMode, setEditMode] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [formData, setFormData] = useState({
    id: 0,
    fullName: "",
    email: "",
    contactNo: "",
    role: "Super Admin",
    status: "Active"
  });

  // 🌟 Password State
  const [passForm, setPassForm] = useState({ old: "", new: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await getRequest("SoftwareSettings/Get");
      if (res.status === "OK") {
        setCompany(res.result || {});
      }
      
      // Load Admin Auth from LocalStorage
      const adminData = JSON.parse(localStorage.getItem("adminAuth") || "{}");
      setAdmin(adminData);
      
      // Sync Form Data for Edit Mode
      setFormData({
        id: adminData?.id || adminData?.Id || 0,
        fullName: adminData?.fullName || adminData?.FullName || adminData?.name || "",
        email: adminData?.email || adminData?.Email || "",
        contactNo: adminData?.contactNo || adminData?.ContactNo || "",
        role: adminData?.role || adminData?.Role || "Super Admin",
        status: adminData?.status || adminData?.Status || "Active"
      });

    } catch (err) {
      console.error(err);
    }
  };

  // 🌟 Input Handlers
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePassChange = (e) => {
    setPassForm({ ...passForm, [e.target.name]: e.target.value });
  };

  // 🌟 Edit Profile Actions
  const handleCancelEdit = () => {
    setEditMode(false);
    // Revert form data
    setFormData({
      id: admin?.id || admin?.Id || 0,
      fullName: admin?.fullName || admin?.FullName || admin?.name || "",
      email: admin?.email || admin?.Email || "",
      contactNo: admin?.contactNo || admin?.ContactNo || "",
      role: admin?.role || admin?.Role || "Super Admin",
      status: admin?.status || admin?.Status || "Active"
    });
  };

  const handleProfileSubmit = async () => {
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.contactNo.trim()) {
      return Swal.fire({
        icon: "warning",
        title: "Missing Fields",
        text: "Please fill out all fields before saving.",
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
        role: formData.role,
        status: formData.status
      };

      const res = await putRequest("Admin/Update", payload);

      if (res.status === "OK") {
        // Update LocalStorage and State safely
        const updatedAdmin = { 
          ...admin, 
          ...payload, 
          name: payload.fullName 
        };
        
        setAdmin(updatedAdmin);
        localStorage.setItem("adminAuth", JSON.stringify(updatedAdmin));
        
        setEditMode(false);

        Swal.fire({
          icon: "success",
          title: "Profile Updated",
          text: "Your details have been updated successfully.",
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

  // 🌟 Change Password Submission (FIXED & FULLY DYNAMIC)
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passForm.old || !passForm.new || !passForm.confirm) {
      return Swal.fire({
        icon: "error",
        title: "Missing Fields",
        text: "All fields are required.",
        background: "rgba(15, 23, 42, 0.9)",
        color: "#f8fafc"
      });
    }

    if (passForm.new !== passForm.confirm) {
      return Swal.fire({
        icon: "error",
        title: "Mismatch",
        text: "New passwords do not match.",
        background: "rgba(15, 23, 42, 0.9)",
        color: "#f8fafc"
      });
    }

    setPassLoading(true);
    try {
      const adminData = JSON.parse(localStorage.getItem("adminAuth") || "{}");
      const adminId = adminData?.id || adminData?.Id;

      if (!adminId) {
        throw new Error("Admin session missing. Please relogin.");
      }

      const payload = {
        AdminId: parseInt(adminId),
        OldPassword: passForm.old,
        NewPassword: passForm.new
      };

      const res = await postRequest("Admin/ChangePassword", payload);

      if (res.status === "OK") {
        Swal.fire({
          icon: "success",
          title: "Password Updated",
          text: "Your password has been changed successfully.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          background: "rgba(15, 23, 42, 0.9)",
          color: "#f8fafc",
          iconColor: "#06b6d4"
        });
        setPassForm({ old: "", new: "", confirm: "" });
      } else {
        throw new Error(res.message || "Failed to update password");
      }
    } catch (err) {
      console.error("PASSWORD ERROR:", err);
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err.message || "Invalid old password.",
        background: "rgba(15, 23, 42, 0.9)",
        color: "#f8fafc"
      });
    } finally {
      setPassLoading(false);
    }
  };

  // Password strength visualizer logic
  const passStrength = passForm.new.length === 0 ? 0 : passForm.new.length < 6 ? 1 : passForm.new.length < 10 ? 2 : 3;

  return (
    <Wrapper>
      {/* 🌌 Animated RGB Background */}
      <RGBBackground />

      <Header className="fade-in stagger-1">
        <h2 className="fw-bolder mb-1">Administrator Profile</h2>
        <p className="text-muted-custom mb-0">Manage your credentials and business identity.</p>
        <div className="title-underline"></div>
      </Header>

      <div className="row g-4 mt-2">
        {/* ================= LEFT SIDEBAR (PROFILE PANEL) ================= */}
        <div className="col-lg-4 col-xl-3 d-flex flex-column fade-in stagger-2">
          <GlassCard className="h-100 d-flex flex-column align-items-center p-4 profile-card">
            
            <div className="text-center w-100 mb-4 pb-4 border-bottom custom-border">
              <LogoWrapper>
                {company.logoURL ? (
                  <Logo src={company.logoURL} alt="Company Logo" />
                ) : (
                  <PlaceholderLogo><i className="fas fa-building"></i></PlaceholderLogo>
                )}
              </LogoWrapper>
              <h5 className="fw-bold mt-4 mb-2 text-main text-glow">{company.businessName || "Your Company"}</h5>
              <Badge>Active Workspace</Badge>
            </div>

            <div className="w-100 flex-grow-1">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <ProfileLabel className="mb-0">Admin Details</ProfileLabel>
                {!editMode && (
                  <EditProfileBtn onClick={() => setEditMode(true)}>
                    <i className="fas fa-edit"></i> Edit
                  </EditProfileBtn>
                )}
              </div>
              
              <VerticalList>
                <ProfileInfo>
                  <div className="icon"><i className="fas fa-user"></i></div>
                  <div className="data w-100">
                    <small>Full Name</small>
                    {editMode ? (
                      <EditInput name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter name" />
                    ) : (
                      <span>{admin?.fullName || admin?.name || "System Admin"}</span>
                    )}
                  </div>
                </ProfileInfo>
                <ProfileInfo>
                  <div className="icon"><i className="fas fa-envelope"></i></div>
                  <div className="data w-100">
                    <small>Email Address</small>
                    {editMode ? (
                      <EditInput name="email" value={formData.email} onChange={handleChange} placeholder="Enter email" />
                    ) : (
                      <span>{admin?.email || "-"}</span>
                    )}
                  </div>
                </ProfileInfo>
                <ProfileInfo>
                  <div className="icon"><i className="fas fa-phone-alt"></i></div>
                  <div className="data w-100">
                    <small>Contact Number</small>
                    {editMode ? (
                      <EditInput name="contactNo" value={formData.contactNo} onChange={handleChange} placeholder="Enter contact no" />
                    ) : (
                      <span>{admin?.contactNo || "-"}</span>
                    )}
                  </div>
                </ProfileInfo>
                <ProfileInfo>
                  <div className="icon text-cyan"><i className="fas fa-shield-alt"></i></div>
                  <div className="data w-100">
                    <small>Role</small>
                    <span className="text-cyan fw-bold text-glow-cyan">{admin?.role || "Super Admin"}</span>
                  </div>
                </ProfileInfo>
              </VerticalList>

              {/* 🌟 SAVE / CANCEL BUTTONS */}
              {editMode && (
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <CancelBtn onClick={handleCancelEdit} disabled={profileLoading}>Cancel</CancelBtn>
                  <SaveBtn onClick={handleProfileSubmit} disabled={profileLoading}>
                    {profileLoading ? <i className="fas fa-spinner fa-spin"></i> : "Save Details"}
                  </SaveBtn>
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* ================= RIGHT MAIN PANEL ================= */}
        <div className="col-lg-8 col-xl-9 d-flex flex-column gap-3 fade-in stagger-3">
          
          {/* TAB NAVIGATION */}
          <TabContainer>
            <Tab $active={activeTab === "business"} onClick={() => setActiveTab("business")}>
              <i className="fas fa-briefcase"></i> Business Info
            </Tab>
            <Tab $active={activeTab === "banking"} onClick={() => setActiveTab("banking")}>
              <i className="fas fa-university"></i> Banking Details
            </Tab>
            <Tab $active={activeTab === "signature"} onClick={() => setActiveTab("signature")}>
              <i className="fas fa-signature"></i> Signature
            </Tab>
            <Tab $active={activeTab === "password"} onClick={() => setActiveTab("password")}>
              <i className="fas fa-lock"></i> Change Password
            </Tab>
          </TabContainer>

          {/* TAB CONTENT AREA */}
          <ContentArea key={activeTab}>

            {/* --- TAB 1: BUSINESS INFO --- */}
            {activeTab === "business" && (
              <GlassCard className="p-4 p-md-5 h-100 tab-fade-in">
                <SectionHeader $color="#3b82f6">
                  <div className="icon-wrapper"><i className="fas fa-building"></i></div>
                  <div>
                    <h4>Business Information</h4>
                    <p>Primary business identity and registration details.</p>
                  </div>
                </SectionHeader>

                <Grid>
                  <InfoBox>
                    <Label>Legal Business Name</Label>
                    <Value>{company.businessName || "-"}</Value>
                  </InfoBox>
                  <InfoBox>
                    <Label>Contact Number</Label>
                    <Value>{company.contactNo || "-"}</Value>
                  </InfoBox>
                  <InfoBox>
                    <Label>Business Email</Label>
                    <Value>{company.email || "-"}</Value>
                  </InfoBox>
                  <InfoBox>
                    <Label>GSTIN</Label>
                    <Value className="font-monospace text-cyan">{company.gstin || "-"}</Value>
                  </InfoBox>
                  <InfoBox>
                    <Label>PAN Number</Label>
                    <Value className="font-monospace text-cyan">{company.pan || "-"}</Value>
                  </InfoBox>
                </Grid>
              </GlassCard>
            )}

            {/* --- TAB 2: BANKING DETAILS --- */}
            {activeTab === "banking" && (
              <GlassCard className="p-4 p-md-5 h-100 tab-fade-in">
                <SectionHeader $color="#06b6d4">
                  <div className="icon-wrapper"><i className="fas fa-money-check-alt"></i></div>
                  <div>
                    <h4>Banking Details</h4>
                    <p>Primary account used for transactions and billing.</p>
                  </div>
                </SectionHeader>

                <Grid>
                  <InfoBox>
                    <Label>Bank Name</Label>
                    <Value>{company.bankName || "-"}</Value>
                  </InfoBox>
                  <InfoBox>
                    <Label>Account Holder</Label>
                    <Value>{company.accountHolderName || "-"}</Value>
                  </InfoBox>
                  <InfoBox>
                    <Label>Account Number</Label>
                    <Value className="font-monospace text-cyan">{company.accountNumber || "-"}</Value>
                  </InfoBox>
                  <InfoBox>
                    <Label>IFSC Code</Label>
                    <Value className="font-monospace text-cyan">{company.bankIFSC || "-"}</Value>
                  </InfoBox>
                </Grid>
              </GlassCard>
            )}

            {/* --- TAB 3: SIGNATURE --- */}
            {activeTab === "signature" && (
              <GlassCard className="p-4 p-md-5 h-100 tab-fade-in">
                <SectionHeader $color="#3b82f6">
                  <div className="icon-wrapper"><i className="fas fa-pen-nib"></i></div>
                  <div>
                    <h4>Authorized Signature</h4>
                    <p>Digital signature used for auto-generating invoices.</p>
                  </div>
                </SectionHeader>

                <SignatureContainer>
                  {company.signatureURL ? (
                    <SignatureImg src={company.signatureURL} />
                  ) : (
                    <div className="empty-state">
                      <i className="fas fa-file-signature"></i>
                      <p>No Signature Uploaded</p>
                    </div>
                  )}
                </SignatureContainer>
              </GlassCard>
            )}

            {/* --- TAB 4: CHANGE PASSWORD --- */}
            {activeTab === "password" && (
              <GlassCard className="p-4 p-md-5 h-100 tab-fade-in">
                <SectionHeader $color="#06b6d4">
                  <div className="icon-wrapper"><i className="fas fa-shield-alt"></i></div>
                  <div>
                    <h4>Security Settings</h4>
                    <p>Update your password to keep your account secure.</p>
                  </div>
                </SectionHeader>

                <PasswordForm onSubmit={handlePasswordSubmit}>
                  <FormGroup>
                    <label>Current Password</label>
                    <div className="input-wrapper">
                      <i className="fas fa-lock input-icon"></i>
                      <input 
                        type={showPass ? "text" : "password"} 
                        name="old" 
                        value={passForm.old} 
                        onChange={handlePassChange} 
                        placeholder="Enter current password" 
                      />
                      <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                        <i className={`fas ${showPass ? "fa-eye-slash" : "fa-eye"}`}></i>
                      </button>
                    </div>
                  </FormGroup>

                  <div className="row g-3">
                    <div className="col-md-6">
                      <FormGroup>
                        <label>New Password</label>
                        <div className="input-wrapper">
                          <i className="fas fa-key input-icon"></i>
                          <input 
                            type={showPass ? "text" : "password"} 
                            name="new" 
                            value={passForm.new} 
                            onChange={handlePassChange} 
                            placeholder="New password" 
                          />
                        </div>
                        {/* 🌟 Password Strength Indicator */}
                        <StrengthBar $level={passStrength}>
                          <div className="bar b1"></div>
                          <div className="bar b2"></div>
                          <div className="bar b3"></div>
                        </StrengthBar>
                      </FormGroup>
                    </div>
                    <div className="col-md-6">
                      <FormGroup>
                        <label>Confirm Password</label>
                        <div className="input-wrapper">
                          <i className="fas fa-check-circle input-icon"></i>
                          <input 
                            type={showPass ? "text" : "password"} 
                            name="confirm" 
                            value={passForm.confirm} 
                            onChange={handlePassChange} 
                            placeholder="Confirm new password" 
                          />
                        </div>
                      </FormGroup>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end mt-4">
                    <SubmitButton type="submit" disabled={passLoading}>
                      {passLoading ? <Spinner /> : <i className="fas fa-shield-check me-2"></i>}
                      {passLoading ? "Authenticating..." : "Update Password"}
                    </SubmitButton>
                  </div>
                </PasswordForm>
              </GlassCard>
            )}

          </ContentArea>
        </div>
      </div>
    </Wrapper>
  );
}

/* ================= KEYFRAMES & ANIMATIONS ================= */
const fadeUp = keyframes`from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); }`;
const fadeSlideRight = keyframes`from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); }`;
const spin = keyframes`to { transform: rotate(360deg); }`;
const pulseGlowBtn = keyframes`
  0% { box-shadow: 0 0 10px rgba(6, 182, 212, 0.4); }
  50% { box-shadow: 0 0 25px rgba(6, 182, 212, 0.8), 0 0 10px rgba(59, 130, 246, 0.6); }
  100% { box-shadow: 0 0 10px rgba(6, 182, 212, 0.4); }
`;
const rgbFloat = keyframes`
  0% { transform: scale(1) translate(0, 0); }
  33% { transform: scale(1.1) translate(30px, -40px); }
  66% { transform: scale(0.9) translate(-20px, 40px); }
  100% { transform: scale(1) translate(0, 0); }
`;
const topBorderGlow = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

/* ================= STYLED COMPONENTS ================= */

const Wrapper = styled.div`
  padding: 24px; font-family: "Inter", sans-serif;
  color: #f8fafc; max-width: 1500px; margin: 0 auto;
  position: relative; z-index: 1;

  .text-main { color: #f8fafc; }
  .text-cyan { color: #06b6d4; }
  .text-glow { text-shadow: 0 0 15px rgba(255,255,255,0.2); }
  .text-glow-cyan { text-shadow: 0 0 15px rgba(6, 182, 212, 0.6); }
  .text-muted-custom { color: #94a3b8; }
  .custom-border { border-color: rgba(59, 130, 246, 0.15) !important; }

  .fade-in { opacity: 0; animation: ${fadeUp} 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .stagger-1 { animation-delay: 0.05s; } .stagger-2 { animation-delay: 0.15s; } .stagger-3 { animation-delay: 0.25s; }
`;

const RGBBackground = styled.div`
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, #020617, #0B1221); z-index: -1;
  &::before, &::after {
    content: ''; position: absolute; width: 600px; height: 600px; border-radius: 50%; filter: blur(100px); pointer-events: none;
  }
  &::before { background: rgba(59, 130, 246, 0.12); top: -10%; left: -10%; animation: ${rgbFloat} 12s infinite alternate ease-in-out; }
  &::after { background: rgba(6, 182, 212, 0.1); bottom: -10%; right: -10%; animation: ${rgbFloat} 10s infinite alternate-reverse ease-in-out; }
`;

const Header = styled.div`
  margin-bottom: 1.5rem;
  h2 { font-size: 1.8rem; letter-spacing: -0.5px; color: #f8fafc; text-shadow: 0 0 20px rgba(255,255,255,0.1); }
  .title-underline {
    height: 3px; width: 60px; border-radius: 4px;
    background: linear-gradient(90deg, #06b6d4, #3b82f6, transparent); margin-top: 8px;
    background-size: 200% auto; animation: ${topBorderGlow} 3s linear infinite;
  }
`;

/* ================= GLASS CARDS ================= */
const GlassCard = styled.div`
  background: rgba(15, 23, 42, 0.55);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 16px; padding: 24px; position: relative;
  backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
  box-shadow: 0 8px 32px rgba(0,0,0,0.2); overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &::before {
    content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 2px;
    background: linear-gradient(90deg, transparent, #06b6d4, #3b82f6, transparent);
    background-size: 200% auto; opacity: 0; transition: 0.4s;
  }
  &::after {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%); pointer-events: none;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 0 25px rgba(59, 130, 246, 0.25), 0 15px 40px rgba(0,0,0,0.4);
    border-color: rgba(59, 130, 246, 0.5);
    &::before { opacity: 1; animation: ${topBorderGlow} 3s linear infinite; }
  }
`;

/* ================= PROFILE LEFT PANEL ELEMENTS ================= */
const LogoWrapper = styled.div`
  display: inline-block; position: relative;
`;
const Logo = styled.img`
  width: 130px; height: 130px; object-fit: contain; border-radius: 20px;
  background: rgba(2, 6, 23, 0.5); padding: 12px;
  border: 1px solid rgba(6, 182, 212, 0.3);
  box-shadow: inset 0 0 20px rgba(6, 182, 212, 0.1), 0 0 25px rgba(6, 182, 212, 0.2);
  transition: all 0.4s ease;
  
  ${GlassCard}:hover & { transform: scale(1.05) rotate(2deg); box-shadow: 0 0 35px rgba(6, 182, 212, 0.4); border-color: #06b6d4; }
`;
const PlaceholderLogo = styled(Logo).attrs({ as: 'div' })`
  display: flex; align-items: center; justify-content: center; font-size: 45px; color: #06b6d4; background: rgba(6, 182, 212, 0.05);
`;

const Badge = styled.span`
  background: rgba(6, 182, 212, 0.15); color: #22d3ee;
  padding: 6px 14px; border-radius: 30px; font-size: 11px; font-weight: 600;
  letter-spacing: 0.5px; text-transform: uppercase; border: 1px solid rgba(6, 182, 212, 0.3);
  box-shadow: 0 0 10px rgba(6, 182, 212, 0.2);
`;

const ProfileLabel = styled.div` font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 16px; `;

const VerticalList = styled.div` display: flex; flex-direction: column; gap: 14px; `;

const ProfileInfo = styled.div`
  display: flex; align-items: center; gap: 14px; padding: 12px; border-radius: 12px;
  background: rgba(2, 6, 23, 0.4); border: 1px solid rgba(59, 130, 246, 0.15); transition: all 0.3s ease;

  .icon {
    width: 38px; height: 38px; border-radius: 10px; background: rgba(59, 130, 246, 0.1); color: #3b82f6;
    display: flex; align-items: center; justify-content: center; font-size: 15px; transition: 0.3s;
    flex-shrink: 0;
  }
  .data { 
    display: flex; flex-direction: column; 
    small { font-size: 11px; color: #94a3b8; } 
    span { font-size: 13px; font-weight: 600; color: #f8fafc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; } 
  }

  &:hover {
    background: rgba(59, 130, 246, 0.1); border-color: rgba(59, 130, 246, 0.4);
    transform: translateX(6px);
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.15);
    .icon { background: #3b82f6; color: white; box-shadow: 0 0 15px rgba(59, 130, 246, 0.6); transform: scale(1.1); }
  }
`;

/* ================= NEW EDIT PROFILE COMPONENTS ================= */
const EditProfileBtn = styled.button`
  background: transparent;
  border: none;
  color: #06b6d4;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
  display: flex;
  align-items: center;
  gap: 4px;
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
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  margin-top: 4px;
  outline: none;
  transition: all 0.3s ease;
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
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.3s;
  box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
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
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
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

/* ================= TABS ================= */
const TabContainer = styled.div`
  display: flex; gap: 8px; overflow-x: auto; padding: 10px; border-radius: 14px;
  background: rgba(2, 6, 23, 0.6); border: 1px solid rgba(59, 130, 246, 0.2);
  backdrop-filter: blur(12px); box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
  &::-webkit-scrollbar { display: none; }
`;

const Tab = styled.button`
  background: ${(props) => (props.$active ? 'rgba(6, 182, 212, 0.15)' : 'transparent')};
  color: ${(props) => (props.$active ? '#22d3ee' : '#94a3b8')};
  border: 1px solid ${(props) => (props.$active ? 'rgba(6, 182, 212, 0.4)' : 'transparent')};
  box-shadow: ${(props) => (props.$active ? 'inset 0 -3px 0 #06b6d4, 0 0 15px rgba(6,182,212,0.2)' : 'none')};
  padding: 10px 20px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); white-space: nowrap; display: flex; align-items: center; gap: 8px;

  i { transition: 0.3s; text-shadow: ${(props) => (props.$active ? '0 0 10px #06b6d4' : 'none')}; }

  &:hover {
    color: ${(props) => (props.$active ? '#67e8f9' : '#cbd5e1')};
    background: rgba(6, 182, 212, 0.1);
    transform: ${(props) => (props.$active ? 'scale(1.02)' : 'none')};
    i { transform: scale(1.15); }
  }
`;

const ContentArea = styled.div` .tab-fade-in { animation: ${fadeSlideRight} 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; } flex: 1; `;

/* ================= SECTIONS & FORMS ================= */
const SectionHeader = styled.div`
  display: flex; align-items: center; gap: 16px; margin-bottom: 2rem;
  .icon-wrapper {
    width: 48px; height: 48px; border-radius: 12px; background: ${(props) => props.$color}15; color: ${(props) => props.$color};
    display: flex; align-items: center; justify-content: center; font-size: 20px; box-shadow: inset 0 0 15px ${(props) => props.$color}30, 0 0 20px ${(props) => props.$color}20;
  }
  h4 { margin: 0; font-weight: 800; font-size: 1.3rem; color: #f8fafc; text-shadow: 0 0 15px rgba(255,255,255,0.1); }
  p { margin: 4px 0 0 0; font-size: 0.85rem; color: #94a3b8; }
`;

const Grid = styled.div` display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; `;

const InfoBox = styled.div`
  background: rgba(2, 6, 23, 0.4); border: 1px solid rgba(59, 130, 246, 0.15);
  padding: 16px; border-radius: 12px; transition: 0.3s ease; box-shadow: inset 0 0 10px rgba(0,0,0,0.2);

  &:hover {
    background: rgba(59, 130, 246, 0.08); border-color: rgba(6, 182, 212, 0.4);
    box-shadow: 0 4px 20px rgba(6, 182, 212, 0.15), inset 0 0 15px rgba(6, 182, 212, 0.1);
    transform: translateY(-3px) scale(1.02);
  }
`;

const Label = styled.div` font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; margin-bottom: 6px; `;
const Value = styled.div` font-weight: 600; font-size: 14px; color: #f8fafc; text-shadow: 0 0 10px rgba(255,255,255,0.1); word-break: break-word; `;
const AddressBox = styled.p`
  font-size: 14px; line-height: 1.7; color: #cbd5e1; margin: 0; padding: 20px; border-radius: 12px;
  background: rgba(2, 6, 23, 0.4); border: 1px solid rgba(59, 130, 246, 0.15); box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
`;

const SignatureContainer = styled.div`
  background: rgba(2, 6, 23, 0.4); border: 1px dashed rgba(6, 182, 212, 0.3); border-radius: 12px; padding: 40px; text-align: center; transition: 0.3s;
  .empty-state { color: #64748b; i { font-size: 40px; margin-bottom: 12px; opacity: 0.5; color: #06b6d4; text-shadow: 0 0 15px #06b6d4; } }
  &:hover { border-color: #06b6d4; background: rgba(6, 182, 212, 0.05); box-shadow: 0 0 25px rgba(6,182,212,0.1) inset; }
`;
const SignatureImg = styled.img` max-width: 250px; height: auto; filter: drop-shadow(0 0 15px rgba(6,182,212,0.4)); `;

/* ================= PASSWORD FORM ================= */
const PasswordForm = styled.form` display: flex; flex-direction: column; gap: 20px; `;

const FormGroup = styled.div`
  display: flex; flex-direction: column; gap: 8px;
  label { font-size: 12px; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
  .input-wrapper { position: relative; display: flex; align-items: center; }
  .input-icon { position: absolute; left: 16px; color: #64748b; font-size: 14px; transition: 0.3s; }
  
  input {
    width: 100%; padding: 12px 40px; border-radius: 10px; background: rgba(2, 6, 23, 0.5);
    border: 1px solid rgba(59, 130, 246, 0.25); color: #f8fafc; font-size: 14px; transition: all 0.3s ease;
    box-shadow: inset 0 2px 5px rgba(0,0,0,0.5);

    &:focus {
      background: rgba(15, 23, 42, 0.8); border-color: #06b6d4;
      box-shadow: 0 0 20px rgba(6, 182, 212, 0.3), inset 0 0 10px rgba(6, 182, 212, 0.1); outline: none; transform: scale(1.01);
    }
    &:focus + .input-icon { color: #06b6d4; text-shadow: 0 0 10px #06b6d4; }
  }
  .eye-btn { position: absolute; right: 12px; background: transparent; border: none; color: #64748b; cursor: pointer; transition: 0.2s; outline: none; &:hover { color: #06b6d4; } }
`;

const StrengthBar = styled.div`
  display: flex; gap: 6px; margin-top: 4px; height: 4px;
  .bar { flex: 1; border-radius: 2px; background: rgba(255,255,255,0.1); transition: 0.3s; }
  .b1 { background: ${(props) => props.$level >= 1 ? '#ef4444' : ''}; box-shadow: ${(props) => props.$level >= 1 ? '0 0 8px #ef4444' : 'none'}; }
  .b2 { background: ${(props) => props.$level >= 2 ? '#f59e0b' : ''}; box-shadow: ${(props) => props.$level >= 2 ? '0 0 8px #f59e0b' : 'none'}; }
  .b3 { background: ${(props) => props.$level >= 3 ? '#22c55e' : ''}; box-shadow: ${(props) => props.$level >= 3 ? '0 0 8px #22c55e' : 'none'}; }
`;

const SubmitButton = styled.button`
  background: linear-gradient(135deg, #3b82f6, #06b6d4); color: white; border: none; padding: 12px 28px; border-radius: 10px;
  font-weight: 600; font-size: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer;
  box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3); animation: ${pulseGlowBtn} 2.5s infinite; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover:not(:disabled) { transform: translateY(-2px) scale(1.05); box-shadow: 0 8px 25px rgba(6, 182, 212, 0.5); filter: brightness(1.15); }
  &:active:not(:disabled) { transform: scale(0.97); }
  &:disabled { opacity: 0.7; cursor: not-allowed; animation: none; }
`;
const Spinner = styled.div` width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: ${spin} 0.8s linear infinite; margin-right: 8px; `;