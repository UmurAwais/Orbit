module.exports = {
  packagerConfig: {
    asar: true,
    name: 'Orbit',
    executableName: 'Orbit',
    icon: 'assets/orbit',
    appCopyright: 'Copyright © 2026 Worcco',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'Orbit',
        authors: 'Worcco',
        description: 'Orbit Browser by Worcco',
        setupExe: 'OrbitSetup.exe',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['win32'],
    },
  ],
};
