'use client'

import { useState, useRef, useCallback } from 'react'
import { X, Upload, Image as ImageIcon, Loader2, Check } from 'lucide-react'

interface ImageUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: (url: string) => void
  folder?: string
  currentImageUrl?: string
  title?: string
}

export default function ImageUploadModal({
  isOpen,
  onClose,
  onUploadSuccess,
  folder = 'uploads',
  currentImageUrl,
  title = 'Upload Image',
}: ImageUploadModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null)
  const [stagedFile, setStagedFile] = useState<File | null>(null)
  const [stagedPreview, setStagedPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    setError('')

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size must be less than 5MB')
      return
    }

    // Stage the file (don't upload yet)
    setStagedFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setStagedPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleConfirmUpload = async () => {
    if (!stagedFile) return

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', stagedFile)
      formData.append('folder', folder)

      const res = await fetch('/api/upload/image', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to upload image')
        setUploading(false)
        return
      }

      // Success - call callback and close
      onUploadSuccess(data.url)
      handleClose()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setUploading(false)
    }
  }

  const handleClose = () => {
    if (!uploading) {
      setPreview(null)
      setStagedFile(null)
      setStagedPreview(null)
      setError('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
          <button
            onClick={handleClose}
            disabled={uploading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Current Image Preview (if exists) */}
          {preview && !stagedPreview && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current image:</p>
              <img
                src={preview}
                alt="Current"
                className="w-full h-64 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
              />
            </div>
          )}

          {/* Staged Image Preview */}
          {stagedPreview && (
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">New image:</p>
              <img
                src={stagedPreview}
                alt="Staged preview"
                className="w-full h-64 object-cover rounded-lg border-2 border-blue-500 dark:border-blue-400"
              />
            </div>
          )}

          {/* Drag and Drop Area */}
          {!stagedPreview && (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              } ${uploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
              onClick={() => !uploading && fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                disabled={uploading}
              />

              {uploading ? (
                <div className="flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                    {preview ? (
                      <ImageIcon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                    ) : (
                      <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                    )}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                    {preview ? 'Click to change image' : 'Drag and drop an image here'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    or click to browse
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Staged file actions */}
          {stagedPreview && !uploading && (
            <div className="flex gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setStagedFile(null)
                  setStagedPreview(null)
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                Choose Different
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleClose}
            disabled={uploading}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
          >
            {stagedPreview ? 'Cancel' : 'Close'}
          </button>
          {stagedPreview && !uploading && (
            <button
              onClick={handleConfirmUpload}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Confirm & Upload
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

