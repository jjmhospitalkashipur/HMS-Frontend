"use client";

import { useEffect, useRef } from "react";

interface IPrintPrescriptionProps {
  appointmentData: {
    Case_ID?: string;
    Date_Time?: string;
    Patient?: string;
    Phone?: string;
    Doctor?: string;
    role?: string;
    _department?: string;
    _visitDate?: string;
    _visitTime?: string;
    Visit?: string;
    Appointment_Type?: string;
    UHD_No?: string;
    Guardian_Name?: string;
    Age?: string;
    Sex?: string;
    Address?: string;
    Token_No?: string | number;
    MRD_No?: string;
    OPD_No?: string;
    Amount?: string;
    Organisation_name?: string;
    Valid_Upto?: string;
    Vitals?: {
      HT?: string;
      WT?: string;
      BP?: string;
      PR?: string;
      RBS?: string;
    };
    Chief_Complaints?: string;
    O_E?: string;
    Comorbidities?: {
      DM_HTN_Thyroid?: boolean;
      Smoking_Alcohol_TB?: boolean;
    };
    Menstrual_History?: string;
    Prev_Surgeries?: string;
    Prov_Diagnosis?: string;
    Treatment_Advice?: string;
    Investigation_Advice?: string;
  };
  onClose?: () => void;
}

const PrintPrescription = ({ appointmentData, onClose }: IPrintPrescriptionProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePrint = () => {
      if (printRef.current) {
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Appointment - Patient Details</title>
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body {
                    margin: 0;
                    padding: 20px;
                    font-family: Tahoma, Arial, sans-serif;
                    font-size: 14px;
                    color: #000;
                    background: #fff;
                    line-height: 1.4;
                  }
                  .prescription-container {
                    width: 100%;
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 0;
                    background: #fff;
                  }
                  .letterhead-space { height: 80px; width: 100%; margin-bottom: 20px; }
                  .patient-card {
                    border-radius: 12px;
                    padding: 8px;
                    margin-bottom: 20px;
                  }
                  .patient-info-table {
                    width: 100%;
                    border-collapse: collapse;
                    font-size: 14px;
                    line-height: 1.4;
                    margin: 0;
                  }
                  .patient-info-table td {
                    padding: 6px 8px;
                    border: 1px solid #000;
                    vertical-align: middle;
                    font-size: 13px;
                  }
                  .info-label-cell {
                    background-color: #f8f9fa;
                    font-weight: 600;
                    color: #000;
                    width: 20%;
                    text-align: left;
                    white-space: nowrap;
                  }
                  .info-value-cell {
                    background-color: #ffffff;
                    font-weight: 500;
                    color: #000;
                    width: 30%;
                    text-align: left;
                  }
                  .info-value-cell-full {
                    background-color: #ffffff;
                    font-weight: 500;
                    color: #000;
                    text-align: left;
                  }
                  @media print {
                    @page { margin: 12mm; size: A4; }
                    body { padding: 0; background: white !important; }
                    .patient-info-table td { border: 1px solid #000 !important; font-size: 12px !important; }
                    .patient-info-table { page-break-inside: avoid; }
                  }
                </style>
              </head>
              <body>
                ${printRef.current.innerHTML}
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
            printWindow.close();
            if (onClose) {
              onClose();
            }
          }, 250);
        }
      }
    };

    handlePrint();
  }, [onClose]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateTimeString?: string) => {
    if (!dateTimeString) return "";
    return dateTimeString;
  };

  return (
    <div style={{ display: "none" }}>
      <div ref={printRef} className="prescription-container">
        {/* Letterhead Space */}
        <div className="letterhead-space"></div>

        {/* Patient Details Table - styled like report patient-info-table */}
        <div className="patient-card">
          <table className="patient-info-table">
            <tbody>
              <tr>
                <td className="info-label-cell">MRD No.:</td>
                <td className="info-value-cell">{appointmentData.MRD_No || "—"}</td>
                <td className="info-label-cell">Case ID:</td>
                <td className="info-value-cell">{appointmentData.Case_ID || "—"}</td>
              </tr>
              <tr>
                <td className="info-label-cell">Patient Name:</td>
                <td className="info-value-cell">{appointmentData.Patient || "—"}</td>
                <td className="info-label-cell">Date:</td>
                <td className="info-value-cell">{appointmentData._visitDate || formatDateTime(appointmentData.Date_Time)?.split(" - ")[0] || "—"}</td>
              </tr>
              <tr>
                <td className="info-label-cell">Age / Gender:</td>
                <td className="info-value-cell">
                  {appointmentData.Age != null || appointmentData.Sex
                    ? `${appointmentData.Age ?? "—"} Yrs / ${appointmentData.Sex ?? "—"}`
                    : "—"}
                </td>
                <td className="info-label-cell">Time:</td>
                <td className="info-value-cell">{appointmentData._visitTime || formatDateTime(appointmentData.Date_Time)?.split(" - ")[1] || "—"}</td>
              </tr>
              <tr>
                <td className="info-label-cell">Ref. Consultant:</td>
                <td className="info-value-cell-full" colSpan={3}>
                  {appointmentData.Doctor ? `Dr. ${appointmentData.Doctor.replace(/^Dr\.\s*/i, "")}` : "—"}
                  {appointmentData._department ? ` (${appointmentData._department})` : appointmentData.role ? ` (${appointmentData.role})` : ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PrintPrescription;
