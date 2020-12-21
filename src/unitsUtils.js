import { MINUTE_IN_MS } from "./datesUtils";

export const METERS_IN_KM = 1000;

export const humanDistance = (distance) => {
  const distanceKm = distance / METERS_IN_KM;
  return `${distanceKm.toFixed(1)}km`;
};

export const humanPace = (movingTime, distance) => {
  const secondMeterPace = movingTime / distance;
  const minuteKmPace = (1000 * secondMeterPace) / 60;

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
  const secondMeterPace = (60 * minuteKmPace) / METERS_IN_KM;

  return secondMeterPace;
};
