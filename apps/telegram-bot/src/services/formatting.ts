import type { Client, Pet, MembershipTier, PetPassport } from '@looking-glass/db';

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

/**
 * Calculate age from birthdate
 * @param birthDate - Pet's birth date
 * @returns Human-readable age string
 */
export function calculateAge(birthDate: Date | null): string {
  if (!birthDate) return 'Unknown';

  const now = new Date();
  const diffMs = now.getTime() - birthDate.getTime();
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));

  if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths === 1 ? '' : 's'}`;
  }

  const years = Math.floor(diffMonths / 12);
  return `${years} year${years === 1 ? '' : 's'}`;
}

/**
 * Format spicy meter based on temperament
 * @param temperament - Pet's temperament level
 * @returns Spicy meter string with peppers
 */
export function formatSpicyMeter(temperament: string): string {
  const spicyMap: Record<string, string> = {
    NORMAL: '',
    PUPPY: '',
    SENIOR: '',
    SERVICE_ANIMAL: '',
    NURSING: '(nursing mom)',
    ANXIOUS: '🌶 1/3 spicy',
    FEARFUL: '🌶🌶 2/3 spicy',
    AGGRESSIVE: '🌶🌶🌶 3/3 SPICY',
  };

  return spicyMap[temperament] || '';
}

/**
 * Format a complete pet profile for Telegram display
 * @param pet - Pet with passport and client relations
 * @returns HTML formatted pet profile
 */
export function formatPetProfile(
  pet: Pet & {
    passport?: { allergies?: string | null; specialInstructions?: string | null; } | null;
    client: Client;
  }
): string {
  const petIcon = getSpeciesIcon(pet.species);
  const sections: string[] = [];

  // Header with pet name
  sections.push(`<b>${petIcon} ${pet.name}</b>`);
  sections.push(`Owner: ${pet.client.firstName} ${pet.client.lastName}\n`);

  // Basic demographics
  sections.push(`Species: ${pet.species}`);
  sections.push(`Breed: ${pet.breed || 'Mixed'}`);
  sections.push(`Age: ${calculateAge(pet.birthDate)}`);

  const sexDisplay = pet.sex ? pet.sex.charAt(0) + pet.sex.slice(1).toLowerCase() : 'Unknown';
  sections.push(`Sex: ${sexDisplay}`);
  sections.push(`Fixed: ${pet.isFixed ? 'Yes' : 'No'}`);

  // Spicy meter (if applicable)
  const spicyMeter = formatSpicyMeter(pet.temperament);
  if (spicyMeter) {
    sections.push(`\n<b>⚠️ ${spicyMeter}</b>`);
  }

  // Passport information
  if (pet.passport) {
    sections.push('\n<b>Preferences:</b>');
    sections.push(pet.passport.specialInstructions || 'None noted');

    sections.push('\n<b>Allergies:</b>');
    sections.push(pet.passport.allergies || 'None noted');
  }

  // Behavior notes (if any)
  if (pet.behaviorNotes) {
    sections.push('\n<b>Behavior Notes:</b>');
    sections.push(pet.behaviorNotes);
  }

  return sections.join('\n');
}
