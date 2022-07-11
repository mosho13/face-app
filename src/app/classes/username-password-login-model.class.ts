import { ModelValue } from '../decorators/model-value.decorator';

export class UsernamePasswordLoginModel {
  @ModelValue()
  public username: string;

  @ModelValue()
  public password: string;
}
