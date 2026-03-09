// pages/index/+Page.jsx

import { useState, useEffect, useRef } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";

// ─── AUTH HELPERS ──────────────────────────────────────────────────────────
const getToken = () => localStorage.getItem("admin_token");
const getAdmin = () => JSON.parse(localStorage.getItem("admin_info") || "null");
const clearAuth = () => {
  localStorage.removeItem("admin_token");
  localStorage.removeItem("admin_info");
};

const authFetch = async (url, options = {}) => {
  const token = getToken();
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
    return null;
  }
  return res;
};

const logout = async () => {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${API_BASE}/api/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      /* ignore */
    }
  }
  clearAuth();
  window.location.href = "/login";
};

// ─── REAL BACKEND API ──────────────────────────────────────────────────────
const API_BASE = "http://localhost:5000";

async function fetchEmployee(id) {
  if (!id || id.trim().length < 3) return null;
  try {
    const res = await authFetch(
      `${API_BASE}/api/employees/${id.trim().toUpperCase()}`,
    );
    if (!res || res.status === 404) return null;
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    console.error("[fetchEmployee]", err);
    return null;
  }
}

async function saveEmployee(id, data) {
  const res = await authFetch(`${API_BASE}/api/employees`, {
    method: "POST",
    body: JSON.stringify({ ...data, employeeId: id.trim().toUpperCase() }),
  });
  if (!res) return false;
  const json = await res.json();
  if (!json.success) throw new Error(json.message || "Failed to save employee");
  return true;
}

async function sendSalaryToBackend(formData, isNewJoinee) {
  const res = await authFetch(`${API_BASE}/api/salary/send`, {
    method: "POST",
    body: JSON.stringify({ ...formData, isNewJoinee }),
  });
  if (!res) return { emailSent: false, emailError: "Auth error" };
  return res.json();
}

async function checkEmployeeExists(id) {
  try {
    const res = await authFetch(
      `${API_BASE}/api/employees/${id.trim().toUpperCase()}`,
    );
    return res && res.ok;
  } catch {
    return false;
  }
}

// ─── HELPERS ───────────────────────────────────────────────────────────────
const numberToWords = (num) => {
  if (!num || num === 0) return "Zero";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const sub = (n) => {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100)
      return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    return (
      ones[Math.floor(n / 100)] +
      " Hundred" +
      (n % 100 ? " " + sub(n % 100) : "")
    );
  };
  const cr = Math.floor(num / 10000000),
    lk = Math.floor((num % 10000000) / 100000);
  const th = Math.floor((num % 100000) / 1000),
    rm = num % 1000;
  return [
    cr && sub(cr) + " Crore",
    lk && sub(lk) + " Lakh",
    th && sub(th) + " Thousand",
    rm && sub(rm),
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
};

// ─── VALIDATION ────────────────────────────────────────────────────────────
const validationSchema = Yup.object({
  employeeId: Yup.string().required("Employee ID is required"),
  employeeName: Yup.string().required("Employee Name is required"),
  designation: Yup.string().required("Designation is required"),
  department: Yup.string().required("Department is required"),
  dateOfJoining: Yup.string().required("Date of Joining is required"),
  payMonth: Yup.string().required("Pay Month is required"),
  bankName: Yup.string().required("Bank Name is required"),
  bankAcNo: Yup.string().required("Bank A/C No is required"),
  email: Yup.string().email("Invalid email address").nullable(),
  payDays: Yup.number()
    .typeError("Must be a number")
    .min(0)
    .required("Pay Days is required"),
  lopDays: Yup.number()
    .typeError("Must be a number")
    .min(0)
    .required("LOP Days is required"),
  basicSalary: Yup.number()
    .typeError("Must be a number")
    .min(0)
    .required("Basic Salary is required"),
  incentivePay: Yup.number().typeError("Must be a number"),
  travelAllowance: Yup.number().typeError("Must be a number"),
  lossOfPay: Yup.number()
    .typeError("Must be a number")
    .min(0)
    .required("Required"),
});

const defaultValues = {
  employeeId: "",
  employeeName: "",
  designation: "",
  department: "",
  dateOfJoining: "",
  payMonth: "",
  bankName: "",
  bankAcNo: "",
  email: "",
  payDays: "",
  lopDays: "0",
  basicSalary: "",
  incentivePay: "",
  travelAllowance: "",
  lossOfPay: "",
};

