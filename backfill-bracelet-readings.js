import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    ScanCommand,
    UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || "us-east-1";
const TABLE = process.env.BRACELET_READINGS_TABLE || "BraceletReadings";

// Provide any attributes you want to add to existing items
// Example: { firmware: "1.2.3", batteryLevel: 90 }
const DEFAULT_ATTRIBUTES = {
    firmware: "1.0.0",
    batteryLevel: 100,
    status: "active",
    userType: "standard",
    
};

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

const buildUpdate = (attributes) => {
    const expressionParts = [];
    const ExpressionAttributeNames = {};
    const ExpressionAttributeValues = {};

    Object.entries(attributes).forEach(([key, value], index) => {
        const nameKey = `#attr${index}`;
        const valueKey = `:val${index}`;
        ExpressionAttributeNames[nameKey] = key;
        ExpressionAttributeValues[valueKey] = value;
        expressionParts.push(`${nameKey} = if_not_exists(${nameKey}, ${valueKey})`);
    });

    return {
        UpdateExpression: `SET ${expressionParts.join(", ")}`,
        ExpressionAttributeNames,
        ExpressionAttributeValues,
    };
};

const backfill = async (attributes = DEFAULT_ATTRIBUTES) => {
    if (!attributes || Object.keys(attributes).length === 0) {
        throw new Error("Provide at least one attribute to backfill.");
    }

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
            if (!deviceId || typeof timestamp === "undefined") {
                continue;
            }

            const updateParts = buildUpdate(attributes);
            await docClient.send(
                new UpdateCommand({
                    TableName: TABLE,
                    Key: { deviceId, timestamp },
                    ...updateParts,
                })
            );
            updatedCount += 1;
        }

        lastEvaluatedKey = scanResult.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return updatedCount;
};

backfill()
    .then((count) => {
        console.log(`Backfill complete. Updated ${count} items.`);
    })
    .catch((err) => {
        console.error("Backfill failed:", err);
        process.exitCode = 1;
    });
