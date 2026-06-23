import axios from "axios";
import { API_BASE_URL } from "@/environment";
import type { IReceiptData, IReceiptTransaction, IPathlabReceiptData, IPathlabTestItem } from "./printReceipt";

export async function enrichIPDDoctorForReceipt(
  ipd: IIpdAppointmentDetail
): Promise<IIpdAppointmentDetail> {
  if (!API_BASE_URL) return ipd;
  if (ipd.doctor?.medicalLicenseNo?.trim()) return ipd;
  const doctorRef = String(ipd.doctor?._id || ipd.doctorId || "").trim();
  if (!doctorRef) return ipd;
  try {
    const res = await axios.get(`${API_BASE_URL}/hospital/doctors/${doctorRef}`);
    const d = res.data?.data?.doctor as
      | {
          _id?: string;
          doctorId?: string;
          name?: string;
          department?: string;
          designation?: string;
          medicalLicenseNo?: string;
        }
      | undefined;
    if (!d) return ipd;
    const cur = ipd.doctor;
    return {
      ...ipd,
      doctor: {
        _id: d._id ?? cur?._id ?? doctorRef,
        doctorId: d.doctorId ?? cur?.doctorId,
        name: cur?.name?.trim() || d.name || "",
        department: cur?.department ?? d.department,
        designation: cur?.designation ?? d.designation,
        medicalLicenseNo: d.medicalLicenseNo ?? cur?.medicalLicenseNo,
      },
    };
  } catch {
    return ipd;
  }
}

export interface IIpdPatient {
  _id: string;
  name?: string;
  title?: string;
  phone?: string;
  email?: string;
  mrd?: string;
  age?: number;
  months?: number;
  days?: number;
  gender?: string;
  bloodGroup?: string;
  address?: string;
}

export interface IIpdDoctor {
  _id: string;
  doctorId?: string;
  name: string;
  department?: string;
  designation?: string;
  medicalLicenseNo?: string;
}

export interface IIpdProcedure {
  procedureId: string;
  procedureName?: string;
  category?: string;
  price?: number;
  units?: number;
  unitPrice?: number;
  isDialysis?: boolean;
  dialysisSessionId?: string;
}

export interface IIpdDoctorVisit {
  doctorId: string;
  doctorName?: string;
  days: number;
  chargePerDay?: number;
  price: number;
}

export interface IIpdTransaction {
  _id: string;
  transactionId: string;
  amount: number;
  paymentMode: string;
  transactionDate: string;
  createdAt: string;
}

export interface IIpdBedSummary {
  _id?: string;
  bedNumber?: string;
  bedCode?: string;
  ward?: { _id?: string; name?: string; chargePerDay?: number };
}

export interface IPathlabCasePatient {
  patientId?: string;
  title?: string;
  firstName?: string;
  lastName?: string;
  age?: number;
  months?: number;
  days?: number;
  gender?: string;
  address?: { line1?: string; [key: string]: unknown };
}

export interface IPathlabCaseDoctor {
  _id?: string;
  doctorId?: string;
  firstName?: string;
  lastName?: string;
}

export interface IPathlabCaseTestEntry {
  _id?: string;
  price?: number;
  test?: {
    _id?: string;
    testId?: string;
    testCode?: string;
    name?: string;
  };
}

export interface IPathlabCaseData {
  _id?: string;
  caseId?: string;
  patientId?: string;
  discountValue?: number;
  finalAmount?: number;
  totalAmount?: number;
  patient?: IPathlabCasePatient;
  doctor?: IPathlabCaseDoctor;
  casetests?: IPathlabCaseTestEntry[];
  transactions?: Array<{ amount?: number }>;
  labcenter?: { name?: string };
  createdAt?: string;
}

export interface IIpdBillingChargeSummary {
  type?: string;
  procedureId?: string;
  procedureName?: string;
  price?: number;
  units?: number;
  totalCharge?: number;
  charge?: number;
  caseId?: string;
  caseReadableId?: string;
  caseData?: IPathlabCaseData;
}

export interface IIpdAppointmentDetail {
  _id: string;
  ipdId: string;
  receiptId?: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  bedId?: string;
  procedures?: IIpdProcedure[];
  doctorVisits?: IIpdDoctorVisit[];
  billingCharges?: IIpdBillingChargeSummary[];
  procedureChargesTotal?: number;
  doctorVisitCharges?: boolean;
  doctorChargesAmount?: number;
  bedChargesTotal?: number;
  nursingChargesTotal?: number;
  subtotal?: number;
  discount?: number;
  totalPrice?: number;
  appointmentDate?: string;
  admissionDate?: string;
  reason?: string;
  status?: string;
  isDischarge?: boolean;
  createdAt?: string;
  updatedAt?: string;
  amountPaid?: number;
  paymentStatus?: string;
  notes?: string;
  mlc?: boolean;
  isMlc?: boolean;
  doctor?: IIpdDoctor;
  patient?: IIpdPatient;
  bed?: IIpdBedSummary;
  bedCharge?: {
    wardId?: string;
    wardName?: string;
    chargePerDay?: number;
    fromDate?: string;
    toDate?: string;
    days?: number;
    totalCharge?: number;
  };
  nursingCharge?: {
    wardId?: string;
    wardName?: string;
    nursingChargePerDay?: number;
    fromDate?: string;
    toDate?: string;
    days?: number;
    totalCharge?: number;
  };
  transactions?: IIpdTransaction[];
}

