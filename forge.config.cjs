module.exports = {
  packagerConfig: {
    asar: true,
    icon: 'assets/worcco_logo',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'Orbit',
        authors: 'Worcco',
        description: 'Orbit Browser by Worcco',
        setupIcon: 'assets/worcco_logo.ico',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    },
  ],
};
