"use client";


import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect } from "react";
import Datatable from "@/core/common/dataTable";
import Modals from "./modals/modals";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import dayjs from "dayjs";

interface IPathlabCase {
  _id: string;
  caseId: string;
  status?: string;
  createdAt?: string;
  totalAmount?: number;
  finalAmount?: number;
  amountStatus?: string;
}

interface IPatientTransaction {
  _id: string;
  transactionId: string;
  visitId?: string;
  transactionType: string;
  amount: number;
  paymentMode: string;
  referenceNo?: string;
  transactionDate: string;
  createdAt?: string;
  updatedAt?: string;
}

interface IPatient {
  _id: string;
  mrd: string;
  title: string;
  name: string;
  phone: string;
  email: string;
  age: number;
  months?: number;
  days?: number;
  gender: string;
  bloodGroup: string;
  address: string;
  aadharNo: string;
  aadharS3Url?: string;
  otherDocsS3Urls?: string[];
  emergencyContacts?: Array<{
    name: string;
    number: string;
  }>;
  dob?: string;
  createdAt?: string;
  updatedAt?: string;
  pathlabCases?: IPathlabCase[];
  isMRPatient?: boolean;
  companyName?: string;
  division?: string;
}

interface IVisitDoctorEmbed {
  _id?: string;
  name?: string;
  designation?: string;
}

interface IVisit {
  _id: string;
  visitId: string;
  patientId: string;
  doctorId: string;
  visitType: string;
  appointmentType: string;
  visitDate: string;
  visitTime: string;
  sessionSlot: string;
  status: string;
  doctor?: IVisitDoctorEmbed;
}

interface IDoctor {
  _id: string;
  name: string;
  designation: string;
}

interface IAppointment {
  id: string;
  Case_ID: string;
  Date_Time: string;
  Doctor: string;
  role: string;
  Mode: string;
  Status: string;
}

interface IDialysisSession {
  _id: string;
  sessionId: string;
  patientId: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  generalInformation?: {
    actualWeightLoss?: number;
    postHdWeightToday?: number;
  };
  vascularAccess?: {
    type?: string;
  };
}

