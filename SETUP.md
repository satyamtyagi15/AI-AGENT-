# Smart Multi-Agent System for YouTube Video Automation

## 📋 Prerequisites

- Node.js 18+
- Docker & Docker Compose
- FFmpeg
- API Keys: OpenAI, YouTube, ElevenLabs, etc.

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/satyamtyagi15/AI-AGENT-.git
cd AI-AGENT-
```

### 2. Setup Environment
```bash
cp .env.example .env
# Edit .env with your API keys
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start with Docker Compose
```bash
docker-compose up -d
```

### 5. Access Services
- **API**: http://localhost:3001
- **Realtime**: ws://localhost:3002
- **MongoDB**: mongodb://localhost:27017
- **Redis**: redis://localhost:6379
- **Kibana Logs**: http://localhost:5601
- **Prometheus Metrics**: http://localhost:9090

## 🎬 Generate a Video

### Using API
```bash
curl -X POST http://localhost:3001/generate-video \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "AI in 2024",
    "style": "educational",
    "keywords": ["AI", "technology", "future"]
  }'
```

### Response
```json
{
  "success": true,
  "workflow": {
    "id": "workflow_1718042400000",
    "name": "Video Generation: AI in 2024",
    "status": "completed",
    "tasks": [
      {
        "id": "research",
        "status": "completed",
        "result": { ... }
      },
      ...
    ]
  }
}
```

## 🏗️ Architecture

### Core Components
- **Orchestrator Agent**: Manages workflow execution
- **Specialized Agents**: Content, Script, Voice, Video, Upload, Analytics
- **Message Queue**: Bull/Redis for task distribution
- **Real-time Server**: WebSocket for live updates
- **Memory Manager**: Short-term (Redis) + Long-term (MongoDB)

### Workflow Pipeline
1. **Research** → Gather topic info
2. **Script Generation** → Create engaging script
3. **Voice-Over** → Convert to audio
4. **Video Assembly** → Combine audio + visuals
5. **Upload** → Publish to YouTube
6. **Analytics** → Monitor performance

## 📡 API Endpoints

### Workflows
- `POST /workflows` - Create workflow
- `POST /workflows/:id/tasks` - Add task
- `POST /workflows/:id/execute` - Execute workflow
- `GET /workflows/:id` - Get status
- `GET /workflows` - List all

### Generation
- `POST /generate-video` - Auto-generate complete video

### Monitoring
- `GET /health` - Health check
- `GET /events` - Event log

## 🔧 Configuration

Edit `.env` for:
- API Keys (OpenAI, YouTube, ElevenLabs)
- Database URLs (MongoDB, Redis)
- Video quality settings
- Publishing schedules
- Timeouts and retries

## 📊 Monitoring

### Logs
```bash
# View real-time logs
docker-compose logs -f api

# Kibana dashboard
open http://localhost:5601
```

### Metrics
```bash
# Prometheus metrics
open http://localhost:9090
```

## 🐛 Troubleshooting

### MongoDB connection error
```bash
docker-compose restart mongo
```

### Redis timeout
```bash
docker-compose logs redis
```

### API not responding
```bash
docker-compose logs api
```

## 🚀 Scaling

### Horizontal Scaling
```bash
# Scale API instances
docker-compose up -d --scale api=3
```

### Kubernetes Deployment
```bash
kubectl apply -f k8s/
```

## 📝 Development

### Install Dev Dependencies
```bash
npm install --save-dev
```

### Run in Development
```bash
npm run dev
```

### Build TypeScript
```bash
npm run build
```

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

## 📚 Documentation

- [Agent Development Guide](./docs/AGENTS.md)
- [API Reference](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Configuration Reference](./docs/CONFIG.md)

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 License

MIT License

## 🙋 Support

For issues and questions, open a GitHub issue or contact the team.
