// types/estudiantes.ts
import { EnrollmentType } from './index';

export interface StudentDB {
    numero_legajo: string;
    nombre: string;
    apellido: string;
    activo: boolean;
}

export interface SeccionDB {
    id: string;
    nombre: string;
    activo: boolean;
}

export interface InscripcionDB {
    id: string;
    año_cursada: number;
    estado: EnrollmentType;
    materias_por_seccion: {
        id: string;
        secciones: {
            id: string;
            nombre: string;
        };
    };
}

interface ResumenSeccionActual {
    nombre: string;
    año: number;
    cantidadMaterias: number;
}

// Primero definimos la interfaz para la información por sección
interface SeccionResumen {
    seccion: string;
    cantidad: number;
}

// Actualizamos la interfaz ResumenMateriasPorAño
interface ResumenMateriasPorAño {
    año: number;
    cantidad: number;
    porSeccion: SeccionResumen[];
}

interface ResumenMaterias {
    aprobadas: number;
    cursando: number;
    adeuda: ResumenMateriasPorAño[];
    recursando: ResumenMateriasPorAño[];
}

export interface StudentResumen extends StudentDB {
    resumen?: {
        seccionActual: ResumenSeccionActual | null;
        materiasPorEstado: ResumenMaterias;
    };
}