import type { Access } from 'payload'

export const isAdminOrReviewer: Access = ({ req }) =>
  req.user?.role === 'admin' || req.user?.role === 'reviewer'
