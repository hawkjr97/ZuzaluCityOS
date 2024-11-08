import { Role } from '@/app/spaces/[spaceid]/trustful/constants/constants';
import { Address } from 'viem';

interface UserRoleResponse {
  role: Role;
}

export const getUserRole = async (
  userAddress: Address,
): Promise<UserRoleResponse | undefined> => {
  console.log('userAddress', userAddress);
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_RAILWAY_TRUSTFUL}/users/role?userAddress=${userAddress}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    console.log('response GetUserRole', response);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: UserRoleResponse = await response.json();
    console.log('data', data);
    return data;
  } catch (error) {
    console.error('Error fetching getUserRole:', error);
    throw new Error('Error fetching getUserRole');
  }
};