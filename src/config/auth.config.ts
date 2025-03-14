const config = {
  jwt: {
    secret: 'your_jwt_secret_should_be_in_env_file',
    expiresIn: '3h',
  },
  bcrypt: {
    saltRounds: 10,
  }
};

export default config;