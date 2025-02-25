import React, { useEffect, useState } from 'react';
import supabase from '@/utils/supabase';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    MateriaPorSeccion,
    EnrollmentType,
    Section
} from '../types';

interface MateriasCursadasProps {
    numeroLegajo: string;
    onClose?: () => void;
    hideCloseButton?: boolean;
    estadosFiltrar?: EnrollmentType[];
    titulo?: string;
}

interface InscripcionResponse {
    id: string;
    año_cursada: number;
    estado: EnrollmentType;
    materias_por_seccion: MateriaPorSeccion & {
        secciones: Section;
    };
}

interface MateriaInfo {
    id: string;
    nombre_materia: string;
    año_cursada: number;
    estado: EnrollmentType;
    nombre_seccion: string;
}

interface MateriasPorSeccionGroup {
    seccion: string;
    materias: MateriaInfo[];
}

export const MateriasCursadas: React.FC<MateriasCursadasProps> = ({ numeroLegajo, onClose, hideCloseButton = false, estadosFiltrar, titulo = "Materias Cursadas" }) => {
    const [materias, setMaterias] = useState<MateriasPorSeccionGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMateriasCursadas();
    }, [numeroLegajo]);

    const fetchMateriasCursadas = async () => {
        try {
            setLoading(true);
            setError(null);

            // Definimos el tipo de la query
            let query = supabase
                .from('inscripciones_materias')
                .select(`
                    id,
                    año_cursada,
                    estado,
                    materias_por_seccion!inner (
                        id,
                        materias_por_curso (
                            materias (
                                id,
                                nombre
                            )
                        ),
                        secciones (
                            id,
                            nombre
                        )
                    )
                `)
                .eq('numero_legajo', numeroLegajo)
                .order('año_cursada', { ascending: false });

            type QueryType = typeof query;

            // Aplicar filtro de estados si se proporciona
            if (estadosFiltrar && estadosFiltrar.length > 0) {
                query = query.in('estado', estadosFiltrar) as QueryType;
            }

            const { data, error } = await query;

            if (error) throw error;

            // Asegurarnos de que data es del tipo correcto
            const inscripciones = data as unknown as InscripcionResponse[];

            // Transformar los datos
            const materiasFormateadas: MateriaInfo[] = inscripciones.map(item => ({
                id: item.id,
                nombre_materia: item.materias_por_seccion.materias_por_curso.materias.nombre,
                año_cursada: item.año_cursada,
                estado: item.estado,
                nombre_seccion: item.materias_por_seccion.secciones.nombre
            }));

            // Agrupar por sección
            const materiasPorSeccion = materiasFormateadas.reduce<MateriasPorSeccionGroup[]>((acc, materia) => {
                const seccionExistente = acc.find(s => s.seccion === materia.nombre_seccion);

                if (seccionExistente) {
                    seccionExistente.materias.push(materia);
                } else {
                    acc.push({
                        seccion: materia.nombre_seccion,
                        materias: [materia]
                    });
                }

                return acc;
            }, []);

            // Ordenar las secciones (la sección actual primero)
            const currentYear = new Date().getFullYear();
            materiasPorSeccion.sort((a, b) => {
                const aHasCurrentYear = a.materias.some(m => m.año_cursada === currentYear);
                const bHasCurrentYear = b.materias.some(m => m.año_cursada === currentYear);

                if (aHasCurrentYear && !bHasCurrentYear) return -1;
                if (!aHasCurrentYear && bHasCurrentYear) return 1;
                return 0;
            });

            setMaterias(materiasPorSeccion);
        } catch (err) {
            setError('Error al cargar las materias cursadas');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getEstadoColor = (estado: EnrollmentType): string => {
        switch (estado) {
            case 'cursando':
                return 'text-blue-600';
            case 'aprobada':
                return 'text-green-600';
            case 'adeuda':
            case 'recursa':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <div className="space-y-6">
            <CardHeader className="px-0 flex flex-row items-center justify-between">
                <CardTitle>{titulo}</CardTitle>
                {!hideCloseButton && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </CardHeader>

            {error && (
                <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
                </div>
            ) : materias.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No hay materias cursadas
                </div>
            ) : (
                <div className="space-y-6">
                    {materias.map((seccion, index) => (
                        <Card key={index}>
                            <CardHeader>
                                <CardTitle className="text-lg">{seccion.seccion}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {seccion.materias.map((materia) => (
                                        <div
                                            key={materia.id}
                                            className="flex justify-between items-center border-b pb-2 last:border-0"
                                        >
                                            <div>
                                                <h4 className="font-medium">{materia.nombre_materia}</h4>
                                                <p className="text-sm text-gray-500">
                                                    Año: {materia.año_cursada}
                                                </p>
                                            </div>
                                            <span className={`font-medium ${getEstadoColor(materia.estado)}`}>
                                                {materia.estado}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};