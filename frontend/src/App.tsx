import { BrowserRouter, Link, Route, Routes } from 'react-router';
import { DemoBanner } from './components/DemoBanner';
import { JobPage } from './pages/JobPage';
import { UploadPage } from './pages/UploadPage';

// Route table: two pages (PRD 6.2).
//   /               submit an APK
//   /jobs/:jobId    one job: progress while it runs, then its report
export default function App() {
  return (
    <BrowserRouter>
      <DemoBanner />
      <header className="site-header no-print">
        <h1>
          <Link to="/">Biometric Authentication Security Tool</Link>
        </h1>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/jobs/:jobId" element={<JobPage />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
