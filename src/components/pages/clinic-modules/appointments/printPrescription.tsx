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
    UHD_No?: string;
    Guardian_Name?: string;
    Age?: string;
    Sex?: string;
    Address?: string;
    Token_No?: string | number;
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
                <title>Prescription</title>
                <style>
                  @media print {
                    @page {
                      margin: 0;
                      size: A4;
                    }
                    body {
                      margin: 0;
                      padding: 0;
                      font-family: Arial, sans-serif;
                      font-size: 12px;
                      color: #000;
                    }
                  }
                  body {
                    margin: 0;
                    padding: 0;
                    font-family: Arial, sans-serif;
                    font-size: 12px;
                    color: #000;
                    background: white;
                  }
                  .prescription-container {
                    width: 100%;
                    max-width: 210mm;
                    margin: 0 auto;
                    padding: 0;
                    background: white;
                  }
                  .letterhead-space {
                    height: 100px;
                    width: 100%;
                    margin-bottom: 20px;
                  }
                  .patient-details-wrapper {
                    padding: 0 20px;
                    margin-bottom: 20px;
                  }
                  .patient-details-table {
                    width: 100%;
                    border-collapse: collapse;
                  }
                  .patient-details-table td {
                    border: 1px solid #000;
                    padding: 8px 12px;
                    font-size: 11px;
                  }
                  .patient-details-table tr:nth-child(even) {
                    background-color: #f5f5f5;
                  }
                  .patient-details-table tr:nth-child(odd) {
                    background-color: #fff;
                  }
                  .table-label {
                    font-weight: bold;
                    width: 25%;
                  }
                  .table-value {
                    width: 25%;
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

        {/* Patient Details Table */}
        <div className="patient-details-wrapper">
          <table className="patient-details-table">
          <tbody>
            <tr>
              <td className="table-label">Token No.:</td>
              <td className="table-value">{appointmentData.Token_No?.toString() || "13"}</td>
              <td className="table-label">Date:</td>
              <td className="table-value">{formatDateTime(appointmentData.Date_Time) || "04 Feb 2026"}</td>
            </tr>
            <tr>
              <td className="table-label">Patient Name:</td>
              <td className="table-value">{appointmentData.Patient || "Mrs. PRABHA WATI TIWARI"}</td>
              <td className="table-label">Case ID:</td>
              <td className="table-value">{appointmentData.Case_ID || "DGL1428"}</td>
            </tr>
            <tr>
              <td className="table-label">Age / Gender:</td>
              <td className="table-value">
                {appointmentData.Age || "70"} Yrs / {appointmentData.Sex ? appointmentData.Sex.toUpperCase() : "FEMALE"}
              </td>
              <td className="table-label">Phone No.:</td>
              <td className="table-value">{appointmentData.Phone || "N/A"}</td>
            </tr>
            <tr>
              <td className="table-label">Organization:</td>
              <td className="table-value">{appointmentData.Organisation_name || ""}</td>
              <td className="table-label">Ref. Consultant:</td>
              <td className="table-value">
                {appointmentData.Doctor || "Dr. ABHISHEK GOEL"} {appointmentData.role ? `M.D. D.M. (${appointmentData.role})` : "M.D. D.M. (NEPHROLOGY)"}
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
