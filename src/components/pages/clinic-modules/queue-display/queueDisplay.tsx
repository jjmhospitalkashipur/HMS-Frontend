"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import dayjs from "dayjs";
import { User, AlertTriangle, Maximize, Minimize, Ambulance } from "tabler-icons-react";

interface IQueuePatient {
  _id: string;
  visitId: string;
  appointmentId: string;
  visitType?: string;
  visitTime: string;
  tokenNumber: number;
  status: string;
  patient: {
    mrd: string;
    name: string;
    age?: number;
    gender?: string;
  };
  doctor?: { name: string };
}

interface IQueueDisplay {
  doctorId: string;
  doctorName: string;
  specialization?: string | null;
  department?: string | null;
  designation?: string | null;
  sessionSlot: string;
  date: string;
  totalPatients: number;
  queue: IQueuePatient[];
}

interface IQueueApiResponse {
  code: number;
  message: string;
  data: { display: IQueueDisplay };
}

const getStatusDisplay = (status: string, visitType?: string) => {
  const normalized = status?.toLowerCase() ?? "";
  const normalizedVisitType = visitType?.toLowerCase() ?? "";
  
  // Consulting (In Progress) - always green, regardless of visit type
  if (normalized === "consulting" || normalized === "in progress") {
    return {
      label: "Consulting (कंसल्टेशन जारी)",
      rowStyle: { backgroundColor: "#10b981" }, // Emerald green
      textClass: "text-white",
    };
  }
  
  // MR + Scheduled → Purple (distinct from regular blue)
  if (normalizedVisitType === "mr") {
    return {
      label: "In Queue (आप कतार में हैं)",
      rowStyle: { backgroundColor: "#8b5cf6" }, // Purple for MR scheduled
      textClass: "text-white",
    };
  }
  
  // Regular Scheduled (non-MR) → Light blue
  return {
    label: "In Queue (आप कतार में हैं)",
    rowStyle: { backgroundColor: "#60a5fa" }, // Light blue for regular scheduled
    textClass: "text-white",
  };
};

