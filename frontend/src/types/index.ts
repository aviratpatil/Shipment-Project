export type UserRole = "ADMIN" | "USER";

export type CustomerStatus = "Active" | "Inactive";

export type ShipmentStatus =
  | "PENDING"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  company: string;
  status: CustomerStatus;
  isDeleted: boolean;
  createdAt: string;
  _count?: {
    shipments: number;
  };
}

export interface ShipmentStatusHistory {
  id: string;
  shipmentId: string;
  status: ShipmentStatus;
  updatedAt: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  customerId: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    company: string;
  };
  statusHistory?: ShipmentStatusHistory[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  errors?: Array<{ field: string; message: string }>;
}
