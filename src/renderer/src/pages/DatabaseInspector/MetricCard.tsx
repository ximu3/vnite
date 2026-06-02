import React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'

export function DatabaseInspectorMetricCard({
  title,
  value,
  hint,
  icon
}: {
  title: string
  value: string
  hint?: string
  icon: React.ReactNode
}): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm font-medium">
          <span>{title}</span>
          <span className="text-muted-foreground">{icon}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
      </CardContent>
    </Card>
  )
}
