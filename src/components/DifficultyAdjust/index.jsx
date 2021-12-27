import React, { useContext } from "react";
import { AppContext } from "../App";

const DifficultyAdjust = ({ difficulty }) => {
  const { setContext } = useContext(AppContext);

  return (
    <div>
      Current difficulty: {Math.round(difficulty * 100)}%
      {difficulty > 1 && (
        <div>
          Your plan is too difficult! 😥 Exceeding 100% difficulty is asking for
          injuries. It is recommended that you adjust your plan
        </div>
      )}
    </div>
  );
};

export default DifficultyAdjust;
