import { useState, useEffect } from "react";
import supabase from "@/utils/supabase";
import { EnrollmentType, Section, Subject, MateriaPorSeccion } from "@/types";
import { Alert, AlertDescription } from "../ui/alert";

export interface SubjectSelectionSectionProps {
    title: string;
    tipo: EnrollmentType;
    sections: Section[];
    onSubjectsSelected: (subjects: Subject[], year: number, tipo: EnrollmentType) => void;
    showAddMore?: boolean;
    preSelectAll?: boolean;
}

export const SubjectSelectionSection: React.FC<SubjectSelectionSectionProps> = ({
    title,
    tipo,
    sections,
    onSubjectsSelected,
    showAddMore = false,
    preSelectAll = false
}) => {
    const [selectedSection, setSelectedSection] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [subjects, setSubjects] = useState<Subject[]>([]);
    const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAnotherYear, setShowAnotherYear] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);

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

            const materiasData = data as unknown as MateriaPorSeccion[];
            const transformedSubjects = materiasData?.map(item => ({
                id: item.materias_por_curso.materias.id,
                nombre: item.materias_por_curso.materias.nombre,
                activo: item.materias_por_curso.materias.activa,
                id_materia_seccion: item.id
            })) || [];

            setSubjects(transformedSubjects);
            if (preSelectAll) {
                setSelectedSubjects(new Set(transformedSubjects.map(s => s.id)));
            }
        } catch (err) {
            setError('Error al cargar materias');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedSection) {
            fetchSubjectsForSection(selectedSection);
        }
    }, [selectedSection]);

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

    const handleConfirm = () => {
        if (!isConfirmed) {
            const selectedSubjectsList = subjects.filter(subject =>
                selectedSubjects.has(subject.id)
            );
            onSubjectsSelected(selectedSubjectsList, selectedYear, tipo);
            if (showAnotherYear) {
                setSelectedSection(null);
                setSelectedSubjects(new Set());
                setSelectedYear(prev => prev - 1);
            }
            setIsConfirmed(true);
        } else {
            setIsConfirmed(false);
        }
    };

    return (
        <div className="space-y-4 border rounded p-4">
            <h3 className="text-lg font-semibold">{title}</h3>

            <div>
                <label className="block font-medium mb-2">Año</label>
                <select
                    className="w-full p-2 border rounded disabled:bg-gray-100"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    disabled={isConfirmed}
                >
                    {Array.from(
                        { length: 5 },
                        (_, i) => new Date().getFullYear() - i
                    ).map(year => (
                        <option key={year} value={year}>
                            {year}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="block font-medium mb-2">Sección</label>
                <select
                    className="w-full p-2 border rounded disabled:bg-gray-100"
                    onChange={handleSectionChange}
                    value={selectedSection || ''}
                    disabled={isConfirmed}
                >
                    <option value="">Seleccione una sección</option>
                    {sections.map(section => (
                        <option key={section.id} value={section.id}>
                            {section.nombre}
                        </option>
                    ))}
                </select>
            </div>

            {selectedSection && subjects.length > 0 && (
                <div className="space-y-2">
                    <label className="block font-medium mb-2">Materias</label>
                    {subjects.map(subject => (
                        <div key={subject.id} className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={selectedSubjects.has(subject.id)}
                                onChange={() => handleSubjectToggle(subject.id)}
                                className="rounded disabled:opacity-50"
                                disabled={isConfirmed}
                            />
                            <span>{subject.nombre}</span>
                        </div>
                    ))}
                </div>
            )}

            {showAddMore && (
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        checked={showAnotherYear}
                        onChange={(e) => setShowAnotherYear(e.target.checked)}
                        className="rounded disabled:opacity-50"
                        disabled={isConfirmed}
                    />
                    <span>Agregar otro año</span>
                </div>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <button
                type="button"
                onClick={handleConfirm}
                className={`w-full py-2 px-4 rounded disabled:opacity-50 text-white ${isConfirmed
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                disabled={loading || !selectedSection || selectedSubjects.size === 0}
            >
                {loading ? 'Cargando...' : isConfirmed ? 'Modificar Selección' : 'Confirmar Selección'}
            </button>
        </div>
    );
};