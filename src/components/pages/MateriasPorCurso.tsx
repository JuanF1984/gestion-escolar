import { useState, useEffect } from 'react';
import supabase from '../../utils/supabase';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';


interface Curso {
    id: number;
    nombre: string;
    activo: boolean;
    cantidad_secciones: number;
}

interface Materia {
    id: number;
    nombre: string;
    activa: boolean;
}

interface Seccion {
    id: number;
    id_curso: number;
}

interface MateriaPorCurso {
    id: number;
    id_materia: number;
    id_curso: number;
    activa: boolean;
}

export const MateriasPorCurso = () => {
    const [cursos, setCursos] = useState<Curso[]>([]);
    const [materias, setMaterias] = useState<Materia[]>([]);
    const [cursoSeleccionado, setCursoSeleccionado] = useState<string | null>(null);
    const [materiasSeleccionadas, setMateriasSeleccionadas] = useState<number[]>([]);
    const [secciones, setSecciones] = useState<Seccion[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        cargarCursos();
    }, []);

    useEffect(() => {
        if (cursoSeleccionado) {
            cargarMaterias();
            cargarSecciones();
        }
    }, [cursoSeleccionado]);

    const cargarCursos = async (): Promise<void> => {
        try {
            const { data, error } = await supabase
                .from('cursos')
                .select('*')
                .eq('activo', true);

            if (error) throw error;
            setCursos(data || []);
        } catch (error) {
            setError('Error al cargar los cursos');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const cargarMaterias = async (): Promise<void> => {
        try {
            const { data, error } = await supabase
                .from('materias')
                .select('*')
                .eq('activa', true);

            if (error) throw error;
            setMaterias(data || []);
        } catch (error) {
            setError('Error al cargar las materias');
            console.error(error);
        }
    };

    const cargarSecciones = async (): Promise<void> => {
        if (!cursoSeleccionado) return;

        try {
            const { data, error } = await supabase
                .from('secciones')
                .select('*')
                .eq('id_curso', cursoSeleccionado);

            if (error) throw error;
            setSecciones(data || []);
        } catch (error) {
            setError('Error al cargar las secciones');
            console.error(error);
        }
    };

    const handleMateriaChange = (materiaId: number, checked: boolean) => {
        setMateriasSeleccionadas(prev =>
            checked
                ? [...prev, materiaId]
                : prev.filter(id => id !== materiaId)
        );
    };

    const guardarMateriasPorCurso = async (): Promise<void> => {
        if (!cursoSeleccionado) return;

        try {
            // Guardamos en materias_por_curso
            const materiasPorCursoPromises = materiasSeleccionadas.map(async (idMateria) => {
                const { data, error } = await supabase
                    .from('materias_por_curso')
                    .insert([{
                        id_materia: idMateria,
                        id_curso: cursoSeleccionado
                    }])
                    .select();

                if (error) throw error;
                return data[0] as MateriaPorCurso;
            });

            const materiasPorCursoResults = await Promise.all(materiasPorCursoPromises);

            // Si hay secciones, guardamos en materias_por_seccion
            if (secciones.length > 0) {
                const seccionPromises = materiasPorCursoResults.flatMap((materiaPorCurso) =>
                    secciones.map((seccion) =>
                        supabase
                            .from('materias_por_seccion')
                            .insert([{
                                id_materia_curso: materiaPorCurso.id,
                                id_seccion: seccion.id
                            }])
                    )
                );

                await Promise.all(seccionPromises);
            } else {
                console.warn('No hay secciones disponibles para este curso');
            }

            setMateriasSeleccionadas([]);
            setError(null)
            alert('Materias guardadas exitosamente');
        } catch (error) {
            setError('Error al guardar las materias');
            console.error(error);
        }
    };

    if (loading) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardContent className="p-6">
                    <p>Cargando...</p>
                </CardContent>
            </Card>
        );
    }

    if (cursos.length === 0) {
        return (
            <Card className="w-full max-w-2xl mx-auto">
                <CardContent className="p-6">
                    <Alert>
                        <AlertDescription>
                            No hay cursos activos disponibles.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Asignación de Materias por Curso</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                {error && (
                    <Alert className="mb-4 bg-red-100 text-red-800 border border-red-500">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Seleccionar Curso
                        </label>
                        <Select
                            onValueChange={(value: string) => {
                                if (value) {
                                    setError(null)
                                    setMateriasSeleccionadas([]);
                                    setCursoSeleccionado(value)
                                }
                            }}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccione un curso" />
                            </SelectTrigger>
                            <SelectContent>
                                {cursos.map((curso) => (
                                    <SelectItem
                                        key={curso.id}
                                        value={curso.id.toString()}
                                    >
                                        {curso.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {cursoSeleccionado && (
                        <>
                            <div>
                                <h3 className="text-lg font-medium mb-2">Materias Disponibles</h3>
                                {materias.length > 0 ? (
                                    <div className="space-y-2">
                                        {materias.map((materia) => (
                                            <div key={materia.id} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`materia-${materia.id}`}
                                                    checked={materiasSeleccionadas.includes(materia.id)}
                                                    onCheckedChange={(checked) =>
                                                        handleMateriaChange(materia.id, checked as boolean)
                                                    }
                                                />
                                                <label htmlFor={`materia-${materia.id}`}>
                                                    {materia.nombre}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p>No hay materias activas disponibles</p>
                                )}
                            </div>

                            {secciones.length === 0 && (
                                <Alert>
                                    <AlertDescription>
                                        Este curso no tiene secciones asignadas. Las materias se guardarán solo para el curso.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {materiasSeleccionadas.length > 0 && (
                                <Button className="w-full text-left p-2 bg-green-500 text-white rounded hover:bg-green-600" onClick={guardarMateriasPorCurso}>
                                    Guardar Materias
                                </Button>
                            )}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );

}
