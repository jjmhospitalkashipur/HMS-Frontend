"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Datatable from "@/core/common/dataTable";
import SearchInput from "@/core/common/dataTable/dataTableSearch";
import { all_routes } from "@/routes/all_routes";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import dayjs from "dayjs";

interface IDaycareDoctor {
  _id: string;
  name: string;
  department?: string;
  designation?: string;
}

interface IDaycareProcedure {
  procedureId: string;
  procedureName?: string;
  price?: number;
}

interface IDaycarePatient {
  _id: string;
  name?: string;
}

interface IDaycareAppointment {
  _id: string;
  daycareId: string;
  patientId: string;
  doctorId: string;
  bedChargesType?: string;
  bedChargesTotal?: number;
  procedures?: IDaycareProcedure[];
  procedureChargesTotal?: number;
  doctorVisitCharges?: boolean;
  doctorChargesAmount?: number;
  subtotal?: number;
  discount?: number;
  totalPrice?: number;
  appointmentDate?: string;
  status?: string;
  createdAt?: string;
  paymentStatus?: string;
  amountPaid?: number;
  doctor?: IDaycareDoctor;
  patient?: IDaycarePatient;
}

interface IRow {
  id: string;
  Daycare_ID: string;
  Date: string;
  Patient: string;
  Doctor: string;
  Department: string;
  Bed_Type: string;
  Procedures: string;
  Total: number;
  Status: string;
  Payment_Status: string;
}

const DaycareAppointmentsComponent = () => {
  const router = useRouter();
  const [rows, setRows] = useState<IRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [searchText, setSearchText] = useState<string>("");

  const fetchDaycareAppointments = useCallback(async () => {
      if (!API_BASE_URL) return;
      try {
        setLoading(true);
        setError("");
        const res = await axios.get(`${API_BASE_URL}/hospital/daycare-appointments`);
        if (res.data?.code === 200 && res.data?.data) {
          const raw = res.data.data as any;
          const list: IDaycareAppointment[] = Array.isArray(raw)
            ? raw
            : Array.isArray(raw.appointments)
            ? (raw.appointments as IDaycareAppointment[])
            : [];
          if (!list.length) {
            setRows([]);
            setError("");
            return;
          }
          const mapped: IRow[] = list.map((item) => {
            const dateStr = item.appointmentDate
              ? dayjs(item.appointmentDate).format("DD MMM YYYY")
              : "";
            const doctorName = item.doctor?.name ?? "";
            const dept = item.doctor?.department ?? "";
            const patientName = item.patient?.name ?? "";
            const proceduresLabel =
              item.procedures && item.procedures.length
                ? item.procedures.map((p) => p.procedureName || "").filter(Boolean).join(", ")
                : "";

            return {
              id: item._id,
              Daycare_ID: item.daycareId,
              Date: dateStr,
              Patient: patientName,
              Doctor: doctorName,
              Department: dept,
              Bed_Type: item.bedChargesType || "",
              Procedures: proceduresLabel,
              Total: item.totalPrice ?? 0,
              Status: item.status || "",
              Payment_Status: item.paymentStatus || "",
            };
          });
          setRows(mapped);
        } else {
          setRows([]);
          setError(res.data?.message || "Failed to load daycare appointments.");
        }
      } catch (err: any) {
        setRows([]);
        setError(err?.response?.data?.message || "Failed to load daycare appointments.");
      } finally {
        setLoading(false);
      }
  }, []);

  useEffect(() => {
    fetchDaycareAppointments();
  }, [fetchDaycareAppointments]);

  const columns = [
    {
      title: "Daycare ID",
      dataIndex: "Daycare_ID",
      sorter: false,
      showSorterTooltip: false,
    },
    {
      title: "Date",
      dataIndex: "Date",
      sorter: false,
      showSorterTooltip: false,
    },
    {
      title: "Patient",
      dataIndex: "Patient",
      sorter: false,
      showSorterTooltip: false,
    },
    {
      title: "Doctor",
      dataIndex: "Doctor",
      sorter: false,
      showSorterTooltip: false,
    },
    {
      title: "Department",
      dataIndex: "Department",
      sorter: false,
      showSorterTooltip: false,
    },
    {
      title: "Bed Type",
      dataIndex: "Bed_Type",
      sorter: false,
      showSorterTooltip: false,
    },
    {
      title: "Procedures",
      dataIndex: "Procedures",
      sorter: false,
      showSorterTooltip: false,
    },
    {
      title: "Total",
      dataIndex: "Total",
      sorter: false,
      showSorterTooltip: false,
      render: (value: number) => `₹${value ?? 0}`,
    },
    {
      title: "Status",
      dataIndex: "Status",
      sorter: false,
      showSorterTooltip: false,
    },
    {
      title: "Payment Status",
      dataIndex: "Payment_Status",
      sorter: false,
      showSorterTooltip: false,
    },
    {
      title: "",
      sorter: false,
      showSorterTooltip: false,
      render: (_: any, record: IRow) => (
        <div className="d-flex align-items-center gap-2">
          <Link
            className="text-primary"
            href={`${all_routes.editDaycareAppointment}/${record.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <i className="ti ti-edit fs-16" />
          </Link>
        </div>
      ),
    },
  ];

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleRowClick = (record: IRow) => {
    if (!record?.id) return;
    router.push(`${all_routes.daycareAppointmentDetails}/${record.id}`);
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .datatable .ant-table-tbody > tr > td {
            color: #000 !important;
          }
          .datatable .ant-table-thead > tr > th {
            color: #000 !important;
          }
        `,
        }}
      />
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-sm-center flex-sm-row flex-column gap-2 pb-3 mb-3 border-bottom">
            <div className="flex-grow-1">
              <h4 className="fw-bold mb-0">Daycare Appointments</h4>
            </div>
            <div className="text-end d-flex">
              <Link
                href={all_routes.newAppointment}
                className="btn btn-primary ms-2 fs-13 btn-md"
              >
                <i className="ti ti-plus me-1" />
                New Appointment
              </Link>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger mb-3" role="alert">
              {error}
            </div>
          )}

          <div className="d-flex align-items-center justify-content-between flex-wrap row-gap-3">
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

          <div className="table-responsive">
            {loading ? (
              <p className="text-muted mb-0">Loading daycare appointments…</p>
            ) : (
              <Datatable
                columns={columns}
                dataSource={rows}
                Selection={false}
                searchText={searchText}
                onRowClick={handleRowClick}
              />
            )}
          </div>
        </div>
        <div className="footer text-center bg-white p-2 border-top">
          <p className="text-dark mb-0">
            2025 ©
            <Link href="#" className="link-primary">
              Preclinic
            </Link>
            , All Rights Reserved
          </p>
        </div>
      </div>
    </>
  );
};

export default DaycareAppointmentsComponent;

