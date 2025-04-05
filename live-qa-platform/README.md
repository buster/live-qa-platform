# Live Q&A Platform

A real-time platform for interactive Q&A sessions during presentations. Allows audience members to submit questions, vote on questions, and presenters to manage and respond to questions.

## Features

- **Real-time interaction** via WebSockets
- **Session management** for creating and joining Q&A sessions
- **Question submission** with support for text, images, and links
- **Voting system** for prioritizing questions
- **Presenter view** with sorting and filtering options
- **Mobile-optimized** participant interface
- **Offline support** for unstable connections

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- Socket.io for real-time communication
- MongoDB for data storage
- JWT for authentication

### Frontend
- React with TypeScript
- Redux for state management
- Material-UI for components
- Socket.io client for WebSocket connection
- Responsive design for all devices

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Docker and Docker Compose (optional, for containerized setup)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/live-qa-platform.git
cd live-qa-platform
```

2. Install dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your configuration

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your configuration
```

### Running the application

#### Without Docker

1. Start the backend
```bash
cd backend
npm run dev
```

2. Start the frontend (in a new terminal)
```bash
cd frontend
npm start
```

3. Access the application at http://localhost:3000

#### With Docker

1. Start all services
```bash
docker-compose up
```

2. Access the application at http://localhost:3000

## Project Structure

```
live-qa-platform/
├── backend/                # Backend code
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Request handlers
│   │   ├── middlewares/    # Express middlewares
│   │   ├── models/         # Mongoose models
│   │   ├── repositories/   # Data access layer
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   ├── websocket/      # Socket.io handlers
│   │   └── index.ts        # Entry point
│   ├── .env.example        # Example environment variables
│   ├── package.json        # Backend dependencies
│   └── tsconfig.json       # TypeScript configuration
├── frontend/               # Frontend code
│   ├── src/
│   │   ├── assets/         # Static assets
│   │   ├── components/     # Reusable components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API and socket services
│   │   ├── store/          # Redux store and slices
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   ├── App.tsx         # Main App component
│   │   ├── index.tsx       # Entry point
│   │   └── theme.ts        # Material-UI theme
│   ├── .env.example        # Example environment variables
│   ├── package.json        # Frontend dependencies
│   └── tsconfig.json       # TypeScript configuration
├── docker-compose.yml      # Docker Compose configuration
└── README.md               # Project documentation
```

## Development

### Backend API Endpoints

- `POST /api/sessions` - Create a new session
- `GET /api/sessions/:id` - Get session details
- `DELETE /api/sessions/:id` - End a session
- `POST /api/questions` - Create a new question
- `PATCH /api/questions/:id/answered` - Mark a question as answered
- `POST /api/questions/:id/vote` - Vote on a question
- `POST /api/media/upload` - Upload media for a question

### WebSocket Events

- `join:session` - Join a session room
- `submit:question` - Submit a new question
- `submit:vote` - Submit a vote for a question
- `mark:answered` - Mark a question as answered
- `question:new` - New question notification
- `question:updated` - Question updated notification
- `question:deleted` - Question deleted notification
- `vote:updated` - Vote count updated notification

## License

This project is licensed under the MIT License - see the LICENSE file for details.
