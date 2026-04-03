import { all_routes } from "@/routes/all_routes";

export const normalizeRole = (role: string | undefined | null): string =>
  (role ?? "").trim().toUpperCase();

/** Path matches if equal or nested (e.g. /appointment-details/1). */
export const matchesPathPrefix = (pathname: string, prefix: string): boolean => {
  if (!pathname || !prefix) return false;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
};

/**
 * Paths any authenticated role may open (profile, notifications, etc.).
 */
const COMMON_AUTH_PATH_PREFIXES: string[] = [
  all_routes.profile,
  all_routes.profilesettings,
  all_routes.securitysettings,
  all_routes.notificationssettings,
  all_routes.notifications,
];

/**
 * Role → allowed app path prefixes. ADMIN: implicit full access.
 * Detail/edit routes are covered by their parent prefix.
 */
const ROLE_PATH_PREFIXES: Record<string, string[]> = {
  RECEPTIONIST: [
    all_routes.newAppointment,
    all_routes.appointments,
    all_routes.appointmentDetails,
    all_routes.editAppointment,
    all_routes.appointmentCalendar,
    all_routes.appointmentconsultations,
    all_routes.patients,
    all_routes.patientsGrid,
    all_routes.patientDetails,
    all_routes.createPatient,
    all_routes.editPatient,
    all_routes.daycareAppointments,
    all_routes.daycareAppointmentDetails,
    all_routes.editDaycareAppointment,
  ],
  DIALYSIS: [all_routes.dialysis, all_routes.dialysisAppointment],
  DOCTOR: [
    all_routes.appointments,
    all_routes.appointmentDetails,
    all_routes.editAppointment,
    all_routes.appointmentCalendar,
    all_routes.appointmentconsultations,
    all_routes.daycareAppointments,
    all_routes.daycareAppointmentDetails,
    all_routes.editDaycareAppointment,
  ],
  RECEPTIONIST2: [
    all_routes.patients,
    all_routes.patientsGrid,
    all_routes.patientDetails,
    all_routes.createPatient,
    all_routes.editPatient,
  ],
};

export const canAccessPath = (role: string, pathname: string): boolean => {
  const r = normalizeRole(role);
  if (r === "ADMIN") return true;
  if (COMMON_AUTH_PATH_PREFIXES.some((p) => matchesPathPrefix(pathname, p))) {
    return true;
  }
  const prefixes = ROLE_PATH_PREFIXES[r];
  if (!prefixes) return false;
  return prefixes.some((p) => matchesPathPrefix(pathname, p));
};

export const getDefaultRouteForRole = (role: string): string => {
  const r = normalizeRole(role);
  switch (r) {
    case "ADMIN":
      return all_routes.dashboard;
    case "RECEPTIONIST":
      return all_routes.newAppointment;
    case "DIALYSIS":
      return all_routes.dialysis;
    case "DOCTOR":
      return all_routes.appointments;
    case "RECEPTIONIST2":
      return all_routes.patients;
    default:
      return all_routes.login;
  }
};

/** Sidebar single-item link: external URLs only for ADMIN; paths use canAccessPath. */
export const isSidebarItemLinkAllowed = (role: string, link: string | undefined): boolean => {
  const r = normalizeRole(role);
  if (r === "ADMIN") return true;
  if (!link || link === "#" || link === "index") return true;
  if (link.startsWith("http")) return false;
  return canAccessPath(r, link);
};

export const canShowNewAppointmentSidebarCta = (role: string): boolean => {
  const r = normalizeRole(role);
  return r === "ADMIN" || r === "RECEPTIONIST";
};

/** Drop sidebar entries the role cannot access; recurse into nested submenuItems. */
export const filterSidebarSubmenuItems = (role: string, items: any[] | undefined): any[] => {
  if (!items?.length) return [];
  const out: any[] = [];
  for (const item of items) {
    if (item?.submenuItems?.length) {
      const nested = filterSidebarSubmenuItems(role, item.submenuItems);
      if (nested.length === 0) continue;
      out.push({ ...item, submenuItems: nested });
      continue;
    }
    if (isSidebarItemLinkAllowed(role, item?.link)) {
      out.push(item);
    }
  }
  return out;
};
