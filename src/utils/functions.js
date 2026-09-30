// Calls the PrintMaster pricing function. Returns the full result object so the
// caller can handle quotable:false (below the 12 piece screen print minimum, over
// the 500 piece top of Kevin's sheet, too many screens) instead of rendering a
// fabricated or $0 price.
import { SP_PLACEMENTS } from '../pages/SPLocationSelect';

const calculateFinalQuote = async (selectedGarment, quantity, {
    selectedProject,
    selectedLocation,
    digitizing,
    locationColorCounts,
    selectedColor,
    pickedGarment,
}) => {
    if (!quantity) return { quotable: false, errorCode: 'INCOMPLETE' };

    // Live S&S wholesale cost of the picked blank, marked up on the server. Only catalog
    // rows carry a current cost; the hand-built fallback list is March 2025 data, so a
    // fallback pick quotes decoration only rather than on a stale blank price.
    const selectedGarmentCost = pickedGarment?.fromCatalog && pickedGarment.cost > 0 ? pickedGarment.cost : 0;
    const body = { selectedProject, quantity, selectedLocation, digitizing, selectedGarmentCost };
    if (selectedProject === 'screenPrinting') {
        // Placement keys become {key,label} for the email lines; the colour picked on
        // the garment carries the underbase flag (0 light, 1 dark).
        body.spLocations = (selectedLocation || []).map((key) => ({
            key,
            label: (SP_PLACEMENTS.find((p) => p.key === key) || {}).label || key,
        }));
        body.locationColorCounts = locationColorCounts || {};
        body.garmentUnderbase = selectedColor?.underbase ?? 0;
    }

    try {
        const response = await fetch('/.netlify/functions/calculatePricing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (!response.ok) return { quotable: false, errorCode: 'CALC_ERROR' };
        return await response.json();
    } catch {
        return { quotable: false, errorCode: 'CALC_ERROR' };
    }
};

export default calculateFinalQuote;
