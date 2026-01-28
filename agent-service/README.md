# Python Apply Service

Lightweight gRPC service that refines resumes using LangChain and local Ollama LLM. Kept outside the deprecated Job-Swipe-Match module for reuse.

## Contents
- `apply_service.proto` — Apply RPC definition
- `agent_server.py` — gRPC server wiring
- `chains.py` — prompt rendering and LLM logic
- `templates/resume_prompt.jinja2` — default prompt template
- `Dockerfile` — Container definition for agent service
- `docker-compose.yml` — Orchestration for Ollama + agent service

## Setup with Docker (Recommended)

### Prerequisites
- Docker and Docker Compose installed
- 8GB+ RAM available
- 10GB+ disk space for models

### Quick Start

1. **Start services**
   ```bash
   cd agent-service
   docker-compose up -d
   ```

2. **Download AI model** (one-time, ~4GB)
   ```bash
   docker exec ollama ollama pull llama3.2
   ```

3. **Verify services**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

4. **Test gRPC endpoint**
   ```bash
   # Should show gRPC error (expected - means service is running)
   curl http://localhost:50051
   ```

### Model Options

Choose based on your needs:

| Model | Size | Speed | Quality | RAM Required |
|-------|------|-------|---------|--------------|
| `llama3.2:3b` | 2GB | Fast | Good | 4GB |
| `llama3.2` (default) | 4GB | Medium | Better | 6GB |
| `llama3.1:8b` | 8GB | Slow | Best | 10GB |
| `mistral` | 4GB | Medium | Better | 6GB |

**To change model:**
```bash
# Edit docker-compose.yml:
environment:
  - OLLAMA_MODEL=llama3.1:8b

# Restart services
docker-compose restart agent-service

# Pull new model
docker exec ollama ollama pull llama3.1:8b
```

## Setup without Docker (Local Development)

### Prerequisites
- Python 3.11+
- Ollama installed locally

### Steps

1. **Install Ollama**
   ```bash
   curl -fsSL https://ollama.com/install.sh | sh
   ```

2. **Pull model**
   ```bash
   ollama pull llama3.2
   ```

3. **Setup Python environment**
   ```bash
   cd agent-service
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. **Set environment variables**
   ```bash
   export OLLAMA_BASE_URL=http://localhost:11434
   export OLLAMA_MODEL=llama3.2
   ```

5. **Run server**
   ```bash
   python agent_server.py
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_BASE_URL` | Ollama API endpoint | `http://localhost:11434` |
| `OLLAMA_MODEL` | Model name | `llama3.2` |
| `PROMPT_TEMPLATE_PATH` | Custom prompt template | `templates/resume_prompt.jinja2` |

### Removed (No longer needed)
- ~~`OPENAI_API_KEY`~~
- ~~`OPENAI_MODEL`~~

## Troubleshooting

### "Connection refused" error
- **Cause**: Ollama not running
- **Fix**:
  ```bash
  docker-compose ps  # Check if ollama container is up
  curl http://localhost:11434/api/tags  # Test Ollama API
  ```

### "Model not found" error
- **Cause**: Model not downloaded
- **Fix**:
  ```bash
  docker exec ollama ollama pull llama3.2
  ```

### Slow first request (30+ seconds)
- **Cause**: Model loading into memory
- **Expected behavior**: Subsequent requests are faster (1-5 seconds)

### "Out of memory" error
- **Cause**: Insufficient RAM for model
- **Fix**: Use smaller model or increase Docker memory limit
  ```yaml
  # In docker-compose.yml:
  services:
    ollama:
      deploy:
        resources:
          limits:
            memory: 8G
  ```

## Performance Notes

- **Cold start**: 5-30 seconds (model loading)
- **Warm requests**: 1-5 seconds (depending on model size)
- **Memory usage**: 2-8GB for Ollama (depending on model)
- **First request**: May take longer as model loads into RAM

## Production Deployment

### Resource Requirements
- **Minimum**: 8GB RAM, 4 CPU cores, 20GB disk
- **Recommended**: 16GB RAM, 8 CPU cores, 50GB disk

### Security Considerations
- Run containers as non-root user
- Use Docker secrets for sensitive environment variables
- Enable TLS for gRPC in production
- Restrict network access to port 50051

### Monitoring
```yaml
# Add to docker-compose.yml for logging:
services:
  agent-service:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## Development

### Regenerate gRPC stubs
```bash
python -m grpc_tools.protoc -I. \
  --python_out=. --grpc_python_out=. \
  apply_service.proto
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
docker-compose logs -f agent-service
docker-compose logs -f ollama
```

### Restart services
```bash
docker-compose restart
```
