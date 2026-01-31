import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || "us-east-1";
const TABLE = process.env.BRACELET_READINGS_TABLE || "BraceletReadings";

// Map deviceId to userId here. Add more pairs as needed.
const DEVICE_USER_MAP = {
    "bracelet-001": "2d0ba5ff-e24a-4eda-...", // Replace with full userId
    // "bracelet-002": "userId-for-bracelet-002",
};

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

async function backfillUserIds() {
    let lastEvaluatedKey;
    let updatedCount = 0;

    do {
        const scanResult = await docClient.send(
            new ScanCommand({
                TableName: TABLE,
                ExclusiveStartKey: lastEvaluatedKey,
            })
        );

        const items = scanResult.Items || [];
        for (const item of items) {
            const { deviceId, timestamp } = item;
            const userId = DEVICE_USER_MAP[deviceId];
            if (!deviceId || typeof timestamp === "undefined" || !userId) continue;

            await docClient.send(
                new UpdateCommand({
                    TableName: TABLE,
                    Key: { deviceId, timestamp },
                    UpdateExpression: "SET userId = :userId",
                    ExpressionAttributeValues: { ":userId": userId },
                })
            );
            updatedCount += 1;
        }

        lastEvaluatedKey = scanResult.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    console.log(`Updated ${updatedCount} readings with userId.`);
}

backfillUserIds().catch(err => {
    console.error("Backfill failed:", err);
    process.exitCode = 1;
});
