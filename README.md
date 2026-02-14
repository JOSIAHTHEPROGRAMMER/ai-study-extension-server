# AI Study Helper - Backend Server

Backend API server for the AI Study Helper Chrome extension. Handles user authentication, AI content generation via Groq API, and study history management.

## Features

- User authentication with JWT
- AI-powered content generation (explanations, summaries, flashcards)
- Study history tracking and management
- Rate limiting and security middleware
- MongoDB database integration
- RESTful API architecture

## Prerequisites

- Node.js 16+
- MongoDB (local or Atlas)
- Groq API Key ([Get one here](https://console.groq.com/keys))

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/JOSIAHTHEPROGRAMMER/ai-study-extension-server.git
cd ai-study-extension-server
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/study-helper

# JWT Secret (use a strong, random string)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long

# Groq API
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxx

# CORS (optional)
ALLOWED_ORIGINS=chrome-extension://your-extension-id,http://localhost:3000
```

### 4. Start the Server

```bash
# Development
npm run dev

# Production
npm start
```

The server will run on `http://localhost:3000`

## Project Structure

```
├── configs/
│   ├── database.js         # MongoDB connection
│   └── openai.js           # Groq API client configuration
├── controllers/
│   ├── groq.controller.js  # AI request handling
│   ├── history.controller.js # History management
│   └── user.controller.js  # User authentication
├── middleware/
│   ├── auth.js             # JWT authentication
│   └── rateLimiter.js      # Rate limiting
├── models/
│   ├── History.js          # History schema
│   └── User.js             # User schema
├── routes/
│   ├── groq.routes.js      # AI endpoints
│   ├── history.routes.js   # History endpoints
│   └── user.routes.js      # Auth endpoints
├── .gitignore
├── package.json
└── server.js               # Entry point
```

## API Endpoints

### Authentication

#### Register
```http
POST /api/user/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Login
```http
POST /api/user/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get User Profile
```http
GET /api/user/me
Authorization: Bearer <token>
```

### AI Content Generation

#### Generate AI Content
```http
POST /api/groq/request
Authorization: Bearer <token>
Content-Type: application/json

{
  "systemPrompt": "You are a helpful assistant...",
  "userText": "Text to process"
}
```

#### Get Usage Stats
```http
GET /api/groq/usage
Authorization: Bearer <token>
```

### History Management

#### Save to History
```http
POST /api/history
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "explain",
  "inputText": "Original text",
  "result": "AI generated content",
  "url": "https://example.com"
}
```

#### Get History
```http
GET /api/history?type=explain
Authorization: Bearer <token>
```

#### Get History Stats
```http
GET /api/history/stats
Authorization: Bearer <token>
```

#### Delete History Item
```http
DELETE /api/history/:id
Authorization: Bearer <token>
```

#### Clear All History
```http
DELETE /api/history/clear
Authorization: Bearer <token>
```

## Configuration

### Database

MongoDB connection is configured in `configs/database.js`. Update `MONGODB_URI` in `.env` for your database:

```env
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/study-helper

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/study-helper
```

### Groq API

The server uses OpenAI SDK to connect to Groq's API. Configuration in `configs/openai.js`:

```javascript
const ai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
})
```

### Rate Limiting

Default rate limits (configurable in `middleware/rateLimiter.js`):

- General API: 100 requests per 15 minutes
- Groq AI: 10 requests per minute
- Auth: 5 login attempts per 15 minutes

### User Limits

Default daily limits per user:

- AI requests: 100 per day
- Automatic reset every 24 hours

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on all endpoints
- CORS protection
- Helmet security headers
- Input validation
- MongoDB injection prevention

## Database Models

### User Model

```javascript
{
  email: String (unique, required),
  password: String (hashed, required),
  apiUsage: {
    requestCount: Number,
    dailyLimit: Number,
    lastReset: Date
  },
  createdAt: Date
}
```

### History Model

```javascript
{
  userId: ObjectId (ref: User),
  type: String (explain | summarize | flashcards),
  inputText: String,
  result: String,
  url: String,
  createdAt: Date
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message here"
}
```

Common HTTP status codes:

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Server Error

## Development

### Running in Development Mode

```bash
npm run dev
```

Uses nodemon for automatic server restart on file changes.

### Environment Variables

Required variables:

- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT signing
- `GROQ_API_KEY` - Groq API key

Optional variables:

- `NODE_ENV` - Environment (development/production)
- `ALLOWED_ORIGINS` - CORS allowed origins

### Testing the API

Use tools like Postman, Insomnia, or curl:

```bash
# Test health endpoint
curl http://localhost:3000/health

# Test login
curl -X POST http://localhost:3000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

## Deployment

### Preparing for Production

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET`
3. Configure MongoDB Atlas connection
4. Update `ALLOWED_ORIGINS` with your extension ID
5. Enable SSL/TLS
6. Set up process manager (PM2)

### Deploy to Heroku

```bash
heroku create your-app-name
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set GROQ_API_KEY=your-groq-key
git push heroku main
```

### Deploy to Railway

1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically on push

### Deploy with PM2

```bash
npm install -g pm2
pm2 start server.js --name "study-helper-api"
pm2 save
pm2 startup
```

## Monitoring

### Check Server Status

```bash
# Using PM2
pm2 status
pm2 logs study-helper-api

# Check MongoDB connection
mongosh
use study-helper
db.users.countDocuments()
```

### API Health Check

```http
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Troubleshooting

### Cannot Connect to MongoDB
- Verify MongoDB is running: `mongod --version`
- Check `MONGODB_URI` in `.env`
- Ensure network access for MongoDB Atlas

### Groq API Errors
- Verify `GROQ_API_KEY` is valid
- Check API rate limits
- Review Groq console for quota

### CORS Issues
- Add extension ID to `ALLOWED_ORIGINS`
- Verify CORS middleware configuration
- Check browser console for specific errors

### Authentication Failures
- Verify `JWT_SECRET` is set
- Check token expiration (default: 7 days)
- Ensure middleware order in routes

## Scripts

```json
{
  "start": "node server.js",
  "dev": "nodemon server.js"
}
```

## Dependencies

Main dependencies:

- `express` - Web framework
- `mongoose` - MongoDB ODM
- `jsonwebtoken` - JWT authentication
- `bcryptjs` - Password hashing
- `openai` - Groq API client
- `cors` - CORS middleware
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `dotenv` - Environment configuration

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## Support

For issues, questions, or contributions, please open an issue on GitHub.

## Related Repositories

- [Chrome Extension Frontend](https://github.com/JOSIAHTHEPROGRAMMER/AI-Study-Helper)

## Acknowledgments

- Built with Express.js and MongoDB
- AI powered by Groq API
- Authentication with JWT
