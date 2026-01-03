'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import ImageUploadModal from '@/components/ImageUploadModal'
import DateRangePicker from '@/components/DateRangePicker'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function CreateTripPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    trip_name: '',
    trip_description: '',
    start_date: '',
    end_date: '',
    cover_photo_url: '',
    total_budget: '',
    is_public: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)

  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 3

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (currentStep < totalSteps) {
      nextStep()
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          total_budget: formData.total_budget ? parseFloat(formData.total_budget) : null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create trip')
        setLoading(false)
        return
      }

      router.push(`/trips/${data.trip.trip_id}/builder`)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24 flex flex-col">
      <div className="flex-1 flex flex-col justify-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                  step <= currentStep ? 'bg-green-800' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm font-medium text-gray-500 text-right">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        <Card className="shadow-lg border-gray-100 flex-1 flex flex-col">
          <CardHeader className="space-y-4">
            <CardTitle className="text-4xl font-bold tracking-tight text-green-900">Create New Trip</CardTitle>
          </CardHeader>
          <CardContent className="p-5 mt-[-20] md:p-10 flex-1 flex flex-col justify-center">
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
              <div className="flex-1 flex flex-col justify-center">
                <FieldGroup className="gap-10">
                  {error && (
                    <FieldError className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg text-base">
                      {error}
                    </FieldError>
                  )}

                  {currentStep === 1 && (
                    <FieldSet className="gap-8 animate-in fade-in slide-in-from-right-8 duration-500">
                      <FieldLegend className="text-2xl font-semibold text-gray-900 mb-4">Trip Information</FieldLegend>
                      <FieldDescription className="text-base">
                        Provide basic details about your trip
                      </FieldDescription>
                      <FieldGroup className="gap-8">
                        <Field>
                          <FieldLabel htmlFor="trip_name" className="text-lg font-medium text-gray-700 mb-2">
                            Trip Name *
                          </FieldLabel>
                          <Input
                            id="trip_name"
                            type="text"
                            placeholder="e.g., Summer Europe Adventure"
                            required
                            value={formData.trip_name}
                            onChange={(e) => setFormData({ ...formData, trip_name: e.target.value })}
                            className="text-lg py-6 px-4"
                            autoFocus
                          />
                          <FieldDescription className="text-sm mt-2">
                            Give your trip a memorable name
                          </FieldDescription>
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="trip_description" className="text-lg font-medium text-gray-700 mb-2">
                            Description
                          </FieldLabel>
                          <Textarea
                            id="trip_description"
                            placeholder="Describe your trip, places you want to visit, activities you're planning..."
                            rows={6}
                            className="resize-none text-lg p-4"
                            value={formData.trip_description}
                            onChange={(e) => setFormData({ ...formData, trip_description: e.target.value })}
                          />
                          <FieldDescription className="text-sm mt-2">
                            Optional: Add details about your trip plans
                          </FieldDescription>
                        </Field>
                      </FieldGroup>
                    </FieldSet>
                  )}

                  {currentStep === 2 && (
                    <FieldSet className="gap-8 animate-in fade-in slide-in-from-right-8 duration-500">
                      <FieldLegend className="text-2xl font-semibold text-gray-900 mb-4">Logistics</FieldLegend>
                      <FieldDescription className="text-base">
                        When are you going and how much are you planning to spend?
                      </FieldDescription>
                      <FieldGroup className="gap-8">
                        <Field>
                          <FieldLabel className="text-lg font-medium text-gray-700 mb-2">
                            Trip Dates *
                          </FieldLabel>
                          <DateRangePicker
                            startDate={formData.start_date}
                            endDate={formData.end_date}
                            onChange={(start, end) => {
                              setFormData({ ...formData, start_date: start, end_date: end })
                            }}
                            required
                            className="text-lg"
                          />
                        </Field>

                        <Field>
                          <FieldLabel htmlFor="total_budget" className="text-lg font-medium text-gray-700 mb-2">
                            Total Budget (USD)
                          </FieldLabel>
                          <Input
                            id="total_budget"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={formData.total_budget}
                            onChange={(e) => setFormData({ ...formData, total_budget: e.target.value })}
                            className="text-lg py-6 px-4 font-mono"
                          />
                          <FieldDescription className="text-sm mt-2">
                            Optional: Set your total budget for this trip
                          </FieldDescription>
                        </Field>
                      </FieldGroup>
                    </FieldSet>
                  )}

                  {currentStep === 3 && (
                    <FieldSet className="gap-8 animate-in fade-in slide-in-from-right-8 duration-500">
                      <FieldLegend className="text-2xl font-semibold text-gray-900 mb-4">Visuals & Privacy</FieldLegend>
                      <FieldDescription className="text-base">
                        Add a cover photo and set your privacy preferences
                      </FieldDescription>
                      <FieldGroup className="gap-8">
                        <Field>
                          <FieldLabel className="text-lg font-medium text-gray-700 mb-2">Cover Photo</FieldLabel>
                          {formData.cover_photo_url && (
                            <div className="mb-4">
                              <img
                                src={formData.cover_photo_url}
                                alt="Cover preview"
                                className="w-full h-64 object-cover rounded-xl border border-gray-200 shadow-md"
                              />
                            </div>
                          )}
                          <div className="flex gap-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowImageModal(true)}
                              className="h-12 px-6 text-base"
                            >
                              {formData.cover_photo_url ? 'Change Photo' : 'Upload Photo'}
                            </Button>
                            {formData.cover_photo_url && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setFormData({ ...formData, cover_photo_url: '' })}
                                className="h-12 px-6 text-base text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                          <FieldDescription className="text-sm mt-2">
                            Upload a cover image for your trip (optional)
                          </FieldDescription>
                        </Field>

                        <div className="flex items-center justify-between p-6 bg-gray-50 rounded-xl border border-gray-100">
                          <div className="space-y-1">
                            <FieldLabel
                              htmlFor="is_public"
                              className="text-lg font-medium text-gray-900"
                            >
                              Make this trip public
                            </FieldLabel>
                            <FieldDescription className="text-base text-gray-500">
                              Public trips can be discovered and shared by other users
                            </FieldDescription>
                          </div>
                          <Switch
                            id="is_public"
                            checked={formData.is_public}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                            className="scale-125"
                          />
                        </div>
                      </FieldGroup>
                    </FieldSet>
                  )}
                </FieldGroup>
              </div>

              <div className="flex gap-6 pt-10 mt-auto border-t border-gray-100">
                {currentStep > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    className="h-14 px-10 text-lg font-medium text-gray-600 border-gray-300 hover:bg-gray-100"
                  >
                    Back
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="h-14 px-10 text-lg font-medium text-gray-600 border-gray-300 hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                )}
                
                <Button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 h-14 text-lg font-semibold bg-green-800 hover:bg-green-900 text-white shadow-lg transition-all hover:scale-[1.01]"
                >
                  {loading ? 'Creating Trip...' : (currentStep === totalSteps ? 'Create Trip' : 'Next')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <ImageUploadModal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        onUploadSuccess={(url) => {
          setFormData({ ...formData, cover_photo_url: url })
          setShowImageModal(false)
        }}
        folder="trips"
        currentImageUrl={formData.cover_photo_url}
        title="Upload Trip Cover Photo"
      />
    </div>
  )
}

