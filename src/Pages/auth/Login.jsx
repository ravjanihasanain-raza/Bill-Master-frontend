import React, { useState, useContext, useEffect } from "react";
import styled, { keyframes, css } from "styled-components";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import * as Yup from "yup";
import Swal from "sweetalert2";
import { postRequest } from "../../../Services/axiosService";
import { rootContext } from "../../App";

/* ================= VALIDATION ================= */
const loginSchema = Yup.object({
  Email: Yup.string().email("Invalid email").required("Email required"),
  Password: Yup.string().required("Password required"),
});

export default function UnifiedLogin() {
  const navigate = useNavigate();
  const rootCtx = useContext(rootContext);

  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("Admin");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleForgotPassword = async () => {
    const email = formik.values.Email;
    if (!email) {
      Swal.fire("Info", "Please enter your email address first to reset your password.", "info");
      return;
    }
    try {
      rootCtx.setLoading(true);
      const endpoint = role === "Admin" ? "Admin/ForgotPassword" : "StaffMaster/ForgotPassword";
      const response = await postRequest(endpoint, { email: email }, false);
      rootCtx.setLoading(false);

      if (response?.status === "OK") {
        Swal.fire("Success", `A new password has been sent to your ${role} email.`, "success");
      } else {
        Swal.fire("Error", response?.message || "Email sending failed", "error");
      }
    } catch (err) {
      rootCtx.setLoading(false);
      Swal.fire("Error", "Server error while processing request.", "error");
    }
  };

  const formik = useFormik({
    initialValues: { Email: "", Password: "" },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      try {
        rootCtx.setLoading(true);
        const endpoint = role === "Admin" ? "Admin/Login" : "StaffMaster/Login";
        const response = await postRequest(endpoint, {
          Email: values.Email,
          Password: values.Password,
        }, false);
        rootCtx.setLoading(false);

        if (response?.status === "OK") {
          const storageKey = role === "Admin" ? "adminAuth" : "staffAuth";
          const redirectPath = role === "Admin" ? "/admin/dashboard" : "/staff/dashboard";

          localStorage.setItem(storageKey, JSON.stringify({
            id: response.result.id || response.result.Id,
            name: response.result.fullName || response.result.FullName,
            email: response.result.email || response.result.Email,
            role: response.result.role || response.result.Role,
          }));
          localStorage.setItem("lastLoginTime", new Date().toISOString());

          setIsSuccess(true);

          setTimeout(() => {
            navigate(redirectPath);
          }, 3500);
        } else {
          Swal.fire("Error", response?.message || "Invalid Login Credentials", "error");
        }
      } catch (err) {
        rootCtx.setLoading(false);
        Swal.fire("Error", "Server error connecting to backend", "error");
      }
    },
  });

  return (
    <PageShell>
      {/* ── SUCCESS OVERLAY ── */}
      {isSuccess && (
        <SuccessOverlay>
          <SuccessInner>
            <SuccessIconRing>
              <i className="fas fa-file-invoice-dollar" />
              <GearWrap>
                <i className="fas fa-cog gear-a" />
                <i className="fas fa-cog gear-b" />
              </GearWrap>
            </SuccessIconRing>
            <SuccessTitle>Authenticating Session</SuccessTitle>
            <SuccessSubtitle>Preparing your {role} workspace&hellip;</SuccessSubtitle>
            <ProgressTrack>
              <ProgressFill />
            </ProgressTrack>
            <SuccessFootnote>Abson Energy ERP &mdash; Secure Portal</SuccessFootnote>
          </SuccessInner>
        </SuccessOverlay>
      )}

      {/* ── LEFT HERO PANEL ── */}
      <HeroPanel>
        <HeroBg />
        <HeroGrid />
        <HeroContent>
          <HeroBrand>
            <BrandMark>AE</BrandMark>
            <BrandName>Abson Energy</BrandName>
          </HeroBrand>
          <HeroTagline>Enterprise Resource<br />Planning Portal</HeroTagline>
          <HeroDescription>
            Streamline operations, manage billing, and control your energy business
            from a single, intelligent platform.
          </HeroDescription>
          <BenefitList>
            <BenefitItem>
              <BenefitDot />
              Real-time invoice tracking &amp; billing management
            </BenefitItem>
            <BenefitItem>
              <BenefitDot />
              Multi-role access with granular permissions
            </BenefitItem>
            <BenefitItem>
              <BenefitDot />
              GST-compliant reporting &amp; export engine
            </BenefitItem>
          </BenefitList>
          <HeroFooter>
            <HeroStat><span>2026</span> Platform</HeroStat>
            <HeroStatDivider />
            <HeroStat>ISO Compliant</HeroStat>
            <HeroStatDivider />
            <HeroStat>256-bit Encrypted</HeroStat>
          </HeroFooter>
        </HeroContent>
      </HeroPanel>

      {/* ── RIGHT FORM PANEL ── */}
      <FormPanel>
        <CardWrap style={{ opacity: isSuccess ? 0 : 1, transition: "opacity 0.5s ease" }}>
          {/* Card top badge */}
          <CardBadge>
            <i className={role === "Admin" ? "fas fa-user-shield" : "fas fa-user-tie"} />
          </CardBadge>

          <CardTitle>Welcome back</CardTitle>
          <CardSubtitle>Sign in to your {role.toLowerCase()} account to continue</CardSubtitle>

          {/* Role Toggle */}
          <RoleBar>
            <RoleOption
              type="button"
              $active={role === "Admin"}
              onClick={() => setRole("Admin")}
            >
              <i className="fas fa-user-shield" /> Admin
            </RoleOption>
            <RoleOption
              type="button"
              $active={role === "Staff"}
              onClick={() => setRole("Staff")}
            >
              <i className="fas fa-user-tie" /> Staff
            </RoleOption>
          </RoleBar>

          {/* Form */}
          <StyledForm onSubmit={formik.handleSubmit}>
            <FieldBlock>
              <FieldLabel>Email Address</FieldLabel>
              <InputWrap $hasError={!!(formik.touched.Email && formik.errors.Email)}>
                <InputIcon><i className="fas fa-envelope" /></InputIcon>
                <StyledInput
                  type="email"
                  name="Email"
                  placeholder={`${role} email address`}
                  {...formik.getFieldProps("Email")}
                />
              </InputWrap>
              {formik.touched.Email && formik.errors.Email && (
                <FieldError><i className="fas fa-exclamation-circle" /> {formik.errors.Email}</FieldError>
              )}
            </FieldBlock>

            <FieldBlock>
              <FieldRow>
                <FieldLabel>Password</FieldLabel>
                <ForgotLink type="button" onClick={handleForgotPassword}>
                  Forgot password?
                </ForgotLink>
              </FieldRow>
              <InputWrap $hasError={!!(formik.touched.Password && formik.errors.Password)}>
                <InputIcon><i className="fas fa-lock" /></InputIcon>
                <StyledInput
                  type={showPassword ? "text" : "password"}
                  name="Password"
                  placeholder="Enter your password"
                  {...formik.getFieldProps("Password")}
                />
                <EyeBtn type="button" onClick={() => setShowPassword(!showPassword)}>
                  <i className={`fas ${showPassword ? "fa-eye" : "fa-eye-slash"}`} />
                </EyeBtn>
              </InputWrap>
              {formik.touched.Password && formik.errors.Password && (
                <FieldError><i className="fas fa-exclamation-circle" /> {formik.errors.Password}</FieldError>
              )}
            </FieldBlock>

            <SubmitBtn type="submit" disabled={rootCtx.loading || isSuccess}>
              {rootCtx.loading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin" /> Authenticating&hellip;
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt" /> Sign In to {role} Portal
                </>
              )}
            </SubmitBtn>
          </StyledForm>

          <CardFooter>
            &copy; 2026 Abson Energy &mdash; All rights reserved
          </CardFooter>
        </CardWrap>
      </FormPanel>
    </PageShell>
  );
}

