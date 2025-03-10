#!/usr/bin/env python3
"""
Build script for DeepRead application.
This script builds both the frontend and backend, and packages them together.
It can also build just the backend for the electron app.

Command line options:
  --backend-only: Skip building the frontend, but still include existing frontend build if available
"""

import os
import subprocess
import sys
import platform
import shutil
import importlib.util

def build_frontend():
    """Build the React frontend."""
    print("\n=== Building Frontend ===\n")

    # Get the root directory
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")

    if not os.path.exists(frontend_dir):
        print(f"Error: Frontend directory not found at {frontend_dir}")
        return None

    # On Windows, we need to use npm.cmd instead of npm
    npm_cmd = "npm.cmd" if platform.system() == "Windows" else "npm"
    
    # Run npm build
    try:
        subprocess.run([npm_cmd, "install"], cwd=frontend_dir, check=True)
        subprocess.run([npm_cmd, "run", "build"], cwd=frontend_dir, check=True)
        print("Frontend build successful!")
        return os.path.join(frontend_dir, "dist")
    except subprocess.CalledProcessError as e:
        print(f"Error building frontend: {e}")
        return None
    except FileNotFoundError:
        print(f"Error: {npm_cmd} not found. Make sure Node.js is installed and in your PATH.")
        return None

def build_backend(frontend_build_dir=None):
    """Build the Python backend into an executable using PyInstaller."""
    print("\n=== Building Backend ===\n")

    # Get the root directory
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")

    # Change to backend directory
    os.chdir(backend_dir)

    # Determine the appropriate executable name based on platform
    if platform.system() == "Windows":
        executable_name = "backend.exe"
    else:
        executable_name = "backend"

    # Clean previous build artifacts
    if os.path.exists("dist"):
        print("Cleaning previous build artifacts...")
        shutil.rmtree("dist")
    if os.path.exists("build"):
        shutil.rmtree("build")
    if os.path.exists(f"{executable_name}.spec"):
        os.remove(f"{executable_name}.spec")

    # PyInstaller command
    cmd = [
        "pyinstaller",
        "--onefile",
        "--name", executable_name,
        "--hidden-import", "openai",
    ]

    # If including frontend, add it to PyInstaller command
    if frontend_build_dir:
        # Format depends on platform
        if platform.system() == "Windows":
            add_data_arg = f"{frontend_build_dir};frontend"
        else:
            add_data_arg = f"{frontend_build_dir}:frontend"
        cmd.extend(["--add-data", add_data_arg])

    cmd.append("main.py")

    # Run PyInstaller
    try:
        subprocess.run(cmd, check=True)
        print(f"Successfully built executable: {executable_name}")

        # On macOS, ensure the executable has proper permissions
        if platform.system() == "Darwin":
            executable_path = os.path.join("dist", executable_name)
            os.chmod(executable_path, 0o755)
            print(f"Set executable permissions for {executable_path}")

            # Verify the executable works
            try:
                result = subprocess.run([executable_path, "--version"],
                                       capture_output=True,
                                       text=True,
                                       timeout=5)
                if result.returncode != 0:
                    print(f"Warning: Executable test failed with code {result.returncode}")
                    print(f"Output: {result.stdout}")
                    print(f"Error: {result.stderr}")
                else:
                    print("Executable test successful")
            except subprocess.TimeoutExpired:
                print("Executable test timed out, but this might be normal for a server process")
            except Exception as e:
                print(f"Warning: Failed to test executable: {e}")

        # If frontend was included, log that information
        if frontend_build_dir:
            print(f"Frontend files from {frontend_build_dir} included in the executable bundle")

        # Change back to root directory
        os.chdir(root_dir)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error building executable: {e}")
        # Change back to root directory
        os.chdir(root_dir)
        return False

def get_executable_path():
    """Get the path to the built executable."""
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")

    if platform.system() == "Windows":
        executable_name = "backend.exe"
    else:
        executable_name = "backend"

    return os.path.join(backend_dir, "dist", executable_name)

def main():
    """Main build function."""
    print("Building DeepRead application...")

    # Parse command line arguments
    backend_only = "--backend-only" in sys.argv

    # Build frontend if not skipped
    frontend_build_dir = None
    if not backend_only:
        frontend_build_dir = build_frontend()
        if not frontend_build_dir:
            print("Error: Frontend build failed. Cannot continue with backend build.")
            return False
    # Build backend with frontend if available
    backend_success = build_backend(frontend_build_dir=frontend_build_dir)
    if not backend_success:
        print("Error: Backend build failed.")
        return False

    # Get the executable path
    executable_path = get_executable_path()

    print("\n=== Build Complete ===")
    print(f"The application has been built successfully!")
    print(f"Executable location: {executable_path}")
    print("\nTo run the application:")
    print(f"  {executable_path}")

    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
