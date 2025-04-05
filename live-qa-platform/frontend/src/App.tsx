import { Routes, Route } from 'react-router-dom';

// Pages
import HomePage from './pages/HomePage';
import CreateSessionPage from './pages/CreateSessionPage';
import JoinSessionPage from './pages/JoinSessionPage';
import PresenterViewPage from './pages/PresenterViewPage';
import ParticipantViewPage from './pages/ParticipantViewPage';
import NotFoundPage from './pages/NotFoundPage';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<CreateSessionPage />} />
      <Route path="/join" element={<JoinSessionPage />} />
      <Route path="/join/:sessionId" element={<JoinSessionPage />} />
      <Route path="/session/:sessionId/presenter" element={<PresenterViewPage />} />
      <Route path="/session/:sessionId/participant" element={<ParticipantViewPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default App;