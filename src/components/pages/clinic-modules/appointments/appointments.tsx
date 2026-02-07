"use client";


import ImageWithBasePath from "@/core/imageWithBasePath";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect } from "react";
import SearchInput from "@/core/common/dataTable/dataTableSearch";
import Datatable from "@/core/common/dataTable";
import PredefinedDatePicker from "@/core/common/datePicker";
import Modals from "./modals/modals";
import Link from "next/link";
import PrintPrescription from "./printPrescription";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import dayjs from "dayjs";

interface IVisit {
  _id: string;
  visitId: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  visitType: string;
  appointmentType: string;
  reason?: string;
  visitDate: string;
  visitTime: string;
  sessionSlot: string;
  tokenNumber: number;
  price: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface IPatient {
  _id: string;
  name: string;
  phone: string;
  organisationName?: string;
}

interface IDoctor {
  _id: string;
  name: string;
  designation?: string;
}

interface ITransformedAppointment {
  id: string;
  Case_ID: string;
  Token_No: number;
  Date_Time: string;
  Patient: string;
  Phone: string;
  Doctor: string;
  role: string;
  Visit: string;
  Appointment_Type: string;
  Status: string;
  Price: number;
  [key: string]: any;
}

const AppointmentsComponent = () => {
  const [data, setData] = useState<ITransformedAppointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedAppointment, setSelectedAppointment] = useState<ITransformedAppointment | null>(null);
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState<any>(null);
  const [showPrint, setShowPrint] = useState(false);

  const handlePrint = (record: any) => {
    setSelectedAppointment(record);
    setShowPrint(true);
  };

  const handlePrintClose = () => {
    setShowPrint(false);
    setSelectedAppointment(null);
  };

  const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>({});
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (record: ITransformedAppointment, newStatus: string) => {
    const visitId = record.id;
    if (!visitId || !API_BASE_URL) return;

    setStatusUpdatingId(visitId);
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/hospital/visits/${visitId}`,
        { status: newStatus }
      );
      if (response.data?.code === 200 || response.status >= 200) {
        setStatusUpdates((prev) => ({
          ...prev,
          [visitId]: newStatus,
        }));
      } else {
        console.error("Failed to update status:", response.data);
        alert("Failed to update status. Please try again.");
      }
    } catch (err: any) {
      console.error("Error updating visit status:", err);
      alert(err.response?.data?.message || "Failed to update status. Please try again.");
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const getStatusForRecord = (record: any) => {
    return statusUpdates[record.id] || record.Status;
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError("");
      
      if (!API_BASE_URL) {
        console.error("API_BASE_URL is undefined. Check .env.local file.");
        setError("API configuration error");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/hospital/visits`, {
        params: { limit: 20 }
      });

