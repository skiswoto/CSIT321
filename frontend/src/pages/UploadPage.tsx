import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError, DEMO_JOB_IDS, MAX_UPLOAD_MB, createJob } from '../api/mockApi';

// What each built-in demonstration job shows, for the links below the form.
const DEMO_LINK_LABELS: Record<string, string> = {
  job_0001: 'completed job',
  job_0002: 'partial job (no runtime tests)',
  job_0003: 'failed job',
};

// The upload page at /: submit an APK (and optionally its source) for analysis.
export function UploadPage() {
  const navigate = useNavigate();
  const [apk, setApk] = useState<File | null>(null);
  const [source, setSource] = useState<File | null>(null);
  const [authorised, setAuthorised] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Submit stays disabled until an APK is chosen and the declaration is
  // ticked (FR-SUB-02). The API checks both again.
  const canSubmit = apk !== null && authorised && !submitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!apk) return;

    setError(null);
    setSubmitting(true);
    try {
      const { job_id } = await createJob({ apk, source: source ?? undefined, authorised });
      navigate(`/jobs/${job_id}`);
    } catch (err) {
      // A rejected file creates no job. Show the reason so the user can try again.
      setError(err instanceof ApiError ? err.message : 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2>Submit an app for analysis</h2>
      <p>
        Upload a debug build of your own Android app as a single universal APK. Adding the source
        code is optional, but it lets the report point to exact files and lines.
      </p>
      <p className="hint">
        Accepted: one .apk file, plus an optional .zip of the source. Split APKs and .aab bundles
        are not supported. Maximum size: {MAX_UPLOAD_MB} MB (provisional).
      </p>

      <form className="upload-form" onSubmit={handleSubmit}>
        <label>
          APK file (required)
          <input
            type="file"
            accept=".apk"
            onChange={(e) => {
              setApk(e.target.files?.[0] ?? null);
              setError(null);
            }}
          />
        </label>

        <label>
          Source code as a .zip (optional)
          <input
            type="file"
            accept=".zip"
            onChange={(e) => {
              setSource(e.target.files?.[0] ?? null);
              setError(null);
            }}
          />
        </label>

        <label className="inline">
          <input type="checkbox" checked={authorised} onChange={(e) => setAuthorised(e.target.checked)} />
          I own this app or am authorised to test it
        </label>

        {error && (
          <p className="error" role="alert">
            Not accepted: {error}
          </p>
        )}

        <button type="submit" disabled={!canSubmit}>
          {submitting ? 'Submitting...' : 'Start analysis'}
        </button>
      </form>

      <p className="hint">
        Or open a demonstration job without uploading:{' '}
        {DEMO_JOB_IDS.map((jobId, index) => (
          <span key={jobId}>
            {index > 0 && ', '}
            <Link to={`/jobs/${jobId}`}>{DEMO_LINK_LABELS[jobId] ?? jobId}</Link>
          </span>
        ))}
        .
      </p>
    </section>
  );
}
