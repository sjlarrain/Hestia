export type AppStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'cancelled';

export type PartyGuest = {
  name: string;
  email: string;
};

export type Application = {
  id: string;
  name: string;
  email: string;
  arrival: string; // ISO date (YYYY-MM-DD)
  departure: string; // ISO date (YYYY-MM-DD)
  people: number;
  status: AppStatus;
  guests: PartyGuest[];
  mine: boolean; // owned by the current guest session
};

export type Block = {
  id: string;
  start: string;
  end: string;
  reason: string;
};

export type EmailKind = 'request' | 'approved' | 'rejected';

export type CasaEmail = {
  id: string;
  to: string;
  subject: string;
  body: string;
  tag: string;
  tagColor: string;
  at: number;
};

export type Role = 'guest' | 'host';

export type FormState = {
  id: string | null;
  name: string;
  email: string;
  arrival: string;
  departure: string;
  people: number;
  guests: PartyGuest[];
  status: AppStatus;
  mine: boolean;
};

export type BlockFormState = {
  start: string;
  end: string;
  reason: string;
};

export type ModalKind = 'apply' | 'block' | 'inbox' | 'email' | null;

export type CasaData = {
  applications: Application[];
  blocks: Block[];
  emails: CasaEmail[];
};
