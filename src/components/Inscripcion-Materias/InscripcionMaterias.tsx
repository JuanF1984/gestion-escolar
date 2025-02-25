import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import supabase from '@/utils/supabase';

import { SubjectEnrollment, Section, Subject, EnrollmentType } from '../../types';

import { SubjectSelectionSection } from './SubjectSelectionSection';


export interface InscripcionMateriasProps {
    numeroLegajo: string;
    onSave: (inscripciones: SubjectEnrollment[]) => Promise<void>;
}

export const InscripcionMaterias: React.FC<InscripcionMateriasProps> = ({
    numeroLegajo,
    onSave,
}) => {
    const [sections, setSections] = useState<Section[]>([]);
    const [showPendientes, setShowPendientes] = useState(false);
    const [showRecursada, setShowRecursada] = useState(false);
    const [showAprobadas, setShowAprobadas] = useState(false);
    const [enrollments, setEnrollments] = useState<SubjectEnrollment[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [completedSelections, setCompletedSelections] = useState<Set<EnrollmentType>>(new Set());

    useEffect(() => {
        fetchSections();
    }, []);

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

    const handleSubjectsSelected = (subjects: Subject[], year: number, tipo: EnrollmentType) => {
        // Primero filtramos las inscripciones existentes, removiendo las del mismo tipo
        const filteredEnrollments = enrollments.filter(enroll => enroll.estado !== tipo);

        // Creamos las nuevas inscripciones
        const newEnrollments = subjects.map(subject => ({
            numero_legajo: numeroLegajo,
            id_materia_seccion: subject.id_materia_seccion,
            año_cursada: year,
            intento: tipo === 'recursa' ? 2 : 1,
            estado: tipo
        }));

        // Combinamos las inscripciones filtradas con las nuevas
        setEnrollments([...filteredEnrollments, ...newEnrollments]);
        setCompletedSelections(prev => new Set(prev).add(tipo));
    };

    const isPendingSelection = () => {
        return (
            (showPendientes && !completedSelections.has('adeuda')) ||
            (showRecursada && !completedSelections.has('recursa')) ||
            (showAprobadas && !completedSelections.has('aprobada'))
        );
    };

    const handleShowPendientes = (checked: boolean) => {
        setShowPendientes(checked);
        if (checked) {
            setCompletedSelections(prev => {
                const newSet = new Set(prev);
                newSet.delete('adeuda');
                return newSet;
            });
        }
    };

    const handleShowRecursada = (checked: boolean) => {
        setShowRecursada(checked);
        if (checked) {
            setCompletedSelections(prev => {
                const newSet = new Set(prev);
                newSet.delete('recursa');
                return newSet;
            });
        }
    };

    const handleShowAprobadas = (checked: boolean) => {
        setShowAprobadas(checked);
        if (checked) {
            setCompletedSelections(prev => {
                const newSet = new Set(prev);
                newSet.delete('aprobada');
                return newSet;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onSave(enrollments);
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

            <form onSubmit={handleSubmit} className="space-y-6">
                <SubjectSelectionSection
                    title="Materias a Cursar"
                    tipo="cursando"
                    sections={sections}
                    onSubjectsSelected={handleSubjectsSelected}
                    preSelectAll={true}
                />

                <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={showRecursada}
                                onChange={(e) => handleShowRecursada(e.target.checked)}
                                className="rounded"
                            />
                            <span>¿Recursa materias?</span>
                        </label>

                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={showPendientes}
                                onChange={(e) => handleShowPendientes(e.target.checked)}
                                className="rounded"
                            />
                            <span>¿Adeuda materias?</span>
                        </label>

                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={showAprobadas}
                                onChange={(e) => handleShowAprobadas(e.target.checked)}
                                className="rounded"
                            />
                            <span>¿Tiene materias aprobadas?</span>
                        </label>
                    </div>

                    {showRecursada && (
                        <SubjectSelectionSection
                            title="Materias a Recursar"
                            tipo="recursa"
                            sections={sections}
                            onSubjectsSelected={handleSubjectsSelected}
                            showAddMore
                        />
                    )}

                    {showPendientes && (
                        <SubjectSelectionSection
                            title="Materias Pendientes"
                            tipo="adeuda"
                            sections={sections}
                            onSubjectsSelected={handleSubjectsSelected}
                            showAddMore
                        />
                    )}

                    {showAprobadas && (
                        <SubjectSelectionSection
                            title="Materias Aprobadas"
                            tipo="aprobada"
                            sections={sections}
                            onSubjectsSelected={handleSubjectsSelected}
                            showAddMore
                        />
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
                    disabled={enrollments.length === 0 || isPendingSelection()}
                >
                    {isPendingSelection() ? 'Complete la selección de materias' : 'Guardar Inscripción'}
                </button>
            </form>
        </div>
    );
};