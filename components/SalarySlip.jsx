import { forwardRef, useEffect, useState } from "react";
import { useField, useFormikContext } from "formik";

// ─────────────────────────────────────────────
// MOCK EMPLOYEE DATABASE
// Replace fetchEmployee() with your real API call
// ─────────────────────────────────────────────
const EMPLOYEE_DB = {
  "EMP001": {
    employeeName: "Arjun Sharma",
    designation:  "Senior Engineer",
    department:   "Engineering",
    dateOfJoining: "2021-06-15",
    bankName:     "State Bank of India",
    bankAcNo:     "3847562910",
  },
  "EMP002": {
    employeeName: "Priya Nair",
    designation:  "HR Manager",
    department:   "Human Resources",
    dateOfJoining: "2019-03-01",
    bankName:     "HDFC Bank",
    bankAcNo:     "5023918476",
  },
  "EMP003": {
    employeeName: "Rahul Verma",
    designation:  "Project Manager",
    department:   "Operations",
    dateOfJoining: "2020-09-10",
    bankName:     "ICICI Bank",
    bankAcNo:     "7164829305",
  },
  "EMP004": {
    employeeName: "Kavitha Reddy",
    designation:  "UI/UX Designer",
    department:   "Design",
    dateOfJoining: "2022-01-20",
    bankName:     "Axis Bank",
    bankAcNo:     "9283746510",
  },
};

// To use a real API, replace the body of this function:
// async function fetchEmployee(id) {
//   const res = await fetch(`/api/employees/${id}`);
//   if (!res.ok) return null;
//   return res.json();
// }
async function fetchEmployee(id) {
  await new Promise(r => setTimeout(r, 500)); // simulate network delay
  return EMPLOYEE_DB[id.toUpperCase()] ?? null;
}

// ─────────────────────────────────────────────
// HOOK — watches employeeId, auto-fills fields
// ─────────────────────────────────────────────
export function useEmployeeFetch() {
  const { values, setFieldValue, setFieldTouched } = useFormikContext();
  const [fetchStatus, setFetchStatus] = useState("idle");
  // idle | loading | found | notfound

  const AUTO_FIELDS = ["employeeName","designation","department","dateOfJoining","bankName","bankAcNo"];

  useEffect(() => {
    const id = values.employeeId?.trim();
    if (!id || id.length < 3) {
      setFetchStatus("idle");
      AUTO_FIELDS.forEach(k => setFieldValue(k, "", false));
      return;
    }

    setFetchStatus("loading");
    let cancelled = false;

    fetchEmployee(id).then(emp => {
      if (cancelled) return;
      if (emp) {
        AUTO_FIELDS.forEach(k => {
          setFieldValue(k, emp[k] ?? "", false);
          setFieldTouched(k, false, false);
        });
        setFetchStatus("found");
      } else {
        AUTO_FIELDS.forEach(k => setFieldValue(k, "", false));
        setFetchStatus("notfound");
      }
    });

    return () => { cancelled = true; };
  }, [values.employeeId]);

  return fetchStatus;
}

