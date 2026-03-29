type JobStatus =
  | 'RECEIVED'
  | 'DIAGNOSED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_PARTS'
  | 'COMPLETED'
  | 'DELIVERED'
  | 'CANCELLED'

const STATUS_CONFIG: Record<JobStatus, { label: string; className: string }> = {
  RECEIVED: {
    label: 'Received',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  DIAGNOSED: {
    label: 'Diagnosed',
    className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    className: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  WAITING_FOR_PARTS: {
    label: 'Waiting for Parts',
    className: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  COMPLETED: {
    label: 'Completed',
    className: 'bg-green-50 text-green-700 border-green-200',
  },
  DELIVERED: {
    label: 'Delivered',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-red-50 text-red-700 border-red-200',
  },
}

export default function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as JobStatus] ?? {
    label: status,
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}
    >
      {config.label}
    </span>
  )
}
