import React, { useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import "./ColorPredictionApp.css";

const ColorPredictionApp = () => {
    const [signals, setSignals] = useState([]);
    const [periodNumber, setPeriodNumber] = useState("");
    const [numberInput, setNumberInput] = useState("");
    const [prediction, setPrediction] = useState("");

    const handleAddSignal = () => {
        if (numberInput === "" || isNaN(numberInput) || periodNumber === "")
            return;

        const num = parseInt(numberInput);
        const newSignal = {
            period: periodNumber, // Store period number for table
            value: num,
            color: num % 2 === 0 ? "🔴" : "🟢",
            size: num >= 5 ? "Big" : "Small",
        };

        const updatedSignals = [newSignal, ...signals.slice(0, 9)];
        setSignals(updatedSignals);

        // Increment period number for next entry
        setPeriodNumber((prev) => (prev ? parseInt(prev) + 1 : 1));

        setNumberInput("");

        if (updatedSignals.length >= 3) {
            predictNext(updatedSignals);
        }
    };

    const predictNext = (lastSignal) => {
        let predictedNumbers = [];
        let predictionResult = "";

        if (Math.random() > 0.5) {
            // Predict by Size
            if (lastSignal.size === "Big") {
                predictedNumbers = [
                    Math.floor(Math.random() * 5) + 5,
                    Math.floor(Math.random() * 5) + 5,
                ];
            } else {
                predictedNumbers = [
                    Math.floor(Math.random() * 5),
                    Math.floor(Math.random() * 5),
                ];
            }
            predictionResult = `Predicted Numbers: ${predictedNumbers.join(
                ", "
            )} (${lastSignal.size})`;
        } else {
            // Predict by Indicator
            if (lastSignal.color === "🔴") {
                predictedNumbers = [2, 4, 6, 8]
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 2);
            } else {
                predictedNumbers = [1, 3, 5, 7, 9]
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 2);
            }
            predictionResult = `Predicted Numbers: ${predictedNumbers.join(
                ", "
            )} (${lastSignal.color})`;
        }

        setPrediction(predictionResult);
    };

    const resetTable = () => {
        setSignals([]);
        setPrediction("");
        setPeriodNumber("");
    };

    return (
        <div
            style={{
                textAlign: "center",
                padding: "20px",
                background: "#222",
                color: "white",
                maxWidth: "500px",
                margin: "auto",
                borderRadius: "10px",
            }}
        >
            <h2>Color Prediction App</h2>
            {signals.length === 0 && (
                <input
                    type="number"
                    value={periodNumber}
                    onChange={(e) => setPeriodNumber(e.target.value)}
                    placeholder="Enter First Period Number"
                    style={{ margin: "5px", padding: "8px", width: "90%" }}
                />
            )}
            <input
                type="number"
                value={numberInput}
                onChange={(e) => setNumberInput(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        handleAddSignal();
                    }
                }}
                placeholder="Enter Signal Number"
                style={{ margin: "5px", padding: "8px", width: "90%" }}
            />

            <button
                onClick={handleAddSignal}
                style={{ margin: "5px", padding: "10px", width: "45%" }}
            >
                Add Signal
            </button>
            <button
                onClick={resetTable}
                style={{ margin: "5px", padding: "10px", width: "45%" }}
            >
                Reset Table
            </button>

            {/* Table */}
            <table
                border="1"
                style={{
                    width: "100%",
                    marginTop: "20px",
                    textAlign: "center",
                    background: "#333",
                    borderRadius: "5px",
                }}
            >
                <thead>
                    <tr>
                        <th>Period</th>
                        <th>Number</th>
                        <th>Size</th>
                        <th>Indicator</th>
                    </tr>
                </thead>
                <tbody>
                    {signals.length === 0 ? (
                        <tr>
                            <td colSpan="4" style={{ color: "gray" }}>
                                No data entered
                            </td>
                        </tr>
                    ) : (
                        signals.map((signal, index) => (
                            <tr key={index}>
                                <td style={{ color: "lightgray" }}>
                                    {signal.period}
                                </td>
                                <td style={{ color: "white" }}>
                                    {signal.value}
                                </td>
                                <td>{signal.size}</td>
                                <td>{signal.color}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Prediction Result */}
            {prediction && (
                <div style={{ marginTop: "20px" }}>
                    <h3>Next Prediction</h3>
                    <p style={{ fontSize: "20px", fontWeight: "bold" }}>
                        {prediction}
                    </p>
                </div>
            )}

            {/* Graph */}
            <div
                style={{ width: "100%", height: "300px", margin: "20px auto" }}
            >
                <Line
                    data={{
                        labels: signals.map((_, index) => index + 1), // Hide period numbers, use index
                        datasets: [
                            {
                                label: "Numbers Trend",
                                data: signals.map((s) => s.value),
                                borderColor: "red",
                                backgroundColor: "rgba(255, 99, 132, 0.5)",
                                fill: false,
                                borderWidth: 2,
                                pointRadius: 5,
                                pointBackgroundColor: "red",
                                tension: 0,
                            },
                        ],
                    }}
                    options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: {
                                grid: { color: "gray" },
                                ticks: { color: "white" },
                            },
                            y: {
                                grid: { color: "gray" },
                                ticks: { color: "white" },
                            },
                        },
                    }}
                />
            </div>
        </div>
    );
};

export default ColorPredictionApp;
