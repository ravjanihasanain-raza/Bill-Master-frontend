import React, { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import Swal from "sweetalert2";
import { getRequest, postRequest } from "../../../Services/axiosService";

export default function SoftwareSettings() {
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [shakeField, setShakeField] = useState("");

  const [form, setForm] = useState({
    id: 0,
    businessName: "",
    addressLine1: "",
    addressLine2: "",
    addressLine3: "",
    contactNo: "",
    email: "",
    gstin: "",
    pan: "",
    bankName: "",
    accountHolderName: "",
    accountNumber: "",
    bankIFSC: "",
  });

  const [errors, setErrors] = useState({});
  const [logoPreview, setLogoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await getRequest("SoftwareSettings/Get");
      if (res.status === "OK" && res.result) {
        const data = res.result;
        setForm({
          id: data.id || 0,
          businessName: data.businessName || "",
          addressLine1: data.addressLine1 || "",
          addressLine2: data.addressLine2 || "",
          addressLine3: data.addressLine3 || "",
          contactNo: data.contactNo || "",
          email: data.email || "",
          gstin: data.gstin || "",
          pan: data.pan || "",
          bankName: data.bankName || "",
          accountHolderName: data.accountHolderName || "",
          accountNumber: data.accountNumber || "",
          bankIFSC: data.bankIFSC || "",
        });
        setLogoPreview(data.logoURL);
        setSignaturePreview(data.signatureURL);
        setIsSaved(true);
      }
    } catch (err) {
      console.log("Failed to fetch settings", err);
    }
  };

  const validate = () => {
    let err = {};
    if (!form.businessName.trim())
      err.businessName = "Business name is required";
    if (!/^[0-9]{10}$/.test(form.contactNo))
      err.contactNo = "Contact must be 10 digits";
    if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email))
      err.email = "Invalid email format";
    if (!form.bankName.trim()) err.bankName = "Bank name is required";

    if (Object.keys(err).length > 0) {
      setShakeField(Object.keys(err)[0]); // Trigger shake on first error
      setTimeout(() => setShakeField(""), 500);
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (["gstin", "pan", "bankIFSC"].includes(name))
      value = value.toUpperCase();
    if (["contactNo", "accountNumber"].includes(name))
      value = value.replace(/\D/g, "");
    setForm({ ...form, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (name === "logo") setLogoPreview(reader.result);
      if (name === "signature") setSignaturePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const onAction = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        ...form,
        logoURL: logoPreview,
        signatureURL: signaturePreview,
      };

      console.log(payload);
      const res = await postRequest("SoftwareSettings/Save", payload);
      if (res.status === "OK") {
        Swal.fire({
          icon: "success",
          title: "Saved Successfully",
          text: "Your company settings are up to date.",
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          background: "rgba(15, 23, 42, 0.9)",
          color: "#f8fafc",
          iconColor: "#06b6d4",
        });
        setIsSaved(true);
      }
    } catch (err) {
      console.log(err.response?.data);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Server error occurred",
        background: "rgba(15, 23, 42, 0.9)",
        color: "#f8fafc",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageWrapper>
      <RGBBackground />

      {/* Sticky Header with Glassmorphism */}
      <HeaderSection className="fade-in">
        <HeaderContent>
          <div>
            <Breadcrumb>
              <span>Dashboard</span>
              <i className="fas fa-chevron-right" />
              <span>Settings</span>
              <i className="fas fa-chevron-right" />
              <span className="active">Company Profile</span>
            </Breadcrumb>
            <Title>
              Company Settings
              <div className="title-underline"></div>
            </Title>
            <Subtitle>
              Manage your business profile and financial preferences.
            </Subtitle>
          </div>
          <PrimaryButton onClick={onAction} disabled={loading}>
            {loading ? (
              <Spinner />
            ) : (
              <i
                className={`fas ${isSaved ? "fa-check-circle" : "fa-save"} me-2`}
              />
            )}
            {loading
              ? "Saving..."
              : isSaved
                ? "Update Settings"
                : "Save Changes"}
          </PrimaryButton>
        </HeaderContent>
      </HeaderSection>

      <Container className="p-3 p-md-4">
        <div className="row g-4">
          {/* Left Column: Company Info */}
          <div className="col-lg-7 col-xl-8">
            <GlassCard className="stagger-1">
              <CardHeader>
                <IconBox className="bg-primary-glow">
                  <i className="fas fa-building" />
                </IconBox>
                <div>
                  <h3>General Information</h3>
                  <p>Basic details and legal identifiers.</p>
                </div>
              </CardHeader>

              <FormGrid>
                <div className="full-width">
                  <FloatingGroup $isShaking={shakeField === "businessName"}>
                    <FormInput
                      name="businessName"
                      placeholder=" "
                      value={form.businessName}
                      onChange={handleChange}
                      $hasError={!!errors.businessName}
                    />
                    <FloatingLabel $hasError={!!errors.businessName}>
                      Legal Business Name <span className="text-danger">*</span>
                    </FloatingLabel>
                    {errors.businessName && (
                      <ErrorMsg>
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {errors.businessName}
                      </ErrorMsg>
                    )}
                  </FloatingGroup>
                </div>

                <FloatingGroup $isShaking={shakeField === "contactNo"}>
                  <FormInput
                    name="contactNo"
                    placeholder=" "
                    maxLength={10}
                    value={form.contactNo}
                    onChange={handleChange}
                    $hasError={!!errors.contactNo}
                  />
                  <FloatingLabel $hasError={!!errors.contactNo}>
                    Contact Number <span className="text-danger">*</span>
                  </FloatingLabel>
                  {errors.contactNo && (
                    <ErrorMsg>
                      <i className="fas fa-exclamation-circle me-1"></i>
                      {errors.contactNo}
                    </ErrorMsg>
                  )}
                </FloatingGroup>

                <FloatingGroup $isShaking={shakeField === "email"}>
                  <FormInput
                    name="email"
                    placeholder=" "
                    value={form.email}
                    onChange={handleChange}
                    $hasError={!!errors.email}
                  />
                  <FloatingLabel $hasError={!!errors.email}>
                    Business Email
                  </FloatingLabel>
                  {errors.email && (
                    <ErrorMsg>
                      <i className="fas fa-exclamation-circle me-1"></i>
                      {errors.email}
                    </ErrorMsg>
                  )}
                </FloatingGroup>

                <FloatingGroup>
                  <FormInput
                    name="gstin"
                    placeholder=" "
                    maxLength={15}
                    value={form.gstin}
                    onChange={handleChange}
                  />
                  <FloatingLabel>GSTIN</FloatingLabel>
                </FloatingGroup>

                <FloatingGroup>
                  <FormInput
                    name="pan"
                    placeholder=" "
                    maxLength={10}
                    value={form.pan}
                    onChange={handleChange}
                  />
                  <FloatingLabel>PAN Number</FloatingLabel>
                </FloatingGroup>

                <div className="full-width mt-3 mb-2">
                  <Divider />
                </div>

                <div className="full-width">
                  <FloatingGroup>
                    <FormInput
                      name="addressLine1"
                      placeholder=" "
                      value={form.addressLine1}
                      onChange={handleChange}
                    />
                    <FloatingLabel>Street Address / Building</FloatingLabel>
                  </FloatingGroup>
                </div>

                <FloatingGroup>
                  <FormInput
                    name="addressLine2"
                    placeholder=" "
                    value={form.addressLine2}
                    onChange={handleChange}
                  />
                  <FloatingLabel>City / Locality</FloatingLabel>
                </FloatingGroup>

                <FloatingGroup>
                  <FormInput
                    name="addressLine3"
                    placeholder=" "
                    value={form.addressLine3}
                    onChange={handleChange}
                  />
                  <FloatingLabel>State & Pincode</FloatingLabel>
                </FloatingGroup>
              </FormGrid>
            </GlassCard>
          </div>

          {/* Right Column: Bank & Branding */}
          <div className="col-lg-5 col-xl-4">
            <VerticalStack>
              {/* Bank Details */}
              <GlassCard className="stagger-2">
                <CardHeader>
                  <IconBox className="bg-cyan-glow">
                    <i className="fas fa-university" />
                  </IconBox>
                  <div>
                    <h3>Bank Details</h3>
                    <p>Financial account information.</p>
                  </div>
                </CardHeader>
                <div className="d-flex flex-column gap-4 mt-4">
                  <FloatingGroup $isShaking={shakeField === "bankName"}>
                    <FormInput
                      name="bankName"
                      placeholder=" "
                      value={form.bankName}
                      onChange={handleChange}
                      $hasError={!!errors.bankName}
                    />
                    <FloatingLabel $hasError={!!errors.bankName}>
                      Bank Name <span className="text-danger">*</span>
                    </FloatingLabel>
                    {errors.bankName && (
                      <ErrorMsg>
                        <i className="fas fa-exclamation-circle me-1"></i>
                        {errors.bankName}
                      </ErrorMsg>
                    )}
                  </FloatingGroup>

                  <FloatingGroup>
                    <FormInput
                      name="accountHolderName"
                      placeholder=" "
                      value={form.accountHolderName}
                      onChange={handleChange}
                    />
                    <FloatingLabel>Account Holder Name</FloatingLabel>
                  </FloatingGroup>

                  <FloatingGroup>
                    <FormInput
                      name="accountNumber"
                      placeholder=" "
                      value={form.accountNumber}
                      onChange={handleChange}
                    />
                    <FloatingLabel>Account Number</FloatingLabel>
                  </FloatingGroup>

                  <FloatingGroup>
                    <FormInput
                      name="bankIFSC"
                      placeholder=" "
                      value={form.bankIFSC}
                      onChange={handleChange}
                    />
                    <FloatingLabel>IFSC Code</FloatingLabel>
                  </FloatingGroup>
                </div>
              </GlassCard>

              {/* Branding Section */}
              <GlassCard className="stagger-3">
                <CardHeader>
                  <IconBox className="bg-blue-glow">
                    <i className="fas fa-paint-brush" />
                  </IconBox>
                  <div>
                    <h3>Visual Identity</h3>
                    <p>Upload company branding.</p>
                  </div>
                </CardHeader>

                <UploadGrid>
                  <UploadWrapper>
                    <div className="upload-label">Company Logo</div>
                    <UploadZone>
                      <input
                        type="file"
                        name="logo"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      {logoPreview ? (
                        <>
                          <img src={logoPreview} alt="Logo" />
                          <div className="overlay">
                            <i className="fas fa-exchange-alt"></i> Change Logo
                          </div>
                        </>
                      ) : (
                        <div className="empty-state">
                          <i className="fas fa-cloud-upload-alt text-primary" />
                          <span>Drag & Drop or Click</span>
                        </div>
                      )}
                    </UploadZone>
                  </UploadWrapper>

                  <UploadWrapper>
                    <div className="upload-label">Authorized Signature</div>
                    <UploadZone>
                      <input
                        type="file"
                        name="signature"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      {signaturePreview ? (
                        <>
                          <img
                            src={signaturePreview}
                            alt="Signature"
                            className="signature-img"
                          />
                          <div className="overlay">
                            <i className="fas fa-exchange-alt"></i> Change Sign
                          </div>
                        </>
                      ) : (
                        <div className="empty-state">
                          <i className="fas fa-pen-nib text-cyan" />
                          <span>Upload Signature</span>
                        </div>
                      )}
                    </UploadZone>
                  </UploadWrapper>
                </UploadGrid>
              </GlassCard>
            </VerticalStack>
          </div>
        </div>
      </Container>
    </PageWrapper>
  );
}

