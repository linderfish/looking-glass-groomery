import type { Client, Pet, MembershipTier } from '@looking-glass/db';

/**
 * Format a client profile for Telegram display
 * @param client - Client with pets relation
 * @returns HTML formatted profile string
 */
export function formatClientProfile(client: Client & { pets: Pet[] }): string {
  const fullName = `${client.firstName} ${client.lastName}`;
  const petCount = client.pets.length;

  // Format membership tier display
  const tierDisplay = formatMembershipTier(client.membershipTier);

  // Build profile sections
  const sections: string[] = [];

  // Header with client name
  sections.push(`<b>${fullName}</b>\n`);

  // Contact info
  sections.push(`<code>${client.phone}</code>`);
  if (client.email) {
    sections.push(client.email);
  }

  // Membership
  sections.push(`Membership: ${tierDisplay}`);

  // Pets section
  sections.push(`\n<b>Pets (${petCount}):</b>`);
  if (petCount === 0) {
    sections.push('No pets yet');
  } else {
    client.pets.forEach((pet) => {
      const petIcon = getSpeciesIcon(pet.species);
      const breed = pet.breed || 'Mixed';
      sections.push(`${petIcon} ${pet.name} (${pet.species}, ${breed})`);
    });
  }

  return sections.join('\n');
}

/**
 * Format a list of clients for selection
 * @param clients - Array of clients with pets
 * @returns HTML formatted client list
 */
export function formatClientList(clients: (Client & { pets: Pet[] })[]): string {
  if (clients.length === 0) {
    return 'No clients found.';
  }

  const lines: string[] = [`Found ${clients.length} client(s):\n`];

  clients.forEach((client, index) => {
    const fullName = `${client.firstName} ${client.lastName}`;
    const petCount = client.pets.length;
    const petText = petCount === 1 ? '1 pet' : `${petCount} pets`;

    lines.push(`${index + 1}. <b>${fullName}</b> - ${petText}`);
  });

  lines.push('\nSelect a client to view their profile.');

  return lines.join('\n');
}

/**
 * Format membership tier for display
 */
function formatMembershipTier(tier: MembershipTier): string {
  const tierMap: Record<MembershipTier, string> = {
    NONE: 'None',
    CURIOUS: 'Curious 🎩',
    CURIOUSER: 'Curiouser 🎩🎩',
    ROYALTY: 'Royalty 👑',
  };

  return tierMap[tier] || tier;
}

/**
 * Get emoji icon for pet species
 */
function getSpeciesIcon(species: string): string {
  const iconMap: Record<string, string> = {
    DOG: '🐕',
    CAT: '🐈',
    GOAT: '🐐',
    PIG: '🐷',
    GUINEA_PIG: '🐹',
  };

  return iconMap[species] || '🐾';
}
