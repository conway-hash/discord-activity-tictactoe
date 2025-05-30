export interface User {
  id: string;
  username: string;
  avatar?: string; // Optional, can be undefined if no avatar is set
}

export type ServerToClientMessage =
  | { type: "info"; message: string }
  | { type: "spectators"; users: User[] };

export type ClientToServerMessage =
  | { type: "join"; user: User };