export const resolveIpdGrossTotal = (ipd: IIpdAppointmentDetail): number => {
  const subtotal = ipd.subtotal;
  const totalPrice = ipd.totalPrice;
  if (subtotal != null && Number.isFinite(Number(subtotal)) && Number(subtotal) > 0) {
    return Number(subtotal);
  }
  if (totalPrice != null && Number.isFinite(Number(totalPrice)) && Number(totalPrice) > 0) {
    return Number(totalPrice);
  }

  const procedureTotal =
    ipd.procedureChargesTotal ??
    (ipd.procedures ?? []).reduce((sum, proc) => sum + (Number(proc.price) || 0), 0);
  const doctorTotal =
    ipd.doctorChargesAmount ??
    (ipd.doctorVisits ?? []).reduce((sum, visit) => sum + (Number(visit.price) || 0), 0);
  const bedTotal =
    ipd.bedChargesTotal ??
    (Number.isFinite(Number(ipd.bedCharge?.totalCharge))
      ? Number(ipd.bedCharge?.totalCharge)
      : 0);
  const nursingTotal =
    ipd.nursingChargesTotal ??
    (Number.isFinite(Number(ipd.nursingCharge?.totalCharge))
      ? Number(ipd.nursingCharge?.totalCharge)
      : 0);

  const computed = procedureTotal + doctorTotal + bedTotal + nursingTotal;
  if (computed > 0) return computed;

  if (subtotal != null && Number.isFinite(Number(subtotal))) return Number(subtotal);
  if (totalPrice != null && Number.isFinite(Number(totalPrice))) return Number(totalPrice);
  return 0;
};

export const buildIPDReceiptData = (
  ipd: IIpdAppointmentDetail,
  dueAmount: number
): IReceiptData => {
  const formatAgeForReceipt = (
    years?: number | null,
    months?: number | null,
    days?: number | null
  ): string | undefined => {
    const y = years != null ? Number(years) : undefined;
    if (y != null && Number.isFinite(y)) {
      if (y === 0) {
        const m = months != null ? Number(months) : 0;
        if (m > 0) return `${m} ${m === 1 ? "Month" : "Months"}`;
        if (days != null) return `${days} ${Number(days) === 1 ? "Day" : "Days"}`;
        return undefined;
      }
      return `${y} ${y === 1 ? "Year" : "Years"}`;
    }

    const m = months != null ? Number(months) : 0;
    if (m > 0) return `${m} ${m === 1 ? "Month" : "Months"}`;
    if (days != null) return `${days} ${Number(days) === 1 ? "Day" : "Days"}`;
    return undefined;
  };

  const charges: IReceiptTransaction[] = [];

  if (ipd.procedures && ipd.procedures.length > 0) {
    ipd.procedures.forEach((proc, index) => {
      const procAmount = proc.price ?? 0;
      if (procAmount > 0) {
        charges.push({
          _id: `${ipd._id}-proc-${index}`,
          transactionId: "",
          transactionType: proc.procedureName || "Procedure",
          amount: procAmount,
          paymentMode: "",
          transactionDate: ipd.appointmentDate || ipd.createdAt || "",
          createdAt: ipd.createdAt ?? "",
        });
      }
    });
  } else {
    const procTotal = ipd.procedureChargesTotal ?? 0;
    if (procTotal > 0) {
      charges.push({
        _id: `${ipd._id}-proc`,
        transactionId: "",
        transactionType: "Procedure Charges",
        amount: procTotal,
        paymentMode: "",
        transactionDate: ipd.appointmentDate || ipd.createdAt || "",
        createdAt: ipd.createdAt ?? "",
      });
    }
  }

  const docTotal = ipd.doctorChargesAmount ?? 0;
  if (docTotal > 0) {
    charges.push({
      _id: `${ipd._id}-doc`,
      transactionId: "",
      transactionType: "Doctor Visit Charges",
      amount: docTotal,
      paymentMode: "",
      transactionDate: ipd.appointmentDate || ipd.createdAt || "",
      createdAt: ipd.createdAt ?? "",
    });
  }

  const bedChargeTotal =
    ipd.bedChargesTotal ??
    (Number.isFinite(Number(ipd.bedCharge?.totalCharge)) ? Number(ipd.bedCharge?.totalCharge) : 0);
  if (bedChargeTotal > 0) {
    const bedChargeDays = Number(ipd.bedCharge?.days ?? 0);
    const bedChargeDayLabel =
      bedChargeDays > 0 ? ` (${bedChargeDays} ${bedChargeDays === 1 ? "day" : "days"})` : "";
    const wardName = ipd.bedCharge?.wardName?.trim();
    charges.push({
      _id: `${ipd._id}-bed`,
      transactionId: "",
      transactionType: wardName
        ? `Bed Charges - ${wardName}${bedChargeDayLabel}`
        : `Bed Charges${bedChargeDayLabel}`,
      amount: bedChargeTotal,
      paymentMode: "",
      transactionDate: ipd.appointmentDate || ipd.createdAt || "",
      createdAt: ipd.createdAt ?? "",
    });
  }

  const nursingChargeTotal =
    ipd.nursingChargesTotal ??
    (Number.isFinite(Number(ipd.nursingCharge?.totalCharge))
      ? Number(ipd.nursingCharge?.totalCharge)
      : 0);
  if (nursingChargeTotal > 0) {
    const nursingChargeDays = Number(ipd.nursingCharge?.days ?? 0);
    const nursingChargeDayLabel =
      nursingChargeDays > 0
        ? ` (${nursingChargeDays} ${nursingChargeDays === 1 ? "day" : "days"})`
        : "";
    const nursingWardName = ipd.nursingCharge?.wardName?.trim();
    charges.push({
      _id: `${ipd._id}-nursing`,
      transactionId: "",
      transactionType: nursingWardName
        ? `Nursing Charges - ${nursingWardName}${nursingChargeDayLabel}`
        : `Nursing Charges${nursingChargeDayLabel}`,
      amount: nursingChargeTotal,
      paymentMode: "",
      transactionDate: ipd.appointmentDate || ipd.createdAt || "",
      createdAt: ipd.createdAt ?? "",
    });
  }

  return {
    printTitle: "IPD Summary",
    visitId: ipd.ipdId,
    appointmentId: ipd.appointmentId,
    visitDate: ipd.appointmentDate,
    visitTime: undefined,
    visitType: "IPD",
    appointmentType: "IPD",
    status: ipd.status,
    patientName: ipd.patient?.name,
    patientTitle: ipd.patient?.title,
    mrd: ipd.patient?.mrd,
    age: formatAgeForReceipt(ipd.patient?.age, ipd.patient?.months, ipd.patient?.days),
    gender: ipd.patient?.gender,
    phone: ipd.patient?.phone,
    address: ipd.patient?.address?.trim() || undefined,
    doctorName: ipd.doctor?.name,
    doctorDepartment: ipd.doctor?.department,
    medicalLicenseNo: ipd.doctor?.medicalLicenseNo,
    receiptId: ipd.receiptId,
    transactions: charges,
    totalAmount: resolveIpdGrossTotal(ipd),
    discount: ipd.discount ?? 0,
    dueAmount,
    paidAmount: ipd.amountPaid ?? 0,
  };
};

