export enum UserRole {
  ADMIN = 'ADMIN',
  SPV = 'SPV',
  MECHANIC = 'MECHANIC',
}

export enum WorkOrderStatus {
  OPEN = 'OPEN',
  SUBMITTED = 'SUBMITTED',
  ASSIGNED = 'ASSIGNED',
  WAITING_SPAREPART = 'WAITING_SPAREPART',
  WORKING = 'WORKING',
  COMPLETED = 'COMPLETED',
}

export enum SparepartRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}
