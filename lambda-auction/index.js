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
    // GET /auctions
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
// GET /auctions/all — list all auctions including ended
if (method === 'GET' && path === '/auctions/all') {
  const { rows } = await client.query(`
    SELECT a.*, u.name as seller_name,
      w.name as winner_name, w.email as winner_email
    FROM auctions a
    JOIN users u ON a.seller_id = u.id
    LEFT JOIN users w ON a.winner_id = w.id
    ORDER BY a.end_time DESC
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

    // POST /auctions
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

    // POST /auctions/{id}/bids
    if (method === 'POST' && path.match(/\/auctions\/[\w-]+\/bids$/)) {
      const id = path.split('/')[2]
      const body = JSON.parse(event.body)
      const { amount, bidder_id } = body

      const { rows: auction } = await client.query(
        `SELECT * FROM auctions WHERE id = $1 AND status = 'active'`, [id]
      )
      if (!auction[0]) {
        return { statusCode: 404, body: JSON.stringify({ error: 'Auction not found or ended' }) }
      }

      if (amount <= auction[0].current_price) {
        return { statusCode: 400, body: JSON.stringify({ error: `Bid must be higher than current price $${auction[0].current_price}` }) }
      }

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

    // POST /users/sync
    if (method === 'POST' && (path === '/users/sync' || path.endsWith('/users/sync'))) {
      const body = JSON.parse(event.body)
      const { id, email, name } = body
      await client.query(`
        INSERT INTO users (id, email, name, role)
        VALUES ($1, $2, $3, 'buyer')
        ON CONFLICT (id) DO UPDATE SET email = $2, name = $3
      `, [id, email, name])
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      }
    }
    // GET /users
if (method === 'GET' && path === '/users') {
  const { rows } = await client.query(`
    SELECT id, email, name, role, created_at
    FROM users ORDER BY created_at DESC
  `)
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ users: rows })
  }
}

// PUT /users/{id}/role
if (method === 'PUT' && path.match(/\/users\/[\w-]+\/role$/)) {
  const id = path.split('/')[2]
  const body = JSON.parse(event.body)
  const { role } = body
  await client.query(`UPDATE users SET role = $1 WHERE id = $2`, [role, id])
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true })
  }
}

// GET /products/db
if (method === 'GET' && path === '/products/db') {
  const { rows } = await client.query(`
    SELECT p.*, u.name as seller_name
    FROM products p
    JOIN users u ON p.seller_id = u.id
    WHERE p.status = 'active'
    ORDER BY p.created_at DESC
  `)
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ products: rows })
  }
}

// POST /products/create
if (method === 'POST' && path === '/products/create') {
  const body = JSON.parse(event.body)
  const { name, description, price, seller_id } = body
  const { rows } = await client.query(`
    INSERT INTO products (name, description, price, seller_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [name, description, price, seller_id])
  return {
    statusCode: 201,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ product: rows[0] })
  }
}

// POST /auctions/create
if (method === 'POST' && path === '/auctions/create') {
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


    return { statusCode: 404, body: JSON.stringify({ error: 'Route not found' }) }

  } catch (err) {
    console.error(err)
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) }
  } finally {
    await client.end()
  }
}