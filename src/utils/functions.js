// Calls the PrintMaster pricing function. Returns the full result object so the
// caller can handle quotable:false (e.g. screen print, which the shop has never
// supplied a matrix for) instead of rendering a fabricated or $0 price.
const calculateFinalQuote = async (selectedGarment, quantity, {
    selectedProject,
    selectedLocation,
    digitizing,
}) => {
    if (!quantity) return { quotable: false, errorCode: 'INCOMPLETE' };

    try {
        const response = await fetch('/.netlify/functions/calculatePricing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedProject, quantity, selectedLocation, digitizing }),
        });
        if (!response.ok) return { quotable: false, errorCode: 'CALC_ERROR' };
        return await response.json();
    } catch {
        return { quotable: false, errorCode: 'CALC_ERROR' };
    }
};

export default calculateFinalQuote;
