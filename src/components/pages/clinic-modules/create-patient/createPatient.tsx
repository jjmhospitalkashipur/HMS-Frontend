"use client";


import { useState } from "react";
import { all_routes } from "../../../../routes/all_routes";
import {
  Blood_Group,
  City,
  Country,
  Gender,
  Primary_Doctor,
  State,
  Status,
  Title,
} from "@/core/common/selectOption";
import CommonSelect from "@/core/common/common-select/commonSelect";
import { DatePicker } from "antd";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Link from "next/link";

const CreatePatientComponent = () => {
  const [phone, setPhone] = useState<string>("");
  const [emergencyPhone, setEmergencyPhone] = useState<string>("");
  const [dob, setDob] = useState<string | null>(null);
  const [ageYears, setAgeYears] = useState<string>("");
  const [ageMonths, setAgeMonths] = useState<string>("");
  const [ageDays, setAgeDays] = useState<string>("");
  
  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };

  const handleDobChange = (date: any) => {
    setDob(date);
    if (date) {
      const birthDate = new Date(date);
      const today = new Date();
      let years = today.getFullYear() - birthDate.getFullYear();
      let months = today.getMonth() - birthDate.getMonth();
      let days = today.getDate() - birthDate.getDate();

      if (days < 0) {
        months--;
        const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += lastMonth.getDate();
      }

      if (months < 0) {
        years--;
        months += 12;
      }

      setAgeYears(years.toString());
      setAgeMonths(months.toString());
      setAgeDays(days.toString());
    } else {
      setAgeYears("");
      setAgeMonths("");
      setAgeDays("");
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
          {/* row start */}
          <div className="row">
            <div className="col-12">
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
                <div className="card-body pb-0">
                  <div className="form">
                    <h6 className="fw-bold text-primary mb-3">Patient Information</h6>
                    <div className="row">
                      {/* <div className="col-lg-12">
                        <div className="mb-3 d-flex align-items-center">
                          <label className="form-label mb-0">
                            Profile Image
                          </label>
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
                      </div> */}
                       <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Phone Number
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <PhoneInput
                            defaultCountry="IN"
                            value={phone}
                            onChange={(value) => setPhone(value || "")}
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Title<span className="text-danger ms-1">*</span>
                          </label>
                          <CommonSelect
                            options={Title}
                            className="select"
                            defaultValue={Title[0]}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Name<span className="text-danger ms-1">*</span>
                          </label>
                          <input type="text" className="form-control" placeholder="Enter patient name" />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Gender<span className="text-danger ms-1">*</span>
                          </label>
                          <CommonSelect
                            options={Gender}
                            className="select"
                            defaultValue={Gender[0]}
                          />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Email Address
                          </label>
                          <input type="email" className="form-control" placeholder="Enter email address" />
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            DOB<span className="text-danger ms-1">*</span>
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
                              onChange={handleDobChange}
                            />
                            <span className="input-icon-addon">
                              <i className="ti ti-calendar" />
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Age<span className="text-danger ms-1">*</span>
                          </label>
                          <div className="row g-2">
                            <div className="col-4">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Years"
                                value={ageYears}
                                onChange={(e) => setAgeYears(e.target.value)}
                              />
                            </div>
                            <div className="col-4">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Months"
                                value={ageMonths}
                                onChange={(e) => setAgeMonths(e.target.value)}
                              />
                            </div>
                            <div className="col-4">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Days"
                                value={ageDays}
                                onChange={(e) => setAgeDays(e.target.value)}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Aadhaar Number
                          </label>
                          <input type="text" className="form-control" placeholder="Enter Aadhaar Number" />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Blood Group
                          </label>
                          <CommonSelect
                            options={Blood_Group}
                            className="select"
                            defaultValue={Blood_Group[0]}
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Aadhaar Upload
                          </label>
                          <input
                            type="file"
                            className="form-control"
                            accept="image/*,.pdf"
                          />
                        </div>
                      </div>
                      <div className="col-md-2">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Other Doc Upload
                          </label>
                          <input
                            type="file"
                            className="form-control"
                            accept="image/*,.pdf"
                            multiple
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Address<span className="text-danger ms-1">*</span>
                          </label>
                          <textarea className="form-control" rows={3} placeholder="Enter full address"></textarea>
                        </div>
                      </div>
                      {/* <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Primary Doctor
                            <span className="text-danger ms-1">*</span>
                          </label>
                          <CommonSelect
                            options={Primary_Doctor}
                            className="select"
                            defaultValue={Primary_Doctor[0]}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Status<span className="text-danger ms-1">*</span>
                          </label>
                          <CommonSelect
                            options={Status}
                            className="select"
                            defaultValue={Status[0]}
                          />
                        </div>
                      </div> */}
                    </div>
                    <h6 className="fw-bold text-primary mb-3 border-top pt-3">
                      Emergency Contact
                    </h6>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Name<span className="text-danger ms-1">*</span>
                          </label>
                          <input type="text" className="form-control" placeholder="Enter emergency contact name" />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Phone No<span className="text-danger ms-1">*</span>
                          </label>
                          <PhoneInput
                            defaultCountry="IN"
                            value={emergencyPhone}
                            onChange={(value) => setEmergencyPhone(value || "")}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* card end */}
              <div className="d-flex align-items-center justify-content-end">
                <Link href="#" className="btn btn-light me-2">
                  Cancel
                </Link>
                <Link href="#" className="btn btn-primary">
                  Add New Patient
                </Link>
              </div>
            </div>
          </div>
          {/* row end */}
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

export default CreatePatientComponent;
