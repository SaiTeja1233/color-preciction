import React from "react";
import "./ColorPredictionApp.css"; // Make sure your CSS file is imported

const ColorDistributionVisualizer = ({ entries }) => {
    const colors = entries.map(entry => entry.color.replace('🟣', ''));
    const colorCounts = colors.reduce((acc, color) => {
        acc[color] = (acc[color] || 0) + 1;
        return acc;
    }, {});

    const uniqueColors = Object.keys(colorCounts);
    const totalUniqueColors = uniqueColors.length;
    const parts = 20;
    const colorsPerPart = Math.ceil(totalUniqueColors / parts);

    const distribution = Array.from({ length: parts }, (_, index) => {
        const start = index * colorsPerPart;
        const end = Math.min((index + 1) * colorsPerPart, totalUniqueColors);
        return uniqueColors.slice(start, end);
    });

    return (
        <div className="color-distribution-container">
            <h3>Color Distribution</h3>
            <div className="color-parts-grid">
                {distribution.map((partColors, index) => (
                    <div key={index} className="color-part">
                        {partColors.map((color) => (
                            <span
                                key={color}
                                className={`color-dot ${color}`}
                                title={color}
                            ></span>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ColorDistributionVisualizer;