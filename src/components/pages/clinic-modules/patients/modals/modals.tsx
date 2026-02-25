"use client";

import { DatePicker } from "antd";
import {
  Blood_Group,
  Gender,
  Title,
} from "@/core/common/selectOption";
import CommonSelect, { Option } from "@/core/common/common-select/commonSelect";
import { useState, useEffect, useCallback } from "react";
import { all_routes } from "../../../../../routes/all_routes";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Link from "next/link";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

const Modals = () => {
  const router = useRouter();
  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body;
  };

  // Edit patient form state
  const [patientId, setPatientId] = useState<string | null>(null);
  const [phone, setPhone] = useState<string>("");
  const [title, setTitle] = useState<Option | null>(Title[0] || null);
  const [name, setName] = useState<string>("");
  const [gender, setGender] = useState<Option | null>(Gender[0] || null);
  const [email, setEmail] = useState<string>("");
  const [dob, setDob] = useState<any>(undefined);
  const [ageYears, setAgeYears] = useState<string>("");
  const [ageMonths, setAgeMonths] = useState<string>("");
  const [ageDays, setAgeDays] = useState<string>("");
  const [bloodGroup, setBloodGroup] = useState<Option | null>(Blood_Group[0] || null);
  const [address, setAddress] = useState<string>("");
  const [aadharNumber, setAadharNumber] = useState<string>("");
  const [aadharFile, setAadharFile] = useState<File | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [ayushmanCardNo, setAyushmanCardNo] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // Reset form function
  const resetForm = () => {
    setPhone("");
    setTitle(Title[0] || null);
    setName("");
    setGender(Gender[0] || null);
    setEmail("");
    setDob(undefined);
    setAgeYears("");
    setAgeMonths("");
    setAgeDays("");
    setBloodGroup(Blood_Group[0] || null);
    setAddress("");
    setAadharNumber("");
    setAadharFile(null);
    setDocFile(null);
    setAyushmanCardNo("");
  };

  const fetchPatientData = useCallback(async (id: string) => {
    try {
      if (!API_BASE_URL) {
        console.error("API_BASE_URL is undefined. Check .env.local file.");
        return;
      }

      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/hospital/patients/${id}`);

      if (response.data?.code === 200 && response.data?.data?.patient) {
        const patient = response.data.data.patient;
        setPhone(patient.phone || "");
        setTitle(Title.find(t => t.value === patient.title) || Title[0] || null);
        setName(patient.name || "");
        setGender(Gender.find(g => g.value === patient.gender) || Gender[0] || null);
        setEmail(patient.email || "");
        setDob(patient.dob ? dayjs(patient.dob) : undefined);
        setBloodGroup(Blood_Group.find(bg => bg.value === patient.bloodGroup) || Blood_Group[0] || null);
        setAddress(patient.address || "");
        setAadharNumber(patient.aadharNo || "");
        setAyushmanCardNo(patient.ayushmanCardNo || "");

        // Set age from patient.age or calculate from dob
        if (patient.age) {
          setAgeYears(patient.age.toString());
        } else if (patient.dob) {
          const birthDate = dayjs(patient.dob);
          const today = dayjs();
          let years = today.diff(birthDate, 'year');
          let months = today.diff(birthDate.add(years, 'year'), 'month');
          let days = today.diff(birthDate.add(years, 'year').add(months, 'month'), 'day');
          setAgeYears(years.toString());
          setAgeMonths(months.toString());
          setAgeDays(days.toString());
        }

      }
    } catch (error: any) {
      console.error("Error fetching patient data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Listen for clicks on edit buttons to get patientId (avoids stale globals/datasets)
  useEffect(() => {
    const handleEditClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('[data-bs-target="#edit_patient"][data-patient-id]') as HTMLElement | null;
      if (!link) return;
      const patientIdAttr = link.getAttribute("data-patient-id");
      if (!patientIdAttr) return;

      resetForm();
      setPatientId(patientIdAttr);
      fetchPatientData(patientIdAttr);
    };

    document.addEventListener("click", handleEditClick, true);
    return () => {
      document.removeEventListener("click", handleEditClick, true);
    };
  }, [fetchPatientData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'aadhar' | 'doc') => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === 'aadhar') {
        setAadharFile(file);
      } else {
        setDocFile(file);
      }
    }
  };

  const handleDobChange = (date: any) => {
    setDob(date);
    if (date) {
      const birthDate = dayjs.isDayjs(date) ? date.toDate() : new Date(date);
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

  const calculateAge = (): number => {
    if (ageYears) {
      return parseInt(ageYears, 10);
    }
    if (dob) {
      const birthDate = dayjs.isDayjs(dob) ? dob.toDate() : new Date(dob);
      const today = new Date();
      let years = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        years--;
      }
      return years;
    }
    return 0;
  };

  const formatDob = (): string => {
    if (!dob) return "";
    if (dayjs.isDayjs(dob)) {
      return dob.format("YYYY-MM-DD");
    }
    return dayjs(dob).format("YYYY-MM-DD");
  };

  const getDobValue = () => {
    if (!dob) return undefined;
    if (dayjs.isDayjs(dob)) {
      return dob;
    }
    if (typeof dob === 'string' || dob instanceof Date) {
      const parsed = dayjs(dob);
      return parsed.isValid() ? parsed : undefined;
    }
    return undefined;
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!patientId) {
      console.error("Patient ID is missing");
      return;
    }

    try {
      if (!API_BASE_URL) {
        console.error("API_BASE_URL is undefined. Check .env.local file.");
        return;
      }

      setLoading(true);

      const patientData = {
        title: title?.value || "",
        name: name,
        phone: phone,
        email: email || undefined,
        dob: formatDob() || undefined,
        age: calculateAge(),
        gender: gender?.value || "",
        bloodGroup: bloodGroup?.value && bloodGroup.value !== "Select" ? bloodGroup.value : undefined,
        address: address,
        aadharNo: aadharNumber || undefined,
        ayushmanCardNo: ayushmanCardNo || undefined,
      };

      const response = await axios.patch(`${API_BASE_URL}/hospital/patients/${patientId}`, patientData);
      const isSuccess = response.status >= 200 && response.status < 300;
      const hasSuccessCode = response.data?.code === 200;

      if (isSuccess || hasSuccessCode) {
        const modalElement = document.getElementById("edit_patient");
        if (modalElement) {
          const bsModal = (window as any).bootstrap?.Offcanvas?.getInstance(modalElement);
          bsModal?.hide();
        }
        window.location.reload();
      } else {
        console.error("Failed to update patient:", response.data);
      }
    } catch (error: any) {
      console.error("Error updating patient:", error);
      console.error("Error details:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Start Edit Patient */}
      <div
        className="offcanvas offcanvas-offset offcanvas-end offcanvas-large"
        tabIndex={-1}
        id="edit_patient"
        style={{ width: '900px' }}
      >
        <div className="offcanvas-header d-block pb-0 px-0">
          <div className="border-bottom d-flex align-items-center justify-content-between pb-3 px-3">
            <h5 className="offcanvas-title fs-18 fw-bold">Edit Patient</h5>
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
        <div className="offcanvas-body p-0">
          <form onSubmit={handleEditSubmit}>
            <div className="p-3 pb-0">
              <h6 className="fw-bold text-primary mb-3">Patient Information</h6>
              <div className="row">
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
                      required
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
                      value={title}
                      onChange={(option) => {
                        setTitle(option);
                        if (!option?.value) return;
                        if (option.value === "Mr.") {
                          const male = Gender.find((g) => g.value === "Male");
                          if (male) setGender(male);
                        } else if (option.value === "Mrs." || option.value === "Ms.") {
                          const female = Gender.find((g) => g.value === "Female");
                          if (female) setGender(female);
                        } else if (option.value === "Dr." || option.value === "Prof.") {
                          const select = Gender.find((g) => g.value === "Select");
                          if (select) setGender(select);
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label mb-1 fw-medium">
                      Name<span className="text-danger ms-1">*</span>
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Enter patient name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
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
                      value={gender}
                      onChange={setGender}
                    />
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="mb-3">
                    <label className="form-label mb-1 fw-medium">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      className="form-control" 
                      placeholder="Enter email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-2">
                  <div className="mb-3">
                    <label className="form-label mb-1 fw-medium">
                      DOB
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
                        value={getDobValue()}
                        onChange={handleDobChange}
                        allowClear
                      />
                      <span className="input-icon-addon">
                        <i className="ti ti-calendar" />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
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
                      Blood Group
                    </label>
                    <CommonSelect
                      options={Blood_Group}
                      className="select"
                      value={bloodGroup}
                      onChange={setBloodGroup}
                    />
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label mb-1 fw-medium">
                      Address<span className="text-danger ms-1">*</span>
                    </label>
                    <textarea 
                      className="form-control" 
                      rows={1} 
                      placeholder="Enter full address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>
              </div>
              <h6 className="fw-bold text-primary mb-3 border-top pt-3">
                Documents
              </h6>
              <div className="mb-3">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label mb-2 fw-medium">Aadhar Card</label>
                    <div
                      className="border border-dashed rounded p-3 text-center position-relative"
                      style={{
                        minHeight: "100px",
                        cursor: "pointer",
                        backgroundColor: "#f8f9fa",
                      }}
                      onClick={() => {
                        const input = document.getElementById('edit-aadhar-upload') as HTMLInputElement;
                        input?.click();
                      }}
                    >
                      <input
                        id="edit-aadhar-upload"
                        type="file"
                        className="d-none"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileSelect(e, 'aadhar')}
                      />
                      {aadharFile ? (
                        <div>
                          <i className="ti ti-file-check fs-24 text-success mb-2"></i>
                          <p className="mb-0 text-dark fw-medium">{aadharFile.name}</p>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-danger mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAadharFile(null);
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
                  <div className="col-md-6 mb-3">
                    <label className="form-label mb-2 fw-medium">Other Document</label>
                    <div
                      className="border border-dashed rounded p-3 text-center position-relative"
                      style={{
                        minHeight: "100px",
                        cursor: "pointer",
                        backgroundColor: "#f8f9fa",
                      }}
                      onClick={() => {
                        const input = document.getElementById('edit-doc-upload') as HTMLInputElement;
                        input?.click();
                      }}
                    >
                      <input
                        id="edit-doc-upload"
                        type="file"
                        className="d-none"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileSelect(e, 'doc')}
                      />
                      {docFile ? (
                        <div>
                          <i className="ti ti-file-check fs-24 text-success mb-2"></i>
                          <p className="mb-0 text-dark fw-medium">{docFile.name}</p>
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-danger mt-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDocFile(null);
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
              <h6 className="fw-bold text-primary mb-3 border-top pt-3">
                ID Numbers
              </h6>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label mb-1 fw-medium">
                      Aadhar Number
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Enter Aadhar Number"
                      value={aadharNumber}
                      onChange={(e) => setAadharNumber(e.target.value)}
                      maxLength={12}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label mb-1 fw-medium">
                      Ayushman Card Number
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Enter Ayushman Card Number"
                      value={ayushmanCardNo}
                      onChange={(e) => setAyushmanCardNo(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
        <div className="offcanvas-footer mb-1 p-3 border-1 border-top">
          <div className=" d-flex justify-content-end gap-2">
            <Link
              href="#"
              className="btn btn-light btm-md"
              data-bs-dismiss="offcanvas"
            >
              Cancel
            </Link>
            <button 
              type="button"
              className="btn btn-primary btm-md"
              onClick={handleEditSubmit}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
      {/* End Edit Patient */}
    </>
  );
};

export default Modals;
