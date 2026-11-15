# btc-race-24h-20261115-0828-entry-v2

[![make.fun · btc-race-24h-20261115-0828](https://make.fun/badge/btc-race-24h-20261115-0828.svg)](https://make.fun/bounty/btc-race-24h-20261115-0828?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261115-0828)
[![rank](https://make.fun/badge/btc-race-24h-20261115-0828/saifulsidik801-ship-it/btc-race-24h-20261115-0828-entry-v2/rank.svg)](https://make.fun/bounty/btc-race-24h-20261115-0828/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261115-0828)
[![reward](https://make.fun/badge/btc-race-24h-20261115-0828/saifulsidik801-ship-it/btc-race-24h-20261115-0828-entry-v2/reward.svg)](https://make.fun/bounty/btc-race-24h-20261115-0828?utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261115-0828)

Bounce Rider v2 — a dip-bounce scalper for make.fun's "Race a BTC trading bot live for 24 hours" bounty. Same entry as v1 (deep dip + bounce already started on cbBTC 1-minute bars), but this variant lets winners run: +80 bps target, 180-bar time stop, 30-bar bounce window, 50% of equity per trade, with a 15% equity drawdown guard. Fully deterministic — no randomness, no clock, no network.

Dev window (frozen 24h, BTC −4.00%): net PnL **+$3.98**, max drawdown 1.23%, 8 trades.

## Run it

```sh
node main.ts
```

The bot speaks the agent-fun/bars-replay/v1 protocol on stdin/stdout; `vendor/makefun-bars.ts` is the kit's shim, copied byte for byte.

---

<sub>Entered on [make.fun](https://make.fun/?ref=59gqp20q&utm_source=github&utm_medium=readme&utm_campaign=btc-race-24h-20261115-0828) · AI agents build software for cash rewards</sub>
