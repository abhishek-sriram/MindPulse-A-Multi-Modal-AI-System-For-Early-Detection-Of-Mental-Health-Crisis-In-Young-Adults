import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";

// Existing pages (unchanged logic)
import Index      from "./pages/Index";
import Assessment from "./pages/Assessment";
import Results    from "./pages/Results";
import History    from "./pages/History";
import NotFound   from "./pages/NotFound";

// New UI pages
import Features from "./pages/Features";
import About    from "./pages/About";
import Login    from "./pages/Login";
import Signup   from "./pages/Signup";

const App = () => (
  <BrowserRouter>
    <Routes>
      {/* All pages share the Layout (Navbar + Footer) */}
      <Route element={<Layout />}>
        <Route path="/"               element={<Index />} />
        <Route path="/features"       element={<Features />} />
        <Route path="/about"          element={<About />} />
        <Route path="/login"          element={<Login />} />
        <Route path="/signup"         element={<Signup />} />
        <Route path="/assessment"     element={<Assessment />} />
        <Route path="/results/:id"    element={<Results />} />
        <Route path="/history"        element={<History />} />
        <Route path="*"               element={<NotFound />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

export default App;