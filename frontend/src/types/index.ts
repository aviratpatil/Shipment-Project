export type UserRole = "ADMIN" | "USER" | "DRIVER";

export type CustomerStatus = "Active" | "Inactive";

export type ShipmentStatus =
  | "PENDING"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

export type TruckStatus = "NO_ALLOTMENT" | "READY" | "ACTIVE" | "INACTIVE";

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
  truckId?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    company: string;
  };
  truck?: {
    id: string;
    name: string;
    plateNumber: string;
  } | null;
  statusHistory?: ShipmentStatusHistory[];
}

export interface Driver {
  id: string;
  userId: string;
  phone: string;
  address: string;
  photoUrl?: string | null;
  licenseNumber: string;
  isOnDuty: boolean;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    createdAt: string;
  };
  truck?: {
    id: string;
    name: string;
    plateNumber: string;
    status: TruckStatus;
    shipments?: Shipment[];
  } | null;
}

export interface Truck {
  id: string;
  name: string;
  plateNumber: string;
  capacity: number;
  status: TruckStatus;
  driverId?: string | null;
  createdAt: string;
  updatedAt: string;
  driver?: Driver | null;
  shipments: Shipment[];
  _count?: {
    shipments: number;
  };
}

export interface ShortageCheck {
  readyTrucks: number;
  availableDrivers: number;
  shortageCount: number;
  hasShortage: boolean;
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
