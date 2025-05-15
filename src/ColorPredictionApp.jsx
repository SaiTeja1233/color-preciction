import React, { useState, useEffect, useCallback } from "react";
import "./ColorPredictionApp.css"; // Import the CSS file

const ColorPredictionApp = () => {
    const [entries, setEntries] = useState([]);
    const [inputNumbers, setInputNumbers] = useState("");
    const [inputPeriod, setInputPeriod] = useState("001");
    const [analysis, setAnalysis] = useState({});
    const [topPredictions, setTopPredictions] = useState([]);

    const getColor = useCallback((number) => {
        return number === 0
            ? "🔴🟣"
            : number === 5
            ? "🟢🟣"
            : number % 2 === 0
            ? "🔴"
            : "🟢";
    }, []);

    const handleAddEntries = () => {
        if (!inputNumbers || !inputPeriod) return;

        const numbersArray = inputNumbers
            .split(/[\s,]+/)
            .map((numStr) => parseInt(numStr, 10))
            .filter((num) => !isNaN(num) && num >= 0 && num <= 9);

        if (numbersArray.length > 0) {
            let currentPeriod = parseInt(inputPeriod, 10);
            if (isNaN(currentPeriod)) {
                currentPeriod = 0;
            }
            const periodLength = inputPeriod.length;

            const newEntries = numbersArray.map((number, index) => {
                const color = getColor(number);
                const size = number >= 5 ? "Big" : "Small";
                const entryPeriod = String(currentPeriod + index).padStart(
                    periodLength,
                    "0"
                );
                return {
                    period: entryPeriod,
                    number,
                    color,
                    size,
                };
            });

            setEntries((prevEntries) => {
                const updated = [...prevEntries, ...newEntries];
                return updated.slice(-50);
            });

            const nextPeriod = String(
                currentPeriod + numbersArray.length
            ).padStart(periodLength, "0");
            setInputPeriod(nextPeriod);
            setInputNumbers("");
        }
    };

    const predictTopTwoNumbers = useCallback((chronologicalEntries) => {
        if (chronologicalEntries.length < 2) {
            return [];
        }

        const transitionMap = {};
        const numberFrequency = {};
        const seqLength = 3;

        for (let i = 0; i < chronologicalEntries.length - 1; i++) {
            const curr = chronologicalEntries[i].number;
            const next = chronologicalEntries[i + 1].number;

            if (!transitionMap[curr]) transitionMap[curr] = {};
            transitionMap[curr][next] = (transitionMap[curr][next] || 0) + 1;

            numberFrequency[curr] = (numberFrequency[curr] || 0) + 1;
        }

        const lastNumber =
            chronologicalEntries[chronologicalEntries.length - 1].number;
        const possibleNext = transitionMap[lastNumber] || {};
        const transitionPredictions = Object.entries(possibleNext)
            .sort(([, countA], [, countB]) => countB - countA)
            .map(([numStr]) => parseInt(numStr, 10));

        const recentSequence = chronologicalEntries
            .slice(-seqLength)
            .map((e) => e.number)
            .join(",");
        const slidingMatches = {};

        for (let i = 0; i < chronologicalEntries.length - seqLength; i++) {
            const window = chronologicalEntries
                .slice(i, i + seqLength)
                .map((e) => e.number)
                .join(",");
            if (
                window === recentSequence &&
                i + seqLength < chronologicalEntries.length
            ) {
                const nextNum = chronologicalEntries[i + seqLength].number;
                slidingMatches[nextNum] = (slidingMatches[nextNum] || 0) + 1;
            }
        }

        const sequencePredictions = Object.entries(slidingMatches)
            .sort(([, countA], [, countB]) => countB - countA)
            .map(([numStr]) => parseInt(numStr, 10));

        const voteCount = {};

        const addVotes = (nums, weight = 1) => {
            nums.forEach((num) => {
                voteCount[num] = (voteCount[num] || 0) + weight;
            });
        };

        addVotes(transitionPredictions, 3);
        addVotes(sequencePredictions, 2);

        const topFrequent = Object.entries(numberFrequency)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 3)
            .map(([numStr]) => parseInt(numStr, 10));
        addVotes(topFrequent, 1);

        const sortedVotes = Object.entries(voteCount)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 2)
            .map(([numStr]) => parseInt(numStr, 10));

        return sortedVotes;
    }, []);

    const analyzeEntries = useCallback(
        (currentEntries) => {
            const chronologicalEntries = [...currentEntries];
            const numberAnalysis = {};

            chronologicalEntries.forEach((entry, currentIndex) => {
                const { number, period } = entry;

                if (!numberAnalysis[number]) {
                    numberAnalysis[number] = { occurrences: [] };
                }

                const occurrenceInfo = { fromPeriod: period };
                if (currentIndex === chronologicalEntries.length - 1) {
                    occurrenceInfo.toNumber = "latest entire";
                    occurrenceInfo.toPeriod = "";
                } else {
                    occurrenceInfo.toNumber =
                        chronologicalEntries[currentIndex + 1].number;
                    occurrenceInfo.toPeriod =
                        chronologicalEntries[currentIndex + 1].period;
                }

                numberAnalysis[number].occurrences.push(occurrenceInfo);
            });

            Object.keys(numberAnalysis).forEach((number) => {
                const occurrences = numberAnalysis[number].occurrences;
                const colorSequence = occurrences
                    .filter((occ) => occ.toNumber !== "latest entire")
                    .map((occ) => getColor(occ.toNumber).replace("🟣", ""))
                    .join("");

                const sizeSequence = occurrences
                    .filter((occ) => occ.toNumber !== "latest entire")
                    .map((occ) => (occ.toNumber >= 5 ? "B" : "S"))
                    .join("");

                const lastColors = occurrences
                    .filter((occ) => occ.toNumber !== "latest entire")
                    .map((occ) => getColor(occ.toNumber).replace("🟣", ""));
                const lastSizes = occurrences
                    .filter((occ) => occ.toNumber !== "latest entire")
                    .map((occ) => (occ.toNumber >= 5 ? "B" : "S"));

                const colorCounts = lastColors.reduce((acc, color) => {
                    acc[color] = (acc[color] || 0) + 1;
                    return acc;
                }, {});
                const predictedNextColor =
                    Object.keys(colorCounts).length > 0
                        ? Object.keys(colorCounts).reduce((a, b) =>
                              colorCounts[a] > colorCounts[b] ? a : b
                          )
                        : "N/A";

                const sizeCounts = lastSizes.reduce((acc, size) => {
                    acc[size] = (acc[size] || 0) + 1;
                    return acc;
                }, {});
                const predictedNextSize =
                    Object.keys(sizeCounts).length > 0
                        ? Object.keys(sizeCounts).reduce((a, b) =>
                              sizeCounts[a] > sizeCounts[b] ? a : b
                          )
                        : "N/A";

                numberAnalysis[number].occurrences = occurrences;
                numberAnalysis[number].colorSequence = colorSequence;
                numberAnalysis[number].sizeSequence = sizeSequence;
                numberAnalysis[number].predictedNextColor = predictedNextColor;
                numberAnalysis[number].predictedNextSize = predictedNextSize;
            });

            setAnalysis(numberAnalysis);
        },
        [getColor]
    );

    useEffect(() => {
        if (entries.length > 1) {
            analyzeEntries(entries);
            const chronologicalEntriesForPrediction = [...entries];
            const predictions = predictTopTwoNumbers(
                chronologicalEntriesForPrediction
            );
            setTopPredictions(predictions);
        } else {
            setAnalysis({});
            setTopPredictions([]);
        }
    }, [entries, analyzeEntries, predictTopTwoNumbers]);

    const renderAnalysis = () => (
        <div className="analysis-grid">
            <h3>Number Analysis:</h3>
            {Object.keys(analysis).map((number) => (
                <div key={number} className="analysis-item">
                    <h4>Number: {number}</h4>
                    <ul>
                        {analysis[number].occurrences.map(
                            (occurrence, index) => (
                                <li key={index}>
                                    {occurrence.fromPeriod} ➝ {number} ➝{" "}
                                    {occurrence.toNumber !== "latest entire"
                                        ? `${occurrence.toNumber} (${occurrence.toPeriod})`
                                        : occurrence.toNumber}
                                </li>
                            )
                        )}
                    </ul>
                    <p>
                        Color Sequence:{" "}
                        <span className="sequence">
                            {analysis[number].colorSequence || "N/A"}
                        </span>
                    </p>
                    <p>
                        Size Sequence:{" "}
                        <span className="sequence">
                            {analysis[number].sizeSequence || "N/A"}
                        </span>
                    </p>
                    <p>
                        Predicted Next Color:{" "}
                        <span
                            className={`predicted-color ${analysis[number].predictedNextColor}`}
                        >
                            {analysis[number].predictedNextColor || "N/A"}
                        </span>
                    </p>
                    <p>
                        Predicted Next Size:{" "}
                        <span
                            className={`predicted-size ${analysis[number].predictedNextSize}`}
                        >
                            {analysis[number].predictedNextSize || "N/A"}
                        </span>
                    </p>
                </div>
            ))}
        </div>
    );

    return (
        <div className="container">
            <h2 className="app-title">Color Prediction App</h2>

            <div className="input-section">
                <input
                    type="text"
                    placeholder="Period"
                    value={inputPeriod}
                    onChange={(e) => setInputPeriod(e.target.value)}
                    className="input-field"
                />
                <input
                    type="text"
                    placeholder="Numbers (e.g., 1 2 5)"
                    value={inputNumbers}
                    onChange={(e) => {
                        let cleaned = e.target.value.replace(/\D/g, "");
                        if (cleaned.length > 30) cleaned = cleaned.slice(0, 30);
                        const spaced = cleaned.split("").join(" ");
                        setInputNumbers(spaced);
                    }}
                    className="input-field"
                />
                <button onClick={handleAddEntries} className="add-button">
                    Add Entries
                </button>
            </div>

            {topPredictions.length > 0 && (
                <div className="prediction-section">
                    <h3>Top Predictions (Next Number):</h3>
                    <p className="predictions">
                        {topPredictions.map((pred, index) => (
                            <span key={index} className="predicted-number">
                                {pred}
                                {index < topPredictions.length - 1 ? ", " : ""}
                            </span>
                        ))}
                    </p>
                    <p className="prediction-info">
                        Based on transition probabilities and sequence matching.
                    </p>
                </div>
            )}

            <div className="entries-table-container">
                <h3>Recent Entries</h3>
                <table className="entries-table">
                    <thead>
                        <tr>
                            <th>Period</th>
                            <th>Number</th>
                            <th>Color</th>
                            <th>Size</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...entries].reverse().map((entry, index) => (
                            <tr key={index}>
                                <td>{entry.period}</td>
                                <td>{entry.number}</td>
                                <td
                                    className={`color-cell ${entry.color.replace(
                                        "🟣",
                                        ""
                                    )}`}
                                >
                                    {entry.color}
                                </td>
                                <td>{entry.size}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {Object.keys(analysis).length > 0 && renderAnalysis()}
        </div>
    );
};

export default ColorPredictionApp;
