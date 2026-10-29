import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ApiError, MAX_UPLOAD_MB, createJob } from '../api/mockApi';
import type { BuildType } from '../api/types';

// Screen 1: submit an APK (and optionally its source) for analysis.
export function UploadPage() {
  const navigate = useNavigate();
  const [apk, setApk] = useState<File | null>(null);
  const [source, setSource] = useState<File | null>(null);
  const [buildType, setBuildType] = useState<BuildType>('debug');
  const [authorised, setAuthorised] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!apk) return;

    setError(null);
    setSubmitting(true);
    try {
      const { job_id } = await createJob({
        apk,
        source: source ?? undefined,
        build_type: buildType,
        authorised,
      });
      navigate(`/jobs/${job_id}`);
    } catch (err) {
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
            required
            onChange={(e) => setApk(e.target.files?.[0] ?? null)}
          />
        </label>

        <label>
          Source code as a .zip (optional)
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setSource(e.target.files?.[0] ?? null)}
          />
        </label>

        <fieldset>
          <legend>Build type</legend>
          <label className="inline">
            <input
              type="radio"
              name="build_type"
              checked={buildType === 'debug'}
              onChange={() => setBuildType('debug')}
            />
            Debug
          </label>
          <label className="inline">
            <input
              type="radio"
              name="build_type"
              checked={buildType === 'release'}
              onChange={() => setBuildType('release')}
            />
            Release
          </label>
        </fieldset>

        <label className="inline">
          <input
            type="checkbox"
            required
            checked={authorised}
            onChange={(e) => setAuthorised(e.target.checked)}
          />
          I own this app or am authorised to test it
        </label>

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Start analysis'}
        </button>
      </form>

      <p className="hint">
        Or open the <Link to="/jobs/job_0001">example report</Link> without uploading.
      </p>
    </section>
  );
}
