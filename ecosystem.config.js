module.exports = {
  apps: [
    {
      name: 'neelsolutions-api',
      script: 'npm',
      args: 'start --workspace=api',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      }
    },
    {
      name: 'neelsolutions-web',
      script: 'npm',
      args: 'start --workspace=web',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      }
    }
  ]
};
