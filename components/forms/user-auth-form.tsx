"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import useSWR from "swr";
import * as z from "zod";

import { siteConfig } from "@/config/site";
import { cn, fetcher } from "@/lib/utils";
import { userAuthSchema } from "@/lib/validations/auth";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/shared/icons";

import { Skeleton } from "../ui/skeleton";

interface UserAuthFormProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: string;
}

type FormData = z.infer<typeof userAuthSchema>;

export function UserAuthForm({ className, type, ...props }: UserAuthFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(userAuthSchema),
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState<boolean>(false);
  const [isGithubLoading, setIsGithubLoading] = React.useState<boolean>(false);
  const [isLinuxDoLoading, setIsLinuxDoLoading] =
    React.useState<boolean>(false);
  const searchParams = useSearchParams();

  const t = useTranslations("Auth");

  async function onSubmit(data: FormData) {
    setIsLoading(true);

    const signInResult = await signIn("resend", {
      email: data.email.toLowerCase(),
      redirect: false,
      callbackUrl: searchParams?.get("from") || "/dashboard",
    });

    setIsLoading(false);

    if (!signInResult?.ok) {
      return toast.error("Something went wrong.", {
        description: "Your sign in request failed. Please try again.",
      });
    }

    return toast.success("Check your email", {
      description: "We sent you a login link. Be sure to check your spam too.",
    });
  }

  const { data: loginMethod, isLoading: isLoadingMethod } = useSWR<
    Record<string, boolean>
  >("/api/feature", fetcher, {
    revalidateOnFocus: false,
  });

  const rendeSeparator = () => {
    return (
      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            {t("Or continue with")}
          </span>
        </div>
      </div>
    );
  };

  if (isLoadingMethod || !loginMethod) {
    return (
      <div className={cn("grid gap-3", className)} {...props}>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        {rendeSeparator()}
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className={cn("grid gap-3", className)} {...props}>
      {loginMethod["google"] && (
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }))}
          onClick={() => {
            setIsGoogleLoading(true);
            signIn("google");
          }}
          disabled={
            !siteConfig.openSignup ||
            isLoading ||
            isGoogleLoading ||
            isGithubLoading ||
            isLinuxDoLoading
          }
        >
          {isGoogleLoading ? (
            <Icons.spinner className="mr-2 size-4 animate-spin" />
          ) : (
            <Icons.google className="mr-2 size-4" />
          )}{" "}
          Google
        </button>
      )}
      {loginMethod["github"] && (
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }))}
          onClick={() => {
            setIsGithubLoading(true);
            signIn("github");
          }}
          disabled={
            !siteConfig.openSignup ||
            isLoading ||
            isGithubLoading ||
            isGoogleLoading ||
            isLinuxDoLoading
          }
        >
          {isGithubLoading ? (
            <Icons.spinner className="mr-2 size-4 animate-spin" />
          ) : (
            <Icons.github className="mr-2 size-4" />
          )}{" "}
          Github
        </button>
      )}
      {loginMethod["linuxdo"] && (
        <button
          type="button"
          className={cn(buttonVariants({ variant: "outline" }))}
          onClick={() => {
            setIsLinuxDoLoading(true);
            signIn("linuxdo");
          }}
          disabled={
            !siteConfig.openSignup ||
            isLoading ||
            isGithubLoading ||
            isGoogleLoading ||
            isLinuxDoLoading
          }
        >
          {isLinuxDoLoading ? (
            <Icons.spinner className="mr-2 size-4 animate-spin" />
          ) : (
            <img
              src="/_static/images/linuxdo.webp"
              alt="linuxdo"
              className="mr-2 size-4"
            />
          )}{" "}
          LinuxDo
        </button>
      )}

      {(loginMethod["google"] ||
        loginMethod["github"] ||
        loginMethod["linuxdo"]) &&
        loginMethod["resend"] &&
        rendeSeparator()}

      {loginMethod["resend"] && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <div className="grid gap-1">
              <Label className="sr-only" htmlFor="email">
                Email
              </Label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                disabled={isLoading || isGoogleLoading}
                {...register("email")}
              />
              {errors?.email && (
                <p className="px-1 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
            <button
              className={cn(buttonVariants(), "mt-3")}
              disabled={
                !siteConfig.openSignup ||
                isLoading ||
                isGoogleLoading ||
                isGithubLoading
              }
            >
              {isLoading && (
                <Icons.spinner className="mr-2 size-4 animate-spin" />
              )}
              {type === "register"
                ? t("Sign Up with Email")
                : t("Sign In with Email")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
