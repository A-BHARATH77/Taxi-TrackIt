import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SidebarDemo } from "@/pages/HomePage";
import { TaxiPage } from "@/pages/TaxiPage";
import { ZonePage } from "@/pages/ZonePage";
import { LandingPage } from "@/pages/LandingPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<SidebarDemo />} />
        <Route path="/taxi" element={<TaxiPage />} />
        <Route path="/zone" element={<ZonePage />} />
      </Routes>
    </Router>
  );
}

export default App;