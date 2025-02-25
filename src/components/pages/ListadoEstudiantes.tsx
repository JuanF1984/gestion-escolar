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
import {
    Dialog,
    DialogContent,

} from "@/components/ui/dialog"
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2 } from "lucide-react";
import { EnrollmentType } from '@/types';
import {
    StudentDB,
    SeccionDB,
    InscripcionDB,
    StudentResumen
} from '@/types/estudiantes';

export const ListadoEstudiantes: React.FC = () => {
    const [students, setStudents] = useState<StudentResumen[]>([]);
    const [sections, setSections] = useState<SeccionDB[]>([]);
    const [selectedSection, setSelectedSection] = useState<string>('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const [showMateriasModal, setShowMateriasModal] = useState(false);
    const [showInscriptionModal, setShowInscriptionModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentResumen | null>(null);

    const handleCloseModals = () => {
        setShowMateriasModal(false);
        setShowInscriptionModal(false);
        setSelectedStudent(null);
    };

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
            setSections(data as SeccionDB[] || []);
        } catch (err) {
            setError('Error al cargar secciones');
            console.error(err);
        }
    };

    const obtenerResumenEstudiante = async (legajo: string) => {
        const { data: inscripcionesData, error } = await supabase
            .from('inscripciones_materias')
            .select(`
                id,
                año_cursada,
                estado,
                materias_por_seccion (
                    id,
                    secciones (
                        id,
                        nombre
                    )
                )
            `)
            .eq('numero_legajo', legajo);

        if (error) throw error;

        if (!inscripcionesData) throw new Error('No se encontraron datos');

        const inscripciones = (inscripcionesData as unknown) as InscripcionDB[];

        // Agrupar por estado, año y sección
        const resumenPorEstado = inscripciones.reduce<Record<EnrollmentType, Record<number, { total: number; porSeccion: Record<string, number> }>>>((acc, inscripcion) => {
            const estado = inscripcion.estado;
            const año = inscripcion.año_cursada;
            const seccion = inscripcion.materias_por_seccion.secciones.nombre;

            if (!acc[estado]) {
                acc[estado] = {};
            }
            if (!acc[estado][año]) {
                acc[estado][año] = { total: 0, porSeccion: {} };
            }
            acc[estado][año].total++;

            if (!acc[estado][año].porSeccion[seccion]) {
                acc[estado][año].porSeccion[seccion] = 0;
            }
            acc[estado][año].porSeccion[seccion]++;

            return acc;
        }, {} as Record<EnrollmentType, Record<number, { total: number; porSeccion: Record<string, number> }>>);

        // Determinar sección actual
        const inscripcionesCursando = inscripciones.filter(i => i.estado === 'cursando');
        const añoActual = inscripcionesCursando.length > 0
            ? Math.max(...inscripcionesCursando.map(i => i.año_cursada))
            : 0;

        const materiasPorSeccion = inscripcionesCursando
            .filter(i => i.año_cursada === añoActual)
            .reduce<Record<string, number>>((acc, i) => {
                const seccion = i.materias_por_seccion.secciones.nombre;
                if (!acc[seccion]) acc[seccion] = 0;
                acc[seccion]++;
                return acc;
            }, {});

        const seccionMayorMaterias = Object.entries(materiasPorSeccion)
            .sort(([, a], [, b]) => b - a)[0];

        return {
            seccionActual: seccionMayorMaterias ? {
                nombre: seccionMayorMaterias[0],
                año: añoActual,
                cantidadMaterias: seccionMayorMaterias[1]
            } : null,
            materiasPorEstado: {
                aprobadas: Object.values(resumenPorEstado.aprobada || {})
                    .reduce((a, b) => a + b.total, 0) || 0,
                cursando: Object.values(resumenPorEstado.cursando || {})
                    .reduce((a, b) => a + b.total, 0) || 0,
                adeuda: Object.entries(resumenPorEstado.adeuda || {})
                    .map(([año, data]) => ({
                        año: parseInt(año),
                        cantidad: data.total,
                        porSeccion: Object.entries(data.porSeccion)
                            .map(([seccion, cantidad]) => ({ seccion, cantidad }))
                    })),
                recursando: Object.entries(resumenPorEstado.recursa || {})
                    .map(([año, data]) => ({
                        año: parseInt(año),
                        cantidad: data.total,
                        porSeccion: Object.entries(data.porSeccion)
                            .map(([seccion, cantidad]) => ({ seccion, cantidad }))
                    }))
            }
        };
    };

    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError(null);

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
                const { data: inscripciones } = await supabase
                    .from('inscripciones_materias')
                    .select('numero_legajo, materias_por_seccion!inner(id_seccion)')
                    .eq('materias_por_seccion.id_seccion', selectedSection)
                    .eq('estado', 'cursando');

                if (inscripciones) {
                    const legajos = [...new Set(inscripciones.map(item => item.numero_legajo))];
                    query = query.in('numero_legajo', legajos);
                }
            }

            const { data: studentsData, error } = await query;
            if (error) throw error;

            const students = studentsData as StudentDB[];

            // Obtener resumen para cada estudiante
            const studentsWithSummary = await Promise.all(
                students.map(async (student) => {
                    const resumen = await obtenerResumenEstudiante(student.numero_legajo);
                    return { ...student, resumen } as StudentResumen;
                })
            );

            setStudents(studentsWithSummary);
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
                                    <SelectItem key={section.id} value={section.id}>
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
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-medium">
                                                    {student.apellido}, {student.nombre}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Legajo: {student.numero_legajo}
                                                </p>
                                                {student.resumen?.seccionActual && (
                                                    <p className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded-md inline-block">
                                                        Cursando: {student.resumen.seccionActual.nombre} ({student.resumen.seccionActual.año})
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                onClick={() => {
                                                    setSelectedStudent(student);
                                                    if (student.resumen?.seccionActual) {
                                                        setShowMateriasModal(true);
                                                    } else {
                                                        setShowInscriptionModal(true);
                                                    }
                                                }}
                                                variant={student.resumen?.seccionActual ? "secondary" : "default"}
                                            >
                                                {student.resumen?.seccionActual ? "Ver Materias Adeudadas" : "Inscribir a Materias"}
                                            </Button>
                                        </div>

                                        {student.resumen && (
                                            <div className="text-sm space-y-1 border-t pt-3">
                                                {student.resumen.materiasPorEstado.adeuda.length > 0 && (
                                                    <p className="text-red-600">
                                                        Adeuda:{' '}
                                                        {student.resumen.materiasPorEstado.adeuda.map((a, index) => (
                                                            <span key={`${a.año}-${index}`}>
                                                                {index > 0 && ', '}
                                                                {a.porSeccion.map((sec, secIndex) => (
                                                                    <span key={`${a.año}-${sec.seccion}-${secIndex}`}>
                                                                        {secIndex > 0 && ', '}
                                                                        {sec.cantidad} de {sec.seccion} ({a.año})
                                                                    </span>
                                                                ))}
                                                            </span>
                                                        ))}
                                                    </p>
                                                )}

                                                {student.resumen.materiasPorEstado.recursando.length > 0 && (
                                                    <p className="text-orange-600">
                                                        Recursando:{' '}
                                                        {student.resumen.materiasPorEstado.recursando.map((r, index) => (
                                                            <span key={`${r.año}-${index}`}>
                                                                {index > 0 && ', '}
                                                                {r.porSeccion.map((sec, secIndex) => (
                                                                    <span key={`${r.año}-${sec.seccion}-${secIndex}`}>
                                                                        {secIndex > 0 && ', '}
                                                                        {sec.cantidad} de {sec.seccion} ({r.año})
                                                                    </span>
                                                                ))}
                                                            </span>
                                                        ))}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showMateriasModal} onOpenChange={setShowMateriasModal}>
                <DialogContent className="max-h-[90vh] w-[90vw] max-w-2xl overflow-y-auto">
                    {selectedStudent && (
                        <MateriasCursadas
                            numeroLegajo={selectedStudent.numero_legajo}
                            onClose={handleCloseModals}
                            estadosFiltrar={['recursa', 'adeuda']}
                            titulo="Materias Adeudadas y Recursando"
                            hideCloseButton
                        />
                    )}
                </DialogContent>
            </Dialog>

            <Dialog open={showInscriptionModal} onOpenChange={setShowInscriptionModal}>
                <DialogContent className="max-h-[90vh] w-[90vw] max-w-2xl overflow-y-auto">
                    {selectedStudent && (
                        <InscripcionMaterias
                            numeroLegajo={selectedStudent.numero_legajo}
                            onSave={async (inscripciones) => {
                                await handleInscription(inscripciones);
                                handleCloseModals();
                            }}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};