import React, { useEffect, useState } from 'react';
import supabase from '@/utils/supabase';
import { InscripcionMaterias } from '../Inscripcion-Materias/InscripcionMaterias';
import { MateriasCursadas } from '../MateriasCursadas';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2 } from "lucide-react";

interface Section {
    id: number;
    nombre: string;
    activo: boolean;
}

interface SeccionInfo {
    nombre: string;
  }

interface MateriasPorSeccion {
    id_seccion: number;
    secciones: {
        id: number;
        nombre: string;
    };
}

interface Inscripcion {
    numero_legajo: string;
    materias_por_seccion: MateriasPorSeccion;
}

interface Student {
    numero_legajo: string;
    nombre: string;
    apellido: string;
    activo: boolean;
    seccion?: SeccionInfo | null;
}

export const ListadoEstudiantes: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<string>('all');
    const [showMaterias, setShowMaterias] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showInscription, setShowInscription] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    useEffect(() => {
        fetchSections();
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [selectedSection]);

    const fetchSections = async () => {
        try {
            const { data, error } = await supabase
                .from('secciones')
                .select('*')
                .eq('activo', true)
                .order('nombre');

            if (error) throw error;
            setSections(data || []);
        } catch (err) {
            setError('Error al cargar secciones');
            console.error(err);
        }
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError(null);

            // Primero, obtenemos todas las inscripciones para conocer la sección de cada estudiante
            const { data: inscripciones, error: inscripcionesError } = await supabase
                .from('inscripciones_materias')
                .select(`
                    numero_legajo,
                    materias_por_seccion!inner (
                        id_seccion,
                        secciones (
                            id,
                            nombre
                        )
                    )
                `) as { data: Inscripcion[], error: any };

            if (inscripcionesError) throw inscripcionesError;

            // Agrupar materias por estudiante y por sección
            const estudiantesSecciones = inscripciones.reduce<{ [key: string]: { [seccion: string]: number } }>((acc, curr) => {
                const { numero_legajo, materias_por_seccion } = curr;
                const seccionNombre = materias_por_seccion.secciones.nombre;

                if (!acc[numero_legajo]) acc[numero_legajo] = {};
                acc[numero_legajo][seccionNombre] = (acc[numero_legajo][seccionNombre] || 0) + 1;

                return acc;
            }, {});

            // Determinar la sección predominante
            const determinarSeccionPrincipal = (secciones: { [seccion: string]: number }) => {
                return Object.entries(secciones)
                    .sort((a, b) => b[1] - a[1] || parseInt(b[0]) - parseInt(a[0]))[0][0]; // Mayor cantidad o número más alto
            };
            let query = supabase
                .from('estudiantes')
                .select(`
                    numero_legajo,
                    nombre,
                    apellido,
                    activo
                `)
                .eq('activo', true)
                .order('apellido');

            if (selectedSection !== 'all') {
                const legajos = Object.entries(estudiantesSecciones)
                    .filter(([_, seccion]) => seccion.id.toString() === selectedSection)
                    .map(([legajo]) => legajo);
                query = query.in('numero_legajo', legajos);
            }

            const { data, error } = await query;

            if (error) throw error;

           // Agregar la sección principal a cada estudiante
        const studentsWithSections = data.map(student => {
            const secciones = estudiantesSecciones[student.numero_legajo] || {};
            const seccionPredominante = Object.keys(secciones).length ? determinarSeccionPrincipal(secciones) : null;
            
            return {
                ...student,
                seccion: seccionPredominante ? { nombre: seccionPredominante } : null
            };
        });

        setStudents(studentsWithSections);
        } catch (err) {
            setError('Error al cargar estudiantes');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInscription = async (inscripciones: any[]) => {
        try {
            setError(null);
            setSuccess(null);

            const { error } = await supabase
                .from('inscripciones_materias')
                .insert(inscripciones);

            if (error) throw error;

            setSuccess('Inscripciones guardadas exitosamente');
            setTimeout(() => setSuccess(null), 3000);

            setShowInscription(false);
            setSelectedStudent(null);
            fetchStudents();
        } catch (err: any) {
            setError(err.message || 'Error al guardar inscripciones');
            console.error(err);
        }
    };

    return (
        <div className="space-y-6 p-4">
            <Card>
                <CardHeader>
                    <CardTitle>Listado de Estudiantes</CardTitle>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {success && (
                        <Alert className="mb-4 border-green-200 bg-green-50">
                            <AlertDescription className="text-green-800">{success}</AlertDescription>
                        </Alert>
                    )}

                    <div className="mb-4">
                        <Select
                            value={selectedSection}
                            onValueChange={(value) => setSelectedSection(value)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Seleccionar Sección" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las secciones</SelectItem>
                                {sections.map((section) => (
                                    <SelectItem key={section.id} value={section.id.toString()}>
                                        {section.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                        </div>
                    ) : students.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No hay estudiantes {selectedSection !== 'all' ? 'en esta sección' : ''} aún
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {students.map((student) => (
                                <Card key={student.numero_legajo} className="p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="font-medium">
                                                {student.apellido}, {student.nombre}
                                            </h3>
                                            <div className="space-y-1">
                                                <p className="text-sm text-gray-500">
                                                    Legajo: {student.numero_legajo}
                                                </p>
                                                {student.seccion && (
                                                    <p className="text-sm text-green-600 font-medium">
                                                        Sección: {student.seccion.nombre}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                if (student.seccion) {
                                                    setShowMaterias(true);
                                                    setShowInscription(false);
                                                } else {
                                                    setShowInscription(true);
                                                    setShowMaterias(false);
                                                }
                                            }}
                                            variant={student.seccion ? "secondary" : "default"}
                                        >
                                            {student.seccion ? "Ver Materias" : "Inscribir a Materias"}
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {showMaterias && selectedStudent && (
                <Card>
                    <CardContent className="pt-6">
                        <MateriasCursadas
                            numeroLegajo={selectedStudent.numero_legajo}
                            onClose={() => {
                                setShowMaterias(false);
                                setSelectedStudent(null);
                            }}
                        />
                    </CardContent>
                </Card>
            )}

            {showInscription && selectedStudent && (
                <Card>
                    <CardContent className="pt-6">
                        <InscripcionMaterias
                            numeroLegajo={selectedStudent.numero_legajo}
                            onSave={handleInscription}
                        />
                    </CardContent>
                </Card>
            )}
        </div>
    );
};