import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";

const REGION = process.env.AWS_REGION || "us-east-1";
const USERS_TABLE = process.env.USERS_TABLE || "Users";

const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

export const UserModel = {


    async create({ username, email, password }) {
        if (!username || !email || !password) {
            throw new Error("username, email, and password are required");
        }
        
        const passwordHash = await bcrypt.hash(password, 12);
        const now = new Date().toISOString();
        const user = {
            userid: crypto.randomUUID(),
            username,
            email,
            passwordHash,
            createdAt: now,
            updatedAt: now,

        };

        await docClient.send(
            new PutCommand({
                TableName: USERS_TABLE,
                Item: user,
                ConditionExpression: "attribute_not_exists(userId)",
            })
        );

        return user;
    },

    async findById(userId) {
        if (!userId) {
            throw new Error("userId is required");
        }

        const result = await docClient.send(
            new GetCommand({
                TableName: USERS_TABLE,
                Key: { userId },
            })
        );

        return result.Item || null;
    },
};
