"use client";

import Sidebar from "@/core/common/sidebar/sidebar";
import { all_routes } from "@/routes/all_routes";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const receptionistRestrictedPrefixes = [
    all_routes.dashboard,
    all_routes.doctordashboard,
    all_routes.patientdashboard,
    all_routes.procedures,
    all_routes.addProcedure,
    all_routes.procedureDetails,
    all_routes.doctorsList,
    all_routes.users,
    all_routes.createUser,
    all_routes.rolesPermissions,
    all_routes.permissions,
    all_routes.deleteaccountrequest,
    all_routes.leaves,
    all_routes.leaveType,
    all_routes.transactions,
    all_routes.incomeReport,
    all_routes.expenseReport,
    all_routes.profitloss,
    all_routes.appointmentReport,
    all_routes.patientReport,
  ];

  useEffect(() => {
    const authUserRaw = localStorage.getItem("authUser");
    if (!authUserRaw) return;

    let role = "";
    try {
      const authUser = JSON.parse(authUserRaw);
      role = authUser?.role?.toUpperCase?.() ?? "";
    } catch {
      role = "";
    }

    if (role !== "RECEPTIONIST") return;
    const isRestricted = receptionistRestrictedPrefixes.some(
      (prefix) => pathname === prefix || pathname?.startsWith(`${prefix}/`)
    );
    if (!isRestricted) return;

    router.replace(all_routes.appointments);
  }, [pathname, router]);

  return (
    <div className="main-wrapper">
      <Sidebar />
      {children}
    </div>
  );
}
