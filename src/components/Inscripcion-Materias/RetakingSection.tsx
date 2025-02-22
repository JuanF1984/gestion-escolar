import { Subject } from "./types";
import { SubjectsList } from "./SubjectsList";

export interface RetakingSectionProps {
    isRetaking: boolean;
    onRetakingChange: (checked: boolean) => void;
    retakeSubjects: Subject[];
    selectedRetakeSubjects: Set<string>;
    onRetakeSubjectToggle: (subjectId: string) => void;
}

export const RetakingSection: React.FC<RetakingSectionProps> = ({
    isRetaking,
    onRetakingChange,
    retakeSubjects,
    selectedRetakeSubjects,
    onRetakeSubjectToggle
}) => (
    <div className="space-y-4">
        <label className="flex items-center space-x-2">
            <input
                type="checkbox"
                checked={isRetaking}
                onChange={(e) => onRetakingChange(e.target.checked)}
                className="rounded"
            />
            <span>¿Recursa materias?</span>
        </label>
        {isRetaking && (
            <SubjectsList
                subjects={retakeSubjects}
                selectedSubjects={selectedRetakeSubjects}
                onSubjectToggle={onRetakeSubjectToggle}
                title="Materias a recursar"
            />
        )}
    </div>
);