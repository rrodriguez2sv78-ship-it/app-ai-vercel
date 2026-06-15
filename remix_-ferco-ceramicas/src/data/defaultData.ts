/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User, SStepConfig, Audit } from '../types';

export const AREAS = [
  "Rack 1",
  "Rack 2",
  "Rack 3",
  "Rack 4",
  "Rack 5",
  "Rack 6",
  "Piezas Especiales",
  "Grifería",
  "Loza y Muebles",
  "Pasillo 1",
  "Pasillo 2",
  "Pasillo 3",
  "Pasillo 4",
  "Pasillo 5",
  "Pasillo 6",
  "Recepción"
];

export const INITIAL_USERS: User[] = [
  { id: 'usr-5', name: 'Roberto Rodriguez', email: 'rrodriguez2sv78@gmail.com', role: 'Administrador', avatarColor: 'bg-rose-500' }
];

export const INITIAL_S_CONFIG: SStepConfig[] = [
  {
    id: 's1',
    sType: '1ª S',
    title: 'Separar y eliminar innecesarios (Clasificar)',
    criteria: [
      'Producto estibado a granel',
      'No tarimas dañadas en ubicaciones de rack',
      'No Mas de 2 codigos en una ubicación de Rack',
      'No producto dañado en posiciones de rack',
      'No tarimas quebradas o dañadas',
      'No parciales ni coronas en posiciones de granel',
      'No producto dañado en tarimas (4 caras)'
    ]
  },
  {
    id: 's2',
    sType: '2ª S',
    title: 'Situar e identificar necesarios (Ordenar)',
    criteria: [
      'Tarimas bien colocadas en ubicaciones de rack',
      'Productos con su respectiva cincha de seguridad',
      'Producto identificado con su respectivo codigo',
      'No tarimas de lado',
      'Tarimas con su respectiva identificacion',
      'No estibas de lado',
      'Tarimas ubicadas en su respectiva area'
    ]
  },
  {
    id: 's3',
    sType: '3ª S',
    title: 'Suprimir la suciedad (Limpiar)',
    criteria: [
      'No fleje o strech film colgando de posiciones de rack',
      'No producto lleno de polvo ni sucio',
      'No herramientas de trabajo en posiciones de rack'
    ]
  },
  {
    id: 's4',
    sType: '4ª S',
    title: 'Señalizar / Estandarizar',
    criteria: [
      'No tarimas con demasiado producto en niveles altos de rack',
      'No estibas con mayor capacidad'
    ]
  },
  {
    id: 's5',
    sType: '5ª S',
    title: 'Sostener y respetar (Disciplina)',
    criteria: []
  }
];

