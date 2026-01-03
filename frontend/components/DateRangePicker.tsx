'use client'

import { LocalizationProvider } from '@mui/x-date-pickers-pro/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers-pro/AdapterDayjs'
import { DateRangePicker as MUIDateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker'
import dayjs, { Dayjs } from 'dayjs'
import { useState, useEffect } from 'react'

interface DateRangePickerProps {
  startDate: string
  endDate: string
  onChange: (startDate: string, endDate: string) => void
  label?: string
  required?: boolean
  className?: string
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
  label,
  required = false,
  className = '',
}: DateRangePickerProps) {
  const [value, setValue] = useState<[Dayjs | null, Dayjs | null]>([
    startDate ? dayjs(startDate) : null,
    endDate ? dayjs(endDate) : null,
  ])

  // Update value when props change
  useEffect(() => {
    setValue([
      startDate ? dayjs(startDate) : null,
      endDate ? dayjs(endDate) : null,
    ])
  }, [startDate, endDate])

  const handleChange = (newValue: [Dayjs | null, Dayjs | null]) => {
    setValue(newValue)
    if (newValue[0] && newValue[1]) {
      onChange(
        newValue[0].format('YYYY-MM-DD'),
        newValue[1].format('YYYY-MM-DD')
      )
    }
  }

  return (
    <div className={className}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <div className="[&_.MuiOutlinedInput-root]:bg-white [&_.MuiInputBase-input]:text-gray-900">
          <MUIDateRangePicker
            value={value}
            onChange={handleChange}
            slotProps={{
              textField: {
                size: 'small',
                required,
                sx: {
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: 'white',
                    '&.Mui-focused': {
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#166534', // green-800
                      },
                    },
                  },
                  '& .MuiInputBase-input': {
                    color: '#111827',
                  },
                },
              },
            }}
            className="w-full"
          />
        </div>
      </LocalizationProvider>
    </div>
  )
}