/* ═══════════════════════════════════════════
   KEYFRAMES
═══════════════════════════════════════════ */

const spinCW = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const spinCCW = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(-360deg); }
`;

const progressSweep = keyframes`
  0%   { width: 0%; }
  60%  { width: 75%; }
  100% { width: 100%; }
`;

const overlayReveal = keyframes`
  from { opacity: 0; }
  to   { opacity: 1; }
`;

const cardReveal = keyframes`
  from { opacity: 0; transform: translateY(28px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const heroLineIn = keyframes`
  from { opacity: 0; transform: translateX(-30px); }
  to   { opacity: 1; transform: translateX(0); }
`;

const pulseGlow = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
  50%       { box-shadow: 0 0 0 12px rgba(59, 130, 246, 0.12); }
`;

const gridFloat = keyframes`
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
`;

/* ═══════════════════════════════════════════
   LAYOUT SHELL
═══════════════════════════════════════════ */

const PageShell = styled.div`
  display: flex;
  min-height: 100vh;
  width: 100vw;
  font-family: "DM Sans", "Segoe UI", system-ui, sans-serif;
  overflow: hidden;
  background: #070d1a;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`;

/* ═══════════════════════════════════════════
   HERO / LEFT PANEL
═══════════════════════════════════════════ */

const HeroPanel = styled.div`
  position: relative;
  flex: 1.1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 60px 56px;

  @media (max-width: 1100px) {
    padding: 48px 40px;
  }

  @media (max-width: 900px) {
    flex: none;
    padding: 48px 32px 36px;
    min-height: 320px;
  }

  @media (max-width: 480px) {
    padding: 36px 24px 28px;
    min-height: 280px;
  }
`;

/* Rich gradient background */
const HeroBg = styled.div`
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse 80% 60% at 20% 30%, rgba(29, 78, 216, 0.35) 0%, transparent 70%),
    radial-gradient(ellipse 60% 80% at 80% 80%, rgba(6, 182, 212, 0.18) 0%, transparent 70%),
    linear-gradient(160deg, #0c1628 0%, #06111f 55%, #010a14 100%);
`;

/* Dot-grid texture */
const HeroGrid = styled.div`
  position: absolute;
  inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px);
  background-size: 28px 28px;
  animation: ${gridFloat} 10s ease-in-out infinite;
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  max-width: 460px;
`;

const HeroBrand = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 44px;
  animation: ${heroLineIn} 0.7s ease both;
`;

const BrandMark = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #1d4ed8, #0ea5e9);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 900;
  color: white;
  letter-spacing: 0.5px;
  box-shadow: 0 8px 24px rgba(29, 78, 216, 0.4);
  flex-shrink: 0;
`;

const BrandName = styled.span`
  font-size: 17px;
  font-weight: 700;
  color: rgba(255,255,255,0.92);
  letter-spacing: 0.3px;
`;

const HeroTagline = styled.h1`
  font-size: clamp(32px, 3.8vw, 46px);
  font-weight: 800;
  line-height: 1.15;
  color: #ffffff;
  margin: 0 0 18px 0;
  letter-spacing: -0.03em;
  animation: ${heroLineIn} 0.7s 0.1s ease both;

  /* Subtle gradient on first word accent */
  background: linear-gradient(120deg, #ffffff 40%, #93c5fd 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const HeroDescription = styled.p`
  font-size: 15px;
  line-height: 1.7;
  color: rgba(148, 163, 184, 0.85);
  margin: 0 0 36px 0;
  font-weight: 400;
  max-width: 380px;
  animation: ${heroLineIn} 0.7s 0.2s ease both;
`;

const BenefitList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 48px 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  animation: ${heroLineIn} 0.7s 0.3s ease both;
`;

const BenefitItem = styled.li`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: rgba(203, 213, 225, 0.8);
  font-weight: 500;
`;

const BenefitDot = styled.div`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #3b82f6;
  flex-shrink: 0;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.6);
`;

const HeroFooter = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  animation: ${heroLineIn} 0.7s 0.4s ease both;
`;

const HeroStat = styled.span`
  font-size: 12px;
  color: rgba(100, 116, 139, 0.9);
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;

  span { color: #60a5fa; }
`;

const HeroStatDivider = styled.div`
  width: 1px;
  height: 14px;
  background: rgba(100, 116, 139, 0.3);
`;

/* ═══════════════════════════════════════════
   FORM / RIGHT PANEL
═══════════════════════════════════════════ */

const FormPanel = styled.div`
  flex: 0 0 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 32px;
  background: #0a1628;
  border-left: 1px solid rgba(255,255,255,0.06);
  position: relative;

  /* Subtle inner glow along left border */
  &::before {
    content: "";
    position: absolute;
    top: 15%;
    left: 0;
    width: 1px;
    height: 70%;
    background: linear-gradient(to bottom, transparent, rgba(59, 130, 246, 0.5), transparent);
  }

  @media (max-width: 1100px) {
    flex: 0 0 440px;
    padding: 36px 28px;
  }

  @media (max-width: 900px) {
    flex: none;
    border-left: none;
    border-top: 1px solid rgba(255,255,255,0.06);
    padding: 40px 28px 48px;
    width: 100%;

    &::before { display: none; }
  }
`;

const CardWrap = styled.div`
  width: 100%;
  max-width: 400px;
  animation: ${cardReveal} 0.65s 0.1s cubic-bezier(0.22, 1, 0.36, 1) both;
`;

const CardBadge = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(29, 78, 216, 0.25), rgba(14, 165, 233, 0.2));
  border: 1px solid rgba(59, 130, 246, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
  animation: ${pulseGlow} 3s ease-in-out infinite;

  i {
    font-size: 22px;
    color: #60a5fa;
  }
`;

const CardTitle = styled.h2`
  font-size: 26px;
  font-weight: 800;
  color: #f1f5f9;
  margin: 0 0 6px 0;
  letter-spacing: -0.025em;
`;

const CardSubtitle = styled.p`
  font-size: 14px;
  color: rgba(100, 116, 139, 0.9);
  margin: 0 0 28px 0;
  font-weight: 400;
  line-height: 1.5;
`;

/* ── ROLE TOGGLE ── */

const RoleBar = styled.div`
  display: flex;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 28px;
  gap: 4px;
`;

const RoleOption = styled.button`
  flex: 1;
  padding: 11px 0;
  border: none;
  border-radius: 9px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.1px;

  ${({ $active }) =>
    $active
      ? css`
          background: linear-gradient(135deg, #1d4ed8, #2563eb);
          color: #ffffff;
          box-shadow: 0 4px 14px rgba(29, 78, 216, 0.4);
        `
      : css`
          background: transparent;
          color: rgba(148, 163, 184, 0.6);
          &:hover {
            background: rgba(255,255,255,0.05);
            color: rgba(203, 213, 225, 0.85);
          }
        `}

  i { font-size: 12px; }
`;

/* ── FORM FIELDS ── */

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const FieldBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
`;

const FieldRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const FieldLabel = styled.label`
  font-size: 12.5px;
  font-weight: 700;
  color: rgba(148, 163, 184, 0.85);
  letter-spacing: 0.4px;
  text-transform: uppercase;
`;

const InputWrap = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid ${({ $hasError }) =>
    $hasError ? "rgba(248, 113, 113, 0.5)" : "rgba(255,255,255,0.08)"};
  border-radius: 12px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;

  &:focus-within {
    background: rgba(255, 255, 255, 0.065);
    border-color: ${({ $hasError }) =>
      $hasError ? "rgba(248, 113, 113, 0.7)" : "rgba(59, 130, 246, 0.55)"};
    box-shadow: 0 0 0 3px ${({ $hasError }) =>
      $hasError ? "rgba(239, 68, 68, 0.08)" : "rgba(37, 99, 235, 0.1)"};
  }
`;

const InputIcon = styled.div`
  padding: 0 14px 0 16px;
  color: rgba(100, 116, 139, 0.65);
  font-size: 14px;
  flex-shrink: 0;
  pointer-events: none;
`;

const StyledInput = styled.input`
  flex: 1;
  padding: 13px 12px 13px 0;
  background: transparent;
  border: none;
  outline: none;
  color: #e2e8f0;
  font-size: 14px;
  font-family: inherit;
  caret-color: #3b82f6;

  &::placeholder {
    color: rgba(100, 116, 139, 0.5);
    font-weight: 400;
  }

  /* Remove browser autofill styles */
  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus {
    -webkit-text-fill-color: #e2e8f0;
    -webkit-box-shadow: 0 0 0px 1000px #0f1e35 inset;
    transition: background-color 5000s ease-in-out 0s;
  }
`;

const EyeBtn = styled.button`
  padding: 0 16px;
  background: none;
  border: none;
  color: rgba(100, 116, 139, 0.55);
  cursor: pointer;
  font-size: 14px;
  transition: color 0.2s;
  flex-shrink: 0;

  &:hover { color: rgba(148, 163, 184, 0.9); }
`;

const ForgotLink = styled.button`
  background: none;
  border: none;
  color: #60a5fa;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  font-family: inherit;
  letter-spacing: 0.2px;
  transition: color 0.2s;

  &:hover { color: #93c5fd; text-decoration: underline; }
`;

const FieldError = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  color: #f87171;
  font-size: 12px;
  font-weight: 500;

  i { font-size: 11px; }
`;

const SubmitBtn = styled.button`
  margin-top: 8px;
  padding: 14px 20px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #1e40af 100%);
  color: #ffffff;
  font-family: inherit;
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: 0.2px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  transition: all 0.25s ease;
  box-shadow: 0 8px 20px rgba(29, 78, 216, 0.35);

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(29, 78, 216, 0.5);
    background: linear-gradient(135deg, #2563eb 0%, #3b82f6 50%, #1d4ed8 100%);
  }
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const CardFooter = styled.div`
  text-align: center;
  font-size: 11.5px;
  color: rgba(71, 85, 105, 0.7);
  margin-top: 28px;
  letter-spacing: 0.3px;
`;

/* ═══════════════════════════════════════════
   SUCCESS OVERLAY
═══════════════════════════════════════════ */

const SuccessOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: radial-gradient(ellipse at center, #0c1a35 0%, #060d1a 100%);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ${overlayReveal} 0.45s ease both;
`;

const SuccessInner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 24px;
  max-width: 360px;
`;

const SuccessIconRing = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(29, 78, 216, 0.12);
  border: 2px solid rgba(59, 130, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  box-shadow:
    0 0 0 12px rgba(29, 78, 216, 0.06),
    0 0 40px rgba(29, 78, 216, 0.2);

  i {
    font-size: 38px;
    color: #60a5fa;
    filter: drop-shadow(0 0 12px rgba(96, 165, 250, 0.5));
    position: relative;
    z-index: 1;
  }
`;

const GearWrap = styled.div`
  position: absolute;
  bottom: -4px;
  right: -4px;

  .gear-a {
    font-size: 24px;
    color: #475569;
    animation: ${spinCW} 3s linear infinite;
    display: block;
  }

  .gear-b {
    font-size: 16px;
    color: #334155;
    animation: ${spinCCW} 2s linear infinite;
    display: block;
    position: absolute;
    top: 12px;
    left: -14px;
  }
`;

const SuccessTitle = styled.h2`
  font-size: 22px;
  font-weight: 800;
  color: #f1f5f9;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
`;

const SuccessSubtitle = styled.p`
  font-size: 14px;
  color: rgba(148, 163, 184, 0.75);
  margin: 0 0 32px 0;
  font-weight: 400;
`;

const ProgressTrack = styled.div`
  width: 280px;
  height: 4px;
  border-radius: 99px;
  background: rgba(255,255,255,0.07);
  overflow: hidden;
  margin-bottom: 24px;
`;

const ProgressFill = styled.div`
  height: 100%;
  background: linear-gradient(90deg, #1d4ed8, #3b82f6, #60a5fa);
  border-radius: 99px;
  animation: ${progressSweep} 3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
`;

const SuccessFootnote = styled.p`
  font-size: 11.5px;
  color: rgba(71, 85, 105, 0.65);
  margin: 0;
  letter-spacing: 0.4px;
  text-transform: uppercase;
`;
