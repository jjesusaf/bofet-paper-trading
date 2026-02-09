'use client'

import { useState } from 'react'
import { useDictionary } from '@/providers/dictionary-provider'

export default function ChartSectionPreview() {
  const { dict } = useDictionary()
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D')
  const timeframes = ['1H', '1D', '1W', '1M', 'MAX']

  return (
    <div className="w-full bg-base-100 relative h-full">
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-white/50 backdrop-blur-md z-10 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm font-semibold text-gray-600">
            Inicia sesión para ver el gráfico
          </p>
        </div>
      </div>

      {/* Content (blurred in background) */}
      <div className="relative z-0 p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-base-content">--%</span>
            <span className="text-sm font-semibold text-base-content/40">
              +0.0%
            </span>
          </div>
          <div className="flex items-center gap-1">
            <img
              src="/bofet_logo.svg"
              alt="bofet"
              className="w-6 h-6"
            />
            <span className="text-xs text-base-content/60">Bofet</span>
          </div>
        </div>

        {/* Chart */}
        <div className="w-full h-64 mb-4">
          <svg viewBox="0 0 400 200" className="w-full h-full">
            {/* Grid lines */}
            <line x1="0" y1="40" x2="400" y2="40" stroke="currentColor" strokeOpacity="0.1" />
            <line x1="0" y1="80" x2="400" y2="80" stroke="currentColor" strokeOpacity="0.1" />
            <line x1="0" y1="120" x2="400" y2="120" stroke="currentColor" strokeOpacity="0.1" />
            <line x1="0" y1="160" x2="400" y2="160" stroke="currentColor" strokeOpacity="0.1" />

            {/* Trend line (dummy data) */}
            <polyline
              points="0,160 50,120 100,100 150,110 200,90 250,85 300,80 350,75 400,70"
              fill="none"
              stroke="#00C805"
              strokeWidth="2"
              opacity="0.3"
            />

            {/* Y-axis labels */}
            <text x="5" y="35" fontSize="10" fill="currentColor" opacity="0.3">15%</text>
            <text x="5" y="75" fontSize="10" fill="currentColor" opacity="0.3">10%</text>
            <text x="5" y="115" fontSize="10" fill="currentColor" opacity="0.3">5%</text>
            <text x="5" y="155" fontSize="10" fill="currentColor" opacity="0.3">0%</text>

            {/* X-axis labels */}
            <text x="50" y="195" fontSize="10" fill="currentColor" opacity="0.3">Nov</text>
            <text x="150" y="195" fontSize="10" fill="currentColor" opacity="0.3">Dec</text>
            <text x="300" y="195" fontSize="10" fill="currentColor" opacity="0.3">Jan</text>
          </svg>
        </div>

        {/* Bottom section */}
        <div className="flex items-center justify-between">
          {/* Volume */}
          <div className="flex items-center gap-1 text-sm text-base-content/40">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>$---</span>
          </div>

          {/* Timeframe selector + Settings */}
          <div className="flex items-center gap-2">
            <div className="join">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  className={`join-item btn btn-xs ${selectedTimeframe === tf ? 'btn-active' : 'btn-ghost'}`}
                  onClick={() => setSelectedTimeframe(tf)}
                  disabled
                >
                  {tf}
                </button>
              ))}
            </div>

            <button className="btn btn-ghost btn-circle btn-xs" aria-label={dict.marketDetail?.chart?.settings} disabled>
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
