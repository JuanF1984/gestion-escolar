import { DataTable } from "../DataTableNvo"

export const MostarMateriasSecciones = () => {
    return (
        <DataTable
            tableName="secciones"
            columns={[
                { key: "nombre", label: "Nombre", editable: false, type: "text" },
                { key: "activo", label: "Estado", editable: true, type: "boolean" }
            ]}
        />
    );
}