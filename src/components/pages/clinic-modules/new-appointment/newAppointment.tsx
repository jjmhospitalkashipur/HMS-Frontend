"use client";


import { useState, useEffect, useCallback } from "react";
import { all_routes } from "../../../../routes/all_routes";
import {
  Title,
  Gender,
  Visit_Type,
  Slot,
  Blood_Group,
  Appointment_Type,
} from "@/core/common/selectOption";
import CommonSelect, { Option } from "@/core/common/common-select/commonSelect";
import { DatePicker, TimePicker } from "antd";
import Modals from "./modals/modals";
import Link from "next/link";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";

interface IDoctor {
  _id: string;
  name: string;
}

interface IPatient {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  title?: string;
  gender?: string;
  dob?: string;
  age?: number;
  bloodGroup?: string;
  address?: string;
  emergencyContacts?: Array<{
    name: string;
    number: string;
  }>;
}

const NewAppointmentComponent = () => {
  const router = useRouter();
  
  // Patient form state
  const [phone, setPhone] = useState<string>("");
  const [title, setTitle] = useState<Option | null>(Title[0] || null);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [gender, setGender] = useState<Option | null>(Gender[0] || null);
  const [dob, setDob] = useState<any>(null);
  const [ageYears, setAgeYears] = useState<string>("");
  const [ageMonths, setAgeMonths] = useState<string>("");
  const [ageDays, setAgeDays] = useState<string>("");
  const [bloodGroup, setBloodGroup] = useState<Option | null>(Blood_Group[0] || null);
  const [address, setAddress] = useState<string>("");
  const [emergencyContactName, setEmergencyContactName] = useState<string>("");
  const [emergencyPhone, setEmergencyPhone] = useState<string>("");
  const [selectedPatient, setSelectedPatient] = useState<IPatient | null>(null);
  const [patientSearchResults, setPatientSearchResults] = useState<IPatient[]>([]);
  const [showPatientDropdown, setShowPatientDropdown] = useState<boolean>(false);
  const [searchingPatients, setSearchingPatients] = useState<boolean>(false);

  // Appointment form state
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [doctorOptions, setDoctorOptions] = useState<Option[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Option | null>(null);
  const [visitType, setVisitType] = useState<Option | null>(Visit_Type.find(v => v.value === "New") || Visit_Type[0] || null);
  const [appointmentType, setAppointmentType] = useState<string>("OPD");
  const [visitDate, setVisitDate] = useState<any>(null);
  const [visitTime, setVisitTime] = useState<any>(null);
  const [sessionSlot, setSessionSlot] = useState<Option | null>(Slot.find(s => s.value === "Morning") || Slot[0] || null);
  const [reason, setReason] = useState<string>("");

  // Payment form state
  const [paymentMode, setPaymentMode] = useState<string>("Card");
  const [total, setTotal] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Calculate final amount and balance
  const finalAmount = total - discount;
  const balance = finalAmount - amountReceived;

  const fetchDoctors = async () => {
    try {
      if (!API_BASE_URL) {
        console.error("API_BASE_URL is undefined. Check .env.local file.");
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/hospital/doctors`, {
        params: { limit: 100 }
      });

      if (response.data?.code === 200 && response.data?.data?.doctors) {
        const doctorsList = response.data.data.doctors;
        setDoctors(doctorsList);
        
        // Convert to options format
        const options = doctorsList.map((doctor: IDoctor) => ({
          value: doctor._id,
          label: doctor.name,
        }));
        setDoctorOptions(options);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, []);

  const searchPatients = useCallback(async (phoneNumber: string) => {
    try {
      if (!API_BASE_URL) {
        console.error("API_BASE_URL is undefined");
        return;
      }

      const phoneDigits = phoneNumber.replace(/\D/g, '');
      console.log("Searching patients with phone:", phoneDigits);
      setSearchingPatients(true);
      
      const response = await axios.get(`${API_BASE_URL}/hospital/patients`, {
        params: { 
          limit: 20,
          page: 1,
          search: phoneDigits
        }
      });

      console.log("Patients API response:", response.data);
      console.log("API URL called:", `${API_BASE_URL}/hospital/patients?limit=20&page=1&search=${phoneDigits}`);

      if (response.data?.code === 200 && response.data?.data?.patients) {
        const patients = response.data.data.patients;
        console.log("Filtered patients:", patients);
        setPatientSearchResults(patients);
        setShowPatientDropdown(patients.length > 0 && !selectedPatient);
      } else {
        setPatientSearchResults([]);
        setShowPatientDropdown(false);
      }
    } catch (error) {
      console.error("Error searching patients:", error);
      setPatientSearchResults([]);
      setShowPatientDropdown(false);
    } finally {
      setSearchingPatients(false);
    }
  }, [selectedPatient]);

  // Search patients when phone number changes
  useEffect(() => {
    if (!phone) {
      setPatientSearchResults([]);
      setShowPatientDropdown(false);
      setSelectedPatient(null);
      return;
    }

    const searchTimeout = setTimeout(() => {
      const phoneDigits = phone.replace(/\D/g, '');
      console.log("Phone changed, digits:", phoneDigits, "Length:", phoneDigits.length);
      if (phoneDigits.length >= 3) {
        console.log("Triggering search with", phoneDigits.length, "digits");
        searchPatients(phoneDigits);
      } else {
        setPatientSearchResults([]);
        setShowPatientDropdown(false);
        setSelectedPatient(null);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(searchTimeout);
  }, [phone, searchPatients]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.patient-search-container')) {
        setShowPatientDropdown(false);
      }
    };

    if (showPatientDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showPatientDropdown]);

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

  const handlePatientSelect = async (patient: IPatient) => {
    setSelectedPatient(patient);
    setShowPatientDropdown(false);
    
    // Populate form fields
    setName(patient.name || "");
    setEmail(patient.email || "");
    setPhone(patient.phone || "");
    
    if (patient.title) {
      const titleOption = Title.find(t => t.value === patient.title);
      if (titleOption) setTitle(titleOption);
    }
    
    if (patient.gender) {
      const genderOption = Gender.find(g => g.value === patient.gender);
      if (genderOption) setGender(genderOption);
    }
    
    if (patient.bloodGroup) {
      const bloodGroupOption = Blood_Group.find(bg => bg.value === patient.bloodGroup);
      if (bloodGroupOption) setBloodGroup(bloodGroupOption);
    }
    
    if (patient.dob) {
      const dobDate = dayjs(patient.dob);
      setDob(dobDate);
      handleDobChange(dobDate);
    }
    
    if (patient.age) {
      setAgeYears(patient.age.toString());
    }
    
    setAddress(patient.address || "");
    
    if (patient.emergencyContacts && patient.emergencyContacts.length > 0) {
      const contact = patient.emergencyContacts[0];
      setEmergencyContactName(contact.name || "");
      setEmergencyPhone(contact.number || "");
    }
  };

  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
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

  const formatVisitDate = (): string => {
    if (!visitDate) return "";
    if (dayjs.isDayjs(visitDate)) {
      return visitDate.format("YYYY-MM-DD");
    }
    return dayjs(visitDate).format("YYYY-MM-DD");
  };

  const formatVisitTime = (): string => {
    if (!visitTime) return "";
    if (dayjs.isDayjs(visitTime)) {
      return visitTime.format("HH:mm");
    }
    return dayjs(visitTime).format("HH:mm");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      if (!API_BASE_URL) {
        const errorMsg = "API configuration error. Please contact support.";
        setError(errorMsg);
        console.error("API_BASE_URL is undefined. Check .env.local file.");
        alert(errorMsg);
        return;
      }

      if (!selectedDoctor?.value) {
        const errorMsg = "Please select a doctor";
        setError(errorMsg);
        alert(errorMsg);
        return;
      }

      if (!name.trim()) {
        const errorMsg = "Please enter patient name";
        setError(errorMsg);
        alert(errorMsg);
        return;
      }

      if (!phone) {
        const errorMsg = "Please enter patient phone number";
        setError(errorMsg);
        alert(errorMsg);
        return;
      }

      if (!visitDate) {
        const errorMsg = "Please select visit date";
        setError(errorMsg);
        alert(errorMsg);
        return;
      }

      if (!visitTime) {
        const errorMsg = "Please select visit time";
        setError(errorMsg);
        alert(errorMsg);
        return;
      }

      setLoading(true);

      // Check if existing patient is selected
      if (selectedPatient) {
        // For existing patients, use /hospital/visits endpoint
        const appointmentData = {
          patientId: selectedPatient._id,
          doctorId: selectedDoctor.value,
          visitType: visitType?.value !== "Select" ? visitType?.value : "",
          appointmentType: appointmentType,
          reason: reason || undefined,
          visitDate: formatVisitDate(),
          visitTime: formatVisitTime(),
          sessionSlot: sessionSlot?.value !== "Select" ? sessionSlot?.value : "",
        };

        console.log("Submitting appointment for existing patient:", appointmentData);

        const response = await axios.post(`${API_BASE_URL}/hospital/visits`, appointmentData);
        const isSuccess = response.status >= 200 && response.status < 300;
        const hasSuccessCode = response.data?.code === 200;

        if (isSuccess || hasSuccessCode) {
          router.push(all_routes.appointments);
          return;
        } else {
          const errorMsg = response.data?.message || "Failed to create appointment. Please try again.";
          setError(errorMsg);
          console.error("Failed to create appointment:", response.data);
          alert(errorMsg);
          return;
        }
      }

      // For new patients, use /hospital/visits/with-patient endpoint
      const emergencyContacts = [];
      if (emergencyContactName && emergencyPhone) {
        emergencyContacts.push({
          name: emergencyContactName,
          number: emergencyPhone,
        });
      }

      const appointmentData = {
        patient: {
          title: title?.value || "",
          name: name.trim(),
          phone: phone || "",
          email: email || undefined,
          dob: formatDob(),
          age: calculateAge(),
          gender: gender?.value !== "Select" ? gender?.value : "",
          bloodGroup: bloodGroup?.value !== "Select" ? bloodGroup?.value : undefined,
          address: address || undefined,
          emergencyContacts: emergencyContacts.length > 0 ? emergencyContacts : undefined,
        },
        doctorId: selectedDoctor.value,
        visitType: visitType?.value !== "Select" ? visitType?.value : "",
        appointmentType: appointmentType,
        reason: reason || undefined,
        visitDate: formatVisitDate(),
        visitTime: formatVisitTime(),
        sessionSlot: sessionSlot?.value !== "Select" ? sessionSlot?.value : "",
        transaction: {
          transactionType: "Payment",
          amount: finalAmount,
          paymentMode: paymentMode,
        },
      };

      console.log("Submitting appointment for new patient:", appointmentData);

      const response = await axios.post(`${API_BASE_URL}/hospital/visits/with-patient`, appointmentData);
      const isSuccess = response.status >= 200 && response.status < 300;
      const hasSuccessCode = response.data?.code === 200;

      if (isSuccess || hasSuccessCode) {
        router.push(all_routes.appointments);
      } else {
        const errorMsg = response.data?.message || "Failed to create appointment. Please try again.";
        setError(errorMsg);
        console.error("Failed to create appointment:", response.data);
        alert(errorMsg);
      }
    } catch (error: any) {
      let errorMessage = "An error occurred while creating the appointment. Please try again.";
      
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const data = error.response.data;
        
        console.error("API Error Response:", {
          status,
          data,
          headers: error.response.headers,
        });

        if (status === 400) {
          errorMessage = data?.message || "Invalid data provided. Please check all fields and try again.";
        } else if (status === 401) {
          errorMessage = "Unauthorized. Please login again.";
        } else if (status === 403) {
          errorMessage = "You don't have permission to perform this action.";
        } else if (status === 404) {
          errorMessage = "Resource not found. Please check the details and try again.";
        } else if (status === 409) {
          errorMessage = data?.message || "Conflict: This appointment or patient already exists. Please check the details and try again.";
        } else if (status === 500) {
          errorMessage = data?.message || "Server error occurred. Please try again later or contact support.";
        } else {
          errorMessage = data?.message || `Error ${status}: ${data?.error || "An unexpected error occurred"}`;
        }

        // Log detailed error for debugging
        if (data?.errors) {
          console.error("Validation errors:", data.errors);
          const validationErrors = Object.entries(data.errors)
            .map(([field, messages]: [string, any]) => `${field}: ${Array.isArray(messages) ? messages.join(", ") : messages}`)
            .join("\n");
          errorMessage += `\n\nValidation Errors:\n${validationErrors}`;
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error("Network Error - No response received:", error.request);
        errorMessage = "Network error. Please check your internet connection and try again.";
      } else {
        // Error setting up the request
        console.error("Error setting up request:", error.message);
        errorMessage = `Error: ${error.message}`;
      }

      setError(errorMessage);
      alert(errorMessage);
      console.error("Full error object:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .page-wrapper input::placeholder,
          .page-wrapper textarea::placeholder {
            color: #000 !important;
            opacity: 1;
          }
          .page-wrapper input::-webkit-input-placeholder,
          .page-wrapper textarea::-webkit-input-placeholder {
            color: #000 !important;
          }
          .page-wrapper input::-moz-placeholder,
          .page-wrapper textarea::-moz-placeholder {
            color: #000 !important;
            opacity: 1;
          }
          .page-wrapper input:-ms-input-placeholder,
          .page-wrapper textarea:-ms-input-placeholder {
            color: #000 !important;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `
      }} />
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
                  <Link href={all_routes.appointments} className="text-dark">
                    <i className="ti ti-chevron-left me-1" />
                    Appointments
                  </Link>
                </h6>
              </div>
              {/* page header end */}
              {/* Error Message Display */}
              {error && (
                <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
                  <strong>Error:</strong> {error}
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setError("")}
                    aria-label="Close"
                  />
                </div>
              )}
              {/* Patient Details Card */}
              <form onSubmit={handleSubmit}>
              <div className="card mb-3">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <h6 className="fw-bold text-primary mb-0">Patient Details</h6>
                      {selectedPatient && (
                        <span className="badge badge-soft-success border border-success fw-medium">
                          Existing Patient
                        </span>
                      )}
                    </div>
                    {/* <Link href={all_routes.createPatient} className="btn btn-primary btn-sm">
                      <i className="ti ti-circle-plus me-1" />
                      New Patient
                    </Link> */}
                  </div>
                  <div className="form">
                    <div className="row">
                      <div className="col-md-3">
                        <div className="mb-3 position-relative patient-search-container">
                          <label className="form-label mb-1 fw-medium">
                            Phone Number<span className="text-danger ms-1">*</span>
                          </label>
                          <PhoneInput
                            defaultCountry="IN"
                            value={phone}
                            onChange={(value) => {
                              console.log("PhoneInput onChange called with value:", value);
                              setPhone(value || "");
                              setSelectedPatient(null); // Clear selected patient when phone changes
                            }}
                            placeholder="Enter 10-digit phone number"
                            required
                          />
                          {showPatientDropdown && patientSearchResults.length > 0 && (
                            <div 
                              className="dropdown-menu show position-absolute w-100 mt-1 shadow-lg"
                              style={{ zIndex: 1050, maxHeight: '200px', overflowY: 'auto' }}
                            >
                              {patientSearchResults.map((patient) => (
                                <button
                                  key={patient._id}
                                  type="button"
                                  className="dropdown-item d-flex align-items-center justify-content-between"
                                  onClick={() => handlePatientSelect(patient)}
                                  onMouseDown={(e) => e.preventDefault()}
                                >
                                  <div>
                                    <div className="fw-medium text-dark">{patient.name}</div>
                                    <div className="fs-13 text-muted">{patient.phone}</div>
                                  </div>
                                  <i className="ti ti-arrow-right fs-12 text-muted" />
                                </button>
                              ))}
                            </div>
                          )}
                          {searchingPatients && !showPatientDropdown && (
                            <div className="position-absolute top-100 start-0 w-100 mt-1 p-2 bg-white border rounded shadow-sm">
                              <div className="text-center text-muted fs-13">
                                <i className="ti ti-loader-2 fs-14 me-1" style={{ animation: 'spin 1s linear infinite' }} />
                                Searching...
                              </div>
                            </div>
                          )}
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
                            onChange={setTitle}
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
                            placeholder="Enter patient name..."
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
                      <div className="col-md-3">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Date of Birth
                          </label>
                          <div className="input-icon-end position-relative">
                            <DatePicker
                              className="form-control datetimepicker"
                              format={{
                                format: "DD-MM-YYYY",
                                type: "mask",
                              }}
                              getPopupContainer={getModalContainer}
                              placeholder="Select DOB"
                              suffixIcon={null}
                              value={dob}
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
                      <div className="col-md-5">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Address
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter address"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Emergency Contact Name
                          </label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Enter emergency contact name"
                            value={emergencyContactName}
                            onChange={(e) => setEmergencyContactName(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-3">
                          <label className="form-label mb-1 fw-medium">
                            Emergency Contact Phone
                          </label>
                          <PhoneInput
                            defaultCountry="IN"
                            value={emergencyPhone}
                            onChange={(value) => setEmergencyPhone(value || "")}
                            placeholder="Enter emergency contact phone"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Doctor Details and Payment Details in Same Row */}
              <div className="row mb-3">
                {/* Doctor Details Section */}
                <div className="col-lg-7 pe-3">
                  <div className="card h-100">
                    <div className="card-body">
                      <h6 className="fw-bold text-primary mb-3">Doctor Details</h6>
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label mb-1 fw-medium">
                              Doctor<span className="text-danger ms-1">*</span>
                            </label>
                            <CommonSelect
                              options={doctorOptions}
                              className="select"
                              value={selectedDoctor}
                              onChange={setSelectedDoctor}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label mb-1 fw-medium">
                              Session Slot<span className="text-danger ms-1">*</span>
                            </label>
                            <CommonSelect
                              options={Slot}
                              className="select"
                              value={sessionSlot}
                              onChange={setSessionSlot}
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label mb-1 fw-medium">
                              Date of Appointment
                              <span className="text-danger ms-1">*</span>
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
                                value={visitDate}
                                onChange={setVisitDate}
                              />
                              <span className="input-icon-addon">
                                <i className="ti ti-calendar" />
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label mb-1 fw-medium">
                              Time<span className="text-danger ms-1">*</span>
                            </label>
                            <div className="input-icon-end position-relative">
                              <TimePicker
                                className="form-control datetimepicker"
                                format="HH:mm"
                                getPopupContainer={getModalContainer}
                                placeholder="HH:mm"
                                suffixIcon={null}
                                value={visitTime}
                                onChange={setVisitTime}
                              />
                              <span className="input-icon-addon">
                                <i className="ti ti-clock text-gray-7" />
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label mb-2 fw-medium">
                              Appointment Type
                              <span className="text-danger ms-1">*</span>
                            </label>
                            <div className="d-flex gap-3">
                              {Appointment_Type.map((type) => (
                                <div key={type.value} className="form-check">
                                  <input
                                    className="form-check-input"
                                    type="radio"
                                    name="appointmentType"
                                    id={type.value}
                                    value={type.value}
                                    checked={appointmentType === type.value}
                                    onChange={(e) => setAppointmentType(e.target.value)}
                                  />
                                  <label className="form-check-label" htmlFor={type.value}>
                                    {type.label}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label mb-1 fw-medium">
                              Visit Type<span className="text-danger ms-1">*</span>
                            </label>
                            <CommonSelect
                              options={Visit_Type}
                              className="select"
                              value={visitType}
                              onChange={setVisitType}
                            />
                          </div>
                        </div>
                        {/* <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label mb-1 fw-medium">
                              Reason for Visit
                            </label>
                            <textarea
                              className="form-control"
                              rows={3}
                              placeholder="Enter reason for visit"
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                            />
                          </div>
                        </div> */}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Payment Details Section */}
                <div className="col-lg-5 ps-3">
                  <div className="card h-100">
                    <div className="card-body">
                      <h6 className="fw-bold text-primary mb-3">Payment Details</h6>
                      <div className="mb-3">
                        <label className="form-label mb-2 fw-medium">
                          Payment Mode
                        </label>
                        <div className="d-flex gap-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="paymentMode"
                              id="cash"
                              value="Cash"
                              checked={paymentMode === "Cash"}
                              onChange={(e) => setPaymentMode(e.target.value)}
                            />
                            <label className="form-check-label" htmlFor="cash">
                              Cash
                            </label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="paymentMode"
                              id="upi"
                              value="UPI"
                              checked={paymentMode === "UPI"}
                              onChange={(e) => setPaymentMode(e.target.value)}
                            />
                            <label className="form-check-label" htmlFor="upi">
                              UPI
                            </label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="paymentMode"
                              id="card"
                              value="Card"
                              checked={paymentMode === "Card"}
                              onChange={(e) => setPaymentMode(e.target.value)}
                            />
                            <label className="form-check-label" htmlFor="card">
                              Card
                            </label>
                          </div>
                        </div>
                      </div>
                      <div className="mb-3 d-flex align-items-center">
                        <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Total</label>
                        <div className="form-control bg-light" style={{ pointerEvents: "none" }}>
                          ₹{total.toFixed(2)}
                        </div>
                      </div>
                      <div className="mb-3 d-flex align-items-center">
                        <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Discount</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0"
                          value={discount || ""}
                          onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div className="mb-3 d-flex align-items-center">
                        <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Final Amount</label>
                        <div className="form-control bg-light" style={{ pointerEvents: "none" }}>
                          ₹{finalAmount.toFixed(2)}
                        </div>
                      </div>
                      <div className="mb-3 d-flex align-items-center">
                        <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Amount Received</label>
                        <input
                          type="number"
                          className="form-control"
                          placeholder="0"
                          value={amountReceived || ""}
                          onChange={(e) => setAmountReceived(parseFloat(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                      <div className="mb-3 d-flex align-items-center">
                        <label className="form-label mb-0 fw-medium me-2" style={{ minWidth: "120px" }}>Balance</label>
                        <div
                          className="form-control d-flex align-items-center justify-content-between"
                          style={{
                            pointerEvents: "none",
                            backgroundColor: "#fff3cd",
                            borderColor: "#ffc107",
                          }}
                        >
                          <span>₹{balance.toFixed(2)}</span>
                          <i className="ti ti-alert-triangle text-warning fs-16" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* card end */}
              <div className="d-flex align-items-center justify-content-end">
                <Link href={all_routes.appointments} className="btn font-weight-bold fs-15 fw-medium rounded btn-light me-2">
                  Cancel
                </Link>
                <button 
                  type="submit" 
                  className="btn font-weight-bold fs-15 fw-medium rounded btn-primary"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Appointment"}
                </button>
              </div>
              </form>
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
      <Modals />
    </>
  );
};

export default NewAppointmentComponent;
