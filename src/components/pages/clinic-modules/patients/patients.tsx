"use client";

import { all_routes } from "../../../../routes/all_routes";
import Datatable from "@/core/common/dataTable";
import { useState, useEffect, useMemo } from "react";
import SearchInput from "@/core/common/dataTable/dataTableSearch";
import Link from "next/link";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import { useRouter } from "next/navigation";
import Modals from "./modals/modals";
import { DatePicker } from "antd";
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
  createdAt?: string;
}

const PatientsComponent = () => {
  const router = useRouter();
  const [patients, setPatients] = useState<IPatient[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [searchText, setSearchText] = useState<string>("");

  const [dateFrom, setDateFrom] = useState<dayjs.Dayjs | null>(null);
  const [dateTo, setDateTo] = useState<dayjs.Dayjs | null>(null);
  const [appliedDateFrom, setAppliedDateFrom] = useState<string | null>(null);
  const [appliedDateTo, setAppliedDateTo] = useState<string | null>(null);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedDateFrom(dateFrom ? dateFrom.format("YYYY-MM-DD") : null);
    setAppliedDateTo(dateTo ? dateTo.format("YYYY-MM-DD") : null);
  };

  const handleClearFilter = () => {
    setDateFrom(null);
    setDateTo(null);
    setAppliedDateFrom(null);
    setAppliedDateTo(null);
  };

  useEffect(() => {
    fetchPatients();
  }, [appliedDateFrom, appliedDateTo]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = { limit: 100, page: 1 };
      if (appliedDateFrom) params.createdFrom = appliedDateFrom;
      if (appliedDateTo) params.createdTo = appliedDateTo;

      const response = await axios.get(`${API_BASE_URL}/hospital/patients`, {
        params,
      });

      if (response.data?.code === 200) {
        setPatients(response.data.data.patients ?? []);
        setTotalCount(response.data.data.count ?? (response.data.data.patients?.length ?? 0));
      }
    } catch (error) {
      console.error("Error fetching patients:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "MRD No.",
      dataIndex: "mrd",
      sorter: false,
      showSorterTooltip: false,
      render: (text: any) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Name",
      dataIndex: "name",
      sorter: false,
      showSorterTooltip: false,
      render: (text: any, record: IPatient) => (
        <span className="text-dark fw-semibold">
          {record.title ? `${record.title} ${record.name}` : record.name}
        </span>
      ),
    },
    {
      title: "Phone",
      dataIndex: "phone",
      sorter: false,
      showSorterTooltip: false,
      render: (text: any) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Email",
      dataIndex: "email",
      sorter: false,
      showSorterTooltip: false,
      render: (text: any) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Age",
      dataIndex: "age",
      sorter: false,
      showSorterTooltip: false,
      render: (text: any) => <span className="text-dark">{text}</span>,
    },
    {
      title: "Gender",
      dataIndex: "gender",
      sorter: false,
      showSorterTooltip: false,
      render: (text: any) => <span className="text-dark">{text}</span>,
    },
    {
      title: "",
      sorter: false,
      showSorterTooltip: false,
      render: (_: any, record: IPatient) => (
        <div className="d-flex align-items-center gap-1">
          <Link
            href="#"
            className="shadow-sm fs-14 d-inline-flex border rounded-2 p-1 me-1 bg-white"
            data-bs-toggle="offcanvas"
            data-bs-target="#edit_patient"
            data-patient-id={record._id}
            onClick={(e) => e.stopPropagation()}
          >
            <i className="ti ti-edit" />
          </Link>
        </div>
      ),
    },
  ];

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleRowClick = (record: IPatient) => {
    router.push(`${all_routes.patientDetails}?id=${record._id}`);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .datatable .ant-table-tbody > tr > td {
            color: #000 !important;
          }
          .datatable .ant-table-thead > tr > th {
            color: #000 !important;
          }
        `
      }} />
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          {/* Start Page Header */}
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-1 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">
                Patients List
                <span className="badge badge-soft-primary fw-medium border py-1 px-2 border-primary fs-13 ms-1">
                  Total Patients : {totalCount}
                </span>
              </h4>
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
              {/* <div className="bg-white border shadow-sm rounded px-1 pb-0 text-center d-flex align-items-center justify-content-center">
                <Link
                  href={all_routes.patients}
                  className="bg-light rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-list fs-14 text-dark" />
                </Link>
                <Link
                  href={all_routes.patientsGrid}
                  className="bg-white rounded p-1 d-flex align-items-center justify-content-center"
                >
                  <i className="ti ti-layout-grid fs-14 text-body" />
                </Link>
              </div> */}
              <Link
                href={all_routes.createPatient}
                className="btn btn-primary ms-2 fs-13 btn-md"
              >
                <i className="ti ti-plus me-1" />
                New Patient
              </Link>
            </div>
          </div>
          {/* End Page Header */}
          {/*  Start Filter */}
          <div className=" d-flex align-items-center justify-content-between flex-wrap">
            <div>
              <div className="search-set mb-3">
                <div className="d-flex align-items-center flex-wrap gap-2">
                  <div className="table-search d-flex align-items-center mb-0">
                    <div className="search-input">
                      <SearchInput value={searchText} onChange={handleSearch} />
                    </div>
                  </div>
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
                  <div className="d-flex align-items-center justify-content-between border-bottom filter-header px-3 py-2">
                    <h4 className="mb-0 fw-bold">Filter</h4>
                    <button
                      type="button"
                      onClick={handleClearFilter}
                      className="btn btn-link link-danger text-decoration-underline p-0"
                    >
                      Clear All
                    </button>
                  </div>
                  <form onSubmit={handleApplyFilter}>
                    <div className="filter-body p-3">
                      <div className="mb-3">
                        <label className="form-label mb-1">Created Date Range</label>
                        <div className="row g-2">
                          <div className="col-6">
                            <DatePicker
                              className="w-100"
                              format="DD-MM-YYYY"
                              placeholder="From"
                              value={dateFrom}
                              onChange={(d) => setDateFrom(d)}
                              getPopupContainer={(node) => node?.parentElement ?? document.body}
                            />
                          </div>
                          <div className="col-6">
                            <DatePicker
                              className="w-100"
                              format="DD-MM-YYYY"
                              placeholder="To"
                              value={dateTo}
                              onChange={(d) => setDateTo(d)}
                              getPopupContainer={(node) => node?.parentElement ?? document.body}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="filter-footer d-flex align-items-center justify-content-end border-top p-2 gap-2">
                      <button
                        type="button"
                        className="btn btn-light btn-md fw-medium"
                        onClick={() => {
                          const toggle = document.getElementById("filter-dropdown")?.closest(".dropdown")?.querySelector<HTMLElement>("[data-bs-toggle=\"dropdown\"]");
                          toggle?.click();
                        }}
                      >
                        Close
                      </button>
                      <button type="submit" className="btn btn-primary btn-md fw-medium">
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
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <Datatable
                columns={columns}
                dataSource={patients}
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
      <Modals />
    </>
  );
};

export default PatientsComponent;
