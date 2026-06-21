"use client"

import { useEffect, useId } from "react"

declare global {
  interface Window {
    TradingView: { widget: new (config: object) => void }
  }
}

interface Props {
  symbol?: string
  interval?: string
  height?: number
}

export default function TradingViewChart({
  symbol = "BINANCE:BTCUSDT",
  interval = "5",
  height = 480,
}: Props) {
  const rawId = useId()
  // useId produces ":r0:" style strings — sanitise for DOM id
  const containerId = "tv" + rawId.replace(/[^a-z0-9]/gi, "_")

  useEffect(() => {
    const init = () => {
      if (!window.TradingView) return
      const el = document.getElementById(containerId)
      if (!el) return
      el.innerHTML = ""
      new window.TradingView.widget({
        autosize: true,
        symbol,
        interval,
        timezone: "Etc/UTC",
        theme: "dark",
        style: "1",           // candlestick
        locale: "en",
        toolbar_bg: "#161616",
        enable_publishing: false,
        hide_side_toolbar: false,
        allow_symbol_change: false,
        save_image: false,
        container_id: containerId,
        studies: ["Volume@tv-basicstudies"],
        overrides: {
          "paneProperties.background": "#111111",
          "paneProperties.backgroundType": "solid",
        },
      })
    }

    const scriptId = "tv-widget-script"
    let script = document.getElementById(scriptId) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement("script")
      script.id = scriptId
      script.src = "https://s3.tradingview.com/tv.js"
      script.async = true
      script.onload = init
      document.head.appendChild(script)
    } else if (window.TradingView) {
      init()
    } else {
      script.addEventListener("load", init)
    }

    return () => {
      const el = document.getElementById(containerId)
      if (el) el.innerHTML = ""
    }
  }, [symbol, interval, containerId])

  return (
    <div
      id={containerId}
      style={{ height }}
      className="w-full rounded-xl overflow-hidden border border-gray-800"
    />
  )
}
