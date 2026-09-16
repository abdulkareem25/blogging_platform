import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { setToast } from "../../ui/store/uiSlice";
import { loginUser } from "../store/authSlice";
import { loginSchema } from "../validators/loginSchema";

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const error = useSelector((state) => state.auth.error);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const submit = async (values) => {
    const result = await dispatch(loginUser(values));

    if (!result.error) {
      dispatch(setToast({ title: "Welcome back", message: "Signed in successfully.", type: "success" }));
      const redirect = location.state?.from?.pathname || "/";
      navigate(redirect, { replace: true });
      return;
    }

    dispatch(setToast({ title: "Sign in failed", message: result.error?.message || "Unable to sign in.", type: "error" }));
  };

  return (
    <main className="auth-page">
      <div className="auth-copy">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>
          Pick up
          <br />
          <em>where you left off.</em>
        </h1>
      </div>

      <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
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
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        <p className="form-foot">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