// ─────────────────────────────────────────────
// 1. FormField — standard Formik field
// ─────────────────────────────────────────────
export function FormField({ label, readOnly = false, ...props }) {
  const [field, meta] = useField(props);
  const hasError = meta.touched && meta.error && !readOnly;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={props.id || props.name}
        className="text-[11px] tracking-[1px] uppercase text-[#5c5248] font-medium flex items-center gap-1.5"
      >
        {label}
        {readOnly && (
          <span className="text-[9px] tracking-[1px] text-[#c9a84c] bg-[#fff8e6] border border-[#f0d080] px-1.5 py-0.5 rounded font-semibold">
            AUTO
          </span>
        )}
      </label>

      <input
        id={props.id || props.name}
        {...field}
        {...props}
        readOnly={readOnly}
        placeholder={
          readOnly
            ? "Auto-filled from Employee ID"
            : props.type === "number" ? "0" : props.placeholder || ""
        }
        className={`form-input ${hasError ? "input-error" : ""} ${
          readOnly
            ? "bg-[#f0f7f3] border-[#c8ddd2] text-[#2d6a4f] cursor-default select-none"
            : ""
        }`}
      />

      {hasError && (
        <span className="text-[11px] text-red-600 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4.5zm0 7a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75z" />
          </svg>
          {meta.error}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 2. EmployeeIdField — with fetch status badge
// ─────────────────────────────────────────────
export function EmployeeIdField({ fetchStatus }) {
  const [field, meta] = useField({ name: "employeeId" });
  const hasError = meta.touched && meta.error;

  const statusEl = {
    idle:     null,
    loading:  (
      <span className="text-[#c9a84c] text-[11px] flex items-center gap-1.5">
        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
        </svg>
        Fetching employee…
      </span>
    ),
    found:    <span className="text-green-600 text-[11px] flex items-center gap-1">✓ Employee details loaded</span>,
    notfound: <span className="text-red-500  text-[11px] flex items-center gap-1">✕ No employee found for this ID</span>,
  }[fetchStatus];

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="employeeId" className="text-[11px] tracking-[1px] uppercase text-[#5c5248] font-medium">
        Employee ID
      </label>
      <input
        id="employeeId"
        {...field}
        type="text"
        placeholder="e.g. EMP001"
        className={`form-input font-mono tracking-widest ${hasError ? "input-error" : ""}`}
      />
      {statusEl}
      {hasError && (
        <span className="text-[11px] text-red-600 flex items-center gap-1">
          <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 3.5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 8 4.5zm0 7a.875.875 0 1 1 0-1.75.875.875 0 0 1 0 1.75z" />
          </svg>
          {meta.error}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 3. Toast
// ─────────────────────────────────────────────
export function Toast({ message, type = "success", onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg =
    type === "error"   ? "bg-red-600"
    : type === "warning" ? "bg-amber-500"
    : "bg-[#1a3a2a]";

  const icon = type === "error" ? "✕" : type === "warning" ? "⚠" : "✓";

  return (
    <div className={`toast-enter fixed bottom-7 right-7 z-50 flex items-center gap-3
      ${bg} text-white px-5 py-3.5 rounded-xl text-[13px] font-medium
      shadow-[0_6px_24px_rgba(0,0,0,0.2)]`}
    >
      <span className="text-base">{icon}</span>
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
    </div>
  );
}

// ─────────────────────────────────────────────
// 4. SalarySlipPreview — A4-fixed, hidden until
//    `visible` prop is true
// ─────────────────────────────────────────────
const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Cell helpers
const th = (extra = {}) => ({
  background: "#1a3a2a", color: "#fff",
  padding: "8px 12px",
  fontSize: "9.5px", letterSpacing: "1.5px", textTransform: "uppercase",
  fontWeight: "600", border: "none",
  ...extra,
});
const tdL = { padding: "7px 12px", borderBottom: "1px solid #e2ddd4", color: "#2e2820", textAlign: "left",  background: "#fff" };
const tdR = { padding: "7px 12px", borderBottom: "1px solid #e2ddd4", color: "#2e2820", textAlign: "right", background: "#fff" };
const tdLE = { ...tdL, background: "#f7f5f0" };
const tdRE = { ...tdR, background: "#f7f5f0" };

export const SalarySlipPreview = forwardRef(function SalarySlipPreview({ data, visible }, ref) {
  const totalEarnings =
    (Number(data.basicSalary)     || 0) +
    (Number(data.incentivePay)    || 0) +
    (Number(data.travelAllowance) || 0);
  const totalDeduction = (Number(data.lossOfPay) || 0) + (Number(data.professionalTax) || 0);
  const netSalary      = (Number(data.basicSalary) || 0) - (Number(data.lossOfPay) || 0);

  const payMonthLabel = data.payMonth
    ? new Date(data.payMonth + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })
    : "Month / Year";

  const doj = data.dateOfJoining
    ? new Date(data.dateOfJoining).toLocaleDateString("en-IN")
    : "—";

  return (
    /* Outer wrapper — controls visibility in UI */
    <div
      style={{
        overflow:      visible ? "visible" : "hidden",
        maxHeight:     visible ? "none"    : "0px",
        opacity:       visible ? 1         : 0,
        pointerEvents: visible ? "auto"    : "none",
        transition:    "opacity 0.35s ease, max-height 0.4s ease",
      }}
    >
      {/*
        A4 inner div — exactly 794×1123px (A4 at 96dpi).
        html2canvas captures THIS div at scale:2 → 1588×2246px → maps to A4 perfectly.
        On screen it scales down via transform so it fits the preview card.
      */}
      <div style={{ overflowX: "auto", padding: "16px" }}>
        <div
          ref={ref}
          id="slip-preview"
          style={{
            width: "794px",
            minHeight: "1123px",
            background: "#ffffff",
            padding: "52px 56px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "12px",
            color: "#2e2820",
            // Scale down for screen preview only — does not affect PDF capture
            transformOrigin: "top left",
            transform: "scale(0.72)",
            marginBottom: "-320px", // compensate scale gap
          }}
        >
          {/* ── Company Header ── */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"16px", marginBottom:"8px" }}>
            <div style={{
              width:"58px", height:"58px", borderRadius:"50%",
              border:"2.5px solid #1a3a2a",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontFamily:"'Playfair Display',serif",
              fontSize:"26px", fontWeight:"700", color:"#1a3a2a", flexShrink:0,
            }}>R</div>
            <div>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"23px", fontWeight:"700", letterSpacing:"5px", textTransform:"uppercase", color:"#1a3a2a" }}>
                SKYUP DIGITAL SOLUTIONS
              </div>
              <div style={{ display:"flex", justifyContent:"center", gap:"32px", fontSize:"9px", letterSpacing:"1.5px", textTransform:"uppercase", color:"#5c5248", marginTop:"4px" }}>
                <span><strong style={{color:"#1a3a2a"}}>GST:</strong> 29ABLFRLZU</span>
                <span><strong style={{color:"#1a3a2a"}}>REG:</strong> GDN-F729-2024-25</span>
              </div>
            </div>
          </div>

          <hr style={{ border:"none", borderTop:"1.5px dashed #e2ddd4", margin:"12px 0" }}/>

          <div style={{ textAlign:"center", fontSize:"10px", letterSpacing:"3px", textTransform:"uppercase", color:"#c9a84c", fontWeight:"600", marginBottom:"16px" }}>
            Salary Slip — {payMonthLabel}
          </div>

          {/* ── Employee Info ── */}
          <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:"16px" }}>
            <tbody>
              {[
                ["Employee Name", data.employeeName||"—", "Bank Name",    data.bankName||"—"],
                ["Employee ID",   data.employeeId  ||"—", "Bank A/C No",  data.bankAcNo||"—"],
                ["Designation",   data.designation ||"—", "Total Days in Month",     data.payDays ||"—"],
                ["Department",    data.department  ||"—", "LOP Days",     data.lopDays ||"—"],
                ["Date of Joining", doj,                  "",             ""],
              ].map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={{
                      padding:"6px 10px",
                      border:"1px solid #e2ddd4",
                      background: j % 2 === 0 ? "#f7f5f0" : "#ffffff",
                      fontSize:        j % 2 === 0 ? "9px"     : "11px",
                      letterSpacing:   j % 2 === 0 ? "1px"     : "0",
                      textTransform:   j % 2 === 0 ? "uppercase" : "none",
                      color:           j % 2 === 0 ? "#5c5248" : "#2e2820",
                      fontWeight:      j % 2 === 0 ? "600"     : "500",
                      width:           j % 2 === 0 ? "20%"     : "30%",
                    }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── Earnings & Deductions ── */}
          <table style={{ width:"100%", borderCollapse:"collapse", marginBottom:"14px" }}>
            <thead>
              <tr>
                <th style={th()}>Earnings</th>
                <th style={th({textAlign:"right"})}>Amount (₹)</th>
                <th style={th()}>Deduction</th>
                <th style={th({textAlign:"right"})}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={tdL}>Basic Salary</td>
                <td style={tdR}>{fmt(data.basicSalary)}</td>
                <td style={tdL}>Loss of Pay</td>
                <td style={tdR}>{fmt(data.lossOfPay)}</td>
              </tr>
              <tr>
                <td style={tdLE}>Incentive Pay</td>
                <td style={tdRE}>{fmt(data.incentivePay)}</td>
                <td style={tdLE}>Professional Tax</td>
                <td style={tdRE}>{fmt(data.professionalTax)}</td>
              </tr>
              <tr>
                <td style={tdL}>Travel Allowance</td>
                <td style={tdR}>{fmt(data.travelAllowance)}</td>
                <td style={tdLE}></td>
                <td style={tdRE}></td>
              </tr>
              <tr>
                <td style={{...tdL, background:"#1a3a2a", color:"#fff", fontWeight:"700", borderBottom:"none"}}>Total Earnings</td>
                <td style={{...tdR, background:"#1a3a2a", color:"#fff", fontWeight:"700", borderBottom:"none"}}>₹ {fmt(totalEarnings)}</td>
                <td style={{...tdL, background:"#1a3a2a", color:"#fff", fontWeight:"700", borderBottom:"none"}}>Total Deduction</td>
                <td style={{...tdR, background:"#1a3a2a", color:"#fff", fontWeight:"700", borderBottom:"none"}}>₹ {fmt(totalDeduction)}</td>
              </tr>
              <tr>
                <td colSpan="3" style={{padding:"9px 12px", background:"#c9a84c", color:"#1a3a2a", fontWeight:"700", fontSize:"13px", border:"none"}}>
                  <strong>Net Salary (Total Salary)</strong>
                </td>
                <td style={{padding:"9px 12px", background:"#c9a84c", color:"#1a3a2a", fontWeight:"700", fontSize:"13px", textAlign:"right", border:"none"}}>
                  <strong>₹ {fmt(netSalary)}</strong>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── Footer ── */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginTop:"auto", paddingTop:"16px", borderTop:"1px solid #e2ddd4" }}>
            <div style={{ fontSize:"10.5px", color:"#5c5248", lineHeight:"1.85" }}>
              <strong style={{ display:"block", fontSize:"9px", letterSpacing:"2px", textTransform:"uppercase", color:"#1a3a2a", marginBottom:"3px" }}>
                Company Address
              </strong>
              Parinidhi #23, E Block, 14 A Main Road,<br/>
              2nd Floor, Sahakaranagar, Bangalore – 560092
              <br/><br/>
              <strong style={{ display:"block", fontSize:"9px", letterSpacing:"2px", textTransform:"uppercase", color:"#1a3a2a", marginBottom:"3px" }}>
                Contact
              </strong>
              +91 9741785695 | +91 9663684195<br/>
              contact@skyupdigitalsolutions.com
            </div>
            <div style={{ textAlign:"center" }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"17px", color:"#1a3a2a", marginBottom:"14px", fontStyle:"italic" }}>
                Thank You
              </div>
              <div style={{ width:"130px", borderTop:"1.5px solid #1a3a2a", paddingTop:"6px", fontSize:"9px", letterSpacing:"1.5px", textTransform:"uppercase", color:"#9c9080", textAlign:"center" }}>
                Authorised Signatory
                <div style={{ fontSize:"8px", marginTop:"2px", opacity:".6" }}>For SKYUP DIGITAL SOLUTIONS</div>
              </div>
            </div>
          </div>

        </div>{/* /A4 */}
      </div>
    </div>
  );
});