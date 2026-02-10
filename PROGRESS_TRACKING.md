# Progress Tracking & Verbose Logging

## What's New

✅ **Real-time progress updates** - See what's happening during analysis
✅ **Verbose backend logging** - All operations are logged to console
✅ **Live frontend updates** - Progress bar and status updates
✅ **Partial results** - See issues as they're discovered

## Starting the Server (With Verbose Logging)

### Windows
```bash
start_server.bat
```

### Mac/Linux
```bash
chmod +x start_server.sh
./start_server.sh
```

### Manual Start (with verbose logging)
```bash
set PYTHONUNBUFFERED=1  # Windows
export PYTHONUNBUFFERED=1  # Mac/Linux

uvicorn src.api.server:app --reload
```

## How Progress Tracking Works

### Backend Flow

1. **Graph Building** (`graph_building` event)
   ```
   [PROGRESS] graph_building: Building code graph...
   ```

2. **Graph Complete** (`graph_complete` event)
   ```
   [PROGRESS] graph_complete: nodes=150, edges=200
   ```

3. **Collecting Files** (`collecting_files` event)
   ```
   [COLLECTING PYTHON FILES]
   Scanning directory...
   ```

4. **Files Collected** (`files_collected` event)
   ```
   [PROGRESS] files_collected: file_count=45
   ```

5. **Batch Processing** (`batch_complete` event)
   ```
   [PROGRESS] batch_complete: batch=1/5, total_issues=3
   ```

### Frontend Updates

The frontend polls `/rlm/progress/{repo_name}` every 2 seconds and updates:
- Status message
- Progress indicators
- Partial results
- Issue counts

### Console Output

You'll see detailed logging in the terminal where you started the server:

```
======================================================================
FULL ANALYSIS: pallets/flask
======================================================================

[1/2] Building code graph for pallets/flask...
[PROGRESS] graph_building: {'repo_name': 'flask', 'status': 'Building code graph...'}
   Found 125 source files
✓ Graph built: 1234 nodes, 2345 edges

[2/2] Running RLM analysis on flask...
      This may take several minutes depending on repository size
[PROGRESS] rlm_started: {'repo_name': 'flask', 'status': 'Starting RLM analysis...'}

[COLLECTING PYTHON FILES]
[PROGRESS] collecting_files: {'repo_name': 'flask', 'status': 'Collecting Python files...'}
  [+] src/flask/__init__.py (5234 chars)
  [+] src/flask/app.py (12456 chars)
  ...
Collected 45 Python files

[PROGRESS] files_collected: {'repo_name': 'flask', 'file_count': 45}

[RLM ANALYSIS]
Total files: 45
Batches: 5 x 10 files

======================================================================
BATCH 1/5
======================================================================
Running RLM...
✓ Got 3 issues (23.45s)
✓ Total so far: 3
[SAVED] Progressive update 1/5 to analysis/flask/detailed_analysis.json
[PROGRESS] batch_complete: {'batch': 1, 'total_batches': 5, 'total_issues': 3, ...}

... (continues for all batches)

✓ RLM complete: 12 issues found in 134.56s
```

## API Endpoints for Progress

### Get Progress
```http
GET /rlm/progress/{repo_name}

Response:
{
  "timestamp": 1707567890.123,
  "data": {
    "type": "batch_complete",
    "repo_name": "flask",
    "batch": 3,
    "total_batches": 5,
    "batch_issues": 2,
    "total_issues": 8,
    "issues_by_file": {...},
    "summary": {
      "total_files": 45,
      "files_with_issues": 15,
      "total_issues": 8,
      "critical_issues": 1,
      "high_issues": 3,
      "batches_completed": 3,
      "total_batches": 5
    }
  }
}
```

### Progress Event Types

| Event Type | Description | When It Fires |
|------------|-------------|---------------|
| `graph_building` | Starting graph construction | Before GraphBuilder.build() |
| `graph_complete` | Graph built successfully | After GraphBuilder.build() |
| `collecting_files` | Starting to collect Python files | Before file collection |
| `files_collected` | Python files collected | After file collection |
| `rlm_started` | RLM analysis starting | Before first batch |
| `batch_complete` | Batch analysis complete | After each batch |

## Frontend Integration

### Polling for Progress

