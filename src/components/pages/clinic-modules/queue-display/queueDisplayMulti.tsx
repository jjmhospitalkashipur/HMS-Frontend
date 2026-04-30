"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import { Maximize, Minimize } from "tabler-icons-react";
import { formatTokenWithVisitPrefix } from "@/core/utils/tokenPrefix";

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

interface IPharmaQueueToken {
  _id: string;
  pharmaTokenId?: number;
  tokenNumber?: number;
  status?: string;
  mrd?: string;
  patient?: {
    mrd?: string;
  };
}

const isEmergencyVisit = (visit?: IQueuePatient): boolean =>
  (visit?.visitType ?? "").toLowerCase() === "emergency";

function sortQueue(queue: IQueuePatient[]): IQueuePatient[] {
  return [...queue].sort((a, b) => {
    const aEmergency = isEmergencyVisit(a);
    const bEmergency = isEmergencyVisit(b);
    if (aEmergency && !bEmergency) return -1;
    if (!aEmergency && bEmergency) return 1;
    return (a.tokenNumber ?? 0) - (b.tokenNumber ?? 0);
  });
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
  const rawQueue = Array.isArray(data.queue)
    ? (data.queue as Record<string, unknown>[]).map(toQueuePatient)
    : [];
  const queue = sortQueue(rawQueue);
  return {
    doctorId: (data.doctorId as string) ?? "",
    doctorName: (data.doctorName as string) ?? "—",
    sessionSlot: (data.sessionSlot as string) ?? "Morning",
    date: (data.date as string) ?? "",
    totalPatients: Number(data.totalPatients) || queue.length,
    queue,
  };
}

const QUEUE_ORANGE_MR = "#FF6600";

function getStatusDisplay(status: string, visitType?: string) {
  const normalized = status?.toLowerCase() ?? "";
  const normalizedVisitType = visitType?.toLowerCase().replace(/\s+/g, " ").trim() ?? "";
  if (normalized === "consulting" || normalized === "in progress") {
    return {
      label: "Consulting (कंसल्टेशन जारी)",
      rowStyle: { backgroundColor: "#bed75a" },
      textClass: "text-dark",
    };
  }
  if (normalizedVisitType === "emergency") {
    return {
      label: "In Queue (आप कतार में हैं)",
      rowStyle: { backgroundColor: "#FCA5A5" },
      textClass: "text-dark",
    };
  }
  if (normalizedVisitType === "mr") {
    return {
      label: "In Queue (आप कतार में हैं)",
      rowStyle: { backgroundColor: QUEUE_ORANGE_MR },
      textClass: "text-white",
    };
  }
  if (
    normalizedVisitType === "follow-up-report" ||
    normalizedVisitType === "follow up report" ||
    normalizedVisitType === "followup-report" ||
    normalizedVisitType === "followup report"
  ) {
    return {
      label: "In Queue (आप कतार में हैं)",
      rowStyle: { backgroundColor: "#374151" },
      textClass: "text-white",
    };
  }
  if (
    normalizedVisitType === "follow-up" ||
    normalizedVisitType === "follow up" ||
    normalizedVisitType === "followup"
  ) {
    return {
      label: "In Queue (आप कतार में हैं)",
      rowStyle: { backgroundColor: "#3D5C79" },
      textClass: "text-white",
    };
  }
  return {
    label: "In Queue (आप कतार में हैं)",
    rowStyle: { backgroundColor: "#5D443C" },
    textClass: "text-white",
  };
}

const DOCTORS_PER_PAGE = 5;

const normalizePharmaToken = (token: IPharmaQueueToken): IPharmaQueueToken => ({
  ...token,
  pharmaTokenId: Number(token?.pharmaTokenId ?? token?.tokenNumber ?? 0),
});

const getPharmaQueueRowBackground = (status?: string): string => {
  const normalizedStatus = status?.toLowerCase().trim() ?? "";
  if (normalizedStatus === "created") return "#3D5C79";
  if (normalizedStatus === "in progress") return "#bed75a";
  return "#3D5C79";
};

