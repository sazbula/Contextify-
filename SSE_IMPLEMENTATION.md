# Server-Sent Events (SSE) Implementation

## Overview

The RLM scanner now uses **Server-Sent Events (SSE)** for real-time progress updates instead of polling. This provides:
- ✅ **True real-time updates** - Instant notifications when events occur
- ✅ **Lower server load** - No repeated polling requests
- ✅ **Better user experience** - Smoother, more responsive UI
- ✅ **Automatic reconnection** - Browser handles reconnects if connection drops

## How It Works

### Backend (FastAPI)

#### New Endpoint: `/rlm/stream/{repo_name}`

```python
@app.get("/rlm/stream/{repo_name}")
async def stream_rlm_progress(repo_name: str):
    """Server-Sent Events stream for real-time progress"""
    async def event_generator():
        yield f"data: {json.dumps({'type': 'connected'})}\n\n"

        while True:
            if repo_name in analysis_progress:
                progress = analysis_progress[repo_name]
                yield f"data: {json.dumps(progress['data'])}\n\n"

                if progress['data'].get('type') == 'analysis_complete':
                    break

            await asyncio.sleep(1)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
```

#### Progress Events Sent

| Event Type | When | Data |
|------------|------|------|
| `connected` | SSE connection established | `{type, repo_name}` |
| `graph_building` | Starting graph build | `{type, repo_name, status}` |
| `graph_complete` | Graph built | `{type, repo_name, nodes, edges, languages}` |
| `collecting_files` | Starting file collection | `{type, repo_name, status}` |
| `files_collected` | Files collected | `{type, repo_name, file_count}` |
| `rlm_started` | RLM analysis starting | `{type, repo_name, status}` |
| `batch_complete` | Batch analyzed | `{type, repo_name, batch, total_batches, issues_by_file, summary}` |
| `analysis_complete` | Analysis finished | `{type, repo_name, files_analyzed, issues_found, execution_time}` |
| `stream_end` | Stream closing | `{type}` |
| `timeout` | Stream timeout (3 min) | `{type, message}` |

### Frontend (JavaScript)

#### Connecting to SSE Stream

```javascript
let eventSource = null;

function connectSSE(repoName) {
    eventSource = new EventSource(`http://localhost:8000/rlm/stream/${repoName}`);

    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        updateProgressStatus(data);

        // Close on completion
        if (data.type === 'analysis_complete' || data.type === 'stream_end') {
            disconnectSSE();
        }
    };

    eventSource.onerror = (error) => {
        console.error('SSE error:', error);
        disconnectSSE();
    };
}

function disconnectSSE() {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
}
```

#### Event Handling

```javascript
function updateProgressStatus(data) {
    switch (data.type) {
        case 'connected':
            console.log('Connected to progress stream');
            break;

        case 'graph_building':
            showStatus('📊 Building code graph...', 'loading');
            break;

        case 'batch_complete':
            showStatus(
                `Analyzing batch ${data.batch}/${data.total_batches}`,
                'loading'
            );
            updateVisualization(data.issues_by_file);
            break;

        case 'analysis_complete':
            showStatus('✅ Analysis complete!', 'success');
            break;
    }
}
```

## Dynamic Header

The header now updates to show the repository being analyzed:

### Before Analysis
```
🔍 Contextify
AI-Powered Repository Analysis
```

### During Analysis
```
🔍 owner/repo-name
Analysis in Progress...
```

### Implementation

```javascript
function updateHeader(repoName, owner) {
    const titleEl = document.getElementById('headerTitle');
    const subtitleEl = document.getElementById('headerSubtitle');

    if (repoName && owner) {
        titleEl.textContent = `🔍 ${owner}/${repoName}`;
        subtitleEl.textContent = 'Analysis in Progress...';
    } else {
        // Reset to default
        titleEl.textContent = '🔍 Contextify';
        subtitleEl.textContent = 'AI-Powered Repository Analysis';
    }
}

