'use client'

import React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Activity, AlertTriangle } from 'lucide-react'

// O Next.js está procurando por uma exportação nomeada "AdminOverview",
// não uma exportação padrão
export function AdminOverview() {
  // Conteúdo do componente
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão Geral do Sistema</CardTitle>
        <CardDescription>Métricas e estatísticas principais</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center p-4 space-x-4 bg-background/50 border rounded-lg">
            <div className="bg-primary/10 p-2 rounded-full">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Usuários Ativos</p>
              <p className="text-2xl font-semibold">120</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 space-x-4 bg-background/50 border rounded-lg">
            <div className="bg-green-500/10 p-2 rounded-full">
              <Activity className="h-6 w-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Operações Hoje</p>
              <p className="text-2xl font-semibold">34</p>
            </div>
          </div>
          
          <div className="flex items-center p-4 space-x-4 bg-background/50 border rounded-lg">
            <div className="bg-orange-500/10 p-2 rounded-full">
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Erros (24h)</p>
              <p className="text-2xl font-semibold">0</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
