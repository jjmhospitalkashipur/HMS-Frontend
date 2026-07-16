"use client";

import { useEffect, useMemo, useRef } from "react";
import dayjs from "dayjs";
import type {
  IFinalDiagnosisRow,
  IMedicineOnDischargeRow,
  TDischargeType,
} from "@/components/pages/clinic-modules/ipd-appointments/ipdDischargeSummaryTypes";
import type { IIpdAppointmentDetail } from "@/components/pages/clinic-modules/appointments/buildIPDReceiptData";
import {
  getDischargeTypeLabel,
  formatDorRequestedByDisplay,
  normalizeDischargeSummaryFromApi,
} from "@/components/pages/clinic-modules/ipd-appointments/ipdDischargeSummaryTypes";

export interface IPrintDischargeSummaryData {
  visitId?: string;
  patientName?: string;
  patientTitle?: string;
  mrd?: string;
  age?: string | number;
  gender?: string;
  address?: string;
  doctorName?: string;
  medicalLicenseNo?: string;
  admissionDate?: string;
  dischargeDate?: string;
  clinicalSummary?: string;
  provisionalDiagnosis?: IFinalDiagnosisRow[];
  finalDiagnosis?: IFinalDiagnosisRow[];
  courseInHospital?: string;
  treatmentGiven?: string;
  conditionOnDischarge?: string;
  dischargeBp?: string;
  dischargePulse?: string;
  dischargeTemp?: string;
  dischargeSpO2?: string;
  allergies?: string;
  medicinesOnDischarge?: IMedicineOnDischargeRow[];
  adviceOnDischarge?: string[];
  followUp?: string;
  dischargeType?: TDischargeType;
  lamaReason?: string;
  dorRequestedBy?: string;
  dorRequestedByType?: string;
  dorRequestedByName?: string;
  dorReason?: string;
  deathDateTime?: string;
  deathCause?: string;
  referHospitalName?: string;
  referReason?: string;
}

interface IPrintDischargeSummaryProps {
  summaryData: IPrintDischargeSummaryData;
  onClose?: () => void;
}

