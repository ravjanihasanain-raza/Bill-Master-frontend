import React from "react";
import styled, { css } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, RefreshCcw, DollarSign } from "lucide-react";

export default function ExpenseModal({
  show,
  onClose,
  onSave,
  form,
  setForm,
  categories,
  submitLoading,
}) {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  return (
    <AnimatePresence>
      {show && (
        <Overlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !submitLoading && onClose()}
        >
          <ModalBox
            initial={{ scale: 0.94, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.94, y: 24, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHead>
              <ModalIconWrap $color="#3b82f6">
                <DollarSign size={18} />
              </ModalIconWrap>
              <div>
                <ModalTitle>
                  {form.id > 0 ? "Edit Expense" : "Log New Expense"}
                </ModalTitle>
                <ModalSubtitle>
                  {form.id > 0
                    ? "Update expense record details"
                    : "Enter details for a new business expense"}
                </ModalSubtitle>
              </div>
              <CloseBtn onClick={() => !submitLoading && onClose()}>
                <X size={18} />
              </CloseBtn>
            </ModalHead>

            <ModalBody>
              <FormGrid>
                <FormGroup>
                  <FormLabel>
                    Date <Req>*</Req>
                  </FormLabel>
                  <FormInput
                    type="date"
                    name="expenseDate"
                    value={
                      form.expenseDate ? form.expenseDate.split("T")[0] : ""
                    }
                    onChange={handleChange}
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>
                    Category <Req>*</Req>
                  </FormLabel>
                  <FormSelect
                    name="expenseCategoryId"
                    value={form.expenseCategoryId}
                    onChange={handleChange}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id || cat.Id} value={cat.id || cat.Id}>
                        {cat.categoryName || cat.CategoryName}
                      </option>
                    ))}
                  </FormSelect>
                </FormGroup>

                <FormGroup $full>
                  <FormLabel>
                    Expense Title <Req>*</Req>
                  </FormLabel>
                  <FormInput
                    name="expenseTitle"
                    value={form.expenseTitle}
                    onChange={handleChange}
                    placeholder="e.g., Monthly Server Hosting"
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>
                    Amount <Req>*</Req>
                  </FormLabel>
                  <FormInput
                    type="number"
                    step="0.01"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>
                    Payment Mode <Req>*</Req>
                  </FormLabel>
                  <FormSelect
                    name="paymentMode"
                    value={form.paymentMode}
                    onChange={handleChange}
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                  </FormSelect>
                </FormGroup>

                <FormGroup>
                  <FormLabel>Reference / Transaction No</FormLabel>
                  <FormInput
                    name="referenceNo"
                    value={form.referenceNo}
                    onChange={handleChange}
                    placeholder="TXN-12345"
                  />
                </FormGroup>

                {/* <FormGroup>
                  <FormLabel>Approval Status</FormLabel>
                  <ToggleRow>
                    <ToggleSwitch>
                      <input
                        type="checkbox"
                        name="isApproved"
                        checked={!!form.isApproved}
                        onChange={handleChange}
                      />
                      <span className="slider" />
                    </ToggleSwitch>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: form.isApproved
                          ? "#10b981"
                          : "var(--text-muted)",
                      }}
                    >
                      {form.isApproved ? "Approved" : "Pending"}
                    </span>
                  </ToggleRow>
                </FormGroup> */}

                <FormGroup $full>
                  <FormLabel>Notes</FormLabel>
                  <FormTextarea
                    name="notes"
                    value={form.notes}
                    onChange={handleChange}
                    placeholder="Additional context about this expense..."
                    rows={2}
                  />
                </FormGroup>
              </FormGrid>
            </ModalBody>

            <ModalFoot>
              <ModalBtn
                $variant="cancel"
                onClick={() => !submitLoading && onClose()}
                disabled={submitLoading}
              >
                <X size={14} /> Cancel
              </ModalBtn>
              <ModalBtn
                $variant="save"
                onClick={onSave}
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <RefreshCcw size={14} className="spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                {submitLoading
                  ? "Saving…"
                  : form.id > 0
                    ? "Update Expense"
                    : "Save Expense"}
              </ModalBtn>
            </ModalFoot>
          </ModalBox>
        </Overlay>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════
   STYLED COMPONENTS
═══════════════════════════════════════ */
const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(10, 16, 30, 0.7);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
`;

const ModalBox = styled(motion.div)`
  background: var(--card);
  border: 1px solid var(--border-custom);
  border-radius: 18px;
  width: 100%;
  max-width: 650px;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  overflow: hidden;
`;

const ModalHead = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-custom);
  background: var(--bg-light-custom);
`;

const ModalIconWrap = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  flex-shrink: 0;
  background: ${(p) => p.$color}18;
  color: ${(p) => p.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid ${(p) => p.$color}30;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 15px;
  font-weight: 800;
  color: var(--text);
`;

const ModalSubtitle = styled.p`
  margin: 2px 0 0;
  font-size: 12px;
  color: var(--text-muted);
  font-weight: 500;
`;

const CloseBtn = styled.button`
  margin-left: auto;
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 6px;
  border-radius: 8px;
  display: flex;
  transition: all 0.2s;
  &:hover {
    background: rgba(239, 68, 68, 0.08);
    color: #ef4444;
  }
`;

const ModalBody = styled.div`
  padding: 22px 24px;
  overflow-y: auto;
  flex: 1;
  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--border-custom);
    border-radius: 10px;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  ${(p) =>
    p.$full &&
    css`
      grid-column: 1 / -1;
    `}
`;

const FormLabel = styled.label`
  font-size: 11.5px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

const Req = styled.span`
  color: #ef4444;
  margin-left: 2px;
`;

const inputStyles = css`
  padding: 10px 14px;
  border-radius: 10px;
  font-size: 13.5px;
  border: 1.5px solid var(--border-custom);
  background: var(--bg-light-custom);
  color: var(--text);
  width: 100%;
  font-weight: 500;
  transition: all 0.2s;
  outline: none;
  &::placeholder {
    color: var(--text-muted);
    opacity: 0.6;
  }
  &:focus {
    background: var(--card);
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
  }
`;

const FormInput = styled.input`
  ${inputStyles}
`;
const FormSelect = styled.select`
  ${inputStyles}
`;
const FormTextarea = styled.textarea`
  ${inputStyles};
  resize: vertical;
  min-height: 70px;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
`;

const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  width: 42px;
  height: 22px;
  input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .slider {
    position: absolute;
    inset: 0;
    background: var(--border-custom);
    border-radius: 22px;
    cursor: pointer;
    transition: 0.3s;
    &::before {
      content: "";
      position: absolute;
      width: 16px;
      height: 16px;
      left: 3px;
      bottom: 3px;
      background: white;
      border-radius: 50%;
      transition: 0.3s;
    }
  }
  input:checked + .slider {
    background: #10b981;
  }
  input:checked + .slider::before {
    transform: translateX(20px);
  }
`;

const ModalFoot = styled.div`
  padding: 16px 24px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid var(--border-custom);
  background: var(--bg-light-custom);
`;

const ModalBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  transition: all 0.25s ease;
  ${(p) =>
    p.$variant === "save" &&
    css`
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
      &:hover:not(:disabled) {
        filter: brightness(1.08);
        transform: translateY(-1px);
      }
    `}
  ${(p) =>
    p.$variant === "cancel" &&
    css`
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border-custom);
      &:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.06);
        color: #ef4444;
        border-color: rgba(239, 68, 68, 0.4);
      }
    `}
  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none !important;
  }
`;
