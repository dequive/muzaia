'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { UsersList } from './users-list'
import { UserForm } from './user-form'
import type { User } from '@/types'

export interface UserManagementProps {
  initialUsers?: User[]
}

export function UserManagement({ initialUsers = [] }: UserManagementProps) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Usuários</CardTitle>
      </CardHeader>
      <CardContent>
        <UsersList users={users} onUserUpdate={setUsers} />
        <UserForm onUserCreate={(newUser) => setUsers([...users, newUser])} />
      </CardContent>
    </Card>
  )
}
