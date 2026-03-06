"use client";


import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect } from "react";
import PredefinedDatePicker from "@/core/common/datePicker";
import SearchInput from "@/core/common/dataTable/dataTableSearch";
import Datatable from "@/core/common/dataTable";
import Modals from "./modals/modals";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import dayjs from "dayjs";

interface IPatient {
  _id: string;
  mrd: string;
  title: string;
  name: string;
  phone: string;
  email: string;
  age: number;
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
  [key: string]: any;
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

const PatientDetailsComponent = () => {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const [searchText, setSearchText] = useState<string>("");
  const [patient, setPatient] = useState<IPatient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [appointments, setAppointments] = useState<IAppointment[]>([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState<boolean>(false);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  useEffect(() => {
    if (patientId) {
      fetchPatientDetails();
      fetchAppointments();
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

  const fetchAppointments = async () => {
    try {
      if (!patientId || !API_BASE_URL) {
        return;
      }

      setAppointmentsLoading(true);
      const response = await axios.get(`${API_BASE_URL}/hospital/visits/patient/${patientId}`);

      if (response.data?.code === 200 && response.data?.data?.visits) {
        const visits: IVisit[] = response.data.data.visits;
        
        // Fetch doctor details for each visit
        const transformedAppointments = await Promise.all(
          visits.map(async (visit) => {
            let doctor: IDoctor | null = null;

            try {
              const doctorResponse = await axios.get(`${API_BASE_URL}/hospital/doctors/${visit.doctorId}`);
              if (doctorResponse.data?.code === 200 && doctorResponse.data?.data?.doctor) {
                doctor = {
                  _id: doctorResponse.data.data.doctor._id,
                  name: doctorResponse.data.data.doctor.name,
                  designation: doctorResponse.data.data.doctor.designation,
                };
              }
            } catch (err) {
              console.error(`Error fetching doctor ${visit.doctorId}:`, err);
            }

            // Format date and time
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
          })
        );

        setAppointments(transformedAppointments);
      } else {
        setAppointments([]);
      }
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      setAppointments([]);
    } finally {
      setAppointmentsLoading(false);
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
              <Link href={all_routes.doctordetails} className="fw-semibold text-dark">
                {text}
              </Link>
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

  const handleRowClick = (record: any) => {
    // Trigger view action on row click using hidden button
    const triggerButton = document.querySelector('#view_details_trigger') as HTMLElement;
    if (triggerButton) {
      triggerButton.click();
    }
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
                    <h5 className="mb-1">
                      <Link href="#" className="fw-bold text-dark">
                        {loading ? "Loading..." : patient ? `${patient.title} ${patient.name}` : "Patient not found"}
                      </Link>
                    </h5>
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
                  <Link
                    href={all_routes.dialysisAppointment}
                    className="btn btn-primary"
                  >
                    <i className="ti ti-droplet me-1" />
                    Dialysis
                  </Link>
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
                          <p className="mb-0 text-nowrap text-dark">{patient?.age ? `${patient.age} Years` : "N/A"}</p>
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
          </ul>
          {/* tab end */}
          {/* tab content start */}
          <div className="tab-content">
            <div className="tab-pane show active" id="appointments">
              {/*  Start Filter */}
              <div className=" d-flex align-items-center justify-content-between flex-wrap">
                <div className="d-flex align-items-center gap-2">
                  <div className="search-set mb-3">
                    <div className="d-flex align-items-center flex-wrap gap-2">
                      <div className="table-search d-flex align-items-center mb-0">
                        <div className="search-input">
                          <SearchInput
                            value={searchText}
                            onChange={handleSearch}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex right-content align-items-center flex-wrap mb-3">
                    <div className="input-icon-start position-relative">
                      <span className="input-icon-addon text-dark">
                        <i className="ti ti-calendar-event" />
                      </span>
                      <PredefinedDatePicker />
                    </div>
                  </div>
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
                          <div className="mb-3">
                            <label className="form-label mb-1 text-dark fs-14 fw-medium">
                              Date<span className="text-danger">*</span>
                            </label>
                            <div className="input-icon-end position-relative">
                              <PredefinedDatePicker />
                              <span className="input-icon-addon">
                                <i className="ti ti-calendar" />
                              </span>
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
                    searchText={searchText}
                    onRowClick={handleRowClick}
                  />
                )}
              </div>
              {/*  End Table */}
            </div>
            <div className="tab-pane" id="transactions">
              {/*  Start Filter */}
              <div className=" d-flex align-items-center justify-content-between flex-wrap">
                <div className="d-flex align-items-center gap-2">
                  <div className="search-set mb-3">
                    <div className="d-flex align-items-center flex-wrap gap-2">
                      <div className="table-search d-flex align-items-center mb-0">
                        <div className="search-input">
                          <SearchInput
                            value={searchText}
                            onChange={handleSearch}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="d-flex right-content align-items-center flex-wrap mb-3">
                    <div className="input-icon-start position-relative">
                      <span className="input-icon-addon text-dark">
                        <i className="ti ti-calendar-event" />
                      </span>
                      <PredefinedDatePicker />
                    </div>
                  </div>
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
                    <tr>
                      <td>
                        <Link href="#">#TNX0025</Link>
                      </td>
                      <td className="text-dark"> General Consultation </td>
                      <td className="text-dark"> 30 Apr 2025</td>
                      <td className="text-dark"> PayPal</td>
                      <td className="text-dark"> $800</td>
                      <td>
                        <span className="badge fs-13 badge-soft-success rounded text-success fw-medium border border-success">
                          Completed
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link href="#">#TNX0024</Link>
                      </td>
                      <td className="text-dark">Dental Cleaning</td>
                      <td className="text-dark"> 15 Apr 2025</td>
                      <td className="text-dark"> Debit Card </td>
                      <td className="text-dark"> $930</td>
                      <td>
                        <span className="badge fs-13 badge-soft-info rounded text-info fw-medium border border-info">
                          Pending
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link href="#">#TNX0023</Link>
                      </td>
                      <td className="text-dark"> Eye Checkup </td>
                      <td className="text-dark"> 02 Apr 2025 </td>
                      <td className="text-dark"> Cheque </td>
                      <td className="text-dark"> $850</td>
                      <td>
                        <span className="badge fs-13 badge-soft-success rounded text-success fw-medium border border-success">
                          Completed
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link href="#">#TNX0022</Link>
                      </td>
                      <td className="text-dark"> X-Ray </td>
                      <td className="text-dark"> 27 Mar 2025 </td>
                      <td className="text-dark"> Debit Card</td>
                      <td className="text-dark"> $80</td>
                      <td>
                        <span className="badge fs-13 badge-soft-success rounded text-success fw-medium border border-success">
                          Completed
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link href="#">#TNX0021</Link>
                      </td>
                      <td className="text-dark">Physiotherapy Session</td>
                      <td className="text-dark"> 12 Mar 2025</td>
                      <td className="text-dark"> PayPal</td>
                      <td className="text-dark"> $650</td>
                      <td>
                        <span className="badge fs-13 badge-soft-success rounded text-success fw-medium border border-success">
                          Completed
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link href="#">#TNX0020</Link>
                      </td>
                      <td className="text-dark">Cardiac Screening</td>
                      <td className="text-dark"> 05 Mar 2025 </td>
                      <td className="text-dark"> Cheque </td>
                      <td className="text-dark"> $430 </td>
                      <td>
                        <span className="badge fs-13 badge-soft-success rounded text-success fw-medium border border-success">
                          Completed
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link href="#">#TNX0019</Link>
                      </td>
                      <td className="text-dark">Skin Allergy Test</td>
                      <td className="text-dark"> 24 Feb 2025 </td>
                      <td className="text-dark"> Debit Card </td>
                      <td className="text-dark"> $300</td>
                      <td>
                        <span className="badge fs-13 badge-soft-info rounded text-info fw-medium border border-info">
                          Pending
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link href="#">#TNX0018</Link>
                      </td>
                      <td className="text-dark">Blood Test</td>
                      <td className="text-dark"> 16 Feb 2025 </td>
                      <td className="text-dark"> Cheque </td>
                      <td className="text-dark"> $450</td>
                      <td>
                        <span className="badge fs-13 badge-soft-success rounded text-success fw-medium border border-success">
                          Completed
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link href="#">#TNX0017</Link>
                      </td>
                      <td className="text-dark">ENT Consultation</td>
                      <td className="text-dark"> 01 Feb 2025 </td>
                      <td className="text-dark"> Debit Card </td>
                      <td className="fw-semibold text-dark"> $570</td>
                      <td>
                        <span className="badge fs-13 badge-soft-success rounded text-success fw-medium border border-success">
                          completed
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <Link href="#">#TNX0017</Link>
                      </td>
                      <td className="text-dark">Nutrition Counseling</td>
                      <td className="text-dark"> 25 Jan 2025 </td>
                      <td className="text-dark"> PayPal</td>
                      <td className="text-dark"> $800</td>
                      <td>
                        <span className="badge fs-13 badge-soft-success rounded text-success fw-medium border border-success">
                          Completed
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              {/*  End Table */}
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
