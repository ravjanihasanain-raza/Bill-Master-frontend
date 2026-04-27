import React, { useState, useContext, useEffect } from "react";
import styled, { keyframes } from "styled-components";
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
  const [isSuccess, setIsSuccess] = useState(false); // Success Animation State

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
  Password: values.Password
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

          // --- TRIGGER SUCCESS ANIMATION ---
          setIsSuccess(true);
          
          // Delay navigation for animation to play
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
    <Wrapper>
      {/* 🎬 SUCCESS ANIMATION OVERLAY */}
      {isSuccess && (
        <SuccessOverlay>
          <div className="animation-container">
             {/* Billing/Industrial Style Icon */}
            <div className="icon-box">
                <i className="fas fa-file-invoice-dollar bill-icon"></i>
                <div className="gear-container">
                    <i className="fas fa-cog gear-1"></i>
                    <i className="fas fa-cog gear-2"></i>
                </div>
            </div>
            <h2>Processing Secure Login...</h2>
            <p>Generating Session for Abson Energy</p>
            <div className="progress-bar">
                <div className="progress-fill"></div>
            </div>
          </div>
        </SuccessOverlay>
      )}

      {/* 🎥 Background Video Section */}
      <VideoBackground autoPlay loop muted playsInline>
        <source src="/src/images/background-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </VideoBackground>

      <Overlay />

      <LoginCard isSuccess={isSuccess}>
        <Logo>
          <i className={role === "Admin" ? "fas fa-user-shield" : "fas fa-user-tie"}></i>
          <h2>Abson Energy</h2>
          <p>{role} Login</p>
        </Logo>

        <RoleToggle>
          <RoleBtn active={role === "Admin"} onClick={() => setRole("Admin")} type="button">Admin</RoleBtn>
          <RoleBtn active={role === "Staff"} onClick={() => setRole("Staff")} type="button">Staff</RoleBtn>
        </RoleToggle>

        <Form onSubmit={formik.handleSubmit}>
          <InputGroup>
            <i className="fas fa-envelope"></i>
            <input type="email" name="Email" placeholder={`${role} Email`} {...formik.getFieldProps("Email")} />
          </InputGroup>
          {formik.touched.Email && formik.errors.Email && <Error>{formik.errors.Email}</Error>}

          <InputGroup>
            <i className="fas fa-lock"></i>
            <input type={showPassword ? "text" : "password"} name="Password" placeholder="Password" {...formik.getFieldProps("Password")} />
            <ToggleBtn type="button" onClick={() => setShowPassword(!showPassword)}>
              <i className={`fas ${showPassword ? "fa-eye" : "fa-eye-slash"}`}></i>
            </ToggleBtn>
          </InputGroup>
          {formik.touched.Password && formik.errors.Password && <Error>{formik.errors.Password}</Error>}

          <ForgotPasswordContainer>
            <span onClick={handleForgotPassword}>Forgot Password?</span>
          </ForgotPasswordContainer>

          <LoginBtn type="submit" disabled={rootCtx.loading || isSuccess}>
            {rootCtx.loading ? <span className="spinner-border spinner-border-sm"></span> : <><i className="fas fa-sign-in-alt me-2"></i>Login</>}
          </LoginBtn>
        </Form>
        <FooterText>© 2026 Abson Energy — Secure {role} Login</FooterText>
      </LoginCard>
    </Wrapper>
  );
}

/* ================= ANIMATIONS & STYLES ================= */

const fadeIn = keyframes`
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
`;

const slideUp = keyframes`
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const fillProgress = keyframes`
  0% { width: 0%; }
  100% { width: 100%; }
