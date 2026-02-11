# Bofet Paper Trading

Paper trading platform built on top of Polymarket markets. Practice prediction market trading with **PMT tokens** on Base Sepolia testnet — no real money involved.

Users browse real Polymarket markets, place simulated buy/sell orders using PMT (a testnet ERC-20 token), and track their positions with real-time P&L based on actual market prices.

---

## How It Works

1. User logs in with **Magic Link** (email-based, no extensions needed)
2. Claims free **PMT tokens** from the faucet (10 PMT per claim, 100 PMT daily limit)
3. Browses real Polymarket markets with live prices
4. Places paper orders — PMT is transferred on-chain to a vault, position is recorded in Supabase
5. Sells positions at current market price — vault returns PMT to user
6. Tracks P&L in real-time using Polymarket's CLOB midpoint prices

### Architecture

```
User (email login)
       |
  [Magic Link Auth]
       |
  Magic EOA (Base Sepolia + Polygon)
       |
  +----+----+
  |         |
  |    [PMT Faucet]
  |    /api/claim-pmt
  |    Sends 10 PMT + gas ETH
  |         |
  |    [Paper Trading]
  |    Buy: user transfers PMT to vault (on-chain)
  |         + saves position in Supabase
  |    Sell: vault returns PMT to user (server-signed)
  |         + updates position in Supabase
  |         |
  |    [Market Data]
  |    Polymarket CLOB API (real prices)
  |    /api/polymarket/midpoint (proxy)
  |         |
  +----+----+
       |
  [Supabase DB]
  paper_positions, paper_trades, pmt_claims
```

---

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- A [Magic Link](https://magic.link/) API key
- A [Supabase](https://supabase.com/) project
- A wallet with PMT tokens + ETH on Base Sepolia (for the faucet/vault)
- [Polymarket Builder credentials](https://polymarket.com/settings?tab=builder) (for market data signing)

### Installation

```bash
npm install
# or
bun install
```

### Environment Setup

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

**Required variables:**

```bash
# Magic Link (auth + wallets)
NEXT_PUBLIC_MAGIC_API_KEY=pk_live_YOUR_KEY

# Supabase (positions, trades, claims)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_anon_key

# Paper Trading / PMT (Base Sepolia)
PMT_FAUCET_PRIVATE_KEY=0xYourFaucetPrivateKey
NEXT_PUBLIC_PMT_VAULT_ADDRESS=0xYourVaultAddress

# Polymarket Builder API (market data)
POLYMARKET_BUILDER_API_KEY=your_api_key
POLYMARKET_BUILDER_SECRET=your_secret
POLYMARKET_BUILDER_PASSPHRASE=your_passphrase

# Polygon RPC (for market data)
NEXT_PUBLIC_POLYGON_RPC_URL=https://polygon-rpc.com

# Redis (caching, rate limiting)
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token
```

See `.env.example` for all available variables including optional ones.

### Database Setup

Create the following tables in your Supabase project:

```sql
-- Paper trading positions
create table paper_positions (
  id uuid primary key default gen_random_uuid(),
  user_address text not null,
  token_id text not null,
  outcome text not null,
  status text not null default 'open',
  shares numeric not null default 0,
  entry_price numeric not null,
  cost numeric not null,
  exit_price numeric,
  realized_pnl numeric not null default 0,
  market_title text not null,
  market_image text,
  market_slug text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  closed_at timestamptz
);

-- Trade history
create table paper_trades (
  id uuid primary key default gen_random_uuid(),
  user_address text not null,
  position_id uuid references paper_positions(id),
  token_id text not null,
  side text not null,
  shares numeric not null,
  price numeric not null,
  total numeric not null,
  created_at timestamptz default now()
);

-- PMT faucet claim tracking
create table pmt_claims (
  id uuid primary key default gen_random_uuid(),
  user_address text not null,
  amount numeric not null default 10,
  tx_hash text,
  created_at timestamptz default now()
);
```

Regenerate types after creating tables:

```bash
npm run gen:types
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
bofet-paper-trading/
├── app/
│   ├── api/
│   │   ├── claim-pmt/route.ts            # PMT faucet (10 PMT + gas per claim)
│   │   ├── vault-payout/route.ts          # Returns PMT to user on sell
│   │   ├── polymarket/
│   │   │   ├── midpoint/route.ts          # CLOB midpoint price proxy
│   │   │   ├── sign/route.ts              # Builder credential signing
│   │   │   ├── markets/route.ts           # Market listing proxy
│   │   │   └── market-by-slug/route.ts    # Single market proxy
│   │   ├── send-gas/route.ts              # Gas relayer (Polygon)
│   │   └── redis/route.ts                 # Redis cache operations
│   └── [lang]/
│       ├── page.tsx                       # Home / market discovery
│       ├── market/[marketSlug]/page.tsx   # Market detail page
│       └── positions/page.tsx             # User positions page
│
├── components/
│   ├── Market/
│   │   ├── TradingPaperModal.tsx          # Paper trading modal (buy/sell)
│   │   ├── TradingButtons.tsx             # Yes/No trade buttons
│   │   └── index.tsx                      # Market detail view
│   ├── Navbar/
│   │   ├── ClaimPMTButton.tsx             # Faucet claim dropdown
│   │   ├── PMTBalance.tsx                 # PMT balance display
│   │   └── index.tsx                      # Main navbar
│   └── Trading/
│       ├── OrderModal/PaperOrderModal.tsx # Quick buy modal (market list)
│       ├── Positions/
│       │   ├── PaperPositionCard.tsx      # Position card with P&L
│       │   └── PaperUserPositions.tsx     # Positions dashboard
│       └── Markets/                       # Market list with outcome buttons
│
├── hooks/
│   ├── usePaperOrder.ts                   # Paper order execution flow
│   ├── usePaperPositions.ts               # CRUD for positions in Supabase
│   ├── usePMTBalance.ts                   # PMT ERC-20 balance (Base Sepolia)
│   ├── useClaimPMT.ts                     # Claim PMT from faucet
│   ├── usePMTTransfer.ts                  # Transfer PMT to vault (Magic SDK)
│   └── useTradingSession.ts               # Trading session orchestration
│
├── lib/
│   ├── magic.ts                           # Magic SDK (Polygon)
│   ├── magicBaseSepolia.ts                # Magic SDK (Base Sepolia)
│   └── supabase.ts                        # Supabase client
│
├── types/
│   └── database.types.ts                  # Auto-generated Supabase types
│
└── constants/
    └── api.ts                             # API URLs, RPC config
```

---

## PMT Token

- **Contract**: `0x8CC5e000199Ad0295491Fc4f6e8CC16e7108C270`
- **Network**: Base Sepolia (chain ID 84532)
- **Decimals**: 18
- **Purpose**: Testnet token for paper trading, no real value

The faucet wallet (`PMT_FAUCET_PRIVATE_KEY`) must hold:
- PMT tokens to distribute to users
- ETH on Base Sepolia to cover gas for user transactions

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `magic-sdk` | Email auth + embedded wallets |
| `@supabase/supabase-js` | Positions, trades, claims database |
| `viem` | ERC-20 interactions on Base Sepolia |
| `@tanstack/react-query` | Client state + caching |
| `@polymarket/clob-client` | Market data (prices, orderbook) |
| `@polymarket/builder-signing-sdk` | Builder API authentication |
| `next` | React framework + API routes |

---

## Support

Questions or issues? Reach out on Telegram: **[@notyrjo](https://t.me/notyrjo)**

---

## License

MIT
