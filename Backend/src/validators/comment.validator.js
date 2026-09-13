import Joi from "joi";

export const createCommentSchema = Joi.object({
  body: Joi.string().trim().min(1).max(1000).required(),
});
