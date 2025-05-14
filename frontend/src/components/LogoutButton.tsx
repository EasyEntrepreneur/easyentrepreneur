'use client';

import { signOut } from 'next-auth/react';
import { FaSignOutAlt } from 'react-icons/fa';

interface Props {
  className?: string;
}

export default function LogoutButton({ className }: Props) {
  return (
    <button onClick={() => signOut()} className={className}>
      <FaSignOutAlt /> Se déconnecter
    </button>
  );
}
