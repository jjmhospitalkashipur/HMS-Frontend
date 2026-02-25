import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const IST = "Asia/Kolkata";

/**
 * Returns the day of week name (e.g. "Monday", "Wednesday") for the given date
 * in Indian Standard Time (Asia/Kolkata), so the day is consistent regardless of server/browser timezone.
 */
export function getDayNameInIST(date: dayjs.Dayjs | string | null | undefined): string {
  if (date == null) return "";
  const d = dayjs.isDayjs(date) ? date : dayjs(date);
  return d.tz(IST).format("dddd");
}
