'use client'

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, PencilIcon, Trash2 } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

/**
 * UserManagement - Componente de gerenciamento de usuários.
 * Permite listar, adicionar, editar e remover usuários.
 */
export function UserManagement() {
  // Aqui você pode adicionar estados e lógica como:
  // const [users, setUsers] = useState([])
  // const [isAddingUser, setIsAddingUser] = useState(false)
  
  // Dados de exemplo - em produção, isso viria de uma API
  const users = [
    { 
      id: '1', 
      name: 'Maria Souza', 
      email: 'maria@exemplo.com', 
      role: 'Admin'
    },
    { 
      id: '2', 
      name: 'João Pereira', 
      email: 'joao@exemplo.com', 
      role: 'Editor'
    },
    { 
      id: '3', 
      name: 'Carlos Silva', 
      email: 'carlos@exemplo.com', 
      role: 'Usuário'
    }
  ];

  // Funções de manipulação - implementação real seria necessária
  const handleEdit = (userId: string) => {
    console.log(`Editar usuário ${userId}`);
  };

  const handleDelete = (userId: string) => {
    console.log(`Excluir usuário ${userId}`);
  };

  const handleAddUser = () => {
    console.log("Adicionar novo usuário");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Gestão de Usuários</CardTitle>
          <CardDescription>
            Gerencie os usuários do sistema
          </CardDescription>
        </div>
        <Button onClick={handleAddUser}>
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar Usuário
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Função</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'Admin' ? 'default' : 'outline'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(user.id)}>
                        <PencilIcon className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(user.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                        <span className="sr-only">Excluir</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
