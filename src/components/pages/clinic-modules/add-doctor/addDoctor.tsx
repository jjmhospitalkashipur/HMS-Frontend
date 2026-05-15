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
import CommonSelect, { Option } from "@/core/common/common-select/commonSelect";
import { useState } from "react";
import { all_routes } from "../../../../routes/all_routes";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import Link from "next/link";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import Select from "react-select";
import {
  formatPatientPhoneForApi,
  validateIndianMobilePhone,
} from "@/core/utils/formatPatientPhoneForApi";

const AddDoctorComponent = () => {
  const router = useRouter();
  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };

  // Form state
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string | undefined>();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [dob, setDob] = useState<any>(null);
  const [gender, setGender] = useState<Option | null>(Gender[0] || null);
  const [bloodGroup, setBloodGroup] = useState<Option | null>(Blood_Group[0] || null);
  const [yearsOfExperience, setYearsOfExperience] = useState<string>("");
  const [department, setDepartment] = useState<Option | null>(Department[0] || null);
  const [designation, setDesignation] = useState<Option | null>(Designation[0] || null);
  const [medicalLicenseNo, setMedicalLicenseNo] = useState<string>("");
  const [maxAppointmentsPerSlot, setMaxAppointmentsPerSlot] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [sessions, setSessions] = useState<Option[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Visit types state
  const [visitTypes, setVisitTypes] = useState([
    { type: "OPD", charge: "" },
    { type: "Emergency", charge: "" },
    { type: "Follow-up", charge: "" },
    { type: "Follow-up report", charge: "" },
    { type: "MR", charge: "" },
    { type: "Day Care", charge: "" },
  ]);

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

  const handleVisitTypeChange = (index: number, charge: string) => {
    const updated = [...visitTypes];
    updated[index].charge = charge;
    setVisitTypes(updated);
  };

  const formatDob = (): string => {
    if (!dob) return "";
    if (dayjs.isDayjs(dob)) {
      return dob.format("YYYY-MM-DD");
    }
    return dayjs(dob).format("YYYY-MM-DD");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name?.trim()) {
      alert("Name is required.");
      return;
    }
    if (!phone?.trim()) {
      alert("Phone Number is required.");
      return;
    }
    const phoneValidation = validateIndianMobilePhone(phone);
    if (!phoneValidation.valid) {
      alert(phoneValidation.message);
      return;
    }
    if (!email?.trim()) {
      alert("Email is required.");
      return;
    }
    if (!password?.trim()) {
      alert("Password is required.");
      return;
    }
    const validSessions = sessions.filter((s) => s.value && s.value !== "Select");
    if (validSessions.length === 0) {
      alert("Please select at least one Session.");
      return;
    }
    const visitTypesWithCharge = visitTypes.filter(
      (vt) => vt.charge?.trim() !== "" && !Number.isNaN(parseFloat(vt.charge))
    );
    if (visitTypesWithCharge.length === 0) {
      alert("Please enter Charges for at least one Visit type.");
      return;
    }

    try {
      if (!API_BASE_URL) {
        console.error("API_BASE_URL is undefined. Check .env.local file.");
        return;
      }

      setLoading(true);

      // Map visit types to API shape: visitType, appointmentType, charge
      // OPD and Day care → visitType "New"; others (Emergency, Follow-up, Follow-up-report, MR) → appointmentType "OPD"
      const visitTypesData = visitTypes
        .filter(vt => vt.charge && vt.charge.trim() !== "")
        .map(vt => {
          const charge = parseFloat(vt.charge) || 0;
          if (vt.type === "OPD") return { visitType: "New", appointmentType: "OPD", charge };
          if (vt.type === "Day Care") return { visitType: "New", appointmentType: "Day Care", charge };
          if (vt.type === "Follow-up report") return { visitType: "Follow-up-report", appointmentType: "OPD", charge };
          return { visitType: vt.type, appointmentType: "OPD", charge };
        });

      const sessionsData = sessions
        .filter(s => s.value && s.value !== "Select")
        .map(s => s.value);

      const formattedDob = formatDob();
      const genderValue = gender?.value && gender.value !== "Select" ? gender.value : "";
      const doctorData: Record<string, unknown> = {
        name: name,
        imageUrl: photoFile 
          ? "https://s3.amazonaws.com/hospital-docs/doctors/profile/dr_priya_sharma_profile.jpg" 
          : "https://s3.amazonaws.com/hospital-docs/doctors/profile/dr_priya_sharma_profile.jpg",
        email: email.trim(),
        password: password.trim(),
        phone: formatPatientPhoneForApi(phone),
        yearsOfExperience: parseInt(yearsOfExperience) || 0,
        department: department?.value !== "Select" ? department?.value : "",
        designation: designation?.value !== "Select" ? designation?.value : "",
        medicalLicenseNo: medicalLicenseNo,
        bloodGroup: bloodGroup?.value !== "Select" ? bloodGroup?.value : undefined,
        address: address || undefined,
        posterUrl: posterFile 
          ? "https://s3.amazonaws.com/hospital-docs/doctors/posters/dr_priya_sharma_poster.jpg" 
          : "https://s3.amazonaws.com/hospital-docs/doctors/posters/dr_priya_sharma_poster.jpg",
        visitTypes: visitTypesData,
        sessions: sessionsData.length > 0 ? sessionsData : ["Morning", "Afternoon", "Evening"],
        maxAppointmentsPerSlot: parseInt(maxAppointmentsPerSlot) || 4,
      };
      if (formattedDob) doctorData.dob = formattedDob;
      if (genderValue) doctorData.gender = genderValue;

      const response = await axios.post(`${API_BASE_URL}/hospital/doctors`, doctorData);
      const isSuccess = response.status >= 200 && response.status < 300;
      const hasSuccessCode = response.data?.code === 200;

      if (isSuccess || hasSuccessCode) {
        router.push(all_routes.doctorsList);
      } else {
        console.error("Failed to create doctor:", response.data);
      }
    } catch (error: any) {
      console.error("Error creating doctor:", error);
      console.error("Error details:", error.response?.data);
    } finally {
      setLoading(false);
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
                  <form onSubmit={handleSubmit}>
                   
                    <div className="pb-0">
                      <div className="row">
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Name <span className="text-danger">*</span>
                            </label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              required
                            />
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
                              required
                            />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Email <span className="text-danger">*</span>
                            </label>
                            <input 
                              type="email" 
                              className="form-control" 
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              required
                              autoComplete="email"
                            />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Password <span className="text-danger">*</span>
                            </label>
                            <input
                              type="password"
                              className="form-control"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              required
                              autoComplete="new-password"
                            />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
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
                                value={dob}
                                onChange={setDob}
                              />
                              <span className="input-icon-addon">
                                <i className="ti ti-calendar" />
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-lg-2">
                          <div className="mb-3">
                            <label className="form-label">
                              Gender
                            </label>
                            <CommonSelect
                              options={Gender}
                              className="select"
                              value={gender}
                              onChange={setGender}
                            />
                          </div>
                        </div>
                        <div className="col-lg-2">
                          <div className="mb-3">
                            <label className="form-label">
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
                        <div className="col-lg-2">
                          <div className="mb-3">
                            <label className="form-label">
                              Years of Exp
                            </label>
                            <input 
                              type="number" 
                              className="form-control" 
                              value={yearsOfExperience}
                              onChange={(e) => setYearsOfExperience(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Department
                            </label>
                            <CommonSelect
                              options={Department}
                              className="select"
                              value={department}
                              onChange={setDepartment}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Designation
                            </label>
                            <CommonSelect
                              options={Designation}
                              className="select"
                              value={designation}
                              onChange={setDesignation}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Medical License No
                            </label>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={medicalLicenseNo}
                              onChange={(e) => setMedicalLicenseNo(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Max Appts per Slot
                            </label>
                            <input 
                              type="number" 
                              className="form-control" 
                              value={maxAppointmentsPerSlot}
                              onChange={(e) => setMaxAppointmentsPerSlot(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="col-lg-3">
                          <div className="mb-3">
                            <label className="form-label">
                              Sessions <span className="text-danger">*</span>
                            </label>
                            <Select
                              isMulti
                              options={Sessions.filter(s => s.value !== "Select")}
                              value={sessions}
                              onChange={(selected) => setSessions(selected as Option[])}
                              classNamePrefix="react-select"
                              className="select"
                              placeholder="Select sessions"
                              instanceId="add-doctor-sessions-select"
                            />
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
                                  {visitTypes.map((vt, index) => (
                                    <tr key={index}>
                                      <td className="text-dark">{vt.type}</td>
                                      <td>
                                        <div className="input-group">
                                          <input 
                                            type="number" 
                                            className="form-control" 
                                            value={vt.charge}
                                            onChange={(e) => handleVisitTypeChange(index, e.target.value)}
                                            placeholder="0"
                                          />
                                          <span className="input-group-text bg-transparent text-dark fs-14">
                                            ₹
                                          </span>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
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
                              value={address}
                              onChange={(e) => setAddress(e.target.value)}
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
                                        type="button"
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
                                        type="button"
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
                        href={all_routes.doctorsList}
                        className="btn btn-light btm-md"
                      >
                        Cancel
                      </Link>
                      <button
                        type="submit"
                        className="btn btn-primary btm-md"
                        disabled={loading}
                      >
                        {loading ? "Adding..." : "Add Doctor"}
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
