import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const IST_TIMEZONE = "Asia/Kolkata";

export const getDayNameInIST = (
  date: dayjs.Dayjs | string | Date | null | undefined
): string => {
  if (!date) return "";
  const base = dayjs.isDayjs(date) ? date : dayjs(date);
  return base.tz(IST_TIMEZONE).format("dddd");
};

