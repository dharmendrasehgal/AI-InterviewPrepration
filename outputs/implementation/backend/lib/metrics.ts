export const metrics = {
  scoreReportLatency(ms: number): void {
    if (process.env.NODE_ENV !== 'test') {
      process.stdout.write(`[metrics] score_report_latency_ms=${ms}\n`)
    }
  },
}
