import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { setToast } from "../../ui/store/uiSlice";
import { registerUser } from "../store/authSlice";
import { registerSchema } from "../validators/registerSchema";

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", email: "", password: "" },
  });

  const submit = async (values) => {
    const result = await dispatch(registerUser(values));

    if (result.error) {
      setError(result.error.message || "Registration failed");
      dispatch(setToast({ title: "Registration failed", message: result.error.message || "Unable to create your account.", type: "error" }));
      return;
    }

    dispatch(setToast({ title: "Account created", message: "Welcome to Inkline.", type: "success" }));
    navigate("/", { replace: true });
  };

  return (
    <main className="auth-page">
      <div className="auth-copy">
        <p className="eyebrow">JOIN THE JOURNAL</p>
        <h1>
          Make space
          <br />
          <em>for your ideas.</em>
        </h1>
      </div>

      <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
        <label>
          Username
          <input {...register("username")} />
          {errors.username && <span className="field-error">{errors.username.message}</span>}
        </label>

        <label>
          Email
          <input type="email" {...register("email")} />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
        </label>

        <label>
          Password
          <input type="password" {...register("password")} />
          {errors.password && <span className="field-error">{errors.password.message}</span>}
        </label>

        {error && <p className="form-error">{error}</p>}

        <button className="button button-dark" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Creating..." : "Create account"}
        </button>

        <p className="form-foot">
          Already a member? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </main>
  );
}
