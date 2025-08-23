import React, { useState } from "react";
import "./ColorPredictionApp.css";
import { useNavigate } from "react-router-dom";

// Constants for game logic and display
const MAX_ENTRIES = 10;
const DISPLAY_COLORS_PER_ROW = 5;

// Helper function to determine the color of a number
const getColor = (number) => {
    if (number === 0) return "🔴🟣";
    if (number === 5) return "🟢🟣";
    return number % 2 === 0 ? "🔴" : "🟢";
};

// Helper function to determine the size of a number
const getSize = (number) => (number >= 5 ? "Big" : "Small");

// Custom prediction logic functions from OneMinWingo
const getHumanPrediction = (historyData) => {
    if (historyData.length < 2) {
        return { color: "Green", size: "Big" };
    }

    const lastTwoColors = historyData
        .slice(0, 2)
        .map((item) =>
            getColor(item.number).includes("🔴") ? "Red" : "Green"
        );
    const lastTwoSizes = historyData
        .slice(0, 2)
        .map((item) => getSize(item.number));

    let predictedColor;
    if (lastTwoColors[0] === lastTwoColors[1]) {
        predictedColor = lastTwoColors[0] === "Red" ? "Green" : "Red";
    } else {
        predictedColor = lastTwoColors[1] === "Red" ? "Green" : "Red";
    }

    let predictedSize;
    if (lastTwoSizes[0] === lastTwoSizes[1]) {
        predictedSize = lastTwoSizes[0] === "Big" ? "Small" : "Big";
    } else {
        predictedSize = lastTwoSizes[1] === "Big" ? "Small" : "Big";
    }

    return { color: predictedColor, size: predictedSize };
};

const getRobotPrediction = (historyData) => {
    if (historyData.length < 10) {
        return { color: "Green", size: "Big" };
    }

    const recentHistory = historyData.slice(0, 10);
    const colorCounts = recentHistory.reduce((acc, item) => {
        const color = getColor(item.number).includes("🔴") ? "Red" : "Green";
        acc[color] = (acc[color] || 0) + 1;
        return acc;
    }, {});

    const sizeCounts = recentHistory.reduce((acc, item) => {
        const size = getSize(item.number);
        acc[size] = (acc[size] || 0) + 1;
        return acc;
    }, {});

    const predictedColor =
        colorCounts["Red"] <= colorCounts["Green"] ? "Red" : "Green";
    const predictedSize =
        sizeCounts["Big"] <= sizeCounts["Small"] ? "Big" : "Small";

    return { color: predictedColor, size: predictedSize };
};

const getNumbersToDisplay = (prediction) => {
    const uniqueNumbers = new Set();
    const isColorPrediction = prediction === "Red" || prediction === "Green";
    const isSizePrediction = prediction === "Big" || prediction === "Small";

    while (uniqueNumbers.size < 2) {
        let num;
        if (isSizePrediction) {
            num =
                prediction === "Big"
                    ? Math.floor(Math.random() * 5) + 5
                    : Math.floor(Math.random() * 5);
        } else if (isColorPrediction) {
            const evenNumbers = [0, 2, 4, 6, 8];
            const oddNumbers = [1, 3, 5, 7, 9];
            num =
                prediction === "Red"
                    ? evenNumbers[
                          Math.floor(Math.random() * evenNumbers.length)
                      ]
                    : oddNumbers[Math.floor(Math.random() * oddNumbers.length)];
        } else {
            num = Math.floor(Math.random() * 10);
        }
        uniqueNumbers.add(num);
    }
    return Array.from(uniqueNumbers);
};

