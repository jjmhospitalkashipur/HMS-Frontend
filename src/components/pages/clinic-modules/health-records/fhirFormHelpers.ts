import dayjs from "dayjs";
import type {
  IFhirDiagnosticReportData,
  IFhirDischargeSummaryData,
  IFhirHealthDocumentRecordData,
  IFhirImmunizationRecordData,
  IFhirMedicationItem,
  IFhirOPConsultationData,
  IFhirPrescriptionData,
  IFhirTestResultItem,
  IFhirVitalSigns,
  IFhirWellnessRecordData,
  TFhirHiType,
} from "@/core/types/fhirHealthRecord";

export const LABEL_CLASS = "form-label mb-1 fw-medium text-dark fs-13";

export const toDateInputValue = (iso?: string): string => {
  if (!iso) return "";
  const d = dayjs(iso);
  return d.isValid() ? d.format("YYYY-MM-DD") : "";
};

export const toDateTimeLocalValue = (iso?: string): string => {
  if (!iso) return "";
  const d = dayjs(iso);
  return d.isValid() ? d.format("YYYY-MM-DDTHH:mm") : "";
};

export const dateInputToIso = (value: string): string => {
  if (!value) return "";
  const d = dayjs(value);
  return d.isValid() ? d.toISOString() : value;
};

export const dateTimeLocalToIso = (value: string): string => {
  if (!value) return "";
  const d = dayjs(value);
  return d.isValid() ? d.toISOString() : value;
};

const emptyMedication = (): IFhirMedicationItem => ({
  medicineName: "",
  dosage: "",
  frequency: "",
  duration: "",
  route: "Oral",
  timing: "",
  quantity: undefined,
});

const emptyVitalSigns = (): IFhirVitalSigns => ({
  bloodPressureSystolic: "",
  bloodPressureDiastolic: "",
  heartRate: "",
  temperature: "",
  respiratoryRate: "",
  oxygenSaturation: "",
  height: "",
  weight: "",
  bmi: "",
});

const emptyTestResult = (): IFhirTestResultItem => ({
  testName: "",
  value: "",
  unit: "",
  referenceRange: "",
  status: "Normal",
  notes: "",
});

export const emptyDischargeSummaryData = (): IFhirDischargeSummaryData => ({
  patientName: "",
  patientAge: "",
  patientGender: "",
  patientMRD: "",
  patientPhone: "",
  patientAddress: "",
  admissionDate: "",
  dischargeDate: "",
  dischargeType: "Normal",
  attendingDoctorName: "",
  wardName: "",
  bedNumber: "",
  chiefComplaints: "",
  presentIllnessHistory: "",
  pastMedicalHistory: "",
  familyHistory: "",
  physicalExamination: "",
  allergies: [],
  provisionalDiagnosis: "",
  finalDiagnosis: [],
  clinicalSummary: "",
  courseInHospital: "",
  treatmentGiven: "",
  conditionOnDischarge: "",
  investigations: [],
  proceduresPerformed: [],
  medicinesOnDischarge: [],
  adviceOnDischarge: [],
  followUpDate: "",
  followUpInstructions: "",
});

export const emptyOPConsultationData = (): IFhirOPConsultationData => ({
  patientName: "",
  patientAge: "",
  patientGender: "",
  patientMRD: "",
  patientPhone: "",
  visitDate: "",
  visitType: "OPD",
  attendingDoctorName: "",
  chiefComplaints: "",
  presentIllnessHistory: "",
  pastHistory: "",
  familyHistory: "",
  physicalExamination: "",
  allergies: [],
  provisionalDiagnosis: "",
  finalDiagnosis: [],
  investigationsAdvised: [],
  medications: [],
  advice: [],
  followUpDate: "",
  followUpInstructions: "",
});

export const emptyPrescriptionData = (): IFhirPrescriptionData => ({
  patientName: "",
  patientAge: "",
  patientGender: "",
  patientMRD: "",
  prescribedDate: "",
  attendingDoctorName: "",
  diagnosis: "",
  validityDays: 30,
  medications: [emptyMedication()],
  advice: [],
  followUpDate: "",
});

export const emptyDiagnosticReportData = (): IFhirDiagnosticReportData => ({
  patientName: "",
  patientAge: "",
  patientGender: "",
  patientMRD: "",
  reportType: "Laboratory",
  reportDate: "",
  attendingDoctorName: "",
  specimenType: "",
  specimenCollectedAt: "",
  testResults: [emptyTestResult()],
  clinicalInterpretation: "",
  conclusion: "",
  recommendations: [],
});

export const emptyImmunizationRecordData = (): IFhirImmunizationRecordData => ({
  patientName: "",
  patientAge: "",
  patientGender: "",
  patientMRD: "",
  vaccineName: "",
  vaccineCode: "",
  manufacturer: "",
  lotNumber: "",
  expirationDate: "",
  administeredDate: "",
  administeredBy: "",
  site: "",
  route: "Intramuscular",
  doseNumber: "",
  seriesName: "",
  nextDueDate: "",
  reactions: "",
});

