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
  doctorName?: string;
  doctorDesignation?: string;
  transactions?: IReceiptTransaction[];
  totalAmount?: number;
  discount?: number;
  dueAmount?: number;
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
                padding: 20px;
                font-family: Tahoma, Arial, sans-serif;
                font-size: 14px;
                color: #000;
                background: #fff;
                line-height: 1.4;
              }
              .receipt-container { width: 100%; max-width: 900px; margin: 0 auto; padding: 0; background: #fff; }
              .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid #000; }
              .header-left { display: flex; align-items: flex-start; gap: 12px; }
              .logo-placeholder { width: 50px; height: 50px; background-color: #0066cc; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px; flex-shrink: 0; border: 2px solid #0066cc; }
              .header-info h2 { font-size: 20px; font-weight: bold; margin: 0 0 4px 0; color: #000; }
              .header-info .subtitle { font-size: 14px; font-weight: normal; color: #000; margin: 0; }
              .header-info .certification { font-size: 12px; color: #000; margin-top: 4px; }
              .header-right { text-align: right; }
              .header-right .address { font-size: 13px; color: #000; margin-bottom: 6px; line-height: 1.4; }
              .header-right .contact { font-size: 13px; color: #000; line-height: 1.6; }
              .content-box { border: 1px solid #000; padding: 12px; margin-bottom: 25px; }
              .patient-details-box { margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #ccc; }
              .patient-row { display: flex; padding: 3px 0; }
              .patient-label { font-weight: 600; color: #000; padding-right: 8px; }
              .patient-value { font-weight: 500; color: #000; flex: 1; }
              .patient-pair { display: flex; width: 50%; }
              .patient-pair:first-child { padding-right: 15px; }
              .patient-pair:last-child { padding-left: 15px; }
              .patient-row-full { display: flex; }
              .patient-row-full .patient-label { width: auto; min-width: 140px; }
              .patient-row-full .patient-value-full { flex: 1; }
              .transactions-section { margin-bottom: 0; }
              .summary-section { padding-bottom: 15px; }
              .transaction-header { display: flex; padding: 10px 0; border-bottom: 2px solid #000; font-weight: bold; font-size: 13px; }
              .transaction-header .col-code { width: 15%; }
              .transaction-header .col-transactions { width: 60%; }
              .transaction-header .col-rate { width: 25%; text-align: right; }
              .transaction-row { display: flex; padding: 10px 0; border-bottom: 1px solid #000; font-size: 13px; }
              .transaction-row .col-code { width: 15%; }
              .transaction-row .col-transactions { width: 60%; }
              .transaction-row .col-rate { width: 25%; text-align: right; }
              .summary-section { margin-top: 20px; }
              .summary-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; border-bottom: 1px solid #000; }
              .summary-row.total-paid { font-weight: bold; border-bottom: 2px solid #000; padding-top: 10px; padding-bottom: 10px; margin-top: 6px; }
              .footer { margin-top: 30px; display: flex; justify-content: space-between; font-size: 11px; color: #000; }
              .payment-no-data { text-align: center; padding: 24px; color: #000; font-size: 14px; border: 1px solid #000; }
              @media print {
                @page { margin: 12mm; size: A4; }
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
  const ageGender = receiptData.age != null || receiptData.gender
    ? `${receiptData.age ?? "—"} Yrs / ${receiptData.gender ?? "—"}`
    : "—";
  const doctorDisplay = receiptData.doctorName
    ? `Dr. ${receiptData.doctorName.replace(/^Dr\.\s*/i, "")}${receiptData.doctorDesignation ? ` (${receiptData.doctorDesignation})` : ""}`
    : "—";
  const dateTime = receiptData.visitDate && receiptData.visitTime
    ? `${dayjs(receiptData.visitDate).format("DD MMM YYYY")} - ${formatTime(receiptData.visitTime)}`
    : receiptData.visitDate
      ? dayjs(receiptData.visitDate).format("DD MMM YYYY")
      : "—";
  const transactions = receiptData.transactions ?? [];
  const totalAmount = receiptData.totalAmount ?? transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
  const discount = receiptData.discount ?? 0;
  const finalAmount = totalAmount - discount;
  const totalPaid = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div style={{ display: "none" }}>
      <div ref={printRef} className="receipt-container">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <div className="logo-placeholder">JJM</div>
            <div className="header-info">
              <h2>JJM Hospital</h2>
              <div className="certification">ISO 9001:2000 Certified</div>
            </div>
          </div>
          <div className="header-right">
            <div className="address">
              Ramnagar Road, Kashipur, Uttarakhand, India<br />
              - 244713
            </div>
            <div className="contact">
              Phone: +91 5947-274390<br />
              Mob: +91 63955 62348
            </div>
          </div>
        </div>

        {/* Content Box - wraps patient details and transactions */}
        <div className="content-box">
          {/* Patient Details */}
          <div className="patient-details-box">
            <div className="patient-row">
              <div className="patient-pair">
                <div className="patient-label">Token No.:</div>
                <div className="patient-value">{receiptData.tokenNumber ?? "—"}</div>
              </div>
              <div className="patient-pair">
                <div className="patient-label">Date / Time:</div>
                <div className="patient-value">{dateTime}</div>
              </div>
            </div>
            <div className="patient-row">
              <div className="patient-pair">
                <div className="patient-label">Patient Name:</div>
                <div className="patient-value">{patientName}</div>
              </div>
              <div className="patient-pair">
                <div className="patient-label">Visit ID:</div>
                <div className="patient-value">{receiptData.visitId ?? "—"}</div>
              </div>
            </div>
            <div className="patient-row">
              <div className="patient-pair">
                <div className="patient-label">Age / Gender:</div>
                <div className="patient-value">{ageGender}</div>
              </div>
              <div className="patient-pair">
                <div className="patient-label">Phone No.:</div>
                <div className="patient-value">{receiptData.phone ?? "—"}</div>
              </div>
            </div>
            <div className="patient-row">
              <div className="patient-pair">
                <div className="patient-label">MRD No.:</div>
                <div className="patient-value">{receiptData.mrd ?? "—"}</div>
              </div>
              <div className="patient-pair">
                <div className="patient-label">Case ID:</div>
                <div className="patient-value">{receiptData.appointmentId ?? "—"}</div>
              </div>
            </div>
            <div className="patient-row">
              <div className="patient-pair">
                <div className="patient-label">Visit Type:</div>
                <div className="patient-value">{receiptData.visitType ?? "—"}</div>
              </div>
              <div className="patient-pair">
                <div className="patient-label">Status:</div>
                <div className="patient-value">{receiptData.status ?? "—"}</div>
              </div>
            </div>
            <div className="patient-row patient-row-full">
              <div className="patient-label">Ref. Consultant:</div>
              <div className="patient-value-full">{doctorDisplay}</div>
            </div>
          </div>

          {/* Transactions Section */}
          <div className="transactions-section">
          <div className="transaction-header">
            <div className="col-code">Code</div>
            <div className="col-transactions">Transactions</div>
            <div className="col-rate">Rate</div>
          </div>
          {transactions.length === 0 ? (
            <div className="payment-no-data">No payment transactions found</div>
          ) : (
            transactions.map((txn, index) => (
              <div key={txn._id} className="transaction-row">
                <div className="col-code">{txn.transactionId ?? `TXN${index + 1}`}</div>
                <div className="col-transactions">
                  {txn.transactionDate
                    ? `${dayjs(txn.transactionDate).format("DD MMM YYYY")}${txn.createdAt ? ` ${dayjs(txn.createdAt).format("HH:mm")}` : ""} - ${txn.paymentMode ?? "—"}`
                    : `${txn.paymentMode ?? "—"}`}
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
            <div className="summary-row">
              <span>Discount:</span>
              <span>₹{discount.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Final Amount:</span>
              <span>₹{finalAmount.toFixed(2)}</span>
            </div>
            <div className="summary-row total-paid">
              <span>Total Paid Amount:</span>
              <span>₹{totalPaid.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <div>This is a computer generated receipt.</div>
        </div>
      </div>
    </div>
  );
};

export default PrintReceipt;
