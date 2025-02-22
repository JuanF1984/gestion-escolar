import { Section } from "./types";

export interface SectionSelectorProps {
    sections: Section[];
    selectedSection: string | null;
    onSectionChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export const SectionSelector: React.FC<SectionSelectorProps> = ({
    sections,
    selectedSection,
    onSectionChange
}) => (
    <div>
        <label className="block font-medium mb-2">Sección</label>
        <select
            className="w-full p-2 border rounded"
            onChange={onSectionChange}
            value={selectedSection || ''}
        >
            <option value="">Seleccione una sección</option>
            {sections.map(section => (
                <option key={section.id} value={section.id}>
                    {section.nombre}
                </option>
            ))}
        </select>
    </div>
);
