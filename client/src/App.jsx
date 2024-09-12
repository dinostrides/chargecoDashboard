import React from "react"
import Login from "./Login"
import Overview from "./Overview";
import Utilisation from "./Utilisation";
import ByStation from "./ByStation";
import Billing from "./Billing";
import Pricing from "./Pricing";
import Users from "./Users";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import PrivateRoute from "./routes/PrivateRoute";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login></Login>}></Route>
        <Route path="/overview" element={<PrivateRoute><Overview></Overview></PrivateRoute>}></Route>
        <Route path="/utilisation" element={<PrivateRoute><Utilisation></Utilisation></PrivateRoute>}></Route>
        <Route path="/bystation" element={<PrivateRoute><ByStation></ByStation></PrivateRoute>}></Route>
        <Route path="/billing" element={<PrivateRoute><Billing></Billing></PrivateRoute>}></Route>
        <Route path="/pricing" element={<PrivateRoute><Pricing></Pricing></PrivateRoute>}></Route>
        <Route path="/users" element={<PrivateRoute><Users></Users></PrivateRoute>}></Route>
      </Routes>
    </Router>
  )
}

export default App
