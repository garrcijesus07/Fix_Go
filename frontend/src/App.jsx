import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminDashboard from "./pages/AdminDashboard";
import ClienteDashboard from "./pages/ClienteDashboard";
import MecanicoDashboard from "./pages/MecanicoDashboard";
import TallerDashboard from "./pages/TallerDashboard";
import PerfilTaller from "./pages/PerfilTaller";
import MisVehiculos from "./pages/MisVehiculos";
import NuevoVehiculo from "./pages/NuevoVehiculo";

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />

        <Route
          path="/admin"
          element={<AdminDashboard />}
        />

        <Route
          path="/cliente"
          element={<ClienteDashboard />}
        />

        <Route
          path="/mecanico"
          element={<MecanicoDashboard />}
        />

        <Route
          path="/taller"
          element={<TallerDashboard />}
        />

        <Route
          path="/cliente/taller/:id"
          element={<PerfilTaller />}
        />

        <Route
          path="/cliente/vehiculos"
          element={<MisVehiculos />}
        />

        <Route
          path="/cliente/vehiculos/nuevo"
          element={<NuevoVehiculo />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;