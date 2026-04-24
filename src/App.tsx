import { Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Codex } from './pages/Codex';
import { ConceptPage } from './pages/ConceptPage';
import { Sandbox } from './pages/Sandbox';
import { TheoryHub } from './pages/TheoryHub';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/concepts" element={<Codex />} />
        <Route path="/concept/:id" element={<ConceptPage />} />
        <Route path="/sandbox" element={<Sandbox />} />
        <Route path="/theory" element={<TheoryHub />} />
      </Route>
    </Routes>
  );
}
