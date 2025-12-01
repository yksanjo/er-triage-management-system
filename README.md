# Enterprise ER Triage Management & Health Monitor System

An enterprise-ready Hospital ER and Care Center triage management system with AI-powered vital signs detection and real-time health monitoring.

## Features

- **Video-Based Triage**: Capture patient video and extract vital signs automatically
- **AI-Powered Analysis**: Multi-modal analysis using video, audio, and text inputs
- **Real-Time Monitoring**: Live dashboard for healthcare providers
- **Triage Workflow**: Automated triage assessment based on Japanese Emergency Medicine guidelines
- **Patient Management**: Comprehensive patient records and history
- **Mobile-First**: Smartphone-based interface for easy deployment
- **Enterprise Security**: HIPAA-compliant with audit logging
- **Scalable Architecture**: Microservices-ready design

## Tech Stack

### Backend
- Node.js + Express / Python FastAPI
- PostgreSQL for primary data
- Redis for caching and real-time features
- WebSocket for live updates

### Frontend
- React/Next.js for web dashboard
- React Native for mobile app
- Real-time monitoring with WebSocket

### AI/ML
- Video processing for vital signs detection
- Multi-modal AI analysis (video + text + audio)
- Triage decision engine

## Project Structure

```
er-triage-system/
├── backend/          # Backend API services
├── frontend/         # Web dashboard
├── mobile/           # Mobile app
├── ai-service/       # AI/ML services
├── shared/           # Shared types and utilities
└── docs/             # Documentation
```

## Getting Started

See individual service READMEs for setup instructions.

## License

Proprietary - Enterprise License

