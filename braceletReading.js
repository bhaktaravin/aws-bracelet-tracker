import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
    DynamoDBDocumentClient,
    PutCommand,
    GetCommand,
    ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import crypto from "node:crypto";

const REGION = process.env.AWS_REGION || "us-east-1";
const BRACELET_READINGS_TABLE =
    process.env.BRACELET_READINGS_TABLE || "BraceletReadings";

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const BraceletReadingModel = {
    async create({ userId, deviceId, email, heartRate, timestamp, attributes = {} }) {
        const hasUserId = Boolean(userId);
        const hasDeviceId = Boolean(deviceId);
        const hasEmail = Boolean(email);
  
        if (!hasUserId && !hasDeviceId && !hasEmail) {
            throw new Error("userId, deviceId, or email is required");
        }

        if (typeof heartRate !== "number") {
            throw new Error("heartRate must be a number");
        }

        const nowIso = new Date().toISOString();
        const resolvedTimestamp =
            typeof timestamp === "number" || typeof timestamp === "string"
                ? timestamp
                : nowIso;
        const reading = {
            readingId: crypto.randomUUID(),
            userId: userId || null,
            deviceId: deviceId || null,
            email: email || null,
            heartRate,
            timestamp: resolvedTimestamp,
            createdAt: nowIso,
            ...attributes,
        };

        await docClient.send(
            new PutCommand({
                TableName: BRACELET_READINGS_TABLE,
                Item: reading,
                ConditionExpression: "attribute_not_exists(readingId)",
            })
        );

        return reading;
    },

    async findById(readingId) {
        if (!readingId) {
            throw new Error("readingId is required");
        }

        const result = await docClient.send(
            new GetCommand({
                TableName: BRACELET_READINGS_TABLE,
                Key: { readingId },
            })
        );

        return result.Item || null;
    },

    async listAll() {
        const result = await docClient.send(
            new ScanCommand({
                TableName: BRACELET_READINGS_TABLE,
            })
        );

        return result.Items || [];
    },
};
