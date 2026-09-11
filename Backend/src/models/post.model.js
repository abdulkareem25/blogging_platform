import mongoose from "mongoose";

const slugify = (value = "") =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "post";

const generateUniqueSlug = (title = "") => {
  const base = slugify(title);
  const suffix = Date.now().toString(36);
  return `${base}-${suffix}`;
};

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
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags) => tags.every((tag) => tag.length <= 30),
        message: "Each tag must be 30 characters or fewer.",
      },
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
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

  if (!this.slug || this.isModified("title")) {
    this.slug = generateUniqueSlug(this.title);
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