import { useState } from 'react';
import { FormularioEstudiantes } from "../FormularioEstudiantes";
import { InscripcionMaterias } from "../InscripcionMaterias";
import supabase from "../../utils/supabase";
import { Alert, AlertDescription } from '@/components/ui/alert';

export const IngresoEstudiante = () => {
    // Estados
    const [studentData, setStudentData] = useState<any>(null);
    const [showSubjectsForm, setShowSubjectsForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Guardar datos personales del estudiante
    const guardarEstudiante = async (data: any) => {
        try {
            setError(null);
            const formattedData = {
                ...data,
                numero_legajo: Number(data.numero_legajo),
                fecha_nacimiento: new Date(data.fecha_nacimiento).toISOString().split("T")[0],
            };

            const { error: supabaseError } = await supabase
                .from("estudiantes")
                .insert([formattedData]);

            if (supabaseError) throw supabaseError;

            setStudentData(formattedData);
            setShowSubjectsForm(true);
            setSuccess("Datos personales guardados correctamente");
        } catch (err: any) {
            setError("Error al guardar datos personales: " + err.message);
            console.error("Error al guardar:", err);
        }
    };

    // Guardar inscripciones a materias
    const guardarInscripciones = async (inscripciones: any[]) => {
        try {
            setError(null);

            // Insertar todas las inscripciones
            const { error: inscripcionesError } = await supabase
                .from("inscripciones_materias")
                .insert(inscripciones);

            if (inscripcionesError) throw inscripcionesError;

            setSuccess("Inscripciones guardadas correctamente");

            // Opcional: resetear el formulario o redirigir
            // setShowSubjectsForm(false);
            // setStudentData(null);
        } catch (err: any) {
            setError("Error al guardar inscripciones: " + err.message);
            console.error("Error al guardar inscripciones:", err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-6">Gestión de Estudiantes</h1>

            {/* Mensajes de éxito o error */}
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            {success && (
                <Alert className="mb-4">
                    <AlertDescription>{success}</AlertDescription>
                </Alert>
            )}

            {/* Formulario de datos personales */}
            {!showSubjectsForm && (
                <FormularioEstudiantes onSave={guardarEstudiante} />
            )}

            {/* Formulario de inscripción a materias */}
            {showSubjectsForm && studentData && (
                <div className="mt-8">
                    <InscripcionMaterias
                        numeroLegajo={studentData.numero_legajo.toString()}
                        onSave={guardarInscripciones}
                    />
                </div>
            )}
        </div>
    );
};