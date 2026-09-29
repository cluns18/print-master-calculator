import React, { useState, useEffect } from 'react';
import './App.css';
import IntroSlide from './pages/IntroSlide';
import SPGarmentSelect from './pages/SPGarmentSelect';
import EmbGarmentSelect from './pages/EmbGarmentSelect';
import GarmentPickSlide from './pages/GarmentPickSlide';
import ColorSelect from './pages/ColorSelect';
import tshirtGarments from './garments/tshirts';
import longSleeveGarments from './garments/longsleeves';
import hoodieGarments from './garments/hoodies';
import poloGarments from './garments/polos';
import hatGarments from './garments/hats';

// The hand-built shortlist per type, shown only when the live catalog is off or
// fails to load, so the garment step never goes dark.
const FALLBACK_GARMENTS = {
  sptshirt: Object.values(tshirtGarments),
  splongsleeve: Object.values(longSleeveGarments),
  sphoodie: Object.values(hoodieGarments),
  sppolo: Object.values(poloGarments),
  embsweatshirt: Object.values(hoodieGarments),
  embpolo: Object.values(poloGarments),
  embhat: Object.values(hatGarments),
};
const TYPE_NAMES = {
  sptshirt: 'T-Shirt', splongsleeve: 'Long Sleeve', sphoodie: 'Hoodie', sppolo: 'Polo',
  embsweatshirt: 'Sweatshirt', embpolo: 'Polo', embhat: 'Hat',
};
import ArtworkSelect from './pages/ArtworkSelect';
import LocationSelect from './pages/LocationSelect';
import SPLocationSelect from './pages/SPLocationSelect';
import ColorCount from './pages/ColorCount';
import DigitizingSelect from './pages/DigitizingSelect';
import FinalQuote from './pages/FinalQuote';
import ThankYou from './pages/ThankYou';

