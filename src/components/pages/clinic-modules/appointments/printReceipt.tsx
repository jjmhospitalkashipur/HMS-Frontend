"use client";

import { useEffect, useRef } from "react";
import dayjs from "dayjs";

export interface IReceiptTransaction {
  _id: string;
  transactionId: string;
  transactionType?: string;
  amount: number;
  paymentMode: string;
  referenceNo?: string;
  transactionDate: string;
  createdAt?: string;
}

export interface IReceiptData {
  visitId?: string;
  appointmentId?: string;
  visitDate?: string;
  visitTime?: string;
  tokenNumber?: number;
  visitType?: string;
  appointmentType?: string;
  status?: string;
  patientName?: string;
  patientTitle?: string;
  mrd?: string;
  age?: string | number;
  gender?: string;
  phone?: string;
  address?: string;
  doctorId?: string;
  doctorName?: string;
  doctorDepartment?: string;
  receiptId?: string;
  transactions?: IReceiptTransaction[];
  totalAmount?: number;
  discount?: number;
  dueAmount?: number;
  paidAmount?: number;
}

interface IPrintReceiptProps {
  receiptData: IReceiptData;
  onClose?: () => void;
}

const PrintReceipt = ({ receiptData, onClose }: IPrintReceiptProps) => {
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const doPrint = () => {
      if (!printRef.current) return;
      const printWindow = window.open("", "_blank");
      if (!printWindow) return;
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Receipt - ${receiptData.visitId || "Visit"}</title>
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
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 2px solid #000; }
              .header-left { display: flex; align-items: center; gap: 10px; }
              .logo-img { width: 54px; height: 54px; object-fit: contain; flex-shrink: 0; }
              .header-info h2 { font-size: 20px; font-weight: bold; margin: 0 0 2px 0; color: #000; }
              .header-info .certification { font-size: 12px; color: #000; margin-top: 2px; }
              .header-right { text-align: right; }
              .header-right .address { font-size: 14px; color: #000; margin-bottom: 4px; line-height: 1.4; }
              .header-right .contact { font-size: 14px; color: #000; line-height: 1.6; }
              .content-box { border: none; padding: 8px 12px 0 12px; margin-bottom: 12px; }
              .patient-details-box { margin-bottom: 10px; padding-bottom: 8px; }
              .patient-info-table { width: 100%; border-collapse: collapse; font-size: 15px; table-layout: fixed; }
              .patient-info-table td { border: 1px solid #000; padding: 4px 8px; vertical-align: middle; }
              .info-label-cell { background-color: #f8f9fa; font-weight: 600; white-space: nowrap; width: 18%; }
              .info-value-cell { background-color: #ffffff; font-weight: 500; width: 40%; }
              .info-value-cell-narrow { width: 24%; }
              .transactions-section { margin-bottom: 0; }
              .transaction-header { display: flex; padding: 8px 0; border-bottom: 2px solid #000; font-weight: bold; font-size: 15px; }
              .transaction-header .col-type { width: 75%; }
              .transaction-header .col-rate { width: 25%; text-align: right; }
              .transaction-row { display: flex; padding: 8px 0; border-bottom: 1px solid #000; font-size: 15px; font-weight: 600; }
              .transaction-row .col-type { width: 75%; }
              .transaction-row .col-rate { width: 25%; text-align: right; }
              .summary-section { margin-top: 10px; }
              .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 16px; font-weight: 600; border-bottom: 1px solid #000; }
              .summary-row.total-paid { font-weight: bold; border-bottom: none; margin-top: 0; padding-bottom: 8px; }
              .footer { margin-top: 10px; display: flex; justify-content: space-between; font-size: 11px; color: #000; }
              .signature-block {
                min-width: 180px;
                text-align: center;
              }
              .signature-line {
                border-top: 1px solid #000;
                margin-top: 50px;
                padding-top: 4px;
                font-size: 11px;
                font-weight: 600;
                text-align: center;
              }
              .payment-no-data { text-align: center; padding: 24px; color: #000; font-size: 14px; border: 1px solid #000; }
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
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
        onClose?.();
      }, 250);
    };
    doPrint();
  }, [receiptData, onClose]);

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "—";
    const parts = timeStr.split(":");
    const h = parseInt(parts[0], 10);
    const m = parts[1] || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${m} ${ampm}`;
  };

  const patientName = [receiptData.patientTitle, receiptData.patientName].filter(Boolean).join(" ").trim() || "—";
  const patientAge = receiptData.age != null && String(receiptData.age).trim() !== "" ? String(receiptData.age) : "—";
  const patientAddress = receiptData.address?.trim() || "—";
  const doctorId = receiptData.doctorId?.trim() || "—";
  const doctorName = receiptData.doctorName?.trim() || "—";
  const doctorDisplay = receiptData.doctorName
    ? `Dr. ${receiptData.doctorName.replace(/^Dr\.\s*/i, "")}${receiptData.doctorDepartment ? ` (${receiptData.doctorDepartment})` : ""}`
    : "—";
  const visitDate = receiptData.visitDate ? dayjs(receiptData.visitDate).format("DD MMM YYYY") : "—";
  const visitTime = receiptData.visitTime ? formatTime(receiptData.visitTime) : "—";
  const transactions = receiptData.transactions ?? [];
  // Treat totalAmount as the gross/subtotal before discount when provided
  const totalAmount =
    receiptData.totalAmount ??
    transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const discount = receiptData.discount ?? 0;
  const finalAmount = totalAmount - discount;
  const totalPaid =
    receiptData.paidAmount != null
      ? Number(receiptData.paidAmount) || 0
      : transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Use absolute URL for logo so it renders in print window
  const logoUrl = typeof window !== "undefined"
    ? `${window.location.origin}/JJM Logo.png`
    : "/JJM Logo.png";

  return (
    <div style={{ display: "none" }}>
      <div ref={printRef} className="receipt-container">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <img src={logoUrl} alt="JJM Hospital" className="logo-img" />
            <div className="header-info">
              <h2>JJM Hospital</h2>
              <div className="certification">ISO 9001:2000 Certified</div>
            </div>
          </div>
          <div className="header-right">
            <div className="address">
              Jaspur Rd, opposite Anaj Mandi, Sarverkhera,<br />
              Kashipur, Uttarakhand 244713
            </div>
            <div className="contact">
              Phone: +91 9634844075<br />
            </div>
          </div>
        </div>

        {/* Content Box */}
        <div className="content-box">
          {/* Patient Details */}
          <div className="patient-details-box">
            <table className="patient-info-table">
              <tbody>
                <tr>
                  <td className="info-label-cell">MRD No.:</td>
                  <td className="info-value-cell">{receiptData.mrd ?? "—"}</td>
                  <td className="info-label-cell">Date:</td>
                  <td className="info-value-cell info-value-cell-narrow">{visitDate}</td>
                </tr>
                <tr>
                  <td className="info-label-cell">Patient Name:</td>
                  <td className="info-value-cell">{patientName}</td>
                  <td className="info-label-cell">Case ID:</td>
                  <td className="info-value-cell info-value-cell-narrow">{receiptData.visitId ?? "—"}</td>
                </tr>
                <tr>
                  <td className="info-label-cell">Address:</td>
                  <td className="info-value-cell">{patientAddress}</td>
                  <td className="info-label-cell">Patient Age:</td>
                  <td className="info-value-cell info-value-cell-narrow">{patientAge}</td>
                </tr>
                <tr>
                  <td className="info-label-cell">Receipt ID:</td>
                  <td className="info-value-cell">{receiptData.receiptId ?? "—"}</td>
                  <td className="info-label-cell">Doctor ID:</td>
                  <td className="info-value-cell info-value-cell-narrow">{doctorId}</td>
                </tr>
                <tr>
                  <td className="info-label-cell">Doctor Name:</td>
                  <td className="info-value-cell" colSpan={3}>
                    {doctorName}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Transactions Section */}
          <div className="transactions-section">
            <div className="transaction-header">
              <div className="col-type">Type</div>
              <div className="col-rate">Amount</div>
            </div>
            {transactions.length === 0 ? (
              <div className="payment-no-data">No Entries Found</div>
            ) : (
              transactions.map((txn, index) => (
                <div key={txn._id} className="transaction-row">
                  <div className="col-type">
                    {txn.transactionType
                      ? txn.transactionType
                      : `${receiptData.appointmentType ?? "—"}${
                          receiptData.visitType ? ` (${receiptData.visitType})` : ""
                        }`}
                  </div>
                  <div className="col-rate">₹{typeof txn.amount === "number" ? txn.amount.toFixed(2) : "0.00"}</div>
                </div>
              ))
            )}
          </div>

          {/* Summary Section */}
          <div className="summary-section">
            <div className="summary-row">
              <span>Total:</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <>
                <div className="summary-row">
                  <span>Discount:</span>
                  <span>₹{discount.toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Final Amount:</span>
                  <span>₹{finalAmount.toFixed(2)}</span>
                </div>
              </>
            )}
            <div className="summary-row total-paid">
              <span> Paid Amount:</span>
              <span>₹{totalPaid.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <div>This is a computer generated receipt.</div>
          <div className="signature-block">
            <div className="signature-line">Signature</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintReceipt;
