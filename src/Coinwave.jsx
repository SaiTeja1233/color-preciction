import React, { useState, useEffect, useCallback } from "react";
import "./Coinwave.css";
import { useNavigate } from "react-router-dom";
function Coinwave() {
    const [waveSelections, setWaveSelections] = useState([]);
    const [wavePrediction, setWavePrediction] = useState(null);

    const handleButtonClick = (color) => {
        setWaveSelections(
            (prevWaveSelections) => {
                const newWaveSelections = [color, ...prevWaveSelections];
                if (newWaveSelections.length > 17) {
                    newWaveSelections.pop();
                }
                return newWaveSelections;
            },
            () => {
                // Calculate prediction after the state has updated
                if (waveSelections.length >= 3) {
                    // Prediction needs at least 3 entries for pattern detection
                    calculateWavePrediction();
                } else {
                    setWavePrediction(null);
                }
            }
        );
    };

    const findRepeatingPattern = useCallback((arr) => {
        for (let len = 1; len <= Math.floor(arr.length / 2); len++) {
            const pattern = arr.slice(0, len);
            let isRepeating = true;
            for (let i = len; i < arr.length; i++) {
                if (arr[i] !== pattern[i % len]) {
                    isRepeating = false;
                    break;
                }
            }
            if (isRepeating && arr.length >= 2 * len) {
                return pattern[arr.length % len];
            }
        }
        return null;
    }, []); // findRepeatingPattern has no dependencies

    const calculateWavePrediction = useCallback(() => {
        const n = waveSelections.length;
        if (n < 3) {
            setWavePrediction(null);
            return;
        }

        // Check for repeating pattern in the most recent history (up to 10 entries)
        const recentHistoryLength = Math.min(n, 10);
        const recentHistory = waveSelections.slice(0, recentHistoryLength);
        const patternPrediction = findRepeatingPattern(recentHistory);

        if (patternPrediction) {
            setWavePrediction(patternPrediction);
            return;
        }

        // If no clear repeating pattern in recent history, try to find a pattern of length 2
        if (n >= 4) {
            const lastTwo = waveSelections.slice(0, 2);
            if (
                waveSelections[2] === lastTwo[0] &&
                waveSelections[3] === lastTwo[1]
            ) {
                setWavePrediction(lastTwo[0]); // Predict the first of the repeating pair
                return;
            }
        }

        // If no simple repeating pattern, consider if the last was the opposite of the one before
        if (n >= 2 && waveSelections[0] !== waveSelections[1]) {
            setWavePrediction(waveSelections[1]);
            return;
        }

        // As a last resort, predict based on overall frequency
        const yellowCount = waveSelections.filter((c) => c === "🟡").length;
        const whiteCount = n - yellowCount;

        if (yellowCount > whiteCount) {
            setWavePrediction("🟡");
        } else if (whiteCount > yellowCount) {
            setWavePrediction("⚪");
        } else {
            setWavePrediction(Math.random() < 0.5 ? "🟡" : "⚪");
        }
    }, [waveSelections, findRepeatingPattern]);

    useEffect(() => {
        if (waveSelections.length >= 3) {
            calculateWavePrediction();
        } else {
            setWavePrediction(null);
        }
    }, [waveSelections, calculateWavePrediction]); // Now include calculatePrediction

    const renderWaveTable = () => {
        if (waveSelections.length === 0) {
            return (
                <p className="wave-no-selections-text">No selections yet.</p>
            );
        }

        const partsConfig = [2, 3, 3, 3, 3];
        const parts = [];
        let startIndex = 0;

        for (let i = 0; i < partsConfig.length; i++) {
            const endIndex = startIndex + partsConfig[i];
            const part = waveSelections.slice(startIndex, endIndex);
            parts.push(part);
            startIndex = endIndex;
        }

        const lastPart = waveSelections.slice(startIndex);
        parts.push(lastPart);

        return (
            <table className="wave-table-element">
                <thead className="wave-table-head">
                    <tr className="wave-table-row-head">
                        <th className="wave-table-header">Color</th>
                    </tr>
                </thead>
                <tbody className="wave-table-body">
                    {parts.map((part, partIndex) => (
                        <React.Fragment key={partIndex}>
                            {part.map((color, index) => (
                                <tr
                                    key={`${partIndex}-${index}`}
                                    className="wave-table-row-data"
                                    style={
                                        partIndex === 0 && index < 2
                                            ? { fontWeight: "bold" }
                                            : {}
                                    }
                                >
                                    <td className="wave-table-data-cell">
                                        {color}
                                    </td>
                                </tr>
                            ))}
                            {partIndex < 5 && (
                                <tr className="wave-table-row-separator">
                                    <td
                                        className="wave-table-data-cell-empty"
                                        style={{ padding: "5px" }}
                                    ></td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        );
    };
    const navigate = useNavigate();
    function backtoHome() {
        navigate("/");
    }

    return (
        <div className="coinwave-container-main">
            <button className="BckHome-btn" onClick={() => backtoHome()}>
                Back to home
            </button>
            <h2 className="coinwave-page-title">Coinwave</h2>
            <div className="coinwave-button-container">
                <button
                    className="coinwave-button-yellow"
                    onClick={() => handleButtonClick("🟡")}
                >
                    🟡
                </button>
                <button
                    className="coinwave-button-white"
                    onClick={() => handleButtonClick("⚪")}
                >
                    ⚪
                </button>
            </div>

            <h3 className="coinwave-prediction-title">Prediction:</h3>
            <div className="coinwave-prediction-area">
                {wavePrediction ? (
                    <p className="coinwave-prediction-message">
                        Predicted next color:{" "}
                        <span className="coinwave-predicted-color-value">
                            {wavePrediction}
                        </span>
                    </p>
                ) : (
                    <p className="coinwave-no-prediction-message">
                        Not enough data for prediction.
                    </p>
                )}
            </div>

            <h3 className="coinwave-selections-title">Selections:</h3>
            <div className="coinwave-selection-area">{renderWaveTable()}</div>
        </div>
    );
}

export default Coinwave;