function App() {
  const [currentSlide, setCurrentSlide] = useState('intro');
  const [slideHistory, setSlideHistory] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedGarment, setSelectedGarment] = useState(null);
  const [selectedSPGarment, setSelectedSPGarment] = useState(null);
  const [selectedEmbGarment, setSelectedEmbGarment] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedArtwork, setSelectedArtwork] = useState(null);
  // The raw File, kept alongside the Firebase URL so the quote email can carry
  // the artwork as a real attachment and not just a link.
  const [artworkFile, setArtworkFile] = useState(null);
  const [artworkDescription, setArtworkDescription] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [selectedSpecialInks, setSelectedSpecialInks] = useState([]);
  const [locationColorCounts, setLocationColorCounts] = useState({});
  const [locationThreadCounts, setLocationThreadCounts] = useState({});
  const [digitizing, setDigitizing] = useState(null);
  const [finalQuote, setFinalQuote] = useState(null);
  const [hasError, setHasError] = useState(false);

  const handleNext = () => {
    let nextSlide = '';
    let isValid = true;

    if (currentSlide === 'intro' && !selectedProject) {
      isValid = false;
    }
    else if (currentSlide === 'spGarment' && !selectedGarment) {
      isValid = false;
    }
    else if (currentSlide === 'embGarment' && !selectedGarment) {
      isValid = false;
    }
    else if (currentSlide === 'garmentPick' && !(selectedProject === 'screenPrinting' ? selectedSPGarment : selectedEmbGarment)) {
      isValid = false;
    }
    else if (currentSlide === 'colorSelect' && !selectedColor) {
      isValid = false;
    }
    else if (currentSlide === 'artworkSelect' && !(selectedArtwork || artworkDescription)) {
      isValid = false;
    }
    else if ((currentSlide === 'locationSelect' || currentSlide === 'spLocationSelect') && selectedLocation.length === 0) {
      isValid = false;
    }
    else if (currentSlide === 'digitizing' && !digitizing) {
      isValid = false;
    }

    if (!isValid) {
      setHasError(true);
      setTimeout(() => setHasError(false), 1000);
      return;
    }

    setHasError(false);

    if (currentSlide === 'intro') {
      nextSlide = selectedProject === 'screenPrinting' ? 'spGarment' : 'embGarment';
    }
    else if ((currentSlide === 'spGarment' || currentSlide === 'embGarment') && selectedGarment) {
      nextSlide = 'garmentPick';
    }
    else if (currentSlide === 'garmentPick') {
      nextSlide = 'colorSelect';
    }
    else if (currentSlide === 'colorSelect') {
      nextSlide = 'artworkSelect';
    }
    else if (currentSlide === 'artworkSelect') {
      // Screen print: placements then ink colours per placement, priced off Kevin's
      // 2026-09-29 sheet. Embroidery: his flat-rate placement rows then digitizing.
      nextSlide = selectedProject === 'screenPrinting' ? 'spLocationSelect' : 'locationSelect';
    }
    else if (currentSlide === 'spLocationSelect') {
      nextSlide = 'colorCount';
    }
    else if (currentSlide === 'colorCount') {
      nextSlide = 'finalQuote';
    }
    else if (currentSlide === 'locationSelect') {
      nextSlide = 'digitizing';
    }
    else if (currentSlide === 'digitizing') {
      nextSlide = 'finalQuote';
    }
    else if (currentSlide === 'finalQuote') {
      nextSlide = 'thankYou';
    }

    if (nextSlide) {
      setSlideHistory([...slideHistory, currentSlide]);
      setCurrentSlide(nextSlide);
    }
  };

  const handlePrevious = () => {
    if (slideHistory.length > 0) {
      const previousSlide = slideHistory[slideHistory.length - 1];

      if (previousSlide === 'spGarment') setSelectedSPGarment(null);
      if (previousSlide === 'embGarment') setSelectedEmbGarment(null);
      if (previousSlide === 'intro') setSelectedGarment(null);
      if (previousSlide === 'digitizing') setDigitizing(null);
      if (previousSlide === 'locationSelect' || previousSlide === 'spLocationSelect') {
        setSelectedSpecialInks([]);
        setLocationColorCounts({});
      }

      const newHistory = slideHistory.slice(0, -1);
      setCurrentSlide(previousSlide);
      setSlideHistory(newHistory);
    }
  };

  useEffect(() => {
    const stepMap = {
      intro: '1 - Project Type',
      spGarment: '2 - Garment Type',
      embGarment: '2 - Garment Type',
      garmentPick: '3 - Garment Select',
      colorSelect: '4 - Color',
      artworkSelect: '5 - Artwork',
      locationSelect: '6 - Placement',
      spLocationSelect: '6 - Placement',
      colorCount: '7 - Ink Colors',
      digitizing: '7 - Artwork Set-Up',
      finalQuote: '8 - Quote',
      thankYou: '9 - Confirmation'
    };

    const stepName = stepMap[currentSlide] || currentSlide;

    window.parent.postMessage(
      {
        event: 'calculator_slide_view',
        calcSlideName: currentSlide,
        calcStepName: stepName,
      },
      '*'
    );
  }, [currentSlide]);

  return (
    <div className={`slide-container ${hasError ? 'error-shake' : ''}`}>
      <div className='slide-page'>
        {currentSlide === 'intro' && (
          <IntroSlide
            selectedProject={selectedProject}
            setSelectedProject={setSelectedProject}
            onNext={handleNext}
          />
        )}
        {currentSlide === 'spGarment' && (
          <SPGarmentSelect
            onNext={handleNext}
            onPrevious={handlePrevious}
            selectedGarment={selectedGarment}
            setSelectedGarment={setSelectedGarment}
          />
        )}
        {currentSlide === 'embGarment' && (
          <EmbGarmentSelect
            onNext={handleNext}
            onPrevious={handlePrevious}
            selectedGarment={selectedGarment}
            setSelectedGarment={setSelectedGarment}
          />
        )}
        {currentSlide === 'garmentPick' && selectedGarment && (
          <GarmentPickSlide
            key={selectedGarment.id}
            typeId={selectedGarment.id}
            typeName={TYPE_NAMES[selectedGarment.id] || selectedGarment.name}
            fallbackGarments={FALLBACK_GARMENTS[selectedGarment.id] || []}
            selected={selectedProject === 'screenPrinting' ? selectedSPGarment : selectedEmbGarment}
            setSelected={(g) => {
              // A new garment means a new set of colorways, so the old colour pick
              // must not ride along into the colour step.
              setSelectedColor(null);
              if (selectedProject === 'screenPrinting') setSelectedSPGarment(g); else setSelectedEmbGarment(g);
            }}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )}
        {currentSlide === 'colorSelect' && (
          <ColorSelect
            onNext={handleNext}
            onPrevious={handlePrevious}
            selectedSPGarment={selectedSPGarment}
            selectedEmbGarment={selectedEmbGarment}
            selectedColor={selectedColor}
            setSelectedColor={setSelectedColor}
          />
        )}
        {currentSlide === 'artworkSelect' && (
          <ArtworkSelect
            onNext={handleNext}
            onPrevious={handlePrevious}
            setUploadedImage={setSelectedArtwork}
            setArtworkFile={setArtworkFile}
            setArtworkDescription={setArtworkDescription}
          />
        )}
        {currentSlide === 'locationSelect' && (
          <LocationSelect
            onNext={handleNext}
            onPrevious={handlePrevious}
            selectedGarment={selectedGarment}
            setSelectedLocation={setSelectedLocation}
          />
        )}
        {currentSlide === 'spLocationSelect' && (
          <SPLocationSelect
            onNext={handleNext}
            onPrevious={handlePrevious}
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
          />
        )}
        {currentSlide === 'colorCount' && (
          <ColorCount
            onNext={handleNext}
            onPrevious={handlePrevious}
            selectedLocations={selectedLocation}
            setColorCounts={setLocationColorCounts}
            needsUnderbase={Number(selectedColor?.underbase) === 1}
          />
        )}
        {currentSlide === 'digitizing' && (
          <DigitizingSelect
            onNext={handleNext}
            onPrevious={handlePrevious}
            digitizing={digitizing}
            setDigitizing={setDigitizing}
          />
        )}
        {currentSlide === 'finalQuote' && (
          <FinalQuote
            onNext={handleNext}
            onPrevious={handlePrevious}
            selectedProject={selectedProject}
            selectedGarment={selectedGarment}
            selectedSPGarment={selectedSPGarment}
            selectedEmbGarment={selectedEmbGarment}
            selectedColor={selectedColor}
            selectedArtwork={selectedArtwork}
            artworkFile={artworkFile}
            artworkDescription={artworkDescription}
            selectedLocation={selectedLocation}
            locationColorCounts={locationColorCounts}
            selectedSpecialInks={selectedSpecialInks}
            digitizing={digitizing}
            setFinalQuote={setFinalQuote}
          />
        )}
        {currentSlide === 'thankYou' && (
          <ThankYou />
        )}
      </div>
      {hasError && <p className="error-message" style={{ position: 'absolute', bottom: '8px', left: 0, right: 0 }}>Please make a selection to proceed.</p>}
    </div>
  );
}

export default App;
