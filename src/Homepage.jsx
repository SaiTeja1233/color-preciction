import React from "react";
import { useNavigate } from "react-router-dom";
import "./Homepage.css";

function HomePage() {
    const navigate = useNavigate();

    const goToColorPrediction = () => {
        navigate("/color-prediction");
    };

    const goToCoinWave = () => {
        navigate("/coin-wave");
    };

    return (
        <div className="homepage">
            <h1>Welcome to the Prediction App</h1>
            <button onClick={goToColorPrediction}>Color Prediction</button>
            <button onClick={goToCoinWave}>Coin Wave</button>
        </div>
    );
}
export default HomePage;
