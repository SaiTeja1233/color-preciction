import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./Homepage";
import ColorPredictionApp from "./ColorPredictionApp";
import Coinwave from "./Coinwave";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route
                    path="/color-prediction"
                    element={<ColorPredictionApp />}
                />
                <Route path="/coin-wave" element={<Coinwave />} />
            </Routes>
        </Router>
    );
}
export default App;
