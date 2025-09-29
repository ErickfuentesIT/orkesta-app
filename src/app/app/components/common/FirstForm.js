"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "../ui/Button";
import { registerUser } from "@/services/users";
import { useForm } from "react-hook-form";
import { useAuth } from "@/services/useAuth";

export default function FirstForm({ title = "Form title", isLogin = true }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      username: "",
      password: "",
      confirmPassword: "",
      remember: true,
      name: "",
    },
    mode: "onSubmit",
  });

  const router = useRouter();
  const { login, loading } = useAuth();

  const onSubmit = async ({
    username,
    password,
    confirmPassword,
    remember,
    name,
  }) => {
    const email = username.trim();

    if (!isLogin) {
      if (password !== confirmPassword) {
        setError("confirmPassword", {
          type: "manual",
          message: "Las contraseñas no coinciden",
        });
        return;
      }
      try {
        await registerUser({
          userName: name?.trim() || email,
          email,
          password,
          userStatus: 1,
        });

        const res = await login({ email, password, remember });
        router.replace(res.ok ? "/app/dashboard" : "/app/login");
        return;
      } catch (e) {
        setError("root", {
          type: "manual",
          message: e.message || "No se pudo registrar",
        });
        return;
      }
    }

    // ----- LOGIN -----
    const res = await login({ email, password, remember });
    if (res.ok) router.replace("/app/dashboard");
    else {
      setError("root", {
        type: "manual",
        message: res.message || "Credenciales inválidas, intente nuevamente",
      });
    }
  };

  return (
    <>
      <h2>{title}</h2>

      <form
        className="form-grid"
        autoComplete="on"
        onSubmit={handleSubmit(onSubmit)}
      >
        {!isLogin && (
          <>
            <label htmlFor="name" className="muted">
              Nombre:
            </label>
            <input
              id="name"
              type="text"
              placeholder="Tu nombre"
              {...register("name", {
                required: "Ingresa tu nombre",
                minLength: { value: 2, message: "Mínimo de 2 caracteres" },
              })}
            />
          </>
        )}

        <label htmlFor="user" className="muted">
          Email:
        </label>
        <input
          id="user"
          type="email"
          autoComplete="username"
          placeholder="Ingresa tu email"
          {...register("username", {
            required: "Ingresa tu email",
            pattern: { value: /\S+@\S+\.\S+/, message: "Email inválido" },
          })}
        />

        <label htmlFor="pass" className="muted">
          Contraseña:
        </label>
        <input
          id="pass"
          type="password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          placeholder="Ingresa tu contraseña"
          {...register("password", {
            required: "Ingresa tu contraseña",
            minLength: { value: 3, message: "Mínimo 3 caracteres" },
          })}
        />

        {!isLogin && (
          <>
            <label htmlFor="confirm-pass" className="muted">
              Confirmar Contraseña:
            </label>
            <input
              id="confirm-pass"
              type="password"
              autoComplete="new-password"
              placeholder="Confirma tu contraseña"
              {...register("confirmPassword", {
                required: "Ingresa la confirmación de tu contraseña",
                minLength: { value: 3, message: "Mínimo 3 caracteres" },
              })}
            />
          </>
        )}

        <div
          className="grid-column-2"
          style={{ display: isLogin ? "block" : "none" }}
        >
          <label className="check">
            <input id="remember" type="checkbox" {...register("remember")} />
            <span className="muted">Recordarme</span>
          </label>
        </div>

        <Button
          className="grid-column-2 btn-sweep"
          type="submit"
          disabled={isSubmitting || loading}
        >
          {isLogin
            ? loading
              ? "Ingresando..."
              : "INICIAR SESIÓN"
            : loading
            ? "Creando..."
            : "REGISTRARSE"}
        </Button>

        <p className="muted grid-column-2">
          {!isLogin ? (
            <>
              ¿Ya tienes una cuenta?{" "}
              <Link href="/app/login">Inicia Sesión</Link>
            </>
          ) : (
            <>
              ¿No tienes una cuenta?{" "}
              <Link href="/app/register">Regístrate</Link>
            </>
          )}
        </p>
      </form>

      {Object.keys(errors).length > 0 && (
        <section className="form-validations">
          <ul>{errors.username && <small>{errors.username.message}</small>}</ul>
          <ul>{errors.password && <small>{errors.password.message}</small>}</ul>
          <ul>
            {errors.confirmPassword && (
              <small>{errors.confirmPassword.message}</small>
            )}
          </ul>
          <ul>{errors.root && <small>{errors.root.message}</small>}</ul>
        </section>
      )}
    </>
  );
}
