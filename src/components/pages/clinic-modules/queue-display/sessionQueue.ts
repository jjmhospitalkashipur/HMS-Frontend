export type ISessionSlot = string | null;

export const parseSessionSlot = (value: unknown): ISessionSlot => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const parseCurrentSessionSlot = (data: Record<string, unknown>): ISessionSlot =>
  parseSessionSlot(data.currentSessionSlot ?? data.sessionSlot);

export const shouldShowVisitOnScreen = (
  visitSlot: ISessionSlot | undefined,
  currentSlot: ISessionSlot | undefined
): boolean => {
  const isSlotless = !visitSlot;
  const isCurrentSlot = Boolean(currentSlot && visitSlot === currentSlot);
  return isSlotless || isCurrentSlot;
};

export const getSessionSlotBadge = (visitSlot: ISessionSlot | undefined): string =>
  visitSlot?.trim() || "All Day";

export const getDeletedVisitId = (data: Record<string, unknown>): string => {
  const visit = data.visit as Record<string, unknown> | undefined;
  return (
    (typeof data.visitId === "string" ? data.visitId : "") ||
    (typeof visit?.visitId === "string" ? visit.visitId : "") ||
    (typeof visit?._id === "string" ? visit._id : "")
  );
};
