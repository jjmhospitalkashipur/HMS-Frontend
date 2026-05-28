export interface IFinalDiagnosisRow {
  icdCode: string;
  diagnosisName: string;
}

export interface IMedicineOnDischargeRow {
  medicineName: string;
  duration: string;
  dosage: string;
  instructions?: string;
}

export interface IDischargeSummaryPayload {
  dischargeDate: string;
  clinicalSummary: string;
  provisionalDiagnosis: string;
  finalDiagnosis: IFinalDiagnosisRow[];
  courseInHospital: string;
  treatmentGiven: string;
  conditionOnDischarge: string;
  medicinesOnDischarge: IMedicineOnDischargeRow[];
  adviceOnDischarge: string[];
  followUp: string;
}

export interface IDischargeSummaryFormState
  extends Omit<IDischargeSummaryPayload, "adviceOnDischarge" | "finalDiagnosis" | "medicinesOnDischarge"> {
  finalDiagnosis: IFinalDiagnosisRow[];
  medicinesOnDischarge: IMedicineOnDischargeRow[];
  /** Single textarea in UI; serialized to API string[] on save */
  adviceOnDischarge: string;
}

export const emptyDischargeSummaryForm = (): IDischargeSummaryFormState => ({
  dischargeDate: new Date().toISOString().slice(0, 10),
  clinicalSummary: "",
  provisionalDiagnosis: "",
  finalDiagnosis: [{ icdCode: "", diagnosisName: "" }],
  courseInHospital: "",
  treatmentGiven: "",
  conditionOnDischarge: "",
  medicinesOnDischarge: [
    { medicineName: "", duration: "", dosage: "", instructions: "" },
  ],
  adviceOnDischarge: "",
  followUp: "",
});

export const normalizeDischargeSummaryFromApi = (
  raw: unknown
): IDischargeSummaryFormState | null => {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const nested =
    data.dischargeSummary && typeof data.dischargeSummary === "object"
      ? (data.dischargeSummary as Record<string, unknown>)
      : data;

  const finalDiagnosis = Array.isArray(nested.finalDiagnosis)
    ? (nested.finalDiagnosis as IFinalDiagnosisRow[]).map((d) => ({
        icdCode: String(d?.icdCode ?? ""),
        diagnosisName: String(d?.diagnosisName ?? ""),
      }))
    : [{ icdCode: "", diagnosisName: "" }];

  const medicinesOnDischarge = Array.isArray(nested.medicinesOnDischarge)
    ? (nested.medicinesOnDischarge as IMedicineOnDischargeRow[]).map((m) => ({
        medicineName: String(m?.medicineName ?? ""),
        duration: String(m?.duration ?? ""),
        dosage: String(m?.dosage ?? ""),
        instructions: String(m?.instructions ?? ""),
      }))
    : [{ medicineName: "", duration: "", dosage: "", instructions: "" }];

  const adviceOnDischarge = Array.isArray(nested.adviceOnDischarge)
    ? (nested.adviceOnDischarge as unknown[])
        .map((a) => String(a ?? "").trim())
        .filter(Boolean)
        .join("\n")
    : "";

  return {
    dischargeDate:
      typeof nested.dischargeDate === "string" && nested.dischargeDate
        ? nested.dischargeDate.slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    clinicalSummary: String(nested.clinicalSummary ?? ""),
    provisionalDiagnosis: String(nested.provisionalDiagnosis ?? ""),
    finalDiagnosis: finalDiagnosis.length ? finalDiagnosis : [{ icdCode: "", diagnosisName: "" }],
    courseInHospital: String(nested.courseInHospital ?? ""),
    treatmentGiven: String(nested.treatmentGiven ?? ""),
    conditionOnDischarge: String(nested.conditionOnDischarge ?? ""),
    medicinesOnDischarge: medicinesOnDischarge.length
      ? medicinesOnDischarge
      : [{ medicineName: "", duration: "", dosage: "", instructions: "" }],
    adviceOnDischarge,
    followUp: String(nested.followUp ?? ""),
  };
};

export const buildDischargeSummaryPayload = (
  form: IDischargeSummaryFormState
): IDischargeSummaryPayload => ({
  dischargeDate: form.dischargeDate,
  clinicalSummary: form.clinicalSummary.trim(),
  provisionalDiagnosis: form.provisionalDiagnosis.trim(),
  finalDiagnosis: form.finalDiagnosis
    .map((d) => ({
      icdCode: d.icdCode.trim(),
      diagnosisName: d.diagnosisName.trim(),
    }))
    .filter((d) => d.icdCode || d.diagnosisName),
  courseInHospital: form.courseInHospital.trim(),
  treatmentGiven: form.treatmentGiven.trim(),
  conditionOnDischarge: form.conditionOnDischarge.trim(),
  medicinesOnDischarge: form.medicinesOnDischarge
    .map((m) => ({
      medicineName: m.medicineName.trim(),
      duration: m.duration.trim(),
      dosage: m.dosage.trim(),
      ...(m.instructions?.trim() ? { instructions: m.instructions.trim() } : {}),
    }))
    .filter((m) => m.medicineName),
  adviceOnDischarge: form.adviceOnDischarge.trim()
    ? [form.adviceOnDischarge.trim()]
    : [],
  followUp: form.followUp.trim(),
});