export const buildPathlabReceiptsFromIPD = (
  ipd: IIpdAppointmentDetail
): IPathlabReceiptData[] => {
  const billing = ipd.billingCharges ?? [];
  const testCharges = billing.filter((c) => c.type === "test" && c.caseData);

  return testCharges.map((charge, idx) => {
    const caseData = charge.caseData!;
    const patient = caseData.patient;
    const doctor = caseData.doctor;

    const tests: IPathlabTestItem[] = (caseData.casetests ?? []).map((ct, i) => ({
      srNo: i + 1,
      testName: ct.test?.name ?? "",
      price: ct.price ?? 0,
    }));

    const paidAmount = (caseData.transactions ?? []).reduce(
      (sum, t) => sum + (Number(t.amount) || 0),
      0
    );

    const formatPathlabAge = (p?: IPathlabCasePatient): string | undefined => {
      if (!p) return undefined;
      const y = p.age != null ? Number(p.age) : undefined;
      if (y != null && Number.isFinite(y)) {
        if (y === 0) {
          const m = p.months != null ? Number(p.months) : 0;
          if (m > 0) return `${m} ${m === 1 ? "Month" : "Months"}`;
          if (p.days != null) return `${Number(p.days)} ${Number(p.days) === 1 ? "Day" : "Days"}`;
          return undefined;
        }
        return `${y} ${y === 1 ? "Year" : "Years"}`;
      }
      return undefined;
    };

    const referringDoctorName = doctor
      ? [doctor.firstName, doctor.lastName].filter(Boolean).join(" ").trim() || undefined
      : undefined;

    return {
      caseId: caseData.caseId ?? charge.caseReadableId ?? `CASE-${idx}`,
      patientName: patient
        ? [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim() || undefined
        : undefined,
      patientTitle: patient?.title,
      mrd: patient?.patientId,
      age: formatPathlabAge(patient),
      gender: patient?.gender,
      address: patient?.address?.line1?.trim() || undefined,
      referringDoctorName,
      date: caseData.createdAt,
      tests,
      totalAmount: caseData.totalAmount ?? 0,
      discountValue: caseData.discountValue ?? 0,
      finalAmount: caseData.finalAmount ?? 0,
      paidAmount,
    };
  });
};
