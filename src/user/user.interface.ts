export interface UserData {
  username: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export interface UserRO {
  data: {
    user: UserData;
    message: string;
  };
}
