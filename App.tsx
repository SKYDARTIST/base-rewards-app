import React, { useState, useCallback } from 'react';
import { Layout } from './components/Layout';
import { ResultCard } from './components/ResultCard';
import { getRewardEstimate } from './services/geminiService';
import { AppState, EstimationResult } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [walletInput, setWalletInput] = useState<string>('');
  const [result, setResult] = useState<EstimationResult | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWalletInput(e.target.value);
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletInput.trim()) return;

    setAppState(AppState.LOADING);
    
    try {
      const data = await getRewardEstimate(walletInput);
      setResult(data);
      setAppState(AppState.RESULT);
    } catch (error) {
      console.error("Error fetching estimate:", error);
      setAppState(AppState.ERROR);
    }
  }, [walletInput]);

  const handleReset = () => {
    setWalletInput('');
    setResult(null);
    setAppState(AppState.IDLE);
  };

  return (
    <Layout>
      {appState === AppState.IDLE && (
        <div className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Estimate your Base Rewards</h1>
            <p className="text-gray-500">Paste your wallet to see your activity score.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="wallet" className="sr-only">Wallet Address</label>
              <input
                type="text"
                id="wallet"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow text-gray-700 placeholder-gray-400"
                placeholder="0x..."
                value={walletInput}
                onChange={handleInputChange}
                required
              />
            </div>
            <button
              type="submit"
              disabled={!walletInput.trim()}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 shadow-lg shadow-blue-500/30"
            >
              Check My Estimate
            </button>
          </form>
        </div>
      )}

      {appState === AppState.LOADING && (
        <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-6"></div>
          <p className="text-gray-600 font-medium animate-pulse">Checking your Base activity...</p>
        </div>
      )}

      {appState === AppState.RESULT && result && (
        <ResultCard result={result} onReset={handleReset} />
      )}

      {appState === AppState.ERROR && (
        <div className="p-8 text-center">
           <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Something went wrong</h3>
          <p className="text-gray-500 mb-6">We couldn't estimate your rewards right now.</p>
          <button
            onClick={handleReset}
            className="text-blue-600 font-medium hover:text-blue-700"
          >
            Try Again
          </button>
        </div>
      )}
    </Layout>
  );
};

export default App;