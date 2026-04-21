import "@/core/api/axiosAuth";

export const base_path = "/nextjs/template/";
export const img_path = "/nextjs/template/";
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/** e.g. https://pathlabapi.kilobyte.live/api/v1/shared/auth — omit trailing slash */
export const SHARED_AUTH_BASE_URL = process.env.NEXT_PUBLIC_SHARED_AUTH_BASE_URL;

/** Optional: Pathlab / lab portal login URL for “wrong session type” messaging */
export const PATHLAB_PORTAL_LOGIN_URL =
  process.env.NEXT_PUBLIC_PATHLAB_PORTAL_LOGIN_URL || "https://lab.jjmhospitalkashipur.com/login-cover";