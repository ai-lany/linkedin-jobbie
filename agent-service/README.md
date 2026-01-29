# Python Apply Service

Lightweight gRPC service that provides AI-powered job application assistance using LangChain and local Ollama LLM.

## Features

- **Resume Tailoring**: Customizes resume for specific job descriptions
- **Cover Letter Generation**: Creates personalized cover letters
- **Question Answering**: Automatically answers application questions
- **Orchestrator**: Sequences all 3 chains for complete auto-apply

## Contents
- `apply_service.proto` — gRPC service definition (Apply, GenerateCoverLetter, AnswerQuestions, AutoApply)
- `agent_server.py` — gRPC server implementation
- `chains/` — AI chain implementations
  - `orchestrator_chain.py` — Main orchestrator for auto-apply
  - `resume_chain.py` — Resume tailoring
  - `cover_letter_chain.py` — Cover letter generation
  - `question_answering_chain.py` — Question answering
  - `common.py` — Shared utilities and LLM interface
- `templates/` — Jinja2 prompt templates
  - `resume_prompt.jinja2` — Resume tailoring prompt
  - `cover_letter_prompt.jinja2` — Cover letter prompt
  - `question_answering_prompt.jinja2` — Question answering prompt
- `Dockerfile` — Container definition
- `docker-compose.yml` — Orchestration for Ollama + agent service

## gRPC Service Definition

### Available RPCs

1. **Apply** - Legacy: Resume tailoring only
2. **GenerateCoverLetter** - Generate cover letter for a job
3. **AnswerQuestions** - Answer application questions
4. **AutoApply** (recommended) - Orchestrates all three chains:
   - Resume tailoring
   - Cover letter generation
   - Question answering (if questions provided)

### AutoApply RPC

**Request**:
```protobuf
message AutoApplyRequest {
  Job job = 1;
  Profile profile = 2;
  repeated Question questions = 3;  // Optional
}
```

**Response**:
```protobuf
message AutoApplyResponse {
  bool success = 1;
  string message = 2;
  string refined_resume = 3;
  string cover_letter = 4;
  repeated Answer answers = 5;
  string application_id = 6;
}
```

**Processing Flow**:
```
AutoApply RPC called
    ↓
Step 1: Resume Chain (~4s)
    ↓
Step 2: Cover Letter Chain (~4s)
    ↓
Step 3: Question Answering Chain (~4s, if questions provided)
    ↓
Return all results in one response
```

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

2. **Download AI model** (one-time, ~2GB for fast model)
   ```bash
   # Recommended: Fast model (2GB, ~4s per request)
   docker exec ollama ollama pull llama3.2:3b

   # Alternative: Standard model (4GB, ~6s per request)
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

| Model | Size | Speed | Quality | RAM Required | Best For |
|-------|------|-------|---------|--------------|----------|
| `llama3.2:3b` ⭐ (default) | 2GB | Fast (~4s) | Good | 4GB | Production, fast auto-apply |
| `llama3.2` | 4GB | Medium (~6s) | Better | 6GB | Better quality, slower |
| `llama3.1:8b` | 8GB | Slow (~10s) | Best | 10GB | Highest quality |
| `mistral` | 4GB | Medium (~6s) | Better | 6GB | Alternative option |

⭐ **Recommended**: `llama3.2:3b` provides the best balance of speed and quality for auto-apply.

**To change model:**
```bash
# Edit docker-compose.yml:
environment:
  - OLLAMA_MODEL=llama3.1:8b  # Change this line

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

## Orchestrator Chain

The orchestrator (`chains/orchestrator_chain.py`) sequences multiple AI chains for complete application processing.

### Chain Execution

```python
from chains.orchestrator_chain import run_orchestrator_chain

result = run_orchestrator_chain(
    job_obj=job,          # Job details
    profile_obj=profile,  # User profile
    questions=[...]       # Optional questions
)

# Returns:
# {
#   "success": True,
#   "refined_resume": "...",
#   "cover_letter": "...",
#   "answers": [{"question": "...", "answer": "..."}],
#   "message": "Application completed successfully"
# }
```

### Processing Steps

1. **Resume Tailoring** (~4s)
   - Analyzes job description
   - Highlights relevant skills from user's profile
   - Generates tailored summary

2. **Cover Letter Generation** (~4s)
   - Creates personalized cover letter
   - References specific job requirements
   - Maintains professional tone

3. **Question Answering** (~4s, conditional)
   - Only runs if questions provided
   - Generates contextual answers based on job and profile
   - Returns JSON array of question-answer pairs

### Error Handling

All chains have fallback/mock responses if Ollama is unavailable:
- Logs error to console
- Returns mock response (prefixed with `[mock-*]`)
- Allows application to continue despite LLM failure

## Performance Notes

**With llama3.2:3b (recommended)**:
- **Cold start**: 3-5 seconds (model loading)
- **Warm requests**: ~4 seconds per chain
- **Full orchestrator**: ~15-20 seconds (all 3 chains)
- **Memory usage**: ~4GB RAM

**With llama3.2 (standard)**:
- **Warm requests**: ~6 seconds per chain
- **Full orchestrator**: ~20-25 seconds

**First request**: May take longer as model loads into RAM

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
