import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router';
import { DemoBanner } from './components/DemoBanner';
import { FindingsPage } from './pages/FindingsPage';
import { ReportPage } from './pages/ReportPage';
import { StatusPage } from './pages/StatusPage';
import { UploadPage } from './pages/UploadPage';

// Route table: one URL per screen in the user journey.
//   /upload                  submit an APK
//   /jobs/:jobId             processing status
//   /jobs/:jobId/findings    findings list
//   /jobs/:jobId/report      full report
export default function App() {
  return (
    <BrowserRouter>
      <DemoBanner />
      <header className="site-header no-print">
        <h1>
          <Link to="/upload">Biometric Authentication Security Tool</Link>
        </h1>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/upload" replace />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/jobs/:jobId" element={<StatusPage />} />
          <Route path="/jobs/:jobId/findings" element={<FindingsPage />} />
          <Route path="/jobs/:jobId/report" element={<ReportPage />} />
          <Route path="*" element={<p>Page not found.</p>} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
