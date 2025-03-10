const path = require('path');
const fs = require('fs');

module.exports = {
  packagerConfig: {
    appId: 'com.deepread.app',
    asar: true,
    executableName: 'DeepRead',
    extraResource: ['./backend/dist'],
    icon: path.resolve(__dirname, './frontend/public/icon/macos/icon'),
    ignore: (path) => {
      // Include all production dependencies
      if (path.includes('node_modules')) {
        // Only include production dependencies
        if (!path.includes('node_modules/.bin') && 
            !path.includes('node_modules/electron-prebuilt') && 
            !path.includes('node_modules/electron-prebuilt-compile')) {
          return false;
        }
        return true;
      }
      
      // Exclude other non-essential directories
      return /^\/\.git|^\/\.github|^\/frontend\/(?!dist|public)|^\/backend\/(?!dist)|^\/build\/|^\/scripts\/|^\/\.lsp\/|^\/\.clj-kondo\//.test(path);
    },
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
      
      // Create a backend directory in the resources folder if it doesn't exist
      const resourcesPath = path.join(buildPath, 'resources');
      const backendPath = path.join(resourcesPath, 'backend');
      
      if (!fs.existsSync(backendPath)) {
        fs.mkdirSync(backendPath, { recursive: true });
      }
      
      // Ensure backend binary is correctly placed
      const srcBackendDist = path.join(__dirname, 'backend', 'dist');
      
      if (fs.existsSync(srcBackendDist)) {
        // Copy the backend binary and ensure it's at the right location
        if (platform === 'darwin' || platform === 'linux') {
          const backendBin = path.join(srcBackendDist, 'backend');
          const destBin = path.join(backendPath, 'backend');
          if (fs.existsSync(backendBin)) {
            fs.copyFileSync(backendBin, destBin);
            fs.chmodSync(destBin, '755'); // Ensure executable permissions
          }
        } else if (platform === 'win32') {
          const backendBin = path.join(srcBackendDist, 'backend.exe');
          const destBin = path.join(backendPath, 'backend.exe');
          if (fs.existsSync(backendBin)) {
            fs.copyFileSync(backendBin, destBin);
          }
        }
      } else {
        console.error('Backend dist directory not found! Did you build the backend first?');
      }
    },
    postMake: async (forgeConfig, results) => {
      console.log('Make complete!');
      return results;
    },
  },
}; 