export const emptyHealthDocumentRecordData = (): IFhirHealthDocumentRecordData => ({
  patientName: "",
  patientAge: "",
  patientGender: "",
  patientMRD: "",
  documentType: "",
  documentTitle: "",
  documentDate: "",
  issuedBy: "",
  description: "",
  notes: "",
});

export const emptyWellnessRecordData = (): IFhirWellnessRecordData => ({
  patientName: "",
  patientAge: "",
  patientGender: "",
  patientMRD: "",
  checkupDate: "",
  checkupType: "",
  attendingDoctorName: "",
  vitalSigns: emptyVitalSigns(),
  generalExamination: "",
  systemicExamination: "",
  smokingStatus: "",
  alcoholConsumption: "",
  exerciseFrequency: "",
  healthStatus: "",
  recommendations: [],
  observations: "",
});

export const getEmptyFormDataForHiType = (hiType: TFhirHiType): Record<string, unknown> => {
  switch (hiType) {
    case "DischargeSummary":
      return emptyDischargeSummaryData() as unknown as Record<string, unknown>;
    case "OPConsultation":
      return emptyOPConsultationData() as unknown as Record<string, unknown>;
    case "Prescription":
      return emptyPrescriptionData() as unknown as Record<string, unknown>;
    case "DiagnosticReport":
      return emptyDiagnosticReportData() as unknown as Record<string, unknown>;
    case "ImmunizationRecord":
      return emptyImmunizationRecordData() as unknown as Record<string, unknown>;
    case "HealthDocumentRecord":
      return emptyHealthDocumentRecordData() as unknown as Record<string, unknown>;
    case "WellnessRecord":
      return emptyWellnessRecordData() as unknown as Record<string, unknown>;
    default:
      return {};
  }
};

const coerceStringArray = (val: unknown): string[] => {
  if (Array.isArray(val)) return val.map(String);
  if (typeof val === "string" && val.trim()) return [val];
  return [];
};

const coerceNumberOrEmpty = (val: unknown): number | "" => {
  if (val === "" || val == null) return "";
  const n = Number(val);
  return Number.isFinite(n) ? n : "";
};

export const mergePrefillIntoFormData = (
  hiType: TFhirHiType,
  base: Record<string, unknown>,
  prefill: Record<string, unknown>
): Record<string, unknown> => {
  const merged = { ...base, ...prefill };

  if (hiType === "WellnessRecord" && prefill.vitalSigns && typeof prefill.vitalSigns === "object") {
    merged.vitalSigns = {
      ...(base.vitalSigns as object),
      ...(prefill.vitalSigns as object),
    };
  }

  const arrayFields: Partial<Record<TFhirHiType, string[]>> = {
    DischargeSummary: ["allergies", "proceduresPerformed", "adviceOnDischarge"],
    OPConsultation: ["allergies", "advice"],
    Prescription: ["advice"],
    DiagnosticReport: ["recommendations"],
    WellnessRecord: ["recommendations"],
  };

  arrayFields[hiType]?.forEach((key) => {
    if (prefill[key] != null) merged[key] = coerceStringArray(prefill[key]);
  });

  if (prefill.patientAge != null) merged.patientAge = coerceNumberOrEmpty(prefill.patientAge);
  if (prefill.validityDays != null) merged.validityDays = coerceNumberOrEmpty(prefill.validityDays);
  if (prefill.doseNumber != null) merged.doseNumber = coerceNumberOrEmpty(prefill.doseNumber);

  return merged;
};

export const serializeFormDataForApi = (
  hiType: TFhirHiType,
  formData: Record<string, unknown>
): Record<string, unknown> => {
  const data = { ...formData };

  const dateFields: Partial<Record<TFhirHiType, string[]>> = {
    DischargeSummary: ["admissionDate", "dischargeDate", "followUpDate"],
    OPConsultation: ["visitDate", "followUpDate"],
    Prescription: ["prescribedDate", "followUpDate"],
    DiagnosticReport: ["reportDate", "specimenCollectedAt"],
    ImmunizationRecord: ["expirationDate", "administeredDate", "nextDueDate"],
    HealthDocumentRecord: ["documentDate"],
    WellnessRecord: ["checkupDate"],
  };

  dateFields[hiType]?.forEach((key) => {
    const val = data[key];
    if (typeof val === "string" && val) {
      data[key] = val.includes("T") ? dateTimeLocalToIso(val) : dateInputToIso(val);
    }
  });

  if (hiType === "DischargeSummary" && Array.isArray(data.investigations)) {
    data.investigations = (data.investigations as { date?: string }[]).map((inv) => ({
      ...inv,
      date: inv.date ? dateInputToIso(inv.date) : inv.date,
    }));
  }

  if (data.patientAge === "") delete data.patientAge;
  if (data.validityDays === "") delete data.validityDays;
  if (data.doseNumber === "") delete data.doseNumber;

  if (hiType === "WellnessRecord" && data.vitalSigns && typeof data.vitalSigns === "object") {
    const vs = { ...(data.vitalSigns as Record<string, unknown>) };
    Object.keys(vs).forEach((k) => {
      if (vs[k] === "") delete vs[k];
    });
    data.vitalSigns = vs;
  }

  return data;
};

export { emptyMedication, emptyTestResult, emptyVitalSigns };
