import React, { useState } from 'react';
import NavBtn from '../components/NavBtn';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebaseConfig';

const MAX_BYTES = 20 * 1024 * 1024;

// A stalled upload must never strand the customer on this step with no way to
// tell whether anything happened.
const UPLOAD_TIMEOUT_MS = 60000;

const withTimeout = (promise, ms) =>
    Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Upload timed out')), ms)),
    ]);

export default function ArtworkSelect({ onNext, onPrevious, setUploadedImage, setArtworkFile, setArtworkDescription }) {
    const [imageFile, setImageFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | uploading | success | error
    const [error, setError] = useState('');

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > MAX_BYTES) {
            setError('That file is over 20MB. Please send a smaller version, or describe the design below and we will email you for it.');
            setImageFile(null);
            setStatus('idle');
            setUploadedImage(null);
            setArtworkFile?.(null);
            return;
        }

        setImageFile(file);
        setError('');
        setStatus('uploading');
        setUploadedImage(`pending:${file.name}`);
        // Hand the raw File up so it can ride along as a real email attachment.
        // The Firebase URL alone means the shop has to click out to a link that
        // may not outlive the job.
        setArtworkFile?.(file);

        // Unique path per upload so two customers with the same filename never collide or overwrite.
        const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_');
        const uniquePath = `uploads/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
        const storageRef = ref(storage, uniquePath);
        try {
            await withTimeout(uploadBytes(storageRef, file), UPLOAD_TIMEOUT_MS);
            const downloadURL = await withTimeout(getDownloadURL(storageRef), 15000);
            setUploadedImage(downloadURL);
            setStatus('success');
        } catch (err) {
            // Never fail silently. This used to console.error and leave the UI
            // reading "Uploaded: <name>", so the customer believed their file
            // had gone through when it had not.
            console.error('Error uploading file:', err);
            setStatus('error');
        }
    };

    return (
        <>
            <div className='slide-header'>
                <h1 className='text-3xl font-bold headingColor'>Add Your Artwork</h1>
                <p className='mt-1 text-sm bodyColor'>
                    Upload a file or describe what you have in mind. We can work with either.
                </p>
            </div>
            <div className='slide-content'>
                <div className='text-left space-y-4'>
                    <div>
                        <label className='block text-base font-semibold headingColor mb-2'>Upload Design File</label>
                        <p className='text-xs bodyColor mb-2'>Supported formats: JPG, PNG, PDF, AI, EPS, SVG</p>
                        <input
                            type='file'
                            accept='image/*,.pdf,.ai,.eps,.svg'
                            onChange={handleFileUpload}
                            className='w-full text-sm'
                        />
                        {imageFile && status === 'uploading' && (
                            <p className='text-xs bodyColor mt-2'>Uploading {imageFile.name}...</p>
                        )}
                        {imageFile && status === 'success' && (
                            <p className='text-xs bodyColor mt-2'>
                                <span className='font-semibold'>Uploaded:</span> {imageFile.name}
                            </p>
                        )}
                        {imageFile && status === 'error' && (
                            <p className='text-xs mt-2' style={{ color: '#B42318' }}>
                                <span className='font-semibold'>That file did not finish uploading.</span>{' '}
                                Try again, or just continue. Your quote will still go through and we will
                                email you for the artwork.
                            </p>
                        )}
                        {error && <p className='text-xs mt-2' style={{ color: '#B42318' }}>{error}</p>}
                    </div>

                    <div>
                        <label className='block text-base font-semibold headingColor mb-2'>Or Describe Your Design</label>
                        <p className='text-xs bodyColor mb-2'>Tell us about your design, colors, and layout.</p>
                        <textarea
                            placeholder='Describe your design in detail...'
                            onChange={(e) => setArtworkDescription(e.target.value)}
                            className='w-full p-3 border-2 rounded-lg h-24 resize-none transition text-sm'
                            style={{ fontFamily: "'DM Sans', sans-serif" }}
                        />
                    </div>
                </div>
            </div>
            <div className='slide-nav'>
                <NavBtn onClick={onPrevious} direction='prev'>&larr; Prev</NavBtn>
                <NavBtn onClick={onNext}>Next &rarr;</NavBtn>
            </div>
        </>
    );
}
