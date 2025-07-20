
'use client'

import { motion } from 'framer-motion'
import {
  FileText,
  Image,
  Music,
  Download,
  Eye,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Attachment {
  id: string
  name: string
  type: string
  size: number
  url?: string
  thumbnail?: string
}

interface MessageAttachmentsProps {
  attachments: Attachment[]
  isOwn?: boolean
  onRemove?: (attachmentId: string) => void
  className?: string
}

export function MessageAttachments({
  attachments,
  isOwn = false,
  onRemove,
  className
}: MessageAttachmentsProps) {
  if (!attachments.length) return null

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image
    if (type.startsWith('audio/')) return Music
    return FileText
  }

  const getFileTypeColor = (type: string) => {
    if (type.startsWith('image/')) return 'text-green-600'
    if (type.startsWith('audio/')) return 'text-purple-600'
    if (type.includes('pdf')) return 'text-red-600'
    return 'text-blue-600'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className={cn("space-y-2", className)}>
      {attachments.map((attachment, index) => {
        const Icon = getFileIcon(attachment.type)
        const colorClass = getFileTypeColor(attachment.type)

        return (
          <motion.div
            key={attachment.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "flex items-center space-x-3 p-3 rounded-lg border",
              isOwn 
                ? "bg-blue-50 border-blue-200" 
                : "bg-gray-50 border-gray-200"
            )}
          >
            {/* File thumbnail or icon */}
            <div className={cn("flex-shrink-0", colorClass)}>
              {attachment.thumbnail ? (
                <img
                  src={attachment.thumbnail}
                  alt={attachment.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <Icon className="h-8 w-8" />
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {attachment.name}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {attachment.type.split('/')[1]?.toUpperCase() || 'FILE'}
                </Badge>
                <span className="text-xs text-gray-500">
                  {formatFileSize(attachment.size)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1">
              {attachment.url && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {isOwn && onRemove && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemove(attachment.id)}
                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
