import { Subject } from "./types";

export interface SubjectsListProps {
    subjects: Subject[];
    selectedSubjects: Set<string>;
    onSubjectToggle: (subjectId: string) => void;
    title: string;
}

export const SubjectsList: React.FC<SubjectsListProps> = ({
    subjects,
    selectedSubjects,
    onSubjectToggle,
    title
}) => (
    <div className="space-y-2">
        <label className="block font-medium mb-2">{title}</label>
        {subjects.map(subject => (
            <div key={subject.id} className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    checked={selectedSubjects.has(subject.id)}
                    onChange={() => onSubjectToggle(subject.id)}
                    className="rounded"
                />
                <span>{subject.nombre}</span>
            </div>
        ))}
    </div>
);