import Swal from "sweetalert2";

// Clean and Native SweetAlert config (No transparent/glassy stuff)
const modalConfig = {
  buttonsStyling: false, // Allows us to use our custom classes
  showCloseButton: true,
  customClass: {
    actions: "swal2-actions-custom",
    confirmButton: "action-btn primary px-4",
    cancelButton: "action-btn secondary px-4",
    denyButton: "action-btn danger px-4",
  },
};

/* ================= SUCCESS ALERT ================= */
export const successAlert = (title = "Success!", text = "") => {
  return Swal.fire({
    ...modalConfig,
    icon: "success",
    title: title,
    text: text,
    customClass: {
      ...modalConfig.customClass,
      confirmButton: "action-btn success px-4",
    },
    confirmButtonText: "OK",
  });
};

/* ================= ERROR ALERT ================= */
export const errorAlert = (title = "Error!", text = "") => {
  return Swal.fire({
    ...modalConfig,
    icon: "error",
    title: title,
    text: text,
    customClass: {
      ...modalConfig.customClass,
      confirmButton: "action-btn danger px-4",
    },
    confirmButtonText: "OK",
  });
};

/* ================= WARNING ALERT ================= */
export const warningAlert = (title = "Warning", text = "") => {
  return Swal.fire({
    ...modalConfig,
    icon: "warning",
    title: title,
    text: text,
    customClass: {
      ...modalConfig.customClass,
      confirmButton: "action-btn warning px-4",
    },
    confirmButtonText: "Understood",
  });
};

/* ================= INFO ALERT ================= */
export const infoAlert = (title = "Info", text = "") => {
  return Swal.fire({
    ...modalConfig,
    icon: "info",
    title: title,
    text: text,
    customClass: {
      ...modalConfig.customClass,
      confirmButton: "action-btn info px-4",
    },
    confirmButtonText: "OK",
  });
};

/* ================= CONFIRM ALERT (Perfect Delete Button) ================= */
export const confirmAlert = (title = "Are you sure?", text = "") => {
  return Swal.fire({
    ...modalConfig,
    icon: "warning",
    title: title,
    text: text,
    showCancelButton: true,
    confirmButtonText: "Yes, proceed",
    cancelButtonText: "Cancel",
    customClass: {
      ...modalConfig.customClass,
      confirmButton: "action-btn danger px-4",
      cancelButton: "action-btn secondary px-4",
    },
  });
};
