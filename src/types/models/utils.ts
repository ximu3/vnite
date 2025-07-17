export interface AttachmentChange {
  dbName: string
  docId: string
  attachmentId: string
  timestamp: number
}

export type DocChange = { dbName: string; docId: string; data: any; timestamp: number }