/* ================= KEYFRAMES ================= */
const fadeIn = keyframes`from { opacity: 0; transform: translateY(20px); filter: blur(4px); } to { opacity: 1; transform: translateY(0); filter: blur(0); }`;
const spin = keyframes`to { transform: rotate(360deg); }`;
const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
`;
const pulseGlow = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0.5); }
  70% { box-shadow: 0 0 0 12px rgba(6, 182, 212, 0); }
  100% { box-shadow: 0 0 0 0 rgba(6, 182, 212, 0); }
`;
const moveBackground = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;
const topBorderGlow = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

/* ================= STYLED COMPONENTS ================= */

const PageWrapper = styled.div`
  min-height: 100vh;
  font-family:
    "Inter",
    -apple-system,
    BlinkMacSystemFont,
    sans-serif;
  color: #f8fafc;
  padding-bottom: 40px;
  position: relative;
  z-index: 1;
  background: linear-gradient(135deg, #020617, #0b1221, #020617);
  background-size: 200% 200%;
  animation: ${moveBackground} 15s ease infinite;

  .text-danger {
    color: #ef4444 !important;
  }
  .text-primary {
    color: #3b82f6 !important;
  }
  .text-cyan {
    color: #06b6d4 !important;
  }

  .fade-in {
    opacity: 0;
    animation: ${fadeIn} 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .stagger-1 {
    animation-delay: 0.1s;
  }
  .stagger-2 {
    animation-delay: 0.2s;
  }
  .stagger-3 {
    animation-delay: 0.3s;
  }
`;

