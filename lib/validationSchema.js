// lib/validationSchema.js
import * as Yup from "yup";

const positiveNum = (label) =>
  Yup.number()
    .typeError(`${label} must be a number`)
    .min(0, `${label} cannot be negative`)
    .required(`${label} is required`);

export const salarySlipSchema = Yup.object({
  // Personal
  employeeName: Yup.string().trim().required("Employee Name is required"),
  employeeId:   Yup.string().trim().required("Employee ID is required"),
  designation:  Yup.string().trim().required("Designation is required"),
  department:   Yup.string().trim().required("Department is required"),
  dateOfJoining: Yup.string().required("Date of Joining is required"),
  payMonth:     Yup.string().required("Pay Month is required"),

  // Bank & Attendance
  bankName:  Yup.string().trim().required("Bank Name is required"),
  bankAcNo:  Yup.string().trim().required("Bank A/C No is required"),
  payDays:   positiveNum("Pay Days"),
  lopDays:   positiveNum("LOP Days"),

  // Earnings
  basicSalary:      positiveNum("Basic Salary"),
  incentivePay:     positiveNum("Incentive Pay"),
  travelAllowance:  positiveNum("Travel Allowance"),

  // Deductions
  lossOfPay: positiveNum("Loss of Pay"),
});

export const initialValues = {
  employeeName: "",
  employeeId: "",
  designation: "",
  department: "",
  dateOfJoining: "",
  payMonth: "",
  bankName: "",
  bankAcNo: "",
  payDays: "",
  lopDays: "",
  basicSalary: "15000",
  incentivePay: "3500",
  travelAllowance: "1500",
  lossOfPay: "500",
};
