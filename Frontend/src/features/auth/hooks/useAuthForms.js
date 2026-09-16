import { useDispatch, useSelector } from "react-redux";
import { loginUser, registerUser } from "../store/authSlice";

export function useLogin() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  return { login: (payload) => dispatch(loginUser(payload)), status, error };
}

export function useRegister() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  return { register: (payload) => dispatch(registerUser(payload)), status, error };
}