// Helper to generate a UUID-like code
export const generateId = () => {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

export const INITIAL_AUDITS: Audit[] = [
  {
    id: 'AUD-GR-100',
    area: 'Grifería',
    status: 'Cerrada',
    createdAt: '2026-06-01T10:00:00Z',
    completedAt: '2026-06-02T12:00:00Z',
    score: 100,
    creator: INITIAL_USERS[0], 
    assignedTo: INITIAL_USERS[0], 
    observations: 'Excelente apego a los estándares 5S. Continuar implementando esta disciplina de forma continua.',
    solutionTime: '48 horas',
    items: [
      { id: 'ai-1', criterionText: 'Un solo SKU en cada posición de rack', sType: '1ª S', complies: true, comment: 'Ordenado' },
      { id: 'ai-2', criterionText: 'Evitar reubicar en ubicaciones rack tarimas dañadas', sType: '1ª S', complies: true, comment: 'Todo en buen estado' },
      { id: 'ai-3', criterionText: 'Colocar el producto en rack a granel y no uno encima de otro', sType: '1ª S', complies: true, comment: 'Sin apilamientos' },
      { id: 'ai-4', criterionText: 'Sacar producto dañado de posiciones de rack', sType: '1ª S', complies: true, comment: 'Limpio' },
      { id: 'ai-5', criterionText: 'No Strech Film o tape en ubicaciones de rack', sType: '2ª S', complies: true, comment: 'Correcto' },
      { id: 'ai-6', criterionText: 'Señalización de pasillos y zonas de trabajo', sType: '2ª S', complies: true, comment: 'Visible' },
      { id: 'ai-7', criterionText: 'Etiquetado correcto de productos y áreas', sType: '2ª S', complies: true, comment: 'Correcto' },
      { id: 'ai-8', criterionText: 'Demarcación de zonas de tránsito', sType: '2ª S', complies: true, comment: 'Limítrofe visible' },
      { id: 'ai-9', criterionText: 'Estanterías y racks libres de polvo y residuos', sType: '3ª S', complies: true, comment: 'Impecable' },
      { id: 'ai-11', criterionText: 'Dejar el producto en las áreas especificadas', sType: '4ª S', complies: true, comment: 'Correctamente ubicado' },
      { id: 'ai-12', criterionText: 'Uso de equipos de seguridad individual (EPP completo)', sType: '5ª S', complies: true, comment: 'Todo el personal cumple' }
    ],
    actionPlans: []
  },
  {
    id: 'AUD-RK5-80',
    area: 'Rack 5',
    status: 'Atrasada',
    createdAt: '2026-06-03T11:20:00Z',
    score: 80,
    creator: INITIAL_USERS[0], 
    assignedTo: INITIAL_USERS[0], 
    observations: 'Presencia de polvillo excesivo en zona baja del Rack 5. Se requiere limpieza.',
    solutionTime: '48 horas',
    items: [
      { id: 'ai5-1', criterionText: 'Un solo SKU en cada posición de rack', sType: '1ª S', complies: true, comment: 'OK' },
      { id: 'ai5-2', criterionText: 'Evitar reubicar en ubicaciones rack tarimas dañadas', sType: '1ª S', complies: true, comment: 'Verificado' },
      { id: 'ai5-3', criterionText: 'Colocar el producto en rack a granel y no uno encima de otro', sType: '1ª S', complies: true, comment: 'Correcto' },
      { id: 'ai5-4', criterionText: 'Sacar producto dañado de posiciones de rack', sType: '1ª S', complies: true, comment: 'OK' },
      { id: 'ai5-5', criterionText: 'No Strech Film o tape en ubicaciones de rack', sType: '2ª S', complies: true, comment: 'OK' },
      { id: 'ai5-6', criterionText: 'Señalización de pasillos y zonas de trabajo', sType: '2ª S', complies: true, comment: 'Bien' },
      { id: 'ai5-7', criterionText: 'Etiquetado correcto de productos y áreas', sType: '2ª S', complies: true, comment: 'Bien' },
      { id: 'ai5-8', criterionText: 'Demarcación de zonas de tránsito', sType: '2ª S', complies: true, comment: 'Bien' },
      { id: 'ai5-9', criterionText: 'Estanterías y racks libres de polvo y residuos', sType: '3ª S', complies: false, comment: 'Polvo y astillas de madera acumulados en niveles inferiores.' },
      { id: 'ai5-11', criterionText: 'Dejar el producto en las áreas especificadas', sType: '4ª S', complies: true, comment: 'OK' },
      { id: 'ai5-12', criterionText: 'Uso de equipos de seguridad individual (EPP completo)', sType: '5ª S', complies: false, comment: 'Un estibador no portaba casco al ingresar al pasillo.' }
    ],
    actionPlans: [
      {
        id: 'plan-5-1',
        itemText: 'Estanterías y racks libres de polvo y residuos',
        sTypeId: '3ª S',
        failureDetail: 'Polvo y astillas de madera acumulados en niveles inferiores.',
        correctiveAction: 'Asignar equipo de ordenanza para limpieza profunda y recolección de astillas.',
        responsible: 'Mario Calderón',
        deadline: '2026-06-05',
        status: 'Pendiente'
      },
      {
        id: 'plan-5-2',
        itemText: 'Uso de equipos de seguridad individual (EPP completo)',
        sTypeId: '5ª S',
        failureDetail: 'Un estibador no portaba casco al ingresar al pasillo.',
        correctiveAction: 'Refuerzo de charla de seguridad de 5 minutos y amonestación verbal correspondiente.',
        responsible: 'Mario Calderón',
        deadline: '2026-06-05',
        status: 'Pendiente'
      }
    ]
  },
  {
    id: 'AUD-RK3-75',
    area: 'Rack 3',
    status: 'Atrasada',
    createdAt: '2026-06-04T09:30:00Z',
    score: 75,
    creator: INITIAL_USERS[0], 
    assignedTo: INITIAL_USERS[0], 
    observations: 'Tarimas acumuladas en zonas de tránsito y falta de orden en SKU.',
    solutionTime: '48 horas',
    items: [
      { id: 'ai3-1', criterionText: 'Un solo SKU en cada posición de rack', sType: '1ª S', complies: false, comment: 'Mezcla de SKU en nivel 2' },
      { id: 'ai3-2', criterionText: 'Evitar reubicar en ubicaciones rack tarimas dañadas', sType: '1ª S', complies: true, comment: 'OK' },
      { id: 'ai3-3', criterionText: 'Colocar el producto en rack a granel y no uno encima de otro', sType: '1ª S', complies: true, comment: 'OK' },
      { id: 'ai3-4', criterionText: 'Sacar producto dañado de posiciones de rack', sType: '1ª S', complies: false, comment: 'Caja humedecida en posición B3' },
      { id: 'ai3-5', criterionText: 'No Strech Film o tape en ubicaciones de rack', sType: '2ª S', complies: true, comment: 'Fino' },
      { id: 'ai3-6', criterionText: 'Señalización de pasillos y zonas de trabajo', sType: '2ª S', complies: true, comment: 'Correcto' },
      { id: 'ai3-7', criterionText: 'Etiquetado correcto de productos y áreas', sType: '2ª S', complies: true, comment: 'OK' },
      { id: 'ai3-8', criterionText: 'Demarcación de zonas de tránsito', sType: '2ª S', complies: false, comment: 'Pintura desgastada' },
      { id: 'ai3-9', criterionText: 'Estanterías y racks libres de polvo y residuos', sType: '3ª S', complies: true, comment: 'Limpio' },
      { id: 'ai3-11', criterionText: 'Dejar el producto en las áreas especificadas', sType: '4ª S', complies: true, comment: 'Correcto' },
      { id: 'ai3-12', criterionText: 'Uso de equipos de seguridad individual (EPP completo)', sType: '5ª S', complies: true, comment: 'OK' }
    ],
    actionPlans: [
      {
        id: 'plan-3-1',
        itemText: 'Un solo SKU en cada posición de rack',
        sTypeId: '1ª S',
        failureDetail: 'Mezcla de SKU en nivel 2',
        correctiveAction: 'Reubicar y depurar posiciones re-acomodando stock por código.',
        responsible: 'Mario Calderón',
        deadline: '2026-06-06',
        status: 'Pendiente'
      },
      {
        id: 'plan-3-2',
        itemText: 'Sacar producto dañado de posiciones de rack',
        sTypeId: '1ª S',
        failureDetail: 'Caja humedecida en posición B3',
        correctiveAction: 'Retirar caja para peritaje de merma y reempaque.',
        responsible: 'Mario Calderón',
        deadline: '2026-06-06',
        status: 'Pendiente'
      }
    ]
  },
  {
    id: 'AUD-RK1-70',
    area: 'Rack 1',
    status: 'Atrasada',
    createdAt: '2026-06-05T08:15:00Z',
    score: 70,
    creator: INITIAL_USERS[0], 
    assignedTo: INITIAL_USERS[0], 
    observations: 'Strech film colgando de pallets, interfiere con lecturas de código de barra.',
    solutionTime: '48 horas',
    items: [
      { id: 'ai1-1', criterionText: 'Un solo SKU en cada posición de rack', sType: '1ª S', complies: true, comment: 'OK' },
      { id: 'ai1-2', criterionText: 'Evitar reubicar en ubicaciones rack tarimas dañadas', sType: '1ª S', complies: true, comment: 'OK' },
      { id: 'ai1-3', criterionText: 'Colocar el producto en rack a granel y no uno encima de otro', sType: '1ª S', complies: true, comment: 'OK' },
      { id: 'ai1-4', criterionText: 'Sacar producto dañado de posiciones de rack', sType: '1ª S', complies: true, comment: 'Correcto' },
      { id: 'ai1-5', criterionText: 'No Strech Film o tape en ubicaciones de rack', sType: '2ª S', complies: false, comment: 'Trozos de strech film adheridos a columnas del rack' },
      { id: 'ai1-6', criterionText: 'Señalización de pasillos y zonas de trabajo', sType: '2ª S', complies: true, comment: 'OK' },
      { id: 'ai1-7', criterionText: 'Etiquetado correcto de productos y áreas', sType: '2ª S', complies: true, comment: 'OK' },
      { id: 'ai1-8', criterionText: 'Demarcación de zonas de tránsito', sType: '2ª S', complies: true, comment: 'OK' },
      { id: 'ai1-9', criterionText: 'Estanterías y racks libres de polvo y residuos', sType: '3ª S', complies: false, comment: 'Muestras de polvo grueso en bandejas intermedias' },
      { id: 'ai1-11', criterionText: 'Dejar el producto en las áreas especificadas', sType: '4ª S', complies: true, comment: 'Bien' },
      { id: 'ai1-12', criterionText: 'Uso de equipos de seguridad individual (EPP completo)', sType: '5ª S', complies: true, comment: 'Satisface' }
    ],
    actionPlans: [
      {
        id: 'plan-1-1',
        itemText: 'No Strech Film o tape en ubicaciones de rack',
        sTypeId: '2ª S',
        failureDetail: 'Trozos de strech film adheridos a columnas del rack.',
        correctiveAction: 'Retirar residuos plásticos y pegatinas de las vigas.',
        responsible: 'Mario Calderón',
        deadline: '2026-06-07',
        status: 'Pendiente'
      }
    ]
  },
  {
    id: 'AUD-RK2-70',
    area: 'Rack 2',
    status: 'Atrasada',
    createdAt: '2026-06-05T14:45:00Z',
    score: 70,
    creator: INITIAL_USERS[0], 
    assignedTo: INITIAL_USERS[0], 
    observations: 'La zona posterior de racks contiene envolturas vacías.',
    solutionTime: '48 horas',
    items: [
      { id: 'ai2-1', criterionText: 'Un solo SKU en cada posición de rack', sType: '1ª S', complies: true, comment: 'OK' },
      { id: 'ai2-2', criterionText: 'Evitar reubicar en ubicaciones rack tarimas dañadas', sType: '1ª S', complies: true, comment: 'OK' },
      { id: 'ai2-3', criterionText: 'Colocar el producto en rack a granel y no uno encima de otro', sType: '1ª S', complies: true, comment: 'Bien' },
      { id: 'ai2-4', criterionText: 'Sacar producto dañado de posiciones de rack', sType: '1ª S', complies: true, comment: 'OK' },
      { id: 'ai2-5', criterionText: 'No Strech Film o tape en ubicaciones de rack', sType: '2ª S', complies: true, comment: 'OK' },
      { id: 'ai2-6', criterionText: 'Señalización de pasillos y zonas de trabajo', sType: '2ª S', complies: true, comment: 'Visible' },
      { id: 'ai2-7', criterionText: 'Etiquetado correcto de productos y áreas', sType: '2ª S', complies: true, comment: 'Satisface' },
      { id: 'ai2-8', criterionText: 'Demarcación de zonas de tránsito', sType: '2ª S', complies: true, comment: 'OK' },
      { id: 'ai2-9', criterionText: 'Estanterías y racks libres de polvo y residuos', sType: '3ª S', complies: false, comment: 'Cartones sueltos arrastrados debajo de estibas' },
      { id: 'ai2-11', criterionText: 'Dejar el producto en las áreas especificadas', sType: '4ª S', complies: true, comment: 'OK' },
      { id: 'ai2-12', criterionText: 'Uso de equipos de seguridad individual (EPP completo)', sType: '5ª S', complies: true, comment: 'Cumplen' }
    ],
    actionPlans: [
      {
        id: 'plan-2-1',
        itemText: 'Estanterías y racks libres de polvo y residuos',
        sTypeId: '3ª S',
        failureDetail: 'Cartones sueltos arrastrados debajo de estibas.',
        correctiveAction: 'Limpiar y extraer la totalidad de cartones residuales o empaques secundarios.',
        responsible: 'Mario Calderón',
        deadline: '2026-06-07',
        status: 'Pendiente'
      }
    ]
  },
  {
    id: 'AUD-RK4-65',
    area: 'Rack 4',
    status: 'Atrasada',
    createdAt: '2026-06-06T10:10:00Z',
    score: 65,
    creator: INITIAL_USERS[0], 
    assignedTo: INITIAL_USERS[0], 
    observations: 'Se detecta tarima astillada en el suelo del Rack 4. Pasillo obstruido parcialmente.',
    solutionTime: '48 horas',
    items: [
      { id: 'ai4-1', criterionText: 'Un solo SKU en cada posición de rack', sType: '1ª S', complies: true, comment: 'OK' },
      { id: 'ai4-2', criterionText: 'Evitar reubicar en ubicaciones rack tarimas dañadas', sType: '1ª S', complies: false, comment: 'Tarima con base quebrada en posición inferior' },
      { id: 'ai4-3', criterionText: 'Colocar el producto en rack a granel y no uno encima de otro', sType: '1ª S', complies: true, comment: 'OK' },
      { id: 'ai4-4', criterionText: 'Sacar producto dañado de posiciones de rack', sType: '1ª S', complies: true, comment: 'Limpio' },
      { id: 'ai4-5', criterionText: 'No Strech Film o tape en ubicaciones de rack', sType: '2ª S', complies: true, comment: 'OK' },
      { id: 'ai4-6', criterionText: 'Señalización de pasillos y zonas de trabajo', sType: '2ª S', complies: true, comment: 'OK' },
      { id: 'ai4-7', criterionText: 'Etiquetado correcto de productos y áreas', sType: '2ª S', complies: false, comment: 'Sin etiqueta de ubicación en cabecera' },
      { id: 'ai4-8', criterionText: 'Demarcación de zonas de tránsito', sType: '2ª S', complies: true, comment: 'OK' },
      { id: 'ai4-9', criterionText: 'Estanterías y racks libres de polvo y residuos', sType: '3ª S', complies: true, comment: 'OK' },
      { id: 'ai4-11', criterionText: 'Dejar el producto en las áreas especificadas', sType: '4ª S', complies: false, comment: 'Pallet colocado un metro fuera del límite del pasillo' },
      { id: 'ai4-12', criterionText: 'Uso de equipos de seguridad individual (EPP completo)', sType: '5ª S', complies: true, comment: 'Satisface' }
    ],
    actionPlans: [
      {
        id: 'plan-4-1',
        itemText: 'Evitar reubicar en ubicaciones rack tarimas dañadas',
        sTypeId: '1ª S',
        failureDetail: 'Tarima con base quebrada en posición inferior.',
        correctiveAction: 'Trasvasar producto a tarima sana y descartar la tarima de madera rota.',
        responsible: 'Mario Calderón',
        deadline: '2026-06-08',
        status: 'Pendiente'
      },
      {
        id: 'plan-4-2',
        itemText: 'Etiquetado correcto de productos y áreas',
        sTypeId: '2ª S',
        failureDetail: 'Sin etiqueta de ubicación en cabecera.',
        correctiveAction: 'Re-imprimir y adherir el rótulo identificador de columna Rack 4.',
        responsible: 'Diego Bautista',
        deadline: '2026-06-08',
        status: 'Resuelto' // Solucionado por Diego Bautista in the screenshot
      }
    ]
  },
  {
    id: 'AUD-RK6-90',
    area: 'Pasillo 1',
    status: 'Atrasada',
    createdAt: '2026-06-06T15:00:00Z',
    score: 90,
    creator: INITIAL_USERS[0], 
    assignedTo: INITIAL_USERS[0], 
    observations: 'Alto nivel de cumplimiento. Solo un descuido menor en el pasillo.',
    solutionTime: '48 horas',
    items: [
      { id: 'ai6-1', criterionText: 'Un solo SKU en cada posición de rack', sType: '1ª S', complies: true, comment: 'OK' },
      { id: 'ai6-2', criterionText: 'Evitar reubicar en ubicaciones rack tarimas dañadas', sType: '1ª S', complies: true, comment: 'Todo en orden' },
      { id: 'ai6-3', criterionText: 'Colocar el producto en rack a granel y no uno encima de otro', sType: '1ª S', complies: true, comment: 'OK' },
      { id: 'ai6-4', criterionText: 'Sacar producto dañado de posiciones de rack', sType: '1ª S', complies: true, comment: 'OK' },
      { id: 'ai6-5', criterionText: 'No Strech Film o tape en ubicaciones de rack', sType: '2ª S', complies: true, comment: 'Limpio' },
      { id: 'ai6-6', criterionText: 'Señalización de pasillos y zonas de trabajo', sType: '2ª S', complies: true, comment: 'OK' },
      { id: 'ai6-7', criterionText: 'Etiquetado correcto de productos y áreas', sType: '2ª S', complies: true, comment: 'Correcto' },
      { id: 'ai6-8', criterionText: 'Demarcación de zonas de tránsito', sType: '2ª S', complies: true, comment: 'OK' },
      { id: 'ai6-9', criterionText: 'Estanterías y racks libres de polvo y residuos', sType: '3ª S', complies: true, comment: 'Limpios' },
      { id: 'ai6-11', criterionText: 'Dejar el producto en las áreas especificadas', sType: '4ª S', complies: false, comment: 'Esquinero plástico tirado en el pasillo' },
      { id: 'ai6-12', criterionText: 'Uso de equipos de seguridad individual (EPP completo)', sType: '5ª S', complies: true, comment: 'OK' }
    ],
    actionPlans: [
      {
        id: 'plan-6-1',
        itemText: 'Dejar el producto en las áreas especificadas',
        sTypeId: '4ª S',
        failureDetail: 'Esquinero plástico tirado en el pasillo',
        correctiveAction: 'Levantar esquinero y tirar en cesto de reciclaje.',
        responsible: 'Mario Calderón',
        deadline: '2026-06-08',
        status: 'Pendiente'
      }
    ]
  }
];

export const MONTHLY_DATA = [
  { month: 'Enero', Rack1: 65, Rack2: 60, Rack3: 70, Griferia: 90, Loza: 80, Recepcion: 85, Pasillo1: 75 },
  { month: 'Febrero', Rack1: 70, Rack2: 68, Rack3: 75, Griferia: 92, Loza: 82, Recepcion: 87, Pasillo1: 78 },
  { month: 'Marzo', Rack1: 75, Rack2: 72, Rack3: 71, Griferia: 95, Loza: 85, Recepcion: 90, Pasillo1: 82 },
  { month: 'Abril', Rack1: 68, Rack2: 70, Rack3: 73, Griferia: 96, Loza: 84, Recepcion: 89, Pasillo1: 85 },
  { month: 'Mayo', Rack1: 72, Rack2: 71, Rack3: 74, Griferia: 98, Loza: 88, Recepcion: 91, Pasillo1: 87 },
  { month: 'Junio', Rack1: 70, Rack2: 70, Rack3: 75, Griferia: 100, Loza: 80, Recepcion: 92, Pasillo1: 90 }
];

export const WEEKLY_DATA = [
  { week: 'Sem 1', Rack1: 68, Rack2: 65, Rack3: 72, Griferia: 94, Loza: 81, Recepcion: 88, Pasillo1: 80 },
  { week: 'Sem 2', Rack1: 72, Rack2: 67, Rack3: 70, Griferia: 96, Loza: 83, Recepcion: 90, Pasillo1: 83 },
  { week: 'Sem 3', Rack1: 70, Rack2: 69, Rack3: 74, Griferia: 95, Loza: 82, Recepcion: 89, Pasillo1: 85 },
  { week: 'Sem 4', Rack1: 74, Rack2: 72, Rack3: 73, Griferia: 97, Loza: 85, Recepcion: 91, Pasillo1: 86 },
  { week: 'Sem 5', Rack1: 71, Rack2: 70, Rack3: 76, Griferia: 99, Loza: 84, Recepcion: 93, Pasillo1: 88 },
  { week: 'Sem 6', Rack1: 70, Rack2: 70, Rack3: 75, Griferia: 100, Loza: 80, Recepcion: 92, Pasillo1: 90 }
];

