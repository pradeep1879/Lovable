import { Route, Routes, useLocation } from "react-router-dom"
import { Toaster } from "sonner"
import Navbar from "./components/Navbar"
import Home from "./pages/Home"
import AuthPage from "./pages/auth/AuthPage"
import Pricing from "./pages/Pricing"
import Projects from "./pages/Projects"
import MyProject from "./pages/MyProject"
import Preview from "./pages/Preview"
import Community from "./pages/Community"
import Setting from "./pages/Setting"
import View from "./pages/View"

function App() {
   const { pathname } = useLocation()

  const hideNavbar = pathname.startsWith('/projects/') && pathname !== '/projects'
                      || pathname.startsWith('/view/')
                      || pathname.startsWith('/preview/')

  return (
    <>
    <div>
      <Toaster/>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/auth/:pathname" element={<AuthPage/>}/>
        <Route path="/pricing" element={<Pricing/>}/>
        <Route path="/project/:projectId" element={<Projects/>}/>
        <Route path="/projects" element={<MyProject/>}/>
        <Route path="/preview/:projectId" element={<Preview/>}/>
        <Route path="/preview/:projectId/:versionId" element={<Preview/>}/>
        <Route path="/community" element={<Community/>}/>
        <Route path="/view" element={<View/>}/>
        <Route path="/setting" element={<Setting/>}/>
      </Routes>
    </div>      
    </>
  )
}

export default App
