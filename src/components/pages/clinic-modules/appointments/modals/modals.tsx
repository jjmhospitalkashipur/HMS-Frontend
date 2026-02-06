"use client";


import ImageWithBasePath from "@/core/imageWithBasePath";
import { all_routes } from "../../../../../routes/all_routes";
import Link from "next/link";
import dayjs from "dayjs";

interface IModalsProps {
  appointment?: {
    visit?: any;
    patient?: any;
    doctor?: any;
  } | null;
  appointmentRecord?: any;
}

const Modals = ({ appointment, appointmentRecord }: IModalsProps) => {
  const visit = appointment?.visit;
  const patient = appointment?.patient;
  const doctor = appointment?.doctor;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return dayjs(dateStr).format("dddd, DD MMM YYYY");
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return "N/A";
    return dayjs(timeStr, "HH:mm").format("hh:mm A");
  };

  return (
    <>
      {/* Start View Details */}
      <div
        className="offcanvas offcanvas-offset offcanvas-end"
        tabIndex={-1}
        id="view_details"
        style={{ width: '800px' }}
      >
        <div className="offcanvas-header d-block pb-0 px-0">
          <div className="border-bottom d-flex align-items-center justify-content-between pb-3 px-3">
            <h5 className="offcanvas-title fs-18 fw-bold">
              Appointment Details
              <span className="badge badge-soft-primary border pt-1 px-2 border-primary fw-medium ms-2">
                {visit?.visitId || appointmentRecord?._visitId || appointmentRecord?.Case_ID || "N/A"}
              </span>
            </h5>
            <button
              type="button"
              className="btn-close custom-btn-close opacity-100"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            >
              <i className="ti ti-x fs-16 text-dark" />
            </button>
          </div>
        </div>
        <div className="offcanvas-body pt-0 px-0">
          {/* Doctor Information Section */}
          <h6 className="bg-light py-2 px-3 fw-bold mb-0 text-black">Doctor Information</h6>
          <div className="px-3 py-2 border-bottom">
            <div className="row g-2">
              <div className="col-md-8">
                <div className="mb-2">
                  <label className="form-label mb-1 fw-medium text-black fs-14">Doctor Name</label>
                  <Link 
                    href={`${all_routes.doctordetails}?id=${doctor?._id || visit?.doctorId || ""}`}
                    className="form-control bg-white border-0 py-1 px-0 fs-16 fw-medium text-decoration-none text-black d-block"
                    style={{ textAlign: 'left' }}
                  >
                    {doctor?.name || "Unknown Doctor"}
                  </Link>
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-2">
                  <label className="form-label mb-1 fw-medium text-black fs-14">Designation</label>
                  <div className="form-control bg-white border-0 py-1 px-0 fs-16 fw-medium text-black" style={{ textAlign: 'left' }}>
                    {doctor?.designation || "N/A"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Appointment Information Section */}
          <h6 className="bg-light py-2 px-3 fw-bold mb-0 text-black">Appointment Information</h6>
          <div className="px-3 py-2 border-bottom">
            <div className="row g-2">
              <div className="col-md-3">
                <div className="mb-2">
                  <label className="form-label mb-1 fw-medium text-black fs-14">Visit ID</label>
                  <div className="form-control bg-white border-0 py-1 px-0 fs-16 fw-medium text-black" style={{ textAlign: 'left' }}>
                    {visit?.visitId || appointmentRecord?._visitId || appointmentRecord?.Case_ID || "N/A"}
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-2">
                  <label className="form-label mb-1 fw-medium text-black fs-14">Appointment ID</label>
                  <div className="form-control bg-white border-0 py-1 px-0 fs-16 fw-medium text-black" style={{ textAlign: 'left' }}>
                    {visit?.appointmentId || appointmentRecord?._appointmentId || "N/A"}
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-2">
                  <label className="form-label mb-1 fw-medium text-black fs-14">Appointment Date</label>
                  <div className="form-control bg-white border-0 py-1 px-0 fs-16 fw-medium text-black" style={{ textAlign: 'left' }}>
                    {visit?.visitDate ? dayjs(visit.visitDate).format("DD MMM YYYY") : appointmentRecord?.Date_Time?.split(" - ")[0] || "N/A"}
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-2">
                  <label className="form-label mb-1 fw-medium text-black fs-14">Time</label>
                  <div className="form-control bg-white border-0 py-1 px-0 fs-16 fw-medium text-black" style={{ textAlign: 'left' }}>
                    {visit?.visitTime ? formatTime(visit.visitTime) : appointmentRecord?.Date_Time?.split(" - ")[1] || "N/A"}
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-2">
                  <label className="form-label mb-1 fw-medium text-black fs-14">Session Slot</label>
                  <div className="form-control bg-white border-0 py-1 px-0 fs-16 fw-medium text-black" style={{ textAlign: 'left' }}>
                    {visit?.sessionSlot || appointmentRecord?._sessionSlot || "N/A"}
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-2">
                  <label className="form-label mb-1 fw-medium text-black fs-14">Token Number</label>
                  <div className="form-control bg-white border-0 py-1 px-0 fs-16 fw-medium text-black" style={{ textAlign: 'left' }}>
                    {visit?.tokenNumber || appointmentRecord?.Token_No || "N/A"}
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-2">
                  <label className="form-label mb-1 fw-medium text-black fs-14">Appointment Type</label>
                  <div className="form-control bg-white border-0 py-1 px-0 fs-16 fw-medium text-black" style={{ textAlign: 'left' }}>
                    {visit?.appointmentType || appointmentRecord?.Appointment_Type || "N/A"}
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-2">
                  <label className="form-label mb-1 fw-medium text-black fs-14">Visit Type</label>
                  <div className="form-control bg-white border-0 py-1 px-0 fs-16 fw-medium text-black" style={{ textAlign: 'left' }}>
                    {visit?.visitType || appointmentRecord?.Visit || "N/A"}
                  </div>
                </div>
              </div>
              {visit?.reason && (
                <div className="col-md-12">
                  <div className="mb-2">
                    <label className="form-label mb-1 fw-medium text-black fs-14">Reason for Visit</label>
                    <div className="form-control bg-white border-0 py-1 px-0 fs-16 fw-medium text-black" style={{ minHeight: '40px', textAlign: 'left' }}>
                      {visit.reason}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Patient Information Section */}
          <h6 className="bg-light py-2 px-3 fw-bold mb-0 text-black">Patient Information</h6>
          <div className="px-3 py-2 border-bottom">
            <div className="row g-2">
              <div className="col-md-4">
                <div className="mb-2">
                  <label className="form-label mb-1 fw-medium text-black fs-14">Patient Name</label>
                  <Link 
                    href={`${all_routes.patientDetails}?id=${patient?._id || visit?.patientId || ""}`}
                    className="form-control bg-white border-0 py-1 px-0 fs-16 fw-medium text-decoration-none text-black d-flex align-items-center"
                    style={{ textAlign: 'left' }}
                  >
                    <span className="flex-grow-1 text-start">{patient?.name || appointmentRecord?.Patient || "Unknown Patient"}</span>
                    <i className="ti ti-arrow-right fs-12 text-black ms-1" />
                  </Link>
                </div>
              </div>
              {patient?.phone && (
                <div className="col-md-4">
                  <div className="mb-2">
                    <label className="form-label mb-1 fw-medium text-black fs-14">Phone Number</label>
                    <div className="form-control bg-white border-0 py-1 px-0 fs-16 fw-medium text-black" style={{ textAlign: 'left' }}>
                      {patient.phone}
                    </div>
                  </div>
                </div>
              )}
              {patient?.email && (
                <div className="col-md-4">
                  <div className="mb-2">
                    <label className="form-label mb-1 fw-medium text-black fs-14">Email</label>
                    <div className="form-control bg-white border-0 py-1 px-0 fs-16 fw-medium text-black" style={{ textAlign: 'left' }}>
                      {patient.email}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment & Status Section */}
          <h6 className="bg-light py-2 px-3 fw-bold mb-0 text-black">Payment & Status</h6>
          <div className="px-3 py-2">
            <div className="row g-2">
              {visit?.price && (
                <div className="col-md-9">
                  <div className="mb-2">
                    <label className="form-label mb-1 fw-medium text-black fs-14">Price</label>
                    <div className="form-control bg-white border-0 py-1 px-0 fs-16 fw-bold text-black" style={{ textAlign: 'left' }}>
                      ₹{visit.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}
              <div className="col-md-3">
                <div className="mb-2">
                  <label className="form-label mb-1 fw-medium text-black fs-14">Status</label>
                  <div className="form-control bg-white border-0 py-1 px-0 fs-16 fw-medium text-black" style={{ textAlign: 'left' }}>
                    {visit?.status || appointmentRecord?.Status || "Scheduled"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Add New Appointment*/}
      {/* Start Cancel Modal  */}
      <div className="modal fade" id="cancel_modal">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative">
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-01.png"
                alt=""
                className="img-fluid position-absolute top-0 start-0 z-0"
              />
              <ImageWithBasePath
                src="assets/img/bg/delete-modal-bg-02.png"
                alt=""
                className="img-fluid position-absolute bottom-0 end-0 z-0"
              />
              <div className="mb-3 position-relative z-1">
                <span className="avatar avatar-lg bg-danger text-white">
                  <i className="ti ti-x fs-24" />
                </span>
              </div>
              <h5 className="fw-bold mb-1 position-relative z-1">
                Cancel Appointment
              </h5>
              <p className="mb-3 position-relative z-1">
                Are you sure want to cancel?
              </p>
              <div className="d-flex justify-content-center">
                <Link
                  href="#"
                  className="btn btn-light position-relative z-1 me-3"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </Link>
                <Link
                  href=""
                  className="btn btn-danger position-relative z-1"
                  data-bs-dismiss="modal"
                >
                  Yes, Cancel
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* End Cancel Modal  */}
    </>
  );
};

export default Modals;
