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
        <Route path="/overview" element={<PrivateRoute><Overview></Overview></PrivateRoute>}></Route>
        <Route path="/overview" element={<PrivateRoute><Overview></Overview></PrivateRoute>}></Route>
        <Route path="/overview" element={<PrivateRoute><Overview></Overview></PrivateRoute>}></Route>
        <Route path="/overview" element={<PrivateRoute><Overview></Overview></PrivateRoute>}></Route>
        <Route path="/overview" element={<PrivateRoute><Overview></Overview></PrivateRoute>}></Route>


        <Route path="/utilisation" element={<Utilisation></Utilisation>}></Route>
        <Route path="/bystation" element={<ByStation></ByStation>}></Route>
        <Route path="/billing" element={<Billing></Billing>}></Route>
        <Route path="/pricing" element={<Pricing></Pricing>}></Route>
        <Route path="/users" element={<Users></Users>}></Route>
      </Routes>
    </Router>
  )
}

export default App
