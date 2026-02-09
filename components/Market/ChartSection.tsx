'use client'

import { useState, useEffect, useRef } from 'react'
import { createChart, ColorType, AreaSeries } from 'lightweight-charts'
import { useDictionary } from '@/providers/dictionary-provider'
import usePriceHistory from '@/hooks/usePriceHistory'

interface ChartSectionProps {
  tokenId?: string
  currentChance?: number
  changePercent: number
  volume?: string
  defaultTimeframe?: string
}

const INTERVAL_MAP: Record<string, string> = {
  '1H': '1h',
  '1D': '1d',
  '1W': '1w',
  '1M': '1m',
  'MAX': 'max',
}

export default function ChartSection({
  tokenId,
  currentChance,
  changePercent,
  volume,
  defaultTimeframe = '1D'
}: ChartSectionProps) {
  const { dict } = useDictionary()
  const [selectedTimeframe, setSelectedTimeframe] = useState(defaultTimeframe)
  const timeframes = ['1H', '1D', '1W', '1M', 'MAX']
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<any>(null)
  const seriesRef = useRef<any>(null)

  const interval = INTERVAL_MAP[selectedTimeframe] || '1d'
  const { data: priceData, isLoading } = usePriceHistory(tokenId, interval, '60')

  const isPositiveChange = changePercent >= 0

  useEffect(() => {
    if (!chartContainerRef.current || !priceData?.history || priceData.history.length === 0) {
      return
    }

    // Create chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: '#64748b',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: {
          color: '#e2e8f0',
          style: 0,
        },
      },
      width: chartContainerRef.current.clientWidth,
      height: 256,
      rightPriceScale: {
        visible: true,
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        horzLine: {
          visible: true,
          labelVisible: true,
        },
        vertLine: {
          visible: true,
          labelVisible: true,
        },
      },
    })

    // Create area series using v5 API
    const series = chart.addSeries(AreaSeries, {
      lineColor: '#00C805',
      topColor: 'rgba(0, 200, 5, 0.4)',
      bottomColor: 'rgba(0, 200, 5, 0.0)',
      lineWidth: 2,
      priceFormat: {
        type: 'custom',
        formatter: (price: number) => `${(price * 100).toFixed(1)}%`,
      },
    })

    // Convert price history to chart data and remove duplicates
    const chartDataRaw = priceData.history.map((point) => ({
      time: point.t as any,
      value: point.p,
    }))

    // Sort by time ascending and remove duplicates (keep last value for each timestamp)
    const chartDataMap = new Map()
    chartDataRaw.forEach((point) => {
      chartDataMap.set(point.time, point.value)
    })

    const chartData = Array.from(chartDataMap.entries())
      .map(([time, value]) => ({ time, value }))
      .sort((a, b) => a.time - b.time)

    // Set data
    series.setData(chartData)

    // Fit content
    chart.timeScale().fitContent()

    // Save references
    chartRef.current = chart
    seriesRef.current = series

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        })
      }
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
        seriesRef.current = null
      }
    }
  }, [priceData])

  return (
    <div className="w-full bg-base-100 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-base-content">{currentChance}%</span>
          <span className={`text-sm font-semibold ${isPositiveChange ? 'text-success' : 'text-error'}`}>
            {isPositiveChange ? '+' : ''}{changePercent}%
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
      <div className="w-full h-64 mb-4 relative">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : !priceData?.history || priceData.history.length === 0 ? (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-sm text-base-content/60">No data available</span>
          </div>
        ) : (
          <div ref={chartContainerRef} className="w-full h-full" />
        )}
      </div>

      {/* Bottom section */}
      <div className="flex items-center justify-between">
        {/* Volume */}
        <div className="flex items-center gap-1 text-sm text-base-content/60">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{volume}</span>
        </div>

        {/* Timeframe selector + Settings */}
        <div className="flex items-center gap-2">
          <div className="join">
            {timeframes.map((tf) => (
              <button
                key={tf}
                className={`join-item btn btn-xs ${selectedTimeframe === tf ? 'btn-active' : 'btn-ghost'
                  }`}
                onClick={() => setSelectedTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>

          <button className="btn btn-ghost btn-circle btn-xs" aria-label={dict.marketDetail.chart.settings}>
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
  )
}


