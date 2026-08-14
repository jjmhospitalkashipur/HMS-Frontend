import { all_routes } from "@/routes/all_routes";

/**
 * Public routes — accessible without login (HTTP 200).
 * All other app routes require authentication; unauthenticated access shows 404.
 */
export const PUBLIC_PATH_PREFIXES: string[] = [
  all_routes.login,
  all_routes.faq,
  all_routes.pricing,
  all_routes.privacyPolicy,
  all_routes.error404,
  all_routes.error500,
  all_routes.comingSoon,
  all_routes.underMaintenance,
  all_routes.pharmaTokenQueue,
  all_routes.xrayTokenQueue,
  all_routes.queueDisplay,
  all_routes.qdAllPage1,
  all_routes.qdAllPage2,
];

/** Curated routes referenced in route audit (protected unless listed above as public). */
export const CURATED_ROUTE_PATHS: string[] = [
  all_routes.announcements,
  all_routes.blogs,
  all_routes.cities,
  all_routes.dashboard,
  all_routes.faq,
  all_routes.holidays,
  all_routes.invoices,
  all_routes.login,
  all_routes.notifications,
  all_routes.pages,
  all_routes.payments,
  all_routes.pricing,
  all_routes.privacyPolicy,
  all_routes.procedures,
  all_routes.profile,
  all_routes.staffs,
  all_routes.states,
  all_routes.tickets,
  all_routes.transactions,
  all_routes.users,
];

export const matchesPathPrefix = (pathname: string, prefix: string): boolean => {
  if (!pathname || !prefix) return false;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
};

export const isPublicPath = (pathname: string): boolean =>
  PUBLIC_PATH_PREFIXES.some((prefix) => matchesPathPrefix(pathname, prefix));

export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem("authToken") || localStorage.getItem("authUser"));
};