const RGBBackground = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    radial-gradient(
      circle at 20% 30%,
      rgba(59, 130, 246, 0.15),
      transparent 40%
    ),
    radial-gradient(circle at 80% 70%, rgba(6, 182, 212, 0.12), transparent 40%);
  z-index: -1;
  pointer-events: none;
`;

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
`;

const HeaderSection = styled.div`
  position: sticky;
  top: 0;
  z-index: 90;
  background: rgba(11, 18, 33, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(59, 130, 246, 0.15);
  padding: 1.5rem 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const HeaderContent = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.25rem;
    button {
      width: 100%;
      justify-content: center;
    }
  }
`;

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  color: #94a3b8;
  margin-bottom: 8px;
  font-weight: 500;
  i {
    font-size: 0.6rem;
    opacity: 0.6;
  }
  .active {
    color: #06b6d4;
    font-weight: 600;
    text-shadow: 0 0 10px rgba(6, 182, 212, 0.5);
  }
`;

const Title = styled.h2`
  font-weight: 800;
  font-size: 1.85rem;
  letter-spacing: -0.025em;
  margin: 0 0 4px 0;
  color: #f8fafc;
  position: relative;
  display: inline-block;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.1);

  .title-underline {
    position: absolute;
    bottom: -4px;
    left: 0;
    height: 3px;
    width: 50px;
    border-radius: 4px;
    background: linear-gradient(90deg, #06b6d4, #3b82f6, transparent);
    background-size: 200% 100%;
    animation: ${topBorderGlow} 3s linear infinite;
  }
`;

const Subtitle = styled.p`
  font-size: 0.9rem;
  color: #94a3b8;
  margin: 0;
  margin-top: 8px;
`;

const PrimaryButton = styled.button`
  background: linear-gradient(135deg, #3b82f6, #06b6d4);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 15px rgba(6, 182, 212, 0.3);
  animation: ${pulseGlow} 2.5s infinite;

  &:hover:not(:disabled) {
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 8px 25px rgba(6, 182, 212, 0.5);
    filter: brightness(1.15);
  }
  &:active:not(:disabled) {
    transform: scale(0.97);
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    animation: none;
    box-shadow: none;
  }
`;

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
  margin-right: 10px;
`;

const GlassCard = styled.div`
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(59, 130, 246, 0.25);
  border-radius: 16px;
  padding: 2rem;
  position: relative;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  overflow: hidden;

  /* Animated top border glow */
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
      #06b6d4,
      #3b82f6,
      transparent
    );
    background-size: 200% auto;
    opacity: 0;
    transition: 0.4s;
  }

  &:hover {
    transform: translateY(-5px) scale(1.01);
    box-shadow:
      0 0 25px rgba(59, 130, 246, 0.25),
      0 15px 35px -5px rgba(0, 0, 0, 0.4);
    border-color: rgba(13, 103, 248, 0.89);
    &::before {
      opacity: 1;
      animation: ${topBorderGlow} 3s linear infinite;
    }
  }

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  h3 {
    font-size: 1.25rem;
    font-weight: 700;
    margin: 0;
    color: #f8fafc;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
  }
  p {
    font-size: 0.85rem;
    color: #94a3b8;
    margin: 4px 0 0 0;
  }
`;

const IconBox = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  transition:
    transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
    box-shadow 0.3s ease;

  &.bg-primary-glow {
    background: rgba(59, 130, 246, 0.15);
    color: #3b82f6;
    border: 1px solid rgba(59, 130, 246, 0.3);
    box-shadow: inset 0 0 15px rgba(59, 130, 246, 0.2);
  }
  &.bg-cyan-glow {
    background: rgba(6, 182, 212, 0.15);
    color: #06b6d4;
    border: 1px solid rgba(6, 182, 212, 0.3);
    box-shadow: inset 0 0 15px rgba(6, 182, 212, 0.2);
  }
  &.bg-blue-glow {
    background: rgba(99, 102, 241, 0.15);
    color: #818cf8;
    border: 1px solid rgba(99, 102, 241, 0.3);
    box-shadow: inset 0 0 15px rgba(99, 102, 241, 0.2);
  }

  ${GlassCard}:hover & {
    transform: scale(1.1) rotate(5deg);
    box-shadow: 0 0 15px currentColor;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.75rem 1.25rem;
  .full-width {
    grid-column: span 2;
  }
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    .full-width {
      grid-column: span 1;
    }
  }
`;

const FloatingGroup = styled.div`
  position: relative;
  animation: ${(props) => (props.$isShaking ? shake : "none")} 0.4s ease-in-out;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 14px 16px;
  background: rgba(2, 6, 23, 0.5);
  border: 1px solid
    ${(props) =>
      props.$hasError ? "rgba(239, 68, 68, 0.6)" : "rgba(59, 130, 246, 0.25)"};
  border-radius: 10px;
  color: #f8fafc;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);

  &:hover:not(:focus) {
    border-color: ${(props) =>
      props.$hasError ? "#ef4444" : "rgba(6, 182, 212, 0.5)"};
    background: rgba(15, 23, 42, 0.6);
  }

  &:focus {
    outline: none;
    border-color: ${(props) => (props.$hasError ? "#ef4444" : "#06b6d4")};
    box-shadow:
      0 0 15px
        ${(props) =>
          props.$hasError
            ? "rgba(239, 68, 68, 0.3)"
            : "rgba(6, 182, 212, 0.4)"},
      inset 0 0 10px rgba(6, 182, 212, 0.1);
    background: rgba(15, 23, 42, 0.8);
  }
`;

const FloatingLabel = styled.label`
  position: absolute;
  left: 14px;
  top: 15px;
  pointer-events: none;
  color: ${(props) => (props.$hasError ? "#ef4444" : "#94a3b8")};
  font-size: 0.95rem;
  font-weight: 400;
  transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1) all;
  background: rgba(15, 23, 42, 0.9);
  padding: 0 6px;
  border-radius: 4px;
  border: 1px solid transparent;

  ${FormInput}:focus ~ &,
  ${FormInput}:not(:placeholder-shown) ~ & {
    top: -11px;
    left: 12px;
    font-size: 0.8rem;
    font-weight: 600;
    letter-spacing: 0.5px;
    color: ${(props) => (props.$hasError ? "#ef4444" : "#06b6d4")};
    border-color: ${(props) =>
      props.$hasError ? "rgba(239, 68, 68, 0.3)" : "rgba(6, 182, 212, 0.3)"};
    text-shadow: 0 0 10px
      ${(props) =>
        props.$hasError ? "rgba(239, 68, 68, 0.5)" : "rgba(6, 182, 212, 0.5)"};
  }
`;

const ErrorMsg = styled.span`
  color: #ef4444;
  font-size: 0.75rem;
  font-weight: 500;
  position: absolute;
  bottom: -20px;
  left: 4px;
  text-shadow: 0 0 5px rgba(239, 68, 68, 0.5);
`;

const Divider = styled.div`
  height: 1px;
  width: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(59, 130, 246, 0.3),
    transparent
  );
