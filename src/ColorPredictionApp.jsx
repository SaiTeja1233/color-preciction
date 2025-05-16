import React, { useState, useEffect, useCallback } from "react";
import "./ColorPredictionApp.css"; // Import the CSS file
import { useNavigate } from "react-router-dom";

const ColorPredictionApp = () => {
    const [entries, setEntries] = useState([]);
    const [inputNumbers, setInputNumbers] = useState("");
    const [inputPeriod, setInputPeriod] = useState("001");
    const [analysis, setAnalysis] = useState({});
    const [topPredictions, setTopPredictions] = useState([]);
    const [predictionPreference, setPredictionPreference] = useState(null);

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
            return { predictions: [], preference: null };
        }

        const colorTransitionMap = {};
        const sizeTransitionMap = {};
        const colorNumberMap = {};
        const sizeNumberMap = {
            Big: [],
            Small: [],
        };

        chronologicalEntries.forEach((entry) => {
            const color = entry.color.replace("🟣", "");
            const size = entry.size;
            const number = entry.number;

            if (!colorNumberMap[color]) colorNumberMap[color] = {};
            colorNumberMap[color][number] =
                (colorNumberMap[color][number] || 0) + 1;

            sizeNumberMap[size].push(number);
        });

        for (let i = 0; i < chronologicalEntries.length - 1; i++) {
            const currColor = chronologicalEntries[i].color.replace("🟣", "");
            const nextColor = chronologicalEntries[i + 1].color.replace(
                "🟣",
                ""
            );
            const currSize = chronologicalEntries[i].size;
            const nextSize = chronologicalEntries[i + 1].size;

            if (!colorTransitionMap[currColor])
                colorTransitionMap[currColor] = {};
            colorTransitionMap[currColor][nextColor] =
                (colorTransitionMap[currColor][nextColor] || 0) + 1;

            if (!sizeTransitionMap[currSize]) sizeTransitionMap[currSize] = {};
            sizeTransitionMap[currSize][nextSize] =
                (sizeTransitionMap[currSize][nextSize] || 0) + 1;
        }

        const lastEntry = chronologicalEntries[chronologicalEntries.length - 1];
        const lastColor = lastEntry.color.replace("🟣", "");
        const lastSize = lastEntry.size;

        // Analyze color sequence consistency
        const colorTransitions = colorTransitionMap[lastColor] || {};
        const totalColorTransitions = Object.values(colorTransitions).reduce(
            (sum, count) => sum + count,
            0
        );
        let mostLikelyNextColor = null;
        let maxColorProbability = 0;
        for (const color in colorTransitions) {
            const probability =
                totalColorTransitions > 0
                    ? colorTransitions[color] / totalColorTransitions
                    : 0;
            if (probability > maxColorProbability) {
                maxColorProbability = probability;
                mostLikelyNextColor = color;
            }
        }

        // Analyze size sequence consistency
        const sizeTransitions = sizeTransitionMap[lastSize] || {};
        const totalSizeTransitions = Object.values(sizeTransitions).reduce(
            (sum, count) => sum + count,
            0
        );
        let mostLikelyNextSize = null;
        let maxSizeProbability = 0;
        for (const size in sizeTransitions) {
            const probability =
                totalSizeTransitions > 0
                    ? sizeTransitions[size] / totalSizeTransitions
                    : 0;
            if (probability > maxSizeProbability) {
                maxSizeProbability = probability;
                mostLikelyNextSize = size;
            }
        }

        const colorPredictionWeight = maxColorProbability;
        const sizePredictionWeight = maxSizeProbability;
        const combinedPredictions = {};
        let preference = null;

        if (
            colorPredictionWeight >= sizePredictionWeight &&
            mostLikelyNextColor
        ) {
            preference = "color";
            const colorFrequencies = colorNumberMap[mostLikelyNextColor] || {};
            Object.entries(colorFrequencies)
                .sort(([, countA], [, countB]) => countB - countA)
                .slice(0, 3)
                .forEach(([numberStr, count]) => {
                    combinedPredictions[parseInt(numberStr, 10)] =
                        (combinedPredictions[parseInt(numberStr, 10)] || 0) +
                        colorPredictionWeight;
                });
        } else if (
            sizePredictionWeight >= colorPredictionWeight &&
            mostLikelyNextSize
        ) {
            preference = "size";
            const sizeRelatedNumbers = sizeNumberMap[mostLikelyNextSize];
            const sizeFrequency = sizeRelatedNumbers.reduce((acc, num) => {
                acc[num] = (acc[num] || 0) + 1;
                return acc;
            }, {});
            Object.entries(sizeFrequency)
                .sort(([, countA], [, countB]) => countB - countA)
                .slice(0, 3)
                .forEach(([numberStr, count]) => {
                    combinedPredictions[parseInt(numberStr, 10)] =
                        (combinedPredictions[parseInt(numberStr, 10)] || 0) +
                        sizePredictionWeight;
                });
        } else if (colorPredictionWeight > 0 || sizePredictionWeight > 0) {
            preference = "both";
            if (mostLikelyNextColor) {
                const colorFrequencies =
                    colorNumberMap[mostLikelyNextColor] || {};
                Object.entries(colorFrequencies)
                    .sort(([, countA], [, countB]) => countB - countA)
                    .slice(0, 2)
                    .forEach(([numberStr, count]) => {
                        combinedPredictions[parseInt(numberStr, 10)] =
                            (combinedPredictions[parseInt(numberStr, 10)] ||
                                0) + colorPredictionWeight;
                    });
            }
            if (mostLikelyNextSize) {
                const sizeRelatedNumbers = sizeNumberMap[mostLikelyNextSize];
                const sizeFrequency = sizeRelatedNumbers.reduce((acc, num) => {
                    acc[num] = (acc[num] || 0) + 1;
                    return acc;
                }, {});
                Object.entries(sizeFrequency)
                    .sort(([, countA], [, countB]) => countB - countA)
                    .slice(0, 2)
                    .forEach(([numberStr, count]) => {
                        combinedPredictions[parseInt(numberStr, 10)] =
                            (combinedPredictions[parseInt(numberStr, 10)] ||
                                0) + sizePredictionWeight;
                    });
            }
        } else {
            preference = null;
            // Fallback to most frequent numbers if no strong color or size pattern
            const sortedNumberFrequency = Object.entries(
                chronologicalEntries.reduce((acc, entry) => {
                    acc[entry.number] = (acc[entry.number] || 0) + 1;
                    return acc;
                }, {})
            )
                .sort(([, a], [, b]) => b - a)
                .slice(0, 2)
                .map(([numStr]) => parseInt(numStr, 10));
            return { predictions: sortedNumberFrequency, preference: null };
        }

        const sortedVotes = Object.entries(combinedPredictions)
            .sort(([, weightA], [, weightB]) => weightB - weightA)
            .slice(0, 2)
            .map(([numberStr]) => parseInt(numberStr, 10));

        return { predictions: sortedVotes, preference };
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
            const { predictions, preference } = predictTopTwoNumbers(
                chronologicalEntriesForPrediction
            );
            setTopPredictions(predictions);
            setPredictionPreference(preference);
        } else {
            setAnalysis({});
            setTopPredictions([]);
            setPredictionPreference(null);
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
                    {predictionPreference === "color" ||
                    predictionPreference === "both" ? (
                        <p>
                            Predicted Next Color:{" "}
                            <span
                                className={`predicted-color ${analysis[number].predictedNextColor}`}
                            >
                                {analysis[number].predictedNextColor || "N/A"}
                            </span>
                        </p>
                    ) : null}
                    {predictionPreference === "size" ||
                    predictionPreference === "both" ? (
                        <p>
                            Predicted Next Size:{" "}
                            <span
                                className={`predicted-size ${analysis[number].predictedNextSize}`}
                            >
                                {analysis[number].predictedNextSize || "N/A"}
                            </span>
                        </p>
                    ) : null}
                    {predictionPreference === null && (
                        <>
                            <p>
                                Predicted Next Color:{" "}
                                <span
                                    className={`predicted-color ${analysis[number].predictedNextColor}`}
                                >
                                    {analysis[number].predictedNextColor ||
                                        "N/A"}
                                </span>
                            </p>
                            <p>
                                Predicted Next Size:{" "}
                                <span
                                    className={`predicted-size ${analysis[number].predictedNextSize}`}
                                >
                                    {analysis[number].predictedNextSize ||
                                        "N/A"}
                                </span>
                            </p>
                        </>
                    )}
                </div>
            ))}
        </div>
    );
    const navigate = useNavigate();
    function backtoHome() {
        navigate("/");
    }

    return (
        <div className="mainColorContainer">
            <div className="container">
                <button className="BckHome-btn" onClick={() => backtoHome()}>Back to home</button>
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
                            if (cleaned.length > 30)
                                cleaned = cleaned.slice(0, 30);
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
                                    {index < topPredictions.length - 1
                                        ? " "
                                        : ""}
                                </span>
                            ))}
                        </p>
                        <p className="prediction-info">
                            Based on patterns where{" "}
                            <b>
                                {predictionPreference === "color"
                                    ? "color sequences"
                                    : predictionPreference === "size"
                                    ? "size patterns"
                                    : "both color and size"}
                            </b>{" "}
                            showed more consistency.
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
        </div>
    );
};

export default ColorPredictionApp;
