export interface Asset {
  id: string;
  assetTag: string;
  assetType: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  purchaseDate?: string;
  warrantyUntil?: string;
  active: boolean;
  totalQuantity: number;
  availableQuantity: number;
}

export interface AssetAssignment {
  id: string;
  userId: string;
  userName: string;
  assetId: string;
  assetTag: string;
  assetType: string;
  assetModel?: string;
  assignedOn: string;
  returnedOn?: string;
  conditionOnAssign: AssetCondition;
  conditionOnReturn?: AssetCondition;
  status: AssetAssignmentStatus;
  notes?: string;
}

export type AssetCondition = 'NEW' | 'GOOD' | 'FAIR' | 'DAMAGED';
export type AssetAssignmentStatus =
  | 'ASSIGNED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'LOST'
  | 'DAMAGED';