`;

const VerticalStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const UploadGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
`;

const UploadWrapper = styled.div`
  .upload-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: #94a3b8;
    margin-bottom: 10px;
    letter-spacing: 0.5px;
  }
`;

const UploadZone = styled.div`
  height: 140px;
  border: 2px dashed rgba(59, 130, 246, 0.4);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  background: rgba(2, 6, 23, 0.4);

  input {
    position: absolute;
    opacity: 0;
    width: 100%;
    height: 100%;
    cursor: pointer;
    z-index: 10;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    i {
      font-size: 2rem;
      transition: transform 0.3s;
      color: #3b82f6;
      text-shadow: 0 0 10px rgba(59, 130, 246, 0.4);
    }
    span {
      font-size: 0.85rem;
      font-weight: 500;
      color: #94a3b8;
    }
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    padding: 12px;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .signature-img {
    filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.2));
  }

  .overlay {
    position: absolute;
    inset: 0;
    background: rgba(11, 18, 33, 0.7);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    opacity: 0;
    transition: opacity 0.3s ease;
    font-weight: 500;
    font-size: 0.9rem;
    backdrop-filter: blur(6px);
    pointer-events: none;
    border: 1px solid rgba(6, 182, 212, 0.5);
    border-radius: 12px;
  }

  &:hover {
    border-color: #06b6d4;
    background: rgba(6, 182, 212, 0.1);
    box-shadow: 0 0 20px rgba(6, 182, 212, 0.2);
    transform: scale(1.02);
    .empty-state i {
      transform: translateY(-4px) scale(1.1);
      color: #06b6d4 !important;
      text-shadow: 0 0 15px rgba(6, 182, 212, 0.6);
    }
    img {
      transform: scale(1.05);
    }
    .overlay {
      opacity: 1;
    }
  }
`;
