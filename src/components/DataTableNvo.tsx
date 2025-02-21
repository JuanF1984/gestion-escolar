import { useState, useEffect } from "react";
import supabase from "../utils/supabase";

type Column = {
    key: string;
    label: string;
    editable?: boolean;
    type?: "text" | "boolean" | "select";
    relationTable?: string;
    relationKey?: string;
};

type DataTableProps = {
    tableName: string;
    columns: Column[];
    filter?: { key: string; value: any };
    defaultSort?: { key: string; ascending: boolean };
    addEnabled?: boolean;
    addButtonLabel?: string;
};

export const DataTable = ({
    tableName,
    columns,
    filter,
    defaultSort,
    addEnabled = false,
    addButtonLabel = "Agregar",
}: DataTableProps) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempData, setTempData] = useState<any>({});
    const [relations, setRelations] = useState<{ [key: string]: any[] }>({});
    const [showForm, setShowForm] = useState(false);
    const [newItemData, setNewItemData] = useState<any>({});
    const [sortBy] = useState<{ key: string; ascending: boolean } | null>(defaultSort || null);

    useEffect(() => {
        const fetchData = async () => {
            let query = supabase.from(tableName).select();
            if (filter) query = query.eq(filter.key, filter.value);
            if (sortBy) {
                query = query.order(sortBy.key, { ascending: sortBy.ascending });
            }
            const { data, error } = await query;
            if (!error) setData(data || []);
            setLoading(false);
        };
        fetchData();
    }, [tableName, filter, sortBy]);

    useEffect(() => {
        const fetchRelations = async () => {
            const relationData: { [key: string]: any[] } = {};
            for (const col of columns) {
                if (col.type === "select" && col.relationTable) {
                    const { data } = await supabase.from(col.relationTable).select("id, " + col.relationKey);
                    if (data) relationData[col.key] = data;
                }
            }
            setRelations(relationData);
        };
        fetchRelations();
    }, [columns]);

    const handleEdit = (item: any) => {
        setEditingId(item.id);
        setTempData({ ...item });
    };

    const handleSave = async (id: string) => {
        const { error } = await supabase.from(tableName).update(tempData).eq("id", id);
        if (!error) {
            setData(data.map((item) => (item.id === id ? { ...tempData } : item)));
            setEditingId(null);
        }
    };

    const handleCancel = () => {
        setEditingId(null);
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Set default values for all columns
        const newItem = columns.reduce((acc, col) => {
            if (col.type === "boolean") {
                acc[col.key] = true; // Default value for boolean fields
            } else if (!acc[col.key]) {
                acc[col.key] = ""; // Default empty string for other fields
            }
            return acc;
        }, { ...newItemData });

        const { data: insertedData, error } = await supabase
            .from(tableName)
            .insert([newItem])
            .select();

        if (!error && insertedData) {
            setData([...data, ...insertedData]);
            setNewItemData({});
            setShowForm(false);
        }
    };

    return (
        <div className="p-4 max-w-2xl mx-auto bg-white shadow-lg rounded-lg">
            <h2 className="text-xl font-bold mb-4">{tableName}</h2>
            {loading ? (
                <p>Cargando...</p>
            ) : (
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            {columns.map((col) => (
                                <th key={col.key} className="border p-2">{col.label}</th>
                            ))}
                            <th className="border p-2">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr key={item.id} className="border">
                                {columns.map((col) => (
                                    <td key={col.key} className="border p-2">
                                        {editingId === item.id && col.editable ? (
                                            col.type === "boolean" ? (
                                                <select
                                                    value={tempData[col.key] ? "true" : "false"}
                                                    onChange={(e) =>
                                                        setTempData({ ...tempData, [col.key]: e.target.value === "true" })
                                                    }
                                                >
                                                    <option value="true">Activa</option>
                                                    <option value="false">Inactiva</option>
                                                </select>
                                            ) : col.type === "select" && col.relationTable ? (
                                                <select
                                                    value={tempData[col.key] || ""}
                                                    onChange={(e) =>
                                                        setTempData({ ...tempData, [col.key]: e.target.value })
                                                    }
                                                >
                                                    <option value="">Seleccione...</option>
                                                    {relations[col.key]?.map((option) => (
                                                        <option key={option.id} value={option.id}>
                                                            {col.relationKey ? option[col.relationKey] : "Sin relación"}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={tempData[col.key]}
                                                    onChange={(e) => setTempData({ ...tempData, [col.key]: e.target.value })}
                                                    className="border p-1 rounded w-full"
                                                />
                                            )
                                        ) : col.type === "boolean" ? (
                                            item[col.key] ? "Activa" : "Inactiva"
                                        ) : col.type === "select" ? (
                                            col.relationKey
                                                ? relations[col.key]?.find((opt) => opt.id === item[col.key])?.[col.relationKey] || ""
                                                : ""
                                        ) : (
                                            item[col.key]
                                        )}
                                    </td>
                                ))}
                                <td className="border p-2 text-center">
                                    {editingId === item.id ? (
                                        <>
                                            <button onClick={() => handleSave(item.id)} className="bg-green-500 text-white px-3 py-1 rounded mr-2">Guardar</button>
                                            <button onClick={handleCancel} className="bg-gray-500 text-white px-3 py-1 rounded">Cancelar</button>
                                        </>
                                    ) : (
                                        <button onClick={() => handleEdit(item)} className="bg-yellow-500 text-white px-3 py-1 rounded">Modificar</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {addEnabled && (
                <>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="mt-4 w-full bg-blue-500 text-white p-2 rounded"
                    >
                        {showForm ? "Cancelar" : addButtonLabel}
                    </button>

                    {showForm && (
                        <form onSubmit={handleAddSubmit} className="mt-4">
                            {columns.map(col => (
                                col.type === "boolean" ? (
                                    <select
                                        key={col.key}
                                        value={newItemData[col.key] ? "true" : "false"}
                                        onChange={(e) => setNewItemData({
                                            ...newItemData,
                                            [col.key]: e.target.value === "true"
                                        })}
                                        className="w-full border p-2 rounded mb-2"
                                    >
                                        <option value="true">Activa</option>
                                        <option value="false">Inactiva</option>
                                    </select>
                                ) :
                                    col.type === "select" ? (
                                        <select
                                            id={col.key}
                                            value={newItemData[col.key] || ""}
                                            onChange={(e) => setNewItemData({
                                                ...newItemData,
                                                [col.key]: e.target.value
                                            })}
                                            className="w-full border p-2 rounded"
                                        >
                                            <option value="">Seleccione...</option>
                                            {relations[col.key]?.map((option) => (
                                                <option key={option.id} value={option.id}>
                                                    {col.relationKey ? option[col.relationKey] : "Sin relación"}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input
                                            key={col.key}
                                            type="text"
                                            value={newItemData[col.key] || ""}
                                            onChange={(e) => setNewItemData({
                                                ...newItemData,
                                                [col.key]: e.target.value
                                            })}
                                            placeholder={col.label}
                                            className="w-full border p-2 rounded mb-2"
                                        />
                                    )
                            ))}
                            <button
                                type="submit"
                                className="w-full bg-green-500 text-white p-2 rounded"
                            >
                                Guardar
                            </button>
                        </form>
                    )}
                </>
            )}
        </div>
    );
};