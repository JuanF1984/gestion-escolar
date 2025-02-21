import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import React from "react";

// Validaciones en zod
const studentSchema = z.object({
    numero_legajo: z.string()
        .regex(/^\d+$/, "Debe contener solo números")
        .transform((val) => parseInt(val, 10))
        .refine((val) => val > 0, { message: "Debe ser un número mayor a 0" }),

    dni: z.string()
        .regex(/^\d+$/, "Debe contener solo números")
        .length(8, "El DNI debe tener exactamente 8 dígitos"),

    telefono_contacto: z.string()
        .regex(/^\d+$/, "Debe contener solo números")
        .min(10, "El teléfono debe tener al menos 10 dígitos")
        .optional(),

    apellido: z.string().min(1, "El apellido es obligatorio"),
    nombre: z.string().min(1, "El nombre es obligatorio"),
    fecha_nacimiento: z.string()
        .refine((value) => !isNaN(Date.parse(value)), {
            message: "Debe ser una fecha válida",
        })
        .refine((value) => new Date(value) <= new Date(), {
            message: "La fecha no puede estar en el futuro",
        }),
    domicilio: z.string().optional(),
});

// Tipos generados con Zod
type StudentFormData = z.infer<typeof studentSchema>;

interface FormularioEstudiantesProps {
    onSave: (data: StudentFormData) => Promise<void>;
}

export const FormularioEstudiantes: React.FC<FormularioEstudiantesProps> = ({ onSave }) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<StudentFormData>({
        resolver: zodResolver(studentSchema),
    });

 

    const onSubmit = async (data: StudentFormData) => {
        await onSave(data);
        reset(); // Limpiar el formulario después de guardar
    };

    return (
        <div className="max-w-3lg mx-auto bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Datos Personales</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Número de Legajo */}
                <div>
                    <label className="block font-medium">Número de Legajo</label>
                    <input type="number" {...register("numero_legajo")} className="border p-2 w-full rounded" />
                    {errors.numero_legajo && <p className="text-red-500">{errors.numero_legajo.message}</p>}
                </div>

                {/* Apellido */}
                <div>
                    <label className="block font-medium">Apellido</label>
                    <input {...register("apellido")} className="border p-2 w-full rounded" />
                    {errors.apellido && <p className="text-red-500">{errors.apellido.message}</p>}
                </div>

                {/* Nombre */}
                <div>
                    <label className="block font-medium">Nombre</label>
                    <input {...register("nombre")} className="border p-2 w-full rounded" />
                    {errors.nombre && <p className="text-red-500">{errors.nombre.message}</p>}
                </div>

                {/* DNI */}
                <div>
                    <label className="block font-medium">DNI</label>
                    <input type="text" {...register("dni")} className="border p-2 w-full rounded" />
                    {errors.dni && <p className="text-red-500">{errors.dni.message}</p>}
                </div>

                {/* Fecha de Nacimiento */}
                <div>
                    <label className="block font-medium">Fecha de Nacimiento</label>
                    <input type="date" {...register("fecha_nacimiento")} className="border p-2 w-full rounded" />
                    {errors.fecha_nacimiento && <p className="text-red-500">{errors.fecha_nacimiento.message}</p>}
                </div>

                {/* Teléfono de Contacto */}
                <div>
                    <label className="block font-medium">Teléfono de Contacto</label>
                    <input type="text" {...register("telefono_contacto")} className="border p-2 w-full rounded" />
                </div>

                {/* Domicilio */}
                <div>
                    <label className="block font-medium">Domicilio</label>
                    <input type="text" {...register("domicilio")} className="border p-2 w-full rounded" />
                </div>

                {/* Botón de Enviar */}
                <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Guardando..." : "Guardar"}
                </button>
            </form>
        </div>
    );
}
