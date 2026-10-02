import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from './Button'

/**
 * Maps raw HTTP/axios errors to a friendly message. Never shows a bare
 * "Prediction failed" or a raw stack trace - always something the person
 * can act on.
 */
export function friendlyErrorMessage(error, context = 'complete this request') {
  const status = error?.response?.status
  if (!error?.response) {
    return `Unable to reach the server. Please check that the backend is running and try again.`
  }
  if (status === 401) return 'Your session has expired. Please log in again.'
  if (status === 403) return "You don't have permission to view this. If you think this is a mistake, contact an administrator."
  if (status === 404) return 'The requested record could not be found — it may have been removed.'
  if (status === 503) return `The model isn't ready yet. Ask an admin to train it from the Admin panel, then try again.`
  if (status >= 500) return `Something went wrong on the server while trying to ${context}. Please try again shortly.`
  return error?.response?.data?.detail || `Unable to ${context}. Please check your input and try again.`
}

export default function ErrorState({ error, context, onRetry, detail, className = '' }) {
  const message = typeof error === 'string' ? error : friendlyErrorMessage(error, context)
  return (
    <div className={`glass rounded-2xl p-6 border-danger/40 text-center ${className}`}>
      <AlertTriangle className="text-danger mx-auto mb-3" size={28} />
      <p className="text-slate-200 mb-1">{message}</p>
      {detail && <p className="text-slate-500 text-xs mb-3">{detail}</p>}
      {onRetry && (
        <Button variant="ghost" onClick={onRetry} className="mt-3">
          <RefreshCw size={15} className="inline mr-2" /> Retry
        </Button>
      )}
    </div>
  )
}
