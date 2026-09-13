import Joi from "joi";

export const registerSchema = Joi.object({
  username: Joi.string().trim().pattern(/^[a-zA-Z0-9_]+$/).min(3).max(30).required(),
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().min(8).max(128).required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().required(),
  password: Joi.string().required(),
});
