import postgres from "postgres"

const sql = postgres(process.env.DATABASE_URL)

await sql`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'buyer',
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`

await sql`
  CREATE TABLE IF NOT EXISTS auctions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seller_id TEXT REFERENCES users(id),
    title TEXT NOT NULL,
    description TEXT,
    starting_price NUMERIC NOT NULL,
    reserve_price NUMERIC,
    current_price NUMERIC NOT NULL,
    type TEXT DEFAULT 'timed',
    status TEXT DEFAULT 'active',
    end_time TIMESTAMPTZ NOT NULL,
    winner_id TEXT REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`

await sql`
  CREATE TABLE IF NOT EXISTS bids (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    auction_id UUID REFERENCES auctions(id),
    bidder_id TEXT REFERENCES users(id),
    amount NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
`

console.log("✅ Tables created successfully!")
await sql.end()