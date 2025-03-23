import React, { useState } from "react";
import "./ColorPredictionApp.css";

const ColorPredictionApp = () => {
    const [columns, setColumns] = useState([]);
    const [inputNumber, setInputNumber] = useState("");
    const [prediction, setPrediction] = useState(null);
    const [totalNumbers, setTotalNumbers] = useState(0);
    const [loading, setLoading] = useState(false);

    const analyzePattern = (data) => {
        if (data.length < 15) return null;

        const last15Data = data.flat().slice(-15);
        const numberCount = Array(10).fill(0);
        const colorCount = { red: 0, green: 0 };
        const sizeCount = { big: 0, small: 0 };

        last15Data.forEach((num) => {
            numberCount[num]++;
            num % 2 === 0 ? colorCount.red++ : colorCount.green++;
            num >= 5 ? sizeCount.big++ : sizeCount.small++;
        });

        // Most frequent numbers
        const sortedNumbers = numberCount
            .map((count, num) => ({ num, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 2)
            .map((item) => item.num);

        // Most frequent color
        const predictedColor =
            colorCount.red > colorCount.green ? "🔴" : "🟢";

        // Most frequent size category
        const predictedSize = sizeCount.big > sizeCount.small ? "Big" : "Small";

        // Determine final prediction based on strongest trend
        let finalPrediction;
        if (
            Math.abs(colorCount.red - colorCount.green) >
            Math.abs(sizeCount.big - sizeCount.small)
        ) {
            finalPrediction = { type: predictedColor, numbers: sortedNumbers };
        } else {
            finalPrediction = { type: predictedSize, numbers: sortedNumbers };
        }

        return finalPrediction;
    };

    const addNumber = () => {
        const newNumber = parseInt(inputNumber, 10);
        if (isNaN(newNumber) || newNumber < 0 || newNumber > 9) {
            alert("Please enter a valid number between 0 and 9.");
            return;
        }

        setColumns((prevColumns) => {
            let updatedColumns = [...prevColumns];
            if (updatedColumns.length === 0) {
                updatedColumns = [[newNumber]];
            } else {
                const lastColumn = updatedColumns[updatedColumns.length - 1];
                const lastColumnIsEven = lastColumn[0] % 2 === 0;
                const newNumberIsEven = newNumber % 2 === 0;
                if (
                    (newNumberIsEven && lastColumnIsEven) ||
                    (!newNumberIsEven && !lastColumnIsEven)
                ) {
                    updatedColumns[updatedColumns.length - 1] = [
                        ...lastColumn,
                        newNumber,
                    ];
                } else {
                    updatedColumns.push([newNumber]);
                }
            }
            if (updatedColumns.length > 20) {
                updatedColumns.shift();
            }
            return updatedColumns;
        });
        setTotalNumbers((prevTotal) => prevTotal + 1);
        setInputNumber("");
    };

    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            addNumber();
        }
    };

    const handleGetNextResult = () => {
        if (totalNumbers < 15) {
            alert("Enter at least 15 numbers to analyze!");
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setPrediction(analyzePattern(columns.flat()));
            setLoading(false);
        }, 2000);
    };

    return (
        <div className="container">
            <div className="input-container">
                <input
                    type="number"
                    min="0"
                    max="9"
                    value={inputNumber}
                    onChange={(e) => setInputNumber(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter number (0-9)"
                    className="number-input"
                />
                <button onClick={addNumber} className="add-btn">
                    Add
                </button>
            </div>

            <div className="scroll-container">
                <div className="grid-container">
                    {columns.slice(-20).map((column, colIndex) => (
                        <div key={colIndex} className="column">
                            {column.map((num, rowIndex) => (
                                <div
                                    key={`${colIndex}-${rowIndex}`}
                                    className={`grid-box ${
                                        num % 2 === 0 ? "red" : "green"
                                    }`}
                                >
                                    {num}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {loading && (
                <div className="loading-animation">🔄 Analyzing...</div>
            )}

            {!loading && prediction && (
                <div className="prediction-box">
                    <h3>Predicted Next:</h3>
                    <p>
                        {prediction.type} :  {prediction.numbers.join(", ")}
                    </p>
                </div>
            )}

            <button
                onClick={handleGetNextResult}
                className="get-result-btn"
                disabled={totalNumbers < 15}
            >
                Get Next Result
            </button>
        </div>
    );
};

export default ColorPredictionApp;
