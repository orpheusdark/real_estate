import axios from 'axios';
export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
  withCredentials: true,
  timeout: 35000,
});
export function errorMessage(e: unknown) {
  return axios.isAxiosError(e)
    ? e.response?.data?.message || 'Could not reach EstateIQ. Please try again.'
    : e instanceof Error
      ? e.message
      : 'Something went wrong';
}
export type User = { id: string; name: string; email: string };
export type Image = { url: string; fileId: string };
export type Property = {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  location: string;
  address: string;
  type: string;
  purpose: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: Image[];
  createdAt: string;
};
export type Appointment = {
  id: string;
  propertyId: string;
  propertyTitle: string;
  ownerId: string;
  userId: string | null;
  name: string;
  email: string;
  phone: string;
  startsAt: string;
  status: 'pending' | 'confirmed' | 'cancelled';
};
export const money = (n: number) =>
  n >= 10000000
    ? '₹' + (n / 10000000).toLocaleString('en-IN', { maximumFractionDigits: 2 }) + ' Cr'
    : n >= 100000
      ? '₹' + (n / 100000).toLocaleString('en-IN', { maximumFractionDigits: 1 }) + ' L'
      : '₹' + n.toLocaleString('en-IN');
export const viewingTime = (v: string) =>
  new Date(v).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }) + ' IST';
