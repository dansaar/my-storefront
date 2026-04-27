import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"
import pkg from 'pg'
const { Client } = pkg

const ses = new SESClient({ region: "us-east-1" })

const getDb = async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  return client
}

export const handler = async () => {
  const db = await getDb()
  try {
    // Find all expired active auctions
    const { rows: expiredAuctions } = await db.query(`
      SELECT a.*, u.email as seller_email
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      WHERE a.end_time < NOW()
      AND a.status = 'active'
    `)

    console.log(`Found ${expiredAuctions.length} expired auctions`)

    for (const auction of expiredAuctions) {
      // Find highest bid
      const { rows: bids } = await db.query(`
        SELECT b.*, u.email as bidder_email, u.name as bidder_name
        FROM bids b
        JOIN users u ON b.bidder_id = u.id
        WHERE b.auction_id = $1
        ORDER BY b.amount DESC
        LIMIT 1
      `, [auction.id])

      const winner = bids[0]

      // Update auction status
      await db.query(`
        UPDATE auctions
        SET status = 'ended', winner_id = $1
        WHERE id = $2
      `, [winner?.bidder_id || null, auction.id])

      console.log(`Closed auction: ${auction.title}, winner: ${winner?.bidder_email || 'no bids'}`)

      // Send winner email if there was a winning bid
      if (winner) {
        try {
          await ses.send(new SendEmailCommand({
            Source: process.env.SES_FROM_EMAIL,
            Destination: { ToAddresses: [winner.bidder_email] },
            Message: {
              Subject: { Data: `🏆 You won: ${auction.title}!` },
              Body: {
                Text: {
                  Data: `Congratulations! You won the auction for "${auction.title}" with a bid of $${winner.amount}. The seller will be in touch soon.`
                }
              }
            }
          }))
          console.log(`Winner email sent to: ${winner.bidder_email}`)
        } catch (emailErr) {
          console.error('Email send failed:', emailErr.message)
        }
      }

      // Send seller email
      try {
        await ses.send(new SendEmailCommand({
          Source: process.env.SES_FROM_EMAIL,
          Destination: { ToAddresses: [auction.seller_email] },
          Message: {
            Subject: { Data: `Your auction ended: ${auction.title}` },
            Body: {
              Text: {
                Data: winner
                  ? `Your auction for "${auction.title}" has ended. Winning bid: $${winner.amount} by ${winner.bidder_name}.`
                  : `Your auction for "${auction.title}" has ended with no bids.`
              }
            }
          }
        }))
      } catch (emailErr) {
        console.error('Seller email failed:', emailErr.message)
      }
    }

    return { statusCode: 200, body: `Closed ${expiredAuctions.length} auctions` }
  } finally {
    await db.end()
  }
}