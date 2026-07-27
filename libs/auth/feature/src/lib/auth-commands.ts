export class RegisterUserCommand {
  public constructor(public readonly input: unknown) {}
}

export class LoginUserCommand {
  public constructor(public readonly input: unknown) {}
}

export class LogoutSessionCommand {
  public constructor(public readonly rawSessionToken: string) {}
}
