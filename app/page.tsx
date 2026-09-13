'use client';

import { useState } from 'react';

const problemTemplate = `DESIGN PROPOSAL: [Your project name]

SPECIFICATION:
- [Component/constraint 1]
- [Component/constraint 2]

KEY DESIGN DECISIONS:
1. [Decision A]
2. [Decision B]

RATIONALE:
- [Why A]
- [Why B]

Question: [What do you want reviewed?]`;

export default function Home() {
  const [problem, setProblem] = useState(problemTemplate);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleReview = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ problem }),
      });

      if (!response.ok) throw new Error('Review failed');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">🛡️ Engineering Review Board</h1>
          <p className="text-slate-400">Submit your design. Get feedback from 6 engineering disciplines.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="bg-slate-800 rounded-lg p-6 h-fit sticky top-6">
            <h2 className="text-xl font-bold mb-4">Design Proposal</h2>
            <textarea
              value={problem}
              onChange={(e) => setProblem(e.target.value)}
              className="w-full h-96 bg-slate-700 text-white rounded p-4 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Paste your design problem here..."
            />
            <button
              onClick={handleReview}
              disabled={loading}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-bold py-3 rounded-lg transition"
            >
              {loading ? '⏳ Reviewing...' : '▶ Submit Review'}
            </button>
            {error && (
              <div className="mt-4 p-3 bg-red-900 rounded text-red-200">
                {error}
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className="space-y-4">
            {result ? (
              <>
                <div className="bg-slate-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-3">Chief Engineer's Proposal</h3>
                  <div className="bg-slate-700 rounded p-4 max-h-64 overflow-y-auto text-sm whitespace-pre-wrap">
                    {result.proposal}
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-3">Engineering Reviews</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {result.reviews.map((r: any, i: number) => (
                      <details key={i} className="bg-slate-700 rounded p-3 cursor-pointer">
                        <summary className="font-semibold hover:text-blue-400">
                          {r.engineer} <span className="text-slate-400">({r.discipline})</span>
                        </summary>
                        <div className="mt-2 text-sm whitespace-pre-wrap text-slate-300">
                          {r.review}
                        </div>
                      </details>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800 rounded-lg p-6">
                  <h3 className="text-xl font-bold mb-3">Synthesis & Recommendation</h3>
                  <div className="bg-slate-700 rounded p-4 text-sm whitespace-pre-wrap max-h-64 overflow-y-auto">
                    {result.synthesis}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-slate-800 rounded-lg p-6 text-center text-slate-400">
                Submit a design proposal to get started →
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}