// Main React component
const ColorPredictionApp = () => {
    const [entries, setEntries] = useState([]);
    const [inputNumbers, setInputNumbers] = useState("");
    const [inputPeriod, setInputPeriod] = useState("001");
    const [showPredictionCard, setShowPredictionCard] = useState(false);
    const [predictedResult, setPredictedResult] = useState(null);
    const [predictedNumbers, setPredictedNumbers] = useState([]);
    const [predictionType, setPredictionType] = useState("color");

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

            const newEntries = numbersArray
                .map((number, index) => {
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
                })
                .reverse();

            setEntries((prevEntries) =>
                [...newEntries, ...prevEntries].slice(0, MAX_ENTRIES)
            );
            setInputPeriod(
                String(currentPeriod + numbersArray.length).padStart(
                    periodLength,
                    "0"
                )
            );
            setInputNumbers("");

            setShowPredictionCard(false);
            setPredictedResult(null);
            setPredictedNumbers([]);
        }
    };

    const handlePredict = () => {
        if (entries.length < 2) {
            alert("Please add at least 2 entries for an accurate prediction!");
            return;
        }

        const humanPrediction = getHumanPrediction(entries);
        const robotPrediction = getRobotPrediction(entries);

        let selectedPrediction;
        let numbersToDisplay;

        const activePrediction =
            entries.length >= 10 ? robotPrediction : humanPrediction;

        if (predictionType === "color") {
            selectedPrediction = activePrediction.color;
            numbersToDisplay = getNumbersToDisplay(selectedPrediction);
        } else {
            selectedPrediction = activePrediction.size;
            numbersToDisplay = getNumbersToDisplay(selectedPrediction);
        }

        setPredictedResult(selectedPrediction);
        setPredictedNumbers(numbersToDisplay);
        setShowPredictionCard(true);
    };

    const backtoHome = () => {
        navigate("/");
    }; // Handler to update state based on toggle position

    const handleToggleChange = (event) => {
        setPredictionType(event.target.checked ? "size" : "color");
        setShowPredictionCard(false); // Hide the prediction when switching modes
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
                       
                <div className="prediction-controls">
                             
                    {/* The new toggle switch replaces the old buttons */}  
                          
                    <div className="btn-container">
                                   
                        <label className="switch btn-color-mode-switch">
                                         
                            <input
                                value="1"
                                id="color_mode"
                                name="color_mode"
                                type="checkbox"
                                checked={predictionType === "size"}
                                onChange={handleToggleChange}
                            />
                                         
                            <label
                                className="btn-color-mode-switch-inner"
                                data-off="Color"
                                data-on="Size"
                                htmlFor="color_mode"
                            ></label>
                                       
                        </label>
                                 
                    </div>
                             
                    <button onClick={handlePredict} className="predict-button">
                                    Get Prediction         
                        
                    </button>
                             
                    {showPredictionCard && predictedResult && (
                        <div className="prediction-card">
                                         
                            <h3 className="prediction-text">
                                                Predicted:
                                {predictedResult}             
                            </h3>
                                         
                            <div className="predicted-numbers">
                                               
                                {predictedNumbers.length > 0 ? (
                                    <>
                                                           
                                        {predictedNumbers.map((num, index) => (
                                            <span
                                                key={index}
                                                className="predicted-number-tag"
                                            >
                                                               
                                                        {num}     
                                                               
                                            </span>
                                        ))}
                                                         
                                    </>
                                ) : (
                                    <span>
                                                           
                                        No numbers match the prediction.    
                                                     
                                    </span>
                                )}
                                             
                            </div>
                                       
                        </div>
                    )}
                           
                </div>
                       
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
                                         
                            {entries.map((entry) => (
                                <tr key={entry.id}>
                                                     
                                    <td>{entry.period}</td>          
                                           <td>{entry.number}</td>   
                                                 
                                    <td
                                        className={`color-cell ${
                                            entry.color.includes("🔴")
                                                ? "red"
                                                : "green"
                                        }`}
                                    >
                                                           
                                        {entry.color}             
                                           
                                    </td>
                                                     
                                    <td>{entry.size}</td>           
                                       
                                </tr>
                            ))}
                                       
                        </tbody>
                                 
                    </table>
                           
                </div>
                       
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
                                        .reverse()
                                        .map((entry) => (
                                            <span
                                                key={entry.id}
                                                className={`color-tag`}
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
                                                        ? "darkslateblue"
                                                        : entry.color === "🔴"
                                                        ? "darkred"
                                                        : "darkgreen",
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
