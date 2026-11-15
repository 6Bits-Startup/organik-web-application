/**
 * Request body of `POST /profiles`.
 */
export interface CreateProfileRequest {
  userId: number;
  fullName: string;
  email: string;
  minimarketId: string | null;
  supplierId: string | null;
}