      if (response.data?.code === 200 && response.data?.data?.visits) {
        const visits: IVisit[] = response.data.data.visits;
        
        // Fetch patient and doctor details for each visit
        const transformedData = await Promise.all(
          visits.map(async (visit) => {
            let patient: IPatient | null = null;
            let doctor: IDoctor | null = null;

            try {
              // Fetch patient details
              const patientResponse = await axios.get(`${API_BASE_URL}/hospital/patients/${visit.patientId}`);
              if (patientResponse.data?.code === 200 && patientResponse.data?.data?.patient) {
                patient = {
                  _id: patientResponse.data.data.patient._id,
                  name: patientResponse.data.data.patient.name,
                  phone: patientResponse.data.data.patient.phone || "",
                  organisationName: patientResponse.data.data.patient.organisationName || patientResponse.data.data.patient.organisation_name || "",
                };
              }
            } catch (err) {
              console.error(`Error fetching patient ${visit.patientId}:`, err);
            }

            try {
              // Fetch doctor details
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
              Token_No: visit.tokenNumber || 0,
              Date_Time: dateTime,
              Patient: patient?.name || "Unknown Patient",
              Phone: patient?.phone || "",
              Organisation_name: patient?.organisationName || "",
              Doctor: doctor?.name || "Unknown Doctor",
              role: doctor?.designation || "",
              Visit: visit.visitType || "",
              Appointment_Type: visit.appointmentType || "",
              Status: visit.status || "Scheduled",
              Price: visit.price || 0,
              _visitId: visit.visitId,
              _appointmentId: visit.appointmentId,
              _patientId: visit.patientId,
              _doctorId: visit.doctorId,
              _reason: visit.reason,
              _sessionSlot: visit.sessionSlot,
            } as ITransformedAppointment;
          })
        );

        setData(transformedData);
      } else {
        setError("Failed to fetch appointments");
        console.error("Failed to fetch appointments:", response.data);
      }
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      setError(error.response?.data?.message || "An error occurred while fetching appointments");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Case ID",
      dataIndex: "Case_ID",
      sorter: false,
      showSorterTooltip: false,
      render: (text: string, record: any) => (
        <div>
          <div className="text-dark mb-1">{text}</div>
          <span className="fs-13 badge badge-soft-secondary text-secondary rounded fw-medium">
            Token No: {record.Token_No || "N/A"}
          </span>
        </div>
      ),
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
      title: "Patient",
      dataIndex: "Patient",
      sorter: false,
      showSorterTooltip: false,
      render: (text: any, record: any) => (
        <div className="d-flex align-items-center">
          <Link
            href={`${all_routes.patientDetails}?id=${record._patientId || ""}`}
            className="text-dark fw-semibold"
          >
            {text}
            <span className="text-body fs-13 fw-normal d-block">
              {record.Phone}
            </span>
          </Link>
        </div>
      ),
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
              <Link 
                href={`${all_routes.doctordetails}?id=${record._doctorId || ""}`} 
                className="fw-semibold"
              >
                {text}
              </Link>
            </h6>
            <p className="mb-0 fs-13 text-truncate">{record.role}</p>
          </div>
        </div>
      ),
    },
    {
      title: "Visit",
      dataIndex: "Visit",
      sorter: false,
      showSorterTooltip: false,
      render: (text: any, record: any) => (
        <div>
          <div className="text-dark">{record.Visit || "New"}</div>
          <div className="text-body fs-13 fw-normal">{record.Appointment_Type || record.Mode || "OPD"}</div>
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "Status",
      sorter: false,
      showSorterTooltip: false,
      render: (text: string, record: any) => {
        const currentStatus = getStatusForRecord(record);
        const statusOptions = [
          "Scheduled",
          "In Progress",
          "Completed",
          "Cancelled",
          "No Show",
        ];

        const getStatusClass = (status: string) => {
          switch (status) {
            case "Scheduled":
              return "badge-soft-primary text-primary";
            case "In Progress":
              return "badge-soft-warning text-warning";
            case "Completed":
              return "badge-soft-success text-success";
            case "Cancelled":
              return "badge-soft-danger text-danger";
            case "No Show":
              return "badge-soft-secondary text-secondary";
            default:
              return "badge-soft-secondary text-secondary";
          }
        };

        const isUpdating = statusUpdatingId === record.id;

        return (
          <div className="dropdown" onClick={(e) => e.stopPropagation()}>
            <button
              className={`btn btn-sm fs-13 badge ${getStatusClass(currentStatus)} rounded fw-medium dropdown-toggle`}
              type="button"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              disabled={isUpdating}
            >
              {isUpdating ? "Updating..." : currentStatus}
            </button>
            <ul className="dropdown-menu">
              {statusOptions.map((option) => (
                <li key={option}>
                  <Link
                    className="dropdown-item"
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (isUpdating) return;
                      handleStatusChange(record, option);
                      // Close dropdown by removing show classes
                      const dropdown = e.currentTarget.closest('.dropdown');
                      if (dropdown) {
                        const button = dropdown.querySelector('[data-bs-toggle="dropdown"]') as HTMLElement;
                        const menu = dropdown.querySelector('.dropdown-menu') as HTMLElement;
                        if (button && menu) {
                          button.setAttribute('aria-expanded', 'false');
                          button.classList.remove('show');
                          menu.classList.remove('show');
                        }
                      }
                    }}
                  >
                    {option}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      },
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
            data-bs-toggle="offcanvas"
            data-bs-target="#edit_appointment"
            data-visit-id={record.id}
            onClick={(e) => e.stopPropagation()}
          >
            <i className="ti ti-edit fs-16" />
          </Link>
          <Link
            href="#"
            className="text-success"
            onClick={(e) => {
              e.stopPropagation();
              handlePrint(record);
            }}
            title="Download/Print Prescription"
          >
            <i className="ti ti-download fs-16" />
          </Link>
          <Link
            href="#"
            className="text-danger"
            onClick={(e) => {
              e.stopPropagation();
              const triggerButton = document.querySelector('#cancel_modal_trigger') as HTMLElement;
              if (triggerButton) {
                triggerButton.setAttribute('data-visit-id', record.id);
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
  const [searchText, setSearchText] = useState<string>("");

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleRowClick = async (record: any) => {
    setSelectedAppointment(record);
    
    // Fetch full appointment details
    try {
      if (!API_BASE_URL) {
        console.error("API_BASE_URL is undefined");
        // Still show modal with record data
        setSelectedAppointmentDetails(null);
        const triggerButton = document.querySelector('#view_details_trigger') as HTMLElement;
        if (triggerButton) {
          triggerButton.click();
        }
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/hospital/visits/${record.id}`);
      
      if (response.data?.code === 200 && response.data?.data?.visit) {
        const visit = response.data.data.visit;
        
        // Fetch patient and doctor details
        let patient = null;
        let doctor = null;

        try {
          const patientResponse = await axios.get(`${API_BASE_URL}/hospital/patients/${visit.patientId || record._patientId}`);
          if (patientResponse.data?.code === 200 && patientResponse.data?.data?.patient) {
            patient = patientResponse.data.data.patient;
          }
        } catch (err) {
          console.error("Error fetching patient:", err);
        }

        try {
          const doctorResponse = await axios.get(`${API_BASE_URL}/hospital/doctors/${visit.doctorId || record._doctorId}`);
          if (doctorResponse.data?.code === 200 && doctorResponse.data?.data?.doctor) {
            doctor = doctorResponse.data.data.doctor;
          }
        } catch (err) {
          console.error("Error fetching doctor:", err);
        }

        setSelectedAppointmentDetails({
          visit,
          patient,
          doctor,
        });
      } else {
        // If visit details not found, still show modal with record data
        setSelectedAppointmentDetails(null);
      }
    } catch (error: any) {
      console.error("Error fetching appointment details:", error);
      // Still show modal with record data even if API fails
      setSelectedAppointmentDetails(null);
    }

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
        id="cancel_modal_trigger"
        data-bs-toggle="modal"
        data-bs-target="#cancel_modal"
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          {/* Start Page Header */}
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-semibold mb-0"> Appointment </h4>
            </div>
            <div className="text-end d-flex">
              {/* dropdown*/}
              <div className="dropdown me-1">
                <Link
                  href="#"
                  className="btn btn-md fs-14 fw-normal border bg-white rounded text-dark d-inline-flex align-items-center"
                  data-bs-toggle="dropdown"
                >
                  Export
                  <i className="ti ti-chevron-down ms-2" />
                </Link>
                <ul className="dropdown-menu p-2">
                  <li>
                    <Link className="dropdown-item" href="#">
                      Download as PDF
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" href="#">
                      Download as Excel
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="bg-white border shadow-sm rounded px-1 pb-0 text-center d-flex align-items-center justify-content-center">
                <Link
                  href={all_routes.appointments}
                  className="bg-light rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-list fs-14 text-dark" />
                </Link>
                <Link
                  href={all_routes.appointmentCalendar}
                  className="bg-white rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-calendar-event fs-14 text-body" />
                </Link>
              </div>
              <Link
                href={all_routes.newAppointment}
                className="btn btn-primary ms-2 fs-13 btn-md"
              >
                <i className="ti ti-plus me-1" /> New Appointment
              </Link>
            </div>
          </div>
          {/* End Page Header */}
          {/*  Start Filter */}
          <div className=" d-flex align-items-center justify-content-between flex-wrap">
            <div className="d-flex align-items-center gap-2">
              <div className="search-set mb-3">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <div className="table-search d-flex align-items-center mb-0">
                    <div className="search-input">
                      <SearchInput value={searchText} onChange={handleSearch} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="d-flex right-content align-items-center flex-wrap mb-3">
                <div
                  id="reportrange"
                  className="reportrange-picker d-flex align-items-center"
                >
                  <i className="ti ti-calendar text-gray-5 fs-14 me-1" />
                  <span className="reportrange-picker-field">
                    16 Apr 25 - 16 Apr 25
                  </span>
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
                <div
                  className="dropdown-menu dropdown-lg dropdown-menu-end filter-dropdown p-0"
                  id="filter-dropdown"
                >
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
                          <label className="form-label">Patient</label>
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
                            Select <i className="ti ti-chevron-down ms-auto" />
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
                                  <span className="avatar avatar-xs rounded-circle me-2">
                                    <ImageWithBasePath
                                      src="assets/img/users/user-33.jpg"
                                      className="flex-shrink-0 rounded-circle"
                                      alt="img"
                                    />
                                  </span>
                                  Alberto Ripley
                                </label>
                              </li>
                              <li className="mb-1">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                  />
                                  <span className="avatar avatar-xs rounded-circle me-2">
                                    <ImageWithBasePath
                                      src="assets/img/users/user-12.jpg"
                                      className="flex-shrink-0 rounded-circle"
                                      alt="img"
                                    />
                                  </span>
                                  Bernard Griffith
                                </label>
                              </li>
                              <li className="mb-1">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                  />
                                  <span className="avatar avatar-xs rounded-circle me-2">
                                    <ImageWithBasePath
                                      src="assets/img/users/user-02.jpg"
                                      className="flex-shrink-0 rounded-circle"
                                      alt="img"
                                    />
                                  </span>
                                  Carol Lam
                                </label>
                              </li>
                              <li>
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                  />
                                  <span className="avatar avatar-xs rounded-circle me-2">
                                    <ImageWithBasePath
                                      src="assets/img/users/user-08.jpg"
                                      className="flex-shrink-0 rounded-circle"
                                      alt="img"
                                    />
                                  </span>
                                  Ezra Belcher
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
                                <Link href="#" className="btn btn-primary w-100">
                                  Select
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
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
                            Select <i className="ti ti-chevron-down ms-auto" />
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
                                  <span className="avatar avatar-xs rounded-circle me-2">
                                    <ImageWithBasePath
                                      src="assets/img/doctors/doctor-01.jpg"
                                      className="flex-shrink-0 rounded-circle"
                                      alt="img"
                                    />
                                  </span>
                                  Dr. Mick Thompson
                                </label>
                              </li>
                              <li className="mb-1">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                  />
                                  <span className="avatar avatar-xs rounded-circle me-2">
                                    <ImageWithBasePath
                                      src="assets/img/doctors/doctor-02.jpg"
                                      className="flex-shrink-0 rounded-circle"
                                      alt="img"
                                    />
                                  </span>
                                  Dr. Sarah Johnson
                                </label>
                              </li>
                              <li className="mb-1">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                  />
                                  <span className="avatar avatar-xs rounded-circle me-2">
                                    <ImageWithBasePath
                                      src="assets/img/doctors/doctor-03.jpg"
                                      className="flex-shrink-0 rounded-circle"
                                      alt="img"
                                    />
                                  </span>
                                  Dr. Emily Carter
                                </label>
                              </li>
                              <li className="mb-1">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                  />
                                  <span className="avatar avatar-xs rounded-circle me-2">
                                    <ImageWithBasePath
                                      src="assets/img/doctors/doctor-04.jpg"
                                      className="flex-shrink-0 rounded-circle"
                                      alt="img"
                                    />
                                  </span>
                                  Dr. David Lee
                                </label>
                              </li>
                              <li className="mb-0">
                                <label className="dropdown-item px-2 d-flex align-items-center text-dark">
                                  <input
                                    className="form-check-input m-0 me-2"
                                    type="checkbox"
                                  />
                                  <span className="avatar avatar-xs rounded-circle me-2">
                                    <ImageWithBasePath
                                      src="assets/img/doctors/doctor-05.jpg"
                                      className="flex-shrink-0 rounded-circle"
                                      alt="img"
                                    />
                                  </span>
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
                                <Link href="#" className="btn btn-primary w-100">
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
                            Select <i className="ti ti-chevron-down ms-auto" />
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
                                <Link href="#" className="btn btn-primary w-100">
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
                            Select <i className="ti ti-chevron-down ms-auto" />
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
                                <Link href="#" className="btn btn-primary w-100">
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
                        <div className="report-rangepicker position-relative">
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
                            Select <i className="ti ti-chevron-down ms-auto" />
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
                                <Link href="#" className="btn btn-primary w-100">
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
                        className="btn btn-light btn-md me-2 fw-medium"
                        id="close-filter"
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
              <div className="dropdown">
                <Link
                  href="#"
                  className="dropdown-toggle btn bg-white btn-md d-inline-flex align-items-center fw-normal rounded border text-dark px-2 py-1 fs-14"
                  data-bs-toggle="dropdown"
                >
                  <span className="me-1"> Sort By : </span> Recent
                </Link>
                <ul className="dropdown-menu  dropdown-menu-end p-2">
                  <li>
                    <Link href="#" className="dropdown-item rounded-1">
                      Recent
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="dropdown-item rounded-1">
                      Oldest
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          {/*  End Filter */}
          {/*  Start Table */}
          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              <strong>Error:</strong> {error}
            </div>
          )}
          <div className="table-responsive">
            {loading ? (
              <div className="text-center p-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading appointments...</p>
              </div>
            ) : (
              <Datatable
                columns={columns}
                dataSource={data}
                Selection={false}
                searchText={searchText}
                onRowClick={handleRowClick}
              />
            )}
          </div>
          {/*  End Table */}
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
      <Modals 
        appointment={selectedAppointmentDetails}
        appointmentRecord={selectedAppointment}
      />
      {showPrint && selectedAppointment && (
        <PrintPrescription
          appointmentData={selectedAppointment}
          onClose={handlePrintClose}
        />
      )}
    </>
  );
};

export default AppointmentsComponent;
