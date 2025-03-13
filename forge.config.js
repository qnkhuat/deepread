const path = require('path');
const fs = require('fs');

module.exports = {
  packagerConfig: {
    appId: 'com.deepread.app',
    asar: true,
    executableName: 'DeepRead',
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
      
      // Exclude other non-essential directories and backend
      return /^\/\.git|^\/\.github|^\/frontend\/(?!dist|public)|^\/backend\/|^\/build\/|^\/scripts\/|^\/\.lsp\/|^\/\.clj-kondo\//.test(path);
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
      
      // Ensure frontend files are correctly placed
      const frontendDistPath = path.join(__dirname, 'frontend', 'dist');
      const destFrontendPath = path.join(buildPath, 'frontend', 'dist');
      
      if (fs.existsSync(frontendDistPath)) {
        // Create the destination directory if it doesn't exist
        if (!fs.existsSync(path.dirname(destFrontendPath))) {
          fs.mkdirSync(path.dirname(destFrontendPath), { recursive: true });
        }
        
        // Copy the frontend dist directory
        fs.cpSync(frontendDistPath, destFrontendPath, { recursive: true });
        console.log(`Copied frontend files to ${destFrontendPath}`);
      } else {
        console.error('Frontend dist directory not found! Did you build the frontend first?');
      }
    },
    postMake: async (forgeConfig, results) => {
      console.log('Make complete!');
      return results;
    },
  },
}; 
