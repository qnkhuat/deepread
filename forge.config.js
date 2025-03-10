const path = require('path');

module.exports = {
  packagerConfig: {
    appId: 'com.deepread.app',
    asar: true,
    executableName: 'DeepRead',
    extraResource: ['./backend/dist'],
    icon: path.resolve(__dirname, './frontend/public/icon/macos/icon'),
    ignore: [
      /^\/\.git/,
      /^\/\.github/,
      /^\/node_modules\/(?!portscanner|electron-squirrel-startup)/,
      /^\/frontend\/(?!dist|public)/,
      /^\/backend\/(?!dist)/,
      /^\/build\//,
      /^\/scripts\//,
      /^\/\.lsp\//,
      /^\/\.clj-kondo\//,
    ],
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'DeepRead',
        iconUrl: path.resolve(__dirname, './frontend/public/icon/win/icon.ico'),
        setupIcon: path.resolve(__dirname, './frontend/public/icon/win/icon.ico'),
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        name: 'DeepRead',
        icon: path.resolve(__dirname, './frontend/public/icon/macos/icon.icns'),
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: path.resolve(__dirname, './frontend/public/icon/png/1024x1024.png'),
          categories: ['Utility'],
        },
      },
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: process.env.GITHUB_REPOSITORY_OWNER || 'yourusername',
          name: 'DeepRead',
        },
        prerelease: false,
      },
    },
  ],
  hooks: {
    packageAfterCopy: async (config, buildPath, electronVersion, platform, arch) => {
      console.log(`Packaging for ${platform} ${arch} complete!`);
    },
    postMake: async (forgeConfig, results) => {
      console.log('Make complete!');
      return results;
    },
  },
}; 
