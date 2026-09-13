import Joi from "joi";

const tags = Joi.array().items(Joi.string().trim().max(30)).max(10);

export const createPostSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200).required(),
  body: Joi.string().trim().min(20).required(),
  tags,
});

export const updatePostSchema = Joi.object({
  title: Joi.string().trim().min(5).max(200),
  body: Joi.string().trim().min(20),
  tags,
}).min(1);