const PatientDetailsComponent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const [patient, setPatient] = useState<IPatient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState<boolean>(false);
  const [dialysisSessions, setDialysisSessions] = useState<IDialysisSession[]>([]);
  const [dialysisLoading, setDialysisLoading] = useState<boolean>(false);
  const [dialysisStatusUpdatingId, setDialysisStatusUpdatingId] = useState<string | null>(null);
  const [patientTransactions, setPatientTransactions] = useState<IPatientTransaction[]>([]);
  const [patientTransactionsLoading, setPatientTransactionsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
      fetchAppointments();
      fetchDialysisSessions();
      fetchPatientTransactions();
    }
  }, [patientId]);

  const fetchPatientDetails = async () => {
    try {
      setLoading(true);
      if (!API_BASE_URL) {
        console.error("API_BASE_URL is undefined. Check .env.local file.");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/hospital/patients/${patientId}`);
      
      if (response.data?.code === 200 && response.data?.data?.patient) {
        setPatient(response.data.data.patient);
      } else {
        console.error("Failed to fetch patient details:", response.data);
      }
    } catch (error: any) {
      console.error("Error fetching patient details:", error);
      console.error("Error details:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorsByIdMap = async (): Promise<Record<string, IDoctor>> => {
    if (!API_BASE_URL) return {};
    try {
      const res = await axios.get(`${API_BASE_URL}/hospital/doctors`, {
        params: { limit: 500 },
      });
      const list = res.data?.data?.doctors ?? res.data?.data ?? [];
      if (!Array.isArray(list)) return {};
      return list.reduce<Record<string, IDoctor>>((acc, d: { _id?: string; name?: string; designation?: string }) => {
        if (!d?._id) return acc;
        acc[d._id] = {
          _id: d._id,
          name: d.name ?? "",
          designation: d.designation ?? "",
        };
        return acc;
      }, {});
    } catch {
      return {};
    }
  };

  const resolveDoctorForVisit = (
    visit: IVisit,
    doctorsById: Record<string, IDoctor>
  ): IDoctor | null => {
    const embedded = visit.doctor;
    if (embedded?.name) {
      return {
        _id: embedded._id ?? visit.doctorId ?? "",
        name: embedded.name,
        designation: embedded.designation ?? "",
      };
    }
    const doctorId = visit.doctorId?.trim();
    if (doctorId && doctorsById[doctorId]) {
      return doctorsById[doctorId];
    }
    return null;
  };

  const fetchAppointments = async () => {
    try {
      if (!patientId || !API_BASE_URL) {
        return;
      }

      setAppointmentsLoading(true);
      const [visitsResponse, doctorsById] = await Promise.all([
        axios.get(`${API_BASE_URL}/hospital/visits/patient/${patientId}`),
        fetchDoctorsByIdMap(),
      ]);

      if (visitsResponse.data?.code === 200 && visitsResponse.data?.data?.visits) {
        const visits: IVisit[] = visitsResponse.data.data.visits;

        const transformedAppointments = visits.map((visit) => {
          const doctor = resolveDoctorForVisit(visit, doctorsById);
          const visitDate = visit.visitDate ? dayjs(visit.visitDate).format("DD MMM YYYY") : "";
          const visitTime = visit.visitTime || "";
          const dateTime = visitDate && visitTime ? `${visitDate} - ${visitTime}` : visitDate || visitTime;

          return {
            id: visit._id,
            Case_ID: visit.visitId || visit._id,
            Date_Time: dateTime,
            Doctor: doctor?.name || "Unknown Doctor",
            role: doctor?.designation || "",
            Mode: visit.appointmentType || "In-person",
            Status: visit.status || "Scheduled",
          } as IAppointment;
        });

        setAppointments(transformedAppointments);
      } else {
        setAppointments([]);
      }
    } catch (error: unknown) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const fetchDialysisSessions = async () => {
    if (!patientId || !API_BASE_URL) return;
    try {
      setDialysisLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/hospital/dialysis-session/patient/${patientId}`
      );
      if (
        response.data?.code === 200 &&
        Array.isArray(response.data?.data?.sessions)
      ) {
        setDialysisSessions(response.data.data.sessions as IDialysisSession[]);
      } else {
        setDialysisSessions([]);
      }
    } catch {
      setDialysisSessions([]);
    } finally {
      setDialysisLoading(false);
    }
  };

  const fetchPatientTransactions = async () => {
    if (!patientId || !API_BASE_URL) return;
    try {
      setPatientTransactionsLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/hospital/transactions`,
        { params: { patientId } }
      );
      if (response.data?.code === 200) {
        const raw = response.data?.data ?? response.data;
        const list = Array.isArray(raw?.transactions)
          ? raw.transactions
          : Array.isArray(raw)
          ? raw
          : [];
        setPatientTransactions(list as IPatientTransaction[]);
      } else {
        setPatientTransactions([]);
      }
    } catch {
      setPatientTransactions([]);
    } finally {
      setPatientTransactionsLoading(false);
    }
  };

  const handleDialysisStatusChange = async (sessionId: string, newStatus: string) => {
    if (!API_BASE_URL) return;
    try {
      setDialysisStatusUpdatingId(sessionId);
      await axios.put(
        `${API_BASE_URL}/hospital/dialysis-session/${sessionId}`,
        { status: newStatus }
      );
      setDialysisSessions((prev) =>
        prev.map((s) => (s._id === sessionId ? { ...s, status: newStatus } : s))
      );
    } catch {
      // Optionally show toast; keep list unchanged
    } finally {
      setDialysisStatusUpdatingId(null);
    }
  };

  const formatAadhar = (aadhar?: string): string => {
    if (!aadhar) return "N/A";
    // Format as XXXX XXXX XXXX
    return aadhar.replace(/(\d{4})(\d{4})(\d{4})/, "$1 $2 $3");
  };

  const getDocumentName = (url: string): string => {
    const fileName = url.split("/").pop() || "";
    return fileName.replace(/\.[^/.]+$/, "") || "Document";
  };

  const getDocumentType = (url: string): string => {
    const extension = url.split(".").pop()?.toUpperCase() || "";
    return extension === "PDF" ? "PDF" : extension === "JPG" || extension === "PNG" ? "Image" : extension;
  };


  const appointmentColumns = [
    {
      title: "Case ID",
      dataIndex: "Case_ID",
      sorter: false,
      showSorterTooltip: false,
      render: (text: string) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Appointment date",
      dataIndex: "Date_Time",
      sorter: false,
      showSorterTooltip: false,
      render: (text: string) => {
        const parts = text.split(" - ");
        const date = parts[0] || "";
        const time = parts[1] || "";
        return (
          <div>
            <div className="text-dark">{date}</div>
            <div className="text-dark fs-13">{time}</div>
          </div>
        );
      },
    },
    {
      title: "Doctor",
      dataIndex: "Doctor",
      sorter: false,
      showSorterTooltip: false,
      render: (text: any, record: any) => (
        <div className="d-flex align-items-center">
          <div>
            <h6 className="fs-14 mb-1 text-truncate">
             
                {text}
          
            </h6>
            <p className="mb-0 fs-13 text-truncate text-dark">{record.role}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Mode",
      dataIndex: "Mode",
      sorter: false,
      showSorterTooltip: false,
      render: (text: string) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Status",
      dataIndex: "Status",
      sorter: false,
      showSorterTooltip: false,
      render: (text: string) => (
        <span
          className={`fs-13 badge ${
            text === "Checked Out"
              ? "badge-soft-info text-info"
              : text === "Checked In"
              ? "badge-soft-warning text-warning"
              : text === "Cancelled"
              ? "badge-soft-danger text-danger"
              : text === "Schedule"
              ? "badge-soft-primary text-primary"
              : "badge-soft-success text-success"
          }  rounded  fw-medium`}
        >
          {text}
        </span>
      ),
    },
    {
      title: "",
      sorter: false,
      showSorterTooltip: false,
      render: (text: any, record: any) => (
        <div className="d-flex align-items-center gap-2">
          <Link 
            href="#" 
            className="text-primary"
            onClick={(e) => {
              e.stopPropagation();
              // Handle edit action
            }}
          >
            <i className="ti ti-edit fs-16" />
          </Link>
          <Link
            href="#"
            className="text-danger"
            onClick={(e) => {
              e.stopPropagation();
              // Handle delete action - trigger modal using hidden button
              const triggerButton = document.querySelector('#delete_modal_trigger') as HTMLElement;
              if (triggerButton) {
                triggerButton.click();
              }
            }}
          >
            <i className="ti ti-x fs-16" />
          </Link>
        </div>
      ),
    },
  ];

  const handleCreateCase = () => {
    if (!patient) return;

    const phone = patient?.phone ?? "";
    const title = patient?.title ?? "";
    const name = patient?.name ?? "";

    const params = new URLSearchParams({
      phone,
      title,
      name,
      center: "JJM",
    });

    window.open(
      `https://lab.jjmhospitalkashipur.com/new-appointment?${params.toString()}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handlePathlabCaseRowClick = (pathlabCase: IPathlabCase) => {
    const reportId = pathlabCase?._id ?? "";
    if (!reportId) return;
    window.open(
      `https://lab.jjmhospitalkashipur.com/reports/view-report/${reportId}`,
      "_blank",
      "noopener,noreferrer"
    );
  };
  return (
    <>
      {/* Hidden buttons to trigger modals/offcanvas */}
      <button
        id="view_details_trigger"
        data-bs-toggle="offcanvas"
        data-bs-target="#view_details"
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      <button
        id="delete_modal_trigger"
        data-bs-toggle="modal"
        data-bs-target="#delete_modal"
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          {/* page header start */}
          <div className="mb-4">
            <h6 className="fw-bold mb-0 d-flex align-items-center">
              <Link href={all_routes.patients} className="text-dark">
                <i className="ti ti-chevron-left me-1" />
                Patients
              </Link>
            </h6>
          </div>
          {/* page header end */}
          {/* card start */}
          <div className="card">
            <div className="row align-items-end">
              <div className="col-xl-9 col-lg-8">
                <div className="d-sm-flex align-items-center p-3">
                  <div>
                    <p className="text-dark mb-1">{loading ? "Loading..." : patient?.mrd || "N/A"}</p>
                    <h5 className="mb-1 d-flex align-items-center flex-wrap gap-2">
                      <Link href="#" className="fw-bold text-dark">
                        {loading ? "Loading..." : patient ? `${patient.title} ${patient.name}` : "Patient not found"}
                      </Link>
                      {!loading && patient?.isMRPatient ? (
                        <span className="badge badge-soft-primary border border-primary text-primary fs-12 fw-semibold px-2 py-1 rounded-2">
                          MR
                        </span>
                      ) : null}
                    </h5>
                    {!loading &&
                    patient?.isMRPatient &&
                    (patient.companyName?.trim() || patient.division?.trim()) ? (
                      <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                        {patient.companyName?.trim() ? (
                          <span className="badge badge-soft-secondary border border-secondary text-secondary fs-12 fw-medium px-2 py-1 rounded-2">
                            {patient.companyName.trim()}
                          </span>
                        ) : null}
                        {patient.division?.trim() ? (
                          <span className="badge badge-soft-secondary border border-secondary text-secondary fs-12 fw-medium px-2 py-1 rounded-2">
                            Division · {patient.division.trim()}
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {patient?.address && <p className="mb-3 text-dark">{patient.address}</p>}
                    <div className="d-flex align-items-center flex-wrap">
                      <p className="mb-0 d-inline-flex align-items-center">
                        <i className="ti ti-phone me-1 text-dark" />
                        <span className="text-dark">Phone :</span>
                        <span className="text-dark ms-1">{loading ? "Loading..." : patient?.phone || "N/A"}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-4">
                <div className="p-3 text-lg-end">
                  {/* <div className="mb-4">
                    <Link
                      href="#"
                      className="btn btn-outline-white shadow-sm rounded-circle d-inline-flex align-items-center p-2 fs-14 me-2"
                    >
                      <i className="ti ti-phone" />
                    </Link>
                    <Link
                      href="#"
                      className="btn btn-outline-white shadow-sm rounded-circle d-inline-flex align-items-center p-2 fs-14 me-2"
                    >
                      <i className="ti ti-message-circle" />
                    </Link>
                    <Link
                      href="#"
                      className="btn btn-outline-white shadow-sm rounded-circle d-inline-flex align-items-center p-2 fs-14"
                    >
                      <i className="ti ti-video" />
                    </Link> 
                   </div> */}
                <div className="d-flex justify-content-lg-end align-items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={handleCreateCase}
                    disabled={loading || !patient}
                    aria-label="Create Pathlab Case"
                  >
                    <i className="ti ti-plus me-1" />
                    Create Case
                  </button>

                  <Link
                    href={`${all_routes.dialysisAppointment}?patientId=${patientId ?? ""}`}
                    className="btn btn-primary"
                  >
                    <i className="ti ti-droplet me-1" />
                    Dialysis
                  </Link>
                </div>
                </div>
              </div>
            </div>
          </div>
          {/* card end */}
          {/* row start */}
          <div className="row">
            <div className="col-xl-5 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header">
                  <h5 className="fw-bold mb-0 text-dark">
                    <i className="ti ti-user-star me-1" />
                    About
                  </h5>
                </div>
                <div className="card-body pb-0">
                  <div className="row g-2">
                    <div className="col-sm-6">
                      <div className="d-flex align-items-center mb-3">
                        <span className="avatar rounded-circle bg-light text-dark flex-shrink-0 me-1" style={{ width: '32px', height: '32px' }}>
                          <i className={`ti ti-gender-${patient?.gender?.toLowerCase() === 'male' ? 'male' : patient?.gender?.toLowerCase() === 'female' ? 'female' : 'gender-male'} fs-14`} />
                        </span>
                        <div className="flex-grow-1">
                          <h6 className="fs-13 fw-bold mb-1 text-dark">Gender</h6>
                          <p className="mb-0 text-dark">{patient?.gender || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-sm-6">
                      <div className="d-flex align-items-center mb-3">
                        <span className="avatar rounded-circle bg-light text-dark flex-shrink-0 me-1" style={{ width: '32px', height: '32px' }}>
                          <i className="ti ti-mail fs-14" />
                        </span>
                        <div className="flex-grow-1">
                          <h6 className="fs-13 fw-bold mb-1 text-dark">Email Address</h6>
                          <p className="mb-0 text-break text-dark">{patient?.email || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                    {patient?.dob && (
                      <div className="col-sm-6">
                        <div className="d-flex align-items-center mb-3">
                          <span className="avatar rounded-circle bg-light text-dark flex-shrink-0 me-1" style={{ width: '32px', height: '32px' }}>
                            <i className="ti ti-calendar-event fs-14" />
                          </span>
                          <div className="flex-grow-1">
                            <h6 className="fs-13 fw-bold mb-1 text-dark">DOB</h6>
                            <p className="mb-0 text-dark">{dayjs(patient.dob).format("DD MMM YYYY")}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="col-sm-6">
                      <div className="d-flex align-items-center mb-3">
                        <span className="avatar rounded-circle bg-light text-dark flex-shrink-0 me-1" style={{ width: '32px', height: '32px' }}>
                          <i className="ti ti-calendar fs-14" />
                        </span>
                        <div className="flex-grow-1">
                          <h6 className="fs-13 fw-bold mb-1 text-dark">Age</h6>
                          <p className="mb-0 text-nowrap text-dark">
                            {patient?.age != null
                              ? patient.age === 0
                                ? (patient.months != null && patient.months > 0
                                    ? `${patient.months} Months`
                                    : patient.days != null
                                      ? `${patient.days} Days`
                                      : "0 Years")
                                : `${patient.age} Years`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                    {patient?.aadharNo && (
                      <div className="col-sm-6">
                        <div className="d-flex align-items-center mb-3">
                          <span className="avatar rounded-circle bg-light text-dark flex-shrink-0 me-1" style={{ width: '32px', height: '32px' }}>
                            <i className="ti ti-id fs-14" />
                          </span>
                          <div className="flex-grow-1">
                            <h6 className="fs-13 fw-bold mb-1 text-dark">Aadhaar Number</h6>
                            <p className="mb-0 text-dark">{formatAadhar(patient.aadharNo)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {patient?.bloodGroup && (
                      <div className="col-sm-6">
                        <div className="d-flex align-items-center mb-3">
                          <span className="avatar rounded-circle bg-light text-dark flex-shrink-0 me-1" style={{ width: '32px', height: '32px' }}>
                            <i className="ti ti-droplet fs-14" />
                          </span>
                          <div className="flex-grow-1">
                            <h6 className="fs-13 fw-bold mb-1 text-dark">Blood Group</h6>
                            <p className="mb-0 text-dark">{patient.bloodGroup}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    {patient?.emergencyContacts && patient.emergencyContacts.length > 0 && (
                      <div className="col-sm-12 border-top pt-3 mt-2">
                        <h6 className="fs-14 fw-bold  text-dark">Emergency Contact</h6>
                        <div className="d-flex py-2 align-items-center">
                          <span className="avatar rounded-circle bg-light text-dark flex-shrink-0 me-2" style={{ width: '32px', height: '32px' }}>
                            <i className="ti ti-user fs-14" />
                          </span>
                          <div className="flex-grow-1  d-flex align-items-center justify-content-between">
                            <span className="text-dark fw-medium">{patient.emergencyContacts[0].name}</span>
                            <span className="text-dark fw-medium">{patient.emergencyContacts[0].number}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-7 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header">
                  <h5 className="fw-bold mb-0 text-dark">
                    <i className="ti ti-files me-1" />
                    Documents
                  </h5>
                </div>
                <div className="card-body pb-0">
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th className="text-dark">Document Name</th>
                          <th className="text-dark">Type</th>
                          <th className="text-dark">Upload Date</th>
                          <th className="text-dark">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {patient?.aadharS3Url && (
                          <tr>
                            <td>
                              <div className="d-flex align-items-center">
                                <span className="avatar rounded-circle bg-light text-dark flex-shrink-0 me-2">
                                  <i className="ti ti-file-text fs-16" />
                                </span>
                                <span className="fw-semibold text-dark">Aadhaar Card</span>
                              </div>
                            </td>
                            <td className="text-dark">{getDocumentType(patient.aadharS3Url)}</td>
                            <td className="text-dark">{patient.createdAt ? dayjs(patient.createdAt).format("DD MMM YYYY") : "N/A"}</td>
                            <td>
                              <Link href={patient.aadharS3Url} target="_blank" className="text-primary me-2">
                                <i className="ti ti-download fs-16" />
                              </Link>
                            </td>
                          </tr>
                        )}
                        {patient?.otherDocsS3Urls && patient.otherDocsS3Urls.length > 0 ? (
                          patient.otherDocsS3Urls.map((url, index) => (
                            <tr key={index}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <span className="avatar rounded-circle bg-light text-dark flex-shrink-0 me-2">
                                    <i className="ti ti-file-text fs-16" />
                                  </span>
                                  <span className="fw-semibold text-dark">{getDocumentName(url)}</span>
                                </div>
                              </td>
                              <td className="text-dark">{getDocumentType(url)}</td>
                              <td className="text-dark">{patient.createdAt ? dayjs(patient.createdAt).format("DD MMM YYYY") : "N/A"}</td>
                              <td>
                                <Link href={url} target="_blank" className="text-primary me-2">
                                  <i className="ti ti-download fs-16" />
                                </Link>
                              </td>
                            </tr>
                          ))
                        ) : (
                          !patient?.aadharS3Url && (
                            <tr>
                              <td colSpan={4} className="text-center text-dark py-4">
                                No documents available
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* row end */}
          {/* tab start */}
          <ul className="nav nav-tabs nav-bordered mb-3">
            <li className="nav-item">
              <Link
                href="#appointments"
                data-bs-toggle="tab"
                aria-expanded="false"
                className="nav-link active bg-transparent"
              >
                <span>Appointments</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="#transactions"
                data-bs-toggle="tab"
                aria-expanded="true"
                className="nav-link bg-transparent"
              >
                <span>Transactions</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="#dialysis"
                data-bs-toggle="tab"
                aria-expanded="false"
                className="nav-link bg-transparent"
              >
                <span>Dialysis</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link
                href="#pathlab-cases"
                data-bs-toggle="tab"
                aria-expanded="false"
                className="nav-link bg-transparent"
              >
                <span>Pathlab Cases</span>
              </Link>
            </li>
          </ul>
          {/* tab end */}
          {/* tab content start */}
          <div className="tab-content">
            <div className="tab-pane show active" id="appointments">
              {/*  Start Filter */}
              <div className="d-none align-items-center justify-content-between flex-wrap">
                <div className="d-flex align-items-center gap-2">
                  {/* Search / date filters removed for Appointments tab */}
                </div>
                <div className="d-flex table-dropdown mb-3 right-content align-items-center flex-wrap row-gap-3">
                  <div className="dropdown me-2">
                    <Link
                      href="#"
                      className="bg-white border rounded btn btn-md text-dark fs-14 py-1 align-items-center d-flex fw-normal"
                      data-bs-toggle="dropdown"
                      data-bs-auto-close="outside"
                    >
                      <i className="ti ti-filter text-gray-5 me-1" />
                      Filters
                    </Link>
                    <div className="dropdown-menu dropdown-lg dropdown-menu-end filter-dropdown p-0">
                      <div className="d-flex align-items-center justify-content-between border-bottom filter-header">
                        <h4 className="mb-0 fw-bold">Filter</h4>
                        <div className="d-flex align-items-center">
                          <Link
                            href="#"
                            className="link-danger text-decoration-underline"
                          >
                            Clear All
                          </Link>
                        </div>
                      </div>
                      <form action="#">
                        <div className="filter-body pb-0">
                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <label className="form-label">Doctor</label>
                              <Link href="#" className="link-primary mb-1">
                                Reset
                              </Link>
                            </div>
                            <div className="dropdown">
                              <Link
                                href="#"
                                className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select{" "}
                                <i className="ti ti-chevron-down ms-auto" />
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="mb-3">
                                  <div className="input-icon-start input-icon position-relative">
                                    <span className="input-icon-addon fs-12">
                                      <i className="ti ti-search" />
                                    </span>
                                    <input
                                      type="text"
                                      className="form-control form-control-md"
                                      placeholder="Search"
                                    />
                                  </div>
                                </div>
                                <ul className="mb-3">
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Dr. Mick Thompson
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Dr. Sarah Johnson
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Dr. Emily Carter
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Dr. David Lee
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Dr. Anna Kim
                                    </label>
                                  </li>
                                </ul>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <Link
                                      href="#"
                                      className="btn btn-outline-white w-100 close-filter"
                                    >
                                      Cancel
                                    </Link>
                                  </div>
                                  <div className="col-6">
                                    <Link
                                      href="#"
                                      className="btn btn-primary w-100"
                                    >
                                      Select
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <label className="form-label">Designation</label>
                              <Link href="#" className="link-primary mb-1">
                                Reset
                              </Link>
                            </div>
                            <div className="dropdown">
                              <Link
                                href="#"
                                className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select{" "}
                                <i className="ti ti-chevron-down ms-auto" />
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="mb-3">
                                  <div className="input-icon-start input-icon position-relative">
                                    <span className="input-icon-addon fs-12">
                                      <i className="ti ti-search" />
                                    </span>
                                    <input
                                      type="text"
                                      className="form-control form-control-md"
                                      placeholder="Search"
                                    />
                                  </div>
                                </div>
                                <ul className="mb-3">
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Cardiologist
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Orthopedic Surgeon
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Pediatrician
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Gynecologist
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Psychiatrist
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Neurosurgeon
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Oncologist
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Pulmonologist
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Urologist
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Dermatologist
                                    </label>
                                  </li>
                                </ul>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <Link
                                      href="#"
                                      className="btn btn-outline-white w-100 close-filter"
                                    >
                                      Cancel
                                    </Link>
                                  </div>
                                  <div className="col-6">
                                    <Link
                                      href="#"
                                      className="btn btn-primary w-100"
                                    >
                                      Select
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <label className="form-label">Mode</label>
                              <Link href="#" className="link-primary mb-1">
                                Reset
                              </Link>
                            </div>
                            <div className="dropdown">
                              <Link
                                href="#"
                                className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select{" "}
                                <i className="ti ti-chevron-down ms-auto" />
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="mb-3">
                                  <div className="input-icon-start input-icon position-relative">
                                    <span className="input-icon-addon fs-12">
                                      <i className="ti ti-search" />
                                    </span>
                                    <input
                                      type="text"
                                      className="form-control form-control-md"
                                      placeholder="Search"
                                    />
                                  </div>
                                </div>
                                <ul className="mb-3">
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      In Person
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Online
                                    </label>
                                  </li>
                                </ul>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <Link
                                      href="#"
                                      className="btn btn-outline-white w-100 close-filter"
                                    >
                                      Cancel
                                    </Link>
                                  </div>
                                  <div className="col-6">
                                    <Link
                                      href="#"
                                      className="btn btn-primary w-100"
                                    >
                                      Select
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Date filter removed */}
                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <label className="form-label">Status</label>
                              <Link href="#" className="link-primary mb-1">
                                Reset
                              </Link>
                            </div>
                            <div className="dropdown">
                              <Link
                                href="#"
                                className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select{" "}
                                <i className="ti ti-chevron-down ms-auto" />
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="mb-3">
                                  <div className="input-icon-start input-icon position-relative">
                                    <span className="input-icon-addon fs-12">
                                      <i className="ti ti-search" />
                                    </span>
                                    <input
                                      type="text"
                                      className="form-control form-control-md"
                                      placeholder="Search"
                                    />
                                  </div>
                                </div>
                                <ul className="mb-3">
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Checked Out
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Checked In
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Cancelled
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Schedule
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Confirmed
                                    </label>
                                  </li>
                                </ul>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <Link
                                      href="#"
                                      className="btn btn-outline-white w-100 close-filter"
                                    >
                                      Cancel
                                    </Link>
                                  </div>
                                  <div className="col-6">
                                    <Link
                                      href="#"
                                      className="btn btn-primary w-100"
                                    >
                                      Select
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="filter-footer d-flex align-items-center justify-content-end border-top">
                          <Link
                            href="#"
                            className="btn btn-light btn-md me-2 fw-medium close-filter"
                          >
                            Close
                          </Link>
                          <button
                            type="submit"
                            className="btn btn-primary btn-md fw-medium"
                          >
                            Filter
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              {/*  End Filter */}
              {/*  Start Table */}
              <div className="table-responsive">
                {appointmentsLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <Datatable
                    columns={appointmentColumns}
                    dataSource={appointments}
                    Selection={false}
                    searchText=""
                  />
                )}
              </div>
              {/*  End Table */}
            </div>
            <div className="tab-pane" id="transactions">
              {/*  Start Filter */}
              <div className="d-none align-items-center justify-content-between flex-wrap">
                <div className="d-flex align-items-center gap-2">
                  {/* Search / date filters removed for Transactions tab */}
                </div>
                <div className="d-flex table-dropdown mb-3 right-content align-items-center flex-wrap row-gap-3">
                  <div className="dropdown me-2">
                    <Link
                      href="#"
                      className="bg-white border rounded btn btn-md text-dark fs-14 py-1 align-items-center d-flex fw-normal"
                      data-bs-toggle="dropdown"
                      data-bs-auto-close="outside"
                    >
                      <i className="ti ti-filter text-gray-5 me-1" />
                      Filters
                    </Link>
                    <div className="dropdown-menu dropdown-lg dropdown-menu-end filter-dropdown p-0">
                      <div className="d-flex align-items-center justify-content-between border-bottom filter-header">
                        <h4 className="mb-0 fw-bold">Filter</h4>
                        <div className="d-flex align-items-center">
                          <Link
                            href="#"
                            className="link-danger text-decoration-underline"
                          >
                            Clear All
                          </Link>
                        </div>
                      </div>
                      <form action="#">
                        <div className="filter-body pb-0">
                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <label className="form-label">
                                Transaction ID
                              </label>
                              <Link href="#" className="link-primary mb-1">
                                Reset
                              </Link>
                            </div>
                            <div className="dropdown">
                              <Link
                                href="#"
                                className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select{" "}
                                <i className="ti ti-chevron-down ms-auto" />
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="mb-3">
                                  <div className="input-icon-start input-icon position-relative">
                                    <span className="input-icon-addon fs-12">
                                      <i className="ti ti-search" />
                                    </span>
                                    <input
                                      type="text"
                                      className="form-control form-control-md"
                                      placeholder="Search"
                                    />
                                  </div>
                                </div>
                                <ul className="mb-3">
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      #TNX0025
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      #TNX0024
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      #TNX0023
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      #TNX0022
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      #TNX0021
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      #TNX0020
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      #TNX0019
                                    </label>
                                  </li>
                                </ul>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <Link
                                      href="#"
                                      className="btn btn-outline-white w-100 close-filter"
                                    >
                                      Cancel
                                    </Link>
                                  </div>
                                  <div className="col-6">
                                    <Link
                                      href="#"
                                      className="btn btn-primary w-100"
                                    >
                                      Select
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <label className="form-label">Description</label>
                              <Link href="#" className="link-primary mb-1">
                                Reset
                              </Link>
                            </div>
                            <div className="dropdown">
                              <Link
                                href="#"
                                className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select{" "}
                                <i className="ti ti-chevron-down ms-auto" />
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="mb-3">
                                  <div className="input-icon-start input-icon position-relative">
                                    <span className="input-icon-addon fs-12">
                                      <i className="ti ti-search" />
                                    </span>
                                    <input
                                      type="text"
                                      className="form-control form-control-md"
                                      placeholder="Search"
                                    />
                                  </div>
                                </div>
                                <ul className="mb-3">
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      General Consultation
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Dental Cleaning
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Eye Checkup
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      X-Ray
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Physiotherapy Session
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Cardiac Screening
                                    </label>
                                  </li>
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Skin Allergy Test
                                    </label>
                                  </li>
                                </ul>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <Link
                                      href="#"
                                      className="btn btn-outline-white w-100 close-filter"
                                    >
                                      Cancel
                                    </Link>
                                  </div>
                                  <div className="col-6">
                                    <Link
                                      href="#"
                                      className="btn btn-primary w-100"
                                    >
                                      Select
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="form-label mb-1 text-dark fs-14 fw-medium">
                              Date<span className="text-danger">*</span>
                            </label>
                            <div className="input-icon-end position-relative">
                              <input
                                type="text"
                                className="form-control datetimepicker"
                                placeholder="dd/mm/yyyy"
                              />
                              <span className="input-icon-addon">
                                <i className="ti ti-calendar" />
                              </span>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <label className="form-label">
                                Payment Method
                              </label>
                              <Link href="#" className="link-primary mb-1">
                                Reset
                              </Link>
                            </div>
                            <div className="dropdown">
                              <Link
                                href="#"
                                className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select{" "}
                                <i className="ti ti-chevron-down ms-auto" />
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="mb-3">
                                  <div className="input-icon-start input-icon position-relative">
                                    <span className="input-icon-addon fs-12">
                                      <i className="ti ti-search" />
                                    </span>
                                    <input
                                      type="text"
                                      className="form-control form-control-md"
                                      placeholder="Search"
                                    />
                                  </div>
                                </div>
                                <ul className="mb-3">
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      PayPal
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Debit Card
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Cheque
                                    </label>
                                  </li>
                                </ul>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <Link
                                      href="#"
                                      className="btn btn-outline-white w-100 close-filter"
                                    >
                                      Cancel
                                    </Link>
                                  </div>
                                  <div className="col-6">
                                    <Link
                                      href="#"
                                      className="btn btn-primary w-100"
                                    >
                                      Select
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <label className="form-label">Amount</label>
                            <div className="dropdown">
                              <Link
                                href="#"
                                className="dropdown-toggle form-control"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="filter-range">
                                  <input type="text" id="range_03" />
                                  <p>
                                    Range :
                                    <span className="text-gray-9">
                                      $200 - $5695
                                    </span>
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mb-3">
                            <div className="d-flex align-items-center justify-content-between">
                              <label className="form-label">Status</label>
                              <Link href="#" className="link-primary mb-1">
                                Reset
                              </Link>
                            </div>
                            <div className="dropdown">
                              <Link
                                href="#"
                                className="dropdown-toggle btn bg-white  d-flex align-items-center justify-content-start fs-13 p-2 fw-normal border"
                                data-bs-toggle="dropdown"
                                data-bs-auto-close="outside"
                                aria-expanded="true"
                              >
                                Select{" "}
                                <i className="ti ti-chevron-down ms-auto" />
                              </Link>
                              <div className="dropdown-menu shadow-lg w-100 dropdown-info p-3">
                                <div className="mb-3">
                                  <div className="input-icon-start input-icon position-relative">
                                    <span className="input-icon-addon fs-12">
                                      <i className="ti ti-search" />
                                    </span>
                                    <input
                                      type="text"
                                      className="form-control form-control-md"
                                      placeholder="Search"
                                    />
                                  </div>
                                </div>
                                <ul className="mb-3">
                                  <li className="mb-1">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Completed
                                    </label>
                                  </li>
                                  <li className="mb-0">
                                    <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                      <input
                                        className="form-check-input m-0 me-2"
                                        type="checkbox"
                                      />
                                      Pending
                                    </label>
                                  </li>
                                </ul>
                                <div className="row g-2">
                                  <div className="col-6">
                                    <Link
                                      href="#"
                                      className="btn btn-outline-white w-100 filter-close"
                                    >
                                      Cancel
                                    </Link>
                                  </div>
                                  <div className="col-6">
                                    <Link
                                      href="#"
                                      className="btn btn-primary w-100"
                                    >
                                      Select
                                    </Link>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="filter-footer d-flex align-items-center justify-content-end border-top">
                          <Link
                            href="#"
                            className="btn btn-light btn-md me-2 fw-medium close-filter"
                          >
                            Close
                          </Link>
                          <button
                            type="submit"
                            className="btn btn-primary btn-md fw-medium"
                          >
                            Filter
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
              {/*  End Filter */}
              {/*  Start Table */}
              <div className="table-responsive">
                {patientTransactionsLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : patientTransactions.length === 0 ? (
                  <p className="text-muted mb-0 py-4">No transactions found.</p>
                ) : (
                  <table className="table table-nowrap datatable">
                    <thead className="thead-light">
                      <tr>
                        <th className="no-sort">Transaction ID</th>
                        <th>Description</th>
                        <th>Paid Date</th>
                        <th>Payment Method</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patientTransactions.map((txn) => (
                        <tr key={txn._id}>
                          <td>
                            <span className="text-dark fw-medium">{txn.transactionId ?? "—"}</span>
                          </td>
                          <td className="text-dark">{txn.transactionType ?? "—"}</td>
                          <td className="text-dark">
                            {txn.transactionDate
                              ? dayjs(txn.transactionDate).format("DD MMM YYYY")
                              : txn.createdAt
                              ? dayjs(txn.createdAt).format("DD MMM YYYY")
                              : "—"}
                          </td>
                          <td className="text-dark">{txn.paymentMode ?? "—"}</td>
                          <td className="text-dark fw-medium">
                            ₹{(txn.amount ?? 0).toFixed(2)}
                          </td>
                          <td>
                            <span className="badge fs-13 badge-soft-success rounded text-success fw-medium border border-success">
                              Completed
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              {/*  End Table */}
            </div>
            <div className="tab-pane" id="dialysis">
              <div className="table-responsive">
                {dialysisLoading ? (
                  <p className="text-muted mb-0">Loading dialysis sessions…</p>
                ) : dialysisSessions.length === 0 ? (
                  <p className="text-muted mb-0">No dialysis sessions found.</p>
                ) : (
                  <table className="table table-nowrap table-hover">
                    <thead className="thead-light">
                      <tr>
                        <th className="no-sort">Session ID</th>
                        <th>Date</th>
                        <th>Actual Weight Loss (kg)</th>
                        <th>Post HD Weight (kg)</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dialysisSessions.map((session) => (
                        <tr
                          key={session._id}
                          role="button"
                          tabIndex={0}
                          className="cursor-pointer"
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            router.push(
                              `${all_routes.dialysisAppointment}?patientId=${patientId ?? ""}&sessionId=${session._id}`
                            )
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              router.push(
                                `${all_routes.dialysisAppointment}?patientId=${patientId ?? ""}&sessionId=${session._id}`
                              );
                            }
                          }}
                        >
                          <td>
                            <span className="text-dark fw-medium">
                              {session.sessionId ?? "—"}
                            </span>
                          </td>
                          <td className="text-dark">
                            {session.createdAt
                              ? dayjs(session.createdAt).format("DD MMM YYYY, HH:mm")
                              : "—"}
                          </td>
                          <td className="text-dark">
                            {session.generalInformation?.actualWeightLoss ?? "—"}
                          </td>
                          <td className="text-dark">
                            {session.generalInformation?.postHdWeightToday ?? "—"}
                          </td>
                          <td onClick={(e) => e.stopPropagation()}>
                            <select
                              className={`form-select form-select-sm ${session.status === "Completed" ? "text-success" : "text-warning"}`}
                              style={{ width: "auto", minWidth: "7rem" }}
                              value={session.status ?? ""}
                              disabled={dialysisStatusUpdatingId === session._id}
                              onChange={(e) =>
                                handleDialysisStatusChange(session._id, e.target.value)
                              }
                              aria-label="Update status"
                            >
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <div className="tab-pane" id="pathlab-cases">
              <div className="table-responsive">
                {!patient?.pathlabCases?.length ? (
                  <p className="text-muted mb-0">No pathlab cases found.</p>
                ) : (
                  <table className="table table-nowrap table-hover">
                    <thead className="thead-light">
                      <tr>
                        <th className="no-sort">Case ID</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Amount</th>
                        <th>Amount Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {patient.pathlabCases.map((pc) => (
                        <tr
                          key={pc._id}
                          onClick={() => handlePathlabCaseRowClick(pc)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handlePathlabCaseRowClick(pc);
                            }
                          }}
                          role="button"
                          tabIndex={0}
                          aria-label={`Open pathlab report ${pc.caseId ?? "case"}`}
                          className="cursor-pointer"
                        >
                          <td>
                            <span className="text-dark fw-medium">{pc.caseId ?? "—"}</span>
                          </td>
                          <td className="text-dark">{pc.status ?? "—"}</td>
                          <td className="text-dark">
                            {pc.createdAt ? dayjs(pc.createdAt).format("DD MMM YYYY, HH:mm") : "—"}
                          </td>
                          <td className="text-dark">
                            {pc.finalAmount != null ? `₹${pc.finalAmount.toFixed(2)}` : pc.totalAmount != null ? `₹${pc.totalAmount.toFixed(2)}` : "—"}
                          </td>
                          <td>
                            <span
                              className={`badge fs-13 py-1 rounded fw-medium ${
                                pc.amountStatus === "Paid"
                                  ? "badge-soft-success text-success"
                                  : "badge-soft-warning text-warning"
                              }`}
                            >
                              {pc.amountStatus ?? "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
          {/* tab content end */}
        </div>
        {/* End Content */}
        {/* Footer Start */}
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
            <Link href="#" className="link-primary">
              Preclinic
            </Link>
            , All Rights Reserved
          </p>
        </div>
        {/* Footer End */}
      </div>
      {/* ========================
			End Page Content
		========================= */}
      <Modals />
    </>
  );
};

export default PatientDetailsComponent;
