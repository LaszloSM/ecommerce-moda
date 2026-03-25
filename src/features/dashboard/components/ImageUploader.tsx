'use client'

import * as React from 'react'
import { motion, Reorder, AnimatePresence } from 'framer-motion'
import { Upload, X, ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

interface UploadItem {
  id: string
  file: File
  preview: string
  progress: number
  url: string | null
}

interface ImageUploaderProps {
  value: string[]
  onChange: (urls: string[]) => void
  maxFiles?: number
  bucket: string
}

export function ImageUploader({
  value,
  onChange,
  maxFiles = 5,
  bucket,
}: ImageUploaderProps) {
  const [items, setItems] = React.useState<UploadItem[]>(() =>
    value.map((url, i) => ({
      id: `existing-${i}`,
      file: new File([], ''),
      preview: url,
      progress: 100,
      url,
    })),
  )
  const [isDragging, setIsDragging] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    return () => {
      items.forEach(item => {
        if (item.preview.startsWith('blob:')) {
          URL.revokeObjectURL(item.preview)
        }
      })
    }
  }, []) // intentionally empty — runs only on unmount

  const uploadFile = async (item: UploadItem) => {
    const supabase = createClient()
    const ext = item.file.name.split('.').pop() ?? 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    // Simulate progress ticks before actual upload
    for (let p = 10; p <= 80; p += 10) {
      await new Promise<void>((r) => setTimeout(r, 80))
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, progress: p } : it)),
      )
    }

    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, item.file, { upsert: false })

    if (error) {
      setItems((prev) => prev.filter((it) => it.id !== item.id))
      return
    }

    const { data: publicData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)

    const url = publicData.publicUrl

    setItems((prev) => {
      const updated = prev.map((it) =>
        it.id === item.id ? { ...it, progress: 100, url } : it,
      )
      onChange(updated.map((it) => it.url).filter(Boolean) as string[])
      return updated
    })
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const arr = Array.from(files).slice(0, maxFiles - items.length)
    const newItems: UploadItem[] = arr.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      url: null,
    }))
    setItems((prev) => [...prev, ...newItems])
    newItems.forEach(uploadFile)
  }

  const removeItem = (id: string) => {
    setItems((prev) => {
      const removedItem = prev.find((it) => it.id === id)
      if (removedItem?.preview.startsWith('blob:')) {
        URL.revokeObjectURL(removedItem.preview)
      }
      const next = prev.filter((it) => it.id !== id)
      onChange(next.map((it) => it.url).filter(Boolean) as string[])
      return next
    })
  }

  const handleReorder = (newOrder: UploadItem[]) => {
    setItems(newOrder)
    onChange(newOrder.map((it) => it.url).filter(Boolean) as string[])
  }

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        className={cn(
          'relative rounded-2xl border-2 border-dashed transition-all duration-200',
          isDragging
            ? 'border-violet-500 bg-violet-500/10 scale-[1.01]'
            : 'border-white/15 bg-white/5 hover:border-violet-500/50',
          items.length >= maxFiles && 'opacity-50 pointer-events-none',
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
          <motion.div
            animate={{ scale: isDragging ? 1.15 : 1 }}
            className="p-4 rounded-full bg-violet-500/15 border border-violet-400/20"
          >
            <Upload className="w-8 h-8 text-violet-400" />
          </motion.div>
          <div>
            <p className="text-sm font-medium text-white/80">
              Arrastra imágenes aquí
            </p>
            <p className="text-xs text-white/40 mt-0.5">
              o haz clic para seleccionar ({items.length}/{maxFiles})
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            className="border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
          >
            <ImageIcon className="w-4 h-4 mr-1.5" />
            Seleccionar imágenes
          </Button>
        </div>
      </div>

      {/* Preview grid */}
      {items.length > 0 && (
        <Reorder.Group
          axis="x"
          values={items}
          onReorder={handleReorder}
          className="grid grid-cols-3 sm:grid-cols-5 gap-3"
        >
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <Reorder.Item
                key={item.id}
                value={item}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.18 }}
                className="relative group cursor-grab active:cursor-grabbing"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5">
                  {/* blob: URLs cannot be optimized by next/image */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.preview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />

                  {item.progress < 100 && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1.5 px-3">
                      <Progress value={item.progress} className="h-1 bg-white/20" />
                      <span className="text-xs text-white/70">{item.progress}%</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-red-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </Reorder.Item>
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}
    </div>
  )
}

export default ImageUploader
