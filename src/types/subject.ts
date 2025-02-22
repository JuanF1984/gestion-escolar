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

export interface Subject {
    id: string;
    nombre: string;
    activo: boolean;
    id_materia_seccion: string;
}

export type EnrollmentType = 'cursando' | 'recursa' | 'adeuda' | 'aprobada';

export interface SubjectEnrollment {
    numero_legajo: string;
    id_materia_seccion: string;
    año_cursada: number;
    intento: number;
    estado: EnrollmentType;
}
