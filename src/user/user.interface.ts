export interface UserData {
  username: string;
  token: string;
}

export interface UserRO {
  data: {
    user: UserData;
    message: string;
  };
}
