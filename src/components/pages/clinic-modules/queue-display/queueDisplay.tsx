"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { API_BASE_URL } from "@/environment";
import { Maximize, Minimize, Ambulance } from "tabler-icons-react";

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
  emergencyCount?: number;
  regularCount?: number;
  currentTime?: string;
  queue: IQueuePatient[];
}

const isEmergencyVisit = (visit?: IQueuePatient): boolean =>
  (visit?.visitType ?? "").toLowerCase() === "emergency";

function sortAndComputeQueue(queue: IQueuePatient[]) {
  const sorted = [...queue].sort((a, b) => {
    const aEmergency = isEmergencyVisit(a);
    const bEmergency = isEmergencyVisit(b);
    if (aEmergency && !bEmergency) return -1;
    if (!aEmergency && bEmergency) return 1;
    return (a.tokenNumber ?? 0) - (b.tokenNumber ?? 0);
  });
  const emergencyCount = sorted.filter((v) => isEmergencyVisit(v)).length;
  const totalPatients = sorted.length;
  const regularCount = totalPatients - emergencyCount;
  return { queue: sorted, totalPatients, emergencyCount, regularCount };
}

/** Normalize SSE visit to IQueuePatient */
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

/** Build IQueueDisplay from SSE initial/session-change payload */
function displayFromSSE(data: Record<string, unknown>): IQueueDisplay {
  const rawQueue = Array.isArray(data.queue)
    ? (data.queue as Record<string, unknown>[]).map(toQueuePatient)
    : [];
  const {
    queue,
    totalPatients: computedTotal,
    emergencyCount: computedEmergency,
    regularCount: computedRegular,
  } = sortAndComputeQueue(rawQueue);
  const apiTotal = Number(data.totalPatients);
  const apiEmergency = Number((data as any).emergencyCount);
  const apiRegular = Number((data as any).regularCount);

  return {
    doctorId: (data.doctorId as string) ?? "",
    doctorName: (data.doctorName as string) ?? "—",
    department: (data.department as string) ?? null,
    specialization: (data.specialization as string) ?? null,
    designation: (data.designation as string) ?? null,
    sessionSlot: (data.sessionSlot as string) ?? "Morning",
    date: (data.date as string) ?? "",
    totalPatients: Number.isFinite(apiTotal) ? apiTotal : computedTotal,
    emergencyCount: Number.isFinite(apiEmergency) ? apiEmergency : computedEmergency,
    regularCount: Number.isFinite(apiRegular) ? apiRegular : computedRegular,
    currentTime: (data as any).currentTime as string | undefined,
    queue,
  };
}

const getStatusDisplay = (status: string, visitType?: string) => {
  const normalized = status?.toLowerCase() ?? "";
  const normalizedVisitType = visitType?.toLowerCase() ?? "";
  
  // Consulting (In Progress)
  if (normalized === "consulting" || normalized === "in progress") {
    return {
      label: "Consulting (कंसल्टेशन जारी)",
      rowStyle: { backgroundColor: "#bed75a" },
      textClass: "text-dark",
    };
  }
  
  // MR + Scheduled
  if (normalizedVisitType === "mr") {
    return {
      label: "In Queue (आप कतार में हैं)",
      rowStyle: { backgroundColor: "#af6eaa" },
      textClass: "text-white",
    };
  }
  
  // Regular In Queue
  return {
    label: "In Queue (आप कतार में हैं)",
    rowStyle: { backgroundColor: "#f5eb55" },
    textClass: "text-dark",
  };
};

