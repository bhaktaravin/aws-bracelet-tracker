// Getting All Items From DynamoDB Table

import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { BraceletReadingModel } from "./braceletReading.js";
import { UserModel } from "./user.js";

const Region="us-east-1"; // Replace with your AWS region
const TableName="BraceletReadings"; // Replace with your DynamoDB table name

const dbClient = new DynamoDBClient({ region: Region });

export const handler = async (event) => {
    try {
        const params = {
            TableName: TableName,
        };

        const command = new ScanCommand(params);
        const data = await dbClient.send(command);

        return {
            statusCode: 200,
            body: JSON.stringify(data.Items),
        };
    } catch (err) {
        console.error("Error", err);
        return {

            statusCode: 500,
            body: JSON.stringify({ error: "Could not retrieve items" }),
        };
    }

};


// Test Locally

const user = await UserModel.create({
  username: "john_doe",
  email: "john@example.com",
  password: "supersecretpassword"
});

const newReading = await BraceletReadingModel.create({
  userId: user.userId,         // tie to user by userId
  deviceId: "bracelet-001",
  heartRate: 78,
  timestamp: Date.now(),       // or any timestamp
  attributes: {
    // any extra fields you want
    activity: "walking"
  }
});

console.log("Created reading:", newReading);

console.log("Created User:", user);