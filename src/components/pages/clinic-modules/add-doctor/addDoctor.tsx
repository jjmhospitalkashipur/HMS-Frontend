"use client";


import { DatePicker } from "antd";
import {
  Blood_Group,
  Department,
  Designation,
  Gender,
  Visit_Type,
  Sessions,
} from "@/core/common/selectOption";
import CommonSelect from "@/core/common/common-select/commonSelect";
import { useState } from "react";
import { all_routes } from "../../../../routes/all_routes";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Link from "next/link";

const AddDoctorComponent = () => {
  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };
  const [phone, setPhone] = useState<string | undefined>();

  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          <div className="row">
            <div className="col-12">
              {/* Start Page Header */}
              <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3">
                <div className="flex-grow-1">
                  <h6 className="fw-bold mb-0 d-flex align-items-center">
                    <Link href={all_routes.doctorsList}>
                      <i className="ti ti-chevron-left me-1 fs-14" />
                      Doctor
                    </Link>
                  </h6>
                </div>
              </div>
              {/* End Page Header */}
              {/* Start Add Doctor */}
              <div className="card">
                {/* <div class="card-header">
                          
                      </div> */}
                <div className="card-body">
                  <div className="border-bottom d-flex align-items-center justify-content-between pb-3 mb-3">
                    <h5 className="offcanvas-title fs-18 fw-bold text-primary ">
                      New Doctor
                    </h5>
                  </div>
                  <form>
                   
                    <div className="pb-0">
                      <div className="row">
                      <div className="col-lg-3">
                          <div className="mb-3 d-flex align-items-center">
                            <label className="form-label">Photo</label>
                            <div className="drag-upload-btn avatar avatar-xxl rounded-circle bg-light text-muted position-relative overflow-hidden z-1 mb-2 ms-4 p-0">
                              <i className="ti ti-user-plus fs-16" />
                              <input
                                type="file"
                                className="form-control image-sign"
                                multiple
                              />
                              <div className="position-absolute bottom-0 end-0 star-0 w-100 h-25 bg-dark d-flex align-items-center justify-content-center z-n1">
                                <Link
                                  href="#"
                                  className="text-white d-flex align-items-center justify-content-center"
                                >
                                  <i className="ti ti-photo fs-14" />
                                </Link>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Name <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control" />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Email <span className="text-danger">*</span>
                            </label>
                            <input type="email" className="form-control" />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Phone No <span className="text-danger">*</span>
                            </label>
                            <PhoneInput
                              defaultCountry="IN"
                              value={phone}
                              onChange={setPhone}
                            />
                          </div>
                        </div>
                        
                        <div className="col-lg-4">
                          <div className="mb-3">
                            <label className="form-label">
                              DOB <span className="text-danger">*</span>
                            </label>
                            <div className="input-icon-end position-relative">
                              <DatePicker
                                className="form-control datetimepicker"
                                format={{
                                  format: "DD-MM-YYYY",
                                  type: "mask",
                                }}
                                getPopupContainer={getModalContainer}
                                placeholder="DD-MM-YYYY"
                                suffixIcon={null}
                              />
                              <span className="input-icon-addon">
                                <i className="ti ti-calendar" />
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-4">
                          <div className="mb-3">
                            <label className="form-label">
                              Gender
                              <span className="text-danger ms-1">*</span>
                            </label>
                            <CommonSelect
                              options={Gender}
                              className="select"
                              defaultValue={Gender[0]}
                            />
                          </div>
                        </div>
                        <div className="col-lg-4">
                          <div className="mb-3">
                            <label className="form-label">
                              Blood Group
                              <span className="text-danger ms-1">*</span>
                            </label>
                            <CommonSelect
                              options={Blood_Group}
                              className="select"
                              defaultValue={Blood_Group[0]}
                            />
                          </div>
                        </div>
                        <div className="col-lg-4">
                          <div className="mb-3">
                            <label className="form-label">
                              Years of Exp <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control" />
                          </div>
                        </div>
                        <div className="col-lg-4">
                          <div className="mb-3">
                            <label className="form-label">
                              Department
                              <span className="text-danger ms-1">*</span>
                            </label>
                            <CommonSelect
                              options={Department}
                              className="select"
                              defaultValue={Department[0]}
                            />
                          </div>
                        </div>
                        <div className="col-lg-4">
                          <div className="mb-3">
                            <label className="form-label">
                              Designation
                              <span className="text-danger ms-1">*</span>
                            </label>
                            <CommonSelect
                              options={Designation}
                              className="select"
                              defaultValue={Designation[0]}
                            />
                          </div>
                        </div>
                        <div className="col-lg-4">
                          <div className="mb-3">
                            <label className="form-label">
                              Medical License No
                              <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control" />
                          </div>
                        </div>
                        <div className="col-lg-4">
                          <div className="mb-3">
                            <label className="form-label">Poster</label>
                            <input
                              type="file"
                              className="form-control"
                              accept="image/*"
                            />
                          </div>
                        </div>
                        <div className="col-lg-4">
                          <div className="mb-3">
                            <label className="form-label">Image</label>
                            <input
                              type="file"
                              className="form-control"
                              accept="image/*"
                            />
                          </div>
                        </div>
                       
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Visit Type <span className="text-danger">*</span>
                            </label>
                            <CommonSelect
                              options={Visit_Type}
                              className="select"
                              defaultValue={Visit_Type[0]}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Consultation Charge Per Visit Type
                              <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <input type="text" className="form-control" />
                              <span className="input-group-text bg-transparent text-dark fs-14">
                              ₹
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Sessions <span className="text-danger">*</span>
                            </label>
                            <CommonSelect
                              options={Sessions}
                              className="select"
                              defaultValue={Sessions[0]}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Max Appts per Slot
                              <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control" />
                          </div>
                        </div>
                        <div className="col-lg-12">
                          <div className="mb-3">
                            <label className="form-label">
                              Address <span className="text-danger">*</span>
                            </label>
                            <textarea
                              className="form-control"
                              rows={3}
                              placeholder="Enter address"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className=" d-flex justify-content-end gap-2">
                      <Link
                        href="#"
                        className="btn btn-light btm-md"
                        data-bs-dismiss="offcanvas"
                      >
                        Cancel
                      </Link>
                      <button
                        className="btn btn-primary btm-md"
                        data-bs-toggle="modal"
                        data-bs-target="#success_modal"
                      >
                        Add Doctor
                      </button>
                    </div>
                  </form>
                </div>
                {/* <div class="card-footer">
                          
                      </div> */}
              </div>
              {/* End Add Doctor */}
            </div>
          </div>
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
    </>
  );
};

export default AddDoctorComponent;
