import { useState, useEffect } from "react";
import { format } from 'date-fns';
import supabase from "@/utils/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { Alert, AlertDescription } from "../ui/alert";
import { Checkbox } from "../ui/checkbox";

// Tipos
interface Estudiante {
    numero_legajo: string;
    nombre: string;
    apellido: string;
}

interface Seccion {
    id: string;
    nombre: string;
}

interface MateriaSeccion {
    id: string;
    id_seccion: string;
    materias_por_curso: {
        materias: {
            id: string;
            nombre: string;
        }
    }
}

interface Inasistencia {
    id?: string;
    numero_legajo: string;
    id_materia_seccion: string;
    fecha: string;
    tipo: 'completa' | 'media';
    justificada: boolean;
    descripcion?: string;
}

export const RegistroInasistencias = () => {
    // Estados
    const [secciones, setSecciones] = useState<Seccion[]>([]);
    const [seccionSeleccionada, setSeccionSeleccionada] = useState<string | null>(null);
    const [materias, setMaterias] = useState<MateriaSeccion[]>([]);
    const [materiaSeleccionada, setMateriaSeleccionada] = useState<string | null>(null);
    const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
    const [estudiantesSeleccionados, setEstudiantesSeleccionados] = useState<Set<string>>(new Set());
    const [fechaInasistencia, setFechaInasistencia] = useState<string>(
        format(new Date(), 'yyyy-MM-dd')
    );
    const [tipoInasistencia, setTipoInasistencia] = useState<'completa' | 'media'>('completa');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Cargar secciones al inicio
    useEffect(() => {
        const fetchSecciones = async () => {
            try {
                const { data, error } = await supabase
                    .from('secciones')
                    .select('*')
                    .eq('activo', true)
                    .order('nombre');

                if (error) throw error;
                setSecciones(data || []);
            } catch (err: any) {
                setError('Error al cargar secciones: ' + err.message);
            }
        };

        fetchSecciones();
    }, []);

    // Cargar materias cuando se selecciona una sección
    useEffect(() => {
        if (seccionSeleccionada) {
            const fetchMaterias = async () => {
                try {
                    setLoading(true);
                    const { data, error } = await supabase
                        .from('materias_por_seccion')
                        .select(`
                            id,
                            id_seccion,
                            materias_por_curso (
                                materias (
                                    id,
                                    nombre
                                )
                            )
                        `)
                        .eq('id_seccion', seccionSeleccionada);

                    if (error) throw error;

                    console.log('Datos recibidos de Supabase:', JSON.stringify(data, null, 2));

                    const materiasFormateadas: MateriaSeccion[] = data?.map((item: any) => ({
                        id: item.id,
                        id_seccion: item.id_seccion,
                        materias_por_curso: {
                            materias: {
                                id: item.materias_por_curso?.materias?.id || '',
                                nombre: item.materias_por_curso?.materias?.nombre || ''
                            }
                        }
                    })) || [];

                    // Ahora usamos los datos transformados
                    setMaterias(materiasFormateadas);
                    setMateriaSeleccionada(null);
                    setEstudiantes([]);
                    setEstudiantesSeleccionados(new Set());
                } catch (err: any) {
                    setError('Error al cargar materias: ' + err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchMaterias();
        }
    }, [seccionSeleccionada]);

    // Cargar estudiantes cuando se selecciona una materia
    useEffect(() => {
        if (materiaSeleccionada) {
            const fetchEstudiantes = async () => {
                try {
                    setLoading(true);

                    // Primero obtener los estudiantes inscritos a esta materia
                    const { data: inscripciones, error: inscripcionesError } = await supabase
                        .from('inscripciones_materias')
                        .select('numero_legajo')
                        .eq('id_materia_seccion', materiaSeleccionada);

                    if (inscripcionesError) throw inscripcionesError;

                    if (!inscripciones || inscripciones.length === 0) {
                        setEstudiantes([]);
                        return;
                    }

                    const legajos = inscripciones.map(i => i.numero_legajo);

                    // Luego obtener los datos de esos estudiantes
                    const { data: estudiantesData, error: estudiantesError } = await supabase
                        .from('estudiantes')
                        .select('numero_legajo, nombre, apellido')
                        .in('numero_legajo', legajos)
                        .order('apellido');

                    if (estudiantesError) throw estudiantesError;
                    setEstudiantes(estudiantesData || []);
                } catch (err: any) {
                    setError('Error al cargar estudiantes: ' + err.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchEstudiantes();
        }
    }, [materiaSeleccionada]);

    // Manejar cambio de estudiante
    const handleEstudianteToggle = (legajo: string) => {
        const newSet = new Set(estudiantesSeleccionados);
        if (newSet.has(legajo)) {
            newSet.delete(legajo);
        } else {
            newSet.add(legajo);
        }
        setEstudiantesSeleccionados(newSet);
    };

    // Guardar inasistencias
    const handleGuardarInasistencias = async () => {
        if (!materiaSeleccionada || estudiantesSeleccionados.size === 0 || !fechaInasistencia) {
            setError('Por favor complete todos los campos requeridos');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setSuccess(null);

            const inasistencias: Inasistencia[] = [];
            estudiantesSeleccionados.forEach(legajo => {
                inasistencias.push({
                    numero_legajo: legajo,
                    id_materia_seccion: materiaSeleccionada,
                    fecha: fechaInasistencia,
                    tipo: tipoInasistencia,
                    justificada: false
                });
            });

            const { error } = await supabase
                .from('inasistencias_estudiantes')
                .insert(inasistencias);

            if (error) throw error;

            setSuccess('Inasistencias registradas correctamente');
            setEstudiantesSeleccionados(new Set());
        } catch (err: any) {
            setError('Error al guardar inasistencias: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle>Registro de Inasistencias</CardTitle>
            </CardHeader>
            <CardContent>
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

                <div className="space-y-4">
                    {/* Selector de Sección */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Sección</label>
                        <Select
                            value={seccionSeleccionada || ""}
                            onValueChange={setSeccionSeleccionada}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione una sección" />
                            </SelectTrigger>
                            <SelectContent>
                                {secciones.map(seccion => (
                                    <SelectItem key={seccion.id} value={seccion.id}>
                                        {seccion.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Selector de Materia */}
                    {seccionSeleccionada && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Materia</label>
                            <Select
                                value={materiaSeleccionada || ""}
                                onValueChange={setMateriaSeleccionada}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccione una materia" />
                                </SelectTrigger>
                                <SelectContent>
                                    {materias.map(materia => (
                                        <SelectItem key={materia.id} value={materia.id}>
                                            {materia.materias_por_curso.materias.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Fecha de inasistencia */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Fecha</label>
                        <input
                            type="date"
                            value={fechaInasistencia}
                            onChange={(e) => setFechaInasistencia(e.target.value)}
                            className="w-full p-2 border rounded"
                        />
                    </div>

                    {/* Tipo de inasistencia */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipo de inasistencia</label>
                        <Select
                            value={tipoInasistencia}
                            onValueChange={(value: 'completa' | 'media') => setTipoInasistencia(value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="completa">Completa (1 falta)</SelectItem>
                                <SelectItem value="media">Media (½ falta)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Lista de estudiantes */}
                    {materiaSeleccionada && estudiantes.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Estudiantes
                            </label>
                            <div className="space-y-2 max-h-80 overflow-y-auto p-2 border rounded">
                                {estudiantes.map(estudiante => (
                                    <div key={estudiante.numero_legajo} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`estudiante-${estudiante.numero_legajo}`}
                                            checked={estudiantesSeleccionados.has(estudiante.numero_legajo)}
                                            onCheckedChange={() => handleEstudianteToggle(estudiante.numero_legajo)}
                                        />
                                        <label
                                            htmlFor={`estudiante-${estudiante.numero_legajo}`}
                                            className="text-sm"
                                        >
                                            {estudiante.apellido}, {estudiante.nombre} (Legajo: {estudiante.numero_legajo})
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {materiaSeleccionada && estudiantes.length === 0 && (
                        <Alert>
                            <AlertDescription>
                                No hay estudiantes inscritos en esta materia.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Botón de guardar */}
                    {materiaSeleccionada && estudiantes.length > 0 && (
                        <Button
                            className="w-full"
                            onClick={handleGuardarInasistencias}
                            disabled={loading || estudiantesSeleccionados.size === 0}
                        >
                            {loading ? "Guardando..." : "Registrar Inasistencias"}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
