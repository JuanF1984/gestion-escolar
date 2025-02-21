import { useNavigate } from "react-router-dom";

export const Dashboard: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside className="w-64 bg-white shadow-lg p-4">
                <h2 className="text-3xl font-bold mb-4">Gestión Escolar</h2>
                <nav className="space-y-2">
                    <h3 className="text-lg font-bold mb-4">Administrar cursos y secciones</h3>
                    <button onClick={() => navigate("/configurar-cursos")} className="w-full text-left p-2 bg-blue-500 text-white rounded">Configuración Inicial</button>
                    <button onClick={() => navigate("/materias")} className="w-full text-left p-2 bg-blue-500 text-white rounded">Materias</button>
                    <button onClick={() => navigate("/secciones")} className="w-full text-left p-2 bg-blue-500 text-white rounded">Secciones</button>
                    <button onClick={() => navigate("/materias-cursos")} className="w-full text-left p-2 bg-blue-500 text-white rounded">Relacionar Materia a curso</button>
                    <button onClick={() => navigate("/cursos")} className="w-full text-left p-2 bg-blue-500 text-white rounded">Cursos</button>
                    <h3 className="text-lg font-bold mb-4">Estudiantes</h3>
                    <button onClick={() => navigate("/ingresar-estudiante")} className="w-full text-left p-2 bg-blue-500 text-white rounded">Registrar Estudiante</button>
                    <button onClick={() => navigate("/listado-estudiantes")} className="w-full text-left p-2 bg-blue-500 text-white rounded">Listar Estudiantes</button>

                </nav>
            </aside>


        </div>
    );
};

