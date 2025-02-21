import { useState, useEffect } from "react";
import supabase from '../utils/supabase'

type Materia = {
    id: string;
    nombre: string;
    activa: boolean;
}

export const IngresarMaterias = () => {
    const [materias, setMaterias] = useState<Materia[]>([]);
    const [nombre, setNombre] = useState("");
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editando, setEditando] = useState<string | null>(null);
    const [tempNombre, setTempNombre] = useState("");
    const [tempActiva, setTempActiva] = useState<boolean | null>(null);

    useEffect(() => {
        const fetchMaterias = async () => {
            const { data, error } = await supabase.from("materias").select("id, nombre, activa");
            if (!error) setMaterias(data || []);
            setLoading(false);
        };
        fetchMaterias();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) return;
        const { data, error } = await supabase.from("materias").insert([{ nombre, activa: true }]).select();
        if (!error && data) setMaterias([...materias, ...data]);
        setNombre("");
        setShowForm(false);
    };

    const handleModificar = (materia: Materia) => {
        setEditando(materia.id);
        setTempNombre(materia.nombre);
        setTempActiva(materia.activa);
    };

    const handleGuardar = async (id: string) => {
        if (tempNombre.trim() === "" || tempActiva === null) return;
        const { error } = await supabase.from("materias").update({ nombre: tempNombre, activa: tempActiva }).eq("id", id);
        if (!error) {
            setMaterias(materias.map(m => m.id === id ? { ...m, nombre: tempNombre, activa: tempActiva } : m));
            setEditando(null);
        }
    };

    const handleCancelar = () => {
        setEditando(null);
    };

    return (
        <div className="p-4 max-w-2xl mx-auto bg-white shadow-lg rounded-lg">
            <h2 className="text-xl font-bold mb-4">Materias</h2>
            {loading ? (
                <p>Cargando...</p>
            ) : materias.length === 0 ? (
                <p>No hay materias registradas.</p>
            ) : (
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">Nombre</th>
                            <th className="border p-2">Estado</th>
                            <th className="border p-2">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {materias.map((materia) => (
                            <tr key={materia.id} className="border">
                                <td className="border p-2">
                                    {editando === materia.id ? (
                                        <input
                                            type="text"
                                            value={tempNombre}
                                            onChange={(e) => setTempNombre(e.target.value)}
                                            className="border p-1 rounded w-full"
                                        />
                                    ) : (
                                        materia.nombre
                                    )}
                                </td>
                                <td className="border p-2 text-center">
                                    {editando === materia.id ? (
                                        <select
                                            value={tempActiva ? "true" : "false"}
                                            onChange={(e) => setTempActiva(e.target.value === "true")}
                                            className="border p-1 rounded"
                                        >
                                            <option value="true">Activa</option>
                                            <option value="false">Inactiva</option>
                                        </select>
                                    ) : (
                                        materia.activa ? "Activa" : "Inactiva"
                                    )}
                                </td>
                                <td className="border p-2 text-center">
                                    {editando === materia.id ? (
                                        <>
                                            <button onClick={() => handleGuardar(materia.id)} className="bg-green-500 text-white px-3 py-1 rounded mr-2">Guardar</button>
                                            <button onClick={handleCancelar} className="bg-gray-500 text-white px-3 py-1 rounded">Cancelar</button>
                                        </>
                                    ) : (
                                        <button onClick={() => handleModificar(materia)} className="bg-yellow-500 text-white px-3 py-1 rounded">Modificar</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <button
                onClick={() => setShowForm(!showForm)}
                className="mt-4 w-full bg-blue-500 text-white p-2 rounded"
            >
                {showForm ? "Cancelar" : "Agregar Materia"}
            </button>

            {showForm && (
                <form onSubmit={handleSubmit} className="mt-4">
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Nombre de la materia"
                        className="w-full border p-2 rounded mb-2"
                    />
                    <button
                        type="submit"
                        className="w-full bg-green-500 text-white p-2 rounded"
                    >
                        Guardar
                    </button>
                </form>
            )}
        </div>
    );
}
