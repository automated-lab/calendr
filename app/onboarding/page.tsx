'use client'

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useActionState } from 'react'
import { OnboardingAction } from '../actions/actions'
import { useForm } from '@conform-to/react'
import { onboardingSchema } from '../lib/zodSchemas'
import { parseWithZod } from '@conform-to/zod'
import { SubmitButton } from "../components/SubmitButtons";



export default function OnboardingRoute() {
  const [lastResult, action] = useActionState(OnboardingAction, undefined);

  const [form, fields] = useForm({

    lastResult,

    onValidate({ formData }) {
      return parseWithZod(formData, { schema: onboardingSchema });
    },

    shouldValidate: 'onBlur',
    shouldRevalidate: 'onInput',
  })
  return (
    <div className="min-h-screen w-screen flex items-center justify-center">
      <Card>    
        <CardHeader>
          <CardTitle>
            Welcome to Calend<span className="text-primary">r</span>
          </CardTitle>
          <CardDescription className="pt-2">
            Let&apos;s get you started
            </CardDescription>
        </CardHeader>
      <form id={form.id} onSubmit={form.onSubmit} action={action} noValidate>
      <CardContent className="flex flex-col gap-y-5">
          <div className="grid gap-y-2">
            <Label>Name</Label>
            <Input name={fields.fullName.name} defaultValue={fields.fullName.initialValue} key={fields.fullName.key} placeholder="Your Name" />
            <p className="text-red-500 text-xs">{fields.fullName.errors}</p>
          </div>
          <div className="grid gap-y-2">
            <Label>Username</Label>
            <div className="flex rounded-md">
              <span className="inline-flex items-center px-3 rounded-l-md border-r-0 border-muted bg-muted text-sm text-muted-foreground">okbook.me/</span>
              <Input name={fields.username.name} defaultValue={fields.username.initialValue} key={fields.username.key} placeholder="Your Username" className="rounded-l-none" />
            </div>
            <p className="text-red-500 text-xs">{fields.username.errors}</p>
          </div>
        </CardContent>
        <CardFooter>
          <SubmitButton text="Submit" className="w-full" />
        </CardFooter>
      </form>
      </Card>
    </div>
  );
}
