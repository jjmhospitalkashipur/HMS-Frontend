"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import { Maximize, Minimize } from "tabler-icons-react";

interface IQueuePatient {
  _id: string;
  visitId: string;
  appointmentId?: string;
  visitType?: string;
  visitTime?: string;
  tokenNumber: number;
  status: string;
  patient: {
    mrd: string;
    name: string;
    age?: number;
    gender?: string;
  };
}

interface IQueueDisplay {
  doctorId: string;
  doctorName: string;
  sessionSlot: string;
  date: string;
  totalPatients: number;
  queue: IQueuePatient[];
}

function toQueuePatient(visit: Record<string, unknown>): IQueuePatient {
  const patient = (visit.patient as Record<string, unknown>) ?? {};
  return {
    _id: (visit._id as string) ?? (visit.visitId as string) ?? "",
    visitId: (visit.visitId as string) ?? "",
    appointmentId: visit.appointmentId as string | undefined,
    visitType: visit.visitType as string | undefined,
    visitTime: visit.visitTime as string | undefined,
    tokenNumber: Number(visit.tokenNumber) ?? 0,
    status: (visit.status as string) ?? "Scheduled",
    patient: {
      mrd: (patient.mrd as string) ?? "—",
      name: (patient.name as string) ?? "—",
      age: patient.age as number | undefined,
      gender: patient.gender as string | undefined,
    },
  };
}

function displayFromSSE(data: Record<string, unknown>): IQueueDisplay {
  const queue = Array.isArray(data.queue)
    ? (data.queue as Record<string, unknown>[]).map(toQueuePatient)
    : [];
  return {
    doctorId: (data.doctorId as string) ?? "",
    doctorName: (data.doctorName as string) ?? "—",
    sessionSlot: (data.sessionSlot as string) ?? "Morning",
    date: (data.date as string) ?? "",
    totalPatients: Number(data.totalPatients) ?? queue.length,
    queue,
  };
}

function getStatusDisplay(status: string, visitType?: string) {
  const normalized = status?.toLowerCase() ?? "";
  const normalizedVisitType = visitType?.toLowerCase() ?? "";
  if (normalized === "consulting" || normalized === "in progress") {
    return {
      label: "Consulting (कंसल्टेशन जारी)",
      rowStyle: { backgroundColor: "#bed75a" },
      textClass: "text-dark",
    };
  }
  if (normalizedVisitType === "mr") {
    return {
      label: "In Queue (आप कतार में हैं)",
      rowStyle: { backgroundColor: "#af6eaa" },
      textClass: "text-white",
    };
  }
  return {
    label: "In Queue (आप कतार में हैं)",
    rowStyle: { backgroundColor: "#f5eb55" },
    textClass: "text-dark",
  };
}

const DOCTORS_PER_PAGE = 5;

