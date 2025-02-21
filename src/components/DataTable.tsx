import { useState, useEffect } from "react";
import supabase from '../utils/supabase'

type Column = {
    key: string;
    label: string;
    editable?: boolean;
    type?: "text" | "boolean";
};

type DataTableProps = {
    tableName: string;
    columns: Column[];
};

export const DataTable = ({ tableName, columns }: DataTableProps) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [tempData, setTempData] = useState<any>({});
    const [showForm, setShowForm] = useState(false);
    const [newData, setNewData] = useState<any>({});

    useEffect(() => {
        const fetchData = async () => {
            const { data, error } = await supabase.from(tableName).select();
            if (!error) setData(data || []);
            setLoading(false);
        };
        fetchData();
    }, [tableName]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newData) return;
        const { data, error } = await supabase.from(tableName).insert([newData]).select();
        if (!error && data) {
            setData((prevData) => [...prevData, ...data]);;
        }
        setNewData({});
        setShowForm(false);
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
                                                    <option value="false">Inactiva</option>
                                                    <option value="true">Activa</option>
                                                </select>
                                            ) : (
                                                <input
                                                    type="text"
                                                    value={tempData[col.key]}
                                                    onChange={(e) => setTempData({ ...tempData, [col.key]: e.target.value })}
                                                    className="border p-1 rounded w-full"
                                                />
                                            )
                                        ) : (
                                            col.type === "boolean" ? (item[col.key] ? "Activa" : "Inactiva") : item[col.key]
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

            <button
                onClick={() => setShowForm(!showForm)}
                className="mt-4 w-full bg-blue-500 text-white p-2 rounded"
            >
                {showForm ? "Cancelar" : "Agregar " + tableName}
            </button>

            {showForm && (
                <form onSubmit={handleSubmit} className="mt-4">
                    {columns.map((col) => (
                        <div key={col.key} className="mb-2">
                            {col.type != "boolean" &&
                                <>
                                    <label className="block">{col.label}</label>
                                    <input
                                        type="text"
                                        value={newData[col.key] || ""}
                                        onChange={(e) =>
                                            setNewData({ ...newData, [col.key]: e.target.value })
                                        }
                                        className="w-full border p-2 rounded"
                                        placeholder={col.label}
                                    />
                                </>
                            }
                        </div>
                    ))}
                    <button type="submit" className="w-full bg-green-500 text-white p-2 rounded">
                        Guardar
                    </button>
                </form>
            )}

        </div>
    );
}
