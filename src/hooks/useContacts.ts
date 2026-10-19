import { useEffect, useState } from 'react';
import { fetchContacts, Contact } from '../services/api/contacts';

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetchContacts()
      .then(setContacts)
      .finally(() => setLoading(false));
  }, []);

  return { contacts, loading };
}