`;

const SuccessOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: ${fadeIn} 0.5s ease-out forwards;

  .animation-container {
    text-align: center;
    color: white;

    .icon-box {
        position: relative;
        margin-bottom: 30px;
        .bill-icon {
            font-size: 80px;
            color: #60a5fa;
            filter: drop-shadow(0 0 20px rgba(96, 165, 250, 0.6));
        }
        .gear-container {
            position: absolute;
            bottom: -10px;
            right: 35%;
            .gear-1 { font-size: 30px; color: #94a3b8; animation: ${spin} 3s linear infinite; }
            .gear-2 { font-size: 20px; color: #64748b; animation: ${spin} 2s linear infinite reverse; }
        }
    }

    h2 { font-size: 28px; font-weight: 700; margin-bottom: 10px; }
    p { opacity: 0.7; font-size: 16px; margin-bottom: 30px; }

    .progress-bar {
        width: 300px;
        height: 6px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 10px;
        overflow: hidden;
        margin: 0 auto;
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #2563eb, #60a5fa);
            width: 0%;
            animation: ${fillProgress} 3s ease-in-out forwards;
        }
    }
  }
`;

const Wrapper = styled.div`
  height: 100vh; width: 100vw;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
  background-color: #000;
`;

const VideoBackground = styled.video`
  position: absolute; top: 50%; left: 50%;
  min-width: 100%; min-height: 100%;
  width: auto; height: auto;
  z-index: 1; transform: translate(-50%, -50%);
  object-fit: cover;
`;

const Overlay = styled.div`
  position: absolute; top: 0; left: 0; width: 100%; height: 100%;
  background: radial-gradient(circle, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%);
  z-index: 2;
`;

const LoginCard = styled.div`
  width: 380px; padding: 40px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(25px);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.5);
  color: white;
  position: relative; z-index: 10;
  transition: opacity 0.5s ease;
  opacity: ${props => props.isSuccess ? 0 : 1}; /* Hide card on success */
`;

const Logo = styled.div`
  text-align: center; margin-bottom: 25px;
  i { font-size: 48px; color: #60a5fa; margin-bottom: 10px; text-shadow: 0 0 20px rgba(96, 165, 250, 0.5); }
  h2 { margin: 0; font-weight: 800; letter-spacing: 1px; }
  p { font-size: 14px; opacity: 0.7; margin-top: 4px; font-weight: 500; }
`;

const RoleToggle = styled.div`
  display: flex; background: rgba(0, 0, 0, 0.3); border-radius: 12px; margin-bottom: 25px; padding: 5px; border: 1px solid rgba(255, 255, 255, 0.05);
`;

const RoleBtn = styled.button`
  flex: 1; padding: 12px 0; border: none;
  background: ${(props) => (props.active ? "#2563eb" : "transparent")};
  color: ${(props) => (props.active ? "white" : "rgba(255, 255, 255, 0.5)")};
  border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer;
  transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  &:hover { color: white; }
`;

const Form = styled.form` display: flex; flex-direction: column; gap: 15px; `;

const InputGroup = styled.div`
  position: relative;
  i { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); opacity: 0.5; font-size: 16px; }
  input {
    width: 100%; padding: 14px 45px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.1);
    outline: none; background: rgba(255, 255, 255, 0.07); color: white; font-size: 14px; transition: 0.3s;
    &:focus { background: rgba(255, 255, 255, 0.12); border-color: #3b82f6; box-shadow: 0 0 15px rgba(59, 130, 246, 0.3); }
  }
`;

const ToggleBtn = styled.button`
  position: absolute; right: 15px; top: 50%; transform: translateY(-50%); background: none; border: none; color: white; opacity: 0.5; cursor: pointer;
  &:hover { opacity: 1; }
`;

const ForgotPasswordContainer = styled.div`
  text-align: right; margin-top: -5px;
  span { color: #60a5fa; cursor: pointer; font-size: 13px; font-weight: 500; &:hover { text-decoration: underline; } }
`;

const LoginBtn = styled.button`
  margin-top: 10px; padding: 14px; border-radius: 12px; border: none; background: linear-gradient(135deg, #2563eb, #60a5fa);
  color: white; font-weight: 700; font-size: 15px; cursor: pointer; transition: 0.3s;
  box-shadow: 0 10px 20px rgba(37, 99, 235, 0.3);
  &:hover { transform: translateY(-3px); box-shadow: 0 15px 25px rgba(37, 99, 235, 0.4); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const Error = styled.div` color: #fb7185; font-size: 12px; margin-top: -10px; margin-left: 5px; `;
const FooterText = styled.div` text-align: center; font-size: 12px; margin-top: 25px; opacity: 0.4; font-weight: 400; letter-spacing: 0.5px; `;