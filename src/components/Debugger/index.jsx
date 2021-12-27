import React from "react";

const Debugger = ({ context, setContext }) => {
  // const context = {
  //   region: REGION,
  //   targetRace: TARGET_RACE,
  //   trainingPrefs: TRAINING_PREFS,
  //   today: TODAY,
  //   activities,
  // };

  const dateF = new Intl.DateTimeFormat(context.region, {
    day: "numeric",
    month: "short",
    year: "2-digit",
  });

  const activities = context.activities
    .filter((ac) => ac.date < context.today)
    .sort((a, b) => b.date - a.date);

  const addActivity = (activity) => {
    setContext({
      ...context,
      activities: [...context.activities, activity],
    });
  };

  const deleteActivity = (activity) => {
    setContext({
      ...context,
      activities: context.activities.filter(
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
          value={context.today.getTime()}
          onChange={(e) => {
            setContext({
              ...context,
              today: new Date(parseInt(e.target.value, 10)),
            });
          }}
          min={context.targetRace.trainingStartDates[0].getTime()}
          max={context.targetRace.date.getTime()}
        />
      </div>
      <div>
        Target distance:{" "}
        <input
          type="number"
          value={context.targetRace.distance}
          onChange={(e) => {
            setContext({
              ...context,
              targetRace: {
                ...context.targetRace,
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
          value={context.targetRace.movingTime}
          onChange={(e) => {
            setContext({
              ...context,
              targetRace: {
                ...context.targetRace,
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
