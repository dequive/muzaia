"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { UserPlus, Pencil, Trash2, User } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Switch } from "@/components/ui/switch"

// Certifique-se de que esta seja uma exportação nomeada, não padrão
export function UserManagement() {
  // O restante do seu componente...
  // Adicionei um componente básico para evitar erros
  
  const [users, setUsers] = useState([
    { 
      id: '1', 
      name: 'Dequive', 
      email: 'dequive@mozaia.com',
      role: 'Admin',
      status: 'active',
      lastLogin: '2025-07-01 22:30:00'
    },
    { 
      id: '2', 
      name: 'João Pereira', 
      email: 'joao@mozaia.com',
      role: 'Editor',
      status: 'active',
      lastLogin: '2025-07-01 19:15:32'
    },
    { 
      id: '3', 
      name: 'Ana Silva', 
      email: 'ana@mozaia.com',
      role: 'Viewer',
      status: 'inactive',
      lastLogin: '2025-06-25 14:22:10'
    },
  ]);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Gestão de Usuários</CardTitle>
        <CardDescription className="text-xs">Gerencie usuários e permissões</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-6 py-3 flex items-center justify-between gap-2">
          <div className="relative flex-1">
            <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              className="pl-8 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button size="sm" className="h-9">
            <UserPlus className="h-4 w-4 mr-1" />
            Novo Usuário
          </Button>
        </div>
        
        <div className="border-t">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Último Login</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                      {user.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{user.lastLogin}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover usuário</AlertDialogTitle>
                            <AlertDialogDescription>
                              Tem certeza que deseja remover este usuário? Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction>Confirmar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t px-6 py-3">
        <div className="text-xs text-muted-foreground">
          Exibindo {filteredUsers.length} de {users.length} usuários
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">Mostrar inativos</span>
          <Switch />
        </div>
      </CardFooter>
    </Card>
  )
}
