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
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'poster') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'photo') {
        setPhotoFile(file);
      } else {
        setPosterFile(file);
      }
    }
  };

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
                              Phone No <span className="text-danger">*</span>
                            </label>
                            <PhoneInput
                              defaultCountry="IN"
                              value={phone}
                              onChange={setPhone}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Email
                            </label>
                            <input type="email" className="form-control" />
                          </div>
                        </div>
                        <div className="col-lg-3">
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
                        <div className="col-lg-3">
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
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Blood Group
                            </label>
                            <CommonSelect
                              options={Blood_Group}
                              className="select"
                              defaultValue={Blood_Group[0]}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Years of Exp <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control" />
                          </div>
                        </div>
                        <div className="col-lg-3">
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
                        <div className="col-lg-3">
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
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Medical License No
                              <span className="text-danger">*</span>
                            </label>
                            <input type="text" className="form-control" />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Max Appts per Slot
                            </label>
                            <input type="text" className="form-control" />
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Visit & Charges <span className="text-danger">*</span>
                            </label>
                            <div className="table-responsive">
                              <table className="table table-bordered">
                                <thead>
                                  <tr>
                                    <th className="text-dark">Visit</th>
                                    <th className="text-dark">Charges</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="text-dark">New</td>
                                    <td>
                                      <div className="input-group">
                                        <input type="text" className="form-control" />
                                        <span className="input-group-text bg-transparent text-dark fs-14">
                                          ₹
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="text-dark">Emergency</td>
                                    <td>
                                      <div className="input-group">
                                        <input type="text" className="form-control" />
                                        <span className="input-group-text bg-transparent text-dark fs-14">
                                          ₹
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="text-dark">Followup</td>
                                    <td>
                                      <div className="input-group">
                                        <input type="text" className="form-control" />
                                        <span className="input-group-text bg-transparent text-dark fs-14">
                                          ₹
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="text-dark">MR</td>
                                    <td>
                                      <div className="input-group">
                                        <input type="text" className="form-control" />
                                        <span className="input-group-text bg-transparent text-dark fs-14">
                                          ₹
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Address
                            </label>
                            <textarea
                              className="form-control"
                              rows={3}
                              placeholder="Enter address"
                            />
                          </div>
                          <div className="row">
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label mb-2 fw-medium">Photo</label>
                                <div
                                  className="border border-dashed rounded p-3 text-center position-relative"
                                  style={{
                                    minHeight: "100px",
                                    cursor: "pointer",
                                    backgroundColor: "#f8f9fa",
                                  }}
                                  onClick={() => {
                                    const input = document.getElementById('photo-upload') as HTMLInputElement;
                                    input?.click();
                                  }}
                                >
                                  <input
                                    id="photo-upload"
                                    type="file"
                                    className="d-none"
                                    accept="image/*"
                                    onChange={(e) => handleFileSelect(e, 'photo')}
                                  />
                                  {photoFile ? (
                                    <div>
                                      <i className="ti ti-file-check fs-24 text-success mb-2"></i>
                                      <p className="mb-0 text-dark fw-medium">{photoFile.name}</p>
                                      <button
                                        className="btn btn-sm btn-link text-danger mt-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPhotoFile(null);
                                        }}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ) : (
                                    <div>
                                      <i className="ti ti-upload fs-24 text-muted mb-2"></i>
                                      <p className="mb-1 text-dark fw-medium">Click to upload</p>
                                      <p className="mb-0 text-muted fs-13">JPG, PNG or PDF (max. 5MB)</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="col-lg-6">
                              <div className="mb-3">
                                <label className="form-label mb-2 fw-medium">Poster</label>
                                <div
                                  className="border border-dashed rounded p-3 text-center position-relative"
                                  style={{
                                    minHeight: "100px",
                                    cursor: "pointer",
                                    backgroundColor: "#f8f9fa",
                                  }}
                                  onClick={() => {
                                    const input = document.getElementById('poster-upload') as HTMLInputElement;
                                    input?.click();
                                  }}
                                >
                                  <input
                                    id="poster-upload"
                                    type="file"
                                    className="d-none"
                                    accept="image/*"
                                    onChange={(e) => handleFileSelect(e, 'poster')}
                                  />
                                  {posterFile ? (
                                    <div>
                                      <i className="ti ti-file-check fs-24 text-success mb-2"></i>
                                      <p className="mb-0 text-dark fw-medium">{posterFile.name}</p>
                                      <button
                                        className="btn btn-sm btn-link text-danger mt-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setPosterFile(null);
                                        }}
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ) : (
                                    <div>
                                      <i className="ti ti-upload fs-24 text-muted mb-2"></i>
                                      <p className="mb-1 text-dark fw-medium">Click to upload</p>
                                      <p className="mb-0 text-muted fs-13">JPG, PNG or PDF (max. 5MB)</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
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
