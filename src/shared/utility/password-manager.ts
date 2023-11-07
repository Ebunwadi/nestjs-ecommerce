import * as argon from 'argon2';

export const generateHashPassword = async (password: string) => {
  return await argon.hash(password);
};

export const comparePassword = async (
  hashPassword: string,
  password: string,
) => {
  return await argon.verify(hashPassword, password);
};
