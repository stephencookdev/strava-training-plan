import { MINUTE_IN_MS } from "./datesUtils";

export const KM_IN_METERS = 1000;

export const humanDistance = (distance) => {
  const distanceKm = distance / KM_IN_METERS;
  return `${distanceKm.toFixed(1)}km`;
};

export const humanPace = (movingTime, distance) => {
  const msMeterPace = movingTime / distance;
  const minuteKmPace = (KM_IN_METERS * msMeterPace) / MINUTE_IN_MS;

  const minuteKmPaceWhole = Math.floor(minuteKmPace);
  const minuteKmPaceSeconds = Math.floor(
    (minuteKmPace - minuteKmPaceWhole) * 60
  )
    .toString()
    .padStart(2, "0");

  const cookedMinuteKmPace = `${minuteKmPaceWhole}:${minuteKmPaceSeconds}`;

  return cookedMinuteKmPace;
};

export const parseHumanPaceKm = (paceKmStr) => {
  const [minutesStr, secondsStr] = paceKmStr.split(":");
  const minutes = parseInt(minutesStr);
  const seconds = parseInt(secondsStr);

  const minuteKmPace = minutes + seconds / 60;
  const msMeterPace = (MINUTE_IN_MS * minuteKmPace) / KM_IN_METERS;

  return msMeterPace;
};
