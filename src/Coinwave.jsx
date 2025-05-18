import React, { useState, useEffect, useCallback } from "react";
import "./Coinwave.css";
import { useNavigate } from "react-router-dom";

function Coinwave() {
    const [waveSelections, setWaveSelections] = useState([]);
    const [wavePrediction, setWavePrediction] = useState(null);

    const handleButtonClick = (color) => {
        setWaveSelections((prev) => {
            const newSelections = [color, ...prev];
            if (newSelections.length > 30) newSelections.pop();
            return newSelections;
        });
    };

    const getOppositeColor = (color) => (color === "🟡" ? "⚪" : "🟡");

    const calculateWavePrediction = useCallback(() => {
        const n = waveSelections.length;
        if (n < 20) {
            setWavePrediction(null);
            return;
        }

        const data = waveSelections;
        const predictions = [];

        // Rule 1: Last 3 same → predict opposite
        if (data[0] === data[1] && data[1] === data[2]) {
            predictions.push(getOppositeColor(data[0]));
        }

        // Rule 2: Alternating pattern (🟡⚪🟡⚪) → continue pattern
        if (
            data.length >= 4 &&
            data[0] !== data[1] &&
            data[0] === data[2] &&
            data[1] === data[3]
        ) {
            predictions.push(data[0]);
        }

        // Rule 3: Majority of last 5 → predict minority
        const last5 = data.slice(0, 5);
        const yellow5 = last5.filter((c) => c === "🟡").length;
        const white5 = 5 - yellow5;
        if (yellow5 !== white5) {
            predictions.push(yellow5 > white5 ? "⚪" : "🟡");
        }

        // Rule 4: Majority of last 10 → predict minority
        const last10 = data.slice(0, 10);
        const yellow10 = last10.filter((c) => c === "🟡").length;
        const white10 = 10 - yellow10;
        if (yellow10 !== white10) {
            predictions.push(yellow10 > white10 ? "⚪" : "🟡");
        }

        // Rule 5: Check for repeated pair (🟡🟡⚪⚪🟡🟡...) → predict next in pair
        if (
            data.length >= 6 &&
            data[0] === data[1] &&
            data[2] === data[3] &&
            data[4] === data[5] &&
            data[0] === data[4]
        ) {
            predictions.push(data[0]);
        }

        // Rule 6: Last 5 are alternating → continue alternation
        if (
            data.length >= 5 &&
            data[0] !== data[1] &&
            data[1] !== data[2] &&
            data[2] !== data[3] &&
            data[3] !== data[4]
        ) {
            predictions.push(data[0]);
        }

        // Rule 7: 3 whites in last 4 → predict yellow
        const last4 = data.slice(0, 4);
        const white4 = last4.filter((c) => c === "⚪").length;
        if (white4 >= 3) {
            predictions.push("🟡");
        }

        // Rule 8: 3 yellows in last 4 → predict white
        const yellow4 = last4.filter((c) => c === "🟡").length;
        if (yellow4 >= 3) {
            predictions.push("⚪");
        }

        // Rule 9: Repeating triple (🟡⚪🟡⚪🟡...) → predict pattern
        if (
            data.length >= 6 &&
            data[0] === data[2] &&
            data[2] === data[4] &&
            data[1] === data[3] &&
            data[3] === data[5]
        ) {
            predictions.push(data[0]);
        }

        // Rule 10: Last 2 pairs are same (🟡🟡⚪⚪) → predict opposite pair
        if (
            data.length >= 4 &&
            data[0] === data[1] &&
            data[2] === data[3] &&
            data[0] !== data[2]
        ) {
            predictions.push(getOppositeColor(data[0]));
        }

        // Rule 11: Count last 20 colors → predict least frequent
        const last20 = data.slice(0, 20);
        const yellow20 = last20.filter((c) => c === "🟡").length;
        const white20 = 20 - yellow20;
        predictions.push(
            yellow20 > white20 ? "⚪" : yellow20 < white20 ? "🟡" : null
        );

        // Rule 12: Random fallback if no clear majority
        if (predictions.length === 0 || predictions.every((p) => p === null)) {
            predictions.push(Math.random() < 0.5 ? "🟡" : "⚪");
        }

        // Count votes
        const finalCount = predictions.reduce((acc, c) => {
            if (!c) return acc;
            acc[c] = (acc[c] || 0) + 1;
            return acc;
        }, {});

        const finalColor =
            (finalCount["🟡"] || 0) > (finalCount["⚪"] || 0)
                ? "🟡"
                : (finalCount["⚪"] || 0) > (finalCount["🟡"] || 0)
                ? "⚪"
                : Math.random() < 0.5
                ? "🟡"
                : "⚪";

        setWavePrediction(finalColor);
    }, [waveSelections]);

    useEffect(() => {
        if (waveSelections.length >= 20) {
            calculateWavePrediction();
        } else {
            setWavePrediction(null);
        }
    }, [waveSelections, calculateWavePrediction]);

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
            <button className="BckHome-btn" onClick={backtoHome}>
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
                        To get prediction enter at least 20 selections.
                    </p>
                )}
            </div>

            <h3 className="coinwave-selections-title">Selections:</h3>
            <div className="coinwave-selection-area">{renderWaveTable()}</div>
        </div>
    );
}

export default Coinwave;
