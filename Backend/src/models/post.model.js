import mongoose from "mongoose";
import slugify from "../utils/slugify.js";

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 200,
    },
    body: {
      type: String,
      required: true,
      minlength: 20,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags) => tags.length <= 10 && tags.every((tag) => tag.length <= 30),
        message: "Posts may contain up to 10 tags, each 30 characters or fewer.",
      },
    },
    slug: {
      type: String,
      required: true,
      trim: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

postSchema.virtual("commentCount", {
  ref: "Comment",
  localField: "_id",
  foreignField: "post",
  count: true,
});

postSchema.pre("validate", function (next) {
  if (!this.isModified("title") && this.slug) return next();

  if (!this.slug) {
    this.slug = slugify(this.title);
  }

  next();
});

postSchema.index({ author: 1 });
postSchema.index({ slug: 1 }, { unique: true });
postSchema.index({ tags: 1 });
postSchema.index({ deletedAt: 1 });
postSchema.index({ title: "text", body: "text" });
postSchema.index({ createdAt: -1 });
postSchema.index({ deletedAt: 1, createdAt: -1 });

const Post = mongoose.model("Post", postSchema);

export default Post;