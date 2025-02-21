import React, { useEffect, useState } from 'react';
import supabase from '@/utils/supabase';
import { InscripcionMaterias } from '../InscripcionMaterias';
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

interface Student {
    numero_legajo: string;
    nombre: string;
    apellido: string;
    activo: boolean;
}

interface Section {
    id: number;
    nombre: string;
    activo: boolean;
}

export const ListadoEstudiantes: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<string>('all');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showInscription, setShowInscription] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // Fetch sections on component mount
    useEffect(() => {
        fetchSections();
    }, []);

    // Fetch students when section selection changes
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
                const { data: inscripciones, error } = await supabase
                    .from('inscripciones_materias')
                    .select('numero_legajo, materias_por_seccion!inner(id_seccion)')
                    .eq('materias_por_seccion.id_seccion', selectedSection);

                if (error) {
                    console.error(error);
                    return;
                }

                const legajos = [...new Set(inscripciones.map(item => item.numero_legajo))];
                query = query.in('numero_legajo', legajos);
            }

            const { data, error } = await query;

            if (error) throw error;
            setStudents(data || []);
        } catch (err) {
            setError('Error al cargar estudiantes');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleInscription = async (inscripciones: any[]) => {
        try {
            const { error } = await supabase
                .from('inscripciones_materias')
                .insert(inscripciones);

            if (error) throw error;

            setShowInscription(false);
            setSelectedStudent(null);
            fetchStudents(); // Refresh the list
        } catch (err) {
            setError('Error al guardar inscripciones');
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
                        <div className="text-center py-4">Cargando estudiantes...</div>
                    ) : students.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
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
                                            <p className="text-sm text-gray-500">
                                                Legajo: {student.numero_legajo}
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => {
                                                setSelectedStudent(student);
                                                setShowInscription(true);
                                            }}
                                        >
                                            Inscribir a Materias
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

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