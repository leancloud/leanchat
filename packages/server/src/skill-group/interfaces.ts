export interface CreateSkillGroupData {
  name: string;
  memberIds?: string[];
}

export interface UpdateSkillGroupData {
  name?: string;
  memberIds?: string[];
}
