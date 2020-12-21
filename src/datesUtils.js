export const MINUTE_IN_MS = 1000 * 60;
export const DAY_IN_MS = MINUTE_IN_MS * 60 * 24;
export const WEEK_IN_MS = DAY_IN_MS * 7;

export const getStartOfDay = (date) => {
  return Math.floor(date / DAY_IN_MS) * DAY_IN_MS + 1;
};

export const getEndOfDay = (date) => {
  return Math.ceil(date / DAY_IN_MS) * DAY_IN_MS - 1;
};
