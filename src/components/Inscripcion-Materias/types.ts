// Interfaces para la respuesta de Supabase
export interface Materia {
    id: string; // UUID
    nombre: string;
    activa: boolean;
}

export interface MateriaPorCurso {
    id: string; // UUID
    materias: Materia;
}

export interface MateriaPorSeccion {
    id: string; // UUID
    materias_por_curso: MateriaPorCurso;
}

// Interfaces para los componentes

export interface Section {
    id: string;
    id_curso: string;
    nombre: string;
    activo: boolean;
}

export interface Subject {
    id: string;
    nombre: string;
    activo: boolean;
    id_materia_seccion: string;
    año_cursada?: number;
    intento?: number;
    estado?: 'cursando' | 'recursa' | 'adeuda';
}

export interface SubjectEnrollment {
    numero_legajo: string;
    id_materia_seccion: string;
    año_cursada: number;
    intento: number;
    estado: 'cursando' | 'recursa' | 'adeuda';
}