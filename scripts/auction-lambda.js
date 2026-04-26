import pkg from 'pg'
const { Client } = pkg

const getClient = async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  return client
}

export const handler = async (event) => {
  const client = await getClient()
  const method = event.requestContext.http.method
  const path = event.requestContext.http.path

  try {
    // GET /auctions — list all active auctions
    if (method === 'GET' && path === '/auctions') {
      const { rows } = await client.query(`
        SELECT a.*, u.name as seller_name
        FROM auctions a
        JOIN users u ON a.seller_id = u.id
        WHERE a.status = 'active'
        ORDER BY a.end_time ASC
      `)
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auctions: rows })
      }
    }

    // GET /auctions/{id} — get single auction with bids
    if (method === 'GET' && path.match(/\/auctions\/[\w-]+$/)) {
      const id = path.split('/')[2]
      const { rows: auction } = await client.query(
        `SELECT a.*, u.name as seller_name
         FROM auctions a
         JOIN users u ON a.seller_id = u.id
         WHERE a.id = $1`, [id]
      )
      const { rows: bids } = await client.query(
        `SELECT b.*, u.name as bidder_name
         FROM bids b
         JOIN users u ON b.bidder_id = u.id
         WHERE b.auction_id = $1
         ORDER BY b.amount DESC`, [id]
      )
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auction: auction[0], bids })
      }
    }

    // POST /auctions — create auction (sellers only)
    if (method === 'POST' && path === '/auctions') {
      const body = JSON.parse(event.body)
      const { title, description, starting_price, reserve_price, type, end_time, seller_id } = body
      const { rows } = await client.query(`
        INSERT INTO auctions (title, description, starting_price, reserve_price, current_price, type, end_time, seller_id)
        VALUES ($1, $2, $3, $4, $3, $5, $6, $7)
        RETURNING *
      `, [title, description, starting_price, reserve_price, type, end_time, seller_id])
      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auction: rows[0] })
      }
    }

    // POST /auctions/{id}/bids — place a bid
    if (method === 'POST' && path.match(/\/auctions\/[\w-]+\/bids$/)) {
      const id = path.split('/')[2]
      const body = JSON.parse(event.body)
      const { amount, bidder_id } = body

      // Check auction exists and is active
      const { rows: auction } = await client.query(
        `SELECT * FROM auctions WHERE id = $1 AND status = 'active'`, [id]
      )
      if (!auction[0]) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Auction not found or ended' }) }
      }

      // Check bid is higher than current price
      if (amount <= auction[0].current_price) {
        return { statusCode: 400, body: JSON.stringify({ error: `Bid must be higher than current price $${auction[0].current_price}` }) }
      }

      // Insert bid and update current price
      await client.query(
        `INSERT INTO bids (auction_id, bidder_id, amount) VALUES ($1, $2, $3)`, [id, bidder_id, amount]
      )
      await client.query(
        `UPDATE auctions SET current_price = $1 WHERE id = $2`, [amount, id]
      )

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, new_price: amount })
      }
    }

    return { statusCode: 404, body: JSON.stringify({ error: 'Route not found' }) }

  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  } finally {
    await client.end()
  }
}