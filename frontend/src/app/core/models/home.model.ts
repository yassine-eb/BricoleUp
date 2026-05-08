import { Annonce } from './ad.model';

export interface Project {
  id: number;
  name: string;
  description: string;
  [key: string]: any;
}

export interface HomeResponse {
  latest_demandes: Annonce[];
  latest_offres: Annonce[];
  latest_projects: Project[];
  latest_annonce: Annonce | null;
}
