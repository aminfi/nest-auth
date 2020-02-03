export interface UserData {
  username: string;
  email: string;
  token: string;
}

export interface UserRO {
  data: {
    user: UserData;
    message: string;
  };
}