```javascript
let progressInterval = null;

async function startAnalysis(githubUrl) {
    // Parse repo name
    const repoName = githubUrl.split('/').pop().replace('.git', '');

    // Start progress polling
    progressInterval = setInterval(async () => {
        const response = await fetch(`http://localhost:8000/rlm/progress/${repoName}`);
        if (response.ok) {
            const progress = await response.json();
            updateUI(progress.data);
        }
    }, 2000);

    // Start analysis
    const response = await fetch('http://localhost:8000/analyze-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: githubUrl,
            run_rlm: true
        })
    });

    // Stop polling when done
    clearInterval(progressInterval);

    const results = await response.json();
    displayFinalResults(results);
}

function updateUI(progressData) {
    switch(progressData.type) {
        case 'batch_complete':
            showProgress(
                `Analyzing batch ${progressData.batch}/${progressData.total_batches}`,
                progressData.summary
            );
            updateIssueCircles(progressData.issues_by_file);
            break;
        case 'files_collected':
            showStatus(`Analyzing ${progressData.file_count} files...`);
            break;
        // ... handle other event types
    }
}

function updateIssueCircles(issuesByFile) {
    // Update your visualization (circles) for each file
    for (const [file, issues] of Object.entries(issuesByFile)) {
        const circle = document.querySelector(`[data-file="${file}"]`);
        if (circle) {
            circle.setAttribute('data-issues', issues.length);
            circle.classList.add('has-issues');

            // Color based on severity
            const hasCritical = issues.some(i => i.severity === 'critical');
            const hasHigh = issues.some(i => i.severity === 'high');

            if (hasCritical) {
                circle.classList.add('critical');
            } else if (hasHigh) {
                circle.classList.add('high');
            }
        }
    }
}
```

### Using Server-Sent Events (Alternative)

For even more real-time updates, you could implement SSE:

```python
# In server.py (future enhancement)
from fastapi.responses import StreamingResponse

@app.get("/rlm/stream/{repo_name}")
async def stream_progress(repo_name: str):
    async def event_generator():
        while repo_name in analysis_progress:
            progress = analysis_progress[repo_name]
            yield f"data: {json.dumps(progress)}\n\n"
            await asyncio.sleep(1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
```

```javascript
// Frontend usage
const eventSource = new EventSource(`http://localhost:8000/rlm/stream/${repoName}`);

eventSource.onmessage = (event) => {
    const progress = JSON.parse(event.data);
    updateUI(progress.data);
};
```

## Troubleshooting

### "Not seeing any console output"

**Solution:**
```bash
# Make sure PYTHONUNBUFFERED is set
set PYTHONUNBUFFERED=1  # Windows
export PYTHONUNBUFFERED=1  # Mac/Linux

# Or use the start scripts
start_server.bat  # Windows
./start_server.sh  # Mac/Linux
```

### "Progress updates not appearing in frontend"

**Checks:**
1. Open browser console (F12) to see network requests
2. Check `/rlm/progress/{repo_name}` endpoint manually
3. Verify repo name is correct in the URL
4. Make sure RLM analysis is actually running

### "Circles not updating"

**Solution:**
- The test_frontend.html shows partial results during analysis
- Make sure your actual frontend has the `updateIssueCircles()` function
- Check browser console for JavaScript errors

## Example Session

```bash
# Terminal
$ start_server.bat

============================================================
Starting Contextify Backend Server
============================================================

INFO:     Uvicorn running on http://0.0.0.0:8000
✓ RLM scanner initialized with verbose logging

# User submits analysis via frontend
======================================================================
FULL ANALYSIS: pallets/flask
======================================================================

[1/2] Building code graph for pallets/flask...
[PROGRESS] graph_building: {'repo_name': 'flask', ...}
   Found 125 source files
✓ Graph built: 1234 nodes, 2345 edges

[2/2] Running RLM analysis on flask...
[PROGRESS] rlm_started: {'repo_name': 'flask', ...}

[COLLECTING PYTHON FILES]
[PROGRESS] collecting_files: ...
Collected 45 Python files
[PROGRESS] files_collected: {'file_count': 45}

[RLM ANALYSIS]
BATCH 1/5
Running RLM...
✓ Got 3 issues (23.45s)
[PROGRESS] batch_complete: {'batch': 1, 'total_issues': 3, ...}

# Frontend polls and shows:
# "🤖 Analyzing batch 1/5... (3 issues found so far)"

... (continues) ...

✓ RLM complete: 12 issues found in 134.56s
```

## Next Steps

1. **Use the progress data** - Update your circles/visualization in real-time
2. **Add custom progress UI** - Create loading bars, animations, etc.
3. **Implement SSE** - For true push-based updates (no polling)
4. **Add WebSocket support** - For bidirectional communication
