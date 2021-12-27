import React from "react";

const Debugger = ({ overrides, setOverrides }) => {
  // const context = {
  //   region: REGION,
  //   targetRace: TARGET_RACE,
  //   trainingPrefs: TRAINING_PREFS,
  //   today: TODAY,
  //   historicalActivities,
  //   sinceTrainingPlanActivities,
  // };

  const dateF = new Intl.DateTimeFormat(overrides.region, {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });

  const activities = [
    ...overrides.historicalActivities,
    ...overrides.sinceTrainingPlanActivities,
  ]
    .filter((ac) => ac.date < overrides.today)
    .sort((a, b) => b.date - a.date);

  const getActivityType = (activity) => {
    if (activity.date < overrides.targetRace.trainingStartDate) {
      return "historicalActivities";
    }
    return "sinceTrainingPlanActivities";
  };

  const addActivity = (activity) => {
    const key = getActivityType(activity);

    setOverrides({
      ...overrides,
      [key]: [...overrides[key], activity],
    });
  };

  const deleteActivity = (activity) => {
    const key = getActivityType(activity);

    console.log(activity, overrides[key]);

    setOverrides({
      ...overrides,
      [key]: overrides[key].filter(
        (ac) =>
          ac.date.getTime() !== activity.date.getTime() &&
          ac.distance !== activity.distance
      ),
    });
  };

  return (
    <div style={{ padding: "20px", margin: "20px", border: "1px solid black" }}>
      <div>
        Today:{" "}
        <input
          type="range"
          value={overrides.today.getTime()}
          onChange={(e) => {
            setOverrides({
              ...overrides,
              today: new Date(parseInt(e.target.value, 10)),
            });
          }}
          min={overrides.targetRace.trainingStartDate.getTime()}
          max={overrides.targetRace.date.getTime()}
        />
      </div>
      <div>
        Target distance:{" "}
        <input
          type="number"
          value={overrides.targetRace.distance}
          onChange={(e) => {
            setOverrides({
              ...overrides,
              targetRace: {
                ...overrides.targetRace,
                distance: parseInt(e.target.value, 10),
              },
            });
          }}
        />
      </div>
      <div>
        Target time:{" "}
        <input
          type="number"
          value={overrides.targetRace.movingTime}
          onChange={(e) => {
            setOverrides({
              ...overrides,
              targetRace: {
                ...overrides.targetRace,
                movingTime: parseInt(e.target.value, 10),
              },
            });
          }}
        />
      </div>
      <div>
        Activities:{" "}
        <select
          style={{
            width: "fit-content",
            overflow: "auto",
            padding: "10px",
            border: "1px solid black",
          }}
          multiple
          size={10}
          onKeyUp={(e) => {
            if (e.key === "+") {
              const distance = prompt("Distance run");
              const dateStr = prompt("ISO Date run");
              const movingTime = prompt("Time run seconds");
              const date = new Date(dateStr);
              addActivity({
                distance,
                date,
                movingTime,
              });
            } else if (e.key === "Backspace") {
              deleteActivity(activities[e.target.value]);
            }
          }}
        >
          {activities.map((activity, i) => (
            <option key={activity.date} value={i}>
              {dateF.format(activity.date)} — {activity.distance} /{" "}
              {activity.movingTime}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default Debugger;
