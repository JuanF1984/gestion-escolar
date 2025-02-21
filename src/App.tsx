import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Cursos } from "./components/pages/Cursos"
import { Materias } from "./components/pages/Materias"
import { IngresoEstudiante } from "./components/pages/IngresoEstudiante"
import { ConfiguracionCursos } from "./components/ConfiguracionCursos"
import { Secciones } from "./components/pages/Secciones"
import { MateriasPorCurso } from "./components/pages/MateriasPorCurso"
import { ListadoEstudiantes } from "./components/pages/ListadoEstudiantes"
import { Dashboard } from "./components/Dashboard"

const App: React.FC = () => {
  return (
    <Router>
      <div className="h-screen flex">
        <Dashboard />
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/materias" element={<Materias />} />
            <Route path="/secciones" element={<Secciones />} />
            <Route path="/cursos" element={<Cursos />} />
            <Route path="/ingresar-estudiante" element={<IngresoEstudiante />}/>
            <Route path="/configurar-cursos" element={<ConfiguracionCursos />}/>
            <Route path="/materias-cursos" element={<MateriasPorCurso />}/>
            <Route path="/listado-estudiantes" element={<ListadoEstudiantes />}/>
            <Route path="*" element={
              <>
                <h1 className="text-2xl font-bold mb-4">Bienvenido a Gestión Escolar</h1>
                <p>Selecciona una sección del menú que se encuentra a la izquierda.</p>
              </>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
