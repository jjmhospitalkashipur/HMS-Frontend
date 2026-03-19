"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });
import SCol2Chart from "../chats/scol2";
import SCol3Chart from "../chats/scol3";
import SCol4Chart from "../chats/scol4";
import SCol19Chart from "../chats/scol19";
import CircleChart from "../chats/circleChart";
import RevenueChart from "../chats/revenueChart";
import { Calendar, type CalendarProps } from "antd";
import type { Dayjs } from "dayjs";
import Link from "next/link";
import { all_routes } from "@/routes/all_routes";
import axios from "axios";
import { API_BASE_URL } from "@/environment";
import dayjs from "dayjs";

interface IOverviewMetric {
  total: number;
  growthRate: string;
}

interface IDashboardOverviewData {
  doctors: IOverviewMetric;
  patients: IOverviewMetric;
  visits: IOverviewMetric;
  revenue: IOverviewMetric;
}

interface IRecentTransaction {
  _id: string;
  transactionId: string;
  visitId: string;
  transactionType: string;
  amount: number;
  paymentMode: string;
  transactionDate: string;
  patientName: string;
  serviceName: string;
}

interface IVisitStatsSummary {
  all: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

interface IVisitStatsPeriodData {
  period: string;
  scheduled: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

const DashboardComponent = () => {
  const [overview, setOverview] = useState<IDashboardOverviewData | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);

  const [sColChart] = useState<any>({
    chart: {
      width: 80,
      height: 54,
      type: "bar",
      toolbar: { show: false },
      sparkline: { enabled: true },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "70%",
        borderRadius: 3,
        endingShape: "rounded",
      },
    },
    dataLabels: { enabled: false },
    stroke: { show: false },
    xaxis: {
      labels: { show: false },
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
    yaxis: { show: false },
    grid: { show: false },
    tooltip: { enabled: false },
    colors: [
      "#2E37A4", // default color
      "#2E37A4",
      "#2E37A4",
      "#2E37A4",
      "#FF955A", // highlighted bar
      "#2E37A4",
      "#2E37A4",
    ],
    fill: {
      type: "solid",
    },
  });

  const series = [
    {
      name: "Data",
      data: [40, 15, 60, 15, 90, 20, 70], // y-values
    },
  ];

  const onPanelChange = (value: Dayjs, mode: CalendarProps<Dayjs>["mode"]) => {
    console.log(value.format("YYYY-MM-DD"), mode);
  };

  const [recentAppointments, setRecentAppointments] = useState<
    {
      id: string;
      doctorName: string;
      patientName: string;
      dateTime: string;
      appointmentType: string;
      status: string;
    }[]
  >([]);

  const [recentLoading, setRecentLoading] = useState(false);

  const [recentTransactions, setRecentTransactions] = useState<IRecentTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(true);

