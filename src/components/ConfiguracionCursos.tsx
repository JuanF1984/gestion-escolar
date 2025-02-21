import { useState, useEffect } from "react";
import supabase from "../utils/supabase";

type SeccionesState = Record<number, number>;

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];
const NOMBRES_CURSOS = [
    '1er Año', '2do Año', '3er Año',
    '4to Año', '5to Año', '6to Año', '7mo Año'
];

export const ConfiguracionCursos = () => {
    const [cantidadAnios, setCantidadAnios] = useState<number>(0);
    const [secciones, setSecciones] = useState<SeccionesState>({});
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState<string>("");
    const [configuracionCargada, setConfiguracionCargada] = useState(false);

    useEffect(() => {
        const verificarConfiguracion = async () => {
            const { data, error } = await supabase.from('cursos').select('*');
            if (error) {
                console.error("Error al verificar la configuración:", error);
            } else if (data.length > 0) {
                setConfiguracionCargada(true);
                setMensaje("La configuración inicial ya ha sido realizada.");
            }
        };
        verificarConfiguracion();
    }, []);

    const handleAniosChange = (cantidad: number) => {
        setCantidadAnios(cantidad);
        const seccionesIniciales: SeccionesState = {};
        for (let i = 1; i <= cantidad; i++) {
            seccionesIniciales[i] = 0;
        }
        setSecciones(seccionesIniciales);
    };

    const handleSeccionesChange = (anio: number, cantidad: number) => {
        setSecciones(prev => ({
            ...prev,
            [anio]: cantidad
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMensaje("");

        if (Object.values(secciones).some(seccion => seccion === 0)) {
            setMensaje("Debe completar todas las secciones antes de guardar.");
            setLoading(false);
            return;
        }

        try {
            for (let i = 1; i <= cantidadAnios; i++) {
                const cursoData = {
                    nombre: NOMBRES_CURSOS[i - 1],
                    cantidad_secciones: secciones[i]
                };

                const { data: cursoDB, error: cursoError } = await supabase
                    .from('cursos')
                    .insert([cursoData])
                    .select()
                    .single();

                if (cursoError) throw cursoError;

                const seccionesData = Array.from({ length: secciones[i] }, (_, index) => ({
                    id_curso: cursoDB.id,
                    nombre: `${NOMBRES_CURSOS[i - 1]} "${secciones[i] === 1 ? 'U' : LETRAS[index]}"`
                }));

                const { error: seccionesError } = await supabase
                    .from('secciones')
                    .insert(seccionesData);

                if (seccionesError) throw seccionesError;
            }

            setMensaje("Configuración guardada exitosamente.");
            setConfiguracionCargada(true);
        } catch (error: any) {
            setMensaje("Error al guardar la configuración: " + (error.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 max-w-2xl mx-auto bg-white shadow-lg rounded-lg">
            <h2 className="text-xl font-bold mb-4">Configuración de Cursos y Secciones</h2>

            {configuracionCargada ? (
                <div className="p-2 bg-green-100 rounded">
                    La configuración inicial ha sido realizada con éxito.
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block mb-2">Cantidad de Años:</label>
                        <select
                            value={cantidadAnios}
                            onChange={(e) => handleAniosChange(Number(e.target.value))}
                            className="w-full border p-2 rounded"
                        >
                            <option value="0">Seleccione cantidad de años</option>
                            {[3, 4, 5, 6, 7].map(num => (
                                <option key={num} value={num}>{num} años</option>
                            ))}
                        </select>
                    </div>

                    {cantidadAnios > 0 && (
                        <div className="space-y-2">
                            <h3 className="font-semibold">Configurar Secciones por Año:</h3>
                            {Array.from({ length: cantidadAnios }, (_, i) => i + 1).map(anio => (
                                <div key={anio} className="flex items-center gap-4">
                                    <span className="w-32">{NOMBRES_CURSOS[anio - 1]}:</span>
                                    <select
                                        value={secciones[anio] || 0}
                                        onChange={(e) => handleSeccionesChange(anio, Number(e.target.value))}
                                        className="border p-2 rounded"
                                    >
                                        {[0, 1, 2, 3, 4, 5, 6].map(num => (
                                            <option key={num} value={num}>{num} secciones</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    )}

                    {cantidadAnios > 0 && (
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-500 text-white p-2 rounded disabled:bg-blue-300"
                        >
                            {loading ? "Guardando..." : "Guardar Configuración"}
                        </button>
                    )}

                    {mensaje && (
                        <div className={`p-2 rounded ${mensaje.includes("Error") ? "bg-red-100" : "bg-green-100"}`}>
                            {mensaje}
                        </div>
                    )}
                </form>
            )}
        </div>
    );
};

