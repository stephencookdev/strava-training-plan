import React from "react";

const difficultyMap = {
  "to 0.1": "C",
  "0.1 to 0.65": "B",
  "0.65 to 0.85": "A",
  "0.85 to 0.95": "B",
  "0.95 to 1": "C",
  "1 to 1.05": "D",
  "1.05 to 1.1": "E",
  "1.1 to": "F",
};

const weekDiffScoreMap = {
  "to -1": "F",
  "-1 to -0.9": "E",
  "-0.9 to -0.8": "D",
  "-0.8 to -0.6": "C",
  "-0.6 to -0.4": "B",
  "-0.4 to 0.4": "A",
  "0.4 to 0.7": "B",
  "0.7 to 0.9": "C",
  "0.9 to": "C",
};

const allLetters = ["A", "B", "C", "D", "E", "F"];
const letterToColor = allLetters.reduce(
  (acc, cur, i) => ({
    ...acc,
    [cur]: `rgb(${100 + (i * 250) / allLetters.length}, ${
      230 - (i * 230) / allLetters.length
    }, 100)`,
  }),
  {}
);

const getPolarity = (num, map) => {
  const peakRange = Object.entries(map).find(
    ([_, letter]) => letter === "A"
  )[0];
  const [min, max] = peakRange.split(/\s*to\s*/);
  const aboveMax = !max || parseFloat(max, 10) < num;
  const belowMin = !min || parseFloat(min, 10) > num;

  return aboveMax ? "+" : belowMin ? "-" : "";
};

const getLetter = (num, map) => {
  let finalLetter;
  Object.entries(map).forEach(([range, letter]) => {
    const [min, max] = range.split(/\s*to\s*/);
    const aboveMin = !min || parseFloat(min, 10) <= num;
    const belowMax = !max || parseFloat(max, 10) >= num;

    if (aboveMin && belowMax) {
      finalLetter = letter;
    }
  });

  return finalLetter;
};

const Scores = ({ difficulty, weekDiffScore, adjustedRecently }) => {
  const difficultyLetter = getLetter(difficulty, difficultyMap);
  const difficultyPolarity = getPolarity(difficulty, difficultyMap);
  const weekDiffScoreLetter = getLetter(weekDiffScore, weekDiffScoreMap);
  const weekDiffScorePolarity = getPolarity(weekDiffScore, weekDiffScoreMap);

  const styling = {
    width: "50%",
    fontSize: "6rem",
    fontWeight: 600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    border: "2px solid currentColor",
    margin: "6rem",
  };

  const titleStyling = {
    fontSize: "1rem",
  };

  const warningStyling = {
    fontSize: "1rem",
    whiteSpace: "break-spaces",
    textAlign: "center",
  };

  return (
    <div style={{ display: "flex" }}>
      <div
        style={{
          ...styling,
          color: adjustedRecently ? "#999" : letterToColor[difficultyLetter],
        }}
      >
        <p style={titleStyling}>Difficulty Score</p>
        {adjustedRecently ? (
          "—"
        ) : (
          <>
            {difficultyLetter}{" "}
            {difficultyPolarity ? `(${difficultyPolarity})` : ""}
          </>
        )}
        {!adjustedRecently && difficulty >= 1.1 && (
          <p style={warningStyling}>
            You risk an injury by trying to improve too much too quickly! Slow
            and steady
          </p>
        )}
        {!adjustedRecently && difficulty <= 0.1 && (
          <p style={warningStyling}>
            You could push yourself a bit harder! You have room for a more
            ambitious goal, if you like
          </p>
        )}
      </div>
      <div style={{ ...styling, color: letterToColor[weekDiffScoreLetter] }}>
        <p style={titleStyling}>Progress Score</p>
        {weekDiffScoreLetter}{" "}
        {weekDiffScorePolarity ? `(${weekDiffScorePolarity})` : ""}
        {weekDiffScore <= -1 && (
          <p style={warningStyling}>
            You're very off-schedule. It is strongly recommended that you
            re-sync your training plan!
          </p>
        )}
        {weekDiffScore >= 0.4 && (
          <p style={warningStyling}>
            You're going a little too hard! Stick to the plan
          </p>
        )}
      </div>
    </div>
  );
};

export default Scores;
