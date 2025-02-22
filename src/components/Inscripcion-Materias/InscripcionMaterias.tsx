import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import supabase from '@/utils/supabase';

import { SubjectEnrollment, Section, Subject, MateriaPorSeccion } from './types';
import { SectionSelector } from './SectionSelector';
import { SubjectsList } from './SubjectsList';
import { RetakingSection } from './RetakingSection';
import { PendingSection } from './PendingSection';


export interface InscripcionMateriasProps {
    numeroLegajo: string;
    onSave: (inscripciones: SubjectEnrollment[]) => Promise<void>;
}

export const InscripcionMaterias: React.FC<InscripcionMateriasProps> = ({
    numeroLegajo,
    onSave
}) => {// States
    const [sections, setSections] = useState<Section[]>([]);
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
    const [isRetaking, setIsRetaking] = useState(false);
    const [hasPending, setHasPending] = useState(false);
    const [retakeYear] = useState<number>(new Date().getFullYear());
    const [retakeSubjects, setRetakeSubjects] = useState<Subject[]>([]);
    const [selectedRetakeSubjects, setSelectedRetakeSubjects] = useState<Set<string>>(new Set());
    const [pendingSubjects, setPendingSubjects] = useState<Subject[]>([]);
    const [selectedPendingSubjects, setSelectedPendingSubjects] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch sections on component mount
    useEffect(() => {
        fetchSections();
    }, []);

    // Fetch subjects when section is selected
    useEffect(() => {
        if (selectedSection) {
            fetchSubjectsForSection(selectedSection);
        }
    }, [selectedSection]);

    const fetchSections = async () => {
        try {
            const { data, error } = await supabase
                .from('secciones')
                .select('*')
                .eq('activo', true);

            if (error) throw error;
            setSections(data || []);
        } catch (err) {
            setError('Error al cargar secciones');
            console.error(err);
        }
    };

    const fetchSubjectsForSection = async (sectionId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('materias_por_seccion')
                .select(`
                    id,
                    materias_por_curso (
                        id,
                        materias (
                            id,
                            nombre,
                            activa
                        )
                    )
                `)
                .eq('id_seccion', sectionId);

            if (error) throw error;

            // Verificamos que los datos tengan la estructura correcta
            const materiasData = data as unknown as MateriaPorSeccion[];

            // Validamos la estructura de los datos
            const isValidData = materiasData?.every(item =>
                item?.materias_por_curso?.materias?.id &&
                item?.materias_por_curso?.materias?.nombre &&
                typeof item?.materias_por_curso?.materias?.activa === 'boolean'
            );

            if (!isValidData) {
                throw new Error('La estructura de los datos no es válida');
            }

            // Transformamos los datos
            const transformedSubjects = materiasData?.map(item => ({
                id: item.materias_por_curso.materias.id,
                nombre: item.materias_por_curso.materias.nombre,
                activo: item.materias_por_curso.materias.activa,
                id_materia_seccion: item.id
            })) || [];

            setSubjects(transformedSubjects);
            // By default, select all subjects
            setSelectedSubjects(new Set(transformedSubjects.map(s => s.id)));
        } catch (err) {
            setError('Error al cargar materias');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const sectionId = e.target.value; 
        setSelectedSection(sectionId);
        setSelectedSubjects(new Set());
    };

    const handleSubjectToggle = (subjectId: string) => {
        const newSelected = new Set(selectedSubjects);
        if (newSelected.has(subjectId)) {
            newSelected.delete(subjectId);
        } else {
            newSelected.add(subjectId);
        }
        setSelectedSubjects(newSelected);
    };

    // Función para cargar materias disponibles para adeudadas
    const fetchAvailableSubjects = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('materias_por_seccion')
                .select(`
                    id,
                    materias_por_curso (
                        id,
                        materias (
                            id,
                            nombre,
                            activa
                        )
                    )
                `);

            if (error) throw error;

            const materiasData = data as unknown as MateriaPorSeccion[];
            const transformedSubjects = materiasData?.map(item => ({
                id: item.materias_por_curso.materias.id,
                nombre: item.materias_por_curso.materias.nombre,
                activo: item.materias_por_curso.materias.activa,
                id_materia_seccion: item.id
            })) || [];

            return transformedSubjects;
        } catch (err) {
            console.error('Error al cargar materias disponibles:', err);
            setError('Error al cargar materias disponibles');
            return [];
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isRetaking) {
            fetchAvailableSubjects().then(subjects => {
                setRetakeSubjects(subjects);
            });
        }
    }, [isRetaking]);

    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        if (hasPending) {
            fetchAvailableSubjects().then(subjects => {
                setPendingSubjects(subjects);
            });
        }
    }, [hasPending]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSection) return;

        const inscripciones: SubjectEnrollment[] = [];

        // Process regular enrollments
        subjects.forEach(subject => {
            if (selectedSubjects.has(subject.id)) {
                inscripciones.push({
                    numero_legajo: numeroLegajo,
                    id_materia_seccion: subject.id_materia_seccion,
                    año_cursada: new Date().getFullYear(),
                    intento: 1,
                    estado: 'cursando'
                });
            }
        });

        // Process retaking subjects
        if (isRetaking) {
            retakeSubjects.forEach(subject => {
                if (selectedRetakeSubjects.has(subject.id)) {
                    inscripciones.push({
                        numero_legajo: numeroLegajo,
                        id_materia_seccion: subject.id_materia_seccion,
                        año_cursada: retakeYear,
                        intento: 2,
                        estado: 'recursa'
                    });
                }
            });
        }

        // Process pending subjects
        if (hasPending) {
            pendingSubjects.forEach(subject => {
                if (selectedPendingSubjects.has(subject.id)) {
                    inscripciones.push({
                        numero_legajo: numeroLegajo,
                        id_materia_seccion: subject.id_materia_seccion,
                        año_cursada: subject.año_cursada || new Date().getFullYear(),
                        intento: 1,
                        estado: 'adeuda'
                    });
                }
            });
        }

        try {
            await onSave(inscripciones);
        } catch (err) {
            setError('Error al guardar inscripciones');
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Inscripción a Materias</h2>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <SectionSelector
                    sections={sections}
                    selectedSection={selectedSection}
                    onSectionChange={handleSectionChange}
                />

                {selectedSection && (
                    <SubjectsList
                        subjects={subjects}
                        selectedSubjects={selectedSubjects}
                        onSubjectToggle={handleSubjectToggle}
                        title="Materias a Cursar"
                    />
                )}

                <RetakingSection
                    isRetaking={isRetaking}
                    onRetakingChange={setIsRetaking}
                    retakeSubjects={retakeSubjects}
                    selectedRetakeSubjects={selectedRetakeSubjects}
                    onRetakeSubjectToggle={(id) => {
                        const newSelected = new Set(selectedRetakeSubjects);
                        if (newSelected.has(id)) {
                            newSelected.delete(id);
                        } else {
                            newSelected.add(id);
                        }
                        setSelectedRetakeSubjects(newSelected);
                    }}
                />

                <PendingSection
                    hasPending={hasPending}
                    onPendingChange={setHasPending}
                    selectedYear={selectedYear}
                    onYearChange={setSelectedYear}
                    pendingSubjects={pendingSubjects}
                    selectedPendingSubjects={selectedPendingSubjects}
                    onPendingSubjectToggle={(id) => {
                        const newSelected = new Set(selectedPendingSubjects);
                        if (newSelected.has(id)) {
                            newSelected.delete(id);
                        } else {
                            newSelected.add(id);
                        }
                        setSelectedPendingSubjects(newSelected);
                    }}
                />

                <button
                    type="submit"
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
                    disabled={loading || !selectedSection}
                >
                    {loading ? 'Guardando...' : 'Guardar Inscripción'}
                </button>
            </form>
        </div>
    );
};