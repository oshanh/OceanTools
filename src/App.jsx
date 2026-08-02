import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Category from './pages/Category';
import Tool from './pages/Tool';

/**
 * Root application component — defines all routes.
 *
 * Route structure:
 *   /                        → Home (hero + category grid)
 *   /category/:categoryId   → Category (tools in a category)
 *   /tool/:toolId            → Tool (individual tool interface)
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="category/:categoryId" element={<Category />} />
          <Route path="tool/:toolId" element={<Tool />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
