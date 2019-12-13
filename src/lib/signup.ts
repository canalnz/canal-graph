import {getUserRepo, getWorkspaceRepo, User} from '@canalapp/shared/dist/db';

export interface CreateUserData {
  name: string;
  email: string;
  avatarHash: string | null;
}

/*
* We need to know:
*  - name
*  - email
*  - authentication info
*  - a way to grab an avatar
*
* */
export async function createNewUser({
  name, email, avatarHash
                              }: CreateUserData): Promise<User> {
  const user = await getUserRepo().createAndSave({
    name, email, avatarHash, verified: false
  });

  await getWorkspaceRepo().createAndSave({
    name: 'Personal Workspace',
    user,
    personal: true
  });

  return user;
}
