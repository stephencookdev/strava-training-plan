import React, { useContext } from "react";
import { AppContext } from "../App";

const ReAdjustPlan = () => {
  const { setContext } = useContext(AppContext);

  return (
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
  );
};

export default ReAdjustPlan;
