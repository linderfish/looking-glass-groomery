// apps/web/src/data/gallery.ts
// Gallery Configuration - Add photos here!
//
// HOW TO ADD A NEW PHOTO:
// 1. Add your photo to: public/gallery/ (e.g., public/gallery/fluffy-poodle.jpg)
// 2. Add an entry below with the filename and details
// 3. For before/after, add two photos and set beforeAfter: true

export interface GalleryPhoto {
  id: string
  filename: string           // Just the filename, e.g., "fluffy-poodle.jpg"
  title: string              // Pet's name or description
  category: GalleryCategory
  beforeAfter: boolean       // Is this a before/after comparison?
  beforeFilename?: string    // Optional "before" photo filename
  petType?: 'dog' | 'cat' | 'other'
  breed?: string             // Optional breed info
}

export type GalleryCategory =
  | 'creative'   // Creative color work
  | 'teddy'      // Teddy bear cuts
  | 'asian'      // Asian fusion styles
  | 'lion'       // Lion cuts
  | 'breed'      // Breed-standard cuts
  | 'cats'       // Cat grooming
  | 'other'      // Other pets (goats, pigs, etc.)

export const categories = [
  { id: 'all', name: 'All', icon: '✨' },
  { id: 'creative', name: 'Creative Color', icon: '🎨' },
  { id: 'teddy', name: 'Teddy Bear', icon: '🧸' },
  { id: 'asian', name: 'Asian Fusion', icon: '🌸' },
  { id: 'lion', name: 'Lion Cut', icon: '🦁' },
  { id: 'breed', name: 'Breed Standard', icon: '🏆' },
  { id: 'cats', name: 'Cats', icon: '🐱' },
  { id: 'other', name: 'Exotic Pets', icon: '🐾' },
] as const

// ==========================================
// ADD YOUR PHOTOS HERE!
// ==========================================
export const galleryPhotos: GalleryPhoto[] = [
  // Example entries - replace with real photos!
  // {
  //   id: 'fluffy-001',
  //   filename: 'fluffy-poodle-after.jpg',
  //   title: 'Fluffy the Poodle',
  //   category: 'creative',
  //   beforeAfter: true,
  //   beforeFilename: 'fluffy-poodle-before.jpg',
  //   petType: 'dog',
  //   breed: 'Standard Poodle',
  // },

  // PLACEHOLDER ENTRIES (remove these when adding real photos)
  {
    id: 'placeholder-1',
    filename: '',  // No file yet
    title: 'Rainbow Poodle',
    category: 'creative',
    beforeAfter: true,
    petType: 'dog',
    breed: 'Poodle',
  },
  {
    id: 'placeholder-2',
    filename: '',
    title: 'Teddy Bear Bichon',
    category: 'teddy',
    beforeAfter: true,
    petType: 'dog',
    breed: 'Bichon Frise',
  },
  {
    id: 'placeholder-3',
    filename: '',
    title: 'Korean Style Maltese',
    category: 'asian',
    beforeAfter: false,
    petType: 'dog',
    breed: 'Maltese',
  },
  {
    id: 'placeholder-4',
    filename: '',
    title: 'Pink Ears Yorkie',
    category: 'creative',
    beforeAfter: true,
    petType: 'dog',
    breed: 'Yorkshire Terrier',
  },
  {
    id: 'placeholder-5',
    filename: '',
    title: 'Lion Cut Pom',
    category: 'lion',
    beforeAfter: false,
    petType: 'dog',
    breed: 'Pomeranian',
  },
  {
    id: 'placeholder-6',
    filename: '',
    title: 'Show Cut Shih Tzu',
    category: 'breed',
    beforeAfter: true,
    petType: 'dog',
    breed: 'Shih Tzu',
  },
  {
    id: 'placeholder-7',
    filename: '',
    title: 'Fluffy Goldendoodle',
    category: 'teddy',
    beforeAfter: false,
    petType: 'dog',
    breed: 'Goldendoodle',
  },
  {
    id: 'placeholder-8',
    filename: '',
    title: 'Japanese Style Poodle',
    category: 'asian',
    beforeAfter: true,
    petType: 'dog',
    breed: 'Toy Poodle',
  },
]

// Helper to get photo URL
export function getPhotoUrl(filename: string): string {
  if (!filename) return ''  // No photo yet
  return `/gallery/${filename}`
}
