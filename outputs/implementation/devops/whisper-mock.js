// Whisper STT mock — accepts multipart audio uploads, returns fake transcription
const http = require('http')

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/transcribe') {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({
        text: 'This is a mock transcription. The candidate answered the question clearly and concisely, demonstrating strong communication skills.',
        words: [
          { word: 'This', start: 0.0, end: 0.2, confidence: 0.99 },
          { word: 'is', start: 0.2, end: 0.4, confidence: 0.99 },
          { word: 'a', start: 0.4, end: 0.5, confidence: 0.99 },
          { word: 'mock', start: 0.5, end: 0.8, confidence: 0.99 },
          { word: 'transcription', start: 0.8, end: 1.4, confidence: 0.98 },
        ],
        language: 'en',
        duration: 30.0,
        word_count: 22,
        words_per_minute: 44,
        filler_words: { um: 0, uh: 0, like: 0 },
      }))
    })
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok' }))
  } else {
    res.writeHead(404)
    res.end()
  }
})

server.listen(8080, () => {
  console.log('Whisper mock STT server listening on :8080')
  console.log('POST /transcribe  — returns mock transcription')
  console.log('GET  /health      — health check')
})
