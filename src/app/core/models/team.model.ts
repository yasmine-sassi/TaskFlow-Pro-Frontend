export interface TeamMember {
  userId: string;
  role: string;
  joinedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  createdAt: Date;
  ownerId: string;
}