const formatAgeForPrint = (
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

export const buildPrintDischargeSummaryData = (
  ipd: IIpdAppointmentDetail,
  dischargeSummaryRaw: unknown
): IPrintDischargeSummaryData | null => {
  const summary = normalizeDischargeSummaryFromApi(dischargeSummaryRaw);
  if (!summary) return null;

  const adviceLines = summary.adviceOnDischarge?.trim()
    ? [summary.adviceOnDischarge.trim()]
    : [];

  return {
    visitId: ipd.ipdId,
    patientName: ipd.patient?.name,
    patientTitle: ipd.patient?.title,
    mrd: ipd.patient?.mrd,
    age: formatAgeForPrint(ipd.patient?.age, ipd.patient?.months, ipd.patient?.days),
    gender: ipd.patient?.gender,
    address: ipd.patient?.address?.trim() || undefined,
    doctorName: ipd.doctor?.name,
    medicalLicenseNo: ipd.doctor?.medicalLicenseNo,
    admissionDate: ipd.admissionDate ?? ipd.appointmentDate,
    dischargeDate: summary.dischargeDate,
    clinicalSummary: summary.clinicalSummary,
    provisionalDiagnosis: summary.provisionalDiagnosis.filter((d) => d.diagnosisName.trim()),
    finalDiagnosis: summary.finalDiagnosis.filter((d) => d.diagnosisName.trim()),
    courseInHospital: summary.courseInHospital,
    treatmentGiven: summary.treatmentGiven,
    conditionOnDischarge: summary.conditionOnDischarge,
    dischargeBp: summary.dischargeBp,
    dischargePulse: summary.dischargePulse,
    dischargeTemp: summary.dischargeTemp,
    dischargeSpO2: summary.dischargeSpO2,
    allergies: summary.allergies,
    medicinesOnDischarge: summary.medicinesOnDischarge.filter((m) => m.medicineName.trim()),
    adviceOnDischarge: adviceLines,
    followUp: summary.followUp,
    dischargeType: summary.dischargeType,
    lamaReason: summary.lamaReason,
    dorRequestedByType: summary.dorRequestedByType,
    dorRequestedByName: summary.dorRequestedByName,
    dorRequestedBy: formatDorRequestedByDisplay(
      summary.dorRequestedByType,
      summary.dorRequestedByName
    ),
    dorReason: summary.dorReason,
    deathDateTime: summary.deathDateTime,
    deathCause: summary.deathCause,
    referHospitalName: summary.referHospitalName,
    referReason: summary.referReason,
  };
};

const hasText = (value?: string | null): boolean => Boolean(value?.trim());

const formatPrintDate = (value?: string | null) => {
  if (!value?.trim()) return "";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD MMM YYYY") : "";
};

const formatPrintDateTime = (value?: string | null) => {
  if (!value?.trim()) return "";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD MMM YYYY, hh:mm A") : "";
};

const PrintDischargeSummary = ({ summaryData, onClose }: IPrintDischargeSummaryProps) => {
  const printRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const printEffectKey = useMemo(
    () =>
      [
        summaryData.visitId ?? "",
        summaryData.dischargeDate ?? "",
        summaryData.dischargeType ?? "",
        summaryData.clinicalSummary ?? "",
        summaryData.followUp ?? "",
        summaryData.dorReason ?? "",
        summaryData.lamaReason ?? "",
      ].join("|"),
    [
      summaryData.visitId,
      summaryData.dischargeDate,
      summaryData.dischargeType,
      summaryData.clinicalSummary,
      summaryData.followUp,
      summaryData.dorReason,
      summaryData.lamaReason,
    ]
  );

  useEffect(() => {
    let cancelled = false;

    const doPrint = () => {
      if (!printRef.current || cancelled) return;
      const iframe = document.createElement("iframe");
      iframe.setAttribute("title", "Discharge summary print");
      iframe.style.cssText =
        "position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none;";
      document.body.appendChild(iframe);
      const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
      const iframeWin = iframe.contentWindow;
      if (!iframeDoc || !iframeWin) {
        iframe.remove();
        return;
      }
      if (cancelled) return;

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Discharge Summary - ${summaryData.visitId || "IPD"}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body {
                margin: 0;
                padding: 2px 14px;
                font-family: Tahoma, Arial, sans-serif;
                font-size: 16px;
                color: #000;
                background: #fff;
                line-height: 1.4;
              }
              .receipt-container { width: 100%; max-width: 600px; margin: 0 auto; padding: 0 60px; background: #fff; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #000; gap: 12px; }
              .header-left { display: flex; align-items: center; gap: 10px; }
              .header-center { flex: 1; display: flex; align-items: center; justify-content: center; min-height: 54px; }
              .header-center .receipt-title { transform: translateX(18px); }
              .logo-img { width: 54px; height: 54px; object-fit: contain; flex-shrink: 0; }
              .header-info h2 { font-size: 20px; font-weight: bold; margin: 0 0 2px 0; color: #000; }
              .header-info .certification { font-size: 12px; color: #000; margin-top: 2px; }
              .header-right { text-align: right; }
              .header-right .address { font-size: 14px; color: #000; margin-bottom: 4px; line-height: 1.4; }
              .header-right .contact { font-size: 14px; color: #000; line-height: 1.6; }
              .receipt-title {
                text-align: center;
                font-size: 20px;
                font-weight: bold;
                letter-spacing: 0.04em;
                color: #000;
              }
              .content-box { border: none; padding: 8px 12px 0 12px; margin-bottom: 12px; }
              .patient-details-box { margin-bottom: 10px; padding-bottom: 8px; }
              .admission-discharge-dates-row {
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                gap: 8px 24px;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 12px;
              }
              .patient-info-table { width: 100%; border-collapse: collapse; font-size: 15px; table-layout: fixed; }
              .patient-info-table td { border: 1px solid #000; padding: 4px 8px; vertical-align: middle; }
              .info-label-cell { background-color: #f8f9fa; font-weight: 600; white-space: nowrap; width: 18%; }
              .info-value-cell { background-color: #ffffff; font-weight: 500; width: 40%; }
              .info-value-cell-narrow { width: 24%; }
              .section { margin-bottom: 12px; }
              .section-title {
                font-size: 14px;
                font-weight: bold;
                border-bottom: 1px solid #000;
                padding-bottom: 3px;
                margin-bottom: 5px;
              }
              .discharge-type-heading {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 5px;
              }
              .section-body {
                font-size: 15px;
                font-weight: 500;
                white-space: pre-wrap;
                word-break: break-word;
              }
              .data-table { width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 4px; }
              .data-table th, .data-table td { border: 1px solid #000; padding: 4px 8px; text-align: left; vertical-align: top; }
              .data-table th { background-color: #f8f9fa; font-weight: 600; }
              .footer { margin-top: 10px; display: flex; justify-content: space-between; font-size: 11px; color: #000; }
              .signature-block { min-width: 180px; text-align: center; }
              .signature-line {
                border-top: 1px solid #000;
                margin-top: 50px;
                padding-top: 4px;
                font-size: 11px;
                font-weight: 600;
                text-align: center;
              }
              @media print {
                @page { margin: 8mm; size: A4; }
                body { padding: 0; background: white !important; }
              }
            </style>
          </head>
          <body>
            ${printRef.current.innerHTML}
          </body>
        </html>
      `;

      iframeDoc.open();
      iframeDoc.write(html);
      iframeDoc.close();

      const finish = () => {
        if (cancelled) return;
        try {
          iframeWin.focus();
          iframeWin.print();
        } finally {
          window.setTimeout(() => {
            if (cancelled) return;
            iframe.remove();
            onCloseRef.current?.();
          }, 250);
        }
      };

      window.setTimeout(finish, 250);
    };

    doPrint();

    return () => {
      cancelled = true;
    };
  }, [printEffectKey, summaryData.visitId]);

  const patientName =
    [summaryData.patientTitle, summaryData.patientName].filter(Boolean).join(" ").trim() || "—";
  const patientAge =
    summaryData.age != null && String(summaryData.age).trim() !== "" ? String(summaryData.age) : "—";
  const patientGender = summaryData.gender?.trim() || "—";
  const patientAgeGender = patientGender !== "—" ? `${patientAge} / ${patientGender}` : patientAge;
  const patientAddress = summaryData.address?.trim() || "—";
  const rawDoctorName = summaryData.doctorName?.trim() || "";
  const licenseNo = summaryData.medicalLicenseNo?.trim();
  const doctorLineForPrint =
    rawDoctorName !== ""
      ? (() => {
          const withoutDupDr = rawDoctorName.replace(/^Dr\.\s*/i, "").trim();
          const withTitle = `Dr. ${withoutDupDr}`;
          return licenseNo ? `${withTitle} [${licenseNo}]` : withTitle;
        })()
      : "—";
  const admissionDate = formatPrintDate(summaryData.admissionDate) || "—";
  const dischargeDate = formatPrintDate(summaryData.dischargeDate) || "—";
  const dischargeTypeLabel = getDischargeTypeLabel(summaryData.dischargeType);

  const dischargeTypeFields: { label: string; value: string }[] = [];
  if (summaryData.dischargeType === "LAMA" && hasText(summaryData.lamaReason)) {
    dischargeTypeFields.push({ label: "LAMA Reason", value: summaryData.lamaReason!.trim() });
  }
  if (summaryData.dischargeType === "DOR") {
    const requestedByDisplay = formatDorRequestedByDisplay(
      summaryData.dorRequestedByType ?? "",
      summaryData.dorRequestedByName ?? ""
    );
    if (!requestedByDisplay && hasText(summaryData.dorRequestedBy)) {
      dischargeTypeFields.push({
        label: "Requested By",
        value: summaryData.dorRequestedBy!.trim(),
      });
    } else if (requestedByDisplay) {
      dischargeTypeFields.push({
        label: "Requested By",
        value: requestedByDisplay,
      });
    }
    if (hasText(summaryData.dorReason)) {
      dischargeTypeFields.push({ label: "DOR Reason", value: summaryData.dorReason!.trim() });
    }
  }
  if (summaryData.dischargeType === "Death") {
    if (hasText(summaryData.deathDateTime)) {
      dischargeTypeFields.push({
        label: "Death Date & Time",
        value: formatPrintDateTime(summaryData.deathDateTime) || summaryData.deathDateTime!.trim(),
      });
    }
    if (hasText(summaryData.deathCause)) {
      dischargeTypeFields.push({ label: "Cause of Death", value: summaryData.deathCause!.trim() });
    }
  }
  if (summaryData.dischargeType === "Refer") {
    if (hasText(summaryData.referHospitalName)) {
      dischargeTypeFields.push({
        label: "Refer Hospital Name",
        value: summaryData.referHospitalName!.trim(),
      });
    }
    if (hasText(summaryData.referReason)) {
      dischargeTypeFields.push({ label: "Refer Reason", value: summaryData.referReason!.trim() });
    }
  }

  const showDischargeTypeSection =
    summaryData.dischargeType !== "Normal" &&
    (Boolean(dischargeTypeLabel) || dischargeTypeFields.length > 0);

  const provisionalDiagnosis = summaryData.provisionalDiagnosis ?? [];
  const finalDiagnosis = summaryData.finalDiagnosis ?? [];
  const medicines = summaryData.medicinesOnDischarge ?? [];
  const adviceLines =
    summaryData.adviceOnDischarge?.map((a) => a.trim()).filter(Boolean) ?? [];

  const logoUrl =
    typeof window !== "undefined"
      ? new URL(encodeURI("/JJM Logo.png"), window.location.origin).href
      : encodeURI("/JJM Logo.png");

  return (
    <div style={{ display: "none" }}>
      <div ref={printRef} className="receipt-container">
        <div className="header">
          <div className="header-left">
            <img src={logoUrl} alt="JJM Hospital" className="logo-img" />
            <div className="header-info">
              <h2>JJM Hospital</h2>
              <div className="certification">ISO 9001:2000 Certified</div>
            </div>
          </div>
          <div className="header-center">
            <div className="receipt-title">Discharge Summary</div>
          </div>
          <div className="header-right">
            <div className="address">
              Jaspur Rd, opposite Anaj Mandi, Sarverkhera,
              <br />
              Kashipur, Uttarakhand 244713
            </div>
            <div className="contact">Phone: +91 9634844075</div>
          </div>
        </div>

        <div className="content-box">
          <div className="patient-details-box">
            <table className="patient-info-table">
              <tbody>
                <tr>
                  <td className="info-label-cell">MRD No.:</td>
                  <td className="info-value-cell">{summaryData.mrd ?? "—"}</td>
                  <td className="info-label-cell">Case/Rec. No.:</td>
                  <td className="info-value-cell info-value-cell-narrow">{summaryData.visitId ?? "—"}</td>
                </tr>
                <tr>
                  <td className="info-label-cell">Patient Name:</td>
                  <td className="info-value-cell">{patientName}</td>
                  <td className="info-label-cell">Age / Gender:</td>
                  <td className="info-value-cell info-value-cell-narrow">{patientAgeGender}</td>
                </tr>
                <tr>
                  <td className="info-label-cell">Address:</td>
                  <td className="info-value-cell" colSpan={3}>
                    {patientAddress}
                  </td>
                </tr>
                <tr>
                  <td className="info-label-cell">Doctor Name:</td>
                  <td className="info-value-cell" colSpan={3}>
                    {doctorLineForPrint}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="admission-discharge-dates-row">
            <span>Date of Admission: {admissionDate}</span>
            <span>Date of Discharge: {dischargeDate}</span>
          </div>

          {showDischargeTypeSection ? (
            <div className="section">
              <div className="discharge-type-heading">Discharge Reason</div>
              <table className="data-table">
                <tbody>
                  {dischargeTypeLabel ? (
                    <tr>
                      <th style={{ width: "32%" }}>Discharge Type</th>
                      <td>{dischargeTypeLabel}</td>
                    </tr>
                  ) : null}
                  {dischargeTypeFields.map((field) => (
                    <tr key={field.label}>
                      <th style={{ width: "32%" }}>{field.label}</th>
                      <td>{field.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {hasText(summaryData.conditionOnDischarge) ? (
            <div className="section">
              <div className="section-title">Condition on Discharge</div>
              <div className="section-body">{summaryData.conditionOnDischarge!.trim()}</div>
            </div>
          ) : null}

          {hasText(summaryData.dischargeBp) ||
          hasText(summaryData.dischargePulse) ||
          hasText(summaryData.dischargeTemp) ||
          hasText(summaryData.dischargeSpO2) ? (
            <div className="section">
              <div className="section-title">Vitals at Discharge</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>BP</th>
                    <th>Pulse</th>
                    <th>Temp</th>
                    <th>SpO2</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{summaryData.dischargeBp?.trim() ?? "—"}</td>
                    <td>{summaryData.dischargePulse?.trim() ?? "—"}</td>
                    <td>{summaryData.dischargeTemp?.trim() ?? "—"}</td>
                    <td>{summaryData.dischargeSpO2?.trim() ?? "—"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          ) : null}

          {hasText(summaryData.allergies) ? (
            <div className="section">
              <div className="section-title">Allergies</div>
              <div className="section-body">{summaryData.allergies!.trim()}</div>
            </div>
          ) : null}

          {hasText(summaryData.clinicalSummary) ? (
            <div className="section">
              <div className="section-title">Clinical Summary</div>
              <div className="section-body">{summaryData.clinicalSummary!.trim()}</div>
            </div>
          ) : null}

          {provisionalDiagnosis.length > 0 ? (
            <div className="section">
              <div className="section-title">Provisional Diagnosis</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Diagnosis</th>
                  </tr>
                </thead>
                <tbody>
                  {provisionalDiagnosis.map((row, index) => (
                    <tr key={`prov-diag-${index}`}>
                      <td>{row.diagnosisName.trim()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {finalDiagnosis.length > 0 ? (
            <div className="section">
              <div className="section-title">Final Diagnosis</div>
              <table className="data-table">
                <thead>
                  <tr>
                    {/* <th style={{ width: "25%" }}>ICD Code</th> */}
                    <th>Diagnosis</th>
                  </tr>
                </thead>
                <tbody>
                  {finalDiagnosis.map((row, index) => (
                    <tr key={`diag-${index}`}>
                      {/* <td>{row.icdCode.trim()}</td> */}
                      <td>{row.diagnosisName.trim()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {hasText(summaryData.courseInHospital) ? (
            <div className="section">
              <div className="section-title">Course in Hospital</div>
              <div className="section-body">{summaryData.courseInHospital!.trim()}</div>
            </div>
          ) : null}

          {hasText(summaryData.treatmentGiven) ? (
            <div className="section">
              <div className="section-title">Treatment Given</div>
              <div className="section-body">{summaryData.treatmentGiven!.trim()}</div>
            </div>
          ) : null}

          {medicines.length > 0 ? (
            <div className="section">
              <div className="section-title">Medicines on Discharge</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th style={{ width: "18%" }}>Dosage</th>
                    <th style={{ width: "18%" }}>Duration</th>
                    <th style={{ width: "24%" }}>Instructions</th>
                  </tr>
                </thead>
                <tbody>
                  {medicines.map((med, index) => (
                    <tr key={`med-${index}`}>
                      <td>{med.medicineName.trim()}</td>
                      <td>{med.dosage?.trim() ?? ""}</td>
                      <td>{med.duration?.trim() ?? ""}</td>
                      <td>{med.instructions?.trim() ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {adviceLines.length > 0 ? (
            <div className="section">
              <div className="section-title">Advice on Discharge</div>
              <div className="section-body">{adviceLines.join("\n")}</div>
            </div>
          ) : null}

          {hasText(summaryData.followUp) ? (
            <div className="section">
              <div className="section-title">Follow Up</div>
              <div className="section-body">{summaryData.followUp!.trim()}</div>
            </div>
          ) : null}
        </div>

        <div className="footer">
          <div>This is a computer generated discharge summary.</div>
          <div className="signature-block">
            <div className="signature-line">Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintDischargeSummary;
