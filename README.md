# AWS Bracelet Tracker

A Node.js backend for tracking user health data from IoT bracelets using DynamoDB. Includes user management, password hashing, and flexible device-to-user linking.

## Features
- User registration with password hashing (bcryptjs)
- Bracelet readings storage in DynamoDB
- Link readings to users by userId, deviceId, or email
- Backfill scripts for updating existing data
- Ready for AWS Lambda deployment

## Project Structure
- `user.js` — User model for DynamoDB (create, findById, password hashing)
- `braceletReading.js` — Bracelet reading model for DynamoDB (create, findById, listAll, flexible attributes)
- `backfill-bracelet-readings.js` — Script to add new fields to all bracelet readings
- `backfill-userid-to-readings.js` — Script to link readings to users by deviceId
- `index.js` — Example Lambda handler for DynamoDB

## Setup
1. Install dependencies:
   ```sh
   npm install
   ```
2. Set environment variables as needed:
   - `AWS_REGION` (default: us-east-1)
   - `USERS_TABLE` (default: Users)
   - `BRACELET_READINGS_TABLE` (default: BraceletReadings)

## Usage
### Creating a User
```js
import { UserModel } from "./user.js";
const user = await UserModel.create({
  username: "john_doe",
  email: "john@example.com",
  password: "supersecretpassword"
});
```

### Creating a Bracelet Reading Linked to a User
```js
import { BraceletReadingModel } from "./braceletReading.js";
const reading = await BraceletReadingModel.create({
  userId: user.userId, // or email/deviceId
  deviceId: "bracelet-001",
  heartRate: 80,
  timestamp: Date.now(),
  attributes: { activity: "running" }
});
```

### Backfilling Data
- To add new fields to all readings:
  ```sh
  node backfill-bracelet-readings.js
  ```
- To link readings to users by deviceId:
  Edit `DEVICE_USER_MAP` in `backfill-userid-to-readings.js` and run:
  ```sh
  node backfill-userid-to-readings.js
  ```

## Deployment
- Code is ready for AWS Lambda (see `index.js` for handler example)
- Push to GitHub and connect to your CI/CD or Lambda deployment pipeline

## License
MIT
