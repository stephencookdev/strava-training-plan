import React, { useContext } from "react";
import { AppContext } from "../App";

const ScoreAdjust = () => {
  const { setContext } = useContext(AppContext);

  return (
    <div>
      You're a little off plan! 😥 You should re-adjust your plan.{" "}
      <button
        onClick={() => {
          setContext((context) => ({
            ...context,
            targetRace: {
              ...context.targetRace,
              trainingStartDates: [
                ...context.targetRace.trainingStartDates,
                context.today,
              ],
            },
          }));
        }}
      >
        Re-adjust Plan
      </button>
    </div>
  );
};

export default ScoreAdjust;
