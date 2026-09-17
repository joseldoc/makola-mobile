import { TextFieldState } from '@core/shared/components/forms/text-field/text-field';

export type Bareme = '/20' | '/10' | '/5';

export interface DateDevoir {
  label: string;
  state: TextFieldState;
  message: string;
}
