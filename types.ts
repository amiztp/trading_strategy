export interface Rule {
  id: string;
  text: string;
  checked: boolean;
  strategyId: string;
  createdAt: number | Date;
  updatedAt: number | Date;
}

export interface Strategy {
  id: string;
  name: string;
  rules: Rule[];
  userId: string;
  createdAt: number | Date;
  updatedAt: number | Date;
}
