# ER Triage Management System - Setup Guide

## Prerequisites

- Node.js 18+ and npm 9+
- Python 3.11+
- Docker and Docker Compose (optional, for containerized deployment)
- PostgreSQL 15+
- Redis 7+

## Quick Start with Docker

1. **Clone and navigate to the project:**
   ```bash
   cd er-triage-system
   ```

2. **Set up environment variables:**
   ```bash
   cp backend/.env.example backend/.env
   cp ai-service/.env.example ai-service/.env
   ```
   
   Edit the `.env` files with your configuration.

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **Initialize the database:**
   ```bash
   docker-compose exec postgres psql -U postgres -d er_triage -f /path/to/migrations/001_initial_schema.sql
   ```

5. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - AI Service: http://localhost:8000

## Manual Setup

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database and Redis credentials
   ```

4. **Run database migrations:**
   ```bash
   psql -U postgres -d er_triage -f migrations/001_initial_schema.sql
   ```

5. **Start the server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

### AI Service Setup

1. **Navigate to ai-service directory:**
   ```bash
   cd ai-service
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment:**
   ```bash
   cp .env.example .env
   ```

5. **Start the service:**
   ```bash
   uvicorn src.main:app --host 0.0.0.0 --port 8000
   ```

## Database Setup

1. **Create PostgreSQL database:**
   ```sql
   CREATE DATABASE er_triage;
   ```

2. **Run migrations:**
   ```bash
   psql -U postgres -d er_triage -f backend/migrations/001_initial_schema.sql
   ```

3. **Create initial admin user (optional):**
   ```sql
   INSERT INTO users (email, password_hash, name, role, created_at)
   VALUES ('admin@hospital.com', '$2a$12$...', 'Admin User', 'admin', NOW());
   ```
   (Use bcrypt to hash password)

## Configuration

### Backend Environment Variables

- `DB_HOST`: PostgreSQL host
- `DB_PORT`: PostgreSQL port
- `DB_NAME`: Database name
- `DB_USER`: Database user
- `DB_PASSWORD`: Database password
- `REDIS_URL`: Redis connection URL
- `JWT_SECRET`: Secret key for JWT tokens
- `AI_SERVICE_URL`: URL of the AI service

### Frontend Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API URL
- `NEXT_PUBLIC_WS_URL`: WebSocket URL for real-time updates

## Production Deployment

1. **Build all services:**
   ```bash
   npm run build  # In root directory
   cd backend && npm run build
   cd ../frontend && npm run build
   ```

2. **Use Docker Compose for production:**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

3. **Set up reverse proxy (nginx):**
   - Configure nginx to proxy requests to frontend and backend
   - Set up SSL certificates

4. **Configure monitoring:**
   - Set up logging aggregation
   - Configure health checks
   - Set up alerting

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check connection credentials in `.env`
- Ensure database exists

### Redis Connection Issues
- Verify Redis is running
- Check Redis URL in `.env`

### AI Service Issues
- Check if Python dependencies are installed
- Verify model files are in the correct location
- Check service logs for errors

## Support

For issues and questions, please refer to the documentation or contact the development team.

