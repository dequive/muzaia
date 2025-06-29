// Profile form component
'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, Save, User, Mail, MapPin, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'
import { toast } from 'react-hot-toast'

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  bio: z.string().max(160, 'Bio deve ter no máximo 160 caracteres').optional(),
  location: z.string().optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  company: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfileForm() {
  const { user, updateProfile } = useAuth()
  const [isUploading, setIsUploading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.metadata?.bio || '',
      location: user?.metadata?.location || '',
      website: user?.metadata?.website || '',
      company: user?.metadata?.company || '',
    },
  })

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const result = await updateProfile({
        name: data.name,
        email: data.email,
        metadata: {
          ...user?.metadata,
          bio: data.bio,
          location: data.location,
          website: data.website,
          company: data.company,
        },
      })

      if (result.success) {
        toast.success('Perfil atualizado com sucesso!')
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil')
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // TODO: Implement avatar upload
      console.log('Upload avatar:', file)
      toast.success('Avatar atualizado!')
    } catch (error) {
      toast.error('Erro ao atualizar avatar')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          Informações Pessoais
        </CardTitle>
        <CardDescription>
          Atualize suas informações de perfil e preferências
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback className="text-lg">
                {getInitials(user?.name || user?.email || 'U')}
              </AvatarFallback>
            </Avatar>
            
            <div>
              <Label htmlFor="avatar" className="cursor-pointer">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isUploading}
                  asChild
                >
                  <span>
                    <Camera className="h-4 w-4 mr-2" />
                    {isUploading ? 'Enviando...' : 'Alterar foto'}
                  </span>
                </Button>
              </Label>
              <input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG ou WEBP. Máximo 2MB.
              </p>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                {...register('name')}
                error={errors.name?.message}
                leftIcon={<User className="h-4 w-4" />}
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                leftIcon={<Mail className="h-4 w-4" />}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              {...register('bio')}
              placeholder="Conte um pouco sobre você..."
              className="resize-none"
              rows={3}
            />
            {errors.bio && (
              <p className="text-sm text-destructive mt-1">{errors.bio.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="Maputo, Moçambique"
                leftIcon={<MapPin className="h-4 w-4" />}
              />
            </div>

            <div>
              <Label htmlFor="company">Empresa</Label>
              <Input
                id="company"
                {...register('company')}
                placeholder="Nome da empresa"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              {...register('website')}
              placeholder="https://seusite.com"
              error={errors.website?.message}
            />
          </div>

          {/* Account Info */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-medium mb-3 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Informações da Conta
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Membro desde:</span>
                <p>{new Date(user?.created_at || '').toLocaleDateString('pt-MZ')}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Última atualização:</span>
                <p>{new Date(user?.updated_at || '').toLocaleDateString('pt-MZ')}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              loading={isSubmitting}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Salvar alterações
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => reset()}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