const QueueDisplayComponent = () => {
  const params = useParams();
  const doctorId = params?.doctorId as string;

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [display, setDisplay] = useState<IQueueDisplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectDelayRef = useRef(2000);

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
    if (!API_BASE_URL || !doctorId) return;

    let destroyed = false;

    const connect = () => {
      if (destroyed) return;
      const streamUrl = `${API_BASE_URL}/hospital/visits/display/stream/${doctorId}`;
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onmessage = (event: MessageEvent) => {
        if (destroyed) return;
        // Reset backoff on successful message
        reconnectDelayRef.current = 2000;
        try {
          const data = JSON.parse(event.data) as Record<string, unknown>;
          const type = ((data.eventType ?? data.type) as string)?.trim().toLowerCase() ?? "";

          switch (type) {
            case "initial":
            case "session-change":
            case "date-change": {
              setDisplay(displayFromSSE(data));
              setLoading(false);
              setError("");
              break;
            }
            case "new-visit": {
              const visit = data.visit as Record<string, unknown>;
              if (visit) {
                setDisplay((prev) => {
                  if (!prev) return prev;
                  const newPatient = toQueuePatient(visit);
                  const exists = prev.queue.some(
                    (p) => (p.visitId || p._id) === (newPatient.visitId || newPatient._id)
                  );
                  if (exists) return prev;
                  const { queue, totalPatients, emergencyCount, regularCount } =
                    sortAndComputeQueue([...prev.queue, newPatient]);
                  return { ...prev, queue, totalPatients, emergencyCount, regularCount };
                });
              }
              break;
            }
            case "status-change": {
              const visit = data.visit as Record<string, unknown>;
              if (!visit) break;
              const updated = toQueuePatient(visit);
              const visitId = (updated.visitId as string) || (updated._id as string);
              const newStatus = updated.status;
              if (!visitId || !newStatus) break;
              const normalized = newStatus.toLowerCase();
              const shouldRemove =
                normalized === "completed" ||
                normalized === "cancelled" ||
                normalized === "canceled" ||
                normalized === "no show" ||
                normalized === "no_show";
              setDisplay((prev) => {
                if (!prev) return prev;
                const nextQueue = shouldRemove
                  ? prev.queue.filter((p) => (p.visitId || p._id) !== visitId)
                  : prev.queue.map((p) =>
                      (p.visitId || p._id) === visitId ? { ...p, status: newStatus } : p
                    );
                const { queue, totalPatients, emergencyCount, regularCount } =
                  sortAndComputeQueue(nextQueue);
                return { ...prev, queue, totalPatients, emergencyCount, regularCount };
              });
              break;
            }
            case "visit-updated": {
              const visit = data.visit as Record<string, unknown>;
              if (!visit) break;
              const updated = toQueuePatient(visit);
              const matchId = (updated.visitId as string) || (updated._id as string);
              if (!matchId) break;
              setDisplay((prev) => {
                if (!prev) return prev;
                const idx = prev.queue.findIndex(
                  (p) => (p.visitId || p._id) === matchId || p._id === (visit._id as string)
                );
                const existing = idx >= 0 ? prev.queue[idx] : null;
                const merged =
                  existing && !(visit.patient as Record<string, unknown>)
                    ? { ...updated, patient: { ...updated.patient, ...existing.patient } }
                    : { ...updated };
                const nextQueue = [...prev.queue];
                if (idx >= 0) nextQueue[idx] = merged;
                else nextQueue.push(merged);
                const { queue, totalPatients, emergencyCount, regularCount } =
                  sortAndComputeQueue(nextQueue);
                return { ...prev, queue, totalPatients, emergencyCount, regularCount };
              });
              break;
            }
            case "visit-deleted": {
              const visitId = data.visitId as string;
              if (!visitId) break;
              setDisplay((prev) => {
                if (!prev) return prev;
                const nextQueue = prev.queue.filter(
                  (p) => (p.visitId || p._id) !== visitId
                );
                const { queue, totalPatients, emergencyCount, regularCount } =
                  sortAndComputeQueue(nextQueue);
                return { ...prev, queue, totalPatients, emergencyCount, regularCount };
              });
              break;
            }
            case "queue-refresh": {
              const rawQ = data.queue as Record<string, unknown>[] | undefined;
              if (Array.isArray(rawQ)) {
                setDisplay((prev) => {
                  if (!prev) return prev;
                  const { queue: sortedQueue, totalPatients, emergencyCount, regularCount } =
                    sortAndComputeQueue(rawQ.map(toQueuePatient));
                  return { ...prev, queue: sortedQueue, totalPatients, emergencyCount, regularCount };
                });
              }
              break;
            }
            default:
              break;
          }
        } catch (err) {
          console.error("SSE parse error:", err);
        }
      };

      es.onerror = () => {
        if (destroyed) return;
        es.close();
        eventSourceRef.current = null;
        setLoading((prev) => prev);
        setError("Connection lost. Reconnecting…");
        // Exponential backoff: 2s → 4s → 8s → max 30s
        const delay = Math.min(reconnectDelayRef.current, 30000);
        reconnectDelayRef.current = delay * 2;
        reconnectTimerRef.current = setTimeout(connect, delay);
      };
    };

    setError("");
    connect();

    return () => {
      destroyed = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
    };
  }, [doctorId]);

  if (!doctorId) {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
        <p className="text-danger mb-0">Invalid doctor. Use /qd/[doctorId]</p>
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
    <div ref={containerRef} className="min-vh-100 w-100 d-flex flex-column bg-white position-relative">
      {/* Fullscreen toggle - top right */}
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
      {/* Header */}
      <div className="bg-white border-bottom py-1 px-3 px-md-4 px-lg-5 px-xl-6 d-flex align-items-center w-100">
        <img src="/JJM Logo.png" alt="JJM Hospital" className="flex-shrink-0 me-3" style={{ height: "clamp(40px, 4vw, 150px)", width: "auto", objectFit: "contain" }} />
        <h1 className="mb-0 fw-bold text-dark flex-grow-1 text-center" style={{ fontSize: "clamp(1rem, 2vw, 6rem)" }}>
          JJM Hospital
        </h1>
      </div>
      <div className="bg-primary text-white py-1 px-3 px-md-4 px-lg-5 px-xl-6 text-center w-100" style={{ fontSize: "clamp(0.75rem, 1.2vw, 3rem)" }}>
        <span className="text-nowrap">
          Critical Patients will be given priority in Queue
        </span>
      </div>

      {/* Main content: doctor info left, queue right */}
      <div className="d-flex flex-column flex-md-row align-items-stretch p-2 p-md-3 p-lg-4 p-xl-4 gap-3 gap-md-4 gap-xl-4 w-100 overflow-hidden">
        {/* Left: Doctor info */}
        <div
          className="flex-shrink-0 w-100 rounded-3 border bg-white shadow-sm text-center order-2 order-md-1 d-flex flex-column"
          style={{
            maxWidth: "clamp(260px, 26%, 520px)",
            padding: "clamp(0.35rem, 0.9vw, 1.5rem)",
          }}
        >
          <div
            className="bg-light  flex-shrink-0 overflow-hidden rounded-2 mx-auto position-relative"
            style={{ 
              width: "clamp(180px, 20vw, 420px)", 
              height: "clamp(220px, 28vw, 560px)",
            }}
          >
            <Image
              src="/assets/img/Photo3.jpg"
              alt="Doctor"
              fill
              sizes="(max-width: 768px) 200px, 25vw"
              style={{ objectFit: "cover", objectPosition: "top" }}
              priority={false}
            />
          </div>
          <h2 className="fw-bold text-dark mb-1" style={{ fontSize: "clamp(1rem, 1.8vw, 5rem)" }}>{doctorName}</h2>
          <p className="text-secondary mb-0" style={{ fontSize: "clamp(0.875rem, 1.4vw, 3.5rem)" }}>{departmentOrSpecialization}</p>
        </div>

        {/* Right: Queue table - scroll inside table */}
        <div
          className="flex-grow-1 min-w-0 rounded-3 border overflow-hidden shadow-sm order-1 order-md-2 d-flex flex-column"
          style={{ minWidth: "0" }}
        >
          <div className="table-responsive w-100 overflow-auto flex-grow-1" style={{ maxHeight: "100%" }}>
            <table className="table mb-0 w-100">
              <thead className="table-dark position-sticky top-0 z-1">
                <tr>
                  <th className="text-center" style={{ 
                    padding: "clamp(0.5rem, 1.5vw, 4rem) clamp(0.75rem, 2vw, 5rem)",
                    fontSize: "clamp(0.875rem, 1.5vw, 5rem)"
                  }}>Token No</th>
                  <th className="text-center" style={{ 
                    padding: "clamp(0.5rem, 1.5vw, 4rem) clamp(0.75rem, 2vw, 5rem)",
                    fontSize: "clamp(0.875rem, 1.5vw, 5rem)"
                  }}>Status</th>
                  <th className="text-center" style={{ 
                    padding: "clamp(0.5rem, 1.5vw, 4rem) clamp(0.75rem, 2vw, 5rem)",
                    fontSize: "clamp(0.875rem, 1.5vw, 5rem)"
                  }}>MRD No</th>
                </tr>
              </thead>
              <tbody>
                {queue.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="text-center text-muted" style={{ 
                      padding: "clamp(2rem, 4vw, 8rem)",
                      fontSize: "clamp(0.875rem, 1.5vw, 5rem)"
                    }}>
                      No patients in queue
                    </td>
                  </tr>
                ) : (
                  queue.map((entry) => {
                    const normalizedStatus = entry.status?.toLowerCase() ?? "";
                    const statusDisplay = getStatusDisplay(entry.status, entry.visitType);
                    const isConsulting = normalizedStatus === "consulting" || normalizedStatus === "in progress";
                    const isMR = entry.visitType?.toLowerCase() === "mr";
                    const isEmergency = isEmergencyVisit(entry);
                    const tokenLabel = isEmergency ? `E-${entry.tokenNumber}` : entry.tokenNumber;
                    return (
                      <tr key={entry._id} style={statusDisplay.rowStyle}>
                        <td className={`fw-semibold align-middle text-center ${statusDisplay.textClass}`} style={{
                          ...statusDisplay.rowStyle,
                          padding: "clamp(0.75rem, 2vw, 6rem) clamp(0.75rem, 2vw, 5rem)",
                          fontSize: "clamp(1rem, 1.8vw, 5.5rem)"
                        }}>
                          {tokenLabel}
                        </td>
                        <td className={`align-middle text-center ${statusDisplay.textClass}`} style={{
                          ...statusDisplay.rowStyle,
                          padding: "clamp(0.75rem, 2vw, 6rem) clamp(0.75rem, 2vw, 5rem)",
                          fontSize: "clamp(1rem, 1.8vw, 5.5rem)"
                        }}>
                          <span className="d-inline-flex align-items-center justify-content-center gap-2">
                            {entry.visitType === "Emergency" && (
                              <Ambulance style={{ 
                                width: "clamp(20px, 2vw, 80px)", 
                                height: "clamp(20px, 2vw, 80px)" 
                              }} color="#dc2626" aria-label="Emergency" />
                            )}
                            {statusDisplay.label}
                          </span>
                        </td>
                        <td className={`align-middle fw-medium text-center ${statusDisplay.textClass}`} style={{
                          ...statusDisplay.rowStyle,
                          padding: "clamp(0.75rem, 2vw, 6rem) clamp(0.75rem, 2vw, 5rem)",
                          fontSize: "clamp(1rem, 1.8vw, 5.5rem)"
                        }}>
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

      {/* Scrolling info strip */}
      <div
        className="w-100 py-2 mt-0"
        style={{ backgroundColor: "#704E8E", overflow: "hidden" }}
      >
        <div
          className="text-white fw-semibold"
          style={{
            whiteSpace: "nowrap",
            display: "inline-block",
            animation: "qd-strip-scroll 80s linear infinite",
            fontSize: "clamp(1.6rem, 3vw, 4.5rem)",
          }}
        >
          24×7 इमरजेंसी केयर&nbsp;•&nbsp;
          अत्याधुनिक मशीनें और एडवांस इक्विपमेंट्स&nbsp;•&nbsp;
          हमारे क्षेत्र की सबसे बेहतर इक्विप्ड डायलिसिस यूनिट&nbsp;•&nbsp;
          प्रोफेशनल और समर्पित डॉक्टर्स एवं स्टाफ&nbsp;•&nbsp;
          मॉडर्न और स्मूथ कंसल्टेशन प्रोसेस&nbsp;•&nbsp;
          हाई-टेक डायग्नोस्टिक सर्विसेज&nbsp;•&nbsp;
          इनडोर पेशेंट प्राइवेट रूम्स&nbsp;•&nbsp;
          एडवांस ICU फैसिलिटी&nbsp;•&nbsp;
          वेल-इक्विप्ड क्रिटिकल केयर यूनिट&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          24×7 इमरजेंसी केयर&nbsp;•&nbsp;
          अत्याधुनिक मशीनें और एडवांस इक्विपमेंट्स&nbsp;•&nbsp;
          हमारे क्षेत्र की सबसे बेहतर इक्विप्ड डायलिसिस यूनिट&nbsp;•&nbsp;
          प्रोफेशनल और समर्पित डॉक्टर्स एवं स्टाफ&nbsp;•&nbsp;
          मॉडर्न और स्मूथ कंसल्टेशन प्रोसेस&nbsp;•&nbsp;
          हाई-टेक डायग्नोस्टिक सर्विसेज&nbsp;•&nbsp;
          इनडोर पेशेंट प्राइवेट रूम्स&nbsp;•&nbsp;
          एडवांस ICU फैसिलिटी&nbsp;•&nbsp;
          वेल-इक्विप्ड क्रिटिकल केयर यूनिट
        </div>
      </div>

      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes qd-strip-scroll {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
};

export default QueueDisplayComponent;
