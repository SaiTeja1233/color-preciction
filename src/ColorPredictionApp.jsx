import React, { useState, useEffect, useCallback } from "react";
import "./ColorPredictionApp.css";
import { useNavigate } from "react-router-dom";

const MAX_ENTRIES = 50;
const LAST_ENTRY_RULE_BOOST = 0.2;
const COMBINED_PREDICTION_WEIGHT_FACTOR = 0.5;
const STATISTICAL_PREDICTION_BASE_WEIGHT = 0.2;
const PREDICTION_COUNT = 2;
const DISPLAY_COLORS_PER_ROW = 5;

const getColor = (number) => {
    if (number === 0) return "🔴🟣";
    if (number === 5) return "🟢🟣";
    return number % 2 === 0 ? "🔴" : "🟢";
};

const getSize = (number) => (number >= 5 ? "Big" : "Small");

const ColorPredictionApp = () => {
    const [entries, setEntries] = useState([]);
    const [inputNumbers, setInputNumbers] = useState("");
    const [inputPeriod, setInputPeriod] = useState("001");
    const [analysis, setAnalysis] = useState({});
    const [predictions, setPredictions] = useState([]);
    const [predictionPreference, setPredictionPreference] = useState(null);
    const navigate = useNavigate();

    const handleAddEntries = () => {
        if (!inputNumbers || !inputPeriod) return;

        const numbersArray = inputNumbers
            .split(/[\s,]+/)
            .map((numStr) => parseInt(numStr, 10))
            .filter((num) => !isNaN(num) && num >= 0 && num <= 9);

        if (numbersArray.length > 0) {
            const currentPeriod = parseInt(inputPeriod, 10) || 0;
            const periodLength = inputPeriod.length;

            const newEntries = numbersArray.map((number, index) => {
                const color = getColor(number);
                const size = getSize(number);
                const period = String(currentPeriod + index).padStart(
                    periodLength,
                    "0"
                );
                return {
                    period,
                    number,
                    color,
                    size,
                    id: `${period}-${number}`,
                };
            });

            setEntries((prevEntries) =>
                [...prevEntries, ...newEntries].slice(-MAX_ENTRIES)
            );
            setInputPeriod(
                String(currentPeriod + numbersArray.length).padStart(
                    periodLength,
                    "0"
                )
            );
            setInputNumbers("");
        }
    };

    const predictTopTwoNumbers = useCallback((chronologicalEntries) => {
        if (chronologicalEntries.length < MAX_ENTRIES) {
            return { predictions: [], preference: null };
        }

        const last50Entries = chronologicalEntries.slice(-MAX_ENTRIES);
        const last10Colors = last50Entries
            .slice(-10)
            .map((entry) => entry.color.replace("🟣", ""));

        const colorTransitionMap = {};
        const sizeTransitionMap = {};
        const colorNumberMap = {};
        const sizeNumberMap = { Big: [], Small: [] };

        last50Entries.forEach((entry) => {
            const color = entry.color.replace("🟣", "");
            const size = entry.size;
            const number = entry.number;

            colorNumberMap[color] = colorNumberMap[color] || {};
            colorNumberMap[color][number] =
                (colorNumberMap[color][number] || 0) + 1;
            sizeNumberMap[size].push(number);
        });

        for (let i = 0; i < last50Entries.length - 1; i++) {
            const currColor = last50Entries[i].color.replace("🟣", "");
            const nextColor = last50Entries[i + 1].color.replace("🟣", "");
            const currSize = last50Entries[i].size;
            const nextSize = last50Entries[i + 1].size;

            colorTransitionMap[currColor] = colorTransitionMap[currColor] || {};
            colorTransitionMap[currColor][nextColor] =
                (colorTransitionMap[currColor][nextColor] || 0) + 1;

            sizeTransitionMap[currSize] = sizeTransitionMap[currSize] || {};
            sizeTransitionMap[currSize][nextSize] =
                (sizeTransitionMap[currSize][nextSize] || 0) + 1;
        }

        const lastEntry = last50Entries[last50Entries.length - 1];
        const lastColor = lastEntry.color.replace("🟣", "");
        const lastSize = lastEntry.size;

        const getColorProbability = (transitions, lastValue) => {
            const nextTransitions = transitions[lastValue] || {};
            const totalTransitions = Object.values(nextTransitions).reduce(
                (sum, count) => sum + count,
                0
            );
            let mostLikelyNext = null;
            let maxProbability = 0;
            const MIN_PROBABILITY_THRESHOLD = 0.1;

            for (const key in nextTransitions) {
                const probability =
                    totalTransitions > 0
                        ? nextTransitions[key] / totalTransitions
                        : 0;
                if (
                    probability > maxProbability &&
                    probability >= MIN_PROBABILITY_THRESHOLD
                ) {
                    maxProbability = probability;
                    mostLikelyNext = key;
                }
            }
            return {
                mostLikely: mostLikelyNext,
                probability: maxProbability,
            };
        };

        const {
            mostLikely: mostLikelyNextColor,
            probability: colorProbability,
        } = getColorProbability(colorTransitionMap, lastColor);
        const { mostLikely: mostLikelyNextSize, probability: sizeProbability } =
            getColorProbability(sizeTransitionMap, lastSize);

        const combinedPredictions = {};
        let preference = null;

        // New logic: Analyze last 10 colors
        const last10ColorCounts = last10Colors.reduce((acc, color) => {
            acc[color] = (acc[color] || 0) + 1;
            return acc;
        }, {});

        let mostFrequentLast10Color = null;
        let maxLast10ColorCount = 0;

        for (const color in last10ColorCounts) {
            if (last10ColorCounts[color] > maxLast10ColorCount) {
                maxLast10ColorCount = last10ColorCounts[color];
                mostFrequentLast10Color = color;
            }
        }

        let reversedPredictedColorNumber = null;
        if (mostFrequentLast10Color === "🔴") {
            reversedPredictedColorNumber = [1, 3, 5, 7, 9][
                Math.floor(Math.random() * 5)
            ]; // Map to a random green number
        } else if (mostFrequentLast10Color === "🟢") {
            reversedPredictedColorNumber = [0, 2, 4, 6, 8][
                Math.floor(Math.random() * 5)
            ]; // Map to a random red number
        }

        if (reversedPredictedColorNumber !== null) {
            combinedPredictions[reversedPredictedColorNumber] =
                (combinedPredictions[reversedPredictedColorNumber] || 0) + 1.0; // Give it a high weight
        }

        const applyLastEntryRule = (predictions) => {
            const boostedPredictions = { ...predictions };
            const lastIsSmall = lastSize === "Small";
            const lastIsBig = lastSize === "Big";
            const lastIsGreen = lastColor === "🟢";
            const lastIsRed = lastColor === "🔴";

            const evenNumbers = [0, 2, 4, 6, 8];
            const oddNumbers = [1, 3, 5, 7, 9];
            const smallNumbers = [0, 1, 2, 3, 4];
            const bigNumbers = [5, 6, 7, 8, 9];

            const ruleBasedPredictions = new Set();

            if (lastIsSmall)
                smallNumbers
                    .filter((n) => evenNumbers.includes(n))
                    .forEach((n) => ruleBasedPredictions.add(n));
            if (lastIsBig)
                bigNumbers.forEach((n) => ruleBasedPredictions.add(n));
            if (lastIsGreen)
                oddNumbers.forEach((n) => ruleBasedPredictions.add(n));
            if (lastIsRed)
                evenNumbers.forEach((n) => ruleBasedPredictions.add(n));

            ruleBasedPredictions.forEach((num) => {
                boostedPredictions[num] =
                    (boostedPredictions[num] || 0) + LAST_ENTRY_RULE_BOOST;
            });

            return boostedPredictions;
        };

        if (colorProbability >= sizeProbability && mostLikelyNextColor) {
            preference = "color";
            const colorFrequencies = colorNumberMap[mostLikelyNextColor] || {};
            Object.entries(colorFrequencies)
                .sort(([, countA], [, countB]) => countB - countA)
                .slice(0, 3)
                .forEach(([numberStr]) => {
                    combinedPredictions[parseInt(numberStr, 10)] =
                        (combinedPredictions[parseInt(numberStr, 10)] || 0) +
                        colorProbability;
                });
        } else if (sizeProbability >= colorProbability && mostLikelyNextSize) {
            preference = "size";
            const sizeRelatedNumbers = sizeNumberMap[mostLikelyNextSize];
            const sizeFrequency = sizeRelatedNumbers.reduce((acc, num) => {
                acc[num] = (acc[num] || 0) + 1;
                return acc;
            }, {});
            Object.entries(sizeFrequency)
                .sort(([, countA], [, countB]) => countB - countA)
                .slice(0, 3)
                .forEach(([numberStr]) => {
                    combinedPredictions[parseInt(numberStr, 10)] =
                        (combinedPredictions[parseInt(numberStr, 10)] || 0) +
                        sizeProbability;
                });
        } else if (colorProbability > 0 || sizeProbability > 0) {
            preference = "both";
            if (mostLikelyNextColor) {
                const colorFrequencies =
                    colorNumberMap[mostLikelyNextColor] || {};
                Object.entries(colorFrequencies)
                    .sort(([, countA], [, countB]) => countB - countA)
                    .slice(0, 2)
                    .forEach(([numberStr]) => {
                        combinedPredictions[parseInt(numberStr, 10)] =
                            (combinedPredictions[parseInt(numberStr, 10)] ||
                                0) +
                            colorProbability *
                                COMBINED_PREDICTION_WEIGHT_FACTOR;
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
                    .forEach(([numberStr]) => {
                        combinedPredictions[parseInt(numberStr, 10)] =
                            (combinedPredictions[parseInt(numberStr, 10)] ||
                                0) +
                            sizeProbability * COMBINED_PREDICTION_WEIGHT_FACTOR;
                    });
            }
        } else if (last50Entries.length === MAX_ENTRIES) {
            preference = "statistical";
            const allNumbersFrequency = last50Entries.reduce((acc, entry) => {
                acc[entry.number] = (acc[entry.number] || 0) + 1;
                return acc;
            }, {});
            Object.entries(allNumbersFrequency)
                .sort(([, countA], [, countB]) => countB - countA)
                .slice(0, 3)
                .forEach(([numberStr]) => {
                    combinedPredictions[parseInt(numberStr, 10)] =
                        (combinedPredictions[parseInt(numberStr, 10)] || 0) +
                        STATISTICAL_PREDICTION_BASE_WEIGHT;
                });
        }

        const boostedPredictions = applyLastEntryRule(combinedPredictions);

        const sortedPredictionsWithWeight = Object.entries(
            boostedPredictions
        ).sort(([, weightA], [, weightB]) => weightB - weightA);

        const topPredictions = [];
        const predictedNumbers = new Set();
        for (const [numberStr] of sortedPredictionsWithWeight) {
            const number = parseInt(numberStr, 10);
            if (!predictedNumbers.has(number)) {
                topPredictions.push(number);
                predictedNumbers.add(number);
                if (topPredictions.length >= PREDICTION_COUNT) {
                    break;
                }
            }
        }

        return { predictions: topPredictions, preference };
    }, []);

    const analyzeEntries = useCallback((currentEntries) => {
        const numberAnalysis = {};
        const colors = [];

        currentEntries.forEach((entry, currentIndex) => {
            const { number, period, color } = entry;
            colors.push(color);

            numberAnalysis[number] = numberAnalysis[number] || {
                occurrences: [],
            };

            const occurrenceInfo = { fromPeriod: period };
            occurrenceInfo.toPeriod =
                currentIndex === currentEntries.length - 1
                    ? "latest entire"
                    : currentEntries[currentIndex + 1].period;
            occurrenceInfo.toNumber =
                currentIndex === currentEntries.length - 1
                    ? "latest entire"
                    : currentEntries[currentIndex + 1].number;

            numberAnalysis[number].occurrences.push(occurrenceInfo);
        });

        Object.keys(numberAnalysis).forEach((numberStr) => {
            const number = parseInt(numberStr, 10);
            const occurrences = numberAnalysis[number].occurrences;
            const nextNumbers = occurrences
                .filter((occ) => occ.toNumber !== "latest entire")
                .map((occ) => occ.toNumber);
            const lastColors = nextNumbers.map((num) =>
                getColor(num).replace("🟣", "")
            );
            const lastSizes = nextNumbers.map((num) => getSize(num)[0]); // Get first letter for size

            const colorCounts = lastColors.reduce(
                (acc, color) => ({
                    ...acc,
                    [color]: (acc[color] || 0) + 1,
                }),
                {}
            );
            const sizeCounts = lastSizes.reduce(
                (acc, size) => ({ ...acc, [size]: (acc[size] || 0) + 1 }),
                {}
            );

            numberAnalysis[number].colorSequence = lastColors.join("");
            numberAnalysis[number].sizeSequence = lastSizes.join("");
            numberAnalysis[number].predictedNextColor = Object.keys(
                colorCounts
            ).reduce(
                (a, b) => (colorCounts[a] > colorCounts[b] ? a : b),
                "N/A"
            );
            numberAnalysis[number].predictedNextSize = Object.keys(
                sizeCounts
            ).reduce((a, b) => (sizeCounts[a] > sizeCounts[b] ? a : b), "N/A");
        });

        setAnalysis(numberAnalysis);
    }, []);

    useEffect(() => {
        if (entries.length > 0) {
            const { predictions: newPredictions, preference: newPreference } =
                predictTopTwoNumbers(entries);
            setPredictions(newPredictions.slice(0, 1)); // Keep only the first prediction
            setPredictionPreference(newPreference);
            analyzeEntries(entries);
        } else {
            setPredictions([]);
            setPredictionPreference(null);
            setAnalysis({});
        }
    }, [entries, predictTopTwoNumbers, analyzeEntries]);

    const renderAnalysis = () => (
        <div className="analysis-grid">
            <h3>Number Analysis:</h3>
            {Object.keys(analysis).map((number) => (
                <div key={number} className="analysis-item">
                    <h4>Number: {number}</h4>
                    <ul>
                        {analysis[number].occurrences.map(
                            (occurrence, index) => (
                                <li key={`${occurrence.fromPeriod}-${index}`}>
                                    {" "}
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
                    {(predictionPreference === "color" ||
                        predictionPreference === "both") && (
                        <p>
                            Predicted Next Color:{" "}
                            <span
                                className={`predicted-color ${analysis[number].predictedNextColor}`}
                            >
                                {analysis[number].predictedNextColor || "N/A"}
                            </span>
                        </p>
                    )}
                    {(predictionPreference === "size" ||
                        predictionPreference === "both") && (
                        <p>
                            Predicted Next Size:{" "}
                            <span
                                className={`predicted-size ${analysis[number].predictedNextSize}`}
                            >
                                {analysis[number].predictedNextSize || "N/A"}
                            </span>
                        </p>
                    )}
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

    const backtoHome = () => {
        navigate("/");
    };

    return (
        <div className="mainColorContainer">
            <div className="container">
                <button className="BckHome-btn" onClick={backtoHome}>
                    Back to home
                </button>
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
                            const cleaned = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 30);
                            setInputNumbers(cleaned.split("").join(" "));
                        }}
                        className="input-field"
                    />
                    <button onClick={handleAddEntries} className="add-button">
                        Add Entries
                    </button>
                </div>

                {entries.length >= MAX_ENTRIES && predictions.length > 0 && (
                    <div className="prediction-section">
                        <h3>Top Prediction (Next Number):</h3>
                        <div className="predictions-container">
                            <h3>Predicted Number:</h3>
                            <div className="predictedNum">
                                {predictions.map((number) => {
                                    const color = getColor(number);
                                    return (
                                        <span
                                            key={number}
                                            className={`color-tag ${color.replace(
                                                "🟣",
                                                ""
                                            )}`}
                                            style={{
                                                background: color.includes("🟣")
                                                    ? `linear-gradient(to right, ${
                                                          color.split(
                                                              "🟣"
                                                          )[0] === "🔴"
                                                              ? "#ffdddd"
                                                              : "#ddffdd"
                                                      } 50%, #e0b0ff 50%)`
                                                    : color === "🔴"
                                                    ? "#ffdddd"
                                                    : "#ddffdd",
                                                color: color.includes("🟣")
                                                    ? color.split("🟣")[0] ===
                                                      "🔴"
                                                        ? "darkred"
                                                        : "darkgreen"
                                                    : color === "🔴"
                                                    ? "darkred"
                                                    : "darkgreen",
                                                padding: "5px 10px",
                                                borderRadius: "5px",
                                                fontSize: "19px",
                                                fontWeight: "bold",
                                               
                                            }}
                                        >
                                            {number}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {predictionPreference && (
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
                        )}
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
                            {[...entries].reverse().map((entry) => (
                                <tr key={entry.id}>
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

                {entries.length > 0 && (
                    <div className="all-colors-container">
                        <h3>All Entered Numbers with Colors:</h3>
                        {Array.from(
                            {
                                length: Math.ceil(
                                    entries.length / DISPLAY_COLORS_PER_ROW
                                ),
                            },
                            (_, i) => (
                                <div key={i} className="color-display-group">
                                    {entries
                                        .slice(
                                            i * DISPLAY_COLORS_PER_ROW,
                                            (i + 1) * DISPLAY_COLORS_PER_ROW
                                        )
                                        .map((entry) => (
                                            <span
                                                key={entry.id}
                                                className={`color-tag ${entry.color.replace(
                                                    "🟣",
                                                    ""
                                                )}`}
                                                style={{
                                                    background:
                                                        entry.color.includes(
                                                            "🟣"
                                                        )
                                                            ? `linear-gradient(to right, ${
                                                                  entry.color.split(
                                                                      "🟣"
                                                                  )[0] === "🔴"
                                                                      ? "#ffdddd"
                                                                      : "#ddffdd"
                                                              } 50%, #e0b0ff 50%)`
                                                            : entry.color ===
                                                              "🔴"
                                                            ? "#ffdddd"
                                                            : "#ddffdd",
                                                    color: entry.color.includes(
                                                        "🟣"
                                                    )
                                                        ? entry.color.split(
                                                              "🟣"
                                                          )[0] === "🔴"
                                                            ? "darkred"
                                                            : "darkgreen"
                                                        : entry.color === "🔴"
                                                        ? "darkred"
                                                        : "darkgreen",
                                                    padding: "5px 10px",
                                                    borderRadius: "5px",
                                                    fontSize: "16px",
                                                    fontWeight: "bold",
                                                    marginRight: "5px",
                                                    display: "inline-block",
                                                }}
                                            >
                                                {entry.number}
                                            </span>
                                        ))}
                                </div>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ColorPredictionApp;
