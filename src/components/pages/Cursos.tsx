import { DataTable } from "../DataTableNvo"

export const Cursos = () => {
    return (
        <DataTable
            tableName="cursos"
            columns={[
                { key: "nombre", label: "Nombre", editable: true, type: "text" },
                { key: "cantidad_secciones", label: "Secciones", editable: true, type: "text" },
                { key: "activo", label: "Estado", editable: true, type: "boolean" }
            ]}
        />
    );
}