const QueueDisplayComponent = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const doctorId = params?.doctorId as string;
  const sessionSlot = searchParams?.get("sessionSlot") ?? "Morning";
  const dateParam = searchParams?.get("date");
  const date = dateParam ?? dayjs().format("YYYY-MM-DD");

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [display, setDisplay] = useState<IQueueDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!doctorId) return;
    fetchQueue();
    const interval = setInterval(fetchQueue, 20000);
    return () => clearInterval(interval);
  }, [doctorId, sessionSlot, date]);

  const fetchQueue = async () => {
    if (!API_BASE_URL || !doctorId) return;
    try {
      setError("");
      const response = await axios.get<IQueueApiResponse>(
        `${API_BASE_URL}/hospital/visits/display/queue/${doctorId}`,
        {
          params: { doctorId, sessionSlot, date },
        }
      );
      if (response.data?.code === 200 && response.data?.data?.display) {
        setDisplay(response.data.data.display);
      } else {
        setDisplay(null);
        setError("No queue data found");
      }
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Failed to load queue";
      setError(message);
      setDisplay(null);
    } finally {
      setLoading(false);
    }
  };

  if (!doctorId) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <p className="text-danger mb-0">Invalid doctor. Use /queue-display/[doctorId]</p>
      </div>
    );
  }

  if (loading && !display) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && !display) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <p className="text-danger mb-0">{error}</p>
      </div>
    );
  }

  const rawName = display?.doctorName?.trim() ?? "";
  const doctorName = rawName
    ? rawName.startsWith("Dr.")
      ? rawName
      : `Dr. ${rawName}`
    : "—";
  const departmentOrSpecialization = display?.department ?? display?.specialization ?? "—";
  const designation = display?.designation ?? "—";
  const allQueue = display?.queue ?? [];
  // Filter to show only "In Progress" and "Scheduled" status
  const queue = allQueue.filter((entry) => {
    const normalized = entry.status?.toLowerCase() ?? "";
    return normalized === "in progress" || normalized === "scheduled";
  });

  return (
    <div ref={containerRef} className="min-vh-100 d-flex flex-column bg-white position-relative">
      {/* Fullscreen toggle */}
      <button
        type="button"
        onClick={toggleFullscreen}
        className="position-fixed top-0 start-0 m-3 btn btn-light btn-lg shadow border d-flex align-items-center justify-content-center rounded-circle p-1 z-3"
        style={{ width: "50px", height: "50px" }}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>
      {/* Header */}
      <div className="bg-secondary text-white py-3 px-3 px-md-4">
        <h1 className="mb-0 fs-4 fs-md-3 fw-bold text-center align-items-center ">
          JJM Hospital Queue Management System
        </h1>
      </div>
      <div className="bg-primary text-white py-2 px-3 text-center px-md-4 small">
        <span className="text-nowrap">
          Appointment / Critical Patients will be given priority in Queue
        </span>
        <span className="d-none d-md-inline ms-2">
          — Take prior Appointments to avoid waiting.
        </span>
      </div>

      {/* Main content: doctor info left, queue right */}
      <div className="flex-grow-1 d-flex flex-column flex-lg-row p-3 p-md-4 gap-3 gap-lg-4">
        {/* Left: Doctor info */}
        <div className="flex-shrink-0 w-100 rounded-3 border bg-white shadow-sm p-4 text-center order-2 order-lg-1" style={{ maxWidth: "480px" }}>
          <div
            className="avatar rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3 flex-shrink-0 position-relative"
            style={{ width: "220px", height: "220px", zIndex: 10 }}
          >
            <span className="position-relative d-inline-flex align-items-center justify-content-center" style={{ zIndex: 11 }}>
              <User size={160} color="#495057" aria-hidden />
            </span>
          </div>
          <h2 className="h4 fw-bold text-dark mb-1">{doctorName}</h2>
          <p className="text-secondary mb-1">{departmentOrSpecialization}</p>
          <p className=" mb-0 fs-6 fw-bold">{designation}</p>
        </div>

        {/* Right: Queue table */}
        <div className="flex-grow-1 min-w-0 rounded-3 border overflow-hidden shadow-sm order-1 order-lg-2">
          <div className="table-responsive">
            <table className="table mb-0">
              <thead className="table-dark">
                <tr>
                  <th className="py-3 px-3 text-center">Token No</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">MRD No</th>
                </tr>
              </thead>
              <tbody>
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-5 text-center text-muted">
                      No patients in queue
                    </td>
                  </tr>
                ) : (
                  queue.map((entry) => {
                    const normalizedStatus = entry.status?.toLowerCase() ?? "";
                    const statusDisplay = getStatusDisplay(entry.status, entry.visitType);
                    const isConsulting = normalizedStatus === "consulting" || normalizedStatus === "in progress";
                    const isMR = entry.visitType?.toLowerCase() === "mr";
                    return (
                      <tr key={entry._id} style={statusDisplay.rowStyle}>
                        <td className={`py-3 px-3 fw-semibold align-middle fs-5 text-center ${statusDisplay.textClass}`} style={statusDisplay.rowStyle}>
                          {entry.tokenNumber}
                        </td>
                        <td className={`py-3 px-3 align-middle text-center fs-5 ${statusDisplay.textClass}`} style={statusDisplay.rowStyle}>
                          <span className="d-inline-flex align-items-center justify-content-center gap-2">
                            {entry.visitType === "Emergency" && (
                              <Ambulance size={22} color={isConsulting ? "#ffffff" : "#dc2626"} aria-label="Emergency" />
                            )}
                            {statusDisplay.label}
                          </span>
                        </td>
                        <td className={`py-3 px-3 align-middle fw-medium fs-5 text-center ${statusDisplay.textClass}`} style={statusDisplay.rowStyle}>
                          {entry.patient?.mrd ?? "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueDisplayComponent;
