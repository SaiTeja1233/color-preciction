import React, { useState, useEffect, useCallback } from "react";
import "./ColorPredictionApp.css";

const ColorPredictionApp = () => {
    const [columns, setColumns] = useState([]);
    const [inputNumber, setInputNumber] = useState("");
    const [period, setPeriod] = useState("");
    const [prediction, setPrediction] = useState(null);
    const [periodSet, setPeriodSet] = useState(false);
    const [totalNumbers, setTotalNumbers] = useState(0);

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

            if (updatedColumns.length > 20) {
                updatedColumns.shift();
            }

            return updatedColumns;
        });

        setTotalNumbers((prevTotal) => prevTotal + 1);
        setPeriod((prevPeriod) => prevPeriod + 1);
        setInputNumber("");
    };

    const predictNextNumber = useCallback(
        (data) => {
            if (totalNumbers < 15) return null;

            const last15Data = data.flat().slice(-15);

            // Count occurrences of each number (0-9)
            const numberCount = Array(10).fill(0);
            const colorCount = { red: 0, green: 0 };

            last15Data.forEach((entry) => {
                numberCount[entry.num]++;
                if (entry.num % 2 === 0) {
                    colorCount.red++;
                } else {
                    colorCount.green++;
                }
            });

            // Find the most frequent number
            let predictedNumber = numberCount.indexOf(Math.max(...numberCount));

            // Determine the dominant color
           let predictedColor = predictedNumber % 2 === 0 ? "red" : "green";

            return {
                number: predictedNumber,
                color: predictedColor,
            };
        },
        [totalNumbers]
    );

    useEffect(() => {
        if (totalNumbers >= 15) {
            const predictedData = predictNextNumber(columns);
            setPrediction(predictedData);
        }
    }, [totalNumbers, columns, predictNextNumber]);

    const handleKeyPress = (e) => {
        if (e.key === "Enter") {
            addNumber();
        }
    };

    return (
        <div className="container">
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

            {prediction !== null && (
                <div className="prediction-box">
                    <h3>Predicted Next:</h3>
                    <div className={`grid-box ${prediction.color}`}>
                        {prediction.number}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ColorPredictionApp;
