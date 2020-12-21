export const humanDistance = (distance) => {
  const distanceKm = distance / 1000;
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
