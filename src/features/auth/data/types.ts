export type GlobalRole = string;

export interface User {
  id: string;
  email: string;
  role: GlobalRole;
  name?: string;
  username?: string;
}
