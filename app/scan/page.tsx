'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { parseJsonResponse, readApiError } from '../../lib/http';

type Result = {
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export default function ScanPage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [portion, setPortion] = useState<'full' | 'half'>('full');
  const [mealType, setMealType] = useState('lunch');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!cameraOn || !video || !streamRef.current) return;
    video.srcObject = streamRef.current;
    void video.play().catch(() => setMessage('Could not start camera preview.'));
  }, [cameraOn]);

  useEffect(() => () => streamRef.current?.getTracks().forEach(t => t.stop()), []);

  async function startCamera() {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      setCameraOn(true);
      setMessage('');
    } catch {
      setMessage('Camera permission denied. Choose a photo instead.');
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function analyze(source: string) {
    setImage(source);
    setLoading(true);
    setMessage('');
    setResult(null);
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: source }),
      });
      const data = await parseJsonResponse<Result & { error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? (await readApiError(response, 'Analysis failed')));
      setResult({
        food_name: data.food_name,
        calories: Number(data.calories) || 0,
        protein: Number(data.protein) || 0,
        carbs: Number(data.carbs) || 0,
        fat: Number(data.fat) || 0,
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video?.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    stopCamera();
    analyze(canvas.toDataURL('image/jpeg', 0.82));
  }

  function upload(file: File) {
    if (!file.type.startsWith('image/')) {
      setMessage('Please choose an image file (JPG, PNG, etc.).');
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setMessage('Could not read that image. Try another photo.');
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => setMessage('Unsupported image format. Try JPG or PNG.');
      img.onload = () => {
        const maxEdge = 1024;
        const scale = Math.min(1, maxEdge / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        analyze(canvas.toDataURL('image/jpeg', 0.68));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function save() {
    if (!result) return;
    const factor = portion === 'half' ? 0.5 : 1;
    setMessage('Saving…');
    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          food_name: result.food_name,
          calories: Math.round(result.calories * factor),
          protein: Math.round(result.protein * factor * 10) / 10,
          carbs: Math.round(result.carbs * factor * 10) / 10,
          fat: Math.round(result.fat * factor * 10) / 10,
          meal_type: mealType,
          source: 'ai_scan',
        }),
      });
      if (response.ok) {
        setMessage(`${portion === 'half' ? 'Half' : 'Full'} portion saved to your diary.`);
      } else {
        setMessage(await readApiError(response, 'Could not save meal. Sign in and try again.'));
      }
    } catch {
      setMessage('Network error while saving. Check your connection.');
    }
  }

  const calories = result ? Math.round(result.calories * (portion === 'half' ? 0.5 : 1)) : 0;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:p-6">
      <div className="mx-auto max-w-xl space-y-5">
        <Link href="/dashboard" className="inline-block text-sm text-blue-600">
          ← Back to dashboard
        </Link>
        <h1 className="text-2xl font-bold sm:text-3xl">Scan a meal</h1>

        <div className="rounded-2xl border bg-white p-4 sm:p-6 text-center">
          {cameraOn ? (
            <video ref={videoRef} autoPlay muted playsInline className="mx-auto mb-4 max-h-64 w-full rounded-xl object-cover sm:max-h-72" />
          ) : image ? (
            <img src={image} alt="Selected meal" className="mx-auto mb-4 max-h-64 w-full rounded-xl object-cover sm:max-h-72" />
          ) : (
            <div className="mb-4 flex min-h-48 items-center justify-center rounded-xl border-2 border-dashed px-4 text-slate-400 sm:h-64">
              Take a photo or upload a meal
            </div>
          )}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
            {cameraOn ? (
              <>
                <button type="button" onClick={capture} className="w-full rounded-lg bg-green-600 px-5 py-3 font-semibold text-white sm:w-auto">
                  Capture & analyze
                </button>
                <button type="button" onClick={stopCamera} className="w-full rounded-lg border px-5 py-3 font-semibold sm:w-auto">
                  Cancel camera
                </button>
              </>
            ) : (
              <button type="button" onClick={startCamera} className="w-full rounded-lg bg-slate-900 px-5 py-3 font-semibold text-white sm:w-auto">
                Open camera
              </button>
            )}
            <label className="w-full cursor-pointer rounded-lg bg-blue-600 px-5 py-3 text-center font-semibold text-white sm:w-auto">
              Choose photo
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/*"
                className="hidden"
                onChange={e => e.target.files?.[0] && upload(e.target.files[0])}
              />
            </label>
          </div>
        </div>

        {loading && <p className="text-center text-blue-600">AI analysis in progress…</p>}

        {result && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4 sm:p-5">
            <h2 className="text-lg font-bold sm:text-xl">{result.food_name}</h2>
            <p className="mt-2">Estimated calories: {calories} kcal</p>
            <label className="mt-4 block text-sm font-semibold">
              How much did you eat?
              <select value={portion} onChange={e => setPortion(e.target.value as 'full' | 'half')} className="mt-2 w-full rounded-lg border p-3">
                <option value="full">Full portion</option>
                <option value="half">Half portion</option>
              </select>
            </label>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <select value={mealType} onChange={e => setMealType(e.target.value)} className="w-full rounded-lg border p-3 sm:flex-1">
                <option value="breakfast">breakfast</option>
                <option value="lunch">lunch</option>
                <option value="dinner">dinner</option>
                <option value="snack">snack</option>
              </select>
              <button type="button" onClick={save} className="w-full rounded-lg bg-green-600 px-4 py-3 font-semibold text-white sm:w-auto">
                Save to diary
              </button>
            </div>
          </div>
        )}

        {message && <p className="rounded-lg bg-white p-3 text-sm">{message}</p>}
      </div>
    </main>
  );
}
