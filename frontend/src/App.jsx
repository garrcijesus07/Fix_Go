import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";

import AdminDashboard from "./pages/AdminDashboard";
import ClienteDashboard from "./pages/ClienteDashboard";
import MecanicoDashboard from "./pages/MecanicoDashboard";
import TallerDashboard from "./pages/TallerDashboard";
import PerfilTaller from "./pages/PerfilTaller";
import MisVehiculos from "./pages/MisVehiculos";
import NuevoVehiculo from "./pages/NuevoVehiculo";
import PerfilCliente from "./pages/PerfilCliente";
import Citas from "./pages/Citas";
import AgendarCita from "./pages/AgendarCita";

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

        <Route element={<ProtectedRoute rolesPermitidos={["administrador"]} />}>
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route element={<ProtectedRoute rolesPermitidos={["taller"]} />}>
          <Route path="/taller" element={<TallerDashboard />} />
        </Route>

        <Route element={<ProtectedRoute rolesPermitidos={["mecanico"]} />}>
          <Route path="/mecanico" element={<MecanicoDashboard />} />
        </Route>

        <Route element={<ProtectedRoute rolesPermitidos={["cliente"]} />}>
          <Route path="/cliente" element={<ClienteDashboard />} />
          <Route path="/cliente/taller/:id" element={<PerfilTaller />} />
          <Route path="/cliente/taller/:id/agendar" element={<AgendarCita />} />
          <Route path="/cliente/vehiculos" element={<MisVehiculos />} />
          <Route path="/cliente/vehiculos/nuevo" element={<NuevoVehiculo />} />
          <Route path="/cliente/vehiculos/:id/editar" element={<NuevoVehiculo />} />
          <Route path="/cliente/citas" element={<Citas />} />
          <Route path="/cliente/perfil" element={<PerfilCliente />} />
        </Route>

      </Routes>

    </BrowserRouter>
  );
}

export default App;