// ─── SLIP CONTENT ─────────────────────────────────────────────────────────
function SlipContent({ values, isNewJoinee }) {
  const earn =
    (Number(values.basicSalary) || 0) +
    (Number(values.incentivePay) || 0) +
    (Number(values.travelAllowance) || 0);
  const ded = Number(values.lossOfPay) || 0;
  const net = earn - ded;

  const fmt = (n) => Number(n || 0).toLocaleString("en-IN");

  const payMonthLabel = values.payMonth
    ? new Date(values.payMonth + "-01").toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      })
    : "—";

  const doj = values.dateOfJoining
    ? new Date(values.dateOfJoining).toLocaleDateString("en-IN")
    : "—";

  const lc = {
    border: "1px solid #111",
    padding: "15px",
    paddingTop: "6px",
    paddingBottom: "10px",
    paddingLeft: "15px",
    fontSize: "14px",
    background: "#EEF1FC",
    color: "#333",
    fontWeight: "600",
    letterSpacing: "0.3px",
    textTransform: "uppercase",
    verticalAlign: "middle",
    fontFamily: "Arial, sans-serif",
  };

  const vc = {
    border: "1px solid #111",
    padding: "6px 15px",
    fontSize: "14px",
    background: "#ffffff",
    color: "#111",
    fontWeight: "400",
    verticalAlign: "middle",
    fontFamily: "Arial, sans-serif",
  };

  const hc = {
    padding: "6px 18px",
    fontSize: "14px",
    fontWeight: "600",
    letterSpacing: "0.6px",
    background: "#FFD580",
    color: "#111",
    border: "1px solid #111",
    fontFamily: "Arial, sans-serif",
    verticalAlign: "middle",
  };

  return (
    <div
      style={{
        background: "#fff",
        padding: "40px 40px",
        fontFamily: "Georgia, 'Times New Roman', serif",
        color: "#111",
        width: "794px",
        height: "1123px",
        boxSizing: "border-box",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "4px" }}>
        <img
          src="/rbd-logo.webp"
          alt="Skyup Logo"
          style={{ width: "240px", display: "inline-block" }}
        />
      </div>

      <div
        style={{
          fontFamily: "Arial,sans-serif",
          fontSize: "24px",
          fontWeight: "900",
          letterSpacing: "4px",
          color: "#0037CA",
          textAlign: "center",
          marginBottom: "8px",
          paddingBottom: "10px",
        }}
      >
        SKYUP DIGITAL SOLUTIONS
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "between",
          gap: "40px",
          paddingTop: "6px",
          paddingBottom: "8px",
          width: "600px",
          paddingLeft: "20px",
          marginLeft: "45px",
          marginBottom: "5px",
          fontFamily: "Arial,sans-serif",
          backgroundColor: "#fffacd",
          borderRadius: "10px",
          marginTop: "20px",
        }}
      >
        <span style={{ fontSize: "14px", letterSpacing: "0.3px" }}>
          <strong>GST NUMBER:</strong> 29ABLFRLZU
        </span>
        <span style={{ fontSize: "14px", letterSpacing: "0.3px" }}>
          <strong>REGISTRATION NUMBER:</strong> GDN-F729-2024-25
        </span>
      </div>

      <div
        style={{
          borderTop: "2px dotted #000",
          marginTop: "5px",
          marginBottom: "3px",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          marginBottom: "6px",
        }}
      >
        <span
          style={{
            fontFamily: "Arial,sans-serif",
            fontSize: "18px",
            letterSpacing: "3px",
            color: "#111",
            fontWeight: "700",
            textTransform: "uppercase",
            marginTop: "12px",
          }}
        >
          Salary Slip — {payMonthLabel}
        </span>
      </div>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "3px",
          marginTop: "20px",
        }}
      >
        <colgroup>
          <col style={{ width: "25%" }} />
          <col style={{ width: "25%" }} />
          <col style={{ width: "25%" }} />
          <col style={{ width: "25%" }} />
        </colgroup>
        <tbody>
          <tr>
            <td style={lc}>EMPLOYEE NAME</td>
            <td style={vc}>{values.employeeName || "—"}</td>
            <td style={lc}>BANK NAME</td>
            <td style={vc}>{values.bankName || "—"}</td>
          </tr>
          <tr>
            <td style={lc}>EMPLOYEE ID</td>
            <td style={vc}>{values.employeeId || "—"}</td>
            <td style={lc}>BANK A/C NO</td>
            <td style={vc}>{values.bankAcNo || "—"}</td>
          </tr>
          <tr>
            <td style={lc}>DESIGNATION</td>
            <td style={vc}>{values.designation || "—"}</td>
            <td style={lc}>PAY DAYS</td>
            <td style={vc}>{values.payDays || "—"}</td>
          </tr>
          <tr>
            <td style={lc}>DEPARTMENT</td>
            <td style={vc}>{values.department || "—"}</td>
            <td style={lc}>LOP DAYS</td>
            <td style={vc}>{values.lopDays || "0"}</td>
          </tr>
          <tr>
            <td style={lc}>DATE OF JOINING</td>
            <td style={vc} colSpan={3}>
              {doj}
            </td>
          </tr>
        </tbody>
      </table>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "0px",
          marginTop: "30px",
        }}
      >
        <colgroup>
          <col style={{ width: "37%" }} />
          <col style={{ width: "15%" }} />
          <col style={{ width: "25%" }} />
          <col style={{ width: "25%" }} />
        </colgroup>
        <thead>
          <tr>
            <th style={{ ...hc, textAlign: "left" }}>EARNINGS</th>
            <th style={{ ...hc, textAlign: "right" }}>AMOUNT</th>
            <th style={{ ...hc, textAlign: "left" }}>DEDUCTION</th>
            <th style={{ ...hc, textAlign: "right" }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ ...vc, textAlign: "left" }}>Basic Salary</td>
            <td style={{ ...vc, textAlign: "right" }}>
              {fmt(values.basicSalary)}
            </td>
            <td style={{ ...vc, textAlign: "left" }}>Loss of Pay</td>
            <td style={{ ...vc, textAlign: "right" }}>{fmt(ded)}</td>
          </tr>
          <tr>
            <td style={{ ...vc, textAlign: "left" }}>Incentive Pay</td>
            <td style={{ ...vc, textAlign: "right" }}>
              {fmt(values.incentivePay)}
            </td>
            <td style={vc} />
            <td style={vc} />
          </tr>
          <tr>
            <td style={{ ...vc, textAlign: "left" }}>Travel Allowance</td>
            <td style={{ ...vc, textAlign: "right" }}>
              {fmt(values.travelAllowance)}
            </td>
            <td style={vc} />
            <td style={vc} />
          </tr>
          <tr>
            <td
              style={{
                border: "1px solid #111",
                padding: "15px 15px",
                background: "#ffffff",
                fontFamily: "Arial, sans-serif",
              }}
            ></td>
            <td style={vc}></td>
            <td style={vc}></td>
            <td style={vc}></td>
          </tr>
          <tr>
            <td
              style={{
                ...vc,
                fontWeight: "400",
                letterSpacing: "0.3px",
                textAlign: "left",
              }}
            >
              TOTAL EARNINGS
            </td>
            <td style={{ ...vc, fontWeight: "400", textAlign: "right" }}>
              {fmt(earn)}
            </td>
            <td
              style={{
                ...vc,
                fontWeight: "400",
                letterSpacing: "0.3px",
                textAlign: "left",
              }}
            >
              TOTAL DEDUCTION
            </td>
            <td style={{ ...vc, fontWeight: "400", textAlign: "right" }}>
              {fmt(ded)}
            </td>
          </tr>
          <tr>
            <td colSpan="2"></td>
            <td
              style={{
                border: "1px solid #000",
                padding: "8px 8px",
                fontSize: "16px",
                background: "#FFD580",
                textAlign: "left",
                fontFamily: "Arial, sans-serif",
              }}
            >
              <strong>TOTAL SALARY</strong>
            </td>
            <td
              style={{
                border: "1px solid #000",
                padding: "8px 6px",
                fontSize: "16px",
                background: "#FFD580",
                textAlign: "right",
                fontFamily: "Arial, sans-serif",
              }}
            >
              <strong>{fmt(net)}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "Arial,sans-serif",
          color: "#444",
          marginTop: "40px",
          paddingBottom: "5px",
        }}
      >
        <div style={{ width: "50%", paddingTop: "30px" }}>
          <div
            style={{
              fontWeight: "700",
              fontSize: "16px",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "#111",
              marginBottom: "4px",
            }}
          >
            COMPANY ADDRESS
          </div>
          <div style={{ lineHeight: "1.8", color: "#555", fontSize: "14px" }}>
            Parinidhi #23, E Block, 14 A Main Road,
            <br />
            2nd Floor, Sahakaranagar,
            <br />
            Bangalore – 560092
          </div>
          <div style={{ marginTop: "5px" }}>
            <div
              style={{
                fontWeight: "700",
                fontSize: "16px",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                color: "#111",
                marginBottom: "4px",
              }}
            >
              CONTACT DETAILS
            </div>
            <div style={{ lineHeight: "1.8", color: "#555", fontSize: "14px" }}>
              +91 9538752960 | +91 9844104011
              <br />
              <strong>Email –</strong> contact@skyupdigital.com
            </div>
          </div>
        </div>

        <div
          style={{
            width: "50%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontFamily: "Georgia,serif",
              fontSize: "24px",
              color: "#111",
              marginBottom: "20px",
              marginTop: "40px",
              paddingTop: "35px",
            }}
          >
            Thank You
          </div>
          <div
            style={{
              textAlign: "center",
              paddingTop: "1px",
              fontSize: "14px",
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "#124aa3",
            }}
          >
            <div style={{ fontSize: "14px", opacity: 0.7 }}>
              {" "}
              For SKYUP DIGITAL SOLUTIONS
            </div>
            <div
              style={{
                fontSize: "14px",
                opacity: 0.7,
                marginTop: "0px",
                marginBottom: "5px",
                paddingTop: "20px",
              }}
            >
              Partner
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function Page() {
  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [fetchStatus, setFetchStatus] = useState("idle");
  const [isNewJoinee, setIsNewJoinee] = useState(false);
  const [isNewJoineeViaModal, setIsNewJoineeViaModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [showNewEmpModal, setShowNewEmpModal] = useState(false);
  const [newEmpIdInput, setNewEmpIdInput] = useState("");
  const [newEmpIdError, setNewEmpIdError] = useState("");
  const [adminInfo, setAdminInfo] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const receiptRef = useRef(null);
  const previewRef = useRef(null);
  const newEmpIdRef = useRef(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      window.location.href = "/login";
      return;
    }
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          clearAuth();
          window.location.href = "/login";
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.success) {
          setAdminInfo(data.admin);
          setAuthChecked(true);
        }
      })
      .catch(() => {
        clearAuth();
        window.location.href = "/login";
      });
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const formik = useFormik({
    initialValues: defaultValues,
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: () => {},
  });

  useEffect(() => {
    const id = formik.values.employeeId?.trim();
    if (!id || id.length < 3) {
      setFetchStatus("idle");
      setIsNewJoinee(false);
      setIsNewJoineeViaModal(false);
      [
        "employeeName",
        "designation",
        "department",
        "dateOfJoining",
        "bankName",
        "bankAcNo",
        "email",
      ].forEach((k) => formik.setFieldValue(k, "", false));
      return;
    }
    if (isNewJoineeViaModal) return;
    setFetchStatus("loading");
    let cancelled = false;
    fetchEmployee(id).then((emp) => {
      if (cancelled) return;
      if (emp) {
        Object.entries(emp).forEach(([k, v]) => {
          formik.setFieldValue(k, v, false);
          formik.setFieldTouched(k, false, false);
        });
        setFetchStatus("found");
        setIsNewJoinee(false);
        setIsNewJoineeViaModal(false);
      } else {
        [
          "employeeName",
          "designation",
          "department",
          "dateOfJoining",
          "bankName",
          "bankAcNo",
          "email",
        ].forEach((k) => formik.setFieldValue(k, "", false));
        setFetchStatus("notfound");
        setIsNewJoinee(false);
        setIsNewJoineeViaModal(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [formik.values.employeeId]);

  useEffect(() => {
    const basic = Number(formik.values.basicSalary),
      payDays = Number(formik.values.payDays),
      lopDays = Number(formik.values.lopDays);
    if (basic > 0 && payDays > 0 && lopDays >= 0)
      formik.setFieldValue(
        "lossOfPay",
        Math.round((basic / payDays) * lopDays * 100) / 100,
        false,
      );
    else if (lopDays === 0) formik.setFieldValue("lossOfPay", 0, false);
  }, [formik.values.basicSalary, formik.values.payDays, formik.values.lopDays]);

  const handleNewEmployeeProceed = () => {
    const id = newEmpIdInput.trim().toUpperCase();
    if (!id) {
      setNewEmpIdError("Please enter an Employee ID.");
      return;
    }
    checkEmployeeExists(id).then((exists) => {
      if (exists) {
        setNewEmpIdError(
          "This ID already exists. Use it in the form to auto-fill.",
        );
        return;
      }
      formik.resetForm({ values: { ...defaultValues, employeeId: id } });
      setFetchStatus("notfound");
      setIsNewJoinee(true);
      setIsNewJoineeViaModal(true);
      setShowPreview(false);
      setShowNewEmpModal(false);
      setNewEmpIdInput("");
      setNewEmpIdError("");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const handlePreview = async () => {
    if (fetchStatus === "notfound" && !isNewJoineeViaModal) {
      showToast("❌ Employee ID not found.");
      return;
    }
    const errors = await formik.validateForm();
    formik.setTouched(
      Object.keys(defaultValues).reduce((a, k) => ({ ...a, [k]: true }), {}),
    );
    if (Object.keys(errors).length === 0) {
      setShowPreview(true);
      setTimeout(
        () =>
          previewRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          }),
        200,
      );
    }
  };

  const handleGeneratePDF = async () => {
    if (fetchStatus === "notfound" && !isNewJoineeViaModal) {
      showToast("❌ Employee ID not found.");
      return;
    }
    const errors = await formik.validateForm();
    formik.setTouched(
      Object.keys(defaultValues).reduce((a, k) => ({ ...a, [k]: true }), {}),
    );
    if (Object.keys(errors).length > 0) {
      showToast("Please fix all errors before generating.", "error");
      return;
    }

    try {
      setIsGeneratingPDF(true);
      if (isNewJoinee && isNewJoineeViaModal) {
        await saveEmployee(formik.values.employeeId, formik.values);
        setFetchStatus("found");
        setIsNewJoinee(false);
        setIsNewJoineeViaModal(false);
        showToast("✅ New employee saved to database!");
        await new Promise((r) => setTimeout(r, 600));
      }
      if (!showPreview) {
        setShowPreview(true);
        await new Promise((r) => setTimeout(r, 800));
      }

      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");
      const element = receiptRef.current;
      if (!element) throw new Error("Receipt element not found.");
      await new Promise((r) => setTimeout(r, 300));

      const canvas = await html2canvas(element, {
        scale: 6,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        width: 794,
        height: 1123,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      pdf.addImage(imgData, "PNG", 0, 0, 210, 297);

      const name = (formik.values.employeeName || "Employee").replace(
        /\s+/g,
        "_",
      );
      const month = formik.values.payMonth || "Slip";
      pdf.save(`Salary_Slip_${name}_${month}.pdf`);

      try {
        const result = await sendSalaryToBackend(
          { ...formik.values, slipImageData: imgData },
          isNewJoinee,
        );
        if (result.emailSent)
          showToast(`✅ Salary slip emailed to ${formik.values.email}`);
        else
          showToast(
            `⚠️ PDF saved. Email failed: ${result.emailError || "Unknown error"}`,
            "error",
          );
      } catch (emailErr) {
        showToast(
          `⚠️ PDF downloaded but email failed: ${emailErr.message}`,
          "error",
        );
      }
      showToast("✅ PDF downloaded successfully!");
    } catch (err) {
      console.error(err);
      showToast(`❌ Failed: ${err.message}`, "error");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const AUTO_FIELDS = [
    "employeeName",
    "designation",
    "department",
    "dateOfJoining",
    "bankName",
    "bankAcNo",
    "email",
  ];

  // ── field() — mobile: smaller text + tighter padding; sm+ unchanged ──
  const field = (name, label, type = "text", alwaysEditable = false) => {
    const isAutoField = AUTO_FIELDS.includes(name);
    const readOnly = isAutoField && !isNewJoineeViaModal && !alwaysEditable;
    const isNewEntry = isAutoField && isNewJoinee && isNewJoineeViaModal;
    return (
      <div>
        <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-0.5 sm:mb-1">
          {label} <span className="text-red-500">*</span>
        </label>
        <input
          type={type}
          name={name}
          value={formik.values[name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          readOnly={readOnly}
          placeholder={
            readOnly
              ? "Auto-filled from Employee ID"
              : isNewEntry
                ? `Enter ${label}`
                : ""
          }
          className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-md focus:outline-none focus:ring-1 transition-colors
            ${
              formik.touched[name] && formik.errors[name]
                ? "border-red-500 focus:ring-red-500"
                : readOnly
                  ? "border-blue-200 bg-blue-50 cursor-default focus:ring-blue-300"
                  : isNewEntry
                    ? "border-blue-400 bg-blue-50 focus:ring-blue-500 placeholder-blue-400"
                    : "border-gray-300 focus:ring-indigo-500"
            }`}
        />
        {formik.touched[name] && formik.errors[name] && (
          <p className="text-red-500 text-[10px] sm:text-xs mt-0.5">
            {formik.errors[name]}
          </p>
        )}
      </div>
    );
  };

  const earn =
    (Number(formik.values.basicSalary) || 0) +
    (Number(formik.values.incentivePay) || 0) +
    (Number(formik.values.travelAllowance) || 0);
  const ded = Number(formik.values.lossOfPay) || 0;
  const net = earn - ded;
  const isUnknownId = fetchStatus === "notfound" && !isNewJoineeViaModal;

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg
            className="w-8 h-8 animate-spin text-blue-800"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
          </svg>
          <p className="text-gray-500 text-sm">Verifying session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print {
          body { background:white !important; margin:0 !important; padding:0 !important; }
          .no-print { display:none !important; }
          .print-container { display:block !important; position:relative !important; left:0 !important; visibility:visible !important; }
          @page { size:A4 portrait; margin:0; }
        }
        .preview-scroll { overflow-x: auto; -webkit-overflow-scrolling: touch; }
      `}</style>

      {/* ── Header ── */}
      <div className="no-print bg-white px-4 md:px-8 py-3 flex items-center gap-4 shadow-md sticky top-0 z-40">
        <div className="flex items-center justify-center flex-shrink-0 bg-white">
          <img
            src="rbd-logo.webp"
            alt="Skyup Logo"
            className="h-10 w-auto object-contain"
          />
        </div>
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => {
            setNewEmpIdInput("");
            setNewEmpIdError("");
            setShowNewEmpModal(true);
            setTimeout(() => newEmpIdRef.current?.focus(), 100);
          }}
          className="flex items-center gap-1.5 sm:gap-2 bg-white hover:bg-blue-50 border-2 border-blue-900 text-black px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full transition-colors"
        >
          <span className="relative flex-shrink-0">
            <svg
              className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-[#c9a84c] rounded-full flex items-center justify-center">
              <svg
                className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </span>
          </span>
          <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase hidden sm:inline">
            New Employee
          </span>
        </button>

        <div className="flex items-center gap-2 md:gap-3 pl-2 sm:pl-3 border-l border-gray-200">
          {adminInfo && (
            <div className="hidden md:flex flex-col items-end">
              <span className="text-black text-xs font-semibold">
                {adminInfo.name}
              </span>
              <span className="text-gray-400 text-[10px] capitalize">
                {adminInfo.role}
              </span>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1 sm:gap-1.5 bg-black hover:bg-red-600 text-white px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 text-[10px] sm:text-xs font-bold tracking-widest uppercase"
          >
            <svg
              className="w-3 h-3 sm:w-3.5 sm:h-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* ── New Employee Modal ── */}
      {showNewEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm no-print px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
            <div className="bg-[#0037CA] px-4 sm:px-6 py-4 sm:py-5 flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-white font-bold text-sm sm:text-base tracking-wide">
                  Add New Employee
                </h3>
                <p className="text-white/80 text-[10px] sm:text-xs mt-0.5">
                  Enter a unique Employee ID to start manual entry
                </p>
              </div>
              <button
                onClick={() => setShowNewEmpModal(false)}
                className="ml-auto text-white/70 hover:text-white transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
            <div className="px-4 sm:px-6 py-4 sm:py-6 space-y-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wider">
                  New Employee ID <span className="text-red-500">*</span>
                </label>
                <input
                  ref={newEmpIdRef}
                  type="text"
                  value={newEmpIdInput}
                  onChange={(e) => {
                    setNewEmpIdInput(e.target.value.toUpperCase());
                    setNewEmpIdError("");
                  }}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleNewEmployeeProceed()
                  }
                  placeholder="e.g. EMP005"
                  className={`w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm border-2 rounded-lg font-mono tracking-widest focus:outline-none transition-colors
                    ${newEmpIdError ? "border-red-400 bg-red-50" : "border-blue-300 focus:border-blue-500 bg-blue-50"}`}
                />
                {newEmpIdError && (
                  <p className="text-red-500 text-[10px] sm:text-xs mt-1.5 flex items-center gap-1">
                    <svg
                      className="w-3 h-3 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {newEmpIdError}
                  </p>
                )}
                <p className="text-gray-400 text-[10px] sm:text-xs mt-1.5">
                  All personal details will be editable. Employee will be saved
                  to the database on PDF generation.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {[
                  "Manual entry for all fields",
                  "New Joinee badge on slip",
                  "Saved to DB on PDF generation",
                ].map((t) => (
                  <span
                    key={t}
                    className="flex items-center gap-1 text-[9px] sm:text-[10px] text-blue-700 bg-blue-50 border border-blue-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium"
                  >
                    <svg
                      className="w-2 h-2 sm:w-2.5 sm:h-2.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex gap-2 sm:gap-3 justify-end flex-wrap">
              <button
                type="button"
                onClick={() => setShowNewEmpModal(false)}
                className="px-4 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gray-600 border-2 border-gray-200 rounded-full hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNewEmployeeProceed}
                className="px-4 sm:px-6 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white bg-[#0037CA] rounded-full shadow hover:shadow-lg hover:scale-105 transition-all duration-200 tracking-wide"
              >
                Proceed to Manual Entry →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Page Body ── */}
      <div className="no-print w-full px-3 sm:px-6 md:px-8 py-4 sm:py-6 md:py-10">
        {/* Page title — smaller on mobile */}
        <h2 className="text-base sm:text-xl md:text-2xl font-semibold text-gray-800 mb-4 sm:mb-6 text-center">
          Salary Slip Form
        </h2>

        <form onSubmit={formik.handleSubmit}>
          {/* Form card */}
          <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl mx-auto px-3 py-4 sm:px-6 sm:py-6 md:px-10 md:py-8 space-y-4 sm:space-y-6">
            {/* ── NEW JOINEE BANNER ── */}
            {isNewJoinee && isNewJoineeViaModal && (
              <div className="flex items-start gap-2 sm:gap-3 bg-[#0037CA] border border-blue-300 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                  <svg
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-xs sm:text-sm">
                    New Employee — Manual Entry Mode
                  </p>
                  <p className="text-blue-100 text-[10px] sm:text-xs mt-0.5 leading-relaxed">
                    Employee ID{" "}
                    <strong className="font-mono">
                      {formik.values.employeeId}
                    </strong>{" "}
                    is being registered. Fill in all details manually — they
                    will be <strong>saved to the database</strong> when you
                    generate the PDF.
                  </p>
                </div>
              </div>
            )}

            {/* ── Employee ID + Pay Month ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-0.5 sm:mb-1">
                  Employee ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="employeeId"
                  value={formik.values.employeeId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="e.g. EMP001"
                  disabled={isNewJoinee && isNewJoineeViaModal}
                  className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-md focus:outline-none focus:ring-1 font-mono tracking-widest
                    ${
                      formik.touched.employeeId && formik.errors.employeeId
                        ? "border-red-500 focus:ring-red-500"
                        : isUnknownId
                          ? "border-red-400 bg-red-50 focus:ring-red-400"
                          : isNewJoineeViaModal
                            ? "border-blue-400 bg-blue-50 cursor-default focus:ring-blue-300"
                            : "border-gray-300 focus:ring-indigo-500"
                    }`}
                />
                {fetchStatus === "loading" && (
                  <p className="text-amber-600 text-[10px] sm:text-xs mt-0.5 flex items-center gap-1">
                    <svg
                      className="w-3 h-3 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
                    </svg>
                    Fetching…
                  </p>
                )}
                {fetchStatus === "found" && !isNewJoinee && (
                  <p className="text-green-600 text-[10px] sm:text-xs mt-0.5">
                    ✓ Employee details loaded
                  </p>
                )}
                {isUnknownId && (
                  <p className="text-red-600 text-[10px] sm:text-xs mt-0.5 font-semibold flex items-center gap-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Invalid Employee ID — not registered
                  </p>
                )}
                {isNewJoineeViaModal && (
                  <p className="text-blue-700 text-[10px] sm:text-xs mt-0.5 font-medium">
                    ✦ New employee — fill in all details below
                  </p>
                )}
                {formik.touched.employeeId && formik.errors.employeeId && (
                  <p className="text-red-500 text-[10px] sm:text-xs mt-0.5">
                    {formik.errors.employeeId}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-0.5 sm:mb-1">
                  Pay Month <span className="text-red-500">*</span>
                </label>
                <input
                  type="month"
                  name="payMonth"
                  value={formik.values.payMonth}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-md focus:outline-none focus:ring-1 transition-colors
                    ${formik.touched.payMonth && formik.errors.payMonth ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-indigo-500"}`}
                />
                {formik.touched.payMonth && formik.errors.payMonth && (
                  <p className="text-red-500 text-[10px] sm:text-xs mt-0.5">
                    {formik.errors.payMonth}
                  </p>
                )}
              </div>
            </div>

            {/* ── Auto-filled Fields ── */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 ${isUnknownId ? "opacity-50 pointer-events-none select-none" : ""}`}
            >
              {field("employeeName", "Employee Name")}
              {field("designation", "Designation")}
              {field("department", "Department")}
              {field("dateOfJoining", "Date of Joining", "date")}
              {field("bankName", "Bank Name")}
              {field("bankAcNo", "Bank A/C No")}
            </div>

            {/* ── Email ── */}
            <div>
              <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-0.5 sm:mb-1">
                Employee Email
                <span className="ml-1 sm:ml-1.5 text-[8px] sm:text-[9px] tracking-wide text-blue-600 bg-blue-50 border border-blue-200 px-1 sm:px-1.5 py-0.5 rounded font-semibold uppercase">
                  Used to send PDF
                </span>
              </label>
              <input
                type="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                readOnly={!isNewJoineeViaModal && fetchStatus === "found"}
                placeholder={
                  isNewJoineeViaModal
                    ? "Enter employee email"
                    : "Auto-filled from Employee ID"
                }
                className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border rounded-md focus:outline-none focus:ring-1 transition-colors
                  ${
                    formik.touched.email && formik.errors.email
                      ? "border-red-500 focus:ring-red-500"
                      : !isNewJoineeViaModal && fetchStatus === "found"
                        ? "border-blue-200 bg-blue-50 cursor-default focus:ring-blue-300"
                        : isNewJoineeViaModal
                          ? "border-blue-400 bg-blue-50 focus:ring-blue-500 placeholder-blue-400"
                          : "border-gray-300 focus:ring-indigo-500"
                  }`}
              />
              {formik.touched.email && formik.errors.email && (
                <p className="text-red-500 text-[10px] sm:text-xs mt-0.5">
                  {formik.errors.email}
                </p>
              )}
              {formik.values.email && (
                <p className="text-blue-500 text-[10px] sm:text-xs mt-0.5">
                  📧 Salary slip will be sent to this address on PDF generation
                </p>
              )}
            </div>

            {/* ── Attendance ── */}
            <div
              className={
                isUnknownId ? "opacity-50 pointer-events-none select-none" : ""
              }
            >
              <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2">
                Attendance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {field("payDays", "Pay Days", "number", true)}
                {field("lopDays", "LOP Days", "number", true)}
              </div>
            </div>

            {/* ── Earnings ── */}
            <div
              className={
                isUnknownId ? "opacity-50 pointer-events-none select-none" : ""
              }
            >
              <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2">
                Earnings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
                {field("basicSalary", "Basic Salary (₹)", "number", true)}
                {field("incentivePay", "Incentive Pay (₹)", "number", true)}
                {field(
                  "travelAllowance",
                  "Travel Allowance (₹)",
                  "number",
                  true,
                )}
              </div>
            </div>

            {/* ── Deductions ── */}
            <div
              className={
                isUnknownId ? "opacity-50 pointer-events-none select-none" : ""
              }
            >
              <h3 className="text-xs sm:text-sm font-semibold text-gray-800 mb-1.5 sm:mb-2">
                Deductions
              </h3>
              <div>
                <label className="block text-[10px] sm:text-xs font-medium text-gray-700 mb-0.5 sm:mb-1">
                  Loss of Pay (₹)
                  <span className="ml-1 sm:ml-1.5 text-[8px] sm:text-[9px] tracking-wide text-purple-700 bg-purple-50 border border-purple-200 px-1 sm:px-1.5 py-0.5 rounded font-semibold uppercase">
                    Auto-Calculated
                  </span>
                </label>
                <input
                  type="number"
                  name="lossOfPay"
                  value={formik.values.lossOfPay}
                  readOnly
                  className="w-full sm:w-48 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-blue-200 bg-blue-50 text-blue-900 rounded-md cursor-default focus:outline-none font-semibold"
                />
                {formik.touched.lossOfPay && formik.errors.lossOfPay && (
                  <p className="text-red-500 text-[10px] sm:text-xs mt-0.5">
                    {formik.errors.lossOfPay}
                  </p>
                )}
              </div>
            </div>

            {/* ── Net Salary Summary ── */}
            <div
              className={`border rounded-md p-2.5 sm:p-3 ${net > 0 ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}
            >
              <div
                className={`text-xs sm:text-sm font-semibold ${net > 0 ? "text-blue-800" : "text-gray-600"}`}
              >
                Net Salary: ₹{net.toLocaleString("en-IN")}
              </div>
              <div
                className={`text-[10px] sm:text-xs mt-0.5 ${net > 0 ? "text-blue-600" : "text-gray-500"}`}
              >
                {net > 0
                  ? `${numberToWords(net)} Rupees Only`
                  : "Fill in salary details above"}
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-1">
              <button
                type="button"
                onClick={handlePreview}
                disabled={isUnknownId}
                className={`w-full sm:w-auto px-4 sm:px-6 py-1.5 sm:py-2 border-2 border-[#0037CA] text-[#0037CA] text-xs sm:text-sm font-semibold rounded-full hover:bg-[#0037CA] hover:text-white transition-all duration-200
                  ${isUnknownId ? "opacity-40 cursor-not-allowed" : ""}`}
              >
                PREVIEW SLIP
              </button>
              <button
                type="button"
                onClick={handleGeneratePDF}
                disabled={isGeneratingPDF || isUnknownId}
                className={`w-full sm:w-auto px-6 sm:px-10 py-1.5 sm:py-2 text-white text-xs sm:text-sm font-semibold rounded-full shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 bg-[#0037CA]
                  ${isGeneratingPDF || isUnknownId ? "opacity-40 cursor-not-allowed hover:scale-100" : ""}`}
              >
                {isGeneratingPDF
                  ? "Generating…"
                  : isNewJoinee && isNewJoineeViaModal
                    ? "SAVE & GENERATE PDF"
                    : "GENERATE PDF"}
              </button>
            </div>

            {/* ── Unknown ID hint ── */}
            {isUnknownId && (
              <div className="text-center py-1">
                <p className="text-[10px] sm:text-xs text-gray-400">
                  Enter a valid Employee ID, or{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setNewEmpIdInput(formik.values.employeeId);
                      setNewEmpIdError("");
                      setShowNewEmpModal(true);
                      setTimeout(() => newEmpIdRef.current?.focus(), 100);
                    }}
                    className="text-[#0037CA] font-semibold underline hover:text-blue-800"
                  >
                    register this ID as a new employee
                  </button>
                  .
                </p>
              </div>
            )}
          </div>
        </form>

        {/* ── Inline Preview ── */}
        {/* ── Inline Preview ── */}
        {showPreview && (
          <div
            ref={previewRef}
            className="mt-6 sm:mt-8 bg-white rounded-xl p-3 sm:p-4 md:p-6 w-full max-w-4xl mx-auto"
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-3 sm:mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800">
                  Salary Slip Preview
                </h3>
                {isNewJoinee && isNewJoineeViaModal && (
                  <span className="text-[10px] sm:text-xs font-bold tracking-widest uppercase text-white bg-blue-600 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                    ✦ New Joinee
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-700 text-xs sm:text-sm flex items-center gap-1"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                Close Preview
              </button>
            </div>

            {/* Responsive wrapper — fixed px sizes restored for desktop, shrinks on mobile */}
            <style>{`
      .slip-outer { width: 595px; height: 842px; }
      .slip-inner { transform: scale(0.75); }
      @media (max-width: 639px) {
        .slip-outer { width: calc(100vw - 48px); height: calc((100vw - 48px) * 1.414); }
        .slip-inner { transform: scale(calc((100vw - 48px) / 794)); }
      }
    `}</style>

            <div
              className="slip-outer overflow-hidden mx-auto"
              style={{
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                borderRadius: "4px",
              }}
            >
              <div
                className="slip-inner"
                style={{
                  width: "794px",
                  height: "1123px",
                  transformOrigin: "top left",
                  backgroundColor: "#ffffff",
                }}
              >
                <SlipContent values={formik.values} isNewJoinee={isNewJoinee} />
              </div>
            </div>
          </div>
        )}

        <div
          className="print-container"
          style={{
            position: "fixed",
            left: "-9999px",
            top: 0,
            width: "794px",
            height: "1123px",
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          <div ref={receiptRef} style={{ width: "794px", height: "1123px" }}>
            <SlipContent values={formik.values} isNewJoinee={isNewJoinee} />
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div
          className={`fixed bottom-4 sm:bottom-6 right-3 left-3 sm:right-4 sm:left-4 md:left-auto md:right-6 z-50 flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-xl text-xs sm:text-sm font-medium text-white shadow-xl ${toast.type === "error" ? "bg-red-600" : "bg-[#1a3a2a]"}`}
        >
          <span className="flex-1">{toast.msg}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-1 sm:ml-2 opacity-60 hover:opacity-100 text-lg leading-none flex-shrink-0"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
