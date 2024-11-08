import { Role } from '@/app/spaces/[spaceid]/trustful/constants/constants';
import toast from 'react-hot-toast';
import { Address } from 'viem';

interface createSessionResponse {
  sessionId: number;
  name: string;
  hostAddress: Address;
  eventId: number;
  zucityId: number | null;
  createdAt: Date;
  updatedAt: Date;
  endAt: Date;
}

interface User {
  address: Address;
  role: Role;
}

interface createSessionRequest {
  user: User;
  name: string;
  hostAddress: Address;
  eventId: number;
  zucityId?: number | null;
}

export const createSession = async ({
  user,
  name,
  hostAddress,
  eventId,
  zucityId,
}: createSessionRequest): Promise<createSessionResponse | undefined> => {
  if (user.role !== Role.MANAGER && user.role !== Role.ROOT) {
    toast.error('User Address is not a manager or root');
    return;
  }

  console.log('user.address', user.address);
  console.log('name', name);
  console.log('hostAddress', hostAddress);
  console.log('eventId', eventId);
  console.log('zucityId', zucityId);
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_RAILWAY_TRUSTFUL}/sessions?userAddress=${user.address}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          hostAddress: hostAddress,
          eventId: Number(eventId),
          zucityId: Number(zucityId),
        } as createSessionRequest),
      },
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: createSessionResponse = await response.json();
    toast.success('Session created successfully!');

    return data;
  } catch (error) {
    console.error('Error creating session:', error);
    toast.error('An unexpected error occurred while creating the session.');
    throw new Error('Error creating session');
  }
};