const isTerminalOpdStatus = (status?: string): boolean => {
  const normalizedStatus = status?.toLowerCase().trim() ?? "";
  return (
    normalizedStatus === "completed" ||
    normalizedStatus === "cancelled" ||
    normalizedStatus === "canceled" ||
    normalizedStatus === "no show" ||
    normalizedStatus === "no_show"
  );
};

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
  const [pharmaQueue, setPharmaQueue] = useState<IPharmaQueueToken[]>([]);
  const [pharmaError, setPharmaError] = useState("");
  const eventSourceRefs = useRef<Record<string, EventSource>>({});
  const pharmaEventSourceRef = useRef<EventSource | null>(null);

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
            case "session-change":
            case "date-change": {
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
                  const nextQueue = sortQueue([...current.queue, newPatient]);
                  return {
                    ...prev,
                    [streamId]: { ...current, queue: nextQueue, totalPatients: nextQueue.length },
                  };
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

              setDisplays((prev) => {
                const current = prev[streamId];
                if (!current) return prev;
                let nextQueue: IQueuePatient[];
                if (shouldRemove) {
                  nextQueue = current.queue.filter(
                    (p) => (p.visitId || p._id) !== visitId
                  );
                } else {
                  nextQueue = current.queue.map((p) =>
                    (p.visitId || p._id) === visitId ? { ...p, status: newStatus } : p
                  );
                }
                const sorted = sortQueue(nextQueue);
                return {
                  ...prev,
                  [streamId]: {
                    ...current,
                    queue: sorted,
                    totalPatients: sorted.length,
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
                const sorted = sortQueue(nextQueue);
                return {
                  ...prev,
                  [streamId]: { ...current, queue: sorted, totalPatients: sorted.length },
                };
              });
              break;
            }
            case "visit-deleted": {
              const visitId = data.visitId as string;
              if (!visitId) break;
              setDisplays((prev) => {
                const current = prev[streamId];
                if (!current) return prev;
                const nextQueue = current.queue.filter(
                  (p) => (p.visitId || p._id) !== visitId
                );
                const sorted = sortQueue(nextQueue);
                return {
                  ...prev,
                  [streamId]: {
                    ...current,
                    queue: sorted,
                    totalPatients: sorted.length,
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
                  const normalizedQueue = queue.map(toQueuePatient);
                  const sorted = sortQueue(normalizedQueue);
                  return {
                    ...prev,
                    [streamId]: {
                      ...current,
                      queue: sorted,
                      totalPatients: sorted.length,
                    },
                  };
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

  useEffect(() => {
    if (!API_BASE_URL || pageNum !== 2) return;
    setPharmaError("");
    const stream = new EventSource(`${API_BASE_URL}/hospital/pharma-tokens/stream`);
    pharmaEventSourceRef.current = stream;
    stream.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as { queue?: IPharmaQueueToken[] };
        if (Array.isArray(data?.queue)) {
          setPharmaQueue(data.queue.map((item) => normalizePharmaToken(item)));
        }
      } catch {
        // ignore malformed chunks
      }
    };
    stream.onerror = () => {
      setPharmaError("Pharma queue disconnected");
    };
    return () => {
      stream.close();
      pharmaEventSourceRef.current = null;
    };
  }, [API_BASE_URL, pageNum]);

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

  // Build per-doctor summary for UI (name + next upcoming token/MRD)
  const doctorSummaries = pageDoctors.map((doc) => {
    const streamId = getStreamId(doc);
    const display = displays[streamId];
    const rawName = display?.doctorName?.trim() ?? doc.name?.trim() ?? "";
    const doctorName = rawName
      ? rawName.startsWith("Dr.")
        ? rawName
        : `Dr. ${rawName}`
      : "—";

    const allQueue = display?.queue ?? [];
    const activeQueue = allQueue.filter((entry) => !isTerminalOpdStatus(entry.status));
    const nextVisit = activeQueue[0];
    const nextToken =
      nextVisit != null
        ? formatTokenWithVisitPrefix(nextVisit.tokenNumber, nextVisit.visitType)
        : null;
    const nextMrd = nextVisit?.patient?.mrd ?? null;
    const nextStatus = nextVisit?.status ?? null;
    const nextVisitType = nextVisit?.visitType ?? null;

    // Derive OPD label based on doctor name
    const normalizedName = doctorName.toLowerCase();
    const isOpd1 = normalizedName.includes("abhishek goel");
    const opdLabel = isOpd1 ? "OPD 1" : "OPD 2";

    return {
      id: doc._id,
      streamId,
      doctorName,
      opdLabel,
      hasDisplay: !!display,
      hasNextVisit: !!nextVisit,
      nextToken,
      nextMrd,
      nextStatus,
      nextVisitType,
    };
  });

  const activeDoctorSummaries = doctorSummaries.filter((doc) => doc.hasNextVisit);

  const pharmaVisibleQueue = [...pharmaQueue]
    .filter((item) => {
      const status = item?.status?.toLowerCase().trim() ?? "";
      return status !== "completed" && status !== "cancelled" && status !== "canceled";
    })
    .sort((a, b) => {
      const aStatus = a?.status?.toLowerCase().trim() ?? "";
      const bStatus = b?.status?.toLowerCase().trim() ?? "";
      const aPriority = aStatus === "in progress" ? 0 : 1;
      const bPriority = bStatus === "in progress" ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return (a?.pharmaTokenId ?? 0) - (b?.pharmaTokenId ?? 0);
    });

  return (
    <div
      ref={containerRef}
      className="min-vh-100 w-100 d-flex flex-column bg-white position-relative"
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

      <div className="bg-white border-bottom py-1 px-3 px-md-4 px-lg-5 px-xl-6 d-flex align-items-center w-100">
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
         Critical Patients will be given priority in Queue
        </span>
      </div>

      {/* Main row: Upcoming tokens list on the left (50% width) and video on the right */}
      <div className="d-flex flex-grow-1 p-2 p-md-3 p-lg-4 p-xl-4 w-100 gap-3">
        {/* Left: Upcoming tokens (50% width) */}
        <div
          className="w-100"
          style={{
            flex: "1 1 50%",
            minWidth: 0,
            height: "64vh",
          }}
        >
          <div className="card shadow-sm w-100 h-100">
           
            <div className="card-body">
              <div className="table-responsive">
                <table className="table mb-0 w-100">
                  <thead className="table-dark">
                    <tr>
                      <th
                        style={{
                          width: "50%",
                          fontSize: "clamp(0.9rem, 1.6vw, 3.2rem)",
                        }}
                      >
                        OPD
                      </th>
                      <th
                        className="text-center"
                        style={{
                          width: "25%",
                          fontSize: "clamp(0.9rem, 1.6vw, 3.2rem)",
                        }}
                      >
                        Token
                      </th>
                      <th
                        className="text-center"
                        style={{
                          width: "25%",
                          fontSize: "clamp(0.9rem, 1.6vw, 3.2rem)",
                        }}
                      >
                        MRD No
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDoctorSummaries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="text-center text-muted"
                          style={{ fontSize: "clamp(1rem, 1.8vw, 3.6rem)" }}
                        >
                          No tokens in queue
                        </td>
                      </tr>
                    ) : (
                      activeDoctorSummaries.map((doc) => {
                        const statusDisplay = doc.nextStatus
                          ? getStatusDisplay(doc.nextStatus, doc.nextVisitType ?? undefined)
                          : {
                              label: "",
                              rowStyle: {},
                              textClass: "",
                            };
                        return (
                          <tr key={doc.id} style={statusDisplay.rowStyle}>
                            <td
                              style={{
                                ...statusDisplay.rowStyle,
                                fontSize: "clamp(1rem, 1.8vw, 3.6rem)",
                              }}
                            >
                              <span
                                className={`fw-semibold text-truncate d-inline-block ${statusDisplay.textClass}`}
                                style={{ maxWidth: "100%" }}
                              >
                                {doc.opdLabel}
                              </span>
                            </td>
                            <td
                              className={`text-center fw-semibold ${statusDisplay.textClass}`}
                              style={{
                                ...statusDisplay.rowStyle,
                                fontSize: "clamp(1rem, 1.8vw, 3.6rem)",
                              }}
                            >
                              {doc.nextToken ?? "—"}
                            </td>
                            <td
                              className={`text-center ${statusDisplay.textClass}`}
                              style={{
                                ...statusDisplay.rowStyle,
                                fontSize: "clamp(1rem, 1.8vw, 3.6rem)",
                              }}
                            >
                              {doc.nextMrd ?? "—"}
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

        {/* Right: Pharma token queue (qd-all/2) */}
        <div
          className="d-none d-lg-flex"
          style={{ flex: "1 1 50%", minWidth: 0, height: "64vh" }}
        >
          <div
            className="rounded-3 border shadow-sm bg-white w-100 overflow-hidden h-100"
          >
            <div className="bg-primary text-white text-center fw-semibold py-2">
              Pharma Queue
            </div>
            {pageNum !== 2 ? (
              <div className="d-flex align-items-center justify-content-center h-100 text-muted p-4">
                Pharma queue appears on page 2
              </div>
            ) : (
              <div className="table-responsive h-100">
                <table className="table mb-0">
                  <thead className="table-dark position-sticky top-0 z-1">
                    <tr>
                      <th
                        className="text-center"
                        style={{ fontSize: "clamp(0.9rem, 1.6vw, 3.2rem)" }}
                      >
                        Token
                      </th>
                      <th
                        className="text-center"
                        style={{ fontSize: "clamp(0.9rem, 1.6vw, 3.2rem)" }}
                      >
                        Status
                      </th>
                      <th
                        className="text-center"
                        style={{ fontSize: "clamp(0.9rem, 1.6vw, 3.2rem)" }}
                      >
                        MRD
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pharmaVisibleQueue.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="text-center text-muted py-4"
                          style={{ fontSize: "clamp(1rem, 1.8vw, 3.6rem)" }}
                        >
                          {pharmaError || "No tokens in queue"}
                        </td>
                      </tr>
                    ) : (
                      pharmaVisibleQueue.map((item, index) => (
                        <tr key={item?._id || `${item?.pharmaTokenId}-${index}`}>
                          <td
                            className="text-center fw-semibold text-white"
                            style={{
                              fontSize: "clamp(1rem, 1.8vw, 3.6rem)",
                              backgroundColor: getPharmaQueueRowBackground(item?.status),
                            }}
                          >
                            {item?.pharmaTokenId ?? "—"}
                          </td>
                          <td
                            className="text-center text-white"
                            style={{
                              fontSize: "clamp(1rem, 1.8vw, 3.6rem)",
                              backgroundColor: getPharmaQueueRowBackground(item?.status),
                            }}
                          >
                            {item?.status?.toLowerCase().trim() === "in progress"
                              ? "In Progress"
                              : "In Queue"}
                          </td>
                          <td
                            className="text-center text-white"
                            style={{
                              fontSize: "clamp(1rem, 1.8vw, 3.6rem)",
                              backgroundColor: getPharmaQueueRowBackground(item?.status),
                            }}
                          >
                            {item?.patient?.mrd ?? item?.mrd ?? "—"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Scrolling info strip (same as single QD, bigger and broader) */}
      <div
        className="w-100 py-3 mt-0"
        style={{ backgroundColor: "#704E8E", overflow: "hidden" }}
      >
        <div
          className="text-white fw-semibold"
          style={{
            whiteSpace: "nowrap",
            display: "inline-block",
            animation: "qd-strip-scroll 140s linear infinite",
            fontSize: "clamp(1.4rem, 2.4vw, 4rem)",
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

      {/* Animation keyframes (shared with single QD) */}
      <style jsx global>{`
        @keyframes qd-strip-scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
};

export default QueueDisplayMultiComponent;
