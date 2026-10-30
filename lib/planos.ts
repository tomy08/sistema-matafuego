export type Conector = { id: string; x: number; y: number };

export type Plano = {
  src: string;
  ancho: number;
  alto: number;
  // Puntos fijos del plano (en % de la imagen) donde se enganchan los extintores.
  conectores: Conector[];
};

// Plano de evacuación, piso 1 (Avda. Lope de Vega 2150). Los conectores son los
// íconos de extintor que ya vienen dibujados en el plano.
export const PLANO_PISO_1: Plano = {
  src: "/planos/plano-piso-1.jpg",
  ancho: 795,
  alto: 545,
  conectores: [
    { id: "c1", x: 69.6, y: 7.8 },
    { id: "c2", x: 78.1, y: 8.1 },
    { id: "c3", x: 82.9, y: 12.7 },
    { id: "c4", x: 62.1, y: 15.6 },
    { id: "c5", x: 70.3, y: 16.5 },
    { id: "c6", x: 12.4, y: 20.6 },
    { id: "c7", x: 28.5, y: 20.5 },
    { id: "c8", x: 58.5, y: 20.5 },
    { id: "c9", x: 70.4, y: 23.1 },
    { id: "c10", x: 81.6, y: 22.2 },
    { id: "c11", x: 33.4, y: 38.4 },
    { id: "c12", x: 74.3, y: 47.3 },
    { id: "c13", x: 29.3, y: 58.4 },
    { id: "c14", x: 43.6, y: 63.1 },
    { id: "c15", x: 72.7, y: 62.4 },
    { id: "c16", x: 76.6, y: 65.9 },
    { id: "c17", x: 27.4, y: 71.2 },
    { id: "c18", x: 10.4, y: 79.9 },
    { id: "c19", x: 22.6, y: 80.0 },
  ],
};
