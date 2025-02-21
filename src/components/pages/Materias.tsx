import { DataTable } from "../DataTableNvo";

export const Materias = () => {
    return (
        <DataTable
            tableName="materias"
            columns={[
                { key: "nombre", label: "Nombre", editable: true, type: "text" },
                { key: "activa", label: "Estado", editable: true, type: "boolean" }
            ]}
            addEnabled={true}
            addButtonLabel="Agregar Materia"
        />
    );
};