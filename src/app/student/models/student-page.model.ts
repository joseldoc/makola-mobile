import { Role } from '@core/models/auth.model';

/** What a route tells the student's page: whose space it is in, and where « back » leads. */
export interface StudentPageData {
  space: Role;
  backTo: string;
}
