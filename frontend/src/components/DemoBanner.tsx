import { isDemo } from '../api/mockApi';

// Shown at the top of every page while the app uses the mock API.
export function DemoBanner() {
  if (!isDemo) return null;
  return (
    <div className="demo-banner" role="note">
      <strong>Demo data.</strong> This is a prototype. No app has been analysed, and every
      result shown is an example.
    </div>
  );
}

// Small inline label for individual demo values.
export function DemoTag() {
  if (!isDemo) return null;
  return <span className="demo-tag">Demo</span>;
}
