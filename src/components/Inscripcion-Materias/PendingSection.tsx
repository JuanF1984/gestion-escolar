import { Subject } from "./types";
import { SubjectsList } from "./SubjectsList";

export interface PendingSectionProps {
    hasPending: boolean;
    onPendingChange: (checked: boolean) => void;
    selectedYear: number;
    onYearChange: (year: number) => void;
    pendingSubjects: Subject[];
    selectedPendingSubjects: Set<string>;
    onPendingSubjectToggle: (subjectId: string) => void;
}

export const PendingSection: React.FC<PendingSectionProps> = ({
    hasPending,
    onPendingChange,
    selectedYear,
    onYearChange,
    pendingSubjects,
    selectedPendingSubjects,
    onPendingSubjectToggle
}) => (
    <div className="space-y-4">
        <label className="flex items-center space-x-2">
            <input
                type="checkbox"
                checked={hasPending}
                onChange={(e) => onPendingChange(e.target.checked)}
                className="rounded"
            />
            <span>¿Adeuda materias?</span>
        </label>
        {hasPending && (
            <>
                <div>
                    <label className="block font-medium mb-2">Año de cursada</label>
                    <select
                        className="w-full p-2 border rounded"
                        value={selectedYear}
                        onChange={(e) => onYearChange(parseInt(e.target.value))}
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
                <SubjectsList
                    subjects={pendingSubjects}
                    selectedSubjects={selectedPendingSubjects}
                    onSubjectToggle={onPendingSubjectToggle}
                    title="Materias adeudadas"
                />
            </>
        )}
    </div>
);