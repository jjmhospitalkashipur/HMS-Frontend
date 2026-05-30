"use client";

import { useEffect, useMemo, useRef } from "react";
import dayjs from "dayjs";
import type {
  IFinalDiagnosisRow,
  IMedicineOnDischargeRow,
} from "@/components/pages/clinic-modules/ipd-appointments/ipdDischargeSummaryTypes";
import type { IIpdAppointmentDetail } from "@/components/pages/clinic-modules/appointments/buildIPDReceiptData";
import {
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
  provisionalDiagnosis?: string;
  finalDiagnosis?: IFinalDiagnosisRow[];
  courseInHospital?: string;
  treatmentGiven?: string;
  conditionOnDischarge?: string;
  medicinesOnDischarge?: IMedicineOnDischargeRow[];
  adviceOnDischarge?: string[];
  followUp?: string;
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
    provisionalDiagnosis: summary.provisionalDiagnosis,
    finalDiagnosis: summary.finalDiagnosis.filter((d) => d.icdCode.trim() || d.diagnosisName.trim()),
    courseInHospital: summary.courseInHospital,
    treatmentGiven: summary.treatmentGiven,
    conditionOnDischarge: summary.conditionOnDischarge,
    medicinesOnDischarge: summary.medicinesOnDischarge.filter((m) => m.medicineName.trim()),
    adviceOnDischarge: adviceLines,
    followUp: summary.followUp,
  };
};

const displayText = (value?: string | null) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "—";
};

const formatPrintDate = (value?: string | null) => {
  if (!value?.trim()) return "—";
  const parsed = dayjs(value);
  return parsed.isValid() ? parsed.format("DD MMM YYYY") : "—";
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
        summaryData.clinicalSummary ?? "",
        summaryData.followUp ?? "",
      ].join("|"),
    [
      summaryData.visitId,
      summaryData.dischargeDate,
      summaryData.clinicalSummary,
      summaryData.followUp,
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
              .discharge-date-row {
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
                @page { margin: 8mm 10mm 10mm 10mm; size: A4; }
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
  const visitDate = formatPrintDate(summaryData.admissionDate);
  const dischargeDateLabel = formatPrintDate(summaryData.dischargeDate);

  const finalDiagnosis = summaryData.finalDiagnosis ?? [];
  const medicines = summaryData.medicinesOnDischarge ?? [];
  const adviceText =
    summaryData.adviceOnDischarge?.map((a) => a.trim()).filter(Boolean).join("\n") || "—";

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
                  <td className="info-label-cell">Date:</td>
                  <td className="info-value-cell info-value-cell-narrow">{visitDate}</td>
                </tr>
                <tr>
                  <td className="info-label-cell">Patient Name:</td>
                  <td className="info-value-cell">{patientName}</td>
                  <td className="info-label-cell">Case/Rec. No.:</td>
                  <td className="info-value-cell info-value-cell-narrow">{summaryData.visitId ?? "—"}</td>
                </tr>
                <tr>
                  <td className="info-label-cell">Address:</td>
                  <td className="info-value-cell">{patientAddress}</td>
                  <td className="info-label-cell">Age / Gender:</td>
                  <td className="info-value-cell info-value-cell-narrow">{patientAgeGender}</td>
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

          <div className="discharge-date-row">
            Date of Discharge: {dischargeDateLabel}
          </div>

          {summaryData.conditionOnDischarge?.trim() ? (
            <div className="section">
              <div className="section-title">Condition on Discharge</div>
              <div className="section-body">{displayText(summaryData.conditionOnDischarge)}</div>
            </div>
          ) : null}

          <div className="section">
            <div className="section-title">Clinical Summary</div>
            <div className="section-body">{displayText(summaryData.clinicalSummary)}</div>
          </div>

          <div className="section">
            <div className="section-title">Provisional Diagnosis</div>
            <div className="section-body">{displayText(summaryData.provisionalDiagnosis)}</div>
          </div>

          <div className="section">
            <div className="section-title">Final Diagnosis</div>
            {finalDiagnosis.length > 0 ? (
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: "25%" }}>ICD Code</th>
                    <th>Diagnosis</th>
                  </tr>
                </thead>
                <tbody>
                  {finalDiagnosis.map((row, index) => (
                    <tr key={`diag-${index}`}>
                      <td>{displayText(row.icdCode)}</td>
                      <td>{displayText(row.diagnosisName)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="section-body">—</div>
            )}
          </div>

          <div className="section">
            <div className="section-title">Course in Hospital</div>
            <div className="section-body">{displayText(summaryData.courseInHospital)}</div>
          </div>

          <div className="section">
            <div className="section-title">Treatment Given</div>
            <div className="section-body">{displayText(summaryData.treatmentGiven)}</div>
          </div>

          <div className="section">
            <div className="section-title">Medicines on Discharge</div>
            {medicines.length > 0 ? (
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
                      <td>{displayText(med.medicineName)}</td>
                      <td>{displayText(med.dosage)}</td>
                      <td>{displayText(med.duration)}</td>
                      <td>{displayText(med.instructions)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="section-body">—</div>
            )}
          </div>

          <div className="section">
            <div className="section-title">Advice on Discharge</div>
            <div className="section-body">{adviceText}</div>
          </div>

          <div className="section">
            <div className="section-title">Follow Up</div>
            <div className="section-body">{displayText(summaryData.followUp)}</div>
          </div>
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
