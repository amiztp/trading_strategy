export interface Rule {
  id: string;
  text: string;
  checked: boolean;
}

export interface Strategy {
  id: string;
  name: string;
  rules: Rule[];
  createdAt: number;
}
