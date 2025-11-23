import { TemplatePayloads } from '@appTypes/poster'
import { FieldSchema } from '@appTypes/poster/templates/schema'
import { ColorPicker } from '@ui/color-picker'
import { Input, StepperInput } from '@ui/input'
import { Switch } from '@ui/switch'
import React from 'react'
import { Card, CardContent } from '~/components/ui/card'
import { usePosterTemplateStore } from '../store'

function FieldControl<T extends keyof TemplatePayloads>({
  template,
  field,
  value
}: {
  template: T
  field: FieldSchema<TemplatePayloads[T]>
  value: TemplatePayloads[T][keyof TemplatePayloads[T]]
}): React.JSX.Element {
  const setField = usePosterTemplateStore((s) => s.setField)

  switch (field.type) {
    case 'checkbox':
      return (
        <Switch
          checked={value as boolean}
          onCheckedChange={(v) => setField(template, field.key, v as any)}
        />
      )
    case 'number':
      return (
        <StepperInput
          className="w-30"
          value={value as number}
          min={field.min}
          max={field.max}
          steps={{ default: field.step, ctrl: field.step * 5 }}
          onChange={(e) => setField(template, field.key, Number(e.target.value) as any)}
        />
      )
    case 'color':
      return (
        <ColorPicker
          value={value as string}
          onChange={(v) => setField(template, field.key, v as any)}
        />
      )
    case 'text':
    default:
      return (
        <Input
          type="text"
          value={value as string}
          onChange={(e) => setField(template, field.key, e.target.value as any)}
          className="border rounded px-1 py-0.5 w-64"
        />
      )
  }
}

function ConfigFormRow<T extends keyof TemplatePayloads>({
  template,
  field,
  value
}: {
  template: T
  field: FieldSchema<TemplatePayloads[T]>
  value: TemplatePayloads[T][keyof TemplatePayloads[T]]
}): React.JSX.Element {
  return (
    <Card>
      <CardContent className="flex items-center justify-between space-x-4">
        <div className="flex flex-col">
          <span className="text-xs text-gray-500">{String(field.key)}</span>
          <span className="text-sm font-medium">{String(field.key)}</span>
        </div>
        <FieldControl template={template} field={field} value={value} />
      </CardContent>
    </Card>
  )
}

export function ConfigForm<T extends keyof TemplatePayloads>({
  template,
  schema
}: {
  template: T
  schema: FieldSchema<TemplatePayloads[T]>[]
}): React.JSX.Element {
  const payload = usePosterTemplateStore((s) => s.payloads[template])

  return (
    <Card className="mt-4">
      <CardContent className="grid grid-cols-2 gap-x-8 gap-y-3 relative">
        <div className="absolute top-0 bottom-0 left-1/2 border-r border-1 border-primary pointer-events-none" />

        {schema.map((field) => (
          <ConfigFormRow
            key={String(field.key)}
            template={template}
            field={field}
            value={payload[field.key]}
          />
        ))}
      </CardContent>
    </Card>
  )
}
