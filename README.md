# 🤖 Smart Multi-Agent System for YouTube Video Automation

A comprehensive, production-ready multi-agent system that automates everything from video content generation to YouTube publishing.

## 🎯 Features

- **LLM-Based Agent Architecture**: Powered by OpenAI GPT-4, Claude, or Gemini
- **Real-time Agent Communication**: WebSocket-based message queues with Redis
- **Persistent State & Memory**: MongoDB for long-term memory, Redis for short-term
- **External API Integration**: YouTube, OpenAI, Stability AI, D-ID, Pexels, etc.
- **Horizontal Scalability**: Docker Compose + Kubernetes ready
- **Video Generation Pipeline**: Script → Voiceover → Video Assembly → Upload
- **Content Orchestration**: Hierarchical agent coordination
- **Monitoring & Logging**: Real-time dashboards with Winston & ELK

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│         Master Orchestrator Agent                       │
│  (Workflow Coordination & Resource Management)          │
└──────────────────┬──────────────────────────────────────┘
        ┌──────────┼──────────┬──────────┬─────────────┐
        │          │          │          │             │
    ┌───▼──┐  ┌───▼──┐  ┌───▼──┐  ┌───▼──┐  ┌───▼──┐
    │Content│  │Script│  │Voice │  │Video │  │Upload│
    │Agent  │  │Agent │  │Agent │  │Agent │  │Agent │
    └───────┘  └───────┘  └───────┘  └───────┘  └───────┘
        │          │          │          │             │
        └──────────┼──────────┼──────────┼─────────────┘
                   │
        ┌──────────▼──────────┐
        │  Message Queue      │
        │  (Redis/RabbitMQ)   │
        └─────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  Persistent Storage │
        │  MongoDB + Redis    │
        └─────────────────────┘
```

## 📦 Tech Stack

- **Frontend**: React + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **AI/ML**: Python (FastAPI) microservices
- **Message Queue**: Redis + Bull
- **Database**: MongoDB + Redis
- **Video Processing**: FFmpeg, MoviePy
- **LLM**: OpenAI GPT-4, Claude, Gemini
- **TTS**: ElevenLabs, Google Cloud TTS
- **Video Generation**: D-ID, Synthesia
- **Containerization**: Docker + Docker Compose
- **Monitoring**: Winston, Morgan, Prometheus

## 🚀 Quick Start

```bash
# 1. Clone and setup
git clone https://github.com/satyamtyagi15/AI-AGENT-.git
cd AI-AGENT-

# 2. Install dependencies
npm install
cd services && pip install -r requirements.txt && cd ..

# 3. Setup environment
cp .env.example .env
# Edit .env with your API keys

# 4. Start with Docker Compose
docker-compose up -d

# 5. Access dashboards
# - Main App: http://localhost:3000
# - API Docs: http://localhost:3001/api/docs
# - Monitoring: http://localhost:9090
```

## 📋 Core Agents

### 1. **Master Orchestrator Agent**
   - Coordinates all workflows
   - Manages resource allocation
   - Handles error recovery
   - Schedules video publishing

### 2. **Content Research Agent**
   - Researches trending topics
   - Analyzes competitors
   - Gathers data from APIs
   - Generates content ideas

### 3. **Script Generation Agent**
   - Creates engaging scripts
   - Optimizes for SEO
   - Generates hooks and CTAs
   - Maintains brand voice

### 4. **Voice-Over Agent**
   - Converts scripts to audio
   - Multiple voice options
   - Emotion/tone control
   - Audio post-processing

### 5. **Video Assembly Agent**
   - Combines visuals + audio
   - Adds subtitles & graphics
   - Applies effects/transitions
   - Quality assurance

### 6. **Upload & Distribution Agent**
   - Uploads to YouTube
   - Manages metadata/tags
   - Schedules publishing
   - Social media integration

### 7. **Analytics Agent**
   - Monitors video performance
   - Collects viewer metrics
   - Generates reports
   - Recommends optimizations

## 🔗 Real-time Communication

- **WebSocket Server**: Bi-directional real-time updates
- **Message Queue**: Redis Bull for task distribution
- **Event System**: Pub/Sub for agent coordination
- **Status Tracking**: Live progress updates

## 💾 Persistent Memory System

- **Short-term**: Redis (session state, cache)
- **Long-term**: MongoDB (agent memory, history)
- **Vector DB**: Pinecone (semantic search)

## 🔌 External API Integrations

- **YouTube API v3**: Channel management, uploads, analytics
- **OpenAI**: GPT-4 for content generation
- **ElevenLabs**: High-quality TTS
- **D-ID**: Avatar video generation
- **Stability AI**: Image generation
- **Pexels/Unsplash**: Stock footage/images
- **Twitter/LinkedIn**: Social distribution

## 📊 Monitoring & Logging

- Prometheus metrics
- ELK Stack for logs
- Real-time dashboards
- Agent performance tracking
- Resource utilization monitoring

## 🛠️ Configuration

See `.env.example` for all configuration options:
- API Keys
- Database URLs
- Queue settings
- Video quality profiles
- Publishing schedules

## 📚 Documentation

- [Agent Development Guide](./docs/AGENTS.md)
- [API Documentation](./docs/API.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Configuration Reference](./docs/CONFIG.md)

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 License

MIT License - See [LICENSE](./LICENSE)

---

**Built with ❤️ for content creators and automation enthusiasts**