const QueueDisplayMultiComponent = () => {
  const params = useParams();
  const pageNum = Math.max(1, parseInt(params?.page as string, 10) || 1);
  const startIndex = (pageNum - 1) * DOCTORS_PER_PAGE;
  const endIndex = startIndex + DOCTORS_PER_PAGE;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [doctors, setDoctors] = useState<Array<{ _id: string; name: string; doctorId?: string }>>([]);
  const [displays, setDisplays] = useState<Record<string, IQueueDisplay>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const eventSourceRefs = useRef<Record<string, EventSource>>({});

  const pageDoctors = doctors.slice(startIndex, endIndex);
  /** Same id as single qd page: readable doctorId for stream URL and state key */
  const getStreamId = (doc: { _id: string; doctorId?: string }) => doc.doctorId ?? doc._id;

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
    document.addEventListener("fullscreenchange", () => {
      setIsFullscreen(!!document.fullscreenElement);
    });
    return () => document.removeEventListener("fullscreenchange", () => {});
  }, []);

  // Fetch first 10 doctors
  useEffect(() => {
    if (!API_BASE_URL) return;
    setError("");
    axios
      .get(`${API_BASE_URL}/hospital/doctors`, { params: { limit: 10 } })
      .then((res) => {
        if (res.data?.code === 200 && res.data?.data?.doctors) {
          const list = res.data.data.doctors as Array<{ _id: string; name: string; doctorId?: string }>;
          setDoctors(list);
        } else {
          setDoctors([]);
        }
      })
      .catch(() => {
        setError("Failed to load doctors");
        setDoctors([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const pageStreamIds = pageDoctors.map((d) => getStreamId(d)).sort().join(",");

  // Open one SSE per doctor on this page (same as qd/[doctorId]) to fetch and live-update appointments
  useEffect(() => {
    if (!API_BASE_URL || pageDoctors.length === 0) return;
    const refs = eventSourceRefs.current;
    pageDoctors.forEach((doc) => {
      const streamId = getStreamId(doc);
      if (refs[streamId]) return;
      const streamUrl = `${API_BASE_URL}/hospital/visits/display/stream/${streamId}`;
      const es = new EventSource(streamUrl);
      refs[streamId] = es;
      es.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data) as Record<string, unknown>;
          const type = ((data.eventType ?? data.type) as string)?.trim().toLowerCase() ?? "";
          switch (type) {
            case "initial":
            case "session-change": {
              setDisplays((prev) => ({ ...prev, [streamId]: displayFromSSE(data) }));
              break;
            }
            case "new-visit": {
              const visit = data.visit as Record<string, unknown>;
              if (visit) {
                setDisplays((prev) => {
                  const current = prev[streamId];
                  if (!current) return prev;
                  const newPatient = toQueuePatient(visit);
                  const exists = current.queue.some(
                    (p) => (p.visitId || p._id) === (newPatient.visitId || newPatient._id)
                  );
                  if (exists) return prev;
                  return {
                    ...prev,
                    [streamId]: { ...current, queue: [...current.queue, newPatient] },
                  };
                });
              }
              break;
            }
            case "status-change": {
              const visitId = data.visitId as string;
              const newStatus = data.newStatus as string;
              if (!visitId) break;
              setDisplays((prev) => {
                const current = prev[streamId];
                if (!current) return prev;
                return {
                  ...prev,
                  [streamId]: {
                    ...current,
                    queue: current.queue.map((p) =>
                      (p.visitId || p._id) === visitId ? { ...p, status: newStatus } : p
                    ),
                  },
                };
              });
              break;
            }
            case "visit-updated": {
              const visit = data.visit as Record<string, unknown>;
              if (!visit) break;
              const updated = toQueuePatient(visit);
              const matchId = (updated.visitId as string) || (updated._id as string);
              if (!matchId) break;
              setDisplays((prev) => {
                const current = prev[streamId];
                if (!current) return prev;
                const idx = current.queue.findIndex(
                  (p) => (p.visitId || p._id) === matchId || p._id === (visit._id as string)
                );
                const existing = idx >= 0 ? current.queue[idx] : null;
                const merged =
                  existing && !(visit.patient as Record<string, unknown>)
                    ? { ...updated, patient: { ...updated.patient, ...existing.patient } }
                    : { ...updated };
                const nextQueue = [...current.queue];
                if (idx >= 0) nextQueue[idx] = merged;
                else nextQueue.push(merged);
                return { ...prev, [streamId]: { ...current, queue: nextQueue } };
              });
              break;
            }
            case "visit-deleted": {
              const visitId = data.visitId as string;
              if (!visitId) break;
              setDisplays((prev) => {
                const current = prev[streamId];
                if (!current) return prev;
                return {
                  ...prev,
                  [streamId]: {
                    ...current,
                    queue: current.queue.filter((p) => (p.visitId || p._id) !== visitId),
                  },
                };
              });
              break;
            }
            case "queue-refresh": {
              const queue = data.queue as Record<string, unknown>[] | undefined;
              if (Array.isArray(queue)) {
                setDisplays((prev) => {
                  const current = prev[streamId];
                  if (!current) return prev;
                  return { ...prev, [streamId]: { ...current, queue: queue.map(toQueuePatient) } };
                });
              }
              break;
            }
            default:
              break;
          }
        } catch {
          // ignore parse errors
        }
      };
      es.onerror = () => {
        es.close();
        delete refs[streamId];
      };
    });
    return () => {
      Object.keys(refs).forEach((id) => {
        refs[id]?.close();
        delete refs[id];
      });
    };
  }, [API_BASE_URL, pageStreamIds]);

  if (loading && pageDoctors.length === 0) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error && pageDoctors.length === 0) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <p className="text-danger mb-0">{error}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-100 d-flex flex-column bg-white position-relative"
      style={{ minHeight: "50vh", height: "50vh" }}
    >
      <button
        type="button"
        onClick={toggleFullscreen}
        className="position-fixed top-0 end-0 m-3 btn btn-light btn-lg shadow border d-flex align-items-center justify-content-center rounded-circle p-1 z-3"
        style={{ width: "clamp(40px, 3vw, 60px)", height: "clamp(40px, 3vw, 60px)" }}
        aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>

      <div className="bg-white border-bottom py-2 px-3 px-md-4 px-lg-5 px-xl-6 d-flex align-items-center w-100">
        <img
          src="/JJM Logo.png"
          alt="JJM Hospital"
          className="flex-shrink-0 me-3"
          style={{ height: "clamp(40px, 4vw, 150px)", width: "auto", objectFit: "contain" }}
        />
        <h1
          className="mb-0 fw-bold text-dark flex-grow-1 text-center"
          style={{ fontSize: "clamp(1rem, 2vw, 6rem)" }}
        >
          JJM Hospital
        </h1>
      </div>
      <div
        className="bg-primary text-white py-1 px-3 px-md-4 px-lg-5 px-xl-6 text-center w-100"
        style={{ fontSize: "clamp(0.75rem, 1.2vw, 3rem)" }}
      >
        <span className="text-nowrap">
          Appointment / Critical Patients will be given priority in Queue
        </span>
      </div>

      <div className="flex-grow-1 d-flex p-3 p-md-4 p-lg-5 p-xl-6 gap-2 gap-md-3 w-100 overflow-auto min-h-0">
        {pageDoctors.map((doc) => {
          const streamId = getStreamId(doc);
          const display = displays[streamId];
          const rawName = display?.doctorName?.trim() ?? doc.name?.trim() ?? "";
          const doctorName = rawName
            ? rawName.startsWith("Dr.")
              ? rawName
              : `Dr. ${rawName}`
            : "—";
          const allQueue = display?.queue ?? [];
          const queue = allQueue.filter((entry) => {
            const normalized = entry.status?.toLowerCase() ?? "";
            return normalized === "in progress" || normalized === "scheduled";
          });

          return (
            <div
              key={doc._id}
              className="flex-grow-1 min-w-0 rounded-3 border overflow-hidden shadow-sm d-flex flex-column"
              style={{
                minWidth: "0",
                flex: "1 1 0%",
                maxHeight: "100%",
                maxWidth: "20%",
              }}
            >
              <div
                className="bg-dark text-white text-center py-2 px-2 fw-bold border-bottom"
                style={{ fontSize: "clamp(0.75rem, 1.2vw, 3rem)" }}
              >
                {doctorName}
              </div>
              <div
                className="table-responsive w-100 overflow-auto flex-grow-1"
                style={{ maxHeight: "100%" }}
              >
                <table className="table mb-0 w-100">
                  <thead className="table-dark position-sticky top-0 z-1">
                    <tr>
                      <th
                        className="text-center"
                        style={{
                          padding: "clamp(0.35rem, 1vw, 2rem) clamp(0.5rem, 1.2vw, 3rem)",
                          fontSize: "clamp(0.7rem, 1.2vw, 3rem)",
                        }}
                      >
                        Token
                      </th>
                      <th
                        className="text-center"
                        style={{
                          padding: "clamp(0.35rem, 1vw, 2rem) clamp(0.5rem, 1.2vw, 3rem)",
                          fontSize: "clamp(0.7rem, 1.2vw, 3rem)",
                        }}
                      >
                        MRD No
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {display === undefined ? (
                      <tr>
                        <td
                          colSpan={2}
                          className="text-center text-muted"
                          style={{
                            padding: "clamp(1rem, 2vw, 4rem)",
                            fontSize: "clamp(0.7rem, 1.2vw, 3rem)",
                          }}
                        >
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden />
                          Loading queue…
                        </td>
                      </tr>
                    ) : queue.length === 0 ? (
                      <tr>
                        <td
                          colSpan={2}
                          className="text-center text-muted"
                          style={{
                            padding: "clamp(1rem, 2vw, 4rem)",
                            fontSize: "clamp(0.7rem, 1.2vw, 3rem)",
                          }}
                        >
                          No patients
                        </td>
                      </tr>
                    ) : (
                      queue.map((entry) => {
                        const statusDisplay = getStatusDisplay(entry.status, entry.visitType);
                        return (
                          <tr key={entry._id} style={statusDisplay.rowStyle}>
                            <td
                              className={`fw-semibold align-middle text-center ${statusDisplay.textClass}`}
                              style={{
                                ...statusDisplay.rowStyle,
                                padding: "clamp(0.4rem, 1.2vw, 3rem) clamp(0.5rem, 1.2vw, 3rem)",
                                fontSize: "clamp(0.75rem, 1.3vw, 3.5rem)",
                              }}
                            >
                              {entry.tokenNumber}
                            </td>
                            <td
                              className={`align-middle fw-medium text-center ${statusDisplay.textClass}`}
                              style={{
                                ...statusDisplay.rowStyle,
                                padding: "clamp(0.4rem, 1.2vw, 3rem) clamp(0.5rem, 1.2vw, 3rem)",
                                fontSize: "clamp(0.75rem, 1.3vw, 3.5rem)",
                              }}
                            >
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
          );
        })}
      </div>
    </div>
  );
};

export default QueueDisplayMultiComponent;
