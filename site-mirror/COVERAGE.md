# Vantheon frontend capture coverage

Captured on 2026-07-15 for authorized redesign reference.

The replacement-source parity audit and implementation backlog are indexed in
[`audit/README.md`](audit/README.md). It compares the route-reachable `src/`
application with this downloaded deployment and distinguishes observed UI,
screenshot-only states, bundle-only capabilities, missing source behavior, and
intentional redesigns.

## Public pages

- Login
- Password recovery
- Privacy policy
- Terms of service
- Not-found page

## Authenticated pages

- Champions index
- Every Champion detail link visible in the account (12 total)
- The First
- Leaderboard
- Settings

## Representative Champion states

- Paper: Portfolio, Positions, Orders, and the Runs sub-sidebar. Paper Strategy
  was attempted, but the saved state collided with Orders/Runs and is not a valid
  Strategy capture.
- Draft: Strategy, Checkpoints, Datasets, Dry Runs
- Dry-run record detail: v2.0.1
- Checkpoint details: v2.0, v1.3, v1.2, v1.1, v1.0
- Portfolio ranges: 1D, 1W, 1M, 3M, YTD, 1Y, ALL
- Add Funds dialog (not submitted)
- Edit Schedule dialog (not submitted)
- Get Started panel
- Expanded and collapsed Champion sidebar
- Live Quotes, Price History, Asset Search, and ARKK Quotes source panels

## Global and list states

- Champion search filtering
- Expanded/collapsed Champion list
- Expanded/hidden application sidebar
- Theme menu and Dawn, Dusk, Auto themes
- Feedback dialog (not submitted)

## Settings states

- Faction next, previous, and detail-card states
- Adaptive, WallStreetBets, Professional, and Casual personality states
- Conversational and Verbose response states
- Previous/next personality and response controls

## Staging mutations exercised

- Archived the accidental blank `Champion #12`
- Promoted the ETF Swing Trader draft to a new simulated Paper version (`v2`)
- Submitted a dry-run request through Atlas; Atlas reported that chat cannot launch the actual run
- Opened checkpoint Restore controls; no restore result was produced
- Added $1,000 of simulated buying power to the Paper portfolio
- Enabled "Run on market holidays" and saved the schedule
- Submitted test feedback through the global dialog and The First page
- Saved profile flair as `Staging redesign capture`
- Advanced and saved the faction selector
- Saved `Professional` personality with `Conversational` responses
- Opened the Slack Help Me link and the external SPY finance link

## Intentionally not completed

The following flows were unavailable, require device interaction, or were excluded after capture:

- Deploy Live was disabled on every Champion
- Backtests was marked as coming soon
- Passkey enrollment reached the device prompt and was canceled
- Passkey removal confirmation was captured, but the passkey was not removed
- Password validation was captured, then canceled without changing the password
- Notification permission and Sign Out were not completed
- Wallpaper upload requires a user-selected local file

The Live Champion view was unavailable for the representative Champion.

## Local auth-free preview

`local-preview/` is a generated, static redesign preview that starts at
`/dashboard/champions/`. The root, `/dashboard/`, `/auth/login/`, and
`/auth/recover/` all redirect there, so the sign-in screen is outside the local
flow. Original page scripts are removed from preview HTML to prevent the live
Next.js authentication runtime from redirecting back to sign-in. The untouched
source capture remains under `app.vantheon.ai/`, and the preview can be rebuilt
with `node build-local-preview.mjs`.

## Accidental record

Opening the `Create Champion` control immediately created `Champion #12` with ID `8446ce87-b462-4ccd-8e51-7fa5c1cf10e8`. It was captured and later archived after staging authorization.