  const [visitStatsSummary, setVisitStatsSummary] = useState<IVisitStatsSummary>({ all: 0, scheduled: 0, inProgress: 0, completed: 0, cancelled: 0, noShow: 0 });
  const [visitStatsPeriodData, setVisitStatsPeriodData] = useState<IVisitStatsPeriodData[]>([]);
  const [visitStatsPeriod, setVisitStatsPeriod] = useState<"daily" | "week" | "month" | "year">("month");

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Scheduled":
        return "badge-soft-primary text-primary border border-primary";
      case "In Progress":
        return "badge-soft-warning text-warning border border-warning";
      case "Completed":
        return "badge-soft-success text-success border border-success";
      case "Cancelled":
        return "badge-soft-danger text-danger border border-danger";
      case "No Show":
        return "badge-soft-secondary text-secondary border border-secondary";
      default:
        return "badge-soft-secondary text-secondary border border-secondary";
    }
  };

  useEffect(() => {
    const fetchOverview = async () => {
      if (!API_BASE_URL) return;
      try {
        setOverviewLoading(true);
        const response = await axios.get(`${API_BASE_URL}/hospital/dashboard/overview`);
        if (response.data?.code === 200 && response.data?.data) {
          setOverview(response.data.data as IDashboardOverviewData);
        } else {
          setOverview(null);
        }
      } catch {
        setOverview(null);
      } finally {
        setOverviewLoading(false);
      }
    };

    fetchOverview();
  }, []);

  useEffect(() => {
    const fetchRecentVisits = async () => {
      if (!API_BASE_URL) return;
      try {
        setRecentLoading(true);
        const response = await axios.get(`${API_BASE_URL}/hospital/dashboard/recent-visits`, {
          params: { limit: 6 },
        });
        if (response.data?.code === 200 && Array.isArray(response.data?.data?.visits)) {
          const visits = response.data.data.visits as Array<{
            _id: string;
            visitId?: string;
            doctorName?: string;
            patientName?: string;
            dateTime?: string;
            appointmentType?: string;
            status?: string;
          }>;
          const mapped = visits.map((visit) => ({
            id: visit._id,
            doctorName: visit.doctorName ?? "Unknown Doctor",
            patientName: visit.patientName ?? "Unknown Patient",
            dateTime: visit.dateTime ? dayjs(visit.dateTime).format("DD MMM YYYY") : "",
            appointmentType: visit.appointmentType ?? "OPD",
            status: visit.status ?? "Scheduled",
          }));
          setRecentAppointments(mapped);
        } else {
          setRecentAppointments([]);
        }
      } catch {
        setRecentAppointments([]);
      } finally {
        setRecentLoading(false);
      }
    };

    fetchRecentVisits();
  }, []);

  useEffect(() => {
    const fetchRecentTransactions = async () => {
      if (!API_BASE_URL) return;
      try {
        setTransactionsLoading(true);
        const response = await axios.get(`${API_BASE_URL}/hospital/dashboard/recent-transactions`, {
          params: { limit: 5 },
        });
        if (response.data?.code === 200 && Array.isArray(response.data?.data?.transactions)) {
          setRecentTransactions(response.data.data.transactions as IRecentTransaction[]);
        } else {
          setRecentTransactions([]);
        }
      } catch {
        setRecentTransactions([]);
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchRecentTransactions();
  }, []);

  useEffect(() => {
    const fetchVisitStatistics = async () => {
      if (!API_BASE_URL) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/hospital/dashboard/visit-statistics`, {
          params: { period: visitStatsPeriod },
        });
        if (response.data?.code === 200 && response.data?.data) {
          const { summary, periodData } = response.data.data;
          if (summary) setVisitStatsSummary(summary);
          if (Array.isArray(periodData)) setVisitStatsPeriodData(periodData);
        }
      } catch {
        // keep defaults
      }
    };
    fetchVisitStatistics();
  }, [visitStatsPeriod]);

  const visitStatsCategories = visitStatsPeriodData.map((d) => d.period);
  const visitStatsSeries: ApexAxisChartSeries = [
    { name: "Completed", data: visitStatsPeriodData.map((d) => d.completed) },
    { name: "Scheduled", data: visitStatsPeriodData.map((d) => d.scheduled) },
    { name: "In Progress", data: visitStatsPeriodData.map((d) => d.inProgress) },
    { name: "Cancelled", data: visitStatsPeriodData.map((d) => d.cancelled) },
    { name: "No Show", data: visitStatsPeriodData.map((d) => d.noShow) },
  ];

  const formatRevenue = (total: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(total);

  const formatTransactionDate = (dateStr: string) =>
    dateStr ? dayjs(dateStr).format("DD MMM YYYY, HH:mm") : "—";

  return (
    <>
      {/* ========================
			Start Page Content
		========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content pb-0">
          {/* Page Header */}
          <div className="d-flex align-items-sm-center justify-content-between flex-wrap gap-2 mb-4">
            <div>
              <h4 className="fw-bold mb-0">Admin Dashboard </h4>
            </div>
            <div className="d-flex align-items-center flex-wrap gap-2">
              <Link
                href={all_routes.newAppointment}
                className="btn btn-primary d-inline-flex align-items-center"
              >
                <i className="ti ti-plus me-1" />
                New Appointment
              </Link>
              <Link
                href="/qd/DOC00031"
                className="btn btn-primary d-inline-flex align-items-center"
              >
                <i className="ti ti-list me-1" />
                Queue
              </Link>
              
            </div>
          </div>
          {/* End Page Header */}
          {/* start row */}
          <div className="row">
            <div className="col-xl-3 col-md-6">
              <div className="border card rounded-2 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <span className="avatar bg-primary rounded-circle">
                      <i className="ti ti-calendar-heart fs-24" />
                    </span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1">Doctors</p>
                      <h3 className="fw-bold mb-0">{overviewLoading ? "—" : (overview?.doctors?.total ?? 0)}</h3>
                    </div>
                    <div>
                      <div id="s-col" className="chart-set">
                        <Chart
                          options={sColChart}
                          series={series}
                          type="bar"
                          width={80}
                          height={54}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* end col */}
            <div className="col-xl-3 col-md-6">
              <div className="border card rounded-2 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <span className="avatar bg-danger rounded-circle">
                      <i className="ti ti-calendar-heart fs-24" />
                    </span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1">Patients</p>
                      <h3 className="fw-bold mb-0">{overviewLoading ? "—" : (overview?.patients?.total ?? 0)}</h3>
                    </div>
                    <div>
                      <div id="s-col-2" className="chart-set">
                        <SCol2Chart />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* end col */}
            <div className="col-xl-3 col-md-6">
              <div className="border card rounded-2 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <span className="avatar bg-info rounded-circle">
                      <i className="ti ti-calendar-heart fs-24" />
                    </span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1">Visits</p>
                      <h3 className="fw-bold mb-0">{overviewLoading ? "—" : (overview?.visits?.total ?? 0)}</h3>
                    </div>
                    <div>
                      <div id="s-col-3" className="chart-set">
                        <SCol3Chart />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* end col */}
            <div className="col-xl-3 col-md-6">
              <div className="border card rounded-2 shadow-sm">
                <div className="card-body">
                  <div className="d-flex align-items-center mb-2">
                    <span className="avatar bg-success rounded-circle">
                      <i className="ti ti-calendar-heart fs-24" />
                    </span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between overflow-hidden">
                    <div>
                      <p className="mb-1">Revenue</p>
                      <h3 className="fw-bold mb-0 text-truncate">
                        {overviewLoading ? "—" : formatRevenue(overview?.revenue?.total ?? 0)}
                      </h3>
                    </div>
                    <div>
                      <div id="s-col-4" className="chart-set">
                        <SCol4Chart />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* end col */}
          </div>
          {/* end row */}
          {/* row start */}
          <div className="row">
            {/* col start */}
            <div className="col-xl-12">
              {/* card start */}
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">Appointment Statistics</h5>
                  <div className="dropdown">
                    <button
                      type="button"
                      className="btn btn-sm px-2 border shadow-sm btn-outline-white d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      {visitStatsPeriod === "daily" ? "Daily" : visitStatsPeriod === "week" ? "Weekly" : visitStatsPeriod === "month" ? "Monthly" : "Yearly"} <i className="ti ti-chevron-down ms-1" />
                    </button>
                    <ul className="dropdown-menu">
                      <li><button className="dropdown-item" onClick={() => setVisitStatsPeriod("daily")}>Daily</button></li>
                      <li><button className="dropdown-item" onClick={() => setVisitStatsPeriod("week")}>Weekly</button></li>
                      <li><button className="dropdown-item" onClick={() => setVisitStatsPeriod("month")}>Monthly</button></li>
                      <li><button className="dropdown-item" onClick={() => setVisitStatsPeriod("year")}>Yearly</button></li>
                    </ul>
                  </div>
                </div>
                <div className="card-body pb-0">
                  <div className="row row-gap-3 mb-2">
                    <div className="col-md-2 col-sm-6">
                      <div className="bg-light border p-2 text-center rounded-2">
                        <p className="mb-1 text-truncate"><i className="ti ti-point-filled me-1 text-primary" />All</p>
                        <h5 className="fw-bold mb-0">{visitStatsSummary.all}</h5>
                      </div>
                    </div>
                    <div className="col-md-2 col-sm-6">
                      <div className="bg-light border p-2 text-center rounded-2">
                        <p className="mb-1 text-truncate"><i className="ti ti-point-filled me-1 text-info" />Scheduled</p>
                        <h5 className="fw-bold mb-0">{visitStatsSummary.scheduled}</h5>
                      </div>
                    </div>
                    <div className="col-md-2 col-sm-6">
                      <div className="bg-light border p-2 text-center rounded-2">
                        <p className="mb-1 text-truncate"><i className="ti ti-point-filled me-1 text-warning" />In Progress</p>
                        <h5 className="fw-bold mb-0">{visitStatsSummary.inProgress}</h5>
                      </div>
                    </div>
                    <div className="col-md-2 col-sm-6">
                      <div className="bg-light border p-2 text-center rounded-2">
                        <p className="mb-1 text-truncate"><i className="ti ti-point-filled me-1 text-success" />Completed</p>
                        <h5 className="fw-bold mb-0">{visitStatsSummary.completed}</h5>
                      </div>
                    </div>
                    <div className="col-md-2 col-sm-6">
                      <div className="bg-light border p-2 text-center rounded-2">
                        <p className="mb-1 text-truncate"><i className="ti ti-point-filled me-1 text-danger" />Cancelled</p>
                        <h5 className="fw-bold mb-0">{visitStatsSummary.cancelled}</h5>
                      </div>
                    </div>
                    <div className="col-md-2 col-sm-6">
                      <div className="bg-light border p-2 text-center rounded-2">
                        <p className="mb-1 text-truncate"><i className="ti ti-point-filled me-1 text-secondary" />No Show</p>
                        <h5 className="fw-bold mb-0">{visitStatsSummary.noShow}</h5>
                      </div>
                    </div>
                  </div>
                  <div className="chart-set" id="s-col-19">
                    <SCol19Chart categories={visitStatsCategories} series={visitStatsSeries} />
                  </div>
                </div>
              </div>
              {/* card end */}
            </div>
            {/* col end */}
          </div>
          {/* end row - chart only */}
          {/* Revenue Statistics */}
          <div className="row mb-3">
            <div className="col-12">
              <RevenueChart />
            </div>
          </div>
          {/* start row - Recent Transactions */}
          <div className="row">
            <div className="col-12 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header">
                  <h5 className="fw-bold mb-0">Recent Transactions</h5>
                </div>
                <div className="card-body">
                  {transactionsLoading ? (
                    <p className="mb-0 text-muted">Loading…</p>
                  ) : recentTransactions.length === 0 ? (
                    <p className="mb-0 text-muted">No recent transactions</p>
                  ) : (
                    recentTransactions.map((txn, index) => (
                      <div
                        key={txn._id}
                        className={`d-flex justify-content-between align-items-center ${index < recentTransactions.length - 1 ? "mb-3" : ""}`}
                      >
                        <div className="d-flex align-items-center min-w-0 flex-grow-1 me-2">
                          <span className="avatar bg-primary rounded-circle flex-shrink-0">
                            <i className="ti ti-receipt fs-18 text-white" />
                          </span>
                          <div className="min-w-0 ms-2">
                            <h6 className="fs-14 mb-0 text-truncate fw-semibold">
                              {txn.patientName ?? "—"}
                            </h6>
                            <p className="mb-0 fs-13 text-muted text-truncate">
                              {txn.serviceName ?? "—"} · {txn.transactionId}
                            </p>
                            <p className="mb-0 fs-12 text-muted">
                              {formatTransactionDate(txn.transactionDate)} · {txn.paymentMode}
                            </p>
                          </div>
                        </div>
                        <span className="badge fw-medium bg-success flex-shrink-0">
                          {formatRevenue(txn.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            {/* col end */}
          </div>
          {/* end row */}
          {/* row start */}
          <div className="row">
            <div className="col-12 d-flex">
              <div className="card shadow-sm flex-fill w-100">
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="fw-bold mb-0">All Appointments</h5>
                  <Link
                    href={all_routes.appointments}
                    className="btn fw-normal btn-outline-white"
                  >
                    View All
                  </Link>
                </div>
                <div className="card-body">
                  {/* Table start */}
                  <div className="table-responsive table-nowrap">
                    <table className="table border">
                      <thead className="thead-light">
                        <tr>
                          <th>Doctor</th>
                          <th>Patient</th>
                          <th>Date &amp; Time</th>
                          <th>Mode</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentLoading ? (
                          <tr>
                            <td colSpan={5} className="text-center py-3">
                              Loading appointments...
                            </td>
                          </tr>
                        ) : recentAppointments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-3">
                              No appointments found.
                            </td>
                          </tr>
                        ) : (
                          recentAppointments.map((item) => (
                            <tr key={item.id}>
                              <td>{item.doctorName}</td>
                              <td>{item.patientName}</td>
                              <td>{item.dateTime || "—"}</td>
                              <td>{item.appointmentType || "OPD"}</td>
                              <td>
                                <span
                                  className={`badge fs-13 py-1 rounded fw-medium ${getStatusBadgeClass(
                                    item.status
                                  )}`}
                                >
                                  {item.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Table end */}
                </div>
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

export default DashboardComponent;
