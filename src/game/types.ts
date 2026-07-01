export type BlockId =
  | "key_partners"
  | "key_activities"
  | "key_resources"
  | "value_proposition"
  | "customer_relationships"
  | "channels"
  | "customer_segments"
  | "cost_structure"
  | "revenue_streams";

export type CardType = "model" | "trap" | "event";

export interface GameCard {
  id: string;
  type: CardType;
  icon: string;
  text: string;
  /** Correct block for MODEL cards. */
  block?: BlockId;
}

export interface Startup {
  id: string;
  name: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
  valueProposition: string;
  story: string;
  curiosities: string[];
  cards: GameCard[];
}

export interface StartupData {
  startups: Startup[];
}

export type Placement = Record<string, BlockId | "discarded" | "hand">;

export interface BlockDef {
  id: BlockId;
  name: string;
  short: string;
  hint: string;
}

export const BLOCKS: BlockDef[] = [
  { id: "key_partners", name: "Asociaciones Clave", short: "Alianzas", hint: "Socios estratégicos que hacen posible el modelo" },
  { id: "key_activities", name: "Actividades Clave", short: "Actividades", hint: "Qué hace la empresa día a día" },
  { id: "key_resources", name: "Recursos Clave", short: "Recursos", hint: "Activos indispensables" },
  { id: "value_proposition", name: "Propuesta de Valor", short: "Valor", hint: "Qué problema resuelve" },
  { id: "customer_relationships", name: "Relaciones", short: "Relaciones", hint: "Cómo se vincula con clientes" },
  { id: "channels", name: "Canales", short: "Canales", hint: "Cómo llega al cliente" },
  { id: "customer_segments", name: "Segmentos", short: "Segmentos", hint: "A quién sirve" },
  { id: "cost_structure", name: "Estructura de Costes", short: "Costes", hint: "Principales gastos" },
  { id: "revenue_streams", name: "Fuentes de Ingresos", short: "Ingresos", hint: "Cómo gana dinero" },
];
