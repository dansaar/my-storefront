import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, PutCommand, DeleteCommand, ScanCommand } from "@aws-sdk/lib-dynamodb"
import { ApiGatewayManagementApiClient, PostToConnectionCommand } from "@aws-sdk/client-apigatewaymanagementapi"
import pkg from 'pg'
const { Client } = pkg

const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({ region: "us-east-1" }))

const getDb = async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  return client
}

export const handler = async (event) => {
  const { routeKey, connectionId } = event.requestContext
  const domainName = event.requestContext.domainName
  const stage = event.requestContext.stage

  // $connect — save connection
  if (routeKey === '$connect') {
    const auctionId = event.queryStringParameters?.auctionId
    await dynamo.send(new PutCommand({
      TableName: 'auction-connections',
      Item: { connectionId, auctionId: auctionId || 'none' }
    }))
    return { statusCode: 200 }
  }

  // $disconnect — remove connection
  if (routeKey === '$disconnect') {
    await dynamo.send(new DeleteCommand({
      TableName: 'auction-connections',
      Key: { connectionId, auctionId: 'none' }
    }))
    return { statusCode: 200 }
  }

  // sendBid — save bid and broadcast to all connections
  if (routeKey === 'sendBid') {
    const body = JSON.parse(event.body)
    const { auctionId, amount, bidderId, bidderName } = body

    const db = await getDb()
    try {
      const { rows: auction } = await db.query(
        `SELECT * FROM auctions WHERE id = $1 AND status = 'active'`, [auctionId]
      )
      if (!auction[0]) {
        return { statusCode: 404 }
      }

      if (amount <= auction[0].current_price) {
        const apigw = new ApiGatewayManagementApiClient({
          endpoint: `https://${domainName}/${stage}`
        })
        await apigw.send(new PostToConnectionCommand({
          ConnectionId: connectionId,
          Data: JSON.stringify({ type: 'error', message: `Bid must be higher than $${auction[0].current_price}` })
        }))
        return { statusCode: 400 }
      }

      await db.query(
        `INSERT INTO bids (auction_id, bidder_id, amount) VALUES ($1, $2, $3)`, [auctionId, bidderId, amount]
      )
      await db.query(
        `UPDATE auctions SET current_price = $1 WHERE id = $2`, [amount, auctionId]
      )

      const { Items: connections } = await dynamo.send(new ScanCommand({
        TableName: 'auction-connections',
        FilterExpression: 'auctionId = :aid',
        ExpressionAttributeValues: { ':aid': auctionId }
      }))

      const apigw = new ApiGatewayManagementApiClient({
        endpoint: `https://${domainName}/${stage}`
      })

      const message = JSON.stringify({
        type: 'newBid',
        amount,
        bidderId,
        bidderName,
        timestamp: new Date().toISOString()
      })

      await Promise.allSettled(
        (connections || []).map(conn =>
          apigw.send(new PostToConnectionCommand({
            ConnectionId: conn.connectionId,
            Data: message
          }))
        )
      )
    } finally {
      await db.end()
    }

    return { statusCode: 200 }
  }

  return { statusCode: 400 }
}