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
    Token_No?: string;
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
                  .patient-details-section {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 0;
                    padding: 12px;
                  }
                  .patient-details-left,
                  .patient-details-middle,
                  .patient-details-right {
                    flex: 1;
                    padding: 0 10px;
                  }
                  .detail-row {
                    display: flex;
                    margin-bottom: 6px;
                    font-size: 11px;
                    align-items: flex-start;
                  }
                  .detail-row:last-child {
                    margin-bottom: 0;
                  }
                  .detail-label {
                    font-weight: bold;
                    width: 120px;
                    text-align: left;
                    padding-right: 5px;
                  }
                  .detail-value {
                    flex: 1;
                    padding-left: 5px;
              
                  }
                  .consultant-qualifications {
                    font-size: 10px;
                    margin-left: 135px;
                    margin-top: -4px;
                    margin-bottom: 6px;
                    color: #333;
                  }
                  .lower-section {
                    display: flex;
                    gap: 20px;
                    margin-top: 15px;
                    padding: 0 10px;
                    align-items: flex-start;
                  }
                  .left-section {
                    flex-shrink: 0;
                  }
                  .right-section {
                    flex: 1;
                  }
                  .patient-details-wrapper {
                    margin-bottom: 0;
                    padding: 0 10px;
                    border-bottom: 1px solid #000;
                  }
                  .vitals-table {
                    width: 200px;
                    border: 1px solid #000;
                    border-collapse: collapse;
                  }
                  .vitals-table th,
                  .vitals-table td {
                    border: 1px solid #000;
                    padding: 6px 8px;
                    text-align: left;
                    font-size: 11px;
                  }
                  .vitals-table th {
                    background-color: #f0f0f0;
                    font-weight: bold;
                  }
                  .vitals-table td {
                    min-height: 25px;
                    height: 25px;
                  }
                  .clinical-section {
                    padding: 0 10px;
                    margin-bottom: 15px;
                  }
                  .section-title {
                    font-weight: bold;
                    font-size: 12px;
                    margin-bottom: 5px;
                    margin-top: 10px;
                  }
                  .section-content {
                    font-size: 11px;
                    margin-bottom: 10px;
                    min-height: 20px;
                    white-space: pre-line;
                  }
                  .comorbidities-list {
                    display: flex;
                    gap: 20px;
                    margin-top: 5px;
                  }
                  .comorbidity-item {
                    font-size: 11px;
                  }
                  .checkbox {
                    display: inline-block;
                    width: 12px;
                    height: 12px;
                    border: 1px solid #000;
                    margin-right: 5px;
                    vertical-align: middle;
                  }
                  .footer-section {
                    margin-top: 30px;
                    padding: 10px;
                    font-size: 9px;
                    border-top: 1px solid #ccc;
                  }
                  .footer-services {
                    margin-bottom: 10px;
                  }
                  .footer-contact {
                    margin-top: 10px;
                  }
                  .footer-disclaimer {
                    margin-top: 10px;
                    font-size: 8px;
                    color: #666;
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

        {/* Patient Details Section */}
        <div className="patient-details-wrapper">
          <div className="patient-details-section">
            <div className="patient-details-left">
              <div className="detail-row">
                <span className="detail-label">UHID No. :</span>
                <span className="detail-value">
                  {appointmentData.UHD_No || appointmentData.Case_ID || "191210"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Patient Name :</span>
                <span className="detail-value">
                  {appointmentData.Patient || "Mr. PRAKHAR AGRAWAL"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Guardian Name :</span>
                <span className="detail-value">
                  {appointmentData.Guardian_Name || "S/O AJAY AGRAWAL"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Consulatant :</span>
                <span className="detail-value">
                  {appointmentData.Doctor || "DR ABHISHEK SARAF"}
                </span>
              </div>
              <div className="consultant-qualifications">
                {appointmentData.role || "MBBS, MS, MCH (PLASTIC SURGERY)"}
              </div>
              <div className="detail-row">
                <span className="detail-label">Amount :</span>
                <span className="detail-value">
                  {appointmentData.Amount || "300.00"}
                </span>
              </div>
            </div>
            <div className="patient-details-middle">
              <div className="detail-row">
                <span className="detail-label">Date :</span>
                <span className="detail-value">
                  {formatDateTime(appointmentData.Date_Time) || "28-Jan-2026 13:46"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Age / Sex :</span>
                <span className="detail-value">
                  {appointmentData.Age || "30"} Years /{" "}
                  {appointmentData.Sex || "Male"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Mobile. No. :</span>
                <span className="detail-value">
                  {appointmentData.Phone || "7895210001"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Address :</span>
                <span className="detail-value">
                  {appointmentData.Address || "KASHIPUR"}
                </span>
              </div>
            </div>
            <div className="patient-details-right">
              <div className="detail-row">
                <span className="detail-label">Token No. :</span>
                <span className="detail-value">
                  {appointmentData.Token_No || "13"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">OPD No. :</span>
                <span className="detail-value">
                  {appointmentData.OPD_No || "67176"}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Valid Upto :</span>
                <span className="detail-value">
                  {appointmentData.Valid_Upto || "01/Feb/2026"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Section - Vitals Table on Left, Clinical Notes on Right */}
        <div className="lower-section">
          <div className="left-section">
            <table className="vitals-table">
              <thead>
                <tr>
                  <th>Vital</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Ht.</td>
                  <td>{appointmentData.Vitals?.HT || ""}</td>
                </tr>
                <tr>
                  <td>Wt.</td>
                  <td>{appointmentData.Vitals?.WT || ""}</td>
                </tr>
                <tr>
                  <td>BP</td>
                  <td>{appointmentData.Vitals?.BP || ""}</td>
                </tr>
                <tr>
                  <td>PR</td>
                  <td>{appointmentData.Vitals?.PR || ""}</td>
                </tr>
                <tr>
                  <td>RBS</td>
                  <td>{appointmentData.Vitals?.RBS || ""}</td>
                </tr>
              </tbody>
            </table>
            <div style={{ marginTop: "15px" }}>
              <div className="section-title">COMORBITIES</div>
              <div style={{ fontSize: "11px", marginTop: "5px" }}>
                <div>DM / HTN / Thyroid</div>
                <div>Smoking / Alcohol / TB</div>
              </div>
            </div>
          </div>
          <div className="right-section">
            <div className="clinical-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div className="section-title">CHIEF COMPLAINTS :</div>
                  
                </div>
                <div style={{ flex: 1, textAlign: "right" }}>
                  <div className="section-title">O/E</div>
                  <div className="section-content">
                    {appointmentData.O_E || ""}
                  </div>
                </div>
              </div>

              <div>
                <div className="section-title">PROV. DIAGNOSIS:</div>
                <div className="section-content">
                  {appointmentData.Prov_Diagnosis || ""}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintPrescription;
