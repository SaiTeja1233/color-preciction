import React, { useState } from "react";
import "./ColorPredictionApp.css";

const ColorPredictionApp = () => {
    const [columns, setColumns] = useState([]); // Stores numbers
    const [inputNumber, setInputNumber] = useState(""); // Number input
    const [period, setPeriod] = useState(""); // Period input (initial)
    const [prediction, setPrediction] = useState(null); // Stores predicted next number
    const [periodSet, setPeriodSet] = useState(false); // Tracks if period is set

    // Function to add number
    const addNumber = () => {
        const newNumber = parseInt(inputNumber, 10);

        if (isNaN(newNumber) || newNumber < 0 || newNumber > 9) {
            alert("Please enter a valid number between 0 and 9.");
            return;
        }
        if (!periodSet) {
            alert("Please enter a period number first.");
            return;
        }

        setColumns((prevColumns) => {
            let updatedColumns = [...prevColumns];

            if (updatedColumns.length === 0) {
                updatedColumns = [[{ num: newNumber, period }]];
            } else {
                const lastColumn = updatedColumns[updatedColumns.length - 1];
                const lastColumnIsEven = lastColumn[0].num % 2 === 0;
                const newNumberIsEven = newNumber % 2 === 0;

                if (
                    (newNumberIsEven && lastColumnIsEven) ||
                    (!newNumberIsEven && !lastColumnIsEven)
                ) {
                    updatedColumns[updatedColumns.length - 1] = [
                        ...lastColumn,
                        { num: newNumber, period },
                    ];
                } else {
                    updatedColumns.push([{ num: newNumber, period }]);
                }
            }

            // Store up to 20 columns but display only last 10
            if (updatedColumns.length > 20) {
                updatedColumns.shift();
            }

            // Trigger prediction when 9 columns are completed
            if (updatedColumns.length >= 9) {
                const predictedNum = predictNextNumber(updatedColumns);
                setPrediction(predictedNum);
            }

            return updatedColumns;
        });

        setPeriod(period + 1); // Auto-increment period
        setInputNumber(""); // Clear number input
    };

   const predictNextNumber = (data) => {
       if (!data || data.length === 0) return null;

       const numberFrequency = Array(10).fill(0);
       const colorFrequency = { red: 0, green: 0 };

       // Weight recent entries higher for better trend prediction
       const weightFactor = data.length > 5 ? 1.5 : 1;

       data.flat().forEach((entry, index) => {
           numberFrequency[entry.num] += weightFactor * (index + 1); // More weight for recent numbers
           if (entry.color === "red") colorFrequency.red += 1;
           if (entry.color === "green") colorFrequency.green += 1;
       });

       // Find the number with the highest weighted frequency
       const maxFreq = Math.max(...numberFrequency);
       const weightedNumbers = numberFrequency
           .map((freq, num) => (freq === maxFreq ? num : null))
           .filter((num) => num !== null);

       // Predict number based on weighted probability
       let predictedNumber =
           weightedNumbers[Math.floor(Math.random() * weightedNumbers.length)];

       // Predict color based on color frequency trends
       const predictedColor =
           colorFrequency.red >= colorFrequency.green ? "red" : "green";

       return { number: predictedNumber, color: predictedColor };
   };


    // Handle Enter Key Press
    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            addNumber();
        }
    };

    return (
        <div className="container">
            {/* Initial Period Input */}
            {!periodSet && (
                <div className="input-container">
                    <input
                        type="number"
                        min="1"
                        value={period}
                        onChange={(e) =>
                            setPeriod(parseInt(e.target.value, 10) || "")
                        }
                        placeholder="Enter period"
                        className="period-input"
                    />
                    <button
                        onClick={() => period && setPeriodSet(true)}
                        className="set-period-btn"
                    >
                        Set Period
                    </button>
                </div>
            )}

            {/* Number Input */}
            {periodSet && (
                <div className="input-container">
                    <input
                        type="number"
                        min="0"
                        max="9"
                        value={inputNumber}
                        onChange={(e) => setInputNumber(e.target.value)}
                        placeholder="Enter number (0-9)"
                        className="number-input"
                        onKeyPress={handleKeyPress}
                    />
                    <button onClick={addNumber} className="add-btn">
                        Add
                    </button>
                </div>
            )}

            {/* Scrollable Number Grid */}
            <div className="scroll-container">
                <div className="grid-container">
                    {columns.slice(-10).map((column, colIndex) => (
                        <div key={colIndex} className="column">
                            {column.map((entry, rowIndex) => (
                                <div
                                    key={`${colIndex}-${rowIndex}`}
                                    className={`grid-box ${
                                        entry.num % 2 === 0 ? "red" : "green"
                                    }`}
                                    title={`Period: ${entry.period}`}
                                >
                                    {entry.num}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* Prediction Display */}
            {prediction !== null && (
                <div className="prediction-box">
                    <h3>Predicted Next Number:</h3>
                    <div
                        className={`grid-box ${
                            prediction % 2 === 0 ? "red" : "green"
                        }`}
                    >
                        {prediction}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ColorPredictionApp;
