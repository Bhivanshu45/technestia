export interface ProfileUser {
  id: number;
  name: string;
  username: string;
  email: string;
  image: string | null;
  bio: string | null;
  role: string;
  githubUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProfileUser {
  id: number;
  name: string;
  username: string;
  image: string | null;
  bio: string | null;
}

export interface PublicProfileUserWithPoints extends PublicProfileUser {
  achievementPoints: number;
}
