"use client";

import { DatePicker } from "antd";
import {
  Amount,
  Department,
  Designation,
  Doctor,
  Status,
} from "@/core/common/selectOption";
import { all_routes } from "../../../../routes/all_routes";
import { useState, useEffect } from "react";
import SearchInput from "@/core/common/dataTable/dataTableSearch";
import Datatable from "@/core/common/dataTable";
import Modals from "../doctors/modals/modals";
import Link from "next/link";
import CommonSelect from "@/core/common/common-select/commonSelect";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import dayjs from "dayjs";

interface IDoctor {
  _id: string;
  doctorId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  yearsOfExperience: number;
  gender: string;
  visitTypes: Array<{
    type: string;
    charge: number;
  }>;
}

const DoctorsListComponent = () => {
  const [doctors, setDoctors] = useState<IDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState<string>("");

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/hospital/doctors`, {
        params: { limit: 20 }
      });

      if (response.data?.code === 200) {
        setDoctors(response.data.data.doctors);
        setTotalCount(response.data.data.count);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Doctor ID",
      dataIndex: "doctorId",
      sorter: false,
      showSorterTooltip: false,
      render: (text: string) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Name",
      dataIndex: "name",
      sorter: false,
      showSorterTooltip: false,
      render: (text: string) => (
        <Link href={all_routes.doctorsDetails} className="text-dark fw-semibold">
          {text}
        </Link>
      ),
    },
    {
      title: "Department",
      dataIndex: "department",
      sorter: false,
      showSorterTooltip: false,
      render: (text: string) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Designation",
      dataIndex: "designation",
      sorter: false,
      showSorterTooltip: false,
      render: (text: string) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Phone",
      dataIndex: "phone",
      sorter: false,
      showSorterTooltip: false,
      render: (text: string) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Email",
      dataIndex: "email",
      sorter: false,
      showSorterTooltip: false,
      render: (text: string) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Experience",
      dataIndex: "yearsOfExperience",
      sorter: false,
      showSorterTooltip: false,
      render: (text: number) => <span className="text-dark">{text} years</span>,
    },
    {
      title: "",
      sorter: false,
      showSorterTooltip: false,
      render: (_: unknown, record: IDoctor) => {
        const queueHref = `${all_routes.queueDisplay}/${record._id}?sessionSlot=Morning&date=${dayjs().format("YYYY-MM-DD")}`;
        return (
          <div className="d-flex align-items-center gap-2">
            <Link
              href={queueHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-soft-primary btn-sm d-inline-flex align-items-center gap-1"
              title="View queue display"
            >
              <i className="ti ti-presentation fs-16" />
              <span className="d-none d-sm-inline">Queue</span>
            </Link>
            <div className="action-item">
              <Link
                href="#"
                data-bs-toggle="modal"
                data-bs-target="#schedule_details"
                data-doctor-id={record._id}
                onClick={(e) => e.stopPropagation()}
                title="Schedule"
              >
                <i className="ti ti-clock fs-16" />
              </Link>
            </div>
            <div className="action-item">
              <Link
                href="#"
                data-bs-toggle="offcanvas"
                data-bs-target="#edit_doctor"
                data-doctor-id={record._id}
                title="Edit"
              >
                <i className="ti ti-edit fs-16" />
              </Link>
            </div>
          </div>
        );
      },
    },
  ];

  const handleSearch = (value: string) => {
    setSearchText(value);
  };
  const getModalContainer = () => {
    const modalElement = document.getElementById("modal-datepicker");
    return modalElement ? modalElement : document.body; // Fallback to document.body if modalElement is null
  };

  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          {/* Start Page Header */}
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 mb-3 pb-3 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">
                Doctor List
                <span className="badge badge-soft-primary fs-13 fw-medium ms-2">
                  Total Doctors : {totalCount}
                </span>
              </h4>
            </div>
            <div className="text-end d-flex">
              {/* dropdown*/}
              {/* <div className="dropdown me-1">
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
              </div> */}
              {/* <div className="bg-white border shadow-sm rounded px-1 pb-0 text-center d-flex align-items-center justify-content-center">
                <Link
                  href={all_routes.doctorsList}
                  className="bg-light rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-list fs-14 text-dark" />
                </Link>
                <Link
                  href={all_routes.doctors}
                  className="bg-white rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-layout-grid fs-14 text-body" />
                </Link>
              </div> */}
              {/* Commented out modal trigger - redirecting to add doctor page instead */}
              {/* <Link
                href="#"
                className="btn btn-primary ms-2 fs-13 btn-md"
                data-bs-toggle="offcanvas"
                data-bs-target="#add_doctor"
              >
                <i className="ti ti-plus me-1" />
                New Doctor
              </Link> */}
              <Link
                href={all_routes.addDoctors}
                className="btn btn-primary ms-2 fs-13 btn-md"
              >
                <i className="ti ti-plus me-1" />
                New Doctor
              </Link>
            </div>
          </div>
          {/* End Page Header */}
          <div className=" d-flex align-items-center justify-content-between flex-wrap row-gap-3">
            <div className="search-set mb-3">
              <div className="d-flex align-items-center flex-wrap gap-2">
                <div className="table-search d-flex align-items-center mb-0">
                  <div className="search-input">
                    <SearchInput value={searchText} onChange={handleSearch} />
                  </div>
                </div>
              </div>
            </div>
            <div className="d-flex table-dropdown mb-3 pb-1 right-content align-items-center flex-wrap row-gap-3">
              <div className="dropdown me-2">
                <Link
                  href="#"
                  className="btn btn-white bg-white fs-14 py-1 border d-inline-flex text-dark align-items-center"
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
                    <h4 className="mb-0">Filter</h4>
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
                        <CommonSelect
                          options={Doctor}
                          className="select"
                          defaultValue={Doctor[0]}
                        />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Designation</label>
                          <Link href="#" className="link-primary mb-1">
                            Reset
                          </Link>
                        </div>
                        <CommonSelect
                          options={Designation}
                          className="select"
                          defaultValue={Designation[0]}
                        />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Department</label>
                          <Link href="#" className="link-primary mb-1">
                            Reset
                          </Link>
                        </div>
                        <CommonSelect
                          options={Department}
                          className="select"
                          defaultValue={Department[0]}
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label mb-1 text-dark fs-14 fw-medium">
                          Date<span className="text-danger">*</span>
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
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Amount</label>
                          <Link href="#" className="link-primary mb-1">
                            Reset
                          </Link>
                        </div>
                        <CommonSelect
                          options={Amount}
                          className="select"
                          defaultValue={Amount[0]}
                        />
                      </div>
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between">
                          <label className="form-label">Status</label>
                          <Link href="#" className="link-primary mb-1">
                            Reset
                          </Link>
                        </div>
                        <CommonSelect
                          options={Status}
                          className="select"
                          defaultValue={Status[0]}
                        />
                      </div>
                    </div>
                    <div className="filter-footer d-flex align-items-center justify-content-end border-top">
                      <Link
                        href="#"
                        className="btn btn-light btn-md me-2"
                        id="close-filter"
                      >
                        Close
                      </Link>
                      <button type="submit" className="btn btn-primary btn-md">
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
                      Recently Added
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="dropdown-item rounded-1">
                      Ascending
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="dropdown-item rounded-1">
                      Desending
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="dropdown-item rounded-1">
                      Last Month
                    </Link>
                  </li>
                  <li>
                    <Link href="#" className="dropdown-item rounded-1">
                      Last 7 Days
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="table-responsive">
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <Datatable
                columns={columns}
                dataSource={doctors}
                Selection={false}
                searchText={searchText}
              />
            )}
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
      <Modals />
    </>
  );
};

export default DoctorsListComponent;
