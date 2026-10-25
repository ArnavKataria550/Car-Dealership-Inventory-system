import type { RequestHandler } from 'express';

import type { LoginBody, RegisterBody } from './auth.schemas.js';
import type { AuthService } from './auth.service.js';

/** Translates HTTP requests into AuthService calls. Bodies are pre-validated by the router. */
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  register: RequestHandler = async (req, res) => {
    const user = await this.authService.register(req.body as RegisterBody);
    res.status(201).json({ user });
  };

  login: RequestHandler = async (req, res) => {
    const { token, user } = await this.authService.login(req.body as LoginBody);
    res.status(200).json({ token, user });
  };
}
