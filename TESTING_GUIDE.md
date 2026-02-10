# Contextify Backend Testing Guide

This guide will help you test the integrated Contextify backend with RLM scanning.

## Prerequisites

1. **Python 3.8+** installed
2. **Required packages** installed:
   ```bash
   pip install fastapi uvicorn requests networkx python-dotenv rlm-core
   ```

3. **OpenAI API Key** in your `.env` file:
   ```bash
   echo "OPENAI_API_KEY=your-api-key-here" > .env
   ```

## Quick Start

### Step 1: Start the Backend Server

Open a terminal in the project directory and run:

```bash
# Option 1: Using uvicorn directly
uvicorn src.api.server:app --reload --host 0.0.0.0 --port 8000

# Option 2: Run as Python module
python -m src.api.server
```

You should see output like:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
RLM scanning ready (or warning if not available)
```

### Step 2: Test the Backend

Choose one of these methods:

#### Method 1: Interactive Web UI (Easiest)

1. Open `test_frontend.html` in your browser
2. Enter a GitHub URL (or use one of the quick examples)
3. Click "🚀 Analyze Repository"
4. Wait for results (may take a few minutes for RLM analysis)

#### Method 2: Python Script

```bash
python test_backend.py
```

This will:
- Check API health
- Check RLM status
- Analyze a test repository (Flask)
- Display results

#### Method 3: Command Line (curl)

```bash
# Check health
curl http://localhost:8000/

# Check RLM status
curl http://localhost:8000/rlm/status

# Analyze a repository
curl -X POST http://localhost:8000/analyze-full \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://github.com/pallets/flask",
    "run_rlm": true,
    "force": false
  }'
```

#### Method 4: Interactive API Docs

1. Open http://localhost:8000/docs in your browser
2. Try the endpoints using the "Try it out" buttons

## Available API Endpoints

### Core Endpoints

- **`GET /`** - Health check
- **`GET /repos`** - List all analyzed repositories

### Graph Analysis

- **`POST /analyze`** - Clone and build graph only
- **`GET /graph/{repo_name}`** - Get graph data
- **`GET /graph/{repo_name}/vis`** - Get graph in visualization format
- **`DELETE /graph/{repo_name}`** - Delete analysis data

### RLM Scanning

- **`GET /rlm/status`** - Check if RLM is available
- **`POST /rlm/scan`** - Run RLM analysis (requires graph to exist)
- **`GET /rlm/results/{repo_name}`** - Get detailed RLM results

### Combined Analysis (NEW)

- **`POST /analyze-full`** - One-stop endpoint that:
  1. Clones the GitHub repository
  2. Builds the code dependency graph
  3. Optionally runs RLM analysis

  **Request:**
  ```json
  {
    "url": "https://github.com/owner/repo",
    "run_rlm": true,
    "force": false
  }
  ```

  **Response:**
  ```json
  {
    "repo_name": "repo",
    "status": "completed",
    "graph_analysis": {
      "repo_name": "repo",
      "node_count": 150,
      "edge_count": 200,
      "repo_path": "./repos/repo"
    },
    "rlm_analysis": {
      "files_analyzed": 45,
      "issues_found": 12,
      "execution_time": 23.5
    }
  }
  ```

## Output Locations

After running analyses, check these directories:

```
Contextify-/
├── repos/              # Downloaded GitHub repositories
│   └── flask/
├── output/             # Graph data (pickled NetworkX graphs)
│   └── flask/
│       ├── graph.pkl
│       └── tags.json
└── analysis/           # RLM analysis results
    └── flask/
        └── detailed_analysis.json
```

## Troubleshooting

### "RLM scanner not available"

**Issue:** RLM dependencies are missing or API key not set

**Solution:**
```bash
pip install rlm-core
echo "OPENAI_API_KEY=your-key" > .env
```

### "Cannot connect to backend"

**Issue:** Server is not running

**Solution:**
```bash
uvicorn src.api.server:app --reload
```

### "Analysis is too slow"

**Issue:** Large repositories take time

**Solutions:**
- Use smaller test repos first (like Flask)
- RLM analysis can take several minutes
- Check server logs for progress

### Import errors

**Issue:** Module not found errors

**Solution:**
```bash
# Make sure you're in the project root
cd "c:\Users\Oskar K\OneDrive\Desktop\Programowanie\Contextify-"

# Run with proper Python path
python -m src.api.server
```

## Testing Workflow

### Quick Test (5 minutes)
1. Start server
2. Open http://localhost:8000/rlm/status
3. Open test_frontend.html
4. Test with a small repo

### Full Test (15-30 minutes)
1. Start server
2. Run `python test_backend.py`
3. Examine output files
4. Test with your own repositories

## Next Steps

1. **Integrate with your frontend**: Use the `/analyze-full` endpoint
2. **Add WebSocket support**: For real-time progress updates
3. **Add caching**: To speed up repeated analyses
4. **Deploy**: Use Docker or cloud hosting

## Example Integration (JavaScript)

```javascript
async function analyzeRepository(githubUrl) {
    const response = await fetch('http://localhost:8000/analyze-full', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            url: githubUrl,
            run_rlm: true,
            force: false
        })
    });

    const data = await response.json();

    console.log('Graph:', data.graph_analysis);
    console.log('RLM:', data.rlm_analysis);

    return data;
}

// Usage
analyzeRepository('https://github.com/pallets/flask')
    .then(results => console.log(results))
    .catch(error => console.error(error));
```

## Support

If you encounter issues:
1. Check the server logs
2. Verify all dependencies are installed
3. Make sure your API key is valid
4. Try with a smaller test repository first
