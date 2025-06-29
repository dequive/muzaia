// Regenerate response button
'use client'

import { motion } from 'framer-motion'
import { RotateCcw, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface RegenerateButtonProps {
  onClick: () => void
  isLoading?: boolean
}

export function RegenerateButton({ onClick, isLoading = false }: RegenerateButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <Button
        variant="outline"
        size="sm"
        onClick={onClick}
        disabled={isLoading}
        className="h-8 px-3 text-xs border-dashed hover:border-solid transition-all"
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <RotateCcw className="h-3 w-3 mr-1" />
          </motion.div>
        ) : (
          <Zap className="h-3 w-3 mr-1" />
        )}
        Regenerar resposta
      </Button>
    </motion.div>
  )
}
