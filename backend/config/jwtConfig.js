import dotenv from 'dotenv';
dotenv.config();

export const getJwtSecret = () => {
  return process.env.JWT_SECRET || 'expirova_jwt_secret_default';
};
