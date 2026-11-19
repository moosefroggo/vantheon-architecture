"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"

import { ChampionWorkspace } from "./champion-workspace"
import { workbenchOrigins } from "./workbench-origins"
import { createWorkbenchReplay, workbenchReplayFrame, type WorkbenchReplay } from "./workbench-script"
import "./workbench-demo.css"

const selection = '[aria-label="Edit Selection rule"]'
const composer = 'textarea[aria-label^="Message Atlas"]'
const send = '[aria-label="Atlas conversation"] button[type="submit"]'
const accept = '[data-workbench-action="accept"]'
const dryRun = '[data-workbench-action="dry-run"]'
const confirm = '[data-workbench-action="confirm"]'
const outcome = '[data-workbench-action="outcome"]'

const moves = [
  { start: 0, end: .12, from: null, to: selection },
  { start: .12, end: .195, from: selection, to: composer },
  { start: .195, end: .30, from: composer, to: composer },
  { start: .30, end: .38, from: composer, to: send },
  { start: .38, end: .55, from: null, to: accept },
  { start: .55, end: .74, from: selection, to: dryRun },
  { start: .74, end: .85, from: null, to: confirm },
  { start: .85, end: 1, from: null, to: outcome },
] as const

function isAllowedParent() {
  if (window.parent === window || !document.referrer) return null
  const origin = new URL(document.referrer).origin
  return workbenchOrigins.includes(origin) ? origin : null
}

function clamp(value: number) {
  return Math.max(0, Math.min(1, value))
}

function ease(value: number) {
  const x = clamp(value)
  return x * x * (3 - 2 * x)
}

export function WorkbenchDemo() {
  const [replay, setReplay] = useState<WorkbenchReplay | null>(null)
  const [playhead, setPlayhead] = useState({ progress: 0, reduced: false })
  const [failed, setFailed] = useState(false)
  const cursor = useRef<SVGSVGElement>(null)

  useEffect(() => {
    let current = true
    createWorkbenchReplay().then(
      (prepared) => { if (current) setReplay(prepared) },
      () => { if (current) setFailed(true) },
    )
    return () => { current = false }
  }, [])

  useEffect(() => {
    const origin = isAllowedParent()
    if (!origin || !replay) return
    const post = (data: object) => window.parent.postMessage(data, origin)
    function receive(event: MessageEvent) {
      if (event.source !== window.parent || event.origin !== origin) return
      const data = event.data
      if (data?.type !== "workbench:vantheon:progress" || !Number.isFinite(data.progress)) return
      setPlayhead({ progress: clamp(data.progress), reduced: data.reduced === true })
    }
    function wheel(event: WheelEvent) {
      if (event.ctrlKey || event.deltaY === 0) return
      event.preventDefault()
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1
      post({ type: "workbench:vantheon:scroll", delta: event.deltaY * unit })
    }
    // Let visitors hover real workspace controls. The playhead owns edits and navigation.
    function blockInteraction(event: Event) {
      event.preventDefault()
      event.stopPropagation()
    }
    window.addEventListener("message", receive)
    window.addEventListener("wheel", wheel, { passive: false })
    window.addEventListener("click", blockInteraction, true)
    window.addEventListener("submit", blockInteraction, true)
    window.addEventListener("pointerdown", blockInteraction, true)
    window.addEventListener("keydown", blockInteraction, true)
    post({ type: "workbench:vantheon:ready" })
    return () => {
      window.removeEventListener("message", receive)
      window.removeEventListener("wheel", wheel)
      window.removeEventListener("click", blockInteraction, true)
      window.removeEventListener("submit", blockInteraction, true)
      window.removeEventListener("pointerdown", blockInteraction, true)
      window.removeEventListener("keydown", blockInteraction, true)
    }
  }, [replay])

  const { progress, reduced } = playhead

  useLayoutEffect(() => {
    if (!replay || !cursor.current) return
    const root = document.documentElement
    const preflight = progress >= .74 && progress < .85
    const lift = preflight && !reduced ? ease((progress - .74) / .027) : 1
    root.style.setProperty("--guide-dialog-lift", String(lift))

    const move = moves.findLast(({ start }) => progress >= start) ?? moves[0]
    const pointer = cursor.current
    let highlighted: Element | undefined
    const draw = requestAnimationFrame(() => {
      const target = document.querySelector(move.to)
      const destination = target?.getBoundingClientRect()
      if (!destination || reduced) {
        pointer.style.opacity = "0"
        return
      }
      const source = move.from ? document.querySelector(move.from)?.getBoundingClientRect() : null
      const aim = ease((progress - move.start) / (move.end - move.start) / .78)
      const endX = destination.left + destination.width / 2
      const endY = move.to === outcome ? destination.top + 20 : destination.top + destination.height / 2
      const startX = source ? source.left + source.width / 2 : endX - 65
      const startY = source ? source.top + source.height / 2 : endY + 38
      const x = startX + (endX - startX) * aim
      const y = startY + (endY - startY) * aim
      const press = move.to === composer || move.to === outcome ? 0 : ease((progress - move.end + .012) / .012)
      const writing = ease((progress - .195) / .014) * (1 - ease((progress - .285) / .022))
      pointer.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${1 - .12 * press})`
      pointer.style.opacity = String(ease(progress / .034) * (1 - writing))
      if (target && aim >= .84 && move.to !== composer) {
        target.setAttribute("data-workbench-highlight", "")
        highlighted = target
      }
    })
    return () => {
      cancelAnimationFrame(draw)
      highlighted?.removeAttribute("data-workbench-highlight")
    }
  }, [progress, reduced, replay])

  if (failed) return <p role="status" className="m-5 text-sm">The guided demo is unavailable.</p>
  if (!replay) return null

  return (
    <div className="workbench-guided">
      <ChampionWorkspace workbenchReplay={workbenchReplayFrame(replay, progress)} />
      <svg ref={cursor} className="workbench-guide-cursor" viewBox="0 0 20 22" aria-hidden="true">
        <path d="M2.5 2 17 13.1l-6.6.6 2.7 5.5-2.8 1.3L7.6 15l-5.1 4z" fill="white" stroke="#181922" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </div>
  )
}