// Usage
async function analyzeRepo() {
    const url = document.getElementById('githubUrl').value;
    const urlParts = url.split('/');
    const repoName = urlParts.pop().replace('.git', '');
    const owner = urlParts.pop();

    updateHeader(repoName, owner);  // Update header

    // Start analysis...
    connectSSE(repoName);

    // Reset after completion
    setTimeout(() => updateHeader(null, null), 3000);
}
```

## Testing SSE

### 1. Start the Server

```bash
start_server.bat  # Windows
./start_server.sh  # Mac/Linux
```

### 2. Open Test Frontend

Open [test_frontend.html](test_frontend.html) in your browser.

### 3. Check Browser Console

Open DevTools (F12) → Console to see SSE logs:

```
Connecting to SSE stream for flask...
SSE event: {type: "connected", repo_name: "flask"}
SSE event: {type: "graph_building", repo_name: "flask", status: "Building..."}
SSE event: {type: "batch_complete", batch: 1, total_batches: 5, ...}
...
SSE event: {type: "analysis_complete", issues_found: 12, ...}
Closing SSE connection
```

### 4. Network Tab

In DevTools → Network → filter by "stream":
- You'll see a long-running `GET /rlm/stream/flask` request
- Type: `eventsource`
- Status: `200 OK`
- Transfer: `text/event-stream`

## Advantages Over Polling

### Polling (Old Method)
```javascript
// Request every 2 seconds
setInterval(() => {
    fetch('/rlm/progress/flask')  // ❌ Repeated requests
        .then(res => res.json())
        .then(data => updateUI(data));
}, 2000);
```

**Problems:**
- ❌ Server gets hit every 2 seconds even with no updates
- ❌ 2-second delay before seeing updates
- ❌ Need to manually stop polling
- ❌ Wastes bandwidth on unchanged data

### SSE (New Method)
```javascript
// Single connection, instant updates
const eventSource = new EventSource('/rlm/stream/flask');
eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateUI(data);  // ✅ Instant updates!
};
```

**Benefits:**
- ✅ Single long-lived HTTP connection
- ✅ Server pushes updates instantly (< 1ms)
- ✅ Browser automatically reconnects if dropped
- ✅ Lower server load
- ✅ Better battery life on mobile

## Advanced Features

### Custom Event Types

You can send custom event types from the backend:

```python
# Backend
yield f"event: batch_complete\ndata: {json.dumps(data)}\n\n"
```

```javascript
// Frontend
eventSource.addEventListener('batch_complete', (event) => {
    const data = JSON.parse(event.data);
    console.log('Batch complete!', data);
});
```

### Retry Logic

SSE automatically retries on connection failure. You can customize:

```python
# Backend - set retry delay
yield f"retry: 5000\n"  # Retry after 5 seconds
yield f"data: {json.dumps(data)}\n\n"
```

### Event IDs

For resumable connections:

```python
# Backend
yield f"id: {event_id}\ndata: {json.dumps(data)}\n\n"
```

```javascript
// Frontend - last event ID sent in headers
// Server can resume from that point
```

## Debugging

### SSE Not Connecting

**Check browser console:**
```javascript
eventSource.onerror = (error) => {
    console.error('SSE error:', error);
    console.log('ReadyState:', eventSource.readyState);
    // 0 = CONNECTING
    // 1 = OPEN
    // 2 = CLOSED
};
```

**Check server logs:**
```
[PROGRESS] batch_complete: {'batch': 1, ...}
```

### CORS Issues

Make sure CORS allows EventSource:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Nginx Buffering

If using Nginx, disable buffering:

```nginx
location /rlm/stream/ {
    proxy_pass http://backend;
    proxy_buffering off;
    proxy_cache off;
    proxy_set_header Connection '';
    chunked_transfer_encoding off;
}
```

Or in FastAPI response headers:

```python
headers={
    "X-Accel-Buffering": "no"  # Disable nginx buffering
}
```

## Production Considerations

### 1. Connection Limits

SSE keeps connections open. Monitor:
- Concurrent connections
- Connection pooling
- Keep-alive limits

### 2. Timeouts

Set reasonable timeouts:

```python
# Backend - close after 3 minutes
max_retries = 180  # 3 minutes at 1 second intervals
```

### 3. Cleanup

Always close connections:

```javascript
// Frontend
window.addEventListener('beforeunload', () => {
    disconnectSSE();
});
```

### 4. Fallback to Polling

If SSE fails, fall back to polling:

```javascript
eventSource.onerror = () => {
    console.log('SSE failed, falling back to polling');
    disconnectSSE();
    startPolling();
};
```

## Comparison: SSE vs WebSocket

| Feature | SSE | WebSocket |
|---------|-----|-----------|
| Direction | Server → Client | Bi-directional |
| Protocol | HTTP | WebSocket (upgrade) |
| Reconnect | Automatic | Manual |
| Use Case | Server updates | Real-time chat |
| Complexity | Simple | Complex |
| **Best For** | Progress updates | Two-way communication |

For progress tracking, **SSE is simpler and better** than WebSocket because:
- ✅ No need for client → server messages
- ✅ Works over standard HTTP
- ✅ Built-in reconnection
- ✅ Simpler to implement

## Next Steps

1. **Monitor connections** - Add metrics for active SSE connections
2. **Add heartbeats** - Send periodic pings to detect dead connections
3. **Store event history** - Allow clients to resume from last event
4. **Add authentication** - Secure SSE endpoints with tokens
5. **Scale horizontally** - Use Redis pub/sub for multi-server SSE
